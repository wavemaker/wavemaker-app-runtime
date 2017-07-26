/*global wm, WM, _, FormData, Blob, FileReader, Uint8Array*/
/*jslint sub: true, unparam:true*/
/**
 * @ngdoc service
 * @name wm.plugins.offline.services.$ChangeLogService
 * @description
 * Using ChangeLogService, one can register for an invocation to push a change during flush.
 *
 * Registration requires 3  params.
 *   1) Service (This should be available through $injector)
 *   2) Method to invoke.
 *   3) An object that needs to be passed the method during invocation.
 *
 * The registered call will be invoked with 3 arguments
 *   1) an object that is received during registration.
 *   2) onSuccess callback(function),
 *   3) onError callback(function)
 */
wm.plugins.offline.services.ChangeLogService = [
    'LocalDBManager',
    '$q',
    'Utils',
    '$log',
    '$injector',
    'LocalKeyValueService',
    'SecurityService',

    function (LocalDBManager, $q, Utils, $log, $injector, LocalKeyValueService, SecurityService) {
        'use strict';
        var contextKey = 'changeLogService.flushContext',
            lastPushInfoKey = 'changeLogService.lastPushInfo',
            flushContext,
            services = {},
            callbacks = [],
            flushInProgress = false,
            stats = {};

        function getService(serviceName) {
            var service = services[serviceName];
            if (!service) {
                service = $injector.get(serviceName);
                services[serviceName] = service;
            }
            return service;
        }

        /*
         * Retrieves the entity store to use by ChangeLogService.
         */
        function getStore() {
            return LocalDBManager.getStore('wavemaker', 'offlineChangeLog');
        }

        /*
         * Invokes the given list of functions sequentially with the given arguments. If a function returns a promise,
         * then next function will be invoked only if the promise is resolved.
         */
        function executeDeferChain(fns, args, d, i) {
            var returnObj;
            d = d || $q.defer();
            i = i || 0;
            if (i === 0) {
                fns = _.filter(fns, function (fn) {
                    return !(_.isUndefined(fn) || _.isNull(fn));
                });
            }
            if (fns && i < fns.length) {
                try {
                    returnObj = fns[i].apply(undefined, args);
                    $q.when(returnObj, function () {
                        executeDeferChain(fns, args, d, i + 1);
                    }, d.reject);
                } catch (e) {
                    d.reject(e);
                    $log.error(e.message);
                }
            } else {
                d.resolve();
            }
            return d.promise;
        }

        //Transform params to Map
        function transformParamsToMap(change) {
            var cbs = _.map(callbacks, "transformParamsToMap");
            return executeDeferChain(cbs, [change]);
        }

        //Invokes PreCall callbacks
        function preCall(change) {
            var cbs = _.map(callbacks, "preCall");
            return executeDeferChain(cbs, [change]);
        }

        //Transform params from Map to original form
        function transformParamsFromMap(change) {
            var cbs = _.map(callbacks, "transformParamsFromMap");
            return executeDeferChain(cbs, [change]);
        }

        //Trigger the call
        function invokeService(change) {
            var defer = $q.defer(),
                service = getService(change.service),
                operation = service[change.operation],
                transformedParams = _.cloneDeep(change.params);
            if (change.hasError === 0) {
                transformParamsFromMap(change).then(function () {
                    return operation(change.params, function () {
                        change.params = transformedParams;
                        defer.resolve.apply(defer, arguments);
                    });
                }).catch(function () {
                    change.params = transformedParams;
                    defer.reject.apply(defer, arguments);
                });
            } else {
                defer.reject(change);
            }
            return defer.promise;
        }

        //Invokes post call success callbacks
        function postCallSuccess(change, response) {
            var cbs = _.map(callbacks, "postCallSuccess");
            cbs = _.reverse(cbs);
            return executeDeferChain(cbs, [change, response]);
        }

        //Invokes post call error callbacks
        function postCallError(change, response) {
            var cbs = _.map(callbacks, "postCallError");
            cbs = _.reverse(cbs);
            return executeDeferChain(cbs, [change, response]);
        }

        function flushChange(change, onSuccess, onError) {
            preCall(change)
                .then(invokeService.bind(undefined, change))
                .then(function () {
                    postCallSuccess(change, arguments).then(onSuccess, onError);
                }).catch(function () {
                    postCallError(change, arguments).finally(onError.bind(undefined, arguments));
                });
        }

        // Flushes the first registered change.
        function flushNextChange(onSuccess, onError) {
            var filterCriteria = [{
                'attributeName' : 'hasError',
                'attributeValue' : 0,
                'attributeType' : 'NUMBER',
                'filterCondition' : 'EQUALS'
            }];
            getStore().filter(filterCriteria, 'id', {
                offset: 0,
                limit: 1
            }).then(function (changes) {
                var change = changes[0];
                if (change) {
                    change.params = JSON.parse(change.params);
                    flushChange(change, onSuccess.bind(undefined, change), onError.bind(undefined, change));
                } else {
                    onSuccess();
                }
            });
        }

        //Flushes the complete log one after another.
        function flush(onComplete, onProgress) {
            flushNextChange(function (change) {
                Utils.triggerFn(onProgress, stats);
                if (change) {
                    getStore().delete(change.id);
                    flush(onComplete, onProgress);
                } else {
                    onComplete();
                }
            }, function (change) {
                LocalDBManager.canConnectToServer().then(function () {
                    change.hasError = 1;
                }, function () {
                    //failed due to lack of network
                    change.hasError = -1;
                }).finally(function () {
                    change.params = JSON.stringify(change.params);
                    getStore().save(change);
                    flush(onComplete, onProgress);
                });
            });
        }

        function resetNetworkFailures() {
            return LocalDBManager.executeSQLQuery('wavemaker', 'UPDATE offlineChangeLog SET hasError = 0 WHERE hasError = -1');
        }

        function onFlushComplete(fn) {
            return function () {
                var cbs = _.reverse(_.map(callbacks, "postFlush"));
                flushInProgress = false;
                return resetNetworkFailures().then(function () {
                    if (stats.failedTaskCount === 0) {
                        return flushContext.clear().then(function () {
                            flushContext = undefined;
                        });
                    }
                }).then(function () {
                    return executeDeferChain(cbs, [stats, flushContext]);
                }).finally(function () {
                    Utils.triggerFn(fn, stats);
                });
            };
        }

        function createContext() {
            return LocalKeyValueService.get(contextKey).then(function (context) {
                context = context || {};
                return {
                    'clear' : function () {
                        context = {};
                        return LocalKeyValueService.remove(contextKey);
                    },
                    'get' : function (key) {
                        var value = context[key];
                        if (!value) {
                            value = {};
                            context[key] = value;
                        }
                        return value;
                    },
                    'save' : function () {
                        return LocalKeyValueService.put(contextKey, context);
                    }
                };
            });
        }

        /**
         * Register callbacks to track the flush.
         */
        callbacks.push({
            'onAddCall': function (change) {
                $log.debug('Added the following call %o to log.', change);
            },
            'preFlush': function () {
                stats.totalTaskCount = 0;
                stats.successfulTaskCount = 0;
                stats.failedTaskCount = 0;
                stats.completedTaskCount = 0;
                stats.inProgress = true;
                stats.startTime = new Date();
                $log.debug('Starting flush');
                return getStore().count([{
                    'attributeName' : 'hasError',
                    'attributeValue' : 0,
                    'attributeType' : 'NUMBER',
                    'filterCondition' : 'EQUALS'
                }]).then(function (count) {
                    stats.totalTaskCount = count;
                });
            },
            'postFlush': function (stats, flushContext) {
                $log.debug('flush completed. {Success : %i , Error : %i , completed : %i, total : %i }.',
                                stats.successfulTaskCount, stats.failedTaskCount, stats.completedTaskCount, stats.totalTaskCount);
                stats.inProgress = false;
                stats.endTime = new Date();
                LocalKeyValueService.put(lastPushInfoKey, stats);
            },
            'preCall': function (change) {
                $log.debug("%i. Invoking call %o", (1 + stats.completedTaskCount), change);
            },
            'postCallError': function (change, response) {
                stats.completedTaskCount++;
                stats.failedTaskCount++;
                $log.error('call failed with the response %o.', response);
                return flushContext.save();
            },
            'postCallSuccess': function (change, response) {
                stats.completedTaskCount++;
                stats.successfulTaskCount++;
                $log.debug('call returned the following response %o.', response);
                return flushContext.save();
            }
        });

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#add
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * adds a service call to the log. Call will be invoked in next flush.
         *
         * @Param {string} name of service (This should be available through $injector)
         * @Param {string} name of method to invoke.
         * @Param {object} params
         */
        this.add = function (service, operation, params) {
            var change,
                defer;
            if (!getService(service)) {
                defer = $q.defer();
                defer.reject("No service found");
                return defer.promise;
            }
            change = {
                'service': service,
                'operation': operation,
                'params': params,
                'hasError' : 0
            };
            return transformParamsToMap(change).then(function () {
                return executeDeferChain(_.map(callbacks, "onAddCall"), [change]);
            }).then(function () {
                change.params = JSON.stringify(change.params);
                return getStore().add(change);
            });
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#registerCallback
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Register callbacks for the following events.
         *
         * @param {object} callback
         *            {
         *              'transformParamsToMap' : function(change) {},
         *              'onAddCall': function(change) {},
         *              'preFlush': function() {flushContext},
         *              'preCall': function(change) {},
         *              'transformParamsFromMap' : function(change) {},
         *              'postCallError': function(change, response) {},
         *              'postCallSuccess': function(change, response) {},
         *              'postFlush': function(stats, flushContext) {}
         *            };
         */
        this.registerCallback = function (callback) {
            callbacks.push(callback);
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getErrors
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @returns {array} an array of changes that failed with error.
         */
        this.getErrors = function () {
            return getStore().filter([{
                'attributeName' : 'hasError',
                'attributeValue' : 1,
                'attributeType' : 'NUMBER',
                'filterCondition' : 'EQUALS'
            }]);
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getLogLength
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @returns {number} number of changes that are pending to push.
         */
        this.getLogLength = function () {
            return getStore().count([{
                'attributeName' : 'hasError',
                'attributeValue' : 0,
                'attributeType' : 'NUMBER',
                'filterCondition' : 'EQUALS'
            }]);
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#clearLog
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Clears the current log.
         */
        this.clearLog = function () {
            return getStore().clear();
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getChanges
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Returns the complete change list
         */
        this.getChanges = function () {
            return getStore().filter(undefined, 'id', {
                offset: 0,
                limit: 500
            }).then(function (changes) {
                _.forEach(changes, function (change) {
                    change.params = JSON.parse(change.params);
                });
                return changes;
            });
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getLogLength
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Flush the current log. If a flush is already running, then new flush cannot be started.
         */
        this.flush = function (onComplete, onProgress) {
            if (!flushInProgress) {
                onComplete = onFlushComplete(onComplete);
                flushInProgress = true;
                SecurityService.onUserLogin()
                    .then(createContext)
                    .then(function (context) {
                        flushContext = context;
                        return executeDeferChain(_.map(callbacks, "preFlush"), [flushContext]);
                    })
                    .then(function () {
                        flush(onComplete, onProgress);
                    })
                    .catch(onComplete);
            } else {
                Utils.triggerFn(onComplete, stats);
            }
        };
        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getLogLength
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @returns {object} the stats regarding the latest flush as following.
         *  {
         *      total : 0,
         *      success : 0,
         *      error : 0,
         *      completed : 0
         *  }
         */
        this.getLastPushInfo = function () {
            return LocalKeyValueService.get(lastPushInfoKey).then(function (info) {
                if (_.isString(info.startTime)) {
                    info.startTime = new Date(info.startTime);
                }
                if (_.isString(info.endTime)) {
                    info.endTime = new Date(info.endTime);
                }
                return info;
            });
        };
    }
];


/**
 * In offline database, a insert could generate the Id of an entity. During flush, id of that entity might get changed.
 * Due to that, relationship inconsistency arises. To prevent that, wherever this entity is referred in the next flush
 * call, Id has to be replaced with that of new one.
 */
wm.plugins.offline.run([
    "LocalDBManager",
    "ChangeLogService",
    "$log",
    function (LocalDBManager, ChangeLogService, $log) {
        'use strict';
        var storeKey  = 'idConflictResolution',
            idStore = {},
            transactionLocalId;

        function getEntityIdStore(dataModelName, entityName) {
            idStore[dataModelName] = idStore[dataModelName] || {};
            idStore[dataModelName][entityName] = idStore[dataModelName][entityName] || {};
            return idStore[dataModelName][entityName];
        }

        //if local id is different, then create a mapping for exchange.
        function pushIdToStore(dataModelName, entityName, transactionLocalId, remoteId) {
            if (transactionLocalId !== remoteId) {
                getEntityIdStore(dataModelName, entityName)[transactionLocalId] = remoteId;
                $log.debug('Conflict found for entity (%s) with local id (%i) and remote Id (%i)', entityName, transactionLocalId, remoteId);
            }
        }

        function logResolution(entityName, localId, remoteId) {
            $log.debug('Conflict resolved found for entity (%s) with local id (%i) and remote Id (%i)', entityName, localId, remoteId);
        }

        // Exchange primary key  of the given entity
        function exchangeId(dataModelName, entityName, data, keyName) {
            var primaryKeyName = keyName || LocalDBManager.getStore(dataModelName, entityName).primaryKeyName,
                localId,
                remoteId;
            if (data && primaryKeyName) {
                localId = data[primaryKeyName];
                remoteId = getEntityIdStore(dataModelName, entityName)[localId];
                if (remoteId) {
                    data[primaryKeyName] = remoteId;
                    logResolution(entityName, localId, remoteId);
                }
            }
        }

        //Looks primary key changes in the given entity or in the relations
        function exchangeIds(dataModelName, entityName, data) {
            exchangeId(dataModelName, entityName, data);
            _.forEach(LocalDBManager.getStore(dataModelName, entityName).schema.columns, function (col) {
                if (col.targetEntity) {
                    if (data[col.sourceFieldName]) {// if object reference
                        exchangeIds(dataModelName, col.targetEntity, data[col.sourceFieldName]);
                    } else if (data[col.fieldName]) {// if id value
                        exchangeId(dataModelName, col.targetEntity, data, col.fieldName);
                    }
                }
            });
        }

        // Registers for offline change log events.
        ChangeLogService.registerCallback({
            'preFlush' : function (flushContext) {
                idStore = flushContext.get(storeKey);
            },
            // Exchane Ids, Before any database operation.
            'preCall': function (change) {
                var primaryKeyName, entityName, dataModelName, store;
                if (change && change.service === 'DatabaseService') {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    switch (change.operation) {
                    case 'insertTableData':
                    case 'insertMultiPartTableData':
                        store = LocalDBManager.getStore(dataModelName, entityName);
                        exchangeIds(dataModelName, entityName, change.params.data);
                        if (store.primaryKeyField && store.primaryKeyField.generatorType === 'identity') {
                            primaryKeyName = store.primaryKeyName;
                            transactionLocalId = change.localId || change.params.data[primaryKeyName];
                            change.dataLocalId = transactionLocalId;
                            delete change.params.data[primaryKeyName];
                        } else {
                            transactionLocalId = undefined;
                        }
                        break;
                    case 'updateTableData':
                    case 'updateMultiPartTableData':
                        exchangeId(dataModelName, entityName, change.params);
                        exchangeIds(dataModelName, entityName, change.params.data);
                        break;
                    case 'deleteTableData':
                        exchangeIds(dataModelName, entityName, change.params);
                        break;
                    }
                }
            },
            // After every database insert, track the Id change.
            'postCallSuccess': function (change, response) {
                var entityName, primaryKeyName, dataModelName, entityStore;
                if (change && change.service === 'DatabaseService'
                        && (change.operation === 'insertTableData' || change.operation === 'insertMultiPartTableData')
                        && transactionLocalId) {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    entityStore = LocalDBManager.getStore(dataModelName, entityName);
                    primaryKeyName = entityStore.primaryKeyName;
                    pushIdToStore(dataModelName, entityName, transactionLocalId, response[0][primaryKeyName]);
                    entityStore.delete(transactionLocalId);
                    entityStore.save(response[0]);
                    transactionLocalId = undefined;
                }
            },
            //store error entity id
            'postCallError' : function (change) {
                var entityStore, entityName, dataModelName;
                if (change && change.service === 'DatabaseService'
                        && (change.operation === 'insertTableData' || change.operation === 'insertMultiPartTableData')
                        && transactionLocalId) {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    entityStore = LocalDBManager.getStore(dataModelName, entityName);
                    change.params.data[entityStore.primaryKeyName] = transactionLocalId;
                }
            }
        });
    }]);

/**
 *.On error of a db call, then all subsequent calls related to the failed entity and its child will be blocked.
 */
wm.plugins.offline.run([
    "LocalDBManager",
    "ChangeLogService",
    function (LocalDBManager, ChangeLogService) {
        'use strict';
        var storeKey  = 'errorBlockerStore',
            errorStore = {};

        function hasError(dataModelName, entityName, id) {
            if (errorStore[dataModelName]
                    && errorStore[dataModelName][entityName]
                    && errorStore[dataModelName][entityName][id]) {
                return true;
            }
            return false;
        }

        //Save error entity identifier.
        function recordError(dataModelName, entityName, id) {
            errorStore[dataModelName] = errorStore[dataModelName] || {};
            errorStore[dataModelName][entityName] = errorStore[dataModelName][entityName] || {};
            errorStore[dataModelName][entityName][id] = true;
        }

        //A helper function to check for earlier failures.
        function checkForPreviousError(change, dataModelName, entityName, data, key) {
            var primaryKey = key || LocalDBManager.getStore(dataModelName, entityName).primaryKeyName;
            if (hasError(dataModelName, entityName, data[primaryKey])) {
                change.hasError = 1;
                change.errorMessage = "Blocked call due to error in previous call of entity ["
                                        + entityName + "] with id [" + data[primaryKey] + " ]";
            }
        }

        /**
         * If there is an earlier call of the object or its relations that got failed, then this call will be
         * marked for discard.
         *
         * @param change change to block
         * @param dataModelName
         * @param entityName
         * @param data
         */
        function blockCall(change, dataModelName, entityName, data) {
            if (change.hasError === 0) {
                checkForPreviousError(change, dataModelName, entityName, data);
                _.forEach(LocalDBManager.getStore(dataModelName, entityName).schema.columns, function (col) {
                    if (col.targetEntity) {
                        if (data[col.sourceFieldName]) {
                            blockCall(change, dataModelName, col.targetEntity, data[col.sourceFieldName]);
                        } else if (data[col.fieldName]) {
                            checkForPreviousError(change, dataModelName, col.targetEntity, data, col.fieldName);
                        }
                    }
                });
            }
        }

        // Registers for offline change log events.
        ChangeLogService.registerCallback({
            'preFlush' : function (flushContext) {
                errorStore = flushContext.get(storeKey);
            },
            //block all calls related to the error entities
            'preCall' : function (change) {
                var entityName, dataModelName;
                if (change && change.service === 'DatabaseService') {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    switch (change.operation) {
                    case 'insertTableData':
                    case 'insertMultiPartTableData':
                    case 'updateTableData':
                    case 'updateMultiPartTableData':
                        blockCall(change, dataModelName, entityName, change.params.data);
                        break;
                    case 'deleteTableData':
                        blockCall(change, dataModelName, entityName, change.params);
                        break;
                    }
                }
            },
            //store error entity id
            'postCallError' : function (change) {
                var entityStore, entityName, dataModelName, id;
                if (change && change.service === 'DatabaseService') {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    entityStore = LocalDBManager.getStore(dataModelName, entityName);
                    id = change.dataLocalId || change.params.data[entityStore.primaryKeyName];
                    if (!(_.isUndefined(id) || _.isNull(id))) {
                        recordError(dataModelName, entityName, id);
                    }
                }
            }
        });
    }]);
/**
 * Handle file uploads
 */
wm.plugins.offline.run([
    "$q",
    "$log",
    "ChangeLogService",
    "OfflineFileUploadService",
    function ($q,
              $log,
              ChangeLogService,
              OfflineFileUploadService) {
        'use strict';
        var fileStore = {},
            storeKey  = 'offlineFileUpload';
        ChangeLogService.registerCallback({
            'preFlush' : function (flushContext) {
                fileStore = flushContext.get(storeKey);
            },
            /**
             * Replaces all local paths with the remote path using mappings created during 'uploadToServer'.
             */
            'preCall': function (change) {
                if (change.service === 'DatabaseService') {
                    change.params.data = _.mapValues(change.params.data, function (v) {
                        var remoteUrl = fileStore[v];
                        if (remoteUrl) {
                            $log.debug('swapped file path from %s -> %s', v, remoteUrl);
                            return remoteUrl;
                        }
                        return v;
                    });
                }
            },
            'postCallSuccess' : function (change, response) {
                if (change.service === 'OfflineFileUploadService'
                        && change.operation === 'uploadToServer') {
                    /*
                     * A mapping will be created between local path and remote path.
                     * This will be used to resolve local paths in entities.
                     */
                    fileStore[change.params.file]             = response[0].path;
                    fileStore[change.params.file + '?inline'] = response[0].inlinePath;
                }
            }
        });
    }]);

/**
 * Handles multipart requests
 */
wm.plugins.offline.run([
    "$cordovaFile",
    "$q",
    "ChangeLogService",
    "DeviceFileService",
    "LocalDBManager",
    "OfflineFileUploadService",
    "SWAGGER_CONSTANTS",
    "Utils",
    function ($cordovaFile,
              $q,
              ChangeLogService,
              DeviceFileService,
              LocalDBManager,
              OfflineFileUploadService,
              SWAGGER_CONSTANTS,
              Utils) {
        'use strict';

        function saveBlobToFile(blob) {
            var fileName = DeviceFileService.appendToFileName(blob.name),
                uploadDir = OfflineFileUploadService.getUploadDirectory();
            return $cordovaFile.writeFile(uploadDir, fileName, blob).then(function () {
                return {
                    'name' : blob.name,
                    'type' : blob.type,
                    'lastModified' : blob.lastModified,
                    'lastModifiedDate' : blob.lastModifiedDate,
                    'size' : blob.size,
                    'wmLocalPath' : uploadDir + '/' + fileName
                };
            });
        }

        /**
         * Converts form data object to map for storing request in local database..
         */
        function convertFormDataToMap(formData, store) {
            var blobcolumns = _.filter(store.schema.columns, {
                    'sqlType' : 'blob'
                }),
                map = {},
                promises = [];
            if (formData && typeof formData.append === 'function' && formData.rowData) {
                _.forEach(formData.rowData, function (fieldData, fieldName) {
                    if (fieldData && _.find(blobcolumns, {'fieldName' : fieldName})) {
                        promises.push(saveBlobToFile(fieldData).then(function (localFile) {
                            map[fieldName] = localFile;
                        }));
                    } else {
                        map[fieldName] = fieldData;
                    }
                });
            }
            return $q.all(promises).then(function () {
                return !formData || map;
            });
        }
        /**
         * Converts map object back to form data.
         */
        function convertMapToFormData(map, store) {
            var formData = new FormData(),
                blobColumns = _.filter(store.schema.columns, {
                    'sqlType' : 'blob'
                }),
                promises = [];
            _.forEach(blobColumns, function (column) {
                var value = map[column.fieldName];
                if (value) {
                    promises.push(Utils.convertToBlob(value.wmLocalPath)
                        .then(function (result) {
                            formData.append(column.fieldName, result.blob, value.name);
                        }));
                    map[column.fieldName] = '';
                }
            });
            formData.append(SWAGGER_CONSTANTS.WM_DATA_JSON, new Blob([JSON.stringify(map)], {
                type: 'application/json'
            }));
            return $q.all(promises).then(function () { return formData; });
        }
        // Registers for offline change log events.
        ChangeLogService.registerCallback({
            'transformParamsToMap' : function (change) {
                var store;
                if (change && change.service === 'DatabaseService') {
                    switch (change.operation) {
                    case 'insertMultiPartTableData':
                    case 'updateMultiPartTableData':
                        store = LocalDBManager.getStore(change.params.dataModelName, change.params.entityName);
                        return convertFormDataToMap(change.params.data, store).then(function (map) {
                            map[store.primaryKeyName] = change.params.data[store.primaryKeyName];
                            change.params.data = map;
                            /**
                             * As save method called with FormData object, empty row is inserted.
                             * Since FormData is converted to map, update the record details now.
                             */
                            store.save(_.mapValues(map, function (v) {
                                return (_.isObject(v) && v.wmLocalPath) || v;
                            }));
                            return map;
                        });
                    }
                }
            },
            'transformParamsFromMap' : function (change) {
                var store;
                if (change && change.service === 'DatabaseService') {
                    switch (change.operation) {
                    case 'insertMultiPartTableData':
                    case 'updateMultiPartTableData':
                        store = LocalDBManager.getStore(change.params.dataModelName, change.params.entityName);
                        //construct Form data
                        return convertMapToFormData(change.params.data, store).then(function (formData) {
                            change.params.data = formData;
                        });
                    }
                }
            },
            'postCallSuccess' : function (change) {
                if (change && change.service === 'DatabaseService') {
                    switch (change.operation) {
                    case 'insertMultiPartTableData':
                    case 'updateMultiPartTableData':
                        //clean up files
                        _.forEach(change.params.data, function (v) {
                            if (_.isObject(v) && v.wmLocalPath) {
                                DeviceFileService.removeFile(v.wmLocalPath);
                            }
                        });
                        break;
                    }
                }
            }
        });
    }]);
