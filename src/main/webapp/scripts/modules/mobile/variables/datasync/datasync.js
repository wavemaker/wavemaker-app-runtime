/*global WM, _, window*/
WM.module('wm.variables').run(['$q', '$rootScope', 'ChangeLogService', 'DeviceVariableService', 'FileSelectorService', 'LocalDBDataPullService', 'LocalDBManager', 'NetworkService', 'ProgressBarService', 'SecurityService', 'VARIABLE_CONSTANTS',
    function ($q, $rootScope, ChangeLogService, DeviceVariableService, FileSelectorService, LocalDBDataPullService, LocalDBManager, NetworkService, ProgressBarService, SecurityService, VARIABLE_CONSTANTS) {
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
            OFFLINE_PLUGIN_NOT_FOUND = 'Offline DB Plugin is required, but missing.',
            APP_IS_OFFLINE = 'App is offline.',
            ON_BEFORE_BLOCKED = 'onBefore callback returned false.',
            REQUIRED_PLUGINS = ['OFFLINE_DB', 'NETWORK'];

        function generateChangeSet(changes) {
            var createChanges =  _.filter(changes, function (c) {
                return c.service === 'DatabaseService' &&
                        (c.operation === 'insertTableData'
                            || c.operation === 'insertMultiPartTableData');
            }), updateChanges =  _.filter(changes, function (c) {
                return c.service === 'DatabaseService' &&
                    (c.operation === 'updateTableData'
                    || c.operation === 'updateMultiPartTableData');
            });
            return {
                'total' : changes ? changes.length : 0,
                'database' : {
                    'create' : createChanges,
                    'update' : updateChanges,
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

        function canExecute(variable) {
            if (!window.SQLitePlugin) {
                return $q.reject(OFFLINE_PLUGIN_NOT_FOUND);
            }
            if (!NetworkService.isConnected()) {
                return $q.reject(APP_IS_OFFLINE);
            }
            return DeviceVariableService.initiateCallback('onBefore', variable)
                .then(function (proceed) {
                    if (proceed === false) {
                        return $q.reject(ON_BEFORE_BLOCKED);
                    }
                    // If user is authenticated and online, then start the data pull process.
                    return SecurityService.onUserLogin();
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
                    {"target": "showProgress", "hide": false}
                ],
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    var progressInstance;
                    canExecute(variable)
                        .then(function () {
                            if (variable.showProgress) {
                                return ProgressBarService.createInstance($rootScope.appLocale.LABEL_DATA_PULL_PROGRESS);
                            }
                        }).then(function (instance) {
                            var clearData = variable.clearData === "true" || variable.clearData === true,
                                pullPromise;
                            progressInstance = instance;
                            $rootScope.$emit('toggle-variable-state', variable, true);
                            pullPromise = LocalDBDataPullService.pullAllDbData(clearData);
                            if (progressInstance) {
                                progressInstance.set('stopButtonLabel', $rootScope.appLocale.LABEL_DATA_PULL_PROGRESS_STOP_BTN);
                                progressInstance.set('onStop', function () {
                                    LocalDBDataPullService.cancel(pullPromise);
                                });
                            }
                            return pullPromise;
                        }).then(success, error, function (progress) {
                            variable.dataSet = progress;
                            DeviceVariableService.initiateCallback('onProgress', variable, progress);
                            if (progressInstance) {
                                progressInstance.set('max', progress.pullInfo.totalRecordsToPull);
                                progressInstance.set('value', progress.pullInfo.totalPulledRecordCount);
                            }
                        }).finally(function () {
                            $rootScope.$emit('toggle-variable-state', variable, false);
                            if (progressInstance) {
                                progressInstance.destroy();
                            }
                        });
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
                    'startTime' : new Date().toJSON(),
                    'endTime' : new Date().toJSON()
                },
                properties : [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        $rootScope.$emit('toggle-variable-state', variable, true);
                        LocalDBDataPullService.getLastPullInfo().then(success, error).finally(function () {
                            $rootScope.$emit('toggle-variable-state', variable, false);
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
                    {"target": "showProgress", "hide": false, "value": true}
                ],
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    var progressInstance;
                    if (ChangeLogService.isFlushInProgress()) {
                        success();
                        return;
                    }
                    canExecute(variable)
                        .then(function () {
                            return getOfflineChanges();
                        }).then(function (changes) {
                            if (changes.pendingToSync.total <= 0) {
                                return $q.reject();
                            }
                        }).then(function () {
                            if (variable.showProgress) {
                                return ProgressBarService.createInstance($rootScope.appLocale.LABEL_DATA_PUSH_PROGRESS);
                            }
                        }).then(function (instance) {
                            var pushPromise = ChangeLogService.flush();
                            $rootScope.$emit('toggle-variable-state', variable, true);
                            if (instance) {
                                progressInstance = instance;
                                progressInstance.set('stopButtonLabel', $rootScope.appLocale.LABEL_DATA_PUSH_PROGRESS_STOP_BTN);
                                progressInstance.set('onStop', function () {
                                    ChangeLogService.stop();
                                });
                            }
                            return pushPromise;
                        }).then(function (stats) {
                            success(stats);
                            return stats;
                        }, function (stats) {
                            error(stats);
                            return stats;
                        }, function (stats) {
                            variable.dataSet = addOldPropertiesForPushData(stats);
                            DeviceVariableService.initiateCallback('onProgress', variable, stats);
                            if (progressInstance) {
                                progressInstance.set('max', stats.totalTaskCount);
                                progressInstance.set('value', stats.completedTaskCount);
                            }
                        }).finally(function (stats) {
                            variable.dataSet = addOldPropertiesForPushData(stats);
                            $rootScope.$emit('toggle-variable-state', variable, false);
                            if (progressInstance) {
                                progressInstance.destroy();
                            }
                        });
                }
            },
            lastPushInfo : {
                owner : VARIABLE_CONSTANTS.OWNER.APP,
                model: {
                    'successfulTaskCount' : 0,
                    'failedTaskCount' : 0,
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0,
                    'startTime' : new Date().toJSON(),
                    'endTime' : new Date().toJSON()
                },
                properties : [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        $rootScope.$emit('toggle-variable-state', variable, true);
                        ChangeLogService.getLastPushInfo().then(success, error).finally(function () {
                            $rootScope.$emit('toggle-variable-state', variable, false);
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
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        getOfflineChanges().then(success, error);
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            },
            exportDB : {
                model: {
                    'path' : ''
                },
                properties : [
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        $rootScope.$emit('toggle-variable-state', variable, true);
                        LocalDBManager.exportDB()
                            .then(function (path) {
                                variable.dataSet = {
                                    'path' : path
                                };
                                success();
                            }, error)
                            .finally(function () {
                                $rootScope.$emit('toggle-variable-state', variable, false);
                            });
                    } else {
                        error(OFFLINE_PLUGIN_NOT_FOUND);
                    }
                }
            },
            importDB : {
                model: {},
                properties : [
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: REQUIRED_PLUGINS,
                invoke: function (variable, options, success, error) {
                    if (window.SQLitePlugin) {
                        FileSelectorService.open({'type' : 'zip'}, function (files) {
                            if (files && files.length) {
                                $rootScope.$emit('toggle-variable-state', variable, true);
                                LocalDBManager.importDB(files[0].path, true)
                                    .then(function () {
                                        success();
                                    }, error)
                                    .finally(function () {
                                        $rootScope.$emit('toggle-variable-state', variable, false);
                                    });
                            }
                        });
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