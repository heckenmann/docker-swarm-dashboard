package main

import (
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
	defer clientConn.Close()

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
	clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
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
	serverConn.Close()

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
		clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
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

// TestWriteLogPipeToClient_EmptyPayload ensures the writer handles frames where the trimmed payload is empty.
func TestWriteLogPipeToClient_EmptyPayload(t *testing.T) {
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

	ch := make(chan []byte, 1)
	doneWriter := make(chan struct{})
	go func() {
		writeLogPipeToClient(serverConn, ch)
		close(doneWriter)
	}()

	// send exactly 8 bytes so trimmed payload is empty
	ch <- []byte("12345678")
	close(ch)

	clientConn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
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
		clientConn.SetReadDeadline(time.Now().Add(5 * time.Second))
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
