/**
 * User Checker Utility
 * Cung cấp các hàm để kiểm tra trạng thái đăng nhập và vai trò của người dùng
 */

var jwt = require('jsonwebtoken');
var StaticConfig = require("../config/config.js");
var Users = require('../models/user.js');

/**
 * Kiểm tra trạng thái đăng nhập và vai trò của user từ token
 * @param {string} token - JWT token
 * @returns {Promise} Promise với thông tin user
 */
function checkUserFromToken(token) {
    return new Promise(function(resolve, reject) {
        if (!token || !token.startsWith('Bearer ')) {
            return resolve({
                isLoggedIn: false,
                user: null,
                role: null,
                message: "Chưa đăng nhập"
            });
        }
        
        // Lấy token từ header
        token = token.substring(7); // Bỏ "Bearer " prefix
        
        try {
            // Verify token
            var decoded = jwt.verify(token, StaticConfig.jwt_secret);
            
            // Kiểm tra xem user có tồn tại trong database không
            Users.findById(decoded._id)
                .select('username role admin _id email')
                .exec()
                .then(function(user) {
                    if (!user) {
                        return resolve({
                            isLoggedIn: false,
                            user: null,
                            role: null,
                            message: "Token không hợp lệ - User không tồn tại"
                        });
                    }
                    
                    // Trả về thông tin user
                    resolve({
                        isLoggedIn: true,
                        user: {
                            _id: user._id,
                            username: user.username,
                            role: user.role,
                            admin: user.admin,
                            email: user.email
                        },
                        role: user.role,
                        message: "Đã đăng nhập thành công",
                        isAdmin: user.role === 'admin',
                        isCurator: user.role === 'curator'
                    });
                })
                .catch(function(err) {
                    resolve({
                        isLoggedIn: false,
                        user: null,
                        role: null,
                        message: "Lỗi khi kiểm tra user: " + err.message
                    });
                });
                
        } catch (err) {
            resolve({
                isLoggedIn: false,
                user: null,
                role: null,
                message: "Token không hợp lệ: " + err.message
            });
        }
    });
}

/**
 * Kiểm tra xem user có quyền admin không
 * @param {Object} user - Thông tin user
 * @returns {boolean} true nếu là admin
 */
function isAdmin(user) {
    return user && user.role === 'admin';
}

/**
 * Kiểm tra xem user có quyền curator không
 * @param {Object} user - Thông tin user
 * @returns {boolean} true nếu là curator
 */
function isCurator(user) {
    return user && user.role === 'curator';
}

/**
 * Kiểm tra xem user có quyền admin hoặc curator không
 * @param {Object} user - Thông tin user
 * @returns {boolean} true nếu là admin hoặc curator
 */
function isAdminOrCurator(user) {
    return user && (user.role === 'admin' || user.role === 'curator');
}

/**
 * Middleware để kiểm tra user từ request
 * @param {Object} req - Express request object
 * @returns {Promise} Promise với thông tin user
 */
function checkUserFromRequest(req) {
    var token = req.headers.authorization;
    return checkUserFromToken(token);
}

module.exports = {
    checkUserFromToken: checkUserFromToken,
    checkUserFromRequest: checkUserFromRequest,
    isAdmin: isAdmin,
    isCurator: isCurator,
    isAdminOrCurator: isAdminOrCurator
}; 