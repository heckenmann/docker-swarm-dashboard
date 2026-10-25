package main

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gorilla/mux"
)

// Serves a single task.
func dockerTasksDetailsHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryTaskDetails(r.Context(), mux.Vars(r)["id"])
	if err != nil {
		if errors.Is(err, errDashboardEntityNotFound) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte("{}"))
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
