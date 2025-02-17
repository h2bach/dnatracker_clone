"use strict";

(function () {

    angular.module("dna-tracker.backend.species", [])

        .config(["$stateProvider", "modalSpeciesProvider", function ($stateProvider, modalSpeciesProvider) {
            $stateProvider
                .state("backend.tables-species", {
                    url: "/species",
                    templateUrl: "angular/backend/species/species.html",
                    controller: "tables-species.ctrl"
                });

            modalSpeciesProvider.state("backend.tables-species.species-detail", function ($state) {
                $state.go("backend.tables-species");
            });
        }])

        .factory("ModalConfirm", function ($uibModal) {
            return {
                open: function () {
                    return $uibModal.open({
                        templateUrl: "/angular/backend/species/modal-confirm.html",
                        size: "sm",
                        controller: function ($scope, $uibModalInstance) {
                            $scope.delete = function () {
                                $uibModalInstance.close();
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss();
                            };
                        }
                    }).result;
                }
            };
        })
        
        .filter('country', function () {
            return function (input, country) {
                if (!country || (country && country.length == 0)) {
                    return input
                }

                return _.filter(input, function (item) {
                    return item.countries.indexOf(country) >= 0;
                })
            }
        })

        .controller("tables-species.ctrl", function ($scope, $state, speciesApi, User, previewSpeciesModal, ModalConfirm) {
            $scope.view = {
                search: "",
                country: ""
            };

            $scope.items = [];

            var init = function () {
                speciesApi.getAll().then(function (resp) {
                    $scope.items = resp.data.data;
                });
            };

            init();

            $scope.view = function (species) {
                previewSpeciesModal.open(species._id).then(function () {
                    init();
                })
            };

            $scope.delete = function (species) {
                ModalConfirm.open().then(function () {
                    speciesApi.delete(species).then(function (resp) {
                        _.remove($scope.items, function (item) {
                            return item._id == species._id;
                        });
                    })
                })
            };

            $scope.openCreateSpeciesModal = function () {
                previewSpeciesModal.open("").then(function () {
                    init();
                })
            };
        })

        .directive("speciesRow", function(speciesApi) {
            return {
                restrict: "A",
                templateUrl: "angular/backend/species/species-row.html",
                controller: function($scope) {
                    $scope.editting = false;
                    $scope.backUp = {};

                    $scope.edit = function () {
                        $scope.editting = true;
                        $scope.backUp = angular.copy($scope.species);
                    };

                    $scope.cancel = function() {
                        $scope.species = angular.copy($scope.backUp);
                        $scope.editting = false;
                    };

                    $scope.save = function () {
                        speciesApi.update({species: $scope.species}).then(function (resp) {
                            $scope.backUp = angular.copy($scope.species);
                            $scope.editting = false;
                        })
                    };
                }
            };
        })

    ;

})();