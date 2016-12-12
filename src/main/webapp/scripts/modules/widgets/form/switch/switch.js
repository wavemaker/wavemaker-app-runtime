/*global WM, _ */
/*Directive for switch */

WM.module('wm.widgets.form')
    .run([
        '$templateCache',

        function ($templateCache) {
            'use strict';
            $templateCache.put('template/widget/form/switch.html',
                '<div class="app-switch" init-widget has-model apply-styles role="input" listen-property="dataset">' +
                    '<div class="btn-group btn-group-justified">' +
                        '<a title="{{opt[displayfield || \'label\']}}" focus-target href="javascript:void(0);" role="button" class="btn btn-default" name="wm-switch-{{opt}}" ng-disabled="disabled" ' +
                            ' ng-repeat="opt in options track by $index" ng-class="{\'selected\': selected.index === $index}"' +
                            ' ng-click="selectOpt($event, $index)">{{opt[displayfield || "label"]}}</a>' +
                    '</div>' +
                    '<span title="{{options[selected.index][displayfield || \'label\'] || _model_}}" class="btn btn-primary app-switch-overlay switch-handle" >{{options[selected.index][displayfield || "label"] || _model_}}</span>' +
                    '<input name={{name}} class="model-holder ng-hide" ng-disabled="disabled" value="{{_model_}}"  ng-required="required">' +
                '</div>'
                );
        }
    ])
    .directive('wmSwitch', [
        'PropertiesFactory',
        'WidgetUtilService',
        'FormWidgetUtils',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, FormWidgetUtils, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.switch', ['wm.base', 'wm.base.editors.abstracteditors']),
                notifyFor = {
                    'dataset': true
                },
                COMMA_SEP_STRING = 1,
                ARRAY_STRINGS = 2,
                ARRAY_OBJECTS = 3,
                NONE = 0;

            function trim(str) {
                if (WM.isString(str)) {
                    return str.trim();
                }
                return str;
            }

            function toOptionsObjFromString(str) {
                return {
                    'value': str,
                    'label': str
                };
            }

            function setSelectedValue(scope) {
                var options = scope.options;
                if (scope._model_ !== undefined && scope._model_ !== null) {
                    options.some(function (opt, index) {

                        if (_.isEqual(scope._model_, opt)
                                || scope._model_ === opt[scope.datafield]
                                || scope._model_ === opt.value) {

                            scope.selected.index = index;

                            return true;
                        }
                    });
                } else {
                    //If no value is provided, set first value as default if options are available else set -1 ie no selection
                    if (scope.options && scope.options.length) {
                        scope.selectOptAtIndex(0);
                    } else {
                        scope.selected.index = -1;
                    }
                }
            }

            function updateHighlighter(scope, element, skipAnimation) {
                var handler = element.find('span.app-switch-overlay'),
                    left,
                    index = scope.selected.index;
                if (index === undefined || index === null) {
                    index = -1;
                }
                left = index * scope.btnwidth;
                if (skipAnimation) {
                    handler.css('left', left + '%');
                } else {
                    handler.animate({
                        left: left + '%'
                    }, 300);
                }
            }

            function updateSwitchOptions(scope, element, dataset) {
                var options = [];

                scope.selected.index = -1;
                scope.datasetType = NONE;
                dataset = dataset ? dataset.data || dataset : [];

                if (WM.isString(dataset)) { // comma separated strings
                    options = dataset.split(',').map(trim).map(toOptionsObjFromString);
                    scope.datasetType = COMMA_SEP_STRING;
                } else if (WM.isObject(dataset)) { // array or object
                    if (WM.isArray(dataset)) { // array
                        dataset = FormWidgetUtils.getOrderedDataSet(dataset, scope.orderby);
                        if (WM.isString(dataset[0])) { // array of strings
                            options = dataset.map(trim).map(toOptionsObjFromString);
                            scope.datasetType = ARRAY_STRINGS;
                        } else if (WM.isObject(dataset[0]) && !WM.isArray(dataset[0])) { // array of objects
                            options = dataset;
                            scope.datasetType = ARRAY_OBJECTS;
                        }
                    }
                }

                if (options.length) {
                    scope.btnwidth = (100 / options.length);
                    element.find('.app-switch-overlay').css('width', scope.btnwidth + '%');
                }

                scope.options = options;

                setSelectedValue(scope);
                updateHighlighter(scope, element, true);
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(scope, element, key, newVal) {
                switch (key) {
                case 'dataset':
                    updateSwitchOptions(scope, element, newVal);
                    break;
                }
            }

            return {
                'restrict': 'E',
                'replace' : true,
                'scope'   : {'scopedataset': '=?'},
                'template': function (tElement, tAttrs) {
                    var template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/form/switch.html', tElement, tAttrs));
                    return template[0].outerHTML;
                },
                'link': {
                    'pre': function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function (scope, element, attrs) {

                        scope.options = [];

                        scope.selectOptAtIndex = function ($index) {
                            var opt = scope.options[$index];
                            if (scope.datasetType === ARRAY_OBJECTS) {
                                if (scope.datafield) {
                                    if (scope.datafield === 'All Fields') {
                                        scope._model_ = opt;
                                    } else {
                                        scope._model_ = opt[scope.datafield];
                                    }
                                }
                            } else {
                                scope._model_ = opt.value;
                            }
                        };

                        scope.selectOpt = function ($event, $index) {

                            $event.preventDefault();

                            if (scope.disabled) {
                                return;
                            }

                            if (scope.selected.index === $index) {
                                if (scope.options.length === 2) {
                                    $index = $index === 1 ? 0 : 1;
                                } else {
                                    return;
                                }
                            }
                            scope.selected.index = $index;

                            scope.selectOptAtIndex($index);
                            updateHighlighter(scope, element);

                            scope._onChange($event);
                        };

                        scope.$watch('_model_', function () {
                            setSelectedValue(scope);
                            updateHighlighter(scope, element, true);
                        });

                        scope.selected = {};

                        /*Called from form reset when users clicks on form reset*/
                        scope.reset = function () {
                            if (scope.options.length > 0) {
                                scope.datavalue = scope.options[0].value;
                                scope.selected.index = 0;
                            }
                        };

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);


                        /* fields defined in scope: {} MUST be watched explicitly */
                        if (!attrs.widgetid && attrs.scopedataset) {
                            scope.$watch('scopedataset', function (newVal) {
                                /*generating the radioset based on the values provided*/
                                updateSwitchOptions(scope, element, newVal);
                            });
                        }
                    }
                }
            };
        }]);
/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmSwitch
 * @restrict E
 *
 * @description
 * The `wmSwitch` directive defines the switch widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the switch widget.
 * @param {string=} hint
 *                  Title/hint for the switch. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of switch widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the switch.
 * @param {string=} height
 *                  Height of the switch.
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the switch widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property will be used to set the initial state of the switch widget. <br>
 *                  Possible values are 'on' , 'off'
 *                  Default value: `on`. <br>
 * @param {string=} scopedataset
 *                  This property accepts the value for the switch widget from a variable defined in the script workspace. <br>
 * @param {string=} dataset
 *                  This property defines two states of switch. Comma separated values example: On, Off <br>
 *                  Default value: `On, Off`. <br>
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by a switch widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the switch widget when the list is populated using the dataSet property.
 * @param {boolean=} required
 *                   This property will be used to validate the state of the switch widget when used inside a form widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the switch widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                   Disabled is a bindable property. <br>
 *                   This property will be used to disable/enable the switch widget on the web page. <br>
 *                   Default value: `false`. <br>
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
 *               <div>single click count: {{clickCount}}</div>
 *               <div>change count: {{changeCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="{{switchlabel}}"></wm-label>
 *                   <wm-switch
 *                       hint="hint/title for switch"
 *                       scopedataset="switchoptions"
 *                       on-click="f('click');"
 *                       on-change="f('change');"
 *                       on-focus="f('focus');"
 *                       on-blur="f('blur');"
 *                       on-mouseenter="f('mouseenter');"
 *                       on-mouseleave="f('mouseleave')"
 *                       width="{{width}}"
 *                       height="{{height}}">
 *                   </wm-switch>
 *               </wm-composite>
 *
 *               <div>Switch state: {{favitem1}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="Options"></wm-label>
 *                   <wm-text scopedatavalue="switchoptions" placeholder="enter comma separated values"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="width:"></wm-label>
 *                   <wm-text scopedatavalue="width"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="height:"></wm-label>
 *                   <wm-text scopedatavalue="height"></wm-text>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.changeCount =
 *              $scope.mouseenterCount =
 *              $scope.mouseleaveCount =
 *              $scope.focusCount =
 *              $scope.blurCount = 0;
 *              $scope.favcolors = [];
 *
 *              $scope.width = "120px";
 *              $scope.height= "30px";
 *
 *              $scope.switchoptions = "on,off";
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */