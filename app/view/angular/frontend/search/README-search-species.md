# Search Species với User Role Check

Tính năng này cho phép ẩn/hiện nút "Cập nhật Loài" dựa trên vai trò của người dùng.

## Cách hoạt động

### 1. Kiểm tra quyền
- Nút "Cập nhật Loài" chỉ hiển thị cho user có role `admin` hoặc `curator`
- User chưa đăng nhập hoặc có role khác sẽ không thấy nút này

### 2. Controller Logic
```javascript
// Kiểm tra xem user có quyền admin hoặc curator không
$scope.canUpdateSpecies = function() {
    return UserRole.isAdmin() || UserRole.isCurator();
};
```

### 3. Template Logic
```html
<!-- Nút "Cập nhật Loài" chỉ hiển thị cho admin và curator -->
<div ng-if="canUpdateSpecies()">
    <a href="#/update-species" class="btn btn-success btn-xl">
        <i class="fa fa-plus"></i> Cập nhật Loài
    </a>
</div>
```

## Các trường hợp

### User chưa đăng nhập
- Nút "Cập nhật Loài" sẽ bị ẩn
- Chỉ hiển thị nút "Tìm kiếm"

### User có role `curator`
- Nút "Cập nhật Loài" sẽ hiển thị
- Có thể thêm/sửa thông tin loài

### User có role `admin`
- Nút "Cập nhật Loài" sẽ hiển thị
- Có toàn quyền quản lý hệ thống

### User có role khác
- Nút "Cập nhật Loài" sẽ bị ẩn
- Chỉ có thể xem thông tin

## Debug Mode

Để bật debug mode và xem thông tin user:

1. Mở file `search-species.html`
2. Uncomment phần debug info:
```html
<!-- Debug info - có thể ẩn trong production bằng cách comment phần này -->
<div class="container" style="margin-top: 10px; margin-bottom: 10px;" ng-if="userStatus">
    <div class="alert alert-info" style="font-size: 12px;">
        <strong>Debug Info:</strong> 
        Đăng nhập: {{userStatus.isLoggedIn ? 'Có' : 'Không'}} | 
        Role: {{userStatus.role || 'Không có'}} | 
        Có thể cập nhật loài: {{canUpdateSpecies() ? 'Có' : 'Không'}}
        <span ng-if="userStatus.user"> | User: {{userStatus.user.username}}</span>
    </div>
</div>
```

## Dependencies

Module này sử dụng:
- `dna-tracker.common.user-role` - Service kiểm tra vai trò user
- `dna-tracker.api.security` - API authentication

## API Endpoints

- `GET /api/check-user` - Kiểm tra trạng thái user hiện tại
- `GET /api/check-token` - Kiểm tra token hợp lệ

## Lưu ý

1. Hệ thống sẽ tự động kiểm tra trạng thái user khi trang được load
2. Nếu user đăng nhập sau khi đã mở trang, cần refresh để cập nhật
3. Token được lưu trong `sessionStorage` và tự động gửi trong header Authorization
4. Debug info nên được ẩn trong production environment 