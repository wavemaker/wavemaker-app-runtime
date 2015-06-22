/*global wm, WM*/
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
    'DatabaseService',

    function (Variables, BaseVariablePropertyFactory, WebService, ServiceFactory, $rootScope, CONSTANTS, Utils, ProjectService, VARIABLE_CONSTANTS, DatabaseService) {
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
            supportedOperations = ['get','put','post','delete'],
            BASE_PATH_KEY = 'x-WM-BASE_PATH',
            RELATIVE_PATH_KEY = 'x-WM-RELATIVE_PATH',
            parameterTypeKey = 'in',
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
                } else if ((type && modelTypes[type]) || (type === "string" && modelTypes['java.lang.String'])) {
                    /* case when the data returned from the service is not an object */
                    if ((type !== "string" && modelTypes[type] && modelTypes[type].primitiveType)  || ( type === "string" && modelTypes['java.lang.String'] && modelTypes['java.lang.String'].primitiveType)) {
                        parentNode['value'] = '';
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
                        if ((!field.isList || variable.serviceType === SERVICE_TYPE_SOAP || variable.serviceType === SERVICE_TYPE_FEED || variable.serviceType === SERVICE_TYPE_REST)) {
                            if (modelTypes[field.type] && modelTypes[field.type].fields) {
                                parentNode[fieldName] = field.isList ? [{}] : {};
                                prepareServiceModel(field.type, field.isList ? parentNode[fieldName][0] : parentNode[fieldName], '', variable, typeChain);
                            } else {
                                parentNode[fieldName] = field.isList ? [] : '';
                            }
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

            /* function to process error response from a service */
            processErrorResponse = function (errMsg, variable, callBackScope, error) {
                initiateCallback("onError", variable, callBackScope, errMsg);

                /* trigger error callback */
                Utils.triggerFn(error, errMsg);

                if (CONSTANTS.isRunMode) {
                    /* process next requests in the queue */
                    variableActive[variable.activeScope.$id][variable.name] = false;
                    processRequestQueue(variable, requestQueue[variable.activeScope.$id], getDataInRun);
                }
            },

            /* function to process success response from a service */
            processSuccessResponse = function (response, variable, callBackScope, options, success, error) {
                var variableEvents = VARIABLE_CONSTANTS.EVENTS;

                /* if RestService check statusCode for error, else check 'error' field in response */
                if (response && response.error) {
                    processErrorResponse(response, variable, callBackScope, error);
                } else {
                    /* if dataTransformation enabled, transform the data */
                    if (variable.transformationColumns) {
                        response = transformData(response, variable);
                    }
                    /* trigger success events associated with the variable */
                    WM.forEach(variableEvents, function (event) {
                        if (event !== "onError") {
                            /*handling onBeforeUpdate event of service-variable to manipulate the data before the data is updated in
                             * the variable dataset*/
                            if (event === "onBeforeUpdate") {
                                /*obtaining the returned data and setting it to the variable dataset*/
                                var newDataSet = initiateCallback(event, variable, callBackScope, response);
                                if (newDataSet) {
                                    /*setting newDataSet as the response to servicevariable onBeforeUpdate*/
                                    response = newDataSet;
                                }
                            } else {
                                initiateCallback(event, variable, callBackScope, response);
                            }
                        }
                    });

                    /* update the dataset against the variable, if response is non-object, insert the response in 'value' field of dataSet */
                    if (!options.forceRunMode) {
                        variable.dataSet = (!WM.isObject(response)) ? {'value': response} : response;
                    }

                    /* trigger success callback */
                    Utils.triggerFn(success, response);

                    if (CONSTANTS.isRunMode) {
                        /* process next requests in the queue */
                        variableActive[variable.activeScope.$id][variable.name] = false;
                        processRequestQueue(variable, requestQueue[variable.activeScope.$id], getDataInRun);
                    }
                }
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
                    uname,
                    pswd;

                /* loop through all the parameters */
                WM.forEach(operationInfo.parameters, function (param) {
                    var paramValue = param.sampleValue;
                    switch (param.parameterType.toUpperCase()) {
                    case 'QUERY':
                        if (!queryParams) {
                            if (paramValue) {
                                queryParams = "?" + param.name + "=" + encodeURIComponent(paramValue);
                            }
                        } else {
                            if (paramValue) {
                                queryParams += "&" + param.name + "=" + encodeURIComponent(paramValue);
                            }
                        }
                        break;
                    case 'AUTH':
                        if(param.name === 'wm_auth_username') {
                            uname = paramValue;
                        } else if(param.name === 'wm_auth_password'){
                            pswd = paramValue;
                        }
                        if(authString) {
                            headers.Authorization = encodeURIComponent(uname + ':' + pswd);
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
                    case 'FORM':
                        /* to be handled*/
                        break;
                    }
                });

                url = $rootScope.project.deployedUrl;

                if (variable.prefabName && VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable.wmServiceOperationInfo) {
                    /* if it is a prefab variable (used in a normal project), modify the url */
                    url += "/prefabs/" + variable.prefabName;
                    target = "invokePrefabRestService";
                }


                url += (variable.prefabName ? '' : '/services') + endPointRelativePath + queryParams;

                /*creating the params needed to invoke the service. url is generated from the relative path for the operation*/
                invokeParams = {
                    "projectID": $rootScope.project.id,
                    "url": url,
                    "target": target,
                    "method": operationInfo.httpMethod || operationInfo.methodType,
                    "headers": headers,
                    "dataParams": requestBody
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
                    methodInfo;

                if (serviceType !== SERVICE_TYPE_DATA) {
                    /* loop over the parameters required for the variable and push them request dataParams */
                    WM.forEach(variable.dataBinding, function (param) {
                        dataParams.push(param);
                    });
                }

                /* if service type is DataBase service, push additional property object to data params */
                if (serviceType === SERVICE_TYPE_DATA) {
                    /* loop over the parameters required for the variable and push them request dataParams */
                    WM.forEach(variable.dataBinding, function (paramValue, paramName) {
                        requestParams += paramName + "=" + encodeURIComponent(paramValue) + "&";
                    });
                    requestParams = requestParams.slice(0, -1);

                    if (variable.operationType === "procedure") {
                        params = {
                            "projectID": $rootScope.project.id,
                            "service": variable.prefabName ? "" : "services",
                            "dataModelName": service,
                            "procedureName": operation,
                            "page": options.page || 1,
                            "procedureParams": requestParams,
                            "size": parseInt(variable.maxResults, 10) || 20, /* consider additional params only if maxResults field is set with valid value */
                            "url": $rootScope.project.deployedUrl
                        };
                    } else {
                        params = {
                            "projectID": $rootScope.project.id,
                            "service": variable.prefabName ? "" : "services",
                            "dataModelName": service,
                            "queryName": operation,
                            "page": options.page || 1,
                            "queryParams": requestParams,
                            "size": parseInt(variable.maxResults, 10) || 20, /* consider additional params only if maxResults field is set with valid value */
                            "url": $rootScope.project.deployedUrl
                        };
                    }
                } else if (VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable.wmServiceOperationInfo) {
                    methodInfo = WM.copy(variable.wmServiceOperationInfo);
                    if (methodInfo.parameters) {
                        methodInfo.parameters.forEach(function (param) {
                            param.sampleValue = variable.dataBinding[param.name];
                        });
                    }
                    params = constructRestRequestParams(methodInfo, serviceType, variable);
                } else if (serviceType === SERVICE_TYPE_REST) {
                    dataParams = [service, operation, WM.copy(variable.dataBinding)];

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

                /* make the variable active */
                if (CONSTANTS.isRunMode) {
                    variableActive[variable.activeScope.$id][variable.name] = true;
                }

                if (serviceType === SERVICE_TYPE_DATA) {
                    if (variable.operationType === "procedure") {
                        requestMethod = "executeNamedProcedure";
                    } else {
                        requestMethod = "executeNamedQuery";

                    }
                    variable.promise = DatabaseService[requestMethod](params, function (response) {
                        processSuccessResponse(response, variable, callBackScope, options, success, error);
                    }, function (errorMsg) {
                        processErrorResponse(errorMsg, variable, callBackScope, error);
                    });
                } else if (REST_SUPPORTED_SERVICES.indexOf(serviceType) !== -1 && variable.wmServiceOperationInfo) {
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

                            /* prepare sample data-structure for the service */
                            prepareServiceModel(typeRef, serviceModel, fieldValue, variable);

                            /* check for transformation columns in variable */
                            if (variable.transformationColumns) {
                                serviceModel['wmTransformedData'] = {};
                                WM.forEach(variable.transformationColumns, function (columnName) {
                                    serviceModel['wmTransformedData'][columnName] = '';
                                });
                            }

                            /* update the dataset */
                            variable.dataSet = serviceModel;
                            /*pass the data prepared to the success callback function*/
                            Utils.triggerFn(success, serviceModel);
                        });
                    });
                });
            },
            /*
             * returns true if the selectedOperation matched the provided operation object
             * sets the other operation info into the provided model for later reference
             */
            setMatchedOperationParams = function (model, selectedOperation, operation) {
                if (operation.operationId === selectedOperation) {
                    model.methodType = operation.operationType;
                    model.name = operation.operationId;
                    model.parameters = [];

                    /*if the operation has parameters, iterate over them to create a map of parameter and
                     * it's type*/
                    if (operation.parameters && operation.parameters.length) {
                        operation.parameters.forEach(function (parameter) {
                            model.parameters.push({
                                "name": parameter.name || (parameter[parameterTypeKey] && parameter[parameterTypeKey].toLowerCase()),
                                "parameterType": parameter[parameterTypeKey]
                            });
                        });
                    }
                    return true;
                }
            },
        /*function to create the service operation info in the variable object, to create the parameter info
        * for the selected operation of the service*/
            getServiceOperationInfo = function (selectedOperation, selectedService, success, error, forceReload) {
                var operationInfo = {},
                    i,
                    operations = [],
                    matchOperations = setMatchedOperationParams.bind(undefined, operationInfo, selectedOperation);

                /*invoking a service to get the operations that a particular service has and it's
                 * parameters to create a unique url pattern*/
                ServiceFactory.getServiceDef(selectedService, function (response) {
                    /*iterate over the paths received from the service response*/
                        var pathsArr = Object.keys(response.paths),
                            securityDefinitions = response.definitions,
                            AUTH_TYPE_KEY = 'WM_Rest_Service_Authorization';
                    for (var i= 0, nPaths = pathsArr.length; i <nPaths; i++) {
                        var pathKey = pathsArr[i],
                            path = response.paths[pathKey];
                        for (var j = 0, nOps = supportedOperations.length; j < nOps; j++) {
                            var opType = supportedOperations[j],
                                operation = path[opType];
                            if (operation && operation.operationId === selectedOperation) {
                                operationInfo.methodType = opType;
                                operationInfo.name = selectedOperation;
                                operationInfo.relativePath = (path[BASE_PATH_KEY] || "") + path[RELATIVE_PATH_KEY];
                                operationInfo.parameters = [];

                                if (operation.parameters && operation.parameters.length) {
                                    operation.parameters.forEach(function (parameter) {
                                        operationInfo.parameters.push({
                                            "name": parameter.name || (parameter[parameterTypeKey] && parameter[parameterTypeKey].toLowerCase()),
                                            "parameterType": parameter[parameterTypeKey]
                                        });
                                    });
                                }
                                if (securityDefinitions && securityDefinitions[AUTH_TYPE_KEY].type === "basic" && operation.security[0][AUTH_TYPE_KEY]) {
                                    operationInfo.parameters.push({
                                        "name": "wm_auth_username",
                                        "parameterType": "AUTH"
                                    });
                                    operationInfo.parameters.push({
                                        "name": "wm_auth_password",
                                        "parameterType": "AUTH"
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

            isPostRequest = function (variable) {
                var opInfo = variable.wmServiceOperationInfo;
                return (opInfo && opInfo.methodType === "POST" && opInfo.parameters.length === 1 && opInfo.parameters[0].parameterType === "BODY");
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
                    var paramObj = {},
                        targetObj = variable.dataBinding;
                    if (WM.isObject(key)) {
                        paramObj = key;
                    } else {
                        paramObj[key] = val;
                    }

                    if (isPostRequest(variable)) {
                        if (!variable.dataBinding.body) {
                            variable.dataBinding.body = {};
                        }
                        targetObj = variable.dataBinding.body;
                    }

                    WM.forEach(paramObj, function (paramVal, paramKey) {
                        targetObj[paramKey] = paramVal;
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