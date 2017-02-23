/*global WM*/
/* This is an override to the existing leftpanel directive*/
WM.module('wm.layouts.page')
    .directive('wmLeftPanel', ['DeviceService', function (DeviceService){
        'use strict';

        return {
            restrict    : 'E',
            priority    : 1,
            link        : function ($scope, $ele) {
                var backButtonListenerDeregister;
                $ele.addClass('wm-mobile-app-left-panel');
                backButtonListenerDeregister = DeviceService.onBackButtonTap(function () {
                    if ($ele.hasClass('visible')) {
                        $ele.isolateScope().collapse();
                        return false;
                    }
                });
                $scope.$on('$destroy', function () {
                    backButtonListenerDeregister();
                });
            }
        };
    }]);