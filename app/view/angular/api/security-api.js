"use strict";

(function () {

    angular.module('dna-tracker.api.security', [
        ])

        .factory("securityApi", function (Api) {
            return {
                checkToken: function () {
                    return Api.get("/api/check-token");
                },
                authenticate: function (info) {
                    return Api.post("/api/authenticate", info);
                }
            };
        })
    ;

})();
