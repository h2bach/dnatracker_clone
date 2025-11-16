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
const provinceMapper = require('../utils/province-mapper');
const { Provinces34, getNewProvinceName } = provinceMapper;

var systemDir = process.cwd();

var selectFields = "_id scientific_name vietnamese_name english_name laos_name campuchia_name countries updated_at";

// Hàm ánh xạ danh sách tỉnh cũ sang tỉnh mới (dùng cho nhập liệu hoặc xuất dữ liệu)
function mapToNewProvinces(provinceList) {
    if (!Array.isArray(provinceList)) return [];
    // Loại bỏ trùng lặp
    const mapped = provinceList.map(p => getNewProvinceName(p) || p);
    return Array.from(new Set(mapped));
}

module.exports = [
    {
        method: "get",
        path: "/species",
        handler: function getAllSpecies(req, res) {
            Species.find({}).select(selectFields).exec()
                .then(function (results) {
                    // Bổ sung: đảm bảo mỗi species đều có trường countries
                    results = results.map(function(species) {
                        if (!species.countries || !Array.isArray(species.countries) || species.countries.length === 0) {
                            species.countries = ['Vietnam'];
                        }
                        return species;
                    });
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
                    if (result && (!result.countries || !Array.isArray(result.countries) || result.countries.length === 0)) {
                        result.countries = ['Vietnam'];
                    }
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
                    if (result && (!result.countries || !Array.isArray(result.countries) || result.countries.length === 0)) {
                        result.countries = ['Vietnam'];
                    }
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

            // Nếu chưa có trường countries, mặc định là ['Vietnam']
            if (!species.countries || !Array.isArray(species.countries) || species.countries.length === 0) {
                species.countries = ['Vietnam'];
            }

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
                        var filePath = StaticConfig.upload.image.location + "/" + imageName;
                        if (fs.existsSync(filePath)) {
                            try {
                                fs.unlinkSync(filePath);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                });

                Species.findOne({_id: req.params.species_id}).then(function (oldSpecies) {
                    // Nếu không gửi hoặc gửi mảng rỗng, giữ lại dữ liệu cũ
                    if (!species.distribution || species.distribution.length === 0) {
                        species.distribution = oldSpecies.distribution;
                    }
                    // Có thể merge các trường khác nếu muốn bảo toàn dữ liệu cũ
                    return Species.findOneAndUpdate({_id: req.params.species_id}, species, {new: true});
                })
                .then(function (result) {
                    upDateBlastDb();
                    res.jsonSuccess(result);
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
            Species.find({}).lean().exec()
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
                    var timeoutId;

                    var targz = require('tar.gz');
                    targz().extract(path, tempImportDir).then(function () {
                            timeoutId = setTimeout(function () {
                                defer.resolve();
                            }, 3000);
                        })
                        .catch(function (err) {
                            if (timeoutId) clearTimeout(timeoutId);
                            console.log('Something is wrong :' + err);
                            defer.reject(err);
                        });

                    // Add cleanup method to the promise
                    defer.promise.cancel = function() {
                        if (timeoutId) clearTimeout(timeoutId);
                        defer.reject("Extract cancelled");
                    };

                    return defer.promise;
                }

                extract(workingFolder + "/" + fileName, workingFolder + folderImport).then(function () {
                    fs.copySync(workingFolder + folderImport + "/files/imgs", "./uploads/img", {clobber: true});
                    Species.deleteMany({})
                        .then(function () {
                            var speciesData = fs.readJsonSync(workingFolder + folderImport + "/files/backup-species-data.json");

                            // Đảm bảo mọi species đều có trường countries
                            speciesData = speciesData.map(function(item) {
                                if (!item.countries || !Array.isArray(item.countries) || item.countries.length === 0) {
                                    item.countries = ['Vietnam'];
                                }
                                return item;
                            });

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
        path: "/species",
        // role: "admin curator",
        middlewares: {
            "config-upload": ["image", "array", "file", StaticConfig.upload.image]
        },
        handler: function createSpecies(req, res) {
            console.log("=== BẮT ĐẦU TẠO LOÀI MỚI ===");
            
            var species = (typeof req.body.species == "string") ? JSON.parse(req.body.species) : req.body.species;
            
            // Nếu chưa có trường countries, mặc định là ['Vietnam']
            if (!species.countries || !Array.isArray(species.countries) || species.countries.length === 0) {
                species.countries = ['Vietnam'];
            }
            
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
        path: "/upload-csv",
        middlewares: {},
        handler: function uploadCsv(req, res) {
            console.log("=== BẮT ĐẦU XỬ LÝ UPLOAD CSV (API) ===");
            console.log("Request body:", req.body);
            console.log("Request files:", req.files);
            console.log("Request file:", req.file);
            console.log("Request headers:", req.headers);
            
            // Kiểm tra response đã được gửi chưa
            if (res.headersSent) {
                return;
            }
            
            // Tạo multer middleware riêng cho endpoint này
            var multer = require('multer');
            var upload = multer({
                storage: multer.memoryStorage(),
                fileFilter: function (req, file, cb) {
                    console.log("File filter called with:", file);
                    cb(null, true);
                }
            }).single('file');
            
            upload(req, res, function(err) {
                if (err instanceof multer.MulterError) {
                    console.error('Multer error:', err);
                    return res.status(400).json({
                        status: 0,
                        data: "Lỗi upload file: " + err.message + " (Field: " + err.field + ")"
                    });
                } else if (err) {
                    console.error('Other error:', err);
                    return res.status(500).json({
                        status: 0,
                        data: "Lỗi server: " + err.message
                    });
                }
                
                // Tiếp tục xử lý file
                if (!req.file) {
                    return res.jsonFail("Không tìm thấy file được upload");
                }

                var file = req.file;
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
                    var headers = lines[0].split('|').map(header => header.trim());
                    console.log("Headers:", headers);

                    var processed = 0;
                    var errors = 0;
                    var errorDetails = [];
                    var promises = [];

                    // Mapping cột CSV sang field database
                    var columnMapping = {
                        'Tên thông thường': 'vietnamese_name',
                        'Tên khoa học': 'scientific_name',
                        'Tên tiếng Anh': 'english_name',
                        'Đoạn gen': 'gen_type',
                        'Trình tự': 'seq',
                        'Trình tự tham chiếu trên Genbank': 'reference_seq',
                        'Accession No.': 'accession',
                        'Phân hạng IUCN (2020)': 'iucn_class',
                        'Link IUCN': 'iucn_link',
                        'Phân hạng Danh lục Đỏ Việt Nam (2024)': 'vn_redbook_class',
                        'Mô tả': 'description',
                        'Encyclopedia of Life': 'eol_link',
                        'gbif': 'gbif_link',
                        'Vùng phân bố': 'distribution'
                    };

                    // Gom các gen cùng loài trước khi ghi vào DB
                    var speciesMap = {};
                    for (var i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue; // Bỏ qua dòng trống
                        try {
                            var values = lines[i].split('|').map(value => value.trim());
                            var speciesData = {};
                            headers.forEach((header, index) => {
                                // Chuẩn hóa header và value để tránh lỗi dấu cách thừa
                                var cleanHeader = header.trim();
                                var value = (values[index] || '').trim();
                                var fieldName = columnMapping[cleanHeader] || cleanHeader;
                                speciesData[fieldName] = value;
                            });
                            if (!speciesData.scientific_name) {
                                errors++;
                                errorDetails.push(`Dòng ${i + 1}: Thiếu tên khoa học`);
                                continue;
                            }
                            // === BẮT ĐẦU SỬA LOGIC TÁCH SEQS ===
                            // Hàm kiểm tra giá trị rỗng hoặc 'nan'
                            function isEmptyOrNan(v) {
                                return !v || v.trim().toLowerCase() === 'nan';
                            }
                            // === BẮT ĐẦU SỬA LẠI HÀM parseSeqs ===
                            function parseSeqs(row) {
                                const gen_type = row.gen_type?.trim();
                                const seq = row.seq?.trim();
                                const reference_seq = row.reference_seq?.trim();
                                const accession = row.accession?.trim();
                                let result = [];
                                if (!gen_type || gen_type.toLowerCase() === 'nan') return result;
                                const isEmpty = v => !v || v.toLowerCase() === 'nan';
                                // Có cả 3 trường
                                if (!isEmpty(seq) && !isEmpty(reference_seq) && !isEmpty(accession)) {
                                    result.push({ gen_type, seq });
                                    result.push({ gen_type, seq: reference_seq, accession });
                                }
                                // Chỉ có seq
                                else if (!isEmpty(seq)) {
                                    result.push({ gen_type, seq });
                                }
                                // Chỉ có reference_seq và accession
                                else if (!isEmpty(reference_seq) && !isEmpty(accession)) {
                                    result.push({ gen_type, seq: reference_seq, accession });
                                }
                                // Trường hợp còn lại: bỏ qua
                                return result;
                            }
                            // === KẾT THÚC SỬA LẠI HÀM parseSeqs ===
                            let rawSeqs = parseSeqs(speciesData);
                            // Lọc lại, loại bỏ bản ghi có trường nan hoặc rỗng
                            speciesData.seqs = rawSeqs.filter(s =>
                                s.gen_type && s.gen_type.toLowerCase() !== 'nan' &&
                                s.seq && s.seq.toLowerCase() !== 'nan'
                            );
                            // Log debug để kiểm tra dữ liệu đầu vào và kết quả tách seqs
                            console.log(`[DEBUG][UPLOAD-CSV] Dòng ${i+1} | scientific_name: ${speciesData.scientific_name} | gen_type: ${speciesData.gen_type} | seq: ${speciesData.seq} | reference_seq: ${speciesData.reference_seq} | accession: ${speciesData.accession}`);
                            console.log(`[DEBUG][UPLOAD-CSV] Dòng ${i+1} | seqs sau khi tách:`, JSON.stringify(speciesData.seqs));
                            delete speciesData.seq;
                            delete speciesData.gen_type;
                            delete speciesData.accession;
                            delete speciesData.reference_seq;
                            // ... existing code ...
                            var referenceLinks = [];
                            if (speciesData.iucn_link) referenceLinks.push(speciesData.iucn_link);
                            if (speciesData.eol_link) referenceLinks.push(speciesData.eol_link);
                            if (speciesData.gbif_link) referenceLinks.push(speciesData.gbif_link);
                            if (referenceLinks.length > 0) {
                                speciesData.reference_link = referenceLinks;
                            }
                            delete speciesData.iucn_link;
                            delete speciesData.eol_link;
                            delete speciesData.gbif_link;
                            
                            // Nếu chưa có trường countries, mặc định là ['Vietnam']
                            if (!speciesData.countries || !Array.isArray(speciesData.countries) || speciesData.countries.length === 0) {
                                speciesData.countries = ['Vietnam'];
                            }
                            
                            // Gom vào speciesMap
                            var key = speciesData.scientific_name;
                            if (!speciesMap[key]) {
                                speciesData.seqs = (speciesData.seqs || []).filter(s =>
                                    s.gen_type && s.gen_type.toLowerCase() !== 'nan' &&
                                    s.seq && s.seq.toLowerCase() !== 'nan'
                                );
                                speciesMap[key] = {
                                    ...speciesData,
                                    seqs: speciesData.seqs ? [...speciesData.seqs] : []
                                };
                            } else {
                                // Merge các trường thông tin khác nếu cần (ưu tiên dòng đầu)
                                // Chỉ merge thêm gen mới
                                let newSeqs = speciesData.seqs && Array.isArray(speciesData.seqs) ? speciesData.seqs : [];
                                // Gộp và filter triệt để
                                speciesMap[key].seqs = (speciesMap[key].seqs || [])
                                    .concat(newSeqs)
                                    .filter(s =>
                                        s.gen_type && s.gen_type.toLowerCase() !== 'nan' &&
                                        s.seq && s.seq.toLowerCase() !== 'nan'
                                    );
                                // Khi cập nhật loài đã có, cũng ép lại
                                speciesMap[key].countries = ['Vietnam'];
                            }
                        } catch (parseError) {
                            errors++;
                            errorDetails.push(`Dòng ${i + 1}: Lỗi parse dữ liệu - ${parseError.message}`);
                            console.error(`Lỗi parse dòng ${i + 1}:`, parseError);
                        }
                    }

                    // Sau khi gom, duyệt qua từng loài để cập nhật/tạo mới
                    var promises = [];
                    Object.keys(speciesMap).forEach(function(key) {
                        var speciesData = speciesMap[key];
                        var promise = Species.findOne({ scientific_name: speciesData.scientific_name })
                            .then(function(existingSpecies) {
                                if (existingSpecies) {
                                    existingSpecies.vietnamese_name = speciesData.vietnamese_name || existingSpecies.vietnamese_name;
                                    existingSpecies.english_name = speciesData.english_name || existingSpecies.english_name;
                                    existingSpecies.countries = speciesData.countries || existingSpecies.countries;
                                    existingSpecies.distribution = speciesData.distribution || existingSpecies.distribution;
                                    existingSpecies.conservation_status = speciesData.conservation_status || existingSpecies.conservation_status;
                                    existingSpecies.description = speciesData.description || existingSpecies.description;
                                    existingSpecies.reference_link = speciesData.reference_link || existingSpecies.reference_link;
                                    existingSpecies.iucn_class = speciesData.iucn_class || existingSpecies.iucn_class;
                                    existingSpecies.vn_redbook_class = speciesData.vn_redbook_class || existingSpecies.vn_redbook_class;
                                    // Merge các gen mới vào mảng seqs, không trùng accession + gen_type
                                    if (speciesData.seqs && Array.isArray(speciesData.seqs)) {
                                        speciesData.seqs.forEach(function(newSeq) {
                                            var isExist = existingSpecies.seqs.some(function(seq) {
                                                return seq.accession === newSeq.accession && seq.gen_type === newSeq.gen_type;
                                            });
                                            if (!isExist) {
                                                existingSpecies.seqs.push(newSeq);
                                            }
                                        });
                                    }
                                    return existingSpecies.save();
                                } else {
                                    return Species.create(speciesData);
                                }
                            })
                            .then(function(result) {
                                processed++;
                                console.log(`Đã xử lý loài: ${speciesData.scientific_name}`);
                            })
                            .catch(function (err) {
                                errors++;
                                errorDetails.push(`Loài ${speciesData.scientific_name}: ${err && err.message ? err.message : JSON.stringify(err)}`);
                                console.error(`===> LỖI LOÀI: ${speciesData.scientific_name}`, err);
                            });
                        promises.push(promise);
                    });

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
            });
        }
    }

];