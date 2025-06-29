# User Checker Utility

Utility này cung cấp các hàm để kiểm tra trạng thái đăng nhập và vai trò của người dùng trong hệ thống DNA Tracker.

## Các hàm có sẵn

### 1. Backend (Node.js)

#### `checkUserFromToken(token)`
Kiểm tra trạng thái đăng nhập và vai trò của user từ JWT token.

**Tham số:**
- `token` (string): JWT token với format "Bearer <token>"

**Trả về:** Promise với object chứa:
```javascript
{
    isLoggedIn: boolean,
    user: {
        _id: string,
        username: string,
        role: string,
        admin: boolean,
        email: string
    },
    role: string,
    message: string,
    isAdmin: boolean,
    isCurator: boolean
}
```

#### `checkUserFromRequest(req)`
Kiểm tra user từ Express request object.

**Tham số:**
- `req` (Object): Express request object

**Trả về:** Promise với thông tin user (tương tự `checkUserFromToken`)

#### `isAdmin(user)`
Kiểm tra xem user có quyền admin không.

**Tham số:**
- `user` (Object): Thông tin user

**Trả về:** boolean

#### `isCurator(user)`
Kiểm tra xem user có quyền curator không.

**Tham số:**
- `user` (Object): Thông tin user

**Trả về:** boolean

#### `isAdminOrCurator(user)`
Kiểm tra xem user có quyền admin hoặc curator không.

**Tham số:**
- `user` (Object): Thông tin user

**Trả về:** boolean

### 2. Frontend (Angular)

#### `UserRole.checkUserStatus()`
Kiểm tra trạng thái user và cập nhật User service.

**Trả về:** Promise với thông tin user

#### `UserRole.isAdmin()`
Kiểm tra xem user hiện tại có quyền admin không.

**Trả về:** boolean

#### `UserRole.isCurator()`
Kiểm tra xem user hiện tại có quyền curator không.

**Trả về:** boolean

#### `UserRole.isLoggedIn()`
Kiểm tra xem user đã đăng nhập chưa.

**Trả về:** boolean

## Cách sử dụng

### Backend

```javascript
var UserChecker = require('../utils/user-checker.js');

// Trong controller
app.get('/api/check-user', function(req, res) {
    UserChecker.checkUserFromRequest(req)
        .then(function(result) {
            if (result.isLoggedIn) {
                console.log('User đã đăng nhập:', result.user.username);
                console.log('Role:', result.role);
                console.log('Là admin:', result.isAdmin);
            } else {
                console.log('User chưa đăng nhập');
            }
            res.jsonSuccess(result);
        })
        .catch(function(err) {
            res.jsonFail(err.message);
        });
});
```

### Frontend

```javascript
// Trong controller Angular
angular.module('myApp')
.controller('MyController', function($scope, UserRole) {
    
    // Kiểm tra trạng thái user
    UserRole.checkUserStatus().then(function(result) {
        console.log('Trạng thái user:', result);
    });
    
    // Kiểm tra quyền
    if (UserRole.isAdmin()) {
        console.log('User là admin');
    }
    
    if (UserRole.isCurator()) {
        console.log('User là curator');
    }
    
    if (UserRole.isLoggedIn()) {
        console.log('User đã đăng nhập');
    }
});
```

### Trong template HTML

```html
<!-- Hiển thị nội dung chỉ cho admin -->
<div ng-if="isAdmin()">
    <h3>Quản lý hệ thống (Chỉ Admin)</h3>
    <!-- Nội dung admin -->
</div>

<!-- Hiển thị nội dung cho admin và curator -->
<div ng-if="isRole('admin curator')">
    <h3>Quản lý dữ liệu (Admin & Curator)</h3>
    <!-- Nội dung admin/curator -->
</div>

<!-- Hiển thị nội dung cho user đã đăng nhập -->
<div ng-if="isLoggedIn()">
    <h3>Xin chào {{User.info.username}}</h3>
    <!-- Nội dung user -->
</div>
```

## API Endpoints

### GET `/api/check-user`
Kiểm tra trạng thái user hiện tại.

**Headers:**
- `Authorization: Bearer <token>` (tùy chọn)

**Response:**
```javascript
{
    "status": 1,
    "data": {
        "isLoggedIn": true,
        "user": {
            "_id": "user_id",
            "username": "admin",
            "role": "admin",
            "admin": true,
            "email": "admin@example.com"
        },
        "role": "admin",
        "message": "Đã đăng nhập thành công",
        "isAdmin": true,
        "isCurator": false
    }
}
```

### GET `/api/users/current/info`
Lấy thông tin chi tiết của user hiện tại.

### GET `/api/users/current/permissions`
Lấy danh sách quyền của user hiện tại.

## Lưu ý

1. Tất cả các hàm đều trả về Promise để xử lý bất đồng bộ
2. Token phải có format "Bearer <token>" trong header Authorization
3. User roles hiện tại: `admin`, `curator`
4. Frontend sẽ tự động cập nhật User service khi gọi `checkUserStatus()` 