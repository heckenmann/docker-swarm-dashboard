FROM golang:1.9-alpine
LABEL URL=https://github.com/heckenmann/docker-swarm-dashboard

EXPOSE 8080

RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
COPY app-src/ /opt/dsd/
COPY dockerswarmdashboard.go /opt/dsd/dockerswarmdashboard.go

ADD http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png /opt/dsd/src/docker.png

RUN apk update
RUN apk add --no-cache --virtual .tmpstuff git nodejs-npm

RUN npm install --production

RUN go get "github.com/docker/docker/api/types" "github.com/docker/docker/client" "github.com/gorilla/mux" "golang.org/x/net/context"
RUN go build dockerswarmdashboard.go

RUN apk del .tmpstuff go
RUN rm -r /go /usr/local/go

CMD ./dockerswarmdashboard
