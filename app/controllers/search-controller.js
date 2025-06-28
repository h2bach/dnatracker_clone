var fs = require("fs");
var Q = require("q");
var _ = require("lodash");
var Blastn = require("../libs/blast.js")().blastn;
var BlastCgi = require("../libs/ncbi-blast.cgi-wrapper").query;
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
        var report = parseBlastnResult(out);
        report.source = "local"; // Đánh dấu nguồn local
        
        res.jsonSuccess({
            queryInfo: req.queryInfo,
            method: req.query.method,
            report: report
        });
    };
};

var handleFailBlast = function (req, res) {
    return function (err) {
        // Thử fallback sang NCBI nếu local BLAST thất bại
        console.log("Local BLAST failed, trying NCBI fallback...");
        BlastCgi(req.queryInfo.seq).then(function (ncbiResult) {
            console.log("NCBI BLAST successful, found", ncbiResult.hits.length, "hits");
            ncbiResult.source = "ncbi"; // Đánh dấu nguồn NCBI
            // Gọi lại handler thành công với kết quả NCBI
            handleSuccessBlast(req, res)(ncbiResult);
        }).catch(function (ncbiErr) {
            console.log("NCBI BLAST also failed:", ncbiErr);
            res.jsonFail({
                queryInfo: req.queryInfo,
                method: req.query.method,
                report: "Both local and NCBI BLAST failed: " + err.toString()
            });
        });
    }
};

var handleFailBlastWithFallback = function (req, res, successHandler) {
    return function (err) {
        // Thử fallback sang NCBI nếu local BLAST thất bại
        console.log("Local BLAST failed, trying NCBI fallback...");
        BlastCgi(req.queryInfo.seq).then(function (ncbiResult) {
            console.log("NCBI BLAST successful, found", ncbiResult.hits.length, "hits");
            ncbiResult.source = "ncbi"; // Đánh dấu nguồn NCBI
            // Gọi lại handler thành công với kết quả NCBI
            successHandler(req, res)(ncbiResult);
        }).catch(function (ncbiErr) {
            console.log("NCBI BLAST also failed:", ncbiErr);
            res.jsonFail({
                queryInfo: req.queryInfo,
                method: req.query.method,
                report: "Both local and NCBI BLAST failed: " + err.toString()
            });
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
        blastnResult.source = "local"; // Đánh dấu nguồn local
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
        blastnResult.source = "local"; // Đánh dấu nguồn local
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
        blastnResult.source = "local"; // Đánh dấu nguồn local
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
    fs.unlinkSync(pathFile);
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
            blastn.then(handleSuccessBlast2(req, res), handleFailBlastWithFallback(req, res, handleSuccessBlast2));
        },
        maximum_likelihood: function () {
            blastn.then(handleSuccessBlast3(req, res), handleFailBlastWithFallback(req, res, handleSuccessBlast3));
        },
        maximum_parsimony: function () {
            blastn.then(handleSuccessBlast4(req, res), handleFailBlastWithFallback(req, res, handleSuccessBlast4));
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
                
                // Sử dụng hàm query mới để lấy dữ liệu đã parse
                BlastCgi(req.queryInfo.seq).then(function (ncbiResult) {
                    ncbiResult.source = "ncbi"; // Đánh dấu nguồn NCBI
                    
                    // Trả về kết quả tương tự như local BLAST
                    res.jsonSuccess({
                        queryInfo: req.queryInfo,
                        method: req.query.method,
                        report: ncbiResult
                    });
                }).catch(function(err) {
                    res.jsonFail({
                        method: req.query.method,
                        report: "NCBI BLAST failed: " + err.toString()
                    });
                });
            } catch (e) {
                res.jsonFail({
                    method: req.query.method,
                    report: e.toString()
                });
            }
        }
    },
    {
        method: "post",
        path: "/search-via-ncbi-phylogenetic",
        middlewares: {
            "config-upload": ["fasta", "single", StaticConfig.upload.fasta]
        },
        handler: function searchDnaPhylogenetic(req, res) {
            try {
                req.queryInfo = getQueryInfo(req);

                if (req.queryInfo == null) {
                    throw "input error or wrong format";
                }
                
                // Sử dụng NCBI BLAST trước, sau đó dựng cây
                BlastCgi(req.queryInfo.seq).then(function (ncbiResult) {
                    ncbiResult.source = "ncbi";
                    
                    if (ncbiResult.hits.length > 1) {
                        var qseq = req.queryInfo.seq.replace(/ /g, "");
                        var timeStamp = Date.now();
                        var inputFile = "./tmp/fasta-neighbor_joining-ncbi-" + timeStamp + ".fasta";
                        var outFile = "./tmp/aligned_fasta-neighbor_joining-ncbi-" + timeStamp + ".fasta";
                        var treeFile = "./tmp/tree-neighbor_joining-ncbi-" + timeStamp + ".newick";

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

                        genFastaFile(ncbiResult.hits, _.pick(req.queryInfo, ["randomID", "seq"]), inputFile)
                            .then(muscle(inputMuscle, optionMuscle))
                            .then(function (returnTree) {
                                res.jsonSuccess({
                                    queryInfo: req.queryInfo,
                                    method: req.query.method,
                                    report: ncbiResult,
                                    tree: returnTree
                                });
                            });
                    } else {
                        res.jsonFail({
                            queryInfo: req.queryInfo,
                            method: req.query.method,
                            report: ncbiResult,
                            message: "NCBI BLAST found less than 2 hits, cannot build phylogenetic tree"
                        });
                    }
                }).catch(function(err) {
                    res.jsonFail({
                        method: req.query.method,
                        report: "NCBI BLAST failed: " + err.toString()
                    });
                });
            } catch (e) {
                res.jsonFail({
                    method: req.query.method,
                    report: e.toString()
                });
            }
        }
    },
    {
        method: "post",
        path: "/search-via-ncbi-ml",
        middlewares: {
            "config-upload": ["fasta", "single", StaticConfig.upload.fasta]
        },
        handler: function searchDnaML(req, res) {
            try {
                req.queryInfo = getQueryInfo(req);

                if (req.queryInfo == null) {
                    throw "input error or wrong format";
                }
                
                // Sử dụng NCBI BLAST trước, sau đó dựng cây ML
                BlastCgi(req.queryInfo.seq).then(function (ncbiResult) {
                    ncbiResult.source = "ncbi";
                    
                    if (ncbiResult.hits.length > 1) {
                        var qseq = req.queryInfo.seq.replace(/ /g, "");
                        var timeStamp = Date.now();
                        var inputFile = "./tmp/fasta-ml-ncbi-" + timeStamp + ".fasta";
                        var outFile = "./tmp/aligned_fasta-ml-ncbi-" + timeStamp + ".fasta";

                        var inputMuscle = {
                            "-in": inputFile,
                            "-out": outFile
                        };

                        var optionMuscle = {
                            deleteAfterRun: false,
                            getData: [outFile]
                        };

                        genFastaFile(ncbiResult.hits, _.pick(req.queryInfo, ["randomID", "seq"]), inputFile)
                            .then(muscle(inputMuscle, optionMuscle))
                            .then(iqtree(outFile, true))
                            .then(function (returnFasta) {
                                res.jsonSuccess({
                                    queryInfo: req.queryInfo,
                                    method: req.query.method,
                                    report: ncbiResult,
                                    tree: {
                                        newick: returnFasta
                                    }
                                });
                            });
                    } else {
                        res.jsonFail({
                            queryInfo: req.queryInfo,
                            method: req.query.method,
                            report: ncbiResult,
                            message: "NCBI BLAST found less than 2 hits, cannot build phylogenetic tree"
                        });
                    }
                }).catch(function(err) {
                    res.jsonFail({
                        method: req.query.method,
                        report: "NCBI BLAST failed: " + err.toString()
                    });
                });
            } catch (e) {
                res.jsonFail({
                    method: req.query.method,
                    report: e.toString()
                });
            }
        }
    },
    {
        method: "post",
        path: "/search-via-ncbi-mp",
        middlewares: {
            "config-upload": ["fasta", "single", StaticConfig.upload.fasta]
        },
        handler: function searchDnaMP(req, res) {
            try {
                req.queryInfo = getQueryInfo(req);

                if (req.queryInfo == null) {
                    throw "input error or wrong format";
                }
                
                // Sử dụng NCBI BLAST trước, sau đó dựng cây MP
                BlastCgi(req.queryInfo.seq).then(function (ncbiResult) {
                    ncbiResult.source = "ncbi";
                    
                    if (ncbiResult.hits.length > 1) {
                        var qseq = req.queryInfo.seq.replace(/ /g, "");
                        var timeStamp = Date.now();
                        var inputFile = "./tmp/fasta-mp-ncbi-" + timeStamp + ".fasta";
                        var outFile = "./tmp/aligned_fasta-mp-ncbi-" + timeStamp + ".phy";

                        var inputMuscle = {
                            "-in": inputFile,
                            "-phyiout": outFile
                        };

                        var optionMuscle = {
                            deleteAfterRun: false,
                            getData: [outFile]
                        };

                        genFastaFile(ncbiResult.hits, _.pick(req.queryInfo, ["randomID", "seq"]), inputFile)
                            .then(muscle(inputMuscle, optionMuscle))
                            .then(ufbootmp(outFile, true))
                            .then(function (returnFasta) {
                                res.jsonSuccess({
                                    queryInfo: req.queryInfo,
                                    method: req.query.method,
                                    report: ncbiResult,
                                    tree: {
                                        newick: returnFasta
                                    }
                                });
                            });
                    } else {
                        res.jsonFail({
                            queryInfo: req.queryInfo,
                            method: req.query.method,
                            report: ncbiResult,
                            message: "NCBI BLAST found less than 2 hits, cannot build phylogenetic tree"
                        });
                    }
                }).catch(function(err) {
                    res.jsonFail({
                        method: req.query.method,
                        report: "NCBI BLAST failed: " + err.toString()
                    });
                });
            } catch (e) {
                res.jsonFail({
                    method: req.query.method,
                    report: e.toString()
                });
            }
        }
    }
];
