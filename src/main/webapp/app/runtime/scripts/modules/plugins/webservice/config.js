/*global WM, wm*/

/*Defining module for Web services */
wm.plugins.webServices = WM.module('wm.plugins.webServices', []);

wm.plugins.webServices.controllers = {};
wm.plugins.webServices.services = {};
wm.plugins.webServices.factories = {};

wm.plugins.webServices.controller(wm.plugins.webServices.controllers);
wm.plugins.webServices.service(wm.plugins.webServices.services);
wm.plugins.webServices.factory(wm.plugins.webServices.factories);

/*defining constants for web services module*/
wm.plugins.webServices.constant('WS_SERVICE_URLS', {
    WebService: {
        invokeRestCall: {
            url: "../services/restservices/invoke",
            method: "POST"
        },
        generateRESTWsdlSettings: {
            url: "../services/restservices/settings",
            method: "POST"
        },
        buildRestService: {
            url: "../services/restservices/create",
            method: "POST"
        },
        updateRestService: {
            url: "../services/restservices/update",
            method: "POST"
        },
        importWSDL: {
            url: "../services/soapservicegenerator/wsdl",
            method: "POST"
        },
        uploadWSDL: {
            url: "../services/soapservicegenerator/wsdl",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        registerFeedService: {
            url: "../services/servicegenerator/feed",
            method: "POST"
        },
        getRESTDetails: {
            url: "../services/projects/:projectID/services/:serviceID/restservice/",
            method: "GET"
        },
        getWSDL: {
            url: "../services/projects/:projectID/services/:serviceID/soapservicewsdl",
            method: "GET"
        },
        getBindingProperties: {
            url: "../services/projects/:projectID/services/:serviceID/properties",
            method: "GET"
        },
        setBindingProperties: {
            url: "../services/projects/:projectID/services/:serviceID/properties",
            method: "POST"
        },
        listTypes: {
            url: "../services/projects/:projectID/services/types",
            method: "GET"
        },
        listPrefabTypes: {
            url: "../services/projects/:projectID/prefabs/:prefabName/types",
            method: "GET"
        },
        listServicesWithType: {
            url: "../services/projects/:projectID/services",
            method: "GET"
        },
        getServiceMethods: {
            url: '../services/projects/:projectID/services/:serviceID/operations',
            method: "GET"
        },
        getServiceOperationParams: {
            url: '../services/projects/:projectID/services/:serviceID/operations/:operationID',
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
            url: '../services/projects/:projectID/services/:serviceID',
            method: "DELETE"
        },
        retrieveServiceOperations: {
            url: '../services/projects/:projectId/services/:serviceId/servicedef',
            method: "GET"
        },
        invokeRuntimeRestCall: {
            url: ''
        },
        buildApiRestService: {
            url: "../services/restservices/create",
            method: "POST"
        }
    }
});

/*Defining the constants for the web services module*/
wm.plugins.webServices.constant('WS_CONSTANTS', {
    WEBSERVICE_WORKSPACE_TYPE: "ws"
});

/*Defining the config for the web service plugins*/
wm.plugins.webServices.config(function (BaseServiceManagerProvider, WS_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(WS_SERVICE_URLS);
});
/*End of Web services Modules*/