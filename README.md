[![Qodana](https://github.com/heckenmann/docker-swarm-dashboard/actions/workflows/qodana-code-quality.yml/badge.svg?branch=master)](https://github.com/heckenmann/docker-swarm-dashboard/actions/workflows/qodana-code-quality.yml)

# docker-swarm-dashboard
Dashboard for Docker Swarm Cluster

Docker-Image Size: < 25 MB

_Use a stable release in production, not the master-build!
Don't expose this service to the world! The endpoints offer the configuration of your services._

If you like this project, please give a ⭐ on github.
Feedback would be nice.

----
## Tools
Special thanks to JetBrains for supporting this project with <a href="https://www.jetbrains.com/community/opensource/#support" target="_blank">Open Source development licenses</a>.

<a href="https://www.jetbrains.com/" target="_blank"><img src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_square.svg"  height="80px" alt="JetBrains Black Box Logo logo." /></a>
                <a href="https://www.jetbrains.com/go/" target="_blank"><img src="https://resources.jetbrains.com/storage/products/company/brand/logos/GoLand_icon.svg" height="80px" alt="GoLand logo." /></a>
                <a href="https://www.jetbrains.com/webstorm/" target="_blank"><img src="https://resources.jetbrains.com/storage/products/company/brand/logos/WebStorm_icon.svg" height="80px" alt="WebStorm logo." /></a>

----
## Frameworks & Libraries
- [Bootstrap](https://getbootstrap.com/)
- [Fontawesome](https://fontawesome.com/)
- [Gorilla](https://www.gorillatoolkit.org/)
- [Jotai](https://jotai.org/)
- [React](https://reactjs.org/)

----
## Screenshots

![Horizontal Dashboard](screenshots/dashboard_h.jpeg)
![Horizontal Dashboard Dark](screenshots/darkmode.jpeg)
![Vertical Dashboard](screenshots/dashboard_v.jpeg)
![Stacks](screenshots/stacks.jpeg)
![Nodes](screenshots/nodes.jpeg)
![Tasks](screenshots/tasks.jpeg)
![Ports](screenshots/ports.jpeg)
![Logs Form](screenshots/logs.jpeg)
![Logs](screenshots/logs-f.jpeg)

----
## Pull Image from ghcr.io
```
docker pull ghcr.io/heckenmann/docker-swarm-dashboard:master
```

----
## Local Build
```
docker build -t ghcr.io/heckenmann/docker-swarm-dashboard:local .
```

----
## docker-compose.yml
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

----
## Deploy on docker-swarm
From the directory with docker-compose.yml run:
```
docker stack deploy --compose-file docker-compose.yml docker-swarm-dashboard
```

----
## logs-generator (for testing)
```
docker service create --name logger chentex/random-logger:latest 50 200
```