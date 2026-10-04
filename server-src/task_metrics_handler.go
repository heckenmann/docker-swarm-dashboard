package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// taskMetricsResponse represents the response structure for task metrics endpoint
type taskMetricsResponse struct {
	Available bool                    `json:"available"`
	Metrics   *ContainerMemoryMetrics `json:"metrics,omitempty"`
	Error     *string                 `json:"error,omitempty"`
	Message   *string                 `json:"message,omitempty"`
}

// taskMetricsHandler returns memory and CPU metrics for a specific task from cAdvisor.
func taskMetricsHandler(w http.ResponseWriter, r *http.Request) {
	taskID := mux.Vars(r)["id"]
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(queryTaskMetrics(r.Context(), taskID)); err != nil {
		log.Printf("taskMetricsHandler: encoding response failed: %v", err)
	}
}
