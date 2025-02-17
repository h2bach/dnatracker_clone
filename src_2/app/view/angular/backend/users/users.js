"use strict";

(function () {

    angular.module("dna-tracker.backend.users", [])

        .config(["$stateProvider", "modalSpeciesProvider", function ($stateProvider, modalSpeciesProvider) {
            $stateProvider
                .state("backend.tables-users", {
                    url: "/users",
                    templateUrl: "angular/backend/users/users.html",
                    controller: "tables-users.ctrl"
                });

            modalSpeciesProvider.state("backend.tables-users.users-detail");
        }])

        .controller("tables-users.ctrl", function ($scope, $state, User, userApi, CreateUserModal) {
            if (!User.isLogged) {
                $state.go("backend",null,{reload: true});
                return;
            }

            userApi.getAll().then(function (resp) {
                $scope.users = resp.data.data;
            });

            $scope.openCreateUserModal = function () {
                CreateUserModal.open().result.then(function (data) {
                    $scope.users.push(data)
                });
            }
        })

        .value("Roles", "admin curator".split(" "))

        .factory("CreateUserModal", function($uibModal) {
            return {
                open : function () {
                    return $uibModal.open({
                        templateUrl : "angular/backend/users/create-user-modal.html",
                        controller : "create-new-user.ctrl"
                    });
                }
            };
        })

        .controller("create-new-user.ctrl", function($scope, $uibModalInstance, Roles, userApi) {
            $scope.view = {
                hasReturnData: false,
                returnData: {}
            };

            $scope.roles = Roles;
            $scope.newUser = {
                username: "",
                email: "",
                role: Roles[0]
            };
            $scope.create = function () {
                userApi.create($scope.newUser).then(function (resp) {
                    $scope.view.returnData = resp.data.data;
                    $scope.view.hasReturnData = true;
                });
            };
            $scope.close = function () {
                $uibModalInstance.close($scope.view.returnData);
            };
            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };
        })

        .directive("userRow", function(userApi, Roles) {
            return {
                restrict: "A",
                templateUrl: "angular/backend/users/user-row.html",
                controller: function($scope) {
                    $scope.roles = Roles;

                    $scope.editting = false;
                    $scope.backUp = {};

                    $scope.edit = function () {
                        $scope.editting = true;
                        $scope.backUp = angular.copy($scope.user);
                    };

                    $scope.delete = function () {
                        userApi.delete($scope.user).then(function (resp) {
                            _.remove($scope.users, function(user) {
                                return user._id == $scope.user._id;
                            });
                        })
                    };

                    $scope.cancel = function() {
                        $scope.user = angular.copy($scope.backUp);
                        $scope.editting = false;
                    };

                    $scope.resetPassword = function (user_id) {
                        userApi.resetPassword(user_id).then(function (resp) {
                            alert("new password: " + resp.data.data);
                        })
                    };

                    $scope.save = function () {
                        userApi.update($scope.user).then(function (resp) {
                            $scope.backUp = angular.copy($scope.user);
                            $scope.editting = false;
                        })
                    };
                }
            };
        })

    ;

})();