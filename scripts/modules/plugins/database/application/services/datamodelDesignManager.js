/*global WM, wm, studio*/
/*jslint sub: true */

wm.plugins.database.factories.DataModelDesignManager = [
    "$rootScope",
    "Utils",
    "DatabaseService",
    "DB_CONSTANTS",
    "Variables",
    "VARIABLE_CONSTANTS",
    "WidgetProperties",

    function ($rootScope, Utils, DatabaseService, DB_CONSTANTS, Variables, VARIABLE_CONSTANTS, WidgetProperties) {
        'use strict';

        var operations = {},
            draftDataModel = {},
            publishedDataModel = {},
            activeQuery = {},
            tableTypesMap = {
                "TABLE": "table",
                "VIEW": "view"
            },
        /*Function to sort the array elements based on the specified key.*/
            sort = function (a, b, key) {
                if (a[key] < b[key]) {
                    return -1;
                }
                if (a[key] > b[key]) {
                    return 1;
                }
                return 0;
            },
        /*Function to sort the array elements based on "name".*/
            sortByName = function (a, b) {
                return sort(a, b, 'name');
            },
        /*Function to sort the array elements based on "tableName".*/
            sortByTableName = function (a, b) {
                return sort(a, b, 'tableName');
            },
        /*Set the dataModel object.*/
            setDataModel = function (dataModelName, dataModel, isDraft) {
                if (isDraft) {
                    draftDataModel[dataModelName] = dataModel;
                } else {
                    publishedDataModel[dataModelName] = dataModel;
                }
            },
        /*Get the draft version for the specified dataModel.*/
            getDraftDataModel = function (projectID, dataModelName, success, error) {
                if (draftDataModel[dataModelName]) {
                    Utils.triggerFn(success, draftDataModel[dataModelName]);
                    return;
                }
                DatabaseService.getDataModel({
                    projectID: projectID,
                    dataModelName: dataModelName,
                    isdraft: true
                }, function (response) {
                    draftDataModel[dataModelName] = response;
                    Utils.triggerFn(success, response);
                }, function (response) {
                    Utils.triggerFn(error, response);
                });
            },
        /*Get the published version for the specified dataModel.*/
            getPublishedDataModel = function (projectID, dataModelName, success, error) {
                if (publishedDataModel[dataModelName]) {
                    Utils.triggerFn(success, publishedDataModel[dataModelName]);
                    return;
                }
                DatabaseService.getDataModel({
                    projectID: projectID,
                    dataModelName: dataModelName,
                    isdraft: false
                }, function (response) {
                    publishedDataModel[dataModelName] = response;
                    Utils.triggerFn(success, response);
                }, function (response) {
                    Utils.triggerFn(error, response);
                });
            },
        /*Get the dataModel object.*/
            getDataModel = function (projectID, dataModelName, isDraft, success, error) {
                if (isDraft) {
                    getDraftDataModel(projectID, dataModelName, success, error);
                } else {
                    getPublishedDataModel(projectID, dataModelName, success, error);
                }
            },
        /*Reset the dataModel object.*/
            resetDataModel = function (dataModelName) {
                draftDataModel[dataModelName] = undefined;
                publishedDataModel[dataModelName] = undefined;
            },
        /*Set the activeQuery for the specified dataModel.*/
            setActiveQuery = function (dataModelName, query) {
                activeQuery[dataModelName] = query;
            },
        /*Fetch the activeQuery for the specified dataModel.*/
            getActiveQuery = function (dataModelName) {
                return activeQuery[dataModelName] || undefined;
            },
        /*Fetch the saved operations for the specified dataModel.*/
            getOperations = function (dataModelName) {
                return operations[dataModelName];
            },
        /*Set the saved operations for the specified dataModel.*/
            setOperations = function (dataModelName, dataModelOperations) {
                operations[dataModelName] = (operations[dataModelName] || []).concat(dataModelOperations);
            },
        /*Add the widgets corresponding to the tables in the published dataModel.*/
            addDatabaseWidgets = function (projectID, dataModelName, publishedDataModel, isCreateVar) {
                var dataTables = [],
                    contextVariables,
                    dbWidgetsGroup = WidgetProperties.addSubGroup(
                        {
                            "name": dataModelName,
                            "namekey": dataModelName,
                            "parent": "widgets",
                            "widgets": [],
                            "projectID": projectID
                        }
                    );
                /*Loop through the list of tables and push them under dbWidgetsGroup*/
                WM.forEach(publishedDataModel.dataTables, function (entity) {
                    var entityName = entity.entityName;
                    /*Add all the tables as widgets under the subgroup "grids"*/
                    dbWidgetsGroup.widgets.push({
                        "widgetType": "wm-livegrid",
                        "category": "grid" + dataModelName,
                        "name": entityName,
                        "iconclass": "livegrid",
                        "isDraggable": true,
                        "isAdvanced": true,
                        "defaults": {"service": dataModelName + "@" + entityName, "newcolumns": true}
                    });

                    dataTables.push(entityName);
                    /*Invoke the function to create a variable based on the "isCreate" flag.*/
                    if (isCreateVar) {
                        Variables.createLiveVariable({
                            "service": dataModelName,
                            "table": entityName,
                            "owner": ($rootScope.isPrefabTemplate ? VARIABLE_CONSTANTS.OWNER.PAGE : VARIABLE_CONSTANTS.OWNER.APP)
                        });
                    }
                });
                /*Invoke the function to save the created variables based on the "isCreate" flag.*/
                if (isCreateVar) {

                    /*Get the context variables based on whether the project is a prefab or not.*/
                    if ($rootScope.isPrefabTemplate) {
                        contextVariables = Variables.getAll()[$rootScope.activePageName];
                    } else {
                        contextVariables = Variables.getAll()[VARIABLE_CONSTANTS.OWNER.APP];
                    }
                    /*Iterate through the application variables.*/
                    WM.forEach(contextVariables, function (appVariable) {
                        /*Check if the variable is a Live variable.*/
                        if (appVariable.category === 'wm.LiveVariable') {
                            /*Check if the "liveSource" property of the variable matches with the current dataModel.*/
                            if (appVariable.liveSource === dataModelName) {
                                /*If the "entity" of the variable does not exist in the entities of the dataModel,
                                 * delete the default variable associated with that entity.*/
                                if (WM.element.inArray(appVariable.type, dataTables) === -1) {
                                    /*Invoke the function to delete the default live variable for the deleted table.*/
                                    Variables.deleteDefaultVariable({
                                        "category": "wm.LiveVariable",
                                        "service": dataModelName,
                                        "table": appVariable.type,
                                        "owner": ($rootScope.isPrefabTemplate ? VARIABLE_CONSTANTS.OWNER.PAGE : VARIABLE_CONSTANTS.OWNER.APP)
                                    });
                                }
                            }
                        }
                    });
                    Variables.saveVariables($rootScope.isPrefabTemplate ? $rootScope.activePageName : '');
                }

                $rootScope.$emit('reset-filtered-widgets');
            },
        /*Generate the markup for the dataModel to be rendered on the canvas.*/
            generateMarkup = function (dataModel) {
                var markup,
                    dataColumns = {},
                    relationDom = "",
                    tables = {};

                /*Prepend the markup with the "timestamp" value so that the watch on the content is always triggered.*/
                markup = '_ts_' + Date.now() + '_ts_';

                markup += '<wm-db widgetid="wm-dbdom" name="wm-dbdom" dbobjectkey="' + dataModel.name + '" dbobjectname="' + dataModel.name +
                    '" catalog="' + dataModel.catalogName + '" package="' + dataModel.packageName + '" schema="' + dataModel.schemaName + '">';

                /*Loop through the tables*/
                WM.forEach(dataModel.dataTables, function (table) {

                    var tableName,
                        tableType;

                    /*Add the "table-name" as a key to "tables" and initialize "relations".*/
                    tableName = table.tableName;
                    tables[tableName] = {};
                    tables[tableName].dataRelations = [];
                    tableType = WM.isDefined(table.tableType) ? tableTypesMap[table.tableType] : 'table';

                    /*Construct a wm-db-table for every table with the name*/
                    markup += '<wm-db-table type="' + tableType + '" dbobjectkey="' + tableName + '" dbobjectname="' + tableName + '" entityname="' + table.entityName + '">';

                    /*Loop through the table*/
                    WM.forEach(table.dataColumns, function (column) {

                        var sqlType;
                        if (DB_CONSTANTS.DATABASE_DATA_TYPES[column.sqlType]) {
                            sqlType = DB_CONSTANTS.DATABASE_DATA_TYPES[column.sqlType].sql_type;
                        } else if (DB_CONSTANTS.DATABASE_SECONDARY_DATA_TYPES[column.sqlType]) {
                            sqlType = DB_CONSTANTS.DATABASE_DATA_TYPES[DB_CONSTANTS.DATABASE_SECONDARY_DATA_TYPES[column.sqlType].sql_type].sql_type;
                        }


                        /*Construct a wm-db-table-column for every column in the table*/
                        markup += '<wm-db-table-column dbobjectkey="' + column.columnName + '" tablename="' + tableName + '" dbobjectname="' + column.columnName + '" fieldname="' + column.fieldName + '" sqltype="' + sqlType + '" ispk="' + column.isPk + '" isfk="' + column.isFk +
                            '" notnull="' + column.notNull + '" length="' + column.length + '" precision="' + column.precision + '" defaultvalue="' + column.defaultValue + '" generator="' + column.generator + '" generatorvalue="' + column.generatorValue + '"></wm-db-table-column>';
                        /*If the current column is the primary key of the table, add it to the "tablePrimaryKeys"*/
                        if (column.isPk) {
                            tables[tableName].primaryKey = {"name": column.columnName, "entity": column};
                        }
                    });

                    WM.forEach(table.dataRelations, function (relation) {
                        tables[tableName].dataRelations.push(relation);
                    });

                    markup += '</wm-db-table>';
                });

                WM.forEach(tables, function (table, tableName) {
                    WM.forEach(table.dataRelations, function (relation) {

                        var column,
                            relatedTable,
                            relatedColumn,
                            relationName;

                        if (relation.isPrimary) {
                            switch (relation.cardinality) {
                            case "OneToOne":
                            case "OneToMany":
                                column = tables[tableName].primaryKey.name;
                                relatedTable = relation.relatedType;
                                relatedColumn = relation.relatedColumns[0];
                                break;
                            case "ManyToOne":
                                column = relation.relatedColumns[0];
                                relatedTable = relation.relatedType;
                                relatedColumn = tables[relatedTable].primaryKey.name;
                                break;
                            }
                            relationName = relation.name;
                            dataColumns[relationName] = [];
                            dataColumns[relationName].push(tableName + "@" + column);
                            dataColumns[relationName].push(relatedTable + "@" + relatedColumn);

                            relationDom += '<wm-db-column-relation dbobjectkey="' + relationName + '" datacolumns="' + dataColumns[relationName].toString() + '" dbobjectname="' + relationName + '" relatedtype="' + relatedTable +
                                '" entityname="' + tableName + '" relatedcolumns="' + relation.relatedColumns[0] + '" cardinality="' + relation.cardinality + '"></wm-db-column-relation>';
                        }
                    });
                });

                markup += relationDom;
                markup += '</wm-db>';

                return markup;
            },
        /*Add the query nodes to the tree.*/
            addQueryNodesToJson = function (projectID, dataModelName, servicesTree, dataModelNodeUId) {
                var queryRoot,
                    procedureRoot;
                DatabaseService.getAllQueries({
                    projectID: projectID,
                    dataModelName: dataModelName
                }, function (response) {
                    var queries = [];
                    if (response.length) {
                        queryRoot = Utils.addNodeToJson(servicesTree, 'Queries', dataModelNodeUId, {
                            "collapsed": true,
                            "class": "query",
                            "active": false,
                            "nodeProps": {"type": "dbqueryroot"}
                        });
                        /*Invoke the function to sort the queries by name.*/
                        response.sort(sortByName);
                        /*Iterate through the queries and add each query as a node in the tree.*/
                        WM.forEach(response, function (query) {
                            queries.push(query.name);
                            Utils.addNodeToJson(servicesTree, query.name, queryRoot.uid, {
                                "collapsed": true,
                                "class":  "query",
                                "active": false,
                                "nodeProps": {
                                    "type": "dbquery",
                                    "dbName": dataModelName
                                }
                            });
                        });
                    }
                    setOperations(dataModelName, queries);
                }, WM.noop);
                DatabaseService.getAllProcedures({
                    projectID: projectID,
                    dataModelName: dataModelName
                }, function (response) {
                    var procedures = [];
                    if (response.length) {
                        procedureRoot = Utils.addNodeToJson(servicesTree, 'Procedures', dataModelNodeUId, {
                            "collapsed": true,
                            "class": "procedure",
                            "active": false,
                            "nodeProps": {"type": "dbprocedureroot"}
                        });
                        /*Invoke the function to sort the procedures by name.*/
                        response.sort(sortByName);
                        /*Iterate through the procedures and add each procedure as a node in the tree.*/
                        WM.forEach(response, function (procedure) {
                            procedures.push(procedure.name);
                            Utils.addNodeToJson(servicesTree, procedure.name, procedureRoot.uid, {
                                "collapsed": true,
                                "class": "procedure",
                                "active": false,
                                "nodeProps": {
                                    "type": "dbprocedure",
                                    "dbName": dataModelName
                                }
                            });
                        });
                    }
                    setOperations(dataModelName, procedures);
                }, WM.noop);
            },
        /*Function to construct the tree for the database in the following manner.
         * --Database Name
         *   --Table1
         *   --Table2
         *   --Query1
         *   --Query2
         *   --Query3*/
            addDbNodesToTree = function (projectID, servicesTree, dataModelName, dbNodeUId, dataModel) {

                /*Add the table nodes only if the data-model contains at-least 1 table.*/
                if (dataModel.dataTables.length) {
                    var tableRoot = Utils.addNodeToJson(servicesTree, 'Tables', dbNodeUId, {
                        "collapsed": true,
                        "class": "db-table",
                        "active": false,
                        "nodeProps": {"type": "dbtableroot"}
                    });

                    /*Invoke the function to sort the tables by "tableName".*/
                    dataModel.dataTables.sort(sortByTableName);

                    /*Iterate through the tables and add each table as a node in the tree.*/
                    WM.forEach(dataModel.dataTables, function (table) {

                        /*Add each table as a node in the Services tree*/
                        var tableNode = Utils.addNodeToJson(servicesTree, table.tableName, tableRoot.uid, {
                                "collapsed": true,
                                "class": "db-table",
                                "active": false,
                                "nodeProps": {"type": "dbtable", "dbName": dataModelName, "componentName": table.tableName}
                            }),
                            columnRoot,
                            relationRoot;

                        /*Add the column nodes only if the table contains at-least 1 column.*/
                        if (table.dataColumns.length) {
                            columnRoot = Utils.addNodeToJson(servicesTree, 'Columns', tableNode.uid, {
                                "collapsed": true,
                                "class": "db-column",
                                "active": false,
                                "nodeProps": {"type": "dbcolumnroot"}
                            });
                            /*Loop through the table*/
                            WM.forEach(table.dataColumns, function (column) {
                                var columnClass;

                                /*Add each table column as a node in the Services tree*/
                                columnClass = (column.isPk) ? "db-key-column" : "db-column";
                                Utils.addNodeToJson(servicesTree, column.columnName, columnRoot.uid, {
                                    "collapsed": true,
                                    "class": columnClass,
                                    "active": false,
                                    "nodeProps": {"type": "dbtablecolumn", "dbName": dataModelName, "tableName": table.tableName}
                                });
                            });
                        }

                        /*Add the relation nodes only if the table contains at-least 1 relation.*/
                        if (table.dataRelations.length) {

                            WM.forEach(table.dataRelations, function (relation) {
                                var relationClass;
                                /*Check for primary relations.*/
                                if (relation.isPrimary) {
                                    /*Add the root node for relations only once.*/
                                    relationRoot = relationRoot || Utils.addNodeToJson(servicesTree, 'Relations', tableNode.uid, {
                                        "collapsed": true,
                                        "class": "db-relation-one-to-one",
                                        "active": false,
                                        "nodeProps": {"type": "dbrelationroot"}
                                    });

                                    switch (relation.cardinality) {
                                    case "OneToOne":
                                        relationClass = "db-relation-one-to-one";
                                        break;
                                    case "OneToMany":
                                        relationClass = "db-relation-one-to-many";
                                        break;
                                    case "ManyToOne":
                                        relationClass = "db-relation-many-to-one";
                                        break;
                                    }
                                    Utils.addNodeToJson(servicesTree, relation.name, relationRoot.uid, {
                                        "collapsed": true,
                                        "class": relationClass,
                                        "active": false,
                                        "nodeProps": {"type": "dbcolumnrelation", "dbName": dataModelName, "tableName": table.tableName}
                                    });
                                }
                            });
                        }
                    });
                }

                /*Invoke the function to get all the queries for the database and display them in the tree under the database node*/
                addQueryNodesToJson(projectID, dataModelName, servicesTree, dbNodeUId);
            },
        /*Fetch the database object type based on the widget type*/
            getDbObjectType = function (widgetType) {
                var objectType = "";
                WM.element.each(DB_CONSTANTS.OBJECTS, function (dbObjectType, dbWidgetType) {
                    if (dbWidgetType === widgetType) {
                        objectType = dbObjectType;
                        return false;
                    }
                });
                return objectType;
            },
        /*Check whether the parameter is a valid db object type or not.*/
            isValidDBObjectType = function (dbObjectType) {
                return dbObjectType === "TABLE" || dbObjectType === "COLUMN" || dbObjectType === "RELATION";
            },
        /*Create request data for table.*/
            createRequestDataForTable = function (table, columns, relations) {
                return {
                    "tableName": table.dbobjectname,
                    "entityName": table.entityname,
                    "dynamicInsert": false,
                    "dynamicUpdate": false,
                    "refreshEntity": false,
                    "dataColumns": columns,
                    "dataRelations": relations
                };
            },
        /*Create request data for column.*/
            createRequestDataForColumn = function (column) {
                return {
                    "columnName": column.dbobjectname,
                    "fieldName": column.fieldname,
                    "sqlType": column.sqltype,
                    "length": column.length || 1,
                    "generator": column.generator,
                    "generatorValue": column.generatorvalue,
                    "precision": column.precision,
                    "notNull": column.notnull,
                    "isPk": column.ispk,
                    "isFk": column.isfk,
                    "defaultValue": column.defaultvalue === "null" ? null : column.defaultvalue
                };
            },
        /*Create request data for relation.*/
            createRequestDataForRelation = function (relation) {
                return {
                    "name": relation.dbobjectname,
                    "fullyQualifiedName": relation.fullyQualifiedTableName,
                    "relatedType": relation.relatedtype,
                    "cardinality": relation.cardinality,
                    "relatedColumns": WM.isArray(relation.relatedcolumns) ? relation.relatedcolumns : [relation.relatedcolumns]
                };
            },
        /*Check whether the specified relation is a valid one-to-one relation or not.*/
            isValidOneToOneRelation = function (params) {
                var response = {
                    "isValid": true
                };
                if (!params.column1.ispk) {
                    response = {
                        "isValid": false,
                        "error": Utils.replace($rootScope.locale["MESSAGE_ERROR_RELATION_NONKEY_COLUMN"], [params.column1.dbobjectname, params.table1.dbobjectname])
                    };
                    return response;
                }
                if (!params.column2.ispk) {
                    response = {
                        "isValid": false,
                        "error": Utils.replace($rootScope.locale["MESSAGE_ERROR_RELATION_NONKEY_COLUMN"], [params.column2.dbobjectname, params.table2.dbobjectname])
                    };
                    return response;
                }
                return response;
            },
        /*Check whether the specified relation is a valid one-to-many relation or not.*/
            isValidOneToManyRelation = function (params) {
                var response = {
                    "isValid": true
                };
                /*Display an error if a "OneToMany" relation is being created and column1 is not a primary key*/
                if (!params.column1.ispk) {
                    response = {
                        "isValid": false,
                        "error": Utils.replace($rootScope.locale["MESSAGE_ERROR_RELATION_NONKEY_COLUMN"], [params.column1.dbobjectname, params.table1.dbobjectname])
                    };
                    return response;
                }
                if (params.column2.ispk) {
                    response = {
                        "isValid": false,
                        "error": $rootScope.locale["MESSAGE_ERROR_RELATION_BOTH_KEY_COLUMNS"]
                    };
                    return response;
                }
                return response;
            },
        /*Check whether the specified relation is a valid many-to-one relation or not.*/
            isValidManyToOneRelation = function (params) {
                var response = {
                    "isValid": true
                };
                /*Display an error if a "ManyToOne" relation is being created and column2 is not a primary key*/
                if (!params.column2.ispk) {
                    response = {
                        "isValid": false,
                        "error": Utils.replace($rootScope.locale["MESSAGE_ERROR_RELATION_NONKEY_COLUMN"], [params.column2.dbobjectname, params.table2.dbobjectname])
                    };
                    return response;
                }
                if (params.column1.ispk) {
                    response = {
                        "isValid": false,
                        "error": $rootScope.locale["MESSAGE_ERROR_RELATION_BOTH_KEY_COLUMNS"]
                    };
                    return response;
                }
                return response;
            },
        /*Check whether the specified relation is valid or not.*/
            isValidRelation = function (params) {
                var response = {
                    "isValid": true
                };

                /*Display an error if the column data-types do not match and return without creating the relations.*/
                if (params.column1.sqltype !== params.column2.sqltype) {
                    response = {
                        "isValid": false,
                        "error": $rootScope.locale["MESSAGE_ERROR_RELATION_NONMATCHING_COLUMN_TYPES"]
                    };
                    return response;
                }

                switch (params.cardinality) {
                case "OneToOne":
                    response = isValidOneToOneRelation(params);
                    break;
                case "OneToMany":
                    response = isValidOneToManyRelation(params);
                    break;
                case "ManyToOne":
                    response = isValidManyToOneRelation(params);
                    break;
                default:
                    break;
                }
                return response;
            };

        return {
            "setDataModel": setDataModel,
            "getDataModel": getDataModel,
            "resetDataModel": resetDataModel,
            "getActiveQuery": getActiveQuery,
            "setActiveQuery": setActiveQuery,
            "getOperations": getOperations,
            "addDatabaseWidgets": addDatabaseWidgets,
            "addDbNodesToTree": addDbNodesToTree,
            "generateMarkup": generateMarkup,
            "getDbObjectType": getDbObjectType,
            "isValidDBObjectType": isValidDBObjectType,
            "createRequestDataForTable": createRequestDataForTable,
            "createRequestDataForColumn": createRequestDataForColumn,
            "createRequestDataForRelation": createRequestDataForRelation,
            "isValidRelation": isValidRelation
        };
    }
];
