(function() {
    'use strict';

    /**
     * Directive for the global search (across all types of data).
     * Render the form as well as the results.
     * @returns {directive}
     */
    var globalSearchDirective = function() {
        return {
            restrict: 'E',
            scope: {
                /**
                 * Optional handler called when the user selects a search result
                 * or wants to show more results.
                 */
                onSelect: '&?vgOnSelect'
            },
            controller: 'vgGlobalSearchCtrl',
            controllerAs: 'globalSearchVm',
            bindToController: true,
            templateUrl: '/veganaut/search/globalSearch.tpl.html'
        };
    };

    var globalSearchCtrl = [
        '$scope', '$location', '$translate', 'angularPiwik', 'alertService', 'searchService', 'areaService',
        function($scope, $location, $translate, angularPiwik, alertService, searchService, areaService) {
            var vm = this;

            /**
             * Path of area
             * @type {string}
             */
            var AREA_OVERVIEW_PATH = '/area/';

            // Expose the search service
            vm.searchService = searchService;

            /**
             * Handles clicks on a location result
             * @param {Location} location
             */
            vm.onLocationClick = function(location) {
                // Go to the location detail page
                $location.path('location/' + location.id);

                // Track and tell parent
                angularPiwik.track('globalSearch', 'globalSearch.selectResult.location');
                vm.notifyParent();
            };

            /**
             * Handles clicks on the geo results
             * @param {GeocodeResult} geoResult
             */
            vm.onGeoClick = function(geoResult) {
                // Show the are on the currently selected page type
                areaService.setArea(geoResult.area);

                $location.path(AREA_OVERVIEW_PATH);

                // Track and tell parent
                angularPiwik.track('globalSearch', 'globalSearch.selectResult.geo');
                vm.notifyParent();
            };


            /**
             * Handler for clicks on the show more buttons.
             */
            vm.onShowMore = function(resultType) {
                angularPiwik.track('globalSearch', 'globalSearch.showMore.' + resultType);

                // Feature not done yet, inform the user
                alertService.addAlert($translate.instant('missingFeature.showMoreSearchResults'), 'info', undefined, 18000);
            };

            /**
             * Informs the parent that a result was selected
             * (if a handler was defined).
             */
            vm.notifyParent = function() {
                if (angular.isFunction(vm.onSelect)) {
                    vm.onSelect();
                }
            };

            // Track switching of geo action
            $scope.$watch('globalSearchVm.searchService.geoAction', function(valueNow, valueBefore) {
                if (valueNow !== valueBefore) {
                    angularPiwik.track('globalSearch', 'globalSearch.switchGeoAction.' + valueNow);
                }
            });
        }
    ];

    // Expose as directive
    angular.module('veganaut.app.search')
        .controller('vgGlobalSearchCtrl', globalSearchCtrl)
        .directive('vgGlobalSearch', [globalSearchDirective])
    ;
})();
