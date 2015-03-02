/*global WM, wm*/
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
                    config = WM.copy(config[serviceParams.target][serviceParams.action]);

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
                    /* set cache false by appending timestamp to the url.
                     * If the request contains a query string(this could be identified by the presence of =),
                     * then use & as the separator and then append the timestamp*/
                    if (config.url.indexOf("?") < 0) {
                        config.url += '?preventCache=' + Date.now();
                    } else {
                        config.url += '&preventCache=' + Date.now();
                    }

                    /* check for data */
                    if (serviceParams.params) {
                        config.params = serviceParams.params;
                    }
                    /* check for data */
                    if (serviceParams.data) {
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

                    return config;
                }

                return null;
            },

        /* replace the parameters from service-error message*/
            parseError = function (errorDetails) {
                var errMsg;

                /*Check for local resources and code in the resource */
                if (!$rootScope.locale || !$rootScope.locale[errorDetails.code]) {
                    return;
                }

                /*Assigning the error message*/
                errMsg = WM.copy($rootScope.locale[errorDetails.code]);
                /*Replace the parameters in the error code with the actual strings.*/
                errMsg = Utils.replace(errMsg, errorDetails.data);
                return errMsg;
            },

        /* to return http promise*/
            getHttpPromise = function (params) {
                var config = params;
                config.headers = config.headers || {};
                config.headers['X-Requested-With'] = 'XMLHttpRequest';
                if (params.hasOwnProperty('target') && params.hasOwnProperty('action')) {
                    config = parseReplace(params);
                }
                return $http(config);
            },

            successHandler = function (config, successCallback, response) {
                var returnVal;
                isUnAuthorized = false;
                if (response.data.hasOwnProperty('result')) {
                    Utils.triggerFn(successCallback, response.data.result);
                    returnVal = response.data.result;
                } else {
                    Utils.triggerFn(successCallback, response.data);
                    returnVal = response.data;
                }
                logAction("success", "GOT_RESPONSE_FROM_SERVER", config.url);
                return returnVal;
            },

            failureHandler = function (config, successCallback, failureCallback, error) {
                var errTitle, errMsg;
                /*if user is unauthorized, then show login dialog*/
                if (error.status === 401 && !error.headers('X-WM-Login-ErrorMessage')) {
                    pushToErrorCallStack(config, successCallback, failureCallback);
                    handleSessionTimeOut();
                    return;
                }
                isUnAuthorized = false;
                if (error.status === 403) {
                    pushToErrorCallStack(config, successCallback, failureCallback);
                    displayMessage('failure', $rootScope.appLocale.LABEL_ACCESS_DENIED || 'Access Denied', $rootScope.appLocale.LABEL_FORBIDDEN_MESSAGE || 'The requested resource access/action is forbidden.');
                    return;
                }
                /*check if 'locale' resource is loaded*/
                if ($rootScope.locale) {
                    /*assigning default error messages */
                    errTitle = $rootScope.locale["MESSAGE_ERROR_HTTP_ERROR_TITLE"];
                    errMsg = $rootScope.locale["MESSAGE_ERROR_HTTP_STATUS_ERROR_DESC"];
                } else {
                    /*assigning default error messages */
                    errTitle = "Error!";
                    errMsg = "Service call failed";
                }

                /* check for error code in the response */
                if (error.data) {
                    if (error.data.errorDetails) {
                        errMsg = parseError(error.data.errorDetails) || error.data.errorDetails || errMsg;
                    } else if (error.data.errors) {
                        errMsg = "";
                        error.data.errors.forEach(function (errorDetails) {
                            errMsg += parseError(errorDetails) + "\n";
                        });
                    } else if (error.data.error) {
                        errMsg = parseError(error.data.error.message) || error.data.error.message || errMsg;
                    }
                }

                /* check for login failure header */
                if (error.headers('X-WM-Login-ErrorMessage')) {
                    errMsg = error.headers('X-WM-Login-ErrorMessage');
                }

                /*check if failureCallback is defined*/
                if (WM.isFunction(failureCallback)) {
                    Utils.triggerFn(failureCallback, errMsg);
                } else {
                    displayMessage('failure', errTitle, errMsg);
                }

                logAction("failure", "GOT_RESPONSE_FROM_SERVER", config.url + ' as ' + errMsg);
                return error;
            },

        /* wrapper for the $http method*/
            makeCall = function (config, successCallback, failureCallback) {

                logAction("debug", "SEND_REQUEST_TO_SERVER", config.url);

                /* get a deferred object used to abort the http request */
                var deferred = $q.defer(),
                    promiseObj;

                config.timeout = deferred.promise;

                /* get the promise object from http request */
                promiseObj = getHttpPromise(config)
                    .then(
                        successHandler.bind(undefined, config, successCallback),
                        failureHandler.bind(undefined, config, successCallback, failureCallback)
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

                /* display error */
                displayMessage('failure', $rootScope.locale["MESSAGE_ERROR_HTTP_ERROR_TITLE"], $rootScope.locale["MESSAGE_ERROR_HTTP_CONFIG_ERROR_DESC"]);
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
                    var dialogId = CONSTANTS.isStudioMode ? 'sessionTimeOutDialog' : 'CommonLoginDialog';
                    $rootScope.isStudioDisabled = false;
                    DialogService.closeAllDialogs();
                    DialogService.showDialog(dialogId, {
                        resolve: {
                            OnLogin: function () {
                                return function () {
                                    executeErrorCallStack();
                                    DialogService.hideDialog(dialogId);
                                };

                            }
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

            handleSessionTimeOut: handleSessionTimeOut
        };
    }];
