var fs = require("fs");
var Q = require("q");
var runCommand = require("./common.js").runCommand;

var iqtree = function (inputFile, deleteAfterRun) {
    var result = inputFile + ".treefile";
    var outfiles = [
        inputFile + ".iqtree",
        inputFile + ".bionj",
        inputFile + ".mldist",
        inputFile + ".log",
        result
    ];
    var inputCmd = {
        exec: "iqtree",
        args: {
            "-s": inputFile
        }
    };
    return function () {
        var defer = Q.defer();
        runCommand(inputCmd).then(function (stdOut) {
            var returnTree = fs.readFileSync(result).toString();
            if(deleteAfterRun) {
                outfiles.forEach(function (file) {
                    fs.unlink(file);
                });
            }
            fs.unlink(inputFile);
            defer.resolve(returnTree);
        }, function (stdErr) {
            defer.reject(stdErr);
        });
        return defer.promise;
    }
};

module.exports = iqtree;