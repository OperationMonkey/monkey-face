(function() {
    'use strict';

    angular
        .module('veganaut.app.location')
        .component('vgLocationDetails', locationDetailsComponent());

    function locationDetailsComponent() {
        var component = {
            bindings: {
                // The location to show the title and icons for
                location: '<vgLocation'
            },
            controller: LocationDetailsComponentController,
            controllerAs: '$ctrl',
            templateUrl: '/veganaut/location/locationDetailsComponent.html'
        };

        return component;
    }

    LocationDetailsComponentController.$inject = [
        '$scope', '$routeParams', '$location', 'constants', 'pageTitleService'
    ];

    function LocationDetailsComponentController($scope, $routeParams, $location, constants, pageTitleService) {
        var $ctrl = this;

        /**
         * Whether we are currently in edit mode
         * @type {boolean}
         */
        $ctrl.editMode = false;

        /**
         * Which edit task is currently shown in the overlay
         * @type {string}
         */
        $ctrl.editTask = undefined;

        /**
         * Product that is edited (or undefined if not editing or not a
         * product edit task)
         * @type {{}}
         */
        $ctrl.editProduct = undefined;

        /**
         * Sets the edit mode based on the params given int he URL
         */
        var setEditModeFromParams = function() {
            $ctrl.editMode = ($routeParams.edit === true);
            $ctrl.location.setEditing($ctrl.editMode);
        };

        $ctrl.$onInit = function() {
            pageTitleService.addCustomTitle($ctrl.location.name);
        };

        // TODO: list of veganize tasks should come from config
        $ctrl.veganizeTasks = _.shuffle(['MentionVegan', 'GiveFeedback', 'BuyProduct']);

        $ctrl.toggleEditMode = function() {
            $location.search('edit', ($ctrl.editMode ? null : true));
        };

        $ctrl.closeEditOverlay = function() {
            $ctrl.editTask = undefined;
            $ctrl.editProduct = undefined;
        };

        $ctrl.startTask = function(property, product) {
            $ctrl.editTask = property;
            $ctrl.editProduct = product;
        };

        $ctrl.mapClickHandler = function() {
            if ($ctrl.editMode) {
                $ctrl.startTask('SetLocationCoordinates');
            }
            else {
                // TODO: show the location as selected when going to the map
                $location.url('/map/?zoom=17&coords=' +
                    $ctrl.location.lat.toFixed(constants.URL_FLOAT_PRECISION) + ',' +
                    $ctrl.location.lng.toFixed(constants.URL_FLOAT_PRECISION) +
                    '&type=' + $ctrl.location.type + '&granularity=location'
                );
            }
        };

        // Listen to route updates to set the edit mode, and read the URL state now
        $scope.$on('$routeUpdate', setEditModeFromParams);
        setEditModeFromParams();

        // Make sure edit mode is turned off before we leave this location
        $scope.$on('$routeChangeStart', function() {
            $ctrl.location.setEditing(false);
        });
    }
})();
