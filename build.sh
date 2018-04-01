#!/bin/sh

apk update
apk add --no-cache git nodejs-npm wget go
wget http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png -O /opt/dsd/src/docker.png
npm install --only=production
npm run build
go get "github.com/docker/docker/api/types"
go get "github.com/docker/docker/client"
go get "github.com/gorilla/mux"
go get "golang.org/x/net/context"
go build dockerswarmdashboard.go
apk del git nodejs-npm go wget
rm -r /go /usr/local/go