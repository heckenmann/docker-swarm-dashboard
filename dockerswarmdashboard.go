package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/gorilla/mux"
	"golang.org/x/net/context"
)

var (
	cache              = map[string]cacheElement{}
	cacheMaxAgeSeconds = 2
)

/*
 * Cache Element.
 */
type cacheElement struct {
	timestamp time.Time
	value     []byte
}

func main() {
	log.Println("Starting Docker Swarm Dashboard...")
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/docker/services", dockerServicesHandler)
	// router.HandleFunc("/docker/services/{id}", dockerServiceDetailsHandler)
	router.HandleFunc("/docker/nodes", dockerNodesHandler)
	router.HandleFunc("/docker/tasks", dockerTasksHandler)
	router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build/"))))
	log.Println("Ready! Wating for connections...")
	log.Fatal(http.ListenAndServe(":8080", router))
}

// Creates a client
func getCli() *client.Client {
	cli, err := client.NewEnvClient()
	if err != nil {
		panic(err)
	}
	return cli
}

// Returns the cache element
func getCacheElement(index *string) ([]byte, bool) {
	ce, contains := cache[*index]
	if !contains || time.Now().UnixNano()-ce.timestamp.UnixNano() > int64(2*1000000000) {
		return nil, false
	}
	return ce.value, true
}

// Adds a cacheElement
func addCacheElement(index string, json []byte) {
	cache[index] = cacheElement{timestamp: time.Now(), value: json}
}

func abstractHandler(w http.ResponseWriter, r *http.Request) {
	ce, found := getCacheElement(&r.URL.Path)
	if found {
		w.Write(ce)
	} else {
		cli := getCli()
		Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
		if err != nil {
			panic(err)
		}
		jsonString, _ := json.Marshal(Services)
		addCacheElement(r.URL.Path, jsonString)
		w.Write(jsonString)
	}
}

// Serves the services
func dockerServicesHandler(w http.ResponseWriter, r *http.Request) {
	ce, found := getCacheElement(&r.URL.Path)
	if found {
		w.Write(ce)
	} else {
		cli := getCli()
		Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
		if err != nil {
			panic(err)
		}
		jsonString, _ := json.Marshal(Services)
		addCacheElement(r.URL.Path, jsonString)
		w.Write(jsonString)
	}
}

// Serves the nodes
func dockerNodesHandler(w http.ResponseWriter, r *http.Request) {
	ce, found := getCacheElement(&r.URL.Path)
	if found {
		w.Write(ce)
	} else {
		cli := getCli()
		Nodes, err := cli.NodeList(context.Background(), types.NodeListOptions{})
		if err != nil {
			panic(err)
		}
		jsonString, _ := json.Marshal(Nodes)
		addCacheElement(r.URL.Path, jsonString)
		w.Write(jsonString)
	}
}

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, r *http.Request) {
	ce, found := getCacheElement(&r.URL.Path)
	if found {
		w.Write(ce)
	} else {
		cli := getCli()
		Tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{})
		if err != nil {
			panic(err)
		}
		jsonString, _ := json.Marshal(Tasks)
		addCacheElement(r.URL.Path, jsonString)
		w.Write(jsonString)
	}
}

// Serves one service
//func dockerServiceDetailsHandler(w http.ResponseWriter, r *http.Request) {
//	vars := mux.Vars(r)
//	id := vars["id"]
//
//	cli := getCli()
//
//	Service, _, err := cli.ServiceInspectWithRaw(context.Background(), id, types.ServiceInspectOptions{})
//	if err != nil {
//		panic(err)
//	}
//	json.NewEncoder(w).Encode(Service)
//}
