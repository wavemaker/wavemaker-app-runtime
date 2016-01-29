/*global WM,moment _ */
/*Directive for time */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/time.html',
            '<div class="app-timeinput input-group dropdown" uib-dropdown init-widget has-model apply-styles role="input"' +
                ' title="{{hint}}" ' +
                ' data-ng-model="_proxyModel"' + /* _proxyModel is a private variable inside this scope */
                ' data-ng-show="show" ' +
                ' data-ng-change="_onChange({$event: $event, $scope: this})" >' +
                '<input class="form-control app-textbox display-input" data-ng-model="_timeModel" accesskey="{{shortcutkey}}">' +
                '<div uib-dropdown is-open="isOpen" class="dropdown">' +
                    '<div uib-dropdown-menu>' +
                        '<uib-timepicker hour-step="hourstep" minute-step="minutestep" show-meridian="ismeridian" show-seconds="showseconds"></uib-timepicker>' +
                    '</div>' +
                '</div>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" data-ng-disabled="disabled" data-ng-model="_model_">' +
                '<span class="input-group-btn dropdown-toggle">' +
                    '<button type="button" class="btn btn-default btn-time"><i class="glyphicon glyphicon-time"></i></button>' +
                '</span>' +
            '</div>'
            );
        $templateCache.put('template/device/widget/form/time.html',
            '<input type="time" class="form-control app-textbox" role="input" data-ng-show="show" data-ng-model="_proxyModel" has-model init-widget data-ng-change="updateModel();_onChange({$event: $event, $scope: this})">'
            );
    }]).directive('wmTime', ['$rootScope', 'PropertiesFactory', 'WidgetUtilService', '$timeout', '$templateCache', '$filter', 'Utils', function ($rs, PropertiesFactory, WidgetUtilService, $timeout, $templateCache, $filter, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.time', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
            notifyFor = {
                'readonly': true,
                'disabled': true,
                'autofocus': true,
                'timestamp': true,
                'timepattern': true
            };

        if ($rs.isMobileApplicationType) {
            widgetProps.hourstep.show = false;
            widgetProps.minutestep.show = false;
        }

        function setTimeModel(scope) {
            if (scope.timepattern === 'timestamp') {
                scope._timeModel = scope._proxyModel && scope._proxyModel.getTime();
            } else {
                scope._timeModel = $filter('date')(scope._proxyModel, scope.timepattern);
            }
        }

        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
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
            case 'timestamp':
                /*Single equal is used not to update model if newVal and oldVal have same values with string and integer types*/
                if (newVal != oldVal) {
                    scope._model_ = newVal;
                }
                break;
            case 'timepattern':
                scope.showseconds = _.includes(newVal, 'ss');
                scope.ismeridian  = _.includes(newVal, 'hh');
                setTimeModel(scope);
                break;
            }
        }

        function _onClick(scope, evt) {
            evt.stopPropagation();
            if (scope.onClick) {
                scope.onClick({$event: evt, $scope: scope});
            }
        }
        function _onTimeClick(scope, evt) {
            evt.stopPropagation();
            var timeOpen = scope.isOpen;
            $timeout(function () {
                WM.element(document).trigger('click');
                scope.isOpen = !timeOpen;
            });
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: function (tElement, tAttrs) {
                var template = '',
                    isWidgetInsideCanvas,
                    target;

                if ($rs.isMobileApplicationType) {
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/device/widget/form/time.html', tElement, tAttrs));
                    return template[0].outerHTML;
                }

                template = WM.element($templateCache.get('template/widget/form/time.html', tElement, tAttrs));
                isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                target = template.children('input.form-control');

                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);
                if (!isWidgetInsideCanvas) {

                    template.attr('data-ng-click', '_onClick($event)');
                    template.find('.btn-time').attr('data-ng-click', '_onTimeClick($event)');
                    template.find('.display-input').attr('data-ng-click', '_onTimeClick($event)');

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
                    pre: function (scope, element, attrs) {
                        scope.widgetProps = widgetProps;
                        if ($rs.isMobileApplicationType) {
                            scope._nativeMode = true;
                        }

                    },
                    post: function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);

                        /*Called from form reset when users clicks on form reset*/
                        scope.reset = function () {
                            //TODO implement custom reset logic here
                            scope._model_ = '';
                        };

                        /*
                         * Backward compatibility for ismeridian property which is deprecated.
                         * if ismeridian is false then time is set as 24hr clock format.
                         */
                        if (attrs.ismeridian === 'false' && !attrs.timepattern) {
                            scope.timepattern = scope.timepattern.replace('hh', 'HH').replace(' a', '');
                        }
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        scope._onClick = _onClick.bind(undefined, scope);
                        scope._onTimeClick = _onTimeClick.bind(undefined, scope);

                        /*update the model for device time*/
                        scope.updateModel = function () {
                            scope._model_ = scope._proxyModel;
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
                                var timestamp = this._proxyModel ?  this._proxyModel.valueOf() : undefined;
                                this.timestamp = timestamp;
                                if (this.outputformat === "timestamp") {
                                    return timestamp;
                                }
                                if (!this.outputformat) {
                                    this.outputformat = 'HH:mm:ss';
                                }
                                return this._proxyModel ? $filter('date')(this._proxyModel, this.outputformat) : undefined;
                            },
                            set: function (val) {
                                var dateTime;
                                if (scope._nativeMode) {
                                    if (val) {
                                        dateTime = Utils.getValidDateObject(val);
                                        /*set the proxymodel and timestamp*/
                                        this._proxyModel = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate(), dateTime.getHours(), dateTime.getMinutes(), dateTime.getSeconds());
                                        this.timestamp = this._proxyModel.getTime();
                                    } else {
                                        this._proxyModel = undefined;
                                    }
                                    return;
                                }
                                if (val) {
                                    dateTime = Utils.getValidDateObject(val);
                                    this._proxyModel = WM.isDate(dateTime) ? dateTime : undefined;
                                } else {
                                    this._proxyModel = undefined;
                                }
                                setTimeModel(scope);
                            }
                        });

                        /*set the model if datavalue doesnt exist*/
                        if (!attrs.datavalue && !attrs.scopedatavalue) {
                            if (scope._nativeMode) {
                                scope._proxyModel = new Date();
                                scope.timestamp = scope._proxyModel.getTime();
                            } else {
                                scope._model_ = Date.now();
                            }
                        }

                        /*set the model if datavalue exists */
                        if (attrs.datavalue) {
                            if (scope._nativeMode) {
                                scope._proxyModel = new Date(attrs.datavalue);
                            }
                            scope._model_ = attrs.datavalue;
                        }

                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmTime
 * @restrict E
 *
 * @description
 * The directive defines a time  widget.
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
 *               <wm-time
 *                  on-change="f($event, $scope)"
 *                  name="time1"
 *                  placeholder="set the time"
 *                  outputformat="{{outputformat}}"
 *                  hourstep="{{hourstep}}"
 *                  minutestep="{{minutestep}}"
 *                  ismeridian="{{ismeridian}}">
 *               </wm-time><br>
 *
 *               <div>Selected Time: {{currentTime}}</div><br>
 *               <div>timestamp: {{currentTimestamp}}</div><br>
 *               <wm-composite>
 *                   <wm-label caption="output format:"></wm-label>
 *                   <wm-text scopedatavalue="outputformat"></wm-text>
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
 *              $scope.outputformat = "hh:mm a"
 *              $scope.f = function (event,scope) {
 *                  $scope.currentTime = scope.datavalue;
 *                  $scope.currentTimestamp = scope.timestamp;
 *              }
 *           }
 *       </file>
 *   </example>
 */

