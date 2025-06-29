var _ = require("lodash");
var shortid = require('shortid');
var Users = require('../models/user.js');
var UserChecker = require('../utils/user-checker.js');

module.exports = [
    {
        method: "get",
        path: "/users",
        handler: function getAllUser(req, res) {
            Users
                .find({})
                .select("_id username email role")
                .exec()
                .then(function (results) {
                    res.jsonSuccess(results);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }

    },
    {
        method: "get",
        path: "/users/:user_id",
        handler: function getOneUserById(req, res) {
            Users.findOne({_id: req.params.user_id})
                .then(function (result) {
                    res.jsonSuccess(result);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }
    },
    {
        method: "post",
        path: "/users",
        role: "admin",
        handler: function createOneUser(req, res) {
            req.body.password = shortid.generate();
            Users.create(req.body)
                .then(function (result) {
                    var new_user = _.pick(result, "username email role admin _id".split(" "));
                    new_user.password = req.body.password;
                    res.jsonSuccess(new_user);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }
    },
    {
        method: "put",
        path: "/users/:user_id",
        role: "admin",
        handler: function updateOneUser(req, res) {
            Users.findOneAndUpdate({_id: req.params.user_id}, req.body, {new: true})
                .then(function (result) {
                    res.jsonSuccess(result);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }
    },
    {
        method: "delete",
        path: "/users/:user_id",
        role: "admin",
        handler: function deleteOneUser(req, res) {
            Users.findByIdAndDelete(req.params.user_id)
                .then(function (result) {
                    res.jsonSuccess(result);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }
    },
    {
        method: "get",
        path: "/users/current/info",
        handler: function getCurrentUserInfo(req, res) {
            // Sử dụng UserChecker để kiểm tra user hiện tại
            UserChecker.checkUserFromRequest(req)
                .then(function(result) {
                    if (result.isLoggedIn) {
                        res.jsonSuccess({
                            message: "Thông tin user hiện tại",
                            user: result.user,
                            role: result.role,
                            isAdmin: result.isAdmin,
                            isCurator: result.isCurator
                        });
                    } else {
                        res.jsonFail("Bạn chưa đăng nhập");
                    }
                })
                .catch(function(err) {
                    res.jsonFail("Lỗi khi lấy thông tin user: " + err.message);
                });
        }
    },
    {
        method: "get",
        path: "/users/current/permissions",
        handler: function getCurrentUserPermissions(req, res) {
            // Sử dụng UserChecker để kiểm tra quyền của user hiện tại
            UserChecker.checkUserFromRequest(req)
                .then(function(result) {
                    if (result.isLoggedIn) {
                        var permissions = {
                            canManageUsers: UserChecker.isAdmin(result.user),
                            canManageSpecies: UserChecker.isAdminOrCurator(result.user),
                            canViewAdminPanel: UserChecker.isAdmin(result.user),
                            canEditData: UserChecker.isAdminOrCurator(result.user),
                            canDeleteData: UserChecker.isAdmin(result.user)
                        };
                        
                        res.jsonSuccess({
                            message: "Quyền của user hiện tại",
                            user: result.user,
                            permissions: permissions
                        });
                    } else {
                        res.jsonFail("Bạn chưa đăng nhập");
                    }
                })
                .catch(function(err) {
                    res.jsonFail("Lỗi khi kiểm tra quyền: " + err.message);
                });
        }
    }
];