/*global WM,FormData, wm*/
/*jslint todo: true */
/**
 * @ngdoc service
 * @name wm.modeldesigner.$ModelService
 * @requires BaseService
 * @description
 * The `$ModelService` provides the details about the database apis
 *
 * # Shortcut Methods
 * Complete list of the methods:
 *
 * - {@link wm.modeldesigner.$ModelService#methods_importDB importDB}
 * - {@link wm.modeldesigner.$ModelService#methods_exportDB exportDB}
 * - {@link wm.modeldesigner.$ModelService#methods_getAllDataModels getAllDataModels}
 * - {@link wm.modeldesigner.$ModelService#methods_getDataModel getDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_createDatabase createDatabase}
 * - {@link wm.modeldesigner.$ModelService#methods_createService createService}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteDataModel deleteDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_saveDataModel saveDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_applyDataModel applyDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_revertDataModel revertDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_getDataModelDiff getDataModelDiff}
 * - {@link wm.modeldesigner.$ModelService#methods_getAllEntities getAllEntities}
 * - {@link wm.modeldesigner.$ModelService#methods_getEntity getEntity}
 * - {@link wm.modeldesigner.$ModelService#methods_createEntity createEntity}
 * - {@link wm.modeldesigner.$ModelService#methods_updateEntity updateEntity}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteEntity deleteEntity}
 * - {@link wm.modeldesigner.$ModelService#methods_addColumns addColumns}
 * - {@link wm.modeldesigner.$ModelService#methods_addPrimaryKey addPrimaryKey}
 * - {@link wm.modeldesigner.$ModelService#methods_addUniqueKey addUniqueKey}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteUniqueKey deleteUniqueKey}
 * - {@link wm.modeldesigner.$ModelService#methods_updateColumn updateColumn}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteColumn deleteColumn}
 * - {@link wm.modeldesigner.$ModelService#methods_addRelation addRelation}
 * - {@link wm.modeldesigner.$ModelService#methods_updateRelation updateRelation}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteRelation deleteRelation}
 * - {@link wm.modeldesigner.$ModelService#methods_getAllQueries getAllQueries}
 * - {@link wm.modeldesigner.$ModelService#methods_getQuery getQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_createQuery createQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_updateQuery updateQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_queryNameUsage queryNameUsage}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteQuery deleteQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_validateQuery validateQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_testRunQuery testRunQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_nativeTestRunQuery nativeTestRunQuery}
 * - {@link wm.modeldesigner.$ModelService#methods_readTableData readTableData}
 * - {@link wm.modeldesigner.$ModelService#methods_insertTableData insertTableData}
 * - {@link wm.modeldesigner.$ModelService#methods_updateTableData updateTableData}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteTableData deleteTableData}
 * - {@link wm.modeldesigner.$ModelService#methods_addAttributes addAttributes}
 * - {@link wm.modeldesigner.$ModelService#methods_deleteAttribute deleteAttribute}
 * - {@link wm.modeldesigner.$ModelService#methods_updateAttribute updateAttribute}
 * - {@link wm.modeldesigner.$ModelService#methods_listDataModels listDataModels}
 * - {@link wm.modeldesigner.$ModelService#methods_getModel getModel}
 * - {@link wm.modeldesigner.$ModelService#methods_listScopeTypes listScopeTypes}
 * - {@link wm.modeldesigner.$ModelService#methods_createDataModel createDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_getAllSchemas getAllSchemas}
 * - {@link wm.modeldesigner.$ModelService#methods_getServiceID getServiceID},
 * * - {@link wm.modeldesigner.$ModelService#methods_getAttributeCustomProperties getAttributeCustomProperties}
 */

wm.plugins.modeldesigner.services.ModelService = [
    "$rootScope",
    "BaseService",
    "BaseServiceManager",
    "CONSTANTS",
    "Utils",
    "WebService",
    "$window",
    "$q",
    "SWAGGER_CONSTANTS",

    function ($rootScope, BaseService, BaseServiceManager, CONSTANTS, Utils, WebService, $window, $q, SWAGGER_CONSTANTS) {
        'use strict';

        var initiateAction = function (action, params, successCallback, failureCallback, noproxy) {
            var param,
                val,
                config,
                connectionParams,
                urlParams,
                requestData,
                headers,
                httpDetails;

            config      = BaseServiceManager.getConfig();
            config      = Utils.getClonedObject(config.Database[action]);
            headers     = config && config.headers;
            requestData = params.data;

            urlParams = {
                projectID        : params.projectID,
                service          : WM.isDefined(params.service) ? params.service : 'services',
                dataModelName    : params.dataModelName,
                entityName       : params.entityName,
                queryName        : params.queryName,
                queryParams      : params.queryParams,
                procedureName    : params.procedureName,
                procedureParams  : params.procedureParams,
                id               : params.id,
                relatedFieldName : params.relatedFieldName,
                page             : params.page,
                size             : params.size,
                sort             : params.sort
            };
            if (params.url && CONSTANTS.isStudioMode && !noproxy) {

                /* Check for url parameters to replace the URL.
                 * So the variable parameters in the URL will be replaced by the actual parameter values.*/
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
                headers = headers || {};
                headers.skipSecurity = 'true';
                headers['Content-Type'] = headers['Content-Type'] || 'application/json';
                /*(!$rootScope.preferences['workspace.loadXDomainAppDataUsingProxy'] is added in endpointAddress to differentiate desktop from saas*/
                if (action === 'testRunQuery') {
                    headers['Content-Type'] = undefined;
                    httpDetails = {
                        'endpointAddress'   : $window.location.protocol + (!$rootScope.preferences['workspace.loadXDomainAppDataUsingProxy'] ? ('//' + $window.location.host) : '') + params.url + config.url,
                        'method'            : config.method,
                        'content-Type'      : 'multipart/form-data',
                        'headers'           : headers
                    };
                    requestData.append(SWAGGER_CONSTANTS.WM_HTTP_JSON, new Blob([JSON.stringify(httpDetails)], {
                        type: 'application/json'
                    }));
                    connectionParams = {
                        'data': requestData,
                        'headers': headers,
                        'urlParams'         : {
                            projectID: $rootScope.project.id
                        }
                    };
                } else {
                    connectionParams = {
                        'data': {
                            'endpointAddress'   : $window.location.protocol + (!$rootScope.preferences['workspace.loadXDomainAppDataUsingProxy'] ? ('//' + $window.location.host) : '') + params.url + config.url,
                            'method'            : config.method,
                            'requestBody'       : JSON.stringify(requestData),
                            'headers'           : headers
                        },
                        'urlParams'         : {
                            projectID: $rootScope.project.id
                        }
                    };
                }
                WebService.testRestService(connectionParams, function (response) {
                    var parsedData = Utils.getValidJSON(response.responseBody),
                        errMsg,
                        localeObject;
                    if (parsedData.hasOwnProperty('result')) {
                        Utils.triggerFn(successCallback, parsedData.result);
                    } else if (parsedData.hasOwnProperty('error')) {
                        Utils.triggerFn(failureCallback, (parsedData.error && parsedData.error.message) || parsedData.error);
                    } else if (parsedData.hasOwnProperty('errorDetails')) {
                        localeObject = $rootScope.locale || $rootScope.appLocale;
                        errMsg = Utils.getClonedObject(localeObject[parsedData.errorDetails.code]);
                        Utils.triggerFn(failureCallback, Utils.replace(errMsg, parsedData.errorDetails.data) || parsedData.errorDetails);
                    } else {
                        Utils.triggerFn(successCallback, parsedData);
                    }
                }, failureCallback);
            } else {
                connectionParams = {
                    target    : 'Database',
                    action    : action,
                    urlParams : urlParams,
                    data      : requestData || '',
                    config    : {
                        'url' : params.url
                    }
                };
                /* append the skipSecurity header to skip security-check in STUDIO MODE*/
                if (CONSTANTS.isStudioMode) {
                    headers = headers || {};
                    headers.skipSecurity = 'true';
                }
                if (headers) {
                    connectionParams.headers = headers;
                }
                return BaseService.execute(connectionParams, successCallback, failureCallback);
            }
        };
        /* APIs returned by the DatabaseService.*/
        return {

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAllDataModels
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get all the databases in the project.
             *
             * @param {string} projectID
             *                 ID of the Project.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            getAllDataModels: function (projectID, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getAllDataModels",
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#saveDataModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to save the specified datamodel.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            saveDataModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "saveDataModel",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.serviceID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#revertDataModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to revert the specified database to the published version.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            revertDataModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "revertDataModel",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#addAttributes
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to add columns to the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            addAttributes: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "addAttributes",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.serviceID,
                        entityName: params.entityName,
                        attributeId: params.attributeName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteAttribute
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to add columns to the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteAttribute: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "deleteAttribute",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.serviceID,
                        entityName: params.entityName,
                        attributeId: params.attributeId
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateAttribute
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to add columns to the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateAttribute: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "updateAttribute",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.serviceID,
                        entityName: params.entityName,
                        attributeId: params.attributeName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAllQueries
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to list/retrieve all the queries in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getAllQueries: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getAllQueries",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to retrieve the specified query from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getQuery: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getQuery",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        queryName: params.queryName
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#createQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to create a query in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            createQuery: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "createQuery",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#setQueryMetaData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to set the meta-data for the specified query from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query for which meta-data needs to be set.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            setQueryMetaData: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "setQueryMetaData",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        queryName: params.queryName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update the specified query from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateQuery: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "updateQuery",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        queryName: params.queryName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#queryNameUsage
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             *  Returns list of objects where the object contains pageName and list of variables using given query name in the page.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            queryNameUsage: function (params) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: "Datamodel",
                    action: "queryNameUsage",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        queryName: params.queryName
                    }
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete the specified query from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be deleted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteQuery: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "deleteQuery",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        queryName: params.queryName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#validateQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to validate the specified query in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            validateQuery: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "validateQuery",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    },
                    data: params.queryDetails
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#testRunQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute the specified query in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            testRunQuery: function (params, successCallback, failureCallback) {
                return initiateAction("testRunQuery", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#nativeTestRunQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute the specified query in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            nativeTestRunQuery: function (params, successCallback, failureCallback) {
                return initiateAction("nativeTestRunQuery", params, successCallback, failureCallback, true);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAllProcedures
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to list/retrieve all the procedures saved in the specified database of the project.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getAllProcedures: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getAllProcedures",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#proceduresInDatabase
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to list/retrieve all database procedures.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            proceduresInDatabase: function (params) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: "Datamodel",
                    action: "proceduresInDatabase",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },


            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to retrieve the specified procedure from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and procedure to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getProcedure: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getProcedure",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        procedureName: params.procedureName
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#createProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to create a procedure in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and procedure to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            createProcedure: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "createProcedure",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    },
                    data              : params.data,
                    returnTypeMetadata: params.returnTypeMetadata
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update the specified procedure from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be fetched.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateProcedure: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "updateProcedure",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        procedureName: params.procedureName
                    },
                    data              : params.data,
                    returnTypeMetadata: params.returnTypeMetadata
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete the specified query from the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be deleted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteProcedure: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "deleteProcedure",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        procedureName: params.procedureName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#validateProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to validate the specified query in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            validateProcedure: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "validateProcedure",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    },
                    data: params.queryDetails
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#testRunProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute the specified query in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            testRunProcedure: function (params, successCallback, failureCallback) {
                return initiateAction("testRunProcedure", params, successCallback, failureCallback, true);
            },
            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#getSampleDbConnectionProperties
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to retrieve the connection properties for sample database.
             *
             * @param {object} params
             *                 Object containing name of the project.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getSampleDbConnectionProperties: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getSampleDbConnectionProperties",
                    urlParams: {
                        projectID: params.projectID,
                        sampleDbName: params.sampleDbName
                    }
                }, successCallback, failureCallback);
            },
            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#getConnectionProperties
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to retrieve the connection properties for the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & name of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getConnectionProperties: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getConnectionProperties",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#updateConnectionProperties
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update the connection properties for the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and connection settings to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateConnectionProperties: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "updateConnectionProperties",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getTypesMap
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get types map having sql and java types.
             *
             * @param {object} params
             *                 Object containing project id and dataModelName.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            getTypesMap: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getTypesMap",
                    urlParams: {
                        projectID    : params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getSequences
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get list of all sequence in the database.
             *
             * @param {object} params
             *                 Object containing project id and dataModelName.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            getSequences: function (params) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: "Datamodel",
                    action: "getSequences",
                    urlParams: {
                        projectID    : params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#readTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to read the data from the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            readTableData: function (params, successCallback, failureCallback) {
                return initiateAction("readTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#countTableDataWithQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to count the number of records that match the given criteria.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            countTableDataWithQuery: function (params, successCallback, failureCallback) {
                return initiateAction('countTableDataWithQuery', params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#searchTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to read the related data from the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            searchTableData: function (params, successCallback, failureCallback) {
                return initiateAction("searchTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#searchTableDataWithQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to read the related data from the specified table using query parameter.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            searchTableDataWithQuery: function (params, successCallback, failureCallback) {
                return initiateAction('searchTableDataWithQuery', params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getDistinctData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to fetch the distinct data specific to the given field
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getDistinctDataByFields: function (params, successCallback, failureCallback) {
                return initiateAction('getDistinctDataByFields', params, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#exportTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to download the data in given format
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             */

            exportTableData: function (params, successCallback, failureCallback) {
                return initiateAction('exportTableData', params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#readTableRelatedData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to refor data matching the specified criteria in the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            readTableRelatedData: function (params, successCallback, failureCallback) {
                return initiateAction("readTableRelatedData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#insertTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to insert data into the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be inserted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            insertTableData: function (params, successCallback, failureCallback) {
                return initiateAction("insertTableData", params, successCallback, failureCallback);
            },
            /**
             * @name wm.modeldesigner.$ModelService#insertMultiPartTableData
             * @ngdoc function
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to insert data into the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be inserted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            insertMultiPartTableData: function (params, successCallback, failureCallback) {
                return initiateAction("insertMultiPartTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update data in the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateTableData: function (params, successCallback, failureCallback) {
                return initiateAction("updateTableData", params, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateMultiPartTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update data in the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateMultiPartTableData: function (params, successCallback, failureCallback) {
                return initiateAction("updateMultiPartTableData", params, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateMultiPartCompositeTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update data in the composite table having blob column.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            updateMultiPartCompositeTableData: function (params, successCallback, failureCallback) {
                return initiateAction("updateMultiPartCompositeTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete data from the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be deleted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteTableData: function (params, successCallback, failureCallback) {
                return initiateAction("deleteTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateCompositeTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update data in the specified table (table with composite key).
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateCompositeTableData: function (params, successCallback, failureCallback) {
                return initiateAction("updateCompositeTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#periodupdateCompositeTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update data in the specified temporal table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            periodUpdateCompositeTableData: function (params, successCallback, failureCallback) {
                return initiateAction("periodUpdateCompositeTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteCompositeTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete data from the specified table (table with composite key).
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be deleted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteCompositeTableData: function (params, successCallback, failureCallback) {
                return initiateAction("deleteCompositeTableData", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#periodDeleteCompositeTableData
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete data from the specified table.
             *
             * @param {object} params
             *                 Object containing name of the project & table data to be deleted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            periodDeleteCompositeTableData: function (params, successCallback, failureCallback) {
                return initiateAction("periodDeleteCompositeTableData", params, successCallback, failureCallback);
            },

            /*
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#executeNamedQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute the specified named query.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be executed.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            executeNamedQuery: function (params, successCallback, failureCallback) {
                return initiateAction("executeNamedQuery", params, successCallback, failureCallback);
            },

            /*
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#executeNamedProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute the specified named procedure.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be executed.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            executeNamedProcedure: function (params, successCallback, failureCallback) {
                return initiateAction("executeNamedProcedure", params, successCallback, failureCallback);
            },

            /*
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#executeCustomQuery
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute a custom query.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and query to be executed.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            executeCustomQuery: function (params, successCallback, failureCallback) {
                return initiateAction("executeCustomQuery", params, successCallback, failureCallback);
            },

            /*
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#executeCustomProcedure
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to execute a custom procedure.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and procedure to be executed.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            executeCustomProcedure: function (params, successCallback, failureCallback) {
                return initiateAction("executeCustomProcedure", params, successCallback, failureCallback);
            },

            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#getOfflineConfig
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to retrieve the offline configuration data.
             *
             * @param {object} params
             *                 Object containing the offline config json.
             */

            getOfflineConfig: function (params) {
                return BaseService.execute({
                    target: "Datamodel",
                    action: "getOfflineConfig",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    }
                });
            },

            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#updateOfflineConfig
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update offline configuration data.
             *
             * @param {object} params
             *                 Object containing the offline config json.
             */

            updateOfflineConfig: function (params) {
                return BaseService.execute({
                    target: "Datamodel",
                    action: "updateOfflineConfig",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    },
                    data: params.data
                });
            },
            executeAggregateQuery: function (params, successCallback, failureCallback) {
                return initiateAction("executeAggregateQuery", params, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#listDataModels
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            listDataModels: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "listDataModels",
                    urlParams: {
                        "projectID": params.projectID,
                        "regionId": params.regionId,
                        "scope": params.scope
                    },
                    "data": params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getModel",
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#listScopeTypes
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            listScopeTypes: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "listScopeTypes",
                    urlParams: {
                        "projectID": params.projectID,
                        "regionId": params.regionId,
                        "isCreated": params.isCreated
                    },
                    "data": params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#listRegions
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            listRegions: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "listRegions",
                    urlParams: {
                        "projectID": params.projectID
                    },
                    "data": params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#createDataModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            createDataModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "createDataModel",
                    data: params.data,
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAllSchemas
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getAllSchemas: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getAllSchemas",
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getServiceID
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getServiceID: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getServiceID",
                    data: params.data,
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#importModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            importModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "importModel",
                    data: params.data,
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceID,
                        "modelName": params.modelName
                    }
                }, successCallback, failureCallback);
            },


            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getPrimitiveTypes
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getPrimitiveTypes: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getPrimitiveTypes",
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceId
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAttributeCustomProperties
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getAttributeCustomProperties: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getCustomProperties",
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceId
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getlookUpEntries
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the list of models.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the Model.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getlookUpEntries: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getlookUpEntries",
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceId
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#publishModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to apply(save & export) the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            publishModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "publishModel",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#revertModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to revert the specified database to the published version.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            revertModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "revertModel",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },
            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#getModelProperties
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to retrieve the connection properties for the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & name of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getModelProperties: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getModelProperties",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.serviceId
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the database to be deleted.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "deleteModel",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName,
                        deleteInRemote: params.deleteInRemote
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#reimportModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to re-import the specified datamodel.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            reimportModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "reimportModel",
                    urlParams: {
                        "projectID"     : params.projectID,
                        "serviceId"     : params.serviceId,
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getMetaDataServiceUrl
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the Meta Data Service Url.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getMetaDataServiceUrl: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Datamodel",
                    action: "getMetaDataServiceUrl",
                    urlParams: {
                        "projectID"     : params.projectID
                    }
                }, successCallback, failureCallback);
            }
        };
    }
];
