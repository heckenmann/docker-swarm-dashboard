package main

import (
	"log"
	"net/http"
)

type dashboardH struct {
}

// Serves datamodel for horizontal dashboard.
func DashboardHHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("test")
}
