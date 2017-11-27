(function() {
    'use strict';


    /**
     * Component for areaOverview. Presents all restaurants and stores in one view
     * @returns {{controller: areaOverviewCtrl, controllerAs: string, templateUrl: string}}
     */
    function areaOverviewComponent() {
        return {
            controller: areaOverviewCtrl,
            controllerAs: '$ctrl',
            templateUrl: 'veganaut/areaOverview/areaOverview.tpl.html'

        };
    }

    areaOverviewCtrl.$inject = [
        'areaOverview',
        'locationFilterService',
        '$location'
    ];


    /**
     * Area Overview Controller
     *
     * @param areaOverview
     * @param locationFilterService
     * @param $location
     */
    function areaOverviewCtrl(areaOverview, locationFilterService, $location) {
        var $ctrl = this;
        $ctrl.areaOverview = areaOverview;
        $ctrl.current = false;
        $ctrl.$onInit = function() {
            // TODO Call to backend for data
        };

        $ctrl.redirectTo = function(type, group) {
            locationFilterService.activeFilters.type = locationFilterService.POSSIBLE_FILTERS.type[type];
            locationFilterService.activeFilters.group = locationFilterService.POSSIBLE_FILTERS.group[group];
            $location.path('/list');
        }
    }


    // Expose as component
    angular.module('veganaut.app.main')
        .component('vgAreaOverview', areaOverviewComponent());
})();
