/*global WM, _ */
/*Directive for Progressbar */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/progress.html',
                '<div class="progress app-progress" title="{{hint}}" init-widget apply-styles>' +
                    '<div class="progress-bar" role="progressbar" aria-valuenow={{datavalue}} aria-valuemin={{minvalue}} aria-valuemax={{maxvalue}} ng-hide="isMultipleBar"></div>' +
                '</div>'
            );
    }])
    .directive('wmProgressBar', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$interval',
        'Utils',
        'CONSTANTS',

        function (PropertiesFactory, WidgetUtilService, $interval, Utils, CONSTANTS) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.progress.bar', ['wm.base', 'wm.base.events']),
                notifyFor = {
                    'datavalue'       : true,
                    'minvalue'        : true,
                    'maxvalue'        : true,
                    'type'            : true,
                    'pollinterval'    : true,
                    'dataset'         : true,
                    'captionplacement': true
                },
                /* map of type and classes to be applied*/
                CLASSES = {
                    'default'        : '',
                    'default-striped': 'progress-bar-striped',
                    'success'        : 'progress-bar-success',
                    'success-striped': 'progress-bar-success progress-bar-striped',
                    'info'           : 'progress-bar-info',
                    'info-striped'   : 'progress-bar-info progress-bar-striped',
                    'warning'        : 'progress-bar-warning',
                    'warning-striped': 'progress-bar-warning progress-bar-striped',
                    'danger'         : 'progress-bar-danger',
                    'danger-striped' : 'progress-bar-danger progress-bar-striped'
                },
                DISPLAY_FORMAT = {
                    'PERCENTAGE': 'percentage',
                    'ABSOLUTE': 'ABSOLUTE'
                };

            function endPolling(scope) {
                $interval.cancel(scope.invokeInterval);
            }

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

            // This function returns the maximum number of decimal digits allowed.
            function getDecimalCount(val) {
                val = val || '9';
                val = val.replace(/\%$/, '');

                var n = val.lastIndexOf('.');

                return (n === -1) ? 0 : (val.length - n - 1);
            }

            //Updates caption placement of each progress bar
            function updateCaptionPlacement(element, isMultipleBar, captionPlacement) {
                if (isMultipleBar) {
                    element.find('.multi-bar').each(function () {
                        WM.element(this).find('.app-progress-label').attr('data-caption-placement', captionPlacement);
                    });
                } else {
                    element.find('.app-progress-label').attr('data-caption-placement', captionPlacement);
                }
            }

            // if the progressbar is NOT multibar, update the bar when maxvalue, minvalue or datavalue are changed.
            function updateProgressBar(scope, attrs, progressBarEl, oldDatavalue, newDatavalue) {

                var isValueAPercentage,
                    progressBarWidth,
                    displayValue = 0,
                    $label = progressBarEl.find('.app-progress-label');

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
                    } else {
                        displayValue = progressBarWidth = 0;
                    }
                }

                progressBarEl.css('width', progressBarWidth);
                if (!$label.length || (newDatavalue !== oldDatavalue)) {
                    // support for percentage / absolute displayformat in old project.
                    if (attrs.displayformat === DISPLAY_FORMAT.PERCENTAGE) {
                        displayValue = progressBarWidth;
                    } else if (attrs.displayformat !== DISPLAY_FORMAT.ABSOLUTE) {
                        displayValue = (displayValue.toFixed(getDecimalCount(scope.displayformat)));

                        if (_.includes(scope.displayformat, '%')) {
                            displayValue = displayValue + '%';
                        }
                    }

                    if ($label.length) {
                        $label.text(displayValue).attr('data-caption-placement', scope.captionplacement);
                    } else {
                        WM.element('<span class="app-progress-label"></span>').text(displayValue).attr('data-caption-placement', scope.captionplacement).appendTo(progressBarEl);
                    }
                }
            }

            // if the progress bar is multibar, create the multi-bar related nodes.
            function updateMultipleProgressBar(element, data, captionPlacement) {
                var typeField  = _.split(element.attr('type'), '.'),
                    valueField = _.split(element.attr('datavalue'), '.');
                _.forEach(data, function (barInfo) {
                    var cls = CLASSES[barInfo[_.last(typeField)]] || CLASSES.default,
                        val = barInfo[_.last(valueField)] + '%' || barInfo.value;
                    WM.element('<div class="multi-bar progress-bar"><span class="app-progress-label">' + val + '</span></div>').appendTo(element).addClass(cls).css('width', val);
                });
                updateCaptionPlacement(element, true, captionPlacement);
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
                            var _value = value.replace('bind:Variables.', '');
                            scope.boundServiceName = _value.substr(0, _value.indexOf('.'));
                            setupPolling(scope);
                        }
                    }
                });
            }

            function propertyChangeHandler(scope, element, attrs, progressBarEl, key, newVal, oldVal) {
                switch (key) {
                case 'minvalue':
                case 'maxvalue':
                    updateProgressBar(scope, attrs, progressBarEl);
                    break;
                case 'datavalue':
                    if (!(WM.isArray(scope.dataset))) {
                        scope.isMultipleBar = false;
                        element.children('.multi-bar').remove();
                        if (WM.isNumber(newVal) || WM.isString(newVal)) {
                            updateProgressBar(scope, attrs, progressBarEl, oldVal, newVal);
                        }
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
                case 'captionplacement':
                    updateCaptionPlacement(element, scope.isMultipleBar || false, newVal);
                    break;
                }

                if (WM.isArray(scope.dataset)) {
                    element.children('.multi-bar').remove();
                    scope.isMultipleBar = true;
                    updateMultipleProgressBar(element, scope.dataset, scope.captionplacement);
                }
            }

            return {
                'restrict': 'E',
                'scope'   : {},
                'replace' : true,
                'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/progress.html'),
                'link'    : {
                    'pre': function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        Object.defineProperty(scope, 'binddataset', {
                            'configurable': true
                        });
                    },
                    'post': function (scope, element, attrs) {
                        var progressBarEl = element.children().first();

                        defineProperties(scope);
                        if (attrs.dataset) {
                            if (Utils.stringStartsWith(attrs.dataset, 'bind:')) {
                                scope.binddataset = attrs.dataset;
                            }
                        }

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs, progressBarEl), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                }
            };
        }
    ]);



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
 *                  This is a bindable property.
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
 *                  array of objects(with keyes `type` and `value`) for multiple-bar, a number otherwise. <br>
 *                  This is a bindable property.
 * @param {number=} minvalue
 *                  minvalue of the progressbar. <br>
 *                  This is a bindable property.
 * @param {number=} maxvalue
 *                  maxvalue of the progressbar. <br>
 *                  This is a bindable property.
 * @param {string=} displayformat
 *                  Format(Absolute/Percentage) in which the progress needs to be displayed.
 * @param {number=} pollinterval
 *                  Time interval in milli seconds to poll the service.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <fieldset>
                    <legend>Single ProgressBar</legend>
                    <wm-composite>
                        <wm-label caption="Type:"></wm-label>
                        <wm-select scopedatavalue="type" scopedataset="types"></wm-select>
                    </wm-composite>
                    <wm-composite>
                        <wm-label caption="Type:"></wm-label>
                        <wm-checkbox scopedatavalue="show"></wm-text>
                    </wm-composite>
                    <wm-progress-bar type="bind:type"
                        height="24" datavalue="20"
                        on-click="f('click')"
                        on-dblclick="f('dblclick')"
                        show="bind:show">
                    </wm-progress-bar>
                    <br>
                    <div>single click count: {{clickCount}}</div>
                    <div>dbl click count: {{dblclickCount}}</div>
                    <br>
                </fieldset>
                <fieldset>
                    <legend>Multi ProgressBar</legend>
                     <wm-progress-bar type="bind:mutibarDataset.type"
                         height="24" dataset="bind:multibarDataset"
                         datavalue="bind:multibarDataset.value">
                     </wm-progress-bar>
                </fieldset>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.clickCount = $scope.dblclickCount = 0;

               $scope.show = true;

               $scope.types = ['default', 'default-striped', 'success', 'success-striped', 'info', 'info-striped', 'warning', 'warning-striped', 'danger', 'danger-striped'];
               $scope.type = ['default'];

               $scope.f = function (eventtype) {
                   $scope[eventtype + 'Count']++;
               }

               $scope.multibarDataset= [
                    {'type': 'danger', 'value': '20'},
                    {'type': 'warning', 'value': '20'},
                    {'type': 'info', 'value': '20'},
                    {'type': 'success', 'value': '20'}
               ];
            }
        </file>
    </example>
 */