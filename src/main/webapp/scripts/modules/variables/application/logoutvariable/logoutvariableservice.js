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
    'CONSTANTS',
    'VARIABLE_CONSTANTS',
    '$rootScope',
    function (Variables, BaseVariablePropertyFactory, SecurityService, Utils, $window, CONSTANTS, VARIABLE_CONSTANTS, $rootScope) {
        "use strict";

        var methods, logoutVariableObj, initiateCallback;

        /*function to initiate the callback and obtain the data for the callback variable.*/
        initiateCallback = Variables.initiateCallback;

        methods = {
            logout: function (variable, options, success, error) {
                var variableOwner = variable.owner,
                    variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    callBackScope,
                    performLogout,
                    logoutErrorMessage = "No authenticated user to logout.";

                /* get the callback scope for the variable based on its owner */
                if (variableOwner === "App") {
                    /* TODO: to look for a better option to get App/Page the controller's scope */
                    callBackScope = $rootScope || {};
                } else {
                    if (variable.prefabName) {
                        callBackScope = options.scope || {};
                    } else {
                        callBackScope = (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
                    }
                }

                performLogout = $rootScope.isUserAuthenticated;

                if (performLogout) {
                    var currentPage = $window.location.hash;
                    variable.promise = SecurityService.appLogout(function () {
                        $rootScope.isUserAuthenticated = false;
                        Utils.triggerFn(success);
                        if (variable.useDefaultSuccessHandler) {
                            /*If the re-directing page is other than the login page changing the window location details*/
                            if (!variable.redirectTo || variable.redirectTo === 'Login' || variable.redirectTo === 'login.html') {
                                $window.location = 'login.html';
                            } else {
                                $window.location.hash = '#/' + (variable.redirectTo === "index.html" ? "Main" : variable.redirectTo);
                                /*If the current page and logout redirecting page is same then refresh the window*/
                                if (currentPage === $window.location.hash) {
                                    $window.location.reload();
                                }
                            }
                        } else {
                            if (CONSTANTS.isRunMode) {
                                WM.forEach(variableEvents, function (event) {
                                    if (event !== "onError") {
                                        initiateCallback(event, variable, callBackScope);
                                    }
                                });
                            }
                        }
                        /* clear the logged in user variable */
                        $rootScope.$emit("update-loggedin-user");
                    }, function () {
                        /* if in RUN mode, trigger error events associated with the variable */
                        if (CONSTANTS.isRunMode) {
                            initiateCallback("onError", variable, callBackScope);
                        }
                        Utils.triggerFn(error);
                    });
                } else {
                    /* if in RUN mode, trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        initiateCallback("onError", variable, callBackScope, logoutErrorMessage);
                    }
                    Utils.triggerFn(error, logoutErrorMessage);
                }
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
            logout: function (options, success, error) {
                options.scope = options.scope || this.activeScope;
                methods.logout(this, options, function () {
                    onLogoutSuccess();
                    Utils.triggerFn(success);
                }, error);
            },
            cancel: function () {
                return methods.cancel(this);
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.LogoutVariable', logoutVariableObj, ['wm.Variable', 'wm.ServiceVariable'], methods);

        return {
        };
    }];