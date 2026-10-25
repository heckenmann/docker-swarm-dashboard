package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type StackSimpleService struct {
	ID          string
	ServiceName string
	ShortName   string
	Replication string
	Created     time.Time
	Updated     time.Time
}

type StacksHandlerSimpleStack struct {
	Name     string
	Services []StackSimpleService
}

func stacksHandler(w http.ResponseWriter, r *http.Request) {
	result, err := queryStacks(r.Context())
	if err != nil {
		http.Error(w, "Failed to list services: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("stacksHandler: encoding response failed: %v", err)
	}
}
