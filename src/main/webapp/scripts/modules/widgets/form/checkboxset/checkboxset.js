/*global WM, */
/*Directive for checkboxset */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/checkboxset.html',
            '<ul class="app-checkboxset list-group {{layout}}" init-widget has-model' +
                ' title="{{hint}}" ' +
                ' data-ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                ' data-ng-show="show" ' +
                ' data-ng-change="_onChange({$event: $event, $scope: this})"' + /* private method defined in this scope */
                $rootScope.getWidgetStyles() + ' >' +
                '</ul>'
            );
    }])
    .directive('wmCheckboxset', ['PropertiesFactory', 'WidgetUtilService', '$compile', 'CONSTANTS', 'Utils', function (PropertiesFactory, WidgetUtilService, $compile, CONSTANTS, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.checkboxset', ['wm.base', 'wm.booleaneditors']),
            notifyFor = {
                'dataset': true,
                'displayfield': true,
                'datafield': true,
                'usekeys': true,
                'selectedvalues': true,
                'disabled': true
            };


        /*
         * returns the display field
         */
        function getDisplayField(dataSet, changedDisplayField) {
            var displayField = changedDisplayField;
            /*if displayField is not set or set to all fields*/
            if (!displayField || displayField === 'All Fields') {
                /*if dataset is an array*/
                if (WM.isArray(dataSet) && dataSet.length > 0) {
                    /*if dataSet is an array of objects*/
                    if (WM.isObject(dataSet[0])) {
                        displayField = Object.keys(dataSet[0])[0];
                    } else {
                        displayField = '';
                    }
                } else if (WM.isObject(dataSet)) {
                    displayField = '';
                }
            }
            /* return dataValue to be the default key */
            return displayField;
        }

        /*
         * parse dataSet to filter the options based on the datafield, displayfield & displayexpression
         */
        function parseDataSet(dataSet, scope, changedDisplayField, changedDataField, useKeys, element) {
            /*store parsed data in 'data'*/
            var data = dataSet,
                parsedData,
                dataField = changedDataField,
                nullKey = '',
                objectKeys = [],
                displayField = getDisplayField(dataSet, changedDisplayField),
                showAllKeys = CONSTANTS.isStudioMode && element.attr('data-identifier') === 'chart-columns';

            scope.widgetProps.displayfield.value = displayField;

            /*parsing the dataSet only if it is an array*/
            if (WM.isArray(dataSet)) {
                /*if only keys of the object within dataset value needs to be used.*/
                if (useKeys) {
                    data = {};
                    /*Decides whether to get all the data fields of the object columns or not*/
                    if (showAllKeys && Utils.isValidDataSet(dataSet)) {
                        /*Passing the properties map also since it is not accessible through the dataset*/
                        objectKeys = WidgetUtilService.extractDataSetFields(dataSet, scope.dataset.propertiesMap);
                    } else {
                        /*getting keys of the object*/
                        objectKeys = WM.isObject(dataSet[0]) ? Object.keys(dataSet[0]) : [];
                    }
                    /*iterating over object keys and creating checkboxset dataset*/
                    WM.forEach(objectKeys, function (key) {
                        data[key] = key;
                    });
                    parsedData = data;
                } else {
                    /*if filter dataSet if datafield is select other than 'All Fields'*/
                    if (dataField) {
                        data = {};
                        if (dataField !== 'All Fields') {
                            WM.forEach(dataSet, function (option) {
                                data[WidgetUtilService.getEvaluatedData(scope, option, {fieldName: "displayfield", expressionName: "displayexpression"}, displayField)] = option[dataField];
                            });
                        } else {
                            WM.forEach(dataSet, function (option) {
                                data[WidgetUtilService.getEvaluatedData(scope, option, {fieldName: "displayfield", expressionName: "displayexpression"}, displayField)] = option;
                            });
                        }
                    }
                    parsedData = data;
                }
            } else if (WM.isObject(dataSet)) {
            /* check for supporting data from sources other than live variable */
                data = {};
                if (showAllKeys &&  Utils.isValidDataSet(dataSet)) {
                    objectKeys = WidgetUtilService.extractDataSetFields(dataSet, scope.dataset.propertiesMap);
                } else {
                    /*getting keys of the object*/
                    objectKeys = Object.keys(dataSet);
                }
                /*iterating over object keys and creating checkboxset dataset*/
                WM.forEach(objectKeys, function (key) {
                    data[key] = key;
                });
                parsedData = data;
            }
            return parsedData;
        }

        /*
         * update dataField, display field in the property panel
         */
        function updatePropertyPanelOptions(dataset, propertiesMap, scope) {
            var variableKeys = [];
            /* on binding of data*/
            if (dataset && WM.isObject(dataset)) {
                dataset = dataset[0] || dataset;
                variableKeys = WidgetUtilService.extractDataSetFields(dataset, propertiesMap) || [];
            }

            WM.forEach(variableKeys, function (variableKey, index) {
                if (dataset[variableKey] === null || WM.isObject(dataset[variableKey])) {
                    variableKeys.splice(index, 1);
                }
            });

            /* re-initialize the property values */
            if (scope.newcolumns) {
                scope.newcolumns = false;
                scope.datafield = 'All Fields';
                scope.displayfield = '';
                scope.$root.$emit("set-markup-attr", scope.widgetid, {'datafield': '', 'displayfield': ''});
            }

            scope.widgetProps.datafield.options = ['', 'All Fields'].concat(variableKeys);
            scope.widgetProps.displayfield.options = [''].concat(variableKeys);
        }

        /*function to assign the values to the model variable based on the selectedvalue as provided.*/
        function assignModelValue(scope, dataSet, checkboxValue) {
            var selectedValues = [];
            /*if checkboxValue is provided use that to assign model value else use the selectedvalue property if provided*/
            if (checkboxValue) {
                selectedValues.push(checkboxValue);
            } else if (scope.selectedvalues) {
                if (WM.isString(scope.selectedvalues) && scope.selectedvalues !== '') {
                    selectedValues = scope.selectedvalues.split(',');
                } else if (WM.isArray(scope.selectedvalues)) {
                    selectedValues = scope.selectedvalues;
                }
                scope._model_ = [];
            } else {
                if ((!selectedValues || selectedValues.length === 0) && !WM.isDefined(scope._model_)) {
                    scope._model_ = [];
                } else if (WM.isDefined(scope._model_)) {
                    scope._model_ = WM.isArray(scope._model_) ? scope._model_ : [scope._model_];
                } else {
                    scope._model_ = [];
                }
            }
            /*iterating over the selectedvalues to push to model*/
            WM.forEach(selectedValues, function (value) {
                value = WM.isString(value) ? value.trim() : value;
                /*if dataSet is string*/
                if (WM.isString(dataSet)) {
                    scope._model_.push(value);
                } else if (WM.isArray(dataSet)) {
                    /*if dataSet is array and array values are objects*/
                    if (WM.isObject(dataSet[0])) {
                        scope._model_.push(scope.dataObject[value]);
                    } else {
                        /*if dataSet is array*/
                        scope._model_.push(value);
                    }
                } else {
                    if (checkboxValue) {
                        /*if dataSet is object*/
                        scope._model_.push(scope.dataObject[value]);
                    } else {
                        scope._model_.push(value);
                    }
                }
            });
        }

        /*function to create the dataKeys from the dataSet provided based on the type of the dataSet.*/
        function createDataKeys(scope, dataSet) {
            /*checking if the dataSet is an array*/
            if (WM.isArray(dataSet)) {
                /*if array values are objects*/
                if (WM.isObject(dataSet[0])) {
                    WM.forEach(dataSet, function (data) {
                        /*getting the dataObject*/
                        scope.dataObject[data.name] = '';
                        scope.dataObject[data.name] = data.dataValue;
                    });
                    /*getting the dataKeys for creating the option texts*/
                    scope.dataKeys = Object.keys(scope.dataObject);
                } else {
                    scope.dataObject = dataSet;
                    /*getting the dataKeys for creating the option texts*/
                    scope.dataKeys = dataSet;
                }
            } else if (WM.isString(dataSet)) {
                /*getting the dataObject*/
                scope.dataObject = dataSet;
                /*getting the dataKeys for creating the option texts*/
                scope.dataKeys = scope.dataObject.split(',');
            } else if (WM.isObject(dataSet)) {
                /*getting the dataObject*/
                scope.dataObject = dataSet;
                /*getting the dataKeys for creating the option texts*/
                scope.dataKeys = Object.keys(scope.dataObject);
            }
        }

        /*function to create the widget template based on the dataKeys created.*/
        function createWidgetTemplate(scope) {
            var template = '';
            /*iterating over the keys to create the template for the widget.*/
            WM.forEach(scope.dataKeys, function (dataKey) {
                dataKey = WM.isString(dataKey) ? dataKey.trim() : dataKey;
                template = template +
                    '<li class="checkbox app-checkbox">' +
                    '<label class="app-checkboxset-label" data-ng-class="{\'disabled\':disabled, \'unchecked\': !valueInModel(_model_, dataObject[' + "'" + dataKey + "'" + '])}" title="' + dataKey + '">' +
                            '<input type="checkbox" ' + (scope.disabled ? ' disabled="disabled" ' : '') +  ' value="' + dataKey + '" data-ng-checked="_model_.indexOf(' + "'" + dataKey + "'" + ') !== -1 || _model_ === ' + "'" + dataKey + "'" + ' || valueInModel(_model_, dataObject[' + "'" + dataKey + "'" + '])"/>' +
                         '<span class="caption">'+ dataKey + '</span><img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" class="switch"/></label>' +
                    '</li>';
            });
            /*Holder for the model for submitting values in a form and a wrapper to for readonly mode*/
            template = template + '<input name="{{name}}" data-ng-disabled="disabled" data-ng-hide="true" class="model-holder" data-ng-model="_model_">'  + '<div data-ng-if="readonly || disabled" class="readonly-wrapper"></div>';
            return template;
        }

        function constructCheckboxSet(scope, element, dataSet) {
            var template,
                compiledTemplate,
                parseData,
                useKeys = scope.usekeys;
            scope.dataObject = {};
            scope.dataKeys = [];
            /*assign dataSet according to liveVariable or other variable*/
            dataSet = dataSet ? dataSet.data || dataSet : [];
            /*filter the dataSet based on datafield & displayfield*/

            parseData = WM.isString(scope.dataset || scope.scopedataset) ||
                (WM.isArray(scope.dataset) && !WM.isObject(scope.dataset[0])) ||
                (WM.isArray(scope.scopedataset) && !WM.isObject(scope.scopedataset[0])) ? false : true;

            if (parseData) {
                dataSet = parseDataSet(dataSet, scope, scope.displayfield, scope.datafield, useKeys, element);
            }

            /*creating dataKeys using the dataSet*/
            createDataKeys(scope, dataSet);

            /*assigning the value to the model, if selectedvalues are provided*/
            assignModelValue(scope, dataSet);

            /*creating the template for the widget*/
            template = createWidgetTemplate(scope);
            compiledTemplate = $compile(template)(scope);
            element.empty().append(compiledTemplate);

            /*register a click event handler for the radio*/
            element.find('.app-checkboxset-label').on('click', function () {
                var checkedOption, inputElements = element.find('input:checked');
                scope._model_ = [];

                inputElements.each(function () {
                    checkedOption = WM.element(this).val();
                    assignModelValue(scope, dataSet, checkedOption);
                });

                /*updating the selectedvalues if the model array has values*/
                /* TODO - to remove this condition (temporary fix to support chart properties in studio mode)*/
                if (CONSTANTS.isStudioMode) {
                    scope.selectedvalues = scope._model_.join(',');
                }

                /*triggering the change event of the input*/
                Utils.triggerFn(scope._onChange);
                scope.$root.$safeApply(scope);
            });
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            var dataSet,
                newDataset = Utils.getValidJSON(scope.dataset),
                validNewVal = Utils.getValidJSON(newVal);
            /*When an object comes as string, parsing it to object*/
            if (newDataset) {
                scope.dataset = newDataset;
            }
            if (validNewVal) {
                newVal = validNewVal;
            }
            dataSet = scope.dataset || scope.scopedataset;
            /*Monitoring changes for properties and accordingly handling respective changes.*/
            switch (key) {
            case 'dataset':
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && WM.isDefined(newVal) && newVal !== null) {
                    updatePropertyPanelOptions(newVal.data || newVal, newVal.propertiesMap, scope);
                }
                /*generating the radioset based on the values provided*/
                constructCheckboxSet(scope, element, newVal);
                break;
            case 'displayfield':
            case 'datafield':
            case 'usekeys':
            case 'selectedvalues':
                /*generating the radioset based on the values provided*/
                constructCheckboxSet(scope, element, dataSet);
                break;
            case 'disabled':
                element.find('input[type="checkbox"]').attr('disabled', newVal);
                break;
            }
        }

        /* checks if the given value object is in the given model array of objects */
        function valueInModel(model, value) {
            return (value && WM.isArray(model) && model.some(function (el) {
                return WM.equals(value, el);
            }));
        }

        return {
            'restrict': 'E',
            'scope': {
                'scopedataset': '=?'
            },
            'replace': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/form/checkboxset.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
                    },
                    'post': function (scope, element, attrs) {

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        /* fields defined in scope: {} MUST be watched explicitly */
                        /*watching scopedataset attribute to create options for the checkboxset element.*/
                        if (!attrs.widgetid) {
                            scope.$watch('scopedataset', function () {
                                if (scope.scopedataset) {
                                    var newScopeDataset = Utils.getValidJSON(scope.scopedataset);
                                    /*When an object comes as string, parsing it to object*/
                                    if (newScopeDataset) {
                                        scope.scopedataset = newScopeDataset;
                                    }
                                    /*generating the radioset based on the values provided*/
                                    constructCheckboxSet(scope, element, scope.scopedataset);
                                }
                            });
                        }

                        /* checks if the given value object is in the given model */
                        scope.valueInModel = valueInModel;

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
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
 * @param {array||string=} scopedataset
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
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>change count: {{changeCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="Colors: "></wm-label>
 *                   <wm-checkboxset scopedatavalue="color" scopedataset=colors></wm-checkboxset>
 *               </wm-composite><br>
 *               <wm-composite>
 *                   <wm-label caption="Framework: "></wm-label>
 *                   <wm-checkboxset scopedatavalue="selectedItem" dataset="Backbone, CoffeeScript, Angular"></wm-checkboxset>
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
