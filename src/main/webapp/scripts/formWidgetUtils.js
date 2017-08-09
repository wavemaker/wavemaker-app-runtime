/*global WM, _, moment, alert*/

/**
 * @ngdoc service
 * @name wm.widgets.form.FormWidgetUtils
 * @requires Utils
 * The `FormWidgetUtils` service provides utility methods for form widgets.
 */
WM.module('wm.widgets.form')
    .service('FormWidgetUtils', [
        'WidgetUtilService',
        'Utils',
        'Variables',
        '$servicevariable',
        '$rootScope',
        '$filter',

        function (WidgetUtilService, Utils, Variables, $servicevariable, $rootScope, $filter) {
            'use strict';
            var ALLFIELDS   = 'All Fields';

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

            // This function finds the displayOption whose key is equal to the value and sets the isChecked flag for that displayOptions.
            function updateCheckedValue(value, displayOptions) {
                var checkedDisplayOption = _.find(displayOptions, function (dataObj) {
                    return _.toString(dataObj.key) === _.toString(value);
                });
                // set the isChecked flag for selected radioset value.
                if (checkedDisplayOption) {
                    checkedDisplayOption.isChecked = true;
                }
                return checkedDisplayOption;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#setPropertiesTextWidget
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * Use this function to set the properties of the text widget based on the input type
             *
             * @param {object} widgetProps properties of the text widget
             * @param {string} newVal new input type value of the widget
             */
            function setPropertiesTextWidget(widgetProps, newVal) {
                var datavalueObj = widgetProps.datavalue || widgetProps.defaultvalue;
                widgetProps.step.show = widgetProps.minvalue.show = widgetProps.maxvalue.show = widgetProps.displayformat.show = false;
                widgetProps.placeholder.show = widgetProps.maxchars.show = widgetProps.updateon.show = widgetProps.updatedelay.show = true;
                datavalueObj.type = (newVal === 'date') ? newVal : 'string';
                switch (newVal) {
                case 'text':
                    widgetProps.displayformat.show = true;
                    break;
                case 'number':
                    widgetProps.step.show = widgetProps.minvalue.show = widgetProps.maxvalue.show = true;
                    widgetProps.placeholder.show = widgetProps.maxchars.show = true;
                    break;
                case 'date':
                case 'datetime-local':
                case 'month':
                case 'time':
                case 'week':
                    widgetProps.step.show = widgetProps.minvalue.show = widgetProps.maxvalue.show = true;
                    widgetProps.placeholder.show = widgetProps.maxchars.show = false;
                    break;
                case 'color':
                    widgetProps.updateon.show = widgetProps.updatedelay.show = widgetProps.maxchars.show = false;
                    widgetProps.placeholder.show = false;
                    break;
                }
            }

            /**
             * This function sets the displayValue, isChecked flag for select, radioset, checkboxset widgets.
             * @param scope widget's scope
             * @param _modelProxy model value
             */
            function setCheckedAndDisplayValues(scope, _modelProxy) {
                var selectedOption;

                if (WM.isArray(_modelProxy)) {
                    scope.displayValue = [];
                    _.forEach(_modelProxy, function (val) {
                        selectedOption = updateCheckedValue(val, scope.displayOptions);
                        if (selectedOption) {
                            scope.displayValue.push(selectedOption.value);
                        }
                    });
                } else {
                    scope.displayValue = undefined;
                    selectedOption = updateCheckedValue(_modelProxy, scope.displayOptions);
                    if (selectedOption) {
                        scope.displayValue = selectedOption.value;
                    }
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#updatedCheckedValues
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to update the checked values, which selects/ de-selects the values in radioset/ checkboxset
             *
             * @param {object} scope isolate scope of the widget
             */
            function updatedCheckedValues(scope) {
                var model = scope._model_,
                    _modelProxy,
                    selectedOption,
                    filterField;

                // In studioMode, handle the model having comma separated string.
                if (scope._widgettype === 'wm-checkboxset' && WM.isString(model) && model !== '') {
                    model = model.split(',');
                }

                // reset isChecked flag for displayOptions.
                _.forEach(scope.displayOptions, function (dataObj) {
                    dataObj.isChecked = false;
                });

                if (scope.displayOptions && !scope.usekeys) {
                    // set the filterField depending on whether displayOptions contain 'dataObject', if not set filterField to 'key'
                    filterField = _.get(scope.displayOptions[0], 'dataObject') ? 'dataObject' : 'key';
                    if (WM.isArray(model)) {
                        _modelProxy = [];
                        _.forEach(model, function (modelVal) {
                            selectedOption = _.find(scope.displayOptions, function (obj) {
                                if (filterField === 'dataObject') {
                                    return _.isEqual(WM.fromJson(WM.toJson(obj[filterField])), WM.fromJson(WM.toJson(modelVal)));
                                }
                                return _.toString(obj[filterField]) === _.toString(modelVal);
                            });
                            if (selectedOption) {
                                _modelProxy.push(selectedOption.key);
                            }
                        });
                    } else {
                        _modelProxy = undefined;
                        selectedOption = _.find(scope.displayOptions, function (obj) {
                            if (filterField === 'dataObject') {
                                return _.isEqual(WM.fromJson(WM.toJson(obj[filterField])), WM.fromJson(WM.toJson(model)));
                            }
                            return _.toString(obj[filterField]) === _.toString(model);
                        });
                        if (selectedOption) {
                            _modelProxy = selectedOption.key;
                        }
                    }
                } else {
                    _modelProxy = model;
                }
                if (scope._isModelProxyRequired) {
                    scope.modelProxy = _modelProxy;
                }
                setCheckedAndDisplayValues(scope, _modelProxy);

                /* In studioMode, create CheckedValues for checkboxset and radioset when groupFields is true.
                 * checkedValues is a object with key as dataField value and value is boolean which represents isChecked value.
                 */
                if (scope.groupFields) {
                    scope.checkedValues = {};
                    _.forEach(scope.displayOptions, function (obj) {
                        scope.checkedValues[obj.key] = obj.isChecked;
                    });
                }
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

                function getKeys() {
                    return Object.keys(scope.dataObject);
                }

                if (!dataSet) {
                    scope.dataKeys = [];
                    return;
                }
                // return all the keys from the displayOptions.
                if (scope.displayOptions) {
                    scope.dataKeys = _.map(scope.displayOptions, 'key');
                    return;
                }

                /*if dataSet is an array, process it to create the keys for the radioset.*/
                if (WM.isArray(dataSet)) {
                    /*if array values are objects*/
                    if (WM.isObject(dataSet[0]) && _.has(dataSet[0], 'dataValue')) {
                        _.forEach(dataSet, function (data) {
                            /*getting the dataObject*/
                            scope.dataObject[data.name] = data.dataValue;
                        });
                        /*getting the dataKeys for creating the option texts*/
                        scope.dataKeys = getKeys();
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
                    scope.dataKeys = getKeys();
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getOrderedDataSet
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get the ordered dataset based on the given orderby
             *
             * @param {object} dataset dataset on which sort is to be performed
             * @param {string} orderby orderby having field and directions
             */
            function getOrderedDataSet(dataset, orderby) {
                if (!orderby) {
                    return dataset;
                }
                var items      = _.split(orderby, ','),
                    fields     = [],
                    directions = [];
                _.forEach(items, function (obj) {
                    var item = _.split(obj, ':');
                    fields.push(item[0]);
                    directions.push(item[1]);
                });
                return _.orderBy(dataset, fields, directions);
            }

            /*
             * parse dataSet to filter the options based on the datafield, displayfield & displayexpression
             */
            function extractDataObjects(dataSet, scope) {
                /*store parsed data in 'data'*/
                var data = dataSet,
                    useKeys = scope.usekeys,
                    dataField = scope.datafield,
                    displayField = getDisplayField(dataSet, scope.displayfield || scope.datafield),
                    objectKeys  = [],
                    key,
                    value;

                if (WM.isString(dataSet)) {
                    dataSet = _.map(_.split(dataSet, ','), _.trim);
                }
                data = [];

                if (useKeys && WM.isObject(dataSet[0])) {
                        /*getting keys of the object*/
                    objectKeys = Object.keys(dataSet[0]);
                    /*iterating over object keys and creating checkboxset dataset*/
                    _.forEach(objectKeys, function (key) {
                        data.push({'key' : key, 'value' : key});
                    });
                    return data;
                }

                // if filter dataSet if dataField is selected other than 'All Fields'
                if (dataField && dataField !== ALLFIELDS) {
                    //Widget selected item dataset will be object instead of array.
                    if (WM.isObject(dataSet) && !WM.isArray(dataSet)) {
                        key   = WidgetUtilService.getObjValueByKey(dataSet, dataField);
                        value = WidgetUtilService.getEvaluatedData(scope, dataSet, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                        data.push({'key' : key, 'value' : value});
                    } else {
                        if (WM.isObject(dataSet[0])) {
                            _.forEach(dataSet, function (option) {
                                key   = WidgetUtilService.getObjValueByKey(option, dataField);
                                value = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                                data.push({'key' : key, 'value' : value});
                            });
                        } else {
                            _.forEach(dataSet, function (option) {
                                data.push({'key' : option, 'value' : option});
                            });
                        }
                    }

                } else {
                    if (!WM.isArray(dataSet) && scope.binddataset && scope.binddataset.indexOf('selecteditem') > -1) {
                        key   = 0;
                        value = WidgetUtilService.getEvaluatedData(scope, dataSet, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);

                        data.push({'key' : key, 'value' : value, 'dataObject': dataSet});
                    } else {
                        _.forEach(dataSet, function (option, index) {
                            if (WM.isObject(option)) {
                                if (scope.datafield === ALLFIELDS) {
                                    key = index;
                                    value = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);

                                    data.push({'key' : key, 'value' : value, 'dataObject': option});
                                } else {
                                    key   = WidgetUtilService.getObjValueByKey(option, dataField);
                                    value = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                                    data.push({'key' : key, 'value' : value});
                                }
                            } else {
                                if (WM.isArray(dataSet)) {
                                    data.push({'key' : option, 'value' : option});
                                } else {
                                    // If dataset is object with key, value and useKeys set to true, only keys are to be returned.
                                    data.push({'key' : index, 'value' : useKeys ? index : option});
                                }
                            }
                        });
                    }
                }
                return data;
            }

            /**
             * This function parses the dataset and extracts the displayOptions from parsed dataset.
             * displayOption will contain datafield as key, displayfield as value.
             * @param dataset dataset from which data is parsed.
             * @param scope isolateScope of the widget.
             */
            function extractDisplayOptions(dataset, scope, $el) {
                var isBoundToLiveVariable;

                scope.displayOptions = [];

                if (!dataset) {
                    return;
                }

                //Checking if widget is bound to service variable
                if (scope.binddataset) {
                    isBoundToLiveVariable = _.startsWith(scope.binddataset, 'bind:Variables.') && getBoundVariableCategory(scope, scope.widgetid ? $rootScope.domScope : $el.scope()) === 'wm.LiveVariable';
                }

                // assign dataSet according to liveVariable or other variable
                dataset = (isBoundToLiveVariable && dataset.hasOwnProperty('data')) ? dataset.data : dataset;
                dataset = getOrderedDataSet(dataset, scope.orderby);
                if (!_.isEmpty(dataset)) {
                    dataset = extractDataObjects(dataset, scope);
                }

                scope.displayOptions = _.uniqBy(dataset, 'key');

                // Omit all the options whose datafield (key) is null or undefined.
                _.remove(scope.displayOptions, function (option) {
                    return WM.isUndefined(option.key) || _.isNull(option.key);
                });
                updatedCheckedValues(scope);
            }

            /**
             * Returns groupedKeys map which has grouping info of related tables
             * @param fields
             * @param isGroupFields
             * @returns {object}
             */
            function getGroupedFields(fields, isGroupFields) {
                var groupedKeys = {'all': {'keys': []}};
                if (isGroupFields) {
                    _.forEach(fields, function (key, index) {
                        if (_.includes(key, '.')) {
                            var field = _.split(key, '.');
                            if (!groupedKeys[field[0]]) {
                                groupedKeys[field[0]] = {'keys': []};
                            }
                            groupedKeys[field[0]].keys.push({'title': field[1], 'index': index, 'key': key});
                        } else {
                            groupedKeys.all.keys.push({'title': key, 'index': index, 'key': key});
                        }
                    });
                } else {
                    groupedKeys.all.keys = groupedKeys.all.keys.concat(_.map(fields, function (key, index) {
                        return {'title': key, 'index': index, 'key': key};
                    }));
                }
                return groupedKeys;
            }

            // This function returns the displayvalue from displayOptions based on the key.
            function getDisplayFieldFromDataKey(displayOptions, key) {
                var dataObj = _.find(displayOptions, {'key': key});
                return dataObj && dataObj.value;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getRadiosetCheckboxsetTemplate
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to create the widget template for radioset and checkboxset based on the displayOptions created.
             *
             * @param {object} scope isolate scope of the widget
             * @param {string} widgetType radioset or checkboxset
             *
             */
            function getRadiosetCheckboxsetTemplate(scope, widgetType) {
                var template = '',
                    liClass,
                    labelClass,
                    type,
                    required = '',
                    groupedKeys = {},
                //Generate a unique name for inputs in widget, so that when widget is used multiple times (like livelist), each widget behaves independently
                    uniqueName  = 'name=' + (scope.name || widgetType) + Utils.generateGUId();
                switch (widgetType) {
                case 'checkboxset':
                    liClass = 'checkbox app-checkbox';
                    labelClass = 'app-checkboxset-label';
                    type = 'checkbox';
                    break;
                case 'radioset':
                    liClass = 'radio app-radio';
                    labelClass = 'app-radioset-label';
                    type = 'radio';
                    required = ' ng-required="required"';
                    break;
                }

                if (scope.groupFields) {
                    createDataKeys(scope, scope.dataset);
                    groupedKeys = getGroupedFields(scope.dataKeys, scope.groupFields);

                    _.forEach(_.keys(groupedKeys), function (key) {
                        if (key !== 'all') {
                            template = template +
                                '<li class="' + liClass + ' group-header" title="' + key + '" data-fixed-header="true"><i class="wms wms-arrow-drop-down group-icon"></i><span class="group-title">' + key + '</span></li>';
                        }

                        _.forEach(groupedKeys[key].keys, function (dataKey) {
                            // title contains the displayvalue from displayOptions.
                            if (scope.displayOptions) {
                                dataKey.title = getDisplayFieldFromDataKey(scope.displayOptions, dataKey.key);
                            }
                            dataKey.title    = WM.isString(dataKey.title) ? dataKey.title.trim() : dataKey.title;
                            //needed to parse the key if the bound dataset is having the key with '\'.
                            var parsedKey = _.includes(dataKey.key, '\\') ? _.replace(dataKey.key, '\\', '\\\\') : dataKey.key;

                            template = template +
                                '<li class="' + liClass + ' {{itemclass}}" ng-class="{\'active\': checkedValues[\'' + parsedKey + '\']}">' +
                                '<label class="' + labelClass + '" ng-class="{\'disabled\':disabled}" title="' + dataKey.key + '">' +
                                '<input ' + uniqueName + required + ' type="' + type + '" ' + (scope.disabled ? ' disabled="disabled" ' : '') + 'data-attr-index=' + dataKey.index + ' value="' + dataKey.key + '" tabindex="' + scope.tabindex + '" ng-checked="checkedValues[\'' + parsedKey + '\']"/>' +
                                '<span class="caption">' + dataKey.title + '</span>' +
                                '</label>' +
                                '</li>';
                        });
                    });
                } else {
                    template = template +
                        '<li class="' + liClass + ' {{itemclass}}" ng-repeat="dataObj in displayOptions track by $index" ng-class="{\'active\': dataObj.isChecked}">' +
                        '<label class="' + labelClass + '" ng-class="{\'disabled\':disabled}" title="{{dataObj.value}}">' +
                        '<input ' + uniqueName + required + ' type="' + type + '" ' + (scope.disabled ? ' disabled="disabled" ' : '') + 'data-attr-index="{{$index}}" value="{{dataObj.key}}" tabindex="{{tabindex}}" ng-checked="dataObj.isChecked"/>' +
                        '<span class="caption">{{dataObj.value.toString()}}</span>' +
                        '</label>' +
                        '</li>';
                }

                /*Holder for the model for submitting values in a form and a wrapper to for readonly mode*/
                template = template + '<input name="{{name}}" ng-disabled="disabled" ng-hide="true" class="model-holder" ng-model="_model_">'  + '<div ng-if="readonly || disabled" class="readonly-wrapper"></div>';
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
             * @param {object} $variableScope scope of the page where variable is available. For example, if widget is within the partial, then $variableScope will be the partialPage scope.
             *
             */
            function getBoundVariableCategory(scope, $variableScope) {
                var variableName,
                    variableObj;
                variableName = Utils.getVariableName(scope);

                if ($variableScope && !_.isEmpty($variableScope.Variables)) {
                    variableObj = $variableScope.Variables[variableName];
                } else {
                    // this is just a fallback and should never occur
                    variableObj = variableName && Variables.getVariableByName(variableName);
                }
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
            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getTimestampFromDate
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get timestamp of date with time ignored
             *
             * @param {object} date date for which timestamp is required
             */
            function getTimestampFromDate(date) {
                return moment($filter('date')(date, 'yyyy-MM-dd')).valueOf();
            }
            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getProxyExcludeDates
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get all dates to be excluded.
             *
             * @param {object} excludeDates dates to be excluded
             */
            function getProxyExcludeDates(excludeDates) {
                var dates,
                    proxyExcludeDates = [];
                dates = WM.isString(excludeDates) ? excludeDates.split(',') : (WM.isArray(excludeDates) ? excludeDates : [excludeDates]);
                dates = dates.map(function (date) {
                    if (WM.isDate(date)) {
                        return date;
                    }
                    if (!isNaN(date)) {
                        return parseInt(date, 10);
                    }
                    return date;
                });
                _.forEach(dates, function (date) {
                    /*formatting date/timestamp in to date and converting it to long value and populating
                     'proxyExcludeDates' which is used in 'excludeDates()'*/
                    proxyExcludeDates.push(getTimestampFromDate(date));
                });
                return proxyExcludeDates;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getUpdatedModel
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to get the model value of date, datetime, time widgets in mobile.
             *
             * @param {string} minDate minimum date
             * @param {string} maxDate maximum date
             * @param {string} modelValue model value
             * @param {string} proxyModelValue proxy model value
             * @param {string} previousValue previous model value
             */
            function getUpdatedModel(minDate, maxDate, modelValue, proxyModelValue, previousValue) {
                var dateFormat = 'YYYY-MM-DD',
                    startDate,
                    endDate,
                    selectedDate;

                function getFormatedDate(val) {
                    return moment(val).format(dateFormat);
                }
                function getTimeStamp(val) {
                    return moment(val).valueOf();
                }

                if (minDate || maxDate) {
                    minDate      = getFormatedDate(minDate);
                    maxDate      = getFormatedDate(maxDate);
                    startDate    = getTimeStamp(minDate);
                    endDate      = getTimeStamp(maxDate);
                    selectedDate = getTimeStamp(getFormatedDate(modelValue));
                    if (startDate <= selectedDate && selectedDate <= endDate) {
                        return proxyModelValue;
                    }
                    alert('Please enter date between ' + minDate + " & " + maxDate);
                    return previousValue;
                }
                return proxyModelValue;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#disableDates
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to check if particular date has to be disabled.
             *
             * @param {string} scope widget's scope
             * @param {string} date date object from widget
             */
            function disableDates(scope, date) {
                if (date.mode === 'day') {
                    return (_.includes(scope.excludedays, date.date.getDay()) || (scope.proxyExcludeDates && _.includes(scope.proxyExcludeDates, getTimestampFromDate(date.date))));
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#setFixedHeader
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to implement fixed header for checkboxset and orderby widgets on grouping of fields
             *
             * @param {object} element for which scroll event needs to be attached
             * @param {object} $headerEle which needs to be a fixed one
             */
            function setFixedHeader(element, $headerEle) {
                element.on('scroll', _.debounce(function () {
                    $headerEle.css('display', 'none');
                    WM.element(this).find('[data-fixed-header]').each(function () {
                        var groupEle    = WM.element(this),
                            headerTop   = groupEle.position().top,
                            headerTitle = groupEle.attr('title');
                        if (headerTop < 0) {
                            $headerEle.attr('title', headerTitle);
                            $headerEle.find('.group-title').text(headerTitle);
                            $headerEle.css('display', 'block');
                        }
                    });
                }, 50));
            }


            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#updatePropertyOptionsWithParams
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * This function updates the property options for searchkey, in case of query service variable these options are
             * updated by the input query params that query service variable is expecting.
             *
             * @param {$is} isolate scope of the widget
             */
            function updatePropertyOptionsWithParams($is) {
                var isBoundVariable      = Utils.stringStartsWith($is.binddataset, 'bind:Variables.'),
                    parts                = _.split($is.binddataset, /\W/),
                    variable             = isBoundVariable && Variables.getVariableByName(parts[2]),
                    queryParams          = [],
                    searchOptions        = [];

                if (variable && variable.category === 'wm.ServiceVariable') {
                    $servicevariable.getServiceOperationInfo(variable.operation, variable.service, function (serviceOperationInfo) {
                        queryParams = serviceOperationInfo.parameters;
                    });
                    queryParams = Variables.getMappedServiceQueryParams(queryParams);
                    // don't update search options if there is no query service param
                    if (queryParams && queryParams.length > 0) {
                        searchOptions = _.map(queryParams, function (value) {
                            return value;
                        });
                        _.set($is.widgetProps, 'searchkey.options', searchOptions);
                    }
                }
            }

            this.getDisplayField                 = getDisplayField;
            this.setPropertiesTextWidget         = setPropertiesTextWidget;
            this.createDataKeys                  = createDataKeys;
            this.extractDisplayOptions           = extractDisplayOptions;
            this.updateCheckedValue              = updateCheckedValue;
            this.setCheckedAndDisplayValues      = setCheckedAndDisplayValues;
            this.getRadiosetCheckboxsetTemplate  = getRadiosetCheckboxsetTemplate;
            this.getBoundVariableCategory        = getBoundVariableCategory;
            this.appendMessage                   = appendMessage;
            this.getProxyEventsMap               = getProxyEventsMap;
            this.getFocusBlurEvents              = getFocusBlurEvents;
            this.eventProxy                      = eventProxy;
            this.getTimestampFromDate            = getTimestampFromDate;
            this.getProxyExcludeDates            = getProxyExcludeDates;
            this.getUpdatedModel                 = getUpdatedModel;
            this.updatedCheckedValues            = updatedCheckedValues;
            this.getOrderedDataSet               = getOrderedDataSet;
            this.disableDates                    = disableDates;
            this.setFixedHeader                  = setFixedHeader;
            this.getGroupedFields                = getGroupedFields;
            this.updatePropertyOptionsWithParams = updatePropertyOptionsWithParams;
        }
    ])
    .constant('FIELD_TYPE', {
        'INTEGER'     : 'integer',
        'BIG_INTEGER' : 'big_integer',
        'SHORT'       : 'short',
        'FLOAT'       : 'float',
        'BIG_DECIMAL' : 'big_decimal',
        'DOUBLE'      : 'double',
        'LONG'        : 'long',
        'BYTE'        : 'byte',
        'STRING'      : 'string',
        'CHARACTER'   : 'character',
        'TEXT'        : 'text',
        'DATE'        : 'date',
        'TIME'        : 'time',
        'TIMESTAMP'   : 'timestamp',
        'DATETIME'    : 'datetime',
        'BOOLEAN'     : 'boolean',
        'LIST'        : 'list',
        'CLOB'        : 'clob',
        'BLOB'        : 'blob'
    })
    .constant('FIELD_WIDGET', {
        'TEXT'         : 'text',
        'NUMBER'       : 'number',
        'TEXTAREA'     : 'textarea',
        'PASSWORD'     : 'password',
        'CHECKBOX'     : 'checkbox',
        'SLIDER'       : 'slider',
        'RICHTEXT'     : 'richtext',
        'CURRENCY'     : 'currency',
        'SWITCH'       : 'switch',
        'SELECT'       : 'select',
        'CHECKBOXSET'  : 'checkboxset',
        'RADIOSET'     : 'radioset',
        'DATE'         : 'date',
        'TIME'         : 'time',
        'TIMESTAMP'    : 'timestamp',
        'UPLOAD'       : 'upload',
        'RATING'       : 'rating',
        'DATETIME'     : 'datetime',
        'AUTOCOMPLETE' : 'autocomplete'
    });
