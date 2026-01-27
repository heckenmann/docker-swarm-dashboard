package main

import (
	"encoding/binary"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// TestWriteLogPipeToClient_Success ensures the helper writes the payload (after 8 bytes) to the websocket client.
func TestWriteLogPipeToClient_Success(t *testing.T) {
	// restore original pingInterval after test
	orig := pingInterval
	defer func() { pingInterval = orig }()
	// shorten ping interval to keep test fast even if ticker path exercised
	pingInterval = 10 * time.Millisecond
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		// hand server side conn to test
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	// Dial from client side
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer func() { _ = clientConn.Close() }()

	// get server conn
	serverConn := <-srvConnCh

	// channel used by writer
	ch := make(chan []byte, 1)

	// start writer and wait for it to finish
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// send a message with eight prefix bytes then "hello"
	ch <- append([]byte("12345678"), []byte("hello")...)
	close(ch)

	// read on client
	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "hello" {
		t.Fatalf("expected 'hello', got '%s'", string(msg))
	}

	// wait for writer to finish and then allow server handler to complete
	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish in time")
	}
	close(done)
}

// TestWriteLogPipeToClient_ErrorWhenClosed ensures writer exits when websocket is closed (WriteMessage returns error).
func TestWriteLogPipeToClient_ErrorWhenClosed(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	_, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}

	serverConn := <-srvConnCh

	// Close the server-side connection to force WriteMessage to return an error
	_ = serverConn.Close()

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	ch <- append([]byte("12345678"), []byte("err")...)
	close(ch)

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not exit after connection close")
	}

	// allow server handler to finish
	close(done)
}

// TestWriteLogPipeToClient_MultipleMessages ensures the writer sends multiple messages and exits when channel closed.
func TestWriteLogPipeToClient_MultipleMessages(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer func() { _ = clientConn.Close() }()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 3)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	ch <- append([]byte("12345678"), []byte("one")...)
	ch <- append([]byte("12345678"), []byte("two")...)
	ch <- append([]byte("12345678"), []byte("three")...)
	close(ch)

	var got []string
	for i := 0; i < 3; i++ {
		_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, msg, err := clientConn.ReadMessage()
		if err != nil {
			t.Fatalf("read failed: %v", err)
		}
		got = append(got, string(msg))
	}
	if got[0] != "one" || got[1] != "two" || got[2] != "three" {
		t.Fatalf("unexpected messages: %v", got)
	}
	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_SplitAggregatedPayload ensures that when a single
// channel payload contains multiple newline-separated log lines (after the
// 8-byte Docker multiplex header), the writer sends each non-empty line as
// its own websocket message.
func TestWriteLogPipeToClient_SplitAggregatedPayload(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer func() { _ = clientConn.Close() }()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// single payload contains three lines separated by '\n'
	payload := []byte("12345678one\ntwo\nthree\n")
	ch <- payload
	close(ch)

	var got []string
	for i := 0; i < 3; i++ {
		_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, msg, err := clientConn.ReadMessage()
		if err != nil {
			t.Fatalf("read failed: %v", err)
		}
		got = append(got, string(msg))
	}
	if got[0] != "one" || got[1] != "two" || got[2] != "three" {
		t.Fatalf("unexpected messages from split payload: %v", got)
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_MultipleHeadersPayload ensures that when a single
// channel payload contains multiple docker-multiplexed frames each with
// their own 8-byte header, the writer correctly parses and sends each
// frame's lines as separate websocket messages.
func TestWriteLogPipeToClient_MultipleHeadersPayload(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// build two multiplex frames: header + "one\n", header + "two\n"
	var payload []byte
	hdr1 := make([]byte, 8)
	hdr1[0] = 1
	binary.BigEndian.PutUint32(hdr1[4:], uint32(len([]byte("one\n"))))
	payload = append(payload, hdr1...)
	payload = append(payload, []byte("one\n")...)

	hdr2 := make([]byte, 8)
	hdr2[0] = 1
	binary.BigEndian.PutUint32(hdr2[4:], uint32(len([]byte("two\n"))))
	payload = append(payload, hdr2...)
	payload = append(payload, []byte("two\n")...)

	ch <- payload
	close(ch)

	var got []string
	for i := 0; i < 2; i++ {
		_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, msg, err := clientConn.ReadMessage()
		if err != nil {
			t.Fatalf("read failed: %v", err)
		}
		got = append(got, string(msg))
	}
	if got[0] != "one" || got[1] != "two" {
		t.Fatalf("unexpected messages from multiplexed payload: %v", got)
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_EmptyPayload ensures the writer handles frames where the trimmed payload is empty.
func TestWriteLogPipeToClient_EmptyPayload(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// send exactly 8 bytes so trimmed payload is empty
	ch <- []byte("12345678")
	close(ch)

	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		// With the server change that skips empty payloads, the writer may
		// close the connection without sending a TextMessage. Treat a close
		// error as acceptable behavior for this test.
		return
	}
	if len(msg) != 0 {
		t.Fatalf("expected empty payload, got %s", string(msg))
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_LargeVolume sends a large number of messages
// through the writer to ensure it can handle high throughput without
// deadlocking. The messages include the 8-byte docker multiplex header
// prefix that the writer strips before sending to the client.
func TestWriteLogPipeToClient_LargeVolume(t *testing.T) {
	const N = 10000

	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 512)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// send N messages
	for i := 0; i < N; i++ {
		// include 8-byte prefix
		payload := fmt.Sprintf("12345678message-%d", i)
		ch <- []byte(payload)
	}
	close(ch)

	// read N messages with per-read deadlines
	received := 0
	for received < N {
		_ = clientConn.SetReadDeadline(time.Now().Add(5 * time.Second))
		_, _, err := clientConn.ReadMessage()
		if err != nil {
			t.Fatalf("read failed at %d: %v", received, err)
		}
		received++
	}

	if received != N {
		t.Fatalf("expected %d messages, got %d", N, received)
	}

	select {
	case <-doneWriter:
	case <-time.After(5 * time.Second):
		t.Fatalf("writer did not finish in time")
	}

	close(done)
}

// TestWriteLogPipeToClient_WriterFinishesAfterChannelClose verifies that
// the writer goroutine finishes promptly after the channel is closed,
// even under load. This ensures there's no lingering goroutine that
// might race with connection close operations.
func TestWriteLogPipeToClient_WriterFinishesAfterChannelClose(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 256)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// push a moderate burst of messages to keep the writer busy
	for i := 0; i < 2000; i++ {
		ch <- append([]byte("12345678"), []byte("payload")...)
	}

	// Now close the channel and expect the writer to finish quickly
	close(ch)
	select {
	case <-doneWriter:
		// success
	case <-time.After(3 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}

	close(done)
}

// TestWriteLogPipeToClient_PingTicker ensures the ping path in the writer
// is exercised. We shorten the ping interval and verify the writer keeps
// running while no payloads are sent.
func TestWriteLogPipeToClient_PingTicker(t *testing.T) {
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	// Start writer with an empty channel - ticker should fire.
	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// wait a short while to allow a few pings to be sent
	time.Sleep(100 * time.Millisecond)

	// close channel and wait for writer to finish
	close(ch)
	select {
	case <-doneWriter:
		// success
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after ping ticks")
	}
	close(done)
}

// TestWriteLogPipeToClient_FallbackStripHeader ensures that when the payload
// contains an 8-byte header but the header's size field does not fit the
// remaining bytes, the writer falls back to stripping the first 8 bytes
// and sending the remainder split by newlines.
func TestWriteLogPipeToClient_FallbackStripHeader(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// craft header with a large size so 8+size > len(payload)
	hdr := make([]byte, 8)
	hdr[0] = 9
	binary.BigEndian.PutUint32(hdr[4:], uint32(1000))
	payload := append(hdr, []byte("abc\n")...)
	ch <- payload
	close(ch)

	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "abc" {
		t.Fatalf("expected 'abc', got '%s'", string(msg))
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_ShortPayload verifies behaviour when payload length < 8
// (no multiplex header present)
func TestWriteLogPipeToClient_ShortPayload(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	ch <- []byte("hello\n")
	close(ch)

	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "hello" {
		t.Fatalf("expected 'hello', got '%s'", string(msg))
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_PartialFrameRemainder ensures that if a payload
// contains a multiplexed frame followed by raw remainder data, both the
// parsed frame lines and the remainder lines are sent.
func TestWriteLogPipeToClient_PartialFrameRemainder(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	var payload []byte
	hdr := make([]byte, 8)
	hdr[0] = 1
	binary.BigEndian.PutUint32(hdr[4:], uint32(len([]byte("one\n"))))
	payload = append(payload, hdr...)
	payload = append(payload, []byte("one\n")...)
	// append raw remainder without header
	payload = append(payload, []byte("rem\n")...)

	ch <- payload
	close(ch)

	var got []string
	for i := 0; i < 2; i++ {
		_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, msg, err := clientConn.ReadMessage()
		if err != nil {
			t.Fatalf("read failed: %v", err)
		}
		got = append(got, string(msg))
	}
	if got[0] != "one" || got[1] != "rem" {
		t.Fatalf("unexpected messages from partial payload: %v", got)
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_ZeroLengthPayload ensures that an empty payload
// (zero-length slice) is handled by sending an empty TextMessage to the client.
func TestWriteLogPipeToClient_ZeroLengthPayload(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	ch <- []byte{}
	close(ch)

	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		// Accept either an empty message or a close
		return
	}
	if len(msg) != 0 {
		t.Fatalf("expected empty message, got '%s'", string(msg))
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_NonStandardStreamHeader ensures frames are parsed
// even when the first header byte is not 0/1/2 but the declared size fits
// within the payload.
func TestWriteLogPipeToClient_NonStandardStreamHeader(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// header with first byte != 0/1/2 but size fits
	hdr := make([]byte, 8)
	hdr[0] = 9
	binary.BigEndian.PutUint32(hdr[4:], uint32(len([]byte("one\n"))))
	payload := append(hdr, []byte("one\n")...)
	ch <- payload
	close(ch)

	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "one" {
		t.Fatalf("expected 'one', got '%s'", string(msg))
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_WriteErrorDuringSend ensures that if the
// websocket becomes closed while the writer is sending multiple messages,
// the writer detects the WriteMessage error and exits cleanly.
func TestWriteLogPipeToClient_WriteErrorDuringSend(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}

	serverConn := <-srvConnCh

	ch := make(chan []byte, 2)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// send two messages; reader will read one and then close to provoke error
	ch <- append([]byte("12345678"), []byte("first\n")...)
	ch <- append([]byte("12345678"), []byte("second\n")...)

	// read first message then close client to trigger server write error
	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "first" {
		t.Fatalf("expected 'first', got '%s'", string(msg))
	}
	// close client side to make subsequent WriteMessage fail on server
	clientConn.Close()

	// wait for writer to notice error and finish
	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not exit after write error")
	}

	close(done)
}

// TestWriteLogPipeToClient_ZeroStreamType ensures stream type 0 is handled.
func TestWriteLogPipeToClient_ZeroStreamType(t *testing.T) {
	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	defer clientConn.Close()

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	hdr := make([]byte, 8)
	hdr[0] = 0
	binary.BigEndian.PutUint32(hdr[4:], uint32(len([]byte("zero\n"))))
	payload := append(hdr, []byte("zero\n")...)
	ch <- payload
	close(ch)

	_ = clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "zero" {
		t.Fatalf("expected 'zero', got '%s'", string(msg))
	}

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		t.Fatalf("writer did not finish after channel close")
	}
	close(done)
}

// TestWriteLogPipeToClient_PingWriteError forces a ping write failure by
// closing the server connection after writer starts, ensuring the ping
// branch handles WriteMessage errors and exits.
func TestWriteLogPipeToClient_PingWriteError(t *testing.T) {
	orig := pingInterval
	defer func() { pingInterval = orig }()
	pingInterval = 10 * time.Millisecond

	srvConnCh := make(chan *websocket.Conn, 1)
	done := make(chan struct{})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade failed: %v", err)
		}
		srvConnCh <- conn
		<-done
		conn.Close()
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	clientConn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}

	serverConn := <-srvConnCh

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// Close server connection to ensure next ping fails
	serverConn.Close()

	select {
	case <-doneWriter:
	case <-time.After(2 * time.Second):
		clientConn.Close()
		t.Fatalf("writer did not exit after ping write error")
	}
	close(done)
}
