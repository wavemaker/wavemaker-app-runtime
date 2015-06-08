/*global WM */
/*jslint nomen:true*/
/*Directive for Select */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/select.html',
            '<select init-widget has-model class="form-control app-select"' +
                ' data-ng-model="modelProxy"' + /* proxy-object is updated in the onChangeProxy function*/
                ' title="{{hint}}"' +
                ' data-ng-show="show"' +
                ' data-ng-readonly="readonly" ' +
                ' data-ng-disabled="disabled"' +
                ' data-ng-required="required"' +
                ' data-ng-change="onChangeProxy({$event: $event, $scope: this})"' + /* wrapper to _onChange function to update the model-proxy*/
                $rootScope.getWidgetStyles() +
                ' data-ng-options="option.key as $root.locale[option.value] || option.value for option in selectOptions">' +
                '</select>'
                );
    }])
    .directive('wmSelect', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';

        /*Obtaining properties specific to select widget by extending from all editor related widget properties*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.select', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.editors.dataseteditors']),
            notifyFor = {
                'dataset': true,
                'multiple': true,
                'active': true
            },

        /** store the whole object of the selected option - in '_dataSetModelProxyMap' */
            _dataSetModelProxyMap = {},
            _dataSetModelMap = {},
            _modelChangedManually = {},
            ALLFIELDS = 'All Fields';

        /* to access nested objects with string key */
        function getObjValueByStringKey(obj, strKey) {
            /* check for the key-string */
            if (strKey) {
                var val;
                /* convert indexes to properties, so as to work for even 'key1[0].child1'*/
                strKey.replace(/\[(\w+)\]/g, '.$1').split('.').forEach(function (key) {
                    val = (val && val[key]) || obj[key];
                });
                return val;
            }
            return obj;
        }

        /*
         * gets the key to map the select options out of dataSet
         * if only one key is there in the option object it returns that key
         * else the default key to be looked is 'dataValue'
         */
        function getKey(optionObject) {
            var keys = Object.keys(optionObject);
            /* if only one key, return it (can be anything other than 'dataValue' as well */
            if (keys.length === 1) {
                return keys[0];
            }

            /* return dataValue to be the default key */
            return 'dataValue';
        }

        /*
         * returns the display field
         */
        function getDisplayFieldKey(dataSet, scope) {
            var displayField = scope.displayfield || scope.datafield;
            /*if displayField is not set or set to all fields*/
            if (!displayField || displayField === ALLFIELDS) {
                /*if dataSet is an array*/
                if (WM.isArray(dataSet) && dataSet.length > 0) {
                    /*if dataSet is an array of objects*/
                    if (WM.isObject(dataSet[0])) {
                        /* get the first field of the object*/
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
         * returns the display field data
         */
        function getDisplayFieldData(scope, option, displayField) {
            /* if displayExpression is set*/
            if (scope.binddisplayexpression) {
                /*remove 'bind:' prefix from the binded displayExpression*/
                displayField = scope.binddisplayexpression.replace("bind:", "");
                /* parse the displayExpression for replacing all the expressions with values in the object */
                return scope.$eval(displayField.replace(/\$\[(\w)+(\w+(\[\$i\])?\.+\w+)*\]/g, function (expr) {
                    var val;
                    /*remove '$[' prefix & ']' suffix from each expression pattern */
                    expr = expr.replace(/[\$\[\]]/gi, '');
                    /*split to get all keys in the expr*/
                    expr.split('.').forEach(function (key) {
                        /* get the value for the 'key' from the option first & then value itself,
                         * as it will be the object to scan
                         * */
                        val = (val && val[key]) || option[key];
                        /*if val is a string, append single quotes to it */
                        if (WM.isString(val)) {
                            val = "'" + val + "'";
                        }
                    });
                    /* return val to the original string*/
                    return val;
                }));
            }
            /*If any column of the option object is present in the display expression,
              replace it with the option value*/
            if (scope.displayexpression) {
                var newStr =  scope.displayexpression;
                Object.keys(option).forEach(function (column) {
                    var regexExpr = new RegExp("\\b" + column + "\\b", "g"),
                        val = option[column];
                    if (WM.isString(val)) {
                        val = "'" + val + "'";
                    }
                    newStr = newStr.replace(regexExpr, val);
                });
                try {
                    return scope.$eval(newStr);
                } catch (e) {
                    return newStr;
                }
            }
            /*return just the displayField from the option object, if displayExpr is not set*/
            return getObjValueByStringKey(option, displayField);
        }

        /*
         * watch the model
         * and update the modelProxy,
         * */
        function updateModelProxy(scope, _model_) {
            /* to check if the function is not triggered from onChangeProxy */
            if (!_modelChangedManually[scope.$id]) {
                if (scope.datafield !== ALLFIELDS) {
                    scope.modelProxy = WM.isObject(_model_) ? _model_ : _model_ && _model_.toString();
                } else if (_dataSetModelMap[scope.$id]) {  /* check for sanity */
                    scope.modelProxy = _dataSetModelMap[scope.$id][JSON.stringify(_model_)];
                }
            }
            /* reset the value */
            _modelChangedManually[scope.$id] = false;
        }

        /*
         * parse dataSet to filter the options based on the datafield, displayfield & displayexpression
         */
        function parseDataSet(dataSet, scope) {
            /*store parsed data in 'data'*/
            var data = dataSet,
                dataField = scope.datafield,
                displayField = getDisplayFieldKey(dataSet, scope);

            /*initialize the data, for 'All Fields'*/
            _dataSetModelProxyMap[scope.$id] = {};
            _dataSetModelMap[scope.$id] = {};
            /*if filter dataSet if dataField is selected other than 'All Fields'*/
            if (dataField && dataField !== ALLFIELDS) {
                data = {};
                WM.forEach(dataSet, function (option) {
                    data[getObjValueByStringKey(option, dataField)] = getDisplayFieldData(scope, option, displayField);
                });
            } else {
                data = {};
                WM.forEach(dataSet, function (option, index) {
                    if (WM.isObject(option)) {
                        if (scope.datafield === ALLFIELDS) {
                            data[index] = displayField ? getDisplayFieldData(scope, option, displayField) : option;
                            /*store parsed dataSet in scope*/
                            _dataSetModelProxyMap[scope.$id][index] = option;
                            _dataSetModelMap[scope.$id][JSON.stringify(option)] = index.toString();
                        } else {
                            data[getObjValueByStringKey(option, dataField)] = getDisplayFieldData(scope, option, displayField);
                        }
                    } else {
                        if (WM.isArray(dataSet)) {
                            data[option] = option;
                        } else {
                            data[index] = option;
                        }
                    }
                });
            }
            return data;
        }

        /*function to create the options for the select widget, based on the different configurations that can be provided.
         Options can be provided as
         * 1. comma separated string, which is captured in the options property of the scope
         * 2. application scope variable which is assigned to the dataSet attribute of the select widget from the studio.
         * 3. a wm-studio-variable which is bound to the widget's dataSet property.*/
        function createSelectOptions(dataset, scope, element) {
            /* check for dataSet*/
            if (!dataset) {
                return;
            }
            /*assign dataSet according to liveVariable or other variable*/
            dataset = dataset.hasOwnProperty('data') ? dataset.data : dataset;
            var key;
            /*checking if dataSet is present and it is not a string.*/
            if (dataset && dataset.dataValue !== '') {
                /*initializing select options*/
                scope.selectOptions = [];
                /*check if dataset is array*/
                if (WM.isArray(dataset)) {
                    /*filter the dataSet based on datafield & displayfield*/
                    dataset = parseDataSet(dataset, scope);
                    /* if dataSet is an array of objects, convert it to object */
                    if (WM.isObject(dataset[0])) {
                        key = getKey(dataset[0]);
                        /* if dataSet is an array, convert it to object */
                        WM.forEach(dataset, function (option) {
                            scope.selectOptions.push({'key': key, 'value': option.name || option[key]});
                        });
                    } else if (WM.isArray(dataset)) {
                        /* if dataSet is an array, convert it to object */
                        WM.forEach(dataset, function (option) {
                            scope.selectOptions.push({"key": option, "value": option});
                        });
                    } else if (WM.isObject(dataset)) {
                        WM.forEach(dataset, function (val, key) {
                            scope.selectOptions.push({"key": key, "value": val});
                        });
                    }
                } else if (WM.isObject(dataset)) {
                    /*filter the dataSet based on datafield & displayfield*/
                    dataset = parseDataSet(dataset, scope);
                    WM.forEach(dataset, function (val, key) {
                        scope.selectOptions.push({"key": key, "value": val});
                    });
                } else {
                    /* if dataSet is an string, convert it to object */
                    if (WM.isString(dataset)) {
                        WM.forEach(dataset.split(','), function (opt) {
                            opt = opt.trim();
                            scope.selectOptions.push({"key": opt, "value": opt});
                        });
                    } else {
                        scope.selectOptions.push({"key": dataset, "value": dataset});
                    }
                }
                updateModelProxy(scope, scope._model_);
            }
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
            /* re-initialize the property values */
            if (scope.newcolumns) {
                scope.newcolumns = false;
                scope.datafield = '';
                scope.displayfield = '';
                scope.$root.$emit("set-markup-attr", scope.widgetid, {'datafield': scope.datafield, 'displayfield': scope.displayfield});
            }
            scope.widgetProps.datafield.options = ['', ALLFIELDS].concat(variableKeys);
            scope.widgetProps.displayfield.options = [''].concat(variableKeys);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            switch (key) {
            case 'dataset':
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && WM.isDefined(newVal) && newVal !== null) {
                    updatePropertyPanelOptions(newVal.data || newVal, newVal.propertiesMap, scope);
                }
                /*creating options for the select element, whenever the property value changes*/
                createSelectOptions(scope.dataset, scope, element);
                break;
            case 'multiple':
                attrs.$set('multiple', newVal);
                break;
            case 'active':
                /*listening on 'active' property, as losing the properties during page switch*/
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && scope.dataset && newVal) {
                    updatePropertyPanelOptions(scope.dataset.data || scope.dataset, scope.dataset.propertiesMap, scope);
                }
                break;
            }
        }

        /* proxy method for onChange event */
        function onChangeProxy(scope, args) {
            /*if "All Fields" is found in the widget mark up, then make the '_model_', an object*/
            /*checking with 'attrs' for "backward compatibility", as displayField & dataField are implemented later*/
            if (scope.readonly) {
                scope.modelProxy = scope._model_;
                return;
            }

            /* assign the modelProxy to the model when the selected datafield isn't all-fields*/
            if (scope.datafield !== ALLFIELDS) {
                scope._model_ = scope.modelProxy;
            } else if (_dataSetModelProxyMap[scope.$id]) { /* check for sanity */
                scope._model_ = _dataSetModelProxyMap[scope.$id][scope.modelProxy];
            }
            _modelChangedManually[scope.$id] = true;
            scope._onChange({$event: args.$event, $scope: args.$scope});
        }

        /* function which will be triggered on change of scopedataset */
        function scopeDatasetWatcher(scope, element) {
            /*if studio-mode, then update the displayField & dataField in property panel*/
            if (scope.widgetid) {
                updatePropertyPanelOptions(scope.scopedataset, scope);
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
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Binding widget properties obtained from PropertiesFactory to scope*/
                        /*used deep.copy, as widgetProps are being modified for property panel changes */
                        scope.widgetProps = WM.copy(widgetProps);
                    },
                    'post': function (scope, element, attrs) {

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);

                        /* fields defined in scope: {} MUST be watched explicitly */
                        /*watching scopedataset attribute to create options for the select element.*/
                        if (!attrs.widgetid) {
                            scope.$watch('scopedataset', scopeDatasetWatcher.bind(undefined, scope, element));
                            scope.$watch('_model_', updateModelProxy.bind(undefined, scope));
                        }

                        /*decorate onChange function*/
                        scope.onChangeProxy = onChangeProxy.bind(undefined, scope);

                        /*Executing WidgetUtilService method to initialize the widget with the essential configurations.*/
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    }
                };
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
 *
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

