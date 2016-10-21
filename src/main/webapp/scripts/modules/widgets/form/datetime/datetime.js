/*global WM, moment, _, document */
/*Directive for datetime */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/datetime.html',
            '<div class="app-datetime input-group" init-widget has-model apply-styles role="input"' +
            ' title="{{hint}}" ng-model="_proxyModel">' + /* _proxyModel is a private variable inside this scope */
                '<input class="form-control app-textbox display-input" focus-target ng-model="_displayModel" accesskey="{{::shortcutkey}}" ng-change="updateDateTimeModel($event)" ng-model-options="{updateOn: \'blur\'}" ng-required="required">' +
                '<input class="form-control app-textbox app-dateinput" datepicker-append-to-body="true" ng-change="selectDate($event)" ng-model="_dateModel" ' +
                    ' uib-datepicker-popup datepicker-options="_dateOptions" show-button-bar={{showbuttonbar}} is-open="isDateOpen" focus-target>' +
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
    }]).directive('wmDatetime', ['$rootScope', 'PropertiesFactory', 'WidgetUtilService', '$timeout', '$templateCache', '$filter', 'FormWidgetUtils', '$interval', 'CONSTANTS', function ($rs, PropertiesFactory, WidgetUtilService, $timeout, $templateCache, $filter, FormWidgetUtils, $interval, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.datetime', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
            notifyFor = {
                'readonly'     : CONSTANTS.isRunMode,
                'disabled'     : CONSTANTS.isRunMode,
                'autofocus'    : true,
                'excludedates' : true,
                'showweeks'    : true,
                'mindate'      : true,
                'maxdate'      : true,
                'datepattern'  : true
            };

        function _formatDateTime(scope) {
            var date,
                time,
                dateString,
                timeString,
                value;
            if (scope._timeModel || scope._dateModel) {
                if (scope._timeModel) {
                    time = new Date(scope._timeModel);
                } else {
                    time = scope._timeModel = new Date();
                }
                if (scope._dateModel) {
                    date = new Date(scope._dateModel);
                } else {
                    date = scope._dateModel = new Date();
                }
                dateString = $filter('date')(date, 'yyyy-MM-dd');
                timeString = $filter('date')(time, 'HH:mm:ss');
                value = moment(dateString + ' ' + timeString).valueOf();
                scope.timestamp = value;
                if (scope.datepattern && scope.datepattern !== 'timestamp') {
                    scope._displayModel = $filter('date')(value, scope.datepattern);
                } else {
                    scope._displayModel = value;
                }
                if (scope.outputformat && scope.outputformat !== 'timestamp') {
                    scope._proxyModel = $filter('date')(value, scope.outputformat);
                } else {
                    scope._proxyModel = value;
                }
            } else {
                scope._displayModel = undefined;
                scope._proxyModel = undefined;
            }
        }

        function propertyChangeHandler(scope, element, key, newVal) {
            var inputEl  = element.find('input'),
                buttonEl = element.find('button');
            switch (key) {
            case 'readonly':
            case 'disabled':
                inputEl.attr(key, newVal);
                buttonEl.attr('disabled', newVal);
                // prevent the click events on decrement/increment buttons
                element.css('pointer-events', (scope.readonly || scope.disabled) ? 'none' : 'all');
                break;
            case 'autofocus':
                inputEl.first().attr(key, newVal);
                break;
            case 'excludedates':
                scope.proxyExcludeDates = FormWidgetUtils.getProxyExcludeDates(newVal);
                break;
            case 'datepattern':
                scope.showseconds = _.includes(newVal, 'ss');
                scope.ismeridian  = _.includes(newVal, 'hh');
                _formatDateTime(scope);
                break;
            case 'showweeks':
                scope._dateOptions.showWeeks = scope.showweeks;
                break;
            case 'maxdate':
                scope._dateOptions.maxDate = scope.maxdate;
                break;
            case 'mindate':
                scope._dateOptions.minDate = scope.mindate;
                break;
            }
        }

        function _onClick(scope, evt) {
            evt.stopPropagation();
            if (scope.onClick) {
                scope.onClick({$event: evt, $scope: scope});
            }
        }

        /*On click of date icon button, open the date picker popup*/
        function _onDateClick(scope, element, evt) {
            evt.stopPropagation();
            var dateOpen = scope.isDateOpen;
            $timeout(function () {
                element.parent().trigger('click');
                scope.isDateOpen = !dateOpen;
                scope.isTimeOpen = false;
            });
        }

        /*On click of time icon button, open the time picker popup*/
        function _onTimeClick(scope, element, evt) {
            evt.stopPropagation();
            var TimeOpen = scope.isTimeOpen;
            $timeout(function () {
                element.parent().trigger('click');
                scope.isTimeOpen = !TimeOpen;
                scope.isDateOpen = false;
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
            'template' : function (tElement, tAttrs) {
                var template = '',
                    isWidgetInsideCanvas,
                    target;

                if ($rs.isMobileApplicationType && tAttrs.type !== 'uib-picker') {
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/device/widget/form/datetime.html', tElement, tAttrs));
                    return template[0].outerHTML;
                }

                template = WM.element($templateCache.get('template/widget/form/datetime.html', tElement, tAttrs));
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
                pre: function (scope, element, attrs) {
                    scope.widgetProps = widgetProps;
                    scope._dateOptions = {};
                    if ($rs.isMobileApplicationType && attrs.type !== 'uib-picker') {
                        scope._nativeMode = true;
                    }
                },
                post: function (scope, element, attrs) {
                    var onPropertyChange  = propertyChangeHandler.bind(undefined, scope, element),
                        CURRENT_DATETIME  = 'CURRENT_DATE',
                        isCurrentDateTime = false,
                        timeInterval,
                        //Function to set/ cancel the timer based on the model passed
                        setTimeInterval = function (cancel) {
                            if (cancel) {
                                $interval.cancel(timeInterval); //Cancel the existing timer
                                return;
                            }
                            if (CONSTANTS.isRunMode) {
                                scope.disabled = true;
                                onPropertyChange('disabled', scope.disabled);
                                //Check if timer already exists. If time interval doesn't exist or state is canceled, create new timer
                                if (!timeInterval || timeInterval.$$state.value === 'canceled') {
                                    timeInterval = $interval(function () {
                                        scope._model_ = CURRENT_DATETIME; //Update the model every 1 sec
                                        scope._onChange();
                                    }, 1000);
                                }
                            }
                        },
                        setModels = function (val) {
                            var dateTime;
                            if (val) {
                                if (isCurrentDateTime) {
                                    dateTime = new Date();
                                    scope._proxyModel = scope._timeModel = dateTime.getTime();
                                    scope._dateModel = new Date(scope._proxyModel);
                                    if (scope.widgetid) {
                                        scope._displayModel = $filter('date')(scope._proxyModel, scope.datepattern);
                                        return;
                                    }
                                    setTimeInterval();
                                } else {
                                    dateTime = parseDateTime(val);
                                    if (dateTime.getTime()) {
                                        scope._proxyModel = scope._timeModel = dateTime.getTime();
                                        scope._dateModel = new Date(scope._proxyModel);
                                    } else {
                                        scope._proxyModel = scope._dateModel = scope._timeModel = undefined;
                                    }
                                    setTimeInterval(true);
                                }
                            } else {
                                scope._proxyModel = scope._dateModel = scope._timeModel = undefined;
                            }
                            scope.formatDateTime();
                        };

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    scope.formatDateTime = _formatDateTime.bind(undefined, scope);
                    scope._onClick = _onClick.bind(undefined, scope);
                    scope._onDateClick = _onDateClick.bind(undefined, scope, element);
                    scope._onTimeClick = _onTimeClick.bind(undefined, scope, element);

                    /*
                     * Backward compatibility for ismeridian property which is deprecated.
                     * if ismeridian is false then time is set as 24hr clock format.
                     */
                    if (attrs.ismeridian === 'false' && !attrs.datepattern) {
                        scope.datepattern = scope.datepattern.replace('hh', 'HH').replace(' a', '');
                    }

                    /*On selection of a date, open the time picker popup*/
                    scope.selectDate = function (event) {
                        if (_.isNull(scope._dateModel)) { //If date is cleared from datepicker, remove the time model also
                            scope._timeModel = undefined;
                        } else if (scope.isDateOpen) {
                            $timeout(function () { //Open the time after the date is selected
                                scope.isTimeOpen = true;
                            });
                        }
                        scope.formatDateTime();
                        scope._onChange({$event: event, $scope: scope});
                    };
                    scope.selectTime = function (event) {
                        scope.formatDateTime();
                        scope._onChange({$event: event, $scope: scope});
                    };

                    if (!scope.widgetid) {
                        /* handle initial readonly/disabled values */
                        $timeout(function () {
                            onPropertyChange('disabled', scope.disabled);
                            onPropertyChange('readonly', scope.readonly);
                        });
                    }


                    /*update the model with device datetime value*/
                    scope.updateModel = function () {
                        scope._model_ = FormWidgetUtils.getUpdatedModel(scope.mindate, scope.maxdate, scope._model_, scope._proxyModel, scope._prevDateTime);
                        scope._prevDateTime = scope._model_;
                    };

                    /*update the model when changed manually*/
                    scope.updateDateTimeModel = function (e) {
                        if (!isNaN(Date.parse(scope._displayModel))) {
                            setModels(scope._displayModel);
                        } else {
                            this._proxyModel = '';
                        }
                        scope._onChange({$event: e, $scope: scope});
                    };

                    /*Called from form reset when users clicks on form reset*/
                    scope.reset = function () {
                        //TODO implement custom reset logic here
                        scope._model_ = '';
                    };

                    /* _model_ acts as a converter for _proxyModel
                     * read operation of _model_/datavalue will return epoch format of the date
                     * write operation of _model_ will update _proxyModel with Date object.
                     *  */
                    Object.defineProperty(scope, '_model_', {
                        get: function () {
                            if (scope.widgetid && isCurrentDateTime) {
                                return CURRENT_DATETIME;
                            }
                            if (!scope._nativeMode) {
                                return this._proxyModel;
                            }
                            var timestamp = this._proxyModel ?  this._proxyModel.valueOf() : '';
                            this.timestamp = timestamp;
                            if (this.outputformat === "timestamp") {
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
                            if (scope._nativeMode) {
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
                    scope._dateOptions.dateDisabled = FormWidgetUtils.disableDates.bind(undefined, scope);
                    /*Set the model if datavalue exists*/
                    if (attrs.datavalue  && !_.startsWith(attrs.datavalue, 'bind:')) {
                        scope._model_ = attrs.datavalue;
                        if (attrs.datavalue === CURRENT_DATETIME) {
                            setTimeInterval();
                        }
                    }
                    scope.$on('$destroy', function () {
                        setTimeInterval(true);
                    });
                    //Add app-date class to the wrapper that are appended to body
                    $timeout(function () {
                        WM.element('body').find('> [uib-datepicker-popup-wrap]').addClass('app-date');
                    });

                    //Add app-datetime class to the wrapper that are appended to body
                    $timeout(function () {
                        WM.element('body').find('> [uib-dropdown-menu] > [uib-timepicker]').parent().addClass('app-datetime');
                    });
                }
            }
        };

    }]);


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

