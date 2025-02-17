"use strict";

(function () {

    angular.module('dna-tracker.api.user', [
        ])

        .factory("User", function () {
            return {
                isLogged: false,
                info: {}
            };
        })

        .factory("userApi", function (Api) {
            return {
                getAll: function () {
                    return Api.get("/api/users");
                },
                getOneById: function (user_id) {
                    return Api.get("/api/users/" + user_id);
                },
                update: function (user) {
                    return Api.put("/api/users/" + user._id, user);
                },
                create: function (new_user) {
                    return Api.post("/api/users", new_user);
                },
                delete: function (user) {
                    return Api.delete("/api/users/" + user._id);
                },
                resetPassword: function (user_id) {
                    return Api.get("/api/reset-password/" + user_id);
                }
            };
        })
    ;

})();
