var fs = require('fs');
var _ = require('lodash');
var Q = require("q");
var runCommand = require("./common.js").runCommand;

var Blast = function (options) {
    var blastOption = {
        folderInput: "./tmp/"
    };

    if (!fs.existsSync(blastOption.folderInput)) {
        fs.mkdirSync(blastOption.folderInput);
    }

    return {
        blastn: function (query, options) {
            var defer = Q.defer();

            var inputCmd = {
                exec: "blastn",
                args: {
                    "-db": "",
                    "-query": ""
                }
            };

            inputCmd.args = _.assign(inputCmd.args, options);

            var newFile = blastOption.folderInput + "text-" + Date.now() + ".txt";
            fs.writeFileSync(newFile, query);
            inputCmd.args["-query"] = newFile;

            var handleAfterExec = function () {
                fs.unlinkSync(inputCmd.args["-query"]);
            };

            // Log lệnh blastn thực thi
            var cmdString = inputCmd.exec;
            for (var key in inputCmd.args) {
                cmdString += " " + key + " " + inputCmd.args[key];
            }
            console.log("[Blast] Lệnh thực thi:", cmdString);

            runCommand(inputCmd).then(function (stdOut) {
                handleAfterExec();
                defer.resolve(stdOut);
            }, function (stdErr) {
                handleAfterExec();
                defer.reject(stdErr);
            });
            return defer.promise;
        },
        MakeBlastDB: function (options) {
            var defer = Q.defer();
            var inputCmd = {
                exec: "makeblastdb",
                args: {
                    "-in": "",
                    "-dbtype": "",
                    "-out": "",
                    "-title": ""
                }
            };
            inputCmd.args = _.assign(inputCmd.args, options);
            runCommand(inputCmd).then(function (stdOut) {
                console.log('MakeBlastDB done', inputCmd);
                defer.resolve(stdOut);
            }, function (stdErr) {
                console.log('MakeBlastDB err', inputCmd);
                defer.reject(stdErr);
            });
            return defer.promise;
        }
    };
};

module.exports = Blast;
