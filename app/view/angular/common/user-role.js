"use strict";

(function ($) {

    angular.module('dna-tracker.common.user-role', [

        ])

        .factory("UserRole", function(User, securityApi) {
            return {
                isRole: function (roles) {
                    roles = roles.split(" ");
                    return User.isLogged ? roles.indexOf(User.info.role) >= 0 : false;
                },
                checkUserStatus: function() {
                    return securityApi.checkUser().then(function(response) {
                        var data = response.data.data;
                        
                        // Cập nhật trạng thái User
                        User.isLogged = data.isLoggedIn;
                        if (data.isLoggedIn && data.user) {
                            User.info = data.user;
                        } else {
                            User.info = {};
                        }
                        
                        return data;
                    });
                },
                isAdmin: function() {
                    return User.isLogged && User.info.role === 'admin';
                },
                isCurator: function() {
                    return User.isLogged && User.info.role === 'curator';
                },
                isLoggedIn: function() {
                    return User.isLogged;
                }
            };
        })

        .run(function ($rootScope, UserRole) {
            $rootScope.isRole = UserRole.isRole;
            $rootScope.isAdmin = UserRole.isAdmin;
            $rootScope.isCurator = UserRole.isCurator;
            $rootScope.isLoggedIn = UserRole.isLoggedIn;
        })


    ;

})();