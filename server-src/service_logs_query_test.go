package main

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"io"
	"strings"
	"testing"
	"time"
)

func TestReadServiceLogSnapshot(t *testing.T) {
	frame := func(payload string, stream byte) []byte {
		header := make([]byte, 8)
		header[0] = stream
		binary.BigEndian.PutUint32(header[4:], uint32(len(payload)))
		return append(header, []byte(payload)...)
	}
	for _, test := range []struct {
		name      string
		raw       []byte
		tty       bool
		want      []string
		wantError bool
	}{
		{"multiline frame", frame("one\ntwo\n", 1), false, []string{"one", "two"}, false},
		{"stdout and stderr", append(frame("stdout\n", 1), frame("stderr\n", 2)...), false, []string{"stdout", "stderr"}, false},
		{"long line", frame(strings.Repeat("x", 5000)+"\n", 1), false, []string{strings.Repeat("x", 5000)}, false},
		{"raw tty", []byte("one\r\n\ntwo"), true, []string{"one", "two"}, false},
		{"empty", nil, false, []string{}, false},
		{"invalid stream", frame("one\n", 9), false, nil, true},
		{"stdin frame", frame("stdin\n", 0), false, []string{"stdin"}, false},
		{"empty frame", frame("", 1), false, []string{}, false},
		{"daemon error", frame("log driver failed", 3), false, nil, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			got, err := readServiceLogSnapshot(context.Background(), io.NopCloser(bytes.NewReader(test.raw)), test.tty)
			if (err != nil) != test.wantError {
				t.Fatalf("unexpected error: %v", err)
			}
			if strings.Join(got, "\n") != strings.Join(test.want, "\n") {
				t.Fatalf("got %q, want %q", got, test.want)
			}
		})
	}
}

func TestReadServiceLogSnapshot_TruncatedFrames(t *testing.T) {
	frame := make([]byte, 8)
	frame[0] = 1
	binary.BigEndian.PutUint32(frame[4:], 10)
	frame = append(frame, []byte("completed\n")...)
	for _, test := range []struct {
		name string
		raw  []byte
	}{
		{"truncated header", frame[:7]},
		{"missing payload", frame[:8]},
		{"truncated payload", frame[:15]},
		{"complete frame then truncated header", append(append([]byte{}, frame...), frame[:7]...)},
		{"complete frame then truncated payload", append(append([]byte{}, frame...), frame[:15]...)},
	} {
		t.Run(test.name, func(t *testing.T) {
			lines, err := readServiceLogSnapshot(context.Background(), io.NopCloser(bytes.NewReader(test.raw)), false)
			if !errors.Is(err, io.ErrUnexpectedEOF) || lines != nil {
				t.Fatalf("expected incomplete snapshot error without partial lines, got lines=%q err=%v", lines, err)
			}
		})
	}
}

func TestReadServiceLogSnapshot_Cancellation(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	reader, writer := io.Pipe()
	defer func() { _ = writer.Close() }()
	_, err := readServiceLogSnapshot(ctx, reader, false)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("expected cancellation of a blocked reader, got %v", err)
	}
}
