/*global WM, moment, _, confirm*/

/**
 * @ngdoc service
 * @name wm.widgets.live.LiveWidgetUtils
 * @requires Utils
 * The `LiveWidgetUtils` service provides utility methods for Live widgets.
 */
WM.module('wm.widgets.live')
    .service('LiveWidgetUtils', [
        'Utils',
        '$rootScope',

        function (Utils, $rs) {
            'use strict';
            var keyEventsWidgets = ['number', 'text', 'select', 'password', 'textarea'],
                eventTypes = ['onChange', 'onBlur', 'onFocus', 'onMouseleave', 'onMouseenter', 'onClick'],
                allEventTypes = eventTypes.concat('onKeypress', 'onKeydown', 'onKeyup');
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#formatBooleanValue
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the formatted boolean value
             *
             * @param {string} value value to be formatted
             */
            function formatBooleanValue(value) {
                if (value === 'true') {
                    return true;
                }
                if (value === 'false') {
                    return false;
                }
                return value;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getEventTypes
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return event types based on widget type if provided
             *
             * @param {string} widgetType type to the widget
             */
            function getEventTypes(widgetType) {
                if (widgetType) {
                    if (_.includes(keyEventsWidgets, widgetType.toLowerCase())) {
                        return allEventTypes;
                    }
                    return eventTypes;
                }
                return allEventTypes;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getDefaultValue
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the formatted default value
             *
             * @param {string} value value to be formatted
             * @param {string} type column type of the value
             */
            function getDefaultValue(value, type) {
                if (Utils.isNumberType(type)) {
                    return isNaN(Number(value)) ? null : Number(value);
                }
                if (type === 'boolean') {
                    return formatBooleanValue(value);
                }
                return value;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getFormButtons
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the default button definitions of live form.
             */
            function getFormButtons() {
                return [
                    {
                        key         :    'reset',
                        class       :    'form-reset btn-secondary',
                        iconclass   :    'glyphicon glyphicon-refresh',
                        action      :    'reset()',
                        displayName :    'Reset',
                        show        :    true,
                        type        :    'button',
                        updateMode  :    true
                    },
                    {
                        key         :   'cancel',
                        class       :   'form-cancel btn-secondary',
                        iconclass   :   'glyphicon glyphicon-remove-circle',
                        action      :   'cancel()',
                        displayName :   'Cancel',
                        show        :   true,
                        type        :   'button',
                        updateMode  :   true
                    },
                    {
                        key         :   'save',
                        class       :   'form-save btn-success',
                        iconclass   :   $rs.isMobileApplicationType ? 'glyphicon glyphicon-ok' : 'glyphicon glyphicon-save',
                        action      :   '',
                        displayName :   'Save',
                        show        :   true,
                        type        :   'submit',
                        updateMode  :   true
                    },
                    {
                        key         :   'delete',
                        class       :   'form-delete btn-secondary',
                        iconclass   :   'glyphicon glyphicon-remove',
                        action      :   'delete()',
                        displayName :   'Delete',
                        show        :   true,
                        type        :   'button',
                        updateMode  :   false
                    },
                    {
                        key         :   'edit',
                        class       :   'form-update btn-secondary',
                        iconclass   :   'glyphicon glyphicon-pencil',
                        action      :   'edit()',
                        displayName :   'Edit',
                        show        :   true,
                        type        :   'button',
                        updateMode  :   false
                    },
                    {
                        key         :   'new',
                        class       :   'form-new btn-success',
                        iconclass   :   'glyphicon glyphicon-plus',
                        action      :   'new()',
                        displayName :   'New',
                        show        :   true,
                        type        :   'button',
                        updateMode  :   false
                    }];
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getFieldTypeWidgetTypesMap
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the widget types for liveFilter and liveForm .
             */
            function getFieldTypeWidgetTypesMap() {
                var fieldTypeWidgetTypeMap = {
                    'integer'    : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider'],
                    'big_integer': ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider'],
                    'short'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider'],
                    'float'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider'],
                    'big_decimal': ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider'],
                    'double'     : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider'],
                    'byte'       : ['text', 'number', 'select', 'checkboxset', 'radioset'],
                    'string'     : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp'],
                    'character'  : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset'],
                    'text'       : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp'],
                    'date'       : ['date', 'text', 'number', 'select', 'checkboxset', 'radioset'],
                    'time'       : ['time', 'text', 'number', 'select', 'checkboxset', 'radioset'],
                    'timestamp'  : ['timestamp', 'text', 'number', 'select', 'checkboxset', 'radioset'],
                    'datetime'   : ['datetime', 'text', 'select', 'checkboxset', 'radioset'],
                    'boolean'    : ['checkbox', 'radioset', 'toggle', 'select'],
                    'list'       : ['select', 'radioset', 'checkboxset', 'text', 'number'],
                    'clob'       : ['text', 'number', 'select', 'textarea', 'richtext'],
                    'blob'       : ['upload', 'text', 'number', 'select', 'textarea', 'richtext'],
                    'custom'     : ['text', 'number',  'textarea', 'password', 'checkbox', 'slider', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp']
                };
                return fieldTypeWidgetTypeMap;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getColumnDef
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the common properties to liveFilter and liveForm .
             */
            function getColumnDef(attrs) {
                var columnDef = {},
                    widgetType = attrs.widget || (attrs.widgetType && attrs.widgetType.toLowerCase()) || getFieldTypeWidgetTypesMap()[attrs.type || 'text'][0],
                    excludeKeys = ['$attr', '$$element', 'name', 'initWidget', 'role', 'widgetid', 'wmResizable', 'wmWidgetDrag', 'value'];
                /*Loop through the attrs keys and set it to columndef*/
                _.each(attrs, function (value, key) {
                    /*Exclude special type of keys*/
                    if (!_.includes(excludeKeys, key)) {
                        columnDef[key] = value;
                    }
                });
                /*Handle special cases properties*/
                columnDef.displayName = attrs.displayName || attrs.caption;
                columnDef.pcDisplay = WM.isDefined(attrs.pcDisplay) ? (attrs.pcDisplay === "1" || attrs.pcDisplay === "true") : true;
                columnDef.mobileDisplay = WM.isDefined(attrs.mobileDisplay) ? (attrs.mobileDisplay === "1" || attrs.mobileDisplay === "true") : true;
                columnDef.show = (attrs.show === '1' || attrs.show === 'true');
                columnDef.type = attrs.type || 'text';
                columnDef.widget = widgetType; /*Widget type support for older projects*/
                columnDef.primaryKey = attrs.primaryKey === 'true' || attrs.primaryKey === true;
                columnDef.readonly = attrs.readonly === 'true' || attrs.readonly === true;
                columnDef.multiple = attrs.multiple === 'true' || attrs.multiple === true;
                columnDef.defaultValue = attrs.defaultValue;
                columnDef.class = attrs.class || '';
                columnDef.required = attrs.required === 'true' || attrs.required === true;
                /*Set the text type based on the widget*/
                if (columnDef.widget === 'text') {
                    columnDef.inputtype = attrs.inputtype || 'text';
                } else if (columnDef.widget === 'number') {
                    columnDef.inputtype = 'number';
                } else if (columnDef.widget === 'password') {
                    columnDef.inputtype = 'password';
                }
                return columnDef;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getButtonDef
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the common button attributes to liveFilter, liveForm and grid .
             */
            function getButtonDef(attrs) {
                return {
                    'key'           :   attrs.key || attrs.binding,
                    'displayName'   :   attrs.displayName || attrs.label || attrs.caption,
                    'show'          :   attrs.show === '1' || attrs.show === 'true' || attrs.show === true,
                    'class'         :   attrs.class || '',
                    'iconclass'     :   attrs.iconclass,
                    'action'        :   attrs.action,
                    'accessroles'   :   attrs.accessroles || ''
                };
            }

            /*Returns step attribute value based on input type*/
            function getStepValue(type) {
                if (type === 'text') {
                    return '';
                }
                if (type === 'float') {
                    return 0.01;
                }
                if (type === 'double') {
                    return 0.001;
                }
                if (type === 'integer') {
                    return 1;
                }
                return undefined;
            }

            function getCaptionByWidget(type, index) {
                var caption = 'formFields[' + index + '].value';
                if (type === 'password') {
                    return '********';
                }
                if (type === 'datetime' || type === 'timestamp') {
                    caption += ' | date:formFields[' + index + '].datepattern || \'yyyy-MM-dd HH:mm:ss\'';
                } else if (type === 'time') {
                    caption += ' | date:\'HH:mm:ss\'';
                } else if (type === 'date') {
                    caption += ' | date:formFields[' + index + '].datepattern';
                } else if (type === 'select') {
                    caption =  'formFields[' + index + '].isRelated ? getDisplayExpr(formFields[' + index + '].value, formFields[' + index + '].displayvalue || formFields[' + index + '].displayfield) : formFields[' + index + '].value';
                } else if (type === 'rating') {
                    caption = '';
                }
                return '{{' + caption + '}}';
            }

            function getFormFields(fieldDef, index, type) {
                var fields = '',
                    dateTypes = ['date', 'datetime'],
                    textTypes = ['text', 'password', 'textarea'],
                    excludeMaxValTypes = ['rating'],
                    evtTypes = getEventTypes(),
                    excludeProperties = ['caption', 'type', 'show', 'placeholder', 'minPlaceholder', 'maxPlaceholder', 'readonly', 'inputtype'];
                Object.keys(fieldDef).forEach(function (field) {
                    if (_.includes(excludeProperties, field)) {
                        return;
                    }
                    if (fieldDef[field]) {
                        if (field === 'key' || field === 'field') {
                            fields += ' name="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'displayvalue') {
                            fields += ' displayexpression="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'permitted') {
                            fields += ' accept="{{formFields[' + index + '].' + field + '}}"';
                        } else if (_.includes(dateTypes, type) && (field === 'minvalue' || field === 'maxvalue')) {
                            //For date, datetime, timestamp special cases
                            if (field === 'minvalue') {
                                fields += ' mindate="{{formFields[' + index + '].' + field + '}}"';
                            } else if (field === 'maxvalue') {
                                fields += ' maxdate="{{formFields[' + index + '].' + field + '}}"';
                            }
                        } else if (_.includes(textTypes, type) && field === 'maxvalue') {
                            fields += ' maxchars="{{formFields[' + index + '].' + field + '}}"';
                        } else if (_.includes(evtTypes, field)) {
                            fields += ' ' + Utils.hyphenate(field) + '="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'textAlignment') {
                            fields += ' textalign="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'ngclass') {
                            fields += ' data-ng-class="{{formFields[' + index + '].' + field + '}}"';
                        } else if (!(_.includes(excludeMaxValTypes, type))) {
                            fields += ' ' + field + '="{{formFields[' + index + '].' + field + '}}"';
                        }
                    }
                });
                return fields;
            }
            /*Returns the default template*/
            function getDefaultTemplate(widgetType, fieldDef, index, minPlaceholderDefault, maxPlaceholderDefault, defaultPlaceholder, additionalFields, isCustomWidget) {
                var template = '',
                    widgetName = 'wm-' + widgetType,
                    updateModeCondition = isCustomWidget ? '' : ' show="{{isUpdateMode}}"';
                additionalFields = additionalFields || '';
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || minPlaceholderDefault;
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || maxPlaceholderDefault;
                    template = template +
                        '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-6' : 'col-sm-6') + '"><' + widgetName + ' ' +  getFormFields(fieldDef, index, widgetType) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + updateModeCondition +  additionalFields + '></' +  widgetName + '></div>' +
                        '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-6' : 'col-sm-6') + '"><' + widgetName + ' ' +  getFormFields(fieldDef, index, widgetType) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + updateModeCondition + additionalFields + '></' +  widgetName + '></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || defaultPlaceholder;
                    template = template + '<' + widgetName + ' ' +  getFormFields(fieldDef, index, widgetType) + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + updateModeCondition + additionalFields + '></' +  widgetName + '>';
                }
                return template;
            }
            /*Returns datatime/timestamp template*/
            function getDateTimeTemplate(fieldDef, index) {
                return getDefaultTemplate('datetime', fieldDef, index, 'Select Min date time', 'Select Max date time', 'Select date time');
            }

            /*Returns time template*/
            function getTimeTemplate(fieldDef, index) {
                return getDefaultTemplate('time', fieldDef, index, 'Select Min time', 'Select Max time', 'Select time');
            }

            /*Returns date template*/
            function getDateTemplate(fieldDef, index) {
                return getDefaultTemplate('date', fieldDef, index, 'Select Min date', 'Select Max date', 'Select date');
            }

            /*Returns upload template */
            function getFileUploadTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.filetype === 'image') {
                    template = template + '<a class="form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value || formFields[' + index + '].href"><img height="2em" class="glyphicon glyphicon-file" src="{{formFields[' + index + '].href}}"/></a>';
                } else {
                    template = template + '<a class="form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value !== null"><i class="glyphicon glyphicon-file"></i></a>';
                }
                template = template + '<input data-ng-class="{\'file-readonly\': formFields[' + index + '].readonly}" required="{{formFields[' + index + '].required}}" type="file" name="{{formFields[' + index + '].key}}" ng-required="{{formFields[' + index + '].required}}" ng-readonly="{{formFields[' + index + '].readonly}}" data-ng-show="isUpdateMode" data-ng-model="formFields[' + index + '].value" accept="{{formFields[' + index + '].permitted}}"/>';
                return template;
            }

            /*Returns textarea template */
            function getTextareaTemplate(fieldDef, index) {
                return getDefaultTemplate('textarea', fieldDef, index, '', '', 'Enter value');
            }

            /*Returns richtext template */
            function getRichtextTemplate(fieldDef, index) {
                return getDefaultTemplate('richtexteditor', fieldDef, index, '', '', 'Enter value');
            }

            /*Returns slider template */
            function getSliderTemplate(fieldDef, index) {
                var additionalFields,
                    stepVal = fieldDef.step || getStepValue(fieldDef.type);
                additionalFields = stepVal ? ' step="' + stepVal + '" ' : '';
                return getDefaultTemplate('slider', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns radioset template */
            function getRadiosetTemplate(fieldDef, index) {
                var additionalFields = ' scopedataset="formFields[' + index + '].dataset" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" dataset=""';
                return getDefaultTemplate('radioset', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns checkboxset template */
            function getCheckboxsetTemplate(fieldDef, index) {
                var additionalFields = ' scopedataset="formFields[' + index + '].dataset" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" dataset=""';
                return getDefaultTemplate('checkboxset', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns checkbox template */
            function getCheckboxTemplate(fieldDef, index, widgetType) {
                var additionalFields = widgetType === 'toggle' ? 'type="toggle"' : '';
                return getDefaultTemplate('checkbox', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns select template */
            function getSelectTemplate(fieldDef, index) {
                var additionalFields = 'scopedataset="formFields[' + index + '].dataset" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}"';
                return getDefaultTemplate('select', fieldDef, index, 'Select Min value', 'Select Max value', 'Select value', additionalFields);
            }

            /*Returns text template */
            function getTextNumberTemplate(fieldDef, index) {
                var stepVal, additionalFields;
                stepVal = fieldDef.step || getStepValue(fieldDef.type);
                additionalFields = 'type="{{formFields[' + index + '].inputtype}}" ' + (stepVal ? (' step="' + stepVal + '"') : "");
                return getDefaultTemplate('text', fieldDef, index, 'Enter Min value', 'Enter Max value', 'Enter value', additionalFields);
            }

            function getRatingTemplate(fieldDef, index) {
                var additionalFields = ' maxvalue="{{formFields[' + index + '].maxvalue}}" ';
                return getDefaultTemplate('rating', fieldDef, index, '', '', '', additionalFields, true);
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getTemplate
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return template based on widgetType for liveFilter and liveForm.
             */
            function getTemplate(fieldDef, index, liveType) {
                var template = '',
                    widgetType,
                    fieldTypeWidgetTypeMap = getFieldTypeWidgetTypesMap();
                if (liveType === 'form') {
                    //Set 'Readonly field' placeholder for fields which are readonly and contain generated values if the user has not given any placeholder
                    if (fieldDef.readonly && fieldDef.generator === 'identity') {
                        fieldDef.placeholder = fieldDef.placeholder || '';
                    }
                } else if (liveType === 'filter') {
                    fieldDef.placeholder = fieldDef.minPlaceholder || '';
                }
                //Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap
                widgetType = fieldDef.widget || fieldTypeWidgetTypeMap[fieldDef.type][0];
                widgetType = widgetType.toLowerCase();
                template = template +
                    '<wm-composite widget="' + widgetType + '" show="{{formFields[' + index + '].show}}" class="live-field">' +
                    '<wm-label class="' + ($rs.isMobileApplicationType ? 'col-xs-4' : 'col-sm-3') + '" caption="{{formFields[' + index + '].displayName}}" hint="{{formFields[' + index + '].displayName}}" required="{{formFields[' + index + '].required}}"></wm-label>' +
                    '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-8' : 'col-sm-9') + '" {{formFields[' + index + '].class}}">' +
                    '<wm-label class="form-control-static" caption="' + getCaptionByWidget(widgetType, index) + '" show="{{!isUpdateMode}}"></wm-label>';

                switch (widgetType) {
                case 'number':
                case 'text':
                case 'password':
                    template += getTextNumberTemplate(fieldDef, index);
                    break;
                case 'select':
                    template += getSelectTemplate(fieldDef, index);
                    break;
                case 'checkbox':
                case 'toggle':
                    template += getCheckboxTemplate(fieldDef, index, widgetType);
                    break;
                case 'checkboxset':
                    template += getCheckboxsetTemplate(fieldDef, index);
                    break;
                case 'radioset':
                    template += getRadiosetTemplate(fieldDef, index);
                    break;
                case 'slider':
                    template += getSliderTemplate(fieldDef, index);
                    break;
                case 'richtext':
                    template += getRichtextTemplate(fieldDef, index);
                    break;
                case 'textarea':
                    template += getTextareaTemplate(fieldDef, index);
                    break;
                case 'upload':
                    template += getFileUploadTemplate(fieldDef, index);
                    break;
                case 'date':
                    template += getDateTemplate(fieldDef, index);
                    break;
                case 'time':
                    template += getTimeTemplate(fieldDef, index);
                    break;
                case 'datetime':
                case 'timestamp':
                    template += getDateTimeTemplate(fieldDef, index);
                    break;
                case 'rating':
                    template += getRatingTemplate(fieldDef, index, liveType);
                    break;
                default:
                    template += getDefaultTemplate('text', fieldDef, index, 'Enter Min value', 'Enter Max value', 'Enter value');
                    break;
                }
                template = template + '</div></wm-composite>';
                return template;
            }

            /**
            * @ngdoc function
            * @name wm.widgets.live.LiveWidgetUtils#getCustomItems
            * @methodOf wm.widgets.live.LiveWidgetUtils
            * @function
            *
            * @description
            * return the array of custom actions/events defined by the user.
            *
            * @param {string} actions actions/events of a button
            * @param {object} definedActions Predefined actions for the widget
            */
            function getCustomItems(actions, definedActions) {
                var customItems = [];
                actions = actions && actions.split(';');
                if (WM.isArray(actions)) {
                    actions.forEach(function (action) {
                        if (!_.includes(definedActions, action)) {
                            action = action.substring(0, action.indexOf('('));
                            customItems.push(action);
                        }
                    });
                }
                return customItems;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#translateVariableObject
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * consumes the raw object received from LiveVariable and returns consumable field objects agains each column.
             *
             * @param {object} rawObject data object received from the LiveVariable
             * @param {object} widget scope Caller Widget scope (optional)
             */
            function translateVariableObject(rawObject, scope) {
                var translatedObj = [],
                    columnArray = rawObject.propertiesMap.columns,
                    fieldNames = [];

                if (scope) {
                    scope.propertiesMap = rawObject.propertiesMap;
                    scope.columnArray = scope.propertiesMap.columns;
                    scope.primaryKey = scope.primaryKey || [];
                }
                _.each(columnArray, function (fieldObj) {
                    var column;
                    if (!_.includes(fieldNames, fieldObj.fieldName)) {
                        fieldNames.push(fieldObj.fieldName);
                        column = {
                            'displayName': Utils.prettifyLabel(fieldObj.fieldName),
                            'show':         true,
                            'primaryKey':   fieldObj.isPrimaryKey,
                            'generator':    fieldObj.generator,
                            'key':          fieldObj.fieldName,
                            'value':        '',
                            'type':         fieldObj.isRelated ? 'list' : fieldObj.fullyQualifiedType,
                            'maxvalue':     '',
                            'isRelated':    fieldObj.isRelated,
                            'readonly':     fieldObj.isPrimaryKey,
                            'required':     fieldObj.notNull === 'true' || fieldObj.notNull === true,
                            'pcDisplay'         :   true,
                            'mobileDisplay'     :   true
                        };
                        if (fieldObj.defaultValue) {
                            column.defaultValue = getDefaultValue(fieldObj.defaultValue, fieldObj.type);
                        }
                        if (fieldObj.type === 'string' || fieldObj.type === 'character' || fieldObj.type === 'text' || fieldObj.type === 'blob' || fieldObj.type === 'clob') {
                            column.maxvalue = fieldObj.length;
                        }
                        if (fieldObj.isPrimaryKey) {
                            /*Store the primary key of data*/
                            if (scope) {
                                scope.setPrimaryKey(fieldObj.fieldName);
                            }
                            /*If the field has assigned generator, make read only false*/
                            if (fieldObj.generator === 'assigned') {
                                column.readonly = false;
                            } else {
                                /*Hiding primary if it is generated automatically(User can un-hide it from edit feilds dialog)*/
                                column.show = false;
                            }
                        }
                        translatedObj.push(column);
                    }
                });
                return translatedObj;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getColumnCountByLayoutType
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * returns the number of columns based on the provided layout type. E.g. 1 for "One Column", 2 for "Two Column", etc.
             *
             * @param {object} layout layout type
             */
            function getColumnCountByLayoutType(layout) {
                var layoutObj = {
                    'One Column': 1,
                    'Two Column': 2,
                    'Three Column': 3,
                    'Four Column': 4
                };
                return layoutObj[layout] || 1;
            }

            /*function to update script link visibility*/
            function toggleActionMessage(selectedItem, actionsList, isField, eventType, value) {
                if (isField && eventType) {
                    selectedItem[eventType] = value;
                    return selectedItem.include && !selectedItem.remove && _.includes(selectedItem[eventType], 'Javascript');
                }
                return selectedItem.include && !selectedItem.remove && !_.includes(actionsList, selectedItem.action);
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getCustomFieldKey
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * returns the auto incremented event string based on the already existing events
             *
             * @param {object} fields array of the columns/ buttons
             * @param {string} key key where the field name is stored in object
             * @param {string} prefix name for the event/ action
             */
            function getCustomFieldKey(fields, key, prefix) {
                var keys = fields.map(function (event) {
                    return event[key];
                }), index;
                if (keys && _.includes(keys, prefix)) {
                    index = 1;
                    while (_.includes(keys, prefix + index)) {
                        index += 1;
                    }
                    prefix = prefix + index;
                }
                return prefix;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#splitDimension
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * extracts value and unit from the given width or height
             *
             * @param {object} column column pr field definition
             * @param {string} type width or height
             */
            function splitDimension(column, type) {
                var value,
                    unit,
                    width,
                    height;
                switch (type) {
                case 'width':
                    /*extract the width and width unit from width*/
                    width = column.width || '';
                    value = parseInt(width, 10) || '';
                    unit = width.indexOf('%') === -1 ? 'px' : '%';

                    column.widthValue = value;
                    column.widthUnit = unit;
                    break;
                case 'height':
                    /*extract the width and width unit from width*/
                    height = column.height || '';
                    value = parseInt(height, 10) || '';
                    unit = height.indexOf('%') === -1 ? 'px' : '%';

                    column.heightValue = value;
                    column.heightUnit = unit;
                    break;
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#mergeDimension
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * sets width or height from the value and unit
             *
             * @param {object} column column or field definition
             * @param {string} type width or height
             */
            function mergeDimension(column, type) {
                /*if width is given and a number set it*/
                switch (type) {
                case 'width':
                    if (column.widthValue && !isNaN(column.widthValue)) {
                        column.width = column.widthValue + column.widthUnit;
                    } else if (!column.widthValue || (!column.widthValue.length && Utils.stringStartsWith(column.width, column.widthValue))) {
                        /* Reset the width to default value when the widthValue is cleared from the UI. */
                        column.width = undefined;
                    }
                    column.widthValue = undefined;
                    column.widthUnit = undefined;
                    break;
                case 'height':
                    if (column.heightValue && !isNaN(column.heightValue)) {
                        column.height = column.heightValue + column.heightUnit;
                    } else if (!column.heightValue || (!column.heightValue.length && Utils.stringStartsWith(column.width, column.heightValue))) {
                        /* Reset the height to default value when the heightValue is cleared from the UI. */
                        column.height = undefined;
                    }
                    column.heightValue = undefined;
                    column.heightUnit = undefined;
                    break;
                }
            }
            this.toggleActionMessage        = toggleActionMessage;
            this.getEventTypes              = getEventTypes;
            this.getDefaultValue            = getDefaultValue;
            this.getFormButtons             = getFormButtons;
            this.getCustomItems             = getCustomItems;
            this.getColumnDef               = getColumnDef;
            this.getButtonDef               = getButtonDef;
            this.getTemplate                = getTemplate;
            this.translateVariableObject    = translateVariableObject;
            this.getColumnCountByLayoutType = getColumnCountByLayoutType;
            this.getCustomFieldKey          = getCustomFieldKey;
            this.getStepValue               = getStepValue;
            this.splitDimension             = splitDimension;
            this.mergeDimension             = mergeDimension;
            this.getFieldTypeWidgetTypesMap = getFieldTypeWidgetTypesMap;
        }
    ])
    .directive('liveActions', ['Utils', 'wmToaster', '$rootScope', function (Utils, wmToaster, $rs) {
        'use strict';
        var getRecords = function (options, success, error) {
                var variable = options.variable;

                variable.update({}, function (response) {
                    Utils.triggerFn(success, response);
                }, function (err) {
                    Utils.triggerFn(error, err);
                });
            },
            insertRecord = function (options, success, error) {
                var variable = options.variable,
                    dataObject = {
                        'row': options.row,
                        'transform': true,
                        'multipartData': options.multipartData
                    };

                variable.insertRecord(dataObject, function (response) {
                    Utils.triggerFn(success, response);
                }, function (err) {
                    Utils.triggerFn(error, err);
                });
            },
            updateRecord = function (options, success, error) {
                var variable = options.variable,
                    dataObject = {
                        'row': options.row,
                        'prevData': options.prevData,
                        'multipartData': options.multipartData,
                        'transform': true
                    };

                variable.updateRecord(dataObject, function (response) {
                    Utils.triggerFn(success, response);
                }, function (err) {
                    Utils.triggerFn(error, err);
                });
            },
            deleteRecord = function (options, success, error) {
                var variable = options.variable,
                    confirmMsg = options.scope.confirmdelete || 'Are you sure you want to delete this?',
                    dataObject = {
                        'row': options.row,
                        'transform': true
                    };

                if (variable.propertiesMap && variable.propertiesMap.tableType === 'VIEW') {
                    wmToaster.show('info', 'Not Editable', 'Table of type view, not editable');
                    $rs.$safeApply(options.scope);
                    return;
                }
                /* delete if user confirm to delete*/
                if (confirm(confirmMsg)) {

                    variable.deleteRecord(dataObject, function (response) {
                        Utils.triggerFn(success, response);
                    }, function (err) {
                        Utils.triggerFn(error, err);
                    });
                } else {
                    Utils.triggerFn(options.cancelDeleteCallback);
                }
            },
            performOperation = function (operation, options) {
                var fn,
                    scope = options.scope,
                    successHandler = function (response) {
                        Utils.triggerFn(scope.liveActionSuccess, operation, response);
                        Utils.triggerFn(options.success, response);
                    },
                    errorHandler = function (error) {
                        Utils.triggerFn(scope.liveActionError, operation, error);
                        wmToaster.show('error', 'ERROR', error);
                        Utils.triggerFn(options.error, error);
                    };

                /* decide routine based on CRUD operation to be performed */
                switch (operation) {
                case 'create':
                    fn = insertRecord;
                    break;
                case 'update':
                    fn = updateRecord;
                    break;
                case 'delete':
                    fn = deleteRecord;
                    break;
                case 'read':
                    fn = getRecords;
                    break;
                }

                fn(options, function (response) {
                    if (response.error) {
                        errorHandler(response.error);
                        return;
                    }
                    if (fn !== 'read') {
                        getRecords(options, function () {
                            successHandler(response);
                        }, function () {
                            successHandler(response);
                        });
                    } else {
                        successHandler(response);
                    }
                }, function (error) {
                    errorHandler(error);
                });
            };

        return {
            'restrict': 'A',
            'likn': {
                'post': function ($is, $el) {
                    $is.addRow = function () {
                        $rs.$emit('wm-event', $is.name, 'create');
                    };
                    $is.updateRow = function () {
                        $rs.$emit('wm-event', $is.name, 'update');
                    };
                    $is.deleteRow = function () {
                        $rs.$emit('wm-event', $is.name, 'delete');
                    };

                    /* API exposed to make CRUD operations */
                    $is.call = function (operation, data, success, error) {
                        var $elScope = $el.scope(),
                            variableName = Utils.getVariableName($is, $elScope);

                        data.scope = data.scope || $is;
                        data.success = success;
                        data.error = error;
                        data.variable = $elScope.Variables[variableName];

                        performOperation(operation, data);
                    };
                }
            }
        };
    }]);
