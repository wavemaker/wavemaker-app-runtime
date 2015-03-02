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
    }]).directive('wmTime', ['PropertiesFactory', 'WidgetUtilService', '$timeout', '$templateCache', function (PropertiesFactory, WidgetUtilService, $timeout, $templateCache) {
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
                        scope.formatTime = function (time) {
                            if (time && time.getHours) {
                                var hours, minutes, seconds, meridian;
                                hours = time.getHours();
                                minutes = time.getMinutes();
                                seconds = time.getSeconds();
                                meridian = hours >= 12 ? 'PM' : 'AM';
                                hours = hours % 12;
                                hours = hours || 12; // the hour '0' should be '12'
                                hours = hours < 10 ? '0' + hours : hours;
                                minutes = minutes < 10 ? '0' + minutes : minutes;
                                seconds = seconds < 10 ? '0' + seconds : seconds;
                                // add a zero in front of numbers<10
                                return hours + ':' + minutes + ':' + seconds + ' ' + meridian;
                            }
                        };

                        /* _model_ acts as a converter for _proxyModel
                         * read operation of _model_/datavalue will return epoch format of the date
                         * write operation of _model_ will update _proxyModel with Date object.
                         *  */
                        Object.defineProperty(scope, '_model_', {
                            get: function () {
                                this._timeModel = scope.formatTime(this._proxyModel);
                                return this._proxyModel ?  this._proxyModel.valueOf() : undefined;
                            },
                            set: function (val) {
                                if (val) {
                                    if (WM.isDate(val)) {
                                        this._proxyModel = val;
                                    } else {
                                        var date = new Date(val);
                                        this._proxyModel = WM.isDate(date) ? date : undefined;
                                    }
                                } else {
                                    this._proxyModel = undefined;
                                }
                                this._timeModel = scope.formatTime(this._proxyModel);
                            }
                        });

                        if (!attrs.datavalue && !attrs.scopedatavalue) {
                            scope._model_ = Date.now();
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
 *                  Title/hint for the widget <br>
 *                  This property is bindable.
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
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the widget on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} on-click
 *                  Callback function for `click` event.
 * @param {string=} on-mouseenter.
 *                  Callback function for `mouseenter` event.
 * @param {string=} on-mouseleave
 *                  Callback function for `mouseleave` event.
 * @param {string=} on-focus
 *                  Callback function for `focus` event.
 * @param {string=} on-blur
 *                  Callback function for `blur` event.
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

