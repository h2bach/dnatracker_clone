"use strict";

(function () {

	angular.module("dna-tracker.modal.species", [
		"ngTagsInput"
	])

		.provider('modalSpecies', function ($stateProvider) {
			var provider = this;
			this.$get = function () {
				return provider;
			};
			this.state = function (stateName) {
				var modalInstance;
				$stateProvider.state(stateName, {
					url: "/species-detail/:species_id",
					resolve: {
						species_id: ['$stateParams', function ($stateParams) {
							return $stateParams.species_id;
						}]
					},
					onEnter: function ($stateParams, $state, $uibModal, species_id) {
						modalInstance = $uibModal.open({
							templateUrl: "angular/frontend/species-modal/species.html",
							resolve: {
								species_id: function () {
									return species_id;
								}
							},
							controller: "species-modal.ctrl",
							size: "lg"
						}).result.finally(function () {
							$state.go('^');
						});
					}
				});
			};
		})

		.factory("previewSpeciesModal", function ($uibModal) {
			return {
				open: function (species_id) {
					return $uibModal.open({
						templateUrl: "angular/frontend/species-modal/species.html",
						resolve: {
							species_id: function () {
								return species_id;
							}
						},
						controller: "species-modal.ctrl",
						size: "lg"
					}).result;
				}
			};
		})

		.factory("MapModal", function ($uibModal) {
			return {
				open: function (type, data, countries) {
					return $uibModal.open({
						templateUrl: "angular/frontend/species-modal/map-modal.html",
						resolve: {
							type: function () {
								return type;
							},
							mapData: function () {
								return data;
							},
							mapCountries: function () {
								return countries;
							}
						},
						size: "lg",
						controller: function ($scope, $uibModalInstance, type, mapData, mapCountries) {
							$scope.type = type;
							$scope.mapData = mapData;
							$scope.mapCountries = mapCountries;

							function getRegions(country) {
								var mapId = {
									Vietnam: "VN",
									Campuchia: "KH",
									Laos: "LA"
								};

								return _.filter($scope.mapData, function (item) {
									return item.id && item.id.indexOf(mapId[country]) == 0;
								});
							}

							if ($scope.type == 0) {
								$scope.view = {
									country: mapCountries[0],
									regions: getRegions(mapCountries[0])
								};

								$scope.changeCountry = function (country) {
									$scope.view = {
										country: country,
										regions: getRegions(country)
									};
								};
							}

							$scope.close = function () {
								$uibModalInstance.close();
							};
						}
					}).result;
				}
			};
		})

		.controller("species-modal.ctrl", function ($scope, $uibModalInstance, species_id, speciesApi, Provinces, MapModal) {

			$scope.view = {
				editting: false,
				options: {
					width: '100%',
					height: 300,
					ratio: '1200/800',
					loop: true,
					keyboard: true,
					nav: 'thumbs',
					fit: 'scaledown'
				},
				inputImages: [],
				newImages: [],
				deleteImages: [],
				lat: null,
				lng: null,
				inputLink: ""
			};

			$scope.hasData = function (data) {
				return data && data.length > 0;
			};

			$scope.countries = _.map(Provinces, function (value, key) {
				return key;
			});

			$scope.getProvinces = function ($query) {

				var provinces = [];

				_.forEach($scope.species.countries, function (country) {
					// Kiểm tra format của country (có thể là string hoặc object)
					var countryKey = typeof country === 'string' ? country : (country && country.text);
					if (countryKey && Provinces[countryKey]) {
						provinces = provinces.concat(Provinces[countryKey]);
					}
				});

				return _.filter(provinces, function (province) {
					// Kiểm tra province.text tồn tại trước khi gọi indexOf
					if (!province || !province.text) return false;
					return province.text.indexOf($query) >= 0 || Vi.removeMark(province.text).indexOf($query) >= 0;
				});
			};

			$scope.termSeq = {
				accession: "",
				gen_type: "",
				seq: "",
				location: {
					lat: "",
					lng: ""
				}
			};

			$scope.images = [];
			$scope.distribution = [];

			var init = function () {
				$scope.images = _.map($scope.species.images, function (item) {
					var linkImg = '/species-image/' + item;
					return {img: linkImg, thumb: linkImg};
				});

				var provinces = [];

				_.forEach($scope.species.countries, function (country) {
					provinces = provinces.concat(Provinces[country]);
				});

				// Sửa: chuyển species.distribution (mảng string) thành mảng object {id, text}
				$scope.distribution = _.map($scope.species.distribution || [], function (provinceCode) {
					return {
						id: provinceCode,
						text: getNewProvinceNameFromISO(provinceCode)
					};
				});
			};

			if (species_id) {
				speciesApi.getOneById(species_id).then(function (resp) {
					$scope.species = resp.data.data;
					// Nếu không có trường countries, tự gán ['Vietnam']
					if (!$scope.species.countries || !$scope.species.countries.length) {
						$scope.species.countries = ['Vietnam'];
					}
					init();
				});
			} else {
				$scope.species = {};
				$scope.view.editting = true;
			}

			$scope.$watch('view.inputImages', function (images) {
				_.forEach(images, function (image) {
					var index = _.findIndex($scope.view.newImages, function (o) {
						return o.$ngfName == image.$ngfName;
					});
					index < 0 ? $scope.view.newImages.push(image) : '';
				});
			});

			$scope.edit = function () {
				$scope.view.editting = true;
				$scope.view.backUp = angular.copy($scope.species);
			};

			$scope.close = function () {
				$uibModalInstance.close();
			};

			$scope.cancel = function () {
				$scope.view.editting = false;
				$scope.view.deleteImages = [];
				$scope.view.newImages = [];
				$scope.species = angular.copy($scope.view.backUp);
				init();
			};

			$scope.save = function () {
				console.log("=== DEBUG SAVE ===");
				console.log("$scope.distribution trước khi lưu:", $scope.distribution);
				
				// Lấy dữ liệu distribution hiện tại từ tags-input (đã bao gồm cả cũ và mới)
				var currentDistribution = _.chain($scope.distribution)
					.map(function (province) { 
						// Nếu có id, sử dụng id
						if (province && province.id) {
							return province.id;
						}
						// Nếu chỉ có text, tìm id từ text
						if (province && province.text) {
							console.log("Tìm province cho text:", province.text);
							console.log("Provinces.Vietnam sample:", Provinces.Vietnam.slice(0, 3));
							// Tìm id từ text bằng cách mapping
							var foundProvince = _.find(Provinces.Vietnam, function(p) {
								if (!p) return false;
								// Kiểm tra cả name và text
								var provinceName = p.name || p.text;
								if (!provinceName) return false;
								
								// Xử lý đặc biệt cho "Thừa Thiên-Huế"
								if (province.text === "Thừa Thiên-Huế" || province.text === "Thừa-Thiên-Huế") {
									return provinceName === "Thừa Thiên-Huế" || provinceName === "Thừa Thiên-Huế";
								}
								
								// Chuẩn hóa tên tỉnh để so sánh
								var normalizedProvinceName = provinceName.replace(/\s+/g, '-');
								var normalizedSearchText = province.text.replace(/\s+/g, '-');
								
								return provinceName === province.text || 
									   normalizedProvinceName === province.text ||
									   provinceName === normalizedSearchText ||
									   normalizedProvinceName === normalizedSearchText;
							});
							console.log("Found province:", foundProvince);
							// Trả về tất cả codes của tỉnh thay vì chỉ codes[0]
							return foundProvince ? foundProvince.codes : null;
						}
						return null;
					})
					.filter(Boolean)
					.flatten() // Flatten để chuyển từ [[code1, code2], [code3]] thành [code1, code2, code3]
					.value();
				
				console.log("currentDistribution sau khi map:", currentDistribution);
				
				// Cập nhật distribution với dữ liệu hiện tại từ tags-input
				$scope.species.distribution = currentDistribution;
				
				console.log("$scope.species.distribution sau khi cập nhật:", $scope.species.distribution);

				$scope.species.countries = _.map($scope.species.countries, function (value) {
					return value.text;
				});

				var info = {
					species: $scope.species,
					deletedImages: $scope.view.deleteImages
				};
				var fulfilled = function (resp) {
					$scope.species = resp.data.data;
					$scope.view.editting = false;
					_.forEach($scope.view.deleteImages, function (imageName) {
						_.remove($scope.images, function (_img) {
							return _img == imageName;
						});
					});
					init();
				};
				if ($scope.view.newImages.length == 0) {
					speciesApi.update(info).then(fulfilled);
				} else {
					speciesApi.updateWithFile(angular.copy(info), $scope.view.newImages).then(fulfilled)
				}
			};

			$scope.deleteImage = function (image) {
				var typeData = typeof image;
				var map = {
					string: function () {
						var imageName = image.replace('/species-image/', '');
						$scope.view.deleteImages.push(imageName);
						_.remove($scope.species.images, function (_img) {
							return _img == imageName;
						});
						init();
					},
					object: function () {
						_.remove($scope.view.newImages, function (o) {
							return o.$ngfName == image.$ngfName;
						});
					}
				};
				map[typeData]();
			};

			$scope.addLatLng = function () {
				$scope.species.lat_lng.push({lat: angular.copy($scope.view.lat), lng: angular.copy($scope.view.lng)});
				$scope.view.lat = null;
				$scope.view.lng = null;
			};

			$scope.deleteLatLng = function (lat, lng) {
				_.remove($scope.species.lat_lng, function (item) {
					return item.lat == lat && item.lng == lng;
				})
			};

			$scope.addSeq = function () {
				if (!$scope.species.seqs) {
					$scope.species.seqs = [];
				}

				$scope.species.seqs.push(angular.copy($scope.termSeq));

				$scope.termSeq = {
					accession: "",
					gen_type: "",
					seq: "",
					location: {
						lat: "",
						lng: ""
					}
				};
			};

			$scope.deleteSeq = function (seq) {
				_.remove($scope.species.seqs, function (item) {
					return item.accession == seq.accession && item.gen_type == seq.gen_type && item.seq == seq.seq;
				})
			};

			$scope.addLink = function () {
				if (!$scope.species.reference_link) {
					$scope.species.reference_link = [];
				}

				$scope.species.reference_link.push($scope.view.inputLink);

				$scope.view.inputLink = "";
			};

			$scope.deleteLink = function (link) {
				_.remove($scope.species.reference_link, function (item) {
					return item == link;
				})
			};

			// Thay đổi logic truyền dữ liệu vào GeoChart (areaMap)
			// Hàm lấy mã ISO từ tên tỉnh mới (copy từ province-mapper.js hoặc import nếu dùng module)
			function getISOCodesFromNewProvince(newName) {
				var mapping = [
					{ name: "An Giang", codes: ["VN-44", "VN-47"] },
					{ name: "Bắc Ninh", codes: ["VN-54", "VN-56"] },
					{ name: "Cao Bằng", codes: ["VN-04"] },
					{ name: "Cà Mau", codes: ["VN-55", "VN-59"] },
					{ name: "Gia Lai", codes: ["VN-31", "VN-30"] },
					{ name: "Hà Nội", codes: ["VN-HN"] },
					{ name: "Hà Tĩnh", codes: ["VN-23"] },
					{ name: "Hưng Yên", codes: ["VN-66", "VN-20"] },
					{ name: "Hải Phòng", codes: ["VN-61", "VN-HP"] },
					{ name: "Hồ Chí Minh", codes: ["VN-43", "VN-57", "VN-SG"] },
					{ name: "Khánh Hòa", codes: ["VN-34", "VN-36"] },
					{ name: "Lai Châu", codes: ["VN-01"] },
					{ name: "Lào Cai", codes: ["VN-02", "VN-06"] },
					{ name: "Lâm Đồng", codes: ["VN-40", "VN-35", "VN-72"] },
					{ name: "Lạng Sơn", codes: ["VN-09"] },
					{ name: "Nghệ An", codes: ["VN-22"] },
					{ name: "Ninh Bình", codes: ["VN-63", "VN-67", "VN-18"] },
					{ name: "Phú Thọ", codes: ["VN-14", "VN-68", "VN-70"] },
					{ name: "Quảng Ngãi", codes: ["VN-28", "VN-29"] },
					{ name: "Quảng Ninh", codes: ["VN-13"] },
					{ name: "Quảng Trị", codes: ["VN-24", "VN-25"] },
					{ name: "Sơn La", codes: ["VN-05"] },
					{ name: "Thanh Hóa", codes: ["VN-21"] },
					{ name: "Thành phố Cần Thơ", codes: ["VN-CT", "VN-73", "VN-52"] },
					{ name: "Thái Nguyên", codes: ["VN-53", "VN-69"] },
					{ name: "Thừa Thiên-Huế", codes: ["VN-26"] },
					{ name: "Tuyên Quang", codes: ["VN-03", "VN-07"] },
					{ name: "Tây Ninh", codes: ["VN-41", "VN-37"] },
					{ name: "Vĩnh Long", codes: ["VN-50", "VN-51", "VN-49"] },
					{ name: "Điện Biên", codes: ["VN-71"] },
					{ name: "Đà Nẵng", codes: ["VN-27", "VN-DN"] },
					{ name: "Đắk Lắk", codes: ["VN-32", "VN-33"] },
					{ name: "Đồng Nai", codes: ["VN-58", "VN-39"] },
					{ name: "Đồng Tháp", codes: ["VN-46", "VN-45"] }
				];
				var found = mapping.find(function(p) {
					return p.name.trim().toLowerCase() === (newName || '').trim().toLowerCase();
				});
				return found ? found.codes : [];
			}

			// Hàm ánh xạ mã ISO cũ sang tên tỉnh mới
			function getNewProvinceNameFromISO(oldIso) {
				var isoToNewProvince = {
					// An Giang
					"VN-44": "An Giang", "VN-47": "An Giang", "An Giang": "An Giang", "Kiên Giang": "An Giang",
					// Bắc Ninh
					"VN-54": "Bắc Ninh", "VN-56": "Bắc Ninh", "Bắc Ninh": "Bắc Ninh", "Bắc Giang": "Bắc Ninh",
					// Cao Bằng
					"VN-04": "Cao Bằng", "Cao Bằng": "Cao Bằng",
					// Cà Mau
					"VN-55": "Cà Mau", "VN-59": "Cà Mau", "Cà Mau": "Cà Mau", "Bạc Liêu": "Cà Mau",
					// Gia Lai
					"VN-31": "Gia Lai", "VN-30": "Gia Lai", "Gia Lai": "Gia Lai", "Bình Định": "Gia Lai",
					// Hà Nội
					"VN-HN": "Hà Nội", "Hà Nội": "Hà Nội",
					// Hà Tĩnh
					"VN-23": "Hà Tĩnh", "Hà Tĩnh": "Hà Tĩnh",
					// Hưng Yên
					"VN-66": "Hưng Yên", "VN-20": "Hưng Yên", "Hưng Yên": "Hưng Yên", "Thái Bình": "Hưng Yên",
					// Hải Phòng
					"VN-61": "Hải Phòng", "VN-HP": "Hải Phòng", "Hải Phòng": "Hải Phòng", "Hải Dương": "Hải Phòng",
					// Hồ Chí Minh
					"VN-43": "Hồ Chí Minh", "VN-57": "Hồ Chí Minh", "VN-SG": "Hồ Chí Minh", "TP.HCM": "Hồ Chí Minh", "Bình Dương": "Hồ Chí Minh", "Bà Rịa - Vũng Tàu": "Hồ Chí Minh",
					// Khánh Hòa
					"VN-34": "Khánh Hòa", "VN-36": "Khánh Hòa", "Khánh Hòa": "Khánh Hòa", "Ninh Thuận": "Khánh Hòa",
					// Lai Châu
					"VN-01": "Lai Châu", "Lai Châu": "Lai Châu",
					// Lào Cai
					"VN-02": "Lào Cai", "VN-06": "Lào Cai", "Lào Cai": "Lào Cai", "Yên Bái": "Lào Cai",
					// Lâm Đồng
					"VN-40": "Lâm Đồng", "VN-35": "Lâm Đồng", "VN-72": "Lâm Đồng", "Lâm Đồng": "Lâm Đồng", "Đắk Nông": "Lâm Đồng", "Bình Thuận": "Lâm Đồng",
					// Lạng Sơn
					"VN-09": "Lạng Sơn", "Lạng Sơn": "Lạng Sơn",
					// Nghệ An
					"VN-22": "Nghệ An", "Nghệ An": "Nghệ An",
					// Ninh Bình
					"VN-63": "Ninh Bình", "VN-67": "Ninh Bình", "VN-18": "Ninh Bình", "Ninh Bình": "Ninh Bình", "Hà Nam": "Ninh Bình", "Nam Định": "Ninh Bình",
					// Phú Thọ
					"VN-14": "Phú Thọ", "VN-68": "Phú Thọ", "VN-70": "Phú Thọ", "Phú Thọ": "Phú Thọ", "Vĩnh Phúc": "Phú Thọ", "Hoà Bình": "Phú Thọ",
					// Quảng Ngãi
					"VN-28": "Quảng Ngãi", "VN-29": "Quảng Ngãi", "Quảng Ngãi": "Quảng Ngãi", "Kon Tum": "Quảng Ngãi",
					// Quảng Ninh
					"VN-13": "Quảng Ninh", "Quảng Ninh": "Quảng Ninh",
					// Quảng Trị
					"VN-24": "Quảng Trị", "VN-25": "Quảng Trị", "Quảng Trị": "Quảng Trị", "Quảng Bình": "Quảng Trị",
					// Sơn La
					"VN-05": "Sơn La", "Sơn La": "Sơn La",
					// Thanh Hóa
					"VN-21": "Thanh Hóa", "Thanh Hóa": "Thanh Hóa",
					// Thành phố Cần Thơ
					"VN-CT": "Thành phố Cần Thơ", "VN-73": "Thành phố Cần Thơ", "VN-52": "Thành phố Cần Thơ", "Cần Thơ": "Thành phố Cần Thơ", "Sóc Trăng": "Thành phố Cần Thơ", "Hậu Giang": "Thành phố Cần Thơ",
					// Thái Nguyên
					"VN-53": "Thái Nguyên", "VN-69": "Thái Nguyên", "Thái Nguyên": "Thái Nguyên", "Bắc Kạn": "Thái Nguyên",
					// Thừa Thiên-Huế
					"VN-26": "Thừa Thiên-Huế", "Huế": "Thừa Thiên-Huế", "Thừa Thiên–Huế": "Thừa Thiên-Huế", "Thừa Thiên Huế": "Thừa Thiên-Huế",
					// Tuyên Quang
					"VN-03": "Tuyên Quang", "VN-07": "Tuyên Quang", "Tuyên Quang": "Tuyên Quang", "Hà Giang": "Tuyên Quang",
					// Tây Ninh
					"VN-41": "Tây Ninh", "VN-37": "Tây Ninh", "Tây Ninh": "Tây Ninh", "Long An": "Tây Ninh",
					// Vĩnh Long
					"VN-50": "Vĩnh Long", "VN-51": "Vĩnh Long", "VN-49": "Vĩnh Long", "Vĩnh Long": "Vĩnh Long", "Bến Tre": "Vĩnh Long", "Trà Vinh": "Vĩnh Long",
					// Điện Biên
					"VN-71": "Điện Biên", "Điện Biên": "Điện Biên",
					// Đà Nẵng
					"VN-27": "Đà Nẵng", "VN-DN": "Đà Nẵng", "Đà Nẵng": "Đà Nẵng", "Quảng Nam": "Đà Nẵng",
					// Đắk Lắk
					"VN-32": "Đắk Lắk", "VN-33": "Đắk Lắk", "Đắk Lắk": "Đắk Lắk", "Phú Yên": "Đắk Lắk",
					// Đồng Nai
					"VN-58": "Đồng Nai", "VN-39": "Đồng Nai", "Đồng Nai": "Đồng Nai", "Bình Phước": "Đồng Nai",
					// Đồng Tháp
					"VN-46": "Đồng Tháp", "VN-45": "Đồng Tháp", "Đồng Tháp": "Đồng Tháp", "Tiền Giang": "Đồng Tháp"
				};
				return isoToNewProvince[oldIso] || oldIso;
			}

			$scope.openMapArea = function () {
				console.log("species.distribution:", $scope.species.distribution);
				var regions = [];
				($scope.species.distribution || []).forEach(function(provinceCode) {
					// Giữ nguyên mã ISO cũ, chỉ đổi tên hiển thị
					var provinceName = getNewProvinceNameFromISO(provinceCode);
					regions.push({ id: provinceCode, text: provinceName });
				});
				console.log("regions for map:", regions);
				MapModal.open(0, regions, $scope.species.countries);
			};

			$scope.openMapLatLng = function () {
				MapModal.open(1, $scope.species.lat_lng, $scope.species.countries);
			};

			$scope.getImage = function (link) {
				if (link.indexOf('iucnredlist.org') >= 0) {
					return "IUCN_Red_List.png";
				}
				if (link.indexOf('arkive.org') >= 0) {
					return "Arkive.jpeg";
				}
				if (link.indexOf('eol.org') >= 0) {
					return "Eol.jpg";
				}
				if (link.indexOf('gbif.org') >= 0) {
					return "gbif.gif";
				}
				return "default.jpg";
			};

			$scope.showOnMap = function (location) {
				MapModal.open(2, location, $scope.species.country);
			};

			$scope.showSeq = function(seq) {
				$uibModalInstance.close();
				setTimeout(function() {
					var $rootScope = angular.element(document.body).injector().get('$rootScope');
					$rootScope.$broadcast('openGeneModal', seq);
				}, 300);
			};
			$scope.blastSeq = function(seq) {
				$uibModalInstance.close();
				var info = {
					title: $scope.species.scientific_name || '',
					seq: seq.seq,
					typeGen: seq.gen_type
				};
				sessionStorage.setItem('searchInput', JSON.stringify(info));
				sessionStorage.setItem('searchMethod', 'blast');
				window.location.href = '#/search-dna?auto=1';
			};
			$scope.iqtreeSeq = function(seq) {
				$uibModalInstance.close();
				var info = {
					title: $scope.species.scientific_name || '',
					seq: seq.seq,
					typeGen: seq.gen_type
				};
				sessionStorage.setItem('searchInput', JSON.stringify(info));
				sessionStorage.setItem('searchMethod', 'maximum_likelihood');
				window.location.href = '#/search-dna?auto=1';
			};
		})

		.directive("speciesThumb", function () {
			return {
				restrict: "E",
				templateUrl: "angular/frontend/species-modal/thumbnail-image.html",
				scope: {
					image: "=",
					delete: "&onDelete",
					view: "&onView"
				}
			};
		})

		.directive("areaMap", function () {
			return {
				restrict: "A",
				template: "<div id='chart-region'></div>",
				scope: {
					regions: "=",
					country: "="
				},
				link: function ($scope, elem, attrs) {

					$scope.$watch("regions", function (regions) {
						console.log("regions for map:", regions); // Thêm log kiểm tra dữ liệu truyền vào bản đồ
						var mapCountries = {
							Vietnam: "VN",
							Campuchia: "KH",
							Laos: "LA"
						};

						if (regions.length > 0) {

							var drawChart = function () {
								var data = new google.visualization.DataTable();
								data.addColumn('string', 'Tỉnh');
								data.addColumn('string', 'Tên');
								var geochart = new google.visualization.GeoChart(document.getElementById('chart-region'));
								var options = {
									region: mapCountries[$scope.country],
									legend: "none",
									width: $('.chart-region').width(),
									height: $('.chart-region').width() / 1.6,
									resolution: "provinces"
								};
								_.forEach(regions, function (region) {
									data.addRow([region.id, region.text]);
								});
								geochart.draw(data, options);
							};
							google.load('visualization', '1', {packages: ['geochart'], callback: drawChart});
						}
					});
				}
			};
		})

		.directive("latlngMap", function() {
		    return {
		        restrict: "A",
			    scope: {
				    locations: "=latlngMap"
			    },
		        link: function($scope, elem, attrs) {
					var mapInstance = null;

					$scope.$on('$destroy', function(){
						mapInstance = null;
					});

					$scope.$watch('locations', function (value) {
						if (value && value.length > 0) {
							setTimeout(function(){
								initialize();
							});
						}
					});

					function initialize() {
				        var mapInstance = new google.maps.Map(document.getElementById('map2'), {
					        zoom: 10,
					        center: (function () {
						        var numLocation = $scope.locations.length;

						        var averageLat = _.reduce($scope.locations, function (sum, item) {
									return sum + parseFloat(item.lat);
						        }, 0) / numLocation;

						        var averageLng = _.reduce($scope.locations, function (sum, item) {
									return sum + parseFloat(item.lng);
						        }, 0) / numLocation;
						        return {
							        lat: averageLat,
							        lng: averageLng
						        }
					        })()
				        });

				        _.forEach($scope.locations, function (item) {
					        addMarker({ lat: parseFloat(item.lat), lng: parseFloat(item.lng) }, mapInstance);
				        })
			        }

			        function addMarker(location, map) {
				        var marker = new google.maps.Marker({
					        position: location,
					        map: map
				        });

				        var geocoder = new google.maps.Geocoder;
				        var infowindow = new google.maps.InfoWindow;

				        google.maps.event.addListener(marker, 'click', function() {
					        geocodeLatLng(geocoder, map, infowindow);
				        });

				        function geocodeLatLng(geocoder, map, infowindow) {
					        geocoder.geocode({'location': location}, function(results, status) {
						        if (status === google.maps.GeocoderStatus.OK) {
							        if (results[1]) {
								        infowindow.setContent(results[1].formatted_address);
								        infowindow.open(map, marker);
							        } else {
								        window.alert('No results found');
							        }
						        } else {
							        window.alert('Geocoder failed due to: ' + status);
						        }
					        });
				        }
			        }
		        }
		    };
		})

		.directive("locationMap", function() {
		    return {
		        restrict: "A",
			    scope: {
				    location: "=locationMap"
			    },
		        link: function($scope, elem, attrs) {

					var mapInstance;

					$scope.$on('$destroy', function(){
						mapInstance = null;
					});

					$scope.$watch('location', function (value) {
						if (value) {
							setTimeout(function(){
								initialize();
							});
						}
					});

			        function initialize() {
						mapInstance = new google.maps.Map(document.getElementById('map'), {
					        zoom: 10,
					        center: {
								lat: parseFloat($scope.location.lat),
								lng: parseFloat($scope.location.lng)
							}
				        });

						addMarker({ lat: parseFloat($scope.location.lat), lng: parseFloat($scope.location.lng) }, mapInstance);
			        }

			        function addMarker(location, map) {
				        var marker = new google.maps.Marker({
					        position: location,
					        map: map
				        });

				        var geocoder = new google.maps.Geocoder;
				        var infowindow = new google.maps.InfoWindow;

				        google.maps.event.addListener(marker, 'click', function() {
					        geocodeLatLng(geocoder, map, infowindow);
				        });

				        function geocodeLatLng(geocoder, map, infowindow) {
					        geocoder.geocode({'location': location}, function(results, status) {
						        if (status === google.maps.GeocoderStatus.OK) {
							        if (results[1]) {
								        infowindow.setContent(results[1].formatted_address);
								        infowindow.open(map, marker);
							        } else {
								        window.alert('No results found');
							        }
						        } else {
							        window.alert('Geocoder failed due to: ' + status);
						        }
					        });
				        }
			        }
		        }
		    };
		})

	;

})();

// Lắng nghe sự kiện mở modal gene ở cấp module
angular.module("dna-tracker.modal.species")
.run(function($rootScope, $uibModal) {
    $rootScope.$on('openGeneModal', function(event, seq) {
        $uibModal.open({
            windowClass: 'gene-modal-wide',
            template: '<div class="modal-header">' +
                      '<button type="button" class="close" ng-click="close()">&times;</button>' +
                      '<h4 class="modal-title">Thông tin gien</h4></div>' +
                      '<div class="modal-body">' +
                      '<p><strong>Accession:</strong> {{seq.accession}}</p>' +
                      '<p><strong>Loại gen:</strong> {{seq.gen_type}}</p>' +
                      '<p><strong>Chuỗi:</strong></p>' +
                      '<pre style="word-break: break-all; white-space: pre-line; max-height: 300px; overflow: auto;">{{seq.seq}}</pre>' +
                      '</div>' +
                      '<div class="modal-footer">' +
                      '<button class="btn btn-default" ng-click="close()">Đóng</button>' +
                      '</div>',
            controller: function($scope, $uibModalInstance) {
                $scope.seq = seq;
                $scope.close = function() { $uibModalInstance.close(); };
            }
        });
    });
});