# Upload Troubleshooting Guide

Hướng dẫn xử lý các lỗi liên quan đến upload file trong hệ thống DNA Tracker.

## Lỗi thường gặp

### 1. Lỗi ENOENT: no such file or directory

**Lỗi:**
```
Error: ENOENT: no such file or directory, open 'F:\DNATracker\dnatracker_2\dnatracker_clone\uploads\img\img-1751163523896.jpg'
Cannot add image to db
```

**Nguyên nhân:**
- Thư mục `uploads/img` không tồn tại
- Không có quyền ghi vào thư mục
- Đường dẫn không chính xác

**Cách khắc phục:**

#### Tự động (Khuyến nghị):
1. Khởi động lại server - hệ thống sẽ tự động tạo thư mục
2. Hoặc chạy lệnh khởi tạo:
```bash
node dna-tracker.js init
```

#### Thủ công:
1. Tạo thư mục thủ công:
```bash
mkdir -p uploads/img
mkdir -p tmp
```

2. Kiểm tra quyền ghi:
```bash
# Windows
icacls uploads /grant Everyone:F

# Linux/Mac
chmod -R 755 uploads
```

### 2. Lỗi quyền truy cập

**Lỗi:**
```
Error: EACCES: permission denied
```

**Cách khắc phục:**
1. Chạy với quyền admin (Windows)
2. Hoặc thay đổi quyền thư mục:
```bash
# Windows (PowerShell với quyền Admin)
Set-Acl -Path "uploads" -AclObject (Get-Acl -Path "uploads")

# Linux/Mac
sudo chown -R $USER:$USER uploads
chmod -R 755 uploads
```

### 3. Lỗi disk space

**Lỗi:**
```
Error: ENOSPC: no space left on device
```

**Cách khắc phục:**
1. Kiểm tra dung lượng ổ đĩa
2. Xóa file tạm trong thư mục `tmp`
3. Xóa file ảnh không cần thiết trong `uploads/img`

## Cấu trúc thư mục

```
dnatracker_clone/
├── uploads/
│   └── img/          # Thư mục lưu ảnh loài
├── tmp/              # Thư mục file tạm
└── ...
```

## Kiểm tra trạng thái

### 1. Kiểm tra thư mục tồn tại:
```javascript
const fs = require('fs-extra');
const path = require('path');

// Kiểm tra thư mục uploads/img
const uploadPath = './uploads/img';
if (fs.existsSync(uploadPath)) {
    console.log('✓ Thư mục uploads/img tồn tại');
} else {
    console.log('✗ Thư mục uploads/img không tồn tại');
}
```

### 2. Kiểm tra quyền ghi:
```javascript
const fs = require('fs-extra');
const path = require('path');

function testWritePermission(folderPath) {
    try {
        const testFile = path.join(folderPath, 'test-' + Date.now() + '.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('✓ Có quyền ghi:', folderPath);
        return true;
    } catch (err) {
        console.log('✗ Không có quyền ghi:', folderPath, err.message);
        return false;
    }
}

testWritePermission('./uploads/img');
```

## Cấu hình upload

### File config.js:
```javascript
upload: {
    image: {
        staticFolder: "/species-image",
        location: './uploads/img',
        fileName: function (file) {
            return "img-" + Date.now() + path.extname(file.originalname);
        }
    }
}
```

### Middleware multer:
```javascript
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/img');
    },
    filename: function (req, file, cb) {
        cb(null, 'img-' + Date.now() + path.extname(file.originalname));
    }
});
```

## Debug upload

### 1. Thêm log chi tiết:
```javascript
// Trong species-controller.js
handler: function createSpecies(req, res) {
    console.log("=== DEBUG UPLOAD ===");
    console.log("Files:", req.files);
    console.log("Upload path:", StaticConfig.upload.image.location);
    console.log("Upload path exists:", fs.existsSync(StaticConfig.upload.image.location));
    
    // ... rest of the code
}
```

### 2. Kiểm tra middleware:
```javascript
// Trong express.js
app.middlewares.set("config-upload", function configUpload(name, type, options) {
    console.log("=== DEBUG UPLOAD MIDDLEWARE ===");
    console.log("Name:", name);
    console.log("Type:", type);
    console.log("Options:", options);
    
    // ... rest of the code
});
```

## Lưu ý quan trọng

1. **Thư mục uploads được ignore trong git** - không commit file ảnh
2. **Backup thường xuyên** - file ảnh quan trọng nên được backup
3. **Giới hạn kích thước file** - cấu hình trong multer nếu cần
4. **Validate file type** - chỉ cho phép ảnh (jpg, png, gif)

## Liên hệ hỗ trợ

Nếu vẫn gặp lỗi, vui lòng:
1. Kiểm tra log server
2. Chụp màn hình lỗi
3. Cung cấp thông tin hệ thống (OS, Node.js version)
4. Liên hệ admin để được hỗ trợ 