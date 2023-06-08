package main

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types"
)

// Serves the services
func dockerServicesHandler(w http.ResponseWriter, _ *http.Request) {
	cli := getCli()
	Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{})
	if err != nil {
		panic(err)
	}
	jsonString, _ := json.Marshal(Services)
	w.Write(jsonString)
}
