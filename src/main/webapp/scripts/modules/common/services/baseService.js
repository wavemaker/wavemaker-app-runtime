/*global WM, wm, _*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.common.$BaseService
 * @description
 * The `BaseService` service provides a common contract for all the services of wm.
 */

wm.modules.wmCommon.services.BaseService = [
    "$http",
    "$rootScope",
    "$injector",
    "BaseServiceManager",
    "DialogService",
    "Utils",
    "CONSTANTS",
    "$q",
    function ($http, $rootScope, $injector, BaseServiceManager, DialogService, Utils, CONSTANTS, $q) {
        "use strict";

        var wmLogger,
            wmToaster,
            isUnAuthorized,
        /*to store the failed function calls due to 401 error*/
            errorCallStack = [],
            localeObject,
            cache = {},
            serviceCallPatterns = [new RegExp('^/?services/'), new RegExp('j_spring_security_check'), new RegExp('j_spring_security_logout')],
        /*Function to log actions performed; using the wmLogger*/
            logAction = function (type, message, description) {
                /*Return if wmLogger does not exist*/
                if (!wmLogger) {
                    return;
                }
                /*Invoke appropriate functions of the logger based on the type of action*/
                switch (type) {
                case "debug":
                    wmLogger.debug(message, description);
                    break;
                case "success":
                    wmLogger.success(message, description);
                    break;
                case "failure":
                    wmLogger.error(message, description);
                    break;
                default:
                    break;
                }
            },
        /*Gets the locale object*/
            getLocaleObject = function () {
                return $rootScope.locale || $rootScope.appLocale;
            },
        /*Function to display messages using the wmToaster*/
            displayMessage = function (type, messageTitle, messageDescription) {
                /*Return if wmToaster does not exist*/
                if (!wmToaster) {
                    return;
                }
                /*Invoke appropriate functions of the toaster based on the type of action*/
                switch (type) {
                case "success":
                    wmToaster.show('success', messageTitle, messageDescription);
                    break;
                case "failure":
                    wmToaster.show('error', messageTitle, messageDescription);
                    break;
                default:
                    break;
                }
            },

        /* replace all the parameters from the config service*/
            parseReplace = function (serviceParams) {

                var val, param,
                    config = BaseServiceManager.getConfig(),
                    urlParams = serviceParams.urlParams;

                /*get the config out of baseServiceManager*/
                if (config.hasOwnProperty(serviceParams.target) && config[serviceParams.target].hasOwnProperty(serviceParams.action)) {
                    config = Utils.getClonedObject(config[serviceParams.target][serviceParams.action]);

                    /*To handle dynamic urls, append the serviceParams.config.url with the static url(i.e., config.url)*/
                    if (serviceParams.config) {
                        config.url = (serviceParams.config.url || "") + config.url;
                        config.method = serviceParams.config.method || config.method;
                        config.headers = config.headers || {};
                        WM.forEach(serviceParams.config.headers, function (val, key) {
                            config.headers[key] = val;
                        });
                    }
                    /* check for url parameters to replace the url */
                    if (urlParams) {
                        for (param in urlParams) {
                            if (urlParams.hasOwnProperty(param)) {
                                val = urlParams[param];
                                if (WM.isDefined(val) && val !== null) {
                                    config.url = config.url.replace(new RegExp(":" + param, "g"), val);
                                }
                            }
                        }
                    }

                    config.url = Utils.preventCachingOf(config.url);

                    /* check for data */
                    if (serviceParams.params) {
                        config.params = serviceParams.params;
                    }
                    /* check for data */
                    if (WM.isDefined(serviceParams.data)) {
                        config.data = serviceParams.data;
                    }
                    /* check for data parameters, written to support old service calls (.json calls) */
                    if (serviceParams.dataParams) {
                        config.data.params = serviceParams.dataParams;
                    }
                    /* check for headers */
                    if (serviceParams.headers) {
                        config.headers = serviceParams.headers;
                    }

                    /* set extra config flags */
                    config.byPassResult = serviceParams.byPassResult;
                    config.isDirectCall = serviceParams.isDirectCall;
                    config.isExtURL = serviceParams.isExtURL;
                    config.preventMultiple = serviceParams.preventMultiple;

                    return config;
                }

                return null;
            },

        /* replace the parameters from service-error message*/
            parseError = function (errorDetails) {
                var errMsg;
                localeObject = localeObject || getLocaleObject();
                /*Check for local resources and code in the resource */
                if (!localeObject || !localeObject[errorDetails.messageKey]) {
                    errMsg = errorDetails.message || (errorDetails.parameters && errorDetails.parameters[0]) || "";
                    return errMsg;
                }

                /*Assigning the error message*/
                errMsg = Utils.getClonedObject(localeObject[errorDetails.messageKey]);
                /*Replace the parameters in the error code with the actual strings.*/
                errMsg = Utils.replace(errMsg, errorDetails.parameters);
                return errMsg;
            },

        /* to return http promise*/
            getHttpPromise = function (params) {
                var config = params;
                // this header is not required for direct hits (i.e. not through proxy).
                if (!params.isDirectCall) {
                    config.headers = config.headers || {};
                    config.headers['X-Requested-With'] = 'XMLHttpRequest';
                }
                if (params.hasOwnProperty('target') && params.hasOwnProperty('action')) {
                    config = parseReplace(params);
                }
                return $http(config);
            },

            successHandler = function (config, successCallback, response) {
                var returnVal;
                isUnAuthorized = false;
                if (!config.byPassResult && response.data.hasOwnProperty('result')) {
                    Utils.triggerFn(successCallback, response.data.result, response);
                    returnVal = response.data.result;
                } else {
                    Utils.triggerFn(successCallback, response.data, response);
                    returnVal = response.data;
                }
                logAction("success", "GOT_RESPONSE_FROM_SERVER", config.url);
                return returnVal;
            },

            getLoginErrorMsg = function (error) {
                return WM.isFunction(error.headers) && error.headers('X-WM-Login-ErrorMessage')
            },

            isPlatformSessionTimeout = function (error) {
                var MSG_SESSION_NOT_FOUND = 'Session Not Found';
                return error.status === 401 && getLoginErrorMsg(error) === MSG_SESSION_NOT_FOUND;
            },

            isLoginFailure = function (error) {
                var MSG_LOGIN_FAILURE = 'Authentication Failed: Bad credentials';
                return error.status === 401 && getLoginErrorMsg(error) === MSG_LOGIN_FAILURE;
            },

            failureHandler = function (config, successCallback, failureCallback, error) {
                var errTitle, errMsg, errorDetails = error, appManager,
                    HTTP_STATUS_MSG = {
                        404: "Requested resource not found",
                        401: "Requested resource requires authentication"
                    };
                /*if user is unauthorized, then show login dialog*/
                if (isPlatformSessionTimeout(error) && !config.isDirectCall) {
                    if (CONSTANTS.isRunMode && config.url !== 'app.variables.json') {
                        /*
                         * a failed app.variables.json file doesn't need to be re-invoked always after login
                         * wmbootstrap is handling the re-invoking
                         */
                        pushToErrorCallStack(config, successCallback, failureCallback);
                    }
                    if (CONSTANTS.isRunMode) {
                        appManager = Utils.getService("AppManager");
                        appManager.handleSessionTimeOut();
                        /* In runtime, the variable error handler needs to be invoked to hide the spinner */
                        Utils.triggerFn(failureCallback);
                    } else {
                        pushToErrorCallStack(config, successCallback, failureCallback);
                        handleSessionTimeOut();
                    }
                    return;
                }
                isUnAuthorized = false;
                if (error.status === 403 && !config.isDirectCall) {
                    pushToErrorCallStack(config, successCallback, failureCallback);
                    displayMessage('failure', $rootScope.appLocale.LABEL_ACCESS_DENIED || 'Access Denied', $rootScope.appLocale.LABEL_FORBIDDEN_MESSAGE || 'The requested resource access/action is forbidden.');
                    /* In runtime, the variable error handler needs to be invoked to hide the spinner */
                    Utils.triggerFn(failureCallback);
                    return;
                }
                /*check if 'locale' resource is loaded*/
                if (localeObject) {
                    /*assigning default error messages */
                    errTitle = localeObject["MESSAGE_ERROR_HTTP_ERROR_TITLE"];
                    errMsg = localeObject["MESSAGE_ERROR_HTTP_STATUS_ERROR_DESC"];
                } else {
                    /*assigning default error messages */
                    errTitle = 'Error!';
                    errMsg = 'Service call failed';
                }

                // check if error message present for responded http status
                errMsg = HTTP_STATUS_MSG[error.status] || errMsg;

                /* check for error code in the response */
                if (_.get(error, 'data.errors')) {
                    errMsg = "";
                    errorDetails = error.data.errors;
                    /* If errors is not an array and contains error */
                    if (errorDetails.error) {
                        errorDetails.error.forEach(function (errorDetails, i) {
                            errMsg += parseError(errorDetails) + (i > 0 ? "\n" : "");
                        });
                    }
                } else if (CONSTANTS.isRunMode && config.isExtURL && !_.isEmpty(error.data)) {//Show the actual error for restService case
                    errMsg = error.data;
                }

                /* check for login failure header */
                if (isLoginFailure(error)) {
                    errMsg = getLoginErrorMsg(error);
                }

                /*check if failureCallback is defined*/
                if (WM.isFunction(failureCallback)) {
                    Utils.triggerFn(failureCallback, errMsg, errorDetails, error);
                } else {
                    displayMessage('failure', errTitle, errMsg);
                }

                logAction("failure", "GOT_RESPONSE_FROM_SERVER", config.url + ' as ' + errMsg);
                return error;
            },
            /**
             * Checks whether the given url is a service url or not.
             *
             * @param url
             * @returns {boolean} return true, if url matches with at least one service call pattern.
             */
            isServiceCall = function (url) {
                return _.some(serviceCallPatterns, function (p) {
                    return p.test(url);
                });
            },

        /* wrapper for the $http method*/
            makeCall = function (config, successCallback, failureCallback) {

                logAction("debug", "SEND_REQUEST_TO_SERVER", config.url);

                if (CONSTANTS.isRunMode && $rootScope.isMobileApplicationType && isServiceCall(config.url)) {
                    var deployUrl = $rootScope.project.deployedUrl;
                    deployUrl += _.last(deployUrl) === '/' ? '' : '/';
                    config.url =  deployUrl + config.url;
                }

                /* get a deferred object used to abort the http request */
                var deferred = $q.defer(),
                    promiseObj;
                config.timeout = deferred.promise;

                // if flag is passed, use the same http promise assigned to the same URL in previous call
                if (config.preventMultiple) {
                    promiseObj = (cache[config.url] || _.set(cache, config.url, getHttpPromise(config))[config.url])
                        .then(function (response) {
                            cache[config.url] = undefined;
                            return response;
                        }, function (err) {
                            cache[config.url] = undefined;
                            return $q.reject(err);
                        });
                } else {
                    promiseObj = getHttpPromise(config);
                }

                // assign passed handlers to the promise.
                promiseObj = promiseObj.then(
                    successHandler.bind(undefined, config, successCallback),
                    function (err) {
                        failureHandler(config, successCallback, failureCallback, err);
                        return $q.reject(err);
                    }
                );

                /* assign abort method to the http request promise object */
                promiseObj.abort = function () {
                    /* resolve the deferred object passed to the http request config to force abort */
                    deferred.resolve();
                };

                /* clearing off the promise object after request is finished */
                promiseObj.finally(function () {
                    promiseObj.abort = WM.noop;
                    deferred = promiseObj = null;
                });

                return promiseObj;
            },

        /* function to send the request to the server*/
            send = function (params, successCallback, failureCallback) {

                var serviceSettings = parseReplace(params);

                /*if service settings are found*/
                if (serviceSettings) {
                    return makeCall(serviceSettings, successCallback, failureCallback);
                }
                localeObject = localeObject || getLocaleObject();
                /* display error */
                displayMessage('failure', localeObject["MESSAGE_ERROR_HTTP_ERROR_TITLE"], localeObject["MESSAGE_ERROR_HTTP_CONFIG_ERROR_DESC"]);
            },

        /* function to execute the action*/
            execute = function (params, successCallback, failureCallback) {
                /*check for the target and action*/
                if (params.hasOwnProperty('target') && params.hasOwnProperty('action')) {
                    return send(params, successCallback, failureCallback);
                }
                Utils.triggerFn(successCallback);
            },

        /*Function to initialize the dependencies required by the service*/
            initializeDependencies = function () {
                try {
                    /*New injector is created for the wmCore module.*/
                    if ($injector.get('wmLogger')) {
                        /*Request wmLogger service from the injector*/
                        wmLogger = $injector.get('wmLogger');
                        /*compile with root scope*/
                        wmLogger.compile($rootScope);
                    }
                } catch (exception) {
                    if (wmLogger) {
                        wmLogger.error('EXCEPTION_CAUSED', ['initializeDependencies in wmService.baseService', exception && exception.message]);
                    }
                }
                try {
                    if ($injector.get('wmToaster')) {
                        /*Request wmToaster service from the injector*/

                        wmToaster = $injector.get('wmToaster');
                        /*compile with root scope*/
                        wmToaster.compile($rootScope);
                    }
                } catch (exception) {
                    if (wmLogger) {
                        wmLogger.error('EXCEPTION_CAUSED', ['initializeDependencies in wmService.baseService', exception && exception.message]);
                    }
                }
            },

        /*function to push server calls to an object-`callstack` */
            pushToErrorCallStack = function (config, success, failure) {
                errorCallStack.push({
                    config: config,
                    success: success,
                    failure: failure
                });
            },

        /*function to execute all the calls in the the callStack object*/
            executeErrorCallStack = function () {
                if (errorCallStack.length) {
                    errorCallStack.forEach(function (call) {
                        if (!call.config) {
                            Utils.triggerFn(call.success);
                        } else {
                            makeCall(call.config, call.success, call.failure);
                        }
                    });
                    errorCallStack.length = 0;
                }
            },

        /*function to handle the session timeout in studio mode*/
            handleSessionTimeOut = function () {
                if (!isUnAuthorized) {
                    var isStudioDisabled, dialogId = CONSTANTS.isStudioMode ? 'sessionTimeOutDialog' : 'CommonLoginDialog';
                    isStudioDisabled = $rootScope.isStudioDisabled;
                    $rootScope.isStudioDisabled = false;
                    DialogService.closeAllDialogs();
                    DialogService.showDialog(dialogId, {
                        resolve: {
                            OnLogin: function () {
                                return function () {
                                    if (CONSTANTS.isStudioMode) {
                                        executeErrorCallStack();
                                        $rootScope.isStudioDisabled = isStudioDisabled;
                                    }

                                    DialogService.hideDialog(dialogId);
                                };
                            }
                        },
                        onClose: function () {
                            // unset the flag if dialog closed without sign-in
                            isUnAuthorized = false;
                        }
                    });
                    isUnAuthorized = true;
                }
            };

        initializeDependencies();

        /* APIs returned by the service.*/
        return {

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#execute
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * sends the data to the server depending on the method, from execute method.
             *
             * @param {object} serviceSettings for the http post
             * @param {function} function to called on success
             * @param {function} function to called on failure
             */
            execute: execute,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#send
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * sends the data to the server depending on the method, without execute method.
             *
             * @param {object} serviceSettings for the http post
             * @param {function} function to called on success
             * @param {function} function to called on failure
             */

            send: send,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#getHttpPromise
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * to get the promise object of $http
             *
             * @param {object} serviceSetting for the http post
             * @param {function} function to called on success
             * @param {function} function to called on failure
             *
             * @return {object} $http promise object.
             */

            getHttpPromise: getHttpPromise,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#pushToCallStack
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * to add all failed server calls to call stack
             *
             * @param {object} serviceSetting for the http post
             * @param {function} function to called on success
             * @param {function} function to called on failure
             */

            pushToErrorCallStack: pushToErrorCallStack,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#executeErrorCallStack
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * to execute all server calls in the call stack
             */

            executeErrorCallStack: executeErrorCallStack,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#handleSessionTimeOut
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * to handle session timeout in an app
             */

            handleSessionTimeOut: handleSessionTimeOut,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#parseError
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * to parse the error received from the server.
             *
             * @param {object} error details
             *
             * @return {string} errorMsg error message
             */

            parseError: parseError,

            /**
             * @ngdoc function
             * @name wm.common.$BaseService#parseReplace
             * @methodOf wm.common.$BaseService
             * @function
             *
             * @description
             * replace all the parameters from the config service
             *
             * @param {object} serviceParams service config params
             *
             * @return {object} config with replaced params
             */
            parseReplace: parseReplace
        };
    }];
