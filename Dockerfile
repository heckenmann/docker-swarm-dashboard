##############################################################################
FROM golang:1.18.3-alpine as go
# ENV GO111MODULE=off
RUN apk -U add git libc-dev
COPY server-src/ /tmp/server-src
WORKDIR /tmp/server-src
RUN go build

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
COPY --from=go /tmp/server-src/docker-swarm-dashboard .
COPY --from=node /opt/dsd/build ./build
CMD ./docker-swarm-dashboard
