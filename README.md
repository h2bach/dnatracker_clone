# Biodiversity Vietnam

## Giới thiệu

**Biodiversity Vietnam** là hệ thống web phục vụ nhận diện, tra cứu, quản lý dữ liệu về các loài động vật có xương sống đặc hữu, nguy cấp, quý hiếm ở khu vực Đông Dương (Việt Nam, Lào, Campuchia). Hệ thống hỗ trợ các nhà khoa học, quản lý, cơ quan chức năng trong công tác phân loại, nghiên cứu, bảo tồn ở nhiều cấp độ (hình thái, sinh thái, di truyền).

---

## Công nghệ sử dụng

### Backend:
- **Node.js** (>=14.x, Dockerfile cài Node 22.x)
- **Express.js**: Framework xây dựng RESTful API.
- **MongoDB**: Lưu trữ dữ liệu loài, người dùng, v.v.
- **Mongoose**: ORM cho MongoDB.
- **Elasticsearch**: Tìm kiếm nhanh dữ liệu loài.
- **JWT (jsonwebtoken, express-jwt)**: Xác thực và phân quyền người dùng.
- **Multer**: Xử lý upload file (ảnh, dữ liệu).
- **fs-extra**: Quản lý file/thư mục.
- **Q**: Xử lý Promise.
- **Lodash**: Tiện ích thao tác dữ liệu.
- **Các thư viện sinh học**: BLAST, IQ-TREE, MUSCLE, NCBI BLAST, v.v. (tích hợp qua thư mục `opt/`).

### Frontend:
- **AngularJS 1.x**: SPA cho cả backend (quản trị) và frontend (tra cứu).
- **Bootstrap, AdminLTE**: Giao diện quản trị, responsive.
- **jQuery**: Hỗ trợ thao tác DOM.
- **Các module Angular custom**: Quản lý user, phân quyền, API, giao diện tìm kiếm, upload file

### Khác:
- **Gulp**: Tự động hóa build, reload.
- **Các tool sinh học**: IQ-TREE, MUSCLE, NCBI BLAST, v.v. (tích hợp sẵn trong `opt/`).

---

## Cấu trúc thư mục

```
dnatracker_clone/
├── app/                 # Source code backend & frontend
│   ├── app-server.js    # Khởi tạo, chạy server
│   ├── config/          # Cấu hình express, router, middleware
│   ├── controllers/     # Xử lý API (species, user, search, security, ...)
│   ├── libs/            # Thư viện xử lý BLAST, IQ-TREE, MUSCLE, ...
│   ├── models/          # Mongoose models (species, user)
│   ├── utils/           # Tiện ích: kiểm tra folder, user, mapping, ...
│   └── view/            # Frontend AngularJS (SPA)
│       ├── angular/     # Toàn bộ mã nguồn AngularJS
│       │   ├── api/         # Giao tiếp API
│       │   ├── backend/     # Giao diện quản trị
│       │   ├── frontend/    # Giao diện tra cứu
│       │   ├── common/      # Module chung (role, theme, ...)
│       │   ├── search/      # Giao diện tìm kiếm
│       │   └── species-modal/ # Modal chi tiết loài
│       └── index.html   # Trang index chính
├── db/                  # Dữ liệu MongoDB, file FASTA, BLAST DB
├── backup/              # Backup dữ liệu, ảnh loài
├── public/              # Tài nguyên tĩnh (CSS, JS, ảnh)
├── opt/                 # Tool sinh học tích hợp (elasticsearch, iqtree, muscle, blast, ...)
├── Dockerfile           # Đóng gói Docker
├── docker-compose.yml   # (nếu có) Triển khai nhiều service
├── dna-tracker.js       # Điểm vào chính của app
├── package.json         # Thông tin, dependencies Node.js
└── README.md            # Hướng dẫn sử dụng (file này)
```

---

## Chức năng chính

- **Quản lý loài**: Thêm, sửa, xóa, tìm kiếm, upload ảnh, dữ liệu di truyền.
- **Tìm kiếm DNA/loài**: Tìm kiếm theo chuỗi DNA (BLAST), theo tên, đặc điểm, v.v.
- **Quản lý người dùng**: Đăng nhập, phân quyền (admin, curator), kiểm tra trạng thái.
- **Upload dữ liệu**: Ảnh, file CSV, dữ liệu FASTA.
- **Tích hợp công cụ sinh học**: BLAST, IQ-TREE, MUSCLE, v.v. để phân tích, so sánh chuỗi.
- **Giao diện quản trị & tra cứu**: Phân tách rõ ràng backend (admin) và frontend (người dùng).

---

## Hướng dẫn cài đặt & chạy

### Yêu cầu:
- Node.js (Hiện đang sử dụng NodeJS v22.4.0)
- MongoDB (Hiện đang sử dụng MongoDB v8.0.5)
- Elasticsearch
- IQ-TREE, BLAST

### Chạy thủ công:
```bash
# Cài dependencies
npm i

# Chạy server trên Windows
node ./dna-tracker.js

# Elasticsearch trên Windows

./opt/elasticsearch-2.2.0/bin/elasticsearch

# Gulp task để recover DB:

cd tasks
gulp create-mapping-es # Sinh mapping cho ES
gulp create-db-from-backup # Import DB từ backup
gulp create-mock-db-users # User DB  
gulp update-species-images # Import lại ảnh cho species

```

### Truy cập:
- Giao diện người dùng: http://localhost:3000/
- Giao diện quản trị: http://localhost:3000/#/backend/login
Login: admin --- PW: admin

---

## Một số lưu ý

- Thư mục `uploads/` và `tmp/` phải tồn tại, có quyền ghi (tự động tạo khi chạy server).
- File ảnh, dữ liệu lớn không commit vào git.
- Backup dữ liệu thường xuyên (thư mục `backup/`).
- Thông tin cấu hình (port, db, jwt, ...) chỉnh trong `app/config/config.js`.

