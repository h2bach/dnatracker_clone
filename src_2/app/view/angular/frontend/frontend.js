"use strict";

(function () {

    angular.module("dna-tracker.frontend", [
        "dna-tracker.frontend.home",
        "dna-tracker.frontend.search",
        "dna-tracker.frontend.result",
        "dna-tracker.frontend.login"
    ])

        .config(function ($stateProvider) {
            $stateProvider
                .state("frontend", {
                    url: "/",
                    templateUrl: "angular/frontend/frontend.html",
                    controller: "frontend.ctrl"
                });
        })

        .controller("frontend.ctrl", function ($scope, $state) {


            $scope.$watch(function () {
                return $state.current.name;
            }, function (value) {
                if (value == "frontend") {
                    $state.go('frontend.home');
                }
            });
        })

    ;

})();
