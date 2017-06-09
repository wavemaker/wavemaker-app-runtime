/*global WM*/
/* This is an override to the existing leftpanel directive*/
WM.module('wm.layouts.page')
    .directive('wmLeftPanel', ['$rootScope', 'CONSTANTS', 'DeviceService', function ($rs, CONSTANTS, DeviceService) {
        'use strict';

        return {
            restrict    : 'E',
            priority    : 1,
            compile     : function () {
                return {
                    post: function ($scope, $ele) {
                        var backButtonListenerDeregister,
                            $is = $ele.isolateScope();
                        $ele.addClass('wm-mobile-app-left-panel');
                        backButtonListenerDeregister = DeviceService.onBackButtonTap(function () {
                            if ($is.expanded) {
                                $is.collapse();
                                return false;
                            }
                        });
                        $scope.$on('$destroy', function () {
                            backButtonListenerDeregister();
                        });
                        if (CONSTANTS.isRunMode
                                && $rs.isTabletApplicationType
                                && $rs.leftPanelVisible
                                && $is.animation === 'slide-in') {
                            $is.expand();
                        }
                    }
                };
            }
        };
    }]);