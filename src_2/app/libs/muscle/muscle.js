var fs = require("fs");
var Q = require("q");
var os = require("os");
var path = require("path");
var runCommand = require("../common.js").runCommand;
//var exec = require('child_process').exec;

var MusclePath = function () {
    var map = {
        x64: 64,
        ia32: 32
    };

    if (os.platform() == "win32") {
        return __dirname + "/bin/muscle.exe";
    } else if (os.platform() == "linux") {
        return __dirname + "/bin/muscle-linux" + map[os.arch()];
    }
};

var muscle = function (input, inputOptions) {
    return function () {
        var defer = Q.defer();
        var execPath = MusclePath();
        var options = inputOptions || {
                deleteAfterRun: false,
                getData: []
            };

        var inputCmd = function (input) {
            return {
                exec: execPath,
                args: input
            };
        }(input);


        runCommand(inputCmd).then(function (a) {
            var returnData = (function () {
                var data = {};
                options.getData.forEach(function (file) {
                    data[path.extname(file).replace(".", "")] = fs.readFileSync(file).toString();
                });
                return data;
            })();
            fs.unlink(inputCmd.args["-in"]);
            if (options.deleteAfterRun) {
                options.getData.forEach(function (file) {
                    fs.unlink(file);
                });
            }
            defer.resolve(returnData);
        }, function (b) {
            defer.reject(b);
        });
        return defer.promise;
    }
};

module.exports = muscle;
