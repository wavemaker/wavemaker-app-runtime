/*global wm, WM, _, moment, FormData, Blob, window*/
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
    "ServiceFactory",
    "$timeout",
    "SWAGGER_CONSTANTS",
    function ($rootScope, DatabaseService, Variables, BaseVariablePropertyFactory, CONSTANTS, Utils, VARIABLE_CONSTANTS, ProjectService, DB_CONSTANTS, wmToaster, ServiceFactory, $timeout, SWAGGER_CONSTANTS) {
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
            emptyArr = [],
        /*Function to clear set variables*/
            reset = function () {
                isProjectDeployed = (CONSTANTS.isRunMode);
                /*Set the "isDeployReqSourceChanged" flag to true so that the deploy request queue is populated only when the deploy source changes.*/
                isDeployReqSourceChanged = true;
            },
            // Generate the URL based on the primary keys and their values
            getCompositeIDURL = function (primaryKeysData) {
                var compositeId = '';
                //Loop over the "compositeKeysData" and construct the "compositeId".
                _.forEach(primaryKeysData, function (paramValue, paramName) {
                    compositeId += paramName + "=" + encodeURIComponent(paramValue) + "&";
                });
                compositeId = compositeId.slice(0, -1);
                return compositeId;
            },
            // Construct the URL for blob columns and set it in the data, so that widgets can use this
            processBlobColumns = function (responseData, variable) {
                if (!responseData) {
                    return;
                }
                var blobCols = _.map(_.filter(variable.propertiesMap.columns, {'type': 'blob'}), 'fieldName'),
                    href = '',
                    primaryKeys,
                    deployedUrl = _.trim($rootScope.project.deployedUrl);
                if (_.isEmpty(blobCols)) {
                    return;
                }
                if (CONSTANTS.hasCordova && CONSTANTS.isRunMode) {
                    href += _.endsWith(deployedUrl, '/') ? deployedUrl : deployedUrl + '/';
                }
                href        += ((variable._prefabName !== '' && variable._prefabName !== undefined) ? 'prefabs/' + variable._prefabName : 'services') + '/' + variable.liveSource + '/' + variable.type + '/';
                primaryKeys = variable.propertiesMap.primaryFields || variable.propertiesMap.primaryKeys;
                _.forEach(responseData, function (data) {
                    if (data) {
                        _.forEach(blobCols, function (col) {
                            var compositeKeysData = {};
                            if (data[col] === null || !_.isEmpty(_.trim(data[col]))) {
                                return;
                            }
                            if (variable.isCompositeKey(primaryKeys)) {
                                primaryKeys.forEach(function (key) {
                                    compositeKeysData[key] = data[key];
                                });
                                data[col] = href + 'composite-id/content/' + col + '?' + getCompositeIDURL(compositeKeysData);
                            } else {
                                data[col] = href + data[_.join(primaryKeys)] + '/content/' + col;
                            }
                        });
                    }
                });
            },
            getHibernateOrSqlType = function (variable, fieldName, type) {
                var columns = variable.propertiesMap.columns,
                    column,
                    relatedCols,
                    relatedCol;
                if (_.includes(fieldName, '.')) {
                    column = _.find(columns, function (col) {
                        return col.fieldName === fieldName.split('.')[0];
                    });
                    relatedCols = column && column.columns;
                    relatedCol = _.find(relatedCols, function (col) {
                        return col.fieldName === fieldName.split('.')[1];
                    });
                    return relatedCol && relatedCol[type];
                }
                column = _.find(columns, function (col) {
                    return col.fieldName === fieldName || col.relatedColumnName === fieldName;
                });
                return column && column[type];
            },
            /*Function to get the sqlType of the specified field.*/
            getSqlType = function (variable, fieldName) {
                return getHibernateOrSqlType(variable, fieldName, 'type');
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
                    'data'          : data,
                    'propertiesMap' : propertiesMap,
                    'pagingOptions' : pagingOptions
                };
            },
            setVariableProp = function (variable, writableVariable, propertyName, propertyValue) {
                variable[propertyName] = propertyValue;
                /*Check for sanity.
                * writableVariable will be null in case of partial page variables.*/
                if (writableVariable && !WM.equals(writableVariable[propertyName], propertyValue)) {
                    /*Set the "saveVariables" to true so that when "save"/"run" buttons are clicked, the variables could be saved into the file.*/
                    $rootScope.saveVariables = true;
                    writableVariable[propertyName] = propertyValue;
                    Variables.updateVariable(writableVariable.name, writableVariable);
                }
            },
        /*Function to fetch the meta data for the table.*/
            getTableMetaData = function (projectID, variable, writableVariable, options, callback, success) {
                var tableDetails = {};

                /*Fetch the type nodes(consisting of the table & column details) for the database*/
                DataModelDesignManager.getDataModel(projectID, variable.liveSource, false, function (database) {
                    var variableTable,
                        variableType,
                        firstPrimaryKey,
                        tableNameToEntityNameMap = {},
                        entityNameToTableNameMap = {},
                        getJavaType = function (javaType) {
                            if (DB_CONSTANTS.DATABASE_DATA_TYPES[javaType]) {
                                javaType = DB_CONSTANTS.DATABASE_DATA_TYPES[javaType].java_type;
                            } else if (DB_CONSTANTS.DATABASE_SECONDARY_DATA_TYPES[javaType]) {
                                javaType = DB_CONSTANTS.DATABASE_DATA_TYPES[DB_CONSTANTS.DATABASE_SECONDARY_DATA_TYPES[javaType].java_type].java_type;
                            }
                            return javaType;
                        };
                    /*Clearing old relatedTables array so that it is populated with new values*/
                    variable.relatedTables = [];
                    variable.properties = [];
                    _.forEach(database.tables, function (table) {
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
                    _.forEach(database.tables, function (table) {

                        var tableName = table.name,
                            tablePackageName = database.packageName + "." + table.entityName,
                            primaryKeys = table.primaryKey.columns || [],
                            foreignKeys = [],
                            columnsAdded = [];

                        /*Add the "table-name" as a key to "tableDetails" and initialize "columnNames" and "relations".*/
                        tableDetails[tableName] = {};
                        tableDetails[tableName].columns = [];
                        tableDetails[tableName].primaryFields = [];
                        packageDetails[tablePackageName] = packageDetails[tablePackageName] || {};
                        packageDetails[tablePackageName].primaryFields = [];
                        /*Check if the current table is same as the table associated with the variable.*/
                        if (tableName === variableType) {
                            setVariableProp(variable, writableVariable, "package", tablePackageName);
                            setVariableProp(variable, writableVariable, "tableName", table.name);
                            setVariableProp(variable, writableVariable, "tableType", WM.isDefined(table.type) ? table.type : "TABLE");
                        }
                        /*Order the relations with priority as composite relations and one to one*/
                        table.relations = _.sortBy(table.relations, function (relation) {
                            return [relation.composite === false, relation.cardinality !== "OneToOne"];
                        });
                        /*Loop through the relations and insert the related columns*/
                        _.forEach(table.relations, function (relation) {
                            if (relation.primary) {
                                var sourceCols = _.map(relation.mappings, function (mapping) {
                                        return mapping.sourceColumn;
                                    }),
                                    isPrimaryKey = _.intersection(sourceCols, primaryKeys).length > 0,
                                    newColumn,
                                    relatedCol,
                                    javaType,
                                    columnValue;
                                /*Find out the foreign keys from the relations*/
                                foreignKeys = foreignKeys.concat(sourceCols);
                                /*Find the related column*/
                                relatedCol = _.find(table.columns, function (col) {
                                    return col.name === sourceCols[0];
                                });

                                if (relatedCol.hidden) {
                                    columnsAdded = columnsAdded.concat(sourceCols);
                                    return;
                                }
                                javaType = getJavaType(relatedCol.javaType);
                                newColumn = {
                                    'fieldName'          : relation.fieldName,
                                    'relatedColumnName'  : relatedCol.fieldName,
                                    'type'               : javaType,
                                    'fullyQualifiedType' : javaType,
                                    'columnName'         : sourceCols.join(','),
                                    'isPrimaryKey'       : isPrimaryKey,
                                    'notNull'            : !relatedCol.nullable,
                                    'length'             : relatedCol.length,
                                    'precision'          : relatedCol.precision,
                                    'scale'              : relatedCol.scale,
                                    'generator'          : relatedCol.generatorType,
                                    'isRelated'          : true,
                                    'defaultValue'       : _.get(relatedCol, ['columnValue', 'defaultValue']),
                                    'targetTable'        : relation.targetTable
                                };
                                columnValue = relatedCol.columnValue;
                                if (columnValue && columnValue.type !== 'user-defined') {
                                    newColumn.systemInserted = newColumn.systemUpdated = true;
                                }
                                /*Removing properties with undefined or null values*/
                                newColumn = _.omitBy(newColumn, function (value) {
                                    return _.isUndefined(value) || _.isNull(value);
                                });
                                /*If the column is already part of other relation, add readonly flag so that the it is not shown in liveform*/
                                if (_.intersection(columnsAdded, sourceCols).length) {
                                    newColumn.readonly = true;
                                }
                                tableDetails[tableName].columns.push(newColumn);
                                columnsAdded = columnsAdded.concat(sourceCols);
                            }
                        });
                        /*Loop through the table*/
                        _.forEach(table.columns, function (column) {
                            /*Hidden columns should not be included in properties map*/
                            if (column.hidden) {
                                return;
                            }
                            /*Columns names are present in primary keys. Map the respective field names*/
                            if (_.includes(table.primaryKey.columns, column.name)) {
                                tableDetails[tableName].primaryFields.push(column.fieldName);
                                packageDetails[tablePackageName].primaryFields.push(column.fieldName);
                            }
                            if (!_.includes(columnsAdded, column.name)) {
                                var javaType = getJavaType(column.javaType),
                                    isPrimaryKey = _.includes(primaryKeys, column.name),
                                    isForeignKey = _.includes(foreignKeys, column.name),
                                    newColumn = {
                                        "fieldName"         : column.fieldName,
                                        "type"              : javaType,
                                        "fullyQualifiedType": javaType,
                                        "columnName"        : column.name,
                                        "isPrimaryKey"      : isPrimaryKey,
                                        "notNull"           : !column.nullable,
                                        "length"            : column.length,
                                        "precision"         : column.precision,
                                        "scale"             : column.scale,
                                        "generator"         : column.generatorType,
                                        "isRelated"         : isForeignKey,
                                        "defaultValue"      : _.get(column, ['columnValue', 'defaultValue'])
                                    },
                                    columnValue = column.columnValue;
                                if (columnValue && columnValue.type !== 'user-defined') {
                                    newColumn.systemInserted = newColumn.systemUpdated = true;
                                }
                                /*Removing properties with undefined or null values*/
                                newColumn = _.omitBy(newColumn, function (value) {
                                    return _.isUndefined(value) || _.isNull(value);
                                });
                                tableDetails[tableName].columns.push(newColumn);
                            }
                        });

                        _.forEach(table.relations, function (relation) {
                            var relatedColumns = [];
                            /*Find out the related columns for the relation*/
                            _.each(relation.mappings, function (mapping) {
                                if (relation.primary) {
                                    relatedColumns.push(mapping.sourceColumn);
                                }
                            });
                            /*Loop through the table's columns*/
                            _.forEach(tableDetails[tableName].columns, function (column) {

                                var fkColumnName = column.columnName.split(',');
                                /*Check if the column is a foreign-key/related column and it is present in the "relatedColumns" of the current relation.*/
                                if (column.isRelated && _.isEqual(relatedColumns, fkColumnName)) {

                                    /*Check if the current table is same as the table associated with the variable.*/
                                    if (tableName === variableType) {
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
                    setVariableProp(variable, writableVariable, 'properties', (variable.properties || []));
                    setVariableProp(variable, writableVariable, 'relatedTables', (variable.relatedTables || []));
                    tableDetails[variableType].entityName = variable.type;
                    tableDetails[variableType].fullyQualifiedName = variable.package;
                    tableDetails[variableType].tableType = variable.tableType;
                    variableTable = tableDetails[variableType];

                    /*Iterate through the columns of the table associated with the variable and fetch all the columns of the related tables.*/
                    _.forEach(variableTable.columns, function (column) {
                        var columnDef;
                        /*Fetch all the columns of the related table and set them as columns in the related column.*/
                        if (column.isRelated) {
                            /*Since "columns" may contain a reference to itself, "copy" is being used.
                            * This is done because there is a "copy" done in Variables.store.*/
                            column.columns = Utils.getClonedObject(tableDetails[column.relatedTableName].columns);
                            column.relatedFieldName = column.fieldName + "." + tableDetails[column.relatedTableName].primaryFields[0];
                            if ($rootScope.dataTypes[variable.package]) {
                                columnDef = $rootScope.dataTypes[variable.package].fields[column.fieldName];
                                column.isList = columnDef ? columnDef.isList : false;
                            }
                        }
                    });

                    setVariableProp(variable, writableVariable, 'propertiesMap', tableDetails[variableType]);

                    if (writableVariable && writableVariable._isNew) {
                        //For new variable, if orderby is not set, set the default orderby as primary field with ascending order
                        firstPrimaryKey = _.head(variable.propertiesMap.primaryFields);
                        if (!writableVariable.orderBy && firstPrimaryKey) {
                            setVariableProp(variable, writableVariable, 'orderBy', firstPrimaryKey + ' asc');
                        }
                        variable._isNew = writableVariable._isNew = false;
                    }
                    Utils.triggerFn(callback, projectID, variable, options, success);
                }, WM.noop);
            },
            //Check if the type is string or text
            isStringType = function (type) {
                return _.includes(['text', 'string'], _.toLower(type));
            },
            //Wrap the field name and value in lower() in ignore case scenario
            //TODO: Change the function name to represent the added functionality of identifiers for datetime, timestamp and float types. Previously only lower was warapped.
            wrapInLowerCase = function (value, options, ignoreCase, isField) {
                var type = _.toLower(options.attributeType);
                if (!isField) {
                    //Wrap the identifiers for datetime, timestamp and float types. Wrappring is not required for fields.
                    if (type === 'datetime') {
                        return 'wm_dt(' + value + ')';
                    }
                    if (type === 'timestamp') {
                        return 'wm_ts(' + value + ')';
                    }
                    if (type === 'float') {
                        return 'wm_float(' + value + ')';
                    }
                    if (type === 'boolean') {
                        return 'wm_bool(' + value + ')';
                    }
                }
                //If ignore case is true and type is string/ text and match mode is string type, wrap in lower()
                if (ignoreCase && (!type || isStringType(type)) && _.includes(DB_CONSTANTS.DATABASE_STRING_MODES, options.filterCondition)) {
                    return 'lower(' + value + ')';
                }
                return value;
            },
            //Encode the value and wrap it inside single quotes
            encodeAndAddQuotes = function (value, type, skipEncode) {
                var encodedValue = skipEncode ? value : encodeURIComponent(value);
                type = _.toLower(type);
                encodedValue = _.replace(encodedValue, /'/g, "''");
                //For number types, don't wrap the value in quotes
                if ((Utils.isNumberType(type) && type !== 'float')) {
                    return encodedValue;
                }
                return '\'' + encodedValue + '\'';
            },
            //Get the param value based on the filter condition
            getParamValue = function (value, options, ignoreCase, skipEncode) {
                var param,
                    filterCondition = options.filterCondition,
                    dbModes         = DB_CONSTANTS.DATABASE_MATCH_MODES,
                    type            = options.attributeType;
                if (_.includes(DB_CONSTANTS.DATABASE_EMPTY_MATCH_MODES, filterCondition)) {
                    //For empty matchmodes, no value is required
                    return '';
                }
                switch (filterCondition) {
                case dbModes.start:
                    param = encodeAndAddQuotes(value + '%', type, skipEncode);
                    param = wrapInLowerCase(param, options, ignoreCase);
                    break;
                case dbModes.end:
                    param = encodeAndAddQuotes('%' + value, type, skipEncode);
                    param = wrapInLowerCase(param, options, ignoreCase);
                    break;
                case dbModes.anywhere:
                    param = encodeAndAddQuotes('%' + value + '%', type, skipEncode);
                    param = wrapInLowerCase(param, options, ignoreCase);
                    break;
                case dbModes.exact:
                case dbModes.notequals:
                    param = encodeAndAddQuotes(value, type, skipEncode);
                    param = wrapInLowerCase(param, options, ignoreCase);
                    break;
                case dbModes.between:
                    param = _.join(_.map(value, function (val) {
                        return wrapInLowerCase(encodeAndAddQuotes(val, type, skipEncode), options, ignoreCase);
                    }), ' and ');
                    break;
                case dbModes.in:
                    param = _.join(_.map(value, function (val) {
                        return wrapInLowerCase(encodeAndAddQuotes(val, type, skipEncode), options, ignoreCase);
                    }), ', ');
                    param = '(' + param + ')';
                    break;
                default:
                    param = encodeAndAddQuotes(value, type, skipEncode);
                    param = wrapInLowerCase(param, options, ignoreCase);
                    break;
                }
                return WM.isDefined(param) ? param : '';
            },
            //Generate the search query based on the filter options
            getSearchQuery = function (filterOptions, operator, ignoreCase, skipEncode) {
                var query,
                    params = [];
                _.forEach(filterOptions, function (fieldValue) {
                    var fieldName       = fieldValue.attributeName,
                        value           = fieldValue.attributeValue,
                        filterCondition = fieldValue.filterCondition,
                        isValArray      = _.isArray(value),
                        dbModes         = DB_CONSTANTS.DATABASE_MATCH_MODES,
                        matchModeExpr,
                        paramValue;
                    // If value is an empty array, do not generate the query
                    // If values is NaN and number type, do not generate query for this field
                    if ((isValArray && _.isEmpty(value)) || (!isValArray && isNaN(value) && Utils.isNumberType(fieldValue.attributeType))) {
                        return;
                    }
                    if (isValArray) {
                        //If array is value and mode is between, pass between. Else pass as in query
                        filterCondition            = filterCondition === dbModes.between ? filterCondition : dbModes.in;
                        fieldValue.filterCondition = filterCondition;
                    }
                    matchModeExpr  = DB_CONSTANTS.DATABASE_MATCH_MODES_WITH_QUERY[filterCondition];
                    paramValue     = getParamValue(value, fieldValue, ignoreCase, skipEncode);
                    fieldName      = wrapInLowerCase(fieldName, fieldValue, ignoreCase, true);
                    params.push(Utils.replace(matchModeExpr, [fieldName, paramValue]));
                });
                query = _.join(params, operator); //empty space added intentionally around OR
                return query;
            },
            //Get the related field name for the field given
            getAttributeName = function (variable, fieldName) {
                var attrName = fieldName;
                variable.propertiesMap.columns.forEach(function (column) {
                    if (column.fieldName === fieldName && column.isRelated) {
                        attrName = column.relatedFieldName;
                    }
                });
                return attrName;
            },
            //Get SQL field type form options or variable properties
            getSQLFieldType = function (variable, options) {
                if (_.includes(['timestamp', 'datetime', 'date'], options.type)) {
                    return options.type;
                }
                return getSqlType(variable, options.fieldName) || options.type;
            },
            //Get the default filter condition
            getFilterCondition = function (filterCondition) {
                if (_.includes(DB_CONSTANTS.DATABASE_RANGE_MATCH_MODES, filterCondition)) {
                    return filterCondition;
                }
                return DB_CONSTANTS.DATABASE_MATCH_MODES['exact'];
            },
            /**
             * Transform the filter fields with valid value and filter condition
             * @param variable Variable object
             * @param filterFields Filter options to be passed
             * @param options Extra options containing logical op
             * @returns {Array} transformed filter options
             */
            getFilterOptions = function (variable, filterFields, options) {
                var filterOptions = [],
                    matchModes    = DB_CONSTANTS.DATABASE_MATCH_MODES;
                _.each(filterFields, function (fieldOptions) {
                    var attributeName,
                        fieldName       = fieldOptions.fieldName,
                        fieldValue      = fieldOptions.value,
                        fieldType       = getSQLFieldType(variable, fieldOptions),
                        filterCondition = fieldOptions.filterCondition,
                        filterOption;

                    fieldOptions.type = fieldType;
                    /* if the field value is an object(complex type), loop over each field inside and push only first level fields */
                    if (WM.isObject(fieldValue) && !WM.isArray(fieldValue)) {
                        _.forEach(fieldValue, function (subFieldValue, subFieldName) {
                            if (subFieldValue && !WM.isObject(subFieldValue)) {
                                filterOptions.push(fieldName + '.' + subFieldName + '=' + subFieldValue);
                            }
                        });
                    } else if (WM.isDefined(fieldValue) && fieldValue !== null && fieldValue !== '') {
                        /*Based on the sqlType of the field, format the value & set the filter condition.*/
                        if (fieldType) {
                            switch (fieldType) {
                                case 'integer':
                                    fieldValue = WM.isArray(fieldValue) ? _.map(fieldValue, function (value) {
                                            return parseInt(value, 10);
                                        }) : parseInt(fieldValue, 10);
                                    filterCondition = filterCondition ? getFilterCondition(filterCondition) : matchModes['exact'];
                                    break;
                                case 'date':
                                case 'datetime':
                                case 'timestamp':
                                    fieldValue = Utils.formatDate(fieldValue, fieldType);
                                    filterCondition = filterCondition ? getFilterCondition(filterCondition) : matchModes['exact'];
                                    break;
                                case 'text':
                                case 'string':
                                    if (WM.isArray(fieldValue)) {
                                        filterCondition = matchModes['exact'];
                                    } else {
                                        filterCondition = filterCondition || matchModes['anywhere'];
                                    }
                                    break;
                                default:
                                    filterCondition = filterCondition ? getFilterCondition(filterCondition) : matchModes['exact'];
                                    break;
                            }
                        } else {
                            filterCondition = _.isString(fieldValue) ? matchModes['anywhere'] : matchModes['exact'];
                        }
                        attributeName = getAttributeName(variable, fieldName);
                        filterOption  = {
                            'attributeName'   : attributeName,
                            'attributeValue'  : fieldValue,
                            'attributeType'   : _.toUpper(fieldType),
                            'filterCondition' : filterCondition
                        };
                        if (options.searchWithQuery) {
                            filterOption.isVariableFilter = fieldOptions.isVariableFilter;
                        }
                        filterOptions.push(filterOption);
                    } else if (_.includes(DB_CONSTANTS.DATABASE_EMPTY_MATCH_MODES, filterCondition)) {
                        attributeName = getAttributeName(variable, fieldName);
                        //For non string types empty match modes are not supported, so convert them to null match modes.
                        if (fieldType && !isStringType(fieldType)) {
                            filterCondition = DB_CONSTANTS.DATABASE_NULL_EMPTY_MATCH[filterCondition];
                        }
                        filterOption = {
                            'attributeName'   : attributeName,
                            'attributeValue'  : '',
                            'attributeType'   : _.toUpper(fieldType),
                            'filterCondition' : filterCondition
                        };
                        if (options.searchWithQuery) {
                            filterOption.isVariableFilter = fieldOptions.isVariableFilter;
                        }
                        filterOptions.push(filterOption);
                    }
                });
                return filterOptions;
            },
            /*Function to prepare the options required to read data from the table.*/
            prepareTableOptions = function (variable, options, clonedFields) {
                if (_.isUndefined(options.searchWithQuery)) {
                    options.searchWithQuery = true;//Using query api instead of  search api
                }
                var filterFields  = [],
                    filterOptions = [],
                    orderByFields,
                    orderByOptions,
                    query,
                    optionsQuery;
                clonedFields  = clonedFields || variable.filterFields;
                    /*get the filter fields from the variable*/
                _.forEach(clonedFields, function (value, key) {
                    if (!options.filterFields || !options.filterFields[key] || options.filterFields[key].logicalOp === 'AND') {
                        value.fieldName = key;
                        if (isStringType(getSQLFieldType(variable, value))) {
                            value.filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES[value.matchMode || variable.matchMode];
                        }
                        value.isVariableFilter = true;
                        filterFields.push(value);
                    }
                });
                /*get the filter fields from the options*/
                _.forEach(options.filterFields, function (value, key) {
                    value.fieldName = key;
                    value.filterCondition = DB_CONSTANTS.DATABASE_MATCH_MODES[value.matchMode || options.matchMode];
                    filterFields.push(value);
                });
                if (variable.operation === 'read' || options.operation === 'read') {
                    filterOptions = getFilterOptions(variable, filterFields, options);
                }
                /*if searchWithQuery is true, then convert the input params into query string. For example if firstName and lastName
                 should be sent as params then query string will be q="firstName containing 'someValue' OR lastName containing 'someValue'"
                 */
                if (options.searchWithQuery && filterOptions.length) {
                    //Generate query for variable filter fields. This has AND logical operator
                    query = getSearchQuery(_.filter(filterOptions, {'isVariableFilter': true}), ' AND ', variable.ignoreCase, options.skipEncode);
                    //Generate query for option filter fields. This has default logical operator as OR
                    optionsQuery = getSearchQuery(_.filter(filterOptions, {'isVariableFilter': undefined}), ' ' + (options.logicalOp || 'AND') + ' ', variable.ignoreCase, options.skipEncode);
                    if (optionsQuery) {
                        //If both variable and option query are present, merge them with AND
                        query = query ? (query + ' AND ( ' + optionsQuery + ' )') : optionsQuery;
                    }
                }
                orderByFields = Variables.getEvaluatedOrderBy(variable.orderBy, options.orderBy);
                orderByOptions = orderByFields ? 'sort=' + orderByFields : '';

                return {
                    'filter' : filterOptions,
                    'sort'   : orderByOptions,
                    'query'  : query
                };
            },
        /*Function to initiate the callback and obtain the data for the callback variable.*/
            initiateCallback = Variables.initiateCallback,
            processRequestQueue = Variables.processRequestQueue,
            //Set the _options on variable which can be used by the widgets
            setVariableOptions = function(variable, options) {
                variable._options =  variable._options || {};
                variable._options.orderBy = options && options.orderBy;
                variable._options.filterFields = options && options.filterFields;
            },
        /*Function to fetch the data for the primary table.*/
            getPrimaryTableData = function (projectID, variable, options, success, error) {

                var tableOptions,
                    dbOperation,
                    callBackScope,
                    variableOwner = variable.owner,
                    promiseObj,
                    output,
                    newDataSet,
                    clonedFields,
                    dataObj = {},
                    requestData,
                    handleError = function (response, xhrObj) {
                        /* If in Run mode, initiate error callback for the variable */
                        if (CONSTANTS.isRunMode) {
                            // EVENT: ON_RESULT
                            initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variable, response);
                        }

                        /* update the dataSet against the variable */
                        if (!options.skipDataSetUpdate) {
                            updateVariableDataset(variable, emptyArr, variable.propertiesMap);
                        }
                        /* If callback function is provided, send the data to the callback.
                         * The same callback if triggered in case of error also. The error-handling is done in grid.js*/
                        Utils.triggerFn(error, response);

                        if (CONSTANTS.isRunMode) {
                            $timeout(function () {
                                // EVENT: ON_ERROR
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.ERROR, variable, response, xhrObj);
                                // EVENT: ON_CAN_UPDATE
                                variable.canUpdate = true;
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variable, response);

                                /* process next requests in the queue */
                                variableActive[variable.activeScope.$id][variable.name] = false;
                                processRequestQueue(variable, requestQueue[variable.activeScope.$id], deployProjectAndFetchData, options);
                            }, null, false);
                        }
                    };

                if (CONSTANTS.isRunMode) {
                    clonedFields = Utils.getClonedObject(variable.filterFields);
                    // EVENT: ON_BEFORE_UPDATE
                    output = initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE, variable, clonedFields);
                    if (output === false) {
                        variableActive[variable.activeScope.$id][variable.name] = false;
                        processRequestQueue(variable, requestQueue[variable.activeScope.$id], deployProjectAndFetchData, options);
                        $rootScope.$emit('toggle-variable-state', variable, false);
                        Utils.triggerFn(error);
                        return;
                    }
                    variable.canUpdate = false;
                }

                tableOptions = prepareTableOptions(variable, options, _.isObject(output) ? output : clonedFields);
                // if tableOptions object has query then set the dbOperation to 'searchTableDataWithQuery'
                if (options.searchWithQuery) {
                    dbOperation = 'searchTableDataWithQuery';
                    requestData = tableOptions.query ? ('q=' + tableOptions.query) : '';
                } else {
                    dbOperation = (tableOptions.filter && tableOptions.filter.length) ? 'searchTableData' : 'readTableData';
                    requestData =  tableOptions.filter;
                }
                /* if it is a prefab variable (used in a normal project), modify the url */
                /*Fetch the table data*/
                promiseObj = DatabaseService[dbOperation]({
                    'projectID'     : projectID,
                    'service'       : variable._prefabName ? '' : 'services',
                    'dataModelName' : variable.liveSource,
                    'entityName'    : variable.type,
                    'page'          : options.page || 1,
                    'size'          : options.pagesize || (CONSTANTS.isRunMode ? (variable.maxResults || 20) : (variable.designMaxResults || 20)),
                    'sort'          : tableOptions.sort,
                    'data'          : requestData,
                    'filterMeta'    : tableOptions.filter,
                    'url'           : variable._prefabName ? ($rootScope.project.deployedUrl + '/prefabs/' + variable._prefabName) : $rootScope.project.deployedUrl
                }, function (response, xhrObj) {

                    if ((response && response.error) || !response || !WM.isArray(response.content)) {
                        Utils.triggerFn(handleError, response.error, xhrObj);
                        return;
                    }

                    processBlobColumns(response.content, variable);
                    dataObj.data = response.content;
                    dataObj.pagingOptions = {"dataSize": response ? response.totalElements : null, "maxResults": variable.maxResults, "currentPage": response ? (response.number + 1) : null};

                    if (!options.skipDataSetUpdate) {
                        /* get the callback scope for the variable based on its owner */
                        if (variableOwner === "App") {
                            /* TODO: to look for a better option to get App/Page the controller's scope */
                            callBackScope = $rootScope || {};
                        } else {
                            if (variable._prefabName) {
                                callBackScope = options.scope || {};
                            } else {
                                callBackScope = (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
                            }
                        }

                        if (CONSTANTS.isRunMode) {
                            // EVENT: ON_RESULT
                            initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variable, dataObj.data);
                            // EVENT: ON_PREPARESETDATA
                            newDataSet = initiateCallback(VARIABLE_CONSTANTS.EVENT.PREPARE_SETDATA, variable, dataObj.data);
                            if (newDataSet) {
                                //setting newDataSet as the response to service variable onPrepareSetData
                                dataObj.data = newDataSet;
                            }
                        }
                        /* update the dataSet against the variable */
                        updateVariableDataset(variable, dataObj.data, variable.propertiesMap, dataObj.pagingOptions);

                        if (CONSTANTS.isRunMode) {
                            setVariableOptions(variable, options);
                            $timeout(function () {
                                // EVENT: ON_SUCCESS
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.SUCCESS, variable, dataObj.data);
                                // EVENT: ON_CAN_UPDATE
                                variable.canUpdate = true;
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variable, dataObj.data);
                            });
                        }
                    }
                    if (CONSTANTS.isRunMode) {
                        /* process next requests in the queue */
                        variableActive[variable.activeScope.$id][variable.name] = false;
                        processRequestQueue(variable, requestQueue[variable.activeScope.$id], deployProjectAndFetchData, options);
                    }
                    /* if callback function is provided, send the data to the callback */
                    Utils.triggerFn(success, dataObj.data, variable.propertiesMap, dataObj.pagingOptions);
                }, function (error, details, xhrObj) {
                    setVariableOptions(variable, options);
                    Utils.triggerFn(handleError, error, xhrObj);
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
                                _.forEach(callbackParams, function (callbackParam) {
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
                            _.forEach(callbackParams, function (callbackParam) {
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
            getFieldType = function (fieldName, variable, relatedField) {
                var fieldType,
                    columns,
                    result;
                if (variable.propertiesMap) {
                    columns = variable.propertiesMap.columns || [];
                    result = _.find(columns, function (obj) {
                        return obj.fieldName === fieldName;
                    });
                    // if related field name passed, get its type from columns inside the current field
                    if (relatedField && result) {
                        result = _.find(result.columns, function (obj) {
                            return obj.fieldName === relatedField;
                        });
                    }
                    fieldType = result && result.type;
                }
                return fieldType;
            },
            //Check if table has blob column
            hasBlob = function (variable) {
                return _.find(_.get(variable, ['propertiesMap', 'columns']), {'type': 'blob'});
            },
            //Prepare formData for blob columns
            prepareFormData = function (variableDetails, rowObject) {
                var formData = new FormData();
                formData.rowData = _.clone(rowObject);
                _.forEach(rowObject, function (colValue, colName) {
                    if (getFieldType(colName, variableDetails) === 'blob') {
                        if (WM.isObject(colValue)) {
                            if (WM.isArray(colValue)) {
                                _.forEach(colValue, function (fileObject) {
                                    formData.append(colName, fileObject, fileObject.name);
                                });
                            } else {
                                formData.append(colName, colValue, colValue.name);
                            }
                        }
                        rowObject[colName] = colValue !== null ? '' : null;
                    }
                });
                formData.append(SWAGGER_CONSTANTS.WM_DATA_JSON, new Blob([JSON.stringify(rowObject)], {
                    type: 'application/json'
                }));
                return formData;
            },
        /*Function to perform common database actions through calling DatabaseService methods*/
            performDataAction = function (action, variableDetails, options, success, error) {
                var dbName,
                    compositeId = "",
                    projectID = $rootScope.project.id || $rootScope.projectName,
                    rowObject = {},
                    prevData,
                    callBackScope,
                    promiseObj,
                    primaryKey = variableDetails.getPrimaryKey(),
                    isFormDataSupported = (window.File && window.FileReader && window.FileList && window.Blob),
                    compositeKeysData = {},
                    prevCompositeKeysData = {},
                    id,
                    columnName,
                    clonedFields,
                    output,
                    inputFields = options.inputFields || variableDetails.inputFields;
                /* evaluate the callback scope */
                /* get the callback scope for the variable based on its owner */
                if (variableDetails.owner === "App") {
                    /* TODO: to look for a better option to get App/Page the controller's scope */
                    callBackScope = $rootScope || {};
                } else {
                    callBackScope = (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
                }

                // EVENT: ON_BEFORE_UPDATE
                if (CONSTANTS.isRunMode) {
                    clonedFields = Utils.getClonedObject(inputFields);
                    output = initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_UPDATE, variableDetails, clonedFields);
                    if (output === false) {
                        variableActive[variableDetails.activeScope.$id][variableDetails.name] = false;
                        processRequestQueue(variableDetails, requestQueue[variableDetails.activeScope.$id], deployProjectAndFetchData, options);
                        $rootScope.$emit('toggle-variable-state', variableDetails, false);
                        Utils.triggerFn(error);
                        return;
                    }
                    inputFields = _.isObject(output) ? output : clonedFields;
                    variableDetails.canUpdate = false;
                }

                if (options.row) {
                    rowObject = options.row;
                    //For datetime types, convert the value to the format accepted by backend
                    _.forEach(rowObject, function (value, key) {
                        var fieldType = getFieldType(key, variableDetails),
                            fieldValue;
                        if (Utils.isDateTimeType(fieldType)) {
                            fieldValue = Utils.formatDate(value, fieldType);
                            rowObject[key] = fieldValue;
                        } else if (WM.isArray(value) && isStringType(fieldType)) {
                            //Construct ',' separated string if param is not array type but value is an array
                            fieldValue = _.join(value, ',');
                            rowObject[key] = fieldValue;
                        }
                    });
                    //Merge inputFields along with dataObj while making Insert/Update/Delete
                    _.forEach(inputFields, function (attrValue, attrName) {
                        if (attrValue && !rowObject[attrName]) {
                            rowObject[attrName] = attrValue;
                        }
                    });
                } else {
                    _.forEach(inputFields, function (fieldValue, fieldName) {
                        var fieldType,
                            primaryKeys = variableDetails.propertiesMap.primaryFields || variableDetails.propertiesMap.primaryKeys;
                        if (WM.isDefined(fieldValue) && fieldValue !== "") {
                            /*For delete action, the inputFields need to be set in the request URL. Hence compositeId is set.
                             * For insert action inputFields need to be set in the request data. Hence rowObject is set.
                             * For update action, both need to be set.*/
                            if (action === "deleteTableData") {
                                compositeId = fieldValue;
                            }
                            if (action === "updateTableData") {
                                primaryKeys.forEach(function (key) {
                                    if (fieldName === key) {
                                        compositeId = fieldValue;
                                    }
                                });
                            }
                            if (action !== "deleteTableData" || variableDetails.isCompositeKey(primaryKey)) {
                                fieldType = getFieldType(fieldName, variableDetails);
                                if (Utils.isDateTimeType(fieldType)) {
                                    fieldValue = Utils.formatDate(fieldValue, fieldType);
                                } else if (WM.isArray(fieldValue) && isStringType(fieldType)) {
                                    //Construct ',' separated string if param is not array type but value is an array
                                    fieldValue = _.join(fieldValue, ',');
                                }
                                rowObject[fieldName] = fieldValue;
                            }
                            // for related entities, clear the blob type fields
                            if (WM.isObject(fieldValue) && !WM.isArray(fieldValue)) {
                                _.forEach(fieldValue, function (val, key) {
                                    if (getFieldType(fieldName, variableDetails, key) === 'blob') {
                                        fieldValue[key] = val === null ? val : '';
                                    }
                                });
                            }
                        }
                    });
                }

                switch (action) {
                case 'updateTableData':
                    prevData = options.prevData || {};
                    /*Construct the "requestData" based on whether the table associated with the live-variable has a composite key or not.*/
                    if (variableDetails.isCompositeKey(primaryKey)) {
                        if (variableDetails.isNoPrimaryKey(primaryKey)) {
                            prevCompositeKeysData = prevData || options.rowData || rowObject;
                            compositeKeysData = rowObject;
                        } else {
                            primaryKey.forEach(function (key) {
                                compositeKeysData[key] = rowObject[key];
                                prevCompositeKeysData[key] = prevData[key] || (options.rowData && options.rowData[key]) || rowObject[key];
                            });
                        }
                        options.row = compositeKeysData;
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
                //If table has blob column then send multipart data
                if ((action === 'updateTableData' || action === 'insertTableData') && hasBlob(variableDetails) && isFormDataSupported) {
                    if (action === 'updateTableData') {
                        action = 'updateMultiPartTableData';
                    } else {
                        action = 'insertMultiPartTableData';
                    }
                    rowObject = prepareFormData(variableDetails, rowObject);
                }
                /*Check if "options" have the "compositeKeysData" property.*/
                if (options.compositeKeysData) {
                    switch (action) {
                    case 'updateTableData':
                        action = 'updateCompositeTableData';
                        break;
                    case 'deleteTableData':
                        action = 'deleteCompositeTableData';
                        break;
                    case 'updateMultiPartTableData':
                        action = 'updateMultiPartCompositeTableData';
                        break;
                    default:
                        break;
                    }
                    compositeId = getCompositeIDURL(options.compositeKeysData);
                }
                dbName = variableDetails.liveSource;

                /*Set the "data" in the request to "undefined" if there is no data.
                * This handles cases such as "Delete" requests where data should not be passed.*/
                if (WM.element.isEmptyObject(rowObject) && action === "deleteTableData") {
                    rowObject = undefined;
                }

                promiseObj = DatabaseService[action]({
                    "projectID": projectID,
                    "service": variableDetails._prefabName ? "" : "services",
                    "dataModelName": dbName,
                    "entityName": variableDetails.type,
                    "id": WM.isDefined(options.id) ? encodeURIComponent(options.id) : compositeId,
                    "data": rowObject,
                    "url": variableDetails._prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + variableDetails._prefabName) : $rootScope.project.deployedUrl
                }, function (response, xhrObj) {
                    /* if error received on making call, call error callback */
                    if (response && response.error) {
                        /* If in RUN mode trigger error events associated with the variable */
                        if (CONSTANTS.isRunMode) {
                            // EVENT: ON_RESULT
                            initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variableDetails, response);
                            $timeout(function () {
                                // EVENT: ON_ERROR
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.ERROR, variableDetails, response.error, xhrObj);
                                // EVENT: ON_CAN_UPDATE
                                variableDetails.canUpdate = true;
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variableDetails, response.error);
                            }, null, false);
                        }
                        /* trigger error callback */
                        Utils.triggerFn(error, response.error);
                    } else {
                        if (CONSTANTS.isRunMode) {
                            // EVENT: ON_RESULT
                            initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variableDetails, response);
                            if (variableDetails.operation !== "read") {
                                // EVENT: ON_PREPARESETDATA
                                var newDataSet = initiateCallback(VARIABLE_CONSTANTS.EVENT.PREPARE_SETDATA, variableDetails, response);
                                if (newDataSet) {
                                    //setting newDataSet as the response to service variable onPrepareSetData
                                    response = newDataSet;
                                }
                                variableDetails.dataSet = response;
                            }
                            $timeout(function () {
                                // EVENT: ON_SUCCESS
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.SUCCESS, variableDetails, response);
                                // EVENT: ON_CAN_UPDATE
                                variableDetails.canUpdate = true;
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variableDetails, response);
                            }, null, false);
                        }
                        Utils.triggerFn(success, response);
                    }
                }, function (response, details, xhrObj) {
                    /* If in RUN mode trigger error events associated with the variable */
                    if (CONSTANTS.isRunMode) {
                        // EVENT: ON_RESULT
                        initiateCallback(VARIABLE_CONSTANTS.EVENT.RESULT, variableDetails, response);

                        $timeout(function () {
                            // EVENT: ON_ERROR
                            if (!options.skipNotification) {
                                initiateCallback(VARIABLE_CONSTANTS.EVENT.ERROR, variableDetails, response, xhrObj);
                            }
                            // EVENT: ON_CAN_UPDATE
                            variableDetails.canUpdate = true;
                            initiateCallback(VARIABLE_CONSTANTS.EVENT.CAN_UPDATE, variableDetails, response);
                        }, null, false);
                    }
                    Utils.triggerFn(error, response);
                });

                if (CONSTANTS.isRunMode) {
                    variableDetails.promise = promiseObj;
                }
            },
         /*Function to fetch records*/
            update = function (options, success, error) {
                var variable = this;
                options = options || {};
                options.scope = this.activeScope;

                if (CONSTANTS.isRunMode) {
                    $rootScope.$emit('toggle-variable-state', variable, !options.skipToggleState);
                }
                methods.getData(this, options, function (data, propertiesMap, pageOptions) {
                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', variable, false);
                    }
                    Utils.triggerFn(success, data, propertiesMap, pageOptions);
                }, function (errMsg) {
                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', variable, false);
                    }
                    Utils.triggerFn(error, errMsg);
                });
            },
            insertRecord = function (options, success, error) {
                var variable = this;
                options = options || {};
                options.scope = this.activeScope;

                if (CONSTANTS.isRunMode) {
                    $rootScope.$emit('toggle-variable-state', variable, true);
                }

                methods.insertRecord(this, options, function (response) {
                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', variable, false);
                    }
                    Utils.triggerFn(success, response);
                }, function (errMsg) {
                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', variable, false);
                    }
                    Utils.triggerFn(error, errMsg);
                });
            },
            updatePagination = function (variable, flag) {
                // update pagination locally, to reflect on pagination
                var pagination = _.get(variable.dataSet, 'pagingOptions');
                if (pagination) {
                    if (flag) {
                        pagination.dataSize += 1;
                        pagination.maxResults += 1;
                    } else {
                        pagination.dataSize -= 1;
                        pagination.maxResults -= 1;
                    }
                }
            },
        /* properties of a basic variable - should contain methods applicable on this particular object */
            methods = {
                /*Function to get the primary key of the specified variable.*/
                getPrimaryKey: function (variable) {
                    if (!variable.propertiesMap) {
                        return [];
                    }

                    if (variable.propertiesMap.primaryFields) {
                        return variable.propertiesMap.primaryFields;
                    }
                    /*Old projects do not have primary fields. Get primary key from the columns*/
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
                    function execute() {
                        /* put the variable name into the variable object */
                        variable.name = variableName;

                        if (CONSTANTS.isRunMode) {
                            variableActive[variable.activeScope.$id] = variableActive[variable.activeScope.$id] || {};
                            if (variableActive[variable.activeScope.$id][variableName]) {
                                requestQueue[variable.activeScope.$id] = requestQueue[variable.activeScope.$id] || {};
                                requestQueue[variable.activeScope.$id][variableName] = requestQueue[variable.activeScope.$id][variableName] || [];
                                if (variable.operation === "read") {
                                    options.filterFields = options.filterFields || Utils.getClonedObject(variable.filterFields);
                                } else {
                                    options.inputFields = options.row || Utils.getClonedObject(variable.inputFields);
                                }
                                requestQueue[variable.activeScope.$id][variableName].push({variable: variable, options: options, success: success, error: error});
                                return;
                            }
                            variableActive[variable.activeScope.$id][variableName] = true;
                        }


                        /*In the "Studio" mode, the entity meta data is read, the properties are updated in the variable;
                         * so that the variables.json file is updated on "save".
                         * 1. In the "Run"/"Application" mode, all the properties are fetched from the variable read from the file itself
                         * (as "getDataModel" call would not work in the "Application" mode).
                         * 2. In case of variables inside imported prefabs, "getDataModel" call would not work
                         * because the data-model would not be present in the project services directly.*/
                        if (!CONSTANTS.isRunMode && !variable._prefabName && !variable._partialname) {
                            /* get studio copy of variable*/
                            writableVariable = Variables.getVariableByName(variable.name);
                            getTableMetaData(projectID, variable, writableVariable, options, function () {
                                /*For variables of all operations, update the dataSet with the "propertiesMap" only.*/
                                updateVariableDataset(variable, emptyArr, variable.propertiesMap, {});
                                /* if callback function is provided, send the data to the callback */
                                Utils.triggerFn(success, emptyArr, variable.propertiesMap, {}, {"dataSize": null, "maxResults": variable.maxResults});
                            });
                        }
                        /*In the Run mode, for variables of insert/update/delete type operation, update the dataSet with the "propertiesMap" only.*/
                        if (CONSTANTS.isRunMode && variable.operation !== 'read') {
                            /* update the dataSet against the variable */
                            updateVariableDataset(variable, emptyArr, variable.propertiesMap, {});
                        }

                        /* Do not make calls to fetch data in case 'skipFetchData' is true, This flag is true when the variable is created for the first time */
                        if (!options.skipFetchData) {
                            deployProjectAndFetchData(variable, options, success, error);
                        }
                    }
                    /*Check for sanity of the "variable".
                     * Studio Mode: Also, invoke the service to get the data of the variable only if the "liveSource" still exists in the project's databases.
                     * If the database has been deleted from the project, then prevent sending of the request.
                     * Run Mode: Invoke the service to get the variable data.*/
                    if (!Utils.isEmptyObject(variable) && (CONSTANTS.isRunMode || variable._prefabName)) {
                        execute();
                    } else if (CONSTANTS.isStudioMode && !Utils.isEmptyObject(variable)) {
                        ServiceFactory.getServicesWithType(function (services) {
                            /*Checking for existence of variable's live source in databases available*/
                            if (_.find(services, {'name': variable.liveSource, 'type' : "DataService"})) {
                                execute();
                            }
                        });
                    }
                },
                /*Function to download the data associated with the live variable*/
                download: function (variable, options) {
                    var tableOptions,
                        dbOperation = 'exportTableData',
                        projectID   = $rootScope.project.id || $rootScope.projectName;
                    options.searchWithQuery = true; //For export, query api is used. So set this flag to true
                    tableOptions = prepareTableOptions(variable, options);
                    DatabaseService[dbOperation]({
                        'projectID'     : projectID,
                        'service'       : variable._prefabName ? '' : 'services',
                        'dataModelName' : variable.liveSource,
                        'entityName'    : variable.type,
                        'sort'          : tableOptions.sort,
                        'url'           : variable._prefabName ? ($rootScope.project.deployedUrl + '/prefabs/' + variable._prefabName) : $rootScope.project.deployedUrl,
                        'data'          : tableOptions.query ? ('q=' + tableOptions.query) : '',
                        'filterMeta'    : tableOptions.filter,
                        'exportFormat'  : options.exportFormat,
                        'size'          : options.size
                    });
                },
                /*Function to get the distinct  data for specified field*/
                getDistinctDataByFields: function (variable, options, success, error) {
                    var tableOptions,
                        dbOperation = 'getDistinctDataByFields',
                        projectID   = $rootScope.project.id || $rootScope.projectName,
                        requestData = {},
                        options     = options || {},
                        sort;
                    options.skipEncode = true;
                    options.operation  = 'read';
                    tableOptions = prepareTableOptions(variable, options);
                    if (tableOptions.query) {
                        requestData.filter = tableOptions.query;
                    }
                    requestData.groupByFields = _.isArray(options.fields) ? options.fields : [options.fields];
                    sort = options.sort ||  requestData.groupByFields[0] + ' asc';
                    sort = sort ? 'sort=' + sort : '';

                    DatabaseService[dbOperation]({
                        'projectID'     : projectID,
                        'service'       : variable._prefabName ? '' : 'services',
                        'dataModelName' : variable.liveSource,
                        'entityName'    : options.entityName || variable.type,
                        'page'          : options.page || 1,
                        'size'          : options.pagesize,
                        'sort'          : sort,
                        'data'          : requestData,
                        'url'           : variable._prefabName ? ($rootScope.project.deployedUrl + '/prefabs/' + variable._prefabName) : $rootScope.project.deployedUrl
                    }, function (response) {
                        if ((response && response.error) || !response) {
                            Utils.triggerFn(error, response.error);
                            return;
                        }
                        Utils.triggerFn(success, response);
                    }, function (errorMsg) {
                        Utils.triggerFn(error, errorMsg);
                    });
                },

                /*Function to get the aggregated data based on the fields chosen*/
                getAggregatedData: function (variable, options, success, error) {
                    var dbOperation = 'executeAggregateQuery',
                        tableOptions;
                    ProjectService.getDeployedUrl(function (deployedUrl) {
                        options     = options || {};
                        options.skipEncode = true;
                        if (variable.filterFields) {
                            tableOptions = prepareTableOptions(variable, options);
                            options.aggregations.filter = tableOptions.query;
                        }

                        DatabaseService[dbOperation]({
                            'dataModelName'    : variable.liveSource,
                            'entityName'       : variable.type,
                            'page'             : options.page || 1,
                            'size'             : options.size || variable.maxResults,
                            'sort'             : options.sort || '',
                            'url'              : deployedUrl,
                            'data'             : options.aggregations
                        }, function (response) {
                            if ((response && response.error) || !response) {
                                Utils.triggerFn(error, response.error);
                                return;
                            }
                            Utils.triggerFn(success, response);
                        }, function (errorMsg) {
                            Utils.triggerFn(error, errorMsg);
                        });
                    });
                },
            /*Function to update the data associated with the related tables of the live variable*/
                updateRelatedData: function (variable, options, success, error) {
                    var projectID = $rootScope.project.id || $rootScope.projectName;

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
                        "service": variable._prefabName ? "" : "services",
                        "dataModelName": variable.liveSource,
                        "entityName": variable.type,
                        "id": options.id,
                        "relatedFieldName": options.relatedFieldName,
                        "page": options.page || 1,
                        "size": CONSTANTS.isRunMode ? (variable.maxResults || 20) : (variable.designMaxResults || 20),
                        /*"sort": tableOptions.sort,
                        "data": tableOptions.filter,*/
                        "url": variable._prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + variable._prefabName) : $rootScope.project.deployedUrl
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

                    }, function (errorMsg) {
                        Utils.triggerFn(error, errorMsg);
                    });
                },
            /*function to delete a row in the data associated with the live variable*/
                deleteRecord: function (variable, options, success, error) {
                    performDataAction('deleteTableData', variable, options, success, error);
                },
            /*function to update a row in the data associated with the live variable*/
                updateRecord: function (variable, options, success, error) {
                    performDataAction('updateTableData', variable, options, success, error);
                },
            /*function to insert a row into the data associated with the live variable*/
                insertRecord: function (variable, options, success, error) {
                    performDataAction('insertTableData', variable, options, success, error);
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
                setInput: function (variable, key, val, options) {
                    var paramObj = {},
                        targetObj = {};

                    // process, if extra options provided for input
                    if (WM.isObject(options)) {
                        switch (options.type) {
                        case 'file':
                            val = Utils.getBlob(val, options.contentType);
                            break;
                        case 'number':
                            val = _.isNumber(val) ? val : parseInt(val);
                            break;
                        }
                    }

                    if (WM.isObject(key)) {
                        paramObj = key;
                    } else {
                        paramObj[key] = val;
                    }

                    if (!variable.inputFields) {
                        variable.inputFields = {};
                    }
                    targetObj = variable.inputFields;

                    _.forEach(paramObj, function (paramVal, paramKey) {
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

                    _.forEach(paramObj, function (paramVal, paramKey) {
                        targetObj[paramKey] = {
                            "value": paramVal
                        };
                    });

                    return targetObj;
                },
                getRelatedTableData: function (variable, columnName, options, success, error) {
                    var projectID    = $rootScope.project.id || $rootScope.projectName,
                        relatedTable = _.find(variable.relatedTables, function (table) {
                            return table.relationName === columnName || table.columnName === columnName; //Comparing column name to support the old projects
                        }),
                        selfRelatedCols = _.map(_.filter(variable.relatedTables, function (o) { //Find out the self related columns
                            return o.type === variable.type;
                        }), 'relationName'),
                        filterFields = [],
                        orderBy,
                        filterOptions,
                        query,
                        action;
                    _.forEach(options.filterFields, function (value, key) {
                        value.fieldName = key;
                        value.type      = getFieldType(columnName, variable, key);
                        filterFields.push(value);
                    });
                    filterOptions = getFilterOptions(variable, filterFields, options);
                    query         = getSearchQuery(filterOptions, ' ' + (options.logicalOp || 'AND') + ' ', variable.ignoreCase);
                    query         = query ? ('q=' + query) : '';
                    action        = 'searchTableDataWithQuery';
                    orderBy       = _.isEmpty(options.orderBy) ? '' : 'sort=' + options.orderBy;
                    DatabaseService[action]({
                        'projectID'     : projectID,
                        'service'       : variable._prefabName ? '' : 'services',
                        'dataModelName' : variable.liveSource,
                        'entityName'    : relatedTable.type,
                        'page'          : options.page || 1,
                        'size'          : options.pagesize || undefined,
                        'url'           : variable._prefabName ? ($rootScope.project.deployedUrl + '/prefabs/' + variable._prefabName) : $rootScope.project.deployedUrl,
                        'data'          : query || '',
                        'filterMeta'    : filterOptions,
                        'sort'          : orderBy
                    }, function (response) {
                        /*Remove the self related columns from the data. As backend is restricting the self related column to one level, In liveform select, dataset and datavalue object
                        * equality does not work. So, removing the self related columns to acheive the quality*/
                        var data = _.map(response.content, function (o) { return _.omit(o, selfRelatedCols); });
                        Utils.triggerFn(success, data, undefined, response ? {'dataSize': response.totalElements, 'maxResults': response.size, 'currentPage': response.number + 1} : {});
                    }, function (errMsg) {
                        Utils.triggerFn(error, errMsg);
                    });
                },
                getRelatedTablePrimaryKeys: function (variable, relatedField) {
                    var primaryKeys,
                        result,
                        relatedCols;
                    if (!variable.propertiesMap) {
                        return;
                    }
                    result = _.find(variable.propertiesMap.columns || [], {'fieldName': relatedField});
                    // if related field name passed, get its type from columns inside the current field
                    if (result) {
                        relatedCols = result.columns;
                        primaryKeys = _.map(_.filter(relatedCols, 'isPrimaryKey'), 'fieldName');
                        if (primaryKeys.length) {
                            return primaryKeys;
                        }
                        if (relatedCols && relatedCols.length) {
                            relatedCols = _.find(relatedCols, {'isRelated': false});
                            return relatedCols && relatedCols.fieldName;
                        }
                    }
                },
                addItem: function (variable, item, index) {
                    var data = _.get(variable.dataSet, 'data') || [];
                    index = index !== undefined ? index : data.length;
                    data.splice(index, 0, item);

                    // update pagination locally, to reflect on pagination
                    updatePagination(variable, true);
                },
                removeItem: function (variable, item) {
                    var data = _.get(variable.dataSet, 'data') || [];
                    item = item !== undefined ? item : data.length - 1;

                    if (WM.isObject(item)) {
                        item = _.findIndex(data, item);
                        if (item > -1) {
                            data.splice(item, 1);
                        }
                    } else {
                        /* set the value against the specified index */
                        data.splice(item, 1);
                    }

                    // update pagination locally, to reflect on pagination
                    updatePagination(variable);
                },
                updateItem: function (variable, item, newItem) {
                    var data = _.get(variable.dataSet, 'data') || [];
                    item = item !== undefined ? item : data.length - 1;

                    if (WM.isObject(item)) {
                        item = _.findIndex(data, item);
                        if (item > -1) {
                            data[item] = newItem;
                        }
                    } else {
                        /* set the value against the specified index */
                        data[item] = newItem;
                    }
                }
            },

            liveVariableObj = {
                update     : update,
                listRecords: update,
                download: function (options) {
                    options = options || {};
                    methods.download(this, options);
                },
                getDistinctDataByFields: function (options, success, error) {
                    options = options || {};
                    methods.getDistinctDataByFields(this, options, success, error);
                },
                getAggregatedData: function (options, success, error) {
                    options = options || {};
                    methods.getAggregatedData(this, options, success, error);
                },
                updateRecord: function (options, success, error) {
                    var variable = this;
                    options = options || {};
                    options.scope = this.activeScope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', variable, true);
                    }

                    methods.updateRecord(this, options, function (response) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', variable, false);
                        }
                        Utils.triggerFn(success, response);
                    }, function (errMsg) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', variable, false);
                        }
                        Utils.triggerFn(error, errMsg);
                    });
                },
                insertRecord: insertRecord,
                createRecord: insertRecord,
                deleteRecord: function (options, success, error) {
                    var variable = this;
                    options = options || {};
                    options.scope = this.activeScope;

                    if (CONSTANTS.isRunMode) {
                        $rootScope.$emit('toggle-variable-state', variable, true);
                    }

                    methods.deleteRecord(this, options, function (response) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', variable, false);
                        }
                        Utils.triggerFn(success, response);
                    }, function (errMsg) {
                        if (CONSTANTS.isRunMode) {
                            $rootScope.$emit('toggle-variable-state', variable, false);
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
                isRelatedFieldMany: function (fieldName) {
                    return isRelatedFieldMany(this, fieldName);
                },
                getSqlType: function (fieldName) {
                    return getSqlType(this, fieldName);
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
                setInput: function (key, val, options) {
                    return methods.setInput(this, key, val, options);
                },
                setFilter: function (key, val) {
                    return methods.setFilter(this, key, val);
                },
                getRelatedTableData: function (columnName, options, success, error) {
                    return methods.getRelatedTableData(this, columnName, options, success, error);
                },
                getRelatedTablePrimaryKeys: function (columnName) {
                    return methods.getRelatedTablePrimaryKeys(this, columnName);
                },
                addItem: function (item, index) {
                    return methods.addItem(this, item, index);
                },
                updateItem: function (item, newItem) {
                    return methods.updateItem(this, item, newItem);
                },
                removeItem: function (item) {
                    return methods.removeItem(this, item);
                },
                init: function () {
                    if (this.operation === 'read') {
                        Object.defineProperty(this, 'firstRecord', {
                            'configurable': true,
                            'get': function () {
                                return _.get(methods.getDataSet(this), 'data[0]', {});
                            }
                        });
                        Object.defineProperty(this, 'lastRecord', {
                            'configurable': true,
                            'get': function () {
                                var data = _.get(methods.getDataSet(this), 'data', []);
                                return data[data.length - 1];
                            }
                        });
                    }
                }
            };

        /* register the variable to the base service*/
        BaseVariablePropertyFactory.register('wm.LiveVariable', liveVariableObj, ['wm.Variable', 'wm.ServiceVariable'], methods);

        return {
            reset                 : reset,
            getTableMetaData      : getTableMetaData,
            updateVariableDataset : updateVariableDataset
        };
    }
];
