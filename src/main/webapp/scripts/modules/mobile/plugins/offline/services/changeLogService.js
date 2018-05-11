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
    '$q',
    'Utils',
    '$log',
    '$injector',
    'LocalDBManager',
    'LocalKeyValueService',
    'NetworkService',
    'SecurityService',

    function ($q, Utils, $log, $injector, LocalDBManager, LocalKeyValueService, NetworkService, SecurityService) {
        'use strict';
        var contextKey = 'changeLogService.flushContext',
            lastPushInfoKey = 'changeLogService.lastPushInfo',
            flushContext,
            services = {},
            callbacks = [],
            deferredFlush = null,
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

        //Transform params to Map
        function transformParamsToMap(change) {
            var cbs = _.map(callbacks, "transformParamsToMap");
            return Utils.executeDeferChain(cbs, [change]);
        }

        //Invokes PreCall callbacks
        function preCall(change) {
            var cbs = _.map(callbacks, "preCall");
            return Utils.executeDeferChain(cbs, [change]);
        }

        //Transform params from Map to original form
        function transformParamsFromMap(change) {
            var cbs = _.map(callbacks, "transformParamsFromMap");
            return Utils.executeDeferChain(cbs, [change]);
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
                    }, function () {
                        change.params = transformedParams;
                        defer.reject.apply(defer, arguments);
                    });
                }, defer.reject);
            } else {
                defer.reject(change);
            }
            return defer.promise;
        }

        //Invokes post call success callbacks
        function postCallSuccess(change, response) {
            var cbs = _.map(callbacks, "postCallSuccess");
            cbs = _.reverse(cbs);
            return Utils.executeDeferChain(cbs, [change, response]);
        }

        //Invokes post call error callbacks
        function postCallError(change, response) {
            var cbs = _.map(callbacks, "postCallError");
            cbs = _.reverse(cbs);
            return Utils.executeDeferChain(cbs, [change, response]);
        }

        function flushChange(change) {
            return preCall(change)
                .then(invokeService.bind(undefined, change))
                .then(function () {
                    return postCallSuccess(change, arguments).then(function () {
                        return change;
                    });
                }).catch(function () {
                    if (NetworkService.isConnected()) {
                        return postCallError(change, arguments).then(function () {
                            return $q.reject(change);
                        });
                    }
                    return $q.reject(change);
                });
        }

        // Flushes the first registered change.
        function getNextChange() {
            var filterCriteria = [{
                'attributeName' : 'hasError',
                'attributeValue' : 0,
                'attributeType' : 'NUMBER',
                'filterCondition' : 'EQUALS'
            }];
            return getStore().filter(filterCriteria, 'id', {
                offset: 0,
                limit: 1
            }).then(function (changes) {
                return changes && changes[0];
            });
        }

        //Flushes the complete log one after another.
        function flush(defer) {
            defer = defer || Utils.getAbortableDefer();
            if (defer.isAborted) {
                return $q.resolve();
            }
            getNextChange()
                .then(function (change) {
                    if (change) {
                        change.params = JSON.parse(change.params);
                        return flushChange(change);
                    }
                })
                .then(function (change) {
                    defer.notify(stats);
                    if (change) {
                        getStore().delete(change.id);
                        flush(defer);
                    } else {
                        defer.resolve();
                    }
                }, function (change) {
                    var connectPromise;
                    if (NetworkService.isConnected()) {
                        change.hasError = 1;
                        change.params = JSON.stringify(change.params);
                        getStore().save(change).then(function () {
                            flush(defer);
                        });
                    } else {
                        connectPromise = NetworkService.onConnect();
                        defer.promise.catch(function () {
                            if (connectPromise) {
                                connectPromise.abort();
                            }
                        });
                        connectPromise.then(function () {
                            flush(defer);
                            connectPromise = null;
                        });
                    }
                });
            return defer.promise;
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
                return Utils.executeDeferChain(_.map(callbacks, "onAddCall"), [change]);
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
         * Flush the current log. If a flush is already running, then the promise of that flush is returned back.
         */
        this.flush = function () {
            var flushPromise;
            if (!deferredFlush) {
                deferredFlush = Utils.getAbortableDefer();
                SecurityService.onUserLogin()
                    .then(createContext)
                    .then(function (context) {
                        flushContext = context;
                        return Utils.executeDeferChain(_.map(callbacks, "preFlush"), [flushContext]);
                    })
                    .then(function () {
                        flushPromise = flush();
                        deferredFlush.onAbort = function () {
                            flushPromise.abort();
                        };
                        return flushPromise;
                    })
                    .finally(function () {
                        $q.resolve().then(function () {
                            if (stats.totalTaskCount === stats.completedTaskCount) {
                                return flushContext.clear().then(function () {
                                    flushContext = null;
                                });
                            }
                        }).then(function () {
                            if (stats.failedTaskCount > 0) {
                                deferredFlush.reject(stats);
                            } else {
                                deferredFlush.resolve(stats);
                            }
                            deferredFlush = null;
                        }).then(function () {
                            var cbs = _.reverse(_.map(callbacks, "postFlush"));
                            return Utils.executeDeferChain(cbs, [stats, flushContext]);
                        });
                    }, function () {
                        deferredFlush.notify(stats);
                    });
            }
            return deferredFlush.promise;
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

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#stop
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Stops the ongoing flush process.
         *
         * @returns {object} a promise that is resolved when the flush process is stopped.
         */
        this.stop = function () {
            var d = $q.defer();
            if (deferredFlush) {
                deferredFlush.promise.finally(function () {
                    d.resolve();
                });
                deferredFlush.promise.abort();
            } else {
                d.resolve();
            }
            return d.promise;
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#isFlushInProgress
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Returns true, if a flush process is in progress. Otherwise, returns false.
         *
         * @returns {boolean} returns true, if a flush process is in progress. Otherwise, returns false.
         */
        this.isFlushInProgress = function () {
            return !(_.isUndefined(deferredFlush) || _.isNull(deferredFlush));
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getStore
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Returns the store used by ChangeLogService.
         *
         * @returns {object} returns the store used by ChangeLogService.
         */
        this.getStore = getStore;
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
                remoteId,
                entityIdStore = getEntityIdStore(dataModelName, entityName);
            if (data && primaryKeyName) {
                localId = data[primaryKeyName];
                remoteId = localId;
                while (entityIdStore[remoteId]) {
                    remoteId = entityIdStore[remoteId];
                }
                if (remoteId !== localId) {
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

        //Removes entity identifier from error list.
        function removeError(dataModelName, entityName, id) {
            if (errorStore[dataModelName]
                    && errorStore[dataModelName][entityName]
                    && errorStore[dataModelName][entityName][id]) {
                delete errorStore[dataModelName][entityName][id];
            }
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
            'postCallSuccess' : function (change) {
                var entityStore, entityName, dataModelName, id;
                if (change && change.service === 'DatabaseService') {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    entityStore = LocalDBManager.getStore(dataModelName, entityName);
                    id = change.dataLocalId || change.params.data[entityStore.primaryKeyName];
                    if (!(_.isUndefined(id) || _.isNull(id))) {
                        removeError(dataModelName, entityName, id);
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
    function ($cordovaFile,
              $q,
              ChangeLogService,
              DeviceFileService,
              LocalDBManager) {
        'use strict';

        // Registers for offline change log events.
        ChangeLogService.registerCallback({
            'transformParamsToMap' : function (change) {
                var store;
                if (change && change.service === 'DatabaseService') {
                    switch (change.operation) {
                    case 'insertMultiPartTableData':
                    case 'updateMultiPartTableData':
                        store = LocalDBManager.getStore(change.params.dataModelName, change.params.entityName);
                        return store.serialize(change.params.data).then(function (map) {
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
                        return store.deserialize(change.params.data).then(function (formData) {
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
/**
 * 1) When db is exported, then export upload directory as well.
 * 2) When a db is imported, then old upload directory needs to be updated with the current upload directory.
 */
wm.plugins.offline.run([
    '$cordovaFile',
    '$q',
    '$rootScope',
    'ChangeLogService',
    'DeviceFileService',
    'LocalDBManager',
    function ($cordovaFile, $q, $rootScope, ChangeLogService, DeviceFileService, LocalDBManager) {
        'use strict';
        var uploadDir;

        /**
         * returns back the changes that were logged.
         * @param page page number
         * @param size size of page
         * @returns {*}
         */
        function getChanges(page, size) {
            var filterCriteria = [];
            return ChangeLogService.getStore().filter(filterCriteria, 'id', {
                offset: (page - 1) * size,
                limit: size
            });
        }

        /**
         * If this is a database change, then it will replace old upload directory with the current upload directory
         * and its corresponding owner object, if  it has primary key.
         *
         * @param change
         * @param oldUploadDir
         * @param uploadDir
         * @returns {*}
         */
        function updateDBChange(change, oldUploadDir, uploadDir) {
            var modifiedProperties = {},
                entityName = change.params.entityName,
                dataModelName = change.params.dataModelName,
                store,
                primaryKeyName,
                primaryKey;
            change.params.data = _.mapValues(change.params.data, function (v, k) {
                var mv = v, isModified;
                if (_.isString(v)) {
                    mv = _.replace(v, oldUploadDir, uploadDir);
                    isModified = !_.isEqual(mv, v);
                } else if (_.isObject(v) && v.wmLocalPath) {
                    //insertMultiPartData and updateMultiPartData
                    mv = _.replace(v.wmLocalPath, oldUploadDir, uploadDir);
                    isModified = !_.isEqual(mv, v.wmLocalPath);
                }
                if (isModified) {
                    modifiedProperties[k] = mv;
                }
                return mv;
            });
            if (!_.isEmpty(modifiedProperties)) {
                store = LocalDBManager.getStore(dataModelName, entityName);
                return $q.resolve().then(function () {
                    // If there is a primary for the entity, then update actual row with the modifications
                    if (store.primaryKeyField && store.primaryKeyField.generatorType === 'identity') {
                        primaryKeyName = store.primaryKeyName;
                        primaryKey = change.params.data[primaryKeyName];
                        return store.get(primaryKey)
                            .then(function (obj) {
                                return store.save(_.assignIn(obj, modifiedProperties));
                            });
                    }
                }).then(function () {
                    change.params = JSON.stringify(change.params);
                    return ChangeLogService.getStore().save(change);
                });
            }
        }

        /**
         * This function check this change to update old upload directory path.
         * 
         * @param change
         * @param metaInfo
         * @returns {*}
         */
        function updateChange(change, metaInfo) {
            change.params = JSON.parse(change.params);
            if (change.service === 'OfflineFileUploadService'
                    && change.operation === 'uploadToServer') {
                change.params.file = _.replace(change.params.file, metaInfo.uploadDir, uploadDir);
                change.params = JSON.stringify(change.params);
                return ChangeLogService.getStore().save(change);
            }
            if (change.service === 'DatabaseService') {
                return updateDBChange(change, metaInfo.uploadDir, uploadDir);
            }
        }

        /**
         * This function will visit all the changes and modify them, if necessary.
         * @param metaInfo
         * @param page
         * @param defer
         * @returns {*}
         */
        function updateChanges(metaInfo, page, defer) {
            var size = 10;
            page = page || 1;
            defer = defer || $q.defer();
            getChanges(page, size)
                .then(function (changes) {
                    return $q.all(_.map(changes, function (change) {
                        return updateChange(change, metaInfo);
                    }));
                }).then(function (result) {
                    if (result && result.length === size) {
                        updateChanges(metaInfo, page + 1, defer);
                    } else {
                        defer.resolve();
                    }
                }, defer.reject);
            return defer.promise;
        }

        LocalDBManager.registerCallback({
            'preExport' : function (folderToExport, meta) {
                //copy offline uploads
                var uploadFullPath = DeviceFileService.getUploadDirectory(),
                    lastIndexOfSep = uploadFullPath.lastIndexOf('/'),
                    uploadParentDir = uploadFullPath.substring(0, lastIndexOfSep + 1),
                    uploadDirName = uploadFullPath.substring(lastIndexOfSep + 1);
                meta.uploadDir = uploadFullPath;
                return $cordovaFile.copyDir(uploadParentDir, uploadDirName, folderToExport, 'uploads');
            },
            'postImport' : function (importedFolder, meta) {
                var uploadFullPath = DeviceFileService.getUploadDirectory(),
                    lastIndexOfSep = uploadFullPath.lastIndexOf('/'),
                    uploadParentDir = uploadFullPath.substring(0, lastIndexOfSep + 1),
                    uploadDirName = uploadFullPath.substring(lastIndexOfSep + 1);
                uploadDir = uploadFullPath;
                return $cordovaFile.checkDir(importedFolder, 'uploads')
                    .then(function () {
                        return DeviceFileService.removeDir(uploadFullPath)
                            .then(function () {
                                return $cordovaFile.copyDir(importedFolder, 'uploads', uploadParentDir, uploadDirName);
                            }).then(function () {
                                return updateChanges(meta);
                            });
                    }, $q.resolve.bind($q));
            }
        });
    }]);