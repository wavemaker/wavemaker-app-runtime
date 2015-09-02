/*global WM, moment */
/*Directive for datetime */

WM.module('wm.widgets.form')
    .directive('wmDatetime', [
        'CONSTANTS',
        '$cordovaDatePicker',
        '$filter',

        function (CONSTANTS, $cordovaDatePicker, $filter) {
            'use strict';
            var DATE_FORMAT = 'yyyy-MM-dd',
                TIME_FORMAT = 'HH:mm';

            function setDateTimeformat($is) {
                var value;
                if (WM.isNumber($is._dateModel)) {
                    $is._dateModel = $filter('date')(new Date($is._dateModel), DATE_FORMAT);
                }
                if (WM.isNumber($is._timeModel)) {
                    $is._timeModel = $filter('date')(new Date($is._timeModel), TIME_FORMAT);
                }
                if ($is._timeModel && $is._dateModel) {
                    value = moment($is._dateModel + ' ' + $is._timeModel).valueOf();
                    if ($is.datepattern && $is.datepattern !== 'timestamp') {
                        $is._displayModel = $filter('date')(value, $is.datepattern);
                    } else {
                        $is._displayModel = value;
                    }
                    $is._model_ = $is._displayModel;
                } else {
                    $is._displayModel = undefined;
                }
            }

            function hideUnusedProps($is) {
                var wp = $is.widgetProps;
                /* unsupported properties for mobile time widget .. */
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
                        hideUnusedProps($is);
                    }
                    if (!CONSTANTS.hasCordova || CONSTANTS.isStudioMode) {
                        return;
                    }
                    var timeOptions = {
                        date: new Date(),
                        mode: 'time'
                    },
                        dateOptions = {
                            date: new Date(),
                            mode: 'date',
                            minDate: $is.mindate,
                            maxDate: $is.maxdate
                        },
                        isDateOpen = false,
                        isTimeOpen = false;

                    $el.find('input').removeAttr('datepicker-popup');
                    $el.find('timepicker').addClass('ng-hide');

                    $is._onDateClick = function () {
                        if (!isDateOpen) {
                            isDateOpen = true;
                            dateOptions.date = new Date();
                            $cordovaDatePicker.show(dateOptions).then(function (date) {
                                $is._dateModel = $filter('date')(date, DATE_FORMAT);
                                setDateTimeformat($is);
                                $is._onTimeClick();
                                isDateOpen = false;
                            }, function () {
                                isDateOpen = false;
                            });
                        }
                    };
                    $is._onTimeClick = function () {
                        if (!isTimeOpen) {
                            isTimeOpen = true;
                            timeOptions.date = new Date();
                            $cordovaDatePicker.show(timeOptions).then(function (time) {
                                $is._timeModel = $filter('date')(time, TIME_FORMAT);
                                setDateTimeformat($is);
                                isTimeOpen = false;
                            }, function () {
                                isTimeOpen = false;
                            });
                        }
                    };
                }
            };
        }]);