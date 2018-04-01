FROM alpine:3.7

EXPOSE 8080

RUN mkdir -p /opt/dsd
WORKDIR /opt/dsd
COPY app-src/* /opt/dsd/
COPY dockerswarmdashboard.go /opt/dsd/
COPY build.sh /opt/dsd/

RUN chmod +x /opt/dsd/build.sh
RUN /bin/sh /opt/dsd/build.sh

CMD /opt/dsd/dockerswarmdashboard
