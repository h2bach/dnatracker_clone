FROM ubuntu:22.04

WORKDIR /src

# Không hỏi khi cài đặt
ENV DEBIAN_FRONTEND=noninteractive

# Đảm bảo shell là bash
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Cài đặt các gói cần thiết
RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    wget \
    openjdk-8-jdk \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Node.js 22.x và npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Thiết lập biến môi trường cho các tool ngoài
ENV EXTERN_TOOLS_DIR /src/opt
ENV PATH $EXTERN_TOOLS_DIR/elasticsearch-2.2.0/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/iqtree-1.3.13-Linux/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/ufbootmp-sse-1.0.0-Linux/bin:$PATH
ENV PATH $EXTERN_TOOLS_DIR/ncbi-blast-2.3.0+/bin:$PATH

# Copy package.json và package-lock.json trước để cache layer cài đặt
COPY package*.json ./

# Cài đặt dependencies Node.js
RUN npm install --production

# Copy toàn bộ source code vào image
COPY . .

# Expose port cho app Node.js
EXPOSE 3000

# Lệnh khởi động ứng dụng
CMD ["node", "dna-tracker.js"]