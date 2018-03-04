package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/gorilla/mux"
	"golang.org/x/net/context"
)

func main() {
	log.Println("Starting Docker Swarm Dashboard...")
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/docker/services", dockerServicesHandler)
	router.HandleFunc("/docker/services/{id}", dockerServiceDetailsHandler)
	router.HandleFunc("/docker/nodes", dockerNodesHandler)
	router.HandleFunc("/docker/tasks", dockerTasksHandler)
	router.HandleFunc("/", staticHandler)
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static/"))))
	log.Println("Ready! Wating for connections...")
	log.Fatal(http.ListenAndServe(":8080", router))
}

func staticHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	Path := r.URL.Path
	if Path == "/" {
		Path = "index.html"
	}
	http.ServeFile(w, r, "static/"+Path)
}

// Creates a client
func getCli() *client.Client {
	cli, err := client.NewEnvClient()
	if err != nil {
		panic(err)
	}
	return cli
}

// Serves the services
func dockerServicesHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()

	Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
	if err != nil {
		panic(err)
	}
	json.NewEncoder(w).Encode(Services)
}

// Serves one service
func dockerServiceDetailsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	cli := getCli()

	Service, _, err := cli.ServiceInspectWithRaw(context.Background(), id, types.ServiceInspectOptions{})
	if err != nil {
		panic(err)
	}
	json.NewEncoder(w).Encode(Service)
}

// Serves the nodes
func dockerNodesHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()

	Nodes, err := cli.NodeList(context.Background(), types.NodeListOptions{})
	if err != nil {
		panic(err)
	}
	json.NewEncoder(w).Encode(Nodes)
}

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, r *http.Request) {
	cli := getCli()

	Tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{})
	if err != nil {
		panic(err)
	}
	json.NewEncoder(w).Encode(Tasks)
}
