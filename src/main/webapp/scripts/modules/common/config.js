
/*global WM, wm, studio*/

/* Defining modules for wmCommonModule application */
wm.modules.wmCommon = WM.module('wm.common', []);

wm.modules.wmCommon.controllers = {};
wm.modules.wmCommon.directives = {};
wm.modules.wmCommon.factories = {};
wm.modules.wmCommon.services = {};
wm.modules.wmCommon.providers = {};

/*created a dummy $ocLazyLoad service to imitate perfect flow, to avoid execution stoppages.*/
wm.modules.wmCommon.services.$ocLazyLoad = WM.noop;

wm.modules.wmCommon.controller(wm.modules.wmCommon.controllers);
wm.modules.wmCommon.directive(wm.modules.wmCommon.directives);
wm.modules.wmCommon.factory(wm.modules.wmCommon.factories);
wm.modules.wmCommon.service(wm.modules.wmCommon.services);
wm.modules.wmCommon.provider(wm.modules.wmCommon.providers);

wm.modules.wmCommon.constant('SERVICE_TYPE_CONSTANTS', {
    JAVA_SERVICE: "JavaService",
    WM_JAVA_SERVICE: "wm.JavaService",
    WM_WEB_SERVICE: "wm.WebService",
    WM_DB_SERVICE: "wm.DataModel",
    WM_DB_MODEL: "wm.DataModelService",
    JAVA_SERVICE_WORKSPACE_TYPE: "javaservice",
    DEFAULT_JAVA_SERVICE_NAME: "MyJavaService",
    JAVA_SERVICE_TREE_ROOT_NODE_ICON_CLASS: "java-service",
    SECURITY_SERVICE: "Security",
    SECURITY_SERVICE_CLASS: "security-service",
    SECURITY_SERVICE_WORKSPACE_TYPE: 'securityservice',
    SECURITY_SERVICE_TYPE: "SecurityServiceType"
});

/*Defining custom swagger properties for WM internal use*/
wm.modules.wmCommon.constant('SWAGGER_CONSTANTS', {
    WM_DATA_JSON: "wm_data_json",
    WM_HTTP_JSON: "wm_httpRequestDetails",
    SERVER: "SERVER",
    APP_ENVIRONMENT: "APP_ENVIRONMENT",
    PROMPT: "PROMPT",
    VARIABLE_APP_ENV: "__APP_ENV__"
});



/* Defining service urls for file services for run mode */
wm.modules.wmCommon.constant("WM_COMMON_SERVICE_URLS", {
    Project_Run: {
        inplaceDeploy: {
            url: "services/projects/:projectId/deployment/inplaceDeploy",
            method: "POST"
        }
    },
    FILE_RUN: {
        read: {
            url: ":filePath",
            method: "GET"
        }
    },
    MARKUP: {
        get: {
            url: "services/projects/:projectId/pages/:pageName/:pageName.html",
            method: "GET"
        },
        post: {
            url: 'services/projects/:projectId/pages/:pageName/:pageName.html',
            method: "POST"
        }
    }
});

/*Defining the config for the*/
wm.modules.wmCommon.config(function (BaseServiceManagerProvider, WM_COMMON_SERVICE_URLS, $compileProvider) {
    'use strict';

    BaseServiceManagerProvider.register(WM_COMMON_SERVICE_URLS);
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript):/);
});

wm.modules.wmCommon.run(function (Utils, CONSTANTS) {
    'use strict';
    CONSTANTS.isMobile = Utils.isMobile();
    CONSTANTS.isIE = Utils.isIE();
    CONSTANTS.isIE11 = Utils.isIE11();
});
