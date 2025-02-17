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
            })
        });
        return upload[type](name);
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
            if (err.name === 'UnauthorizedError') {
                res.jsonFail("UnauthorizedError");
            }
            if(req.user) {
                roles.indexOf(req.user.role) >= 0 ? next() : res.jsonFail("Access deny");
            } else {
                res.jsonFail("UnauthorizedError");
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
};
