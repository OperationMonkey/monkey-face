(function() {
    'use strict';

    angular
        .module('veganaut.app')
        .component('vgProductListItem', productListItemComponent());

    function productListItemComponent() {
        var component = {
            require: {
                locationDetailsVm: '?^^vgLocationDetails',
                parentVm: '^vgLocationProducts'
            },
            bindings: {
                product: '<vgProduct'
            },
            controller: ProductListItemComponentController,
            templateUrl: 'veganaut/components/productListItem/productListItemComponent.html'
        };

        return component;
    }

    function ProductListItemComponentController() {
        var $ctrl = this;

        var showAllEditingOptions = false;

        $ctrl.isProductListExpanded = false;

        $ctrl.onExpandCollapseToggleClick = function() {
            $ctrl.isProductListExpanded = !$ctrl.isProductListExpanded;

            // When collapsing, hide the editing options again
            if (!$ctrl.isProductListExpanded) {
                showAllEditingOptions = false;
            }
        };

        $ctrl.onShowAllEditingOptionsClick = function() {
            showAllEditingOptions = true;
        };

        $ctrl.isShowingAllEditingOptions = function() {
            return (showAllEditingOptions || ($ctrl.locationDetailsVm && $ctrl.locationDetailsVm.editMode));
        };
    }
})();