package main

import (
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/mux"
	"net/http"

	"github.com/docker/docker/api/types"
)

// Serves single service
func dockerServicesDetailsHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	paramServiceId := params["id"]
	cli := getCli()
	servicesFilter := filters.NewArgs()
	servicesFilter.Add("id", paramServiceId)
	Services, err := cli.ServiceList(context.Background(), types.ServiceListOptions{Filters: servicesFilter})
	if err != nil {
		panic(err)
	}
	if len(Services) == 1 {
		jsonString, _ := json.Marshal(Services[0])
		w.Write(jsonString)
	} else {
		w.Write([]byte("{}"))
	}
}
