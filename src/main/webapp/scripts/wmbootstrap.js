/*global WM, window, device, _, _WM_APP_PROPERTIES, navigator, document*/

WM.element.holdReady(true);
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var $appView = WM.element('#wm-app-content');

    $appView.attr('ng-view', '');

    // add a node to the DOM to determine the mobile view
    WM.element('<i id="wm-mobile-display"></i>').appendTo('.wm-app');

    if (window.cordova) {
        document.addEventListener('deviceready', function () {
            WM.element.holdReady(false);
        }, false);
    } else {
        $appView.attr('no-animate', '');
        WM.element.holdReady(false);
    }
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
            'ngSanitize',
            'angular-websocket',
            'ngAnimate'
        ]);

Application
    .constant('CONSTANTS', {
        'isRunMode'     : true,
        'INT_MAX_VALUE' : 2147483647,
        'DELAY'         : {
            'SEARCH_WAIT' : 500
        },
        'DATA_SEARCH_LIMIT' : 10
    })
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
                Application.$directive  = $compileProvider.directive;
                Application.$filter     = $filterProvider.register;

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
            '$window',
            '$rootScope',
            'wmToaster',
            'SecurityService',
            'i18nService',
            '$compile',
            'Variables',
            '$cacheFactory',
            '$document',
            'CONSTANTS',
            'wmSpinner',
            '$timeout',
            '$route',
            '$http',

            function ($q, Utils, BaseService, $location, $window, $rs, wmToaster, SecurityService, i18nService, $compile, Variables, $cacheFactory, $document, CONSTANTS, wmSpinner, $timeout, $route, $http) {
                'use strict';

                var prevRoute,
                    cache              = $cacheFactory('APP_PAGES'),
                    NG_LOCALE_PATH     = 'resources/ngLocale/',
                    MOMENT_LOCALE_PATH = 'resources/momentLocale/',
                    APP_LOCALE_PATH    = 'resources/i18n/',
                    appVariablesLoaded = false,
                    SSO_URL            = '/services/security/ssologin',
                    landingPageName    = '',
                    pageReqQueue       = {};

                function defaultPageLoadSuccessHandler(pageName, response, isPartial) {
                    cache.put(pageName, Utils.parseCombinedPageContent(response.data, pageName));
                    if (!isPartial) {
                        prevRoute = $location.path();
                    }
                }

                // If the Common Page is not loaded by this time, wait for it load and then display the login dialog
                function showLoginDialog() {
                    if ($rs.isCommonPageLoaded) {
                        BaseService.handleSessionTimeOut();
                    } else {
                        $rs.$watch(':: isCommonPageLoaded', function (nv) {
                            if (nv) {
                                BaseService.handleSessionTimeOut();
                            }
                        });
                    }
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
                            'PAGE'   : 'PAGE',
                            'SSO'    : 'SSO'
                        },
                        ssoUrl;

                    function getRedirectPage(config) {
                        var homePage = _WM_APP_PROPERTIES.homePage,
                            loginPage = _.get(config, 'login.pageName'),
                            prevRedirectPage;
                        page = page || $location.path().replace('/', '');
                        if (page === homePage || page === loginPage) {
                            /*
                             * find previous redirect page from URL, if exists, user should redirect to that page.
                             * USE CASE:
                             *  user is on http://localhost:8080/app/#/Login?redirectTo=page
                             *  a variable call fails resulting 401
                             *  in this case, redirectTo page should be 'page' and not undefined
                             */
                            prevRedirectPage = _.get($location.search, 'redirectTo');
                            return !_.isEmpty(prevRedirectPage) ? prevRedirectPage : undefined;
                        }

                        return page;
                    }

                    SecurityService.getConfig(function (config) {
                        // if user found, 401 was thrown after session time
                        if (config.userInfo && config.userInfo.userName) {
                            sessionTimeoutConfig = config.login.sessionTimeout || {'type': LOGIN_METHOD.DIALOG};
                            sessionTimeoutMethod = sessionTimeoutConfig.type.toUpperCase();
                            if (sessionTimeoutMethod === LOGIN_METHOD.DIALOG) {
                                if (page) {
                                    BaseService.pushToErrorCallStack(null, function () {
                                        _load(page, onSuccess, onError);
                                    }, WM.noop);
                                }
                                showLoginDialog();
                            } else if (sessionTimeoutMethod === LOGIN_METHOD.PAGE) {
                                if (!page) {
                                    page = $location.path().replace('/', '');
                                }
                                $location.path(sessionTimeoutConfig.pageName);
                                $location.search('redirectTo', page);
                            }
                        } else {
                            // if no user found, 401 was thrown for first time login
                            loginConfig = config.login;
                            loginMethod = loginConfig.type.toUpperCase();
                            switch (loginMethod) {
                            case LOGIN_METHOD.DIALOG:
                                // Through loginDialog, user will remain in the current state and failed calls will be executed post login through LoginVariableService.
                                // NOTE: user will be redirected to respective landing page only if dialog is opened manually(not through a failed 401 call).
                                $rs._noRedirect = true;
                                if (page) {
                                    BaseService.pushToErrorCallStack(null, function () {
                                        _load(page, onSuccess, onError);
                                    }, WM.noop);
                                }
                                showLoginDialog();
                                break;
                            case LOGIN_METHOD.PAGE:
                                // do not provide redirectTo page if fetching HOME page resulted 401
                                // on app load, by default Home page is loaded
                                page = getRedirectPage(config);
                                $location.path(loginConfig.pageName);
                                $location.search('redirectTo', page);
                                break;
                            case LOGIN_METHOD.SSO:
                                // do not provide redirectTo page if fetching HOME page resulted 401
                                page = getRedirectPage(config);
                                //showing a redirecting message
                                document.body.textContent = 'Redirecting to sso login...';
                                ssoUrl = $rs.project.deployedUrl + SSO_URL + (page ? '?redirectPage=' + page : '');
                                /*
                                 * remove iFrame when redirected to IdP login page.
                                 * this is being done as IDPs do not allow to get themselves loaded into iFrames.
                                 */
                                if ($window.self !== $window.top) {
                                    $window.parent.location.href = ssoUrl;
                                } else {
                                    $window.location.href = ssoUrl;
                                }
                                break;
                            }
                        }
                    });
                }

                function showPageSwitchSpinner() {
                    wmSpinner.show('', 'globalSpinner', 'app-page-switch');
                }

                function hidePageSwitchSpinner() {
                    $timeout(function () {
                        wmSpinner.hide('globalSpinner');
                    }, 200);
                }

                function defaultPageLoadErrorHandler(pageName, onSuccess, onError, jqxhr) {
                    if (jqxhr.status === 401 && !jqxhr.headers('X-WM-Login-ErrorMessage')) {
                        hidePageSwitchSpinner();
                        handleSessionTimeout(pageName, onSuccess, onError);
                    } else if (jqxhr.status === 403) {
                        // in-case of 403 forbidden error
                        // TODO: remove prevRoute variable when 403 page is implemented
                        wmToaster.show('error', $rs.appLocale.LABEL_ACCESS_DENIED || 'Access Denied', $rs.appLocale.LABEL_FORBIDDEN_MESSAGE || 'The requested resource access/action is forbidden.');
                        $location.path(prevRoute);
                    } else {
                        Utils.triggerFn(onError);
                    }
                }

                function _load(pageName, onSuccess, onError, isPartial) {

                    //If the request to fetch a page info is in progress, do not trigger multiple calls.
                    if (!WM.isDefined(pageReqQueue[pageName])) {
                        pageReqQueue[pageName] = [];
                    }

                    // push the calls into a queue
                    pageReqQueue[pageName].push({'success': onSuccess, 'error': onError});

                    if (pageReqQueue[pageName].length > 1) {
                        return;
                    }

                    BaseService.getHttpPromise({
                        'method': 'GET',
                        'url'   : Utils.preventCachingOf('pages/' + pageName + '/' + 'page.min.html')
                    }).then(function (response) {
                        defaultPageLoadSuccessHandler(pageName, response, isPartial);

                        // Execute the success handler for all the queued calls
                        _.forEach(pageReqQueue[pageName], function (handler) {
                            Utils.triggerFn(handler.success, cache.get(pageName));
                        });
                        pageReqQueue[pageName].length = 0;

                    }, function (jqxhr) {
                        if ($route.current.params.name === pageName && jqxhr.status === 404) {
                            WM.element('.app-spinner').addClass('ng-hide');
                            wmToaster.show('error', $rs.appLocale.MESSAGE_PAGE_NOT_FOUND || 'The page you are trying to reach is not available');
                        }

                        // Execute the error handler for all the queued calls
                        _.forEach(pageReqQueue[pageName], function (handler) {
                            defaultPageLoadErrorHandler(pageName, handler.success, handler.error, jqxhr);
                        });

                        pageReqQueue[pageName].length = 0;
                    });
                }

                function loadPage(pageName, isPartial) {
                    var deferred = $q.defer(),
                        content;

                    // separate the page name from subview element names if any
                    pageName = pageName.split('.').shift();
                    content  = cache.get(pageName);

                    if (!content) {
                        _load(pageName, deferred.resolve, deferred.reject, isPartial);
                    } else {
                        deferred.resolve(content);
                    }

                    return deferred.promise;
                }

                function loadPartial(partialPageName) {
                    return loadPage(partialPageName, true);
                }

                function getPageContent(pageName, type) {
                    return (cache.get(pageName) || {})[type];
                }

                // This function returns the accepted languages list
                function getAcceptedLanguages() {
                    var languages = CONSTANTS.hasCordova ? navigator.languages : (Utils.getCookieByName('X-Accept-Language') || '').split(',');
                    return _.map(languages, _.toLower);
                }

                // initialize the i18nService
                function initI18nService(supportedLocale, defaultLocale) {
                    var _acceptLang = getAcceptedLanguages(),
                        _sl         = supportedLocale,
                        _dl;
                    _acceptLang.push(defaultLocale);

                    _dl = _.intersection(_acceptLang, _sl)[0] || 'en';

                    // if the supportedLocale is not available set it to defaultLocale
                    _sl = _sl || [_dl];
                    i18nService.init(_sl, _dl, APP_LOCALE_PATH, NG_LOCALE_PATH, MOMENT_LOCALE_PATH);
                    i18nService.setSelectedLocale(_dl);
                }

                // Compile the contents of the common page
                function compileCommonPageContent($s, pageName, content) {
                    Variables.setPageVariables(pageName, content.variables);
                    var $html = WM.element(Utils.processMarkup(content.html));
                    WM.element('#wm-common-content').append($html);
                    $compile($html)($s);

                    $rs.isCommonPageLoaded = true;
                }

                // Load the Common Page, wait for the appVariables to compile the common page
                function loadCommonPage($s) {
                    var pageName = 'Common',
                        deferred = $q.defer();

                    loadPage(pageName)
                        .then(function (content) {
                            var deRegister;

                            if (appVariablesLoaded) {
                                compileCommonPageContent($s, pageName, content);
                            } else {
                                deRegister = $rs.$watch(function () {
                                    return appVariablesLoaded;
                                }, function () {
                                    deRegister();
                                    compileCommonPageContent($s, pageName, content);
                                });
                            }
                            deferred.resolve();
                        }, deferred.resolve);

                    return deferred.promise;
                }

                /**
                 * Updates the loggedInUser Static Variable with current logged in user's details
                 * if security disabled, user not authenticated, it is reset.
                 */
                function updateLoggedInUserVariable() {
                    var loggedInUser = $rs.Variables && $rs.Variables.loggedInUser && $rs.Variables.loggedInUser.dataSet,
                        deferred = $q.defer();

                    // sanity check
                    if (!loggedInUser) {
                        $timeout(deferred.resolve);
                        return deferred.promise;
                    }

                    // local function to clear the loggedInUser details.
                    function clearLoggedInUser() {
                        loggedInUser.isAuthenticated = false;
                        loggedInUser.roles           = [];
                        loggedInUser.name            = undefined;
                        loggedInUser.id              = undefined;
                        loggedInUser.tenantId        = undefined;
                        deferred.resolve();
                    }

                    SecurityService.getConfig(function (config) {
                        if (config.securityEnabled) {
                            if (config.authenticated) {
                                loggedInUser.isAuthenticated = config.authenticated;
                                loggedInUser.roles           = config.userInfo.userRoles;
                                loggedInUser.name            = config.userInfo.userName;
                                loggedInUser.id              = config.userInfo.userId;
                                loggedInUser.tenantId        = config.userInfo.tenantId;
                                deferred.resolve(config);
                                return;
                            }
                        }
                        clearLoggedInUser();
                    }, clearLoggedInUser);
                    return deferred.promise;
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

                function loadSecurityConfig(forcePageLoad) {
                    var deferred = $q.defer(),
                        page,
                        XSRF_COOKIE = 'wm_xsrf_token';

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
                                    //override the default xsrf cookie name and xsrf header names with WaveMaker specific values
                                    $http.defaults.xsrfCookieName = XSRF_COOKIE;
                                    if (Utils.getCookieByName(XSRF_COOKIE)) {
                                        //set the header only if cookie 'wm_csrf_token' is set
                                        $http.defaults.xsrfHeaderName = config.csrfHeaderName;
                                    }
                                } else {
                                    /*
                                     * TEMPORARY[Vibhu]: For mobile app, if not authenticated, go to landing page
                                     * Actual Implementation: Page permissions are not present in the mobile apk
                                     * if it is persisted, the behavior will be same for mobile and web app
                                     */
                                    if (CONSTANTS.hasCordova) {
                                        page = config.login.pageName;
                                    } else {
                                        page = config.homePage;
                                    }
                                }
                            } else {
                                page = config.homePage;
                            }
                            if ($location.path() === '/' || forcePageLoad) {
                                //Reload the page when current page and post login landing page are same
                                if ($location.path() === '/' + page) {
                                    $route.reload();
                                }
                                $location.path(page);
                            }
                            landingPageName = page;
                            deferred.resolve();
                        }, deferred.resolve);
                    }

                    return deferred.promise;
                }

                /**
                 * Initializes the following
                 * app variables
                 * i18 services
                 * loggedInUser variable
                 * @returns {promise|*}
                 */
                function initAppVariablesAndDependencies() {
                    var deferred = $q.defer();
                    Variables.initAppVariables(undefined, function () {
                        appVariablesLoaded = true;
                        updateLoggedInUserVariable().then(deferred.resolve);
                    }, function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                }

                /**
                 * Updates the security config in SecurityService by making a fresh call to the API
                 * If app.variables not loaded, will load them and the related dependencies
                 * Updates the loggedInUser with the fresh user info
                 * @returns {promise|*}
                 */
                function resetSecurityConfig() {
                    var deferred = $q.defer();
                    SecurityService.setConfig(null);
                    SecurityService.getConfig(function () {
                        if (!appVariablesLoaded) {
                            initAppVariablesAndDependencies().
                                then(deferred.resolve, deferred.resolve);
                        } else {
                            updateLoggedInUserVariable().
                                then(deferred.resolve, deferred.resolve);
                        }
                    }, WM.noop, true);
                    return deferred.promise;
                }

                /**
                 * Navigates to the current user's homePage based on the config in SecurityService
                 * Assumption is the SecurityService is updated with the latest security config before making call to this function
                 */
                function navigateOnLogin() {
                    loadSecurityConfig(true);
                }

                $rs.$on('app-logout-success', clearPagesCache);

                // On back button click, if activePage is landingPage then exit the app
                $rs.$on('backbutton', function () {
                    if (landingPageName === $rs.activePageName) {
                        $window.navigator.app.exitApp();
                    } else {
                        $window.history.back();
                    }
                });

                /**
                 * Fix for issue: Keypad opens for all mobile browsers on form submit.
                 * Fix for iOS10 issue: Keyboard opens up whenever the page is navigated on form submission.
                 * Refer: https://discussions.apple.com/thread/7692319?start=0&tstart=0
                 */
                if (Utils.isMobile()) {
                    $document.on('submit', 'form', function () {
                        document.activeElement.blur();
                    });
                }

                this.loadPage                           = loadPage;
                this.loadPartial                        = loadPartial;
                this.getPageContent                     = getPageContent;
                this.loadCommonPage                     = loadCommonPage;
                this.initI18nService                    = initI18nService;
                this.initAppVariablesAndDependencies    = initAppVariablesAndDependencies;
                this.getPreparedPageContent             = getPreparedPageContent;
                this.loadSecurityConfig                 = loadSecurityConfig;
                this.handleSessionTimeOut               = handleSessionTimeout;
                this.showPageSwitchSpinner              = showPageSwitchSpinner;
                this.hidePageSwitchSpinner              = hidePageSwitchSpinner;
                this.resetSecurityConfig                = resetSecurityConfig;
                this.navigateOnLogin                    = navigateOnLogin;
            }
        ])
    .config(
        [
            '$routeProvider',
            function ($routeProvider) {
                'use strict';

                var initText    = '<div></div>',
                    routeConfig = {
                        'template': initText,
                        'resolve' : {
                            'securityConfig': function (AppManager) {
                                return AppManager.loadSecurityConfig();
                            },
                            // make sure that the app Variables are loaded before processing the page content
                            'appVariables': ['$q', '$rootScope', function ($q, $rs) {
                                var deferred = $q.defer();

                                // for the prefab/template bundle type do not wait for the app variables.
                                if ($rs.isApplicationType) {
                                    if ($rs.Variables) {
                                        deferred.resolve();
                                    } else {
                                        $rs.$watch(':: Variables', function (nv) {
                                            if (nv) {
                                                deferred.resolve();
                                            }
                                        });
                                    }

                                } else {
                                    /* tempalteBundle project will not have variables,
                                     * widgets having code like scope.Variables[variableName] will throw console errors.
                                     * Just to avoid the console errors, initialize the Variables to an empty object.
                                     */
                                    if ($rs.isTemplateBundleType) {
                                        $rs.Variables = {};
                                    }
                                    deferred.resolve();
                                }

                                return deferred.promise;
                            }],
                            'appLocale': ['$q', '$rootScope', function ($q, $rs) {
                                var deferred = $q.defer();

                                // for the template bundle type do not wait for the app locale.
                                if ($rs.isApplicationType || $rs.isPrefabType) {
                                    if ($rs.selectedLocale) {
                                        deferred.resolve();
                                    } else {
                                        $rs.$watch(':: selectedLocale', function (nv) {
                                            if (nv) {
                                                deferred.resolve();
                                            }
                                        });
                                    }

                                } else {
                                    deferred.resolve();
                                }

                                return deferred.promise;
                            }]
                        }
                    };

                $routeProvider
                    .when('/', routeConfig)
                    .when('/:name', {
                        'template': initText,
                        'resolve' : WM.extend({}, routeConfig.resolve, {
                            'pageContent': [
                                'AppManager',
                                '$route',
                                '$rootScope',
                                function (AppManager, $route, $rs) {
                                    var pageName = $route.current.params.name;
                                    return AppManager.loadPage(pageName)
                                        .then(function () {
                                            $rs.activePageName = pageName;
                                        });
                                }
                            ]
                        })
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
            'MetaDataFactory',
            'DeviceService',
            'AppDefaults',

            //do not remove the below lines
            'BasicVariableService',
            '$servicevariable',
            '$liveVariable',
            'NavigationVariableService',
            'NotificationVariableService',
            'LoginVariableService',
            'LogoutVariableService',
            'TimerVariableService',
            '$websocketvariable',

            function ($s, $rs, ProjectService, i18nService, Utils, AppManager, SecurityService, Variables, CONSTANTS, wmSpinner, MetaDataFactory, DeviceService, AppDefaults) {
                'use strict';

                var projectID      = ProjectService.getId(), // ProjectID will always be at the same index in the URL
                    appProperties  = Utils.getClonedObject(_WM_APP_PROPERTIES),
                    pageReadyDeregister,
                    dateFormat,
                    timeFormat,
                    dateTimeFormat;

                $rs.projectName             = appProperties.name;

                $rs.isPrefabType            = appProperties.type === 'PREFAB';
                $rs.isApplicationType       = appProperties.type === 'APPLICATION';
                $rs.isTemplateBundleType    = appProperties.type === 'TEMPLATEBUNDLE';


                dateFormat = appProperties.dateFormat;
                timeFormat = appProperties.timeFormat;

                dateTimeFormat = (dateFormat && timeFormat) ? dateFormat + ' ' + timeFormat : undefined;

                AppDefaults.set({
                    'dateFormat'    : dateFormat,
                    'timeFormat'    : timeFormat,
                    'dateTimeFormat': dateTimeFormat
                });

                $rs.project = {
                    'id'          : projectID,
                    'activeTheme' : appProperties.activeTheme,
                    'deployedUrl' : ProjectService.getDeployedUrl()
                };

                $rs.changeLocale = function ($is) {
                    i18nService.setSelectedLocale($is.datavalue);
                };

                if ($rs.isApplicationType || $rs.isPrefabType) {
                    // load the language bundle
                    AppManager.initI18nService(_.split(_WM_APP_PROPERTIES.supportedLanguages, ',') || ['en'], _WM_APP_PROPERTIES.defaultLanguage);
                }


                /*
                 * Route Change Handler, for every page
                 * Page content is fetched here and provided to the template for rendering
                 * Page Variables are also set and made available for registration
                 * For Prefabs: localization resources are loaded
                 */
                $rs.$on('$routeChangeSuccess', function (evt, $cRoute, $pRoute) {
                    var pageName = $cRoute.params.name;

                    if ($rs._appNavEvt) {
                        $rs._appNavEvt.widgetName = WM.element($rs._appNavEvt.target).closest('[init-widget]').attr('name');
                    }

                    Utils.triggerFn($rs.onBeforePageLoad, {'requested': $cRoute.params.name, 'last': _.get($pRoute, 'params.name')}, $rs._appNavEvt);

                    $rs._appNavEvt = undefined;

                    if (pageName) {
                        pageName = pageName.split('.').shift();
                        $cRoute.locals.$template = AppManager.getPreparedPageContent(pageName);
                    }

                    // hide the app-spinner
                    AppManager.hidePageSwitchSpinner();
                });

                // show the app-spinner on route change start
                $rs.$on('$routeChangeStart', AppManager.showPageSwitchSpinner);

                /*
                 * Following content loaded only application type projects, not template bundles, prefabs
                 * - Common Page
                 * - App Variables
                 * - Localization Resource
                 */
                if ($rs.isApplicationType) {
                    DeviceService.whenDeviceReady()
                        .then(function () {
                            return MetaDataFactory.load();
                        })
                        .then(function () {
                            AppManager.loadCommonPage($s);
                            SecurityService.getConfig(function () {
                                AppManager.initAppVariablesAndDependencies();
                            });
                        });
                }

                // load prefab configurations
                if ($rs.isPrefabType) {
                    MetaDataFactory.load();
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

                // function to invoke a service during run time
                $rs.$on('invoke-service', function (event, name, options, onSuccess, onError) {
                    // if function call is bound with the button, return
                    if (_.startsWith(name, 'Variables.')) {
                        name = name.split('.')[1];//If invoked with exp with 'Variables.' in it then retriving variable name from it
                    } else if (_.includes(name, '(')) {
                        return;
                    }

                    var variable;
                    options = options || {};
                    variable = _.get(options, ['scope', 'Variables', name]);
                    if (!variable) {
                        variable = Variables.getVariableByName(name);
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
                    case 'wm.WebSocketVariable':
                        variable[options.method || 'invoke']();
                        break;
                    }
                });

                DeviceService.whenDeviceReady().then(function () {
                    $rs.$emit('application-ready');
                });

                // This is used to show and hide the spinner when variable is in-flight
                $rs.$on('toggle-variable-state', function (event, variableName, active) {
                    var variable = Variables.getVariableByName(variableName);
                    if (variable && !_.isEmpty(_.trim(variable.spinnerContext))) {
                        if (active) {
                            variable._spinnerId = wmSpinner.show(variable.spinnerMessage, variable._id, variable.spinnerclass, variable.spinnerContext);
                        } else {
                            wmSpinner.hide(variable._spinnerId);
                        }
                    }
                });
            }
        ]);
