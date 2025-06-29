/**
 * Folder Checker Utility
 * Kiểm tra và tạo các thư mục cần thiết cho ứng dụng
 */

var fs = require('fs-extra');
var path = require('path');
var config = require('../config/config.js');

/**
 * Kiểm tra và tạo thư mục cần thiết
 * @param {string} folderPath - Đường dẫn thư mục
 * @returns {Promise} Promise với kết quả
 */
function ensureFolder(folderPath) {
    return new Promise(function(resolve, reject) {
        try {
            fs.ensureDirSync(folderPath);
            console.log("✓ Thư mục đã sẵn sàng:", folderPath);
            resolve(true);
        } catch (err) {
            console.error("✗ Lỗi tạo thư mục:", folderPath, err);
            reject(err);
        }
    });
}

/**
 * Kiểm tra và tạo tất cả thư mục cần thiết
 * @returns {Promise} Promise với kết quả
 */
function checkAndCreateFolders() {
    console.log("=== KIỂM TRA VÀ TẠO THƯ MỤC ===");
    
    var folders = [
        './uploads',
        './uploads/img',
        './tmp'
    ];
    
    // Thêm các thư mục từ config nếu có
    if (config.init_folder && Array.isArray(config.init_folder)) {
        folders = folders.concat(config.init_folder);
    }
    
    // Loại bỏ trùng lặp
    folders = [...new Set(folders)];
    
    var promises = folders.map(function(folderPath) {
        return ensureFolder(folderPath);
    });
    
    return Promise.all(promises);
}

/**
 * Kiểm tra quyền ghi vào thư mục
 * @param {string} folderPath - Đường dẫn thư mục
 * @returns {Promise} Promise với kết quả
 */
function checkWritePermission(folderPath) {
    return new Promise(function(resolve, reject) {
        try {
            var testFile = path.join(folderPath, 'test-' + Date.now() + '.tmp');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            console.log("✓ Quyền ghi OK:", folderPath);
            resolve(true);
        } catch (err) {
            console.error("✗ Không có quyền ghi:", folderPath, err);
            reject(err);
        }
    });
}

/**
 * Kiểm tra tất cả quyền ghi
 * @returns {Promise} Promise với kết quả
 */
function checkAllWritePermissions() {
    console.log("=== KIỂM TRA QUYỀN GHI ===");
    
    var folders = [
        './uploads/img',
        './tmp'
    ];
    
    var promises = folders.map(function(folderPath) {
        return checkWritePermission(folderPath);
    });
    
    return Promise.all(promises);
}

/**
 * Khởi tạo hoàn toàn hệ thống thư mục
 * @returns {Promise} Promise với kết quả
 */
function initializeFolders() {
    return checkAndCreateFolders()
        .then(function() {
            return checkAllWritePermissions();
        })
        .then(function() {
            console.log("=== HOÀN THÀNH KHỞI TẠO THƯ MỤC ===");
            return true;
        })
        .catch(function(err) {
            console.error("=== LỖI KHỞI TẠO THƯ MỤC ===", err);
            throw err;
        });
}

module.exports = {
    ensureFolder: ensureFolder,
    checkAndCreateFolders: checkAndCreateFolders,
    checkWritePermission: checkWritePermission,
    checkAllWritePermissions: checkAllWritePermissions,
    initializeFolders: initializeFolders
}; 