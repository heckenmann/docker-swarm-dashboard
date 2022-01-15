# docker-swarm-dashboard
Dashboard for Docker Swarm Cluster

Docker-Image Size: 10 MB

**DON'T USE "latest" DOCKER-IMAGE FOR PRODUCTION!**

## Pull Image from ghcr.io
```
docker pull ghcr.io/heckenmann/docker-swarm-dashboard:master
```

## Local Build
```
docker build -t ghcr.io/heckenmann/docker-swarm-dashboard:local .
```

## docker-compose.yml
Use a stable release in production, not the master-build!
```
---
version: '3.5'

services:
  docker-swarm-dashboard:
    image: ghcr.io/heckenmann/docker-swarm-dashboard:master
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    ports:
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    environment:
      DOCKER_API_VERSION: 1.35
```

## Deploy on docker-swarm
From the directory with docker-compose.yml run:
```
docker stack deploy --compose-file docker-compose.yml docker-swarm-dashboard
```

## logs-generator (for testing)
```
docker service create --name logger chentex/random-logger:latest 50 200
```

## Screenshots (outdated!)

![Container Dashboard](screenshots/container.png)
![Tasks Timeline](screenshots/tasks.png)