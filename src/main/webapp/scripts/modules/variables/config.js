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
    EVENTS: ["onCanUpdate", "onBeforeUpdate", "onPrepareSetData", "onResult", "onSuccess", "onError", "onOk", "onCancel", "onClose", "onTimerFire"],
    OWNER: {"APP": "App", "PAGE": "Page"},
    SERVICE_TYPE_JAVA: "JavaService",
    SERVICE_TYPE_REST: "RestService",
    SERVICE_TYPE_SOAP: "SoapService",
    SERVICE_TYPE_FEED: "FeedService",
    SERVICE_TYPE_DATA: "DataService",
    SERVICE_NAME_FEED: "FeedService",
    REST_SUPPORTED_SERVICES: ["JavaService", "SoapService", "FeedService", "RestService"]
});

/*End of Module definition*/