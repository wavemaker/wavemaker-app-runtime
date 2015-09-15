/*global WM, wm*/
/**
 * @ngdoc service
 * @name wm.database.$QueryBuilder
 * @requires $rootScope
 * @requires DatabaseService
 * @requires Utils
 * @description
 * The `$QueryBuilder` provides services to build and execute queries.
 *
 */

wm.plugins.database.services.QueryBuilder = [
    "$rootScope",
    "DatabaseService",
    "Utils",
    "ProjectService",
    "$liveVariable",
    function ($rootScope, DatabaseService, Utils, ProjectService, $liveVariable) {
        'use strict';

        return {
            'getQuery': function (options) {
                var selectClause,
                    columnClause = "",
                    fromClause,
                    whereClause = "",
                    groupByClause,
                    orderByClause,
                    logicalOp = options.logicalOp && options.logicalOp.toLowerCase() === "or" ? " OR " : " AND ",
                    logicalOpSliceLength = logicalOp === " OR " ? -4 : -5,
                    query;

                selectClause = "SELECT ";

                if (options.columns) {
                    columnClause = "";
                    WM.forEach(options.columns, function (column) {
                        columnClause += column + ",";
                    });
                    columnClause = columnClause.slice(0, -1);
                } else {
                    selectClause = '';
                }

                fromClause = " FROM " + options.tableName;
                if (WM.isArray(options.filterFields) && options.filterFields.length) {
                    whereClause = " WHERE ";
                    WM.forEach(options.filterFields, function (field) {
                        if (field.clause) {
                            whereClause += field.clause + logicalOp;
                        } else {
                            /*If value is an array, loop through the array and build the query with OR clause*/
                            if (WM.isArray(field.value)) {
                                whereClause += "(" + field.column + "='";
                                field.value.forEach(function (element, index) {
                                    if (index + 1 === field.value.length) {
                                        whereClause += element;
                                    } else {
                                        whereClause += element + "' OR " + field.column + "='";
                                    }
                                });
                                whereClause += "')" + logicalOp;
                            } else {
                                /*If the field is a boolean value, quotes should not be added to the values*/
                                if (field.noQuotes) {
                                    whereClause += field.column + "=" + field.value + logicalOp;
                                } else {
                                    whereClause += field.column + "='" + field.value + "'" + logicalOp;
                                }

                            }
                        }
                    });
                    whereClause = whereClause.slice(0, logicalOpSliceLength);
                } else if (!WM.element.isEmptyObject(options.filterFields)) {
                    whereClause = " WHERE ";
                    WM.forEach(options.filterFields, function (field, fieldName) {
                        var fieldValue;
                        /*Set appropriate value for fieldValue based on the type of data passed for the field.*/
                        if (field.value) {
                            fieldValue = field.value;
                        } else if (!WM.isObject(field)) {
                            fieldValue = field;
                        } else {
                            return;
                        }
                        whereClause += fieldName + "='" + fieldValue + "'" + logicalOp;
                    });
                    whereClause = whereClause.slice(0, logicalOpSliceLength);
                }
                groupByClause = options.groupby ? (" GROUP BY " + options.groupby) : "";
                orderByClause = options.orderby ? (" ORDER BY " + options.orderby) : "";

                query = selectClause + columnClause + fromClause + whereClause + groupByClause + orderByClause;

                return query;
            },
            'executeQuery': function (options, success, error) {
                var executeQuery = function () {
                    DatabaseService.executeCustomQuery({
                        "projectID": $rootScope.project.id,
                        "dataModelName": options.databaseName,
                        "page": options.page,
                        "size": options.size,
                        "data": {
                            "queryStr": options.query,
                            "queryParams": options.queryParams || [],
                            "nativeSql": options.nativeSql
                        },
                        "service": options.prefabName ? "" : "services",
                        "url": options.prefabName ? ($rootScope.project.deployedUrl + "/prefabs/" + options.prefabName) : $rootScope.project.deployedUrl
                    }, function (response) {
                        if (response.errors) {
                            Utils.triggerFn(error, response);
                        } else {
                            $liveVariable.processResponse(response.content);
                            Utils.triggerFn(success, response);
                        }
                    }, function (response) {
                        Utils.triggerFn(error, response);
                    });
                };
                /*If the project is not yet deployed,
                deploy the project and then execute the query.*/
                if (!$rootScope.project.deployedUrl) {
                    ProjectService.run({
                        projectId: $rootScope.project.id
                    }, function (result) {
                        /*Save the deployed url of the project in the $rootScope so that it could be used in all calls to services of deployed app*/
                        $rootScope.project.deployedUrl = Utils.removeProtocol(result);
                        executeQuery();
                    });
                } else {
                    executeQuery();
                }
            }
        };
    }
];