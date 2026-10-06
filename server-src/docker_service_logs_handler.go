package main

import (
	"bufio"
	"bytes"
	"context"
	"io"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/swarm"

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

// logSnapshotTimeout bounds non-follow requests without treating a pause as EOF.
const logSnapshotTimeout = 20 * time.Second

// defaultTail is used when the client requests an unparsable number of lines.
const defaultTail = 20

// sendTextMessage sets a write deadline and sends a text message.
func sendTextMessage(conn *websocket.Conn, data []byte) error {
	_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
	return conn.WriteMessage(websocket.TextMessage, data)
}

// processPayload sends decoded text without interpreting payload bytes as headers.
func processPayload(conn *websocket.Conn, payload []byte) error {
	for _, line := range bytes.Split(payload, []byte{'\n'}) {
		if len(line) == 0 {
			continue
		}
		if err := sendTextMessage(conn, line); err != nil {
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
	tail := "all"
	if count := tailCount(query.Get("tail")); count >= 0 {
		tail = strconv.Itoa(count)
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

// tailCount returns -1 for all history, zero for none, or a positive suffix.
// Invalid input uses the same fallback for Docker and the WebSocket response.
func tailCount(tail string) int {
	if tail == "" || tail == "all" {
		return -1
	}
	if n, err := strconv.Atoi(tail); err == nil && n >= 0 {
		return n
	}
	return defaultTail
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

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	if !opts.follow {
		var stop context.CancelFunc
		ctx, stop = context.WithTimeout(ctx, logSnapshotTimeout)
		defer stop()
	}

	cli, err := getCli()
	if err != nil {
		log.Printf("dockerServiceLogsHandler: getCli error: %v", err)
		closeWithError(conn, "Docker client error")
		return
	}

	service, _, err := cli.ServiceInspectWithRaw(ctx, opts.serviceID, swarm.ServiceInspectOptions{})
	if err != nil {
		closeWithError(conn, "Docker service error: "+err.Error())
		return
	}
	tty := service.Spec.TaskTemplate.ContainerSpec != nil && service.Spec.TaskTemplate.ContainerSpec.TTY

	logReader, err := openServiceLogStream(ctx, cli, opts.serviceID, container.LogsOptions{
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

	// Configure read state before the sole WebSocket reader starts.
	conn.SetReadLimit(1024 * 1024)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(pongWait))
	})

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
		streamLogs(ctx, conn, decodedServiceLogReader(ctx, logReader, tty))
		return
	}
	sendLogTail(ctx, conn, decodedServiceLogReader(ctx, logReader, tty), tailCount(opts.tail))
}

// closeWithError closes the websocket with an internal-error close frame
// carrying a human readable reason.
func closeWithError(conn *websocket.Conn, reason string) {
	_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
	// Close reasons are capped at 123 bytes by the websocket protocol; drop a
	// rune left incomplete by the cut so the frame stays valid UTF-8.
	if len(reason) > 123 {
		reason = strings.ToValidUTF8(reason[:123], "")
	}
	_ = conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseInternalServerErr, reason))
}

// decodedServiceLogReader preserves framing before the line reader sees text.
// Closing either side of the pipe releases the decoder on request cancellation.
func decodedServiceLogReader(ctx context.Context, source io.ReadCloser, tty bool) io.ReadCloser {
	if tty {
		return source
	}
	reader, writer := io.Pipe()
	stop := context.AfterFunc(ctx, func() {
		_ = writer.CloseWithError(ctx.Err())
		_ = source.Close()
	})
	go func() {
		defer stop()
		_ = writer.CloseWithError(copyServiceLogFrames(writer, source))
	}()
	return reader
}

// readLogLines forwards complete logical lines, including a final unterminated
// line. ReadBytes retains lines larger than bufio's internal buffer.
func readLogLines(ctx context.Context, logReader io.Reader, lines chan<- []byte, result chan<- error) {
	defer close(lines)
	reader := bufio.NewReader(logReader)
	for {
		line, err := reader.ReadBytes('\n')
		if err != nil && err != io.EOF {
			result <- err
			return
		}
		line = bytes.TrimSuffix(bytes.TrimSuffix(line, []byte{'\n'}), []byte{'\r'})
		if len(line) > 0 {
			select {
			case lines <- line:
			case <-ctx.Done():
				result <- ctx.Err()
				return
			}
		}
		if err == io.EOF {
			result <- nil
			return
		}
	}
}

// streamLogs pipes the Docker log stream to the client until the stream ends
// or the connection breaks. A full channel applies backpressure on the reader
// instead of dropping the connection, and a client that stops consuming
// altogether is dropped by the write deadline in writeLogPipeToClient.
func streamLogs(ctx context.Context, conn *websocket.Conn, logReader io.Reader) {
	lines := make(chan []byte, logChannelSize)
	result := make(chan error, 1)
	go readLogLines(ctx, logReader, lines, result)
	writeLogPipeToClient(conn, lines, result)
}

// sendLogTail answers a one-shot request: it collects the available log lines,
// sends the last `tail` of them and closes normally only after a complete
// snapshot. The request deadline bounds a daemon that does not finish.
func sendLogTail(ctx context.Context, conn *websocket.Conn, logReader io.Reader, tail int) {
	lines, err := readServiceLogSnapshot(ctx, io.NopCloser(logReader), true)
	if err != nil {
		closeWithError(conn, "Docker logs error: "+err.Error())
		return
	}

	start := 0
	if tail >= 0 && len(lines) > tail {
		start = len(lines) - tail
	}
	for _, line := range lines[start:] {
		if err := sendTextMessage(conn, []byte(line)); err != nil {
			log.Printf("Websocket write failed: %v", err)
			return
		}
	}
	_ = conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
}

// writeLogPipeToClient serializes writes to the websocket connection.
// It sends regular ping messages to keep the connection alive and sets
// write deadlines to avoid blocking forever on slow clients.
func writeLogPipeToClient(websocketConn *websocket.Conn, channel chan []byte, result <-chan error) {
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
				if result != nil {
					if err := <-result; err != nil {
						closeWithError(websocketConn, "Docker logs error: "+err.Error())
						return
					}
				}
				// Channel closed - send normal close and exit.
				_ = websocketConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				return
			}

			// The reader has already decoded Docker frames.
			if err := processPayload(websocketConn, c); err != nil {
				log.Printf("Websocket write failed: %v", err)
				_ = websocketConn.Close()
				return
			}
		}
	}
}
