var fs = require("fs");
var Q = require("q");
var _ = require("lodash");
var Blastn = require("../libs/blast.js")().blastn;
var BlastCgi = require("../libs/ncbi-blast.cgi-wrapper").search;
var StaticConfig = require("../config/config.js");
var muscle = require("../libs/muscle/muscle.js");
var iqtree = require("../libs/iqtree.js");
var ufbootmp = require("../libs/ufboot-mp.js");

var fasta2json = require("fasta2json");
var shortid = require('shortid');

var genFastaFile = function (hits, qseq, inputFile) {
    var defer = Q.defer();
    var content = "";

    content += ">" + qseq.randomID + "\n";
    content += qseq.seq + "\n";

    hits.forEach(function (hit) {
        content += ">" + hit.description[0].accession + "\n";
        content += hit.hsps[0].hseq.replace(/-/g, "") + "\n";
    });

    fs.writeFileSync(inputFile, content);
    defer.resolve(content);
    return defer.promise;
};

var parseBlastnResult = function (output) {
    return JSON.parse(output).BlastOutput2[0].report.results.search;
};

var handleSuccessBlast = function (req, res) {
    return function (out) {
        res.jsonSuccess({
            queryInfo: req.queryInfo,
            method: req.query.method,
            report: parseBlastnResult(out)
        });
    };
};

var handleFailBlast = function (req, res) {
    return function (err) {
        res.jsonFail({
            queryInfo: req.queryInfo,
            method: req.query.method,
            report: err
        });
    }
};

var handleSuccessBlast2 = function (req, res) {
    return function (out) {
        var qseq = req.queryInfo.seq.replace(/ /g, "");
        var timeStamp = Date.now();
        var inputFile = "./tmp/fasta-neighbor_joining-" + timeStamp + ".fasta";
        var outFile = "./tmp/aligned_fasta-neighbor_joining-" + timeStamp + ".fasta";
        var treeFile = "./tmp/tree-neighbor_joining-" + timeStamp + ".newick";
        var blastnResult = parseBlastnResult(out);
        var hits = blastnResult.hits;

        var inputMuscle = {
            "-in": inputFile,
            "-out": outFile,
            "-tree1": treeFile,
            "-cluster": "neighborjoining"
        };

        var optionMuscle = {
            deleteAfterRun: true,
            getData: [outFile, treeFile]
        };

        if (hits.length > 1) {
            genFastaFile(hits, _.pick(req.queryInfo, ["randomID", "seq"]), inputFile)
                .then(muscle(inputMuscle, optionMuscle))
                .then(function (returnTree) {
                    res.jsonSuccess({
                        queryInfo: req.queryInfo,
                        method: req.query.method,
                        report: blastnResult,
                        tree: returnTree
                    })
                });
        } else {
            res.jsonFail({
                queryInfo: req.queryInfo,
                method: req.query.method,
                report: blastnResult,
                message: "Alignment must have at least 3 sequences"
            });
        }
    };
};

var handleSuccessBlast3 = function (req, res) {
    return function (out) {
        var qseq = req.queryInfo.seq.replace(/ /g, "");
        var timeStamp = Date.now();
        var inputFile = "./tmp/fasta-neighbor_joining-" + timeStamp + ".fasta";
        var outFile = "./tmp/aligned_fasta-neighbor_joining-" + timeStamp + ".fasta";
        var blastnResult = parseBlastnResult(out);
        var hits = blastnResult.hits;

        var inputMuscle = {
            "-in": inputFile,
            "-out": outFile
        };

        var optionMuscle = {
            deleteAfterRun: false,
            getData: [outFile]
        };

        if (hits.length > 1) {
            genFastaFile(hits, _.pick(req.queryInfo, ["randomID", "seq"]), inputFile)
                .then(muscle(inputMuscle, optionMuscle))
                .then(iqtree(outFile, true))
                .then(function (returnFasta) {
                    res.jsonSuccess({
                        queryInfo: req.queryInfo,
                        method: req.query.method,
                        report: blastnResult,
                        tree: {
                            newick: returnFasta
                        }
                    });
                });
        } else {
            res.jsonFail({
                queryInfo: req.queryInfo,
                method: req.query.method,
                report: blastnResult,
                message: "iqtree: Alignment must have at least 3 sequences"
            });
        }
    };
};

var handleSuccessBlast4 = function (req, res) {
    return function (out) {
        var qseq = req.queryInfo.seq.replace(/ /g, "");
        var timeStamp = Date.now();
        var inputFile = "./tmp/fasta-mp-" + timeStamp + ".fasta";
        var outFile = "./tmp/aligned_fasta-mp-" + timeStamp + ".phy";
        var blastnResult = parseBlastnResult(out);
        var hits = blastnResult.hits;

        var inputMuscle = {
            "-in": inputFile,
            "-phyiout": outFile
        };

        var optionMuscle = {
            deleteAfterRun: false,
            getData: [outFile]
        };

        if (hits.length > 1) {
            genFastaFile(hits, _.pick(req.queryInfo, ["randomID", "seq"]), inputFile)
                .then(muscle(inputMuscle, optionMuscle))
                .then(ufbootmp(outFile, true))
                .then(function (returnFasta) {
                    res.jsonSuccess({
                        queryInfo: req.queryInfo,
                        method: req.query.method,
                        report: blastnResult,
                        tree: {
                            newick: returnFasta
                        }
                    });
                });
        } else {
            res.jsonFail({
                queryInfo: req.queryInfo,
                method: req.query.method,
                report: blastnResult,
                message: "ufboot-mp: Alignment must have at least 3 sequences"
            });
        }
    };
};

function getFileContent(req) {
    var pathFile = req.file.destination + "/" + req.file.filename;
    var content = fs.readFileSync(pathFile).toString();
    fs.unlink(pathFile);
    return content;
}

var getQueryInfo = function (req) {
    var returnInfo = {
        title: "",
        seq: "",
        method: req.query.method,
	    typeGen: req.query.type_gen,
        submitTime: Date.now(),
        randomID: shortid.generate()
    };

    if (req.query.type == "text") {
        returnInfo.title = req.body.title.length > 0 ? req.body.title : "Chuỗi cần tìm";
        returnInfo.seq = (req.body.text || req.body.seq).replace(/[\?\-X]/g, "");
    } else if (req.query.type == "file" && req.file) {
        var json = fasta2json.ParseFasta(getFileContent(req));
        if (json.length == 0) return null;
        returnInfo.title = json[0].head;
        returnInfo.seq = json[0].seq.replace(/[\?\-X]/g, "");
    } else {
        return null
    }

    return returnInfo;
};

var searchFunctions = function (req, res, blastFunc) {

    req.queryInfo = getQueryInfo(req);

    if (req.queryInfo == null) {
        throw "input error or wrong format";
    }

    var blastn = blastFunc(req.queryInfo.seq);

    return {
        blast: function () {
            blastn.then(handleSuccessBlast(req, res), handleFailBlast(req, res));
        },
        phylogenetic_distance: function () {
            blastn.then(handleSuccessBlast2(req, res), handleFailBlast(req, res));
        },
        maximum_likelihood: function () {
            blastn.then(handleSuccessBlast3(req, res), handleFailBlast(req, res));
        },
        maximum_parsimony: function () {
            blastn.then(handleSuccessBlast4(req, res), handleFailBlast(req, res));
        }
    };
};

module.exports = [
    {
        method: "post",
        path: "/search",
        middlewares: {
            "config-upload": ["fasta", "single", StaticConfig.upload.fasta]
        },
        handler: function searchDna(req, res) {

            var getBlastDB = function (typeGen) {
                if (typeGen == "COI") {
                    return StaticConfig.blast_coi;
                }
                return StaticConfig.blast_cytoB;
            };

            try {
                searchFunctions(req, res, function (seq) {
                    return Blastn(seq, getBlastDB(req.query.type_gen));
                })[req.query.method]();
            } catch (e) {
                res.jsonFail({
                    method: req.query.method,
                    report: e.toString()
                });
            }
        }
    }

    // TODO: redo the search via ncbi -> auto jump to blast page of ncbi
    ,{
        method: "post",
        path: "/search-via-ncbi",
        middlewares: {
            "config-upload": ["fasta", "single", StaticConfig.upload.fasta]
        },
        handler: function searchDna(req, res) {
            try {
                req.queryInfo = getQueryInfo(req);

                if (req.queryInfo == null) {
                    throw "input error or wrong format";
                }
                BlastCgi(req.queryInfo.seq).then(function (resultUrl) {
                    res.jsonSuccess({url: resultUrl});
                })
            } catch (e) {
                res.jsonFail({
                    method: req.query.method,
                    report: e.toString()
                });
            }
        }
    }
];
