/*global WM */
/*Directive for datetime */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/datetime.html',
            '<div class="app-datetime input-group dropdown" dropdown is-open="isTimeOpen" init-widget has-model ' + $rootScope.getWidgetStyles() +
            ' title="{{hint}}" data-ng-show="show" data-ng-model="_proxyModel">' + /* _proxyModel is a private variable inside this scope */
                '<input class="form-control app-textbox" data-ng-model="_displayModel">' +
                '<input class="form-control app-textbox app-dateinput ng-hide" data-ng-change="selectDate($event)" data-ng-model="_dateModel" datepicker-popup={{datepattern}} min-date=mindate max-date=maxdate is-open="isDateOpen">' +
                '<div class="dropdown-menu">' +
                    '<timepicker data-ng-model="_timeModel" hour-step="hourstep" minute-step="minutestep" show-meridian="ismeridian" data-ng-change="selectTime($event)"></timepicker>' +
                '</div>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" data-ng-disabled="disabled" data-ng-model="_model_">' +
                '<span class="input-group-btn">' +
                    '<button type="button" class="btn btn-default btn-date"><i class="glyphicon glyphicon-calendar"></i></button>' +
                    '<button type="button" class="btn btn-default btn-time dropdown-toggle"><i class="glyphicon glyphicon-time"></i></button>' +
                '</span>' +
            '</div>'
            );
    }]).directive('wmDatetime', ['PropertiesFactory', 'WidgetUtilService', '$timeout', '$templateCache', '$filter', function (PropertiesFactory, WidgetUtilService, $timeout, $templateCache, $filter) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.datetime', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
            notifyFor = {
                'readonly': true,
                'disabled': true,
                'autofocus': true
            };

        function propertyChangeHandler(element, key, newVal) {
            var inputEl = element.find('input'),
                buttonEl = element.find('button');
            switch (key) {
            case 'readonly':
            case 'disabled':
                inputEl.attr(key, newVal);
                buttonEl.attr('disabled', newVal);
                // prevent the click events on decrement/increment buttons
                element.css('pointer-events', newVal ? 'none' : 'all');
                break;
            case 'autofocus':
                inputEl.first().attr(key, newVal);
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
        function _onDateClick(scope, evt) {
            evt.stopPropagation();
            scope.isDateOpen = !scope.isDateOpen;
            scope.isTimeOpen = false;
        }

        /*On click of time icon button, open the time picker popup*/
        function _onTimeClick(scope, evt) {
            evt.stopPropagation();
            scope.isTimeOpen = !scope.isTimeOpen;
            scope.isDateOpen = false;
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/datetime.html', tElement, tAttrs)),
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    target = template.children('input.form-control');
                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);
                if (!isWidgetInsideCanvas) {
                    template.attr('data-ng-click', '_onClick($event)');
                    template.find('.btn-date').attr('data-ng-click', '_onDateClick($event)');
                    template.find('.btn-time').attr('data-ng-click', '_onTimeClick($event)');

                    if (tAttrs.hasOwnProperty('onMouseenter')) {
                        template.attr('data-ng-mouseenter', 'onMouseenter({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseleave')) {
                        template.attr('data-ng-mouseleave', 'onMouseleave({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onFocus')) {
                        target.attr('data-ng-focus', 'onFocus({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onBlur')) {
                        target.attr('data-ng-blur', 'onBlur({$event: $event, $scope: this})');
                    }
                }

                return template[0].outerHTML;
            },
            compile: function () {
                return {
                    pre: function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    post: function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, element);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        scope.formatDateTime =  function () {
                            var date,
                                time,
                                dateString,
                                timeString,
                                value;
                            if (scope._timeModel || scope._dateModel) {
                                time = scope._timeModel ? new Date(scope._timeModel) : new Date();
                                date = scope._dateModel ? new Date(scope._dateModel) : new Date();
                                dateString = $filter('date')(date, 'yyyy-MM-dd');
                                timeString = $filter('date')(time, 'HH:mm');
                                value = new Date(dateString + ' ' + timeString).getTime();
                                if (scope.datepattern && scope.datepattern !== "timestamp") {
                                    scope._displayModel = $filter('date')(value, scope.datepattern);
                                } else {
                                    scope._displayModel = value;
                                }
                                if (scope.outputformat && scope.outputformat !== "timestamp") {
                                    scope._proxyModel = $filter('date')(value, scope.outputformat);
                                } else {
                                    scope._proxyModel = value;
                                }
                            } else {
                                scope._displayModel = undefined;
                                scope._proxyModel = undefined;
                            }
                        };

                        scope._onClick = _onClick.bind(undefined, scope);
                        scope._onDateClick = _onDateClick.bind(undefined, scope);
                        scope._onTimeClick = _onTimeClick.bind(undefined, scope);
                        /*On selection of a date, open the time picker popup*/
                        scope.selectDate = function (event) {
                            if (scope.isDateOpen) {
                                scope.isTimeOpen = true;
                            }
                            scope.formatDateTime();
                            scope._onChange({$event: event, $scope: scope});
                        };
                        scope.selectTime = function (event) {
                            scope.formatDateTime();
                            scope._onChange({$event: event, $scope: scope});
                        };
                        /* handle initial readonly/disabled values */
                        $timeout(function () {
                            onPropertyChange('disabled', scope.disabled);
                            onPropertyChange('readonly', scope.readonly);
                        });
                        /* _model_ acts as a converter for _proxyModel
                         * read operation of _model_/datavalue will return epoch format of the date
                         * write operation of _model_ will update _proxyModel with Date object.
                         *  */
                        Object.defineProperty(scope, '_model_', {
                            get: function () {
                                return this._proxyModel;
                            },
                            set:  function (val) {
                                if (!isNaN(val)) {
                                    val = parseInt(val, 10);
                                }
                                var dateTime = new Date(val);
                                if (new Date(val).getTime()) {
                                    this._proxyModel = this._dateModel = this._timeModel = dateTime.getTime();
                                } else {
                                    this._proxyModel = this._dateModel = this._timeModel = undefined;
                                }
                                scope.formatDateTime();
                            }
                        });

                        if (!attrs.datavalue && !attrs.scopedatavalue) {
                            scope._model_ = Date.now();
                        }

                        /*Set default value*/
                        if (attrs.datavalue) {
                            scope._model_ = attrs.datavalue;
                        }
                    }
                };
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
 * @param {string=} ismeridian
 *                  whether do display 12H or 24H. <br>
 * @param {string=} hourstep
 *                  Number of hours to increase or decrease
 * @param {string=} minutestep
 *                  Number of minutes to increase or decrease.
 * @param {string=} datepattern
 *                  display pattern of dates. <br>
 *                  This property is bindable. <br>
 *                  Default value : 'dd-MM-yyyy'
 * @param {string=} outputformat
 *                  output format of the widget. <br>
 *                  Default value : 'timestamp'
 * @param {string=} mindate
 *                  MinDate is the minimum date to start with. <br>
 *                  The default input pattern is mm/dd/yyyy
 * @param {string=} maxdate
 *                  MinDate is the maximum date to end with. <br>
 *                  The default input pattern is mm/dd/yyyy
 *@param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`.
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
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
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>Selected Time: {{currentTime | date:'hh:mm'}}</div><br>
 *               <wm-datetime
 *                  on-change="f($event, $scope)"
 *                  name="time1"
 *                  placeholder="set the time"
 *                  hourstep="{{hourstep}}"
 *                  minutestep="{{minutestep}}"
 *                  ismeridian="{{ismeridian}}"
 *                  datepattern="{{datepattern}}"
 *                   mindate="{{mindate}}"
 *                  maxdate="{{maxdate}}">
 *               </wm-datetime><br>
 *
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
 *
 *              $scope.f = function (event,scope) {
 *                  $scope.currentTime = scope.datavalue;
 *              }
 *           }
 *       </file>
 *   </example>
 */

