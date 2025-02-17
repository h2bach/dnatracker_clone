var fs = require("fs-extra");
var path = require("path");
var Q = require("q");
var targz = require('tar.gz');
var _ = require("lodash");
var vi = require("../libs/vi");
var Species = require('../models/species');
var StaticConfig = require("../config/config");
var elastic = require('../libs/elasticsearch')(StaticConfig.elasticsearch);
var upDateBlastDb = require('../libs/common-tasks').upDateBlastDb;

var systemDir = process.cwd();

var selectFields = "_id scientific_name vietnamese_name english_name laos_name campuchia_name countries updated_at";

module.exports = [
    {
        method: "get",
        path: "/species",
        handler: function getAllSpecies(req, res) {
            Species.find({}).select(selectFields).exec(function (err, results) {
                if (!err) {
                    res.jsonSuccess(results);
                } else {
                    res.jsonFail(err);
                }
            });
        }
    },
    {
        method: "get",
        path: "/species/id/:species_id",
        handler: function getOneSpeciesById(req, res) {
            Species.findOne({_id: req.params.species_id}, function (err, result) {
                if (!err) {
                    res.jsonSuccess(result);
                } else {
                    res.jsonFail(err);
                }
            })
        }
    },
    {
        method: "get",
        path: "/species/accession/:species_accession",
        handler: function getOneSpeciesByAccession(req, res) {
            Species.findOne({"seqs.accession": req.params.species_accession}, function (err, result) {
                if (!err) {
                    res.jsonSuccess(result);
                } else {
                    res.jsonFail(err);
                }
            })
        }
    },
    {
        method: "post",
        path: "/species/:species_id",
        role: "admin curator",
        middlewares: {
            "config-upload": ["image", "array", StaticConfig.upload.image]
        },
        handler: function updateOneSpecies(req, res) {
            var species = (typeof req.body.species == "string") ? JSON.parse(req.body.species) : req.body.species;
            var deletedImages = req.body.deletedImages;

            function addImageToData() {
                if (req.files) {
                    if (!species.images) {
                        species.images = [];
                    }
                    species.images = _.concat(species.images, _.map(req.files, function (file) {
                        return file.filename;
                    }));
                }
            }

            if (req.params.species_id != "undefined") {
                addImageToData();
                _.forEach(deletedImages, function (imageName) {
                    if (imageName) {
                        try {
                            fs.unlink(StaticConfig.upload.image.location + "/" + imageName);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });

                Species.findOneAndUpdate({_id: req.params.species_id}, species, function (err, result) {
                    if (!err) {
                        upDateBlastDb();
                        res.jsonSuccess(species);
                    } else {
                        res.jsonFail(err);
                    }
                });

            } else {
                addImageToData();
                Species.create(species, function (err, result) {
                    if (!err) {
                        upDateBlastDb();
                        res.jsonSuccess(species);
                    } else {
                        res.jsonFail(err);
                    }
                })
            }
        }
    },
    {
        method: "delete",
        path: "/species/:species_id",
        role: "admin curator",
        handler: function deleteOneSpecies(req, res) {
            Species.findOneAndRemove({_id: req.params.species_id}, function (err, result) {
                if (!err) {
                    upDateBlastDb();
                    res.jsonSuccess(result);
                } else {
                    res.jsonFail(err);
                }
            });
        }
    },
    {
        method: "get",
        path: "/species/search/:search_text",
        handler: function searchSpecies(req, res) {
            var search_text = req.params.search_text + " " + vi.removeMark(req.params.search_text);
            elastic.search(search_text).then(function (results) {
                res.jsonSuccess(results);
            })
        }
    },
    {
        method: "get",
        path: "/export-db",
        handler: function exportDB(req, res) {
            console.log("start exporting");
            Species.find({}).select("accession seq img_source lat_lng scientific_name vietnamese_name english_name laos_name campuchia_name distribution conservation_status gen_type").lean().exec(function (err, species) {
                var timeStamp = Date.now();
                var workingFolder = "./tmp";
                var folderDelete = "/export-" + timeStamp;
                var folderExport = "/export-" + timeStamp + "/files";
                var fileData = "backup-species-data.json";
                var fileCompress = "backup-" + timeStamp + ".tar.gz";
                fs.mkdirsSync(workingFolder + folderExport );
                fs.writeJsonSync(workingFolder + folderExport + "/" + fileData, species);
                fs.copySync("./uploads/img", workingFolder + folderExport + "/imgs");
                targz().compress(workingFolder + folderExport, workingFolder + "/" + fileCompress)
                    .then(function(){
                        res.set("Content-Disposition", "attachment; filename=\"" + fileCompress + "\"");

                        res.sendFile(path.join(systemDir, workingFolder + "/" + fileCompress), function (err) {
                            if (err) return;
                            console.log("done exporting");
                            fs.remove(workingFolder + folderDelete);
                            fs.remove(workingFolder + "/" + fileCompress);
                        });
                    })
                    .catch(function(err){
                        res.end();
                    });
            })
        }
    },
    {
        method: "post",
        path: "/import-db",
        middlewares: {
            "config-upload": ["importFile", "array", StaticConfig.upload.importFile]
        },
        handler: function exportDB(req, res) {
            console.log("start importing");
            if (req.files) {
                var fileName = req.files[0].filename;
                var timeStamp = Date.now();
                var workingFolder = "./tmp";
                var folderImport = "/import-" + timeStamp;
                var fileData = "backup-species-data.json";
                function extract(path, tempImportDir) {
                    var defer = Q.defer();

                    var targz = require('tar.gz');
                    targz().extract(path, tempImportDir).then(function () {
                            setTimeout(function () {
                                defer.resolve();
                            },3000);
                        })
                        .catch(function (err) {
                            console.log('Something is wrong :' + err);
                        });

                    return defer.promise;
                }

                extract(workingFolder + "/" + fileName, workingFolder + folderImport).then(function () {
                    fs.copySync(workingFolder + folderImport + "/files/imgs", "./uploads/img", {clobber: true});
                    Species.remove({}, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            var speciesData = fs.readJsonSync(workingFolder + folderImport + "/files/backup-species-data.json");

                            Species.create(speciesData, function (err, results) {
                                res.jsonSuccess("import success");
                                console.log("done importing");
                                fs.remove(workingFolder + folderImport);
                                fs.remove(workingFolder + "/" + fileName);
                            });
                        }
                    });

                });
            } else {
                res.jsonFail("import fail");
            }

        }
    }

];