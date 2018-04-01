FROM golang:1.9-alpine
LABEL URL=https://github.com/heckenmann/docker-swarm-dashboard

EXPOSE 8080

RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
ADD app-src/ ./app-src/
COPY dockerswarmdashboard.go .
COPY build.sh .

# docker logo
ADD http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png ./app-src/src/docker.png

RUN sh build.sh

CMD ./dockerswarmdashboard