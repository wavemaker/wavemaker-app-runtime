/*global WM*/
/* This is an override to the existing leftpanel directive*/
WM.module('wm.layouts.page')
    .directive('wmPage', [function () {
        'use strict';

        return {
            restrict    : 'E',
            priority    : 1,
            compile        : function () {
                return {
                    'pre' : function ($scope, $ele) {
                        $ele.addClass('mobile-app-page');
                    },
                    'post': function ($scope, $ele) {
                        // finding the tabbar so that we can adjust the layout
                        if ($ele.find('[data-role="mobile-tabbar"]').length > 0) {
                            $ele.addClass("has-tabbar");
                        }
                    }
                };
            }
        };
    }]);