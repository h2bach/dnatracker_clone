"use strict";

(function () {

    angular.module("dna-tracker.backend", [
        "ui.bootstrap",
        "dna-tracker.backend.login",
        "dna-tracker.backend.options",
        "dna-tracker.backend.species",
        "dna-tracker.backend.users"
    ])

        .config(function ($stateProvider) {
            $stateProvider
                .state("backend", {
                    url: "/backend",
                    templateUrl: "angular/backend/backend.html",
                    controller: "backend.ctrl"
                });
        })

        .controller("backend.ctrl", function ($scope, $state, $window, User, securityApi) {
            implementAdminLte();
            if(!User.isLogged){
                if($window.sessionStorage.token) {
                    securityApi.checkToken().then(function (resp) {
                        User.isLogged = true;
                        _.assignIn(User.info, resp.data.data.user);
                    });
                } else {
                    $state.go("backend.login");
                }
            }
            $scope.User = User;
            $scope.$state = $state;
            $scope.logout = function () {
                User.isLogged = false ;
                User.info = {} ;
                delete $window.sessionStorage.token;
                $state.go("backend.login");
            };
        })

        //.run(function ($state, $window, User, securityApi) {
        //    if(!User.isLogged){
        //        if($window.sessionStorage.token) {
        //            securityApi.checkToken().then(function (resp) {
        //                User.isLogged = true;
        //                _.assignIn(User.info, resp.data.data.user);
        //            });
        //        } else {
        //            $state.go("backend.login");
        //        }
        //    }
        //})

    ;

})();