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
                seqs: [],
                dbFiles: [
                    StaticConfig.db_folder + "/" + StaticConfig.db_name_coi + ".nhr",
                    StaticConfig.db_folder + "/" + StaticConfig.db_name_coi + ".nin",
                    StaticConfig.db_folder + "/" + StaticConfig.db_name_coi + ".nsq"
                ]
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
                seqs: [],
                dbFiles: [
                    StaticConfig.db_folder + "/" + StaticConfig.db_name_cytoB + ".nhr",
                    StaticConfig.db_folder + "/" + StaticConfig.db_name_cytoB + ".nin",
                    StaticConfig.db_folder + "/" + StaticConfig.db_name_cytoB + ".nsq"
                ]
            }
        };

        // Kiểm tra BLAST database đã tồn tại chưa
        var checkBlastDatabaseExists = function (dbFiles) {
            var defer = Q.defer();
            var allFilesExist = true;
            
            _.forEach(dbFiles, function (file) {
                if (!fs.existsSync(file)) {
                    allFilesExist = false;
                    console.log("File BLAST database không tồn tại:", file);
                }
            });
            
            if (allFilesExist) {
                console.log("BLAST database đã tồn tại, bỏ qua việc tạo mới");
            } else {
                console.log("BLAST database chưa tồn tại, sẽ tạo mới");
            }
            
            defer.resolve(allFilesExist);
            return defer.promise;
        };

        var getSequences = function () {
            var defer = Q.defer();

            Species.find().select("seqs").lean().then(function (results) {
                _.forEach(results, function (item) {
                    _.forEach(item.seqs, function (seq) {
                        if (seq.accession && seq.seq) {
                            if (seq.gen_type == "COI") {
                                fastaFiles.coi.seqs.push(seq);
                            } else {
                                fastaFiles.cytoB.seqs.push(seq);
                            }
                        }
                    });
                });

                defer.resolve();
            }).catch(function (err) {
                defer.reject(err);
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
                        // Kiểm tra database đã tồn tại chưa
                        checkBlastDatabaseExists(fastaFile.dbFiles)
                            .then(function (exists) {
                                if (!exists) {
                                    console.log("Tạo BLAST database cho:", fastaFile.blast_config["-title"]);
                                    return MakeBlastDB(fastaFile.blast_config);
                                } else {
                                    console.log("Bỏ qua tạo database cho:", fastaFile.blast_config["-title"]);
                                    return Q.resolve();
                                }
                            })
                            .then(function () {
                                // Xóa file FASTA tạm thời
                                if (fastaFile.fileName && fs.existsSync(fastaFile.fileName)) {
                                    fs.unlinkSync(fastaFile.fileName);
                                }
                            })
                            .catch(function (err) {
                                console.error("Lỗi khi xử lý database:", fastaFile.blast_config["-title"], err);
                                throw err;
                            });
                    }
                });

                defer.resolve();
                return defer.promise;
            });
    }
};
