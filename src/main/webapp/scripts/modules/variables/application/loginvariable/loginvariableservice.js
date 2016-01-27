/*global wm, WM, _*/
/*jslint todo: true */
/*jslint sub: true */


/**
 * @ngdoc service
 * @name wm.variables.LoginVariable
 * @requires $rootScope
 * @requires $routeParams
 * @requires BaseVariablePropertyFactory
 * @description
 * The 'LoginVariable' provides methods to work with LoginVariables
 */

wm.variables.services.LoginVariableService = ['Variables',
    'BaseVariablePropertyFactory',
    'SecurityService',
    'Utils',
    '$window',
    '$rootScope',
    'VARIABLE_CONSTANTS',
    'CONSTANTS',
    '$location',
    'BaseService',
    function (Variables, BaseVariablePropertyFactory, SecurityService, Utils, $window, $rootScope, VARIABLE_CONSTANTS, CONSTANTS, $location, BaseService) {
        "use strict";

        var methods, loginVariableObj, initiateCallback;

        /*function to initiate the callback and obtain the data for the callback variable.*/
        initiateCallback = Variables.initiateCallback;

        methods = {
            login: function (variable, options, success, error) {
                var params = {},
                    variableOwner = variable.owner,
                    variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    callBackScope,
                    errMsg,
                    paramKey,
                    loginInfo = {};

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

                /* If login info provided along explicitly with options, don't look into the variable bindings for the same */
                if (options.loginInfo) {
                    loginInfo = options.loginInfo;
                } else {
                    loginInfo = variable.dataBinding;
                }

                for (paramKey in loginInfo) {
                    if (loginInfo.hasOwnProperty(paramKey) && (loginInfo[paramKey] === '' || loginInfo[paramKey] === undefined)) {
                        errMsg = "Please provide " + paramKey + ".";
                        break;
                    }
                    params[paramKey] = loginInfo[paramKey];
                }

                /* if error message initialized, return error */
                if (errMsg) {
                    /* if in RUN mode, trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        Utils.triggerFn(error, errMsg);
                        initiateCallback("onError", variable, callBackScope, errMsg);
                    }
                    return;
                }
                variable.promise = SecurityService.appLogin(params, function (response) {
                    var redirectUrl = response && response.url ? response.url : 'index.html';
                    if (CONSTANTS.isRunMode) {
                        $rootScope.isUserAuthenticated = true;
                        Utils.triggerFn(success);
                        $rootScope.$emit("update-loggedin-user");
                        WM.forEach(variableEvents, function (event) {
                            if (event !== "onError") {
                                initiateCallback(event, variable, callBackScope);
                            }
                        });
                    }
                    if (variable.useDefaultSuccessHandler) {
                        if (CONSTANTS.hasCordova && _.includes(redirectUrl, '/')) {
                            /*
                             * when the application is running as a mobile application,
                             * use the local app files instead of server files.
                             */
                            redirectUrl = redirectUrl.substr(redirectUrl.lastIndexOf('/') + 1);
                        }
                        var redirectPage = $location.search().redirectTo;
                        if (redirectPage && WM.isString(redirectPage) && SecurityService.getLastLoggedInUser() === params.username) {
                            BaseService.executeErrorCallStack();
                            $location.url(redirectPage);
                        } else {
                            $window.location = $window.location.pathname;
                        }
                    }
                    /*
                     * IN CASE OF NOT USING DEFAULT-SUCCESS-HANDLER the new securityConfig are expected
                     * If they are fetched on login response, they can be simply updated
                     * Else a fresh call need to update the same
                     */
                }, function () {
                    /* if in RUN mode, trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        initiateCallback("onError", variable, callBackScope, "Invalid username or password.");
                    }
                    Utils.triggerFn(error, "Invalid username or password.");
                });
            },
            cancel: function (variable) {
                /* process only if current variable is actually active */
                if (variable.promise) {
                    variable.promise.abort();
                }
            }
        };

        loginVariableObj = {
            login: function (options, success, error) {
                options = options || {};
                options.scope = this.activeScope || options.scope;
                methods.login(this, options, success, error);
            },
            cancel: function () {
                return methods.cancel(this);
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.LoginVariable', loginVariableObj, ['wm.Variable', 'wm.ServiceVariable'], methods);

        return {
        };
    }];