# docker-swarm-dashboard
Dashboard for Docker Swarm Cluster

Docker-Image Size: 8MB

## Screenshots

![Container Dashboard](screenshots/container.png)
![Tasks Timeline](screenshots/tasks.png)

## docker-compose.yml
```
---
version: '3.5'

services:
  docker-swarm-dashboard:
    image: heckenmann/docker-swarm-dashboard
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