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
    function (Variables, BaseVariablePropertyFactory, SecurityService, Utils, $window, $location, CONSTANTS, VARIABLE_CONSTANTS, $rootScope) {
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
                var variableOwner = variable.owner,
                    variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    callBackScope,
                    logoutErrorMessage = "No authenticated user to logout.",
                    handleError,
                    redirectPage,
                    appManager;

                /* get the callback scope for the variable based on its owner */
                if (variableOwner === "App") {
                    /* TODO: to look for a better option to get App/Page the controller's scope */
                    callBackScope = $rootScope || {};
                } else {
                    if (variable._prefabName) {
                        callBackScope = options.scope || {};
                    } else {
                        callBackScope = (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
                    }
                }

                handleError = function (msg) {
                    /* if in RUN mode, trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        initiateCallback("onError", variable, callBackScope, msg);
                    }
                    Utils.triggerFn(error, msg);
                };

                SecurityService.isAuthenticated(function (isAuthenticated) {
                    if (isAuthenticated) {
                        variable.promise = SecurityService.appLogout(function (redirectUrl) {
                            redirectUrl = Utils.getValidJSON(redirectUrl);
                            //In case of CAS response will be the redirectUrl
                            if (redirectUrl) {
                                $window.location.href = redirectUrl.result;
                            } else {
                                if (variable.useDefaultSuccessHandler) {
                                    redirectPage = variable.redirectTo;
                                    /* backward compatibility (index.html/login.html may be present in older projects) */
                                    if (!redirectPage || redirectPage === "login.html" || redirectPage === "index.html") {
                                        redirectPage = "";
                                    }
                                    $location.url(redirectPage);
                                    $window.location.reload();
                                } else if (CONSTANTS.isRunMode) {
                                    appManager = Utils.getService("AppManager");
                                    appManager.resetSecurityConfig().
                                        then(function () {
                                            WM.forEach(variableEvents, function (event) {
                                                if (event !== "onError") {
                                                    initiateCallback(event, variable, callBackScope);
                                                }
                                            });
                                        });
                                }
                            }
                            $rootScope.isUserAuthenticated = false;
                            Utils.triggerFn(success);
                        }, handleError);
                    } else {
                        handleError();
                    }
                }, function () {
                    handleError(logoutErrorMessage);
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