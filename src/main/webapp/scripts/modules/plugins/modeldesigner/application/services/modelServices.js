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
 * - {@link wm.modeldesigner.$ModelService#methods_getAllModels getAllModels}
 * - {@link wm.modeldesigner.$ModelService#methods_getModel getModel}
 * - {@link wm.modeldesigner.$ModelService#methods_listScopeTypes listScopeTypes}
 * - {@link wm.modeldesigner.$ModelService#methods_createDataModel createDataModel}
 * - {@link wm.modeldesigner.$ModelService#methods_getAllSchemas getAllSchemas}
 * - {@link wm.modeldesigner.$ModelService#methods_getServiceID getServiceID}
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
                /*(!$rootScope.preferences.workspace.loadXDomainAppDataUsingProxy is added in endpointAddress to differentiate desktop from saas*/
                if (action === 'testRunQuery') {
                    headers['Content-Type'] = undefined;
                    httpDetails = {
                        'endpointAddress'   : $window.location.protocol + (!$rootScope.preferences.workspace.loadXDomainAppDataUsingProxy ? ('//' + $window.location.host) : '') + params.url + config.url,
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
                            'endpointAddress'   : $window.location.protocol + (!$rootScope.preferences.workspace.loadXDomainAppDataUsingProxy ? ('//' + $window.location.host) : '') + params.url + config.url,
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
             * Internal function
             * @name wm.modeldesigner.$ModelService#testConnection
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to test connection to the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            testConnection: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "testConnection",
                    data: {
                        "username": params.username,
                        "password": params.password,
                        "url": params.url,
                        "driverClass": params.driverClass,
                        "dialect": params.dialect
                    },
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#testDatabase
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to test connection while creation of database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             */

            testDatabase: function (params) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: "Database",
                    action: "testDatabase",
                    urlParams: {
                        "projectID": params.projectID
                    },
                    data : params.data
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },

            /**
             * Internal function
             * @name wm.modeldesigner.$ModelService#testJarRequired
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to test if jar is required for the selected database.
             *
             * @param {object} params
             *                 Object containing name of the project & type of the database.
             */

            testJarRequired: function (params) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: "Database",
                    action: "testJarRequired",
                    urlParams: {
                        'projectID': params.projectID,
                        'dbType'   : params.dbType
                    }
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#read
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to read the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            read: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "read",
                    data: {
                        "serviceId": params.serviceId,
                        "packageName": params.packageName,
                        "username": params.username,
                        "password": params.password,
                        "url": params.url,
                        "tableFilter": params.tableFilter,
                        "schemaName": params.schemaName,
                        "schemaFilter": params.schemaFilter,
                        "driverClass": params.driverClass,
                        "dialect": params.dialect,
                        "revengNamingStrategyClassName": params.revengNamingStrategyClassName,
                        "impersonateUser": false,
                        "activeDirectoryDomain": params.activeDirectoryDomain,
                        "dbType": params.dbType,
                        "host": params.host,
                        "port": params.port,
                        "dbName": params.dbName,
                        "readOnly": params.readOnly
                    },
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#create
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to create the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            create: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "create",
                    data: {
                        "dataModel": params.dataModel,
                        "properties" : {
                            "serviceId": params.serviceId,
                            "packageName": params.packageName,
                            "username": params.username,
                            "password": params.password,
                            "url": params.url,
                            "tableFilter": params.tableFilter,
                            "schemaName": params.schemaName,
                            "schemaFilter": params.schemaFilter,
                            "driverClass": params.driverClass,
                            "dialect": params.dialect,
                            "revengNamingStrategyClassName": params.revengNamingStrategyClassName,
                            "impersonateUser": false,
                            "activeDirectoryDomain": params.activeDirectoryDomain,
                            "dbType": params.dbType,
                            "host": params.host,
                            "port": params.port,
                            "dbName": params.dbName,
                            "readOnly": params.readOnly
                        }
                    },
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#readExistingDB
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to read the specified existing database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            readExistingDB: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "readExistingDB",
                    data: params.data,
                    urlParams: {
                        "projectID"     : params.projectID,
                        "serviceId"     : params.serviceId
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#reImportExistingDB
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to reImport the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            reImportExistingDB: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "reImportExistingDB",
                    data: {
                        "dataModel": params.dataModel,
                        "properties" : params.data
                    },
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceId
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#reImportCorruptDB
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to reImport the corrupt database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            reImportCorruptDB: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "reImportCorruptDB",
                    data: {
                        reInitialize: params.reInitialize || true
                    },
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId"     : params.serviceId
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#importDB
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to import the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            importDB: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "importDB",
                    data: {
                        "serviceId": params.serviceId,
                        "packageName": params.packageName,
                        "username": params.username,
                        "password": params.password,
                        "url": params.url,
                        "tableFilter": params.tableFilter,
                        "schemaName": params.schemaName,
                        "schemaFilter": params.schemaFilter,
                        "driverClass": params.driverClass,
                        "dialect": params.dialect,
                        "revengNamingStrategyClassName": params.revengNamingStrategyClassName,
                        "impersonateUser": false,
                        "activeDirectoryDomain": params.activeDirectoryDomain,
                        "dbType": params.dbType,
                        "host": params.host,
                        "port": params.port,
                        "dbName": params.dbName,
                        "readOnly": params.readOnly
                    },
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#reimportDB
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to re-import the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            reImportDB: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "reImportDB",
                    urlParams: {
                        "projectID"     : params.projectID,
                        "serviceId"     : params.serviceId,
                        "retainDraft"   : params.retainDraft || false,
                        "reInitialize"  : params.reInitialize || false
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#exportDB
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to export the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            exportDB: function (params, successCallback, failureCallback) {

                return BaseService.execute({
                    target: 'Database',
                    action: 'exportDB',
                    data: {
                        'serviceId'                     : params.serviceId,
                        'username'                      : params.username,
                        'password'                      : params.password,
                        'url'                           : params.url,
                        'schemaName'                    : params.schemaName,
                        'schemaFilter'                  : params.schemaFilter,
                        'driverClass'                   : params.driverClass,
                        'dialect'                       : params.dialect,
                        'revengNamingStrategyClassName' : params.revengNamingStrategyClassName,
                        'impersonateUser'               : false,
                        'overwrite'                     : params.overwrite,
                        'dbType'                        : params.dbType,
                        'host'                          : params.host,
                        'port'                          : params.port,
                        'dbName'                        : params.dbName,
                        'packageName'                   : params.packageName
                    },
                    urlParams: {
                        'projectID'                     : params.projectID,
                        'serviceId'                     : params.serviceId
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#listTables
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to load all the tables.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            listTables: function (params, successCallback, failureCallback) {
                BaseService.execute({
                    target: "Database",
                    action: "listTables",
                    data: params.data,
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getGeneratorTypes
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to load all the generator types.
             *
             * @param {object} params
             *                 Object containing id of the project & type of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getGeneratorTypes: function (params, successCallback, failureCallback) {
                BaseService.execute({
                    target: "Database",
                    action: "getGeneratorTypes",
                    urlParams: {
                        "projectID": params.projectID,
                        "dbType": params.dbType
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#loadModelInfo
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to load all the datamodels and their info.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            loadModelInfo: function (params, successCallback, failureCallback) {
                BaseService.execute({
                    target: "Database",
                    action: "loadModelInfo",
                    data: {
                        "serviceId": params.serviceId,
                        "packageName": params.packageName,
                        "username": params.username,
                        "password": params.password,
                        "url": params.url,
                        "schemaFilter": params.schemaFilter,
                        "tableFilter": params.tableFilter,
                        "driverClass": params.driverClass,
                        "dialect": params.dialect,
                        "revengNamingStrategyClassName": params.revengNamingStrategyClassName,
                        "impersonateUser": false,
                        "dbType": params.dbType,
                        "host": params.host,
                        "port": params.port,
                        "dbName": params.dbName
                    },
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

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
                    target: "Database",
                    action: "getAllDataModels",
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getDataModel
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get complete meta data(i.e., tables, columns, relations etc.) of the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the datamodel.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */
            getDataModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "getDataModel",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        isdraft: params.isdraft
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#createDatabase
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to create a database with the specified name.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database and connection settings.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            createDatabase: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "createDatabase",
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#createService
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to create a datamodel with the specified name.
             *
             *@param {object} params
             *                 Object containing name of the project, name of the database and connection settings.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            createService: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "createService",
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteDataModel
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

            deleteDataModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "deleteService",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
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
                    target: "Database",
                    action: "saveDataModel",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#applyDataModel
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

            applyDataModel: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "applyDataModel",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    },
                    data: params.data
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
                    target: "Database",
                    action: "revertDataModel",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getDataModelDiff
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the datamodel diff i.e., diff of datamodel in external database and draftmodel.
             *
             * @param {object} params
             *                 Object containing name of the project and name of the datamodel.
             */

            getDataModelDiff: function (params) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: "Database",
                    action: "dataModelDiff",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    }
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAllEntities
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get all the tables in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getAllEntities: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "getAllEntities",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getEntity
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to get the details of the specified table from the database.
             *
             * @param {object} params
             *                 Object containing name of the project, database & table.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            getEntity: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "getEntity",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        tableName: params.tableName
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#createEntity
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to create a new entity in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table to be created.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            createEntity: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "createEntity",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateEntity
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update the specified entity in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table to be created.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateEntity: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "updateEntity",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName)
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteEntity
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete the specified entity in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table to be created.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteEntity: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "deleteEntity",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName)
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#addPrimaryKey
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

            addPrimaryKey: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "addPrimaryKey",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: params.entityName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#addUniqueKey
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to add unique key to the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             */

            addUniqueKey: function (params) {

                var deferred = $q.defer();

                BaseService.execute({
                    target: "Database",
                    action: "addUniqueKey",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: params.entityName
                    },
                    data: params.data
                }, deferred.resolve, deferred.reject);

                return deferred.promise;
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteUniqueKey
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete a unique key to the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             */

            deleteUniqueKey: function (params) {

                var deferred = $q.defer();

                BaseService.execute({
                    target: "Database",
                    action: "deleteUniqueKey",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName),
                        uniquekeyname : encodeURIComponent(params.uniquekeyname)
                    }
                }, deferred.resolve, deferred.reject);

                return deferred.promise;
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#addColumns
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

            addColumns: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "addColumns",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: params.entityName
                    },
                    data: params.data
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
                    target: "Database",
                    action: "addAttributes",
                    urlParams: {
                        projectID: params.projectID,
                        modelId: params.dataModelName,
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
                    target: "Database",
                    action: "deleteAttribute",
                    urlParams: {
                        projectID: params.projectID,
                        modelId: params.dataModelName,
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
                    target: "Database",
                    action: "updateAttribute",
                    urlParams: {
                        projectID: params.projectID,
                        modelId: params.dataModelName,
                        serviceId: params.serviceID,
                        entityName: params.entityName,
                        attributeId: params.attributeName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateColumn
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update the columns of the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateColumn: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "updateColumn",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName),
                        columnName: encodeURIComponent(params.columnName),
                        forceDataLoss: params.forceDataLoss || false
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteColumn
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete the specified column of the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project & details of the database, table, column to be created/updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteColumn: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "deleteColumn",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName),
                        columnName: encodeURIComponent(params.columnName)
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#addRelation
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to add a relation to the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            addRelation: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "addRelation",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: params.entityName
                    },
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#updateRelation
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to update the specified relation of the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            updateRelation: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "updateRelation",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName),
                        relationName: encodeURIComponent(params.relationName)
                    },
                    data: {
                        cascadeEnabled: params.data.cascadeEnabled,
                        cascadeOptions: params.data.cascadeOptions,
                        fetchOptions: params.data.fetchOptions,
                        parentFetchOptions: params.data.parentFetchOptions
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#deleteRelation
             * @methodOf wm.modeldesigner.$ModelService
             * @function
             *
             * @description
             * Method to delete the specified relation of the specified table in the specified database.
             *
             * @param {object} params
             *                 Object containing name of the project, name of the database, table and relations to be updated.
             * @param {function=} successCallback
             *                    Callback function to be triggered on success.
             * @param {function=} failureCallback
             *                    Callback function to be triggered on failure.
             */

            deleteRelation: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "deleteRelation",
                    urlParams: {
                        projectID: params.projectID,
                        dataModelName: params.dataModelName,
                        entityName: encodeURIComponent(params.entityName),
                        relationName: encodeURIComponent(params.relationName)
                    }
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
                    action: "listDataModels",
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.modeldesigner.$ModelService#getAllModels
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

            getAllModels: function (params, successCallback, failureCallback) {

                BaseService.execute({
                    target: "Database",
                    action: "getAllModels",
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceID
                    }
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
                    target: "Database",
                    action: "getModel",
                    urlParams: {
                        "projectID": params.projectID,
                        "serviceId": params.serviceID,
                        "modelId": params.dataModelName
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
                    target: "Database",
                    action: "listScopeTypes",
                    urlParams: {
                        "projectID": params.projectID
                    }
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
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
                    target: "Database",
                    action: "getPrimitiveTypes",
                    urlParams: {
                        "projectID": params.projectID
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
                    target: "Database",
                    action: "getlookUpEntries",
                    urlParams: {
                        "projectID": params.projectID
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
                    target: "Database",
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
                    target: "Database",
                    action: "revertModel",
                    urlParams: {
                        projectID: params.projectID,
                        serviceId: params.dataModelName
                    }
                }, successCallback, failureCallback);
            }
        };
    }
];
