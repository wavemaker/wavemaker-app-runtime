/*global wm, WM, _*/
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
    'DatabaseService',
    '$base64',

    function (Variables, BaseVariablePropertyFactory, WebService, ServiceFactory, $rootScope, CONSTANTS, Utils, ProjectService, VARIABLE_CONSTANTS, WS_CONSTANTS, DatabaseService, $base64) {
        "use strict";

        var serviceModel = {},
            requestQueue = {},
            variableActive = {},
            prefabDataTypes = {},
            REST_METHOD_NAME = "executeRestCall",
            REST_SUPPORTED_SERVICES = VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES,
            SERVICE_TYPE_FEED = VARIABLE_CONSTANTS.SERVICE_TYPE_FEED,
            SERVICE_TYPE_REST = VARIABLE_CONSTANTS.SERVICE_TYPE_REST,
            SERVICE_TYPE_SOAP = VARIABLE_CONSTANTS.SERVICE_TYPE_SOAP,
            SERVICE_TYPE_DATA = VARIABLE_CONSTANTS.SERVICE_TYPE_DATA,
            SERVICE_TYPE_JAVA = VARIABLE_CONSTANTS.SERVICE_TYPE_JAVA,
            AUTH_TYPE_BASIC = "BASIC",
            AUTH_TYPE_NONE = "NONE",
            AUTH_TYPE_OAUTH = "OAUTH",
            supportedOperations = WS_CONSTANTS.HTTP_METHODS.map(function (method) { return method.toLowerCase(); }),
            BASE_PATH_KEY = 'x-WM-BASE_PATH',
            RELATIVE_PATH_KEY = 'x-WM-RELATIVE_PATH',
            CONTROLLER_KEY = 'x-WM-TAG',
            parameterTypeKey = 'in',
            AUTH_HDR_KEY = "Authorization",
            isPrimitiveType = function (type) {
                return (WS_CONSTANTS.PRIMITIVE_DATA_TYPES.indexOf(type) !== -1);
            },
            /* function to prepare the sample model for the service variable */
            prepareServiceModel = function (type, parentNode, startNode, variable, typeChain) {
                var modelTypes = variable.prefabName ? prefabDataTypes[variable.prefabName] : $rootScope.dataTypes;
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
                } else if ((type && modelTypes[type]) || isPrimitiveType(type)) {
                    /* case when the data returned from the service is not an object */
                    if ((modelTypes[type] && modelTypes[type].primitiveType) || isPrimitiveType(type)) {
                        if (!variable.isList) {
                            parentNode['value'] = '';
                        }
                        variable._buildTreeFromDataSet = true;
                        return;
                    }
                    typeChain = typeChain || "";
                    var typeChainArr = typeChain.split("~");
                    if (typeChainArr.indexOf(type) !== -1) {
                        return;
                    }
                    typeChain += "~" + type;
                    WM.forEach(modelTypes[type].fields, function (field, fieldName) {
                        /* if the field is of type list and variable is not a service variable, skip it.
                         * skipping as it is resulting in endless recursive loop for DataServices
                         */
                        if (modelTypes[field.type] && modelTypes[field.type].fields) {
                            parentNode[fieldName] = field.isList ? [{}] : {};
                            prepareServiceModel(field.type, field.isList ? parentNode[fieldName][0] : parentNode[fieldName], '', variable, typeChain);
                        } else {
                            parentNode[fieldName] = field.isList ? [] : '';
                        }
                    });
                }
            },
        /*function to initiate the callback and obtain the data for the callback variable.*/
            initiateCallback = Variables.initiateCallback,

            processRequestQueue = Variables.processRequestQueue,

            /*
             * function to transform the service data as according to the variable configuration
             * @param data: data returned from the service
             * @variable: variable object triggering the service
             */
            transformData = function (data, variable) {
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
            },

            /**
             * Simulates file download in an app through creating and submitting a hidden form in DOM.
             * The action will be initiated through a Service Variable
             * @param variable: the variable that is called from user action
             * @param requestParams object consisting the info to construct the XHR request for the service
             */
            simulateFileDownload = function (requestParams) {
                var iFrameElement,
                    IFRAME_NAME = "fileDownloadIFrame",
                    FORM_NAME = "fileDownloadForm",
                    formEl,
                    url = requestParams.url,
                    paramElement,
                    queryParams;

                /* look for existing iframe. If exists, remove it first */
                iFrameElement = $(IFRAME_NAME);
                if (iFrameElement.length) {
                    iFrameElement.first().remove();
                }
                iFrameElement = WM.element('<iframe id="' + IFRAME_NAME +'" name="'+ IFRAME_NAME +'" class="ng-hide"></iframe>');
                formEl = WM.element('<form id="' + FORM_NAME + '" name="' + FORM_NAME + '"></form>'),
                formEl.attr({
                    'target': iFrameElement.attr("name"),
                    'action': url,
                    'method': requestParams.method,
                    'enctype': requestParams.headers['Content-Type']
                });

                /* process query params, append a hidden input element in the form against each param */
                queryParams = url.indexOf('?') !== -1 ? url.substring(url.indexOf('?') + 1) :
                        requestParams.headers['Content-Type'] === WS_CONSTANTS.CONTENT_TYPES.FORM_URL_ENCODED ? requestParams.dataParams : "",
                queryParams = queryParams.split("&");
                queryParams.forEach(function (param) {
                    param = param.split("=");
                    paramElement = WM.element("<input type='hidden'>");
                    paramElement.attr({
                        'name': param[0],
                        'value': param[1]
                    });
                    formEl.append(paramElement);
                });

                /* append form to iFrame and iFrame to the document and submit the form */
                WM.element('body').append(iFrameElement);
                iFrameElement.contents().find('body').append(formEl);
                formEl.submit();
            },

            /* function to process error response from a service */
            processErrorResponse = function (errMsg, variable, callBackScope, error) {
                // EVENT: ON_ERROR
                initiateCallback(VARIABLE_CONSTANTS.EVENT.ERROR, variable, callBackScope, errMsg);

                /* trigger error callback */
                Utils.triggerFn(error, errMsg);

                if (CONSTANTS.isRunMode) {
                    /* process next requests in the queue */
                    variableActive[variable.activeScope.$id][variable.name] = false;
                    variable.canUpdate = true;
                    processRequestQueue(variable, requestQueue[variable.activeScope.$id], getDataInRun);

                    // EVENT: ON_CAN_UPDATE
                    initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variable, callBackScope, error);
                }
            },

            /* function to process success response from a service */
            processSuccessResponse = function (response, variable, callBackScope, options, success, error) {
                var newDataSet;

                /* if RestService check statusCode for error, else check 'error' field in response */
                if (response && response.error) {
                    processErrorResponse(response, variable, callBackScope, error);
                    return;
                }

                // EVENT: ON_RESULT
                initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variable, callBackScope, response);

                // EVENT: ON_SUCCESS
                initiateCallback(VARIABLE_CONSTANTS.EVENT.SUCCESS, variable, callBackScope, response);

                /* if dataTransformation enabled, transform the data */
                if (variable.transformationColumns) {
                    response = transformData(response, variable);
                }

                // EVENT: ON_PREPARE_SETDATA
                newDataSet = initiateCallback(VARIABLE_CONSTANTS.EVENT.PREPARE_SETDATA, variable, callBackScope, response);
                if (WM.isDefined(newDataSet)) {
                    //setting newDataSet as the response to service variable onPrepareSetData
                    response = newDataSet;
                }

                /* update the dataset against the variable, if response is non-object, insert the response in 'value' field of dataSet */
                if (!options.forceRunMode) {
                    variable.dataSet = (!WM.isObject(response)) ? {'value': response} : response;
                }

                /* trigger success callback */
                Utils.triggerFn(success, response);

                if (CONSTANTS.isRunMode) {
                    /* process next requests in the queue */
                    variableActive[variable.activeScope.$id][variable.name] = false;
                    variable.canUpdate = true;
                    processRequestQueue(variable, requestQueue[variable.activeScope.$id], getDataInRun);
                }

                // EVENT: ON_CAN_UPDATE
                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variable, callBackScope, response);
            },
        /*function to create the params to invoke the java service. creating the params and the corresponding
        * url to invoke based on the type of the parameter*/
            constructRestRequestParams = function (operationInfo, serviceType, variable) {
                var queryParams = '',
                    endPointRelativePath = operationInfo.relativePath || '/',
                    headers = {},
                    requestBody,
                    url,
                    target,
                    pathParamRex,
                    invokeParams,
                    authType = AUTH_TYPE_NONE,
                    uname,
                    pswd,
                    method,
                    isFormDataSupported = Utils.isFileUploadSupported(),
                    formData,
                    formDataContentType;

                if (isFormDataSupported) {
                    formData = new FormData();
                }
                /* loop through all the parameters */
                WM.forEach(operationInfo.parameters, function (param) {
                    var paramValue = param.sampleValue;
                    if (WM.isDefined(paramValue) && paramValue !== '') {
                        switch (param.parameterType.toUpperCase()) {
                        case 'QUERY':
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
                            endPointRelativePath = endPointRelativePath.replace(pathParamRex, paramValue);
                            break;
                        case 'HEADER':
                            headers[param.name] = paramValue;
                            break;
                        case 'BODY':
                            requestBody = paramValue;
                            break;
                        case 'FORMDATA':
                            if (isFormDataSupported) {
                                if (param.type === "file") {
                                    if (WM.isArray(paramValue)) {
                                        WM.forEach(paramValue, function (fileObject) {
                                            formData.append(param.name, fileObject, fileObject.name);
                                        });
                                    } else {
                                        formData.append(param.name, paramValue, paramValue.name);
                                    }
                                } else {
                                    if (WM.isObject(paramValue)) {
                                        paramValue = JSON.stringify(paramValue);
                                        formDataContentType = "application/json";
                                    } else {
                                        formDataContentType = "text/plain";
                                    }
                                    formData.append(param.name, new Blob([paramValue], {type: formDataContentType}));
                                }
                                requestBody = formData;
                            }
                            break;
                        }
                    }
                });

                url = $rootScope.project.deployedUrl;

                if (variable.prefabName && VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable.wmServiceOperationInfo) {
                    /* if it is a prefab variable (used in a normal project), modify the url */
                    url += "/prefabs/" + variable.prefabName;
                    target = "invokePrefabRestService";
                }

                method = operationInfo.httpMethod || operationInfo.methodType;
                url += (variable.prefabName ? '' : '/services') + endPointRelativePath;
                /*Setting appropriate content-Type*/
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
                    requestBody = queryParams.substring(1);
                    headers['Content-Type'] = WS_CONSTANTS.CONTENT_TYPES.FORM_URL_ENCODED;
                } else {
                    url += queryParams;
                }

                /*creating the params needed to invoke the service. url is generated from the relative path for the operation*/
                invokeParams = {
                    "projectID": $rootScope.project.id,
                    "url": url,
                    "target": target,
                    "method": method,
                    "headers": headers,
                    "dataParams": requestBody,
                    "authType": authType
                };

                return invokeParams;
            },
        /*function to get variable data in RUN Mode*/
            getDataInRun = function (variable, options, success, error) {
                /* get the service and operation from the variable object */
                var service = variable.service,
                    operation = variable.operation,
                    variableOwner = variable.owner,
                    serviceType = variable.serviceType,
                    dataParams = [],
                    requestMethod,
                    requestParams = "",
                    params,
                    callBackScope,
                    methodInfo,
                    inputFields = options.inputFields || variable.dataBinding;

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

                // EVENT: ON_BEFORE_UPDATE
                if (CONSTANTS.isRunMode) {
                    var preventCall = initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE, variable, callBackScope, inputFields);
                    if (preventCall === false) {
                        return;
                    }
                    variableActive[variable.activeScope.$id][variable.name] = true;
                    variable.canUpdate = false;
                }

                /* loop over the parameters required for the variable and push them request dataParams */
                WM.forEach(inputFields, function (param) {
                    dataParams.push(param);
                });

                if (VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable.wmServiceOperationInfo) {
                    methodInfo = Utils.getClonedObject(variable.wmServiceOperationInfo);
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
                                    param.sampleValue = options.orderBy || param.sampleValue || variable.orderBy;
                                }
                            }
                        });
                    }
                    params = constructRestRequestParams(methodInfo, serviceType, variable);
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

                if (variable.prefabName && VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES.indexOf(serviceType) === -1) {
                /* if it is a prefab variable (used in a normal project), modify the url */
                    params.url += "/prefabs/" + variable.prefabName;
                    params.target = "invokePrefabRestService";
                }

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

                /* if the service produces octet/stream, replicate file download through form submit */
                if (WM.isArray(methodInfo.produces) && _.includes(methodInfo.produces, WS_CONSTANTS.CONTENT_TYPES.OCTET_STREAM)) {
                    simulateFileDownload(params);
                    variableActive[variable.activeScope.$id][variable.name] = false;
                    return;
                }

                if (REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable.wmServiceOperationInfo) {
                    /* Here we are invoking JavaService through the new REST api (old classes implementation removed, older projects migrated with new changes for corresponding service variable) */
                    variable.promise = WebService.invokeJavaService(params, function (response) {
                        processSuccessResponse(response, variable, callBackScope, options, success, error);
                    }, function (errorMsg) {
                        processErrorResponse(errorMsg, variable, callBackScope, error);
                    });
                } else if (serviceType === SERVICE_TYPE_REST) {
                    variable.promise = WebService.invokeRestService(params, function (response) {
                        processSuccessResponse(response, variable, callBackScope, options, success, error);
                    }, function (errorMsg) {
                        processErrorResponse(errorMsg, variable, callBackScope, error);
                    });
                } else {
                    /* invoke the service */
                    variable.promise = WebService.invoke(params, function (response) {
                        processSuccessResponse(response, variable, callBackScope, options, success, error);
                    }, function (errMsg) {
                        processErrorResponse(errMsg, variable, callBackScope, error);
                    });
                }
            },
        /*function to get variable data in Studio mode*/
            getDataInStudio = function (variable, startNode, success) {
                /* get the service and operation from the variable object */
                var service = variable.service,
                    operation = variable.operation;

                /* get the data from variable return type information */
                ServiceFactory.getServicesWithType(function () {
                    ServiceFactory.getServiceOperations(service, function () {
                        ServiceFactory.getServiceOperationParams(service, operation, function (response) {
                            var typeRef = response['return'].typeRef,
                                fieldValue = startNode ? startNode.substring(variable.name.length + 1, startNode.length) : startNode;
                            serviceModel = {};

                            variable.type = variable.type || typeRef;
                            variable.isList = response.isList;
                            variable._format = response.returnFormat;
                            /* prepare sample data-structure for the service */
                            prepareServiceModel(variable.type, serviceModel, fieldValue, variable);

                            /* check for transformation columns in variable */
                            if (variable.transformationColumns) {
                                serviceModel['wmTransformedData'] = {};
                                WM.forEach(variable.transformationColumns, function (columnName) {
                                    serviceModel['wmTransformedData'][columnName] = '';
                                });
                            }

                            /* update the dataset */
                            variable.dataSet = variable.isList ? [serviceModel] : serviceModel;
                            /*pass the data prepared to the success callback function*/
                            Utils.triggerFn(success, serviceModel);
                        });
                    });
                });
            },
        /*function to create the service operation info in the variable object, to create the parameter info
        * for the selected operation of the service*/
            getServiceOperationInfo = function (selectedOperation, selectedService, success, error, forceReload, controller) {
                var operationInfo = {};

                /*invoking a service to get the operations that a particular service has and it's
                 * parameters to create a unique url pattern*/
                ServiceFactory.getServiceDef(selectedService, function (response) {
                    /*iterate over the paths received from the service response*/
                    var pathsArr = Object.keys(response.paths),
                        securityDefinitions = response.securityDefinitions,
                        AUTH_TYPE_KEY = 'WM_Rest_Service_Authorization',
                        paramDataType;
                    for (var i= 0, nPaths = pathsArr.length; i <nPaths; i++) {
                        var pathKey = pathsArr[i],
                            path = response.paths[pathKey];
                        for (var j = 0, nOps = supportedOperations.length; j < nOps; j++) {
                            var opType = supportedOperations[j],
                                operation = path[opType];
                            if (operation && operation[WS_CONSTANTS.OPERATION_NAME_KEY] === selectedOperation) {
                                /* if controller is provided, check for controller match as well */
                                if (controller && controller + "Controller" !== path[CONTROLLER_KEY]) {
                                    continue;
                                }
                                operationInfo.httpMethod = opType;
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
            },

        /* properties of a service variable - should contain methods applicable on this particular object */
            methods = {
                getDataSet: function (variable) {
                    /* return the variable dataSet*/
                    return variable.dataSet;
                },
                getData: function (variable, options, success, error) {
                    /* get the variable object from variable collection */
                    var variableName = variable.name,
                        startNode = options.startNode;

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
                    } else if (variable.prefabName) {
                        var serviceModel = {};
                        if (prefabDataTypes[variable.prefabName]) {
                            /* prepare sample data-structure for the service */
                            prepareServiceModel(variable.type, serviceModel, null, variable);
                            variable.dataSet = serviceModel;
                            Utils.triggerFn(success, serviceModel);
                        } else {
                            WebService.listPrefabTypes({
                                projectID: $rootScope.project.id,
                                prefabName: variable.prefabName
                            }, function (response) {
                                prefabDataTypes[variable.prefabName] = response.types;
                                /* prepare sample data-structure for the service */
                                prepareServiceModel(variable.type, serviceModel, null, variable);
                                variable.dataSet = serviceModel;
                                Utils.triggerFn(success, serviceModel);
                            });
                        }
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
                setInput: function (variable, key, val) {
                    var targetObj = variable.dataBinding,
                        keys,
                        lastKey,
                        paramObj = {};
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
                        targetObj[paramKey] = paramVal
                    });
                    return variable.dataBinding;
                }
            },
            serviceVariableObj = {
                update: function (options, success, error) {
                    var name = this.name;
                    options = options || {};
                    options.scope = this.activeScope || options.scope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', name, true);
                    }

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
                },
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
                setInput: function (key, val) {
                    return methods.setInput(this, key, val);
                }
            };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.ServiceVariable', serviceVariableObj, ['wm.Variable'], methods);

        return {
            getServiceModel: function (params) {
                var model = {};
                prepareServiceModel(params.typeRef, model, null, params.variable);

                return model;
            },
            getServiceOperationInfo: getServiceOperationInfo
        };
    }];