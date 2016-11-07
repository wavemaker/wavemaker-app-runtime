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
        '$rootScope',
        '$filter',

        function (WidgetUtilService, Utils, Variables, $rootScope, $filter) {
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
                if (scope.dataKeys && scope.checkedValues) {
                    var model = scope._model_,
                        dataObj = WM.isArray(scope.dataObject) ? {} : scope.dataObject;
                    if (scope._widgettype === 'wm-checkboxset' && WM.isString(model) && model !== '') {
                        model = model.split(',');
                    }
                    _.forEach(scope.dataKeys, function (dataKey) {
                        scope.checkedValues[dataKey] = scope.valueInModel(model, dataKey, dataObj[dataKey]);
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

                // using orderedKeys as dataKeys
                function getKeys() {
                    if (scope.orderedKeys.length) {
                        return scope.orderedKeys;
                    }
                    return Object.keys(scope.dataObject);
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
                updatedCheckedValues(scope);
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
            function parseDataSet(dataSet, scope) {
                /*store parsed data in 'data'*/
                var data = dataSet,
                    dataField = scope.datafield,
                    useKeys = scope.usekeys,
                    objectKeys = [],
                    orderedKeys = [],
                    displayField = getDisplayField(dataSet, scope.displayfield);

                scope.widgetProps.displayfield.value = displayField;

                /*parsing the dataSet only if it is an array*/
                if (WM.isArray(dataSet)) {
                    dataSet = getOrderedDataSet(dataSet, scope.orderby);
                    /*if only keys of the object within dataset value needs to be used.*/
                    if (useKeys) {
                        data = {};
                        /*getting keys of the object*/
                        objectKeys = WM.isObject(dataSet[0]) ? Object.keys(dataSet[0]) : [];
                        /*iterating over object keys and creating checkboxset dataset*/
                        _.forEach(objectKeys, function (key) {
                            data[key] = key;
                        });
                    } else {
                        /*if filter dataSet if datafield is select other than 'All Fields'*/
                        if (dataField) {
                            data = {};

                            _.forEach(dataSet, function (option) {
                                var key = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: "displayfield", expressionName: "displayexpression"}, displayField);
                                data[key] = dataField === ALLFIELDS ? option : _.get(option, dataField);
                                orderedKeys.push(key);
                            });
                        }
                    }
                } else if (WM.isObject(dataSet)) {
                    /* check for supporting data from sources other than live variable */
                    data = {};
                    /*getting keys of the object*/
                    objectKeys = Object.keys(dataSet);
                    /*iterating over object keys and creating checkboxset dataset*/
                    _.forEach(objectKeys, function (key) {
                        data[key] = key;
                    });
                }
                scope.orderedKeys = orderedKeys;
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
                var val = _.get(scope.dataObject, value);
                //Don't trim in case of dataset is object
                if (!WM.isObject(scope.dataObject)) {
                    value = WM.isString(value) ? value.trim() : value;
                }

                /*populating model if dataSet is string*/
                if (WM.isString(dataSet)) {
                    return value;
                }
                if (WM.isArray(dataSet)) {
                    /*if dataSet is array and array values are objects*/
                    if (WM.isObject(dataSet[0]) && val) {
                        return val;
                    }
                    /*if dataSet is array*/
                    return value;
                }
                /*if dataSet is object*/
                if (checkedValue) {
                    return val;
                }
                return value;
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
            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#getRadiosetCheckboxsetTemplate
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to create the widget template for radioset and checkboxset based on the dataKeys created.
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
                    groupedKeys = {};
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
                    required = ' data-ng-required="' + scope.required + '" name=' + scope.name;
                    break;
                }

                groupedKeys = getGroupedFields(scope.dataKeys, scope.groupFields);

                _.forEach(_.keys(groupedKeys), function (key) {
                    if (key !== 'all') {
                        template = template +
                                '<li class="' + liClass + ' group-header" title="' + key + '" data-fixed-header="true"><i class="wi wi-arrow-drop-down group-icon"></i><span class="group-title">' + key + '</span></li>';
                    }

                    _.forEach(groupedKeys[key].keys, function (dataKey) {
                        dataKey.title    = WM.isString(dataKey.title) ? dataKey.title.trim() : dataKey.title;
                        //needed to parse the key if the bound dataset is having the key with '\'.
                        var parsedKey = _.includes(dataKey.key, '\\') ? _.replace(dataKey.key, '\\', '\\\\') : dataKey.key;
                        template = template +
                            '<li class="' + liClass + ' {{itemclass}}" data-ng-class="{\'active\':checkedValues[' + "'" + parsedKey + "'" + ']}">' +
                                '<label class="' + labelClass + '" data-ng-class="{\'disabled\':disabled}" title="' + dataKey.key + '">' +
                                    '<input ' + required + ' type="' + type + '" ' + (scope.disabled ? ' disabled="disabled" ' : '') + 'data-attr-index=' + dataKey.index + ' value="' + dataKey.key + '" tabindex="' + scope.tabindex + '" data-ng-checked="checkedValues[' + "'" + parsedKey + "'" + ']"/>' +
                                    '<span class="caption">' + dataKey.title + '</span>' +
                                '</label>' +
                            '</li>';
                    });
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

            this.getDisplayField                = getDisplayField;
            this.setPropertiesTextWidget        = setPropertiesTextWidget;
            this.createDataKeys                 = createDataKeys;
            this.getParsedDataSet               = getParsedDataSet;
            this.getModelValue                  = getModelValue;
            this.getRadiosetCheckboxsetTemplate = getRadiosetCheckboxsetTemplate;
            this.getBoundVariableCategory       = getBoundVariableCategory;
            this.appendMessage                  = appendMessage;
            this.getProxyEventsMap              = getProxyEventsMap;
            this.getFocusBlurEvents             = getFocusBlurEvents;
            this.eventProxy                     = eventProxy;
            this.getTimestampFromDate           = getTimestampFromDate;
            this.getProxyExcludeDates           = getProxyExcludeDates;
            this.getUpdatedModel                = getUpdatedModel;
            this.updatedCheckedValues           = updatedCheckedValues;
            this.getOrderedDataSet              = getOrderedDataSet;
            this.disableDates                   = disableDates;
            this.setFixedHeader                 = setFixedHeader;
            this.getGroupedFields               = getGroupedFields;
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
