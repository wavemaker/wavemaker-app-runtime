/*global wm, WM, _, window, moment*/
/*jslint sub: true, unparam:true*/

/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBDataPullService
 * @description
 * The 'wm.plugins.database.services.$LocalDBDataPullService' has API to pull data from remote Server to local Database.
 */
wm.plugins.database.services.LocalDBDataPullService = [
    '$q',
    '$rootScope',
    'DatabaseService',
    'LocalDBManager',
    'LocalKeyValueService',
    function (
        $q,
        $rootScope,
        DatabaseService,
        LocalDBManager,
        LocalKeyValueService
    ) {
        'use strict';
        var LAST_PULL_INFO_KEY = 'localDBManager.lastPullInfo';

        function getDb(dbName) {
            return LocalDBManager.loadDatabases()
                .then(function (databases) {
                    var db = _.find(databases, {'name' : dbName});
                    return db || $q.reject('Local database (' + dbName + ') not found');
                });
        }

        /**
         * Pulls data of the given entity from remote server.
         * @param db
         * @param entityName
         * @param pageSize
         * @returns {*}
         */
        function pullEntityDataFromRemote(db, entityName, pageSize) {
            var defer = $q.defer(),
                filter,
                params,
                dataModelName = db.schema.name,
                entitySchema = db.schema.entities[entityName];
            if (dataModelName && entitySchema) {
                filter = _.chain(_.cloneDeep(entitySchema.syncOptions.filter))
                    .forEach(function (v) {
                        if (_.startsWith(v.attributeValue, "bind:")) {
                            v.attributeValue = $rootScope.$eval(v.attributeValue.replace('bind:', ''));
                        }
                    }).filter(function (v) {
                        return !_.isNil(v.attributeValue);
                    }).value();
                params = {
                    dataModelName: dataModelName,
                    entityName: entitySchema.entityName,
                    page: 1,
                    size: pageSize,
                    data: filter,
                    sort: entitySchema.syncOptions.orderBy,
                    onlyOnline: true,
                    skipLocalDB: true
                };
                DatabaseService.searchTableData(params, function (response) {
                    defer.resolve(response.content);
                }, defer.reject.bind(defer));
            } else {
                defer.reject('both data model name and entity name are required.');
            }
            return defer.promise;
        }

        /**
         *
         * @param db
         * @param entityName
         * @param maxNoOfRecords
         * @param clearDataBeforePull
         * @returns {*}
         */
        function copyDataFromRemoteDBToLocalDB(db, entityName, maxNoOfRecords, clearDataBeforePull) {
            var store = db.stores[entityName];
            return $q.resolve().then(function () {
                if (clearDataBeforePull) {
                    return store.clear();
                }
            }).then(function () {
                return pullEntityDataFromRemote(db, entityName, maxNoOfRecords);
            }).then(function (data) {
                return store.saveAll(data).then(function () {
                    return {
                        'entityName' : entityName,
                        'pulledRecordCount' : data ? data.length : 0
                    };
                });
            });
        }

        /**
         *
         * @param db
         * @param clearDataBeforePull
         * @param pullBundledData
         * @returns {*}
         */
        function pullDbData(db, clearDataBeforePull, pullBundledData) {
            var datamodelName = db.schema.name,
                pullPromises,
                result = {
                    'name' : db.schema.name,
                    'entities' : [],
                    'pulledRecordCount' : 0,
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0
                },
                defer = $q.defer();
            pullPromises = _.chain(db.schema.entities)
                .filter(function (entity) {
                    return pullBundledData || !LocalDBManager.isBundled(datamodelName, entity.entityName);
                }).map(function (entity) {
                    return copyDataFromRemoteDBToLocalDB(db, entity.entityName, null, clearDataBeforePull)
                        .then(function (info) {
                            result.completedTaskCount++;
                            defer.notify(result);
                            return info;
                        });
                }).value();
            result.totalTaskCount = pullPromises.length;
            defer.notify(result);
            $q.all(pullPromises).then(function (entitiesPullInfo) {
                var pulledRecordCount = _.reduce(entitiesPullInfo, function (sum, entityPullInfo) {
                    return sum + entityPullInfo.pulledRecordCount;
                }, 0);
                result.entities = entitiesPullInfo;
                result.pulledRecordCount = pulledRecordCount;
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
         * @param {number} maxNoOfRecords maximum number of records to pull.
         * @param {boolean} clearDataBeforePull if true, then data of the entity will be deleted.
         * @returns {object} a promise.
         */
        this.pullEntityData = function (databaseName, entityName, maxNoOfRecords, clearDataBeforePull) {
            return getDb(function (db) {
                return copyDataFromRemoteDBToLocalDB(db, entityName, maxNoOfRecords, clearDataBeforePull);
            });
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
         * @param {boolean} pullBundledData if true, then bundled data is pulled.
         * @returns {object} a promise.
         */
        this.pullDbData = function (databaseName, clearDataBeforePull, pullBundledData) {
            return getDb(function (db) {
                return pullDbData(db, clearDataBeforePull, pullBundledData);
            });
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
         * @param {boolean} pullBundledData if true, then bundled data is pulled.
         * @returns {object} a promise.
         */
        this.pullAllDbData = function (clearDataBeforePull, pullBundledData) {
            var defer = $q.defer(),
                result = {
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0,
                    'inProgress' : true,
                    'pullInfo' : {
                        'databases' : [],
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
                        return pullDbData(db, clearDataBeforePull, pullBundledData)
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
                                defer.notify(result);
                            });
                    }).value();
                    $q.all(dataPullPromises).then(function (databasesPullInfo) {
                        var totalPulledRecordCount = _.reduce(databasesPullInfo, function (sum, dbPullInfo) {
                            return sum + dbPullInfo.pulledRecordCount;
                        }, 0);
                        result.pullInfo.databases = databasesPullInfo;
                        result.pullInfo.totalPulledRecordCount = totalPulledRecordCount;
                        result.pullInfo.endTime = new Date();
                        result.inProgress = false;
                        LocalKeyValueService.put(LAST_PULL_INFO_KEY, result.pullInfo);
                        defer.resolve(result);
                    });
                }, defer.reject);
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBDataPullService#getLastPullInfo
         * @methodOf wm.plugins.database.services.$LocalDBDataPullService
         * @returns {object} that has total no of records fetched, start and end timestamps of last successful pull
         * of data from remote server.
         */
        this.getLastPullInfo = function () {
            return LocalKeyValueService.get(LAST_PULL_INFO_KEY).then(function (info) {
                if (_.isString(info.startTime)) {
                    info.startTime = new Date(info.startTime);
                }
                if (_.isString(info.endTime)) {
                    info.endTime = new Date(info.endTime);
                }
                return info;
            });
        };
    }];