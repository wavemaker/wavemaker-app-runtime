/*global WM */
/*Directive for time */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/time.html',
            '<div class="app-timeinput input-group dropdown" dropdown init-widget has-model ' + $rootScope.getWidgetStyles() +
                ' title="{{hint}}" ' +
                ' data-ng-model="_proxyModel"' + /* _proxyModel is a private variable inside this scope */
                ' data-ng-show="show" ' +
                //' is-open="isOpen" ' +
                ' data-ng-change="_onChange({$event: $event, $scope: this})" >' +
                '<input class="form-control app-textbox" data-ng-model="_timeModel">' +
                '<div class="dropdown-menu">' +
                    '<timepicker hour-step="hourstep" minute-step="minutestep" show-meridian="ismeridian"></timepicker>' +
                '</div>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" data-ng-disabled="disabled" data-ng-model="_model_">' +
                '<span class="input-group-btn dropdown-toggle" dropdown-toggle>' +
                    '<button type="button" class="btn btn-default"><i class="glyphicon glyphicon-time"></i></button>' +
                '</span>' +
            '</div>'
            );
    }]).directive('wmTime', ['PropertiesFactory', 'WidgetUtilService', '$timeout', '$templateCache', '$filter', function (PropertiesFactory, WidgetUtilService, $timeout, $templateCache, $filter) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.time', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
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
            scope.isOpen = !scope.isOpen;

            if (scope.onClick) {
                scope.onClick({$event: evt, $scope: scope});
            }
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/time.html', tElement, tAttrs)),
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    target = template.children('input.form-control');
                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);
                if (!isWidgetInsideCanvas) {

                    template.attr('data-ng-click', '_onClick($event)');

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
                        scope._onClick = _onClick.bind(undefined, scope);

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
                                var timeValue;
                                if (this._proxyModel) {
                                    this._timeModel = $filter('date')(this._proxyModel, "hh:mm a");
                                    timeValue = moment($filter('date')(this._proxyModel, "yyyy-MM-dd HH:mm")).valueOf();
                                    if (this.outputformat === "timestamp") {
                                        return timeValue;
                                    }
                                    if (!this.outputformat) {
                                        this.outputformat = 'HH:mm:ss';
                                    }
                                    return timeValue ? $filter('date')(timeValue, this.outputformat) : undefined;
                                }
                                return timeValue ?  timeValue.valueOf() : undefined;
                            },
                            set: function (val) {
                                if (val) {
                                    if (WM.isDate(val)) {
                                        this._proxyModel = val;
                                    } else {
                                        if (!isNaN(val)) {
                                            val = parseInt(val, 10);
                                        }
                                        var date = new Date(val);
                                        this._proxyModel = WM.isDate(date) ? date : undefined;
                                    }
                                } else {
                                    this._proxyModel = undefined;
                                }
                                this._timeModel = $filter('date')(this._proxyModel, "hh:mm a");
                            }
                        });

                        if (!attrs.datavalue && !attrs.scopedatavalue) {
                            scope._model_ = Date.now();
                        }

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
 *               <div>Selected Time: {{currentTime | date:'hh:mm'}}</div><br>
 *               <wm-time
 *                  on-change="f($event, $scope)"
 *                  name="time1"
 *                  placeholder="set the time"
 *                  hourstep="{{hourstep}}"
 *                  minutestep="{{minutestep}}"
 *                  ismeridian="{{ismeridian}}">
 *               </wm-time><br>
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

