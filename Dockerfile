##############################################################################
FROM golang:1.18.0-alpine as go
ENV GO111MODULE=off
RUN apk -U add git libc-dev
WORKDIR /tmp
COPY go.mod ./
COPY go.sum ./
COPY dockerswarmdashboard.go ./
RUN go get "github.com/docker/docker/client"
RUN go get "github.com/gorilla/mux"
RUN go get "golang.org/x/net/context"
RUN go get "github.com/gorilla/websocket"
RUN go get "github.com/gorilla/handlers"
RUN go build dockerswarmdashboard.go

##############################################################################
FROM node:16-alpine as node
RUN apk -U add git wget
COPY app-src /opt/dsd
RUN wget --quiet http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png -O /opt/dsd/src/docker.png
WORKDIR /opt/dsd
RUN yarn install --only=production
RUN yarn run build
RUN rm -r /opt/dsd/node_modules

##############################################################################
FROM alpine:3.15
EXPOSE 8080
RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
COPY --from=go /tmp/dockerswarmdashboard .
COPY --from=node /opt/dsd/build ./build
CMD ./dockerswarmdashboard
