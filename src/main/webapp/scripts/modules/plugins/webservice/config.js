/*global WM, wm*/

/*Defining module for Web services */
wm.plugins.webServices = WM.module('wm.plugins.webServices', ['base64']);

wm.plugins.webServices.controllers = {};
wm.plugins.webServices.services = {};
wm.plugins.webServices.factories = {};

wm.plugins.webServices.controller(wm.plugins.webServices.controllers);
wm.plugins.webServices.service(wm.plugins.webServices.services);
wm.plugins.webServices.factory(wm.plugins.webServices.factories);

wm.plugins.webServices.controllers.EmptyController = WM.noop;

/*defining constants for web services module*/
wm.plugins.webServices.constant('WS_SERVICE_URLS', {
    WebService: {
        invokeRestCall: {
            url: "services/projects/:projectID/restservices/invoke?optimizeResponse=:optimizeResponse",
            method: "POST"
        },
        generateRESTWsdlSettings: {
            url: "services/projects/:projectID/restservice/settings",
            method: "POST"
        },
        buildRestService: {
            url: "services/projects/:projectID/restservice",
            method: "POST"
        },
        updateRestService: {
            url: "services/projects/:projectID/restservice",
            method: "PUT"
        },
        importWSDL: {
            url: "services/projects/:projectID/soapservice/import",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        uploadWSDL: {
            url: "services/projects/:projectID/soapservice/import",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        registerFeedService: {
            url: "services/projects/:projectID/feed/register",
            method: "POST"
        },
        getRESTDetails: {
            url: "services/projects/:projectID/restservice/:serviceID",
            method: "GET"
        },
        getWSDL: {
            url: "services/projects/:projectID/soapservice/:serviceID/wsdl",
            method: "GET"
        },
        getBindingProperties: {
            url: "services/projects/:projectID/services/:serviceID/properties",
            method: "GET"
        },
        setBindingProperties: {
            url: "services/projects/:projectID/services/:serviceID/properties",
            method: "POST"
        },
        listTypes: {
            url: "services/projects/:projectID/services/types",
            method: "GET"
        },
        listPrefabTypes: {
            url: "services/projects/:projectID/prefabs/:prefabName/types",
            method: "GET"
        },
        listServicesWithType: {
            url: "services/projects/:projectID/services",
            method: "GET"
        },
        getServiceMethods: {
            url: 'services/projects/:projectID/services/:serviceID/operations',
            method: "GET"
        },
        getServiceOperationParams: {
            url: 'services/projects/:projectID/services/:serviceID/operations/:operationID',
            method: "GET"
        },
        invoke: {
            url: '/:serviceFile',
            method: "POST"
        },
        invokeRestService: {
            url: '/services/:serviceID/:operationID',
            method: "POST"
        },
        invokePrefabRestService: {
            url: '/:serviceID/:operationID',
            method: "POST"
        },
        remove: {
            url: 'services/projects/:projectID/services/:serviceID',
            method: "DELETE"
        },
        retrieveServiceOperations: {
            url: 'services/projects/:projectId/services/:serviceId/servicedef',
            method: "GET"
        },
        invokeRuntimeRestCall: {
            url: ''
        },
        buildApiRestService: {
            url: "services/restservices/create",
            method: "POST"
        },
        getSoapServiceSettings: {
            url: "services/projects/:projectId/soapservice/:serviceId/settings",
            method: "GET"
        },
        setSoapServiceSettings: {
            url: "services/projects/:projectId/soapservice/:serviceId/settings",
            method: "POST"
        },
        reImportSoapService: {
            url: "services/projects/:projectID/soapservice/:serviceId/reimport",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        configureWebSocketService: {
            url: "services/projects/:projectID/websocketservice/settings",
            method: "POST"
        },
        buildWebSocketService: {
            url: "services/projects/:projectID/websocketservice",
            method: "POST"
        },
        updateWebSocketService: {
            url: "services/projects/:projectID/websocketservice",
            method: "PUT"
        },
        getWebSocketServiceDetails: {
            url: "services/projects/:projectID/websocketservice/:serviceID",
            method: "GET"
        }
    }
});

/*Defining the constants for the web services module*/
wm.plugins.webServices.constant('WS_CONSTANTS', {
    WEBSERVICE_WORKSPACE_TYPE: "ws",
    HTTP_METHODS: ["GET", "POST", "PUT", "HEAD", "PATCH", "DELETE"],
    NON_BODY_HTTP_METHODS: ["GET", "HEAD"],
    PRIMITIVE_DATA_TYPES: ["number", "integer", "string", "boolean", "file"],
    OPERATION_NAME_KEY: "x-WM-METHOD_NAME",
    CONTENT_TYPES: {
        FORM_URL_ENCODED: "application/x-www-form-urlencoded",
        MULTIPART_FORMDATA: "multipart/form-data",
        OCTET_STREAM: "application/octet-stream"
    },
    CONTROLLER_NAMES: {
        QUERY_CONTROLLER: "QueryExecutionController",
        PROCEDURE_CONTROLLER: "ProcedureExecutionController"
    },
    HTTP_STATUS_CODE: {
        CORS_FAILURE: -1,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403
    },
    HTTP_STATUS_CODE_MESSAGES: {
        '401': "Requested resource requires authentication",
        '-1': "Possible CORS Failure, try disabling Same-Origin Policy on the browser."
    }
});

/*Defining the config for the web service plugins*/
wm.plugins.webServices.config(function (BaseServiceManagerProvider, WS_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(WS_SERVICE_URLS);
});
/*End of Web services Modules*/
