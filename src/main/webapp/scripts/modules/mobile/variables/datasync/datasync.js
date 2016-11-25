/*global WM, _*/
WM.module('wm.variables').run(['$cordovaNetwork', 'ChangeLogService', 'DeviceVariableService', 'LocalDBManager', 'VARIABLE_CONSTANTS',
    function ($cordovaNetwork, ChangeLogService, DeviceVariableService, LocalDBManager, VARIABLE_CONSTANTS) {
        "use strict";
        var operations;

        function getOfflineChanges() {
            return ChangeLogService.getChanges().then(function (changes) {
                var errors = _.filter(changes, {'hasError' : 1});
                return {
                    'total' : changes.length - errors.length,
                    'database' : {
                        'create' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'insertTableData'}),
                        'update' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'updateTableData'}),
                        'delete' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'deleteTableData'})
                    },
                    'uploads' : _.filter(changes, {'service' : 'OfflineFileUploadService', 'operation' : 'uploadToServer'}),
                    'error' : errors
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
                    getOfflineChanges().then(function (changes) {
                        if (changes.total > 0 && $cordovaNetwork.isOnline()) {
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
            getChanges : {
                model: {
                    'total' : 0,
                    'database' : {
                        'create' : [],
                        'update' : [],
                        'delete' : []
                    },
                    'uploads' : [],
                    'error' : []
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