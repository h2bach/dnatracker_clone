var _ = require("lodash");
var jwt = require('jsonwebtoken');
var StaticConfig = require("../config/config.js");

var Users = require('../models/user.js');

var genToken = function (info) {
    return jwt.sign(info, StaticConfig.jwt_secret, {expiresIn: 3600 * 24});
};

module.exports = [
    {
        method: "post",
        path: "/authenticate",
        handler: function authenticate(req, res) {
            if (_.isEqual(req.body, StaticConfig.root_user)) {
                req.body.root = true;
                res.jsonSuccess({
                    message: "Login success",
                    token: genToken(req.body)
                });
            } else {
                var options = {
                    criteria: {username: req.body.username},
                    password: req.body.password,
                    select: 'username hashed_password salt role admin'
                };
                Users.authenticate(options, function (err, user) {
                    if (err) {
                        res.jsonFail(err.message);
                    } else {
                        res.jsonSuccess({
                            message: "Login success",
                            token: genToken(user),
                            user: user
                        });
                    }
                });
            }
        }
    },
    {
        method: "get",
        path: "/check-token",
        middlewares: {
            "need-login": []
        },
        handler: function checkToken(req, res) {
            res.jsonSuccess({
                message: "valid token",
                user: req.user
            });
        }
    },
    {
        method: "get",
        path: "/reset-password/:user_id",
        role: "admin",
        handler: function checkToken(req, res) {
            Users.resetPassword(req.params.user_id, function (err, newPassword) {
                res.jsonSuccess(newPassword);
            });
        }
    }

];