/*global WM, */
/*Directive for radioset */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/radioset.html',
            '<ul class="app-radioset list-group {{layout}}" init-widget has-model' +
                ' title="{{hint}}" ' +
                ' data-ng-model="_model_"' +
                ' data-ng-show="show"' +
                ' data-ng-change="_onChange({$event: $event, $scope: this})"' + /* private method defined in this scope */
                $rootScope.getWidgetStyles() + ' >' +
                '</ul>'
            );
    }])
    .directive('wmRadioset', ['PropertiesFactory', 'WidgetUtilService', '$compile', 'CONSTANTS', 'Utils', function (PropertiesFactory, WidgetUtilService, $compile, CONSTANTS, Utils) {
        'use strict';
        /*getting widget properties for the specific widget*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.radioset', ['wm.base', 'wm.booleaneditors']),
            notifyFor = {
                'dataset': true,
                'displayfield': true,
                'datafield': true,
                'usekeys': true,
                'selectedvalue': true,
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
        function parseDataSet(dataSet, scope, changedDisplayField, changedDataField, useKeys) {
            /*store parsed data in 'data'*/
            var data = dataSet,
                parsedData,
                objectKeys = [],
                dataField = changedDataField,
                displayField = getDisplayField(dataSet, changedDisplayField);

            scope.widgetProps.displayfield.value = displayField;

            if (WM.isArray(dataSet)) {
                /*if only keys of the object within dataset value needs to be used.*/
                if (useKeys) {
                    data = {};
                    /*getting keys of the object*/
                    objectKeys = WM.isObject(dataSet[0]) ? Object.keys(dataSet[0]) : [];
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
            }
            return parsedData;
        }

        /*
         * update datafield, display field in the property panel
         */
        function updatePropertyPanelOptions(dataset, propertiesMap, scope) {
            var variableKeys = [];
            /* on binding of data*/
            if (dataset && WM.isObject(dataset)) {
                dataset = dataset[0] || dataset;
                variableKeys = WidgetUtilService.extractDataSetFields(dataset, propertiesMap) || [];
            }

            /*removing null values from the variableKeys*/
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
        function assignModelValue(scope, dataSet, radioValue) {
            var selectedValue;
            /*if radioValue is provided use that to assign model value else use the selectedvalue property if provided*/
            /*Handling the case where the selected value itself is false*/
            if (radioValue || radioValue === false) {
                selectedValue = radioValue;
            } else {
                selectedValue = scope.selectedvalue === false ? false : scope._model_ || '';
            }

            if (WM.isString(dataSet)) {
                /*populating model if dataSet is string*/
                scope._model_ = selectedValue;
            } else if (WM.isArray(dataSet)) {
                /*if dataSet is array and array values are objects*/
                if (WM.isObject(dataSet[0])) {
                    scope._model_ = scope.dataObject[selectedValue];
                } else {
                    /*if dataSet is array*/
                    scope._model_ = selectedValue;
                }
            } else {
                /*if dataSet is object*/
                if (radioValue) {
                    scope._model_ = scope.dataObject[selectedValue];
                } else {
                    scope._model_ = selectedValue;
                }
            }
        }

        /*function to create the dataKeys from the dataSet provided based on the type of the dataSet.*/
        function createDataKeys(scope, dataSet) {
            /*if dataSet is an array, process it to create the keys for the radioset.*/
            if (WM.isArray(dataSet)) {
                if (WM.isObject(dataSet[0])) {
                    WM.forEach(dataSet, function (data) {
                        /*getting the dataObject*/
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
                scope.dataObject = dataSet;
                /*getting the dataKeys for creating the option texts*/
                scope.dataKeys = dataSet.split(',').map(function (option) { return option.trim(); });
            } else if (WM.isObject(dataSet)) {
                scope.dataObject = dataSet;
                /*getting the dataKeys for creating the option texts*/
                scope.dataKeys = Object.keys(scope.dataObject);
            }
        }

        /*function to create the widget template based on the dataKeys created.*/
        function createWidgetTemplate(scope) {
            var template = '';
            /*appending the radio widget to the radioset widget based on the keys generated.*/
            WM.forEach(scope.dataKeys, function (dataKey, index) {
                dataKey = WM.isString(dataKey) ? dataKey.trim() : dataKey;
                template = template +
                    '<li>' +
                        '<div class="radio"><label class="app-radioset-label">' +
                            '<input type="radio" ' + (scope.disabled ? ' disabled="disabled" ' : '') +
                                'data-attr-index=' + index + ' ng-checked="checkModel(' + index + ')"/>' +
                         dataKey + '</label>' +
                        '</div>' +
                    '</li>';
            });
            /*Holder for the model for submitting values in a form and a wrapper to for readonly mode*/
            template = template + '<input name="{{name}}" data-ng-disabled="disabled" data-ng-hide="true" class="model-holder" data-ng-model="_model_">'  + '<div data-ng-if="readonly || disabled" class="readonly-wrapper"></div>';
            return template;
        }

        function constructRadioSet(scope, element, dataSet) {
            var parseData,
                template,
                useKeys = scope.usekeys,
                compiledTemplate;
            scope.dataObject = {};
            scope.dataKeys = [];
            /*assign dataSet according to liveVariable or other variable*/
            dataSet = dataSet ? dataSet.data || dataSet : [];

            /*parsing dataset only if bound with live variable to create displayfield and datafield properties*/
            parseData = WM.isString(scope.dataset || scope.scopedataset) ||
                (WM.isArray(scope.dataset) && !WM.isObject(scope.dataset[0])) ||
                (WM.isArray(scope.scopedataset) && !WM.isObject(scope.scopedataset[0])) ? false : true;

            /*filter the dataSet based on datafield & displayfield*/
            if (parseData) {
                dataSet = parseDataSet(dataSet, scope, scope.displayfield, scope.datafield, useKeys);
            }

            /*creating the dataKeys for the radioset*/
            createDataKeys(scope, dataSet);

            /*assigning value to the model if selectedvalue is provided*/
            assignModelValue(scope, dataSet);

            /*creating the template based on the dataKeys created*/
            template = createWidgetTemplate(scope);

            /*compiling the appended template*/
            compiledTemplate = $compile(template)(scope);
            element.empty().append(compiledTemplate);

            /*register a click event handler for the radio*/
            element.find('.app-radioset-label').on('click', function () {
                if (scope.disabled || scope.readonly) {
                    return;
                }
                var radioOption;
                /*The input has id in the format scope.$id + index, so parse it and take the corresponding radioOption
                from the dataKeys array*/
                radioOption = WM.element(this).find('input').attr('data-attr-index');
                radioOption = scope.dataKeys[radioOption];
                assignModelValue(scope, dataSet, radioOption);

                /*if usekeys is true, apply model value as selectedvalue*/
                scope.selectedvalue = scope._model_;

                Utils.triggerFn(scope._onChange);
                scope.$root.$safeApply(scope);
            });
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            var dataSet = scope.dataset || scope.scopedataset;
            /*Monitoring changes for properties and accordingly handling respective changes.*/
            switch (key) {
            case 'dataset':
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && WM.isDefined(newVal) && newVal !== null) {
                    updatePropertyPanelOptions(newVal.data || newVal, newVal.propertiesMap, scope);
                }
                /*generating the radioset based on the values provided*/
                constructRadioSet(scope, element, newVal);
                break;
            case 'displayfield':
            case 'datafield':
            case 'usekeys':
            case 'selectedvalue':
                /*generating the radioset based on the values provided*/
                constructRadioSet(scope, element, dataSet);
                break;
            case 'disabled':
                element.find('input[type="radio"]').attr('disabled', newVal);
                break;

            }
        }

        return {
            'restrict': 'E',
            'scope': {
                'scopedataset': '=?'
            },
            'replace': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/form/radioset.html'),
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
                        scope.$watch('scopedataset', function () {
                            if (scope.scopedataset) {
                                /*generating the radioset based on the values provided*/
                                constructRadioSet(scope, element, scope.scopedataset);
                            }
                        });

                        /*method to check the value of the model and appropriately check or uncheck the element*/
                        scope.checkModel = function (index) {
                            return (scope._model_ === scope.dataKeys[index]) || WM.equals(scope._model_, scope.dataObject[scope.dataKeys[index]]);
                        };

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
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
