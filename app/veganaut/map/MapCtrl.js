(function(module) {
    'use strict';

    // TODO: refactor (it's getting way too big!), document and add tests!!
    module.controller('MapCtrl', [
        '$scope', '$location', '$timeout', 'leafletData', 'angularPiwik',
        'playerService', 'Location', 'locationService', 'backendService',
        function($scope, $location, $timeout, leafletData, angularPiwik,
            playerService, Location, locationService, backendService) {
            var player;

            /**
             * Locations loaded from the backend indexed by id
             * @type {{}}
             */
            var locations = {};

            /**
             * Whether the user is currently adding a new location
             * @type {boolean}
             */
            $scope.isAddingLocation = false;

            // TODO: all this addLocation stuff should be separated to a directive or other controller
            $scope.addLocationStep = 1;

            $scope.nextStep = function() {
                if ($scope.stepIsValid()) {
                    if ($scope.isLastStep()) {
                        $scope.addNewLocation();
                        angularPiwik.track('map.addLocation', 'finish');
                    }
                    else {
                        $scope.addLocationStep += 1;
                        angularPiwik.track('map.addLocation', 'nextStep', $scope.addLocationStep);
                    }
                }
            };

            $scope.previousStep = function() {
                if ($scope.addLocationStep > 1) {
                    $scope.addLocationStep -= 1;
                    angularPiwik.track('map.addLocation', 'previousStep', $scope.addLocationStep);
                }
            };

            $scope.stepIsValid = function() {
                var loc = $scope.newLocation;
                switch ($scope.addLocationStep) {
                case 1:
                    return (angular.isString(loc.name) && loc.name.length > 0);
                case 2:
                    return (angular.isString(loc.type) && loc.type.length > 0);
                case 3:
                    return (angular.isNumber(loc.lat) && angular.isNumber(loc.lng));
                default:
                    return false;
                }
            };

            $scope.isLastStep = function() {
                return ($scope.addLocationStep === 3);
            };

            // Expose the location service
            $scope.location = locationService;

            // Expose map settings and filters from the service
            $scope.mapSettings = locationService.mapSettings;
            $scope.activeFilters = locationService.activeFilters;
            $scope.POSSIBLE_FILTERS = locationService.POSSIBLE_FILTERS;

            /**
             * Expose the location types
             * @type {{}}
             */
            $scope.locationTypes = Location.TYPES;

            /**
             * Empty events object (needed to get the leaflet map to broadcast events)
             * @type {{}}
             */
            $scope.events = {};

            /**
             * Location that is currently being added
             * @type {Location}
             */
            $scope.newLocation = undefined;

            /**
             * Whether to show the location products
             * @type {boolean}
             */
            $scope.productShown = false;

            /**
             * Whether to show the location filters
             * @type {boolean}
             */
            $scope.filtersShown = false;

            /**
             * whether to show search
             * @type {boolean}
             */
            $scope.searchShown = false;

            /**
             * Sets whether the product is shown
             * @param {boolean} [show=true]
             */
            $scope.showProducts = function(show) {
                if (typeof show === 'undefined') {
                    show = true;
                }
                show = !!show;

                // Update and track if it changed
                if ($scope.productShown !== show) {
                    $scope.productShown = show;
                    // angularPiwik.track('map.product', show ? 'open' : 'close');
                }
            };

            /**
             * Sets whether the filters are shown
             * @param {boolean} [show=true]
             */
            $scope.showFilters = function(show) {
                if (typeof show === 'undefined') {
                    show = true;
                }
                show = !!show;

                // Update and track if it changed
                if ($scope.filtersShown !== show) {
                    $scope.filtersShown = show;
                    angularPiwik.track('map.filter', show ? 'open' : 'close');
                }
            };

            /**
             * Sets whether the search is shown
             * @param {boolean} [show=true]
             */
            $scope.showSearch = function(show) {
                if (typeof show === 'undefined') {
                    show = true;
                }
                show = !!show;

                // Update and track if it changed
                if ($scope.searchShown !== show) {
                    $scope.searchShown = show;
                    angularPiwik.track('map.search', show ? 'open' : 'close');
                }
            };

            /**
             * Returns the number of currently active filters
             * @returns {number}
             */
            $scope.numActiveFilters = function() {
                var active = 0;
                if ($scope.activeFilters.recent !== 'anytime') {
                    active += 1;
                }
                if ($scope.activeFilters.type !== 'anytype') {
                    active += 1;
                }

                return active;
            };

            /**
             * Whether the newLocation has already been added to the map
             * @type {boolean}
             */
            var newLocationIsAddedToMap = false;

            /**
             * Starts adding a new location
             */
            $scope.startAddNewLocation = function() {
                $scope.addLocationStep = 1;
                $scope.isAddingLocation = true;
                $scope.newLocation = new Location({team: player.team});
                locationService.activate($scope.newLocation);

                angularPiwik.track('map.addLocation', 'start');
            };

            /**
             * Aborts adding a new location
             */
            $scope.resetAddNewLocation = function() {
                locationService.activate();
                // Remove from map if it was added
                if (newLocationIsAddedToMap === true) {
                    var markerToRemove = $scope.newLocation.marker;
                    mapPromise.then(function(map) {
                        map.removeLayer(markerToRemove);
                    });
                }
                $scope.isAddingLocation = false;
                $scope.newLocation = undefined;
                newLocationIsAddedToMap = false;
            };

            /**
             * Finalises adding a new location
             */
            $scope.addNewLocation = function() {
                var newLocation = $scope.newLocation;
                $scope.isAddingLocation = false;
                $scope.newLocation = undefined;
                newLocationIsAddedToMap = false;

                // Submit the location and add it to the list once done
                locationService.submitLocation(newLocation)
                    .then(function() {
                        locations[newLocation.id] = newLocation;
                    })
                ;
            };

            /**
             * Goes to the location view
             * @param location
             */
            $scope.visitLocation = function(location) {
                $location.path('location/' + location.id);
            };

            /**
             * Sets the given coordinates as the lat/lng of the location
             * that is being added.
             * @param {number} lat
             * @param {number} lng
             */
            $scope.setNewLocationCoordinates = function(lat, lng) {
                if ($scope.isAddingLocation) {
                    // Set the coordinates
                    $scope.newLocation.setLatLng(lat, lng);

                    // Push to map if not already there
                    if (newLocationIsAddedToMap !== true) {
                        mapPromise.then(function(map) {
                            $scope.newLocation.marker.on('click', locationClickHandler);
                            $scope.newLocation.marker.addTo(map);
                        });
                        newLocationIsAddedToMap = true;
                    }
                }
            };

            /**
             * Handler for clicks on the map
             * @param event
             * @param args
             */
            var mapClickHandler = function(event, args) {
                if ($scope.isAddingLocation) {
                    // When adding a new location, take the click
                    // as the coordinates of this new location
                    $scope.setNewLocationCoordinates(
                        args.leafletEvent.latlng.lat,
                        args.leafletEvent.latlng.lng
                    );

                    angularPiwik.track('map.addLocation', 'mapClick');
                }
                else {
                    // When not adding a location, deselect currently active location
                    locationService.activate();

                    // And hide filters and search
                    $scope.showProducts(false);
                    $scope.showFilters(false);
                    $scope.showSearch(false);
                }
            };

            /**
             * Handler for clicks on map markers (Locations)
             * @param event Event coming directly from leaflet
             *      (not angular-leaflet-directive)
             */
            var locationClickHandler = function(event) {
                if (!$scope.isAddingLocation) {
                    var clickedLocation = locations[event.target.locationId];
                    if (clickedLocation) {
                        // Run it through $apply since we are coming directly from Leaflet
                        $scope.$apply(function() {
                            locationService.activate(clickedLocation);

                            // Hide the filters and search
                            $scope.showProducts(false);
                            $scope.showFilters(false);
                            $scope.showSearch(false);
                        });
                    }
                }
            };

            // Get a reference the the leaflet map object
            var mapPromise = leafletData.getMap();

            // Register event handlers
            $scope.$on('leafletDirectiveMap.click', mapClickHandler);

            // Get the locations
            locationService.getLocations().then(function(loadedLocations) {
                locations = loadedLocations;
                mapPromise.then(function(map) {
                    // Go through all the locations and add the marker to the map
                    angular.forEach(locations, function(location) {
                        location.marker.on('click', locationClickHandler);
                        location.marker.addTo(map);
                    });

                    // Apply the current filter value
                    applyFilters($scope.activeFilters);
                });
            });

            // Check if we are logged in
            if (backendService.isLoggedIn()) {
                // Get the player
                playerService.getMe().then(function(me) {
                    player = me;
                });
            }

            // Watch the map center for changes to save it
            $scope.$watch('mapSettings.center', function() {
                locationService.saveMapCenter();
            });


            // TODO: move the filter stuff to a separate controller
            /**
             * Map of recent filter values to the period of
             * time for which to show the locations.
             * @type {{month: number, week: number, day: number}}
             */
            var RECENT_FILTER_PERIOD = {
                month: 4 * 7 * 24 * 3600000,
                week: 7 * 24 * 3600000,
                day: 24 * 3600000
            };

            /**
             * Runs the locations through the given recent filter
             * @param recentFilter
             */
            var _applyRecentFilter = function(recentFilter) {
                var showAll = (recentFilter === 'anytime');
                var recentDate;
                if (!showAll) {
                    recentDate = new Date(Date.now() - RECENT_FILTER_PERIOD[recentFilter]);
                }

                // Go through all the locations and filter them
                angular.forEach(locations, function(location) {
                    // Only apply the filter if the location is not already hidden
                    if (!location.isHidden()) {
                        var hideIt = (!showAll && location.updatedAt < recentDate);
                        location.setHidden(hideIt);
                    }
                });
            };

            /**
             * Runs the locations through the given type filter
             * @param typeFilter
             */
            var _applyTypeFilter = function(typeFilter) {
                var showAll = (typeFilter === 'anytype');
                // Go through all the locations and filter them
                angular.forEach(locations, function(location) {
                    // Only apply the filter if the location is not already hidden
                    if (!location.isHidden()) {
                        var hideIt = (!showAll && location.type !== typeFilter);
                        location.setHidden(hideIt);
                    }
                });
            };

            /**
             * Runs the locations through all the filters
             * Add new filters to this function
             * @param typeFilter
             */
            var applyFilters = function(filters, filtersBefore) {
                // First show all the locations
                // TODO: this is inefficient because the marker might update twice (show it, then hide it again)
                angular.forEach(locations, function(location) {
                    location.setHidden(false);
                });

                // Track filter usage
                if (angular.isDefined(filtersBefore)) {
                    if (filters.recent !== filtersBefore.recent) {
                        angularPiwik.track('map.filters', 'applyFilter.recent', filters.recent);
                    }
                    if (filters.type !== filtersBefore.type) {
                        angularPiwik.track('map.filters', 'applyFilter.type', filters.type);
                    }
                }

                // Then run the filters
                _applyRecentFilter(filters.recent);
                _applyTypeFilter(filters.type);
            };

            // Watch the active filters
            $scope.$watch('activeFilters', applyFilters, true);
        }
    ]);
})(window.veganaut.mapModule);
