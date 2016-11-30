/*global WM, wm, _, window, location, cordova*/

/**
 * @ngdoc service
 * @name wm.plugins.offline.services.$OfflineSecurityService
 * @description
 * This service adds offline behaviour for SecurityService. When an app is opened in offline,
 * app will continue with last logged user, provided the user didn't logout last time.
 **/
wm.plugins.offline.services.OfflineSecurityService = [
    '$cordovaFile',
    '$cordovaNetwork',
    '$rootScope',
    'SecurityService',
    'Utils',
    'wmSpinner',
    function ($cordovaFile,
              $cordovaNetwork,
              $rootScope,
              SecurityService,
              Utils,
              wmSpinner) {
        'use strict';
        var securityConfig = {},
            hasNetworkPlugin,
            origConfig = SecurityService.getConfig,
            origAppLogout = SecurityService.appLogout,
            securityFile = 'logged-in-user.info';

        function saveSecurityConfigLocally(config) {
            return $cordovaFile.writeFile(cordova.file.dataDirectory, securityFile, JSON.stringify(config), true);
        }

        function readLocalSecurityConfig() {
            return $cordovaFile.readAsText(cordova.file.dataDirectory, securityFile).then(JSON.parse);
        }


        function addOfflineBehaviour() {
            /**
             * Add offline behaviour to SecurityService.getConfig. When offline, this funcation returns security
             * config of last logged-in user will be returned, provided the user did not logout last time.
             *
             * @param successCallback
             * @param failureCallback
             */
            SecurityService.getConfig = function (successCallback, failureCallback) {
                if ($cordovaNetwork.isOnline()) {
                    origConfig.call(SecurityService, function (config) {
                        securityConfig = config;
                        saveSecurityConfigLocally(config);
                        Utils.triggerFn(successCallback, config);
                    }, failureCallback);
                } else {
                    readLocalSecurityConfig().then(function (config) {
                        if (config.loggedOut) {
                            origConfig.call(SecurityService, successCallback, failureCallback);
                        } else {
                            securityConfig = config;
                            Utils.triggerFn(successCallback, securityConfig);
                        }
                    }, function () {
                        origConfig.call(SecurityService, successCallback, failureCallback);
                    });
                }
            };
            /**
             * When users logs out, local config will be removed. If the user is offline and logs out, then user
             * will be logged out from the app and cookies are invalidated when app goes online next time.
             *
             * @param successCallback
             * @param failureCallback
             */
            SecurityService.appLogout = function (successCallback, failureCallback) {
                var spinerId = wmSpinner.show('');
                securityConfig = {
                    authenticated : false,
                    loggedOut : true,
                    loggedOutOffline : $cordovaNetwork.isOffline()
                };
                saveSecurityConfigLocally(securityConfig).finally(function () {
                    if ($cordovaNetwork.isOnline()) {
                        origAppLogout.call(SecurityService, successCallback, failureCallback);
                        wmSpinner.hide(spinerId);
                    } else {
                        location.assign(window.location.origin + window.location.pathname);
                    }
                });
            };
            /**
             * @param successCallback
             */
            SecurityService.isAuthenticated = function (successCallback) {
                Utils.triggerFn(successCallback, securityConfig.authenticated === true);
            };
        }

        function clearLastLoggedInUser() {
            return readLocalSecurityConfig().then(function (config) {
                securityConfig = config || {};
                if (securityConfig.loggedOutOffline && $cordovaNetwork.isOnline()) {
                    SecurityService.appLogout();
                }
            });
        }

        if (window.cordova) {
            try {
                $cordovaNetwork.isOnline();
                hasNetworkPlugin = true;
            } catch (e) {
                hasNetworkPlugin = false;
            }
            if (hasNetworkPlugin) {
                addOfflineBehaviour();
                clearLastLoggedInUser();
                /**
                 * If the user has chosen to logout while app is offline, then invalidation of cookies happens when
                 * app comes online next time.
                 */
                $rootScope.$on('$cordovaNetwork:online', function () {
                    clearLastLoggedInUser();
                });
            }
        }
    }];
