angular.module('veganaut.app.location').factory('locationFilterService', [
    '$rootScope', '$routeParams', '$route', '$location', '$uibModal', 'angularPiwik',
    function($rootScope, $routeParams, $route, $location, $uibModal, angularPiwik) {
        'use strict';
        /**
         * Service that keeps the global location filter state.
         * TODO: add an integration test for the whole filtering feature
         * @constructor
         */
        var LocationFilterService = function() {
            /**
             * List of active filters
             * TODO: Remove sortBy from this service as it is not an actual filter
             * @type {{}}
             */
            this.activeFilters = {
                recent: this.INACTIVE_FILTER_VALUE.recent,
                type: this.INACTIVE_FILTER_VALUE.type,
                group: this.INACTIVE_FILTER_VALUE.group,
                sortBy: this.INACTIVE_FILTER_VALUE.sortBy
            };

            // Listen to route changes to clean up URL parameters
            $rootScope.$on('$routeChangeStart', function(event, newRoute, oldRoute) {
                // If the event is still ongoing and there is an old route, update URL params
                if (!event.defaultPrevented && angular.isObject(oldRoute)) {
                    // Check if any of the filters are not relevant on the new route
                    var oldFilters = oldRoute.vgFilters || {};
                    var newFilters = newRoute.vgFilters || {};

                    // TODO WIP NOW: is resetting still necessary now? I think not.

                    if (oldFilters.type === true && newFilters.type !== true) {
                        $location.search('type', undefined);
                    }
                    if (oldFilters.recent === true && newFilters.recent !== true) {
                        $location.search('recent', undefined);
                    }
                    if (oldFilters.group === true && newFilters.group !== true) {
                        $location.search('group', undefined);
                    }
                    if (oldFilters.sortBy === true && newFilters.sortBy !== true) {
                        $location.search('sortBy', undefined);
                    }
                }
            });
        };

        /**
         * Value of the filters for which they are considered inactive.
         * @type {{}}
         */
        LocationFilterService.prototype.INACTIVE_FILTER_VALUE = {
            recent: 'anytime',
            type: 'anytype',
            group: 'anygroup',
            sortBy: 'none'
        };

        /**
         * Categories based on type and group.
         * @type {{gastronomy: {location: string, product: string}, retail: {location: string, product: string}}}
         */
        LocationFilterService.prototype.CATEGORIES = {
            gastronomy: {
                location: 'gastronomyLocation',
                product: 'gastronomyProduct'
            },
            retail: {
                location: 'retailLocation',
                product: 'retailProduct'
            }
        };

        /**
         * Possible filter options for all the available filters
         * @type {{recent: string[]}}
         */
        LocationFilterService.prototype.POSSIBLE_FILTERS = {
            recent: [
                LocationFilterService.prototype.INACTIVE_FILTER_VALUE.recent,
                'month',
                'week',
                'day'
            ],
            type: [
                LocationFilterService.prototype.INACTIVE_FILTER_VALUE.type,
                'gastronomy',
                'retail'
            ],
            group: [
                LocationFilterService.prototype.INACTIVE_FILTER_VALUE.group,
                'location',
                'product'
            ],
            sortBy: [
                LocationFilterService.prototype.INACTIVE_FILTER_VALUE.sortBy,
                'quality',
                'distance',
                'lastUpdate'
            ]
        };

        /**
         * Map of recent filter values to the period of
         * time in seconds for which to show the locations.
         * @type {{month: number, week: number, day: number}}
         */
        LocationFilterService.prototype.RECENT_FILTER_PERIOD = {
            month: 4 * 7 * 24 * 3600,
            week: 7 * 24 * 3600,
            day: 24 * 3600
        };

        /**
         * Returns the recent filter value (number of seconds within which to filter)
         * or undefined if that filter is not active.
         * @returns {number|undefined}
         */
        LocationFilterService.prototype.getRecentFilterValue = function() {
            if (this.activeFilters.recent !== this.INACTIVE_FILTER_VALUE.recent) {
                return this.RECENT_FILTER_PERIOD[this.activeFilters.recent];
            }
            return undefined;
        };

        /**
         * Returns the type filter value or undefined if that filter is not active.
         * @returns {string|undefined}
         */
        LocationFilterService.prototype.getTypeFilterValue = function() {
            if (this.activeFilters.type !== this.INACTIVE_FILTER_VALUE.type) {
                return this.activeFilters.type;
            }
            return undefined;
        };

        /**
         * Returns the group filter value or undefined if that filter is not active.
         * @returns {string|undefined}
         */
        LocationFilterService.prototype.getGroupFilterValue = function() {
            if (this.activeFilters.group !== this.INACTIVE_FILTER_VALUE.group) {
                return this.activeFilters.group;
            }
            return undefined;
        };

        /**
         * Returns the category based on the active type and group
         * @return {string|undefined}
         */
        LocationFilterService.prototype.getCategoryValue = function() {
            if (this.routeHasGroupFilter() &&
                this.routeHasTypeFilter() &&
                this.CATEGORIES[this.activeFilters.type])
            {
                return this.CATEGORIES[this.activeFilters.type][this.activeFilters.group];
            }
            else {
                return undefined;
            }
        };

        /**
         * Returns the sort by value or undefined if that filter is not active.
         * @returns {string|undefined}
         */
        LocationFilterService.prototype.getSortByValue = function() {
            if (this.activeFilters.sortBy !== this.INACTIVE_FILTER_VALUE.sortBy) {
                return this.activeFilters.sortBy;
            }
            return undefined;
        };

        /**
         * Returns whether the current route uses the recent filter
         * @returns {boolean}
         */
        LocationFilterService.prototype.routeHasRecentFilter = function() {
            return (
                angular.isObject($route.current.vgFilters) &&
                $route.current.vgFilters.recent === true
            );
        };

        /**
         * Returns whether the current route uses the type filter
         * @returns {boolean}
         */
        LocationFilterService.prototype.routeHasTypeFilter = function() {
            return (
                angular.isObject($route.current.vgFilters) &&
                $route.current.vgFilters.type === true
            );
        };

        /**
         * Returns whether the current route uses the group filter
         * @returns {boolean}
         */
        LocationFilterService.prototype.routeHasGroupFilter = function() {
            return (
                angular.isObject($route.current.vgFilters) &&
                $route.current.vgFilters.group === true
            );
        };

        /**
         * Returns whether the current route uses the sort by
         * @returns {boolean}
         */
        LocationFilterService.prototype.routeHasSortBy = function() {
            return (
                angular.isObject($route.current.vgFilters) &&
                $route.current.vgFilters.sortBy === true
            );
        };

        /**
         * Returns the number of active filters relevant to the current page
         * @returns {number}
         */
        LocationFilterService.prototype.getNumActiveFilters = function() {
            var active = 0;
            if (this.activeFilters.recent !== this.INACTIVE_FILTER_VALUE.recent &&
                this.routeHasRecentFilter())
            {
                active += 1;
            }

            // We do not count `sortBy` as an active filter because it is not an actual filter.
            // Neither do we consider type & group a filter (otherwise there would always be an active filter)

            return active;
        };

        /**
         * Returns whether there are any filters active relevant to the current page.
         * @returns {boolean}
         */
        LocationFilterService.prototype.hasActiveFilters = function() {
            return (this.getNumActiveFilters() > 0);
        };

        /**
         * Reads and sets the filters from the current route params.
         * TODO: should we listen to route changes and call this ourselves instead of relying on external components?
         */
        LocationFilterService.prototype.setFiltersFromUrl = function() {
            // TODO: don't duplicate all filters, make generic
            if ($routeParams.type) {
                // By default set the inactive value (if invalid value was given)
                var typeFilter = this.INACTIVE_FILTER_VALUE.type;
                if (this.POSSIBLE_FILTERS.type.indexOf($routeParams.type) >= 0) {
                    // Found valid location type filter
                    typeFilter = $routeParams.type;
                }

                // Set the new value
                this.activeFilters.type = typeFilter;
            }

            if ($routeParams.group) {
                // By default set the inactive value (if invalid value was given)
                var groupFilter = this.INACTIVE_FILTER_VALUE.group;
                if (this.POSSIBLE_FILTERS.group.indexOf($routeParams.group) >= 0) {
                    // Found valid location group filter
                    groupFilter = $routeParams.group;
                }

                // Set the new value
                this.activeFilters.group = groupFilter;
            }

            if ($routeParams.recent) {
                // By default set the inactive value (if invalid value was given)
                var recentFilter = this.INACTIVE_FILTER_VALUE.recent;
                if (this.POSSIBLE_FILTERS.recent.indexOf($routeParams.recent) >= 0) {
                    // Found valid recent filter
                    recentFilter = $routeParams.recent;
                }

                // Set the new value
                this.activeFilters.recent = recentFilter;
            }

            if ($routeParams.sortBy) {
                // By default set the inactive value (if invalid value was given)
                var sortBy = this.INACTIVE_FILTER_VALUE.sortBy;
                if (this.POSSIBLE_FILTERS.sortBy.indexOf($routeParams.sortBy) >= 0) {
                    // Found valid sortBy value
                    sortBy = $routeParams.sortBy;
                }

                // Set the new value
                this.activeFilters.sortBy = sortBy;
            }

            // Update the URL to make sure it's always well-formed
            this.updateFiltersInUrl();
        };

        /**
         * Updates the URL params to correctly reflect the currently active filters.
         */
        LocationFilterService.prototype.updateFiltersInUrl = function() {
            // Only change the URL when we are on a route that has filters
            if (!angular.isObject($route.current.vgFilters)) {
                return;
            }

            var recentFilter;
            if (this.activeFilters.recent !== this.INACTIVE_FILTER_VALUE.recent &&
                this.routeHasRecentFilter())
            {
                recentFilter = this.activeFilters.recent;
            }

            var typeFilter;
            if (this.activeFilters.type !== this.INACTIVE_FILTER_VALUE.type &&
                this.routeHasTypeFilter())
            {
                typeFilter = this.activeFilters.type;
            }

            var groupFilter;
            if (this.activeFilters.group !== this.INACTIVE_FILTER_VALUE.group &&
                this.routeHasGroupFilter())
            {
                groupFilter = this.activeFilters.group;
            }

            var sortByValue;
            if (this.activeFilters.sortBy !== this.INACTIVE_FILTER_VALUE.sortBy &&
                this.routeHasSortBy())
            {
                sortByValue = this.activeFilters.sortBy;
            }

            // Replace the url hash (without adding a new history item)
            // Can't use $route.updateParams as this will set all params, not only the ones we want
            $location.replace();
            $location.search('recent', recentFilter);
            $location.search('type', typeFilter);
            $location.search('group', groupFilter);
            $location.search('sortBy', sortByValue);
        };

        /**
         * Informs the service that the filters have changed. This should always be
         * called when modifying the activeFilters.
         * TODO: we should only allow changing the filters over a method here.
         */
        LocationFilterService.prototype.onFiltersChanged = function() {
            // Update the URL and broadcast the change
            this.updateFiltersInUrl();
            $rootScope.$broadcast('veganaut.filters.changed');
        };

        /**
         * Opens the modal containing the form for editing the filters.
         */
        LocationFilterService.prototype.showFilterModal = function() {
            $uibModal.open({
                template: '<vg-global-filters></vg-global-filters>' +
                    '<vg-dismiss-modal-button vg-on-dismiss="$ctrl.onDismiss()"></vg-dismiss-modal-button>',
                controller: 'vgSimpleModalCtrl',
                controllerAs: '$ctrl',
                bindToController: true
            }).result.finally(function() {
                // Track closing of filters
                angularPiwik.track('filters', 'filters.dismissModal');
            });

            // Track opening of filters
            angularPiwik.track('filters', 'filters.openModal', 'filters.openModal.' + $route.current.vgRouteName);
        };

        LocationFilterService.prototype.showSortModal = function() {
            $uibModal.open({
                template: '<vg-global-sort vg-on-close="$ctrl.onClose()"></vg-global-sort>' +
                '<vg-dismiss-modal-button vg-on-dismiss="$ctrl.onDismiss()"></vg-dismiss-modal-button>',
                controller: 'vgSimpleModalCtrl',
                controllerAs: '$ctrl',
                bindToController: true
            }).result.finally(function() {
                // Track closing of sort modal
                angularPiwik.track('sort', 'sort.dismissModal');
            });

            // Track opening of list sort modal
            angularPiwik.track('sort', 'sort.openModal', 'sort.openModal.' + $route.current.vgRouteName);
        };

        return new LocationFilterService();
    }
]);
