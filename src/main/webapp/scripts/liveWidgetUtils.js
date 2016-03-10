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
        'FormWidgetUtils',
        'PropertiesFactory',
        '$compile',
        '$liveVariable',
        'CONSTANTS',
        'WidgetUtilService',

        function (Utils, $rs, FormWidgetUtils, PropertiesFactory, $compile, $liveVariable, CONSTANTS, WidgetUtilService) {
            'use strict';
            var keyEventsWidgets = ['number', 'text', 'select', 'password', 'textarea'],
                eventTypes = ['onChange', 'onBlur', 'onFocus', 'onMouseleave', 'onMouseenter', 'onClick'],
                allEventTypes = eventTypes.concat('onKeypress', 'onKeydown', 'onKeyup'),
                defaultNgClassesConfig = {'className': '', 'condition': ''};
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
             * @name wm.widgets.live.LiveWidgetUtils#getLiveWidgetButtons
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the default button definitions of live form.
             */
            function getLiveWidgetButtons(widgetType) {
                var defaultButtons;
                switch (widgetType) {
                case 'LIVEFORM':
                    defaultButtons = [
                        {
                            key         :    'reset',
                            class       :    'form-reset btn-secondary',
                            iconclass   :    'wi wi-refresh',
                            action      :    'reset()',
                            displayName :    'Reset',
                            show        :    true,
                            type        :    'button',
                            updateMode  :    true
                        },
                        {
                            key         :   'cancel',
                            class       :   'form-cancel btn-secondary',
                            iconclass   :   'wi wi-cancel',
                            action      :   'cancel()',
                            displayName :   'Cancel',
                            show        :   true,
                            type        :   'button',
                            updateMode  :   true
                        },
                        {
                            key         :   'save',
                            class       :   'form-save btn-success',
                            iconclass   :   $rs.isMobileApplicationType ? 'wi wi-done' : 'wi wi-save',
                            action      :   '',
                            displayName :   'Save',
                            show        :   true,
                            type        :   'submit',
                            updateMode  :   true
                        },
                        {
                            key         :   'delete',
                            class       :   'form-delete btn-secondary',
                            iconclass   :   'wi wi-trash',
                            action      :   'delete()',
                            displayName :   'Delete',
                            show        :   true,
                            type        :   'button',
                            updateMode  :   false
                        },
                        {
                            key         :   'edit',
                            class       :   'form-update btn-secondary',
                            iconclass   :   'wi wi-pencil',
                            action      :   'edit()',
                            displayName :   'Edit',
                            show        :   true,
                            type        :   'button',
                            updateMode  :   false
                        },
                        {
                            key         :   'new',
                            class       :   'form-new btn-success',
                            iconclass   :   'wi wi-plus',
                            action      :   'new()',
                            displayName :   'New',
                            show        :   true,
                            type        :   'button',
                            updateMode  :   false
                        }
                    ];
                    break;
                case 'LIVEFILTER':
                    defaultButtons = [
                        {
                            key         :   'filter',
                            class       :   'btn-primary',
                            iconclass   :   'wi wi-filter-list',
                            action      :   'filter()',
                            displayName :   'Filter',
                            show        :   true,
                            type        :   'button'
                        },
                        {
                            key         :   'clear',
                            class       :   'btn',
                            iconclass   :   'wi wi-trash',
                            action      :   'clearFilter()',
                            displayName :   'Clear',
                            show        :   true,
                            type        :   'button'
                        }];
                    break;
                case 'GRID':
                    defaultButtons = [
                        {
                            'key': 'addNewRow',
                            'displayName': 'New',
                            'iconclass': 'wi wi-plus',
                            'show': true,
                            'class': 'btn-primary',
                            'action': 'addNewRow()'
                        }
                    ];
                    break;
                }
                return defaultButtons;
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
                    'integer'    : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider', 'currency', 'typeahead'],
                    'big_integer': ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider', 'currency', 'typeahead'],
                    'short'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'typeahead'],
                    'float'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'typeahead'],
                    'big_decimal': ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'typeahead'],
                    'double'     : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'typeahead'],
                    'byte'       : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'typeahead'],
                    'string'     : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp', 'switch', 'currency', 'typeahead'],
                    'character'  : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'switch', 'currency', 'typeahead'],
                    'text'       : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp', 'switch', 'currency', 'typeahead'],
                    'date'       : ['date', 'text', 'number', 'select', 'checkboxset', 'radioset', 'typeahead'],
                    'time'       : ['time', 'text', 'number', 'select', 'checkboxset', 'radioset', 'typeahead'],
                    'timestamp'  : ['timestamp', 'text', 'number', 'select', 'checkboxset', 'radioset', 'typeahead'],
                    'datetime'   : ['datetime', 'text', 'select', 'checkboxset', 'radioset', 'typeahead'],
                    'boolean'    : ['checkbox', 'radioset', 'toggle', 'select', 'typeahead'],
                    'list'       : ['select', 'radioset', 'checkboxset', 'text', 'number', 'switch', 'typeahead'],
                    'clob'       : ['text', 'number', 'select', 'textarea', 'richtext', 'typeahead'],
                    'blob'       : ['upload', 'text', 'number', 'select', 'textarea', 'richtext', 'typeahead'],
                    'custom'     : ['text', 'number',  'textarea', 'password', 'checkbox', 'slider', 'richtext', 'currency', 'switch', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp', 'upload', 'rating', 'datetime', 'typeahead']
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
                    excludeKeys = ['$attr', '$$element', 'initWidget', 'role', 'wmResizable', 'wmWidgetDrag', 'value', 'dataset', 'extensions', 'filetype'];
                /*Loop through the attrs keys and set it to columndef*/
                _.each(attrs, function (value, key) {
                    /*Exclude special type of keys*/
                    if (!_.includes(excludeKeys, key)) {
                        columnDef[key] = value;
                    }
                });
                /*Handle special cases properties*/
                columnDef.displayname = attrs.displayname || attrs.caption;
                columnDef.pcDisplay = WM.isDefined(attrs.pcDisplay) ? (attrs.pcDisplay === "1" || attrs.pcDisplay === "true") : true;
                columnDef.mobileDisplay = WM.isDefined(attrs.mobileDisplay) ? (attrs.mobileDisplay === "1" || attrs.mobileDisplay === "true") : true;
                columnDef.type = attrs.type || 'text';
                columnDef.widget = widgetType; /*Widget type support for older projects*/
                columnDef.primaryKey = attrs.primaryKey === 'true' || attrs.primaryKey === true;
                columnDef.readonly = attrs.readonly === 'false' ? false : (attrs.readonly === 'readonly' || attrs.readonly === 'true' || attrs.readonly);
                columnDef.multiple = attrs.multiple === 'true' || attrs.multiple === true;
                columnDef.class = attrs.class || '';
                columnDef.required = attrs.required === 'false' ? false : (attrs.required === 'required' || attrs.required === 'true' || attrs.required);
                columnDef.show = attrs.show === 'false' ? false : (attrs.show === '1' || attrs.show === 'true' || attrs.show);
                columnDef.disabled = attrs.disabled === 'false' ? false : (attrs.disabled === 'disabled' || attrs.disabled === 'true' || attrs.disabled);
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
                switch (type) {
                case 'text':
                    return '';
                case 'float':
                case 'double':
                case 'big_decimal':
                    return 0.01;
                case 'integer':
                    return 1;
                default:
                    return undefined;
                }
            }

            function getCaptionByWidget(type, index) {
                var caption = 'formFields[' + index + '].value';
                if (type === 'password') {
                    return '********';
                }
                if (type === 'datetime' || type === 'timestamp') {
                    caption += ' | date:formFields[' + index + '].datepattern || \'yyyy-MM-dd hh:mm:ss a\'';
                } else if (type === 'time') {
                    caption += ' | date:formFields[' + index + '].timepattern ||  \'hh:mm a\'';
                } else if (type === 'date') {
                    caption += ' | date:formFields[' + index + '].datepattern ||  \'yyyy-MM-dd\'';
                } else if (type === 'select') {
                    caption =  'formFields[' + index + '].isRelated ? getDisplayExpr(formFields[' + index + '].value, formFields[' + index + '].displayexpression || formFields[' + index + '].displayfield) : formFields[' + index + '].value';
                } else if (type === 'rating') {
                    caption = '';
                }
                return '{{' + caption + '}}';
            }

            function getFormFields(fieldDef, index, type) {
                var fields = '',
                    dateTypes = ['date', 'datetime'],
                    textTypes = ['text', 'password', 'textarea'],
                    evtTypes = getEventTypes(),
                    excludeProperties = ['caption', 'type', 'show', 'placeholder', 'maxPlaceholder', 'readonly', 'inputtype', 'widgettype', 'dataset'];
                Object.keys(fieldDef).forEach(function (field) {
                    if (_.includes(excludeProperties, field)) {
                        return;
                    }
                    if (fieldDef[field]) {
                        if (field === 'key' || field === 'field') {
                            fields += ' name="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'widgetid') {
                            fields += ' widgetid="' + fieldDef.widgetid + '_' + fieldDef.name + '"';
                        } else if (field === 'permitted') {
                            fields += ' accept="{{formFields[' + index + '].' + field + '}}"';
                        } else if (_.includes(dateTypes, type) && (field === 'minvalue' || field === 'maxvalue')) {
                            //For date, datetime, timestamp special cases
                            if (field === 'minvalue') {
                                fields += ' mindate="{{formFields[' + index + '].' + field + '}}"';
                            } else if (field === 'maxvalue') {
                                fields += ' maxdate="{{formFields[' + index + '].' + field + '}}"';
                            }
                        } else if (_.includes(textTypes, type) && field === 'maxvalue' && fieldDef.inputtype === 'text') {
                            fields += ' maxchars="{{formFields[' + index + '].' + field + '}}"';
                        } else if (_.includes(evtTypes, field)) {
                            fields += ' ' + Utils.hyphenate(field) + '="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'textAlignment') {
                            fields += ' textalign="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'ngclass') {
                            fields += ' data-ng-class="{{formFields[' + index + '].' + field + '}}"';
                        } else {
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
                    updateModeCondition = isCustomWidget ? '' : ' show="{{isUpdateMode}}"',
                    allowInvalidAttr = fieldDef.widget === 'number' ? ' allowinvalid=true ' : '';
                additionalFields = additionalFields || '';
                if (fieldDef.isRange) {
                    fieldDef.placeholder = fieldDef.placeholder || minPlaceholderDefault;
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || maxPlaceholderDefault;
                    template = template +
                        '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-6' : 'col-sm-6') + '"><' + widgetName + ' ' +  getFormFields(fieldDef, index, widgetType) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].placeholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + allowInvalidAttr + updateModeCondition +  additionalFields + '></' +  widgetName + '></div>' +
                        '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-6' : 'col-sm-6') + '"><' + widgetName + ' ' +  getFormFields(fieldDef, index, widgetType) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + allowInvalidAttr + updateModeCondition + additionalFields + '></' +  widgetName + '></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || defaultPlaceholder;
                    template = template + '<' + widgetName + ' ' +  getFormFields(fieldDef, index, widgetType) + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + allowInvalidAttr + updateModeCondition + additionalFields + '></' +  widgetName + '>';
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
                    template = template + '<a class="form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value || formFields[' + index + '].href"><img style="height:2em" class="wi wi-file" src="{{formFields[' + index + '].href}}"/></a>';
                } else {
                    template = template + '<a class="form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value !== null"><i class="wi wi-file"></i></a>';
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

            function getSwitchTemplate(fieldDef, index) {
                var additionalFields = 'scopedataset="formFields[' + index + '].dataset" dataset="" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}"';
                return getDefaultTemplate('switch', fieldDef, index, '', '', '', additionalFields);
            }

            function getCurrencyTemplate(fieldDef, index) {
                var additionalFields = 'currency="{{formFields[' + index + '].currency}}"';
                return getDefaultTemplate('currency', fieldDef, index, 'Enter Min value', 'Enter Max value', 'Enter value', additionalFields);
            }

            function getSearchTemplate(fieldDef, index) {
                var additionalFields = 'scopedataset="formFields[' + index + '].dataset" datafield="{{formFields[' + index + '].datafield}}" searchkey="{{formFields[' + index + '].searchkey}}" type="typeahead" displaylabel="{{formFields[' + index + '].displaylabel}}"';
                return getDefaultTemplate('search', fieldDef, index, '', '', 'Search', additionalFields);
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getHiddenTemplate
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * returns the hidden template for liveFilter and liveForm.
             */
            function getHiddenTemplate(fieldDef, index) {
                var additionalFields = 'type="hidden" ';
                return getDefaultTemplate('text', fieldDef, index, '', '', '', additionalFields);
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
            function getTemplate(fieldDef, index) {
                var template = '',
                    widgetType,
                    fieldTypeWidgetTypeMap = getFieldTypeWidgetTypesMap();
                    //Set 'Readonly field' placeholder for fields which are readonly and contain generated values if the user has not given any placeholder
                if (fieldDef.readonly && fieldDef.generator === 'identity') {
                    fieldDef.placeholder = fieldDef.placeholder || '';
                }
                //Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap
                widgetType = fieldDef.widget || fieldTypeWidgetTypeMap[fieldDef.type][0];
                widgetType = widgetType.toLowerCase();
                template = template +
                    '<wm-composite widget="' + widgetType + '" show="{{formFields[' + index + '].show}}" class="live-field">' +
                    '<wm-label class="control-label ' + ($rs.isMobileApplicationType ? 'col-xs-4' : 'col-sm-3') + '" caption="{{formFields[' + index + '].displayname}}" hint="{{formFields[' + index + '].displayname}}" required="{{formFields[' + index + '].required}}"></wm-label>' +
                    '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-8' : 'col-sm-9') + ' {{formFields[' + index + '].class}}">' +
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
                    template += getRatingTemplate(fieldDef, index);
                    break;
                case 'switch':
                    template += getSwitchTemplate(fieldDef, index);
                    break;
                case 'currency':
                    template += getCurrencyTemplate(fieldDef, index);
                    break;
                case 'typeahead':
                    template += getSearchTemplate(fieldDef, index);
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
                    fieldNames = [],
                    widgetsMap = getFieldTypeWidgetTypesMap();

                if (scope) {
                    scope.propertiesMap = rawObject.propertiesMap;
                    scope.columnArray = scope.propertiesMap.columns;
                    scope.primaryKey = scope.primaryKey || [];
                }
                _.each(columnArray, function (fieldObj) {
                    var column;
                    if (!_.includes(fieldNames, fieldObj.fieldName) && !fieldObj.readonly) {
                        fieldNames.push(fieldObj.fieldName);
                        column = {
                            'displayname'   : Utils.prettifyLabel(fieldObj.fieldName),
                            'show'          : true,
                            'primaryKey'    : fieldObj.isPrimaryKey,
                            'generator'     : fieldObj.generator,
                            'key'           : fieldObj.fieldName,
                            'value'         : '',
                            'type'          : fieldObj.isRelated ? 'list' : fieldObj.fullyQualifiedType,
                            'maxvalue'      : '',
                            'isRelated'     : fieldObj.isRelated,
                            'readonly'      : fieldObj.isPrimaryKey,
                            'required'      : fieldObj.notNull === 'true' || fieldObj.notNull === true,
                            'pcDisplay'     : true,
                            'mobileDisplay' : true
                        };
                        if (Utils.isNumberType(column.type)) {
                            column.step = fieldObj.scale ? Math.pow(10, fieldObj.scale * -1) : 0;
                        }
                        column.widget = widgetsMap[column.type || 'custom'][0];
                        if (fieldObj.defaultValue) {
                            column.defaultvalue = getDefaultValue(fieldObj.defaultValue, fieldObj.type);
                        }
                        if (fieldObj.type === 'string' || fieldObj.type === 'character' || fieldObj.type === 'text' || fieldObj.type === 'blob' || fieldObj.type === 'clob') {
                            column.maxchars = fieldObj.length;
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
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#fieldPropertyChangeHandler
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Define the property change handler for form and filter. This function will be triggered when there is a change in the widget property
             *
             * @param {object} scope scope of the field
             * @param {object} element element of the field
             * @param {object} attrs attributes of the field
             * @param {string} key key which value is changed
             * @param {string} newVal new value for the key
             */
            function fieldPropertyChangeHandler(scope, element, attrs, parentScope, index, key, newVal) {
                var variable,
                    eleScope = element.scope(),
                    isDataSetWidgets = Utils.getDataSetWidgets(),
                    template = '',
                    wdgtProperties = scope.widgetProps,
                    compileField = function () {
                        if (!scope.widgetid) {
                            return;
                        }
                        /*On changing of a property in studio mode, generate the template again so that change is reflected*/
                        template = getTemplate(parentScope.formFields[index], index);
                        element.html(template);
                        $compile(element.contents())(parentScope);
                    };
                switch (key) {
                case 'dataset':
                    /*if studio-mode, then update the displayField & dataField in property panel for dataset widgets*/
                    if (scope.widgetid && isDataSetWidgets[attrs.widget] && WM.isDefined(newVal) && newVal !== null) {
                        //Get variable and properties map only on binddataset change
                        if (scope.oldBindDataSet !== scope.binddataset) {
                            if (!WM.isString(newVal)) {
                                variable = Utils.getVariableName(scope, eleScope);
                                newVal.propertiesMap = eleScope.Variables[variable].category === 'wm.ServiceVariable' ? undefined : eleScope.Variables[variable].propertiesMap;
                            }
                            scope.oldBindDataSet = scope.binddataset;
                        }
                        WidgetUtilService.updatePropertyPanelOptions(newVal.data || newVal, newVal.propertiesMap, scope, false);
                    }
                    compileField();
                    break;
                case 'inputtype':
                    FormWidgetUtils.setPropertiesTextWidget(wdgtProperties, newVal);
                    compileField();
                    break;
                case 'show':
                    if (CONSTANTS.isStudioMode && newVal) {
                        Utils.getService('LiveWidgetsMarkupManager').updateFieldMarkup({'formName': parentScope.name, 'fieldName': scope.name});
                        element.parents('[widgettype="wm-gridcolumn"]').removeClass('hide');
                    }
                    compileField();
                    break;
                case 'required':
                    parentScope.formFields[index][key] = newVal;
                    compileField();
                    break;
                case 'active':
                    if (scope.widget === 'number' || scope.widget === 'password' || scope.widget === 'text') {
                        FormWidgetUtils.setPropertiesTextWidget(wdgtProperties, scope.inputtype);
                        compileField();
                    }
                    break;
                default:
                    compileField();
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getWidgetProps
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Get the respective widget properties for the widget
             *
             * @param {string} widgetType type of the widget
             */
            function getWidgetProps(widgetType) {
                var widgetProps,
                    baseProperties,
                    extendedProperties,
                    textWidgets = ['text', 'number', 'password'],
                    setDefaultValueProps = function () {
                        var defaultProp;
                        /*Use default value instead of datavalue for fields*/
                        if (widgetType === 'radioset') {
                            defaultProp = 'selectedvalue';
                        } else if (widgetType === 'checkboxset') {
                            defaultProp = 'selectedvalues';
                        } else if (widgetType === 'switch') {
                            defaultProp = 'defaultvalue';
                        } else {
                            defaultProp = 'datavalue';
                        }
                        if (widgetProps[defaultProp]) {
                            widgetProps.defaultvalue = WM.copy(widgetProps[defaultProp]);
                            delete widgetProps[defaultProp];
                        }
                    };
                widgetType = widgetType.toLowerCase();
                switch (widgetType) {
                case 'textarea':
                    baseProperties      = 'wm.textarea';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard'];
                    break;
                case 'toggle':
                case 'checkbox':
                    baseProperties      = 'wm.checkbox';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors'];
                    break;
                case 'slider':
                    baseProperties      = 'wm.slider';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.events.change'];
                    break;
                case 'richtext':
                    baseProperties      = 'wm.richtexteditor';
                    extendedProperties  = ['wm.base', 'wm.base.editors'];
                    break;
                case 'select':
                    baseProperties      = 'wm.select';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.editors.dataseteditors', 'wm.base.events.keyboard'];
                    break;
                case 'checkboxset':
                    baseProperties      = 'wm.checkboxset';
                    extendedProperties  = ['wm.base', 'wm.booleaneditors'];
                    break;
                case 'radioset':
                    baseProperties      = 'wm.radioset';
                    extendedProperties  = ['wm.base', 'wm.booleaneditors'];
                    break;
                case 'date':
                    baseProperties      = 'wm.date';
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime'];
                    break;
                case 'time':
                    baseProperties      = 'wm.time';
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime'];
                    break;
                case 'datetime':
                case 'timestamp':
                    baseProperties      = 'wm.datetime';
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime'];
                    break;
                case 'rating':
                    baseProperties      = 'wm.rating';
                    extendedProperties  = ['wm.base', 'wm.base.editors'];
                    break;
                case 'upload':
                    baseProperties      = '';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors'];
                    break;
                case 'switch':
                    baseProperties      = 'wm.switch';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors'];
                    break;
                case 'currency':
                    baseProperties      = 'wm.currency';
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors'];
                    break;
                case 'typeahead':
                    baseProperties      = 'wm.search';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard'];
                    break;
                default:
                    baseProperties      = 'wm.text';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard'];
                    break;
                }
                widgetProps             = PropertiesFactory.getPropertiesOf(baseProperties, extendedProperties);
                widgetProps.displayname =  {'type': "string", 'show': true, 'bindable': "in-bound"};
                widgetProps.widget      = {'type': 'label', 'show': true};
                if (_.includes(textWidgets, widgetType)) {
                    /*In form and filter, type conflicts with data type. Change the type to input type.*/
                    widgetProps.inputtype = WM.copy(widgetProps.type);
                    delete widgetProps.type;
                }
                if (widgetType === 'switch') {
                    widgetProps.dataset.value   = '';
                    widgetProps.datafield.value = '';
                }
                if (widgetType === 'upload') {
                    widgetProps = WM.extend(widgetProps, {
                        'readonly'   : {'type': 'boolean', 'show': true},
                        'required'   : {'type': 'boolean', 'show': true},
                        'filetype'   : {'type': 'datalist', 'options': ['image', 'audio', 'video'], 'show': true},
                        'extensions' : {'type': 'string', 'show': true}
                    });
                }
                setDefaultValueProps();
                /*No support for scopedatavalue and scopedataset for fields yet*/
                if (widgetProps.scopedatavalue) {
                    delete widgetProps.scopedatavalue;
                }
                if (widgetProps.scopedataset) {
                    delete widgetProps.scopedataset;
                }
                return widgetProps;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#handleBackwardCompatibility
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * handle the backward compatibility for some of the field attributes
             *
             * @param {string} fieldType filter field/ form field
             * @param {object} scope scope of the widget
             * @param {object} attrs attributes of the widget
             * @param {string} tElement template of the field
             */
            function handleBackwardCompatibility(fieldType, scope, attrs, tElement) {
                var changeAttr = function (newAttr, oldAttr) {
                    /*Function to change the attribute names*/
                    scope[newAttr] = attrs[newAttr] = attrs[oldAttr];
                    WM.element(tElement.context).attr(newAttr, scope[newAttr]);
                    delete attrs[oldAttr];
                };
                /*Support for old projects*/
                if (!attrs.defaultvalue && attrs.defaultValue) {
                    changeAttr('defaultvalue', 'defaultValue');
                }
                if (!attrs.displayname && attrs.displayName) {
                    changeAttr('displayname', 'displayName');
                }
                if (attrs.maxvalue && (attrs.inputtype === 'text' || attrs.inputtype === 'password' || attrs.widget === 'textarea')) {
                    changeAttr('maxchars', 'maxvalue');
                }
                if (attrs.widget === 'date' || attrs.widget === 'datetime') {
                    if (attrs.minvalue) {
                        changeAttr('mindate', 'minvalue');
                    }
                    if (attrs.maxvalue) {
                        changeAttr('maxdate', 'maxvalue');
                    }
                }
                if (attrs.minPlaceholder && !attrs.placeholder && fieldType === 'wm-filter-field') {
                    changeAttr('placeholder', 'minPlaceholder');
                }
                if (!attrs.displayexpression && attrs.displayvalue) {
                    changeAttr('displayexpression', 'displayvalue');
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#preProcessFields
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Get the respective widget properties for the widget
             *
             * @param {string} fieldType filter field/ form field
             * @param {object} scope scope of the widget
             * @param {object} attrs attributes of the widget
             * @param {string} tElement template of the field
             */
            function preProcessFields(fieldType, scope, attrs, tElement) {
                var inputtype;
                scope.widgettype = fieldType;
                attrs.widget = attrs.widget || (attrs.widgetType && attrs.widgetType.toLowerCase()) || getFieldTypeWidgetTypesMap()[attrs.type || 'text'][0];
                /*Support for older projects, in which widget type was not stored*/
                scope.widget = attrs.widget;
                WM.element(tElement.context).attr('widget', scope.widget);
                /*Based on the widget, get the input types*/
                if (attrs.widget === 'text') {
                    inputtype = attrs.inputtype || 'text';
                } else if (attrs.widget === 'number') {
                    inputtype = 'number';
                } else if (attrs.widget === 'password') {
                    inputtype = 'password';
                }
                scope.inputtype = attrs.inputtype = inputtype;
                WM.element(tElement.context).attr('inputtype', inputtype);
                handleBackwardCompatibility(fieldType, scope, attrs, tElement);
               /*Get the respective widget properties*/
                scope.widgetProps = getWidgetProps(attrs.widget);
            }

            function parseNgClasses(classExpression) {
                var ngClasses = [],
                    conditionalClasses;
                defaultNgClassesConfig = {'className': '', 'condition': ''};
                /* Return default config. */
                if (!classExpression) {
                    ngClasses.push(WM.copy(defaultNgClassesConfig));
                    return ngClasses;
                }
                /* Remove curly brackets and get each expression. */
                conditionalClasses = classExpression.substring(1, classExpression.length - 1).split(',');
                /* Generate the config. */
                _.each(conditionalClasses, function (conditionalClassConfig) {
                    var conditionalExpression = conditionalClassConfig.split(':'),
                        className = conditionalExpression[0].trim(),
                        classCondition = conditionalExpression[1].trim(),
                        classNameLen = className.length,
                        config = WM.copy(defaultNgClassesConfig);
                    /* Strip the single quotes from className. */
                    if (className[0] === "'" && className[classNameLen - 1] === "'") {
                        className = className.substring(1, classNameLen - 1);
                    }
                    config.className = className;
                    config.condition = classCondition;
                    ngClasses.push(config);
                });
                return ngClasses;
            }

            function generateNgClassExpression(conditionalClasses) {
                var ngClassExpression = '';
                _.each(conditionalClasses, function (config) {
                    if (config.className && config.condition) {
                        if (ngClassExpression.length) {
                            ngClassExpression += ', ';
                        }
                        ngClassExpression += "'" + config.className + "':" + config.condition;
                    }
                });
                return ngClassExpression.length ? '{' + ngClassExpression + '}' : ngClassExpression;
            }

            function setColumnCustomExpression(column) {
                var widgetNgClassesExpression = generateNgClassExpression(column.widgetConfig.ngClasses);
                switch (column.widgetType) {
                case 'image':
                    if (column.type === 'blob') {
                        column.widgetConfig.src = "{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}";
                        column.customExpression = '<img width="48px" class="" data-ng-src="' + column.widgetConfig.src + '"/>';
                    } else {
                        column.customExpression = '<img data-ng-src="' + column.widgetConfig.src + '" alt="' + column.widgetConfig.src + '" class="' + column.widgetConfig.class +
                            '" data-ng-class="' + widgetNgClassesExpression + '"/>';
                    }
                    break;
                case 'button':
                    column.customExpression = '<wm-button caption="' + column.widgetConfig.title + '" show="true" class="' + column.widgetConfig.class + '" iconname="' +
                        column.widgetConfig.icon + '" on-click="' + column.widgetConfig.action + '" data-ng-class="' + widgetNgClassesExpression + '"></wm-button>';
                    break;
                case 'checkbox':
                    column.customExpression = '<input type="checkbox" ng-model="' + column.widgetConfig.model + '" ng-disabled="' + column.widgetConfig.disabled + '" ' +
                        'class = "' + column.widgetConfig.class + '" data-ng-class="' + widgetNgClassesExpression + '">';
                    break;
                default:
                    if (column.type === 'blob') {
                        column.customExpression = '<a data-ng-if="columnValue != null" class="col-md-9" target="_blank" data-ng-href="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"><i class="wm-icon wm-icon24 wi wi-file"></i></a>';
                    }
                }
            }

            function setDefaultWidgetConfig(column) {
                var widgetType = column.widgetType,
                    field = column.field,
                    val = column.widgetType === 'button' ? "{{row.getProperty('" + field + "') || 'Button'}}" : "{{row.getProperty('" + field + "')}}",
                    defaultModel = "row." + field,
                    widgetNgClasses = [Utils.getClonedObject(defaultNgClassesConfig)];
                /* Not storing widget config, it is only on for UI display. Only customExpression will be saved. */
                column.widgetConfig = {};
                switch (widgetType) {
                case 'image':
                    column.widgetConfig = {
                        'src': val,
                        'class': '',
                        'ngClasses': widgetNgClasses
                    };
                    break;
                case 'button':
                    column.widgetConfig = {
                        'icon': '',
                        'action': '',
                        'title': val,
                        'class': 'btn-sm btn-primary',
                        'ngClasses': widgetNgClasses
                    };
                    break;
                case 'checkbox':
                    column.widgetConfig = {
                        'model': defaultModel,
                        'disabled': '{{colDef.readonly || !isGridEditMode}}',
                        'class': '',
                        'ngClasses': widgetNgClasses
                    };
                    break;
                default:
                    column.widgetConfig = {
                        'src': val,
                        'class': '',
                        'ngClasses': widgetNgClasses
                    };
                    break;
                }
            }

            function extractWidgetConfig(column) {
                var customExpression = column.customExpression,
                    widgetType = column.widgetType,
                    widgetDisabled,
                    widgetAction,
                    widgetIcon,
                    widgetTitle,
                    widgetClass,
                    widgetNgClasses,
                    widgetSrc,
                    widgetModel,
                    el;
                column.widgetConfig = {};
                /* If custom expression does not contain any HTML tags, append span. */
                if (!Utils.isValidHtml(customExpression)) {
                    customExpression = '<span>' + customExpression + '</span>';
                }
                el = WM.element(customExpression);
                widgetClass = el.attr('widget-class') || el.attr('class');
                widgetNgClasses = parseNgClasses(el.attr('data-ng-class'));
                switch (widgetType) {
                case 'image':
                    widgetSrc = el.attr('data-ng-src');
                    column.widgetConfig = {
                        'src': widgetSrc,
                        'class': widgetClass,
                        'ngClasses': widgetNgClasses
                    };
                    break;
                case 'button':
                    widgetIcon = el.attr('iconname');
                    widgetTitle = el.attr('caption');
                    widgetAction = el.attr('on-click');
                    column.widgetConfig = {
                        'icon': widgetIcon,
                        'action': widgetAction,
                        'title': widgetTitle,
                        'class': widgetClass,
                        'ngClasses': widgetNgClasses
                    };
                    break;
                case 'checkbox':
                    widgetModel = el.attr('ng-model');
                    widgetDisabled = el.attr('ng-disabled');
                    column.widgetConfig = {
                        'model': widgetModel,
                        'disabled': widgetDisabled,
                        'class': widgetClass,
                        'ngClasses': widgetNgClasses
                    };
                    break;
                default:
                    column.widgetConfig = {
                        'src': '',
                        'class': widgetClass,
                        'ngClasses': widgetNgClasses
                    };
                    break;
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#setColumnConfig
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Sets the column config for the selected field
             *
             * @param {object} column for which config needs to be set
             */
            function setColumnConfig(column) {
                /* Not storing ngClasses, it is only on for UI display. Only ngClass expression will be saved. */
                column.ngClasses = parseNgClasses(column.ngclass);
                if (!column.customExpression) {
                    setDefaultWidgetConfig(column);
                    setColumnCustomExpression(column);
                } else {
                    extractWidgetConfig(column);
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#fetchPropertiesMapColumns
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Returns columns and sets related data for provided propertiesMap
             *
             * @param {object} propertiesMap from which columns are retrieved
             * @param {object} relatedData for live filter dataset
             * @param {object} variableObj to which filter is binded
             *
             */
            function fetchPropertiesMapColumns(propertiesMap, variableObj) {
                var columns = {}, columnName, data = {}, primaryKey;
                /* iterated trough the propertiesMap columns of all levels and build object with columns having required configuration*/
                _.each(propertiesMap.columns, function (val) {
                    /* if the object is nested type repeat the above process for that nested object through recursively */
                    if (val.isRelated) {
                        if (val.isList) {
                            return;
                        }
                        data.relatedData = data.relatedData || {};
                        var relatedTableColumns = $liveVariable.getRelatedColumnsList(variableObj, val.fieldName),
                            columnNameTypeMap = {};
                        _.each(val.columns, function (column) {
                            if (column.isPrimaryKey) {
                                primaryKey = column.fieldName;
                            }
                            columnNameTypeMap[column.fieldName] = column.type;
                        });
                        data.relatedData[val.relatedEntityName] = {
                            columns: relatedTableColumns,
                            primaryKey: primaryKey,
                            columnNameTypeMap: columnNameTypeMap
                        };

                        /* otherwise build object with required configuration */
                        columnName = val.fieldName.charAt(0).toLowerCase() + val.fieldName.slice(1);
                        columns[columnName] = {};
                        columns[columnName].isRelated = val.isRelated === 'true' || val.isRelated === true;
                        columns[columnName].relatedEntityName = val.relatedEntityName;
                        columns[columnName].relatedPrimaryKey = primaryKey;
                    } else {
                        /* otherwise build object with required configuration */
                        columnName = val.fieldName;
                        columns[columnName] = {};
                    }
                    columns[columnName].type = val.type;
                    columns[columnName].isPrimaryKey = val.isPrimaryKey;
                    columns[columnName].generator = val.generator;
                });
                return {
                    'columns'     : columns,
                    'relatedData' : data.relatedData
                };
            }

            this.getEventTypes              = getEventTypes;
            this.getDefaultValue            = getDefaultValue;
            this.getLiveWidgetButtons       = getLiveWidgetButtons;
            this.getColumnDef               = getColumnDef;
            this.getButtonDef               = getButtonDef;
            this.getTemplate                = getTemplate;
            this.getHiddenTemplate          = getHiddenTemplate;
            this.translateVariableObject    = translateVariableObject;
            this.getColumnCountByLayoutType = getColumnCountByLayoutType;
            this.getCustomFieldKey          = getCustomFieldKey;
            this.getStepValue               = getStepValue;
            this.splitDimension             = splitDimension;
            this.mergeDimension             = mergeDimension;
            this.getFieldTypeWidgetTypesMap = getFieldTypeWidgetTypesMap;
            this.fieldPropertyChangeHandler = fieldPropertyChangeHandler;
            this.preProcessFields           = preProcessFields;
            this.setColumnConfig            = setColumnConfig;
            this.fetchPropertiesMapColumns  = fetchPropertiesMapColumns;
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
            'link': {
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
