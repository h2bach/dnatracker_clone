var fs = require("fs");
var Q = require("q");
var _ = require("lodash");
var mongoose = require("mongoose");
var xlsxRows = require('xlsx-rows');
var path = require('path');

var Species = require('../app/models/species.js');
var Users = require('../app/models/user');
var elasticConfig = require('../app/config/config.js').elasticsearch;
var elastic = require('../app/libs/elasticsearch.js')(elasticConfig);

var dbUri = "mongodb://localhost:27017/test"

var prepareFastaData = function (fastaBuffer) {
    return function () {
        var fasta_parser = require('fasta-parser')();
        var defer = Q.defer();
        var results = [];
        fasta_parser.write(fastaBuffer);
        fasta_parser.on('data', function (data) {
            results.push(JSON.parse(data.toString()));
        });
        fasta_parser.end(function () {
            defer.resolve(results);
        });
        return defer.promise;
    };
};

var closeConnection = function () {
    return function () {
        var defer = Q.defer();
        mongoose.disconnect().then(() => {
            defer.resolve();
        }).catch(err => {
            console.log(err);
            defer.reject();
        });
        return defer.promise;
    }
};

var createDocs = function (Model, inputData) {
    var defer = Q.defer();
    Model.deleteMany({}).then(() => {
        return Model.create(inputData);
    }).then(() => {
        console.log("done");
        defer.resolve();
    }).catch(err => {
        console.log(err);
        defer.reject();
    });
    return defer.promise;
};

var addDocs = function (Model, inputData) {
    var defer = Q.defer();
    Model.create(inputData)
        .then(() => {
            console.log("done");
            defer.resolve();
        })
        .catch(err => {
            console.log(err);
            defer.reject();
        });
    return defer.promise;
};

module.exports = function (gulp) {
    gulp.task('create-mapping-es', function () {
        return elastic.indexExists()
            .then(function (exists) {
                if (exists) {
                    return elastic.deleteIndex();
                }
            })
            .then(elastic.initIndex)
            .then(elastic.initMapping(elasticConfig.mapping))
    });

  gulp.task('create-db-from-backup', function () {
            var db = mongoose.connect(dbUri);
            var speciesData = JSON.parse(fs.readFileSync('./backup/backup-species-data.json', 'utf8'));
            return elastic.indexExists().then(function (exists) {
                              if (exists) {
                                                    return elastic.deleteIndex();
                                                }
                          })
                .then(elastic.initIndex)
                .then(elastic.initMapping(elasticConfig.mapping))
                .then(function () {
                    console.log(speciesData);
                    return createDocs(Species, speciesData.map(sP => {
                        try {
                            return Object.assign(_.omit(sP, ['_id', 'updated_at', 'seqs']), {
                                seqs: sP.seqs.map(seq => _.omit(seq, '_id'))
                            })
                        } catch (e) {
                            console.log(sP.seqs);
                            return Object.assign(_.omit(sP, ['_id', 'updated_at', 'seqs']), {
                                seqs: typeof sP.seqs == 'object' ? [_.omit(sP.seqs, '_id')] : []
                            })
                        }
                    }));
                }).then(closeConnection(db));
        });

    // gulp.task('create-db-from-backup', function () {
    //     var db = mongoose.connect("mongodb://localhost/dna-tracker");
    //     var speciesData = JSON.parse(fs.readFileSync('./backup/backup1.json', 'utf8'));
    //     return elastic.indexExists().then(function (exists) {
    //             if (exists) {
    //                 return elastic.deleteIndex();
    //             }
    //         })
    //         .then(elastic.initIndex)
    //         .then(elastic.initMapping(elasticConfig.mapping))
    //         .then(function () {
    //             console.log(speciesData);
    //             return createDocs(Species, speciesData);
    //         }).then(closeConnection(db));
    // });

    gulp.task('create-mock-db-users', function () {
        var db = mongoose.connect(dbUri);
        var prepareUsersData = function () {
            var roles = Users.schema.path('role').enumValues;
            return _.map(roles, function (role) {
                return {
                    email: role + "@" + role + ".com",
                    username: role,
                    password: role,
                    role: role
                }
            })
        };
        return createDocs(Users, prepareUsersData()).then(closeConnection(db));
    });
    
	// TODO: create db from 2 new file fasta

	gulp.task('clear-db', function () {
		var db = mongoose.connect(dbUri);
        return Species.deleteMany({}).exec().then(closeConnection(db));
	});

    function createRawData(options) {
        var coi_file = options.coi_file;
        var cytb_file = options.cytb_file;
        var rows = options.xlsx_file;

        return Q.all([prepareFastaData(coi_file)(), prepareFastaData(cytb_file)()]).then(function (datas) {
            var defer = Q.defer();
            var coi_seqs = datas[0];
            var cytb_seqs = datas[1];

            console.log(coi_seqs.length);
            console.log(cytb_seqs.length);

            var count_coi = [];
            var count_cytob = [];

            var species = _.map(rows, function (item) {

                var seqs = [];

                function removeWhiteSpace(str) {
                    str = str.replace(/(^\s*)|(\s*$)/gi, "");
                    str = str.replace(/[ ]{2,}/gi, " ");
                    return str.replace(/\n /, "\n");
                }

                function getSequence(accession, list_seqs) {
                    var seq = _.find(list_seqs, function (item) {
                        return removeWhiteSpace(item.id) == accession;
                    });
                    return seq ? seq.seq : null;
                }

                function getAccessions(rawAccession) {
                    return removeWhiteSpace(rawAccession).replace(/\s*barcode/, "").replace(/(\s*\(\d+bp\))/, "").split(/\,\s*/);
                }

                if (item[options.coi_index]) {
                    var accessions1 = getAccessions(item[options.coi_index]);
                    _.forEach(accessions1, function (item) {
                        var seqStr = getSequence(item, coi_seqs);
                        if (seqStr) {
                            count_coi.push(item);
                            seqs.push({
                                accession: item,
                                gen_type: "COI",
                                seq: seqStr
                            });
                        }

                    })
                }

                if (item[options.cytb_index]) {
                    var accessions2 = getAccessions(item[options.cytb_index]);

                    _.forEach(accessions2, function (item) {
                        var seqStr = getSequence(item, cytb_seqs);
                        if (seqStr) {
                            count_cytob.push(item);
                            seqs.push({
                                accession: item,
                                gen_type: "Cytochrome B",
                                seq: seqStr
                            });
                        }
                    })
                }

                return options.parseData(item, seqs);

            });

            console.log(count_coi.length);
            console.log(count_cytob.length);

            defer.resolve(species);

            return defer.promise;
        })
    }

	gulp.task('add-db-from-vn-xlsx', function () {
        var db = mongoose.connect(dbUri);
        return createRawData({
            coi_file: fs.readFileSync("./db/raw/co1-vn.fa"),
            cytb_file: fs.readFileSync("./db/raw/cytob-vn.fa"),
            xlsx_file: xlsxRows('./db/raw/vn.xlsx').slice(1),
            coi_index: 4,
            cytb_index: 5,
            parseData: function (item, seqs) {
                return {
                    vietnamese_name: item[0],
                    scientific_name: item[1],
                    english_name: item[2],
                    type: item[3],
                    reference_link: _.filter([item[7], item[10], item[11], item[12]], function (o) {
                        return o != null;
                    }),
                    iucn_class: item[6],
                    vn_redbook_class: item[8],
                    description: item[9] || "",
                    seqs: seqs
                }
            }

        })
            .then(function (species) {
                return createDocs(Species, species);
            }).then(closeConnection(db));
	});

	gulp.task('add-db-from-laos-xlsx', function () {
        var db = mongoose.connect(dbUri);
        return createRawData({
            coi_file: fs.readFileSync("./db/raw/co1-laos.fa"),
            cytb_file: fs.readFileSync("./db/raw/cytb-laos.fa"),
            xlsx_file: xlsxRows('./db/raw/laos.xlsx').slice(1),
            coi_index: 3,
            cytb_index: 4,
            parseData: function (item, seqs) {
                return {
                    vietnamese_name: "",
                    scientific_name: item[0],
                    english_name: item[1],
                    type: item[2],
                    reference_link: _.filter([item[6], item[8], item[9], item[10]], function (o) {
                        return o != null;
                    }),
                    countries : [ "Laos" ],
                    iucn_class: item[5],
                    description: item[7] || "",
                    seqs: seqs
                }
            }

        })
            .then(function (species) {
                return addDocs(Species, species);
            }).then(closeConnection(db));
	});

	gulp.task('add-db-from-campuchia-xlsx', function () {
        var db = mongoose.connect(dbUri);
        return createRawData({
            coi_file: fs.readFileSync("./db/raw/co1-camb.fa"),
            cytb_file: fs.readFileSync("./db/raw/cytb-camb.fa"),
            xlsx_file: xlsxRows('./db/raw/cambodia.xlsx').slice(1),
            coi_index: 3,
            cytb_index: 4,
            parseData: function (item, seqs) {
                return {
                    vietnamese_name: "",
                    scientific_name: item[0],
                    english_name: item[1],
                    type: item[2],
                    reference_link: _.filter([item[6], item[8], item[9], item[10]], function (o) {
                        return o != null;
                    }),
                    countries : [ "Campuchia" ],
                    iucn_class: item[5],
                    description: item[7] || "",
                    seqs: seqs
                }
            }

        })
            .then(function (species) {
                return addDocs(Species, species);
            }).then(closeConnection(db));
	})

    gulp.task('update-species-images', function () {
        var db = mongoose.connect(dbUri);
        return updateSpeciesImagesFromFolder('./backup/img', './uploads/img')
            .then(closeConnection(db));
    });
};

function updateSpeciesImagesFromFolder(imgFolderPath, uploadImgFolderPath) {
    var defer = Q.defer();
    // Tạo thư mục uploads/img nếu chưa có
    if (!fs.existsSync(uploadImgFolderPath)) {
        fs.mkdirSync(uploadImgFolderPath, { recursive: true });
    }
    var imgFiles = fs.readdirSync(imgFolderPath);

    Species.find({}).then(speciesList => {
        var updatePromises = speciesList.map(species => {
            var sciName = species.scientific_name.replace(/\s+/g, ' ').trim();
            var escapedName = sciName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var regex = new RegExp('^' + escapedName + '(-\\d+)?\\.jpg$', 'i');
            var matchedFiles = imgFiles.filter(f => regex.test(f));
            if (matchedFiles.length > 0) {
                // Copy file và lưu path mới
                var newPaths = [];
                matchedFiles.forEach(fileName => {
                    var src = path.join(imgFolderPath, fileName);
                    var dest = path.join(uploadImgFolderPath, fileName);
                    // Chỉ copy nếu chưa tồn tại ở uploads/img
                    if (!fs.existsSync(dest)) {
                        fs.copyFileSync(src, dest);
                    }
                    newPaths.push(fileName);
                });
                species.images = newPaths;
                return species.save();
            }
            return Promise.resolve();
        });
        return Promise.all(updatePromises);
    }).then(() => {
        console.log('Cập nhật ảnh thành công!');
        defer.resolve();
    }).catch(err => {
        console.log(err);
        defer.reject();
    });
    return defer.promise;
}
