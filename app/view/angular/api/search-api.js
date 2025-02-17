"use strict";

(function () {

    angular.module('dna-tracker.api.search', [
    ])
        .factory("SearchApi", function(Api) {
            var generateUrl = function (method, type, typeGen, isViaNCBI) {
                return "/api/search" + (isViaNCBI ? "-via-ncbi" : "") + "?method=" + method + "&type=" + type + "&type_gen=" + typeGen;
            };
            return {
                search: function (info, method, typeGen, isViaNCBI) {
                    return Api.post(generateUrl(method, "text", typeGen, isViaNCBI), info);
                },
                searchWithFile: function (info, method, typeGen, isViaNCBI) {
                    return Api.upload(generateUrl(method, "file", typeGen, isViaNCBI), info);
                }
            };
        })
    ;

})();