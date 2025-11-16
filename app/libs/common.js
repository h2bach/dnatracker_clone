var Q = require("q");

module.exports = {
    runCommand: function (cmd, timeout) {
        timeout = timeout || 30000; // Default 30 seconds timeout
        var defer = Q.defer();
        var exec = require('child_process').exec;
        var cmdString = cmd.exec;
        for (var key in cmd.args) {
            cmdString += " " + key + " " + cmd.args[key];
        }
        
        var childProcess = exec(cmdString, { timeout: timeout }, function (err, stdOut, stdErr) {
            if (err) {
                // console.log("-----error-----");
                // console.log(err);
                defer.reject(stdErr);
            } else {
                // console.log("-----error-----");
                // console.log(stdErr);
                // console.log("-----out-----");
                // console.log(stdOut);
                var returnMessage = stdErr.length > 0 ? stdErr : stdOut;
                defer.resolve(returnMessage);
            }
        });

        // Add cleanup method to the promise
        defer.promise.cancel = function() {
            if (childProcess) {
                childProcess.kill();
            }
            defer.reject("Command cancelled");
        };

        return defer.promise;
    }
};