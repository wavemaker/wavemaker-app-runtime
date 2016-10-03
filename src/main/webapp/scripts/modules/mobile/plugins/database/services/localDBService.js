/*global wm, WM, FileTransfer, _*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalDBService
 * @description
 * The 'wm.plugins.database.services.$LocalDBService' provides API  to interact with LocalDatabase.
 */
wm.plugins.database.services.LocalDBService = [
    "$cordovaSQLite",
    "$q",
    "LocalDBStoreFactory",
    "Utils",
    function ($cordovaSQLite, $q, LocalDBStoreFactory, Utils) {
        'use strict';
        var initialized = false,
            schemas = [],
            databases = {};

        function getDatabase(dbName) {
            var db = databases[dbName];
            if (!db) {
                databases[dbName] = db = {};
            }
            return db;
        }

        /**
         * Picks essential details from the given schema.
         *
         * @param schema
         * @param entity
         * @returns {{entityName: *, name: *, columns: Array}}
         */
        function mapEntitySchema(schema, entity, transformedSchemas) {
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

        //creates database for each entity.
        function createDatabases(schema) {
            var db = getDatabase(schema.name),
                connection = $cordovaSQLite.openDB({
                    name: schema.name,
                    location: 'default'
                }),
                transformedSchemas = {};

            db.connection = connection;
            db.schema = schema;
            db.stores = {};
            _.forEach(schema.tables, function (entitySchema) {
                transformedSchemas[entitySchema.entityName] = {};
            });
            _.forEach(schema.tables, function (entitySchema) {
                var entityName = entitySchema.entityName,
                    transformedSchema = transformedSchemas[entityName];
                mapEntitySchema(schema, entitySchema, transformedSchemas);
                db.stores[entityName] = LocalDBStoreFactory.createStore(connection, transformedSchema, schema.drop);
            });

        }

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#executeNamedQuery
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Executes a named query.
         *
         * @param {string} dbName name of database on which the named query has to be run
         * @param {string} queryName name of the query to execute
         * @param {object} params parameters required for query.
         * @returns {object} a promise.
         */
        this.executeNamedQuery = function (dbName, queryName, params) {
            var queryData = databases[dbName].queries[queryName];
            if (params && queryData.params) {
                params = _.map(queryData.params, function (p) {
                    return params[p];
                });
            }
            return this.executeSQLQuery(dbName, queryData.query, params);
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#executeNamedQuery
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Executes a named query.
         *
         * @param {string} dbName name of database on which the named query has to be run
         * @param {string} queryName name of the query to execute
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
         * @name wm.plugins.database.services.$LocalDBService#registerNamedQueries
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Registers named queries.
         *
         * @param {string} dbName name of database to which queries belong.
         * @param {array} queries a list of query meta info
         */
        this.registerNamedQueries = function (dbName, queries) {
            var db = getDatabase(dbName);

            db.queries = db.queries || {};
            _.forEach(queries, function (queryData) {
                var query = queryData.query,
                    params = _.map(query.match(/:[a-zA-Z0-9]+\s?/g), function (p) {
                        return _.trim(p.substring(1));
                    });
                db.queries[queryData.name] = {
                    query: query.replace(/:[a-zA-Z0-9]+\s?/g, '? '),
                    params: params
                };
            });
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#loadSchema
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Loads the given schema and create database .
         * If service is not initialized, creation of database will be done post initialization..
         *
         * @param {object} schema The user defined schema
         */
        this.loadSchema = function (schema) {
            if (initialized) {
                createDatabases(schema);
            } else {
                schemas.push(schema);
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#getStore
         * @methodOf wm.plugins.database.services.$LocalDBService
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
         * @name wm.plugins.database.services.$LocalDBService#clearAll
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * clear data in all databases.
         * @returns {object} a promise that is resolved when data is cleared.
         */
        this.clearAll = function () {
            var promises = [];
            _.forEach(databases, function (database) {
                _.forEach(database.stores, function (store) {
                    promises.push(store.clear());
                });
            });
            return $q.all(promises);
        };
        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#init
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * initializes the services by creating the database of schemas so far loaded.
         */
        this.init = function () {
            if (!initialized) {
                _.forEach(schemas, function (v) {
                    createDatabases(v);
                });
                initialized = true;
                schemas = [];
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#insertTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Method to insert data into the specified table. This modification will be added to offline change log.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.insertTableData = function (params, successCallback, failureCallback) {
            var store = this.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.add(params.data)
                    .then(function (localId) {
                        var primaryKeyName = store.primaryKeyName;
                        params.data[primaryKeyName] = localId;
                        successCallback(params.data);
                    }, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#updateTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to update data in the specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.updateTableData = function (params, successCallback, failureCallback) {
            var store = this.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.save(params.data)
                    .then(function () {
                        successCallback(params.data);
                    }, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#deleteTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to delete data in the specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.deleteTableData = function (params, successCallback, failureCallback) {
            var store = this.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.delete(params.id).then(successCallback, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#readTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to read data from a specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.readTableData = function (params, successCallback, failureCallback) {
            var store = this.getStore(params.dataModelName, params.entityName);
            if (store) {
                store.filter(params.data, params.sort.split('=')[1], {
                    offset: (params.page - 1) * params.size,
                    limit: params.size
                }).then(function (data) {
                    successCallback({
                        'content': data
                    });
                }, failureCallback);
            } else {
                Utils.triggerFn(failureCallback, "Store not found.");
            }
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#searchTableData
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to read data from a specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.searchTableData = this.readTableData;

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#searchTableDataWithQuery
         * @methodOf wm.plugins.database.services.$LocalDBService
         *
         * @description
         * Method to read data from a specified table.
         *
         * @param {object} params
         *                 Object containing name of the project & table data to be inserted.
         * @param {function=} successCallback
         *                    Callback function to be triggered on success.
         * @param {function=} failureCallback
         *                    Callback function to be triggered on failure.
         */
        this.searchTableDataWithQuery = this.readTableData;
    }];