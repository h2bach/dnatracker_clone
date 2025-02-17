"use strict";

(function () {

    angular.module("dna-tracker.backend.login", [])

        .config(["$stateProvider", function ($stateProvider) {
            $stateProvider
                .state("backend.login", {
                    url: "/login?message",
                    templateUrl: "angular/backend/login/login.html",
                    controller: "login.ctrl"
                })
            ;
        }])

        .controller("login.ctrl", function ($scope, $state, $stateParams, $window, securityApi, Api, User) {
            $scope.view = {
                status: 2,
                message: $stateParams.message ? $stateParams.message : "Login"
            };

            $scope.input = {
                username: "",
                password: ""
            };

            $scope.login = function () {
                securityApi.authenticate($scope.input).then(function (resp) {
                    var data = resp.data.data;
                    $scope.view.message = data.message;
                    if (resp.data.status == 1) {
                        $scope.view.status = 2;
                        User.isLogged = true;
                        _.assignIn(User.info, data.user);
                        $window.sessionStorage.token = data.token;
                        $state.go('backend');
                    } else {
                        delete $window.sessionStorage.token;
                        $scope.view.status = 0;
                    }
                })
            }
        })

    ;

})();