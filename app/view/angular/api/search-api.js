"use strict";

(function () {

    angular.module('dna-tracker.api.search', [
    ])
        .factory("SearchApi", function(Api) {
            var generateUrl = function (method, type, typeGen, isViaNCBI) {
                if (isViaNCBI) {
                    // Gọi endpoint NCBI phù hợp dựa trên method
                    if (method === 'phylogenetic_distance') {
                        return "/api/search-via-ncbi-phylogenetic?method=" + method + "&type=" + type + "&type_gen=" + typeGen;
                    } else if (method === 'maximum_likelihood') {
                        return "/api/search-via-ncbi-ml?method=" + method + "&type=" + type + "&type_gen=" + typeGen;
                    } else if (method === 'maximum_parsimony') {
                        return "/api/search-via-ncbi-mp?method=" + method + "&type=" + type + "&type_gen=" + typeGen;
                    } else {
                        return "/api/search-via-ncbi?method=" + method + "&type=" + type + "&type_gen=" + typeGen;
                    }
                } else {
                    return "/api/search?method=" + method + "&type=" + type + "&type_gen=" + typeGen;
                }
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