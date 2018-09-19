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
            method: "POST"
        },
        getModel: {
            url: "services/projects/:projectID/models/:serviceId",
            method: "GET"
        },
        listScopeTypes: {
            url: "services/projects/:projectID/models/regions/:regionId/scopes?created=:isCreated",
            method: "POST"
        },
        listRegions: {
            url: "services/projects/:projectID/models/regions",
            method: "POST"
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
        reimportModel: {
            url: "services/projects/:projectID/models/:serviceId/reimport",
            method: "GET"
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
            url: "services/projects/:projectID/models/:serviceId/attribute/dataTypes",
            method: "GET"
        },
        getlookUpEntries: {
            url: "services/projects/:projectID/models/:serviceId/attribute/lookupTypes",
            method: "GET"
        },
        getCustomProperties: {
            url: "services/projects/:projectID/models/:serviceId/attribute/configurations",
            method: "GET"
        },

        /*Entity Attribute related services*/
        updateEntity: {
            url: "services/projects/:projectID/models/:serviceId/entity/:entityName",
            method: "PUT"
        },
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
        }
    }
});

/*Defining the constants for the database service module*/
wm.plugins.modeldesigner.constant('MODEL_CONSTANTS', {
    "DATAMODEL_WORKSPACE_TYPE": "model",
    "PERMISSIONS": {
        "DEFAULT": {
            "CREATE": true,
            "UPDATE": true,
            "DELETE": true,
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
    }
});

/*Defining the config for the database plugins*/
wm.plugins.modeldesigner.config(function (BaseServiceManagerProvider, MODEL_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(MODEL_SERVICE_URLS);
});
