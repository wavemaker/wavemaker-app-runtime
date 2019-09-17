/*global WM,_, wm*/
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.webservice.$ServiceFactory
 * @description
 * The `ServiceFactory` keeps and exposes the services and their details in an object.
 */
wm.plugins.webServices.factories.ServiceFactory = [
    "WebService",
    "wmToaster",
    "$rootScope",
    "Utils",
    "VARIABLE_CONSTANTS",
    "WS_CONSTANTS",
    "SWAGGER_CONSTANTS",

    function (WebService, wmToaster, $rootScope, Utils, VARIABLE_CONSTANTS, WS_CONSTANTS, SWAGGER_CONSTANTS) {
        "use strict";

        /*Array to hold service objects*/
        var services = [],
            projectId = $rootScope.project && $rootScope.project.id,
            requestQueue = {
                'services': [],
                'operations': {},
                'serviceDef': {},
                'prefabTypes': {}
            },
            serviceDefMap = {},
            supportedOperations = WS_CONSTANTS.HTTP_METHODS.map(function(method){return method.toLowerCase();}),
            primitiveDataTypes = WS_CONSTANTS.PRIMITIVE_DATA_TYPES,
            IS_LIST_KEY = 'x-WM-IS_LIST',
            UNIQUE_ITEMS_KEY = 'uniqueItems',
            FULLY_QUALIFIED_NAME_KEY = 'x-WM-FULLY_QUALIFIED_NAME',
            FULLY_QUALIFIED_TYPE_KEY = 'x-WM-FULLY_QUALIFIED_TYPE',
            WM_SCHEMA = 'x-WM-SCHEMA',
            parameterTypeKey = 'in',
            AUTH_BASIC_TYPE = VARIABLE_CONSTANTS.REST_SERVICE.SECURITY_DEFN_BASIC,
            prefabDataTypes = {},

        /*function to get service object matching its name*/
            getServiceObjectByName = function (name) {
                var serviceObject = {operations: []};
                WM.forEach(services, function (serviceObj) {
                    if (serviceObj.name === name) {
                        serviceObject = serviceObj;
                    }
                });
                return serviceObject;
            },

        /*function to get service object matching its name*/
            removeService = function (name) {
                _.remove(services, {'name': name});
                serviceDefMap[name] = undefined;
            },

        /*function to get service operation object matching its name*/
            getServiceOperationObjectById = function (serviceName, operationId) {
                var serviceObj = getServiceObjectByName(serviceName);
                return (operationId ? (_.find(serviceObj.operations, {'operationId' : operationId})) : serviceObj.operations[0]) || {};
            },

            /**
             * resets the cached operation info for a service
             * @param serviceName
             */
            resetServiceOperations = function (serviceName) {
                getServiceObjectByName(serviceName).operations.length = 0;
            },

        /*function to get list of services from the backend*/
            getServicesWithType = function (successCallBack, reloadFlag) {
                /*sanity checking of the params*/
                reloadFlag = !((!reloadFlag || reloadFlag === 'false'));

                /*if services already fetched once and reloadFlag not set, return the fetched services*/
                if (services.length > 0 && !reloadFlag) {
                    Utils.triggerFn(successCallBack, services);
                    return;
                }

                requestQueue['services'] = requestQueue['services'] || [];
                requestQueue['services'].push(successCallBack);
                /* if same queue is already in progress, do not send another request */
                if (requestQueue['services'].length > 1) {
                    return;
                }

                /*data for the request*/
                var urlParams = {
                    projectID: projectId || $rootScope.project.id
                };

                /* Fetch the available web/data services for the current project*/
                WebService.listServicesWithType(urlParams, function (response) {
                    response = Utils.sort(response, 'name');
                    /*clean the array before inserting the fetched services*/
                    services = [];

                    /*loop over the response to fill the services variable*/
                    WM.forEach(response, function (serviceObj) {
                        services.push({
                            type: serviceObj.type,
                            name: serviceObj.name,
                            url: serviceObj.url,
                            operations: []
                        });
                    });

                    /*send the services to the callback*/
                    WM.forEach(requestQueue['services'], function (fn) {
                        Utils.triggerFn(fn, services);
                    });
                    requestQueue['services'] = null;
                }, function () {
                    wmToaster.show("error", $rootScope.locale["MESSAGE_ERROR_TITLE"], $rootScope.locale["MESSAGE_ERROR_FETCH_WEB_DATA_SERVICES_DESC"]);
                });
            },

            /*function to get the full serviceDef (api doc)*/
            getServiceDef = function (serviceId, success, error, forceReload) {
                var callback,
                    urlParams = {
                        "urlParams": {
                            serviceId: serviceId,
                            projectId: $rootScope.project.id
                        }
                    };
                if (serviceDefMap[serviceId] && !forceReload) {
                    /*if operations are already present, return the cached response*/
                    Utils.triggerFn(success, serviceDefMap[serviceId]);
                    return;
                }

                requestQueue['serviceDef'][serviceId] = requestQueue['serviceDef'][serviceId] || [];
                requestQueue['serviceDef'][serviceId].push({
                    success: success,
                    error: error
                });
                /* if same queue is already in progress, do not send another request */
                if (requestQueue['serviceDef'][serviceId].length > 1) {
                    return;
                }

                /*
                 * TODO [VIBHU]: doing this to clear previous operation info if cached.
                 * the getServiceOperations method needs to be merged with this method for consistency
                 */
                if (forceReload) {
                    resetServiceOperations(serviceId);
                }

                /*invoking a service to get the operations that a particular service has and it's
                 * parameters to create a unique url pattern*/
                WebService.retrieveServiceOperations(urlParams, function (response) {
                    response.paths = Utils.sort(response.paths, 'x-WM-COMPLETE_PATH');
                    serviceDefMap[serviceId] = response;
                    /*while loop is used so that any requests that come when the response is being served; are also handled.*/
                    while (true) {
                        callback = requestQueue['serviceDef'][serviceId].shift();
                        Utils.triggerFn(callback && callback.success, response);
                        if (!requestQueue['serviceDef'][serviceId].length) {
                            break;
                        }
                    }
                }, function (errMsg) {
                    while (true) {
                        callback = requestQueue['serviceDef'][serviceId].shift();
                        Utils.triggerFn(callback && callback.error, errMsg);
                        if (!requestQueue['serviceDef'][serviceId].length) {
                            break;
                        }
                    }
                });
            },

            /*Getting the fully qualified name*/
            getFullyQualifiedName = function (refValue, definitions) {
                var returnType;
                refValue = refValue.split('/').pop();
                returnType = definitions[refValue];
                returnType = returnType ? returnType[FULLY_QUALIFIED_NAME_KEY] : 'Object';
                return returnType;
            },

            getReturnType = function (responseObject, definitions) {
                var type;
                if (responseObject.type) {
                    /*In case of primitive type*/
                    if (responseObject.type !== 'array') {
                        return responseObject.type;
                    }
                    /*In case of list type*/
                    if (responseObject.items.type) {
                        type = responseObject.items.type;
                    } else {
                        if (responseObject.items.$ref) {
                            type = getFullyQualifiedName(responseObject.items.$ref, definitions);
                        }
                    }
                    return type;
                } else {
                    /*In case of object type*/
                    return getFullyQualifiedName(responseObject.$ref, definitions);
                }
            },

            isRESTSupported = function (type) {
                return (VARIABLE_CONSTANTS.REST_SUPPORTED_SERVICES.indexOf(type) !== -1);// || VARIABLE_CONSTANTS.SERVICE_TYPE_DATA === type);
            },

            //Check if variable/operation is a query type and of put/post type
            isBodyTypeQueryProcedure = function (variable) {
                return (_.includes(['QueryExecution', 'ProcedureExecution'], variable.controller)) && (_.includes(['put', 'post'], variable.operationType));
            },

            //Return params from swagger for post/put query types
            getRawParams = function (operationObj, definitions) {
                var refValue,
                    refKey,
                    defObj,
                    operationList = [];
                //Handle multipart/form-data request of query/procedure
                if (_.includes(operationObj.consumes,WS_CONSTANTS.CONTENT_TYPES.MULTIPART_FORMDATA)) {
                    _.forEach(operationObj.parameters, function (param) {
                        if (param.name === SWAGGER_CONSTANTS.WM_DATA_JSON) {
                            refValue = _.get(param, ['x-WM-SCHEMA', '$ref']);
                        } else {
                            operationList.push(param);
                        }
                    });
                } else if (operationObj.parameters.length > 1) {
                  return operationObj.parameters;
                } else {
                  refValue = _.get(operationObj, ['parameters', 0, 'schema', '$ref']);
                }
                refKey   = _.last(_.split(refValue, '/'));
                defObj   = definitions[refKey];
                _.forEach(defObj && defObj.properties, function (value, key) {
                    //Ignore readOnly params
                    if (value.readOnly) {
                        return;
                    }
                    value.name              = key;
                    value[parameterTypeKey] = VARIABLE_CONSTANTS.BODY_FIELD;
                    value.required          = _.includes(defObj.required, key);
                    operationList.push(value);
                });
                return operationList;
            },

            processOperations = function (serviceObj, operations, swagger) {
                var paramsKey,
                    isRestSupportedService = isRESTSupported(serviceObj.type),
                    definitions,
                    securityDefinitions,
                    schemaObject,
                    typeArgumentsObject;

                /*Empty the "operations" so that they are set based on the response.*/
                serviceObj.operations = [];

                if (isRestSupportedService) {
                    definitions = swagger.definitions;
                    securityDefinitions = swagger.securityDefinitions;
                }

                function getFormatFromMap (format)  {
                    var MAP = {
                        "int32": "integer",
                        "int64": "long"
                    };

                    return MAP[format] || format;
                }

                /*loop through the operations to append them to the respective service object*/
                WM.forEach(operations, function (operation) {
                    /*variable to determine if the fetched operation already exists*/
                    var operationObject = {},
                        isList,
                        typeRef,
                        format,
                        returnObj,
                        returnType,
                        returnFormat,
                        rawParameters,
                        isDbServiceOp = function (type) {
                            return type === "hqlquery" || type === "nativequery" || type === "procedure";
                        };

                    if (isDbServiceOp(operation.operationType)) {
                        returnType = operation.return;
                    } else {
                        // fetch return type and operation object from swagger
                        if (_.get(operation, "responses['200'].schema")) {
                            schemaObject = operation.responses['200'].schema;
                            typeArgumentsObject = schemaObject["x-WM-TYPE_ARGUMENTS"];
                            isList = schemaObject.$ref === "#/definitions/Page";
                            /*If the typeArguments is specified obtain the return type from it*/
                            if (typeArgumentsObject && typeArgumentsObject[0]) {
                                schemaObject = typeArgumentsObject[0];
                            }
                            returnType = getReturnType(schemaObject, definitions);
                            returnFormat = schemaObject.format;
                            if (!isList) {
                                isList = schemaObject.type && schemaObject.type === 'array';
                            }
                        } else if (!_.isEmpty(operation['x-WM-OUT-PARAMS-TYPE'])) {
                            returnType = getFullyQualifiedName(operation['x-WM-OUT-PARAMS-TYPE'][0], definitions);
                        } else {
                            returnType = "void";
                        }
                        returnFormat = getFormatFromMap(returnFormat);
                    }

                    /* special case for pageable return type */
                    if (isRestSupportedService) {
                        returnObj = {typeRef: returnType};
                        paramsKey = "parameters";

                    } else {
                        returnObj = returnType;
                        paramsKey = "parameter";
                        IS_LIST_KEY = 'isList';
                        parameterTypeKey = 'parameterType';
                    }

                    /*push the operation only if does not exist previously*/
                    operationObject = {
                        name         : operation[WS_CONSTANTS.OPERATION_NAME_KEY] || operation.operationId || operation.name,
                        operationType: operation.operationType || null,
                        parameter    : undefined,
                        isList       : isList,
                        return       : returnObj,
                        returnFormat : returnFormat,
                        controller   : operation.tags && operation.tags[0].replace(/Controller$/, ''),
                        operationId  : operation.operationId,
                        consumes     : operation.consumes,
                        deprecated   : operation.deprecated
                    };
                    serviceObj.operations.push(operationObject);

                    /* process the operation params as well */
                    if (!WM.element.isEmptyObject(operation[paramsKey])) {
                        operationObject.parameter = [];
                        //For post/put query methods get params from definitions
                        if (isBodyTypeQueryProcedure(operationObject)) {
                            rawParameters = getRawParams(operation, definitions);
                        } else {
                            rawParameters = operation[paramsKey];
                        }
                        WM.forEach(rawParameters, function (param) {
                            isList = param[IS_LIST_KEY];

                            /* special cases for MultiPart type params */
                            if (_.toLower(param[parameterTypeKey]) === "formdata") {
                                if (param.type === "string" && param[WM_SCHEMA]) {
                                    typeRef = getReturnType(param[WM_SCHEMA], definitions);
                                } else if (param.type === "ref") {
                                    typeRef = param['x-WM-FULLY_QUALIFIED_TYPE'];
                                } else if (param.type === 'array') {
                                    isList = true;
                                    typeRef = param.items && param.items.type;
                                } else {
                                    typeRef = param.type;
                                }
                            } else {
                                if (param.type) {
                                    if (param.type === "array") {
                                        isList = true;
                                        typeRef = param.items && param.items.type;
                                        format  = param.items && param.items.format;
                                    } else {
                                        typeRef = param.type;
                                        format = param.format;
                                    }
                                } else {
                                    if (param.schema) {
                                        isList = param.schema.type === 'array';
                                        typeRef = getReturnType(param.schema, definitions);
                                        format = param.schema.format;
                                    } else if (param.items) {
                                        typeRef = getReturnType(param.items, definitions);
                                    }
                                }
                            }
                            format =    getFormatFromMap(format);

                            /* push the param info into operation object */
                            operationObject.parameter.push({
                                name: param.name,
                                typeRef: typeRef,
                                format: format,
                                isList: isList,
                                parameterType: param[parameterTypeKey]
                            });
                        });
                    } else {
                        operationObject.parameter = [];
                    }

                    /* push an extra RequestBody param for WebSocketService */
                    if (!_.isEmpty(operation['x-WM-IN-PARAMS-TYPE'])) {
                        operationObject.parameter = operationObject.parameter || [];
                        operationObject.parameter.push({
                            name: 'RequestBody',
                            typeRef: getFullyQualifiedName(operation['x-WM-IN-PARAMS-TYPE'][0], definitions),
                            parameterType: 'BODY'
                        });
                    }

                    if (securityDefinitions && securityDefinitions[AUTH_BASIC_TYPE] && securityDefinitions[AUTH_BASIC_TYPE].type === VARIABLE_CONSTANTS.REST_SERVICE.SECURITY_DEFN_BASIC && operation.security[0][AUTH_BASIC_TYPE]) {
                        if (!operationObject.parameter) {
                            operationObject.parameter = [];
                        }
                        operationObject.parameter.push({
                            "name": "wm_auth_username",
                            "parameterType": "auth"
                        });
                        operationObject.parameter.push({
                            "name": "wm_auth_password",
                            "parameterType": "auth"
                        });
                    }
                });
            },

        /*function to get list of operations for a service from the backend*/
            getServiceOperations = function (serviceId, successCallBack, errorCallBack, reloadFlag) {
                /*sanity checking of the params*/
                if (!serviceId || serviceId === '') {
                    return;
                }
                reloadFlag = !(!reloadFlag || reloadFlag === 'false');

                /*get the required service object*/
                var serviceObj = getServiceObjectByName(serviceId),
                    urlParams,
                    operations,
                    onOperationsFetch = function (operations, swagger) {
                        processOperations(serviceObj, operations, swagger);
                        var callback;

                        /*while loop is used so that any requests that come when the response is being served; are also handled.*/
                        while (true) {
                            callback = requestQueue['operations'][serviceId].shift();
                            Utils.triggerFn(callback && callback.success, serviceObj.operations);
                            if (!requestQueue['operations'][serviceId].length) {
                                break;
                            }
                        }
                    },
                    onOperationFetchError = function () {
                        while (true) {
                            requestQueue['operations'][serviceId].shift();
                            if (!requestQueue['operations'][serviceId].length) {
                                break;
                            }
                        }
                        Utils.triggerFn(errorCallBack);
                    };

                /*if service's operations already fetched once and reloadFlag not set, return the fetched operations*/
                if (serviceObj.operations.length > 0 && !reloadFlag) {
                    Utils.triggerFn(successCallBack, serviceObj.operations);
                    return;
                }

                requestQueue['operations'][serviceId] = requestQueue['operations'][serviceId] || [];
                requestQueue['operations'][serviceId].push({
                    success: successCallBack
                });
                /* if same queue is already in progress, do not send another request */
                if (requestQueue['operations'][serviceId].length > 1) {
                    return;
                }


                if (isRESTSupported(serviceObj.type)) {
                    operations = [];

                    /* invoking a service to get the operations that a particular service has and it's
                     * parameters to create a unique url pattern
                     */
                    getServiceDef(serviceId, function (response) {
                        /*iterate over the paths received from the service response*/
                        WM.forEach(response.paths, function (path) {
                            /*iterate over the operations available in each path*/
                            WM.forEach(supportedOperations, function (operation) {
                                if (path[operation]) {
                                    path[operation].operationType = operation;
                                    path[operation].relativePath = path['x-WM-RELATIVE_PATH'];

                                    /* set operationType for Query/Procedure operations */
                                    if (path[operation].tags && path[operation].tags[0] === WS_CONSTANTS.CONTROLLER_NAMES.PROCEDURE_CONTROLLER) {
                                        path[operation].serviceSubType = "procedure";
                                    } else if (path[operation].tags && path[operation].tags[0] === WS_CONSTANTS.CONTROLLER_NAMES.QUERY_CONTROLLER) {
                                        path[operation].serviceSubType = "query";
                                        /* here we have to set operationType to either hqlquery or nativequery (have to check how)*/
                                    }
                                    operations.push(path[operation]);
                                }
                            });
                        });
                        /*pass the data prepared to the success callback function*/
                        onOperationsFetch(operations, response);
                    }, function () {
                        /*handle error response*/
                        wmToaster.show("error", $rootScope.locale["MESSAGE_ERROR_TITLE"], $rootScope.locale["MESSAGE_ERROR_FETCH_SERVICE_METHODS_DESC"]);
                        onOperationFetchError();
                    }, reloadFlag);
                } else {
                    /*data for the request*/
                    urlParams = {
                        projectID: projectId || $rootScope.project.id,
                        serviceID: serviceId
                    };
                    /*Get the operations for the service*/
                    WebService.getServiceOperations(urlParams, function (response) {
                        onOperationsFetch(response);
                    }, function () {
                        wmToaster.show("error", $rootScope.locale["MESSAGE_ERROR_TITLE"], $rootScope.locale["MESSAGE_ERROR_FETCH_SERVICE_METHODS_DESC"]);
                        onOperationFetchError();
                    });
                }
            },
        /*function to get list of params and return type for an operation of a service from the backend*/
            getServiceOperationParams = function (serviceId, operationId, successCallBack, errorCallBack, reloadFlag) {
                /*sanity checking of the params*/
                if (_.isEmpty(serviceId)) {
                    return;
                }
                reloadFlag = !(!reloadFlag || reloadFlag === 'false');

                /*get the required operation object*/
                var serviceObj = getServiceObjectByName(serviceId),
                    operationObj = getServiceOperationObjectById(serviceId, operationId),
                    urlParams,
                    onOperationParamsFetch = function () {
                        Utils.triggerFn(successCallBack, operationObj);
                    },
                    onOperationParamsFetchError = function () {
                        Utils.triggerFn(errorCallBack);
                    };

                /*if service's operation's params already fetched once and reloadFlag not set, return the fetched params*/
                if (operationObj.parameter && !reloadFlag) {
                    Utils.triggerFn(successCallBack, operationObj);
                    return;
                }

                if (isRESTSupported(serviceObj.type)) {
                    getServiceOperations(serviceId, function () {
                        operationObj = getServiceOperationObjectById(serviceId, operationId);
                        Utils.triggerFn(successCallBack, operationObj);
                    }, undefined, true);
                } else {
                    urlParams = {
                        projectID: projectId || $rootScope.project.id,
                        serviceID: serviceId,
                        operationID: operationId
                    };
                    /*call web service to fetch the data*/
                    WebService.getServiceOperationParams(urlParams, function (response) {
                        onOperationParamsFetch();
                    }, function () {
                        wmToaster.show("error", $rootScope.locale["MESSAGE_ERROR_TITLE"], $rootScope.locale["MESSAGE_ERROR_FETCH_SERVICE_METHOD_PARAMS_DESC"]);
                        onOperationParamsFetchError();
                    });
                }
            },
            addService = function (service) {
                /*variable to decide if service already exists*/
                var serviceExists = false;

                WM.forEach(services, function (existingService) {
                    /*if service exists set the flag to prevent duplicate entry*/
                    if (service.name === existingService.name && service.type === existingService.type) {
                        serviceExists = true;
                    }
                });

                /*if service does not exist, do not append*/
                if (!serviceExists) {
                    services.push({name: service.name, type: service.type, operations: [], url: service.url || "/services/" + service.name, sampleResponse: service.sampleResponse});
                }

                /* return true/false for the status */
                return !serviceExists;
            },

            /* gets the sample response for a webservice */
            getSampleResponse = function (serviceId) {
                var service = getServiceObjectByName(serviceId);

                return service.sampleResponse;
            },

            /* stores the sample response fpr a webservice */
            setSampleResponse = function (serviceId, response) {
                var service = getServiceObjectByName(serviceId);

                service.sampleResponse = response;
            },

            getType = function (param) {
                return param.type === 'array' ? param.items.type : param.type;
            },

            getPrefabTypes = function (prefabName, success) {
                if (prefabDataTypes[prefabName]) {
                    Utils.triggerFn(success, prefabDataTypes[prefabName]);
                    return;
                }
                requestQueue.prefabTypes[prefabName] = requestQueue.prefabTypes[prefabName] || [];

                requestQueue.prefabTypes[prefabName].push(success);
                if (requestQueue.prefabTypes[prefabName].length > 1) {
                    return;
                }
                WebService.listPrefabTypes({
                    projectID: $rootScope.project.id,
                    prefabName: prefabName
                }, function (response) {
                    prefabDataTypes[prefabName] = response.types;
                    /*send the services to the callback*/
                    WM.forEach(requestQueue.prefabTypes[prefabName], function (fn) {
                        Utils.triggerFn(fn, prefabDataTypes[prefabName]);
                    });
                    requestQueue.prefabTypes[prefabName] = null;
                });
            };

        return {
            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getServicesWithType
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * gets a list of all services in the project (else throws an error).
             *
             * @param {function} successCallback providing the services list
             * @param {boolean} reloadFlag to determine if a refreshed list is required form backend (default false)
             */
            getServicesWithType: getServicesWithType,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getServiceOperations
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * gets a list of all operations in a service (else throws an error).
             *
             * @param {string} serviceId name of the service for which operations are required
             * @param {function} successCallback providing the operation list as function parameter
             * @param {boolean} reloadFlag to determine if a refreshed list is required form backend (default false)
             */
            getServiceOperations: getServiceOperations,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getServiceOperationParams
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * gets a list of all params of an operation in a service (else throws an error).
             *
             * @param {string} serviceId name of the service containing the operation
             * @param {string} operationId name of the operation of the service for which params are required
             * @param {function} successCallback providing the params list as function parameter
             * @param {boolean} reloadFlag to determine if a refreshed list is required form backend (default false)
             */
            getServiceOperationParams: getServiceOperationParams,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#add
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * adds a service to the existing services list factory.
             *
             * @param {object} service details of the service to be added

             * @returns {boolean} true if service added, else false
             */
            add: addService,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getServiceObjectByName
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * returns an object having details of a service matching the supplied name
             *
             * @param {string} name name of the service the details of which are required.

             * @returns {object} having service details
             */
            getServiceObjectByName: getServiceObjectByName,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getSampleOutput
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * returns the sample output returned while testing the service
             *
             * @param {string} name name of the service

             * @returns {object} having service output
             */
            getSampleResponse: getSampleResponse,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#setSampleOutput
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * stores the sample output returned while testing the service against that service namespace
             *
             * @param {serviceId} service id
             * @param {object} having service output
             */
            setSampleResponse: setSampleResponse,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getServiceDef
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * gets the api-doc service definition for provided serviceId
             *
             * @param {serviceId} service id
             * @param {object} having service output
             */
            getServiceDef: getServiceDef,

            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getPrefabTypes
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * gets the data types for a prefab
             *
             * @param {prefabName} prefab name
             * @param {object} having service output
             */
            getPrefabTypes: getPrefabTypes,
            /**
             * @ngdoc function
             * @name wm.webservice.$ServiceFactory#getType
             * @methodOf wm.webservice.$ServiceFactory
             * @function
             *
             * @description
             * gets the data types of a param
             *
             * @param {object} param object
             */
            getType: getType,
            isBodyTypeQueryProcedure: isBodyTypeQueryProcedure,
            removeService: removeService
        };
    }
];
