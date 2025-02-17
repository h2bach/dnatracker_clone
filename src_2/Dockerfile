FROM ubuntu:16.04
WORKDIR /src

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get update && apt-get install -y -q --no-install-recommends \
        apt-transport-https \
        build-essential \
        ca-certificates \
        curl \
        git \
        libssl-dev \
        wget \
	openjdk-8-jdk \
    && rm -rf /var/lib/apt/lists/*

ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 6.16.0

RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.30.0/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
ENV EXTERN_TOOLS_DIR /src/opt

ENV PATH $EXTERN_TOOLS_DIR/elasticsearch-2.2.0/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/iqtree-1.3.13-Linux/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/ufbootmp-sse-1.0.0-Linux/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/ufbootmp-sse-1.0.0-Linux/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/ncbi-blast-2.3.0+/bin:$PATH

EXPOSE 3000
CMD ["node", "dna-tracker.js"]

COPY . .
