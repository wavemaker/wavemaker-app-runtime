/*global WM, wm*/

/*Defining module for Database services*/
wm.plugins.modeldesigner = WM.module('wm.plugins.modeldesigner', []);

/*Creating namespaces for the controllers, services etc. of the module*/
wm.plugins.modeldesigner.directives = {};
wm.plugins.modeldesigner.controllers = {};
wm.plugins.modeldesigner.services = {};
wm.plugins.modeldesigner.factories = {};

/*Defining the controllers, services etc. required for the Database services module*/
wm.plugins.modeldesigner.directive(wm.plugins.modeldesigner.directives);
wm.plugins.modeldesigner.controller(wm.plugins.modeldesigner.controllers);
wm.plugins.modeldesigner.service(wm.plugins.modeldesigner.services);
wm.plugins.modeldesigner.factory(wm.plugins.modeldesigner.factories);

/*defining urls as constants in the database services module*/
wm.plugins.modeldesigner.constant('MODEL_SERVICE_URLS', {
    Datamodel: {
        getServiceID: {
            url: "services/projects/:projectID/models/import",
            method: "POST"
        },
        importModel: {
            url: "services/projects/:projectID/models/:serviceId/:modelName",
            method: "POST"
        },

        /*DataModel related services*/
        saveDataModel: {
            url: "services/projects/:projectID/models/:dataModelName/save",
            method: "POST"
        },
        listDataModels: {
            url: "services/projects/:projectID/models/schemas/:regionId/:scope",
            method: "GET"
        },
        getModel: {
            url: "services/projects/:projectID/models/:serviceId",
            method: "GET"
        },
        listScopeTypes: {
            url: "services/projects/:projectID/models/regions/:regionId/scopes",
            method: "GET"
        },
        listRegions: {
            url: "services/projects/:projectID/models/regions",
            method: "GET"
        },
        createDataModel: {
            url: "services/projects/:projectID/models",
            method: "POST"
        },
        publishModel: {
            url: "services/projects/:projectID/models/:serviceId/publish",
            method: "POST"
        },
        revertModel: {
            url: "services/projects/:projectID/models/:serviceId/revert",
            method: "POST"
        },
        deleteModel: {
            url: "services/projects/:projectID/models/:serviceId?deleteInRemote=:deleteInRemote",
            method: "DELETE"
        },
        getModelProperties: {
            url: "services/projects/:projectID/models/:serviceId/properties",
            method: "GET"
        },

        /*Entities related services*/
        getPrimitiveTypes: {
            url: "services/projects/:projectID/models/attribute/dataTypes",
            method: "GET"
        },
        getlookUpEntries: {
            url: "services/projects/:projectID/models/lookupTypes",
            method: "GET"
        },
        getCustomProperties: {
            url: "services/projects/:projectID/models/attribute/configurations",
            method: "GET"
        },

        /*Entity Attribute related services*/
        addAttributes: {
            url: "services/projects/:projectID/models/:serviceId/:entityName/:attributeId",
            method: "POST"
        },
        deleteAttribute: {
            url: "services/projects/:projectID/models/:serviceId/:entityName/:attributeId",
            method: "DELETE"
        },
        updateAttribute: {
            url: "services/projects/:projectID/models/:serviceId/:entityName/:attributeId",
            method: "PUT"
        },


        /*Queries Related services*/

        getAllQueries: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries",
            method: "GET"
        },
        getQuery: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries/:queryName",
            method: "GET"
        },
        createQuery: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries",
            method: "POST"
        },
        updateQuery: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries/:queryName",
            method: "PUT"
        },
        queryNameUsage: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries/:queryName/usages",
            method: "GET"
        },
        deleteQuery: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries/:queryName",
            method: "DELETE"
        },
        setQueryMetaData: {
            url: "services/projects/:projectID/datamodels/:dataModelName/queries/:queryName/metadata",
            method: "POST"
        },
        validateQuery: {
            url: "services/projects/:projectID/datamodels/:dataModelName/query/validate",
            method: "POST"
        },
        getAllProcedures: {
            url: "services/projects/:projectID/datamodels/:dataModelName/procedures",
            method: "GET"
        },
        getProcedure: {
            url: "services/projects/:projectID/datamodels/:dataModelName/procedures/:procedureName",
            method: "GET"
        },
        createProcedure: {
            url: "services/projects/:projectID/datamodels/:dataModelName/procedures",
            method: "POST"
        },
        updateProcedure: {
            url: "services/projects/:projectID/datamodels/:dataModelName/procedures/:procedureName",
            method: "PUT"
        },
        deleteProcedure: {
            url: "services/projects/:projectID/datamodels/:dataModelName/procedures/:procedureName",
            method: "DELETE"
        },
        readTableData: {
            url: "/:service/:dataModelName/:entityName?page=:page&size=:size&:sort",
            method: "GET"
        },
        insertTableData: {
            url: "/:service/:dataModelName/:entityName",
            method: "POST"
        },
        insertMultiPartTableData: {
            url: "/:service/:dataModelName/:entityName",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        updateTableData: {
            url: "/:service/:dataModelName/:entityName/:id",
            method: "PUT"
        },
        updateMultiPartTableData: {
            url: "/:service/:dataModelName/:entityName/:id",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        deleteTableData: {
            url: "/:service/:dataModelName/:entityName/:id",
            method: "DELETE"
        },
        updateCompositeTableData: {
            url: "/:service/:dataModelName/:entityName/composite-id?:id",
            method: "PUT"
        },
        periodUpdateCompositeTableData: {
            url: "/:service/:dataModelName/:entityName/composite-id/periods?:id",
            method: "PUT"
        },
        updateMultiPartCompositeTableData: {
            url: "/:service/:dataModelName/:entityName/composite-id?:id",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        deleteCompositeTableData: {
            url: "/:service/:dataModelName/:entityName/composite-id?:id",
            method: "DELETE"
        },
        periodDeleteCompositeTableData: {
            url: "/:service/:dataModelName/:entityName/composite-id/periods?:id",
            method: "DELETE"
        },
        countTableDataWithQuery : {
            url: "/:service/:dataModelName/:entityName/count",
            method: "POST",
            headers: {
                'Content-Type': "application/x-www-form-urlencoded"
            }
        },
        searchTableData: {
            url: "/:service/:dataModelName/:entityName/search?page=:page&size=:size&:sort",
            method: "POST"
        },
        searchTableDataWithQuery: {
            url: "/:service/:dataModelName/:entityName/filter?page=:page&size=:size&:sort",
            method: "POST",
            headers: {
                'Content-Type': "application/x-www-form-urlencoded"
            }
        },
        getDistinctDataByFields: {
            url: "/:service/:dataModelName/:entityName/aggregations?page=:page&size=:size&:sort",
            method: "POST"
        },
        exportTableData: {
            url: "/services/:dataModelName/:entityName/export?:sort",
            method: "POST"
        },
        readTableRelatedData: {
            url: "/:service/:dataModelName/:entityName/:id/:relatedFieldName?page=:page&size=:size&:sort",
            method: "GET"
        },
        executeNamedQuery: {
            url: "/:service/:dataModelName/queryExecutor/queries/:queryName?page=:page&size=:size&:queryParams",
            method: "GET"
        },
        executeCustomQuery: {
            url: "/:service/:dataModelName/queries/execute?page=:page&size=:size",
            method: "POST"
        },
        executeAggregateQuery: {
            url: "/services/:dataModelName/:entityName/aggregations?page=:page&size=:size&sort=:sort",
            method: "POST"
        },
        testRunQuery: {
            url: "/:service/:dataModelName/queries/test_run",
            method: "POST"
        },
        nativeTestRunQuery: {
            url: "services/projects/:projectID/database/services/:dataModelName/queries/testrun",
            method: "POST",
            headers: {
                'Content-Type': undefined
            }
        },


        /*Procedure related properties*/
        executeNamedProcedure: {
            url: "/:service/:dataModelName/procedureExecutor/procedure/execute/:procedureName?page=:page&size=:size&:procedureParams",
            method: "GET"
        },
        testRunProcedure: {
            url: "services/projects/:projectID/database/services/:dataModelName/procedures/testrun",
            method: "POST",
            headers: {
                'Content-Type': undefined
            }
        },
        proceduresInDatabase: {
            url: "services/projects/:projectID/database/services/:dataModelName/procedures",
            method: "GET"
        },

        /*Database connection properties*/
        getSampleDbConnectionProperties: {
            url: "services/projects/:projectID/database/sample/connectionProps?sampleDbName=:sampleDbName",
            method: "GET"
        },
        getConnectionProperties: {
            url: "services/projects/:projectID/database/services/:serviceId/properties",
            method: "GET"
        },
        updateConnectionProperties: {
            url: "services/projects/:projectID/database/services/:serviceId/properties",
            method: "PUT"
        },

        // read and update offline configuration
        updateOfflineConfig: {
            url: "services/projects/:projectID/database/services/:serviceId/offline",
            method: "POST"
        },
        getOfflineConfig: {
            url: "services/projects/:projectID/database/services/:serviceId/offline",
            method: "GET"
        }
    }
});

/*Defining the constants for the database service module*/
wm.plugins.modeldesigner.constant('MODEL_CONSTANTS', {
    "DATAMODEL_WORKSPACE_TYPE": "model",
    "WAVEMAKER_SAMPLE_DATABASES": ["hrdb", "salesdb"],
    "DEFAULT_DB_NAME": "MyTestDatabase",
    "MYSQL_CLOUD_HOST": "{WM_CLOUD_MYSQL_HOST}",
    "DB_TYPES": {
        "HSQL_DB_TYPE": "HSQLDB",
        "MYSQL_DB_TYPE": "MySQL",
        "POSTGRESQL_DB_TYPE": "PostgreSQL",
        "ORACLE_DB_TYPE": "Oracle",
        "SQL_SERVER_DB_TYPE": "SQLServer",
        "DB2_DB_TYPE": "DB2",
        "MYSQL_CLOUD_DB_TYPE": "MySQL-Cloud",
        "OTHER": 'Other'
    },
    "SEQUENCE_SUPPORTED_DB_TYPES": ["HSQLDB", "PostgreSQL", "Oracle", "SQLServer", "DB2", 'Other'],
    "GENERATOR_TYPES" : {
        "ASSIGNED": "assigned",
        "SEQUENCE": "sequence",
        "IDENTITY": "identity"
    },
    "LOGIN": {
        "SAAS_MYSQL_CLOUD": {
            "USERNAME": "{WM_CLOUD_MYSQL_USERNAME}",
            "PASSWORD": "{WM_CLOUD_MYSQL_PASSWORD}"
        }
    },
    "DRIVER_VERSIONS": {
        "Oracle": [
            {
                "DB_VERSION": "Oracle 11.2 or 11gR2",
                "DRIVER_VERSION": "ojdbc6.jar",
                "URL": ""
            },
            {
                "DB_VERSION": "Oracle 12.1 or 12cR1",
                "DRIVER_VERSION": "ojdbc7.jar",
                "URL": ""
            }
        ],
        "SQLServer": [
            {
                "DB_VERSION": "SQL Server 2008",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2008R2",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2012",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            },
            {
                "DB_VERSION": "Azure SQL Database",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            },
            {
                "DB_VERSION": "PDW 2008R2 AU34",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2014",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2016",
                "DRIVER_VERSION": "Driver 4.2",
                "URL": ""
            }
        ],
        "DB2": [
            {
                "DB_VERSION": "Express-C 9.5",
                "DRIVER_VERSION": "db2jcc4.jar",
                "URL": ""
            },
            {
                "DB_VERSION": "Express-C 10.5",
                "DRIVER_VERSION": "db2jcc4.jar",
                "URL": ""
            },
            {
                "DB_VERSION": "Express-C 11.1",
                "DRIVER_VERSION": "db2jcc4.jar",
                "URL": ""
            }
        ]
    },
    "NON_EDITABLE_DATABASE_SYSTEMS": ['HSQLDB', 'DB2', 'Other'],
    "PERMISSIONS": {
        "DEFAULT": {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
            "READ"  : true
        },
        "HSQLDB": {
            "CREATE": false,
            "UPDATE": false,
            "DELETE": false,
            "READ"  : true
        },
        "MySQL-Cloud": {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
            "READ"  : true
        },
        "MySQL": {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
            "READ"  : true
        },
        "DB2": {
            "CREATE": false,
            "UPDATE": false,
            "DELETE": false,
            "READ"  : true
        },
        "PostgreSQL":  {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
            "READ"  : true
        },
        "Oracle" : {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
            "READ"  : true
        },
        "SQLServer" : {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
            "READ"  : true
        },
        "Other": {
            "CREATE": false,
            "UPDATE": false,
            "DELETE": false,
            "READ"  : true
        },
        "RE_IMPORT_CASE": {
            "CREATE": false,
            "UPDATE": false,
            "DELETE": false,
            "READ"  : true,
            "VIEWONLY": true
        }
    },
    "IDENTITY_GENERATORS" : ['integer', 'short', 'long', 'big_integer'],
    "DATABASE_NUMERIC_DATA_TYPES": {
        "short": "short",
        "integer": "integer",
        "long" : "long",
        "big_integer": "big_integer",
        "float": "float",
        "double": "double",
        "big_decimal": "big_decimal"
    },
    "DATABASE_DATA_TYPES": {
        "big_decimal": {
            "java_type": "big_decimal"
        },
        "big_integer": {
            "java_type": "big_integer"
        },
        "blob": {
            "java_type": "blob"
        },
        "boolean": {
            "java_type": "boolean"
        },
        "byte": {
            "java_type": "byte"
        },
        "character": {
            "java_type": "character"
        },
        "clob": {
            "java_type": "clob"
        },
        "date": {
            "java_type": "date"
        },
        "datetime": {
            "java_type": "datetime"
        },
        "double": {
            "java_type": "double"
        },
        "float": {
            "java_type": "float"
        },
        "integer": {
            "java_type": "integer"
        },
        "long": {
            "java_type": "long"
        },
        "string": {
            "java_type": "string"
        },
        "short": {
            "java_type": "short"
        },
        "text": {
            "java_type": "text"
        },
        "time": {
            "java_type": "time"
        },
        "timestamp": {
            "java_type": "timestamp"
        },
        "unknown": {
            "java_type": "blob"
        }
    },
    "DATABASE_SECONDARY_DATA_TYPES": {
        "binary": {
            "java_type": "blob"
        },
        "long": {
            "java_type": "double"
        }
    },
    "DATABASE_GENERATORS": {
        "assigned": "assigned",
        "identity": "auto increment",
        "uniqueid": "unique id",
        "sequence": "sequence"
    },
    "DATABASE_MATCH_MODES": {
        "like"             : "LIKE",
        "start"            : "STARTING_WITH",
        "startignorecase"  : "STARTING_WITH_IGNORECASE",
        "end"              : "ENDING_WITH",
        "endignorecase"    : "ENDING_WITH_IGNORECASE",
        "anywhere"         : "CONTAINING",
        "anywhereignorecase": "CONTAINING_IGNORECASE",
        "exact"            : "EQUALS",
        "exactignorecase"  : "EQUALS_IGNORECASE",
        "notequals"        : "NOT_EQUALS",
        "between"          : "BETWEEN",
        "in"               : "IN",
        "lessthan"         : "LESS_THAN",
        "lessthanequal"    : "LESS_THAN_OR_EQUALS",
        "greaterthan"      : "GREATER_THAN",
        "greaterthanequal" : "GREATER_THAN_OR_EQUALS",
        "null"             : "NULL",
        "isnotnull"        : "IS_NOT_NULL",
        "empty"            : "EMPTY",
        "isnotempty"       : "IS_NOT_EMPTY",
        "nullorempty"      : "NULL_OR_EMPTY"
    },
    "DATABASE_MATCH_MODES_WITH_QUERY": {
        "LIKE"                   : "${0} like ${1}",
        "STARTING_WITH"          : "${0} like ${1}",
        "STARTING_WITH_IGNORECASE": "${0} like ${1}",
        "ENDING_WITH"            : "${0} like ${1}",
        "ENDING_WITH_IGNORECASE" : "${0} like ${1}",
        "CONTAINING"             : "${0} like ${1}",
        "CONTAINING_IGNORECASE"  : "${0} like ${1}",
        "EQUALS"                 : "${0}=${1}",
        "EQUALS_IGNORECASE"      : "${0}=${1}",
        "NOT_EQUALS"             : "${0}!=${1}",
        "BETWEEN"                : "${0} between ${1}",
        "IN"                     : "${0} in ${1}",
        "LESS_THAN"              : "${0}<${1}",
        "LESS_THAN_OR_EQUALS"    : "${0}<=${1}",
        "GREATER_THAN"           : "${0}>${1}",
        "GREATER_THAN_OR_EQUALS" : "${0}>=${1}",
        "NULL"                   : "${0} is null",
        "IS_NOT_NULL"            : "${0} is not null",
        "EMPTY"                  : "${0}=''",
        "IS_NOT_EMPTY"           : "${0}<>''",
        "NULL_OR_EMPTY"          : "${0} is null or ${0}=''"
    },
    "DATABASE_EMPTY_MATCH_MODES": ["NULL", "IS_NOT_NULL", "EMPTY", "IS_NOT_EMPTY", "NULL_OR_EMPTY"],
    "DATABASE_STRING_MODES": ["LIKE", "STARTING_WITH", "STARTING_WITH_IGNORECASE", "ENDING_WITH", "ENDING_WITH_IGNORECASE", "CONTAINING", "CONTAINING_IGNORECASE", "EQUALS", "EQUALS_IGNORECASE", "NOT_EQUALS"],
    "DATABASE_NULL_EMPTY_MATCH": {
        "NULL"          : "NULL",
        "IS_NOT_NULL"   : "IS_NOT_NULL",
        "EMPTY"         : "NULL",
        "IS_NOT_EMPTY"  : "IS_NOT_NULL",
        "NULL_OR_EMPTY" : "NULL"
    },
    "DATABASE_RANGE_MATCH_MODES": ["BETWEEN", "LESS_THAN", "LESS_THAN_OR_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUALS", "NOT_EQUALS"],
    "ACTIONS": {
        "CREATE": "CREATE",
        "UPDATE": "UPDATE",
        "DELETE": "DELETE",
        "SAVED": "SAVED"
    },
    "OBJECTS": {
        "DATABASE": "wm-model",
        "ENTITY": "wm-dm-entity",
        "ATTRIBUTE": "wm-dm-entity-attribute",
        "REFERENCE": "wm-dm-entity-relation"
    },
    "DML_QUERY_INDICATORS": {
        "SELECT": "SELECT",
        "UPDATE": ["INSERT", "UPDATE", "DELETE"]
    },
    "DDL_QUERY_INDICATORS": ["CREATE", "ALTER", "RENAME", "DROP"],
    "PROCEDURE_INDICATORS": {
        "CALL": "CALL",
        "EXECUTE": "EXEC",
        "SELECT": "SELECT"
    },
    "SERVER_SIDE_PROPERTIES": {
        "CURRENT_DATE": {
            "property": "Current Date",
            "label": "CURRENT_DATE",
            "value": "DATE"
        },
        "CURRENT_TIME": {
            "property": "Current Time",
            "label": "CURRENT_TIME",
            "value": "TIME"
        },
        "CURRENT_DATE_TIME": {
            "property": "Current DateTime",
            "label": "CURRENT_DATE_TIME",
            "value": "DATETIME"
        },
        "CURRENT_USER_ID": {
            "property": "LoggedIn UserId",
            "label": "CURRENT_USER_ID",
            "value": "USER_ID"
        },
        "CURRENT_USER_NAME": {
            "property": "LoggedIn Username",
            "label": "CURRENT_USER_NAME",
            "value": "USER_NAME"
        }
    },
    "COLUMN_VALUE_TYPES": {
        "user-defined"              : "User Defined",
        "server-defined"            : "Server Defined",
        "database-defined"          : "Database Defined",
        "app-environment-defined"   : "App Environment Defined"
    },
    "COLUMN_VALUE_OPERATIONS": {
        "BOTH"  : "Insert and Update",
        "INSERT": "Insert Only",
        "UPDATE": "Update Only"
    },
    "COLUMN_SERVER_PROPERTIES": {
        "DATE"      : "Current Date",
        "TIME"      : "Current Time",
        "DATE_TIME" : "Current Datetime",
        "USER_ID"   : "LoggedIn UserId",
        "USER_NAME" : "LoggedIn Username"
    },
    "RELATION_CASCADE_OPTIONS": {
        "NONE": "None",
        "REMOVE": "Remove"
    }
});

/*Defining the config for the database plugins*/
wm.plugins.modeldesigner.config(function (BaseServiceManagerProvider, MODEL_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(MODEL_SERVICE_URLS);
});
