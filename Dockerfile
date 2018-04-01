FROM golang:1.9-alpine
LABEL URL=https://github.com/heckenmann/docker-swarm-dashboard

EXPOSE 8080

RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
COPY app-src/ /opt/dsd/
COPY dockerswarmdashboard.go /opt/dsd/dockerswarmdashboard.go
COPY build.sh ./build.sh

ADD http://getcarina.github.io/jupyterhub-tutorial/slides/img/docker-swarm.png /opt/dsd/src/docker.png

RUN sh ./build.sh

CMD /opt/dsd/dockerswarmdashboard
