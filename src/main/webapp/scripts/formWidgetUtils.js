/*global WM, _*/

/**
 * @ngdoc service
 * @name wm.widgets.form.FormWidgetUtils
 * @requires Utils
 * The `FormWidgetUtils` service provides utility methods for form widgets.
 */
WM.module('wm.widgets.form')
    .service('FormWidgetUtils', [
        'WidgetUtilService',
        'CONSTANTS',
        'Utils',
        'Variables',
        '$rootScope',

        function (WidgetUtilService, CONSTANTS, Utils, Variables, $rootScope) {
            'use strict';
            var ALLFIELDS = 'All Fields';

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getDisplayField
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * return the default display field, if the widget does not have a display field or it is set to All fields
             *
             * @param {object} dataSet data set of the widget
             * @param {string} displayField display field of the widget
             */
            function getDisplayField(dataSet, displayField) {
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

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#createDataKeys
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to create the dataKeys from the dataSet provided based on the type of the dataSet
             *
             * @param {object} scope isolate scope of the widget
             * @param {object} dataSet data set of the widget
             */
            function createDataKeys(scope, dataSet) {
                /*if dataSet is an array, process it to create the keys for the radioset.*/
                if (WM.isArray(dataSet)) {
                    /*if array values are objects*/
                    if (WM.isObject(dataSet[0])) {
                        _.forEach(dataSet, function (data) {
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

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#updatePropertyPanelOptions
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to update datafield, display field in the property panel
             *
             * @param {object} dataset data set of the widget
             * @param {object} propertiesMap properties map of the data set
             * @param {object} scope isolate scope of the widget
             * @param {boolean} removeNull removeNull determines to remove the null values or not from the keys
             */
            function updatePropertyPanelOptions(dataset, propertiesMap, scope, removeNull) {
                var variableKeys = [];
                /* on binding of data*/
                if (dataset && WM.isObject(dataset)) {
                    dataset = dataset[0] || dataset;
                    variableKeys = WidgetUtilService.extractDataSetFields(dataset, propertiesMap) || [];
                }

                /*removing null values from the variableKeys*/
                if (removeNull) {
                    _.forEach(variableKeys, function (variableKey, index) {
                        if (dataset[variableKey] === null || WM.isObject(dataset[variableKey])) {
                            variableKeys.splice(index, 1);
                        }
                    });
                }

                /* re-initialize the property values */
                if (scope.newcolumns) {
                    scope.newcolumns = false;
                    scope.datafield = ALLFIELDS;
                    scope.displayfield = '';
                    scope.$root.$emit("set-markup-attr", scope.widgetid, {'datafield': '', 'displayfield': ''});
                }

                scope.widgetProps.datafield.options = ['', ALLFIELDS].concat(variableKeys);
                scope.widgetProps.displayfield.options = [''].concat(variableKeys);
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#parseDataSet
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * parse dataSet to filter the options based on the datafield, displayfield & displayexpression
             *
             * @param {object} dataSet data set of the widget
             * @param {object} scope isolate scope of the widget
             * @param {object} element element of widget
             */
            function parseDataSet(dataSet, scope, element) {
                /*store parsed data in 'data'*/
                var data = dataSet,
                    dataField = scope.datafield,
                    useKeys = scope.usekeys,
                    objectKeys = [],
                    displayField = getDisplayField(dataSet, scope.displayfield),
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
                        _.forEach(objectKeys, function (key) {
                            data[key] = key;
                        });
                    } else {
                        /*if filter dataSet if datafield is select other than 'All Fields'*/
                        if (dataField) {
                            data = {};
                            if (dataField !== ALLFIELDS) {
                                _.forEach(dataSet, function (option) {
                                    data[WidgetUtilService.getEvaluatedData(scope, option, {fieldName: "displayfield", expressionName: "displayexpression"}, displayField)] = option[dataField];
                                });
                            } else {
                                _.forEach(dataSet, function (option) {
                                    data[WidgetUtilService.getEvaluatedData(scope, option, {fieldName: "displayfield", expressionName: "displayexpression"}, displayField)] = option;
                                });
                            }
                        }
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
                    _.forEach(objectKeys, function (key) {
                        data[key] = key;
                    });
                }
                return data;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#parseData
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to check if the data must be parsed or not
             *
             * @param {object} scope isolate scope of the widget
             */
            function parseData(scope) {
                /*if dataset is a string, no need to parse data*/
                if (WM.isString(scope.dataset || scope.scopedataset)) {
                    return false;
                }
                /*if dataset is array of strings, no need to parse data*/
                if ((WM.isArray(scope.dataset) && !WM.isObject(scope.dataset[0]))) {
                    return false;
                }
                return (!(WM.isArray(scope.scopedataset) && !WM.isObject(scope.scopedataset[0])));
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getParsedDataSet
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to return the parsed dataset
             *
             * @param {object} dataSet data set of the widget
             * @param {object} scope isolate scope of the widget
             * @param {object} element element of the widget
             *
             */
            function getParsedDataSet(dataSet, scope, element) {
                /*assign dataSet according to liveVariable or other variable*/
                dataSet = dataSet ? dataSet.data || dataSet : [];

                /*filter the dataSet based on datafield & displayfield*/
                if (parseData(scope)) {
                    dataSet = parseDataSet(dataSet, scope, element);
                }
                return dataSet;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getModelValue
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to return the model value
             *
             * @param {object} scope isolate scope of the widget
             * @param {object} dataSet data set of the widget
             * @param {object} value selected value
             * @param {string} checkedValue current selected value
             *
             */
            function getModelValue(scope, dataSet, value, checkedValue) {
                value = WM.isString(value) ? value.trim() : value;
                /*populating model if dataSet is string*/
                if (WM.isString(dataSet)) {
                    return value;
                }
                if (WM.isArray(dataSet)) {
                    /*if dataSet is array and array values are objects*/
                    if (WM.isObject(dataSet[0])) {
                        return scope.dataObject[value];
                    }
                    /*if dataSet is array*/
                    return value;
                }
                /*if dataSet is object*/
                if (checkedValue) {
                    return scope.dataObject[value];
                }
                return value;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#createWidgetTemplate
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to create the widget template based on the dataKeys created.
             *
             * @param {object} scope isolate scope of the widget
             * @param {string} widgetType radioset or checkboxset
             *
             */
            function createWidgetTemplate(scope, widgetType) {
                var template = '';
                /*iterating over the keys to create the template for the widget.*/
                _.forEach(scope.dataKeys, function (dataKey, index) {
                    dataKey = WM.isString(dataKey) ? dataKey.trim() : dataKey;
                    if (widgetType === 'checkboxset') {
                        template = template +
                            '<li class="checkbox app-checkbox" data-ng-class="itemclass">' +
                                '<label class="app-checkboxset-label" data-ng-class="{\'disabled\':disabled, \'unchecked\': !checkedValues[' + "'" + dataKey + "'" + ']}" title="' + dataKey + '">' +
                                    '<input type="checkbox" ' + (scope.disabled ? ' disabled="disabled" ' : '') + ' value="' + dataKey + '" data-ng-checked="checkedValues[' + "'" + dataKey + "'" + ']""/>' +
                                    '<span class="caption">' + dataKey + '</span>' +
                                    '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" class="switch"/>' +
                                '</label>' +
                            '</li>';
                    } else {
                        template = template +
                            '<li class="radio app-radio" data-ng-class="itemclass">' +
                                '<label class="app-radioset-label">' +
                                    '<input type="radio" ' + (scope.disabled ? ' disabled="disabled" ' : '') + 'data-attr-index=' + index + ' data-ng-checked="checkModel(' + index + ')"/>' +
                                    '<span class="caption">' + dataKey + '</span>' +
                                '</label>' +
                            '</li>';
                    }
                });
                /*Holder for the model for submitting values in a form and a wrapper to for readonly mode*/
                template = template + '<input name="{{name}}" data-ng-disabled="disabled" data-ng-hide="true" class="model-holder" data-ng-model="_model_">'  + '<div data-ng-if="readonly || disabled" class="readonly-wrapper"></div>';
                return template;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getBoundVariableCategory
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get category of variable to which widget is bound to.
             *
             * @param {object} scope scope of the widget
             *
             */
            function getBoundVariableCategory(scope) {
                var variableName,
                    variableObj;
                variableName = Utils.getVariableName(scope);
                variableObj = variableName && Variables.getVariableByName(variableName);
                return variableObj && variableObj.category;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#appendMessage
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to append 'no data' message to element
             *
             * @param {object} element element of the widget
             *
             */
            function appendMessage(element) {
                var noDataMsg;
                noDataMsg = '<li>' + $rootScope.locale.MESSAGE_GRID_CANNOT_LOAD_DATA_IN_STUDIO + '</li>';
                element.empty().append(noDataMsg);
            }
            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getProxyEventsMap
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get the proxy events map for radioset, checkboxset, radio, checkbox
             *
             */
            function getProxyEventsMap() {
                return {
                    'onClick':          {'name': 'data-ng-click',       'value': 'eventProxy("onClick", {$event: $event, $scope: this})'},
                    'onDblclick':       {'name': 'data-ng-dblclick',    'value': 'onDblclick({$event: $event, $scope: this})'},
                    'onMouseenter':     {'name': 'data-ng-mouseenter',  'value': 'onMouseenter({$event: $event, $scope: this})'},
                    'onMouseleave':     {'name': 'data-ng-mouseleave',  'value': 'onMouseleave({$event: $event, $scope: this})'},
                    'onMouseover':      {'name': 'data-ng-mouseover',   'value': 'onMouseover({$event: $event, $scope: this})'},
                    'onMouseout':       {'name': 'data-ng-mouseout',    'value': 'onMouseout({$event: $event, $scope: this})'}
                };
            }
            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getFocusBlurEvents
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get the blur and focus events map for radioset, checkboxset, radio, checkbox
             *
             */
            function getFocusBlurEvents() {
                return {
                    'onFocus':          {'name': 'data-ng-focus',       'value': 'onFocus({$event: $event, $scope: this})'},
                    'onBlur':           {'name': 'data-ng-blur',        'value': 'onBlur({$event: $event, $scope: this})'}
                };
            }
            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#eventProxy
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to trigger the event
             *
             * @param {object} scope scope of the widget
             * @param {string} eventType type of the event
             * @param {object} eventArgs arguments passed for the event
             */
            function eventProxy(scope, eventType, eventArgs) {
                /*On click of caption for the label, two events are triggered. Event is not called for caption event*/
                if (_.includes(eventArgs.$event.target.classList, 'caption')) {
                    return;
                }
                Utils.triggerFn(scope[eventType], eventArgs);
            }

            this.getDisplayField = getDisplayField;
            this.createDataKeys = createDataKeys;
            this.updatePropertyPanelOptions = updatePropertyPanelOptions;
            this.getParsedDataSet = getParsedDataSet;
            this.getModelValue = getModelValue;
            this.createWidgetTemplate = createWidgetTemplate;
            this.getBoundVariableCategory = getBoundVariableCategory;
            this.appendMessage = appendMessage;
            this.getProxyEventsMap = getProxyEventsMap;
            this.getFocusBlurEvents = getFocusBlurEvents;
            this.eventProxy = eventProxy;
        }
    ]).directive('requireFormReset', ['Utils' , function (Utils) {
        'use strict';
        return {
            restrict : 'A',
            link : function (scope, element, attrs) {
                if (Utils.getResetFormWidgets().indexOf('.' + attrs['requireFormReset']) < 0) {
                    Utils.getResetFormWidgets().push('.' + attrs['requireFormReset']);
                }
            }
        };
    }]);