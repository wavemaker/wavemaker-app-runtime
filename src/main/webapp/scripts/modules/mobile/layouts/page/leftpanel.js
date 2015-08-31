/*global WM*/
/* This is an override to the existing leftpanel directive*/
WM.module('wm.layouts.page')
    .directive('wmLeftPanel', [function (){
        'use strict';

        return {
            restrict    : 'E',
            priority    : 1,
            link        : function ($scope, $ele) {
                $ele.addClass('wm-mobile-app-left-panel');
            }
        };
    }]);