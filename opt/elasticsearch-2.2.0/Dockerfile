# Dockerfile
FROM openjdk:8-jre-alpine

ENV ES_VERSION=2.2.0
ENV ES_HOME=/opt/elasticsearch
ENV PATH=$ES_HOME/bin:$PATH

RUN apk add --no-cache bash curl && \
    mkdir -p /opt && \
    curl -L -o elasticsearch.tar.gz https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-${ES_VERSION}.tar.gz && \
    tar -xzf elasticsearch.tar.gz -C /opt && \
    mv /opt/elasticsearch-${ES_VERSION} $ES_HOME && \
    rm elasticsearch.tar.gz

WORKDIR $ES_HOME
VOLUME ["/usr/share/elasticsearch/data"]

RUN mkdir -p /opt/elasticsearch/logs

EXPOSE 9200 9300

CMD ["elasticsearch"]
