/*global WM, _*/
WM.module('wm.variables').run(['ChangeLogService', 'DeviceVariableService', 'VARIABLE_CONSTANTS',
    function (ChangeLogService, DeviceVariableService, VARIABLE_CONSTANTS) {
        "use strict";
        var operations;

        function getOfflineChanges() {
            return ChangeLogService.getChanges().then(function (changes) {
                return {
                    'database' : {
                        'create' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'insertTableData'}),
                        'update' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'updateTableData'}),
                        'delete' : _.filter(changes, {'service' : 'DatabaseService', 'operation' : 'deleteTableData'})
                    },
                    'uploads' : _.filter(changes, {'service' : 'OfflineFileUploadService', 'operation' : 'uploadToServer'}),
                    'error' : _.filter(changes, {'hasError' : 1}),
                    'length' : changes.length
                };
            });
        }
        operations = {
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
                invoke: function (variable, options, success) {
                    getOfflineChanges().then(function (changes) {
                        if (changes.length > 0) {
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
                    'database' : {
                        'create' : [],
                        'update' : [],
                        'delete' : []
                    },
                    'uploads' : [],
                    'error' : []
                },
                properties : [],
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