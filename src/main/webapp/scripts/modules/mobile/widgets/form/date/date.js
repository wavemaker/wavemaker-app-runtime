/*global WM */
/*Directive for date */

WM.module('wm.widgets.form')
    .directive('wmDate', [
        'CONSTANTS',
        '$cordovaDatePicker',
        '$filter',

        function (CONSTANTS, $cordovaDatePicker, $filter) {
            'use strict';

            return {
                'restrict': 'E',
                'priority': 1,
                'link': function (scope, $el) {
                    if (!CONSTANTS.hasCordova || CONSTANTS.isStudioMode) {
                        return;
                    }
                    $el.find('input').removeAttr('datepicker-popup');
                    var $is = $el.isolateScope(),
                        options = {
                            date   : new Date(),
                            mode   : 'date',
                            minDate: $is.mindate,
                            maxDate: $is.maxdate
                        },
                        isOpen = false;
                    $is._onClick = function () {
                        options.date = new Date();
                        if (!isOpen) {
                            isOpen = true;
                            $cordovaDatePicker.show(options)
                                .then(function (date) {
                                    $is._model_ = $filter('date')(date, $is.datepattern);
                                    isOpen = false;
                                }, function () {
                                    isOpen = false;
                                });
                        }
                    };
                }
            };
        }]);