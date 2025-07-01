# Dockerfile for Elasticsearch 2.2.0
FROM openjdk:8-jre-alpine

# Install curl and bash
RUN apk add --no-cache curl bash

# Set up elasticsearch user
RUN addgroup -g 1000 elasticsearch && \
    adduser -D -u 1000 -G elasticsearch elasticsearch

# Download and install Elasticsearch 2.2.0
ENV ES_VERSION=2.2.0
WORKDIR /usr/share/elasticsearch

RUN curl -fsSL https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-${ES_VERSION}.tar.gz | \
    tar -xzf - --strip-components=1 && \
    mkdir -p /usr/share/elasticsearch/data && \
    mkdir -p /usr/share/elasticsearch/logs && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch

# Set environment variables
ENV ES_JAVA_OPTS="-Xms512m -Xmx512m"
ENV PATH="/usr/share/elasticsearch/bin:${PATH}"

# Copy configuration
COPY elasticsearch.yml /usr/share/elasticsearch/config/
COPY logging.yml /usr/share/elasticsearch/config/

# Create data and logs directories
VOLUME ["/usr/share/elasticsearch/data", "/usr/share/elasticsearch/logs"]

# Expose ports
EXPOSE 9200 9300

# Switch to elasticsearch user
USER elasticsearch

# Start Elasticsearch
CMD ["elasticsearch"]
