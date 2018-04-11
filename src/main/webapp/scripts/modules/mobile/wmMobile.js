/*global WM, window, _, $, cordova, document, navigator */
(function (window, document) {
    'use strict';
    //listen app-to-app communication via url schemes
    function subString(str, begin, end) {
        end = end < 0 ? undefined : end;
        return (str && begin >= 0 && str.length > begin && str.substring(begin, end)) || undefined;
    }
    function indexOf(str, pattern) {
        return str && str.indexOf(pattern);
    }
    function extractData(url) {
        var str = subString(url, indexOf(url, '?') + 1, indexOf(url, '#')),
            data = {};
        _.forEach(_.split(str, '&'), function (entry) {
            var esplits = entry.split('=');
            data[esplits[0]] = esplits[1];
        });
        return data;
    }
    function extractAddress(url) {
        return subString(url, indexOf(url, '://') + 3, indexOf(url, '?'));
    }
    function createMessage(url) {
        return {
            'address': extractAddress(url),
            'data': extractData(url)
        };
    }
    window.handleOpenURL = function (url) {
        var e, message;
        if (window.handleOpenURL.isReady && !_.startsWith(url, "http")) {
            message = createMessage(url);
            e = new window.CustomEvent('externalAppMessageReceived', {
                'detail': {
                    'message': message
                }
            });
            document.dispatchEvent(e);
        }
        window.handleOpenURL.lastURL = url;
    };
}(window, document));
WM.module('wm.mobile', ['wm.variables', 'wm.layouts', 'wm.widgets', 'ngCordova', 'ngCordovaOauth', 'wm.plugins.offline'])
    .config(['$httpProvider', function ($httpProvider) {
        'use strict';
        function getNetworkService() {
            try {
                return WM.element('[id=ng-app]').injector().get('NetworkService');
            } catch (e) {
                return;
            }
        }
        $httpProvider.interceptors.push(function ($q) {
            var NetworkService;
            return {
                'responseError': function (rejection) {
                    NetworkService = NetworkService || getNetworkService();
                    if (window.cordova
                            && (!rejection || !rejection.status || rejection.status < 0 || rejection.status === 404)
                            && (NetworkService && NetworkService.isConnected())) {
                        return NetworkService.isAvailable(true).then(function () {
                            return $q.reject(rejection);
                        });
                    }
                    return $q.reject(rejection);
                }
            };
        });
    }]).run(['$rootScope', '$location', 'CONSTANTS', '$cordovaFileTransfer', '$cordovaFileOpener2', 'Utils', '$cordovaFile', 'wmToaster', 'wmSpinner',
        // Don't remove below services. This is required for initialization
        'AppAutoUpdateService', 'DeviceFileService', 'DeviceFileCacheService',
        function ($rootScope, $location, CONSTANTS, $cordovaFileTransfer, $cordovaFileOpener2, Utils, $cordovaFile, wmToaster, wmSpinner) {
            'use strict';

            var initialScreenSize,
                screenHeight,
                $appEl = WM.element('.wm-app:first'),
                pageReadyDeregister,
                MINIMUM_TAB_WIDTH = 768;

            /* Mark the mobileApplication type to true */
            $rootScope.isMobileApplicationType = true;

            if (CONSTANTS.isRunMode) {
                if (WM.element(window).width() >= MINIMUM_TAB_WIDTH) {
                    $rootScope.isTabletApplicationType =  true;
                    $appEl.addClass('wm-tablet-app');
                } else {
                    $appEl.addClass('wm-mobile-app');
                }
            }

            function hideSpinner(id) {
                wmSpinner.hide(id);
            }

            if ($location.protocol() === 'file') {
                CONSTANTS.hasCordova = true;
                initialScreenSize = window.innerHeight;

                $appEl.addClass('cordova');

                // keyboard class is added when keyboard is open.
                window.addEventListener('resize', function () {
                    screenHeight = window.innerHeight;
                    var scrollTop,
                        iScrollEls,
                        scrollContainer = WM.element(".smoothscroll-container"),
                        hasKeyboard = screenHeight < initialScreenSize;

                    if (hasKeyboard) {
                        $appEl.addClass('keyboard');
                    } else {
                        $appEl.removeClass('keyboard');
                    }

                    // Refresh all the iscrolls on resize.
                    if (scrollContainer.length) {
                        iScrollEls = scrollContainer.parent();

                        _.forEach(iScrollEls, function (el) {
                            var $iscrollEl = el.iscroll;
                            $iscrollEl.indicatorRefresh();
                        });
                    }

                    // Fix for issue: keyboard hides the input on focus.
                    scrollTop = $(document.activeElement).offset().top;

                    if ((scrollTop + document.activeElement.clientHeight) > screenHeight * 0.9) {
                        document.activeElement.scrollIntoView({behavior: "instant", block: "end", inline: "end"});
                    }
                });

                // This function downloads the file in device and open the file using fileOpener.
                $rootScope.$on('device-file-download', function ($evt, config, fileName) {
                    var fileDirectory,
                        filepath,
                        url = config.url,
                        spinnerId = wmSpinner.show();

                    if (Utils.isIOS()) {
                        fileDirectory = cordova.file.dataDirectory;
                    } else {
                        fileDirectory = cordova.file.externalDataDirectory;
                    }

                    filepath = fileDirectory + fileName;

                    $cordovaFileTransfer.download(url, filepath, {}, true)
                        .then(function (fileEntry) {
                            // find the mime type of the file and open the file.
                            $cordovaFile.checkFile(filepath, '').then(function (entry) {
                                entry.file(function (data) {
                                    $cordovaFileOpener2.open(fileEntry.toURL(), data.type)
                                        .then(hideSpinner.bind(undefined, spinnerId))
                                        .catch(function () {
                                            hideSpinner(spinnerId);
                                            wmToaster.show('error',  'Failed to open the file.');
                                        });
                                });
                            });
                        }, function (error) {
                            hideSpinner(spinnerId);
                            wmToaster.show('error',  'Failed to download ', error);
                        });
                }, false);

                $rootScope.$on('application-ready', function () {
                    window.handleOpenURL.isReady = true;
                    window.handleOpenURL(window.handleOpenURL.lastURL);
                });

                document.addEventListener("externalAppMessageReceived", function (e) {
                    $rootScope.$emit('externalAppMessageReceived', e.detail.message);
                });

                pageReadyDeregister = $rootScope.$on('page-ready', function () {
                    navigator.splashscreen.hide();
                    pageReadyDeregister();
                });
            }
        }])
    //Initialize variables
    .run(['Variables', 'WIDGET_CONSTANTS', 'BaseVariablePropertyFactory', 'DeviceVariableService', 'NavigationVariableService',
        function (Variables, WIDGET_CONSTANTS, BaseVariablePropertyFactory, DeviceVariableService) {
            'use strict';

            /* Register Mobile specific Variables*/
            Variables.addVariableConfig({
                'collectionType': 'data',
                'category': 'wm.DeviceVariable',
                'defaultName': 'deviceVariable',
                'newVariableKey': 'New Variable',
                'serviceTypes': ['device']
            });
            /* Add segment navigation option */
            BaseVariablePropertyFactory.addNavigationOption('gotoSegment', 'Segment');
            //Register the Mobile variable.
            BaseVariablePropertyFactory.register('wm.DeviceVariable',
                {'invoke': DeviceVariableService.invoke},
                ['wm.DeviceVariable'],
                {});
            /* enable page transitions.*/
            BaseVariablePropertyFactory.getPropertyMap('wm.NavigationVariable').pageTransitions.hide = false;
        }])
    //Apply platform OS specific stylesheets
    .run(['$rootScope', 'CONSTANTS', 'Utils', function ($rootScope, CONSTANTS, Utils) {
        'use strict';
        var selectedOs = '';

        function applyOSTheme(os) {
            var themeUrl = '',
                oldStyleSheet = WM.element('link[theme="wmtheme"]:first'),
                newStyleSheet;
            selectedOs = os || selectedOs;
            themeUrl = 'themes/' + $rootScope.project.activeTheme + '/' + selectedOs.toLowerCase() + '/' + 'style.css';
            if (CONSTANTS.isStudioMode) {
                themeUrl = Utils.getProjectResourcePath($rootScope.project.id) + themeUrl;
            }
            newStyleSheet = Utils.loadStyleSheet(themeUrl, {name: 'theme', value: 'wmtheme'});
            if (newStyleSheet) {
                WM.element(newStyleSheet).insertAfter(oldStyleSheet);
                oldStyleSheet.remove();
            }
        }
        if (CONSTANTS.isStudioMode) {
            $rootScope.$on('switch-device', function (event, device) {
                applyOSTheme(device.os);
            });
        } else if (CONSTANTS.isRunMode) {
            //This is for preview page
            window.onmessage = function (msg) {
                var data = Utils.isIE9() ? JSON.parse(msg.data) : msg.data;
                $rootScope.selectedViewPort = data.device;
                if (WM.isObject(data) && data.key === 'switch-device') {
                    applyOSTheme(data.device.os);
                }
            };
            //On Application start
            $rootScope.$on('application-ready', function () {
                var msgContent = {key: 'on-load'};
                //Notify preview window that application is ready. Otherwise, identify the OS.
                if (window.top !== window) {
                    window.top.postMessage(Utils.isIE9() ? JSON.stringify(msgContent) : msgContent, '*');
                } else if (Utils.isAndroid() || Utils.isAndroidTablet()) {
                    applyOSTheme('android');
                } else if (Utils.isIphone() || Utils.isIpod() || Utils.isIpad()) {
                    applyOSTheme('ios');
                }
            });
        }
    }]).run([
        '$cordovaFile',
        '$q',
        'CONSTANTS',
        'SecurityService',
        function ($cordovaFile, $q, CONSTANTS, SecurityService) {
            'use strict';
            var publicPages,
                initialized = false,
                queue = [];

            /**
             * This method returns a promise that is resolved only if the user can access the page.
             * Following is Mobile application page security policy. A page can be accessed if,
             * 1) Public page info not available.
             * 2) Page is public.
             * 2) Security is disabled
             * 3) Security is enabled and user is authenticated
             *
             * @param pageName name of the page
             * @param defer -- optional
             * @returns promise
             */
            function canAccess(pageName, defer) {
                defer = defer || $q.defer();
                if (!initialized) {
                    queue.push({'pageName' : pageName, 'defer' : defer});
                } else if (!publicPages || publicPages[pageName]) {
                    defer.resolve();
                } else {
                    SecurityService.getConfig(function (config) {
                        if (!config.securityEnabled || config.authenticated) {
                            defer.resolve();
                        } else {
                            defer.reject();
                        }
                    }, defer.reject);
                }
                return defer.promise;
            }

            /**
             * loads public pages from 'metadata/app/public-pages.info' and overrides canAccess method SecurityService
             */
            function init() {
                var folderPath = cordova.file.applicationDirectory + 'www/metadata/app',
                    fileName = 'public-pages.json';
                $cordovaFile.readAsText(folderPath, fileName).then(function (text) {
                    publicPages = {};
                    _.forEach(JSON.parse(text), function (pageName) {
                        publicPages[pageName] = true;
                    });
                }).finally(function () {
                    initialized = true;
                    _.forEach(queue, function (args) {
                        canAccess(args.pageName, args.defer);
                    });
                    queue.length = 0;
                });
                // Override canAccess method
                SecurityService.canAccess = canAccess;
            }
            if (CONSTANTS.hasCordova) {
                init();
            }
        }
    ]).run([
        '$rootScope',
        'CookieService',
        'SecurityService',
        function ($rootScope, CookieService, SecurityService) {
            'use strict';
            var hostName,
                jsessionidCookieName = 'JSESSIONID',
                rememberCookieName = 'SPRING_SECURITY_REMEMBER_ME_COOKIE',
                originalAppLogin = SecurityService.appLogin;

            if (window.cordova) {
                SecurityService.appLogin = function (params, onSuccess, onError) {
                    originalAppLogin.call(SecurityService, params, function () {
                        //on every user login, persist cookies.
                        hostName = hostName || $rootScope.project.deployedUrl;
                        CookieService.persistCookie(hostName, jsessionidCookieName);
                        CookieService.persistCookie(hostName, rememberCookieName);
                        if (_.isFunction(onSuccess)) {
                            onSuccess.apply(undefined, arguments);
                        }
                    }, onError);
                };
            }
        }
    ]);
