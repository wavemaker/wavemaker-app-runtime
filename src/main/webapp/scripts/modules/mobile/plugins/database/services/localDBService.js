/*global wm, WM, FileTransfer, _*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBService
 * @description
 * The 'wm.plugins.database.services.$LocalDBService' provides API  to interact with LocalDatabase.
 */
wm.plugins.database.services.LocalDBService = [
    '$cordovaNetwork',
    'DatabaseService',
    'ChangeLogService',
    'LocalDBManager',
    "Utils",
    function ($cordovaNetwork, DatabaseService, ChangeLogService, LocalDBManager, Utils) {
        'use strict';

        var self = this;

        /*
         * During offline, LocalDBService will answer to all the calls. All data modifications will be recorded
         * and will be reported to DatabaseService when device goes online.
         */
        function handleOfflineDBcall(operation, params, successCallback, failureCallback) {
            self[operation](params, function (response) {
                if (_.includes(['insertTableData', 'updateTableData', 'deleteTableData'], operation)) {
                    ChangeLogService.add('DatabaseService', operation, params).then(function () {
                        Utils.triggerFn(successCallback, response);
                    }, failureCallback);
                } else {
                    Utils.triggerFn(successCallback, response);
                }
            }, failureCallback, true);
        }

        /*
         * During online, all read operations data will be pushed to offline database. Similarly, Update and Delete
         * operations are synced with the offline database.
         */
        function handleOnlineDBcall(operation, onlineHandler, params, successCallback, failureCallback) {
            onlineHandler.call(DatabaseService, params, function (response) {
                if (_.includes(['readTableData', 'searchTableData', 'searchTableDataWithQuery'], operation)) {
                    _.forEach(response.content, function (r) {
                        var updateParams = {
                            dataModelName: params.dataModelName,
                            entityName: params.entityName,
                            data: r
                        };
                        self.updateTableData(updateParams, WM.noop, WM.noop, false);
                    });
                } else if (_.includes(['updateTableData', 'deleteTableData'], operation)) {
                    self[operation](params, WM.noop, WM.noop);
                }
                successCallback(response);
            }, failureCallback);
        }

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#handleOfflineDBCalls
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * DatabaseService calls will be routed through LocalDBService module.
         */
        this.handleOfflineDBCalls = function () {
            var operations = ['insertTableData',
                'updateTableData',
                'deleteTableData',
                'readTableData',
                'searchTableData',
                'searchTableDataWithQuery'];
            _.forEach(operations, function (operation) {
                var onlineHandler = DatabaseService[operation];
                if (onlineHandler) {
                    DatabaseService[operation] = function (params, successCallback, failureCallback) {
                        if ($cordovaNetwork.isOffline() && !params.onlyOnline) {
                            handleOfflineDBcall(operation, params, successCallback, function () {
                                handleOnlineDBcall(operation, onlineHandler, params, successCallback, failureCallback);
                            });
                        } else {
                            handleOnlineDBcall(operation, onlineHandler, params, successCallback, failureCallback);
                        }
                    };
                }
            });
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#insertTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Method to insert data into the specified table. This modification will be added to offline change log.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.insertTableData = function (params, successCallback, failureCallback) {
            var store = LocalDBManager.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.add(params.data)
                    .then(function (localId) {
                        var primaryKeyName = store.primaryKeyName;
                        params.data[primaryKeyName] = localId;
                        successCallback(params.data);
                    }, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#updateTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to update data in the specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.updateTableData = function (params, successCallback, failureCallback) {
            var store = LocalDBManager.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.save(params.data)
                    .then(function () {
                        successCallback(params.data);
                    }, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#deleteTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to delete data in the specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.deleteTableData = function (params, successCallback, failureCallback) {
            var store = LocalDBManager.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.delete(params.id).then(successCallback, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#readTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to read data from a specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.readTableData = function (params, successCallback, failureCallback) {
            var store = LocalDBManager.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.filter(params.data, params.sort.split('=')[1], {
                    offset: (params.page - 1) * params.size,
                    limit: params.size
                }).then(function (data) {
                    successCallback({
                        'content': data
                    });
                }, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#searchTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to read data from a specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.searchTableData = this.readTableData;

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#searchTableDataWithQuery
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to read data from a specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.searchTableDataWithQuery = this.readTableData;
    }];