(function() {
    'use strict';

    /**
     * Component for the panorama page. Presents all locations and products in one view
     * @returns {{}}
     */
    function panoramaComponent() {
        return {
            controller: PanoramaCtrl,
            controllerAs: '$ctrl',
            templateUrl: 'veganaut/panorama/panoramaComponent.html'

        };
    }

    PanoramaCtrl.$inject = ['$scope', 'backendService', 'areaService', 'pageTitleService'];

    /**
     * Area Overview Controller
     */
    function PanoramaCtrl($scope, backendService, areaService, pageTitleService) {
        var $ctrl = this;

        // Expose the global methods we still need
        // TODO: find a better way to do this
        $ctrl.legacyGlobals = {
            goToView: $scope.$parent.goToView
        };

        /**
         * Go back to show the overview of the last area with id
         */
        $ctrl.backToLastAreaWithId = function() {
            areaService.setArea(areaService.getLastAreaWithId());
            // Show the area and add a new history entry
            showArea(areaService.getCurrentArea(), true);
        };

        /**
         * Last parameters that were used to query the items.
         * @type {{}}
         */
        var lastParams = {};

        /**
         * Resets the list to empty.
         * Note: this doesn't reset the area of the list.
         */
        var resetOverview = function() {
            $ctrl.panorama = {};

            $ctrl.areaType = undefined;
            $ctrl.area = undefined;
            $ctrl.lastAreaWithId = undefined;
            $ctrl.displayRadius = undefined;
        };

        /**
         * Loads the items with the currently set lastParams
         */
        var loadItems = function() {
            backendService.getPanorama(lastParams.lat, lastParams.lng, lastParams.radius).then(function(panorama) {
                $ctrl.panorama = panorama;
            });
        };

        /**
         * Adds the name of the area to the page title
         */
        var setPageTitle = function() {
            pageTitleService.addCustomTitle($ctrl.area.longName);
        };

        var showArea = function(area, addHistoryEntry) {
            // Get the radius params from the area
            lastParams = area.getRadiusParams();

            // Reset the area display variables and the list itself
            resetOverview();
            $ctrl.area = area;

            // Check what type of area we have
            $ctrl.areaType = area.getAreaType();
            if ($ctrl.areaType === 'withoutId') {
                // Area without id and therefore probably without name, ask the
                // service to retrieve a name for the center of the area
                areaService.retrieveNameForArea(area)
                    // Set the name int the page title when done
                    .then(setPageTitle)
                ;
            }
            else {
                // For other area types, we already have a name to set as title
                setPageTitle();
            }

            // If we have a last area with id and it's not the one already shown, we show a
            // button to go back to that area (= the last one the user selected explicitly)
            var lastAreaWithId = areaService.getLastAreaWithId();
            if (angular.isDefined(lastAreaWithId) && area.id !== lastAreaWithId.id) {
                // Expose the area to the template to show the button
                $ctrl.lastAreaWithId = lastAreaWithId;
            }

            // Round the radius to two significant digits and display it as meters or kms
            // TODO: this should be a filter
            var roundingHelper = Math.pow(10, ('' + lastParams.radius).length) / 100;
            var roundedRadius = Math.round(lastParams.radius / roundingHelper) * roundingHelper;
            if (roundedRadius < 1000) {
                $ctrl.displayRadius = roundedRadius + 'm';
            }
            else {
                $ctrl.displayRadius = (roundedRadius / 1000) + 'km';
            }

            // Load items with the newly set params
            loadItems();

            // Update the url
            areaService.writeAreaToUrl(addHistoryEntry);
        };

        $ctrl.$onInit = function() {
            // Try to set the area from the URL params
            areaService.setAreaFromUrl()
                .finally(function() {
                    // Regardless if the area was set from the URL or not, show the current area
                    showArea(areaService.getCurrentArea());
                })
            ;

            // Listen to area changes
            $scope.$on('veganaut.area.changed', function() {
                // Explicit area change coming in, show area and add new history entry
                showArea(areaService.getCurrentArea(), true);
            });


            // Correctly handle the back/forward functionality. See areaList for detailed docu.
            // TODO: De-duplicate this code with the one from areaList
            var routeUpdateFired = false;
            $scope.$on('$routeUpdate', function() {
                routeUpdateFired = true;
            });

            $scope.$on('veganaut.history.onPopState', function() {
                if (routeUpdateFired) {
                    areaService.setAreaFromUrl()
                        .finally(function() {
                            // Regardless if the area was set from the URL or not, show the current area
                            showArea(areaService.getCurrentArea());
                        })
                    ;
                }
                routeUpdateFired = false;
            });
        };
    }

    // Expose as component
    angular.module('veganaut.app.main')
        .component('vgPanorama', panoramaComponent());
})();
