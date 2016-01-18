/*global WM, window, device, _, _WM_APP_PROPERTIES, navigator, document */
/*Init file for run mode*/

WM.element.holdReady(true);
document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    WM.element('#wm-app-content').attr('ng-view', '');

    /* add a node to the DOM to determine the mobile view */
    WM.element('<i id="wm-mobile-display"></i>').appendTo('.wm-app');

    WM.element.holdReady(false);
});

var Application =
    WM.module('Application',
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
            'wm.mobile',
            'wm.utils',
            'oc.lazyLoad',
            'wm.prefabs',
            'i18n',
            'angular-gestures',
            'ngAnimate'
        ]);

Application
    .constant('CONSTANTS', {'isRunMode': true})
    .service('PrefabService', WM.noop) /* dummy service to avoid exceptions in run mode */
    .config(
        [
            '$controllerProvider',
            '$httpProvider',
            '$compileProvider',
            '$filterProvider',
            function ($controllerProvider, $httpProvider, $compileProvider, $filterProvider) {
                'use strict';

                Application.$controller = $controllerProvider.register;
                Application.$directive = $compileProvider.directive;
                Application.$filter = $filterProvider.register;

                $httpProvider.useApplyAsync(true);
                $controllerProvider.allowGlobals();
            }
        ]
    )
    .service('AppManager',
        [
            '$q',
            'Utils',
            'BaseService',
            '$location',
            '$rootScope',
            'wmToaster',
            'SecurityService',
            'i18nService',
            '$compile',
            'Variables',
            '$cacheFactory',
            '$document',
            'CONSTANTS',

            function ($q, Utils, BaseService, $location, $rs, wmToaster, SecurityService, i18nService, $compile, Variables, $cacheFactory, $document, CONSTANTS) {
                'use strict';

                var prevRoute,
                    cache           = $cacheFactory('APP_PAGES'),
                    NG_LOCALE_PATH  = 'resources/ngLocale/',
                    APP_LOCALE_PATH = 'resources/i18n/';

                function defaultPageLoadSuccessHandler(pageName, response) {
                    cache.put(pageName, Utils.parseCombinedPageContent(response.data, pageName));
                    $rs.activePageName = pageName; // setting active page name in rootScope, required by the Variables service
                    prevRoute = $location.path();
                }

                function defaultPageLoadErrorHandler(pageName, onSuccess, onError, jqxhr) {
                    if (jqxhr.status === 401 && !jqxhr.headers('X-WM-Login-ErrorMessage')) {
                        BaseService.pushToErrorCallStack(null, function () {
                            _load(pageName, onSuccess, onError);
                        }, WM.noop);
                        BaseService.handleSessionTimeOut();
                    } else if (jqxhr.status === 403) {
                        /*in-case of 403 forbidden error*/
                        /*TODO: remove prevRoute variable when 403 page is implemented */
                        wmToaster.show('error', $rs.appLocale.LABEL_ACCESS_DENIED || 'Access Denied', $rs.appLocale.LABEL_FORBIDDEN_MESSAGE || 'The requested resource access/action is forbidden.');
                        $location.path(prevRoute);
                    }
                }

                function _load(pageName, onSuccess, onError) {

                    BaseService.getHttpPromise({
                        'method': 'GET',
                        'url'   : Utils.preventCachingOf('pages/' + pageName + '/' + 'page.min.html')
                    }).then(function (response) {
                        defaultPageLoadSuccessHandler(pageName, response);
                        Utils.triggerFn(onSuccess, cache.get(pageName));
                    }, function (jqxhr) {
                        defaultPageLoadErrorHandler(pageName, onSuccess, onError, jqxhr);
                    });
                }

                function loadPage(pageName) {
                    var deferred = $q.defer(),
                        content;

                    /* separate the page name from subview element names if any*/
                    pageName = pageName.split('.').shift();
                    content  = cache.get(pageName);

                    if (!content) {
                        _load(pageName, deferred.resolve, deferred.reject);
                    } else {
                        $rs.activePageName = pageName;
                        deferred.resolve(content);
                    }

                    return deferred.promise;
                }

                function getPageContent(pageName, type) {
                    return (cache.get(pageName) || {})[type];
                }

                function loadUserRoles() {
                    var deferred = $q.defer();

                    SecurityService.isSecurityEnabled(function (isEnabled) {
                        $rs.isSecurityEnabled = typeof isEnabled === 'boolean' ? isEnabled : false;
                        /* if security enabled, get the user roles and load page, else simply load page*/
                        if ($rs.isSecurityEnabled) {
                            SecurityService.getUserRoles(function (roles, isAuthenticated) {
                                var dataset;
                                $rs.isUserAuthenticated = isAuthenticated;
                                if (WM.isArray(roles)) {
                                    $rs.userRoles = roles;
                                    if ($rs.Variables && $rs.Variables.loggedInUser) {
                                        dataset = $rs.Variables.loggedInUser.dataSet;
                                        dataset.roles = roles;
                                        dataset.isSecurityEnabled = true;
                                    }
                                }
                                deferred.resolve();
                            }, function () {
                                deferred.resolve();
                            });
                        } else {
                            deferred.resolve();
                        }
                    }, function () {
                        $rs.isSecurityEnabled = false;
                        deferred.resolve();
                    });

                    return deferred.promise;
                }

                /* initialize the i18nService */
                function initI18nService(supportedLocale, defaultLocale) {
                    var _sl = supportedLocale,
                        _dl = defaultLocale || 'en';

                    // if the supportedLocale is not available set it to defaultLocale
                    _sl = _sl || [_dl];
                    i18nService.init(_sl, _dl, APP_LOCALE_PATH, NG_LOCALE_PATH);
                    i18nService.setSelectedLocale(_dl);
                }
                /* Returns a promise that will be resolved when device is ready.*/
                function isDeviceReady() {
                    var d = $q.defer();
                    /*Only in case of deployed mobile apps, wait for deviceready event.*/
                    if (CONSTANTS.hasCordova) {
                        $document.one('deviceready', function () {
                            d.resolve();
                        });
                    } else {
                        d.resolve();
                    }
                    return d.promise;
                }

                function loadCommonPage($s) {
                    var pageName = 'Common';
                    return loadPage(pageName)
                        .then(function (content) {
                            Variables.setPageVariables(pageName, content.variables);
                            var $html = WM.element(Utils.processMarkup(content.html));
                            WM.element('#wm-common-content').append($html);
                            $compile($html)($s);
                        });
                }

                function initAppVariables($s) {
                    var deferred = $q.defer();
                    Variables.initAppVariables($s, deferred.resolve, deferred.reject);
                    return deferred.promise;
                }

                function updateLoggedInUser(checkVariable) {
                    var loggedInUser = $rs.Variables && $rs.Variables.loggedInUser;

                    if (checkVariable && !loggedInUser) {
                        return;
                    }

                    /* get the userAuthenticated status */
                    SecurityService.isAuthenticated(function (isAuthenticated) {
                        /* set this flag to be used by the logout variable service */
                        $rs.isUserAuthenticated = typeof isAuthenticated === 'boolean' ? isAuthenticated : false;
                        /* if logged-in user variable present, get user info and persist */
                        if ($rs.isUserAuthenticated && loggedInUser) {
                            /* TODO: merge the userInfo service calls into a single call */
                            loggedInUser.dataSet.isAuthenticated = $rs.isUserAuthenticated;
                            loggedInUser.dataSet.roles = $rs.userRoles;
                            SecurityService.getUserName(function (name) {
                                loggedInUser.dataSet.name = name;
                            });
                            SecurityService.getUserId(function (id) {
                                loggedInUser.dataSet.id = id;
                            });
                            SecurityService.getTenantId(function (tenantId) {
                                loggedInUser.dataSet.tenantId = tenantId;
                            });
                        } else if (loggedInUser) {
                            loggedInUser.dataSet.isAuthenticated = false;
                            loggedInUser.dataSet.roles = [];
                            loggedInUser.dataSet.name = '';
                            loggedInUser.dataSet.id = '';
                            loggedInUser.dataSet.tenantId = '';
                        }
                    });
                }

                function getPreparedPageContent(pageName) {

                    var content  = cache.get(pageName).html,
                        $content = content || '';

                    $content = WM.element(Utils.processMarkup(content));

                    if ($rs.isPrefabType) {
                        $rs.prefabTemplate = $content;
                        $rs.isPrefabTemplate = true;
                        $content = WM.element('<wm-prefab-run></wm-prefab-run>');
                    }

                    return $content;
                }

                function clearPagesCache() {
                    cache.destroy();
                    cache = $cacheFactory('APP_PAGES');
                }

                $rs.$on('app-logout-success', clearPagesCache);

                this.loadPage               = loadPage;
                this.loadUserRoles          = loadUserRoles;
                this.getPageContent         = getPageContent;
                this.loadCommonPage         = loadCommonPage;
                this.initI18nService        = initI18nService;
                this.initAppVariables       = initAppVariables;
                this.updateLoggedInUser     = updateLoggedInUser;
                this.getPreparedPageContent = getPreparedPageContent;
                this.isDeviceReady          = isDeviceReady;
            }
        ])
    .config(
        [
            '$routeProvider',
            function ($routeProvider) {
                'use strict';

                var routeConfig = {
                    'template': '<div>Loading Page Content...</div>',
                    'resolve': {
                        'pageContent': function (AppManager, $route) {
                            var pageName = $route.current.params.name;
                            return AppManager.loadPage(pageName);
                        }
                    }
                },
                    route = '/:name';

                function isLoginPage() {
                    return window.location.pathname.split('/').pop() === 'login.html';
                }

                if (isLoginPage()) {
                    $routeProvider
                        .when('/:name', routeConfig) // load the given configured login page.
                        .otherwise({redirectTo: 'Login'}); // load the default login page
                } else {

                    WM.extend(routeConfig.resolve, {
                        'userRoles': function (AppManager) {
                            return AppManager.loadUserRoles();
                        }
                    });

                    /* loop to append parameters to default "/:name", allowing to create max. of 6 parameters*/
                    $routeProvider
                        .when(route, routeConfig) // when page name is provided
                        .when('/Common', {redirectTo: 'Main'}) // when pageName is Common
                        .otherwise({redirectTo: 'Main'});

                    _.range(1, 7).forEach(function (idx) {
                        route = route + '/:param' + idx;
                        $routeProvider.when(route, routeConfig);
                    });
                }
            }
        ]
    )
    .controller('AppController',
        [
            '$scope',
            '$rootScope',
            'ProjectService',
            'i18nService',
            'Utils',
            'AppManager',
            'SecurityService',
            'Variables',
            'CONSTANTS',
            'wmSpinner',

            //do not remove the below lines
            'BasicVariableService',
            '$servicevariable',
            '$liveVariable',
            'NavigationVariableService',
            'NotificationVariableService',
            'LoginVariableService',
            'LogoutVariableService',
            'TimerVariableService',

            function ($s, $rs, ProjectService, i18nService, Utils, AppManager, SecurityService, Variables, CONSTANTS, wmSpinner) {
                'use strict';

                var projectID = ProjectService.getId(), /*ProjectID will always be at the same index in the URL*/
                    appProperties = Utils.getClonedObject(_WM_APP_PROPERTIES),
                    pageReadyDeregister;

                $rs.isPrefabType         = appProperties.type === 'PREFAB';
                $rs.isApplicationType    = appProperties.type === 'APPLICATION';
                $rs.isTemplateBundleType = appProperties.type === 'TEMPLATEBUNDLE';

                $rs.$on('$routeChangeSuccess', function (evt, $route) {
                    var pageName = $route.params.name,
                        pageVars,
                        supportedLocale;

                    if (pageName) {
                        pageName = pageName.split('.').shift();
                        $route.locals.$template = AppManager.getPreparedPageContent(pageName);
                        /* set the page-level variables, registration will occur in the page directive */
                        pageVars = AppManager.getPageContent(pageName, 'variables');
                        Variables.setPageVariables(pageName, pageVars);

                        if ($rs.isPrefabType) {
                            supportedLocale = Utils.findValueOf(pageVars, 'supportedLocale.dataSet');
                            AppManager.initI18nService(_.keys(supportedLocale), appProperties.defaultLanguage);
                        }
                    }
                });

                /*create the project object*/
                $rs.project = {
                    'id'          : projectID,
                    'activeTheme' : appProperties.activeTheme,
                    'deployedUrl' : ProjectService.getDeployedUrl()
                };

                $rs.changeLocale = function ($is) {
                    i18nService.setSelectedLocale($is.datavalue);
                };

                if ($rs.isPrefabType) {
                    Utils.fetchContent(
                        'json',
                        Utils.preventCachingOf('./config.json'),
                        function (response) {
                            if (!response.error) {
                                $rs.prefabConfig = response;
                            }
                        },
                        WM.noop,
                        true
                    );
                }

                /* load the common contents */
                if ($rs.isApplicationType && Utils.getCurrentPage() !== 'login.html') {

                    AppManager.isDeviceReady()
                        .then(function () {
                            return AppManager.loadCommonPage($s);
                        }).then(function () {
                            return AppManager.initAppVariables($s);
                        })
                        .then(function (appVariables) {
                            var supportedLocale = (appVariables.supportedLocale || {}).dataSet;
                            AppManager.initI18nService(_.keys(supportedLocale), appProperties.defaultLanguage);
                            AppManager.updateLoggedInUser();
                        });
                }

                /*$rs.isSecurityEnabled is set to true only after user logs in. Before that we need to know whether security is enabled or not
                * so when current page is login.html we assume that security is enabled*/
                if (window.location.pathname.split('/').pop() === 'login.html') {
                    $rs.isSecurityEnabled = true;
                }

                $rs.$on('update-loggedin-user', function () {
                    SecurityService.setLoggedInUser(null);
                    AppManager.updateLoggedInUser(true);
                });

                /*function to invoke a service during run time*/
                $rs.$on('invoke-service', function (event, name, options, onSuccess, onError) {
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
                    case 'wm.LiveVariable':
                        if (variable.operation === 'read') {
                            variable.update(options, onSuccess, onError);
                        } else {
                            /* else call the respective db operation (insert/update/delete) */
                            variable[variable.operation + 'Record'](options, onSuccess, onError);
                        }
                        break;
                    case 'wm.ServiceVariable':
                        variable.update(options, onSuccess, onError);
                        break;
                    case 'wm.NavigationVariable':
                        variable.navigate(options, onSuccess, onError);
                        break;
                    case 'wm.NotificationVariable':
                        variable.notify(options, onSuccess, onError);
                        break;
                    case 'wm.LoginVariable':
                        variable.login(options, onSuccess, onError);
                        break;
                    case 'wm.LogoutVariable':
                        variable.logout(options, onSuccess, onError);
                        break;
                    case 'wm.TimerVariable':
                        variable.fire(options, onSuccess, onError);
                        break;
                    case 'wm.DeviceVariable':
                        variable.invoke(options, onSuccess, onError);
                        break;
                    }
                });

                if (CONSTANTS.hasCordova) {
                    pageReadyDeregister = $rs.$on('page-ready', function () {
                        navigator.splashscreen.hide();
                        pageReadyDeregister();
                    });
                }
                AppManager.isDeviceReady().then(function () {
                    $rs.$emit('application-ready');
                });
                /* This is used to show and hide the spinner when service is in flight */
                $rs.$on('toggle-variable-state', function (event, variableName, active) {
                    var variable = Variables.getVariableByName(variableName);
                    if (variable && !_.isEmpty(_.trim(variable.spinnerContext))) {

                        if (active) {
                            variable._spinnerId = wmSpinner.show(variable.spinnerMessage);
                        } else {
                            wmSpinner.hide(variable._spinnerId);
                        }
                    }
                });
            }
        ]);