/*global wm, WM, Blob, FormData, Array, _*/
/*jslint todo: true */
/*jslint sub: true */


/**
 * @ngdoc service
 * @name wm.variables.$servicevariable
 * @requires $rootScope
 * @requires BaseVariablePropertyFactory
 * @description
 * The '$servicevariable' provides methods to work with service variables
 */

wm.variables.services.$servicevariable = ['Variables',
    'BaseVariablePropertyFactory',
    'WebService',
    'ServiceFactory',
    '$rootScope',
    'CONSTANTS',
    'Utils',
    'ProjectService',
    'VARIABLE_CONSTANTS',
    'WS_CONSTANTS',
    '$timeout',
    '$base64',

    function (Variables, BaseVariablePropertyFactory, WebService, ServiceFactory, $rootScope, CONSTANTS, Utils, ProjectService, VARIABLE_CONSTANTS, WS_CONSTANTS, $timeout, $base64) {
        "use strict";

        var requestQueue = {},
            variableActive = {},
            prefabDataTypes = {},
            methods                 = {},
            serviceVariableObj      = {},
            REST_METHOD_NAME = "executeRestCall",
            REST_SUPPORTED_SERVICES = VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES,
            SERVICE_TYPE_REST = VARIABLE_CONSTANTS.SERVICE_TYPE_REST,
            AUTH_TYPE_BASIC = "BASIC",
            AUTH_TYPE_NONE = "NONE",
            supportedOperations = WS_CONSTANTS.HTTP_METHODS.map(function (method) { return method.toLowerCase(); }),
            BASE_PATH_KEY = 'x-WM-BASE_PATH',
            RELATIVE_PATH_KEY = 'x-WM-RELATIVE_PATH',
            CONTROLLER_KEY = 'x-WM-TAG',
            parameterTypeKey = 'in',
            AUTH_HDR_KEY = "Authorization",
            CONTROLLER_TYPE_QUERY = 'QueryExecution',
            initiateCallback = Variables.initiateCallback,/*function to initiate the callback and obtain the data for the callback variable.*/
            processRequestQueue = Variables.processRequestQueue;

        function isPrimitiveType(type, modelTypes) {
            return (WS_CONSTANTS.PRIMITIVE_DATA_TYPES.indexOf(type) !== -1)
                || _.get(modelTypes, '["' + type + '"].primitiveType')
                || _.isEmpty(_.get(modelTypes, '["' + type + '"].fields'));
        }

        /**
         * function to prepare the sample model for the service variable
         * @param type
         * @param parentNode
         * @param startNode
         * @param variable
         * @param typeChain
         */
        function prepareServiceModel(type, parentNode, startNode, variable, typeChain) {
            var modelTypes = variable._prefabName ? prefabDataTypes[variable._prefabName] : $rootScope.dataTypes,
                typeChainArr;
            /*if startNode variable is provided, skip till the startNode variable is reached*/
            if (startNode) {
                if (modelTypes[type] && modelTypes[type].fields) {
                    WM.forEach(modelTypes[type].fields, function (field, fieldName) {
                        /*if start node found, start preparing the data*/
                        if (fieldName === startNode) {
                            prepareServiceModel(field.type, parentNode, null, variable);
                        } else {
                            prepareServiceModel(field.type, parentNode, startNode, variable);
                        }
                    });
                }
            } else if (_.isUndefined(typeChain) && isPrimitiveType(type, modelTypes)) {//Set flag to true only if its parent node
                if (!variable.isList) {
                    parentNode['value'] = '';
                }
                variable._buildTreeFromDataSet = true;
            } else if (type && modelTypes[type]) {
                typeChain = typeChain || "";
                typeChainArr = typeChain.split("~");
                if (typeChainArr.indexOf(type) !== -1) {
                    return;
                }
                typeChain += "~" + type;
                WM.forEach(modelTypes[type].fields, function (field, fieldName) {
                    /* if the field is of type list and variable is not a service variable, skip it.
                     * skipping as it is resulting in endless recursive loop for DataServices
                     */
                    if (modelTypes[field.type] && modelTypes[field.type].fields) {
                        //Exempting procedure variables as cursor might return array of objects
                        if (variable.serviceType === 'DataService' && _.get(modelTypes[type].fields, [fieldName, 'isList']) && variable.controller !== 'ProcedureExecution') {
                            return;
                        }
                        parentNode[fieldName] = field.isList ? [{}] : {};
                        prepareServiceModel(field.type, field.isList ? parentNode[fieldName][0] : parentNode[fieldName], '', variable, typeChain);
                    } else {
                        parentNode[fieldName] = field.isList ? [] : '';
                    }
                });
            }
        }

        /*
         * function to transform the service data as according to the variable configuration
         * @param data: data returned from the service
         * @variable: variable object triggering the service
         */
        function transformData(data, variable) {
            data.wmTransformedData = [];

            var columnsArray = variable.transformationColumns,
                dataArray = data[variable.dataField] || [],
                transformedData = data.wmTransformedData;

            WM.forEach(dataArray, function (datum, index) {
                transformedData[index] = {};
                WM.forEach(columnsArray, function (column, columnIndex) {
                    transformedData[index][column] = datum[columnIndex];
                });
            });

            return data;
        }

        /**
         * Goes though request headers, appends 'X-' to certain headers
         * these headers need not be processed at proxy server and should directly be passed to the server
         * e.g. Authorization, Cookie, etc.
         * @param headers
         * @returns {{}}
         */
        function cloakHeadersForProxy(headers) {
            var _headers = {},
                UNCLOAKED_HEADERS = ['CONTENT-TYPE', 'ACCEPT', 'CONTENT-LENGTH', 'ACCEPT-ENCODING', 'ACCEPT-LANGUAGE'],
                CLOAK_PREFIX = 'X-WM-';
            WM.forEach(headers, function (val, key) {
                if (_.includes(UNCLOAKED_HEADERS, key.toUpperCase())) {
                    _headers[key] = val;
                } else {
                    _headers[CLOAK_PREFIX + key] = val;
                }
            });

            return _headers;
        }

        function isQueryServiceVar(variable) {
            return variable.controller === CONTROLLER_TYPE_QUERY && variable.serviceType === VARIABLE_CONSTANTS.SERVICE_TYPE_DATA;
        }
        /*
        * Check for missing required params and format the date/time param values
        * */
        function processRequestBody(inputData, params) {
            var requestBody = {},
                missingParams= [],
                paramValue;
            _.forEach(params, function (param) {
                paramValue = inputData[param.name];
                if (WM.isDefined(paramValue) && (paramValue !== '')) {
                    requestBody[param.name] = Utils.isDateTimeType(param.type) ? Utils.formatDate(paramValue, param.type) : paramValue;
                } else if (param.required) {
                    missingParams.push(param.name || param.id);
                }
            });
            return {
                'requestBody'   : requestBody,
                'missingParams' : missingParams
            };
        }
        /**
         * function to create the params to invoke the java service. creating the params and the corresponding
         * url to invoke based on the type of the parameter
         * @param operationInfo
         * @param variable
         * @returns {*}
         */
        function constructRestRequestParams(operationInfo, variable) {
            variable = variable || {};
            var queryParams = '',
                directPath = operationInfo.directPath || '',
                relativePath = operationInfo.basePath ? operationInfo.basePath + operationInfo.relativePath : operationInfo.relativePath,
                bodyInfo,
                headers = {},
                requestBody,
                url,
                requiredParamMissing = [],
                target,
                pathParamRex,
                invokeParams,
                authType = AUTH_TYPE_NONE,
                uname,
                pswd,
                method,
                formData,
                formDataContentType,
                isProxyCall,
                isBodyTypeQuery = ServiceFactory.isBodyTypeQuery(variable);

            function getFormDataObj() {
                if (formData) {
                    return formData;
                }
                formData = new FormData();
                return formData;
            }

            operationInfo.proxySettings = operationInfo.proxySettings || {web: true, mobile: false};
            method                      = operationInfo.httpMethod || operationInfo.methodType;
            isProxyCall                 = (function () {
                if (CONSTANTS.hasCordova) {
                    return operationInfo.proxySettings.mobile;
                }
                return operationInfo.proxySettings.web;
            }());
            url                         = isProxyCall ? relativePath : directPath;

            /* loop through all the parameters */
            _.forEach(operationInfo.parameters, function (param) {
                var paramValue = param.sampleValue;

                if ((WM.isDefined(paramValue) && paramValue !== '') || isBodyTypeQuery) {
                    //Format dateTime params for dataService variables
                    if (variable.serviceType === 'DataService' && Utils.isDateTimeType(param.type)) {
                        paramValue = Utils.formatDate(paramValue, param.type);
                    }
                    switch (param.parameterType.toUpperCase()) {
                    case 'QUERY':
                        //Ignore null valued query params for queryService variable
                        if (_.isNull(paramValue) && isQueryServiceVar(variable)) {
                            break;
                        }
                        if (!queryParams) {
                            queryParams = "?" + param.name + "=" + encodeURIComponent(paramValue);
                        } else {
                            queryParams += "&" + param.name + "=" + encodeURIComponent(paramValue);
                        }
                        break;
                    case 'AUTH':
                        if (param.name === 'wm_auth_username') {
                            uname = paramValue;
                        } else if (param.name === 'wm_auth_password') {
                            pswd = paramValue;
                        }
                        if (uname && pswd) {
                            headers[AUTH_HDR_KEY] = "Basic " + $base64.encode(uname + ':' + pswd);
                            authType = AUTH_TYPE_BASIC;
                        }
                        break;
                    case 'PATH':
                        /* replacing the path param based on the regular expression in the relative path */
                        pathParamRex = new RegExp("\\s*\\{\\s*" + param.name + "(:\\.\\+)?\\s*\\}\\s*");
                        url = url.replace(pathParamRex, paramValue);
                        break;
                    case 'HEADER':
                        headers[param.name] = paramValue;
                        break;
                    case 'BODY':
                        //For post/put query methods wrap the input
                        if (isBodyTypeQuery) {
                            bodyInfo = processRequestBody(variable.dataBinding, _.get(operationInfo, ['definitions', param.type]));
                            requestBody = bodyInfo.requestBody;
                            requiredParamMissing = _.concat(requiredParamMissing, bodyInfo.missingParams);
                        } else {
                            requestBody = paramValue;
                        }
                        break;
                    case 'FORMDATA':
                        requestBody = Utils.getFormData(getFormDataObj(), param, paramValue);
                        break;
                    }
                } else if (param.required) {
                    requiredParamMissing.push(param.name || param.id);
                    return false;
                }
            });

            // if required param not found, return error
            requiredParamMissing = requiredParamMissing.join(',');
            if (requiredParamMissing) {
                return {
                    'error': {
                        'type'                    : 'required_field_missing',
                        'field'                   : requiredParamMissing,
                        'message'                 : 'Required field(s) missing: "' + requiredParamMissing + '"',
                        'skipDefaultNotification' : true
                    }
                };
            }

            // Setting appropriate content-Type for request accepting request body like POST, PUT, etc
            if (!_.includes(WS_CONSTANTS.NON_BODY_HTTP_METHODS, (method || '').toUpperCase())) {
                /*Based on the formData browser will automatically set the content type to 'multipart/form-data' and webkit boundary*/
                if (operationInfo.consumes && (operationInfo.consumes[0] === WS_CONSTANTS.CONTENT_TYPES.MULTIPART_FORMDATA)) {
                    headers['Content-Type'] = undefined;
                } else {
                    headers['Content-Type'] = (operationInfo.consumes && operationInfo.consumes[0]) || 'application/json';
                }
            }

            // if the consumes has application/x-www-form-urlencoded and
            // if the http request of given method type can have body send the queryParams as Form Data
            if (_.includes(operationInfo.consumes, WS_CONSTANTS.CONTENT_TYPES.FORM_URL_ENCODED)
                    && !_.includes(WS_CONSTANTS.NON_BODY_HTTP_METHODS, (method || '').toUpperCase())) {
                // remove the '?' at the start of the queryParams
                if (queryParams) {
                    requestBody = (requestBody ? requestBody + '&' : '') + queryParams.substring(1);
                }
                headers['Content-Type'] = WS_CONSTANTS.CONTENT_TYPES.FORM_URL_ENCODED;
            } else {
                url += queryParams;
            }

            /*
             * for proxy calls:
             *  - cloak the proper headers (required only for REST services)
             *  - prepare complete url from relativeUrl
             */
            if (isProxyCall) {
                //avoiding cloakHeadersForProxy when the method is invoked from apidesigner.
                headers = variable.serviceType !== SERVICE_TYPE_REST || operationInfo.skipCloakHeaders ? headers : cloakHeadersForProxy(headers);
                if (variable._prefabName && REST_SUPPORTED_SERVICES.indexOf(variable.serviceType) !== -1 && variable._wmServiceOperationInfo) {
                    /* if it is a prefab variable (used in a normal project), modify the url */
                    url = "/prefabs/" + variable._prefabName + url;
                    target = "invokePrefabRestService";
                } else if (!variable._prefabName) {
                    url = '/services' + url;
                }
                url = $rootScope.project.deployedUrl + url;
            }

            /*creating the params needed to invoke the service. url is generated from the relative path for the operation*/
            invokeParams = {
                "projectID": $rootScope.project.id,
                "url": url,
                "target": target,
                "method": method,
                "headers": headers,
                "dataParams": requestBody,
                "authType": authType,
                "isDirectCall": !isProxyCall
            };

            return invokeParams;
        }

        /**
         * function to process error response from a service
         */
        function processErrorResponse(variable, errMsg, errorCB, xhrObj, skipNotification, skipDefaultNotification) {
            // EVENT: ON_ERROR
            if (!skipNotification) {
                initiateCallback(VARIABLE_CONSTANTS.EVENT.ERROR, variable, errMsg, xhrObj, skipDefaultNotification);
            }

            /* trigger error callback */
            Utils.triggerFn(errorCB, errMsg);

            if (CONSTANTS.isRunMode) {
                /* process next requests in the queue */
                variableActive[variable.activeScope.$id][variable.name] = false;
                variable.canUpdate = true;
                processRequestQueue(variable, requestQueue[variable.activeScope.$id], getDataInRun);

                // EVENT: ON_CAN_UPDATE
                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variable, errMsg, xhrObj);
            }
        }

        /**
         * function to process success response from a service
         * @param response
         * @param variable
         * @param options
         * @param success
         */
        function processSuccessResponse(response, variable, options, success) {
            var newDataSet;

            response = Utils.getValidJSON(response) || Utils.xmlToJson(response) || response;

            // EVENT: ON_RESULT
            initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variable, response, options.xhrObj);

            /* if dataTransformation enabled, transform the data */
            if (variable.transformationColumns) {
                response = transformData(response, variable);
            }

            // EVENT: ON_PREPARE_SETDATA
            newDataSet = initiateCallback(VARIABLE_CONSTANTS.EVENT.PREPARE_SETDATA, variable, response, options.xhrObj);
            if (WM.isDefined(newDataSet)) {
                //setting newDataSet as the response to service variable onPrepareSetData
                response = newDataSet;
            }

            /* update the dataset against the variable, if response is non-object, insert the response in 'value' field of dataSet */
            if (!options.forceRunMode && !options.skipDataSetUpdate) {
                variable.dataSet = (!WM.isObject(response)) ? {'value': response} : response;
            }

            /* trigger success callback */
            Utils.triggerFn(success, response);

            $timeout(function () {
                // EVENT: ON_SUCCESS
                initiateCallback(VARIABLE_CONSTANTS.EVENT.SUCCESS, variable, response, options.xhrObj);

                if (CONSTANTS.isRunMode) {
                    /* process next requests in the queue */
                    variableActive[variable.activeScope.$id][variable.name] = false;
                    variable.canUpdate = true;
                    processRequestQueue(variable, requestQueue[variable.activeScope.$id], getDataInRun);
                }

                // EVENT: ON_CAN_UPDATE
                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variable, response, options.xhrObj);
            });
        }

        //Gets method info for given variable and input fields using options provided
        function getMethodInfo(variable, inputFields, options) {
            var methodInfo = Utils.getClonedObject(variable._wmServiceOperationInfo);
            if (methodInfo.parameters) {
                methodInfo.parameters.forEach(function (param) {
                    param.sampleValue = inputFields[param.name];
                    /* supporting pagination for query service variable */
                    if (VARIABLE_CONSTANTS.PAGINATION_PARAMS.indexOf(param.name) !== -1) {
                        if (param.name === "size") {
                            param.sampleValue = options.size || param.sampleValue || parseInt(variable.maxResults, 10);
                        } else if (param.name === "page") {
                            param.sampleValue = options.page || param.sampleValue;
                        } else if (param.name === "sort") {
                            param.sampleValue = Variables.getEvaluatedOrderBy(variable.orderBy, options.orderBy) || param.sampleValue;
                        }
                    }
                });
            }

            return methodInfo;
        }

        /**
         * function to get variable data in RUN Mode
         * @param variable
         * @param options
         * @param success
         * @param error
         */
        function getDataInRun(variable, options, success, error) {
            /* get the service and operation from the variable object */
            var service = variable.service,
                operation = variable.operation,
                serviceType = variable.serviceType,
                dataParams = [],
                params,
                methodInfo,
                inputFields = Utils.getClonedObject(options.inputFields || variable.dataBinding),
                output;

            // EVENT: ON_BEFORE_UPDATE
            if (CONSTANTS.isRunMode) {
                output = initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE, variable, inputFields);
                if (output === false) {
                    return;
                }
                if (_.isObject(output)) {
                    inputFields = output;
                }
                $rootScope.$emit('toggle-variable-state', variable.name, !options.skipToggleState);
                variableActive[variable.activeScope.$id][variable.name] = true;
                variable.canUpdate = false;
            }

            /* loop over the parameters required for the variable and push them request dataParams */
            WM.forEach(inputFields, function (param) {
                dataParams.push(param);
            });

            if (REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable._wmServiceOperationInfo) {
                methodInfo = getMethodInfo(variable, inputFields, options);
                if (_.isEmpty(methodInfo)) {
                    params = {
                        'error': {
                            'type': 'meta_data_missing',
                            'field': '_wmServiceOperationInfo',
                            'message': 'Meta data for the service "' + variable.service + '" is missing. Please run the project again.'
                        }
                    };
                } else {
                    params = constructRestRequestParams(methodInfo, variable);
                }
                if (params.error && params.error.message) {
                    processErrorResponse(variable, params.error.message, error, options.xhrObj, options.skipNotification, params.error.skipDefaultNotification);
                    return;
                }
            } else if (serviceType === SERVICE_TYPE_REST) {
                dataParams = [service, operation, Utils.getClonedObject(inputFields)];

                /*prepare request params*/
                params = {
                    "method": REST_METHOD_NAME,
                    "params": dataParams,
                    "url": $rootScope.project.deployedUrl,
                    "target": "invokeRestService"
                };
            } else {
                /*for old projects as a normal java method invocation*/
                params = {
                    "method": operation,
                    "serviceFile": service + ".json",
                    "params": dataParams,
                    "url": $rootScope.project.deployedUrl
                };
            }

            if (variable._prefabName && REST_SUPPORTED_SERVICES.indexOf(serviceType) === -1) {
                /* if it is a prefab variable (used in a normal project), modify the url */
                params.url += "/prefabs/" + variable._prefabName;
                params.target = "invokePrefabRestService";
            }

            /* if the service produces octet/stream, replicate file download through form submit */
            if (WM.isArray(methodInfo.produces) && _.includes(methodInfo.produces, WS_CONSTANTS.CONTENT_TYPES.OCTET_STREAM)) {
                Utils.simulateFileDownload(params);
                variableActive[variable.activeScope.$id][variable.name] = false;
                return;
            }

            if (REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable._wmServiceOperationInfo) {
                /* Here we are invoking JavaService through the new REST api (old classes implementation removed, older projects migrated with new changes for corresponding service variable) */
                variable.promise = WebService.invokeJavaService(params, function (response, xhrObj) {
                    if (_.get(xhrObj, 'status') === WS_CONSTANTS.HTTP_STATUS_CODE.CORS_FAILURE) {
                        processErrorResponse(variable, 'Possible CORS Failure, try disabling Same-Origin Policy on the browser.', error, xhrObj, options.skipNotification);
                    } else {
                        options.xhrObj = xhrObj;
                        processSuccessResponse(response, variable, options, success, error);
                    }
                }, function (errorMsg, details, xhrObj) {
                    if (_.get(details, 'status') === WS_CONSTANTS.HTTP_STATUS_CODE.CORS_FAILURE) {
                        errorMsg = 'Possible CORS Failure, try disabling Same-Origin Policy on the browser.';
                    }
                    processErrorResponse(variable, errorMsg, error, xhrObj, options.skipNotification);
                });
            }
        }

        /**
         * function to get variable data in Studio mode
         * @param variable
         * @param startNode
         * @param success
         */
        function getDataInStudio(variable, startNode, success) {
            /* get the service and operation from the variable object */
            var service = variable.service,
                operationId = variable.operationId,
                serviceModel = {};

            /* get the data from variable return type information */
            ServiceFactory.getServicesWithType(function () {
                ServiceFactory.getServiceOperations(service, function () {
                    ServiceFactory.getServiceOperationParams(service, operationId, function (response) {
                        var typeRef = _.get(response, ['return', 'typeRef']),
                            fieldValue = startNode ? startNode.substring(variable.name.length + 1, startNode.length) : startNode,
                            variableTypeNode,
                            transformationCols;
                        serviceModel = {};

                        variable.type = variable.type || typeRef;
                        variable.isList = response.isList;
                        variable._format = response.returnFormat;
                        /* prepare sample data-structure for the service */
                        prepareServiceModel(variable.type, serviceModel, fieldValue, variable);

                        /*
                         * check for transformation columns in variable
                         * if found, push a new type node for 'wmTransformedData' in the dataTypes with the transformationColumns
                         */
                        if (variable.transformationColumns) {
                            serviceModel['wmTransformedData'] = {};
                            WM.forEach(variable.transformationColumns, function (columnName) {
                                serviceModel['wmTransformedData'][columnName] = '';
                            });
                            variableTypeNode = $rootScope.dataTypes[variable.type];
                            transformationCols = variable.transformationColumns;
                            variableTypeNode.fields['wmTransformedData'] = {'type': variable.service + '.wmTransformedData'};
                            $rootScope.dataTypes[variable.service + '.wmTransformedData'] = {
                                'service': variable.service,
                                'fields': _.zipObject(transformationCols, _.fill(new Array(transformationCols.length), {'type': 'string, number, date, datetime'}))
                            };
                        }

                        /* update the dataset */
                        variable.dataSet = variable.isList ? [serviceModel] : serviceModel;
                        /*pass the data prepared to the success callback function*/
                        Utils.triggerFn(success, serviceModel);
                    });
                });
            });
        }

        /**
         * function to create the service operation info in the variable object, to create the parameter info
         * for the selected operation of the service
         * @param selectedOperation
         * @param selectedService
         * @param success
         * @param error
         * @param forceReload
         * @param controller
         */
        function getServiceOperationInfo(selectedOperation, selectedService, success, error, forceReload, controller) {
            var operationInfo = {};

            /*invoking a service to get the operations that a particular service has and it's
             * parameters to create a unique url pattern*/
            ServiceFactory.getServiceDef(selectedService, function (response) {
                /*iterate over the paths received from the service response*/
                var pathsArr = Object.keys(response.paths),
                    securityDefinitions = response.securityDefinitions,
                    AUTH_TYPE_KEY = 'WM_Rest_Service_Authorization',
                    paramDataType,
                    i,
                    nPaths,
                    pathKey,
                    path,
                    j,
                    nOps,
                    opType,
                    operation;
                for (i = 0, nPaths = pathsArr.length; i < nPaths; i++) {
                    pathKey = pathsArr[i];
                    path = response.paths[pathKey];
                    for (j = 0, nOps = supportedOperations.length; j < nOps; j++) {
                        opType = supportedOperations[j];
                        operation = path[opType];
                        if (operation && operation[WS_CONSTANTS.OPERATION_NAME_KEY] === selectedOperation) {
                            /* if controller is provided, check for controller match as well */
                            if (controller && controller + "Controller" !== path[CONTROLLER_KEY]) {
                                continue;
                            }
                            operationInfo.httpMethod = opType;
                            operationInfo.operationId = operation.operationId;
                            operationInfo.name = selectedOperation;
                            operationInfo.relativePath = (path[BASE_PATH_KEY] || "") + path[RELATIVE_PATH_KEY];
                            /*saving the request mime type only if it is explicitly mentioned used in the file upload widget to decide the mime type from swagger path object*/
                            if (operation.consumes && operation.consumes.length) {
                                operationInfo.consumes = operation.consumes;
                            }
                            /*
                             * saving the response mime type only if it is explicitly mentioned.
                             * UseCase: 'download' operation of 'FileService' gives application/octet-stream
                             * this is used to determine if a download file has to be simulated through form submit(as download not possible through AJAX)
                             */
                            if (operation.produces && operation.produces.length) {
                                operationInfo.produces = operation.produces;
                            }
                            operationInfo.parameters = [];

                            if (operation.parameters && operation.parameters.length) {
                                operation.parameters.forEach(function (parameter) {
                                    if (parameter[parameterTypeKey].toLowerCase() === 'formdata') {
                                        paramDataType = parameter.type === "array" ? (parameter.items && parameter.items.type) || parameter.type : parameter.type;
                                    } else {
                                        paramDataType = parameter.type;
                                    }
                                    operationInfo.parameters.push({
                                        "name": parameter.name || (parameter[parameterTypeKey] && parameter[parameterTypeKey].toLowerCase()),
                                        "parameterType": parameter[parameterTypeKey],
                                        "type": paramDataType
                                    });
                                });
                            }
                            if (securityDefinitions && securityDefinitions[AUTH_TYPE_KEY] && securityDefinitions[AUTH_TYPE_KEY].type === "basic" && operation.security[0][AUTH_TYPE_KEY]) {
                                operationInfo.authorization = securityDefinitions[AUTH_TYPE_KEY].type;
                                operationInfo.parameters.push({
                                    "name": "wm_auth_username",
                                    "parameterType": "auth"
                                });
                                operationInfo.parameters.push({
                                    "name": "wm_auth_password",
                                    "parameterType": "auth"
                                });
                            }
                            break;
                        }
                    }
                    if (j < nOps) {
                        break;
                    }
                }
                /*pass the data prepared to the success callback function*/
                Utils.triggerFn(success, operationInfo);
            }, function (errMsg) {
                /*handle error response*/
                Utils.triggerFn(error, errMsg);
            }, forceReload);
        }
        //Function to get operationId for the operation
        function getOperationId(selectedOperation, selectedService, success, error, forceReload) {
            var operationId;
            ServiceFactory.getServiceDef(selectedService, function (response) {
                _.forEach(response.paths, function (path) {
                    _.forEach(supportedOperations, function (op) {
                        if (_.get(path, [op, WS_CONSTANTS.OPERATION_NAME_KEY]) === selectedOperation) {
                            operationId = _.get(path, [op, 'operationId']);
                        }
                        return !operationId;
                    });
                    return !operationId;
                });
                Utils.triggerFn(success, operationId);
            }, function (errMsg) {
                /*handle error response*/
                Utils.triggerFn(error, errMsg);
            }, forceReload);
        }
        function update(options, success, error) {
            var name = this.name;
            options = options || {};
            options.scope = this.activeScope || options.scope;
            methods.getData(this, options, function (response) {
                if (CONSTANTS.isRunMode) {
                    $rootScope.$emit('toggle-variable-state', name, false, response);
                }
                Utils.triggerFn(success, response);
            }, function (errMsg) {
                if (CONSTANTS.isRunMode) {
                    $rootScope.$emit('toggle-variable-state', name, false);
                }
                Utils.triggerFn(error, errMsg);
            });
        }

        /* properties of a service variable - should contain methods applicable on this particular object */
        methods = {
            getDataSet: function (variable) {
                /* return the variable dataSet*/
                return variable.dataSet;
            },
            getData: function (variable, options, success, error) {
                /* get the variable object from variable collection */
                var variableName = variable.name,
                    startNode = options.startNode,
                    serviceModel;

                /* if variable not found return into error callback */
                if (Utils.isEmptyObject(variable)) {
                    error();
                    return;
                }

                /* if in run mode, hit the web service and retrieve data */
                if (CONSTANTS.isRunMode || options.forceRunMode) {
                    if (CONSTANTS.isRunMode) {
                        variableActive[variable.activeScope.$id] = variableActive[variable.activeScope.$id] || {};
                        requestQueue[variable.activeScope.$id] = requestQueue[variable.activeScope.$id] || {};
                        if (variableActive[variable.activeScope.$id][variableName]) {
                            options.inputFields = options.inputFields || Utils.getClonedObject(variable.dataBinding);
                            requestQueue[variable.activeScope.$id][variableName] = requestQueue[variable.activeScope.$id][variableName] || [];
                            requestQueue[variable.activeScope.$id][variableName].push({variable: variable, options: options, success: success, error: error});
                            return;
                        }
                    }
                    if (options.forceRunMode) {
                        /*call run-project service*/
                        ProjectService.run({
                            projectId: $rootScope.project.id
                        }, function (result) {
                            /*Save the deployed url of the project in the $rootScope so that it could be used in all calls to services of deployed app*/
                            $rootScope.project.deployedUrl = Utils.removeProtocol(result);

                            getDataInRun(variable, options, success, error);
                        });
                    } else {
                        getDataInRun(variable, options, success, error);
                    }
                } else if (variable._prefabName) {
                    serviceModel = {};
                    ServiceFactory.getPrefabTypes(variable._prefabName, function (types) {
                        prefabDataTypes[variable._prefabName] = types;
                        /* prepare sample data-structure for the service */
                        prepareServiceModel(variable.type, serviceModel, null, variable);
                        variable.dataSet = serviceModel;
                        Utils.triggerFn(success, serviceModel);
                    });
                } else {
                    getDataInStudio(variable, startNode, success, error);
                }
            },
            setService: function (variable, service) {
                if (service) {
                    variable.service = service;
                }

                return variable.service;
            },
            setOperation: function (variable, operation) {
                if (operation) {
                    variable.operation = operation;
                }

                return variable.operation;
            },
            clearData: function (variable) {
                variable.dataSet = {};

                /* return the variable dataSet*/
                return variable.dataSet;
            },
            cancel: function (variable) {
                /* process only if current variable is actually active */
                if (variableActive[variable.activeScope.$id][variable.name] && variable.promise) {
                    variable.promise.abort();
                }
            },
            setInput: function (variable, key, val, options) {
                var targetObj = variable.dataBinding,
                    keys,
                    lastKey,
                    paramObj = {};
                if (WM.isObject(options)) {
                    switch (options.type) {
                    case 'file':
                        val = Utils.getBlob(val, options.contentType);
                        break;
                    case 'number':
                        val = _.isNumber(val) ? val : parseInt(val, 10);
                        break;
                    }
                }
                if (WM.isObject(key)) {
                    paramObj = key;
                } else if (key.indexOf('.') > -1) {
                    keys = key.split('.');
                    lastKey = keys.pop();
                    /*Finding the object based on the key*/
                    targetObj = Utils.findValueOf(targetObj, keys.join('.'), true);
                    key = lastKey;
                    paramObj[key] = val;
                } else {
                    paramObj[key] = val;
                }

                WM.forEach(paramObj, function (paramVal, paramKey) {
                    targetObj[paramKey] = paramVal;
                });
                return variable.dataBinding;
            }
        };
        serviceVariableObj = {
            update: update,
            invoke : update,
            setService: function (service) {
                return methods.setService(this, service);
            },
            setOperation: function (operation) {
                return methods.setOperation(this, operation);
            },
            getData: function () {
                return methods.getDataSet(this);
            },
            clearData: function () {
                return methods.clearData(this);
            },
            cancel: function () {
                return methods.cancel(this);
            },
            setInput: function (key, val, options) {
                return methods.setInput(this, key, val, options);
            },
            download: function (options, errorHandler) {
                var inputParams  = Utils.getClonedObject(this.dataBinding),
                    methodInfo   = getMethodInfo(this, inputParams, options),
                    requestParams;

                methodInfo.relativePath += '/export/' + options.exportFormat;
                requestParams = constructRestRequestParams(methodInfo, this);

                //If request params returns error then show an error toaster
                if (_.hasIn(requestParams, 'error.message')) {
                    Utils.triggerFn(errorHandler, requestParams.error.message);
                } else {
                    Utils.simulateFileDownload(requestParams);
                }
            },
            init: function () {
                if (this.isList) {
                    Object.defineProperty(this, 'firstRecord', {
                        'get': function () {
                            var dataSet = methods.getDataSet(this);
                            //For procedure(v1) data doesn't come under content
                            return _.head(dataSet && dataSet.content) || _.head(dataSet) || {};
                        }
                    });
                    Object.defineProperty(this, 'lastRecord', {
                        'get': function () {
                            var dataSet = methods.getDataSet(this);
                            //For procedure(v1) data doesn't come under content
                            return _.last(dataSet && dataSet.content) || _.last(dataSet) || {};
                        }
                    });
                }
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.ServiceVariable', serviceVariableObj, ['wm.Variable'], methods);

        return {
            getServiceModel           : function (params) {
                var model = {},
                    variable = params.variable,
                    prefabName = _.get(variable, '_prefabName');
                if (prefabName) {
                    prefabDataTypes[prefabName] = params.types;
                }
                prepareServiceModel(params.typeRef, model, null, params.variable);

                return model;
            },
            getServiceOperationInfo   : getServiceOperationInfo,
            getOperationId            : getOperationId,
            constructRestRequestParams: constructRestRequestParams
        };
    }];
