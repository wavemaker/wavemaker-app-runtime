/*global WM, _, window*/
WM.module('wm.variables').run(['$rootScope', 'ChangeLogService', 'DeviceVariableService', 'LocalDBManager', 'SecurityService', 'VARIABLE_CONSTANTS',
    function ($rootScope, ChangeLogService, DeviceVariableService, LocalDBManager, SecurityService, VARIABLE_CONSTANTS) {
        "use strict";
        var operations,
            dataChangeTemplate = {
                'service': 'DatabaseService',
                'operation': 'operation',
                'params': {
                    'data' : {},
                    'dataModelName' : 'dataModelName',
                    'entityName' : 'entityName'
                },
                'hasError' : 0,
                'errorMessage' : ''
            },
            changeLogSet = {
                'total' : 0,
                'database' : {
                    'create' : [dataChangeTemplate],
                    'update' : [dataChangeTemplate],
                    'delete' : [dataChangeTemplate]
                },
                'uploads' : [{
                    'service': 'OfflineFileUploadService',
                    'operation': 'uploadToServer',
                    'params': {
                        'file': 'localFilePath',
                        'serverUrl': 'serverUrl',
                        'ftOptions': {}
                    },
                    'hasError' : 0,
                    'errorMessage' : ''
                }]
            },
            OFFLINE_PLUGIN_NOT_FOUND = 'Offline DB Plugin is required, but missing.';

        function generateChangeSet(changes) {
            return {
                'total' : changes ? changes.length : 0,
                'database' : {
                    'create' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'insertTableData'}),
                    'update' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'updateTableData'}),
                    'delete' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'deleteTableData'})
                },
                'uploads' : _.filter(changes, {'service' : 'OfflineFileUploadService', 'operation' : 'uploadToServer'})
            };
        }

        function getOfflineChanges() {
            return ChangeLogService.getChanges().then(function (changes) {
                return {
                    'total' : changes ? changes.length : 0,
                    'pendingToSync' : generateChangeSet(_.filter(changes, {'hasError' : 0})),
                    'failedToSync' : generateChangeSet(_.filter(changes, {'hasError' : 1}))
                };
            });
        }

        /**
         * This function adds the old properties to the push dataSet to support old projects.
         * @param data
         * @returns {*}
         */
        function addOldPropertiesForPushData(data) {
            var result = _.clone(data);
            result.success = data.successfulTaskCount;
            result.error = data.failedTaskCount;
            result.completed = data.completedTaskCount;
            result.total = data.totalTaskCount;
            return result;
        }
        operations = {
            pull : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {
                    'totalTaskCount' : 0,
                    'completedTaskCount' : 0,
                    'inProgress' : false
                },
                properties : [
                    {"target": "clearData", "type": "boolean", "widgettype": "boolean-inputfirst", "value": true, "group" : "properties", "subGroup" : "behavior"},
                    {"target": "startUpdate", "type": "boolean", "hide" : false},
                    {"target": "onBefore", "hide" : false},
                    {"target": "onProgress", "hide" : false},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: [],
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        // If user is authenticated and online, then start the data pull process.
                        SecurityService.onUserLogin()
                            .then(LocalDBManager.canConnectToServer.bind(LocalDBManager))
                            .then(function () {
                                var clearData = variable.clearData === "true" || variable.clearData === true;
                                DeviceVariableService.initiateCallback('onBefore', variable);
                                $rootScope.$emit('toggle-variable-state', variable.name, true);
                                LocalDBManager.pullData(clearData).then(success, error, function (progress) {
                                    variable.dataSet = progress;
                                    DeviceVariableService.initiateCallback('onProgress', variable, progress);
                                }).finally(function () {
                                    $rootScope.$emit('toggle-variable-state', variable.name, false);
                                });
                            });
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            },
            lastPullInfo : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {
                    'databases' : [{
                        'name' : 'datbaseName',
                        'entities': [{
                            'entityName': 'entityName',
                            'pulledRecordCount': 0
                        }],
                        'pulledRecordCount' : 0
                    }],
                    'totalPulledRecordCount' : 0,
                    'startTime' : 0,
                    'endTime' : 0
                },
                properties : [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: [],
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        $rootScope.$emit('toggle-variable-state', variable.name, true);
                        LocalDBManager.getLastPullInfo().then(success, error).finally(function () {
                            $rootScope.$emit('toggle-variable-state', variable.name, false);
                        });
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            },
            push : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {
                    'successfulTaskCount' : 0,
                    'failedTaskCount' : 0,
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0,
                    'inProgress' : false
                },
                properties : [
                    {"target": "onBefore", "hide" : false},
                    {"target": "onProgress", "hide" : false},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: [],
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        // If user is authenticated and online, then start the data push process.
                        SecurityService.onUserLogin()
                            .then(LocalDBManager.canConnectToServer.bind(LocalDBManager))
                            .then(getOfflineChanges)
                            .then(function (changes) {
                                if (changes.pendingToSync.total > 0) {
                                    DeviceVariableService.initiateCallback('onBefore', variable, changes);
                                    $rootScope.$emit('toggle-variable-state', variable.name, true);
                                    ChangeLogService.flush(function (stats) {
                                        var eventName = stats.error > 0 ? 'onError' : 'onSuccess';
                                        variable.dataSet = addOldPropertiesForPushData(stats);
                                        $rootScope.$emit('toggle-variable-state', variable.name, false);
                                        DeviceVariableService.initiateCallback(eventName, variable, stats);
                                    }, function (stats) {
                                        variable.dataSet = addOldPropertiesForPushData(stats);
                                        DeviceVariableService.initiateCallback('onProgress', variable, stats);
                                    });
                                }
                            });
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            },
            lastPushInfo : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {
                    'successfulTaskCount' : 0,
                    'failedTaskCount' : 0,
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0,
                    'startTime' : 0,
                    'endTime' : 0
                },
                properties : [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: [],
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        $rootScope.$emit('toggle-variable-state', variable.name, true);
                        ChangeLogService.getLastPushInfo().then(success, error).finally(function () {
                            $rootScope.$emit('toggle-variable-state', variable.name, false);
                        });
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            },
            getOfflineChanges : {
                model: {
                    'total' : 0,
                    'pendingToSync' : changeLogSet,
                    'failedToSync' : changeLogSet
                },
                properties : [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "autoUpdate", "type": "boolean", "value": true, "hide" : true}
                ],
                requiredCordovaPlugins: [],
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        getOfflineChanges().then(success, error);
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            }
        };
        WM.forEach(operations, function (value, key) {
            DeviceVariableService.addOperation('datasync', key, value);
        });
    }]);