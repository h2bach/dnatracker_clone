var express = require('express');
var expressJwt = require('express-jwt');
var compression = require('compression');
var bodyParser = require('body-parser');
var multer = require('multer');
var _ = require('lodash');

var StaticConfig = require("./config");
var envConfig = StaticConfig.env[process.env.NODE_ENV || "dev"];
var jwt_secret = StaticConfig.jwt_secret;

module.exports = function (app) {
    require("./middlewares")(app);

    app.middlewares.set("config-upload", function configUpload(name, type, options) {
        var upload = multer({
            storage:  multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, options.location);
                },
                filename: function (req, file, cb) {
                    cb(null, options.fileName(file));
                }
            }),
            fileFilter: function (req, file, cb) {
                // Chấp nhận tất cả file
                cb(null, true);
            }
        });
        
        var middleware = upload[type](name);
        
        // Wrap middleware để xử lý lỗi
        return function(req, res, next) {
            middleware(req, res, function(err) {
                if (err instanceof multer.MulterError) {
                    console.error('Multer error in middleware:', err);
                    if (!res.headersSent) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            return res.status(413).json({
                                status: 0,
                                data: "File quá lớn"
                            });
                        } else if (err.code === 'LIMIT_FILE_COUNT') {
                            return res.status(413).json({
                                status: 0,
                                data: "Quá nhiều file"
                            });
                        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                            return res.status(400).json({
                                status: 0,
                                data: "Field name không đúng: " + err.field + ". Expected: " + name
                            });
                        } else {
                            return res.status(400).json({
                                status: 0,
                                data: "Lỗi upload file: " + err.message
                            });
                        }
                    }
                } else if (err) {
                    return next(err);
                } else {
                    next();
                }
            });
        };
    });

    app.use("/api", function(req, res, next) {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        next();
    } );

    app.use(function (req, res, next) {
        res.jsonSuccess = function (inputData) {
            res.json({
                status: 1,
                data: inputData
            });
        };
        res.jsonFail = function (inputData) {
            res.json({
                status: 0,
                data: inputData
            });
        };
        next();
    });

    app.middlewares.set("need-login", expressJwt({secret: jwt_secret}));
    app.middlewares.set("check-role", function checkRole(roles) {
        roles = roles.split(" ");
        if(roles.length == 0) return function (req, res, next) {
            next();
        };
        return function (err, req, res, next) {
            if (err && err.name === 'UnauthorizedError') {
                if (!res.headersSent) {
                    return res.jsonFail("UnauthorizedError");
                }
            }
            if(req.user) {
                roles.indexOf(req.user.role) >= 0 ? next() : (res.headersSent ? null : res.jsonFail("Access deny"));
            } else {
                if (!res.headersSent) {
                    res.jsonFail("UnauthorizedError");
                }
            }
        }
    });

    var longCache = function (req, res, next) {
        res.set("Cache-Control", "public, max-age=" + (24 * 60 * 60));
        next();
    };
    var forbid = function (req, res, next) {
        res.status(404).end();
    };

    app.use(compression());
    app.use("/api", bodyParser.json());

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(express.static(envConfig.staticFolder));
    app.use(express.static("./public"));
    app.use("/assets", longCache);
    app.use("/angular", longCache);

    app.use("/species-image", longCache, express.static("./uploads/img"));

    // Middleware xử lý lỗi chung
    app.use(function(err, req, res, next) {
        console.error('Error:', err);
        if (!res.headersSent) {
            if (err.name === 'UnauthorizedError') {
                res.status(401).json({
                    status: 0,
                    data: "UnauthorizedError"
                });
            } else {
                res.status(500).json({
                    status: 0,
                    data: "Internal Server Error: " + err.message
                });
            }
        }
    });
};
