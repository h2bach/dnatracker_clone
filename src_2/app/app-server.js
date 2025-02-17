var fs = require("fs-extra");
var express = require("express");
var mongoose = require("mongoose");
var upDateBlastDb = require("./libs/common-tasks").upDateBlastDb;
var _ = require("lodash");
var Q = require("q");

var Species = require('./models/species');
var config = require("./config/config.js");

var dbUri = process.env.MONGODB_URI;

module.exports = {
    initServer: function () {
        var initDeferred = Q.defer();
        console.log("Init Server...");

        var db = mongoose.connect(dbUri);

        var closeDbConnection = function () {
          db.connection.close(function (err) {
            initDeferred.resolve();
          });
        };

        upDateBlastDb().then(function () {
          console.log("done");
          closeDbConnection();
        }, function (a) {
          console.log('error', a);
          closeDbConnection();
        });

        // check 2 folder uploads and tmp
        return initDeferred.promise;
    },
    startServer: function () {
        console.log('Server start');
        mongoose.connect(dbUri);
        var app = express();
        var port = process.env.PORT || config.env[process.env.NODE_ENV || "dev"].port;

        require("./config/express.js")(app);
        require("./config/router.js")(app);

        app.listen(port, function () {
            console.log('Server run on port', port);
        });
    }
};
