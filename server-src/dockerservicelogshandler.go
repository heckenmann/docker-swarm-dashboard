package main

import (
	"bufio"
	"context"
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
	defer ce.Close()
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
		defer rc.Close()
	}

	// Buffered channel decouples the Docker log read from websocket writes.
	// Reduce buffer size so slow-client behavior is detected reliably in tests.
	const channelSize = 64
	channel := make(chan []byte, channelSize)
	// closeChan ensures the channel is closed exactly once.
	var closeChanOnce sync.Once

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
	ce.SetReadDeadline(time.Now().Add(60 * time.Second))
	ce.SetPongHandler(func(string) error {
		ce.SetReadDeadline(time.Now().Add(60 * time.Second))
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

		select {
		case channel <- line:
		default:
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

	// Normal exit: close the channel so the writer can finish.
	closeChanOnce.Do(func() { close(channel) })
}

// writeLogPipeToClient serializes writes to the websocket connection.
// It sends regular ping messages to keep the connection alive and sets
// write deadlines to avoid blocking forever on slow clients.
func writeLogPipeToClient(websocketConn *websocket.Conn, channel chan []byte) {
	const writeWait = 10 * time.Second

	// ticker interval chosen slightly less than the read deadline to
	// ensure the peer's pong keeps the connection alive.
	ticker := time.NewTicker(54 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			websocketConn.SetWriteDeadline(time.Now().Add(writeWait))
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
			// when reading aggregated logs. Strip this header if present.
			payload := c
			if len(payload) > 8 {
				payload = payload[8:]
			} else {
				payload = []byte{}
			}

			// Write the text message with a deadline to avoid blocking
			// indefinitely on slow or disconnected clients.
			websocketConn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := websocketConn.WriteMessage(websocket.TextMessage, payload); err != nil {
				log.Printf("Websocket write failed: %v", err)
				_ = websocketConn.Close()
				return
			}
		}
	}
}
