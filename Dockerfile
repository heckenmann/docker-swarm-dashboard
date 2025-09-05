##############################################################################
# Stage 1: Build the Go server
FROM golang:1.25.1-alpine AS go
# ENV GO111MODULE=off
RUN apk -U add git libc-dev
COPY server-src/ /tmp/server-src
WORKDIR /tmp/server-src
RUN go build -o docker-swarm-dashboard

##############################################################################
# Stage 2: Build the Node.js application
FROM node:24-alpine AS node
RUN apk -U add --no-cache git wget \
  && mkdir -p /opt/dsd
COPY app-src /opt/dsd
WORKDIR /opt/dsd
RUN yarn install --only=production --frozen-lockfile --network-timeout 1800000 \
  && yarn run build \
  && rm -r node_modules

##############################################################################
# Stage 3: Create the final image
FROM alpine:3.22.1
RUN mkdir -p /opt/dsd

# Set the version as an environment variable
ARG VERSION=0.0.0
ENV DSD_HTTP_PORT=8080
ENV DSD_VERSION=${VERSION}
ENV DSD_PATH_PREFIX=/
LABEL dsd.version=${VERSION}
ENV DSD_VERSION_RELEASE_URL=https://api.github.com/repos/heckenmann/docker-swarm-dashboard/releases/latest
ENV DSD_VERSION_CHECK_CACHE_TIMEOUT_MINUTES=30

EXPOSE ${DSD_HTTP_PORT}

WORKDIR /opt/dsd
COPY --from=go /tmp/server-src/docker-swarm-dashboard .
COPY --from=node /opt/dsd/build ./build

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${DSD_HTTP_PORT}${DSD_PATH_PREFIX}/health | grep -q 'OK' || exit 1
CMD ["./docker-swarm-dashboard"]
