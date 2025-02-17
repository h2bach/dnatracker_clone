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

				$scope.distribution = _.filter(provinces, function (province) {
					return $scope.species.distribution.indexOf(province.id) >= 0;
				});
			};

			if (species_id) {
				speciesApi.getOneById(species_id).then(function (resp) {
					$scope.species = resp.data.data;
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

			$scope.openMapArea = function () {
				MapModal.open(0, $scope.distribution, $scope.species.countries);
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