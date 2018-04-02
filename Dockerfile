FROM alpine:3.7

EXPOSE 8080

WORKDIR /opt
#COPY app-src ./dsd
RUN ls -la
#COPY dockerswarmdashboard.go /opt/dsd
#COPY build.sh /opt/dsd
#
#RUN chmod +x /opt/dsd/build.sh
#RUN /bin/sh /opt/dsd/build.sh

#CMD /opt/dsd/dockerswarmdashboard
