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
    'DialogService',

    function (Variables, BaseVariablePropertyFactory, SecurityService, Utils, $window, $rootScope, VARIABLE_CONSTANTS, CONSTANTS, $location, BaseService, DialogService) {
        'use strict';

        var methods, loginVariableObj, initiateCallback,
            login = function (options, success, error) {
                options = options || {};
                options.scope = this.activeScope || options.scope;
                methods.login(this, options, success, error);
            };

        /*function to initiate the callback and obtain the data for the callback variable.*/
        initiateCallback = Variables.initiateCallback;

        methods = {
            login: function (variable, options, success, error) {
                var params = {},
                    variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    errMsg,
                    paramKey,
                    output,
                    loginInfo = {};

                /* If login info provided along explicitly with options, don't look into the variable bindings for the same */
                if (options.loginInfo) {
                    loginInfo = options.loginInfo;
                } else {
                    loginInfo = variable.dataBinding;
                }

                for (paramKey in loginInfo) {
                    if (loginInfo.hasOwnProperty(paramKey) && (loginInfo[paramKey] === '' || loginInfo[paramKey] === undefined) && paramKey !== "rememberme") {
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
                        initiateCallback("onError", variable, errMsg);
                    }
                    return;
                }

                //Triggering 'onBeforeUpdate' and considering
                output = initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE, variable, params);
                if (_.isObject(output)) {
                    params = output;
                } else if (output === false) {
                    return;
                }
                variable.promise = SecurityService.appLogin(params, function (response) {
                    var redirectUrl = response && response.url ? response.url : 'index.html',
                        appManager = Utils.getService("AppManager"),
                        lastLoggedinUser = SecurityService.getLastLoggedInUser();
                    //Closing login dialog after successful login
                    DialogService.close('CommonLoginDialog');
                    if (!CONSTANTS.isRunMode) {
                        return;
                    }
                    /*
                     * Get fresh security config
                     * Get App variables. if not loaded
                     * Update loggedInUser variable with new user details
                     */
                    appManager.resetSecurityConfig().
                        then(function (config) {
                            $rootScope.isUserAuthenticated = true;
                            Utils.triggerFn(success);

                            WM.forEach(variableEvents, function (event) {
                                if (event !== 'onError' && event !== VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE) {
                                    initiateCallback(event, variable, _.get(config, 'userInfo'));
                                }
                            });

                            // get redirectTo page from URL and remove it from URL
                            var redirectPage = $location.search().redirectTo;
                            $location.search('redirectTo', undefined);

                            /* handle navigation if defaultSuccessHandler on variable is true */
                            if (variable.useDefaultSuccessHandler) {
                                /* if first time user logging in or same user re-logging in, execute n/w calls failed before logging in */
                                if (!lastLoggedinUser || lastLoggedinUser === params.username) {
                                    BaseService.executeErrorCallStack();
                                }

                                if (CONSTANTS.hasCordova && _.includes(redirectUrl, '/')) {
                                    /*
                                     * when the application is running as a mobile application,
                                     * use the local app files instead of server files.
                                     */
                                    redirectUrl = redirectUrl.substr(redirectUrl.lastIndexOf('/') + 1);
                                }
                                /* if redirectPage found in url, case of re-login on session timeout*/
                                if (redirectPage && WM.isString(redirectPage)) {
                                    if (!lastLoggedinUser || lastLoggedinUser === params.username) {
                                        /* if first time login OR same user re-logging in, navigate to provided redirectPage */
                                        $location.path(redirectPage);
                                    } else {
                                        /* else, re-load the app, navigation will be taken care in wmbootstrap.js' */
                                        $window.location = $window.location.pathname;
                                    }
                                } else if (options.mode === 'dialog' && lastLoggedinUser !== params.username && !$rootScope._noRedirect) {
                                    /* else, re-load the app, navigation will be taken care in wmbootstrap.js' */
                                    $window.location = $window.location.pathname;
                                } else if (options.mode !== 'dialog') {
                                    appManager.navigateOnLogin();
                                }
                            }
                            $rootScope._noRedirect = undefined;
                        });
                }, function (errorMsg) {
                    errorMsg = errorMsg || "Invalid credentials.";
                    /* if in RUN mode, trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        initiateCallback("onError", variable, errorMsg);
                    }
                    Utils.triggerFn(error, errorMsg);
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
            login : login,
            invoke: login,
            cancel: function () {
                return methods.cancel(this);
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.LoginVariable', loginVariableObj, ['wm.Variable', 'wm.ServiceVariable'], methods);

        return {
        };
    }];