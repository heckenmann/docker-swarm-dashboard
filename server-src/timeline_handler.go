package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type TimelineHandlerSimpleTask struct {
	ID               string
	CreatedTimestamp time.Time
	StoppedTimestamp time.Time
	State            string
	DesiredState     string
	Slot             int
	ServiceName      string
	ServiceID        string
	Stack            string
}

func timelineHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryTimeline(r.Context())
	if err != nil {
		http.Error(w, "Failed to load timeline: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("timelineHandler: encoding response failed: %v", err)
	}
}
