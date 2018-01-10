/*global WM, wm, _, FileTransfer, window, location, cordova*/

/**
 * @ngdoc overview
 * @name wm.plugins.offline
 * @description
 * The 'wm.plugins.offline' module provides offline support to a mobile application.
 *
 * A SQLite database is used for storing data on the device. When the device is online, data will be pushed to this
 * database. Thus stored data will be used when the device goes offline. During offline, any data changes will be
 * recorded and will be pushed to the server when the app goes online.
 *
 * Offline module also supports file upload during offline. When the device goes online, files will be actually
 * uploaded.
 */
wm.plugins.offline = WM.module('wm.plugins.offline', ['wm.plugins.database', 'ngCordova']);

/*Creating namespaces for the controllers, services etc. of the module*/
wm.plugins.offline.directives = {};
wm.plugins.offline.controllers = {};
wm.plugins.offline.services = {};
wm.plugins.offline.factories = {};

/*Defining the controllers, services etc. required for the offline services module*/
wm.plugins.offline.directive(wm.plugins.offline.directives);
wm.plugins.offline.controller(wm.plugins.offline.controllers);
wm.plugins.offline.service(wm.plugins.offline.services);
wm.plugins.offline.factory(wm.plugins.offline.factories);

wm.plugins.offline.constant('OFFLINE_WAVEMAKER_DATABASE_SCHEMA', {
    'name': 'wavemaker',
    'version': 1,
    'isInternal' : true,
    'tables': [
        {
            'name': 'key_value',
            'entityName': 'key-value',
            'columns': [{
                'fieldName': 'id',
                'name': 'id',
                'generatorType' : 'identity',
                'sqlType' : 'number',
                'primaryKey': true
            }, {
                'fieldName': 'key',
                'name': 'key'
            }, {
                'name': 'value',
                'fieldName': 'value'
            }]
        },
        {
            'name': 'offlineChangeLog',
            'entityName': 'offlineChangeLog',
            'columns': [{
                'fieldName': 'id',
                'name': 'id',
                'generatorType' : 'identity',
                'sqlType' : 'number',
                'primaryKey': true
            }, {
                'name': 'service',
                'fieldName': 'service'
            }, {
                'name': 'operation',
                'fieldName': 'operation'
            }, {
                'name': 'params',
                'fieldName': 'params'
            }, {
                'name': 'timestamp',
                'fieldName': 'timestamp'
            }, {
                'name': 'hasError',
                'fieldName': 'hasError'
            }, {
                'name': 'errorMessage',
                'fieldName': 'errorMessage'
            }]
        }
    ]
});

/*Bootstrapping the offline module*/
wm.plugins.offline.run([
    'ChangeLogService',
    'DeviceService',
    'LocalDBManager',
    'LocalDBService',
    'OfflineFileUploadService',
    'NetworkService',
    'Utils',
    'WebService',
    function (ChangeLogService,
              DeviceService,
              LocalDBManager,
              LocalDBService,
              OfflineFileUploadService,
              NetworkService,
              Utils,
              WebService) {
        'use strict';
        var initializationDone;
        /*
         * Intercepts FileTransfer#upload and if device is offline, then OfflineFileUploadService will handle it.
         */
        function addOfflineFileUploadSupport() {
            var upload = FileTransfer.prototype.upload;
            FileTransfer.prototype.upload = function (filePath, serverUrl, onSuccess, onFail, ftOptions) {
                if (NetworkService.isConnected()) {
                    return upload.call(this, filePath, serverUrl, onSuccess, onFail, ftOptions);
                }
                return OfflineFileUploadService.upload(filePath, serverUrl, ftOptions).then(function (result) {
                    onSuccess({
                        responseCode: 200,
                        response: JSON.stringify([result])
                    });
                }, onFail);
            };
        }

        function substring(source, start, end) {
            if (start) {
                var startIndex = source.indexOf(start) + start.length,
                    endIndex = end ? source.indexOf(end) : undefined;
                return source.substring(startIndex, endIndex);
            }
            return undefined;
        }

        function getHttpParamMap(str) {
            var result = {};
            if (str) {
                str = decodeURIComponent(str);
                _.forEach(str.split('&'), function (c) {
                    var csplits = c.split('=');
                    if (_.isEmpty(_.trim(csplits[1])) || isNaN(csplits[1])) {
                        result[csplits[0]] = csplits[1];
                    } else {
                        result[csplits[0]] = parseInt(csplits[1], 10);
                    }
                });
            }
            return result;
        }

        function addOfflineNamedQuerySupport() {
            var origInvokeJavaService = WebService.invokeJavaService;
            WebService.invokeJavaService = function (params, onSuccess, onError) {
                if (!NetworkService.isConnected() && params.url.indexOf('/queryExecutor/') > 0) {
                    var url = params.url,
                        hasUrlParams = url.indexOf('?') > 0,
                        dbName = substring(url, 'services/', '/queryExecutor'),
                        queryName = substring(url, 'queries/', hasUrlParams ? '?' : undefined),
                        urlParams = hasUrlParams ? getHttpParamMap(substring(url, '?', undefined)) : {},
                        dataParams = getHttpParamMap(params.dataParams),
                        queryParams = _.extend(urlParams, dataParams);
                    LocalDBManager.executeNamedQuery(dbName, queryName, queryParams).then(function (result) {
                        var rows = result.rows;
                        if (result.rowsAffected) {
                            ChangeLogService.add('WebService', 'invokeJavaService', params).then(function () {
                                Utils.triggerFn(onSuccess, result.rowsAffected);
                            }, onError);
                        } else {
                            Utils.triggerFn(onSuccess, {
                                "totalPages": 1,
                                "totalElements": rows.length,
                                "first": true,
                                "sort": null,
                                "numberOfElements": rows.length,
                                "last": true,
                                "size": params.size,
                                "number": 0,
                                'content': rows
                            });
                        }
                    }, function () {
                        origInvokeJavaService.call(WebService, params, onSuccess, onError);
                    });
                } else {
                    origInvokeJavaService.call(WebService, params, onSuccess, onError);
                }
            };
        }

        function init() {
            return LocalDBManager.loadDatabases()
                .then(function () {
                    LocalDBService.handleOfflineDBCalls();
                    addOfflineNamedQuerySupport();
                    addOfflineFileUploadSupport();
                    ChangeLogService.registerCallback({
                        'onAddCall': function () {
                            if (!NetworkService.isConnected()) {
                                NetworkService.disableAutoConnect();
                            }
                        },
                        'postFlush' : function (stats) {
                            if (stats.totalTaskCount > 0) {
                                LocalDBManager.close().finally(function () {
                                    location.assign(window.location.origin + window.location.pathname);
                                });
                            }
                        }
                    });
                });
        }

        if (window.cordova && window.SQLitePlugin) {
            initializationDone = DeviceService.waitForInitialization('Offline Storage');
            init().finally(initializationDone);
        }
    }
]);