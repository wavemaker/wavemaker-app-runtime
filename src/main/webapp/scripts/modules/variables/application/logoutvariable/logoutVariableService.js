/*global wm, WM*/
/*jslint todo: true */
/*jslint sub: true */


/**
 * @ngdoc service
 * @name wm.variables.LogoutVariableService
 * @requires $rootScope
 * @requires $routeParams
 * @requires BaseVariablePropertyFactory
 * @description
 * The 'LogoutVariableService' provides methods to work with LogoutVariable
 */

wm.variables.services.LogoutVariableService = ['Variables',
    'BaseVariablePropertyFactory',
    'SecurityService',
    'Utils',
    '$window',
    '$location',
    'CONSTANTS',
    'VARIABLE_CONSTANTS',
    '$rootScope',
    '$timeout',
    function (Variables, BaseVariablePropertyFactory, SecurityService, Utils, $window, $location, CONSTANTS, VARIABLE_CONSTANTS, $rootScope, $timeout) {
        "use strict";

        var methods, logoutVariableObj, initiateCallback,
            logout =  function (options, success, error) {
                options = options || {};
                options.scope = options.scope || this.activeScope;
                methods.logout(this, options, function () {
                    onLogoutSuccess();
                    Utils.triggerFn(success);
                }, error);
            };

        /*function to initiate the callback and obtain the data for the callback variable.*/
        initiateCallback = Variables.initiateCallback;

        methods = {
            logout: function (variable, options, success, error) {
                var variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    handleError,
                    redirectPage,
                    appManager,
                    output;

                handleError = function (msg, details, xhrObj) {
                    /* if in RUN mode, trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        initiateCallback("onError", variable, msg, xhrObj);
                    }
                    Utils.triggerFn(error, msg, xhrObj);
                };

                $rootScope.$emit('toggle-variable-state', variable, true);
                // EVENT: ON_BEFORE_UPDATE
                output = initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE, variable);
                if (output === false) {
                    Utils.triggerFn(error);
                    return;
                }
                SecurityService.isAuthenticated(function (isAuthenticated) {
                    $rootScope.$emit('toggle-variable-state', variable, false);
                    if (isAuthenticated) {
                        variable.promise = SecurityService.appLogout(function (redirectUrl) {
                            // Reset Security Config.
                            $rootScope.isUserAuthenticated = false;
                            appManager = Utils.getService("AppManager");
                            appManager.resetSecurityConfig().
                            then(function () {
                                // EVENT: ON_RESULT
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variable, redirectUrl);
                                // EVENT: ON_SUCCESS
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.SUCCESS, variable, redirectUrl);
                            });

                            //In case of CAS response will be the redirectUrl
                            redirectUrl = Utils.getValidJSON(redirectUrl);
                            if (redirectUrl) {
                                $window.location.href = redirectUrl.result;
                            } else if (variable.useDefaultSuccessHandler) {
                                redirectPage = variable.redirectTo;
                                /* backward compatibility (index.html/login.html may be present in older projects) */
                                if (!redirectPage || redirectPage === "login.html" || redirectPage === "index.html") {
                                    redirectPage = "";
                                }
                                $window.location.href = redirectPage;
                            }
                            Utils.triggerFn(success);
                        }, handleError);
                    } else {
                        handleError("No authenticated user to logout.");
                    }
                }, function () {
                    $rootScope.$emit('toggle-variable-state', variable, false);
                    handleError();
                });
            },
            cancel: function (variable) {
                /* process only if current variable is actually active */
                if (variable.promise) {
                    variable.promise.abort();
                }
            }
        };

        function onLogoutSuccess() {
            $rootScope.$emit('app-logout-success');
        }

        logoutVariableObj = {
            logout: logout,
            invoke: logout,
            cancel: function () {
                return methods.cancel(this);
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.LogoutVariable', logoutVariableObj, ['wm.Variable', 'wm.ServiceVariable'], methods);

        return {
        };
    }];
