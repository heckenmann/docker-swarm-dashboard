#!/bin/sh

apk update
apk add --no-cache git nodejs-npm
npm install --production
npm build
go get "github.com/docker/docker/api/types"
go get "github.com/docker/docker/client"
go get "github.com/gorilla/mux"
go get "golang.org/x/net/context"
go build dockerswarmdashboard.go
apk del git nodejs-npm go
rm -r /go /usr/local/go