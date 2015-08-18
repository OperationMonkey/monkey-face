(function(module) {
    'use strict';

    /**
     * Controller for the scores page. Retrieves scores from the backend
     * and displays them.
     */
    module.controller('ScoreCtrl', ['$scope', 'backendService',
        function($scope, backendService) {
            /**
             * Scores retrieved from the backend
             * @type {{}}
             */
            $scope.scores = undefined;

            /**
             * Sum the given array of score objects with the given score name
             * @param {Array} scoreArray
             * @param {String} scoreName
             * @returns {number}
             */
            $scope.sum = function(scoreArray, scoreName) {
                var sum = 0;

                // Sum them up
                _.each(scoreArray, function(score) {
                    sum += score[scoreName];
                });
                return sum;
            };

            // Get the scores
            backendService.getScore()
                .success(function(scores) {
                    $scope.scores = scores;
                })
            ;
        }
    ]);
})(window.veganaut.scoreModule);
