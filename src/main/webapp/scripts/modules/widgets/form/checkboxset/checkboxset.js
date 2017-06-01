/*global WM, _ */
/*Directive for checkboxset */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/checkboxset.html',
            '<ul class="app-checkboxset list-group" init-widget has-model apply-styles role="input" listen-property="dataset"' +
                ' title="{{hint}}" ' +
                ' ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                ' ng-change="_onChange({$event: $event, $scope: this})">' +
                '</ul>'
            );
    }])
    .directive('wmCheckboxset', ['PropertiesFactory', 'WidgetUtilService', '$compile', 'CONSTANTS', 'Utils', 'FormWidgetUtils', '$templateCache', 'LiveWidgetUtils', function (PropertiesFactory, WidgetUtilService, $compile, CONSTANTS, Utils, FormWidgetUtils, $templateCache, LiveWidgetUtils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.checkboxset', ['wm.base', 'wm.base.editors.dataseteditors']),
            notifyFor = {
                'dataset'       : true,
                'displayfield'  : true,
                'datafield'     : true,
                'usekeys'       : true,
                'selectedvalues': true,
                'disabled'      : true,
                'orderby'       : true,
                'layout'        : true
            };

        /*function to assign the values to the model variable based on the selectedvalue as provided.*/
        function assignModelValue(scope, checkboxOption) {
            if (checkboxOption) {
                if (scope.datafield === 'All Fields') {
                    if (scope.usekeys || !checkboxOption.dataObject) {
                        scope._model_.push(checkboxOption.key);
                    } else {
                        scope._model_.push(checkboxOption.dataObject);
                    }
                } else {
                    scope._model_.push(checkboxOption.key);
                }
            } else if (WM.isDefined(scope.selectedvalues)) {
                scope._model_ = Utils.convertToArray(scope.selectedvalues);
            }
        }

        function constructCheckboxSet(scope, element, dataSet) {
            var template,
                compiledTemplate,
                $headerEle;

            FormWidgetUtils.extractDisplayOptions(dataSet, scope);

            template         = FormWidgetUtils.getRadiosetCheckboxsetTemplate(scope, 'checkboxset');
            compiledTemplate = $compile(template)(scope);
            element.empty().append(compiledTemplate);

            if (CONSTANTS.isStudioMode && scope.groupFields) {
                $headerEle = element.closest('.property-value').find('.fixed-header');
                FormWidgetUtils.setFixedHeader(element, $headerEle);
            }
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
            var dataSet,
                isBoundToServiceVariable;

            dataSet = scope.dataset || scope.scopedataset;

            //Checking if widget is bound to service variable
            if (CONSTANTS.isStudioMode && scope.binddataset) {
                isBoundToServiceVariable = _.startsWith(scope.binddataset, 'bind:Variables.') && FormWidgetUtils.getBoundVariableCategory(scope) === "wm.ServiceVariable";
            }
            /*Monitoring changes for properties and accordingly handling respective changes.*/
            switch (key) {
            case 'dataset':
                // Displaying no data message when bound to service variable in studio mode
                if (isBoundToServiceVariable && CONSTANTS.isStudioMode) {
                    FormWidgetUtils.appendMessage(element);
                } else {
                    constructCheckboxSet(scope, element, newVal);
                }
                break;
            case 'datafield':
            case 'orderby':
                FormWidgetUtils.extractDisplayOptions(dataSet, scope);
                scope.$root.$safeApply(scope);
                break;
            case 'displayfield':
            case 'usekeys':
                if (CONSTANTS.isRunMode || !isBoundToServiceVariable) {
                    constructCheckboxSet(scope, element, dataSet);
                }
                break;
            case 'selectedvalues':
                assignModelValue(scope);
                FormWidgetUtils.updatedCheckedValues(scope);
                break;
            case 'disabled':
                element.find('input[type="checkbox"]').attr('disabled', newVal);
                break;
            case 'layout':
                element.removeClass(oldVal).addClass(newVal);
                break;
            }
        }
        return {
            'restrict': 'E',
            'scope'   : {'scopedataset': '=?'},
            'replace' : true,
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/checkboxset.html')),
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                if (!isWidgetInsideCanvas) {
                    WidgetUtilService.addEventAttributes(template, tAttrs, FormWidgetUtils.getProxyEventsMap());
                }
                return template[0].outerHTML;
            },
            'link': {
                'pre': function (iScope, $el, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    iScope.displayValue = [];
                },
                'post': function (scope, element, attrs) {
                    scope.eventProxy = FormWidgetUtils.eventProxy.bind(undefined, scope);
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                    scope.groupFields = attrs.groupFields || false;

                    // Called from form reset when users clicks on form reset
                    scope.reset = function () {
                        scope._model_ = [];
                    };

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    /* fields defined in scope: {} MUST be watched explicitly */
                    /*watching scopedataset attribute to create options for the checkboxset element.*/
                    if (!attrs.widgetid && attrs.scopedataset) {
                        scope.$watch('scopedataset', function () {
                            if (scope.scopedataset) {
                                scope.dataset = scope.scopedataset;
                            }
                        }, true);
                    }
                    //In run mode, If widget is bound to selecteditem subset, fetch the data dynamically
                    if (!attrs.widgetid && _.includes(scope.binddataset, 'selecteditem.')) {
                        LiveWidgetUtils.fetchDynamicData(scope, element.scope(), function (data) {
                            constructCheckboxSet(scope, element, data);
                        });
                    }

                    element.removeAttr('tabindex');

                    if (!scope.widgetid) {
                        scope.$watch('_model_', function () {
                            FormWidgetUtils.updatedCheckedValues(scope);
                        }, false);

                        element.on('click', '.app-checkboxset-label', function (evt) {
                            if (_.includes(evt.target.classList, 'caption')) {
                                return;
                            }

                            // reset all the isChecked flags.
                            _.forEach(scope.displayOptions, function (dataObj) {
                                dataObj.isChecked = false;
                            });

                            if (scope.groupFields && scope.checkedValues) {
                                scope.checkedValues = {};
                            }

                            var checkedOption,
                                inputElements = element.find('input:checked');
                            scope._model_ = [];

                            inputElements.each(function () {
                                checkedOption = WM.element(this).val();

                                // set isChecked flag for displayOptions.
                                var checkedDisplayOption = FormWidgetUtils.updateCheckedValue(checkedOption, scope.displayOptions);

                                // set the checkedValue for selected option's key to true.
                                if (scope.groupFields && scope.checkedValues) {
                                    scope.checkedValues[checkedDisplayOption.key] = true;
                                }

                                assignModelValue(scope, checkedDisplayOption);
                            });

                            /*updating the selectedvalues if the model array has values*/
                            /* TODO - to remove this condition (temporary fix to support chart properties in studio mode)*/
                            if (CONSTANTS.isStudioMode) {
                                if (_.isArray(scope._model_) && _.isObject(scope._model_[0])) {
                                    return;
                                }
                                scope.selectedvalues = scope._model_.join(',');
                            }

                            Utils.triggerFn(scope._onChange, evt);
                            scope.$root.$safeApply(scope);
                        });
                    }
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmCheckboxset
 * @restrict E
 *
 * @description
 * The `wmCheckboxset` directive defines the checkboxset widget.
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
 *                  Name of the checkboxset widget.
 * @param {string=} hint
 *                  Title/hint for the checkboxset. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of Checkboxset widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the checkboxset.
 * @param {string=} height
 *                  Height of the checkboxset.
 * @param {string=} layout
 *                  This property controls how contained checkboxes are displayed within the widget container. <br>
 *                  Possible values are "inline", "stacked"
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the Checkboxset widget from a variable defined in the script workspace. <br>
 * @param {string=} selectedvalues
 *                  This property defines the initial selected values of the checkboxset widget. <br>
 *                  Defined variable can hold a comma separated string or an array.
 * @param {object||string=} scopedataset
 *                  This property accepts the options to create the checkboxset widget from a variable defined in the script workspace.<br>
 *                  Defined variable can hold a comma separated string or an array.
 * @param {string=} dataset
 *                  This property accepts the options to create the checkboxset widget from a wavemaker studio variable (live or static) which can hold object, array or string data.
 * @param {boolean=} usekeys
 *                   Use the keys of the live variable object as checkboxset options.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by a checkboxset widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the checkboxset widget when the list is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the checkboxset widget. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable.
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the checkboxset widget readonly on the web page. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the checkboxset widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the checkboxset widget on the web page. <br>
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <div>single click count: {{clickCount}}</div>
                <div>change count: {{changeCount}}</div>
                <div>mouse enter count: {{mouseenterCount}}</div>
                <div>mouse leave count: {{mouseleaveCount}}</div>
                <div>focus count: {{focusCount}}</div>
                <div>blur count: {{blurCount}}</div>

                <wm-composite>
                    <wm-label caption="Colors: "></wm-label>
                    <wm-checkboxset scopedatavalue="color" scopedataset=colors></wm-checkboxset>
                </wm-composite><br>
                <wm-composite>
                    <wm-label caption="Framework: "></wm-label>
                    <wm-checkboxset scopedatavalue="selectedItem" dataset="Backbone, CoffeeScript, Angular"></wm-checkboxset>
                </wm-composite><br>

                <div>
                    <div style="font-weight: bold; color: {{color[0]}};">{{selectedItem}}</div>
                 </div>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.clickCount =
               $scope.changeCount =
               $scope.mouseenterCount =
               $scope.mouseleaveCount =
               $scope.focusCount =
               $scope.blurCount = 0;

               $scope.width = "100px";
               $scope.height= "30px";

               $scope.colors = ["crimson", "green", "orange", "red"];

               $scope.f = function (eventtype) {
                   $scope[eventtype + 'Count']++;
               }
            }
        </file>
   </example>
 */
