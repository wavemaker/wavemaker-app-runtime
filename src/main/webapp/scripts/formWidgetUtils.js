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
        'AppDefaults',
        'WIDGET_CONSTANTS',
        'DeviceVariableService',

        function (WidgetUtilService, Utils, Variables, $servicevariable, $rootScope, $filter, AppDefaults, WIDGET_CONSTANTS, DeviceVariableService) {
            'use strict';
            var ALLFIELDS   = 'All Fields',
                momentLocale             = moment.localeData(),
                momentCalendarOptions    = Utils.getClonedObject(momentLocale._calendar),
                momentCalendarDayOptions = momentLocale._calendarDay || {
                    'lastDay'  : '[Yesterday]',
                    'lastWeek' : '[Last] dddd',
                    'nextDay'  : '[Tomorrow]',
                    'nextWeek' : 'dddd',
                    'sameDay'  : '[Today]',
                    'sameElse' : 'L'
                },
                GROUP_BY_OPTIONS    = {
                    'ALPHABET' : 'alphabet',
                    'WORD'     : 'word',
                    'OTHERS'   : 'Others'
                },
                TIME_ROLLUP_OPTIONS = {
                    'HOUR'  : 'hour',
                    'DAY'   : 'day',
                    'WEEK'  : 'week',
                    'MONTH' : 'month',
                    'YEAR'  : 'year'
                },
                ROLLUP_PATTERNS    = {
                    'DAY'   : 'yyyy-MM-dd',
                    'WEEK'  : 'w \'Week\',  yyyy',
                    'MONTH' : 'MMM, yyyy',
                    'YEAR'  : 'YYYY',
                    'HOUR'  : 'hh:mm a'
                };

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
             * This function assigns the model value depending on modelProxy. Here model can be object or string.
             * If datafield is ALLFIELDS, modelProxy is 0, then model will be retrieved from dataObject in displayOptions
             * If datafield is other than ALLFIELDS, the modelProxy and model will be retrieved from key in displayOptions
             * @param scope widgetScope
             */
            function assignModelForSelected(scope) {
                var selectedOption,
                    selectedValue = scope.modelProxy;

                // ModelProxy is undefined, then update the _dataVal which can be used when latest dataset is obtained.
                if (!scope._isChangedManually && WM.isUndefined(selectedValue) && WM.isDefined(scope._model_)) {
                    scope._dataVal = scope._model_;
                    scope._model_ = selectedValue;

                    //Invoke onChange to update the scopedatavalue.
                    if (scope._onChange) {
                        scope._onChange();
                    }
                } else if (_.isNull(selectedValue)) { // key can never be null, so return model as undefined.
                    scope._model_ = selectedValue;
                } else if (scope.datafield === ALLFIELDS) {
                    selectedOption = _.find(scope.displayOptions, {key : selectedValue});
                    if (selectedOption) {
                        scope._model_ = selectedOption.dataObject;
                    }
                } else {
                    scope._model_ = selectedValue;
                }

                // clear _dataVal when model is defined.
                if (WM.isDefined(scope._model_) && WM.isDefined(scope._dataVal)) {
                    scope._dataVal = undefined;
                }
            }

            /**
             * This function iterates over the modelProxy and assigns the model value. Here model is array of values.
             * If datafield is ALLFIELDS, modelProxy is 0, then model will be retrieved from dataObject in displayOptions
             * If datafield is other than ALLFIELDS, the modelProxy and model will be retrieved from key in displayOptions
             * @param scope widgetScope
             */
            function assignModelForMultiSelect(scope) {
                var selectedOption,
                    selectedCheckboxValue = scope.modelProxy;

                // ModelProxy is undefined or [] , then update the _dataVal which can be used when latest dataset is obtained.
                if (!scope._isChangedManually && WM.isDefined(scope._model_) && (WM.isUndefined(selectedCheckboxValue) || (_.isArray(selectedCheckboxValue) && !selectedCheckboxValue.length))) {
                    scope._dataVal = scope._model_;
                    scope.datavalue = selectedCheckboxValue;
                    scope._ngModelOldVal = scope._dataVal;

                    if (scope._onChange) {
                        scope._onChange();
                    }
                } else if (selectedCheckboxValue) {
                    scope._model_ = [];
                    _.forEach(selectedCheckboxValue, function (value) {
                        if (scope.datafield === ALLFIELDS) {
                            selectedOption = _.find(scope.displayOptions, {key : value});
                            scope._model_.push(selectedOption.dataObject);
                        } else {
                            scope._model_.push(value);
                        }
                    });

                    // clear _dataVal when model is defined.
                    if (scope._model_.length && WM.isDefined(scope._dataVal)) {
                        scope._dataVal = undefined;
                    }
                }
            }

            /**
             * This function finds the match in displayOptions depending on model param
             * @param displayOptions displayOptions
             * @param dataField
             * @param model value to be compared with
             * @returns object / string
             */
            function getSelectedObjFromDisplayOptions(displayOptions, dataField, model, compareby) {
                var selectedOption,
                    selectedOptions = [],
                    filterField = dataField === ALLFIELDS ? 'dataObject' : 'key';

                if (WM.isArray(model)) {
                    _.forEach(model, function (modelVal) {
                        selectedOption = _.find(displayOptions, function (obj) {
                            if (filterField === 'dataObject') {
                                if (compareby && compareby.length) {
                                    return Utils.isEqualWithFields(obj[filterField], modelVal, compareby);
                                }
                                return _.isEqual(WM.fromJson(WM.toJson(obj[filterField])), WM.fromJson(WM.toJson(modelVal)));
                            }
                            return _.toString(obj[filterField]) === _.toString(modelVal);
                        });

                        if (selectedOption) {
                            selectedOptions.push(selectedOption);
                        }
                    });
                    return selectedOptions;
                }
                selectedOption = _.find(displayOptions, function (obj) {
                    if (filterField === 'dataObject') {
                        if (compareby && compareby.length) {
                            return Utils.isEqualWithFields(obj[filterField], model, compareby);
                        }
                        return _.isEqual(WM.fromJson(WM.toJson(obj[filterField])), WM.fromJson(WM.toJson(model)));
                    }
                    return _.toString(obj[filterField]) === _.toString(_.trim(model));
                });

                return selectedOption;
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
                    selectedOption;

                if (scope._widgettype === 'wm-checkboxset' || scope._widgettype === 'wm-chips') {
                    // handle the model having comma separated string as default datavalue.
                    if (WM.isString(model) && model !== '') {
                        scope._model_ = model = _.map(model.split(','), _.trim);
                    } else if (!WM.isArray(model) && WM.isObject(model)) { // handle the model having object as default datavalue.
                        scope._model_ = [model];
                    }
                }

                // reset isChecked flag for displayOptions.
                _.forEach(scope.displayOptions, function (dataObj) {
                    dataObj.isChecked = false;
                });

                // If model is null, reset the modelProxy and displayValue.
                if (_.isNull(model) || _.isUndefined(model)) {
                    if (_.isArray(scope.modelProxy)) {
                        scope.modelProxy.length = 0;
                    } else {
                        scope.modelProxy = undefined;
                    }
                    if (_.isArray(scope.displayValue)) {
                        scope.displayValue.length = 0;
                    } else {
                        scope.displayValue = '';
                    }
                    return;
                }

                if (WM.isDefined(scope.displayOptions) && !scope.usekeys) {
                    selectedOption = getSelectedObjFromDisplayOptions(scope.displayOptions, scope.datafield, model, scope.compareby);

                    if (WM.isArray(model)) {
                        _modelProxy = [];

                        if (selectedOption.length) {
                            _.forEach(selectedOption, function (option) {
                                _modelProxy.push(option.key);
                            });
                        }
                    } else {
                        _modelProxy = undefined;

                        if (selectedOption) {
                            _modelProxy = selectedOption.key;
                        }
                    }
                } else {
                    _modelProxy = model;
                }

                scope.modelProxy = _modelProxy;


                if (scope.hasOwnProperty('displayValue')) {
                    setCheckedAndDisplayValues(scope, _modelProxy);
                }

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
            function getOrderedDataSet(dataset, orderby, innerItem) {
                if (!orderby) {
                    return dataset;
                }
                var items      = _.split(orderby, ','),
                    fields     = [],
                    directions = [];
                _.forEach(items, function (obj) {
                    var item = _.split(obj, ':');
                    fields.push(innerItem ? innerItem + '.' + item[0] : item[0]);
                    directions.push(item[1]);
                });
                return _.orderBy(dataset, fields, directions);
            }

            /*
             * parse dataSet to filter the options based on the datafield, displayfield & displayexpression
             * If "isModel" flag is set to true then check for variable binding on dataset etc. can be avoided.
             * For dataset binding, "isModel" is false.
             */
            function extractDataObjects(dataSet, scope, $el, isModel) {
                /*store parsed data in 'data'*/
                var data = dataSet,
                    useKeys = scope && scope.usekeys,
                    dataField = scope && scope.datafield,
                    displayField = getDisplayField(dataSet, scope.displayfield || scope.datafield),
                    objectKeys  = [],
                    isBoundToLiveVariable,
                    key,
                    value,
                    imgSrc;

                if (_.isEmpty(dataSet)) {
                    return;
                }

                if (!isModel) {
                    //Checking if widget is bound to service variable
                    if (scope.binddataset) {
                        isBoundToLiveVariable = _.startsWith(scope.binddataset, 'bind:Variables.') && getBoundVariableCategory(scope, scope.widgetid ? $rootScope.domScope : $el.scope()) === 'wm.LiveVariable';
                    }

                    // assign dataSet according to liveVariable or other variable
                    dataSet = (isBoundToLiveVariable && dataSet.hasOwnProperty('data')) ? dataSet.data : dataSet;
                    dataSet = getOrderedDataSet(dataSet, scope.orderby);
                }

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
                        if (scope.binddisplayimagesrc || scope.displayimagesrc) {
                            imgSrc = WidgetUtilService.getEvaluatedData(scope, dataSet, {expressionName: 'displayimagesrc'});
                        }
                        data.push({'key' : key, 'value' : value, 'imgSrc': imgSrc});
                    } else {
                        if (WM.isObject(dataSet[0])) {
                            _.forEach(dataSet, function (option) {
                                key   = WidgetUtilService.getObjValueByKey(option, dataField);
                                value = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                                if (scope.binddisplayimagesrc || scope.displayimagesrc) {
                                    imgSrc = WidgetUtilService.getEvaluatedData(scope, option, {expressionName: 'displayimagesrc'});
                                }
                                data.push({'key' : key, 'value' : value, 'dataObject': option, 'imgSrc': imgSrc});
                            });
                        } else {
                            _.forEach(dataSet, function (option) {
                                data.push({'key' : option, 'value' : option, 'dataObject': option});
                            });
                        }
                    }

                } else {
                    if (!WM.isArray(dataSet) && scope.binddataset && scope.binddataset.indexOf('selecteditem') > -1) {
                        key   = 0;
                        value = WidgetUtilService.getEvaluatedData(scope, dataSet, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                        if (scope.binddisplayimagesrc || scope.displayimagesrc) {
                            imgSrc = WidgetUtilService.getEvaluatedData(scope, dataSet, {expressionName: 'displayimagesrc'});
                        }
                        data.push({'key' : key, 'value' : value, 'dataObject': dataSet, 'imgSrc': imgSrc});
                    } else {
                        _.forEach(dataSet, function (option, index) {
                            if (WM.isObject(option)) {
                                if (scope.datafield === ALLFIELDS) {
                                    key = index;
                                    value = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                                    if (scope.binddisplayimagesrc || scope.displayimagesrc) {
                                        imgSrc = WidgetUtilService.getEvaluatedData(scope, option, {expressionName: 'displayimagesrc'});
                                    }
                                    data.push({'key' : key, 'value' : value, 'dataObject': option, 'imgSrc': imgSrc});
                                } else {
                                    key   = WidgetUtilService.getObjValueByKey(option, dataField);
                                    value = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                                    if (scope.binddisplayimagesrc || scope.displayimagesrc) {
                                        imgSrc = WidgetUtilService.getEvaluatedData(scope, option, {expressionName: 'displayimagesrc'});
                                    }
                                    data.push({'key' : key, 'value' : value, 'dataObject': option, 'imgSrc': imgSrc});
                                }
                            } else {
                                if (WM.isArray(dataSet)) {
                                    data.push({'key' : option, 'value' : option, 'dataObject': option});
                                } else {
                                    // If dataset is object with key, value and useKeys set to true, only keys are to be returned.
                                    data.push({'key' : index, 'value' : useKeys ? index : option, 'dataObject': option});
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

                scope.displayOptions = [];

                if (!dataset) {
                    return;
                }

                dataset = extractDataObjects(dataset, scope, $el);

                scope.displayOptions = _.uniqBy(dataset, 'key');

                // Omit all the options whose datafield (key) is null or undefined.
                _.remove(scope.displayOptions, function (option) {
                    return WM.isUndefined(option.key) || _.isNull(option.key);
                });

                // Use _dataVal as model when the displayOptions are updated i.e. when latest dataset is retrieved
                if (scope.displayOptions.length && WM.isDefined(scope._dataVal) && !_.isNull(scope._model_) && scope._model_ !== '' && (WM.isUndefined(scope._model_) || !scope._model_.length)) {
                    scope._model_ = scope._dataVal;
                }

                updatedCheckedValues(scope);

                Utils.triggerFn(scope.assignModelValue, scope);

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
                            groupedKeys[field[0]].keys.push({'title': _.replace(key, field[0] + '.', ''), 'index': index, 'key': key});
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
            function getRadiosetCheckboxsetTemplate(scope, element, widgetType) {
                var template = '',
                    liClass,
                    labelClass,
                    type,
                    required = '',
                    groupedKeys = {},
                    groupDataByUserDefinedFn,
                    groupedLiData,
                    elScope,
                //Generate a unique name for inputs in widget, so that when widget is used multiple times (like livelist), each widget behaves independently
                    uniqueName  = 'name=' + (scope.name || widgetType) + Utils.generateGUId();

                function getEndTemplate(_displayOptions) {
                    return '<li class="' + liClass + ' {{itemclass}}" ng-repeat="dataObj in ' + _displayOptions + ' track by $index" ng-class="{\'active\': dataObj.isChecked}">' +
                        '<label class="' + labelClass + '" ng-class="{\'disabled\':disabled}" title="{{dataObj.value}}">' +
                        '<input ' + uniqueName + required + ' type="' + type + '" ' + (scope.disabled ? ' disabled="disabled" ' : '') + 'data-attr-index="{{$index}}" value="{{dataObj.key}}" tabindex="{{tabindex}}" ng-checked="dataObj.isChecked"/>' +
                        '<span class="caption">{{dataObj.value.toString()}}</span>' +
                        '</label>' +
                        '</li>';
                }
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
                } else if (scope.groupby) {

                    if (_.includes(scope.groupby, '(')) {
                        elScope = element.scope();
                        if (elScope) {
                            groupDataByUserDefinedFn = elScope[scope.groupby.split('(')[0]];
                            groupedLiData = _.groupBy(scope.displayOptions, function (data) {
                                return Utils.triggerFn(groupDataByUserDefinedFn, data.dataObject);
                            });
                        }
                    } else {
                        groupedLiData = getGroupedData(scope.displayOptions, scope.groupby, scope.match, scope.orderby, scope.dateformat, 'dataObject');
                    }

                    scope.groupedData = getSortedGroupedData(groupedLiData, scope.groupby);

                    template = template +
                        '<li class="app-list-item-group" ng-repeat="groupObj in groupedData track by $index">' +
                            '<ul class="item-group">' +
                                '<li class="list-group-header" title="{{groupObj.key}}"  ng-class="{\'collapsible-content\' : collapsible}">' +
                                    '<h4 class="group-title">{{groupObj.key}}' +
                                        '<div class="header-action">' +
                                            '<i class="app-icon wi action wi-chevron-up" ng-if="collapsible" title="{{::$root.appLocale.LABEL_COLLAPSE}}/{{::$root.appLocale.LABEL_EXPAND}}"></i>' +
                                            '<span ng-if="showcount" class="label label-default">{{groupObj.data.length}}</span>' +
                                        '</div>' +
                                    '</h4>' +
                                '</li>' +
                                getEndTemplate('groupObj.data') +
                            '</ul>' +
                        '</li>'

                    if (scope.collapsible && scope.groupedData.length) {
                        // on groupby header click, collapse or expand the list-items.
                        element.on('click', 'li.list-group-header', function (e) {
                            var selectedGroup   = WM.element(e.target).closest('.item-group'),
                                selectedAppIcon = selectedGroup.find('li.list-group-header .app-icon');

                            if (selectedAppIcon.hasClass('wi-chevron-down')) {
                                selectedAppIcon.removeClass('wi-chevron-down').addClass('wi-chevron-up');
                            } else {
                                selectedAppIcon.removeClass('wi-chevron-up').addClass('wi-chevron-down');
                            }

                            selectedGroup.find('.app-checkbox').toggle();
                        });
                    }
                } else {
                    template = template +
                        getEndTemplate('displayOptions');
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

            //Format the date with given date format
            function filterDate(value, format, defaultFormat) {
                if (format === 'timestamp') { //For timestamp format, return the epoch value
                    return value;
                }
                return $filter('date')(value, format || defaultFormat);
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getTimeRolledUpString
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * This method returns the groupkey based on the rollup passed
             *
             * @param {str} string passed value
             * @param {rollUp} string rollUp
             * @param {dateformat} string date format
             */
            function getTimeRolledUpString(str, rollUp, dateformat) {
                var groupByKey,
                    currMoment = moment(),
                    strMoment  = moment(str),
                    dateFormat = dateformat,
                    getSameElseFormat = function () { //Set the sameElse option of moment calendar to user defined pattern
                        return '[' + filterDate(this.valueOf(), dateFormat, ROLLUP_PATTERNS.DAY) + ']';
                    };
                switch (rollUp) {
                    case TIME_ROLLUP_OPTIONS.HOUR:
                        dateFormat = dateFormat || AppDefaults.get('timeFormat');
                        if (!strMoment.isValid()) { //If date is invalid, check if data is in forom of hh:mm a
                            strMoment = moment(new Date().toDateString() + ' ' + str);
                            if (strMoment.isValid()) {
                                momentLocale._calendar.sameDay = function () { //As only time is present, roll up at the hour level with given time format
                                    return '[' + filterDate(this.valueOf(), dateFormat, ROLLUP_PATTERNS.HOUR) + ']';
                                };
                            }
                        }
                        strMoment = strMoment.startOf('hour'); //round off to nearest last hour
                        momentLocale._calendar.sameElse = getSameElseFormat;
                        groupByKey = strMoment.calendar(currMoment);
                        break;
                    case TIME_ROLLUP_OPTIONS.WEEK:
                        groupByKey = filterDate(strMoment.valueOf(), dateFormat, ROLLUP_PATTERNS.WEEK);
                        break;
                    case TIME_ROLLUP_OPTIONS.MONTH:
                        groupByKey = filterDate(strMoment.valueOf(), dateFormat, ROLLUP_PATTERNS.MONTH);
                        break;
                    case TIME_ROLLUP_OPTIONS.YEAR:
                        groupByKey = strMoment.format(ROLLUP_PATTERNS.YEAR);
                        break;
                    case TIME_ROLLUP_OPTIONS.DAY:
                        dateFormat = dateFormat || AppDefaults.get('dateFormat');
                        strMoment = strMoment.startOf('day'); //round off to current day
                        momentLocale._calendar.sameElse = getSameElseFormat;
                        groupByKey = strMoment.calendar(currMoment);
                        break;

                }
                if (groupByKey === 'Invalid date') { //If invalid date is returned, Categorize it as Others.
                    return GROUP_BY_OPTIONS.OTHERS;
                }
                return groupByKey;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getGroupDataFieldName
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * This method returns distinct group field name
             *
             * @param {groupkey} string passed group key
             * @param {count} number count to keep track
             */
            function getGroupDataFieldName(groupkey, count) {
                var regex                    = /\W/g,
                    groupedDataFieldName     = '_groupData' + groupkey;

                // replace special characters in groupkey by '_'
                if (regex.test(groupedDataFieldName)) {
                    groupedDataFieldName = groupedDataFieldName.replace(regex, '_') + count;
                }
                return groupedDataFieldName;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#setGroupedData
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * This method returns sorted data to set on scope based to groupkey
             *
             * @param {groupedLiData} array grouped data
             * @param {groupkey} string generated groupby key
             * @param {groupBy} string groupBy
             * @param {index} string index of the grouped data
             */
            function getSortedGroupedData(groupedLiData, groupBy) {
                var _groupedData = [];
                _.forEach(_.keys(groupedLiData), function (groupkey, index) {
                    var liData = groupedLiData[groupkey];
                    _groupedData.push({
                        'key':  groupkey,
                        'data': _.sortBy(liData, function (data) {
                            data._groupIndex = index + 1;
                            return data[groupBy];
                        })
                    });
                });
                return _groupedData;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getGroupedData
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * This method returns the gouped data
             *
             * @param {fieldDefs} string dataset
             * @param {groupby} string groupby
             * @param {match} string match
             * @param {orderby} string orderby
             * @param {dateFormat} string date format
             * @param {innerItem} string item to look for in the passed data
             */
            function getGroupedData(fieldDefs, groupby, match, orderby, dateFormat, innerItem) {
                var groupedLiData;
                // groups the fields based on the groupby value.
                function groupDataByField(liData) {
                    var concatStr = _.get(innerItem? liData[innerItem] : liData, groupby);

                    if (WM.isUndefined(concatStr) || _.isNull(concatStr)) {
                        return GROUP_BY_OPTIONS.OTHERS; // by default set the undefined groupKey as 'others'
                    }

                    // if match prop is alphabetic ,get the starting alphabet of the word as key.
                    if (match === GROUP_BY_OPTIONS.ALPHABET) {
                        concatStr = concatStr.substr(0, 1);
                    }

                    if (_.includes(_.values(TIME_ROLLUP_OPTIONS), match)) {
                        concatStr = getTimeRolledUpString(concatStr, match, dateFormat);
                    }

                    return concatStr;
                }

                if (!orderby) { //Apply implicit orderby on group by clause, if order by not specified
                    fieldDefs = getOrderedDataSet(fieldDefs, groupby, innerItem);
                }
                if (match === TIME_ROLLUP_OPTIONS.DAY) {
                    momentLocale._calendar = momentCalendarDayOptions; //For day, set the relevant moment calendar options
                }
                // handling case-in-sensitive scenario
                fieldDefs = _.orderBy(fieldDefs, function (fieldDef) {
                    var groupKey = _.get(innerItem ? fieldDef[innerItem] : fieldDef, groupby);
                    if (groupKey) {
                        return _.toLower(groupKey);
                    }
                });
                groupedLiData = _.groupBy(fieldDefs, groupDataByField);
                momentLocale._calendar = momentCalendarOptions; //Reset to default moment calendar options
                return groupedLiData;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#showOrHideMatchProperty
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * This method shows or hide match based on the groupby
             *
             * @param {$is} object isolate scope of the widget
             * @param {variable} object variable bound
             * @param {wp} object widget properties
             */
            function showOrHideMatchProperty($is, variable, wp) {
                var matchDataTypes  = ['string', 'date', 'time', 'datetime', 'timestamp'],
                    matchServiceDataTypes  = ['java.lang.String', 'java.sql.Date', 'java.sql.Time', 'java.sql.Datetime', 'java.sql.Timestamp'],
                    typeUtils = Utils.getService('TypeUtils'),
                    variableCategory = variable && variable.category;

                if (!$is.binddataset || $is.groupby === WIDGET_CONSTANTS.EVENTS.JAVASCRIPT) {
                    return;
                }

                if (!$is.groupby || _.includes($is.groupby, '(')) {
                    wp.match.show = false;
                } else if (variableCategory) {
                    if (variableCategory === 'wm.LiveVariable') {
                        wp.match.show = _.includes(matchDataTypes, _.toLower(Utils.extractType(typeUtils.getTypeForExpression($is.binddataset + '.' + $is.groupby))));
                    } else if (variableCategory === 'wm.DeviceVariable') {
                        wp.match.show = _.includes(matchDataTypes, DeviceVariableService.getFieldType(variable, $is.groupby));
                    } else if (variableCategory === 'wm.ServiceVariable' || variableCategory === 'wm.Variable') {
                        wp.match.show = _.includes(matchServiceDataTypes, typeUtils.getTypeForExpression($is.binddataset + '.' + $is.groupby));
                    }
                }
                if (!wp.match.show) {
                    $rootScope.$emit('set-markup-attr', $is.widgetid, {'match': ''});
                    $is.match = '';
                }
                wp.showcount.show = wp.collapsible.show = $is.groupby ? true : false;

                if (!wp.collapsible.show) {
                    $rootScope.$emit('set-markup-attr', $is.widgetid, {'collapsible': ''});
                    $is.collapsible = false;
                }

                if (!wp.showcount.show) {
                    $rootScope.$emit('set-markup-attr', $is.widgetid, {'showcount': ''});
                    $is.showcount = false;
                }
            };

            this.getDisplayField                 = getDisplayField;
            this.setPropertiesTextWidget         = setPropertiesTextWidget;
            this.createDataKeys                  = createDataKeys;
            this.extractDisplayOptions           = extractDisplayOptions;
            this.extractDataObjects              = extractDataObjects;
            this.updateCheckedValue              = updateCheckedValue;
            this.assignModelForMultiSelect       = assignModelForMultiSelect;
            this.assignModelForSelected          = assignModelForSelected;
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
            this.getGroupedData                  = getGroupedData;
            this.getSortedGroupedData            = getSortedGroupedData;
            this.getGroupDataFieldName           = getGroupDataFieldName;
            this.showOrHideMatchProperty         = showOrHideMatchProperty;
            this.getSelectedObjFromDisplayOptions = getSelectedObjFromDisplayOptions;
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
        'AUTOCOMPLETE' : 'autocomplete',
        'CHIPS'        : 'chips',
        'COLORPICKER'  : 'colorpicker'
    })
    .constant('FIELD_TO_WM_WIDGET_MAP', {
        'text'         : 'wm-text',
        'number'       : 'wm-number',
        'textarea'     : 'wm-textarea',
        'password'     : 'wm-text',
        'checkbox'     : 'wm-checkbox',
        'toggle'       : 'wm-checkbox',
        'slider'       : 'wm-slider',
        'richtext'     : 'wm-richtexteditor',
        'currency'     : 'wm-currency',
        'switch'       : 'wm-switch',
        'select'       : 'wm-select',
        'checkboxset'  : 'wm-checkboxset',
        'radioset'     : 'wm-radioset',
        'date'         : 'wm-date',
        'time'         : 'wm-time',
        'timestamp'    : 'wm-timestamp',
        'upload'       : 'wm-upload',
        'rating'       : 'wm-rating',
        'datetime'     : 'wm-datetime',
        'autocomplete' : 'wm-search',
        'chips'        : 'wm-chips',
        'colorpicker'  : 'wm-colorpicker'
    })
    .service('DateTimeWidgetUtils', ['CONSTANTS', '$timeout', 'Utils', function (CONSTANTS, $timeout, Utils) {
        /**
         * returns true if the input value is default (i.e open date picker on input click)
         * @param1 dropdownvalue, user selected value (by default datepicker opens on input click)
         * **/
        function isDropDownDisplayEnabledOnInput(dropdownvalue) {
            return dropdownvalue === CONSTANTS.DATEPICKER_DROPDOWN_OPTIONS.DEFAULT;
        }

        /**
         * This function sets the focus to Datepicker/TimePicker
         * @param scope - scope of the active element
         * @param isDatepicker - true if the element to be focused is DatePicker
         */
        function setFocusOnDateOrTimePicker(scope, isDatepicker) {
            if (isDatepicker) {
                $timeout(function () {
                    $('.uib-datepicker-popup').addClass('active');
                    scope.$broadcast('uib:datepicker.focus');
                }, 300);
            } else {
                /*$timeout is used so that by then time input has the updated value. focus is setting back to the input field*/
                $timeout(function () {
                    $('.uib-time.hours input').filter(':visible').focus();
                });
            }
        }

        /**
         * This function sets the focus to Datepicker/TimePicker Input when
         * 1. the date/ time is set
         * 2. on tab/shift+tab, focusing the input
         * 3. focus the timepicker after selecting the date in case of DateTime Picker
         * @param scope - scope of the active element
         * @param focusTimepicker - true if the element to be focused is TimePicker
         * * @param focusDatepicker - true if the element to be focused is DatePicker
         */
        function setFocusOnElement(scope, focusTimepicker) {
            //$element is undefined in the studio mode
            if (scope.$element) {
                if (scope._widgettype === 'wm-date') {
                    scope.$element.find('.app-dateinput').focus();
                } else if (scope._widgettype === 'wm-datetime') {
                    if (focusTimepicker) {
                        setFocusOnDateOrTimePicker();
                    } else {
                        scope.$element.find('.display-input').focus();
                    }
                } else if (scope._widgettype === 'wm-time') {
                    scope.$element.find('.display-input').focus();
                }
            }

        }

        /**
         * This function sets the value isOpen/isDateOpen (i.e when datepicker popup is closed) based on widget type(i.e Date, DateTime)
         * @param $is - scope of the active element
         */
        function setIsDateOpen($is) {
            if ($is._widgettype === 'wm-date') {
                $is.isOpen = false;
            } else if ($is._widgettype === 'wm-datetime') {
                $is.isDateOpen = false;
            }
        }

        /**
         * This function sets the value isOpen/isTimeOpen (i.e when datepicker popup is closed) based on widget type(i.e  DateTime, Time)
         * @param $is - scope of the active element
         * @param val - isOpen/isTimeOpen is set based on the timepicker popup is open/closed
         */
        function setIsTimeOpen($is, val) {
            if ($is._widgettype === 'wm-datetime') {
                $is.isTimeOpen = val;
            } else if ($is._widgettype === 'wm-time') {
                $is.isOpen = val;
            }
        }

        /**
         * This function sets the keyboard events to Datepicker popup
         * @param $is - scope of the active element
         */
        function setDatePickerKeyboardEvents($is) {
            $timeout(function () {
                var datepickerEle = WM.element('body').find('> [uib-datepicker-popup-wrap] .uib-datepicker-popup');
                datepickerEle.find('.uib-button-bar .uib-close').on('keydown', function (evt) {
                    if (Utils.getActionFromKey(evt) === 'TAB') {
                        setIsDateOpen($is);
                        setIsTimeOpen($is, true);
                        setFocusOnElement($is, true);
                    } else if (Utils.getActionFromKey(evt) === 'ENTER') {
                        evt.preventDefault();
                        evt.stopPropagation();
                        setIsDateOpen($is);
                        setIsTimeOpen($is, true);
                        /*$timeout is used so that by then date/datetime input has the updated value. focus is setting back to the input field*/
                        $timeout(function() {
                            setFocusOnElement($is, true);
                        }, 100);
                    }
                });
                datepickerEle.find('.uib-button-bar .uib-clear').on('keydown', function (evt) {
                    /* clear the model and set focus back to input when Clear button is clicked.*/
                   if (Utils.getActionFromKey(evt) === 'ENTER') {
                       setIsDateOpen($is);
                       $is._model_ = '';
                       /*$timeout is used so that by then date/datetime input has the updated value. focus is setting back to the input field*/
                       $timeout(function() {
                           setFocusOnElement($is);
                       });
                   }
                });
                datepickerEle.find('.uib-datepicker').on('keydown', function (evt) {
                    if (Utils.getActionFromKey(evt) === 'SHIFT+TAB') {
                        setIsDateOpen($is);
                        $timeout(function() {
                            setFocusOnElement($is);
                        });
                    } else if (Utils.getActionFromKey(evt) === 'CTRL-UP-ARROW' || Utils.getActionFromKey(evt) === 'CTRL-DOWN-ARROW') {
                        setFocusOnDateOrTimePicker($is, true);
                    } else if (Utils.getActionFromKey(evt) === 'TAB' && !$is.showbuttonbar) {
                        setIsDateOpen($is);
                        setIsTimeOpen($is, true);
                        setFocusOnElement($is, true);
                    } else if (Utils.getActionFromKey(evt) === 'ESC') {
                        setIsDateOpen($is);
                        $timeout(function() {
                            setFocusOnElement($is);
                        });
                    } else if (Utils.getActionFromKey(evt) === 'ENTER') {
                        /**
                         * if the focus is in monthpicker/yearpicker popup shouldn't be closed, on enter key (selecting the year and month) the focus should go back to daypicker
                         * and the disabled date shouldnot be selected from the datepicker*/
                        if ($(evt.target).closest('.uib-daypicker')[0] && !($(evt.originalEvent.srcElement).scope() && $(evt.originalEvent.srcElement).scope().activeDt.disabled)) {
                            setIsDateOpen($is);
                            setIsTimeOpen($is, true);
                            $timeout(function() {
                                setFocusOnElement($is, true);
                            });
                        } else {
                            setFocusOnDateOrTimePicker($is, true);
                        }
                    }
                });
            });
        }

        /**
         * This function sets the events to given element
         * @param $is - scope of the active element
         * @param $el - element on which the event is added
         * @keyCodeArray array of key codes, based on the code action is to be performed
         * @stopPropagation boolean value decides whether to stop propagation or not
         * @preventDefault boolean value decides whether to prevent default behavior or not
         */
        function addEventsOnTimePicker($is, $el, keyCodeArray, stopPropagation, preventDefault) {
            $el.on('keydown', function (evt) {
               if (_.includes(keyCodeArray, Utils.getActionFromKey(evt))) {
                   setIsTimeOpen($is, false);
                   setFocusOnElement($is);
                   if (stopPropagation) {
                       evt.stopPropagation();
                   }
                   if (preventDefault) {
                       //live form, after selecting the time on click of enter, time should be selected instead of inserting the record
                       evt.preventDefault();
                   }
               }
            });
        }


        /**
         * This function sets the keyboard events to Timepicker popup
         * @param $is - scope of the active element
         */
        function setTimePickerKeyboardEvents($is) {
            $timeout(function () {
                var timepickerEle = WM.element('body').find('> [uib-dropdown-menu] > [uib-timepicker]'),
                    timepickerElements = timepickerEle.find('.uib-time').not('.ng-hide'),
                    $firstEl = $(timepickerElements[0]),
                    $lastEl = $(timepickerElements[timepickerElements.length - 1]);
                timepickerEle.parent().addClass('app-datetime');
                addEventsOnTimePicker($is, timepickerEle, ['ESC'], true);
                addEventsOnTimePicker($is, $lastEl, ['TAB'], false);
                addEventsOnTimePicker($is, $firstEl, ['SHIFT+TAB', 'ENTER'], true, true);
                addEventsOnTimePicker($is, timepickerEle.find('.uib-time.minutes'), ['ENTER'], true, true);
                addEventsOnTimePicker($is, timepickerEle.find('.uib-time.seconds'), ['ENTER'], true, true);
            }, 0, false);
        }

        /**
         * This function adjusts the Timepicker popup position when it is going outside of the page
         */
        function setTimePickerDropdownPosition() {
            $timeout(function () {
                var $popupElem = WM.element('body').find('> [uib-dropdown-menu]');
                var $popupElemLeft = _.parseInt($popupElem.css('left'));
                var $popupElemWidth = _.parseInt($popupElem.css('width'));
                var viewPortWidth = $(window).width();
                // check whether popup is not completely visible on right side of the page
                if ($popupElemLeft + $popupElemWidth > viewPortWidth) {
                    $popupElem.css('left', 'auto');
                    $popupElem.css('right', '10px');
                }
            })
        }

        /**
         * This function sets the keyboard events to Date, Daettime Time picker button
         * @param $el - element on which the event is to be added
         */
        function setKeydownEventOnPickerButtons($el) {
            $el.on('keydown', function ($event) {
                //When Date, Time, Datetime picker are inside the Datatable, Live Form, etc on Date picker button click stopping the propagation so that picker is opened instead of inserting the record
                if (Utils.getActionFromKey($event) === 'ENTER') {
                    $event.stopPropagation();
                }
            });
        }

        this.isDropDownDisplayEnabledOnInput = isDropDownDisplayEnabledOnInput;
        this.setFocusOnElement               = setFocusOnElement;
        this.setFocusOnDateOrTimePicker      = setFocusOnDateOrTimePicker;
        this.setDatePickerKeyboardEvents     = setDatePickerKeyboardEvents;
        this.setTimePickerKeyboardEvents     = setTimePickerKeyboardEvents;
        this.setTimePickerDropdownPosition   = setTimePickerDropdownPosition;
        this.setKeydownEventOnPickerButtons  = setKeydownEventOnPickerButtons;
    }]);
