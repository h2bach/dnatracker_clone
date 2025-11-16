var fs = require("fs");
var Q = require("q");
var os = require("os");
var path = require("path");
var runCommand = require("../../app/libs/common.js").runCommand;
//var exec = require('child_process').exec;

var MusclePath = function () {
    var map = {
        x64: 64,
        ia32: 32
    };

    if (os.platform() == "win32") {
        return __dirname + "/bin_2/muscle.exe";
    } else if (os.platform() == "linux") {
        console.log(__dirname + "/bin_2/muscle-linux32");
        return __dirname + "/bin_2/muscle-linux32";
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
        var commandPromise;

        var inputCmd = function (input) {
            return {
                exec: execPath,
                args: input
            };
        }(input);

        // Cleanup function for files
        var cleanupFiles = function() {
            try {
                if (inputCmd.args && inputCmd.args["-in"]) {
                    fs.unlinkSync(inputCmd.args["-in"]);
                }
                if (options.deleteAfterRun && options.getData) {
                    options.getData.forEach(function (file) {
                        if (fs.existsSync(file)) {
                            fs.unlinkSync(file);
                        }
                    });
                }
            } catch (err) {
                console.warn("Warning: Error during file cleanup:", err.message);
            }
        };

        commandPromise = runCommand(inputCmd, 60000); // 60 second timeout for muscle
        commandPromise.then(function (a) {
            var returnData = (function () {
                var data = {};
                if (options.getData) {
                    options.getData.forEach(function (file) {
                        if (fs.existsSync(file)) {
                            data[path.extname(file).replace(".", "")] = fs.readFileSync(file).toString();
                        }
                    });
                }
                return data;
            })();
            
            // Clean up files after successful execution
            cleanupFiles();
            defer.resolve(returnData);
        }, function (b) {
            // Clean up files even if execution failed
            cleanupFiles();
            defer.reject(b);
        });

        // Add cleanup method to the promise
        defer.promise.cancel = function() {
            if (commandPromise && commandPromise.cancel) {
                commandPromise.cancel();
            }
            cleanupFiles();
            defer.reject("Muscle operation cancelled");
        };

        return defer.promise;
    }
};

module.exports = muscle;
