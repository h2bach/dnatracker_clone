"use strict";

// Lấy tham chiếu đến module đã được định nghĩa ở nơi khác (ví dụ: search.js)
var app = angular.module("dna-tracker.frontend.search");

// Định nghĩa controller
app.controller("UpdateSpeciesController", ["$scope", "$http", "$state", "speciesApi", function($scope, $http, $state, speciesApi) {
    // Khởi tạo model
    $scope.species = {
        scientific_name: "",
        english_name: "",
        vietnamese_name: "",
        laos_name: "",
        campuchia_name: "",
        countries: [],
        distribution: [],
        conservation_status: "",
        description: "",
        reference_link: [],  // Thay đổi thành mảng
        iucn_class: "",
        vn_redbook_class: "",
        images: [],          // Thêm mảng images
        seqs: [{
            accession: "",
            gen_type: "COI",
            seq: ""
        }]
    };
    $scope.distributionInputText = ""; // Biến mới cho input text

    // Danh sách tất cả các tỉnh/thành phố từ 3 quốc gia
    $scope.allProvinces = [
        // Việt Nam
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
        // Lào
        { id: "LA-AT", text: "Attapu" }, { id: "LA-BK", text: "Bokeo" }, { id: "LA-BL", text: "Bolikhamxai" },
        { id: "LA-CH", text: "Champasak" }, { id: "LA-HO", text: "Houaphan" }, { id: "LA-KH", text: "Khammouan" },
        { id: "LA-LM", text: "Louang Namtha" }, { id: "LA-LP", text: "Louangphrabang" }, { id: "LA-OU", text: "Oudômxai" },
        { id: "LA-PH", text: "Phôngsali" }, { id: "LA-SL", text: "Saravan" }, { id: "LA-SV", text: "Savannakhét" },
        { id: "LA-VI", text: "Vientiane" }, { id: "LA-VT", text: "Vientiane-Capital" }, { id: "LA-XA", text: "Xaignabouri" },
        { id: "LA-XS", text: "Xaisômboun" }, { id: "LA-XE", text: "Xékong" }, { id: "LA-XI", text: "Xiangkhoang" },
        // Campuchia
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

    // Tạo map từ tên tỉnh sang ID để tra cứu nhanh
    const provinceNameToIdMap = $scope.allProvinces.reduce((map, province) => {
        map[province.text.toLowerCase().trim()] = province.id; // Chuẩn hóa key
        return map;
    }, {});

    // Thêm chuỗi DNA/RNA mới
    $scope.addNewSeq = function() {
        $scope.species.seqs.push({
            accession: "",
            gen_type: "COI",
            seq: ""
        });
    };

    // Xử lý thêm link tham khảo
    $scope.addReferenceLink = function() {
        if ($scope.newReferenceLink) {
            $scope.species.reference_link.push($scope.newReferenceLink);
            $scope.newReferenceLink = "";
        }
    };

    // Xử lý xóa link tham khảo
    $scope.removeReferenceLink = function(index) {
        $scope.species.reference_link.splice(index, 1);
    };

    // Xử lý upload hình ảnh
    $scope.handleImageUpload = function(event) {
        var files = event.target.files;
        $scope.selectedImages = files;
    };

    // Xử lý upload CSV
    $scope.handleCsvUpload = function(event) {
        console.log("=== BẮT ĐẦU XỬ LÝ UPLOAD CSV ===");
        console.log("Event:", event);
        
        var file = event.target.files[0];
        console.log("File được chọn:", file);
        
        if (!file) {
            console.log("Không tìm thấy file được chọn");
            $scope.uploadError = true;
            $scope.uploadMessage = "Vui lòng chọn file CSV";
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            console.log("File không phải định dạng CSV:", file.name);
            $scope.uploadError = true;
            $scope.uploadMessage = "Vui lòng chọn file CSV";
            return;
        }

        // Đọc file CSV
        var reader = new FileReader();
        reader.onload = function(e) {
            console.log("Đã đọc xong file CSV");
            var csvText = e.target.result;
            $scope.csvText = csvText;
            $scope.csvFileName = file.name; // Lưu tên file vào scope
            $scope.$apply(); // Cập nhật scope sau khi đọc file
        };
        reader.onerror = function(error) {
            console.error("Lỗi khi đọc file:", error);
            $scope.uploadError = true;
            $scope.uploadMessage = "Lỗi khi đọc file CSV";
            $scope.$apply();
        };
        reader.readAsText(file);
    };

    // Xem trước dữ liệu CSV
    $scope.previewCsvData = function() {
        console.log("=== XEM TRƯỚC DỮ LIỆU CSV ===");
        if (!$scope.csvText) {
            console.log("Chưa có dữ liệu CSV");
            $scope.uploadError = true;
            $scope.uploadMessage = "Vui lòng chọn file CSV trước";
            return;
        }

        try {
            // Parse CSV text thành mảng objects
            var lines = $scope.csvText.split('\n');
            var headers = lines[0].split('|').map(header => header.trim());
            $scope.csvData = [];

            for (var i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue; // Bỏ qua dòng trống
                
                var values = lines[i].split('|').map(value => value.trim());
                var row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                // Nếu có trường 'Vùng phân bố', split bằng dấu ';'
                if (row['Vùng phân bố']) {
                    row['Vùng phân bố'] = row['Vùng phân bố'].split(';').map(x => x.trim()).filter(x => x).toString();
                }
                $scope.csvData.push(row);
            }

            console.log("Đã parse xong dữ liệu CSV:", $scope.csvData);
            $scope.uploadError = false;
            $scope.uploadMessage = "Đã đọc thành công " + $scope.csvData.length + " dòng dữ liệu";
        } catch (error) {
            console.error("Lỗi khi parse CSV:", error);
            $scope.uploadError = true;
            $scope.uploadMessage = "Lỗi khi đọc dữ liệu CSV: " + error.message;
        }
    };

    // Cập nhật dữ liệu từ CSV
    $scope.updateFromCsv = function() {
        console.log("=== CẬP NHẬT DỮ LIỆU TỪ CSV ===");
        if (!$scope.csvData || $scope.csvData.length === 0) {
            console.log("Chưa có dữ liệu CSV để cập nhật");
            $scope.uploadError = true;
            $scope.uploadMessage = "Vui lòng chọn và xem trước dữ liệu CSV";
            return;
        }

        var formData = new FormData();
        var csvBlob = new Blob([$scope.csvText], { type: 'text/csv' });
        var fileName = $scope.csvFileName || 'species.csv';
        formData.append('file', csvBlob, fileName);

        // Debug: Log FormData
        console.log("FormData entries:");
        for (var pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        console.log("Chuẩn bị gửi request cập nhật");
        
        var headers = {
            'Content-Type': undefined
        };
        
        $http({
            method: 'POST',
            url: '/api/upload-csv',
            data: formData,
            headers: headers,
            transformRequest: angular.identity
        }).then(function(response) {
            console.log("=== PHẢN HỒI TỪ SERVER ===");
            console.log("Response:", response);
            
            if (response.data.status === 1) {
                console.log("Cập nhật thành công");
                $scope.uploadSuccess = true;
                $scope.uploadError = false;
                $scope.uploadMessage = response.data.message;
                if (response.data.details) {
                    console.log("Chi tiết kết quả:", response.data.details);
                }
                // Reset form và dữ liệu
                $scope.csvData = null;
                $scope.csvText = null;
                document.getElementById('csvFile').value = '';
            } else {
                console.log("Cập nhật thất bại:", response.data.message);
                $scope.uploadError = true;
                $scope.uploadSuccess = false;
                $scope.uploadMessage = response.data.message || "Có lỗi xảy ra khi cập nhật dữ liệu";
            }
        }).catch(function(error) {
            console.error("=== LỖI KHI CẬP NHẬT ===");
            console.error("Error object:", error);
            console.error("Error status:", error.status);
            console.error("Error data:", error.data);
            
            $scope.uploadError = true;
            $scope.uploadSuccess = false;
            
            if (error.status === 400) {
                console.log("Lỗi 400: Dữ liệu không hợp lệ hoặc thiếu thông tin");
                $scope.uploadMessage = "Dữ liệu không hợp lệ hoặc thiếu thông tin";
            } else if (error.status === 413) {
                console.log("Lỗi 413: Dữ liệu quá lớn");
                $scope.uploadMessage = "Dữ liệu quá lớn. Vui lòng chia nhỏ file";
            } else if (error.status === 415) {
                console.log("Lỗi 415: Định dạng không được hỗ trợ");
                $scope.uploadMessage = "Định dạng không được hỗ trợ";
            } else {
                console.log("Lỗi khác:", error.data ? error.data.message : "Lỗi không xác định");
                $scope.uploadMessage = error.data ? error.data.message : "Có lỗi xảy ra khi cập nhật dữ liệu";
            }
        });
    };

    // Xử lý cập nhật thủ công
    $scope.handleManualUpdate = function(event) {
        if (event) {
            event.preventDefault();
        }

        // Validate required fields
        if (!$scope.species.scientific_name) {
            alert("Vui lòng nhập tên khoa học");
            return;
        }

        // --- Xử lý và ánh xạ phân bố tỉnh --- 
        let distributionIds = [];
        const notFoundNames = [];
        if ($scope.distributionInputText && typeof $scope.distributionInputText === 'string') {
            const provinceNames = $scope.distributionInputText.split('|')
                                      .map(name => name.trim())
                                      .filter(name => name); // Loại bỏ các chuỗi rỗng sau khi split và trim

            provinceNames.forEach(name => {
                const normalizedName = name.toLowerCase();
                if (provinceNameToIdMap[normalizedName]) {
                    distributionIds.push(provinceNameToIdMap[normalizedName]);
                } else {
                    notFoundNames.push(name); // Lưu lại tên gốc không tìm thấy
                }
            });
        }
        // Gán mảng ID đã được map vào $scope.species.distribution
        $scope.species.distribution = distributionIds;

        // Cảnh báo nếu có tên tỉnh không tìm thấy
        if (notFoundNames.length > 0) {
            alert("Không tìm thấy ID cho các tỉnh/thành sau: " + notFoundNames.join(', ') + ". Các tỉnh này sẽ không được lưu.");
            console.warn("Không tìm thấy ID cho các tỉnh/thành:", notFoundNames);
        }
        // --- Kết thúc xử lý phân bố tỉnh ---

        // Log thông tin được nhập vào
        console.log("=== THÔNG TIN LOÀI ĐƯỢC NHẬP ===");
        console.log("Tên khoa học:", $scope.species.scientific_name);
        console.log("Tên tiếng Anh:", $scope.species.english_name);
        console.log("Tên tiếng Việt:", $scope.species.vietnamese_name);
        console.log("Tên tiếng Lào:", $scope.species.laos_name);
        console.log("Tên tiếng Campuchia:", $scope.species.campuchia_name);
        console.log("Quốc gia:", $scope.species.countries);
        console.log("Phân bố (Input Text):", $scope.distributionInputText);
        console.log("Phân bố (Mapped IDs):", $scope.species.distribution);
        console.log("Trạng thái bảo tồn:", $scope.species.conservation_status);
        console.log("Mô tả:", $scope.species.description);
        console.log("Liên kết tham khảo:", $scope.species.reference_link);
        console.log("Phân loại IUCN:", $scope.species.iucn_class);
        console.log("Phân loại Sách đỏ Việt Nam:", $scope.species.vn_redbook_class);
        console.log("Số lượng hình ảnh:", $scope.selectedImages ? $scope.selectedImages.length : 0);
        
        // Log thông tin chuỗi DNA/RNA
        console.log("=== THÔNG TIN CHUỖI DNA/RNA ===");
        $scope.species.seqs.forEach(function(seq, index) {
            console.log("Chuỗi #" + (index + 1));
            console.log("  Accession Number:", seq.accession);
            console.log("  Loại gen:", seq.gen_type);
            console.log("  Chuỗi DNA/RNA:", seq.seq ? seq.seq.substring(0, 50) + "..." : "");
        });

        // Xử lý reference_link nếu là chuỗi (split bằng dấu '|' theo yêu cầu trước)
        if (typeof $scope.species.reference_link === 'string') {
            $scope.species.reference_link = $scope.species.reference_link.split('|').map(link => link.trim()).filter(link => link);
        }

        // Tạo FormData object
        var formData = new FormData();
        const speciesDataToSend = angular.copy($scope.species); // Dùng bản sao để không ảnh hưởng $scope
        const speciesJson = JSON.stringify(speciesDataToSend);
        console.log("Dữ liệu gửi đi (JSON):", speciesJson); 
        formData.append("species", speciesJson);

        // Thêm các file hình ảnh vào formData
        if ($scope.selectedImages) {
            for (var i = 0; i < $scope.selectedImages.length; i++) {
                formData.append("image", $scope.selectedImages[i]);
            }
        }
        
        $http({
            method: 'POST',
            url: '/api/species',
            data: formData,
            headers: {
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        }).then(function(response) {
            console.log("=== PHẢN HỒI TỪ SERVER ===");
            console.log("Status:", response.data.status);
            console.log("Data:", response.data.data);
            
            if (response.data.status === 1) {
                alert("Thêm loài mới thành công!");
                $state.go("frontend.search-species");
            } else {
                alert("Lỗi: " + response.data.data);
            }
        }).catch(function(error) {
            console.error("=== LỖI KHI GỬI DỮ LIỆU ===");
            console.error("Error:", error);
            alert("Lỗi khi thêm loài mới: " + (error.data ? error.data.message : error.message));
        });
    };

    // Xử lý update CSV
    $scope.updateCsv = function(event) {
        if (event) {
            event.preventDefault();
        }

        var fileInput = document.getElementById("csvFile");
        if (!fileInput || !fileInput.files || !fileInput.files.length) {
            alert("Vui lòng chọn file CSV");
            return;
        }

        // Kiểm tra định dạng file
        var fileName = fileInput.files[0].name;
        if (!fileName.toLowerCase().endsWith('.csv')) {
            alert("Vui lòng chọn file CSV");
            return;
        }

        // Lấy token từ localStorage
        var token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để thực hiện thao tác này");
            return;
        }

        console.log("=== THÔNG TIN FILE CSV ===");
        console.log("Tên file:", fileName);
        console.log("Kích thước:", fileInput.files[0].size, "bytes");

        var formData = new FormData();
        formData.append("file", fileInput.files[0]);
        
        $http({
            method: 'POST',
            url: '/api/species/update-csv',
            data: formData,
            headers: {
                'Content-Type': undefined,
                'Authorization': 'Bearer ' + token
            },
            transformRequest: angular.identity
        }).then(function(response) {
            console.log("=== PHẢN HỒI TỪ SERVER (CSV) ===");
            console.log("Status:", response.data.status);
            console.log("Data:", response.data.data);
            
            if (response.data.status === 1) {
                var message = "Import CSV thành công!\n";
                message += "Số bản ghi đã xử lý: " + response.data.data.processed + "\n";
                if (response.data.data.errors > 0) {
                    message += "Số lỗi: " + response.data.data.errors + "\n";
                    if (response.data.data.errorDetails) {
                        message += "\nChi tiết lỗi:\n" + response.data.data.errorDetails;
                    }
                }
                alert(message);
                $state.go("frontend.search-species");
            } else {
                alert("Lỗi: " + response.data.data);
            }
        }).catch(function(error) {
            console.error("=== LỖI KHI GỬI FILE CSV ===");
            console.error("Error:", error);
            var errorMessage = "Lỗi khi import CSV: ";
            if (error.data && error.data.data) {
                errorMessage += error.data.data;
            } else if (error.status === 401) {
                errorMessage += "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
                $state.go("backend.login");
            } else if (error.status === 413) {
                errorMessage += "File quá lớn. Vui lòng chọn file nhỏ hơn.";
            } else if (error.status === 415) {
                errorMessage += "Định dạng file không hợp lệ. Vui lòng chọn file CSV.";
            } else {
                errorMessage += error.message || "Lỗi không xác định";
            }
            alert(errorMessage);
        });
    };
}]);
