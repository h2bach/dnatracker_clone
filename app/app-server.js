var fs = require("fs-extra");
var express = require("express");
var mongoose = require("mongoose");
var upDateBlastDb = require("./libs/common-tasks").upDateBlastDb;
var _ = require("lodash");
var Q = require("q");
var path = require("path");
var FolderChecker = require('./utils/folder-checker.js');

var Species = require('./models/species');
var config = require("./config/config.js");

var dbUri = "mongodb://localhost:27017/test";
console.log(dbUri)

module.exports = {
    initServer: function () {
        var initDeferred = Q.defer();
        console.log("Init Server...");

        // Khởi tạo thư mục cần thiết
        FolderChecker.initializeFolders()
            .then(function() {
                return mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
            })
            .then(() => {
                console.log("Database connected successfully");
                return upDateBlastDb();
            })
            .then(() => {
                console.log("done");
                mongoose.connection.close();
                initDeferred.resolve();
            })
            .catch((err) => {
                console.log('error', err);
                mongoose.connection.close();
                initDeferred.reject(err);
            });

        return initDeferred.promise;
    },
    startServer: function () {
        console.log('Server start');
        
        // Khởi tạo thư mục cần thiết trước khi khởi động server
        FolderChecker.initializeFolders()
            .then(function() {
                return mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
            })
            .then(() => {
                console.log("Database connected successfully");
                var app = express();
                var port = process.env.PORT || config.env[process.env.NODE_ENV || "dev"].port;

                require("./config/express.js")(app);
                require("./config/router.js")(app);

                app.listen(port, function () {
                    console.log('Server run on port', port);
                });
            })
            .catch((err) => {
                console.error("Database connection error:", err);
            });
    }
};
