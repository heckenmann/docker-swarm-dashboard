package main

import (
	"bufio"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"golang.org/x/net/context"
)

var (
	upgrader = websocket.Upgrader{
		EnableCompression: true,
		CheckOrigin: func(r *http.Request) bool {
			return true
		}}
)

func main() {
	log.Println("Starting Docker Swarm Dashboard...")
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/docker/services", dockerServicesHandler)
	// router.HandleFunc("/docker/services/{id}", dockerServiceDetailsHandler)
	router.HandleFunc("/docker/nodes", dockerNodesHandler)
	router.HandleFunc("/docker/tasks", dockerTasksHandler)
	router.HandleFunc("/docker/logs/{id}", dockerServiceLogsHandler)
	router.HandleFunc("/ui/dashboardh", DashboardHHandler)
	router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build/"))))
	log.Println("Ready! Wating for connections...")
	loggedRouter := handlers.LoggingHandler(os.Stdout, router)
	log.Fatal(http.ListenAndServe(":8080", handlers.CompressHandler(loggedRouter)))

}

// Creates a client
func getCli() *client.Client {
	cli, err := client.NewEnvClient()
	if err != nil {
		panic(err)
	}
	return cli
}

func addCorsHeader(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Allow-Origin", "*")
}

// Serves the services
func dockerServicesHandler(w http.ResponseWriter, r *http.Request) {
	addCorsHeader(w)
	cli := getCli()
	Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Services)
	w.Write(jsonString)
}

// Serves the nodes
func dockerNodesHandler(w http.ResponseWriter, r *http.Request) {
	addCorsHeader(w)
	cli := getCli()
	Nodes, err := cli.NodeList(context.Background(), types.NodeListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Nodes)
	w.Write(jsonString)
}

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, r *http.Request) {
	addCorsHeader(w)
	cli := getCli()
	Tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Tasks)
	w.Write(jsonString)
}

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
	logReader, _ := cli.ServiceLogs(ctx, paramServiceId, types.ContainerLogsOptions{
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
