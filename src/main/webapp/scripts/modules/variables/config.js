/*global WM, wm*/
/*jslint todo: true */

/*Definition of the Variables Module*/
/**
 * @ngdoc overview
 * @name wm.variables
 * @description
 * The 'wm.variables' module provides variables for access in the studio and the applications.
 */
wm.variables = WM.module('wm.variables', ['base64']);

wm.variables.controllers = {};
wm.variables.services = {};
wm.variables.factories = {};
wm.variables.filters = {};
wm.variables.controller(wm.variables.controllers);
wm.variables.service(wm.variables.services);
wm.variables.factory(wm.variables.factories);
wm.variables.filter(wm.variables.filters);

/* Defining route path constants for wmCoreModule application */
wm.variables.constant('VARIABLE_CONSTANTS', {
    EVENTS: ["onBeforeUpdate", "onResult", "onBeforeOpen", "onOpen", "onBeforeMessageSend", "onMessageReceive", "onError", "onBeforeDatasetReady", "onCanUpdate", "onClick", "onHide", "onOk", "onCancel", "onBeforeClose", "onClose", "onTimerFire", "onSuccess", "onProgress", "onOnline", "onOffline", "onBefore"],
    EVENT: {
        "CAN_UPDATE": "onCanUpdate",
        "BEFORE_UPDATE": "onBeforeUpdate",
        "PREPARE_SETDATA": "onBeforeDatasetReady",
        "RESULT": "onResult",
        "ERROR": "onError",
        'CLICK': 'onClick',
        'HIDE': 'onHide',
        "OK": "onOk",
        "CANCEL": "onCancel",
        "CLOSE": "onClose",
        "TIMER_FIRE": "onTimerFire",
        "SUCCESS": "onSuccess",
        "BEFORE_OPEN": "onBeforeOpen",
        "OPEN": "onOpen",
        "BEFORE_SEND": "onBeforeMessageSend",
        "MESSAGE_RECEIVE": "onMessageReceive",
        "BEFORE_CLOSE": "onBeforeClose"
    },
    OWNER: {"APP": "App", "PAGE": "Page"},
    SERVICE_TYPE_JAVA: "JavaService",
    SERVICE_TYPE_REST: "RestService",
    SERVICE_TYPE_SOAP: "SoapService",
    SERVICE_TYPE_FEED: "FeedService",
    SERVICE_TYPE_DATA: "DataService",
    SERVICE_TYPE_SECURITY: "SecurityServiceType",
    SERVICE_NAME_FEED: "FeedService",
    SERVICE_TYPE_WEBSOCKET: "WebSocketService",
    BODY_FIELD: "bodyField",
    REST_SUPPORTED_SERVICES: ["JavaService", "SoapService", "FeedService", "RestService", "SecurityServiceType", "DataService", "WebSocketService"],
    PAGINATION_PARAMS: ["page", "size", "sort"],
    DEFAULT_VAR: {
        "NOTIFICATION": "appNotification"
    }
});

wm.variables.constant('VARIABLE_SERVICE_URLS', {
    VariableService : {
        addAppVariables: {
            url: 'services/projects/:projectId/variables',
            method: 'POST'
        },
        addPageVariables: {
            url: 'services/projects/:projectId/pages/:pageName/variables',
            method: 'POST'
        },
        getAppVariables: {
            url: 'services/projects/:projectId/variables',
            method: 'GET'
        },
        getPageVariables: {
            url: 'services/projects/:projectId/pages/:pageName/variables',
            method: 'GET'
        },
        updateAppVariables: {
            url: 'services/projects/:projectId/variables',
            method: 'PUT'
        },
        updatePageVariables: {
            url: 'services/projects/:projectId/pages/:pageName/variables',
            method: 'PUT'
        },
        deleteAppVariables: {
            url: 'services/projects/:projectId/variables?variableNames[]=:deletedNames',
            method: 'DELETE'
        },
        deletePageVariables: {
            url: 'services/projects/:projectId/pages/:pageName/variables?variableNames[]=:deletedNames',
            method: 'DELETE'
        },
        moveAppVariables: {
            url: 'services/projects/:projectId/variables/move?pageName=:toPage',
            method: 'POST'
        },
        movePageVariables: {
            url: 'services/projects/:projectId/pages/:pageName/variables/move',
            method: 'POST'
        },
        getServiceOpInfo: {
            url: 'services/servicedefs',
            method: 'GET'
        },
        getPrefabServiceOpInfo: {
            url: 'services/prefabs/:prefabName/servicedefs',
            method: 'GET'
        }
    }
});
wm.variables.constant('VARIABLE_SERVICE_URLS_MOBILE', {
    VariableService : {
        getServiceOpInfo: {
            url: 'metadata/app/service-definitions.json',
            method: 'GET'
        },
        getPrefabServiceOpInfo: {
            url: 'metadata/prefabs/:prefabName/service-definitions.json',
            method: 'GET'
        }
    }
});

wm.variables.config(function (BaseServiceManagerProvider, VARIABLE_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(VARIABLE_SERVICE_URLS);
});

wm.variables.run(function ($location, BaseServiceManager, VARIABLE_SERVICE_URLS, VARIABLE_SERVICE_URLS_MOBILE) {
    'use strict';
    if ($location.protocol() === 'file') {
        var urls = WM.extend({}, VARIABLE_SERVICE_URLS.VariableService, VARIABLE_SERVICE_URLS_MOBILE.VariableService);
        VARIABLE_SERVICE_URLS.VariableService = urls;
        BaseServiceManager.register(VARIABLE_SERVICE_URLS);
    }
});

/*End of Module definition*/