"use strict";

(function ($) {

    angular.module('dna-tracker.common.user-role', [

        ])

        .factory("UserRole", function(User) {
            return {
                isRole: function (roles) {
                    roles = roles.split(" ");
                    return User.isLogged ? roles.indexOf(User.info.role) >= 0 : false;
                }
            };
        })

        .run(function ($rootScope, UserRole) {
            $rootScope.isRole = UserRole.isRole;
        })


    ;

})();