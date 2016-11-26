/*global wm, WM, _, cordova*/
/*jslint sub: true, unparam:true*/

/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBManager
 * @description
 * The 'wm.plugins.database.services.$LocalDBManager' manages local Database.
 */
wm.plugins.database.services.LocalDBManager = [
    '$cordovaFile',
    '$cordovaSQLite',
    '$q',
    '$rootScope',
    'BaseService',
    'DatabaseService',
    'DeviceFileService',
    'LocalDBStoreFactory',
    'OFFLINE_WAVEMAKER_DATABASE_SCHEMA',
    function ($cordovaFile, $cordovaSQLite, $q, $rootScope, BaseService, DatabaseService, DeviceFileService, LocalDBStoreFactory,  OFFLINE_WAVEMAKER_DATABASE_SCHEMA) {
        'use strict';
        var META_LOCATION = 'www/metadata/app',
            databases;

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
                    query = queryData.query;
                    params = _.map(query.match(/:[a-zA-Z0-9]+\s?/g), function (p) {
                        return _.trim(p.substring(1));
                    });
                    queries[queryData.name] = {
                        name: queryData.name,
                        query: query.replace(/:[a-zA-Z0-9]+\s?/g, '? '),
                        params: params
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
                    queriesByDBs = _.map(queriesByDBs, compactQueries);
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
         * Checks whether server connection can be made by sending a database request.
         *
         * @returns {*} a promise that is resolved when connection attempt is successful..
         */
        function canConnectToServer() {
            var datamodelName, entitySchema;
            iterateExternalEntities(function (database, eSchema) {
                if (eSchema.syncType === 'APP_START') {
                    datamodelName = database.schema.name;
                    entitySchema = eSchema;
                    return false;
                }
            });
            return pullDataFromServer(datamodelName, entitySchema, 1);
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
         * @returns {object} a promise.
         */
        this.pullData = function () {
            return canConnectToServer()
                .then(function () {
                    // clears all data other than BUNDLED data
                    var promises = [];
                    iterateExternalEntities(function (database, entity) {
                        if (entity.syncType !== 'BUNDLED') {
                            promises.push(database.stores[entity.entityName].clear());
                        }
                    });
                    return $q.all(promises);
                })
                .then(function () {
                    // Pull data
                    var promises = [];
                    iterateExternalEntities(function (database, eSchema) {
                        if (eSchema.syncType === 'APP_START') {
                            promises.push(pullDataFromServer(database.schema.name, eSchema));
                        }
                    });
                    return $q.all(promises);
                });
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
                dbSeedFolder = cordova.file.applicationDirectory + META_LOCATION,
                dbInstallPath = cordova.file.dataDirectory + 'databases';
            $cordovaFile.createDir(cordova.file.dataDirectory, "databases", false).finally(function () {
                DeviceFileService.listFiles(dbInstallPath, /.+\.db$/).then(function (files) {
                    if (files && files.length > 0) {
                        return $q.all(_.map(files, function (f) {
                            if (f.name !== 'wavemaker') {
                                return $cordovaFile.removeFile(dbInstallPath, f.name);
                            }
                        }));
                    }
                }).then(function () {
                    return DeviceFileService.listFiles(dbSeedFolder, /.+\.db$/)
                        .then(function (files) {
                            var filesCopied = $q.defer();
                            if (files && files.length > 0) {
                                $cordovaFile.createDir(cordova.file.dataDirectory, "databases", false)
                                    .finally(function () {
                                        $q.all(_.map(files, function (f) {
                                            return $cordovaFile.copyFile(dbSeedFolder, f.name, dbInstallPath, f.name);
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
            var d = $q.defer();
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
                            var dbPromise,
                                storePromises = [],
                                database = _.extend({}, dbMetadata);
                            database.connection = $cordovaSQLite.openDB({
                                name: database.schema.name,
                                location: 'default'
                            });
                            database.stores = {};
                            _.forEach(database.schema.entities, function (entitySchema) {
                                storePromises.push(LocalDBStoreFactory.createStore(database.connection, entitySchema));
                            });
                            dbPromise = $q.all(storePromises).then(function (stores) {
                                _.forEach(stores, function (store) {
                                    database.stores[store.schema.entityName] = store;
                                });
                                databases[database.schema.name] = database;
                            });
                            dbPromises.push(dbPromise);
                        });
                        $q.all(dbPromises).then(function (dbs) {
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
            var defer, queryData;
            if (databases[dbName]) {
                queryData = databases[dbName].queries[queryName];
                if (queryData) {
                    if (params && queryData.params) {
                        params = _.map(queryData.params, function (p) {
                            return params[p];
                        });
                    }
                    return this.executeSQLQuery(dbName, queryData.query, params);
                }
            }
            defer = $q.defer();
            defer.reject('Query by name \'' + queryName + '\'Not Found');
            return defer.promise;
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
    }];