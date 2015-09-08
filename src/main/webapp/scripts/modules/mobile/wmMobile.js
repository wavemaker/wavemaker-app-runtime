/*global WM, _, cordova*/
WM.module('wm.mobile', ['wm.variables', 'wm.layouts', 'wm.widgets', 'ngCordova'])
    //Initialize project
    .run(['$rootScope', '$location', 'CONSTANTS', 'Utils', function ($rootScope, $location, CONSTANTS, Utils) {
        'use strict';
        /* Mark the mobileApplication type to true */
        $rootScope.isMobileApplicationType = true;

        if ($location.protocol() === 'file') {
            CONSTANTS.hasCordova = true;
            $rootScope.$on('application-ready', function () {
                /* Set root url */
                Utils.fetchContent(
                    'json',
                    Utils.preventCachingOf('./config.json'),
                    function (response) {
                        if (!response.error) {
                            $rootScope.project.deployedUrl = response.baseUrl;
                        }
                    },
                    WM.noop,
                    true
                );
            });
        }
    }])
    //Initialize variables
    .run(['Variables', 'WIDGET_CONSTANTS', 'BaseVariablePropertyFactory', 'MobileVariableService',
        function (Variables, WIDGET_CONSTANTS, BaseVariablePropertyFactory, MobileVariableService) {
            'use strict';

            /* Register Mobile specific Variables*/
            Variables.addVariableConfig({
                "collectionType": "data",
                "category": "wm.MobileVariable",
                "labelKey": "LABEL_VARIABLE_MOBILE",
                "defaultName": "mobileVariable"
            });
            /* Add additional event options.*/
            WIDGET_CONSTANTS.EVENTS_OPTIONS.push("New MobileVariable");
            /* Add segment navigation option */
            BaseVariablePropertyFactory.addNavigationOption("gotoSegment", "gotoSegment");
            //Register the Mobile variable.
            BaseVariablePropertyFactory.register('wm.MobileVariable',
                                                    {'invoke': MobileVariableService.invoke},
                                                    ['wm.mobileVariable'],
                                                    {});
        }])
    //Apply platform OS specific stylesheets
    .run(['$rootScope', 'CONSTANTS', 'Utils', '$location',  function ($rootScope, CONSTANTS, Utils, $location) {
        'use strict';
        var selectedOs = '';

        function applyOSTheme(os) {
            var themeUrl = '';
            selectedOs = os || selectedOs;
            themeUrl = 'themes/' + $rootScope.project.activeTheme + '/' + selectedOs.toLowerCase() + '.css';
            if (CONSTANTS.isStudioMode) {
                themeUrl = 'services/projects/' + $rootScope.project.id + '/resources/web/' + themeUrl;
            }
            WM.element('link[theme="wmtheme-os"]').remove();
            Utils.loadStyleSheet(themeUrl, {name: "theme", value: "wmtheme-os"});
        };
        function getPreviewOS () {
            var urlParams = $location.absUrl().split("?"),
                paramMap = {};
            if (urlParams.length > 1) {
                _.forEach(urlParams[1].split("&"), function (paramStr) {
                    var param = paramStr.split("=");
                    paramMap[param[0]] = param[1];
                });
            }
            return paramMap.previewOS;
        }
        $rootScope.$on('application-ready', function () {
            var previewOS = getPreviewOS();
            if (previewOS) {
                applyOSTheme(previewOS);
            } else if (Utils.isAndroid()) {
                applyOSTheme('android');
            } else if (Utils.isIphone()) {
                applyOSTheme('ios');
            }
        });
        $rootScope.$on('switch-theme', function () {
            applyOSTheme();
        });
        $rootScope.$on('switch-device', function (event, device) {
            applyOSTheme(device.os);
        });
    }]);