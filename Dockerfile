##############################################################################
# Stage 1: Build the Go server
FROM golang:1.23.1-alpine AS go
# ENV GO111MODULE=off
RUN apk -U add git libc-dev
COPY server-src/ /tmp/server-src
WORKDIR /tmp/server-src
RUN go build -o docker-swarm-dashboard

##############################################################################
# Stage 2: Build the Node.js application
FROM node:20-alpine AS node
RUN apk -U add --no-cache git wget \
    && mkdir -p /opt/dsd
COPY app-src /opt/dsd
WORKDIR /opt/dsd
RUN yarn install --only=production --frozen-lockfile \
    && yarn run build \
    && rm -r node_modules

##############################################################################
# Stage 3: Create the final image
FROM alpine:3.20.3
EXPOSE 8080
RUN mkdir -p /opt/dsd

# Set the version as an environment variable with a default value of 'dev'
ARG VERSION=dev-build
ENV VERSION=${VERSION}

WORKDIR /opt/dsd
COPY --from=go /tmp/server-src/docker-swarm-dashboard .
COPY --from=node /opt/dsd/build ./build
CMD ["./docker-swarm-dashboard"]
