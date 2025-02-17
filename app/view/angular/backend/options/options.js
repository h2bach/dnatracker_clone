"use strict";

(function () {

    angular.module("dna-tracker.backend.options", [])

        .factory("optionsApi", function(Api) {
            return {
                auth: function (info) {
                    return Api.post("/api/auth", info);
                },
                uploadImportFile: function (file) {
                    return Api.uploadCustom({
                        url: "/api/import-db",
                        arrayKey: '',
                        data: _.assignIn({ importFile: file })
                    });
                }
            };
        })

        .config(["$stateProvider", function ($stateProvider) {
            $stateProvider
                .state("backend.options", {
                    url: "/options",
                    templateUrl: "angular/backend/options/options.html",
                    controller: "options.ctrl"
                })
            ;
        }])

        .controller("options.ctrl", function ($scope, $state, speciesApi, optionsApi) {
            $scope.file = null;
            
            $scope.runExport = function () {
                window.open('/api/export-db');
            };

            $scope.uploadImportFile = function () {
                optionsApi.uploadImportFile($scope.file).then(function (resp) {
                    $scope.file = null;
                })
            };
        })

    ;

})();