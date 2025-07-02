# DNA Tracker - Docker Setup

## Hướng dẫn chạy với Docker

### 1. Build và khởi động các services

```bash
# Build và khởi động tất cả services
docker compose up -d --build

# Hoặc chỉ khởi động (nếu đã build trước đó)
docker compose up -d
```

### 2. Kiểm tra trạng thái services

```bash
# Kiểm tra trạng thái
docker compose ps

# Xem logs
docker compose logs -f dnatracker
docker compose logs -f elasticsearch
docker compose logs -f mongodb
```

### 3. Khôi phục dữ liệu (chạy một lần)

```bash
# Chạy service restore-data để khôi phục dữ liệu từ backup
docker compose --profile restore run --rm restore-data
```

### 4. Truy cập ứng dụng

- Giao diện người dùng: http://localhost:3000/
- Giao diện quản trị: http://localhost:3000/#/backend/login
  - Username: admin
  - Password: admin

### 5. Kiểm tra services

- MongoDB: mongodb://localhost:27017
- Elasticsearch: http://localhost:9200
- Elasticsearch cluster health: http://localhost:9200/_cluster/health

### 6. Dừng services

```bash
# Dừng tất cả services
docker compose down

# Dừng và xóa volumes (CẨN THẬN: sẽ mất dữ liệu)
docker compose down -v
```

## Cấu trúc Docker

- **Dockerfile**: Build image chính cho DNA Tracker application
- **docker/elasticsearch/**: Custom Elasticsearch 2.2.0 image
- **docker-compose.yml**: Định nghĩa tất cả services
- **.env**: Biến môi trường
- **docker-entrypoint.sh**: Script khởi động tự động tạo thư mục và đợi services

## Troubleshooting

### Nếu Elasticsearch không khởi động được:
```bash
# Kiểm tra logs
docker compose logs elasticsearch

# Restart elasticsearch
docker compose restart elasticsearch
```

### Nếu MongoDB connection failed:
```bash
# Kiểm tra MongoDB
docker compose logs mongodb

# Test connection
docker compose exec mongodb mongo --eval "db.adminCommand('ismaster')"
```

### Nếu cần reset hoàn toàn:
```bash
# Dừng và xóa tất cả
docker compose down -v --remove-orphans

# Xóa images (optional)
docker rmi dnatracker_clone-dnatracker dnatracker_clone-elasticsearch

# Build lại từ đầu
docker compose up -d --build
```
