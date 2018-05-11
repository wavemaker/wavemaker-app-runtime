/*global wm, WM, _, window, moment, Zeep*/
/*jslint sub: true, unparam:true*/

/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBManager
 * @description
 * The 'wm.plugins.database.services.$LocalDBManager' manages local Database.
 */
wm.plugins.database.services.LocalDBManager = [
    '$cordovaAppVersion',
    '$cordovaFile',
    '$cordovaSQLite',
    '$q',
    '$rootScope',
    'BaseService',
    'DatabaseService',
    'DeviceFileService',
    'LocalKeyValueService',
    'LocalDBStoreFactory',
    'OFFLINE_WAVEMAKER_DATABASE_SCHEMA',
    'NetworkService',
    'SecurityService',
    '$timeout',
    'Utils',
    function ($cordovaAppVersion,
              $cordovaFile,
              $cordovaSQLite,
              $q,
              $rootScope,
              BaseService,
              DatabaseService,
              DeviceFileService,
              LocalKeyValueService,
              LocalDBStoreFactory,
              OFFLINE_WAVEMAKER_DATABASE_SCHEMA,
              NetworkService,
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
            systemProperties,
            callbacks = [];
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

        /**
         *  returns store bound to the dataModelName and entityName.
         *
         * @param dataModelName
         * @param entityName
         * @returns {*}
         */
        function getStore(dataModelName, entityName) {
            if (databases[dataModelName]) {
                return databases[dataModelName].stores[entityName];
            }
            return null;
        }
        /**
         * Executes SQL query;
         * 
         * @param dbName
         * @param sql
         * @param params
         * @returns {*}
         */
        function executeSQLQuery(dbName, sql, params) {
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
        }

        /**
         * A sql query should not have space character in column/table names. To overcome that in sqlite, column name 
         * should be  surrounded by double quotes. If double quote is part of the column/table name, then it can be 
         * escaped by placing another double quote right after it. This function transforms the given string as per 
         * escaping rule.
         * @param name
         * @returns {string}
         */
        function escapeName(name) {
            if (name) {
                name = name.replace(/"/g, '""');
                return '"' + name + '"';
            }
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
                var defaultValue = col.columnValue ? col.columnValue.defaultValue : "",
                    type = col.sqlType;
                if (type === 'number' && !col.primaryKey) {
                    defaultValue = _.isEmpty(defaultValue) ? 0 : _.parseInt(defaultValue);
                } else if (type === 'boolean') {
                    defaultValue = _.isEmpty(defaultValue) ? null : (defaultValue === "true" ? 1 : 0);
                } else {
                    defaultValue = _.isEmpty(defaultValue) ? null : defaultValue;
                }
                reqEntity.columns.push({
                    'name' : col['name'],
                    'fieldName' : col['fieldName'],
                    'generatorType' : col['generatorType'],
                    'sqlType' : col['sqlType'],
                    'primaryKey' : col['primaryKey'],
                    'columnValue' : {
                        'defaultValue': defaultValue
                    }
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
                'isInternal' : schema.isInternal,
                'entities' : transformedSchemas
            };
        }

        //get the params of the query or procedure.
        function extractQueryParams(query) {
            var params, aliasParams;
            aliasParams = query.match(/[^"'\w\\]:\s*\w+\s*/g) || [];
            if (aliasParams.length) {
                params = aliasParams.map(
                    function (x) {
                        return (/[=|\W]/g.test(x)) ? x.replace(/\W/g, '').trim() : x.trim();
                    }
                );
            } else {
                params = null;
            }
            return params;
        }

        //Loads necessary details of queries
        function compactQueries(queriesByDB) {
            var queries = {};
            _.forEach(queriesByDB.queries, function (queryData) {
                var query, params;
                if (queryData.nativeSql && !queryData.update) {
                    query = queryData.queryString;
                    params = _.map(extractQueryParams(query), function (p) {
                        var paramObj = _.find(queryData.parameters, {'name' : p});
                        return {
                            'name' : paramObj.name,
                            'type' : paramObj.type,
                            'variableType' : paramObj.variableType
                        };
                    });
                    _.forEach(params, function (p) {
                        query = _.replace(query, ':' + p.name, '?');
                    });
                    queries[queryData.name] = {
                        name: queryData.name,
                        query: query,
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
         * Deletes any existing databases (except wavemaker db) and copies the databases that are packaged with the app.
         *
         * @returns {*}
         */
        function cleanAndCopyDatabases() {
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
                }).then(databasesCreated.resolve, databasesCreated.reject);
            });
            return databasesCreated.promise;
        }

        /**
         * Turns off foreign keys
         * @returns {*}
         */
        function disableForeignKeys() {
            return $q.all(_.map(databases, function (db) {
                return executeSQLQuery(db.schema.name, 'PRAGMA foreign_keys = OFF');
            }));
        }

        /**
         * Returns the timestamp when the seed db is created
         * @returns {*}
         */
        function getDBSeedCreationTime() {
            return $cordovaFile.readAsText(cordova.file.applicationDirectory + 'www', "config.json")
                .then(function (appConfig) {
                    return JSON.parse(appConfig).buildTime;
                });
        }

        /**
         * When app is opened for first time  after a fresh install or update, then old databases are removed and 
         * new databases are created using bundled databases.
         *
         * @returns {*} a promise that is resolved with true, if the databases are newly created or resolved with false
         * if existing databases are being used.
         */
        function setupDatabases() {
            var appInfo;
            return getDBSeedCreationTime()
                .then(function (dbSeedCreationTime) {
                    return $cordovaFile.readAsText(cordova.file.dataDirectory, "app.info")
                        .then(function (content) {
                            appInfo = JSON.parse(content);
                        }, WM.noop)
                        .then(function () {
                            if (!appInfo || appInfo.createdOn < dbSeedCreationTime) {
                                return cleanAndCopyDatabases().then(function () {
                                    appInfo = appInfo || {};
                                    appInfo.createdOn = dbSeedCreationTime || _.now();
                                    return $cordovaFile.writeFile(cordova.file.dataDirectory, "app.info", JSON.stringify(appInfo), true);
                                }).then(function () {
                                    return true;
                                });
                            }
                            return false;
                        });
                });
        }

        /**
         * SQLite does not support boolean data. Instead of using boolean values, data will be changed to 0 or 1.
         * If the value is 'true', then 1 is set as value. If value is not 1 nor null, then column value is set as 0.
         * @param dbName
         * @param tableName
         * @param colName
         * @returns {*}
         */
        function normalizeBooleanData(dbName, tableName, colName) {
            var trueTo1Query = "update " + escapeName(tableName) + " set " + escapeName(colName) + " = 1 "
                               +  " where " + escapeName(colName) + " = 'true'",
                exceptNullAnd1to0Query = "update " + escapeName(tableName) + " set " + escapeName(colName) + " = 0 "
                                + " where " + escapeName(colName) + " is not null and "  + escapeName(colName) + " != 1";
            return executeSQLQuery(dbName, trueTo1Query).then(function () {
                return executeSQLQuery(dbName, exceptNullAnd1to0Query);
            });
        }

        /**
         * Converts data to support SQLite.
         * @returns {*}
         */
        function normalizeData() {
            return $q.all(_.map(databases, function (database) {
                return $q.all(_.map(database.schema.entities, function (entitySchema) {
                    return $q.all(_.map(entitySchema.columns, function (column) {
                        if (column.sqlType === 'boolean') {
                            return normalizeBooleanData(database.schema.name, entitySchema.name, column.name);
                        }
                    }));
                }));
            }));
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
                database.connection.close(defer.resolve, defer.resolve);
                closePromises.push(defer.promise);
            });
            return $q.all(closePromises);
        }

        /**
         * Returns a promise that is resolved with application info such as packageName, appName, versionNumber, versionCode.
         * @returns {*}
         */
        function getAppInfo() {
            var appInfo = {};
            return $cordovaAppVersion.getPackageName()
                .then(function (packageName) {
                    appInfo.packageName = packageName;
                    return $cordovaAppVersion.getAppName();
                }).then(function (appName) {
                    appInfo.name = appName;
                    return $cordovaAppVersion.getVersionNumber();
                }).then(function (versionNumber) {
                    appInfo.versionNumber = versionNumber;
                    return $cordovaAppVersion.getVersionCode();
                }).then(function (versionCode) {
                    appInfo.versionCode = versionCode;
                    return appInfo;
                });
        }

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
                self = this,
                newDatabasesCreated;
            if (databases) {
                d.resolve(databases);
            } else {
                databases = {};
                setupDatabases()
                    .then(function (flag) {
                        newDatabasesCreated = flag;
                    })
                    .then(loadDBSchemas)
                    .then(loadNamedQueries)
                    .then(loadOfflineConfig)
                    .then(function (metadata) {
                        return $q.all(_.map(metadata, function (dbMetadata) {
                            return openDatabase(dbMetadata).then(function (database) {
                                databases[dbMetadata.schema.name] = database;
                            });
                        }));
                    }).then(function () {
                        LocalKeyValueService.init(self.getStore('wavemaker', 'key-value'));
                        if (newDatabasesCreated) {
                            normalizeData().then(function () {
                                return disableForeignKeys();
                            }).then(function () {
                                return getDBSeedCreationTime();
                            }).then(function (dbSeedCreationTime) {
                                //Invoke callbacks
                                var cbs = _.map(callbacks, "onDbCreate");
                                return Utils.executeDeferChain(cbs, [{
                                    'databases' : databases,
                                    'dbCreatedOn' : _.now(),
                                    'dbSeedCreatedOn' : dbSeedCreationTime
                                }]);
                            }).then(function () {
                                d.resolve(databases);
                            });
                        } else {
                            d.resolve(databases);
                        }
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
        this.executeSQLQuery = executeSQLQuery;

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#getStore
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @param {string} dataModelName Name name of the data model
         * @param {string} entityName Name of the entity
         * @returns {object} the database store.
         */
        this.getStore = getStore;

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
                return store.schema.pullConfig.pullType === 'BUNDLED';
            }
            return false;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#isOperationAllowed
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @param {string} dataModelName Name of the data model
         * @param {string} entityName Name of the entity
         * @param {string} operation Name of the operation (READ, INSERT, UPDATE, DELETE)
         * @returns {boolean} returns true, if the given operation can be performed as per configuration.
         */
        this.isOperationAllowed = function (dataModelName, entityName, operation) {
            var store = this.getStore(dataModelName, entityName);
            if (!store) {
                return false;
            }
            if (operation === 'READ') {
                return store.schema.pushConfig.readEnabled;
            }
            if (operation === 'INSERT') {
                return store.schema.pushConfig.insertEnabled;
            }
            if (operation === 'UPDATE') {
                return store.schema.pushConfig.updateEnabled;
            }
            if (operation === 'DELETE') {
                return store.schema.pushConfig.deleteEnabled;
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
         * @name wm.plugins.database.services.$LocalDBManager#exportDB
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @description
         * This function will export the databases in a zip format.
         *
         * @returns {object} a promise that is resolved when zip is created.
         */
        this.exportDB = function () {
            var folderToExport = 'offline_temp_' + _.now(),
                folderToExportFullPath = cordova.file.cacheDirectory + folderToExport + '/',
                zipDirectory,
                zipFileName = '_offline_data.zip',
                defer = $q.defer(),
                metaInfo = {};
            if (Utils.isIOS()) {
                //In IOS, save zip to documents directory so that user can export the file from IOS devices using iTUNES.
                zipDirectory = cordova.file.documentsDirectory;
            } else {
                //In Android, save zip to download directory.
                zipDirectory = cordova.file.externalRootDirectory + 'Download/';
            }
            //Create a temporary folder to copy all the content to export
            $cordovaFile.createDir(cordova.file.cacheDirectory, folderToExport)
                .then(function () {
                    //Copy databases to temporary folder for export
                    return $cordovaFile.copyDir(dbInstallParentDirectory, dbInstallDirectoryName, folderToExportFullPath, 'databases')
                        .then(function () {
                            //Prepare meta info to identify the zip and other info
                            return getAppInfo();
                        }).then(function (appInfo) {
                            metaInfo.app = appInfo;
                            if (Utils.isIOS()) {
                                metaInfo.OS = 'IOS';
                            } else if (Utils.isAndroid()) {
                                metaInfo.OS = 'ANDROID';
                            }
                            metaInfo.createdOn = _.now();
                            return metaInfo;
                        }).then(function () {
                            // Invoke preExport callbacks
                            var cbs = _.map(callbacks, "preExport");
                            return Utils.executeDeferChain(cbs, [folderToExportFullPath, metaInfo]);
                        }).then(function () {
                            // Write meta data to META.json
                            return $cordovaFile.writeFile(folderToExportFullPath, "META.json", JSON.stringify(metaInfo));
                        });
                }).then(function () {
                    // Prepare name to use for the zip.
                    var appName = metaInfo.app.name;
                    appName = appName.replace(/\s+/g, '_');
                    return DeviceFileService.newFileName(zipDirectory, appName + zipFileName)
                        .then(function (fileName) {
                            // Zip the temporary folder for export
                            var zipDefer = $q.defer();
                            Zeep.zip({
                                from : folderToExportFullPath,
                                to   : zipDirectory + fileName
                            }, function () {
                                zipDefer.resolve(zipDirectory + fileName);
                            }, zipDefer.reject.bind(zipDefer));
                            return zipDefer.promise;
                        });
                }).then(defer.resolve.bind(defer), defer.reject.bind(defer))
                .finally(function () {
                    // Remove temporary folder for export
                    $cordovaFile.removeDir(cordova.file.cacheDirectory, folderToExport);
                });
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#importDB
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @description
         * This function will replace the databases with the files provided in zip. If import gets failed,
         * then app reverts back to use old databases.
         *
         * @param {string} zipPath location of the zip file.
         * @param {boolean} revertIfFails If true, then a backup is created and when import fails, backup is reverted back.
         * @returns {object} a promise that is resolved when zip is created.
         */
        this.importDB = function (zipPath, revertIfFails) {
            var importFolder = 'offline_temp_' + _.now(),
                importFolderFullPath = cordova.file.cacheDirectory + importFolder + '/',
                defer = $q.defer(),
                dbManager = this,
                zipMeta;
            //Create a temporary folder to unzip the contents of the zip.
            $cordovaFile.createDir(cordova.file.cacheDirectory, importFolder)
                .then(function () {
                    // Unzip to temporary location
                    var unzipDefer = $q.defer();
                    Zeep.unzip({
                        from: zipPath,
                        to: importFolderFullPath
                    }, unzipDefer.resolve.bind(unzipDefer), unzipDefer.reject.bind(unzipDefer));
                    return unzipDefer.promise;
                }).then(function () {
                    /*
                     * read meta data and allow import only package name of the app from which this zip is created
                     * and the package name of this app are same.
                     */
                    return $cordovaFile.readAsText(importFolderFullPath, "META.json").then(function (text) {
                        zipMeta = JSON.parse(text);
                        return getAppInfo();
                    }).then(function (appInfo) {
                        if (!zipMeta.app) {
                            return $q.reject('meta information is not found in zip');
                        }
                        if (zipMeta.app.packageName !== appInfo.packageName) {
                            return $q.reject('database zip of app with same package name can only be imported');
                        }
                    });
                }).then(function () {
                    var backupZip;
                    return dbManager.close()
                        .then(function () {
                            if (revertIfFails) {
                                //create backup
                                return dbManager.exportDB()
                                    .then(function (zipPath) {
                                        backupZip = zipPath;
                                    });
                            }
                        }).then(function () {
                            //delete existing databases
                            return DeviceFileService.removeDir(dbInstallDirectory);
                        }).then(function () {
                            //copy imported databases
                            return $cordovaFile.copyDir(importFolderFullPath, 'databases', dbInstallParentDirectory, dbInstallDirectoryName);
                        }).then(function () {
                            //reload databases
                            databases = null;
                            return dbManager.loadDatabases();
                        }).then(function () {
                            //Invoke callbacks
                            var cbs = _.map(callbacks, "postImport");
                            return Utils.executeDeferChain(cbs, [importFolderFullPath, zipMeta]);
                        }).then(function () {
                            //Remove backup
                            if (backupZip) {
                                return DeviceFileService.removeFile(backupZip);
                            }
                        }, function () {
                            //When import is failed, then revert to old databases
                            var reject = $q.reject.bind($q);
                            if (backupZip) {
                                return dbManager.importDB(backupZip)
                                    .then(function () {
                                        DeviceFileService.removeFile(backupZip);
                                        reject();
                                    }, reject);
                            }
                            return reject();
                        });
                }).then(defer.resolve.bind(defer), defer.reject.bind(defer))
                .finally(function () {
                    $cordovaFile.removeDir(cordova.file.cacheDirectory, importFolder);
                });
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBManager#registerCallback
         * @methodOf wm.plugins.database.services.$LocalDBManager
         * @description
         * using this function one can listen events such as 'preExport' and 'postImport'.
         *
         * @param {object} listeners an object with functions mapped to event names.
         */
        this.registerCallback = function (listeners) {
            callbacks.push(listeners);
        };
    }];