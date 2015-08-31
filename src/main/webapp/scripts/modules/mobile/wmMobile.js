/* global WM, cordova*/
WM.module('wm.mobile', ['wm.variables', 'wm.layouts', 'wm.widgets' , 'ngCordova'])
    //Initialize project
    .run(['$rootScope', '$location', 'CONSTANTS', 'Utils', function ($rootScope, $location, CONSTANTS, Utils){
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
    }]);