#!/bin/bash

# Tạo các thư mục cần thiết
mkdir -p tmp uploads/img db backup eslogs

# Cấp quyền thực thi cho các tools
find ./opt -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
find ./opt -type d -name "bin" -exec chmod -R +x {}/* \; 2>/dev/null || true

# Khởi động ứng dụng
exec node dna-tracker.js
