"use strict";

(function () {

    angular.module("dna-tracker.api.Api", [
        "ngFileUpload"
    ])
        .provider("Api", function () {
            var serverUrl = "";
            this.$get = function ($http, Upload) {
                var customHeaderFunc = null;
                return {
                    getServerUrl: function () {
                        return serverUrl;
                    },
                    get: function (url) {
                        return $http.get(serverUrl + url);
                    },
                    post: function (url, data) {
                        return $http.post(serverUrl + url, data);
                    },
                    put: function (url, data) {
                        return $http.put(serverUrl + url, data);
                    },
                    delete: function (url) {
                        return $http.delete(serverUrl + url);
                    },
                    upload: function (url, uploadData) {
                        return Upload.upload({
                            url: serverUrl + url,
                            data: uploadData
                        });
                    },
                    uploadCustom: Upload.upload
                };
            };
        })

        .factory('authInterceptor', function ($rootScope, $q, $window) {
            return {
                request: function (config) {
                    config.headers = config.headers || {};
                    if ($window.sessionStorage.token && !config.url.match("http://")) {
                        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
                    }
                    return config;
                },
                responseError: function (rejection) {
                    if (rejection.status === 401) {
                        // handle the case where the user is not authenticated
                    }
                    return $q.reject(rejection);
                }
            };
        })

        .config(function ($httpProvider) {
            $httpProvider.interceptors.push('authInterceptor');
        })
    ;

})();