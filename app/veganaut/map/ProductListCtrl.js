(function(module) {
    'use strict';
    module.controller('ProductListCtrl', [
        '$scope', 'locationService', '$location', 'backendService', 'leafletData',
        function($scope, locationService, $location, backendService, leafletData) {
            // Bounds used to show the products
            var bounds;

            // Get the locations (to set them in the products)
            // TODO: get locations should be cached
            var locationPromise = locationService.getLocations();

            // Get a reference to the leaflet map object
            var mapPromise = leafletData.getMap();

            /**
             * Loaded products
             * @type {Array}
             */
            $scope.products = [];

            /**
             * Total products available with the current query
             * @type {number}
             */
            $scope.totalProducts = 0;

            /**
             * Which product is currently shown
             * @type {{}}
             */
            $scope.openedProduct = undefined;

            /**
             * Whether the products have been loaded
             * @type {boolean}
             */
            $scope.productsLoaded = false;

            /**
             * Shows the details of the given product.
             * If the it's already shown, it's hidden.
             * @param {{}} product
             */
            $scope.openProduct = function(product) {
                if ($scope.openedProduct === product) {
                    $scope.openedProduct = undefined;
                }
                else {
                    $scope.openedProduct = product;
                }
            };

            /**
             * Load the next batch of products
             */
            $scope.loadMore = function() {
                loadProducts(bounds, $scope.products.length);
            };

            /**
             * Load products withing the given bounds
             * @param {string} bounds
             * @param {number} [skip=0]
             */
            function loadProducts(bounds, skip) {
                // Get products from the backend
                backendService.getProducts(bounds, skip || 0).then(function(data) {
                    $scope.totalProducts = data.data.totalProducts;
                    populateLocations(data.data.products);
                });
            }

            /**
             * Check if a location id matches id in product and populate the locationId
             * in product with the location object
             * @param {array} products
             */
            function populateLocations(products) {
                locationPromise.then(function(locations) {
                    // Go through all the products to find its location
                    angular.forEach(products, function(product) {
                        if (angular.isObject(locations[product.location])) {
                            product.location = locations[product.location];
                            $scope.products.push(product);
                        }
                        // If we couldn't find the location, don't show the product
                    });

                    // The products are now loaded
                    $scope.productsLoaded = true;
                });
            }

            // When we get the map, load the products
            mapPromise.then(function(map) {
                // Get the bound of the map and load the products for the first time
                bounds = map.getBounds().toBBoxString();
                loadProducts(bounds);
            });
        }
    ]);
})(window.veganaut.mapModule);