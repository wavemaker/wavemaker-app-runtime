/*global WM */
/*Directive for date */

WM.module('wm.widgets.form')
    .directive('wmTime', [
        'CONSTANTS',
        '$cordovaDatePicker',
        '$filter',

        function (CONSTANTS, $cordovaDatePicker, $filter) {
            'use strict';

            function hideUnusedProps($is) {
                var wp = $is.widgetProps;
                /* unsupported properties for mobile time widget.. */
                wp.ismeridian.show = false;
                wp.minutestep.show = false;
                wp.hourstep.show = false;
            }
            return {
                'restrict': 'E',
                'priority': 1,
                'link': function (scope, $el) {
                    var $is = $el.isolateScope();
                    if (CONSTANTS.isStudioMode) {
                        /* unsupported properties of time widget*/
                        hideUnusedProps($is);
                    }
                    if (!CONSTANTS.hasCordova || CONSTANTS.isStudioMode) {
                        return;
                    }
                    $el.find('timepicker').parent().addClass('ng-hide');
                    var isOpen = false,
                        options = {
                            date   : new Date(),
                            mode   : 'time',
                            minDate: $is.mindate,
                            maxDate: $is.maxdate
                        };
                    $is._onClick = function () {
                        options.date = new Date();
                        if (!isOpen) {
                            isOpen = true;
                            $cordovaDatePicker.show(options).then(function (time) {
                                $is._model_ = $filter('date')(time, 'HH:mm');
                                isOpen = false;
                            }, function () {
                                isOpen = false;
                            });
                        }
                    };
                }
            };
        }]);