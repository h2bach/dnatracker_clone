FROM ubuntu:22.04

WORKDIR /app

# Không hỏi khi cài đặt
ENV DEBIAN_FRONTEND=noninteractive

# Đảm bảo shell là bash
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Cài đặt các gói cần thiết
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 871920D1991BC93C

RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    wget \
    openjdk-8-jdk \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Node.js 22.x và npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Copy package.json và package-lock.json trước để cache layer cài đặt
COPY package*.json ./

# Cài đặt dependencies Node.js
RUN npm install

# Copy toàn bộ source code vào image
COPY . .

# Thiết lập quyền thực thi cho các tools
RUN find ./opt -name "*.sh" -exec chmod +x {} \; || true
RUN find ./opt -type d -name "bin" -exec chmod -R +x {}/\* \; || true

# Thiết lập biến môi trường cho các tool ngoài
ENV EXTERN_TOOLS_DIR=/app/opt
ENV PATH=$EXTERN_TOOLS_DIR/elasticsearch-2.2.0/bin:$EXTERN_TOOLS_DIR/iqtree-2.4.0-Linux-intel/bin:$EXTERN_TOOLS_DIR/ufbootmp-sse-1.0.0-Linux/bin:$EXTERN_TOOLS_DIR/ncbi-blast-2.3.0+/bin:$EXTERN_TOOLS_DIR/muscle/bin_2:$PATH

# Tạo các thư mục cần thiết
RUN mkdir -p tmp uploads/img db backup eslogs

# Copy và set permission cho entrypoint script  
COPY docker-entrypoint.sh /usr/local/bin/
RUN ls -l /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# Copy script restore-data.sh cho service restore-data
COPY restore-data.sh /usr/local/bin/restore-data.sh
RUN chmod +x /usr/local/bin/restore-data.sh
# Expose port cho app Node.js
EXPOSE 3000

# Lệnh khởi động ứng dụng
# ENTRYPOINT ["docker-entrypoint.sh"]
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]