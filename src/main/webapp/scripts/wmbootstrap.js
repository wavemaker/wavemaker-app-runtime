/*global WM, window, device, _, _WM_APP_PROPERTIES, navigator, document */

WM.element.holdReady(true);
document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    WM.element('#wm-app-content').attr('ng-view', '');

    // add a node to the DOM to determine the mobile view
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
    .service('PrefabService', WM.noop) // dummy service to avoid exceptions in run mode
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

                /**
                 * Handles the app when a XHR request returns 401 response
                 * If no user was logged in before 401 occurred, First time Login is simulated
                 * Else, a session timeout has occurred and the same is simulated
                 * @param page  if provided, represents the page name for which XHR request returned 401, on re-login
                 *              if not provided, a service request returned 401
                 * @param onSuccess success handler
                 * @param onError error handler
                 */
                function handleSessionTimeout(page, onSuccess, onError) {
                    var sessionTimeoutConfig,
                        sessionTimeoutMethod,
                        loginConfig,
                        loginMethod,
                        LOGIN_METHOD = {
                            'DIALOG' : 'DIALOG',
                            'PAGE'   : 'PAGE'
                        };
                    SecurityService.getConfig(function (config) {
                        // if no user found, 401 was thrown for first time login
                        if (config.userInfo && config.userInfo.userName) {
                            sessionTimeoutConfig = config.login.sessionTimeout || {'type': LOGIN_METHOD.DIALOG};
                            sessionTimeoutMethod = sessionTimeoutConfig.type.toUpperCase();
                            if (sessionTimeoutMethod === LOGIN_METHOD.DIALOG) {
                                if (page) {
                                    BaseService.pushToErrorCallStack(null, function () {
                                        _load(page, onSuccess, onError);
                                    }, WM.noop);
                                }
                                BaseService.handleSessionTimeOut();
                            } else if (sessionTimeoutMethod === LOGIN_METHOD.PAGE) {
                                if (!page) {
                                    page = $location.path().replace('/', '');
                                }
                                $location.path(sessionTimeoutConfig.pageName);
                                $location.search('redirectTo', page);
                            }
                        } else {
                            loginConfig = config.login;
                            loginMethod = loginConfig.type.toUpperCase();
                            if (loginMethod === LOGIN_METHOD.DIALOG) {
                                BaseService.handleSessionTimeOut();
                                // Through loginDialog, user will be redirected to respective landing page as it is a first time login
                            } else if (loginMethod === LOGIN_METHOD.PAGE) {
                                $location.path(loginConfig.pageName);
                            }
                        }
                    });
                }

                function defaultPageLoadErrorHandler(pageName, onSuccess, onError, jqxhr) {
                    if (jqxhr.status === 401 && !jqxhr.headers('X-WM-Login-ErrorMessage')) {
                        handleSessionTimeout(pageName, onSuccess, onError);
                    } else if (jqxhr.status === 403) {
                        // in-case of 403 forbidden error
                        // TODO: remove prevRoute variable when 403 page is implemented
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

                    // separate the page name from subview element names if any
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

                // initialize the i18nService
                function initI18nService(supportedLocale, defaultLocale) {
                    var _acceptLang = (Utils.getCookieByName('X-Accept-Language') || '').split(','),
                        _sl         = supportedLocale,
                        _dl;

                    _dl = _.intersection(_acceptLang, _sl)[0] || defaultLocale || 'en';

                    // if the supportedLocale is not available set it to defaultLocale
                    _sl = _sl || [_dl];
                    i18nService.init(_sl, _dl, APP_LOCALE_PATH, NG_LOCALE_PATH);
                    i18nService.setSelectedLocale(_dl);
                }

                // Returns a promise that will be resolved when device is ready.
                function isDeviceReady() {
                    var d = $q.defer();
                    // Only in case of deployed mobile apps, wait for deviceready event.
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

                /**
                 * Updates the loggedInUser Static Variable with current logged in user's details
                 * if security disabled, user not authenticated, it is reset.
                 */
                function updateLoggedInUserVariable() {
                    var loggedInUser = $rs.Variables && $rs.Variables.loggedInUser && $rs.Variables.loggedInUser.dataSet;

                    // sanity check
                    if (!loggedInUser) {
                        return;
                    }

                    // local function to clear the loggedInUser details.
                    function clearLoggedInUser() {
                        loggedInUser.isAuthenticated = false;
                        loggedInUser.roles           = [];
                        loggedInUser.name            = undefined;
                        loggedInUser.id              = undefined;
                        loggedInUser.tenantId        = undefined;
                    }

                    SecurityService.getConfig(function (config) {
                        if (config.securityEnabled) {
                            if (config.authenticated) {
                                loggedInUser.isAuthenticated = config.authenticated;
                                loggedInUser.roles           = config.userInfo.userRoles;
                                loggedInUser.name            = config.userInfo.userName;
                                loggedInUser.id              = config.userInfo.userId;
                                loggedInUser.tenantId        = config.userInfo.tenantId;
                                return;
                            }
                        }
                        clearLoggedInUser();
                    }, clearLoggedInUser);
                }

                function getPreparedPageContent(pageName) {

                    var content  = cache.get(pageName).html,
                        $content = content || '';

                    $content = WM.element(Utils.processMarkup(content));

                    if ($rs.isPrefabType) {
                        $rs.prefabTemplate   = $content;
                        $rs.isPrefabTemplate = true;
                        $content             = WM.element('<wm-prefab-run></wm-prefab-run>');
                    }

                    return $content;
                }

                function clearPagesCache() {
                    cache.destroy();
                    cache = $cacheFactory('APP_PAGES');
                }

                function loadSecurityConfig() {
                    var deferred = $q.defer(),
                        page;

                    if (!$rs.isApplicationType) {
                        if ($location.path() === '/') {
                            $location.path(_WM_APP_PROPERTIES.homePage);
                        }
                        deferred.resolve();
                    } else {
                        SecurityService.getConfig(function (config) {
                            $rs.isSecurityEnabled   = config.securityEnabled;
                            $rs.isUserAuthenticated = config.authenticated;
                            if (config.securityEnabled) {
                                if (config.authenticated) {
                                    page = config.userInfo.homePage || _WM_APP_PROPERTIES.homePage;
                                    $rs.userRoles = config.userInfo.userRoles;
                                } else {
                                    page = config.homePage;
                                }
                            } else {
                                page = config.homePage;
                            }
                            if ($location.path() === '/') {
                                $location.path(page);
                            }
                            deferred.resolve();
                        }, deferred.resolve);
                    }

                    return deferred.promise;
                }

                $rs.$on('app-logout-success', clearPagesCache);

                this.loadPage                   = loadPage;
                this.getPageContent             = getPageContent;
                this.loadCommonPage             = loadCommonPage;
                this.initI18nService            = initI18nService;
                this.initAppVariables           = initAppVariables;
                this.updateLoggedInUserVariable = updateLoggedInUserVariable;
                this.getPreparedPageContent     = getPreparedPageContent;
                this.isDeviceReady              = isDeviceReady;
                this.loadSecurityConfig         = loadSecurityConfig;
                this.handleSessionTimeOut       = handleSessionTimeout;
            }
        ])
    .config(
        [
            '$routeProvider',
            function ($routeProvider) {
                'use strict';

                var initText    = '<div>Loading Page Content...</div>',
                    routeConfig = {
                        'template': initText,
                        'resolve' : {
                            'securityConfig': function (AppManager) {
                                return AppManager.loadSecurityConfig();
                            }
                        }
                    };

                $routeProvider
                    .when('/', routeConfig)
                    .when('/:name', {
                        'template': initText,
                        'resolve' : WM.extend({
                            'pageContent': function (AppManager, $route) {
                                var pageName = $route.current.params.name;
                                return AppManager.loadPage(pageName);
                            }
                        }, routeConfig.resolve)
                    });
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

                var projectID = ProjectService.getId(), // ProjectID will always be at the same index in the URL
                    appProperties = Utils.getClonedObject(_WM_APP_PROPERTIES),
                    pageReadyDeregister;

                $rs.projectName             = appProperties.name;

                $rs.isPrefabType            = appProperties.type === 'PREFAB';
                $rs.isApplicationType       = appProperties.type === 'APPLICATION';
                $rs.isTemplateBundleType    = appProperties.type === 'TEMPLATEBUNDLE';

                $rs.project = {
                    'id'          : projectID,
                    'activeTheme' : appProperties.activeTheme,
                    'deployedUrl' : ProjectService.getDeployedUrl()
                };

                $rs.changeLocale = function ($is) {
                    i18nService.setSelectedLocale($is.datavalue);
                };

                /*
                 * Route Change Handler, for every page
                 * Page content is fetched here and provided to the template for rendering
                 * Page Variables are also set and made available for registration
                 * For Prefabs: localization resources are loaded
                 */
                $rs.$on('$routeChangeSuccess', function (evt, $route) {
                    var pageName = $route.params.name,
                        pageVars,
                        supportedLocale;

                    if (pageName) {
                        pageName = pageName.split('.').shift();
                        $route.locals.$template = AppManager.getPreparedPageContent(pageName);
                        // set the page-level variables, registration will occur in the page directive
                        pageVars = AppManager.getPageContent(pageName, 'variables');
                        Variables.setPageVariables(pageName, pageVars);

                        if ($rs.isPrefabType) {
                            supportedLocale = Utils.findValueOf(pageVars, 'supportedLocale.dataSet');
                            AppManager.initI18nService(_.keys(supportedLocale), appProperties.defaultLanguage);
                        }
                    }
                });

                /*
                 * Following content loaded only application type projects, not template bundles, prefabs
                 * - Common Page
                 * - App Variables
                 * - Localization Resource
                 */
                if ($rs.isApplicationType) {
                    AppManager.isDeviceReady()
                        .then(function () {
                            return AppManager.loadCommonPage($s);
                        }).then(function () {
                            SecurityService.getConfig(function (config) {
                                // if user us authenticated, load app variables and localozation resource
                                if (!config.securityEnabled || config.authenticated) {
                                    AppManager.initAppVariables($s)
                                        .then(function (appVariables) {
                                            var supportedLocale = (appVariables.supportedLocale || {}).dataSet;
                                            AppManager.initI18nService(_.keys(supportedLocale), appProperties.defaultLanguage);
                                            AppManager.updateLoggedInUserVariable();
                                        });
                                }
                            });
                        });
                }

                // load prefab configurations
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

                if (CONSTANTS.hasCordova) {
                    pageReadyDeregister = $rs.$on('page-ready', function () {
                        navigator.splashscreen.hide();
                        pageReadyDeregister();
                    });
                }

                $rs.$on('update-loggedin-user', function () {
                    SecurityService.setConfig(null);
                    AppManager.updateLoggedInUserVariable();
                });

                // function to invoke a service during run time
                $rs.$on('invoke-service', function (event, name, options, onSuccess, onError) {
                    // if function call is bound with the button, return
                    if (_.includes(name, '(')) {
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

                    // based on variable category, perform appropriate action
                    switch (variable.category) {
                    case 'wm.LiveVariable':
                        if (variable.operation === 'read') {
                            variable.update(options, onSuccess, onError);
                        } else {
                            // else call the respective db operation (insert/update/delete)
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

                AppManager.isDeviceReady().then(function () {
                    $rs.$emit('application-ready');
                });

                // This is used to show and hide the spinner when variable is in-flight
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