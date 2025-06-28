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
            Species.find({}).select(selectFields).exec()
                .then(function (results) {
                    res.jsonSuccess(results);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }
    },
    {
        method: "get",
        path: "/species/id/:species_id",
        handler: function getOneSpeciesById(req, res) {
            Species.findOne({_id: req.params.species_id})
                .then(function (result) {
                    res.jsonSuccess(result);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
        }
    },
    {
        method: "get",
        path: "/species/accession/:species_accession",
        handler: function getOneSpeciesByAccession(req, res) {
            Species.findOne({"seqs.accession": req.params.species_accession})
                .then(function (result) {
                    res.jsonSuccess(result);
                })
                .catch(function (err) {
                    res.jsonFail(err);
                });
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
                            fs.unlinkSync(StaticConfig.upload.image.location + "/" + imageName);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });

                Species.findOneAndUpdate({_id: req.params.species_id}, species)
                    .then(function (result) {
                        upDateBlastDb();
                        res.jsonSuccess(species);
                    })
                    .catch(function (err) {
                        res.jsonFail(err);
                    });

            } else {
                addImageToData();
                Species.create(species)
                    .then(function (result) {
                        upDateBlastDb();
                        res.jsonSuccess(species);
                    })
                    .catch(function (err) {
                        res.jsonFail(err);
                    });
            }
        }
    },
    {
        method: "delete",
        path: "/species/:species_id",
        role: "admin curator",
        handler: function deleteOneSpecies(req, res) {
            Species.findOneAndDelete({_id: req.params.species_id})
                .then(function (result) {
                    upDateBlastDb();
                    res.jsonSuccess(result);
                })
                .catch(function (err) {
                    res.jsonFail(err);
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
            Species.find({}).select("accession seq img_source lat_lng scientific_name vietnamese_name english_name laos_name campuchia_name distribution conservation_status gen_type").lean().exec()
                .then(function (species) {
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
                .catch(function (err) {
                    res.jsonFail(err);
                });
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
                    Species.deleteMany({})
                        .then(function () {
                            var speciesData = fs.readJsonSync(workingFolder + folderImport + "/files/backup-species-data.json");

                            Species.create(speciesData)
                                .then(function (results) {
                                    res.jsonSuccess("import success");
                                    console.log("done importing");
                                    fs.remove(workingFolder + folderImport);
                                    fs.remove(workingFolder + "/" + fileName);
                                })
                                .catch(function (err) {
                                    res.jsonFail(err);
                                });
                        })
                        .catch(function (err) {
                            console.log(err);
                            res.jsonFail(err);
                        });

                });
            } else {
                res.jsonFail("import fail");
            }

        }
    },
    {
        method: "post",
        path: "/api/species",
        role: "admin curator",
        middlewares: {
            "config-upload": ["image", "array", StaticConfig.upload.image]
        },
        handler: function createSpecies(req, res) {
            console.log("=== BẮT ĐẦU TẠO LOÀI MỚI ===");
            
            var species = (typeof req.body.species == "string") ? JSON.parse(req.body.species) : req.body.species;
            
            console.log("Dữ liệu loài:", JSON.stringify(species, null, 2));

            // Validate dữ liệu bắt buộc
            if (!species.scientific_name) {
                return res.jsonFail("Tên khoa học là bắt buộc");
            }

            // Xử lý hình ảnh
            if (req.files) {
                if (!species.images) {
                    species.images = [];
                }
                species.images = _.concat(species.images, _.map(req.files, function (file) {
                    return file.filename;
                }));
            }

            // Tạo loài mới
            Species.create(species)
                .then(function (result) {
                    console.log("Đã tạo loài thành công:", result.scientific_name);
                    upDateBlastDb();
                    res.jsonSuccess("Tạo loài mới thành công", result);
                })
                .catch(function (err) {
                    console.error("Lỗi khi tạo loài:", err);
                    res.jsonFail("Lỗi khi tạo loài: " + err.message);
                });
        }
    },
    {
        method: "post",
        path: "/api/species/upload-csv",
        role: "admin curator",
        middlewares: {
            "config-upload": ["file", "array", StaticConfig.upload.importFile]
        },
        handler: function uploadCsv(req, res) {
            console.log("=== BẮT ĐẦU XỬ LÝ UPLOAD CSV (API) ===");
            
            // Kiểm tra response đã được gửi chưa
            if (res.headersSent) {
                return;
            }
            
            if (!req.files || req.files.length === 0) {
                return res.jsonFail("Không tìm thấy file được upload");
            }

            var file = req.files[0];
            console.log("File được upload:", file.originalname);
            console.log("Kích thước file:", file.size, "bytes");

            // Kiểm tra định dạng file
            if (!file.originalname.toLowerCase().endsWith('.csv')) {
                return res.jsonFail("File phải có định dạng CSV");
            }

            try {
                // Đọc nội dung file CSV
                var csvContent = file.buffer.toString('utf8');
                var lines = csvContent.split('\n');
                
                if (lines.length < 2) {
                    return res.jsonFail("File CSV phải có ít nhất 1 dòng header và 1 dòng dữ liệu");
                }

                // Parse header
                var headers = lines[0].split(',').map(header => header.trim());
                console.log("Headers:", headers);

                var processed = 0;
                var errors = 0;
                var errorDetails = [];
                var promises = [];

                // Xử lý từng dòng dữ liệu
                for (var i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue; // Bỏ qua dòng trống
                    
                    try {
                        var values = lines[i].split(',').map(value => value.trim());
                        var speciesData = {};
                        
                        headers.forEach((header, index) => {
                            speciesData[header] = values[index] || '';
                        });

                        // Validate dữ liệu bắt buộc
                        if (!speciesData.scientific_name) {
                            errors++;
                            errorDetails.push(`Dòng ${i + 1}: Thiếu tên khoa học`);
                            continue;
                        }

                        // Xử lý các trường đặc biệt
                        if (speciesData.countries) {
                            speciesData.countries = speciesData.countries.split('|').map(c => c.trim()).filter(c => c);
                        }
                        
                        if (speciesData.distribution) {
                            speciesData.distribution = speciesData.distribution.split('|').map(d => d.trim()).filter(d => d);
                        }
                        
                        if (speciesData.reference_link) {
                            speciesData.reference_link = speciesData.reference_link.split('|').map(r => r.trim()).filter(r => r);
                        }

                        // Xử lý chuỗi DNA/RNA
                        if (speciesData.accession && speciesData.seq) {
                            speciesData.seqs = [{
                                accession: speciesData.accession,
                                gen_type: speciesData.gen_type || 'COI',
                                seq: speciesData.seq
                            }];
                            delete speciesData.accession;
                            delete speciesData.seq;
                            delete speciesData.gen_type;
                        }

                        // Tạo promise cho việc tạo/cập nhật loài
                        var promise = Species.findOneAndUpdate(
                            { scientific_name: speciesData.scientific_name },
                            speciesData,
                            { upsert: true, new: true }
                        ).then(function(result) {
                            processed++;
                            console.log(`Đã xử lý loài: ${speciesData.scientific_name}`);
                        }).catch(function(err) {
                            errors++;
                            errorDetails.push(`Dòng ${i + 1}: ${err.message}`);
                            console.error(`Lỗi khi xử lý loài ${speciesData.scientific_name}:`, err);
                        });

                        promises.push(promise);

                    } catch (parseError) {
                        errors++;
                        errorDetails.push(`Dòng ${i + 1}: Lỗi parse dữ liệu - ${parseError.message}`);
                        console.error(`Lỗi parse dòng ${i + 1}:`, parseError);
                    }
                }

                // Đợi tất cả các promise hoàn thành
                if (promises.length === 0) {
                    // Không có dữ liệu để xử lý
                    var result = {
                        processed: 0,
                        errors: errors,
                        errorDetails: errorDetails.length > 0 ? errorDetails.join('\n') : null
                    };
                    
                    console.log("=== KẾT QUẢ UPLOAD CSV (API) - KHÔNG CÓ DỮ LIỆU ===");
                    console.log("Đã xử lý:", 0);
                    console.log("Lỗi:", errors);
                    
                    return res.jsonSuccess("Upload CSV thành công", result);
                }

                Promise.all(promises).then(function() {
                    // Cập nhật BLAST database
                    upDateBlastDb();

                    var result = {
                        processed: processed,
                        errors: errors,
                        errorDetails: errorDetails.length > 0 ? errorDetails.join('\n') : null
                    };

                    console.log("=== KẾT QUẢ UPLOAD CSV (API) ===");
                    console.log("Đã xử lý:", processed);
                    console.log("Lỗi:", errors);
                    
                    if (!res.headersSent) {
                        res.jsonSuccess("Upload CSV thành công", result);
                    }
                }).catch(function(error) {
                    console.error("Lỗi khi xử lý promises:", error);
                    if (!res.headersSent) {
                        res.jsonFail("Lỗi khi xử lý dữ liệu CSV: " + error.message);
                    }
                });

            } catch (error) {
                console.error("Lỗi khi xử lý file CSV:", error);
                if (!res.headersSent) {
                    res.jsonFail("Lỗi khi xử lý file CSV: " + error.message);
                }
            }
        }
    }

];