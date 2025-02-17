var _ = require("lodash");
var shortid = require('shortid');
var Users = require('../models/user.js');

module.exports = [
    {
        method: "get",
        path: "/users",
        handler: function getAllUser(req, res) {
            Users
                .find({})
                .select("_id username email role")
                .exec(function (err, results) {
                    if (!err) {
                        res.jsonSuccess(results);
                    } else {
                        res.jsonFail(err);
                    }
                });
        }

    },
    {
        method: "get",
        path: "/users/:user_id",
        handler: function getOneUserById(req, res) {
            Users.findOne({_id: req.params.user_id}, function (err, result) {
                if (!err) {
                    res.jsonSuccess(result);
                } else {
                    res.jsonFail(err);
                }
            })
        }
    },
    {
        method: "post",
        path: "/users",
        role: "admin",
        handler: function createOneUser(req, res) {
            req.body.password = shortid.generate();
            Users.create(req.body, function (err, result) {
                if (!err) {
                    var new_user = _.pick(result, "username email role admin _id".split(" "));
                    new_user.password = req.body.password;
                    res.jsonSuccess(new_user);
                } else {
                    res.jsonFail(err);
                }
            });
        }
    },
    {
        method: "put",
        path: "/users/:user_id",
        role: "admin",
        handler: function updateOneUser(req, res) {
            Users.findOneAndUpdate({_id: req.params.user_id}, req.body, {new: true}, function (err, result) {
                if (!err) {
                    res.jsonSuccess(result);
                } else {
                    res.jsonFail(err);
                }
            });
        }
    },
    {
        method: "delete",
        path: "/users/:user_id",
        role: "admin",
        handler: function deleteOneUser(req, res) {
            Users.findByIdAndRemove(req.params.user_id, function (err, result) {
                if (!err) {
                    res.jsonSuccess(result);
                } else {
                    res.jsonFail(err);
                }
            });
        }
    }
];