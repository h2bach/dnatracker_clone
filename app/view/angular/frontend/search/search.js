"use strict";

(function () {

    angular.module("dna-tracker.frontend.search", [
        "dna-tracker.common.user-role",
        "dna-tracker.api.security"
    ])
        .config(["$stateProvider", function ($stateProvider) {
            $stateProvider
                .state("frontend.search-dna", {
                    url: "search-dna",
                    templateUrl: "angular/frontend/search/search-dna.html",
                    controller: "search-dna.ctrl"
                })
                .state("frontend.search-species", {
                    url: "search-species",
                    templateUrl: "angular/frontend/search/search-species.html",
                    controller: "search-species.ctrl"
                })
                .state("frontend.update-species", {
                    url: "update-species",
                    templateUrl: "angular/frontend/search/update-species.html",
                    controller: "UpdateSpeciesController"
                })
            ;
        }])

        .factory("CacheService", function () {
            return {
                data: null
            }
        })

        .controller("search-dna.ctrl", function($scope, $state, SearchApi, CacheService, $location, $timeout) {
            $scope.view = {
                usingFile: false,
                searching: false
            };

            $scope.input = CacheService.data || {
                text: null,
                file: null,
                typeGen: "",
                title: ""
            };

            $scope.isDisabled = function () {
                if ($scope.input.typeGen.length == 0) return true;
                if ($scope.input.file) return false;

                return !$scope.input.text;
            };

            $scope.search = function (type) {
                $scope.view.searching = true;
                var handleResult = function (data) {
                    CacheService.data = _.cloneDeep($scope.input);
                    sessionStorage.setItem('searchResult', JSON.stringify(data));
                    $state.go("frontend.result-dna");
                };
                if ($scope.input.file) {
                    SearchApi.searchWithFile({fasta: $scope.input.file}, type, $scope.input.typeGen).then(function (resp) {
                        handleResult(resp.data);
                    });
                } else {
                    SearchApi.search($scope.input, type, $scope.input.typeGen).then(function (resp) {
                        handleResult(resp.data);
                    });
                }
            }

            // --- Tự động thực hiện tìm kiếm nếu có auto=1 trên URL ---
            $timeout(function() {
                var search = window.location.search || window.location.hash;
                if (search && search.indexOf('auto=1') !== -1) {
                    var info = sessionStorage.getItem('searchInput');
                    var method = sessionStorage.getItem('searchMethod');
                    if (info && method) {
                        try {
                            info = JSON.parse(info);
                            $scope.input.title = info.title || '';
                            $scope.input.text = info.seq || '';
                            $scope.input.typeGen = info.typeGen || '';
                            $scope.input.file = null;
                            $scope.view.searching = false;
                            $scope.$applyAsync();
                            $timeout(function() {
                                $scope.search(method);
                            }, 300);
                        } catch(e) {}
                    }
                }
            }, 200);
        })

        .controller("search-species.ctrl", function($scope, $state, UserRole, User) {
            $scope.view = {
                keyWord: "",
                searching: false
            };

            // Khởi tạo User service
            $scope.User = User;
            $scope.UserRole = UserRole;

            // Kiểm tra trạng thái user khi controller được load
            $scope.checkUserStatus = function() {
                UserRole.checkUserStatus().then(function(result) {
                    console.log('Trạng thái user:', result);
                    $scope.userStatus = result;
                }).catch(function(err) {
                    console.error('Lỗi khi kiểm tra user:', err);
                    $scope.userStatus = {
                        isLoggedIn: false,
                        user: null,
                        role: null
                    };
                });
            };

            // Kiểm tra xem user có quyền admin hoặc curator không
            $scope.canUpdateSpecies = function() {
                return UserRole.isAdmin() || UserRole.isCurator();
            };

            // Kiểm tra trạng thái user ngay khi controller được khởi tạo
            $scope.checkUserStatus();

            $scope.search = function () {
                $scope.view.searching = true;
                $state.go("frontend.result-species", {inputSearch: $scope.view.keyWord});
            };

        })
    ;

})();