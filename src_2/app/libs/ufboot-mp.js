var fs = require("fs");
var Q = require("q");
var runCommand = require("./common.js").runCommand;

var ufbootmp = function (inputFile, deleteAfterRun) {
	var result = inputFile + ".treefile";
	var outfiles = [
		inputFile + ".parstree",
		inputFile + ".ufbootmp",
		inputFile + ".log",
		result
	];
	var inputCmd = {
		exec: "ufbootmp",
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

module.exports = ufbootmp;