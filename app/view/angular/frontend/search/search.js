"use strict";

(function () {

    angular.module("dna-tracker.frontend.search", [])
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
            ;
        }])

        .factory("CacheService", function () {
            return {
                data: null
            }
        })

        .controller("search-dna.ctrl", function($scope, $state, SearchApi, CacheService) {
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
                    $state.go("frontend.result-dna", {result: data});
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
        })

        .controller("search-species.ctrl", function($scope, $state) {
            $scope.view = {
                keyWord: ""
            };

            $scope.search = function () {
                $state.go("frontend.result-species", {inputSearch: $scope.view.keyWord});
            };

        })
    ;

})();