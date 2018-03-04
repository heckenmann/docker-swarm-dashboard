FROM golang:1.9-alpine
LABEL URL=https://github.com/heckenmann/docker-swarm-dashboard

EXPOSE 8080

RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
ADD static/ ./static/
COPY dockerswarmdashboard.go .

RUN apk update && apk add git unzip

# docker logo
ADD https://i2.wp.com/blog.docker.com/media/docker-whales-transparent.png ./static/docker.png

# jquery
ADD https://code.jquery.com/jquery-3.3.1.min.js ./static

# download bootstrap
ADD https://github.com/twbs/bootstrap/archive/v4.0.0.zip static/bootstrap.zip
RUN unzip static/bootstrap.zip && rm static/bootstrap.zip && mv bootstrap-4.0.0 static/bootstrap

# fontawesome
ADD https://use.fontawesome.com/releases/v5.0.8/fontawesome-free-5.0.8.zip static/fontawesome.zip
RUN unzip static/fontawesome.zip && rm static/fontawesome.zip && mv fontawesome-free-5.0.8 static/fontawesome-free-5.0.8

# go dependencies
RUN go get "github.com/docker/docker/api/types"
RUN go get "github.com/docker/docker/client"
RUN go get "github.com/gorilla/mux"
RUN go get "golang.org/x/net/context"

RUN go build dockerswarmdashboard.go

CMD ./dockerswarmdashboard