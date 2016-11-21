/*global WM, wm*/

/*Defining module for Database services*/
wm.plugins.database = WM.module('wm.plugins.database', []);

/*Creating namespaces for the controllers, services etc. of the module*/
wm.plugins.database.directives = {};
wm.plugins.database.controllers = {};
wm.plugins.database.services = {};
wm.plugins.database.factories = {};

/*Defining the controllers, services etc. required for the Database services module*/
wm.plugins.database.directive(wm.plugins.database.directives);
wm.plugins.database.controller(wm.plugins.database.controllers);
wm.plugins.database.service(wm.plugins.database.services);
wm.plugins.database.factory(wm.plugins.database.factories);

/*defining urls as constants in the database services module*/
wm.plugins.database.constant('DB_SERVICE_URLS', {
    Database: {
        testConnection: {
            url: "services/projects/:projectID/database/testConnection",
            method: "POST"
        },
        testDatabase: {
            url: "services/projects/:projectID/database/testDatabase",
            method: "POST"
        },
        testJarRequired : {
            url: "services/projects/:projectID/database/testDriver?dbType=:dbType",
            method: "GET"
        },
        importDB: {
            url: "services/projects/:projectID/database/services/import",
            method: "POST"
        },
        reImportDB: {
            url: "services/projects/:projectID/database/services/:serviceId/reimport?retainDraft=:retainDraft",
            method: "POST"
        },
        exportDB: {
            url: "services/projects/:projectID/database/services/:serviceId/export",
            method: "POST"
        },
        loadModelInfo: {
            url: "services/projects/:projectID/database/loadModelInfo",
            method: "POST"
        },
        listTables: {
            url: "services/projects/:projectID/database/listTables",
            method: "POST"
        },

        /*DataModel related services*/
        getAllDataModels: {
            url: "services/projects/:projectID/datamodels",
            method: "GET"
        },
        getDataModel: {
            url: "services/projects/:projectID/datamodels/:dataModelName?isdraft=:isdraft",
            method: "GET"
        },
        createDatabase: {
            url: "services/projects/:projectID/database",
            method: "POST"
        },
        createService: {
            url: "services/projects/:projectID/database/services",
            method: "POST"
        },
        deleteService: {
            url: "services/projects/:projectID/database/services/:dataModelName",
            method: "DELETE"
        },
        saveDataModel: {
            url: "services/projects/:projectID/datamodels/:dataModelName/save",
            method: "POST"
        },
        applyDataModel: {
            url: "services/projects/:projectID/database/services/:serviceId/update",
            method: "POST"
        },
        revertDataModel: {
            url: "services/projects/:projectID/datamodels/:dataModelName/revert",
            method: "POST"
        },
        dataModelDiff: {
            url: "services/projects/:projectID/database/services/:serviceId/changes",
            method: "GET"
        },

        /*Entities related services*/

        getAllEntities: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables",
            method: "GET"
        },
        getEntity: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:tableName",
            "method": "GET"
        },
        createEntity: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables",
            method: "POST"
        },
        updateEntity: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName",
            method: "POST"
        },
        deleteEntity: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName",
            method: "DELETE"
        },

        /*Entity Columns related services*/
        addUniqueKey: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/constraints",
            method: "POST"
        },
        deleteUniqueKey: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/constraints/:uniquekeyname",
            method: "DELETE"
        },
        addPrimaryKey: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/primaryKey",
            method: "PUT"
        },
        addColumns: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/columns",
            method: "POST"
        },
        updateColumn: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/columns/:columnName?forceDataLoss=:forceDataLoss",
            method: "PUT"
        },
        deleteColumn: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/columns/:columnName",
            method: "DELETE"
        },

        /*Services related to relations*/

        addRelation: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/relations",
            method: "POST"
        },
        updateRelation: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/relations/:relationName",
            method: "PUT"
        },
        deleteRelation: {
            url: "services/projects/:projectID/datamodels/:dataModelName/tables/:entityName/relations/:relationName",
            method: "DELETE"
        },
        getTypesMap: {
            url: "services/projects/:projectID/database/services/:dataModelName/configuration",
            method: "GET"
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
        executeQuery: {
            url: "services/projects/:projectID/datamodels/:dataModelName/query/execute",
            method: "POST"
        },

        /*Procedure Related services*/

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
        executeProcedure: {
            url: "services/projects/:projectID/datamodels/:dataModelName/procedures/execute",
            method: "POST"
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
        searchTableData: {
            url: "/:service/:dataModelName/:entityName/search?page=:page&size=:size&:sort",
            method: "POST"
        },
        searchTableDataWithQuery: {
            url: "/:service/:dataModelName/:entityName?q=:query&page=:page&size=:size&:sort",
            method: "GET"
        },
        exportTableData: {
            url: "/:service/:dataModelName/:entityName/export/:exportFormat?q=:query&size=:size&:sort",
            method: "GET"
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
            url: "/:service/:dataModelName/queryExecutor/queries/wm_custom?page=:page&size=:size",
            method: "POST"
        },
        getCustomQueryMetaData: {
            url: "/:service/:dataModelName/queries/wm_querymetadata",
            method: "POST"
        },
        executeCustomUpdateQuery: {
            url: "/:service/:dataModelName/queryExecutor/queries/wm_custom_update",
            method: "POST"
        },

        /*Procedure related properties*/
        executeNamedProcedure: {
            url: "/:service/:dataModelName/procedureExecutor/procedure/execute/:procedureName?page=:page&size=:size&:procedureParams",
            method: "GET"
        },
        executeCustomProcedure: {
            url: "/:service/:dataModelName/procedureExecutor/procedure/execute/wm_custom",
            method: "POST"
        },
        getCustomProcedureMetaData: {
            url: "/:service/:dataModelName/procedures/wm_proceduremetadata",
            method: "POST"
        },

        /*Database connection properties*/
        getSampleDbConnectionProperties: {
            url: "services/projects/:projectID/database/sample/connectionProps",
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
wm.plugins.database.constant('DB_CONSTANTS', {
    "DATABASE_WORKSPACE_TYPE": "db",
    "WAVEMAKER_SAMPLE_DB_NAME": "hrdb",
    "DEFAULT_DB_NAME": "MyTestDatabase",
    "HSQL_DB_TYPE": "HSQLDB",
    "MYSQL_DB_TYPE": "MySQL",
    "POSTGRESQL_DB_TYPE": "PostgreSQL",
    "ORACLE_DB_TYPE": "Oracle",
    "SQL_SERVER_DB_TYPE": "SQLServer",
    "DB2_DB_TYPE": "DB2",
    "MYSQL_CLOUD_HOST": "{WM_CLOUD_MYSQL_HOST}",
    "MYSQL_CLOUD_DB_TYPE": "MySQL-Cloud",
    "LOGIN": {
        "SAAS_MYSQL_CLOUD": {
            "USERNAME": "{WM_CLOUD_MYSQL_USERNAME}",
            "PASSWORD": "{WM_CLOUD_MYSQL_PASSWORD}"
        }
    },
    "DRIVER_VERSIONS": {
        "Oracle": [
            {
                "DB_VERSION": "Oracle 12.1 or 12cR1",
                "DRIVER_VERSION": "ojdbc7.jar",
                "URL": ""
            },
            {
                "DB_VERSION": "Oracle 11.2 or 11gR2",
                "DRIVER_VERSION": "ojdbc6.jar",
                "URL": ""
            }
        ],
        "SQLServer": [
            {
                "DB_VERSION": "SQL Server 2005",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2008",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2008R2",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2012",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "Azure SQL Database",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "PDW 2008R2 AU34",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2014",
                "DRIVER_VERSION": "Driver 4.0",
                "URL": ""
            },
            {
                "DB_VERSION": "SQL Server 2016",
                "DRIVER_VERSION": "Driver 4.0",
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
        "start"            : "STARTING_WITH",
        "end"              : "ENDING_WITH",
        "anywhere"         : "CONTAINING",
        "exact"            : "EQUALS",
        "notequals"        : "NOT_EQUALS",
        "between"          : "BETWEEN",
        "lessthan"         : "LESS_THAN",
        "lessthanequal"    : "LESS_THAN_OR_EQUALS",
        "greaterthan"      : "GREATER_THAN",
        "greaterthanequal" : "GREATER_THAN_OR_EQUALS",
        "null"             : "NULL",
        "empty"            : "EMPTY",
        "nullorempty"      : "NULL_OR_EMPTY"
    },
    "DATABASE_MATCH_MODES_WITH_QUERY": {
        "STARTING_WITH"          : "startswith",
        "ENDING_WITH"            : "endswith",
        "CONTAINING"             : "containing",
        "EQUALS"                 : "=",
        "NOT_EQUALS"             : "!=",
        "BETWEEN"                : "between",
        "LESS_THAN"              : "<",
        "LESS_THAN_OR_EQUALS"    : "<=",
        "GREATER_THAN"           : ">",
        "GREATER_THAN_OR_EQUALS" : ">=",
        "NULL"                   : "is null",
        "EMPTY"                  : "is empty",
        "NULL_OR_EMPTY"          : "is nullorempty"
    },
    "DATABASE_EMPTY_MATCH_MODES": ["NULL", "EMPTY", "NULL_OR_EMPTY"],
    "DATABASE_RANGE_MATCH_MODES": ["BETWEEN", "LESS_THAN", "LESS_THAN_OR_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUALS", "NOT_EQUALS"],
    "ACTIONS": {
        "CREATE": "CREATE",
        "UPDATE": "UPDATE",
        "DELETE": "DELETE",
        "SAVED": "SAVED"
    },
    "OBJECTS": {
        "DATABASE": "wm-db",
        "TABLE": "wm-db-table",
        "COLUMN": "wm-db-table-column",
        "RELATION": "wm-db-column-relation"
    },
    "DML_QUERY_INDICATORS": {
        "SELECT": "SELECT",
        "UPDATE": ["INSERT INTO", "UPDATE", "DELETE FROM"]
    },
    "DDL_QUERY_INDICATORS": ["CREATE", "ALTER", "RENAME", "DROP"],
    "SERVER_SIDE_PROPERTIES": {
        "CURRENT_DATE": {
            "property": "Current Date",
            "value": "CURRENT_DATE"
        },
        "CURRENT_TIME": {
            "property": "Current Time",
            "value": "CURRENT_TIME"
        },
        "CURRENT_USER_ID": {
            "property": "Current Userid",
            "value": "CURRENT_USER_ID"
        },
        "CURRENT_USER_NAME": {
            "property": "Current Username",
            "value": "CURRENT_USER_NAME"
        }
    },
    "COLUMN_VALUE_TYPES": {
        "user-defined"      : "User Defined",
        "server-defined"    : "Server Defined",
        "database-defined"  : "Database Defined"
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
    }
});

/*Defining the config for the database plugins*/
wm.plugins.database.config(function (BaseServiceManagerProvider, DB_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(DB_SERVICE_URLS);
});
