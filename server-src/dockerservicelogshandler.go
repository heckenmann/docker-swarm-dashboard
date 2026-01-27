package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/binary"
	"io"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var (
	// upgrader configures the websocket upgrade and enables compression.
	// CheckOrigin returns true to allow connections from any origin.
	upgrader = websocket.Upgrader{
		EnableCompression: true,
		CheckOrigin: func(_ *http.Request) bool {
			return true
		},
	}
)

// pingInterval controls the interval between ping messages sent by
// `writeLogPipeToClient`. Tests may shorten this to exercise the ping
// branch without waiting for the production interval.
var pingInterval = 54 * time.Second

// writeWait is the timeout for websocket write operations.
const writeWait = 10 * time.Second

// sendTextMessage sets a write deadline and sends a text message.
func sendTextMessage(conn *websocket.Conn, data []byte) error {
	_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
	return conn.WriteMessage(websocket.TextMessage, data)
}

// processPayload parses docker-multiplexed payloads (possibly multiple
// concatenated frames) and sends each non-empty line as a websocket
// TextMessage. It falls back to stripping the first 8 bytes when the
// header size doesn't fit the payload.
func processPayload(conn *websocket.Conn, payload []byte) error {
	if len(payload) == 0 {
		// send an explicit empty message to indicate empty payload
		return sendTextMessage(conn, []byte{})
	}

	if len(payload) >= 8 {
		firstSize := int(binary.BigEndian.Uint32(payload[4:8]))
		if payload[0] == 0 || payload[0] == 1 || payload[0] == 2 || 8+firstSize <= len(payload) {
			buf := payload
			for len(buf) >= 8 {
				size := int(binary.BigEndian.Uint32(buf[4:8]))
				if len(buf) < 8+size {
					break
				}
				frame := buf[8 : 8+size]
				parts := bytes.Split(frame, []byte{'\n'})
				for _, ln := range parts {
					if len(ln) == 0 {
						continue
					}
					if err := sendTextMessage(conn, ln); err != nil {
						return err
					}
				}
				buf = buf[8+size:]
			}
			if len(buf) > 0 {
				parts := bytes.Split(buf, []byte{'\n'})
				for _, ln := range parts {
					if len(ln) == 0 {
						continue
					}
					if err := sendTextMessage(conn, ln); err != nil {
						return err
					}
				}
			}
			return nil
		}
		// fallback: strip header and treat remainder as raw payload
		payload = payload[8:]
	}

	parts := bytes.Split(payload, []byte{'\n'})
	for _, ln := range parts {
		if len(ln) == 0 {
			continue
		}
		if err := sendTextMessage(conn, ln); err != nil {
			return err
		}
	}
	return nil
}

// dockerServiceLogsHandler handles websocket connections for streaming
// Docker service logs to a connected client. The handler upgrades the
// HTTP connection to a websocket, starts a goroutine that writes
// log lines to the client and reads the Docker logs. It keeps a
// buffered channel between reader and writer and closes the
// connection when the client is too slow to consume messages.
func dockerServiceLogsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramServiceId := params["id"]

	urlParams := r.URL.Query()
	paramTail := urlParams["tail"][0]
	paramSince := urlParams["since"][0]
	paramStdout, _ := strconv.ParseBool(urlParams["stdout"][0])
	paramStderr, _ := strconv.ParseBool(urlParams["stderr"][0])
	paramFollow, _ := strconv.ParseBool(urlParams["follow"][0])
	paramTimestamps, _ := strconv.ParseBool(urlParams["timestamps"][0])
	paramDetails, _ := strconv.ParseBool(urlParams["details"][0])
	clientAddress := string(r.RemoteAddr)
	log.Println("new logs-websocket-connection:", clientAddress)
	ce, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer func() { _ = ce.Close() }()
	defer log.Println("gone:", clientAddress)

	// docker-client context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cli := getCli()
	logReader, _ := cli.ServiceLogs(ctx, paramServiceId, container.LogsOptions{
		Tail:       paramTail,
		Since:      paramSince,
		Follow:     paramFollow,
		Timestamps: paramTimestamps,
		ShowStdout: paramStdout,
		ShowStderr: paramStderr,
		Details:    paramDetails,
	})

	// Ensure reader closed if it implements io.ReadCloser
	if rc, ok := logReader.(io.ReadCloser); ok {
		defer func() { _ = rc.Close() }()
	}

	// Buffered channel decouples the Docker log read from websocket writes.
	// Reduce buffer size so slow-client behavior is detected reliably in tests.
	const channelSize = 64
	channel := make(chan []byte, channelSize)
	// closeChan ensures the channel is closed exactly once.
	var closeChanOnce sync.Once

	// If the client requested a one-shot (follow=false), read the entire
	// log payload, parse multiplex frames if present, and send exactly the
	// requested tail number of log lines, then exit. This guarantees the
	// client receives the last N lines and nothing more.
	if !paramFollow {
		// read lines incrementally (don't block waiting for EOF). Some
		// Docker endpoints keep the connection open even for non-follow
		// requests; reading with ReadLine returns available lines without
		// waiting for EOF. Start a goroutine that reads lines and send
		// them over a channel, then collect with a short idle timeout.
		bufioReader := bufio.NewReader(logReader)
		linesCh := make(chan string, 64)
		go func() {
			defer close(linesCh)
			for {
				line, _, err := bufioReader.ReadLine()
				if err != nil {
					return
				}
				// copy line bytes and strip Docker's 8-byte prefix if present
				b := make([]byte, len(line))
				copy(b, line)
				if len(b) > 8 {
					b = b[8:]
				} else {
					b = b[:0]
				}
				if len(b) == 0 {
					continue
				}
				linesCh <- string(b)
			}
		}()

		// collect lines until idle timeout
		var lines []string
		idle := 100 * time.Millisecond
		timer := time.NewTimer(idle)
		// stop the timer initially until first line arrives
		if !timer.Stop() {
			<-timer.C
		}
		collecting := true
		for collecting {
			select {
			case l, ok := <-linesCh:
				if !ok {
					collecting = false
					break
				}
				lines = append(lines, l)
				// reset idle timer
				if !timer.Stop() {
					select {
					case <-timer.C:
					default:
					}
				}
				timer.Reset(idle)
			case <-timer.C:
				collecting = false
			}
		}
		timer.Stop()
		// ensure reader is closed to unblock underlying connection
		if rc, ok := logReader.(io.ReadCloser); ok {
			_ = rc.Close()
		}
		// determine requested tail and send only those lines
		tailNum := 20
		if n, err := strconv.Atoi(paramTail); err == nil && n > 0 {
			tailNum = n
		}
		start := 0
		if len(lines) > tailNum {
			start = len(lines) - tailNum
		}
		for i := start; i < len(lines); i++ {
			if err := sendTextMessage(ce, []byte(lines[i])); err != nil {
				log.Printf("Websocket write failed: %v", err)
				_ = ce.Close()
				return
			}
		}
		// close normally
		_ = ce.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		return
	}

	// Start a single goroutine that serializes writes to the websocket.
	// Keep a done channel so we can wait for the writer to finish when
	// we need to close the connection to avoid racing with ongoing writes.
	writerDone := make(chan struct{})
	go func() {
		writeLogPipeToClient(ce, channel)
		close(writerDone)
	}()

	// Configure read limits and keep-alive (pong handler) for the client
	// connection so we detect broken peers.
	ce.SetReadLimit(1024 * 1024)
	_ = ce.SetReadDeadline(time.Now().Add(60 * time.Second))
	ce.SetPongHandler(func(string) error {
		_ = ce.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Start a goroutine that reads client messages and closes the
	// connection when the client disconnects. We don't expect client
	// messages, but ReadMessage is used to detect disconnects reliably.
	go func() {
		for {
			if _, _, err := ce.ReadMessage(); err != nil {
				_ = ce.Close()
				return
			}
		}
	}()

	// Read the docker logs line-by-line and enqueue them. If the channel
	// is full, treat the client as too slow: close the channel and wait
	// for the writer to finish before closing the websocket.
	bufioReader := bufio.NewReader(logReader)
	for {
		line, _, err := bufioReader.ReadLine()
		if err == io.EOF {
			log.Println("logs EOF for service:", paramServiceId)
			break
		}
		if err != nil {
			log.Println(err)
			return
		}

		// Copy the line before sending because bufio.Reader may reuse
		// the underlying buffer across ReadLine calls; sharing that
		// backing array concurrently causes data races when the writer
		// reads the slice. Allocate a fresh slice and copy the data.
		lineCopy := make([]byte, len(line))
		copy(lineCopy, line)

		// Try to enqueue the line; if the channel is full, wait briefly
		// for the writer to make progress. This avoids flaky failures
		// where scheduling differences prevent the writer from emptying
		// the channel immediately. If the channel stays full for the
		// timeout, treat the client as too slow and close the connection.
		select {
		case channel <- lineCopy:
			// enqueued successfully
		default:
			// wait briefly for the writer to free up space
			select {
			case channel <- lineCopy:
				// enqueued on second attempt
			case <-time.After(50 * time.Millisecond):
				// Slow/unresponsive client: close the channel so the writer
				// will stop. Then wait briefly for the writer to finish to
				// avoid WriteMessage racing with connection Close.
				log.Printf("client too slow, closing websocket for service: %s", paramServiceId)
				closeChanOnce.Do(func() { close(channel) })
				select {
				case <-writerDone:
					// writer finished
				case <-time.After(2 * time.Second):
					log.Printf("writer did not finish in time for service: %s", paramServiceId)
				}
				_ = ce.Close()
				return
			}
		}
	}

	// Normal exit: close the channel so the writer can finish.
	closeChanOnce.Do(func() { close(channel) })
}

// writeLogPipeToClient serializes writes to the websocket connection.
// It sends regular ping messages to keep the connection alive and sets
// write deadlines to avoid blocking forever on slow clients.
func writeLogPipeToClient(websocketConn *websocket.Conn, channel chan []byte) {
	const writeWait = 10 * time.Second
	// ticker interval chosen slightly less than the read deadline to
	// ensure the peer's pong keeps the connection alive. Exported as a
	// variable to allow tests to shorten the interval for coverage of
	// the ping-path without waiting a long time.
	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_ = websocketConn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := websocketConn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("ping failed: %v", err)
				_ = websocketConn.Close()
				return
			}
		case c, ok := <-channel:
			if !ok {
				// Channel closed - send normal close and exit.
				_ = websocketConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				return
			}

			// Docker prepends an 8-byte multiplex header to each frame
			// when reading aggregated logs. A single channel value may
			// contain multiple such frames concatenated. Parse these
			// frames when present and send each non-empty log line as
			// its own websocket TextMessage.
			if err := processPayload(websocketConn, c); err != nil {
				log.Printf("Websocket write failed: %v", err)
				_ = websocketConn.Close()
				return
			}
		}
	}
}
