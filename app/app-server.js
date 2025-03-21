var fs = require("fs-extra");
var express = require("express");
var mongoose = require("mongoose");
var upDateBlastDb = require("./libs/common-tasks").upDateBlastDb;
var _ = require("lodash");
var Q = require("q");

var Species = require('./models/species');
var config = require("./config/config.js");

var dbUri = "mongodb://localhost:27017/test";
console.log(dbUri)
module.exports = {
    initServer: function () {
        var initDeferred = Q.defer();
        console.log("Init Server...");

        mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
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

        // check 2 folder uploads and tmp
        return initDeferred.promise;
    },
    startServer: function () {
        console.log('Server start');
        mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
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
