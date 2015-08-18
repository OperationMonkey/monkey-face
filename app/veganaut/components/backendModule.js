(function() {
    'use strict';

    var module = angular.module('veganaut.app.backend', []);

    /**
     * Interface with the backend
     * TODO: rather return promises for the return object instead of $http promises
     * TODO: split this up in different semantically grouped services
     */
    module.factory('backendService', ['$http', '$rootScope', 'backendUrl', 'sessionService', 'i18nSettings',
        function($http, $rootScope, backendUrl, sessionService, i18nSettings) {
            var BackendService = function() {
                /**
                 * Person id is set if the user entered a reference code but is not
                 * logged in
                 */
                this.personId = undefined;


                // Subscribe to session events
                $rootScope.$onRootScope('veganaut.session.created', function() {
                    this.personId = undefined;
                }.bind(this));
                $rootScope.$onRootScope('veganaut.session.destroyed', function() {
                    this.personId = undefined;
                }.bind(this));
            };

            /**
             * Returns whether the user is currently logged in
             * @returns {boolean}
             */
            BackendService.prototype.isLoggedIn = function() {
                return sessionService.hasValidSession();
            };

            /**
             * Registers a new user. If the user has already entered a reference
             * code, the person from that activity's target will be used.
             * @param {string} email
             * @param {string} fullName
             * @param {string} nickname
             * @param {string} password
             * @param {string} locale Only submitted if valid
             * @returns {promise}
             */
            BackendService.prototype.register = function(email, fullName, nickname, password, locale) {
                var postData = {
                    email: email,
                    fullName: fullName,
                    nickname: nickname,
                    password: password
                };

                // Only submit locale if it's valid
                if (i18nSettings.availableLocales.indexOf(locale) >= 0) {
                    postData.locale = locale;
                }

                // If we already have a person id, register as that person
                // TODO NOW: remove this
                if (this.personId) {
                    postData.id = this.personId;
                }

                return $http.post(backendUrl + '/person', postData);
            };

            /**
             * Sends the login request to the backend
             *
             * @param email
             * @param password
             * @returns {promise} promise returned from $http.post
             */
            BackendService.prototype.login = function(email, password) {
                return $http.post(backendUrl + '/session', {email: email, password: password})
                    .success(function(data) {
                        sessionService.createSession(data.sessionId);
                    })
                    .error(sessionService.destroySession.bind(sessionService));
            };

            /**
             * Sends the logout request to the backend
             * @returns {promise}
             */
            BackendService.prototype.logout = function() {
                // TODO: make sure we are logged in first
                return $http.delete(backendUrl + '/session')
                    .finally(sessionService.destroySession.bind(sessionService));
            };

            /**
             * Sends the get activity list request to the backend
             * @returns {promise} promise returned from $http.get
             * TODO: cache this list for a while
             */
            BackendService.prototype.getActivities = function() {
                // TODO: make sure we are logged in first
                return $http.get(backendUrl + '/activity');
            };

            /**
             * Posts a new activity link with the given data to the backend
             * @param person Either a name of a person to create or a person object
             * @param activity
             * @returns {promise} promise returned from $http.post
             */
            BackendService.prototype.addActivityLink = function(person, activity) {
                // TODO: make sure we are logged in first
                var target = {};
                if (angular.isString(person)) {
                    // Create a person object
                    target.nickname = person;
                }
                else {
                    target.id = person.id;
                }

                // Prepare the data to post
                var postData = {
                    target: target
                };

                // Add activity if given
                if (activity) {
                    postData.activity = {
                        id: activity.id
                    };
                }
                return $http.post(backendUrl + '/activityLink', postData);
            };

            /**
             * Submits the given referenceCode to the backend. Will set the
             * returned target of the activity link as the active person,
             * which makes it possible to query the graph of that person.
             *
             * @param referenceCode
             * @returns {promise} promise returned from $http.post
             */
            BackendService.prototype.submitReferenceCode = function(referenceCode) {
                var postData = {
                    referenceCode: referenceCode
                };

                return $http.post(backendUrl + '/activityLink/reference', postData)
                    .success(function(data) {
                        // TODO: validate id?
                        this.personId = data.target;
                    }.bind(this));
            };

            /**
             * Gets the list of open activityLink for the logged in user
             *
             * @returns {promise}
             */
            BackendService.prototype.getOpenActivityLinks = function() {
                // TODO: make sure we are logged in first
                return $http.get(backendUrl + '/activityLink/mine/open');
            };

            /**
             * Gets the score data
             * @returns {promise}
             */
            BackendService.prototype.getScore = function() {
                return $http.get(backendUrl + '/score');
            };

            /**
             * Gets the currently logged in user info
             * @returns {HttpPromise}
             */
            BackendService.prototype.getMe = function() {
                // TOTO: make sure we are logged in first
                return $http.get(backendUrl + '/person/me');
            };

            /**
             * Posts the new player data. Only the fields that are
             * given are updated. Possible fields are:
             * email, fullName, nickname, password, locale
             * @param {{}} newData
             * @returns {HttpPromise}
             */
            BackendService.prototype.updateMe = function(newPlayerData) {
                newPlayerData = _.pick(newPlayerData, 'email', 'fullName', 'nickname', 'password', 'locale');
                if (newPlayerData.password === '') {
                    // Don't submit empty new password
                    delete newPlayerData.password;
                }
                return $http.put(backendUrl + '/person/me', newPlayerData);
            };

            /**
             * Gets the list of products within the given bounds, ordered by rating.
             * @param {string} [bounds] 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
             * @param {string} [locationType] whether to only get products of a specific location type
             * @param {number} [skip] number of products to skip from the beginning of the list
             * @param {number} [limit] number of products to return
             * @returns {HttpPromise}
             */
            BackendService.prototype.getProducts = function(bounds, locationType, skip, limit) {
                return $http.get(backendUrl + '/product/list', {
                    params: {
                        bounds: bounds,
                        locationType: locationType,
                        limit: limit,
                        skip: skip
                    }
                });
            };

            /**
             * Gets the list of locations on the map
             * @param {string} [bounds] The bounds within to get the locations
             * @returns {HttpPromise}
             */
            BackendService.prototype.getLocations = function(bounds) {
                return $http.get(backendUrl + '/location/list', {
                    params: {
                        bounds: bounds
                    }
                });
            };

            /**
             * Gets the location with the given id
             * @params {string} id
             * @returns {HttpPromise}
             */
            BackendService.prototype.getLocation = function(id) {
                return $http.get(backendUrl + '/location/' + id);
            };

            /**
             * Requests the lat/lng based on the ip of the user
             * @returns {HttpPromise}
             */
            BackendService.prototype.getGeoIP = function() {
                return $http.get(backendUrl + '/geoip');
            };

            /**
             * Submits the given Mission to the backend
             * @param {{}} missionData
             * @param {Location} location
             * @returns {HttpPromise}
             */
            BackendService.prototype.submitMission = function(missionData, location) {
                missionData.location = location.id;
                return $http.post(backendUrl + '/mission', missionData);
            };

            /**
             * Submits the given Location
             * @param {Location} location
             * @returns {HttpPromise}
             */
            BackendService.prototype.submitLocation = function(locationData) {
                return $http.post(backendUrl + '/location', locationData);
            };

            /**
             * Updates the given location
             * @param {string} locationId
             * @param {{}} locationData
             * @returns {HttpPromise}
             */
            BackendService.prototype.updateLocation = function(locationId, locationData) {
                return $http.put(backendUrl + '/location/' + locationId, locationData);
            };

            /**
             * Retrieves the recent missions at the given location
             * @param {string} locationId
             * @returns {HttpPromise}
             */
            BackendService.prototype.getLocationMissionList = function(locationId) {
                return $http.get(backendUrl + '/location/' + locationId + '/mission/list');
            };

            /**
             * Send a password reset email
             * @param {string} email
             * @returns {HttpPromise}
             *
             */
            BackendService.prototype.sendPasswordResetMail = function(email) {
                return $http.post(backendUrl + '/passwordResetEmail',  {email: email});
            };

            /**
             * Checks whether the given password reset token is valid
             * @param {string} token
             * @returns {HttpPromise}
             */
            BackendService.prototype.isValidToken = function(token) {
                 return $http.get(backendUrl + '/person/isValidToken/' + token);
            };

            /**
             * Tries to reset the password with the given token.
             * @param {string} token
             * @param {string} password
             * @returns {HttpPromise}
             */
            BackendService.prototype.resetPassword = function(token, password) {
                var postData = {
                    token: token,
                    password: password
                };

                return $http.post(backendUrl + '/person/reset', postData);
            };

            /**
             * Gets the person information with the given id
             * @params {string} id
             * @returns {HttpPromise}
             */
            BackendService.prototype.getPerson = function(id) {
                return $http.get(backendUrl + '/person/' + id);
            };

            /**
             * Gets the list of available missions at a location
             * @param locationId
             * @returns {HttpPromise}
             */
            BackendService.prototype.getAvailableMissions = function(locationId) {
                return $http.get(backendUrl + '/location/' + locationId + '/availableMission/list');
            };

            // Instantiate and return the service
            return new BackendService();
        }]
    );
})();
