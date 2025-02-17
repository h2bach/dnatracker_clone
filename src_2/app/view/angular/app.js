"use strict";

(function ($) {

    angular.module("dna-tracker.app", [
        "ui.bootstrap",
        "ui.router",

        "dna-tracker.api.Api",
        "dna-tracker.api.search",
        "dna-tracker.api.species",
        "dna-tracker.api.user",
        "dna-tracker.api.security",

        'dna-tracker.common.theme',
        'dna-tracker.common.user-role',
        'dna-tracker.common.static-value',

        "dna-tracker.modal.species",
        "dna-tracker.frontend",
        "dna-tracker.backend"

    ])

        .config(function ($urlRouterProvider) {
            $urlRouterProvider.otherwise("/home");
        })

        .run(function ($rootScope, $state) {
            $rootScope.$state = $state;
            $rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from, fromParams) {
                $rootScope.previousState = from;
                $rootScope.previousState.params = fromParams;
            });
        })

    ;

})(jQuery);