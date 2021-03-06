(function() {
    'use strict';

    angular
        .module('veganaut.app')
        .component('vgLocationVeganizeTasks', locationVeganizeTasksComponent());

    // TODO: figure out how to use the styling from vg-location-products without using the CSS class names from there
    function locationVeganizeTasksComponent() {
        var component = {
            bindings: {
                tasks: '<vgTasks',
                limit: '<vgLimit'
            },
            controller: LocationVeganizeTasksComponentController,
            templateUrl: 'veganaut/components/locationVeganizeTasks/locationVeganizeTasksComponent.html'
        };

        return component;
    }

    LocationVeganizeTasksComponentController.$inject = ['angularPiwik'];
    function LocationVeganizeTasksComponentController(angularPiwik) {
        var $ctrl = this;
        $ctrl.isListExpanded = false;

        $ctrl.onExpandCollapseToggleClick = function onExpandCollapseToggleClick() {
            $ctrl.isListExpanded = !$ctrl.isListExpanded;
            angularPiwik.track('location.veganizeTasks',
                'location.veganizeTasks.' + ($ctrl.isListExpanded ? 'open' : 'close')
            );
        };
    }
})();
