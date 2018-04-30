##############################################################################
FROM golang:1.10.1-alpine as go
RUN apk -U add git libc-dev
COPY dockerswarmdashboard.go /tmp/dockerswarmdashboard.go
RUN go get "github.com/docker/docker/api/types"
RUN go get "github.com/docker/docker/client"
RUN go get "github.com/gorilla/mux"
RUN go get "golang.org/x/net/context"
WORKDIR /tmp
RUN go build dockerswarmdashboard.go

##############################################################################
FROM node:alpine as node
RUN apk -U add git wget
COPY app-src /opt/dsd
RUN wget --quiet http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png -O /opt/dsd/src/docker.png
WORKDIR /opt/dsd
RUN npm install --only=production
RUN npm run-script build
RUN rm -r /opt/dsd/node_modules

##############################################################################
FROM alpine:3.7
EXPOSE 8080
RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
COPY --from=go /tmp/dockerswarmdashboard .
COPY --from=node /opt/dsd/build ./build
CMD ./dockerswarmdashboard
