FROM golang:1.9-alpine
LABEL URL=https://github.com/heckenmann/docker-swarm-dashboard

EXPOSE 8080

RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
ADD app-src/ ./app-src/
COPY dockerswarmdashboard.go .

# docker logo
ADD http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png ./app-src/src/docker.png

RUN apk update && apk add --no-cache --virtual .tmpstuff git nodejs-npm

RUN cd app-src && npm install && npm run-script build && mv build .. && cd .. && rm -r app-src/

RUN go get "github.com/docker/docker/api/types" \
            "github.com/docker/docker/client" \
            "github.com/gorilla/mux" \
            "golang.org/x/net/context"

RUN go build dockerswarmdashboard.go
RUN apk del .tmpstuff go
RUN rm -r /go /usr/local/go

CMD ./dockerswarmdashboard
