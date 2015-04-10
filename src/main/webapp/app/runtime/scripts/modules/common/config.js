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

/* Defining constants for wmCommonModule application */
wm.modules.wmCommon.constant('CONSTANTS', {
    PAGE_DIRECTORY: "pages/",
    PROJECT_PATH: "/project/",
    PROVATAR_PATH: "./build/studio/styles/provatars/",
    MAIN_PAGE: "Main",
    PROJECTS_LIST_PAGE: "index.html",
    PROJECTS_LIST_DEBUG_PAGE: "index-debug.html",
    PROJECT_PAGE: "project.html",
    PROJECT_DEBUG_PAGE: "project-debug.html",
    LOGIN_PAGE: "login.html",
    LOGOUT_PAGE: "/login/signout",
    ACCESS_DENIED_PAGE: "403.html",
    DEFAULT_PAGE_NAME: "Page",
    FILE_EXTENSION_MARKUP: ".html",
    FILE_EXTENSION_SCRIPT: ".js",
    FILE_EXTENSION_STYLE: ".css",
    FILE_EXTENSION_VARIABLES: ".variables.json",
    DEFAULT_PROJECT_SHELL: {
        "id": "",
        "name": "default_project",
        "description": null
    },
    DEFAULT_PROJECT_SHELL_NAMES : {
        'DEFAULT': 'default',
        'PREFAB' : 'prefab',
        'ESHOP'  : 'eshop'
    },
    isStudioMode: true
});

/* Defining route path constants for wmCommonModule application */
wm.modules.wmCommon.constant('ROUTE_CONSTANTS', {
    PROJECTS_LIST: "/projects",
    USERS_LIST: "/users",
    USER_PROFILE: "/user/profile/:path",
    USER_PROFILE_DEFAULT: "/user/profile/update-profile",
    USER_PROFILE_CLOUD: "/user/profile/cloud",
    USER_CHANGE_PASSWORD: "/user/change-password",
    USER_UPDATE_PROFILE: "/user/update-profile",
    ACCOUNTS: "/accounts",
    LOGOUT: "/logout",
    PROJECT_NOT_FOUND: "/project/404",
    ACCESS_DENIED: "/access-denied"
});

wm.modules.wmCommon.constant('SERVICE_TYPE_CONSTANTS', {
    JAVA_SERVICE: "JavaService",
    WM_JAVA_SERVICE: "wm.JavaService",
    JAVA_SERVICE_WORKSPACE_TYPE: "javaservice",
    DEFAULT_JAVA_SERVICE_NAME: "MyJavaService",
    JAVA_SERVICE_TREE_ROOT_NODE_ICON_CLASS: "java-service",
    SECURITY_SERVICE: "Security",
    SECURITY_SERVICE_CLASS: "security-service",
    SECURITY_SERVICE_WORKSPACE_TYPE: 'securityservice',
    SECURITY_SERVICE_TYPE: "SecurityServiceType"
});

/* Defining route path constants for wmCommonModule application */
wm.modules.wmCommon.constant('USER_ROLE_CONSTANTS', {
    ADMIN: "admin"
});

/* Defining external links constants for wmCommonModule application */
wm.modules.wmCommon.constant('EXTERNAL_LINK_CONSTANTS', {
    CLOUDJEE_SIGNUP_PAGE: "https://staging.wavemakercloud.com/login/signup",
    USER_GUIDE: "//dev.wavemaker.com/docs/",
    API_DOCS: "wmdocs",
    COMMUNITY: "//dev.wavemaker.com/",
    DEMOS: "//dev.wavemaker.com/docs/studio/resources/demos/",
    SCREENCASTS: "//dev.wavemaker.com/docs/Studio/screencasts/",
    TUTORIALS: "//dev.wavemaker.com/docs/Studio/tutorials/",
    SHARE_FB: "//www.facebook.com/wavemakersoftware",
    SHARE_YOUTUBE: "http://www.youtube.com/user/wavemakersoftwaresf",
    SHARE_BLOG: "//dev.wavemaker.com/blog/",
    SHARE_TWITTER: "http://twitter.com/WaveMaker"
});

/* Defining service urls for file services ins tudio and run mode */
wm.modules.wmCommon.constant("WM_COMMON_SERVICE_URLS", {
    Studio: {
        getPreferences: {
            url: "../services/studio/preferences/",
            method: "GET"
        },
        setPreferences: {
            url: "../services/studio/preferences/",
            method: "POST"
        },
        prefabs: {
            url: "../services/prefabs/",
            method: "GET"
        },
        ServerLogs: {
            url: "../services/studio/logs/:lineCount",
            method: "GET"
        },
        about: {
            url: "../services/studio/about",
            method: "GET"
        },
        clientstatus: {
            url: "../services/studio/client/status",
            method: "GET"
        }
    },
    Project: {
        create: {
            url: "../services/projects",
            method: "POST"
        },
        copy: {
            url: "../services/copy",
            method: "POST"
        },
        remove: {
            url: "../services/projects/:projectID",
            method: "DELETE"
        },
        get: {
            url: "../services/projects/:projectID",
            method: "GET"
        },
        list: {
            url: "../services/projects",
            method: "GET"
        },
        run: {
            url: "../services/deployment/jobs",
            method: "POST"
        },
        clean: {
            url: "../services/deployment/jobs",
            method: "POST"
        },
        deploy: {
            url: "../services/deployment/jobs",
            method: "POST"
        },
        import: {
            url: "../services/import",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            params: {
                "packageType": 'PROJECT'
            },
            transformRequest: WM.identity
        },
        export: {
            url: "../services/export",
            method: "POST"
        },
        downloadZip: {
            url: "../services/download?fileType=zip&packageType=project&sourceName=:projectID&targetName=:path",
            method: "GET"
        },
        getUsers: {
            url: "../services/projects/:projectID/users",
            method: "GET"
        },
        addUser: {
            url: "../services/projects/:projectID/users",
            method: "POST"
        },
        removeUser: {
            url: "../services/projects/:projectID/users",
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        },
        updateDetails: {
            url: '../services/projects/:projectID',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    },
    User: {
        login: {
            url: '../services/auth/loginservice',
            method: 'POST'
        },
        logout: {
            url: "../services/auth/logoutservice",
            method: "GET"
        },
        list: {
            url: "../services/users/",
            method: "GET"
        },
        fetch: {
            url: "../services/auth/loggedinuserdetails",
            method: "GET"
        },
        register: {
            url: "../services/users/",
            method: "POST"
        },
        update: {
            url: "../services/users/",
            method: "PUT"
        },
        changePassword: {
            url: "../services/users/passwordservice/changepassword",
            method: "POST"
        }
    },
    Template: {
        list: {
            url: "../services/templates/",
            method: "GET"
        },
        remove: {
            url: "../services/templates/:templateID",
            method: "DELETE"
        }
    },
    Theme : {
        listInStudio: {
            url: "../services/themes/",
            method: "GET"
        },
        listInProject: {
            url: "../services/projects/:projectID/themes",
            method: "GET"
        },
        import: {
            url: "../services/import",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            params: {
                "packageType": 'THEME'
            },
            transformRequest: WM.identity
        },
        register: {
            url: "../services/projects/:projectID/themes/register",
            method: "POST"
        },
        deRegister: {
            url: "../services/projects/:projectID/themes/deregister",
            method: "POST"
        },
        getActive: {
            url: "../services/projects/:projectID/themes/active",
            method: "GET"
        },
        setActive: {
            url: "../services/projects/:projectID/themes/activate",
            method: "POST"
        },
        deActive: {
            url: "../services/projects/:projectID/themes/deactivate",
            method: "POST"
        },
        remove: {
            url: "../services/themes/:themeID",
            method: "DELETE"
        }
    },
    Prefab: {
        list: {
            url: "../services/prefabs/",
            method: "GET"
        },
        getConfig: {
            url: "prefabs/:prefab/webapp/config.json",
            method: "GET"
        },
        register: {
            url: "../services/projects/:projectID/prefabs",
            method: "POST"
        },
        import: {
            url: "../services/import",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            params: {
                "packageType": 'PREFAB'
            },
            transformRequest: WM.identity
        },
        export: {
            url: "../services/export",
            method: "POST"
        },
        downloadZip: {
            url: "../services/download?fileType=zip&packageType=prefab&sourceName=:projectID&targetName=:path",
            method: "GET"
        },
        remove: {
            url: "../services/prefabs/:prefabID",
            method: "DELETE"
        }
    },
    FILE: {
        read: {
            url: "../services/projects/:projectID/resources/web/:filePath",
            method: "GET"
        },
        write: {
            url: "../services/projects/:projectID/resources/web/:filePath",
            method: "POST"
        },
        remove: {
            url: "../services/projects/:projectID/resources/web/:filePath",
            method: "DELETE"
        },
        upload: {
            url: "../services/projects/:projectID/resources/web/:filePath",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        uploadPrefab: {
            url: "../services/prefabs",
            method: "POST",
            headers: {
                'Content-Type': undefined
            },
            transformRequest: WM.identity
        },
        registerFileUploadWidget: {
            url: "../services/fileservice/jobs",
            method: "POST"
        },
        addFolder: {
            url: "../services/projects/:projectID/resources/web/:folderPath",
            method: "PUT"
        }
    },
    FILE_RUN: {
        read: {
            url: ":filePath",
            method: "GET"
        }
    }
});

/*Defining the config for the*/
wm.modules.wmCommon.config(function (BaseServiceManagerProvider, WM_COMMON_SERVICE_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(WM_COMMON_SERVICE_URLS);
});

wm.modules.wmCommon.run(function (Utils, CONSTANTS) {
    'use strict';
    CONSTANTS.isMobile = Utils.isMobile();
    CONSTANTS.isIE = Utils.isIE();
    CONSTANTS.isIE11 = Utils.isIE11();
});
