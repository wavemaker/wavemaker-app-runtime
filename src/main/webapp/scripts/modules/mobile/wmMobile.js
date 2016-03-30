/*global WM, window, _, cordova, document*/

WM.module('wm.mobile', ['wm.variables', 'wm.layouts', 'wm.widgets', 'ngCordova', 'ngCordovaOauth'])
    //Initialize project
    .run(['$rootScope', '$location', 'CONSTANTS', 'Utils', 'AppAutoUpdateService',
        function ($rootScope, $location, CONSTANTS, Utils, AppAutoUpdateService) {
            'use strict';
            /* Mark the mobileApplication type to true */
            $rootScope.isMobileApplicationType = true;

            if ($location.protocol() === 'file') {
                CONSTANTS.hasCordova = true;
                $rootScope.$on('application-ready', function () {
                    AppAutoUpdateService.start();
                });
            }
            if (CONSTANTS.isRunMode) {
                $rootScope.$on('$routeChangeStart', function () {
                    WM.element('body >.app-spinner:first').removeClass('ng-hide');
                });
                $rootScope.$on('page-ready', function () {
                    WM.element('body >.app-spinner:first').addClass('ng-hide');
                });
                $rootScope.$on('template-ready', function () {
                    WM.element('body >.app-spinner:first').addClass('ng-hide');
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
                'labelKey': 'LABEL_VARIABLE_DEVICE',
                'defaultName': 'deviceVariable'
            });
            /* Add additional event options.*/
            WIDGET_CONSTANTS.EVENTS_OPTIONS.push('New DeviceVariable');
            /* Add segment navigation option */
            BaseVariablePropertyFactory.addNavigationOption('gotoSegment', 'gotoSegment');
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
                } else if (Utils.isAndroid()) {
                    applyOSTheme('android');
                } else if (Utils.isIphone()) {
                    applyOSTheme('ios');
                }
            });
        }
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.directive:initWidget
 * @restrict A
 * @element ANY
 * @requires $rootScope
 * @requires ProjectService
 * @requires CONSTANTS
 * @description
 * This directive adds plugins for device widgets.
 */

WM.module('wm.widgets.base')
    .directive('initWidget', [
        '$rootScope',
        'CONSTANTS',
        'ProjectService',

        function ($rs, CONSTANTS, ProjectService) {
            'use strict';

            //plugins map for device widgets
            var map = {
                    'wm-fileupload'     : ['FILE', 'FILETRANSFER', 'IMAGEPICKER', 'MEDIAPICKER', 'CAMERA', 'CAPTURE'],
                    'wm-camera'         : ['CAMERA', 'CAPTURE'],
                    'wm-barcodescanner' : ['BARCODE_SCANNER']
                },
                tobeRegistered = [],
                directiveDefn  = {},
                _register;

            function register() {
                var pluginList,
                    plugins = [];

                ProjectService.getMobileBuildConfig({'projectId' : $rs.project.id}, function (response) {

                    // get the plugins list form map
                    _.each(tobeRegistered, function (widget) {
                        plugins = plugins.concat(map[widget]);
                    });

                    pluginList = _.filter(plugins, function (plugin) {
                        if (!response.plugins[plugin]) {
                            return plugin;
                        }
                    });
                    // add the plugins that are not listed in the response.
                    if (pluginList.length) {
                        ProjectService.addCordovaPlugins($rs.project.id, pluginList);
                    }
                });
            }

            _register = _.debounce(register, 300);

            function linkFn($is) {
                if (!map[$is.widgettype]) {
                    return;
                }

                // if plugins are not registered add them.
                if (!_.includes(tobeRegistered, $is.widgettype)) {
                    tobeRegistered.push($is.widgettype);
                }
                _register();
            }

            if (CONSTANTS.isStudioMode && $rs.isMobileApplicationType && WM.isDefined($rs.isTemplateBundleType) && !$rs.isTemplateBundleType) {
                directiveDefn.link = linkFn;
            }
            return directiveDefn;
        }
    ]);
