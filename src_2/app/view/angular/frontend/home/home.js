"use strict";

(function () {

    angular.module("dna-tracker.frontend.home", [
        ])

        .config(["$stateProvider", "modalSpeciesProvider", function ($stateProvider) {
            $stateProvider
                .state("frontend.home", {
                    url: "home",
                    templateUrl: "angular/frontend/home/home.html",
                    controller: "home.ctrl"
                });
        }])

        .controller("home.ctrl", function ($scope, CacheService) {
            CacheService.data = null;
        })
    ;

})();