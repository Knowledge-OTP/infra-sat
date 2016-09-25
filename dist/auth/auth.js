(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.auth', [
        'firebase'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.auth')
        .service('AuthService', ["$window", "StorageFirebaseAdapter", "StorageSrv", "$firebaseAuth", "ENV", "$q", "$timeout", "$rootScope", "$http", "$log", function ($window, StorageFirebaseAdapter, StorageSrv, $firebaseAuth, ENV, $q, $timeout, $rootScope, $http, $log) {
            'ngInject';

            var refAuthDB = new $window.Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            var refDataDB = new $window.Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);
            var fbAuth = $firebaseAuth(refAuthDB);

            var self = this;
            this.saveRegistration = function (registration, login) {
                var registerInProgress = true;
                var dfd = $q.defer();
                this.logout(true);

                var timeoutPromise = $timeout(function () {
                    if (registerInProgress) {
                        dfd.reject('timeout');
                    }
                }, ENV.promiseTimeOut);

                registration.profile = {};

                fbAuth.$createUser(registration).then(function () {
                    registerInProgress = false;
                    $timeout.cancel(timeoutPromise);

                    if (login) {
                        self.login({
                            email: registration.email,
                            password: registration.password
                        }).then(function (loginData) {
                            self.registerFirstLogin();
                            dfd.resolve(loginData);
                        }, function (err) {
                            dfd.reject(err);
                        });
                    } else {
                        dfd.resolve();
                    }
                }, function (error) {
                    $timeout.cancel(timeoutPromise);
                    dfd.reject(error);
                });
                return dfd.promise;
            };

            function _dataLogin() {
                var postUrl = ENV.backendEndpoint + 'firebase/token';
                var authData = refAuthDB.getAuth();
                var postData = {
                    email: authData.password ? authData.password.email : '',
                    uid: authData.uid,
                    fbDataEndPoint: ENV.fbDataEndPoint,
                    fbEndpoint: ENV.fbGlobalEndPoint,
                    auth: ENV.dataAuthSecret,
                    token: authData.token
                };

                return $http.post(postUrl, postData).then(function (token) {
                    var defer = $q.defer();
                    refDataDB.authWithCustomToken(token.data, function (error, userAuthData) {
                        if (error) {
                            defer.reject(error);
                        }
                        $log.debug('authSrv::login(): uid=' + userAuthData.uid);
                        defer.resolve(userAuthData);
                    });
                    return defer.promise;
                });
            }

            function _$onAuth(data) {
                var _loginAuthData = data;

                if (_loginAuthData) {
                    return _dataLogin(_loginAuthData).then(function () {
                        $rootScope.$broadcast('auth:login', _loginAuthData);
                    });
                }
                $rootScope.$broadcast('auth:logout');
                return $q.when();
            }

            this.login = function (loginData) {
                var deferred = $q.defer();

                fbAuth.$unauth();

                fbAuth.$authWithPassword(loginData).then(function (authData) {
                    $log.debug('authSrv::login(): uid=' + authData.uid);
                    _$onAuth(authData).then(function () {
                        deferred.resolve(authData);
                    });
                }).catch(function (err) {
                    self.logout();
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            this.logout = function () {
                $rootScope.$broadcast('auth:beforeLogout');
                fbAuth.$unauth();

                var actAuth = $firebaseAuth(refDataDB);
                actAuth.$unauth();
            };

            this.forgotPassword = function (forgotPasswordData) {
                return fbAuth.$resetPassword(forgotPasswordData);
            };

            this.changePassword = function (changePasswordData) {
                var authData = this.getAuth();
                if (authData && authData.password) {
                    changePasswordData.email = authData.password.email;
                    return fbAuth.$changePassword(changePasswordData);
                }
                return $q.reject();
            };

            this.getAuth = function () {
                return refAuthDB.getAuth();
            };

            this.createAuthWithCustomToken = function (refDB, token) {
                var deferred = $q.defer();
                refDB.authWithCustomToken(token, function (error, userData) {
                    if (error) {
                        deferred.reject(error);
                    }
                    $log.debug('createAuthWithCustomToken: uid=' + userData.uid);
                    deferred.resolve(userData);
                });
                return deferred.promise;
            };

            this.userDataForAuthAndDataFb = function (data) {
                var proms = [
                    this.createAuthWithCustomToken(refAuthDB, data.authToken),
                    this.createAuthWithCustomToken(refDataDB, data.dataToken)
                ];
                return $q.all(proms);
            };

            this.registerFirstLogin = function () {
                var storageSrv = storageObj();
                var firstLoginPath = 'firstLogin/' + this.getAuth().uid;
                return storageSrv.get(firstLoginPath).then(function (userFirstLoginTime) {
                    if (angular.equals(userFirstLoginTime, {})) {
                        storageSrv.set(firstLoginPath, Date.now());
                    }
                });
            };

            function storageObj (){
                var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + '/' + ENV.firebaseAppScopeName);
                var config = {
                    variables: {
                        uid: function () {
                            return self.getAuth().uid;
                        }
                    }
                };
                return new StorageSrv(fbAdapter, config);
            }
        }]);
})(angular);

angular.module('znk.infra-sat.auth').run(['$templateCache', function($templateCache) {

}]);
