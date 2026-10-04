package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// Serves the tasks.
func dockerTasksHandler(w http.ResponseWriter, r *http.Request) {
	tasks, err := queryTasks(r.Context(), "", "")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(tasks); err != nil {
		log.Printf("dockerTasksHandler: encoding response failed: %v", err)
	}
}
