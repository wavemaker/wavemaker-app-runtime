/*global WM, wm*/
/*jslint todo: true */
/**
 * @ngdoc service
 * @name wm.database.$DatabaseService
 * @requires BaseService
 * @description
 * The `$DatabaseService` provides the details about the database apis
 *
 * # Shortcut Methods
 * Complete list of the methods:
 *
 * - {@link wm.database.$DatabaseService#methods_importDB importDB}
 * - {@link wm.database.$DatabaseService#methods_exportDB exportDB}
 * - {@link wm.database.$DatabaseService#methods_getAllDataModels getAllDataModels}
 * - {@link wm.database.$DatabaseService#methods_getDataModel getDataModel}
 * - {@link wm.database.$DatabaseService#methods_createDatabase createDatabase}
 * - {@link wm.database.$DatabaseService#methods_createService createService}
 * - {@link wm.database.$DatabaseService#methods_deleteDataModel deleteDataModel}
 * - {@link wm.database.$DatabaseService#methods_saveDataModel saveDataModel}
 * - {@link wm.database.$DatabaseService#methods_applyDataModel applyDataModel}
 * - {@link wm.database.$DatabaseService#methods_revertDataModel revertDataModel}
 * - {@link wm.database.$DatabaseService#methods_getDataModelDiff getDataModelDiff}
 * - {@link wm.database.$DatabaseService#methods_getAllEntities getAllEntities}
 * - {@link wm.database.$DatabaseService#methods_getEntity getEntity}
 * - {@link wm.database.$DatabaseService#methods_createEntity createEntity}
 * - {@link wm.database.$DatabaseService#methods_updateEntity updateEntity}
 * - {@link wm.database.$DatabaseService#methods_deleteEntity deleteEntity}
 * - {@link wm.database.$DatabaseService#methods_addColumns addColumns}
 * - {@link wm.database.$DatabaseService#methods_addPrimaryKey addPrimaryKey}
 * - {@link wm.database.$DatabaseService#methods_addUniqueKey addUniqueKey}
 * - {@link wm.database.$DatabaseService#methods_deleteUniqueKey deleteUniqueKey}
 * - {@link wm.database.$DatabaseService#methods_updateColumn updateColumn}
 * - {@link wm.database.$DatabaseService#methods_deleteColumn deleteColumn}
 * - {@link wm.database.$DatabaseService#methods_addRelation addRelation}
 * - {@link wm.database.$DatabaseService#methods_updateRelation updateRelation}
 * - {@link wm.database.$DatabaseService#methods_deleteRelation deleteRelation}
 * - {@link wm.database.$DatabaseService#methods_getAllQueries getAllQueries}
 * - {@link wm.database.$DatabaseService#methods_getQuery getQuery}
 * - {@link wm.database.$DatabaseService#methods_createQuery createQuery}
 * - {@link wm.database.$DatabaseService#methods_updateQuery updateQuery}
 * - {@link wm.database.$DatabaseService#methods_deleteQuery deleteQuery}
 * - {@link wm.database.$DatabaseService#methods_validateQuery validateQuery}
 * - {@link wm.database.$DatabaseService#methods_testRunQuery testRunQuery}
 * - {@link wm.database.$DatabaseService#methods_readTableData readTableData}
 * - {@link wm.database.$DatabaseService#methods_insertTableData insertTableData}
 * - {@link wm.database.$DatabaseService#methods_updateTableData updateTableData}
 * - {@link wm.database.$DatabaseService#methods_deleteTableData deleteTableData}
 */

wm.plugins.database.services.DatabaseService = [
    "$rootScope",
    "BaseService",
    "BaseServiceManager",
    "CONSTANTS",
    "Utils",
    "WebService",
    "$window",
    "$q",

    function ($rootScope, BaseService, BaseServiceManager, CONSTANTS, Utils, WebService, $window, $q) {
        'use strict';

        var initiateAction = function (action, params, successCallback, failureCallback) {
            var param,
                val,
                config,
                connectionParams,
                urlParams,
                requestData;

            config = BaseServiceManager.getConfig();
            config = Utils.getClonedObject(config.Database[action]);
            requestData = params.data;

            urlParams = {
                projectID        : params.projectID,
                service          : WM.isDefined(params.service) ? params.service : "services",
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
                sort             : params.sort,
                query            : params.query,
                exportFormat     : params.exportFormat
            };
            /*In the SAAS studio mode, if we directly try to access the runtime urls, it results in cross-domain request issues.,
             * Hence use the WebService's testRestService call to initiate the request.*/
            if (params.url && CONSTANTS.isStudioMode && $rootScope.preferences.workspace.loadXDomainAppDataUsingProxy) {

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

                connectionParams = {
                    "data": {
                        "endpointAddress"   : $window.location.protocol + params.url + config.url,
                        "method"            : config.method,
                        "contentType"       : "application/json",
                        "requestBody"       : JSON.stringify(requestData),
                        "headers"           : {
                            "skipSecurity": "true"
                        }
                    },
                    "urlParams"         : {
                        projectID: $rootScope.project.id
                    }
                };
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
                    target: "Database",
                    action: action,
                    urlParams: urlParams,
                    data: requestData,
                    config: {
                        "url": params.url
                    }
                };

                /* append the skipSecurity header to skip security-check in STUDIO MODE*/
                if (CONSTANTS.isStudioMode) {
                    connectionParams.headers = {"skipSecurity": "true"};
                }

                if (action === 'exportTableData') {
                    Utils.simulateFileDownload(BaseService.parseReplace(connectionParams));
                } else {
                    return BaseService.execute(connectionParams, successCallback, failureCallback);
                }
            }
        };
        /* APIs returned by the DatabaseService.*/
        return {

            /**
             * Internal function
             * @name wm.database.$DatabaseService#testConnection
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#testDatabase
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#testJarRequired
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#importDB
             * @methodOf wm.database.$DatabaseService
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
                        "dbName": params.dbName
                    },
                    urlParams: {
                        "projectID": params.projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.database.$DatabaseService#reimportDB
             * @methodOf wm.database.$DatabaseService
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
                        "projectID": params.projectID,
                        "serviceId": params.serviceId,
                        "retainDraft": params.retainDraft || false
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.database.$DatabaseService#exportDB
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#listTables
             * @methodOf wm.database.$DatabaseService
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
                    data: {
                        "serviceId": params.serviceId,
                        "packageName": params.packageName,
                        "username": params.username,
                        "password": params.password,
                        "url": params.url,
                        "schemaFilter": params.schemaFilter,
                        "tableFilter": [],
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
             * @name wm.database.$DatabaseService#loadModelInfo
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getAllDataModels
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getDataModel
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#createDatabase
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#createService
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteDataModel
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#saveDataModel
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#applyDataModel
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#revertDataModel
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getDataModelDiff
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getAllEntities
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getEntity
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#createEntity
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateEntity
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteEntity
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#addPrimaryKey
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#addUniqueKey
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteUniqueKey
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#addColumns
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateColumn
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteColumn
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#addRelation
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateRelation
             * @methodOf wm.database.$DatabaseService
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
                    data: params.data
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.database.$DatabaseService#deleteRelation
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getAllQueries
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#createQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#setQueryMetaData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#validateQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#testRunQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getAllProcedures
             * @methodOf wm.database.$DatabaseService
             * @function
             *
             * @description
             * Method to list/retrieve all the procedures in the specified database.
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
             * @name wm.database.$DatabaseService#getProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#createProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#validateProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#testRunProcedure
             * @methodOf wm.database.$DatabaseService
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
                return initiateAction("testRunProcedure", params, successCallback, failureCallback);            },
            /**
             * Internal function
             * @name wm.database.$DatabaseService#getSampleDbConnectionProperties
             * @methodOf wm.database.$DatabaseService
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
                        projectID: params.projectID
                    }
                }, successCallback, failureCallback);
            },
            /**
             * Internal function
             * @name wm.database.$DatabaseService#getConnectionProperties
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateConnectionProperties
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getTypesMap
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#readTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#searchTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#searchTableDataWithQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#exportTableData
             * @methodOf wm.database.$DatabaseService
             * @function
             *
             * @description
             * Method to download the data in given format
             *
             * @param {object} params
             *                 Object containing name of the project & details of the table.
             */

            exportTableData: function (params) {
                return initiateAction('exportTableData', params);
            },

            /**
             * @ngdoc function
             * @name wm.database.$DatabaseService#readTableRelatedData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#insertTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#insertMultiPartTableData
             * @ngdoc function
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateMultiPartTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateMultiPartCompositeTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateCompositeTableData
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#deleteCompositeTableData
             * @methodOf wm.database.$DatabaseService
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

            /*
             * @ngdoc function
             * @name wm.database.$DatabaseService#executeNamedQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#executeNamedProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#executeCustomQuery
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#executeCustomProcedure
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#getOfflineConfig
             * @methodOf wm.database.$DatabaseService
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
             * @name wm.database.$DatabaseService#updateOfflineConfig
             * @methodOf wm.database.$DatabaseService
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
            }
        };
    }
];
