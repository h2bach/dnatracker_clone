var Q = require("q");
var fs = require("fs-extra");
var _ = require("lodash");
var Species = require('../models/species');
var StaticConfig = require("../config/config");
var MakeBlastDB = require('./blast')().MakeBlastDB;

module.exports = {
    upDateBlastDb: function () {

        // TODO: check duplicate Accession

        var fastaFiles = {
            coi: {
                fileName: "./db/" + StaticConfig.db_name_coi + ".fa",
                blast_config: {
                    "-in": "./db/" + StaticConfig.db_name_coi + ".fa",
                    "-dbtype": "nucl",
                    "-out": StaticConfig.db_folder + "/" + StaticConfig.db_name_coi,
                    "-title": StaticConfig.db_name_coi,
                    "-parse_seqids": ""
                },
                seqs: []
            },
            cytoB: {
                fileName: "./db/" + StaticConfig.db_name_cytoB + ".fa",
                blast_config: {
                    "-in": "./db/" + StaticConfig.db_name_cytoB + ".fa",
                    "-dbtype": "nucl",
                    "-out": StaticConfig.db_folder + "/" + StaticConfig.db_name_cytoB,
                    "-title": StaticConfig.db_name_cytoB,
                    "-parse_seqids": ""
                },
                seqs: []
            }
        };

        var getSequences = function () {
            var defer = Q.defer();

            Species.find().select("seqs").lean().exec(function (err, results) {
                _.forEach(results, function (item) {
                    _.forEach(item.seqs, function (seq) {
	                    if (seq.accession && seq.seq) {
		                    if (seq.gen_type == "COI") {
			                    fastaFiles.coi.seqs.push(seq);
		                    } else {
			                    fastaFiles.cytoB.seqs.push(seq);
		                    }
	                    }
                    })
                });

                defer.resolve();

            });
            return defer.promise;
        };

        var genFileFasta = function (options) {
            var defer = Q.defer();

            var content = "";
            var fastaFile = options.fileName;

            console.log('Seq len', options.seqs.length);

            _.uniqBy(options.seqs, "accession").forEach(function (item) {
	            if(item.accession && item.seq) {
		            content += ">" + item.accession.replace("\n", "") + "\n";
		            content += item.seq + "\n";
	            }
            });

            fs.writeFile(fastaFile, content, function (err) {
                if (err) throw err;
                defer.resolve();
            });

            return defer.promise;
        };


        return getSequences()
            .then(function () {
                var genFileFastaPromises = _.map(fastaFiles, function (item) {
                    return genFileFasta(item);
                });
                return Q.all(genFileFastaPromises);
            })
            .then(function () {
                var defer = Q.defer();
                var promises = [];

                _.forEach(fastaFiles, function (fastaFile) {
                    if (fastaFile.seqs.length > 0) {
                        promises.push(MakeBlastDB(fastaFile.blast_config));
                    }
                });

                if (promises.length > 0) {
                    Q.all(promises).then(function () {
                        _.forEach(fastaFiles, function (item) {
                            if(item.fileName) {
                                fs.unlink(item.fileName);
                            }
                        });
                        defer.resolve();
                    }, defer.reject);
                } else {
                    defer.resolve();
                }
                return defer.promise;
            });
    }
};
