package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

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

	// start writer
	go writeLogPipeToClient(serverConn, ch)

	// send a message with eight prefix bytes then "hello"
	ch <- append([]byte("12345678"), []byte("hello")...)
	close(ch)

	// read on client
	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if string(msg) != "hello" {
		t.Fatalf("expected 'hello', got '%s'", string(msg))
	}

	// allow server handler to finish
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
	go writeLogPipeToClient(serverConn, ch)

	ch <- append([]byte("12345678"), []byte("err")...)
	close(ch)

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
	go writeLogPipeToClient(serverConn, ch)

	ch <- append([]byte("12345678"), []byte("one")...)
	ch <- append([]byte("12345678"), []byte("two")...)
	ch <- append([]byte("12345678"), []byte("three")...)
	close(ch)

	var got []string
	for i := 0; i < 3; i++ {
		_, msg, err := clientConn.ReadMessage()
		if err != nil {
			t.Fatalf("read failed: %v", err)
		}
		got = append(got, string(msg))
	}
	if got[0] != "one" || got[1] != "two" || got[2] != "three" {
		t.Fatalf("unexpected messages: %v", got)
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
	go writeLogPipeToClient(serverConn, ch)

	// send exactly 8 bytes so trimmed payload is empty
	ch <- []byte("12345678")
	close(ch)

	_, msg, err := clientConn.ReadMessage()
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if len(msg) != 0 {
		t.Fatalf("expected empty payload, got %s", string(msg))
	}
	close(done)
}
