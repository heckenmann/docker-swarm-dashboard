package main

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// openServiceLogStream is shared by the WebSocket viewer and finite MCP queries.
func openServiceLogStream(ctx context.Context, cli *client.Client, serviceID string, options container.LogsOptions) (io.ReadCloser, error) {
	options.Since = normalizeSince(options.Since)
	return cli.ServiceLogs(ctx, serviceID, options)
}

// readServiceLogSnapshot decodes complete Docker frames before splitting text.
// TTY services return a raw stream without multiplex headers. Cancellation closes
// the reader, including when Docker keeps a non-follow response open.
func readServiceLogSnapshot(ctx context.Context, reader io.ReadCloser, tty bool) ([]string, error) {
	done := make(chan struct{})
	defer close(done)
	go func() {
		select {
		case <-ctx.Done():
			_ = reader.Close()
		case <-done:
		}
	}()

	var output bytes.Buffer
	var err error
	if tty {
		_, err = io.Copy(&output, reader)
	} else {
		_, err = stdcopy.StdCopy(&output, &output, reader)
	}
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}
	if err != nil {
		return nil, fmt.Errorf("read Docker log snapshot: %w", err)
	}
	lines := make([]string, 0)
	for _, line := range bytes.Split(output.Bytes(), []byte{'\n'}) {
		line = bytes.TrimSuffix(line, []byte{'\r'})
		if len(line) > 0 {
			lines = append(lines, string(line))
		}
	}
	return lines, nil
}
