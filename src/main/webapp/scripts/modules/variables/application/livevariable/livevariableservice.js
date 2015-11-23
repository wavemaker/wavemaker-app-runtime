/*global wm, WM, _, moment*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.$liveVariable
 * @requires $rootScope
 * @requires DatabaseService
 * @requires Variables
 * @requires BaseVariablePropertyFactory
 * @requires CONSTANTS
 * @requires Utils
 * @requires VARIABLE_CONSTANTS
 * @requires ProjectService
 * @requires DB_CONSTANTS
 * @description
 * This service is responsible for handling operations related to Live variables.
 * It manages creation, update, data retrieval operations.
 */

wm.variables.services.$liveVariable = [
    "$rootScope",
    "DatabaseService",
    "Variables",
    "BaseVariablePropertyFactory",
    "CONSTANTS",
    "Utils",
    "VARIABLE_CONSTANTS",
    "ProjectService",
    "DB_CONSTANTS",
    "wmToaster",
    "$filter",
    function ($rootScope, DatabaseService, Variables, BaseVariablePropertyFactory, CONSTANTS, Utils, VARIABLE_CONSTANTS, ProjectService, DB_CONSTANTS, wmToaster, $filter) {
        "use strict";

        /*Set a flag based on whether the project is deployed or not.
         * 1. In the RUN mode, project is deployed.
         * 2. In the STUDIO mode, project has to be explicitly deployed.*/
        var isProjectDeployed = (CONSTANTS.isRunMode),
            DataModelDesignManager = CONSTANTS.isStudioMode && Utils.getService('DataModelDesignManager'),
            isProjectDeployInProgress = false,
            projectDeployReqQueue,
            callbackParams = [],
            requestQueue = {},
            variableActive = {},
            invalidVariables = [],
            isDeployReqSourceChanged,
            packageDetails = {},
            dateTimeFormats = Utils.getDateTimeDefaultFormats(),
            isDateTime = Utils.getDateTimeTypes(),
        /*Function to clear set variables*/
            reset = function () {
                isProjectDeployed = (CONSTANTS.isRunMode);
                /*Set the "isDeployReqSourceChanged" flag to true so that the deploy request queue is populated only when the deploy source changes.*/
                isDeployReqSourceChanged = true;
            },
        /*Function to convert values of date time types into default formats*/
            getDateInDefaultFormat = function (value, type) {
                var epoch = moment(value).valueOf();
                if (type === 'time' && !epoch) {
                    epoch = moment(new Date().toDateString() + ' ' + value).valueOf();
                }
                return value && $filter('date')(epoch, dateTimeFormats[type]);
            },
        /* Function to process the response data if it contains composite keys. */
            processResponse = function (responseData) {
                if (!responseData) {
                    return;
                }
                var formatData = function (rowData) {
                    _.each(rowData, function (value, key) {
                        var tempData;
                        if (WM.isObject(value)) {
                            /*If the table has a composite key, key data will be wrapped in an object with the key "id".
                             * Hence, the data is formatted to remove the extra key and merge it into the content.*/
                            if (key === 'id') {
                                tempData = rowData.id;
                                delete rowData.id;
                                WM.extend(rowData, tempData);
                                return;
                            }
                            /*If the value is an object, check if id object is present in this object*/
                            formatData(value);
                        }
                    });
                };
                responseData.forEach(function (rowData) {
                    formatData(rowData);
                });
            },
        /*Function to get the hibernateType of the specified field.*/
            getHibernateType = function (variable, fieldName) {
                var columns = variable.propertiesMap.columns,
                    columnsCount = columns.length,
                    index,
                    column;
                /*Loop through the columns of the liveVariable*/
                for (index = 0; index < columnsCount; index += 1) {
                    column = columns[index];
                    /*Return the type of the column when the fieldName matches the current column.*/
                    if (column.fieldName === fieldName) {
                        return column.hibernateType;
                    }
                }
            },
        /*Function to get the sqlType of the specified field.*/
            getSqlType = function (variable, fieldName) {
                var columns = variable.propertiesMap.columns,
                    columnsCount = columns.length,
                    index,
                    column;
                /*Loop through the columns of the liveVariable*/
                for (index = 0; index < columnsCount; index += 1) {
                    column = columns[index];
                    /*Return the type of the column when the fieldName matches the current column.*/
                    if (column.fieldName === fieldName) {
                        return column.type;
                    }
                }
            },
        /*Function to check if the specified field has a one-to-many relation or not.*/
            isRelatedFieldMany = function (variable, fieldName) {
                var columns = variable.propertiesMap.columns,
                    columnsCount = columns.length,
                    index,
                    column;
                /*Loop through the columns of the liveVariable*/
                for (index = 0; index < columnsCount; index += 1) {
                    column = columns[index];
                    /*If the specified field is found in the columns of the variable,
                    * then it has a many-to-one relation.*/
                    if (column.fieldName === fieldName) {
                        return false;
                    }
                }
                return true;
            },
            updateVariableDataset = function (variable, data, propertiesMap, pagingOptions) {
                variable.dataSet = {
                    "data": data,
                    "propertiesMap": propertiesMap,
                    "pagingOptions": pagingOptions
                };
            },
            setVariableProp = function (variable, writableVariable, propertyName, propertyValue) {
                variable[propertyName] = propertyValue;
                /*Check for sanity.
                * writableVariable will be null in case of partial page variables.*/
                if (writableVariable) {
                    writableVariable[propertyName] = propertyValue;
                }
            },
        /*Function to fetch the meta data for the table.*/
            getTableMetaData = function (projectID, variable, writableVariable, options, callback, success) {
                var tableDetails = {};

                /*Fetch the type nodes(consisting of the table & column details) for the database*/
                DataModelDesignManager.getDataModel(projectID, variable.liveSource, false, function (database) {
                    var variableTable,
                        variableType,
                        tableNameToEntityNameMap = {},
                        entityNameToTableNameMap = {};
                    WM.forEach(database.tables, function (table) {
                        tableNameToEntityNameMap[table.name] = table.entityName;
                        entityNameToTableNameMap[table.entityName] = table.name;
                    });
                    variableType = entityNameToTableNameMap[variable.type];

                    /*If the table that the variable associated with; no longer exists (i.e., it has been deleted or the name has been changed),
                    * add the variable name to the list of invalid variables and return.*/
                    if (!variableType) {
                        invalidVariables.push(variable.name);
                        return;
                    }

                    /*Loop through the tables*/
                    WM.forEach(database.tables, function (table) {

                        var tableName = table.name,
                            tablePackageName = database.packageName + "." + table.entityName,
                            primaryKeys = table.primaryKey.columns || [],
                            foreignKeys = [];
                        /*Find out the foreign keys from the relations*/
                        _.each(table.relations, function (relation) {
                            if (relation.primary) {
                                _.each(relation.mappings, function (mapping) {
                                    foreignKeys.push(mapping.sourceColumn);
                                });
                            }
                        });

                        /*Add the "table-name" as a key to "tableDetails" and initialize "columnNames" and "relations".*/
                        tableDetails[tableName] = {};
                        tableDetails[tableName].columns = [];
                        tableDetails[tableName].primaryKeys = [];
                        packageDetails[tablePackageName] = packageDetails[tablePackageName] || {};
                        packageDetails[tablePackageName].primaryKeys = [];

                        /*Check if the current table is same as the table associated with the variable.*/
                        if (tableName === variableType) {
                            setVariableProp(variable, writableVariable, "package", tablePackageName);
                            setVariableProp(variable, writableVariable, "tableName", table.name);
                            setVariableProp(variable, writableVariable, "tableType", WM.isDefined(table.type) ? table.type : "TABLE");
                        }

                        /*Loop through the table*/
                        WM.forEach(table.columns, function (column) {
                            var sqlType = column.sqlType,
                                isPrimaryKey = _.includes(primaryKeys, column.name),
                                isForeignKey = _.includes(foreignKeys, column.name);
                            if (DB_CONSTANTS.DATABASE_SECONDARY_DATA_TYPES[sqlType]) {
                                sqlType = DB_CONSTANTS.DATABASE_DATA_TYPES[DB_CONSTANTS.DATABASE_SECONDARY_DATA_TYPES[sqlType].sql_type].sql_type;
                            }

                            if (isPrimaryKey && WM.element.inArray(column.fieldName, packageDetails[tablePackageName].primaryKeys) === -1) {
                                tableDetails[tableName].primaryKeys.push(column.fieldName);
                                packageDetails[tablePackageName].primaryKeys.push(column.fieldName);
                            }
                            tableDetails[tableName].columns.push({
                                "fieldName": column.fieldName,
                                "type": sqlType,
                                "hibernateType": column.hibernateType,
                                "fullyQualifiedType": sqlType,
                                "columnName": column.name,
                                "isPrimaryKey": isPrimaryKey,
                                "notNull": !column.nullable,
                                "length": column.length,
                                "precision": column.precision,
                                "generator": column.generator,
                                "isRelated": isForeignKey,
                                "defaultValue": column.defaultValue
                            });
                        });

                        WM.forEach(table.relations, function (relation) {
                            var relatedColumns = [];
                            /*Find out the related columns for the relation*/
                            _.each(relation.mappings, function (mapping) {
                                if (relation.primary) {
                                    relatedColumns.push(mapping.sourceColumn);
                                }
                            });
                            /*Loop through the table's columns*/
                            WM.forEach(tableDetails[tableName].columns, function (column) {

                                var fkColumnName = column.columnName;
                                /*Check if the column is a foreign-key/related column and it is present in the "relatedColumns" of the current relation.*/
                                if (column.isRelated && WM.element.inArray(fkColumnName, relatedColumns) !== -1) {

                                    /*Check if the current table is same as the table associated with the variable.*/
                                    if (tableName === variableType) {
                                        setVariableProp(variable, writableVariable, "properties", (variable.properties || []));
                                        /*Add the related table name to the variable.properties attribute so that complete data for the table could be fetched.
                                         * Following are the cases handled.
                                         * 1. Add the related table name only if it has not been added already. This case might arise if there are multiple relations
                                         * from Table1 to Table2
                                         * 2. Do not add the related table name if it is same as the current table. This case might arise if there is a relation from TableX to TableX itself(i.e., self-reference).*/

                                        /*Reset the "columnName" to the "relatedType" so that the "relatedType" is used for Display & CRUD operations.*/
                                        /*column.columnName = column.fieldName;
                                        column.fieldName = tableNameToEntityNameMap[relation.relatedType];
                                        column.fieldName = column.fieldName.charAt(0).toLowerCase() + column.fieldName.slice(1);*/
                                        column.relatedTableName = relation.targetTable;
                                        column.relatedEntityName = tableNameToEntityNameMap[relation.targetTable];
                                        if ((WM.element.inArray(relation.fieldName, variable.properties) === -1)) {
                                            variable.properties.push(relation.fieldName);
                                            setVariableProp(variable, writableVariable, "relatedTables", (variable.relatedTables || []));
                                            variable.relatedTables.push({
                                                "columnName": column.fieldName,
                                                "relationName": relation.fieldName,
                                                "type": tableNameToEntityNameMap[relation.targetTable],
                                                "package": tablePackageName,
                                                "watchOn": Utils.initCaps(variable.liveSource) + tableNameToEntityNameMap[relation.targetTable] + "Data"
                                            });
                                        }
                                    }
                                }
                            });
                        });
                    });

                    tableDetails[variableType].entityName = variable.type;
                    tableDetails[variableType].fullyQualifiedName = variable.package;
                    tableDetails[variableType].tableType = variable.tableType;
                    variableTable = tableDetails[variableType];

                    /*Iterate through the columns of the table associated with the variable and fetch all the columns of the related tables.*/
                    WM.forEach(variableTable.columns, function (column) {
                        var columnDef;
                        /*Fetch all the columns of the related table and set them as columns in the related column.*/
                        if (column.isRelated) {
                            /*Since "columns" may contain a reference to itself, "copy" is being used.
                            * This is done because there is a "copy" done in Variables.store.*/
                            column.columns = WM.copy(tableDetails[column.relatedTableName].columns);
                            column.relatedFieldName = column.fieldName + "." + tableDetails[column.relatedTableName].primaryKeys[0];
                            if ($rootScope.dataTypes[variable.package]) {
                                columnDef = $rootScope.dataTypes[variable.package].fields[column.fieldName];
                                column.isList = columnDef && columnDef.isList;
                            }
                        }
                    });

                    setVariableProp(variable, writableVariable, "propertiesMap", tableDetails[variableType]);

                    /*Set the propertiesMap property of the live-variable to correspond to the propertiesMap of the table*/
                    $rootScope.variables[variable.name].propertiesMap = variable.propertiesMap;

                    /*Set the "saveVariables" to true so that when "save"/"run" buttons are clicked, the variables could be saved into the file.*/
                    $rootScope.saveVariables = true;

                    Utils.triggerFn(callback, projectID, variable, options, success);
                }, WM.noop);
            },
        /*Function to prepare the options required to read data from the table.*/
            prepareTableOptions = function (variable, options) {
                var filterFields = [],
                    filterOptions = [],
                    orderByFields,
                    orderByOptions = '',
                    primaryKey = variable.getPrimaryKey(),
                    hasCompositeKey = variable.isCompositeKey(primaryKey),
                    hasNoPrimaryKey = variable.isNoPrimaryKey(primaryKey);
                /*get the filter fields from the variable*/
                _.each(variable.filterFields, function (value, key) {
                    value.fieldName = key;
                    value.filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES[variable.matchMode];
                    filterFields.push(value);
                });
                /*get the filter fields from the options*/
                _.each(options.filterFields, function (value, key) {
                    value.fieldName = key;
                    value.filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES[options.matchMode];
                    filterFields.push(value);
                });
                if (variable.operation === 'read') {
                    _.each(filterFields, function (fieldOptions) {
                        var attributeName,
                            fieldName = fieldOptions.fieldName,
                            fieldValue = fieldOptions.value,
                            fieldType = fieldOptions.type || getHibernateType(variable, fieldName) || getSqlType(variable, fieldName) || "integer",
                            filterCondition = fieldOptions.filterCondition;
                        /* if the field value is an object(complex type), loop over each field inside and push only first level fields */
                        if (WM.isObject(fieldValue) && !WM.isArray(fieldValue)) {
                            WM.forEach(fieldValue, function (subFieldValue, subFieldName) {
                                if (subFieldValue && !WM.isObject(subFieldValue)) {
                                    filterOptions.push(fieldName + "." + subFieldName + "=" + subFieldValue);
                                }
                            });
                        } else if (fieldValue) {
                            /*Based on the sqlType of the field, format the value & set the filter condition.*/
                            switch (fieldType) {
                            case "integer":
                                fieldValue = parseInt(fieldValue, 10);
                                filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES["exact"];
                                break;
                            case "big_decimal":
                            case "big_integer":
                            case "character":
                            case "double":
                            case "float":
                            case "boolean":
                            case "short":
                            case "byte":
                            case "time":
                                filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES["exact"];
                                break;
                            case "date":
                            case "datetime":
                                fieldValue = getDateInDefaultFormat(fieldValue, fieldType);
                                filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES["exact"];
                                break;
                            case "timestamp":
                                fieldValue = new Date(fieldValue).getTime();
                                filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES["exact"];
                                break;
                            case "string":
                                if (WM.isArray(fieldValue)) {
                                    filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES["exact"];
                                } else {
                                    filterCondition = filterCondition || DB_CONSTANTS.DATABASE_MATCH_MODES["anywhere"];
                                }
                                break;
                            default:
                                break;
                            }

                            attributeName = fieldName;
                            variable.propertiesMap.columns.forEach(function (column) {
                                if (column.fieldName === fieldName && column.isRelated) {
                                    attributeName = column.relatedFieldName;
                                }
                            });

                            /* check if the field is a composite key */
                            if (hasCompositeKey && (hasNoPrimaryKey || primaryKey.indexOf(attributeName) !== -1)) {
                                attributeName = "id." + attributeName;
                            }

                            filterOptions.push({
                                "attributeName": attributeName,
                                "attributeValue": fieldValue,
                                "attributeType": fieldType.toUpperCase(),
                                "filterCondition": filterCondition
                            });
                        }
                    });
                }

                orderByFields = (!options.orderBy || WM.element.isEmptyObject(options.orderBy)) ? variable.orderBy : options.orderBy;
                orderByFields.split("&").forEach(function (orderByOption) {
                    orderByOptions += "sort=" + orderByOption + "&";
                });
                orderByOptions = orderByOptions.slice(0, -1);

                return {
                    'filter': filterOptions,
                    'sort': orderByOptions
                };
            },
        /*Function to initiate the callback and obtain the data for the callback variable.*/
            initiateCallback = Variables.initiateCallback,
            processRequestQueue = Variables.processRequestQueue,
        /*Function to fetch the data for the primary table.*/
            getPrimaryTableData = function (projectID, variable, options, success, error) {

                var tableOptions,
                    dbOperation,
                    callBackScope,
                    variableOwner = variable.owner,
                    variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    promiseObj,
                    handleError = function (response) {
                        /* If in Run mode, initiate error callback for the variable */
                        if (CONSTANTS.isRunMode) {
                            initiateCallback("onError", variable, callBackScope, response);
                        }

                        /* update the dataSet against the variable */
                        updateVariableDataset(variable, [], variable.propertiesMap, $rootScope.variables[variable.name].pagingOptions);

                        /* If callback function is provided, send the data to the callback.
                         * The same callback if triggered in case of error also. The error-handling is done in grid.js*/
                        Utils.triggerFn(error, response);

                        /* process next requests in the queue */
                        if (CONSTANTS.isRunMode) {
                            variableActive[variable.activeScope.$id][variable.name] = false;
                            processRequestQueue(variable, requestQueue[variable.activeScope.$id], deployProjectAndFetchData);
                        }
                    };

                tableOptions = prepareTableOptions(variable, options);

                dbOperation = (tableOptions.filter && tableOptions.filter.length) ? "searchTableData" : "readTableData";
                /* if it is a prefab variable (used in a normal project), modify the url */
                /*Fetch the table data*/
                promiseObj = DatabaseService[dbOperation]({
                    "projectID": projectID,
                    "service": variable.prefabName ? "" : "services",
                    "dataModelName": variable.liveSource,
                    "entityName": variable.type,
                    "page": options.page || 1,
                    "size": CONSTANTS.isRunMode ? (variable.maxResults || 20) : (variable.designMaxResults || 20),
                    "sort": tableOptions.sort,
                    "data": tableOptions.filter,
                    "url": variable.prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + variable.prefabName) : $rootScope.project.deployedUrl
                }, function (response) {

                    if ((response && response.error) || !response || !WM.isArray(response.content)) {
                        Utils.triggerFn(handleError, response.error);
                        return;
                    }

                    processResponse(response.content);

                    /* Also, set the data property of the variable to correspond to the table-data*/
                    $rootScope.variables[variable.name].data = response.content;
                    $rootScope.variables[variable.name].pagingOptions = {"dataSize": response ? response.totalElements : null, "maxResults": variable.maxResults};

                    /* get the callback scope for the variable based on its owner */
                    if (variableOwner === "App") {
                        /* TODO: to look for a better option to get App/Page the controller's scope */
                        callBackScope = $rootScope || {};
                    } else {
                        if (variable.prefabName) {
                            callBackScope = options.scope || {};
                        } else {
                            callBackScope = (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
                        }
                    }

                    if (CONSTANTS.isRunMode) {
                        /* trigger success events associated with the variable */
                        WM.forEach(variableEvents, function (event) {
                            if (event !== "onError") {
                                /*handling onBeforeUpdate event of liveVariable to manipulate the data before the data is updated in
                                 * the variable dataSet*/
                                if (event === "onBeforeUpdate") {
                                    /*obtaining the returned data and setting it to the variable dataSet*/
                                    var newDataSet = initiateCallback(event, variable, callBackScope, response.content);
                                    if (newDataSet) {
                                        $rootScope.variables[variable.name].data = newDataSet;
                                    }
                                } else {
                                    initiateCallback(event, variable, callBackScope, response.content);
                                }
                            }
                        });
                    }
                    /* update the dataSet against the variable */
                    updateVariableDataset(variable, $rootScope.variables[variable.name].data, variable.propertiesMap, $rootScope.variables[variable.name].pagingOptions);

                    /* if callback function is provided, send the data to the callback */
                    Utils.triggerFn(success, $rootScope.variables[variable.name].data, variable.propertiesMap, $rootScope.variables[variable.name].pagingOptions);

                    /* process next requests in the queue */
                    if (CONSTANTS.isRunMode) {
                        variableActive[variable.activeScope.$id][variable.name] = false;
                        processRequestQueue(variable, requestQueue[variable.activeScope.$id], deployProjectAndFetchData);
                    }
                }, function (error) {
                    Utils.triggerFn(handleError, error);
                });

                if (CONSTANTS.isRunMode) {
                    variable.promise = promiseObj;
                }
            },
        /*Function to fetch the data for the variable (i.e., primary & related tables data)*/
            getTableData = function (projectID, variable, options, success, error) {
                var variableIndex = WM.element.inArray(variable.name, invalidVariables);
                /*If the variable is present in the list of invalid variables,
                * then do not process it. Simply remove it from the list of invalid variables.*/
                if (variableIndex === -1) {
                    /*Get the data of the primary table*/
                    getPrimaryTableData(projectID, variable, options, success, error);
                } else {
                    invalidVariables.splice(variableIndex, 1);
                }
            },
        /*Function to get variable data from backend service*/
            getDataFromService = function (variable, options, success, error) {
                var projectID = $rootScope.project.id || $rootScope.projectName;

                /* send data calls only for read type live-variables */
                if (variable.operation === 'read') {
                    getTableData(projectID, variable, options, success, error);
                }
            },
        /*Function to deploy the project and then fetch the required data.*/
            deployProjectAndFetchData = function (variable, options, success, error) {
                /*If the project has been deployed at least once OR in run mode, directly call the getDataFromService..
                 * Else, deploy the project before getDataFromService*/
                if (isProjectDeployed) {
                    getDataFromService(variable, options, success, error);
                    return;
                }

                /*If the project deploy is not in progress, invoke the function to deploy it.
                 * Also set the "isProjectDeployInProgress" flag to true.*/
                if (!isProjectDeployInProgress) {
                    isProjectDeployInProgress = true;
                    ProjectService.run({
                        projectId: $rootScope.project.id
                    }, function (result) {
                        /*Save the deployed url of the project in the $rootScope so that it could be used in all calls to services of deployed app*/
                        $rootScope.project.deployedUrl = Utils.removeProtocol(result);

                        /*Check if the project deploy request queue is non-empty.
                        * In that case, process the queue.
                        * Else, simply trigger the callbacks.*/
                        if (projectDeployReqQueue) {
                            /*Set the appropriate flags*/
                            isProjectDeployed = false;
                            isProjectDeployInProgress = false;
                            deployProjectAndFetchData(projectDeployReqQueue.variable, projectDeployReqQueue.options, projectDeployReqQueue.success, projectDeployReqQueue.error);
                            callbackParams.push({
                                "variable": variable,
                                "options": options,
                                "success": success,
                                "error": error
                            });
                            projectDeployReqQueue = undefined;
                        } else {
                            /*Invoke the function to get the data for the variable*/
                            getDataFromService(variable, options, success, error);
                            /*Set the appropriate flags*/
                            isProjectDeployed = true;
                            isProjectDeployInProgress = false;
                            /*Check for sanity*/
                            if (callbackParams.length) {
                                /*Iterate through the "callbackParams" and invoke "getData" for each of them.*/
                                WM.forEach(callbackParams, function (callbackParam) {
                                    deployProjectAndFetchData(callbackParam.variable, callbackParam.options, callbackParam.success, callbackParam.error);
                                });
                                /*Reset the array*/
                                callbackParams = [];
                            }
                            return true;
                        }
                    }, function (error) {
                        wmToaster.show("error", $rootScope.locale["MESSAGE_ERROR_TITLE"], $rootScope.locale["MESSAGE_INFO_DATABASE_DATA_LOADING_FAILED"] + " : " + error);
                        /*In case the project deploy fails, set the "isProjectDeployInProgress" flag to false so that the next time "getData" is invoked,
                        the project could be deployed.*/
                        isProjectDeployInProgress = false;

                        /*Update the variable with empty data so that the widgets reflect the same.*/
                        updateVariableDataset(variable, {'error': true, 'errorMessage': $rootScope.locale["MESSAGE_INFO_DATABASE_DATA_LOADING_FAILED"]}, variable.propertiesMap, {});
                        /*Check for sanity*/
                        if (callbackParams.length) {
                            /*Iterate through the "callbackParams" and set empty data for each of them.*/
                            WM.forEach(callbackParams, function (callbackParam) {
                                /*Update the variable with empty data so that the widgets reflect the same.*/
                                updateVariableDataset(callbackParam.variable, {'error': true, 'errorMessage': $rootScope.locale["MESSAGE_INFO_DATABASE_DATA_LOADING_FAILED"]}, callbackParam.variable.propertiesMap, {});
                            });
                            /*Reset the array*/
                            callbackParams = [];
                        }
                    });
                } else if (isDeployReqSourceChanged && !projectDeployReqQueue) { /*Check if the deploy request source has changed and the deploy request queue is empty.*/
                    projectDeployReqQueue = {
                        "variable": variable,
                        "options": options,
                        "success": success,
                        "error": error
                    };
                    isDeployReqSourceChanged = undefined;
                } else { /*Project deploy is in progress and deploy request queue is not empty.. So just add the successive parameters to "getData" to an array - "callbackParams".*/
                    callbackParams.push({
                        "variable": variable,
                        "options": options,
                        "success": success,
                        "error": error
                    });
                }
            },
        /* Function to check if specified field is of type date*/
            getFieldType = function (fieldName, variable) {
                var fieldType,
                    columns,
                    result;
                if (variable.propertiesMap) {
                    columns = variable.propertiesMap.columns || [];
                    result = _.find(columns, function (obj) {
                        return obj.fieldName === fieldName;
                    });
                    fieldType = result && result.type;
                }
                return fieldType;
            },
        /*Function to perform common database actions through calling DatabaseService methods*/
            performDataAction = function (action, variableDetails, options, success, error) {
                var dbName,
                    compositeId = "",
                    projectID = $rootScope.project.id || $rootScope.projectName,
                    rowObject = {},
                    prevData,
                    formattedData = {},
                    callBackScope,
                    variableEvents = VARIABLE_CONSTANTS.EVENTS,
                    promiseObj,
                    primaryKey,
                    compositeKeysData = {},
                    prevCompositeKeysData = {},
                    id,
                    columnName;
                /* evaluate the callback scope */
                /* get the callback scope for the variable based on its owner */
                if (variableDetails.owner === "App") {
                    /* TODO: to look for a better option to get App/Page the controller's scope */
                    callBackScope = $rootScope || {};
                } else {
                    callBackScope = (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
                }

                if (options.row) {
                    rowObject = options.row;
                } else {
                    WM.forEach(variableDetails.inputFields, function (fieldValue, fieldName) {
                        var fieldType;
                        if (WM.isDefined(fieldValue) && fieldValue !== "") {
                            /*For delete action, the inputFields need to be set in the request URL. Hence compositeId is set.
                             * For insert action inputFields need to be set in the request data. Hence rowObject is set.
                             * For update action, both need to be set.*/
                            if (action === "deleteTableData") {
                                compositeId = fieldValue;
                            }
                            if (action === "updateTableData") {
                                variableDetails.propertiesMap.primaryKeys.forEach(function (key) {
                                    if (fieldName === key) {
                                        compositeId = fieldValue;
                                    }
                                });
                            }
                            if (action !== "deleteTableData") {
                                fieldType = getFieldType(fieldName, variableDetails);
                                if (isDateTime[fieldType] && fieldType !== 'timestamp') {
                                    fieldValue = getDateInDefaultFormat(fieldValue, fieldType);
                                }
                                rowObject[fieldName] = fieldValue;
                            }
                        }
                    });
                }

                switch (action) {
                case 'insertTableData':
                case 'insertMultiPartTableData':
                    primaryKey = variableDetails.getPrimaryKey();
                    /*Construct the "requestData" based on whether the table associated with the live-variable has a composite key or not.*/
                    if (variableDetails.isCompositeKey(primaryKey)) {
                        if (variableDetails.isNoPrimaryKey(primaryKey)) {
                            formattedData.id = WM.copy(rowObject);
                            rowObject = {};
                        } else {
                            formattedData.id = {};
                            primaryKey.forEach(function (key) {
                                /*Check if the given column is a foreign key*/
                                var field = _.find(variableDetails.propertiesMap.columns, function (col) {
                                    return col.fieldName === key;
                                }), isRelated;
                                isRelated = field && field.isRelated;
                                /*If field is a foreign key, insert the rowobject directly in to id*/
                                if (isRelated) {
                                    formattedData.id = rowObject[key];
                                } else {
                                    formattedData.id[key] = rowObject[key];
                                }
                                delete rowObject[key];
                            });
                        }
                        rowObject.id = formattedData.id;
                    }
                    break;
                case 'updateTableData':
                case 'updateMultiPartTableData':
                    prevData = options.prevData || {};
                    primaryKey = variableDetails.getPrimaryKey();

                    /*Construct the "requestData" based on whether the table associated with the live-variable has a composite key or not.*/
                    if (variableDetails.isCompositeKey(primaryKey)) {
                        if (variableDetails.isNoPrimaryKey(primaryKey)) {
                            prevCompositeKeysData = prevData;
                            compositeKeysData = rowObject;
                            rowObject = {};
                        } else {
                            primaryKey.forEach(function (key) {
                                compositeKeysData[key] = rowObject[key];
                                prevCompositeKeysData[key] = prevData[key];
                                delete rowObject[key];
                            });
                        }
                        rowObject.id = compositeKeysData;
                        options.row = rowObject;
                        options.compositeKeysData = prevCompositeKeysData;
                    } else {
                        primaryKey.forEach(function (key) {
                            if (key.indexOf(".") === -1) {
                                id = prevData[key] || (options.rowData && options.rowData[key]) || rowObject[key];
                            } else {
                                columnName = key.split(".");
                                id = prevData[columnName[0]][columnName[1]];
                            }
                        });
                        options.id = id;
                        options.row = rowObject;
                    }

                    break;
                case 'deleteTableData':
                    primaryKey = variableDetails.getPrimaryKey();
                    /*Construct the "requestData" based on whether the table associated with the live-variable has a composite key or not.*/
                    if (variableDetails.isCompositeKey(primaryKey)) {
                        if (variableDetails.isNoPrimaryKey(primaryKey)) {
                            compositeKeysData = rowObject;
                        } else {
                            primaryKey.forEach(function (key) {
                                compositeKeysData[key] = rowObject[key];
                            });
                        }
                        options.compositeKeysData = compositeKeysData;
                    } else if (!WM.element.isEmptyObject(rowObject)) {
                        primaryKey.forEach(function (key) {
                            if (key.indexOf(".") === -1) {
                                id = rowObject[key];
                            } else {
                                columnName = key.split(".");
                                id = rowObject[columnName[0]][columnName[1]];
                            }
                        });
                        options.id = id;
                    }
                    break;
                default:
                    break;
                }

                /*Check if "options" have the "compositeKeysData" property.*/
                if (options.compositeKeysData) {
                    switch (action) {
                    case "updateTableData":
                        action = "updateCompositeTableData";
                        break;
                    case "deleteTableData":
                        action = "deleteCompositeTableData";
                        break;
                    default:
                        break;
                    }
                    /* Loop over the "compositeKeysData" and construct the "compositeId".*/
                    WM.forEach(options.compositeKeysData, function (paramValue, paramName) {
                        compositeId += paramName + "=" + encodeURIComponent(paramValue) + "&";
                    });
                    compositeId = compositeId.slice(0, -1);
                }
                dbName = variableDetails.liveSource;

                /*Set the "data" in the request to "undefined" if there is no data.
                * This handles cases such as "Delete" requests where data should not be passed.*/
                if (WM.element.isEmptyObject(rowObject) && action === "deleteTableData") {
                    rowObject = undefined;
                }
                promiseObj = DatabaseService[action]({
                    "projectID": projectID,
                    "service": variableDetails.prefabName ? "" : "services",
                    "dataModelName": dbName,
                    "entityName": variableDetails.type,
                    "id": WM.isDefined(options.id) ? encodeURIComponent(options.id) : compositeId,
                    "data": rowObject,
                    "url": variableDetails.prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + variableDetails.prefabName) : $rootScope.project.deployedUrl
                }, function (response) {
                    /* if error received on making call, call error callback */
                    if (response && response.error) {
                        /* If in RUN mode trigger error events associated with the variable */
                        if (CONSTANTS.isRunMode) {
                            initiateCallback("onError", variableDetails, callBackScope, response.error);
                        }
                        /* trigger error callback */
                        Utils.triggerFn(error, response.error);
                    } else {
                        if (CONSTANTS.isRunMode) {
                            /* trigger success events associated with the variable */
                            WM.forEach(variableEvents, function (event) {
                                if (event !== "onError") {
                                    initiateCallback(event, variableDetails, callBackScope, response);
                                }
                            });
                        }
                        Utils.triggerFn(success, response);
                    }
                }, function (response) {
                    /* If in RUN mode trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        initiateCallback("onError", variableDetails, callBackScope, response);
                    }
                    Utils.triggerFn(error, response);
                });

                if (CONSTANTS.isRunMode) {
                    variableDetails.promise = promiseObj;
                }
            },
        /* properties of a basic variable - should contain methods applicable on this particular object */
            methods = {
                /*Function to get the primary key of the specified variable.*/
                getPrimaryKey: function (variable) {
                    var primaryKey = [];
                    /*Loop through the propertiesMap and get the primary key column.*/
                    WM.element.each(variable.propertiesMap.columns, function (index, column) {
                        if (column.isPrimaryKey) {
                            if (column.isRelated && (WM.element.inArray(column.relatedFieldName, primaryKey) === -1)) {
                                primaryKey.push(column.relatedFieldName);
                            } else if (WM.element.inArray(column.fieldName, primaryKey) === -1) {
                                primaryKey.push(column.fieldName);
                            }
                        }
                    });
                    return primaryKey;
                },
                isCompositeKey: function (variable, primaryKey) {
                    return !primaryKey || (primaryKey && (!primaryKey.length || primaryKey.length > 1));
                },
                /*Function to check whether the table associated with the live-variable bound to the live-form has a primary key or not.*/
                isNoPrimaryKey: function (variable, primaryKey) {
                    return (!primaryKey || (primaryKey && !primaryKey.length));
                },
                /*function to get the data associated with the live variable*/
                getData: function (variable, options, success, error) {
                    var variableName = variable.name,
                        writableVariable,
                        projectID = $rootScope.project.id || $rootScope.projectName;

                    /*Check for sanity of the "variable".
                     * Studio Mode: Also, invoke the service to get the data of the variable only if the "liveSource" still exists in the project's databases.
                     * If the database has been deleted from the project, then prevent sending of the request.
                     * Run Mode: Invoke the service to get the variable data.*/
                    if (!Utils.isEmptyObject(variable) &&
                            ((CONSTANTS.isStudioMode && WM.element.inArray(variable.liveSource, $rootScope.databaseNames) !== -1) ||
                            CONSTANTS.isRunMode || variable.prefabName)) {
                        /* put the variable name into the variable object */
                        variable.name = variableName;

                        if (CONSTANTS.isRunMode) {
                            variableActive[variable.activeScope.$id] = variableActive[variable.activeScope.$id] || {};
                            if (variableActive[variable.activeScope.$id][variableName]) {
                                requestQueue[variable.activeScope.$id] = requestQueue[variable.activeScope.$id] || {};
                                requestQueue[variable.activeScope.$id][variableName] = requestQueue[variable.activeScope.$id][variableName] || [];
                                requestQueue[variable.activeScope.$id][variableName].push({variable: variable, options: options, success: success, error: error});
                                return;
                            }
                            variableActive[variable.activeScope.$id][variableName] = true;
                        }

                        /*Set a variable in the rootScope (specific to the project) )with the name of the live-variable*/
                        $rootScope.variables = $rootScope.variables || {};
                        $rootScope.variables[variable.name] = $rootScope.variables[variable.name] || {};

                        /*In the "Studio" mode, the entity meta data is read, the properties are updated in the variable;
                         * so that the variables.json file is updated on "save".
                         * 1. In the "Run"/"Application" mode, all the properties are fetched from the variable read from the file itself
                         * (as "getDataModel" call would not work in the "Application" mode).
                         * 2. In case of variables inside imported prefabs, "getDataModel" call would not work
                         * because the data-model would not be present in the project services directly.*/
                        if (!CONSTANTS.isRunMode && !variable.prefabName) {
                            /* get studio copy of variable*/
                            writableVariable = Variables.getVariableByName(variable.name);
                            getTableMetaData(projectID, variable, writableVariable, options, function () {
                                /*For variables of all operations, update the dataSet with the "propertiesMap" only.*/
                                updateVariableDataset(variable, {}, variable.propertiesMap, {});
                                /* if callback function is provided, send the data to the callback */
                                Utils.triggerFn(success, $rootScope.variables[variable.name].data, variable.propertiesMap, {}, {"dataSize": null, "maxResults": variable.maxResults});
                            });
                        }
                        /*In the Run mode, for variables of insert/update/delete type operation, update the dataSet with the "propertiesMap" only.*/
                        if (CONSTANTS.isRunMode && variable.operation !== 'read') {
                            /* update the dataSet against the variable */
                            updateVariableDataset(variable, {}, variable.propertiesMap, {});
                        }

                        /* Do not make calls to fetch data in case 'skipFetchData' is true, This flag is true when the variable is created for the first time */
                        if (!options.skipFetchData) {
                            deployProjectAndFetchData(variable, options, success, error);
                        }
                    }
                },
            /*Function to update the data associated with the related tables of the live variable*/
                updateRelatedData: function (variable, options, success, error) {
                    var projectID = $rootScope.project.id || $rootScope.projectName;

                    /*tableOptions = prepareTableOptions(variable, options);*/

                    /*Return if "relatedFieldName" is not passed in the options OR
                    if the relatedField is a one-to-many relation because this field value will directly be available in the data.
                    Call needs to be made only if a relatedField is a many-to-one relation.*/
                    if (!options.relatedFieldName || !isRelatedFieldMany(variable, options.relatedFieldName)) {
                        return;
                    }

                    /* if it is a prefab variable (used in a normal project), modify the url */
                    /*Fetch the table data*/
                    DatabaseService.readTableRelatedData({
                        "projectID": projectID,
                        "service": variable.prefabName ? "" : "services",
                        "dataModelName": variable.liveSource,
                        "entityName": variable.type,
                        "id": options.id,
                        "relatedFieldName": options.relatedFieldName,
                        "page": options.page || 1,
                        "size": CONSTANTS.isRunMode ? (variable.maxResults || 20) : (variable.designMaxResults || 20),
                        /*"sort": tableOptions.sort,
                        "data": tableOptions.filter,*/
                        "url": variable.prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + variable.prefabName) : $rootScope.project.deployedUrl
                    }, function (response) {

                        if ((response && response.error) || !response || !WM.isArray(response.content)) {
                            Utils.triggerFn(error, response.error);
                            return;
                        }

                        /*If the table has a composite key, key data will be wrapped in an object with the key "id".
                         * Hence, the data is formatted to remove the extra key and merge it into the content.*/
                        response.content.forEach(function (rowData) {
                            var tempData;
                            /*Check if the value corresponding to the key "id" is an object.*/
                            if (rowData && WM.isObject(rowData.id)) {
                                tempData = rowData.id;
                                delete rowData.id;
                                WM.extend(rowData, tempData);
                            }
                        });

                        /* if callback function is provided, send the data to the callback */
                        Utils.triggerFn(success, response.content, undefined, {}, {"dataSize": response ? response.totalElements : null, "maxResults": variable.maxResults});

                    }, function (error) {
                        Utils.triggerFn(error, error);
                    });
                },
            /*function to delete a row in the data associated with the live variable*/
                deleteRecord: function (variable, options, success, error) {
                    performDataAction('deleteTableData', variable, options, success, error);
                },
            /*function to update a row in the data associated with the live variable*/
                updateRecord: function (variable, options, success, error) {
                    if (options.multipartData) {
                        performDataAction('updateMultiPartTableData', variable, options, success, error);
                    } else {
                        performDataAction('updateTableData', variable, options, success, error);
                    }
                },
            /*function to insert a row into the data associated with the live variable*/
                insertRecord: function (variable, options, success, error) {
                    if (options.multipartData) {
                        performDataAction('insertMultiPartTableData', variable, options, success, error);
                    } else {
                        performDataAction('insertTableData', variable, options, success, error);
                    }
                },
            /*function to set the orderBy property of the live variable*/
                setOrderBy: function (variable, expression) {
                    variable.orderBy = expression;

                    /* update the variable if autoUpdate flag is set */
                    if (variable.autoUpdate) {
                        variable.update();
                    }

                    return variable.orderBy;
                },
                getDataSet: function (variable) {
                    /* return the variable dataSet*/
                    return variable.dataSet;
                },
                clearData: function (variable) {
                    variable.dataSet = {};

                    /* return the variable dataSet*/
                    return variable.dataSet;
                },
                cancel: function (variable) {
                    /* process only if current variable is actually active */
                    if (variableActive[variable.activeScope.$id][variable.name] && variable.promise) {
                        variable.promise.abort();
                    }
                },
                setInput: function (variable, key, val) {
                    var paramObj = {},
                        targetObj = {};
                    if (WM.isObject(key)) {
                        paramObj = key;
                    } else {
                        paramObj[key] = val;
                    }

                    if (!variable.inputFields) {
                        variable.inputFields = {};
                    }
                    targetObj = variable.inputFields;

                    WM.forEach(paramObj, function (paramVal, paramKey) {
                        targetObj[paramKey] = paramVal;
                    });

                    return targetObj;
                },
                setFilter: function (variable, key, val) {
                    var paramObj = {},
                        targetObj = {};
                    if (WM.isObject(key)) {
                        paramObj = key;
                    } else {
                        paramObj[key] = val;
                    }

                    if (!variable.filterFields) {
                        variable.filterFields = {};
                    }
                    targetObj = variable.filterFields;

                    WM.forEach(paramObj, function (paramVal, paramKey) {
                        targetObj[paramKey] = {
                            "value": paramVal
                        };
                    });

                    return targetObj;
                },
                getModifiedFieldName: function (variable, fieldName) {
                    var primaryKey = variable.getPrimaryKey(),
                        modifiedFieldName = fieldName;
                    if (variable.isCompositeKey(primaryKey) && (variable.isNoPrimaryKey(primaryKey) || primaryKey.indexOf(fieldName) !== -1)) {
                        modifiedFieldName = 'id.' + fieldName;
                    }
                    return modifiedFieldName;
                },
                getRelatedTableData: function (variable, columnName, options, success, error) {
                    var projectID = $rootScope.project.id || $rootScope.projectName,
                        resultProperties = {
                            "firstResult": 0,
                            "maxResults": options.maxResults || 100
                        },
                        relatedTable = _.find(variable.relatedTables, function (table) {
                            return table.columnName === columnName;
                        });
                    /* if orderBy properties is set, append it to the resultProperties */
                    if (variable.orderBy) {
                        resultProperties.orderBy = variable.orderBy.split(',');
                    }
                    DatabaseService.readTableData({
                        "projectID": projectID,
                        "service": variable.prefabName ? "" : "services",
                        "dataModelName": variable.liveSource,
                        "entityName": relatedTable.type,
                        "page": 1,
                        "size": resultProperties.maxResults,
                        "url": variable.prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + variable.prefabName) : $rootScope.project.deployedUrl
                    }, function (response) {
                        Utils.triggerFn(success, response.content);
                    }, function (errMsg) {
                        Utils.triggerFn(error, errMsg);
                    });
                },
                getRelatedTablePrimaryKeys: function (variable, columnName, options) {
                    var relatedVariable,
                        relatedTable,
                        primaryKeys;
                    options = options || {};
                    options.scope = options.scope || $rootScope;
                    relatedTable = _.find(variable.relatedTables, function (table) {
                        return table.columnName === columnName;
                    });
                    relatedVariable = relatedTable && options.scope.Variables[relatedTable.watchOn];
                    primaryKeys = relatedVariable ? relatedVariable.getPrimaryKey() : [];
                    return primaryKeys;
                }
            },

            liveVariableObj = {
                update: function (options, success, error) {
                    var name = this.name;
                    options = options || {};
                    options.scope = this.activeScope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', name, true);
                    }

                    methods.getData(this, options, function (data, propertiesMap, pageOptions) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(success, data, propertiesMap, pageOptions);
                    }, function (errMsg) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(error, errMsg);
                    });
                },
                updateRecord: function (options, success, error) {
                    var name = this.name;
                    options = options || {};
                    options.scope = this.activeScope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', name, true);
                    }

                    methods.updateRecord(this, options, function (response) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(success, response);
                    }, function (errMsg) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(error, errMsg);
                    });
                },
                insertRecord: function (options, success, error) {
                    var name = this.name;
                    options = options || {};
                    options.scope = this.activeScope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', name, true);
                    }

                    methods.insertRecord(this, options, function (response) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(success, response);
                    }, function (errMsg) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(error, errMsg);
                    });
                },
                deleteRecord: function (options, success, error) {
                    var name = this.name;
                    options = options || {};
                    options.scope = this.activeScope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', name, true);
                    }

                    methods.deleteRecord(this, options, function (response) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(success, response);
                    }, function (errMsg) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', name, false);
                        }
                        Utils.triggerFn(error, errMsg);
                    });
                },
                updateRelatedData: function (options, success, error) {
                    options = options || {};
                    options.scope = this.activeScope;

                    methods.updateRelatedData(this, options, function (data, propertiesMap, pageOptions) {
                        Utils.triggerFn(success, data, propertiesMap, pageOptions);
                    }, function (errMsg) {
                        Utils.triggerFn(error, errMsg);
                    });
                },
                getPrimaryKey: function () {
                    return methods.getPrimaryKey(this);
                },
                isCompositeKey: function (primaryKey) {
                    return methods.isCompositeKey(this, primaryKey);
                },
                isNoPrimaryKey: function (primaryKey) {
                    return methods.isNoPrimaryKey(this, primaryKey);
                },
                setOrderBy: function (expression) {
                    return methods.setOrderBy(this, expression);
                },
                getData: function () {
                    return methods.getDataSet(this);
                },
                clearData: function () {
                    return methods.clearData(this);
                },
                cancel: function () {
                    return methods.cancel(this);
                },
                setInput: function (key, val) {
                    return methods.setInput(this, key, val);
                },
                setFilter: function (key, val) {
                    return methods.setFilter(this, key, val);
                },
                getModifiedFieldName: function (fieldName) {
                    return methods.getModifiedFieldName(this, fieldName);
                },
                getRelatedTableData: function (columnName, options, success, error) {
                    return methods.getRelatedTableData(this, columnName, options, success, error);
                },
                getRelatedTablePrimaryKeys: function (columnName, options) {
                    return methods.getRelatedTablePrimaryKeys(this, columnName, options);
                }
            };

        /* register the variable to the base service*/
        BaseVariablePropertyFactory.register('wm.LiveVariable', liveVariableObj, ['wm.Variable', 'wm.ServiceVariable'], methods);

        return {
            reset: reset,
            processResponse: processResponse
        };
    }
];
