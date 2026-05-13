package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/docker/docker/api/types/swarm"
)

// Serves the tasks
func dockerTasksHandler(w http.ResponseWriter, r *http.Request) {
	cli, err := getCli()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	Tasks, err := cli.TaskList(r.Context(), swarm.TaskListOptions{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(Tasks); err != nil {
		log.Printf("dockerTasksHandler: encoding response failed: %v", err)
	}
}
