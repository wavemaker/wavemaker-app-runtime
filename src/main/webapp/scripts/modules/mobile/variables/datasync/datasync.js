/*global WM, _*/
WM.module('wm.variables').run(['ChangeLogService', 'DeviceVariableService', 'LocalDBManager', 'VARIABLE_CONSTANTS',
    function (ChangeLogService, DeviceVariableService, LocalDBManager, VARIABLE_CONSTANTS) {
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
            };

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
        operations = {
            pull : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {},
                properties : [],
                requiredCordovaPlugins: [],
                invoke: function (variable, options, success, error) {
                    LocalDBManager.pullData().then(success, error);
                }
            },
            push : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {
                    'success' : 0,
                    'error' : 0,
                    'completed' : 0,
                    'total' : 0
                },
                properties : [
                    {"target": "onBeforePush", "hide" : false},
                    {"target": "onProgress", "hide" : false}
                ],
                requiredCordovaPlugins: [],
                invoke: function (variable, options) {
                    LocalDBManager.canConnectToServer()
                        .then(getOfflineChanges)
                        .then(function (changes) {
                            if (changes.pendingToSync.total > 0) {
                                DeviceVariableService.initiateCallback('onBeforePush', variable, options, changes);
                                ChangeLogService.flush(function (stats) {
                                    var eventName = stats.error > 0 ? 'onError' : 'onSuccess';
                                    variable.dataSet = stats;
                                    DeviceVariableService.initiateCallback(eventName, variable, options, stats);
                                }, function (stats) {
                                    variable.dataSet = stats;
                                    DeviceVariableService.initiateCallback('onProgress', variable, options, stats);
                                });
                            }
                        });
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
                    getOfflineChanges().then(success, error);
                }
            }
        };
        WM.forEach(operations, function (value, key) {
            DeviceVariableService.addOperation('datasync', key, value);
        });
    }]);