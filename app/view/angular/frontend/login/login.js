"use strict";

(function () {

    angular.module("dna-tracker.frontend.login", [

    ])
        .directive("loginBtn", function () {
            return {
                restrict: "E",
                templateUrl: "/angular/frontend/login/login-btn.html",
                controller: function ($scope, $window, User, LoginModal) {
                    $scope.User = User;

                    $scope.openLoginModal = function () {
                        LoginModal.open();
                    };

                    $scope.logout = function () {
                        User.isLogged = false ;
                        User.info = {} ;
                        delete $window.sessionStorage.token;
                    };
                }
            };
        })

        .factory("LoginModal", function ($uibModal) {
            return {
                open: function () {
                    return $uibModal.open({
                        templateUrl: "/angular/frontend/login/login.html",
                        controller: function ($scope, $state, $stateParams, $window, $uibModalInstance, securityApi, Api, User) {
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
                                        $uibModalInstance.close();
                                    } else {
                                        delete $window.sessionStorage.token;
                                        $scope.view.status = 0;
                                    }
                                })
                            }
                        }
                    }).result;
                }
            };
        })

    ;

})();