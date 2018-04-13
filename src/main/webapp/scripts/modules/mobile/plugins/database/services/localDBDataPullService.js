/*global wm, WM, _, window, moment*/
/*jslint sub: true, unparam:true*/

/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBDataPullService
 * @description
 * The 'wm.plugins.database.services.$LocalDBDataPullService' has API to pull data from remote Server to local Database.
 */
wm.plugins.database.services.LocalDBDataPullService = [
    '$http',
    '$liveVariable',
    '$q',
    '$rootScope',
    'DatabaseService',
    'LocalDBManager',
    'LocalKeyValueService',
    'NetworkService',
    function (
        $http,
        $liveVariable,
        $q,
        $rootScope,
        DatabaseService,
        LocalDBManager,
        LocalKeyValueService,
        NetworkService
    ) {
        'use strict';
        var LAST_PULL_INFO_KEY = 'localDBManager.lastPullInfo',
            pullProcessManager;

        /**
         * a utility api to abort pull process.
         *
         * @type {{start, add, remove, abort}}
         */
        pullProcessManager = (function createPromiseManager() {
            var promises = {};
            return {
                start : function (promise) {
                    promise.$$pullProcessId = 'PULL_' + _.now();
                },
                add : function (pullPromise, promise) {
                    var pullProcessId = pullPromise.$$pullProcessId;
                    if (!promises[pullProcessId]) {
                        promises[pullProcessId] = [];
                    }
                    promises[pullProcessId].push(promise);
                },
                remove : function (pullPromise, promise) {
                    var pullProcessId = pullPromise.$$pullProcessId;
                    _.remove(promises[pullProcessId], promise);
                    if (_.isEmpty(promises[pullProcessId])) {
                        delete promises[pullProcessId];
                    }
                },
                abort : function (pullPromise) {
                    var pullProcessId = pullPromise.$$pullProcessId;
                    if (promises[pullProcessId]) {
                        _.forEach(promises[pullProcessId], function (p) {
                            if (p && p.abort) {
                                p.abort();
                            }
                        });
                        delete promises[pullProcessId];
                    }
                    pullPromise.$$isMarkedToAbort = true;
                    return pullPromise.catch(function () {
                        return 'cancelled';
                    });
                }
            };
        }());

        /**
         * Listen for db creation. When db is created, then initialize last pull info.
         */
        LocalDBManager.registerCallback({
            'onDbCreate' : function (info) {
                LocalKeyValueService.put(LAST_PULL_INFO_KEY, {
                    'databases' : [],
                    'totalRecordsToPull' : 0,
                    'totalPulledRecordCount' : 0,
                    'startTime' : 0,
                    'endTime' : info.dbSeedCreatedOn
                });
            }
        });

        /**
         * @returns {*}
         */
        function getLastPullInfo() {
            return LocalKeyValueService.get(LAST_PULL_INFO_KEY).then(function (info) {
                if (_.isString(info.startTime)) {
                    info.startTime = new Date(info.startTime);
                }
                if (_.isString(info.endTime)) {
                    info.endTime = new Date(info.endTime);
                }
                return info;
            });
        }

        function getDb(dbName) {
            return LocalDBManager.loadDatabases()
                .then(function (databases) {
                    var db = _.find(databases, {'name' : dbName});
                    return db || $q.reject('Local database (' + dbName + ') not found');
                });
        }

        /**
         * If expression starts with 'bind:', then expression is evaluated rootscope and result is returned.
         *
         * @param expression
         * @returns {*}
         */
        function evalIfBind(expression) {
            if (_.startsWith(expression, "bind:")) {
                expression = expression.replace(/\[\$\i\]/g, '[0]');
                return $rootScope.$eval(expression.replace('bind:', ''));
            }
            return expression;
        }

        /**
         * If fn fails and network is not there
         * @param fn
         * @param pullPromise
         * @returns {*}
         */
        function retryIfNetworkFails(fn, pullPromise) {
            var promise;
            if (pullPromise.$$isMarkedToAbort) {
                return $q.reject();
            }
            promise = NetworkService.retryIfNetworkFails(fn);
            pullProcessManager.add(pullPromise, promise);
            promise.finally(function () {
                pullProcessManager.remove(pullPromise, promise);
            });
            return promise;
        }

        /**
         * Executes DatabaseService.searchTableDataWithQuery as a promise API.
         * @param params
         * @returns {*}
         */
        function executeDatabaseSearchQuery(params) {
            var defer = $q.defer();
            DatabaseService.searchTableDataWithQuery(params, function (response) {
                defer.resolve(response.content);
            }, defer.reject.bind(defer));
            return defer.promise;
        }

        /**
         * Executes DatabaseService.countTableDataWithQuery as a promise API.
         * @param params
         * @returns {*}
         */
        function executeDatabaseCountQuery(params) {
            var defer = $q.defer();
            DatabaseService.countTableDataWithQuery(params, function (response) {
                defer.resolve(response);
            }, defer.reject.bind(defer));
            return defer.promise;
        }

        /**
         * Pulls data of the given entity from remote server.
         * @param db
         * @param entityName
         * @param sort
         * @param maxNoOfPages
         * @param pageSize
         * @param currentPage
         * @param filter
         * @param pullPromise
         * @param defer
         * @returns {*}
         */
        function pullEntityData(db, entityName, filter, sort, maxNoOfPages, pageSize, currentPage, pullPromise, defer) {
            var params,
                dataModelName = db.schema.name;
            defer = defer || $q.defer();
            if (currentPage > maxNoOfPages) {
                return defer.resolve();
            }
            params = {
                dataModelName: dataModelName,
                entityName: entityName,
                page: currentPage,
                size: pageSize,
                data: filter,
                sort: sort,
                onlyOnline: true,
                skipLocalDB: true
            };
            retryIfNetworkFails(function () {
                return executeDatabaseSearchQuery(params);
            }, pullPromise).then(function (response) {
                defer.notify(response);
                pullEntityData(db, entityName, filter, sort, maxNoOfPages, pageSize, currentPage + 1, pullPromise, defer);
            }, defer.reject.bind(defer));
            return defer.promise;
        }

        /**
         * Computes the maximum number of records to pull.
         *
         * @param db
         * @param entitySchema
         * @param filter
         * @param pullPromise
         * @returns {*}
         */
        function getTotalRecordsToPull(db, entitySchema, filter, pullPromise) {
            var params = {
                dataModelName: db.schema.name,
                entityName: entitySchema.entityName,
                data: filter
            };
            return retryIfNetworkFails(function () {
                return executeDatabaseCountQuery(params).then(function (response) {
                    var totalRecordCount = response.data,
                        maxRecordsToPull = _.parseInt(entitySchema.pullConfig.maxNumberOfRecords);
                    if (_.isNaN(maxRecordsToPull) || maxRecordsToPull <= 0 || totalRecordCount < maxRecordsToPull) {
                        return totalRecordCount;
                    }
                    return maxRecordsToPull;
                });
            }, pullPromise);
        }

        /**
         * @param db
         * @param entityName
         * @returns {*}
         */
        function prepareQuery(db, entityName) {
            var query,
                entitySchema = db.schema.entities[entityName],
                isBundledEntity = LocalDBManager.isBundled(db.name, entityName);
            return $q.resolve().then(function () {
                var hasNullAttributeValue = false;
                if (isBundledEntity || _.isEmpty(entitySchema.pullConfig.query)) {
                    query = _.cloneDeep(entitySchema.pullConfig.filter);
                    query = _.map(query, function (v) {
                        v.attributeValue = evalIfBind(v.attributeValue);
                        hasNullAttributeValue = hasNullAttributeValue || _.isNil(v.attributeValue);
                        return v;
                    });
                    if (hasNullAttributeValue) {
                        return $q.reject('Null criteria values are present');
                    }
                    query = _.sortBy(query, 'attributeName');
                    query = $liveVariable.getSearchQuery(query, ' AND ', true);
                } else {
                    query = evalIfBind(entitySchema.pullConfig.query);
                }
                if (_.isNil(query)) {
                    return null;
                }
                return encodeURIComponent(query);
            });
        }

        /**
         * If deltaFieldName is set,last pull time is greater than zero and query used in last pull is same as the
         * query for the current pull, then delta criteria is attached to the query.
         *
         * @param db
         * @param entityName
         * @param query
         * @returns {*}
         */
        function addDeltaCriteria(db, entityName, query) {
            var entitySchema = db.schema.entities[entityName],
                isBundledEntity = LocalDBManager.isBundled(db.schema.name, entityName),
                deltaFieldName = entitySchema.pullConfig.deltaFieldName;
            if (!_.isEmpty(deltaFieldName)) {
                return getLastPullInfo().then(function (lastPullInfo) {
                    var lastPullTime = (lastPullInfo && lastPullInfo.startTime && lastPullInfo.startTime.getTime()),
                        lastPullDBInfo = _.find(lastPullInfo && lastPullInfo.databases, {'name' : db.schema.name}),
                        lastPullEntityInfo = _.find(lastPullDBInfo && lastPullDBInfo.entities, {'entityName' : entityName});
                    if (!lastPullTime && isBundledEntity) {
                        //For bundled entity when there is no last pull, fetch records that got modified after db creation.
                        lastPullTime = (lastPullInfo && lastPullInfo.endTime && lastPullInfo.endTime.getTime());
                        lastPullEntityInfo.query = query;
                    }
                    if (lastPullEntityInfo && lastPullEntityInfo.query === query && lastPullTime > 0) {
                        if (_.isEmpty(query)) {
                            query = '';
                        } else {
                            query += ' AND ';
                        }
                        query += deltaFieldName + ' > wm_ts(\'' + lastPullTime + '\')';
                    }
                    return query;
                }, $q.resolve.bind($q, query));
            }
            return query;
        }

        /**
         *
         * @param db
         * @param entityName
         * @param clearDataBeforePull
         * @param pullPromise
         * @returns {*}
         */
        function copyDataFromRemoteDBToLocalDB(db, entityName, clearDataBeforePull, pullPromise) {
            var store = db.stores[entityName],
                entitySchema = db.schema.entities[entityName],
                result = {
                    'entityName' : entityName,
                    'totalRecordsToPull' : 0,
                    'pulledRecordCount' : 0
                },
                defer = $q.defer(),
                inProgress = 0,
                pullComplete = false,
                filter;
            $q.resolve().then(function () {
                return prepareQuery(db, entityName);
            }).then(function (query) {
                result.query = query;
                return addDeltaCriteria(db, entityName, query);
            }).then(function (query) {
                //Clear if clearDataBeforePull is true and delta query is not used
                if (clearDataBeforePull && result.query === query) {
                    return store.clear()
                        .then(function () {
                            return query;
                        });
                }
                return query;
            }).then(function (query) {
                filter = _.isEmpty(query) ? '' : 'q=' + query;
                return getTotalRecordsToPull(db, entitySchema, filter, pullPromise);
            }).then(function (maxNoOfRecords) {
                var pageSize = entitySchema.pullConfig.size || 100,
                    maxNoOfPages = Math.ceil(maxNoOfRecords / pageSize),
                    sort = entitySchema.pullConfig.orderBy;
                result.totalRecordsToPull = maxNoOfRecords;
                sort = (_.isEmpty(sort) ? '' : sort + ',') + store.primaryKeyName;
                defer.notify(result);
                return pullEntityData(db, entityName, filter, sort, maxNoOfPages, pageSize, 1, pullPromise);
            }).then(null, defer.reject, function (data) {
                inProgress++;
                data = _.slice(data, 0, result.totalRecordsToPull - result.pulledRecordCount);
                store.saveAll(data).then(function () {
                    result.pulledRecordCount += data ? data.length : 0;
                    defer.notify(result);
                }).finally(function () {
                    inProgress--;
                    if (inProgress === 0 && pullComplete) {
                        defer.resolve(result);
                    }
                });
            }).finally(function () {
                pullComplete = true;
                if (inProgress === 0) {
                    defer.resolve(result);
                }
            });
            return defer.promise;
        }

        /**
         *
         * @param db
         * @param clearDataBeforePull
         * @param pullPromise
         * @returns {*}
         */
        function pullDbData(db, clearDataBeforePull, pullPromise) {
            var datamodelName = db.schema.name,
                pullPromises,
                result = {
                    'name' : db.schema.name,
                    'entities' : [],
                    'totalRecordsToPull': 0,
                    'pulledRecordCount' : 0,
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0
                },
                defer = $q.defer();
            pullPromises = _.chain(db.schema.entities)
                .filter(function (entity) {
                    var pullConfig = LocalDBManager.getStore(datamodelName, entity.entityName).schema.pullConfig;
                    return pullConfig.pullType === 'APP_START'
                        || (pullConfig.pullType === 'BUNDLED' && pullConfig.deltaFieldName);
                }).map(function (entity) {
                    return copyDataFromRemoteDBToLocalDB(db, entity.entityName, clearDataBeforePull, pullPromise)
                        .then(function (info) {
                            result.completedTaskCount++;
                            defer.notify(result);
                            return info;
                        }, null, function (info) {
                            var i = _.findIndex(result.entities, {'entityName' : info.entityName});
                            if (i >= 0) {
                                result.entities[i] = info;
                            } else {
                                result.entities.push(info);
                            }
                            result.pulledRecordCount = _.reduce(result.entities, function (sum, entityPullInfo) {
                                return sum + entityPullInfo.pulledRecordCount;
                            }, 0);
                            result.totalRecordsToPull = _.reduce(result.entities, function (sum, entityPullInfo) {
                                return sum + entityPullInfo.totalRecordsToPull;
                            }, 0);
                            defer.notify(result);
                        });
                }).value();
            result.totalTaskCount = pullPromises.length;
            defer.notify(result);
            $q.all(pullPromises).then(function () {
                defer.resolve(result);
            }, defer.reject);
            return defer.promise;
        }

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBDataPullService#pullEntityData
         * @methodOf wm.plugins.database.services.$LocalDBDataPullService
         *
         *
         * @description
         * Clears (based on parameter) and pulls data of the given entity and database from
         * server using the configured rules in offline configuration.
         *
         * @param {string} databaseName name of the database from which data has to be pulled.
         * @param {string} entityName name of the entity from which data has to be pulled.
         * @param {boolean} clearDataBeforePull if true, then data of the entity will be deleted.
         * @returns {object} a promise.
         */
        this.pullEntityData = function (databaseName, entityName, clearDataBeforePull) {
            var defer = $q.defer();
            getDb(function (db) {
                pullProcessManager.start(defer.promise);
                return copyDataFromRemoteDBToLocalDB(db, entityName, clearDataBeforePull, defer.promise);
            }).then(defer.resolve, defer.reject, defer.notify);
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBDataPullService#pullDbData
         * @methodOf wm.plugins.database.services.$LocalDBDataPullService
         *
         *
         * @description
         * Clears (based on parameter) and pulls data ('BUNDLED' data based on parameter) of the given database from server using
         * the configured rules in offline configuration.
         *
         * @param {string} databaseName name of the database from which data has to be pulled.
         * @param {boolean} clearDataBeforePull if true, then data in the database will be deleted.
         * @returns {object} a promise.
         */
        this.pullDbData = function (databaseName, clearDataBeforePull) {
            var defer = $q.defer();
            getDb(function (db) {
                pullProcessManager.start(defer.promise);
                return pullDbData(db, clearDataBeforePull, defer.promise);
            }).then(defer.resolve, defer.reject, defer.notify);
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBDataPullService#pullAllDbData
         * @methodOf wm.plugins.database.services.$LocalDBDataPullService
         *
         *
         * @description
         * Clears (based on parameter) and pulls data ('BUNDLED' data based on parameter) from server using the
         * configured rules in offline configuration.
         *
         * @param {boolean} clearDataBeforePull if true, then data (other than 'BUNDLED') in the database will be deleted.
         * @returns {object} a promise.
         */
        this.pullAllDbData = function (clearDataBeforePull) {
            var defer = $q.defer(),
                result = {
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0,
                    'inProgress' : true,
                    'pullInfo' : {
                        'databases' : [],
                        'totalRecordsToPull' : 0,
                        'totalPulledRecordCount' : 0,
                        'startTime' : new Date(),
                        'endTime' : new Date()
                    }
                };
            LocalDBManager.loadDatabases()
                .then(function (databases) {
                    var dataPullPromises = _.chain(databases).filter(function (db) {
                        return !db.schema.isInternal;
                    }).map(function (db) {
                        pullProcessManager.start(defer.promise);
                        return pullDbData(db, clearDataBeforePull, defer.promise)
                            .then(null, null, function (data) {
                                var i = _.findIndex(result.pullInfo.databases, {'name' : data.name});
                                if (i >= 0) {
                                    result.pullInfo.databases[i] = data;
                                } else {
                                    result.pullInfo.databases.push(data);
                                }
                                result.totalTaskCount = _.reduce(result.pullInfo.databases, function (sum, dbPullInfo) {
                                    return sum + dbPullInfo.totalTaskCount;
                                }, 0);
                                result.completedTaskCount = _.reduce(result.pullInfo.databases, function (sum, dbPullInfo) {
                                    return sum + dbPullInfo.completedTaskCount;
                                }, 0);
                                result.pullInfo.totalPulledRecordCount = _.reduce(result.pullInfo.databases, function (sum, dbPullInfo) {
                                    return sum + dbPullInfo.pulledRecordCount;
                                }, 0);
                                result.pullInfo.totalRecordsToPull = _.reduce(result.pullInfo.databases, function (sum, dbPullInfo) {
                                    return sum + dbPullInfo.totalRecordsToPull;
                                }, 0);
                                defer.notify(result);
                            });
                    }).value();
                    return $q.all(dataPullPromises);
                }).then(function () {
                    result.pullInfo.endTime = new Date();
                    result.inProgress = false;
                    LocalKeyValueService.put(LAST_PULL_INFO_KEY, result.pullInfo);
                    defer.resolve(result);
                }, function () {
                    defer.reject();
                });
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBDataPullService#getLastPullInfo
         * @methodOf wm.plugins.database.services.$LocalDBDataPullService
         * @returns {object} that has total no of records fetched, start and end timestamps of last successful pull
         * of data from remote server.
         */
        this.getLastPullInfo = getLastPullInfo;

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBDataPullService#cancel
         * @methodOf wm.plugins.database.services.$LocalDBDataPullService
         * @description
         * Tries to cancel the corresponding pull process that gave the given promise.
         * @param {object} promise promise to cancel
         * @returns {object} A promise that is resolved when the given promise is cancelled.
         */
        this.cancel = function (promise) {
            return pullProcessManager.abort(promise);
        };
    }];