/*global wm, WM, _*/
/*jslint sub: true, unparam:true*/
/**
 * @ngdoc service
 * @name wm.plugins.offline.services.$ChangeLogService
 * @description
 * Using ChangeLogService, one can register for an invocation to push a change during flush.
 *
 * Registration requires 3  p`arams.
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
    "LocalDBService",
    "$q",
    "Utils",
    "$log",
    "$injector",
    function (LocalDBService, $q, Utils, $log, $injector) {
        'use strict';
        var services = {},
            callbacks = [],
            flushInProgress = false,
            stats = {
                'total': 0,
                'success': 0
            };

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
            return LocalDBService.getStore('wavemaker', 'offlineChangeLog');
        }

        /*
         * Invokes the given list of functions sequentially with the given arguments. If a function returns a promise,
         * then next function will be invoked only if the promise is resolved.
         */
        function executeDeferChain(fns, args) {
            var d = $q.defer(),
                p = d.promise;
            _.forEach(fns, function (fn) {
                if (fn) {
                    p = p.then(function () {
                        try {
                            return fn.apply(undefined, args);
                        } catch (e) {
                            d.reject(e);
                            throw e;
                        }
                    });
                }
            });
            d.resolve();
            return p;
        }

        //Invokes PreCall callbacks
        function preCall(change) {
            var cbs = _.map(callbacks, "preCall");
            return executeDeferChain(cbs, [change]);
        }

        //Trigger the call
        function invokeService(change) {
            var defer = $q.defer(),
                service = getService(change.service),
                operation = service[change.operation];
            operation(change.params, function () {
                defer.resolve.apply(defer, arguments);
            }, function () {
                defer.reject.apply(defer, arguments);
            });
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
                .then(invokeService.bind(undefined, change), onError)
                .then(function () {
                    postCallSuccess(change, arguments).then(onSuccess, onError);
                }, function () {
                    postCallError(change, arguments).then(onError, onError);
                });
        }

        // Flushes the first registered change.
        function flushNextChange(onSuccess, onError) {
            getStore().filter(null, 'id', {
                offset: 0,
                limit: 1
            }).then(function (changes) {
                var change = changes[0];
                if (change) {
                    change.params = JSON.parse(change.params);
                    flushChange(change, onSuccess.bind(undefined, change), onError);
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
            }, onComplete);
        }

        function onFlushComplete(fn) {
            return function () {
                flushInProgress = false;
                executeDeferChain(_.map(callbacks, "postFlush"));
                Utils.triggerFn(fn, stats);
            };
        }

        /**
         * Register callbacks to track the flush.
         */
        callbacks.push({
            'onAddCall': function (change) {
                $log.debug('Added the following call %o to log.', change);
            },
            'preFlush': function () {
                stats.total = 0;
                stats.success = 0;
                stats.error = 0;
                stats.completed = 0;
                $log.debug('Starting flush');
                return getStore().count().then(function (count) {
                    stats.total = count;
                });
            },
            'postFlush': function () {
                $log.debug('flush completed. %i/%i call(s) invoked.', stats.completed, stats.total);
            },
            'preCall': function (change) {
                $log.debug("%i. Invoking call %o", (++stats.completed), change);
            },
            'postCallError': function (change, response) {
                stats.error++;
                $log.error('call failed with the response %o.', response);
            },
            'postCallSuccess': function (change, response) {
                stats.success++;
                $log.debug('call returnd the following response %o.', response);
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
                'params': JSON.stringify(params)
            };
            getStore().add(change);
            return executeDeferChain(_.map(callbacks, "onAddCall"), [change]);
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#registerCallback
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @description
         * Register callbacks for the following events.
         *
         * @param {object} callback
         *            {'onAddCall': function(change) {},
         *              'preFlush': function() {},
         *              'postFlush': function() {},
         *              'preCall': function(change) {},
         *              'postCallError': function(change, response) {},
         *              'postCallSuccess': function(change, response) {}
         *            };
         */
        this.registerCallback = function (callback) {
            callbacks.push(callback);
        };

        /**
         * @ngdoc method
         * @name  wm.plugins.offline.services.$ChangeLogService#getLogLength
         * @methodOf  wm.plugins.offline.services.$ChangeLogService
         * @returns {number} log length.
         */
        this.getLogLength = function () {
            return getStore().count();
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
                executeDeferChain(_.map(callbacks, "preFlush"))
                    .then(function () {
                        flush(onComplete, onProgress);
                    }, onComplete);
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
        this.getFlushStats = function () {
            return stats;
        };
    }
];


/**
 * In offline database, a insert could generate the Id of an entity. During flush, id of that entity might get changed.
 * Due to that, relationship inconsistency arises. To prevent that, wherever this entity is referred in the next flush
 * call, Id has to be replaced with that of new one.
 */
wm.plugins.offline.run([
    "LocalDBService",
    "ChangeLogService",
    "$log",
    function (LocalDBService, ChangeLogService, $log) {
        'use strict';
        var idStore = {},
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
        function exchangeId(dataModelName, entityName, data) {
            if (data) {
                var primaryKeyName = LocalDBService.getStore(dataModelName, entityName).primaryKeyName,
                    localId = data[primaryKeyName],
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
            _.forEach(LocalDBService.getStore(dataModelName, entityName).schema.columns, function (col) {
                if (col.targetEntity && data[col.sourceFieldName]) {
                    exchangeIds(dataModelName, col.targetEntity, data[col.sourceFieldName]);
                }
            });
        }

        // Registers for offline change log events.
        ChangeLogService.registerCallback({
            // Exchane Ids, Before any database operation.
            'preCall': function (change) {
                var primaryKeyName, entityName, dataModelName;
                if (change && change.service === 'DatabaseService') {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    switch (change.operation) {
                    case 'insertTableData':
                        exchangeIds(dataModelName, entityName, change.params.data);
                        primaryKeyName = LocalDBService.getStore(dataModelName, entityName).primaryKeyName;
                        transactionLocalId = change.params.data[primaryKeyName];
                        delete change.params.data[primaryKeyName];
                        break;
                    case 'updateTableData':
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
                if (change && change.service === 'DatabaseService' && change.operation === 'insertTableData') {
                    entityName = change.params.entityName;
                    dataModelName = change.params.dataModelName;
                    entityStore = LocalDBService.getStore(dataModelName, entityName);
                    primaryKeyName = entityStore.primaryKeyName;
                    pushIdToStore(dataModelName, entityName, transactionLocalId, response[0][primaryKeyName]);
                    entityStore.delete(transactionLocalId);
                    entityStore.save(response[0]);
                    transactionLocalId = undefined;
                }
            }
        });
    }]);