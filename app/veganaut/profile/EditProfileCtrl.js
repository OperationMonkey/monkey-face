(function(controllersModule) {
    'use strict';

    controllersModule.controller('EditProfileCtrl', ['$scope', 'alertService', 'playerService', 'translateService',
        function($scope, alertService, playerService, trans) {
            playerService.getMe().then(function(me) {
                $scope.form = {
                    fullName: me.fullName,
                    nickname: me.nickname,
                    email: me.email,
                    password: '',
                    passwordRepeat: ''
                };

                $scope.changePassword = false;
            });

            $scope.submit = function() {
                var form = $scope.form;
                if (!$scope.changePassword || form.password === form.passwordRepeat) {
                    // TODO: get form to validate password and passwordRepeat
                    playerService.updateMe(form.email, form.fullName, form.nickname, form.password)
                        .success(function() {
                            alertService.addAlert(trans('message.profile.update.success'), 'success');
                        })
                        .error(function() {
                            alertService.addAlert(trans('message.profile.update.fail'), 'danger');
                        })
                    ;
                    $scope.goToView('me');
                }
            };
        }])
    ;
})(window.monkeyFace.controllersModule);
