apk update && apk add --no-cache --virtual .tmpstuff git nodejs-npm

cd app-src && npm install && npm run-script build && mv build .. && cd .. && rm -r app-src/

go get "github.com/docker/docker/api/types" \
            "github.com/docker/docker/client" \
            "github.com/gorilla/mux" \
            "golang.org/x/net/context"

go build dockerswarmdashboard.go
apk del .tmpstuff go
rm -r /go /usr/local/go