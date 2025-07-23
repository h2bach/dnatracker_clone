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
									return item.id.indexOf(mapId[country]) == 0;
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
					provinces = provinces.concat(Provinces[country.text]);
				});

				return _.filter(provinces, function (province) {
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

				$scope.distribution = ($scope.species.distribution || []);
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
				$scope.species.distribution = _.map($scope.distribution, function (province) {
					return province.id;
				});

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
					{ name: "Hà Nội", codes: ["VN-01"] },
					{ name: "Hồ Chí Minh", codes: ["VN-79", "VN-43", "VN-57"] },
					{ name: "Huế", codes: ["VN-26"] },
					{ name: "Đà Nẵng", codes: ["VN-48", "VN-27"] },
					{ name: "Cần Thơ", codes: ["VN-92", "VN-52", "VN-93"] },
					{ name: "Hải Phòng", codes: ["VN-31", "VN-30"] },
					{ name: "Lai Châu", codes: ["VN-12"] },
					{ name: "Điện Biên", codes: ["VN-14"] },
					{ name: "Sơn La", codes: ["VN-05"] },
					{ name: "Lạng Sơn", codes: ["VN-09"] },
					{ name: "Quảng Ninh", codes: ["VN-13"] },
					{ name: "Thanh Hoá", codes: ["VN-21"] },
					{ name: "Nghệ An", codes: ["VN-22"] },
					{ name: "Hà Tĩnh", codes: ["VN-23"] },
					{ name: "Cao Bằng", codes: ["VN-04"] },
					{ name: "Tuyên Quang", codes: ["VN-07", "VN-03"] },
					{ name: "Lào Cai", codes: ["VN-02", "VN-06"] },
					{ name: "Thái Nguyên", codes: ["VN-19", "VN-09"] },
					{ name: "Phú Thọ", codes: ["VN-25", "VN-26", "VN-15"] },
					{ name: "Bắc Ninh", codes: ["VN-27", "VN-24"] },
					{ name: "Hưng Yên", codes: ["VN-66", "VN-20"] },
					{ name: "Ninh Bình", codes: ["VN-18", "VN-35", "VN-37"] },
					{ name: "Quảng Trị", codes: ["VN-45", "VN-44"] },
					{ name: "Quảng Ngãi", codes: ["VN-51", "VN-49"] },
					{ name: "Gia Lai", codes: ["VN-30", "VN-31"] },
					{ name: "Khánh Hòa", codes: ["VN-34", "VN-58"] },
					{ name: "Lâm Đồng", codes: ["VN-35", "VN-72", "VN-40"] },
					{ name: "Đắk Lắk", codes: ["VN-33", "VN-32"] },
					{ name: "Đồng Nai", codes: ["VN-39", "VN-37"] },
					{ name: "Tây Ninh", codes: ["VN-37", "VN-41"] },
					{ name: "Vĩnh Long", codes: ["VN-49", "VN-50", "VN-51"] },
					{ name: "Đồng Tháp", codes: ["VN-45", "VN-46"] },
					{ name: "Cà Mau", codes: ["VN-59", "VN-55"] },
					{ name: "An Giang", codes: ["VN-44", "VN-47"] }
				];
				var found = mapping.find(function(p) {
					return p.name.trim().toLowerCase() === (newName || '').trim().toLowerCase();
				});
				return found ? found.codes : [];
			}

			// Hàm ánh xạ mã ISO cũ sang tên tỉnh mới
			function getNewProvinceNameFromISO(oldIso) {
				var isoToNewProvince = {
					// Hà Nội
					"VN-HN": "Hà Nội", "Hà Nội": "Hà Nội",
					// Hồ Chí Minh
					"VN-SG": "Hồ Chí Minh", "TP.HCM": "Hồ Chí Minh", "VN-43": "Hồ Chí Minh", "VN-57": "Hồ Chí Minh", "Bà Rịa–Vũng Tàu": "Hồ Chí Minh", "Bình Dương": "Hồ Chí Minh",
					// Huế
					"VN-26": "Huế", "Thừa Thiên–Huế": "Huế", "Thừa Thiên Huế": "Huế",
					// Đà Nẵng
					"VN-DN": "Đà Nẵng", "Đà Nẵng": "Đà Nẵng", "VN-27": "Đà Nẵng", "Quảng Nam": "Đà Nẵng",
					// Cần Thơ
					"VN-CT": "Cần Thơ", "Cần Thơ": "Cần Thơ", "VN-52": "Cần Thơ", "Sóc Trăng": "Cần Thơ", "VN-73": "Cần Thơ", "Hậu Giang": "Cần Thơ",
					// Hải Phòng
					"VN-HP": "Hải Phòng", "Hải Phòng": "Hải Phòng", "VN-61": "Hải Phòng", "Hải Dương": "Hải Phòng",
					// Lai Châu
					"VN-01": "Lai Châu", "Lai Châu": "Lai Châu",
					// Điện Biên
					"VN-71": "Điện Biên", "Điện Biên": "Điện Biên",
					// Sơn La
					"VN-05": "Sơn La", "Sơn La": "Sơn La",
					// Lạng Sơn
					"VN-09": "Lạng Sơn", "Lạng Sơn": "Lạng Sơn",
					// Quảng Ninh
					"VN-13": "Quảng Ninh", "Quảng Ninh": "Quảng Ninh",
					// Thanh Hoá
					"VN-21": "Thanh Hoá", "Thanh Hoá": "Thanh Hoá",
					// Nghệ An
					"VN-22": "Nghệ An", "Nghệ An": "Nghệ An",
					// Hà Tĩnh
					"VN-23": "Hà Tĩnh", "Hà Tĩnh": "Hà Tĩnh",
					// Cao Bằng
					"VN-04": "Cao Bằng", "Cao Bằng": "Cao Bằng",
					// Tuyên Quang
					"VN-07": "Tuyên Quang", "Tuyên Quang": "Tuyên Quang", "VN-03": "Tuyên Quang", "Hà Giang": "Tuyên Quang",
					// Lào Cai
					"VN-02": "Lào Cai", "Lào Cai": "Lào Cai", "VN-06": "Lào Cai", "Yên Bái": "Lào Cai",
					// Thái Nguyên
					"VN-69": "Thái Nguyên", "Thái Nguyên": "Thái Nguyên", "VN-53": "Thái Nguyên", "Bắc Kạn": "Thái Nguyên",
					// Phú Thọ
					"VN-68": "Phú Thọ", "Phú Thọ": "Phú Thọ", "VN-70": "Phú Thọ", "Vĩnh Phúc": "Phú Thọ", "VN-14": "Phú Thọ", "Hoà Bình": "Phú Thọ",
					// Bắc Ninh
					"VN-56": "Bắc Ninh", "Bắc Ninh": "Bắc Ninh", "VN-54": "Bắc Ninh", "Bắc Giang": "Bắc Ninh",
					// Hưng Yên
					"VN-66": "Hưng Yên", "Hưng Yên": "Hưng Yên", "VN-20": "Hưng Yên", "Thái Bình": "Hưng Yên",
					// Ninh Bình
					"VN-18": "Ninh Bình", "Ninh Bình": "Ninh Bình", "VN-63": "Ninh Bình", "Hà Nam": "Ninh Bình", "VN-67": "Ninh Bình", "Nam Định": "Ninh Bình",
					// Quảng Trị
					"VN-25": "Quảng Trị", "Quảng Trị": "Quảng Trị", "VN-24": "Quảng Trị", "Quảng Bình": "Quảng Trị",
					// Quảng Ngãi
					"VN-29": "Quảng Ngãi", "Quảng Ngãi": "Quảng Ngãi", "VN-28": "Quảng Ngãi", "Kon Tum": "Quảng Ngãi",
					// Gia Lai
					"VN-30": "Gia Lai", "Gia Lai": "Gia Lai", "VN-31": "Gia Lai", "Bình Định": "Gia Lai",
					// Khánh Hòa
					"VN-34": "Khánh Hòa", "Khánh Hòa": "Khánh Hòa", "VN-36": "Khánh Hòa", "Ninh Thuận": "Khánh Hòa",
					// Lâm Đồng
					"VN-35": "Lâm Đồng", "Lâm Đồng": "Lâm Đồng", "VN-72": "Lâm Đồng", "Đắk Nông": "Lâm Đồng", "VN-40": "Lâm Đồng", "Bình Thuận": "Lâm Đồng",
					// Đắk Lắk
					"VN-33": "Đắk Lắk", "Đắk Lắk": "Đắk Lắk", "VN-32": "Đắk Lắk", "Phú Yên": "Đắk Lắk",
					// Đồng Nai
					"VN-39": "Đồng Nai", "Đồng Nai": "Đồng Nai", "VN-58": "Đồng Nai", "Bình Phước": "Đồng Nai",
					// Tây Ninh
					"VN-37": "Tây Ninh", "Tây Ninh": "Tây Ninh", "VN-41": "Tây Ninh", "Long An": "Tây Ninh",
					// Vĩnh Long
					"VN-49": "Vĩnh Long", "Vĩnh Long": "Vĩnh Long", "VN-50": "Vĩnh Long", "Bến Tre": "Vĩnh Long", "VN-51": "Vĩnh Long", "Trà Vinh": "Vĩnh Long",
					// Đồng Tháp
					"VN-45": "Đồng Tháp", "Đồng Tháp": "Đồng Tháp", "VN-46": "Đồng Tháp", "Tiền Giang": "Đồng Tháp",
					// Cà Mau
					"VN-59": "Cà Mau", "Cà Mau": "Cà Mau", "VN-55": "Cà Mau", "Bạc Liêu": "Cà Mau",
					// An Giang
					"VN-44": "An Giang", "An Giang": "An Giang", "VN-47": "An Giang", "Kiên Giang": "An Giang"
				};
				return isoToNewProvince[oldIso] || oldIso;
			}

			$scope.openMapArea = function () {
				console.log("species.distribution:", $scope.species.distribution);
				var regions = [];
				($scope.species.distribution || []).forEach(function(provinceCode) {
					// provinceCode là mã ISO cũ, dùng trực tiếp cho map
					var provinceName = getNewProvinceNameFromISO(provinceCode); // để hiển thị tên mới
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