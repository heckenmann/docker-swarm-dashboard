package main

import (
	"bufio"
	"context"
	"github.com/docker/docker/api/types/container"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		EnableCompression: true,
		CheckOrigin: func(_ *http.Request) bool {
			return true
		}}
)

// Serves the logs
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
	ctx, _ := context.WithCancel(context.Background())
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

	// Channel to write logs to
	channel := make(chan []byte)
	defer close(channel)

	// Start client writer
	go writeLogPipeToClient(ce, channel)

	// Copy logs to pipe
	bufioReader := bufio.NewReader(logReader)
	for {
		// Check for new client messages
		//_, _, err = ce.ReadMessage()

		// Read logs
		line, _, err := bufioReader.ReadLine()
		if err == io.EOF {
			log.Println(line)
			break
		}
		if err != nil {
			log.Println(err)
			return
		}
		channel <- line
	}
}

// Writes the content of the pipe to the client.
func writeLogPipeToClient(websocketConn *websocket.Conn, channel chan []byte) {
	for c := range channel {
		// Cutting first 8 byte
		err := websocketConn.WriteMessage(websocket.TextMessage, c[8:])
		if err != nil {
			log.Printf("Websocket closed: %s", websocketConn.LocalAddr().String())
			return
		}
	}
}
