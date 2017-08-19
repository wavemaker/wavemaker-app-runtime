/*global WM, _ */
/*jslint nomen:true*/
/*Directive for Select */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/select.html',
            '<select init-widget has-model listen-property="dataset" class="form-control app-select" apply-styles role="input" focus-target' +
                ' ng-model="modelProxy"' + /* proxy-object is updated in the onChangeProxy function*/
                ' title="{{hint}}"' +
                ' ng-readonly="readonly" ' +
                ' ng-disabled="disabled"' +
                ' ng-required="required"' +
                ' accesskey="{{::shortcutkey}}"' +
                ' ng-change="onChangeProxy({$event: $event, $scope: this})"' + /* wrapper to _onChange function to update the model-proxy*/
                ' ng-options="option.key as $root.locale[option.value] || option.value for option in displayOptions">' +
                '<option selected value="" ng-if="placeholder">{{placeholder}}</option>' +
            '</select>'
                );
    }])
    .directive('wmSelect', ['PropertiesFactory', 'WidgetUtilService', 'FormWidgetUtils', 'Utils', 'LiveWidgetUtils', function (PropertiesFactory, WidgetUtilService, FormWidgetUtils, Utils, LiveWidgetUtils) {
        'use strict';

        /*Obtaining properties specific to select widget by extending from all editor related widget properties*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.select', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.editors.dataseteditors', 'wm.base.events.keyboard']),
            notifyFor = {
                'dataset'           : true,
                'multiple'          : true,
                'active'            : true,
                'displayfield'      : true
            },
            ALLFIELDS = 'All Fields';

        function assignModelValue(scope) {
            if (scope.multiple) {
                FormWidgetUtils.assignModelForMultiSelect(scope);
            } else {
                FormWidgetUtils.assignModelForSelected(scope);
            }
        }

        /*function to create the options for the select widget, based on the different configurations that can be provided.
         Options can be provided as
         * 1. comma separated string, which is captured in the options property of the scope
         * 2. application scope variable which is assigned to the dataSet attribute of the select widget from the studio.
         * 3. a wm-studio-variable which is bound to the widget's dataSet property.*/
        function createSelectOptions(dataset, scope, element) {
            FormWidgetUtils.extractDisplayOptions(dataset, scope, element);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            switch (key) {
            case 'dataset':
                createSelectOptions(scope.dataset, scope, element);
                break;
            case 'multiple':
                attrs.$set('multiple', newVal);
                if (scope.widgetid) {
                    scope.widgetProps.datavalue.isList = newVal;
                }
                break;
            case 'active':
                /*listening on 'active' property, as losing the properties during page switch*/
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && scope.dataset && newVal) {
                    WidgetUtilService.updatePropertyPanelOptions(scope);
                }
                break;
            case 'displayfield':
                if (scope.widgetid) {
                    createSelectOptions(scope.dataset, scope, element);
                }
                break;
            }
        }

        /* proxy method for onChange event */
        function onChangeProxy(scope, args) {
            var prevSelectedOption,
                dataField = scope.datafield;

            // modelProxy should not change when select is set to readonly.
            if (scope.readonly) {
                if (dataField && dataField !== ALLFIELDS) {
                    scope.modelProxy = scope._model_;
                } else {
                    prevSelectedOption = _.find(scope.displayOptions, function (opt) {
                        return _.isEqual(opt.dataObject, scope._model_);
                    });
                    scope.modelProxy = prevSelectedOption.key;
                }
                return;
            }

            assignModelValue(scope);
            if (WM.isFunction(scope._onChange)) {
                scope._onChange({$event: args.$event, $scope: args.$scope});
            }
        }

        /* function which will be triggered on change of scopedataset */
        function scopeDatasetWatcher(scope, element) {
            /*if studio-mode, then update the displayField & dataField in property panel*/
            if (scope.widgetid) {
                WidgetUtilService.updatePropertyPanelOptions(scope);
            }
            createSelectOptions(scope.scopedataset, scope, element);
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'scopedataset': '=?'
            },
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/form/select.html'),
            'link': {
                'pre': function (iScope, $el, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    iScope.orderedKeys = [];
                    // This flag is used in formWidgetUtils to assign modelProxy value for select widget.
                    iScope._isModelProxyRequired = true;
                },
                'post': function (iScope, element, attrs) {

                    // expose the `changeLocale` method defined on $rootScope as `changeAppLocale` on widget scope.
                    var scope = element.scope();
                    scope.changeAppLocale = scope.$root.changeLocale;

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, iScope, element, attrs), iScope, notifyFor);

                    /*decorate onChange function*/
                    iScope.onChangeProxy = onChangeProxy.bind(undefined, iScope);
                    iScope.assignModelValue = assignModelValue;

                    /*Called from form reset when users clicks on form reset*/
                    iScope.reset = function () {
                        //TODO implement custom reset logic here
                        iScope._reset  = true;
                        iScope._model_ = '';
                    };

                    /*Executing WidgetUtilService method to initialize the widget with the essential configurations.*/
                    WidgetUtilService.postWidgetCreate(iScope, element, attrs);

                    /* fields defined in scope: {} MUST be watched explicitly */
                    /*watching scopedataset attribute to create options for the select element.*/
                    if (!attrs.widgetid) {
                        iScope.$watch('_model_', function () {
                            if (iScope._reset) {
                                element.find('option').removeAttr('selected');
                                if (iScope.placeholder) {
                                    element.find('option:first').attr('selected', 'selected');
                                }
                                iScope._reset = false;
                                return;
                            }
                            FormWidgetUtils.updatedCheckedValues(iScope);
                        }, false);

                        if (attrs.scopedataset) {
                            iScope.$watch('scopedataset', scopeDatasetWatcher.bind(undefined, iScope, element));
                        }
                    }
                    //In run mode, If widget is bound to selecteditem subset, fetch the data dynamically
                    if (!attrs.widgetid && _.includes(iScope.binddataset, 'selecteditem.')) {
                        LiveWidgetUtils.fetchDynamicData(iScope, scope, function (data) {
                            createSelectOptions(data, iScope, element);
                        });
                    }
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmSelect
 * @restrict E
 *
 * @description
 * The `wmSelect` directive defines the select widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $timeout
 *
 * @param {string=} name
 *                  Name of the select widget.
 * @param {string=} hint
 *                  Title/hint for the select. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of select widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the select.
 * @param {string=} height
 *                  Height of the select.
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the select widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the initial selected value of the select widget.
 * @param {array||string=} scopedataset
 *                  This property accepts the options to create the select widget from a variable defined in the script workspace.<br>
 *                  Defined variable can be a comma separated string or an array.
 * @param {string=} dataset
 *                  This property accepts the options to create the select widget from a wavemaker studio variable which is of datatype entry.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by the select widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the select widget when the list is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the  select widget drop-down list. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable.
 * @param {boolean=} required
 *                  This property will be used to validate the state of the select widget when used inside a form widget.
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} readonly
 *                  Readonly is a bindable property. <br>
 *                  This property will be used to make the select widget non-editable on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} multiple
 *                  When this value is set to true multiple options can be selected from select widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the select widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the select widget on the web page. <br>
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
 * @param {string=} placeholder
 *                  Placeholder for the selectbox.
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
 *                   <wm-select scopedatavalue="color" scopedataset=colors><wm-select>
 *               </wm-composite><br>
 *               <wm-composite>
 *                   <wm-label caption="Framework: "></wm-label>
 *                   <wm-select scopedatavalue="selectedItem" dataset="Backbone, CoffeeScript, Angular"><wm-select>
 *               </wm-composite><br>
 *
 *               <div style="width: {{width}};">
 *                   <div style="font-weight: bold; color: {{color}};">{{selectedItem}}</div>
 *                </div>
 *               <wm-composite>
 *                      <wm-label caption="placeholder:"></wm-label>
 *                      <wm-text scopedatavalue="placeholder"></wm-text>
 *                  </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="caption:"></wm-label>
 *                   <wm-text scopedatavalue="caption"></wm-text>
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

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmSelectLocale
 * @restrict E
 *
 * @description
 * The `wmSelectLocale` directive defines the select locale widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $timeout
 *
 * @param {string=} name
 *                  Name of the select locale widget.
 * @param {string=} hint
 *                  Title/hint for the select locale. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of select locale widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the select locale.
 * @param {string=} height
 *                  Height of the select locale.
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the select locale widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the initial selected value of the select locale widget.
 * @param {array||string=} scopedataset
 *                  This property accepts the options to create the select locale widget from a variable defined in the script workspace.<br>
 *                  Defined variable can be a comma separated string or an array.
 * @param {string=} dataset
 *                  This property accepts the options to create the select locale widget from a wavemaker studio variable which is of datatype entry.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by the select locale widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the select locale widget when the list is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the  select locale widget drop-down list. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable.
 * @param {boolean=} required
 *                  This property will be used to validate the state of the select locale widget when used inside a form widget.
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} readonly
 *                  Readonly is a bindable property. <br>
 *                  This property will be used to make the select locale widget non-editable on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} multiple
 *                  When this value is set to true multiple options can be selected from select locale widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the select locale widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the select locale widget on the web page. <br>
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
 * @param {string=} placeholder
 *                  Placeholder for the selectbox.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *
 *               <wm-composite>
 *                   <wm-label caption="Languages: "></wm-label>
 *                   <wm-select scopedatavalue="language" scopedataset=languages><wm-select>
 *               </wm-composite><br>
 *
 *               <wm-composite>
 *                      <wm-label caption="language:"></wm-label>
 *                      <wm-text scopedatavalue="language"></wm-text>
 *                  </wm-composite>
 *               <wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *
 *              $scope.width = "100px";
 *              $scope.height= "30px";
 *
 *              $scope.languages = ["en", "de"];
 *
 *           }
 *       </file>
 *   </example>
 */

