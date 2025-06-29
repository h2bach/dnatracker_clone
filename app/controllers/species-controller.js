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

var systemDir = process.cwd();

var selectFields = "_id scientific_name vietnamese_name english_name laos_name campuchia_name countries updated_at";

// Danh sách các tỉnh/thành phố và ID tương ứng (copy từ frontend)
const allProvinces = [
    { id: "VN-44", text: "An Giang" }, { id: "VN-43", text: "Bà Rịa–Vũng Tàu" }, { id: "VN-54", text: "Bắc Giang" },
    { id: "VN-53", text: "Bắc Kạn" }, { id: "VN-55", text: "Bạc Liêu" }, { id: "VN-56", text: "Bắc Ninh" },
    { id: "VN-50", text: "Bến Tre" }, { id: "VN-31", text: "Bình Định" }, { id: "VN-57", text: "Bình Dương" },
    { id: "VN-58", text: "Bình Phước" }, { id: "VN-40", text: "Bình Thuận" }, { id: "VN-59", text: "Cà Mau" },
    { id: "VN-04", text: "Cao Bằng" }, { id: "VN-33", text: "Đắk Lắk" }, { id: "VN-72", text: "Đắk Nông" },
    { id: "VN-71", text: "Điện Biên" }, { id: "VN-39", text: "Đồng Nai" }, { id: "VN-45", text: "Đồng Tháp" },
    { id: "VN-30", text: "Gia Lai" }, { id: "VN-03", text: "Hà Giang" }, { id: "VN-63", text: "Hà Nam" },
    { id: "VN-23", text: "Hà Tĩnh" }, { id: "VN-61", text: "Hải Dương" }, { id: "VN-73", text: "Hậu Giang" },
    { id: "VN-14", text: "Hòa Bình" }, { id: "VN-66", text: "Hưng Yên" }, { id: "VN-34", text: "Khánh Hòa" },
    { id: "VN-47", text: "Kiên Giang" }, { id: "VN-28", text: "Kon Tum" }, { id: "VN-01", text: "Lai Châu" },
    { id: "VN-35", text: "Lâm Đồng" }, { id: "VN-09", text: "Lạng Sơn" }, { id: "VN-02", text: "Lào Cai" },
    { id: "VN-41", text: "Long An" }, { id: "VN-67", text: "Nam Định" }, { id: "VN-22", text: "Nghệ An" },
    { id: "VN-18", text: "Ninh Bình" }, { id: "VN-36", text: "Ninh Thuận" }, { id: "VN-68", text: "Phú Thọ" },
    { id: "VN-32", text: "Phú Yên" }, { id: "VN-24", text: "Quảng Bình" }, { id: "VN-27", text: "Quảng Nam" },
    { id: "VN-29", text: "Quảng Ngãi" }, { id: "VN-13", text: "Quảng Ninh" }, { id: "VN-25", text: "Quảng Trị" },
    { id: "VN-52", text: "Sóc Trăng" }, { id: "VN-05", text: "Sơn La" }, { id: "VN-37", text: "Tây Ninh" },
    { id: "VN-20", text: "Thái Bình" }, { id: "VN-69", text: "Thái Nguyên" }, { id: "VN-21", text: "Thanh Hóa" },
    { id: "VN-26", text: "Thừa Thiên–Huế" }, { id: "VN-46", text: "Tiền Giang" }, { id: "VN-51", text: "Trà Vinh" },
    { id: "VN-07", text: "Tuyên Quang" }, { id: "VN-49", text: "Vĩnh Long" }, { id: "VN-70", text: "Vĩnh Phúc" },
    { id: "VN-06", text: "Yên Bái" }, { id: "VN-CT", text: "Cần Thơ" }, { id: "VN-DN", text: "Đà Nẵng" },
    { id: "VN-HN", text: "Hà Nội" }, { id: "VN-HP", text: "Hải Phòng" }, { id: "VN-SG", text: "Tp. Hồ Chí Minh" },
    { id: "LA-AT", text: "Attapu" }, { id: "LA-BK", text: "Bokeo" }, { id: "LA-BL", text: "Bolikhamxai" },
    { id: "LA-CH", text: "Champasak" }, { id: "LA-HO", text: "Houaphan" }, { id: "LA-KH", text: "Khammouan" },
    { id: "LA-LM", text: "Louang Namtha" }, { id: "LA-LP", text: "Louangphrabang" }, { id: "LA-OU", text: "Oudômxai" },
    { id: "LA-PH", text: "Phôngsali" }, { id: "LA-SL", text: "Saravan" }, { id: "LA-SV", text: "Savannakhét" },
    { id: "LA-VI", text: "Vientiane" }, { id: "LA-VT", text: "Vientiane-Capital" }, { id: "LA-XA", text: "Xaignabouri" },
    { id: "LA-XS", text: "Xaisômboun" }, { id: "LA-XE", text: "Xékong" }, { id: "LA-XI", text: "Xiangkhoang" },
    { id: "KH-12", text: "Phnom Penh" }, { id: "KH-1", text: "Banteay Meanchey" }, { id: "KH-2", text: "Battambang" },
    { id: "KH-3", text: "Kampong Cham" }, { id: "KH-4", text: "Kampong Chhnang" }, { id: "KH-5", text: "Kampong Speu" },
    { id: "KH-6", text: "Kampong Thom" }, { id: "KH-7", text: "Kampot" }, { id: "KH-8", text: "Kandal" },
    { id: "KH-9", text: "Koh Kong" }, { id: "KH-23", text: "Kep" }, { id: "KH-10", text: "Kratié" },
    { id: "KH-11", text: "Mondulkiri" }, { id: "KH-22", text: "Oddar Meanchey" }, { id: "KH-24", text: "Pailin" },
    { id: "KH-18", text: "Preah Sihanouk" }, { id: "KH-13", text: "Preah Vihear" }, { id: "KH-15", text: "Pursat" },
    { id: "KH-14", text: "Prey Veng" }, { id: "KH-16", text: "Ratanakiri" }, { id: "KH-17", text: "Siem Reap" },
    { id: "KH-19", text: "Stung Treng" }, { id: "KH-20", text: "Svay Rieng" }, { id: "KH-21", text: "Takéo" },
    { id: "KH-25", text: "Tboung Khmum" }
];
const provinceNameToIdMap = allProvinces.reduce((map, province) => {
    map[province.text.toLowerCase().trim()] = province.id;
    return map;
}, {});

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
        path: "/species",
        // role: "admin curator",
        middlewares: {
            "config-upload": ["image", "array", "file", StaticConfig.upload.image]
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
                        'Phân hạng IUCN (2008 v3.1)': 'iucn_class',
                        'Link IUCN': 'iucn_link',
                        'Phân hạng Danh lục Đỏ Việt Nam (2024)': 'vn_redbook_class',
                        'Encyclopedia of Life': 'eol_link',
                        'gbif': 'gbif_link',
                        'Vùng phân bố': 'distribution',
                        'Mô tả': 'description'
                    };

                    // Gom các gen cùng loài trước khi ghi vào DB
                    var speciesMap = {};
                    for (var i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue; // Bỏ qua dòng trống
                        try {
                            var values = lines[i].split('|').map(value => value.trim());
                            var speciesData = {};
                            headers.forEach((header, index) => {
                                var value = values[index] || '';
                                var fieldName = columnMapping[header] || header;
                                speciesData[fieldName] = value;
                            });
                            if (!speciesData.scientific_name) {
                                errors++;
                                errorDetails.push(`Dòng ${i + 1}: Thiếu tên khoa học`);
                                continue;
                            }
                            // Xử lý distribution: luôn chuyển sang ID trước khi lưu DB
                            if (speciesData.distribution && typeof speciesData.distribution === 'string') {
                                speciesData.distribution = speciesData.distribution.split(';').map(d => d.trim()).filter(d => d);
                            }
                            if (speciesData.distribution && Array.isArray(speciesData.distribution)) {
                                speciesData.distribution = provinceMapper.mapToIds(speciesData.distribution);
                            }
                            if (speciesData.seq) {
                                speciesData.seqs = [{
                                    accession: speciesData.accession || '',
                                    gen_type: speciesData.gen_type || 'COI',
                                    seq: speciesData.seq
                                }];
                                delete speciesData.seq;
                                delete speciesData.gen_type;
                                delete speciesData.accession;
                            }
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
                            // Đảm bảo tất cả các loài đều ở Việt Nam
                            speciesData.countries = ['Vietnam'];
                            // Gom vào speciesMap
                            var key = speciesData.scientific_name;
                            if (!speciesMap[key]) {
                                speciesMap[key] = {
                                    ...speciesData,
                                    seqs: speciesData.seqs ? [...speciesData.seqs] : []
                                };
                            } else {
                                // Merge các trường thông tin khác nếu cần (ưu tiên dòng đầu)
                                // Chỉ merge thêm gen mới
                                if (speciesData.seqs && Array.isArray(speciesData.seqs)) {
                                    speciesData.seqs.forEach(function(newSeq) {
                                        var isExist = speciesMap[key].seqs.some(function(seq) {
                                            return seq.accession === newSeq.accession && seq.gen_type === newSeq.gen_type;
                                        });
                                        if (!isExist) {
                                            speciesMap[key].seqs.push(newSeq);
                                        }
                                    });
                                }
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
                            .catch(function(err) {
                                errors++;
                                errorDetails.push(`Loài ${speciesData.scientific_name}: ${err.message}`);
                                console.error(`===> LỖI LOÀI: ${speciesData.scientific_name}`);
                                // Ghi thông tin loài lỗi vào file JSON
                                var errorObj = {
                                    scientific_name: speciesData.scientific_name,
                                    error: err.message,
                                    data: speciesData
                                };
                                var errorList = [];
                                var errorSpeciesFile = path.join('./tmp', 'error-species.json');
                                try {
                                    if (fs.existsSync(errorSpeciesFile)) {
                                        errorList = fs.readJsonSync(errorSpeciesFile);
                                    }
                                } catch (e) {
                                    errorList = [];
                                }
                                errorList.push(errorObj);
                                fs.writeJsonSync(errorSpeciesFile, errorList, { spaces: 2 });
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