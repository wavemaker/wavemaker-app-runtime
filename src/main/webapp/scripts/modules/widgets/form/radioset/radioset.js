/*global WM, _ */
/*Directive for radioset */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/radioset.html',
            '<ul class="app-radioset list-group" init-widget has-model apply-styles role="input" ng-required="required" listen-property="dataset"' +
                ' title="{{hint}}" ng-model="_model_" ng-change="_onChange({$event: $event, $scope: this})">' +
            '</ul>'
            );
    }])
    .directive('wmRadioset', ['PropertiesFactory', 'WidgetUtilService', '$compile', 'CONSTANTS', 'Utils', 'FormWidgetUtils', '$templateCache', 'LiveWidgetUtils', '$rootScope', function (PropertiesFactory, WidgetUtilService, $compile, CONSTANTS, Utils, FormWidgetUtils, $templateCache, LiveWidgetUtils, $rs) {
        'use strict';
        /*getting widget properties for the specific widget*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.radioset', ['wm.base', 'wm.base.editors.dataseteditors']),
            notifyFor = {
                'dataset'       : true,
                'displayfield'  : true,
                'datafield'     : true,
                'usekeys'       : true,
                'selectedvalue' : true,
                'disabled'      : true,
                'orderby'       : true,
                'layout'        : true
            };

        /*function to assign the values to the model variable based on the selectedvalue as provided.*/
        function assignModelValue(scope, radioOption) {
            if (radioOption) {
                if (scope.datafield === 'All Fields') {
                    if (scope.usekeys || !radioOption.dataObject) {
                        scope._model_ = radioOption.key;
                    } else {
                        scope._model_ = radioOption.dataObject;
                    }
                } else {
                    scope._model_ = radioOption.key;
                }
            } else if (WM.isDefined(scope.selectedvalue)) {
                scope._model_ = scope.selectedvalue;
            }
        }

        function constructRadioSet(scope, element, dataSet) {
            var template,
                compiledTemplate;

            FormWidgetUtils.extractDisplayOptions(dataSet, scope, element);
            assignModelValue(scope);

            template         = FormWidgetUtils.getRadiosetCheckboxsetTemplate(scope, 'radioset');
            compiledTemplate = $compile(template)(scope);
            element.empty().append(compiledTemplate);
        }

        // Define the property change handler. This function will be triggered when there is a change in the widget property
        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
            var dataSet = scope.dataset || scope.scopedataset,
                isBoundToServiceVariable;
            // Checking if widget is bound to service variable
            if (CONSTANTS.isStudioMode && scope.binddataset) {
                isBoundToServiceVariable = _.startsWith(scope.binddataset, 'bind:Variables.') && FormWidgetUtils.getBoundVariableCategory(scope) === "wm.ServiceVariable";
            }

            switch (key) {
            case 'dataset':
                // Displaying no data message when bound to service variable in studio mode
                if (isBoundToServiceVariable && CONSTANTS.isStudioMode) {
                    FormWidgetUtils.appendMessage(element);
                } else {
                    constructRadioSet(scope, element, newVal);
                }
                break;
            case 'datafield':
            case 'orderby':
                FormWidgetUtils.extractDisplayOptions(dataSet, scope, element);
                $rs.$safeApply(scope);
                break;
            case 'displayfield':
            case 'usekeys':
                if (CONSTANTS.isRunMode || !isBoundToServiceVariable) {
                    constructRadioSet(scope, element, dataSet);
                }
                break;
            case 'selectedvalue':
                assignModelValue(scope);
                FormWidgetUtils.updatedCheckedValues(scope);
                break;
            case 'disabled':
                element.find('input[type="radio"]').attr('disabled', newVal);
                break;
            case 'layout':
                element.removeClass(oldVal).addClass(newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {
                'scopedataset': '=?'
            },
            'replace': true,
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/radioset.html')),
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                if (!isWidgetInsideCanvas) {
                    WidgetUtilService.addEventAttributes(template, tAttrs, FormWidgetUtils.getProxyEventsMap());
                }
                return template[0].outerHTML;
            },
            'link': {
                'pre': function (iScope, $el, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    iScope.displayValue = '';
                },
                'post': function (scope, element, attrs) {
                    scope.eventProxy = FormWidgetUtils.eventProxy.bind(undefined, scope);
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                    // Called from form reset when users clicks on form reset
                    scope.reset = function () {
                        scope._model_ = '';
                    };

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    /* fields defined in scope: {} MUST be watched explicitly */
                    /*watching scopedataset attribute to create options for the checkboxset element.*/
                    if (!attrs.widgetid && attrs.scopedataset) {
                        scope.$watch('scopedataset', function () {
                            /*generating the radioset based on the values provided*/
                            constructRadioSet(scope, element, scope.scopedataset);
                        });
                    }
                    //In run mode, If widget is bound to selecteditem subset, fetch the data dynamically
                    if (!attrs.widgetid && _.includes(scope.binddataset, 'selecteditem.')) {
                        LiveWidgetUtils.fetchDynamicData(scope, element.scope(), function (data) {
                            constructRadioSet(scope, element, data);
                        });
                    }

                    element.removeAttr('tabindex');

                    if (!scope.widgetid) {
                        scope.$watch('_model_', function () {
                            FormWidgetUtils.updatedCheckedValues(scope);
                        });

                        element.on('click', '.app-radioset-label', function (evt) {
                            if (scope.disabled || scope.readonly || _.includes(evt.target.classList, 'caption')) {
                                return;
                            }
                            var dataObj = _.find(scope.displayOptions, {'isChecked': true}),

                            /*The input has id in the format scope.$id + index, so parse it and take the corresponding radioOption
                             from the dataKeys array*/
                                radioOption = WM.element(this).find('input').val(),
                                checkedDisplayOption;

                            // RadioOption should not be deselected when clicked again. Model and display value remains the same.
                            if (dataObj && (radioOption == dataObj.key)) {
                                return;
                            }

                            checkedDisplayOption = FormWidgetUtils.updateCheckedValue(radioOption, scope.displayOptions);

                            if (dataObj) {
                                dataObj.isChecked = false;
                            }

                            // set the checkedValue for selected option's key to true.
                            if (scope.groupFields && scope.checkedValues) {
                                scope.checkedValues[dataObj.key] = false;
                                scope.checkedValues[checkedDisplayOption.key] = true;
                            }

                            assignModelValue(scope, checkedDisplayOption);

                            Utils.triggerFn(scope._onChange, evt);
                            $rs.$safeApply(scope);
                        });
                    }
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmRadioset
 * @restrict E
 *
 * @description
 * The `wmRadioset` directive defines the radioset widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $compile
 * @requires CONSTANTS
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the radioset widget.
 * @param {string=} hint
 *                  Title/hint for the radioset. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of Radioset widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the radioset.
 * @param {string=} height
 *                  Height of the radioset.
 * @param {string=} layout
 *                  This property controls how contained widgets are displayed within this widget container. <br>
 *                  Possible values are "inline", "stacked".
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the Radioset widget from a variable defined in the script workspace. <br>
 * @param {string=} selectedvalue
 *                  This property defines the initial selected value of the Radioset widget.
 * @param {boolean=} usekeys
 *                   Use the keys of the live variable object as Radioset options.
 * @param {array||string=} scopedataset
 *                  This property accepts the options to create the Radioset widget from a variable defined in the script workspace.<br>
 *                  Defined variable can hold a comma separated string or an array.
 * @param {string=} dataset
 *                  This property accepts the options to create the Radioset widget from a wavemaker studio variable (live or static) which can hold object, array or string data.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by a Radioset widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the Radioset widget when the list is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the Radioset widget. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable.
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the radio widget readonly on the web page. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the Radioset widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the Radioset widget on the web page. <br>
 *                  Default value: `false`. <br>
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
 *                   <wm-label caption="Colors: "></wm-label>
 *                   <wm-radioset name="colorRadio" scopedatavalue="color" scopedataset=colors></wm-radioset>
 *               </wm-composite><br>
 *               <wm-composite>
 *                   <wm-label caption="Framework: "></wm-label>
 *                   <wm-radioset name="jsRadio" scopedatavalue="selectedItem" dataset="Backbone, CoffeeScript, Angular"></wm-radioset>
 *               </wm-composite><br>
 *
 *               <div>
 *                   <div style="font-weight: bold; color: {{color[0]}};">{{selectedItem}}</div>
 *                </div>
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
 *
 *              $scope.width = "100px";
 *              $scope.height= "30px";
 *
 *              $scope.colors = ["crimson", "green", "orange", "red"];
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */
