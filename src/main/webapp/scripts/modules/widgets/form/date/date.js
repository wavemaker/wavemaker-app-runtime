/*global WM, _, moment */
/*Directive for date */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/date.html',
            '<div class="app-date input-group" init-widget has-model data-ng-show="show" role="input" apply-styles>' +
                '<input class="form-control app-textbox app-dateinput" uib-datepicker-popup={{datepattern}} show-button-bar={{showbuttonbar}} date-disabled="excludeDays(date, mode) || excludeDates(date, mode)" ' +
                    ' title="{{hint}}" ' +
                    ' min-date=mindate max-date=maxdate is-open=isOpen' +
                    ' data-ng-model="_proxyModel" ' + /* _proxyModel is a private variable inside this scope */
                    ' data-ng-readonly="readonly" ' +
                    ' data-ng-required="required" ' +
                    ' data-ng-disabled="disabled" ' +
                    ' show-weeks={{showweeks}} ' +
                    ' accesskey="{{shortcutkey}}"' +
                    ' data-ng-change="_onChange({$event: $event, $scope: this})">' +
                '</input>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" data-ng-disabled="disabled" data-ng-model="_model_">' +
                '<span class="input-group-btn">' +
                    '<button type="button" class="btn btn-default btn-date"><i class="wi wi-calendar"></i></button>' +
                '</span>' +
            '</div>'
            );
        $templateCache.put('template/device/widget/form/date.html',
            '<input type="date" class="form-control app-textbox app-dateinput" init-widget has-model role="input"' +
            ' step="any" ' +
            ' data-ng-model="_proxyModel" ' +
            ' data-ng-show="show" ' +
            ' data-ng-readonly="readonly" ' +
            ' data-ng-required="required" ' +
            ' data-ng-disabled="disabled" ' +
            ' data-ng-change="updateModel();_onChange({$event: $event, $scope: this});"> '
            );
    }])
    .directive('wmDate', ['$rootScope', 'PropertiesFactory', 'WidgetUtilService', '$templateCache', '$filter', 'FormWidgetUtils', function ($rs, PropertiesFactory, WidgetUtilService, $templateCache, $filter, FormWidgetUtils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.date', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
            notifyFor = {
                'readonly': true,
                'disabled': true,
                'timestamp': true,
                'autofocus': true,
                'excludedates': true
            };

        if ($rs.isMobileApplicationType) {
            /*date pattern is not supported for native date widget*/
            widgetProps.datepattern.show = false;
            widgetProps.excludedates.show = false;
            widgetProps.excludedays.show = false;
        }

        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
            switch (key) {
            case 'readonly':
            case 'disabled':
                // prevent the click events on decrement/increment buttons
                element.css('pointer-events', newVal ? 'none' : 'all');
                break;
            case 'timestamp':
                /*Single equal is used not to update model if newVal and oldVal have same values with string and integer types*/
                if (newVal != oldVal) {
                    scope._model_ = newVal;
                }
                break;
            case 'excludedates':
                scope.proxyExcludeDates = FormWidgetUtils.getProxyExcludeDates(newVal);
                break;
            }
        }

        function getTimeStamp(val) {
            var epoch;
            if (val) {
                if (WM.isDate(val)) {
                    epoch = val.getTime();
                } else {
                    if (!isNaN(val)) {
                        val = parseInt(val, 10);
                    }
                    epoch = moment(val).valueOf();
                    epoch = isNaN(epoch) ? undefined : epoch;
                }
            }
            return epoch;
        }

        function _onClick(scope, evt) {
            scope.isOpen = !scope.isOpen;
            if (scope.onClick) {
                scope.onClick({$event: evt, $scope: scope});
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': function (tElement, tAttrs) {
                var template = '',
                    isWidgetInsideCanvas,
                    target;

                if ($rs.isMobileApplicationType) {
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/device/widget/form/date.html', tElement, tAttrs));
                    return template[0].outerHTML;
                }

                template = WM.element($templateCache.get('template/widget/form/date.html'));
                isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                target = template.children('input.form-control');

                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);
                if (!isWidgetInsideCanvas) {

                    template.find('.btn-date').attr('data-ng-click', '_onClick($event)');
                    template.find('.app-dateinput').attr('data-ng-click', '_onClick($event)');

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
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                        if ($rs.isMobileApplicationType) {
                            scope._nativeMode = true;
                        }
                    },
                    'post': function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        scope._onClick = _onClick.bind(undefined, scope);

                        /*update the model when the device date is changed*/
                        scope.updateModel = function () {
                            scope._model_ = FormWidgetUtils.getUpdatedModel(scope.mindate, scope.maxdate, scope._model_, scope._proxyModel, scope._prevDate);
                            scope._prevDate = scope._model_;
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
                                var timestamp = this._proxyModel ?  this._proxyModel.valueOf() : undefined;
                                this.timestamp = timestamp;
                                if (this.outputformat === "timestamp") {
                                    return timestamp;
                                }
                                if (!this.outputformat) {
                                    this.outputformat = 'yyyy-MM-dd';
                                }
                                return this._proxyModel ? $filter('date')(this._proxyModel, this.outputformat) : undefined;
                            },
                            set: function (val) {
                                var timestamp;
                                if (scope._nativeMode) {
                                    if (val) {
                                        /*set the proxymodel and timestamp if val exists*/
                                        timestamp = getTimeStamp(val);
                                        this._proxyModel = new Date(timestamp);
                                        this.timestamp = timestamp;
                                    } else {
                                        this._proxyModel = undefined;
                                    }
                                } else {
                                    this._proxyModel = val ? new Date(getTimeStamp(val)) : undefined;
                                }
                            }
                        });

                        scope.excludeDays = function (date, mode) {
                            return mode === 'day' && _.includes(attrs.excludedays, date.getDay());
                        };
                        scope.excludeDates = function (date, mode) {
                            return mode === 'day' && _.includes(scope.proxyExcludeDates, FormWidgetUtils.getTimestampFromDate(date));
                        };

                        /*set the default value*/
                        if (!attrs.datavalue && !attrs.scopedatavalue) {
                            if (scope._nativeMode) {
                                /*prevDate is used to keep a copy of prev selected date*/
                                scope._prevDate = scope._proxyModel = new Date();
                                scope.timestamp = getTimeStamp(scope._proxyModel);
                            } else {
                                scope._model_ = Date.now();
                            }
                        }
                        /*if datavalue exists set the model*/
                        if (attrs.datavalue) {
                            scope._model_ = attrs.datavalue;
                            if (scope._nativeMode) {
                                scope._proxyModel = new Date(attrs.datavalue);
                            }
                        }
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmDate
 * @restrict E
 *
 * @description
 * The directive defines a date  widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $templateCache
 *
 * @param {string=} name
 *                  Name of the date widget.
 * @param {string=} placeholder
 *                  Placeholder for the date field
 * @param {string=} hint
 *                  Title/hint for the date <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order for Date widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the date widget.
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the  Date widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the value of the date widget in pattern mm/dd/yyyy. <br>
 *                  This property is bindable.
 * @param {string=} datepattern
 *                  display pattern of dates. <br>
 *                  This property is bindable. <br>
 *                  Default value : 'dd-MM-yyyy'
 * @param {string=} outputformat
 *                  output format of the widget. <br>
 *                  Default value : 'yyyy-MM-dd'
 *@param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`.
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
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} showweeks
 *                   When set, week number will be displayed in date-picker UI.<br>
 *                   Default value: `false`
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the date widget non-editable on the web page. <br>
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
 *               <wm-date name="date1"
 *                   on-change="f($event, $scope)"
 *                   placeholder="{{placeholder}}"
 *                   hint="Add a date"
 *                   datepattern="{{datepattern}}"
 *                   outputformat="{{outputformat}}"
 *                   mindate="{{mindate}}"
 *                  maxdate="{{maxdate}}"
 *                  excludedays="{{excludedays}}"
 *                  excludedates="{{excludedates}}">
 *               </wm-date><br>
 *               <div>Selected Date: {{currentDate}}</div><br>
 *               <div>timestamp: {{currentTimestamp}}</div><br>
 *               <wm-composite>
 *                   <wm-label caption="placeholder:"></wm-label>
 *                   <wm-text scopedatavalue="placeholder"></wm-text>
 *               </wm-composite>
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
 *               <wm-composite>
 *                   <wm-label caption="excludedates:"></wm-label>
 *                   <wm-text scopedatavalue="excludedates"></wm-text>
 *               </wm-composite>
 *                <wm-composite>
 *                   <wm-label caption="excludedays:"></wm-label>
 *                   <wm-text scopedatavalue="excludedays"></wm-text>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.placeholder="Fix a date"
 *              $scope.datepattern="dd-MM-yy"
 *              $scope.outputformat = "yyyy, dd MMMM"
 *              $scope.mindate="01-01-2015"
 *              $scope.maxdate="01-01-2020"
 *              $scope.excludedates="2015-05-18, 2015-10-27"
 *              $scope.excludedays="0,6"
 *              $scope.f = function (event, scope) {
 *                  $scope.currentDate = scope.datavalue;
 *                  $scope.currentTimestamp = scope.timestamp;
 *              }
 *           }
 *       </file>
 *   </example>
 */
