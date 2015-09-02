/*global WM */
/*Directive for liveform */

WM.module('wm.widgets.live')
    .directive('wmLiveform', [
        'CONSTANTS',

        function (CONSTANTS) {
            'use strict';

            return {
                'restrict': 'E',
                'priority': 1,
                'link': function (scope, $el) {
                    var $is = $el.isolateScope();
                    if (CONSTANTS.isStudioMode) {
                        $is.widgetProps.layout.show = false;
                    }
                }
            };
        }]);