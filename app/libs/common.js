var Q = require("q");

module.exports = {
    runCommand: function (cmd) {
        var defer = Q.defer();
        var exec = require('child_process').exec;
        var cmdString = cmd.exec;
        for (var key in cmd.args) {
            cmdString += " " + key + " " + cmd.args[key];
        }
        exec(cmdString, function (err, stdOut, stdErr) {
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
        return defer.promise;
    }
};