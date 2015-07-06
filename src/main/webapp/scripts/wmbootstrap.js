/*global WM, window */
/*Init file for run mode*/
var Application = WM.module('Application',
        [
            'ngRoute',
            'ui.bootstrap',
            'wm.common',
            'wm.variables',
            'wm.plugins.database',
            'wm.plugins.webServices',
            'wm.plugins.security',
            'wm.widgets',
            'wm.layouts',
            'wm.utils',
            "oc.lazyLoad",
            'wm.prefabs',
            "i18n",
            "angular-gestures"
        ]).constant('CONSTANTS', {
        "isRunMode": true
    }).controller('AppController', [
        '$rootScope',
        '$scope',
        '$compile',
        '$route',
        '$location',
        'ProjectService',
        'BasicVariableService',
        '$servicevariable',
        '$liveVariable',
        'Variables',
        'NavigationVariableService',
        'NotificationVariableService',
        'LoginVariableService',
        'LogoutVariableService',
        'TimerVariableService',
        'SecurityService',
        'Utils',
        'i18nService',
        'BaseService',
        'wmToaster',
        'UIMigration',
        function ($rootScope, $scope, $compile, $route, $location, ProjectService, BasicVariableService, $servicevariable, $liveVariable, Variables, NavigationVariableService, NotificationVariableService, LoginVariableService, LogoutVariableService, TimerVariableService, SecurityService, Utils, i18nService, BaseService, wmToaster, UIMigration) {
            'use strict';

            /* add a node to the DOM to determine the mobile view */
            WM.element('<i id="wm-mobile-display"></i>').appendTo(".wm-app");
            var projectID = ProjectService.getId(), /*ProjectID will always be at the same index in the URL*/
                projectDeployedUrl,
            /*variable to know whether a page is loaded or not*/
                loadedPages = {},
            /*variable to hold to track the previous route path*/
                prevRoute,
                invokeServiceEvent,
                updateLoggedInUserEvent,
                NG_LOCALE_PATH = "resources/ngLocale/",
                APP_LOCALE_PATH = "resources/i18n/",
                appProperties = WM.copy(_WM_APP_PROPERTIES),
                projectType = appProperties.type;

            _WM_APP_PROPERTIES = undefined; // delete the global variable.

            $rootScope.isPrefabType = projectType === 'PREFAB';
            $rootScope.isMobileType = projectType === 'MOBILE';
            $rootScope.isApplicationType = projectType === 'APPLICATION';
            $rootScope.isTemplateBundleType = projectType === 'TEMPLATEBUNDLE';

            if ($rootScope.isMobileType || $rootScope.isPrefabType) {
                Utils.fetchContent(
                    'json',
                    Utils.preventCachingOf('./config.json'),
                    function (response) {
                        if (!response.error) {
                            if ($rootScope.isPrefabType) {
                                $rootScope.prefabConfig = response;
                                projectDeployedUrl  = ProjectService.getDeployedUrl();
                            } else if ($rootScope.isMobileType) {
                                projectDeployedUrl = response.baseUrl;
                            }
                        }
                    },
                    WM.noop,
                    true
                );
            } else {
                projectDeployedUrl  = ProjectService.getDeployedUrl();
            }

            /*create the project object*/
            $rootScope.project = {
                id: projectID,
                deployedUrl: projectDeployedUrl
            };

            $rootScope.changeLocale = function ($isolateScope) {
                i18nService.setSelectedLocale($isolateScope.datavalue);
            };

            function updateLoggedInUser(checkVariable) {
                var loggedInUser = $rootScope.Variables && $rootScope.Variables.loggedInUser;

                if (checkVariable && !loggedInUser) {
                    return;
                }

                /* get the userAuthenticated status */
                SecurityService.isAuthenticated(function (isAuthenticated) {
                    /* set this flag to be used by the logout variable service */
                    $rootScope.isUserAuthenticated = typeof isAuthenticated === 'boolean' ? isAuthenticated : false;
                    /* if logged-in user variable present, get user info and persist */
                    if ($rootScope.isUserAuthenticated && loggedInUser) {
                        /* TODO: merge the userInfo service calls into a single call */
                        loggedInUser.dataSet.isAuthenticated = $rootScope.isUserAuthenticated;
                        loggedInUser.dataSet.roles = $rootScope.userRoles;
                        SecurityService.getUserName(function (name) {
                            loggedInUser.dataSet.name = name;
                        });
                        SecurityService.getUserId(function (id) {
                            loggedInUser.dataSet.id = id;
                        });
                        SecurityService.getTenantId(function (tenantId) {
                            loggedInUser.dataSet.tenantId = tenantId;
                        });
                    }
                });
            }

            /* initialize the i18nService */
            function initI18nService(localeVariable) {
                var supportedLocale,
                    defaultLocale = "en";
                localeVariable = localeVariable && localeVariable.dataSet;

                if (WM.isObject(localeVariable)) {
                    supportedLocale = Object.keys(localeVariable);
                }
                // if the supportedLocale is not available set it to defaultLocale
                supportedLocale = supportedLocale || [defaultLocale];
                i18nService.init(supportedLocale, defaultLocale, APP_LOCALE_PATH, NG_LOCALE_PATH);
                i18nService.setSelectedLocale(appProperties.defaultLanguage);
            }

            /* compile html-content manually in the page & update the variable context */
            function compilePageAndUpdateVariables(pageName) {
                var htmlMarkup = loadedPages[pageName].html;

                htmlMarkup = WM.element(Utils.processMarkup(htmlMarkup));
                htmlMarkup = UIMigration.run(htmlMarkup, false, true);

                /* load the new page*/
                /*Process markup*/
                if ($rootScope.isPrefabType) {
                    // if the project type is prefab, manipulate the response.
                    // save the markup of the page. wmPrefabRun directive will process it.
                    $rootScope.prefabTemplate = htmlMarkup;
                    $rootScope.isPrefabTemplate = true;
                    htmlMarkup = WM.element("<wm-prefab-run></wm-prefab-run>");
                }

                /* set the page-level variables, registration will occur in the page directive */
                Variables.setPageVariables(pageName, loadedPages[pageName].variables);

                /*append the html-markup element & compile*/
                WM.element('#wm-app-content').html(htmlMarkup);
                $compile(htmlMarkup)($scope);

                /* for prefab project, initialize local service */
                if ($rootScope.isPrefabType) {
                    initI18nService(loadedPages[pageName].variables.supportedLocale);
                }
            }

            /*event that gets fired when route changes*/
            $scope.$on(
                "$routeChangeSuccess",
                function () {

                    var pageName = (Utils.getCurrentPage() === "login.html") ? "Login" : $route.current.params.name,
                        loadPage;


                    /*check for pageName*/
                    if (!pageName) {
                        return;
                    }

                    /* separate the page name from subview element names if any*/
                    pageName = pageName.split(".").shift();
                    /* setting active page name in rootScope, required by the Variables service*/
                    $rootScope.activePageName = pageName;

                    loadPage = function (pageName) {
                        var target = WM.element('#wm-app-content'),
                            page = target.find('.app-page');

                        /* destroy the previous page scope */
                        if (page.length) {
                            page.scope().$destroy();
                        }

                        /* compile the page*/
                        compilePageAndUpdateVariables(pageName);
                    };

                    Application.loadResources(pageName, function () {
                        if (Utils.getCurrentPage() === "login.html" && pageName === "Login") {
                            loadPage(pageName);
                        } else {
                            /* check the security status */
                            SecurityService.isSecurityEnabled(function (isEnabled) {
                                $rootScope.isSecurityEnabled = typeof isEnabled === 'boolean' ? isEnabled : false;
                                /* if security enabled, get the user roles and load page, else simply load page*/
                                if ($rootScope.isSecurityEnabled) {
                                    SecurityService.getUserRoles(function (roles) {
                                        if (WM.isArray(roles)) {
                                            $rootScope.userRoles = roles;
                                            if ($rootScope.Variables && $rootScope.Variables.loggedInUser) {
                                                $rootScope.Variables.loggedInUser.dataSet.roles = roles;
                                                $rootScope.Variables.loggedInUser.dataSet.isSecurityEnabled = true;
                                            }
                                        }
                                        loadPage(pageName);
                                    }, function () {
                                        loadPage(pageName);
                                    });
                                } else {
                                    loadPage(pageName);
                                }
                            }, function () {
                                $rootScope.isSecurityEnabled = false;
                                loadPage(pageName);
                            });
                        }
                    });
                }
            );

            Application.loadResources = function (pageName, onLoadCallback) {
                if (!loadedPages[pageName]) {
                    BaseService.getHttpPromise({
                        method: 'GET',
                        url: Utils.preventCachingOf("pages/" + pageName + "/" + "page.min.html")
                    }).then(function (response) {
                        loadedPages[pageName] = Utils.parseCombinedPageContent(response.data, pageName);
                        Utils.triggerFn(onLoadCallback);
                        prevRoute = $location.path();
                    }, function (jqxhr) {
                        /*in case of 401 Unauthorized Error */
                        if (jqxhr.status === 401 && !jqxhr.headers('X-WM-Login-ErrorMessage')) {
                            BaseService.pushToErrorCallStack(null, function () {
                                Application.loadResources(pageName, onLoadCallback);
                            }, WM.noop);
                            BaseService.handleSessionTimeOut();
                        } else if (jqxhr.status === 403) {
                            /*in-case of 403 forbidden error*/
                            $rootScope.$safeApply($scope, function () {
                                /*TODO: remove prevRoute variable when 403 page is implemented */
                                wmToaster.show('error', $rootScope.appLocale['LABEL_ACCESS_DENIED'] || 'Access Denied', $rootScope.appLocale['LABEL_FORBIDDEN_MESSAGE'] || 'The requested resource access/action is forbidden.');
                                $location.path(prevRoute);
                            });
                        }
                    });
                } else {
                    /* trigger the success callback */
                    Utils.triggerFn(onLoadCallback);
                    /* store the previous route */
                    prevRoute = $location.path();
                }
            };

            /* load the common contents */
            if (($rootScope.isApplicationType || $rootScope.isMobileType) && Utils.getCurrentPage() !== "login.html") {
                var commonPage = "Common";
                Application.loadResources(commonPage, function () {
                    /* set the common-page variables, registration will be handled by page directive */
                    Variables.setPageVariables(commonPage, loadedPages[commonPage].variables);
                    /* load the new page*/
                    WM.element('#wm-common-content').html($compile(Utils.processMarkup(loadedPages[commonPage].html))($scope));

                    /* initialize the app variables */
                    Variables.initAppVariables($scope, function (appVariables) {
                        initI18nService(appVariables.supportedLocale);
                        updateLoggedInUser();
                    });
                });
            }

            /*function to invoke a service during run time*/
            invokeServiceEvent = $rootScope.$on('invoke-service', function (event, name, options, onSuccess, onError) {
                /*if function call is bound with the button, return*/
                if (name.indexOf('(') !== -1) {
                    return;
                }

                var variable;
                if (!options || !options.scope || !options.scope.Variables || !options.scope.Variables[name]) {
                    variable = Variables.getVariableByName(name);
                } else {
                    variable = options.scope.Variables[name];
                }

                if (!variable) {
                    return;
                }

                /* based on variable category, perform appropriate action */
                switch (variable.category) {
                case "wm.LiveVariable":
                    if (variable.operation === 'read') {
                        /*Set the "forceFetch" option so that data is fetched for the live-variable irrespective of "startUpdate"/"autoUpdate" properties.*/
                        options.forceFetch = true;
                        variable.update(options, onSuccess, onError);
                    } else {
                        /* else call the respective db operation (insert/update/delete) */
                        variable[variable.operation + 'Record'](options, onSuccess, onError);
                    }
                    break;
                case "wm.ServiceVariable":
                    variable.update(options, onSuccess, onError);
                    break;
                case "wm.NavigationVariable":
                    variable.navigate(options, onSuccess, onError);
                    break;
                case "wm.NotificationVariable":
                    variable.notify(options, onSuccess, onError);
                    break;
                case "wm.LoginVariable":
                    variable.login(options, onSuccess, onError);
                    break;
                case "wm.LogoutVariable":
                    variable.logout(options, onSuccess, onError);
                    break;
                case "wm.TimerVariable":
                    variable.fire(options, onSuccess, onError);
                    break;
                }
            });

            updateLoggedInUserEvent = $rootScope.$on("update-loggedin-user", function () {
                SecurityService.setLoggedInUser(null);
                updateLoggedInUser(true);
            });

            $scope.$on('$destroy', function () {
                invokeServiceEvent();
                updateLoggedInUserEvent();
            });
        }]);
Application.config(['$routeProvider', '$controllerProvider', '$filterProvider', '$compileProvider',
    function ($routeProvider, $controllerProvider, $filterProvider, $compileProvider) {
        'use strict';

        Application.$controller = $controllerProvider.register;
        Application.$directive = $compileProvider.directive;

        Application.$filter = $filterProvider.register;

        if (window.location.pathname.split("/").pop() === "login.html") {
            $routeProvider.when('/Login', {
                controllerAs: 'AppController'
            }).otherwise({
                redirectTo: 'Login'
            });
        } else {
            /*maintain default route in a variable*/
            var i = 0, route = "/:name";
            /*add routes for Common page & other cases*/
            $routeProvider.when('/Common', {
                redirectTo: 'Main'
            }).otherwise({
                redirectTo: 'Main'
            });
            /* loop to append parameters to default "/:name", allowing to create max. of 6 parameters*/
            while (i <= 6) {
                $routeProvider.when(route, {
                    controllerAs: 'AppController'
                });
                route += "/:param" + (++i);
            }
        }
    }]);

Application.config(['$ocLazyLoadProvider', function ($ocLazyLoadProvider) {
    'use strict';
    $ocLazyLoadProvider.config({
        asyncLoader: function (deps, callbackFn) {
            var fn = function (scripts, callback) {
                if (scripts.length === 0) {
                    if (callback) {
                        callback();
                    }
                } else {
                    WM.element.getScript(scripts.shift())
                        .done(function () {
                            fn(scripts, callback);
                        });
                }
            };

            fn(deps, callbackFn);
        }
    });
}]);

/* dummy service to avoid exceptions in run mode */
Application.service('PrefabService', WM.noop);

Application.config(['$controllerProvider', '$httpProvider', function ($controllerProvider, $httpProvider) {
    "use strict";

    $httpProvider.useApplyAsync(true);
    $controllerProvider.allowGlobals();
}]);