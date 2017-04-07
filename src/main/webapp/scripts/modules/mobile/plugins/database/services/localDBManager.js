/*global wm, WM, _, window, moment*/
/*jslint sub: true, unparam:true*/

/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBManager
 * @description
 * The 'wm.plugins.database.services.$LocalDBManager' manages local Database.
 */
wm.plugins.database.services.LocalDBManager = [
    '$cordovaFile',
    '$cordovaNetwork',
    '$cordovaSQLite',
    '$q',
    '$rootScope',
    'BaseService',
    'DatabaseService',
    'DeviceFileService',
    'LocalKeyValueService',
    'LocalDBStoreFactory',
    'OFFLINE_WAVEMAKER_DATABASE_SCHEMA',
    'SecurityService',
    '$timeout',
    'Utils',
    function ($cordovaFile,
              $cordovaNetwork,
              $cordovaSQLite,
              $q,
              $rootScope,
              BaseService,
              DatabaseService,
              DeviceFileService,
              LocalKeyValueService,
              LocalDBStoreFactory,
              OFFLINE_WAVEMAKER_DATABASE_SCHEMA,
              SecurityService,
              $timeout,
              Utils) {
        'use strict';
        var META_LOCATION = 'www/metadata/app',
            cordova = window.cordova,
            dbInstallParentDirectory,
            dbInstallDirectory,
            dbInstallDirectoryName,
            databases,
            connectivityChecker,
            lastPullInfoKey = 'localDBManager.lastPullInfo',
            systemProperties;
        systemProperties = {
            'USER_ID' : {
                'name' : 'USER_ID',
                'value' : function () {
                    var defer = $q.defer();
                    SecurityService.getUserId(defer.resolve, defer.reject);
                    return defer.promise;
                }
            },
            'USER_NAME' : {
                'name' : 'USER_NAME',
                'value' : function () {
                    var defer = $q.defer();
                    SecurityService.getUserName(defer.resolve, defer.reject);
                    return defer.promise;
                }
            },
            'DATE_TIME' : {
                'name' : 'DATE_TIME',
                'value' : function () {
                    return moment().format('YYYY-MM-DDThh:mm:ss');
                }
            },
            'DATE' : {
                'name' : 'CURRENT_DATE',
                'value' : function () {
                    return moment().format('YYYY-MM-DD');
                }
            },
            'TIME' : {
                'name' : 'TIME',
                'value' : function () {
                    return moment().format('hh:mm:ss');
                }
            }
        };
        if (cordova) {
            if (Utils.isIOS()) {
                dbInstallDirectoryName = 'LocalDatabase';
                dbInstallParentDirectory = cordova.file.applicationStorageDirectory +  'Library/';
            } else {
                dbInstallDirectoryName = 'databases';
                dbInstallParentDirectory = cordova.file.applicationStorageDirectory;
            }
            dbInstallDirectory = dbInstallParentDirectory + dbInstallDirectoryName;
        }

        //Picks essential details from the given schema.
        function compactEntitySchema(schema, entity, transformedSchemas) {
            var reqEntity = transformedSchemas[entity['entityName']];
            _.assign(reqEntity, {
                'entityName' : entity['entityName'],
                'name' : entity['name'],
                'columns' : []
            });
            _.forEach(entity.columns, function (col) {
                reqEntity.columns.push({
                    'name' : col['name'],
                    'fieldName' : col['fieldName'],
                    'generatorType' : col['generatorType'],
                    'sqlType' : col['sqlType'],
                    'primaryKey' : col['primaryKey']
                });
            });
            _.forEach(entity.relations, function (r) {
                var targetEntitySchema, targetEntity, col, sourceColumn, mapping;
                if (r.cardinality === 'ManyToOne' || r.cardinality === 'OneToOne') {
                    targetEntity = _.find(schema.tables, function (t) {
                        return t.name === r.targetTable;
                    });
                    mapping = r.mappings[0];
                    if (targetEntity) {
                        targetEntity = targetEntity.entityName;
                        sourceColumn = mapping.sourceColumn;
                        col = _.find(reqEntity.columns, function (column) {
                            return column.name === sourceColumn;
                        });
                        targetEntitySchema = _.find(schema.tables, function (table) {
                            return table.name === r.targetTable;
                        });
                        col.sourceFieldName = r.fieldName;
                        col.targetEntity = targetEntity;
                        col.targetTable = r.targetTable;
                        col.targetColumn = mapping.targetColumn;
                        col.targetFieldName = _.find(targetEntitySchema.columns, function (column) {
                            return column.name === mapping.targetColumn;
                        }).fieldName;
                        col.dataMapper = _.chain(targetEntitySchema.columns).keyBy(function (childCol) {
                            return col.sourceFieldName + '.' + childCol.fieldName;
                        }).mapValues(function (childCol) {
                            return {
                                'name' : childCol.name,
                                'fieldName' : childCol.fieldName
                            };
                        }).value();
                        col.targetPath = col.sourceFieldName + '.' + col.targetFieldName;
                    }
                }
            });
            return reqEntity;
        }

        //Loads necessary details of remote schema
        function compactSchema(schema) {
            var transformedSchemas = {};
            _.forEach(schema.tables, function (entitySchema) {
                transformedSchemas[entitySchema.entityName] = {};
            });
            _.forEach(schema.tables, function (entitySchema) {
                compactEntitySchema(schema, entitySchema, transformedSchemas);
            });
            return {
                'name' : schema.name,
                'entities' : transformedSchemas
            };
        }

        //Loads necessary details of queries
        function compactQueries(queriesByDB) {
            var queries = {};
            _.forEach(queriesByDB.queries, function (queryData) {
                var query, params;
                if (queryData.nativeSql && !queryData.update) {
                    query = queryData.queryString;
                    params = _.map(query.match(/:[a-zA-Z0-9]+\s?/g), function (p) {
                        var paramObj;
                        p = _.trim(p.substring(1));
                        paramObj = _.find(queryData.parameters, {'name' : p});
                        return {
                            'name' : paramObj.name,
                            'type' : paramObj.type,
                            'variableType' : paramObj.variableType
                        };
                    });
                    queries[queryData.name] = {
                        name: queryData.name,
                        query: query.replace(/:[a-zA-Z0-9]+\s?/g, '? '),
                        params: params,
                        response : {
                            properties: _.map(queryData.response.properties, function (p) {
                                p.nameInUpperCase = p.name.toUpperCase();
                                return p;
                            })
                        }
                    };
                }
            });
            return {
                'name' : queriesByDB.name,
                'queries' : queries
            };
        }

        /**
         * Searches for the files with given regex in 'www/metadata/app'and returns an array that contains the JSON
         * content present in each file.
         *
         * @param {string} fileNameRegex regex pattern to search for files.
         * @returns {*} A promise that is resolved with an array
         */
        function getMetaInfo(fileNameRegex) {
            var folder = cordova.file.applicationDirectory + META_LOCATION;
            return DeviceFileService.listFiles(folder, fileNameRegex)
                .then(function (files) {
                    return $q.all(_.map(files, function (f) {
                        return $cordovaFile.readAsText(folder, f.name)
                            .then(JSON.parse);
                    }));
                });
        }

        /**
         * Loads local database schemas from *_data_model.json.
         *
         * @returns {*} A promise that is resolved with metadata.
         */
        function loadDBSchemas() {
            return getMetaInfo(/.+_dataModel\.json$/)
                .then(function (schemas) {
                    var metadata = {};
                    schemas = _.isArray(schemas) ? schemas : [schemas];
                    schemas.push(OFFLINE_WAVEMAKER_DATABASE_SCHEMA);
                    schemas = _.map(schemas, compactSchema);
                    _.forEach(schemas, function (schema) {
                        metadata[schema.name] = {
                            schema : schema
                        };
                    });
                    return metadata;
                });
        }

        /**
         * Load named queries from *_query.json.
         *
         * @param {*} metadata
         * @returns {*} A promise that is resolved with metadata
         */
        function loadNamedQueries(metadata) {
            return getMetaInfo(/.+_query\.json$/)
                .then(function (queriesByDBs) {
                    queriesByDBs = _.isArray(queriesByDBs) ? queriesByDBs : [queriesByDBs];

                    queriesByDBs = _.chain(queriesByDBs)
                                        .map(compactQueries)
                                        .filter('name').value();

                    _.forEach(queriesByDBs, function (queriesByDB) {
                        var queries = {};
                        _.forEach(queriesByDB.queries, function (query) {
                            queries[query.name] = query;
                        });
                        metadata[queriesByDB.name].queries = queries;
                    });
                    return metadata;
                });
        }

        /**
         * Load offline configuration from *_offline.json.
         *
         * @param {*} metadata
         * @returns {*} A promise that is resolved with metadata
         */
        function loadOfflineConfig(metadata) {
            return getMetaInfo(/.+_offline\.json$/)
                .then(function (configs) {
                    _.forEach(configs, function (config) {
                        _.forEach(config.entities, function (entityConfig) {
                            var schema = _.find(metadata[config.name].schema.entities, function (entitySchema) {
                                return entitySchema.name === entityConfig.name;
                            });
                            _.assignIn(schema, entityConfig);
                        });
                    });
                    return metadata;
                });
        }

        /**
         * Iterates entities that belong to remote schema and calls callback for each entity. Callback will be called
         * with two arguments 1) database and 2) entity schema.
         *
         * @param {Function} callBack a function to call for every entity
         */
        function iterateExternalEntities(callBack) {
            var exit = false;
            _.forEach(databases, function (database) {
                if (database.schema.name !== 'wavemaker') {
                    _.forEach(database.schema.entities, function (entity) {
                        if (callBack(database, entity) === false) {
                            exit = true;
                            return false;
                        }
                    });
                    return !exit;
                }
            });
        }

        /**
         * A promise based implementation to pull data based on the given params
         *
         * @param dataModelName
         * @param entitySchema
         * @param pageSize
         * @returns {*} a promise that is resolved with the results.
         */
        function pullDataFromServer(dataModelName, entitySchema, pageSize) {
            var defer = $q.defer(), filter, params;
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
                    onlyOnline: true
                };
                DatabaseService.searchTableData(params, defer.resolve, defer.reject);
            } else {
                defer.reject();
            }
            return defer.promise;
        }

        /**
         * return an object with only one function that checks whether connection be made
         * to the remote server.
         *
         * @returns {{check: function}}
         */
        function createConnectivityChecker() {
            var datamodelName, entitySchema;
            iterateExternalEntities(function (database, eSchema) {
                if (eSchema.syncType === 'APP_START') {
                    datamodelName = database.schema.name;
                    entitySchema = eSchema;
                    return false;
                }
            });
            return {
                "check" : function () {
                    var defer = $q.defer();
                    if ($cordovaNetwork.isOnline()) {
                        if (datamodelName) {
                            return pullDataFromServer(datamodelName, entitySchema, 1);
                        }
                        defer.resolve();
                    } else {
                        defer.reject();
                    }
                    return defer.promise;
                }
            };
        }

        /**
         * Checks whether server connection can be made by sending a database request.
         *
         * @returns {*} a promise that is resolved when connection attempt is successful..
         */
        function canConnectToServer() {
            connectivityChecker = connectivityChecker || createConnectivityChecker();
            return connectivityChecker.check();
        }

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#pullData
         * @methodOf wm.plugins.database.services.$LocalDBManager
         *
         *
         * @description
         * Clears and pulls data (other than 'BUNDLED') from server using the configured rules in offline configuration.
         * Before clearing data, it is checked whether connection can be made to server.
         *
         * @param {boolean} clear if true, then data (other than 'BUNDLED') in the database will be deleted.
         * @returns {object} a promise.
         */
        this.pullData = function (clear) {
            var defer = $q.defer(),
                data = {
                    'completedTaskCount' : 0,
                    'totalTaskCount' : 0,
                    'inProgress' : true
                },
                pullInfo = {
                    'databases' : [],
                    'totalPulledRecordCount' : 0
                };
            SecurityService.onUserLogin()
                .then(canConnectToServer)
                .then(function () {
                    if (clear) {
                        // clears all data other than BUNDLED data
                        var promises = [];
                        iterateExternalEntities(function (database, entity) {
                            if (entity.syncType !== 'BUNDLED') {
                                promises.push(database.stores[entity.entityName].clear());
                            }
                        });
                        return $q.all(promises);
                    }
                })
                .then(function () {
                    // Pull data
                    var promises = [];
                    pullInfo.startTime = new Date();
                    iterateExternalEntities(function (database, eSchema) {
                        if (eSchema.syncType === 'APP_START') {
                            promises.push(pullDataFromServer(database.schema.name, eSchema).then(function (response) {
                                var pullDatabaseInfo = _.find(pullInfo.databases, {'name' : database.schema.name});
                                if (!pullDatabaseInfo) {
                                    pullDatabaseInfo = {
                                        'name' : database.schema.name,
                                        'entities' : [],
                                        'pulledRecordCount' : 0
                                    };
                                    pullInfo.databases.push(pullDatabaseInfo);
                                }
                                pullDatabaseInfo.entities.push({
                                    'entityName' : eSchema.entityName,
                                    'pulledRecordCount' : response.totalElements
                                });
                                pullInfo.totalPulledRecordCount += response.totalElements;
                                data.completedTaskCount++;
                                defer.notify(data);
                            }));
                        }
                    });
                    data.totalTaskCount = promises.length;
                    return $q.all(promises);
                }).then(function () {
                    //after successful pull, store metrics and resolve the promise.
                    pullInfo.endTime = new Date();
                    _.forEach(pullInfo.databases, function (database) {
                        database.pulledRecordCount = _.reduce(database.entities, function (sum, entity) {
                            return sum + entity.pulledRecordCount;
                        }, 0);
                    });
                    LocalKeyValueService.put(lastPullInfoKey, pullInfo);
                    data.inProgress = false;
                    defer.resolve(data);
                }, function () {
                    data.inProgress = false;
                    defer.reject(data);
                });
            return defer.promise;
        };

        /**
         * Deletes any existing databases and copies the databases that are packaged with the app. After db creation,
         * appInfo is saved.
         *
         * @param appInfo
         * @param currentBuildTime
         * @returns {*}
         */
        function cleanAndCopyDatabases(appInfo, currentBuildTime) {
            var databasesCreated = $q.defer(),
                dbSeedFolder = cordova.file.applicationDirectory + META_LOCATION;
            $cordovaFile.createDir(dbInstallParentDirectory, dbInstallDirectoryName, false).finally(function () {
                DeviceFileService.listFiles(dbInstallDirectory, /.+\.db$/).then(function (files) {
                    if (files && files.length > 0) {
                        return $q.all(_.map(files, function (f) {
                            if (f.name !== 'wavemaker.db') {
                                return $cordovaFile.removeFile(dbInstallDirectory, f.name);
                            }
                        }));
                    }
                }).then(function () {
                    return DeviceFileService.listFiles(dbSeedFolder, /.+\.db$/)
                        .then(function (files) {
                            var filesCopied = $q.defer();
                            if (files && files.length > 0) {
                                $cordovaFile.createDir(dbInstallParentDirectory, dbInstallDirectoryName, false)
                                    .finally(function () {
                                        $q.all(_.map(files, function (f) {
                                            return $cordovaFile.copyFile(dbSeedFolder, f.name, dbInstallDirectory, f.name);
                                        })).then(filesCopied.resolve);
                                    });
                            } else {
                                filesCopied.resolve();
                            }
                            return filesCopied.promise;
                        });
                }).then(function () {
                    if (!appInfo) {
                        appInfo = {};
                    }
                    appInfo.createdOn = currentBuildTime || _.now();
                    return $cordovaFile.writeFile(cordova.file.dataDirectory, "app.info", JSON.stringify(appInfo), true)
                        .then(databasesCreated.resolve);
                }).catch(databasesCreated.reject);
            });
            return databasesCreated.promise;
        }

        /**
         * When app is opened for first time, then old databases are removed and new databases are created using
         * bundled databases.
         *
         * @returns {*}
         */
        function setupDatabases() {
            var currentBuildTime;
            return $cordovaFile.readAsText(cordova.file.applicationDirectory + 'www', "config.json")
                .then(function (appConfig) {
                    currentBuildTime = JSON.parse(appConfig).buildTime;
                    return $cordovaFile.readAsText(cordova.file.dataDirectory, "app.info")
                        .then(function (appInfo) {
                            appInfo = JSON.parse(appInfo);
                            if (appInfo.createdOn < currentBuildTime) {
                                return cleanAndCopyDatabases(appInfo, currentBuildTime);
                            }
                        }, cleanAndCopyDatabases.bind(undefined, null, currentBuildTime));
                });
        }

        function openDatabase(dbMetadata) {
            var deferredDBCall = $q.defer(),
                storePromises = [],
                database = _.extend({}, dbMetadata);
            database.connection = window.sqlitePlugin.openDatabase({
                name: database.schema.name + '.db',
                location: 'default'
            }, deferredDBCall.resolve, deferredDBCall.reject);
            database.stores = {};
            return deferredDBCall.promise.then(function () {
                _.forEach(database.schema.entities, function (entitySchema) {
                    storePromises.push(LocalDBStoreFactory.createStore(database.connection, entitySchema));
                });
                return $q.all(storePromises).then(function (stores) {
                    _.forEach(stores, function (store) {
                        database.stores[store.schema.entityName] = store;
                    });
                    return database;
                });
            });
        }

        function closeDatabases() {
            var closePromises = [];
            _.forEach(databases, function (database) {
                var defer = $q.defer();
                database.connection.close(defer.resolve, defer.reject);
                closePromises.push(defer.promise);
            });
            return $q.all(closePromises);
        }

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#canConnectToServer
         * @methodOf wm.plugins.database.services.$LocalDBManager
         *
         *
         * @description
         * Checks whether the remote server can be connected. A sample request will be sent to the server to check
         * network connectivity.
         *
         * @returns {object} a promise.
         */
        this.canConnectToServer = canConnectToServer;

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#close
         * @methodOf wm.plugins.database.services.$LocalDBManager
         *
         *
         * @description
         * Closes all databases.
         *
         * @returns {object} a promise.
         */
        this.close = function () {
            var defer = $q.defer();
            //Before closing databases, give some time for the pending transactions (if any).
            $timeout(function () {
                closeDatabases().then(defer.resolve, defer.reject);
            }, 1000);
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#loadDatabases
         * @methodOf wm.plugins.database.services.$LocalDBManager
         *
         *
         * @description
         * Loads all necessary databases.
         *
         * @returns {object} a promise.
         */
        this.loadDatabases = function () {
            var d = $q.defer(),
                self = this;
            if (databases) {
                d.resolve(databases);
            } else {
                databases = {};
                setupDatabases()
                    .then(loadDBSchemas)
                    .then(loadNamedQueries)
                    .then(loadOfflineConfig)
                    .then(function (metadata) {
                        var dbPromises = [];
                        _.forEach(metadata, function (dbMetadata) {
                            dbPromises.push(openDatabase(dbMetadata).then(function (database) {
                                databases[dbMetadata.schema.name] = database;
                            }));
                        });
                        $q.all(dbPromises).then(function () {
                            LocalKeyValueService.init(self.getStore('wavemaker', 'key-value'));
                            d.resolve(databases);
                        });
                    });
            }
            return d.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#executeNamedQuery
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @description
         * Executes a named query.
         *
         * @param {string} dbName name of database on which the named query has to be run
         * @param {string} queryName name of the query to execute
         * @param {object} params parameters required for query.
         * @returns {object} a promise.
         */
        this.executeNamedQuery = function (dbName, queryName, params) {
            var queryData, paramPromises, self = this;
            if (!databases[dbName] || !databases[dbName].queries[queryName]) {
                return $q.reject('Query by name \'' + queryName + '\'Not Found');
            }
            queryData = databases[dbName].queries[queryName];
            paramPromises = _.chain(queryData.params).filter(function (p) {
                return p.variableType !== 'PROMPT';
            }).forEach(function (p) {
                var paramValue = systemProperties[p.variableType].value(p.name, params);
                return $q.when(paramValue, function (v) {
                    params[p.name] = v;
                });
            }).value();
            return $q.all(paramPromises).then(function () {
                params = _.map(queryData.params, function (p) {
                    return params[p.name];
                });
                return self.executeSQLQuery(dbName, queryData.query, params).then(function (result) {
                    var firstRow,
                        needTransform;
                    if (!_.isEmpty(result.rows)) {
                        firstRow = result.rows[0];
                        needTransform = _.find(queryData.response.properties, function (p) {
                            return !firstRow.hasOwnProperty(p.fieldName);
                        });
                        if (!_.isUndefined(needTransform)) {
                            result.rows = _.map(result.rows, function (row) {
                                var transformedRow = {},
                                    rowWithUpperKeys = {};
                                //This is to make search for data as case-insensitive
                                _.forEach(row, function (v, k) {
                                    rowWithUpperKeys[k.toUpperCase()] = v;
                                });
                                _.forEach(queryData.response.properties, function (p) {
                                    transformedRow[p.name] = row[p.name];
                                    transformedRow[p.fieldName] = row[p.fieldName] || rowWithUpperKeys[p.nameInUpperCase];
                                });
                                return transformedRow;
                            });
                        }
                    }
                    return result;
                });
            });
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#executeSQLQuery
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @description
         * Executes a sql query.
         *
         * @param {string} dbName name of database on which the named query has to be run
         * @param {string} sql name of the query to execute
         * @param {object} params parameters required for query.
         * @returns {object} a promise.
         */
        this.executeSQLQuery = function (dbName, sql, params) {
            var db = databases[dbName];
            if (db) {
                return $cordovaSQLite.execute(db.connection, sql, params).then(function (result) {
                    var i,
                        data = [],
                        rows = result.rows;
                    for (i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    return {
                        'rowsAffected'  : result.rowsAffected,
                        'rows'          : data
                    };
                });
            }
            return $q.reject('No Database with name ' + dbName + 'found');
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#getStore
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @param {string} dataModelName Name name of the data model
         * @param {string} entityName Name of the entity
         * @returns {object} the database store.
         */
        this.getStore = function (dataModelName, entityName) {
            if (databases[dataModelName]) {
                return databases[dataModelName].stores[entityName];
            }
            return null;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#isBundled
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @param {string} dataModelName Name name of the data model
         * @param {string} entityName Name of the entity
         * @returns {boolean} returns true, if the given entity's data is bundled along with application installer.
         */
        this.isBundled = function (dataModelName, entityName) {
            var store = this.getStore(dataModelName, entityName);
            if (store) {
                return store.schema.syncType === 'BUNDLED';
            }
            return false;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#clearAll
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @description
         * clear data in all databases.
         *
         * @param {array} except array of all datamodels that should not be cleared.
         * @returns {object} a promise that is resolved when data is cleared.
         */
        this.clearAll = function (except) {
            var promises = [];
            _.forEach(databases, function (database) {
                if (!_.includes(except, database.schema.name)) {
                    _.forEach(database.stores, function (store) {
                        promises.push(store.clear());
                    });
                }
            });
            return $q.all(promises);
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#getLastPullInfo
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @returns {object} that have total no of records fetched, start and end timestamps of last successful pull
         * of data from remote server.
         */
        this.getLastPullInfo = function () {
            return LocalKeyValueService.get(lastPullInfoKey).then(function (info) {
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