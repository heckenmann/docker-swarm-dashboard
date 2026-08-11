package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/binary"
	"io"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var (
	// upgrader configures the websocket upgrade and enables compression.
	upgrader = websocket.Upgrader{
		EnableCompression: true,
		CheckOrigin:       isWebSocketOriginAllowed,
	}
)

// pingInterval controls the interval between ping messages sent by
// `writeLogPipeToClient`. Tests may shorten this to exercise the ping
// branch without waiting for the production interval.
var pingInterval = 54 * time.Second

// writeWait is the timeout for websocket write operations.
const writeWait = 10 * time.Second

// pongWait is how long the client may stay silent before its connection is
// considered dead. It must be longer than pingInterval.
const pongWait = 60 * time.Second

// logChannelSize bounds how many log lines may wait for a slow client. A full
// channel applies backpressure on the docker reader instead of buffering
// without limit.
const logChannelSize = 64

// tailCollectIdle is how long the one-shot reader waits for another line
// before considering the log output complete. Docker keeps the response open
// for some non-follow requests, so waiting for EOF alone would block.
const tailCollectIdle = 100 * time.Millisecond

// defaultTail is used when the client requests an unparsable number of lines.
const defaultTail = 20

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

// logsOptions holds the parameters of a logs websocket request.
type logsOptions struct {
	serviceID  string
	tail       string
	since      string
	follow     bool
	timestamps bool
	stdout     bool
	stderr     bool
	details    bool
}

// dayDurationPattern matches a relative duration expressed in days, e.g. "2d".
var dayDurationPattern = regexp.MustCompile(`^(\d+)d$`)

// normalizeSince rewrites a relative `since` value into a unit the Docker
// client understands. It resolves relative values with `time.ParseDuration`,
// which supports "s", "m" and "h" but *not* days: a request for "2d" would
// fail outright and the client would receive no logs at all. Days are
// therefore expanded into hours. Absolute timestamps are passed through
// untouched.
func normalizeSince(since string) string {
	if match := dayDurationPattern.FindStringSubmatch(strings.TrimSpace(since)); match != nil {
		if days, err := strconv.Atoi(match[1]); err == nil {
			return strconv.Itoa(days*24) + "h"
		}
	}
	return since
}

// parseLogsOptions extracts the log parameters from the request. Absent or
// unparsable parameters fall back to defaults rather than failing the request.
func parseLogsOptions(r *http.Request) logsOptions {
	query := r.URL.Query()
	boolParam := func(key string) bool {
		value, _ := strconv.ParseBool(query.Get(key))
		return value
	}
	tail := query.Get("tail")
	if tail == "" {
		tail = "all"
	}
	return logsOptions{
		serviceID:  mux.Vars(r)["id"],
		tail:       tail,
		since:      normalizeSince(query.Get("since")),
		follow:     boolParam("follow"),
		timestamps: boolParam("timestamps"),
		stdout:     boolParam("stdout"),
		stderr:     boolParam("stderr"),
		details:    boolParam("details"),
	}
}

// tailCount returns the number of lines a one-shot request asked for.
func tailCount(tail string) int {
	if n, err := strconv.Atoi(tail); err == nil && n > 0 {
		return n
	}
	return defaultTail
}

// stripFramePrefix removes Docker's 8-byte multiplex header from a single log
// line. It returns nil when the line carries no payload.
func stripFramePrefix(line []byte) []byte {
	if len(line) <= 8 {
		return nil
	}
	return append([]byte(nil), line[8:]...)
}

// dockerServiceLogsHandler streams the logs of a Docker service over a
// websocket.
//
// A single context governs the whole request: it is cancelled when the handler
// returns or when the client disconnects, which closes the Docker log reader
// and unblocks every goroutine started here. Log lines travel over one
// channel, owned and closed by the reader, so no extra synchronisation is
// needed between the reader and the writer.
func dockerServiceLogsHandler(w http.ResponseWriter, r *http.Request) {
	opts := parseLogsOptions(r)

	clientAddress := r.RemoteAddr
	log.Println("new logs-websocket-connection:", clientAddress)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer func() { _ = conn.Close() }()
	defer log.Println("gone:", clientAddress)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cli, err := getCli()
	if err != nil {
		log.Printf("dockerServiceLogsHandler: getCli error: %v", err)
		closeWithError(conn, "Docker client error")
		return
	}

	logReader, err := cli.ServiceLogs(ctx, opts.serviceID, container.LogsOptions{
		Tail:       opts.tail,
		Since:      opts.since,
		Follow:     opts.follow,
		Timestamps: opts.timestamps,
		ShowStdout: opts.stdout,
		ShowStderr: opts.stderr,
		Details:    opts.details,
	})
	if err != nil {
		// Report the reason to the client: an unusable option (an invalid
		// `since` for instance) would otherwise look like a service with no
		// logs at all.
		log.Printf("dockerServiceLogsHandler: ServiceLogs error: %v", err)
		closeWithError(conn, "Docker logs error: "+err.Error())
		return
	}
	if logReader == nil {
		log.Printf("dockerServiceLogsHandler: no log stream for service %s", opts.serviceID)
		closeWithError(conn, "Docker returned no log stream")
		return
	}
	defer func() { _ = logReader.Close() }()

	// Closing the reader is the only way to unblock a pending read, so tie it
	// to the context: cancelling stops the reader goroutine for good.
	go func() {
		<-ctx.Done()
		_ = logReader.Close()
	}()

	// The client is not expected to send anything; reading detects a
	// disconnect. Closing the connection makes any pending write fail, which
	// stops the streaming loop below.
	go func() {
		defer cancel()
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				_ = conn.Close()
				return
			}
		}
	}()

	if opts.follow {
		streamLogs(ctx, conn, logReader)
		return
	}
	sendLogTail(ctx, conn, logReader, tailCount(opts.tail))
}

// closeWithError closes the websocket with an internal-error close frame
// carrying a human readable reason.
func closeWithError(conn *websocket.Conn, reason string) {
	// Close reasons are capped at 123 bytes by the websocket protocol; drop a
	// rune left incomplete by the cut so the frame stays valid UTF-8.
	if len(reason) > 123 {
		reason = strings.ToValidUTF8(reason[:123], "")
	}
	_ = conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseInternalServerErr, reason))
}

// readLogLines reads the Docker log stream line by line and forwards each line
// to `lines`. It owns the channel and closes it when the stream ends, the
// context is cancelled or reading fails.
func readLogLines(ctx context.Context, logReader io.Reader, lines chan<- []byte) {
	defer close(lines)
	reader := bufio.NewReader(logReader)
	for {
		line, _, err := reader.ReadLine()
		if err != nil {
			if err != io.EOF && ctx.Err() == nil {
				log.Printf("reading docker logs failed: %v", err)
			}
			return
		}
		// bufio reuses its buffer across reads, so the consumer gets its own
		// copy of the data.
		lineCopy := append([]byte(nil), line...)
		select {
		case lines <- lineCopy:
		case <-ctx.Done():
			return
		}
	}
}

// streamLogs pipes the Docker log stream to the client until the stream ends
// or the connection breaks. A full channel applies backpressure on the reader
// instead of dropping the connection, and a client that stops consuming
// altogether is dropped by the write deadline in writeLogPipeToClient.
func streamLogs(ctx context.Context, conn *websocket.Conn, logReader io.Reader) {
	conn.SetReadLimit(1024 * 1024)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	lines := make(chan []byte, logChannelSize)
	go readLogLines(ctx, logReader, lines)
	writeLogPipeToClient(conn, lines)
}

// sendLogTail answers a one-shot request: it collects the available log lines,
// sends the last `tail` of them and closes the connection normally. Docker
// keeps the response open for some non-follow requests, so collection ends on
// an idle timeout rather than on EOF alone.
func sendLogTail(ctx context.Context, conn *websocket.Conn, logReader io.Reader, tail int) {
	lines := collectLogLines(ctx, logReader, tailCollectIdle)

	start := 0
	if len(lines) > tail {
		start = len(lines) - tail
	}
	for _, line := range lines[start:] {
		if err := sendTextMessage(conn, line); err != nil {
			log.Printf("Websocket write failed: %v", err)
			return
		}
	}
	_ = conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
}

// collectLogLines gathers log lines until the stream ends, the context is
// cancelled or no new line arrived for `idle`.
func collectLogLines(ctx context.Context, logReader io.Reader, idle time.Duration) [][]byte {
	raw := make(chan []byte, logChannelSize)
	go readLogLines(ctx, logReader, raw)

	var lines [][]byte
	// The timer only limits the gap *between* lines: it starts once the first
	// line has arrived, so a slow first response does not truncate the output.
	timer := time.NewTimer(idle)
	if !timer.Stop() {
		<-timer.C
	}
	defer timer.Stop()

	for {
		select {
		case line, ok := <-raw:
			if !ok {
				return lines
			}
			if payload := stripFramePrefix(line); len(payload) > 0 {
				lines = append(lines, payload)
			}
			if !timer.Stop() {
				select {
				case <-timer.C:
				default:
				}
			}
			timer.Reset(idle)
		case <-timer.C:
			return lines
		case <-ctx.Done():
			return lines
		}
	}
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
