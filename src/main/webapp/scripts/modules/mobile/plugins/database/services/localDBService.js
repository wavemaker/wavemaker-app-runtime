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
            stores = {};

        /**
         * Picks essential details from the given schema.
         *
         * @param schema
         * @param entity
         * @returns {{entityName: *, name: *, columns: Array}}
         */
        function mapEntitySchema(schema, entity) {
            var reqEntity = {
                'entityName' : entity['entityName'],
                'name' : entity['name'],
                'columns' : []
            };
            _.forEach(entity.columns, function (col) {
                reqEntity.columns.push({
                    'name' : col['name'],
                    'fieldName' : col['fieldName'],
                    'primaryKey' : col['primaryKey']
                });
            });
            _.forEach(entity.relations, function (r) {
                var targetEntity, col, sourceColumn;
                if (r.cardinality === 'ManyToOne' || r.cardinality === 'OneToOne') {
                    targetEntity = _.find(schema.tables, function (t) {
                        return t.name === r.targetTable;
                    });
                    if (targetEntity) {
                        targetEntity = targetEntity.entityName;
                        sourceColumn = r.mappings[0].sourceColumn;
                        col = _.find(reqEntity.columns, function (column) {
                            return column.name === sourceColumn;
                        });
                        col.targetEntity = targetEntity;
                    }
                }
            });
            return reqEntity;
        }

         //creates database stores for each entity.
        function createStores(schema) {
            var db = $cordovaSQLite.openDB({
                name: schema.name,
                location: 'default'
            });

            stores[schema.name] = {};
            _.forEach(schema.tables, function (entitySchema) {
                entitySchema = mapEntitySchema(schema, entitySchema);
                stores[schema.name][entitySchema.entityName] = LocalDBStoreFactory.createStore(db, entitySchema, schema.drop);
            });

        }

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#loadSchema
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * Loads the given schema and create stores for all the entities.
         * If service is not initialized, creation of stores will be done post initialization..
         *
         * @param {object} schema The user defined schema
         */
        this.loadSchema = function (schema) {
            if (initialized) {
                createStores(schema);
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
            if (stores[dataModelName]) {
                return stores[dataModelName][entityName];
            }
            return null;
        };

        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalDBService#clearAll
         * @methodOf wm.plugins.database.services.$LocalDBService
         * @description
         * clear data in all the database stores.
         * @returns {object} a promise that is resolved when data is cleared.
         */
        this.clearAll = function () {
            var promises = [];
            _.forEach(stores, function (entities) {
                _.forEach(entities, function (store) {
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
         * initializes the services by creating the database stores of schemas so far loaded.
         */
        this.init = function () {
            if (!initialized) {
                _.forEach(schemas, function (v) {
                    createStores(v);
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