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
        '$location', 'constants', 'pageTitleService'
    ];

    function LocationDetailsComponentController($location, constants, pageTitleService) {
        var $ctrl = this;

        // TODO WIP: handle location not found nicely

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

        $ctrl.$onInit = function() {
            pageTitleService.addCustomTitle($ctrl.location.name);
        };

        // TODO: list of veganize tasks should come from config
        $ctrl.veganizeTasks = _.shuffle(['MentionVegan', 'GiveFeedback', 'BuyProduct']);

        $ctrl.toggleEditMode = function() {
            // TODO WIP: call setEditing() on location model?
            $ctrl.editMode = !$ctrl.editMode;
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
    }
})();
