/*global WM */
/*Directive for Progressbar */

WM.module('wm.widgets.basic')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/progress.html',
                '<div class="progress app-progress" data-ng-show="show" title="{{hint}}" init-widget ' + $rootScope.getWidgetStyles() + ' >' +
                    '<div class="progress-bar" role="progressbar" aria-valuenow={{datavalue}} aria-valuemin={{minvalue}} aria-valuemax={{maxvalue}} data-ng-hide="isMultipleBar"></div>' +
                '</div>'
            );
    }])
    .directive('wmProgress', ['PropertiesFactory', 'WidgetUtilService', '$interval', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, $interval, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.progress', ['wm.base', 'wm.base.events']),
            notifyFor = {
                'datavalue': true,
                'minvalue': true,
                'maxvalue': true,
                'type': true,
                'pollinterval': true
            },
            /* map of type and classes to be applied*/
            CLASSES = {
                'default': '',
                'default-striped': 'progress-bar-striped',
                'success': 'progress-bar-success',
                'success-striped': 'progress-bar-success progress-bar-striped',
                'info': 'progress-bar-info',
                'info-striped': 'progress-bar-info progress-bar-striped',
                'warning': 'progress-bar-warning',
                'warning-striped': 'progress-bar-warning progress-bar-striped',
                'danger': 'progress-bar-danger',
                'danger-striped': 'progress-bar-danger progress-bar-striped'
            },
            DISPLAY_FORMAT = {
                'PERCENTAGE': 'percentage',
                'ABSOLUTE': 'ABSOLUTE'
            };


        // returns true if the min and max values are valid, false otherwise
        function areValuesValid(max, min) {
            if (!max || (!min && min !== 0) || (max <= min)) {
                return false;
            }

            return true;
        }

        function isPercentageValue(value) {
            if (WM.isString(value)) {
                value = value.trim();
                return value.charAt(value.length - 1) === '%';
            }
        }

        function triggerCallbackFns(scope, oldDatavalue, newDatavalue, isValueAPercentage) {

            var onStart = false,
                onEnd = false;

            if (isValueAPercentage) {
                if (oldDatavalue <= 0 && newDatavalue > 0) {
                    onStart = true;
                } else if (newDatavalue >= 100) {
                    onEnd = true;
                }
            } else {
                if (oldDatavalue <= scope.minvalue && newDatavalue > scope.minvalue) {
                    onStart = true;
                } else if (newDatavalue >= scope.maxvalue) {
                    onEnd = true;
                }
            }

            if (onStart) {
                Utils.triggerFn(scope.onStart, {$scope: scope});
            } else if (onEnd) {
                endPolling(scope);
                Utils.triggerFn(scope.onComplete, {$scope: scope});
            }
        }

        // if the progressbar is NOT multibar, update the bar when maxvalue, minvalue or datavalue are changed.
        function updateProgressBar(scope, progressBarEl, oldDatavalue, newDatavalue) {

            var isValueAPercentage,
                progressBarWidth,
                displayValue = 0;

            if (scope.isMultipleBar) {
                return;
            }

            isValueAPercentage = isPercentageValue(scope.datavalue);

            if (isValueAPercentage) {
                oldDatavalue = parseInt(oldDatavalue || 0, 10);
                newDatavalue = parseInt(newDatavalue || 0, 10);
            } else {
                if (!areValuesValid(scope.maxvalue, scope.minvalue)) {
                    endPolling(scope);
                    return;
                }
            }

            triggerCallbackFns(scope, oldDatavalue, newDatavalue, isValueAPercentage);

            if (isValueAPercentage) {
                progressBarWidth = displayValue = (scope.datavalue || '0%');
            } else {
                if (WM.isDefined(scope.datavalue)) {
                    displayValue = scope.datavalue * 100 / (scope.maxvalue - scope.minvalue);
                    progressBarWidth = displayValue + '%';

                    if (scope.displayformat === DISPLAY_FORMAT.PERCENTAGE) {
                        displayValue = progressBarWidth;
                    }
                } else {
                    displayValue = progressBarWidth = 0;
                }
            }

            progressBarEl.css('width', progressBarWidth).text(displayValue);
        }

        // if the progress bar is multibar, create the multi-bar related nodes.
        function updateMultipleProgressBar(element, data) {
            data.forEach(function (barInfo) {
                var cls = CLASSES[barInfo.type],
                    val = barInfo.value + '%';
                WM.element('<div class="multi-bar progress-bar"></div>').appendTo(element).addClass(cls).css('width', val).text(val);
            });
        }

        function successHandler(scope, response) {
            // if the binddatavalue is provided... there will be a watch on the bound property
            // do not trigger the onBeforeupdate calback.
            if (!scope.binddatavalue) {
                Utils.triggerFn(scope.onBeforeupdate, {$response: response, $scope: scope});
            }
        }

        function setupPolling(scope) {
            $interval.cancel(scope.invokeInterval);
            if (CONSTANTS.isRunMode && scope.binddataset && scope.pollinterval) {
                scope.invokeInterval = $interval(function () {
                    scope.$root.$emit(
                        'invoke-service',
                        scope.boundServiceName,
                        {},
                        successHandler.bind(undefined, scope)
                    );
                }, scope.pollinterval);
            }
        }

        function endPolling(scope) {
            $interval.cancel(scope.invokeInterval);
        }

        function defineProperties(scope) {
            Object.defineProperty(scope, 'binddataset', {
                get: function () {
                    return this._binddataset;
                },

                set: function (value) {
                    if (this._binddataset === value) {
                        return;
                    }

                    this._binddataset = value;
                    endPolling(scope);
                    if (WM.isString(value)) {
                        scope.boundServiceName = value.substr(0, value.indexOf('.'));
                        setupPolling(scope);
                    }
                }
            });
        }

        function propertyChangeHandler(scope, element, progressBarEl, key, newVal, oldVal) {
            switch (key) {
            case 'minvalue':
            case 'maxvalue':
                updateProgressBar(scope, progressBarEl);
                break;
            case 'datavalue':
                scope.isMultipleBar = false;
                element.children('.multi-bar').remove();
                if (WM.isNumber(newVal) || WM.isString(newVal)) {
                    updateProgressBar(scope, progressBarEl, oldVal, newVal);
                } else if (WM.isArray(newVal)) {
                    scope.isMultipleBar = true;
                    updateMultipleProgressBar(element, newVal);
                }
                break;
            case 'type':
                progressBarEl.removeClass(CLASSES[oldVal]).addClass(CLASSES[newVal]);
                break;
            case 'pollinterval':
                endPolling(scope);
                if (WM.isNumber(newVal)) {
                    setupPolling(scope);
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/progress.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                        Object.defineProperty(scope, 'binddataset', {
                            'configurable': true
                        });
                    },
                    'post': function (scope, element, attrs) {
                        var progressBarEl = element.children().first();

                        defineProperties(scope);
                        if (attrs.dataset) {
                            if (Utils.stringStartsWith(attrs.dataset, 'bind:')) {
                                scope.binddataset = attrs.dataset.replace('bind:Variables.', '');
                            }
                        }

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, progressBarEl), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);



/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmProgress
 * @restrict E
 *
 * @description
 * The `wmProgress` directive defines the progressbar widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $interval
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the progressbar widget.
 * @param {string=} hint
 *                  Title/hint for the progressbar. <br>
 *                  This property is bindable.
 * @param {string=} type
 *                  type of the bar to be displayed. <br>
 *                  possible values are: `default`, `default-striped`, `success`, `success-striped`, `info`, `info-striped`, `warning`, `warning-striped`, `danger`, `danger-striped`. <br>
 *                  Default value: `value`. <br>
 * @param {string=} width
 *                  Width of the progressbar.
 * @param {string=} height
 *                  Height of the progressbar.
 * @param {number=} datavalue
 *                  value of the progressbar.<br>
 *                  array of objects(with keyes `type` and `value`) for multiple-bar, a number otherwise
 * @param {number=} minvalue
 *                  minvalue of the progressbar.
 * @param {number=} maxvalue
 *                  maxvalue of the progressbar.
 * @param {string=} displayformat
 *                  Format(Absolute/Percentage) in which the progress needs to be displayed.
 * @param {number=} pollinterval
 *                  Time interval in milli seconds to poll the service.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the progressbar widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dblclick
 *                  Callback function which will be triggered when the widget is double-clicked.
 * @param {string=} on-mouseenter.
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @param {string=} on-start
 *                  Callback function which will be triggered on the start of the progress.
 * @param {string=} on-complete
 *                  Callback function which will be triggered on the completion of the progress.
 * @param {string=} on-beforeupdate
 *                  Callback function which will be triggered before the update of the progress.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>dbl click count: {{dblclickCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <br>
 *               <wm-progress type="{{type}}"
 *                          height="24" datavalue="20"
 *                          on-click="f('click')"
 *                          on-dblclick="f('dblclick')"
 *                          on-mouseenter="f('mouse enter')"
 *                          on-mouseleave="f('mouse leave')"
 *                          show="{{show}}"
 *                          >
 *               </wm-progress>
 *               <br>
 *               <wm-composite>
 *                   <wm-label caption="type:"></wm-label>
 *                   <wm-select scopedatavalue="type" scopedataset="types"></wm-select>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="show:"></wm-label>
 *                   <wm-checkbox scopedatavalue="show"></wm-text>
 *               </wm-composite>
 *
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.dblclickCount =
 *              $scope.mouseenterCount =
 *              $scope.mouseleaveCount = 0;
 *
 *              $scope.show = true;
 *
 *              $scope.types = ['default', 'default-striped', 'success', 'success-striped', 'info', 'info-striped', 'warning', 'warning-striped', 'danger', 'danger-striped'];
 *              $scope.type = ['default'];
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */