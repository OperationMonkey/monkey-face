(function() {
    'use strict';

    angular
        .module('veganaut.app.main')
        .component('vgNavBar', navBarComponent());

    function navBarComponent() {
        var component = {
            bindings: {
                menuShown: '=vgMenuShown'
            },
            controller: NavBarController,
            controllerAs: '$ctrl',
            templateUrl: '/veganaut/navBar/navBarComponent.html'
        };

        return component;
    }

    NavBarController.$inject = [
        '$location',
        '$rootScope',
        'localeService',
        'searchService'
    ];

    function NavBarController($location, $rootScope, localeService, searchService) {
        var $ctrl = this;

        // Expose service
        $ctrl.$location = $location;
        $ctrl.localeService = localeService;

        $ctrl.$onInit = function() {
        };

        $ctrl.closeMenu = function() {
            $ctrl.menuShown = false;
        };

        /**
         * Handler for clicks on search button
         */
        $ctrl.searchClick = function() {
            searchService.toggleSearchModal();
        };

        $ctrl.goToView = function(view) {
            $rootScope.goToView(view);
        };
    }
})();
