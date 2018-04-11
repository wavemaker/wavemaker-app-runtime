/*global WM, moment, _, document */
/*Directive for datetime */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/datetime.html',
            '<div class="app-datetime input-group" init-widget has-model apply-styles role="input"' +
            " app-defaults='{\"datepattern\": \"dateTimeFormat\"}' " +
            ' title="{{hint}}" ng-model="_proxyModel">' + /* _proxyModel is a private variable inside this scope */
                '<input class="form-control app-textbox display-input" focus-target ng-model="_displayModel" accesskey="{{::shortcutkey}}" ng-change="updateDateTimeModel($event)" ng-model-options="{updateOn: \'blur\'}" ng-required="required" ng-keyup="_onKeyUp($event)" autocomplete="off">' +
                '<input class="form-control app-textbox app-dateinput" datepicker-append-to-body="true" ng-change="selectDate($event)" ng-model="_dateModel" ' +
                    ' uib-datepicker-popup ' +
                    ' datepicker-options="_dateOptions" show-button-bar={{showbuttonbar}} is-open="isDateOpen"' +
                    ' current-text="{{$root.appLocale.LABEL_CALENDAR_TODAY}}"' +
                    ' clear-text="{{$root.appLocale.LABEL_CLEAR}}"' +
                    ' close-text="{{$root.appLocale.LABEL_DONE}}"' +
                    ' focus-target>' +
                '<div uib-dropdown is-open="isTimeOpen" class="dropdown" dropdown-append-to-body="true" auto-close="outsideClick">' +
                    '<div uib-dropdown-menu>' +
                        '<div uib-timepicker ng-model="_timeModel" hour-step="hourstep" minute-step="minutestep" show-meridian="ismeridian" show-seconds="showseconds" ng-change="selectTime($event)"></div>' +
                    '</div>' +
                '</div>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" ng-disabled="disabled" ng-model="_model_">' +
                '<span class="input-group-btn">' +
                    '<button type="button" class="btn btn-default btn-date" focus-target><i class="app-icon wi wi-calendar"></i></button>' +
                    '<button type="button" class="btn btn-default btn-time uib-dropdown-toggle" focus-target><i class="app-icon wi wi-access-time "></i></button>' +
                '</span>' +
            '</div>'
            );
        $templateCache.put('template/device/widget/form/datetime.html',
            '<input type="datetime-local" class="form-control app-textbox app-dateinput" init-widget has-model role="input"' +
            ' step="any" ' +
            ' ng-model="_proxyModel" ' +
            ' ng-readonly="readonly" ' +
            ' ng-required="required" ' +
            ' ng-disabled="disabled" ' +
            ' ng-change="updateModel();_onChange({$event: $event, $scope: this});" ng-model-options="{ updateOn: \'change\' }"> '
            );
    }])
    .directive('wmDatetime', [
        '$rootScope',
        'PropertiesFactory',
        'WidgetUtilService',
        '$timeout',
        '$templateCache',
        '$filter',
        'FormWidgetUtils',
        '$interval',
        'CONSTANTS',
        'Utils',

        function ($rs, PropertiesFactory, WidgetUtilService, $timeout, $templateCache, $filter, FormWidgetUtils, $interval, CONSTANTS, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.datetime', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
                notifyFor   = {
                    'readonly'     : CONSTANTS.isRunMode,
                    'disabled'     : CONSTANTS.isRunMode,
                    'autofocus'    : true,
                    'excludedates' : true,
                    'showweeks'    : true,
                    'mindate'      : true,
                    'maxdate'      : true,
                    'datepattern'  : true
                },
                CURRENT_DATETIME  = 'CURRENT_DATE';

            function _formatDateTime($is) {
                var date,
                    time,
                    dateString,
                    timeString,
                    value;
                if ($is._timeModel || $is._dateModel) {
                    if ($is._timeModel) {
                        time = new Date($is._timeModel);
                    } else {
                        time = $is._timeModel = new Date();
                    }
                    if ($is._dateModel) {
                        date = new Date($is._dateModel);
                    } else {
                        //Set the default date as min date or max date or current date.
                        date = $is._dateModel = moment($is.mindate || $is.maxdate).valueOf();
                    }
                    dateString = $filter('date')(date, 'yyyy-MM-dd');
                    timeString = $filter('date')(time, 'HH:mm:ss');
                    value = moment(dateString + ' ' + timeString).valueOf();
                    $is.timestamp = value;
                    if ($is.datepattern && $is.datepattern !== 'timestamp') {
                        $is._displayModel = $filter('date')(value, $is.datepattern);
                    } else {
                        $is._displayModel = value;
                    }
                    if ($is.outputformat && $is.outputformat !== 'timestamp') {
                        $is._proxyModel = $filter('date')(value, $is.outputformat);
                    } else {
                        $is._proxyModel = value;
                    }
                } else {
                    $is._displayModel = undefined;
                    $is._proxyModel = undefined;
                }
            }

            function propertyChangeHandler($is, $el, key, nv) {
                var inputEl  = $el.find('input'),
                    buttonEl = $el.find('button'),
                    currentDateTime = moment().toDate(),
                    isDisabled;

                switch (key) {
                case 'readonly':
                    inputEl.attr(key, nv);
                case 'disabled':
                    isDisabled = $is.readonly || $is.disabled;
                    inputEl.attr('disabled', isDisabled);
                    buttonEl.attr('disabled', isDisabled);
                    break;
                case 'autofocus':
                    inputEl.first().attr(key, nv);
                    break;
                case 'excludedates':
                    $is.proxyExcludeDates = FormWidgetUtils.getProxyExcludeDates(nv);
                    break;
                case 'datepattern':
                    $is.showseconds = _.includes(nv, 'ss');
                    $is.ismeridian  = _.includes(nv, 'hh');
                    _formatDateTime($is);
                    break;
                case 'showweeks':
                    $is._dateOptions.showWeeks = $is.showweeks;
                    break;
                case 'maxdate':
                    if (!$is.widgetid && nv ===  CURRENT_DATETIME) {
                        $is.maxdate = currentDateTime;
                    }
                    $is._dateOptions.maxDate = moment($is.maxdate).toDate();
                    break;
                case 'mindate':
                    if (!$is.widgetid && nv ===  CURRENT_DATETIME) {
                        $is.mindate = currentDateTime;
                    }
                    $is._dateOptions.minDate = moment($is.mindate).toDate();
                    break;
                }
            }

            function _onClick($is, evt) {
                evt.stopPropagation();
                if ($is.onClick) {
                    $is.onClick({$event: evt, $scope: $is});
                }
            }

            /*On click of date icon button, open the date picker popup*/
            function _onDateClick($is, $el, evt) {
                evt.stopPropagation();
                var dateOpen = $is.isDateOpen;
                $timeout(function () {
                    $el.parent().trigger('click');
                    $is.isDateOpen = !dateOpen;
                    $is.isTimeOpen = false;
                    _onClick($is, evt);
                });
            }

            /*On click of time icon button, open the time picker popup*/
            function _onTimeClick($is, $el, evt) {
                evt.stopPropagation();
                var TimeOpen = $is.isTimeOpen;
                $timeout(function () {
                    $el.parent().trigger('click');
                    $is.isTimeOpen = !TimeOpen;
                    $is.isDateOpen = false;
                    _onClick($is, evt);
                });
            }

            /* this function returns date object. If val is undefined it returns invalid date */
            function parseDateTime(val) {
                /* check if the val is date object */
                if (WM.isDate(val)) {
                    return val;
                }
                /*if the value is a timestamp string, convert it to a number*/
                if (!isNaN(val)) {
                    val = parseInt(val, 10);
                }
                return new Date(moment(val).valueOf());
            }

            return {
                'restrict' : 'E',
                'replace'  : true,
                'scope'    : {},
                'template' : function ($tEl, tAttrs) {
                    var template = '',
                        isWidgetInsideCanvas,
                        target;

                    if ($rs.isMobileApplicationType && tAttrs.type !== 'uib-picker') {
                        template = WM.element(WidgetUtilService.getPreparedTemplate('template/device/widget/form/datetime.html', $tEl, tAttrs));
                        return template[0].outerHTML;
                    }

                    template = WM.element($templateCache.get('template/widget/form/datetime.html', $tEl, tAttrs));
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                    target = template.children('input.form-control');

                    /*Set name for the model-holder, to ease submitting a form*/
                    template.find('.display-input').attr('name', tAttrs.name);
                    if (!isWidgetInsideCanvas) {
                        template.attr('ng-click', '_onClick($event)');
                        template.find('.btn-date').attr('ng-click', '_onDateClick($event)');
                        template.find('.display-input').attr('ng-click', '_onDateClick($event)');
                        template.find('.btn-time').attr('ng-click', '_onTimeClick($event)');

                        if (tAttrs.hasOwnProperty('onMouseenter')) {
                            template.attr('ng-mouseenter', 'onMouseenter({$event: $event, $scope: this})');
                        }

                        if (tAttrs.hasOwnProperty('onMouseleave')) {
                            template.attr('ng-mouseleave', 'onMouseleave({$event: $event, $scope: this})');
                        }

                        if (tAttrs.hasOwnProperty('onFocus')) {
                            target.attr('ng-focus', 'onFocus({$event: $event, $scope: this})');
                        }

                        if (tAttrs.hasOwnProperty('onBlur')) {
                            target.attr('ng-blur', 'onBlur({$event: $event, $scope: this})');
                        }
                    }

                    return template[0].outerHTML;
                },
                'link': {
                    pre: function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        $is._dateOptions = {};
                        if ($rs.isMobileApplicationType && attrs.type !== 'uib-picker') {
                            $is._nativeMode = true;
                        }
                    },
                    post: function ($is, $el, attrs) {
                        var onPropertyChange  = propertyChangeHandler.bind(undefined, $is, $el),
                            isCurrentDateTime = false,
                            isClassAdded      = false,
                            timeInterval,
                            //Function to set/ cancel the timer based on the model passed
                            setTimeInterval = function (cancel) {
                                if (cancel) {
                                    $interval.cancel(timeInterval); //Cancel the existing timer
                                    return;
                                }
                                if (CONSTANTS.isRunMode) {
                                    $is.disabled = true;
                                    onPropertyChange('disabled', $is.disabled);
                                    //Check if timer already exists. If time interval doesn't exist or state is canceled, create new timer
                                    if (!timeInterval || timeInterval.$$state.value === 'canceled') {
                                        timeInterval = $interval(function () {
                                            $is._model_ = CURRENT_DATETIME; //Update the model every 1 sec
                                            $is._onChange();
                                        }, 1000);
                                    }
                                }
                            },
                            setModels = function (val) {
                                var dateTime;
                                if (val) {
                                    if (isCurrentDateTime) {
                                        dateTime = new Date();
                                        $is._proxyModel = $is._timeModel = dateTime.getTime();
                                        $is._dateModel = new Date($is._proxyModel);
                                        if ($is.widgetid) {
                                            $is._displayModel = $filter('date')($is._proxyModel, $is.datepattern);
                                            return;
                                        }
                                        setTimeInterval();
                                    } else {
                                        dateTime = parseDateTime(val);
                                        if (dateTime.getTime()) {
                                            $is._proxyModel = $is._timeModel = dateTime.getTime();
                                            $is._dateModel = new Date($is._proxyModel);
                                        } else {
                                            $is._proxyModel = $is._dateModel = $is._timeModel = undefined;
                                        }
                                        setTimeInterval(true);
                                    }
                                } else {
                                    $is._proxyModel = $is._dateModel = $is._timeModel = undefined;
                                }
                                $is.formatDateTime();
                            };

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, $is, notifyFor);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);

                        $is.formatDateTime = _formatDateTime.bind(undefined, $is);
                        $is._onClick = _onClick.bind(undefined, $is);
                        $is._onDateClick = _onDateClick.bind(undefined, $is, $el);
                        $is._onTimeClick = _onTimeClick.bind(undefined, $is, $el);

                        /*
                         * Backward compatibility for ismeridian property which is deprecated.
                         * if ismeridian is false then time is set as 24hr clock format.
                         */
                        if (attrs.ismeridian === 'false' && !attrs.datepattern) {
                            $is.datepattern = $is.datepattern.replace('hh', 'HH').replace(' a', '');
                        }

                        /*On selection of a date, open the time picker popup*/
                        $is.selectDate = function (event) {
                            if (_.isNull($is._dateModel)) { //If date is cleared from datepicker, remove the time model also
                                $is._timeModel = undefined;
                            } else if ($is.isDateOpen) {
                                $timeout(function () { //Open the time after the date is selected
                                    $is.isTimeOpen = true;
                                });
                            }
                            $is.formatDateTime();
                            $is._onChange({$event: event, $scope: $is});
                        };
                        $is.selectTime = function (event) {
                            $is.formatDateTime();
                            $is._onChange({$event: event, $scope: $is});
                        };

                        if (!$is.widgetid) {
                            /* handle initial readonly/disabled values */
                            $timeout(function () {
                                onPropertyChange('disabled', $is.disabled);
                                onPropertyChange('readonly', $is.readonly);
                            });
                        }


                        /*update the model with device datetime value*/
                        $is.updateModel = function () {
                            $is._model_ = FormWidgetUtils.getUpdatedModel($is.mindate, $is.maxdate, $is._model_, $is._proxyModel, $is._prevDateTime);
                            $is._prevDateTime = $is._model_;
                        };

                        /*update the model when changed manually*/
                        $is.updateDateTimeModel = function (e) {
                            if (!isNaN(Date.parse($is._displayModel))) {
                                setModels($is._displayModel);
                            } else {
                                this._proxyModel = '';
                                this.timestamp   = '';
                            }
                            $is._onChange({$event: e, $scope: $is});
                        };

                        /*Called from form reset when users clicks on form reset*/
                        $is.reset = function () {
                            //TODO implement custom reset logic here
                            $is._model_ = '';
                        };

                        /* _model_ acts as a converter for _proxyModel
                         * read operation of _model_/datavalue will return epoch format of the date
                         * write operation of _model_ will update _proxyModel with Date object.
                         *  */
                        Object.defineProperty($is, '_model_', {
                            get: function () {
                                if ($is.widgetid && isCurrentDateTime) {
                                    return CURRENT_DATETIME;
                                }
                                if (!$is._nativeMode) {
                                    return this._proxyModel;
                                }
                                var timestamp = this._proxyModel ?  this._proxyModel.valueOf() : '';
                                this.timestamp = timestamp;
                                if (this.outputformat === 'timestamp') {
                                    return timestamp;
                                }
                                if (!this.outputformat) {
                                    this.outputformat = 'yyyy-MM-dd';
                                }
                                return this._proxyModel ? $filter('date')(this._proxyModel, this.outputformat) : '';
                            },
                            set: function (val) {
                                var dateTime;
                                isCurrentDateTime = val === CURRENT_DATETIME;
                                if ($is._nativeMode) {
                                    if (val) {
                                        if (isCurrentDateTime) {
                                            dateTime = new Date();
                                            setTimeInterval();
                                        } else {
                                            dateTime = parseDateTime(val);
                                            setTimeInterval(true);
                                        }
                                        this._proxyModel = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate(), dateTime.getHours(), dateTime.getMinutes(), dateTime.getSeconds());
                                    } else {
                                        this._proxyModel = undefined;
                                    }
                                } else {
                                    setModels(val);
                                }
                            }
                        });
                        $is._dateOptions.dateDisabled = FormWidgetUtils.disableDates.bind(undefined, $is);
                        /*Set the model if datavalue exists*/
                        if (attrs.datavalue  && !_.startsWith(attrs.datavalue, 'bind:')) {
                            $is._model_ = attrs.datavalue;
                            if (attrs.datavalue === CURRENT_DATETIME) {
                                setTimeInterval();
                            }
                        }
                        $is.$on('$destroy', function () {
                            setTimeInterval(true);
                        });
                        //Add app-date class to the wrapper that are appended to body
                        $timeout(function () {
                            WM.element('body').find('> [uib-datepicker-popup-wrap]').addClass('app-date');
                        });

                        //Set tab index as -1 for date input, as this should not be focused
                        $el.find('.app-dateinput').attr('tabindex', '-1');


                        // Close the date picker popup on document click in capture phase
                        function docClickListenerForDate(e) {
                            var $target = WM.element(e.target);

                            // if the click event is on the date widget or on the date popover, do nothing
                            // else close the popover
                            if (!$target.closest('.uib-datepicker-popup').length && !$el[0].contains(e.target)) {
                                document.removeEventListener('click', docClickListenerForDate, true);
                                $rs.$evalAsync(function () {
                                    $is.isDateOpen = false;
                                });
                            }
                        }

                        // Close the date picker popup on document click in capture phase
                        function docClickListenerForTime(e) {
                            var $target = WM.element(e.target);

                            // if the click event is on the date widget or on the date popover, do nothing
                            // else close the popover
                            if (!$target.closest('[uib-timepicker]').length && !$el[0].contains(e.target)) {
                                document.removeEventListener('click', docClickListenerForTime, true);
                                $rs.$evalAsync(function () {
                                    $is.isTimeOpen = false;
                                });
                            }
                        }

                        if (!$is.widgetid) {
                            // watch is isOpen flag on the scope and when the flag is true register a click event listener on document
                            $is.$watch('isDateOpen', function (nv) {
                                if (nv) {
                                    document.addEventListener('click', docClickListenerForDate, true);
                                }
                            });

                            // watch is isOpen flag on the scope and when the flag is true register a click event listener on document
                            $is.$watch('isTimeOpen', function (nv) {
                                if (nv) {
                                    document.addEventListener('click', docClickListenerForTime, true);
                                    //Add app-datetime class to the wrapper that are appended to body
                                    if (!isClassAdded) {
                                        $timeout(function () {
                                            WM.element('body').find('> [uib-dropdown-menu] > [uib-timepicker]').parent().addClass('app-datetime');
                                        }, 0, false);
                                        isClassAdded = true;
                                    }
                                }
                            });

                            $is._onKeyUp = function ($event) {
                                //On tab in, open the date popup
                                if ($event.keyCode === 9) {
                                    $is.isDateOpen = true;
                                }
                            };
                        }
                    }
                }
            };

        }
    ]);



/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmDatetime
 * @restrict E
 *
 * @description
 * The directive defines a date time  widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $timeout
 *
 * @param {string=} name
 *                  Name of the time widget.
 * @param {string=} placeholder
 *                  Placeholder for the input field
 * @param {string=} hint
 *                  Title/hint for the time widget <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of time widget. <br>
 *                  Default value : 0
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the  widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the value of the time widget. <br>
 *                  This property is bindable
 * @param {string=} timestamp
 *                  This property returns the unix timestamp (epoch) of the datavalue. <br>
 *                  This property can be used for intermediate calculations and validations. <br>
 * @param {string=} ismeridian
 *                  whether do display 12H or 24H. <br>
 * @param {string=} hourstep
 *                  Number of hours to increase or decrease
 * @param {string=} minutestep
 *                  Number of minutes to increase or decrease.
 * @param {string=} datepattern
 *                  display pattern of the date. <br>
 *                  This property is bindable. <br>
 *                  Default value : 'dd-MM-yyyy'
 * @param {string=} outputformat
 *                  output format of the widget. <br>
 *                  Default value : 'timestamp'
 * @param {string=} mindate
 *                  MinDate is the minimum date to start with. <br>
 *                  The default input pattern is mm/dd/yyyy
 * @param {string=} maxdate
 *                  MaxDate is the maximum date to end with. <br>
 *                  The default input pattern is mm/dd/yyyy
 * @param {string=} excludedays
 *                  Days which are to be excluded.<br>
 *                  Hint : sunday-0, saturday-6.
 * @param {string=} excludedates
 *                  Dates which are to be excluded.<br>
 *                  Hint : 'YYYY-MM-DD'.
 *@param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`.
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} showweeks
 *                   When set, week number will be displayed in date-picker UI.<br>
 *                   Default value: `false`
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the time widget readonly on the web page. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the widget on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the widget on the web page. <br>
 *                  Default value: `false`.
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-mouseenter
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <wm-datetime
 *                  on-change="f($event, $scope)"
 *                  name="time1"
 *                  placeholder="set the time"
 *                  hourstep="{{hourstep}}"
 *                  minutestep="{{minutestep}}"
 *                  ismeridian="{{ismeridian}}"
 *                  datepattern="{{datepattern}}"
 *                  outputformat="{{outputformat}}"
 *                  mindate="{{mindate}}"
 *                  maxdate="{{maxdate}}"
 *                  excludedays="{{excludedays}}"
 *                  excludedates="{{excludedates}}">
 *               </wm-datetime><br>
 *
 *               <div>Selected Time: {{currentTime}}</div><br>
 *               <div>timestamp: {{currentTimestamp}}</div><br>
 *               <wm-composite>
 *                   <wm-label caption="datepattern:"></wm-label>
 *                   <wm-text scopedatavalue="datepattern"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="output format:"></wm-label>
 *                   <wm-text scopedatavalue="outputformat"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="mindate:"></wm-label>
 *                   <wm-text scopedatavalue="mindate"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="maxdate:"></wm-label>
 *                   <wm-text scopedatavalue="maxdate"></wm-text>
 *               </wm-composite>
 *                <wm-composite>
 *                   <wm-label caption="excludedates:"></wm-label>
 *                   <wm-text scopedatavalue="excludedates"></wm-text>
 *               </wm-composite>
 *                <wm-composite>
 *                   <wm-label caption="excludedays:"></wm-label>
 *                   <wm-text scopedatavalue="excludedays"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="ismeridian :"></wm-label>
 *                   <wm-text scopedatavalue="ismeridian"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="hourstep:"></wm-label>
 *                   <wm-text scopedatavalue="hourstep"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="minutestep:"></wm-label>
 *                   <wm-text scopedatavalue="minutestep"></wm-text>
 *               </wm-composite>
 *
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.ismeridian="true"
 *              $scope.hourstep="2"
 *              $scope.minutestep="4"
*               $scope.datepattern="dd-MM-yy hh:mm a"
 *              $scope.outputformat = "yyyy, dd MMMM hh:mm a"
 *              $scope.mindate="01-01-2015"
 *              $scope.maxdate="01-01-2020"
 *              $scope.excludedates="2015-05-18, 2015-10-27"
 *              $scope.excludedays="0,6"
 *              $scope.f = function (event,scope) {
 *                  $scope.currentTime = scope.datavalue;
 *                  $scope.currentTimestamp = scope.timestamp;
 *              }
 *           }
 *       </file>
 *   </example>
 */

