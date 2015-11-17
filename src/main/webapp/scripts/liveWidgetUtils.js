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
        'CONSTANTS',

        function (Utils, CONSTANTS) {
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
                        iconclass   :   'glyphicon glyphicon-save',
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
             * @name wm.widgets.live.LiveWidgetUtils#getColumnDef
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the common properties to liveFilter and liveForm .
             */
            function getColumnDef(attrs) {
                return {
                    'displayName'     : attrs.displayName || attrs.caption,
                    'show'            : (attrs.show === '1' || attrs.show === 'true'),
                    'type'            : attrs.type || 'text',
                    'primaryKey'      : attrs.primaryKey === 'true' || attrs.primaryKey === true,
                    'generator'       : attrs.generator,
                    'readonly'        : attrs.readonly === 'true' || attrs.readonly === true,
                    'multiple'        : attrs.multiple === 'true' || attrs.multiple === true,
                    'datepattern'     : attrs.datepattern,
                    'class'           : attrs.class || '',
                    'width'           : attrs.width,
                    'height'          : attrs.height,
                    'textAlignment'   : attrs.textAlignment,
                    'backgroundColor' : attrs.backgroundColor,
                    'required'        : attrs.required === 'true' || attrs.required === true,
                    'placeholder'     : attrs.placeholder,
                    'excludedays'     : attrs.excludedays,
                    'excludedates'    : attrs.excludedates,
                    'step'            : attrs.step,
                    'maxvalue'        : attrs.maxvalue,
                    'minvalue'        : attrs.minvalue,
                    'ismeridian'      : attrs.ismeridian,
                    'accessroles'     : attrs.accessroles,
                    'outputformat'    : attrs.outputformat,
                    'displayvalue'    : attrs.displayvalue,
                    'datafield'       : attrs.datafield,
                    'displayfield'    : attrs.displayfield,
                    'onChange'        : attrs.onChange,
                    'onBlur'          : attrs.onBlur,
                    'onFocus'         : attrs.onFocus,
                    'onMouseleave'    : attrs.onMouseleave,
                    'onMouseenter'    : attrs.onMouseenter,
                    'onClick'         : attrs.onClick,
                    'onKeypress'      : attrs.onKeypress,
                    'onKeyup'         : attrs.onKeyup,
                    'onKeydown'       : attrs.onKeydown
                };
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
            function getFieldTypeWidgetTypesMap(type) {
                var fieldTypeWidgetTypeMap;
                switch (type) {
                case 'LIVEFORM':
                    fieldTypeWidgetTypeMap = {
                        'integer'    : ['Number', 'Text', 'Slider', 'Select', 'Radioset', 'Rating'],
                        'big_integer': ['Number', 'Text', 'Slider', 'Select', 'Radioset'],
                        'short'      : ['Number', 'Text', 'Slider', 'Select', 'Radioset'],
                        'byte'       : ['Number', 'Text', 'Slider', 'Select', 'Radioset'],
                        'date'       : ['Date', 'Text', 'Select', 'Radioset'],
                        'boolean'    : ['Checkbox', 'Text', 'Select', 'Radioset', 'Toggle'],
                        'list'       : ['Select', 'Radioset', 'Text', 'Datalist'],
                        'float'      : ['Number', 'Text', 'Slider', 'Select', 'Radioset'],
                        'big_decimal': ['Number', 'Text', 'Slider', 'Select', 'Radioset'],
                        'double'     : ['Number', 'Text', 'Slider', 'Select', 'Radioset'],
                        'string'     : ['Text', 'Textarea', 'Password', 'RichText', 'Select', 'Radioset', 'Date', 'Time', 'Timestamp'],
                        'character'  : ['Text', 'Textarea', 'RichText', 'Select', 'Radioset', 'Date', 'Time', 'Timestamp'],
                        'text'       : ['Textarea', 'Text', 'RichText', 'Select', 'Radioset', 'Date', 'Time', 'Timestamp'],
                        'clob'       : ['Textarea', 'Text', 'RichText'],
                        'blob'       : ['Upload', 'Textarea', 'Text', 'RichText'],
                        'time'       : ['Time', 'Text', 'Select', 'Radioset'],
                        'timestamp'  : ['Timestamp', 'Text', 'Date', 'Time', 'Select', 'Radioset'],
                        'datetime'   : ['Datetime', 'Text', 'Date', 'Time', 'Select', 'Radioset'],
                        'custom'     : ['Text', 'Textarea', 'Password', 'RichText', 'Checkbox', 'Number', 'Slider', 'Select', 'Radioset', 'Date', 'Time', 'Timestamp']
                    };
                    break;
                case 'LIVEFILTER':
                    fieldTypeWidgetTypeMap = {
                        'integer'    : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating'],
                        'big_integer': ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating'],
                        'short'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating'],
                        'byte'       : ['text', 'number', 'select', 'checkboxset', 'radioset'],
                        'date'       : ['date', 'text', 'number', 'select', 'checkboxset', 'radioset'],
                        'boolean'    : ['checkbox', 'radioset', 'toggle'],
                        'list'       : ['text', 'number', 'select'],
                        'float'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating'],
                        'big_decimal': ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating'],
                        'double'     : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating'],
                        'string'     : ['text', 'number', 'select', 'checkboxset', 'radioset'],
                        'character'  : ['text', 'number', 'select', 'checkboxset', 'radioset'],
                        'text'       : ['text', 'number', 'select', 'checkboxset', 'radioset'],
                        'clob'       : ['text', 'number', 'select'],
                        'blob'       : ['text', 'number', 'select'],
                        'time'       : ['time', 'text', 'number', 'select', 'checkboxset', 'radioset'],
                        'timestamp'  : ['text', 'number', 'select'],
                        'datetime'   : ['datetime', 'text', 'select', 'checkboxset', 'radioset'],
                        'custom'     : ['text', 'number', 'select', 'checkboxset', 'radioset', 'rating']
                    };
                    break;
                }
                return fieldTypeWidgetTypeMap;
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
                    evtTypes = getEventTypes();
                Object.keys(fieldDef).forEach(function (field) {
                    if (fieldDef[field]) {
                        if (field === 'key' || field === 'field') {
                            fields += ' name="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'displayvalue') {
                            fields += ' displayexpression="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'permitted') {
                            fields += ' accept="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === 'caption' || field === 'type' || field === 'show' || field === 'placeholder' || field === 'minPlaceholder' || field === 'maxPlaceholder') {
                            // Avoid show attribute to support edit mode using isUpdateMode.
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
                        } else if (!(_.includes(excludeMaxValTypes, type))) {
                            fields += ' ' + field + '="{{formFields[' + index + '].' + field + '}}"';
                        }
                    }
                });
                return fields;
            }

            /*Returns datatime/timestamp template*/
            function dateTimeTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min date time';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max date time';
                    template = template +
                        '<div class="col-md-4 col-sm-4"><wm-datetime ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}" ></wm-datetime></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-datetime ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}" ></wm-datetime></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select date time';
                    template = template + '<wm-datetime ' + getFormFields(fieldDef, index, "datetime") + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}" ></wm-datetime>';
                }
                return template;
            }

            /*Returns time template*/
            function timeTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min time';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max time';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-time ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}"> </wm-time></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-time ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"> </wm-time></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select time';
                    template = template + '<wm-time ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}"  show="{{isUpdateMode}}"> </wm-time>';
                }
                return template;
            }

            /*Returns date template*/
            function dateTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min time';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max time';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-date ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}"show="{{isUpdateMode}}"> </wm-date></div>' +
                         '<div class="col-md-1 col-sm-1"></div>' +
                         '<div class="col-md-4 col-sm-4"><wm-date ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-date></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select date';
                    template = template + '<wm-date ' + getFormFields(fieldDef, index, "date") + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}"show="{{isUpdateMode}}"> </wm-date>';
                }
                return template;
            }

            /*Returns upload template */
            function uploadTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.filetype === 'image') {
                    template = template + '<a class="col-md-8 col-sm-8 form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value || formFields[' + index + '].href"><img width="48px" height="28px" class="wm-icon wm-icon24 glyphicon glyphicon-file" src="{{formFields[' + index + '].href}}"/></a>';
                } else {
                    template = template + '<a class="col-md-8 col-sm-8 form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value !== null"><i class="wm-icon wm-icon24 glyphicon glyphicon-file"></i></a>';
                }
                template = template + '<input data-ng-class="{\'form-control app-textbox\': true, \'file-readonly\': formFields[' + index + '].readonly}" required="{{formFields[' + index + '].required}}" type="file" name="{{formFields[' + index + '].key}}" ng-required="{{formFields[' + index + '].required}}" ng-readonly="{{formFields[' + index + '].readonly}}" data-ng-show="isUpdateMode" data-ng-model="formFields[' + index + '].value" accept="{{formFields[' + index + '].permitted}}"/>';
                return template;
            }

            /*Returns textarea template */
            function textareaTemplate(fieldDef, index) {
                var template = '';
                fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                template += '<wm-textarea' + getFormFields(fieldDef, index, 'textarea') + 'scopedatavalue="formFields[' + index + '].value" show="{{isUpdateMode}}"></wm-textarea>';
                return template;
            }

            /*Returns richtext template */
            function richtextTemplate(fieldDef, index) {
                var template = '';
                template += '<wm-richtexteditor ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" show="{{isUpdateMode}}"></wm-richtexteditor>';
                return template;
            }

            /*Returns password template */
            function passwordTemplate(fieldDef, index) {
                var template = '';
                fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                template = template + '<wm-text ' + getFormFields(fieldDef, index, 'password') + ' scopedatavalue="formFields[' + index + '].value" show="{{isUpdateMode}}" type="password" ></wm-text>';
                return template;
            }

            /*Returns slider template */
            function sliderTemplate(fieldDef, index) {
                var template = '', stepVal = fieldDef.step || getStepValue(fieldDef.type);
                template = template + '<wm-slider  ' + getFormFields(fieldDef, index) + ' show="{{isUpdateMode}}" scopedatavalue="formFields[' + index + '].value"';
                if (stepVal) {
                    template = template + ' step="' + stepVal + '" ';
                }
                template = template + ' ></wm-slider>';
                return template;
            }

            /*Returns radioset template */
            function radiosetTemplate(fieldDef, index) {
                var template = '';
                template = template + '<wm-radioset ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].value" dataset="" show="{{isUpdateMode}}" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" ></wm-radioset>';
                return template;
            }

            /*Returns checkboxset template */
            function checkboxsetTemplate(fieldDef, index) {
                var template = '';
                template = template + '<wm-checkboxset ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].value" dataset="" show="{{isUpdateMode}}" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" ></wm-checkboxset>';
                return template;
            }

            /*Returns checkbox template */
            function checkboxTemplate(fieldDef, index, widgetType) {
                var template = '',
                    addToggle = widgetType === 'toggle' ? 'type="toggle"' : '';
                template = template + '<wm-checkbox ' + getFormFields(fieldDef, index) + addToggle + ' scopedatavalue="formFields[' + index + '].value" show="{{isUpdateMode}}" ></wm-checkbox>';
                return template;
            }

            /*Returns select template */
            function selectTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max Value';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-select ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" ></wm-select></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-select ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" ></wm-select></div>';

                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select value';
                    template = template + '<wm-select ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}" datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}"></wm-select>';
                }
                return template;
            }

            /*Returns text template */
            function textNumberTemplate(fieldDef, index, type) {
                var template = '', stepVal;

                stepVal = fieldDef.step || getStepValue(fieldDef.type);

                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Enter Max Value';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].minValue" : "") + '" type="' + type + '" ' + (stepVal ? (' step="' + stepVal + '"') : "") + ' placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].maxValue" : "") + '" type="' + type + '" ' + (stepVal ? (' step="' + stepVal + '"') : "") + ' placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                    template = template + '<wm-text ' + getFormFields(fieldDef, index, type) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].value" : "") + '" type="' + type + '" ' + (stepVal ? (' step="' + stepVal + '"') : "") + ' placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-text>';
                }
                return template;
            }

            function ratingTemplate(fieldDef, index, liveType) {
                var template = '',
                    readonly;
                if (fieldDef.isRange) {
                    template = template + '<div class="col-md-4 col-sm-4"><wm-rating ' + getFormFields(fieldDef, index, "rating") + ' scopedatavalue="formFields[' + index + '].minValue" maxvalue="{{formFields[' + index + '].maxvalue}}" readonly="{{formFields[' + index + '].readonly}}"></wm-rating></div>' +
                        '<div class="col-md-4 col-sm-4"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-rating' + getFormFields(fieldDef, index, "rating") + ' scopedatavalue="formFields[' + index + '].maxValue" maxvalue="{{formFields[' + index + '].maxvalue}}" readonly="{{formFields[' + index + '].readonly}}"></wm-rating></div>';
                } else {
                    readonly = liveType === 'form' ? '{{!isUpdateMode}}' : '{{formFields[' + index + '].readonly}}';
                    template = template + '<wm-rating ' + getFormFields(fieldDef, index, "rating") + ' scopedatavalue="formFields[' + index + '].value" maxvalue="{{formFields[' + index + '].maxvalue}}" readonly="' + readonly + '"></wm-rating>';

                }
                return template;
            }

            /*Returns default template */
            function defaultTemplate(fieldDef, index) {
                var template = '';
                if (fieldDef.isRange) {
                    template = template + '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].minValue" type="text" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>' +
                        '<div class="col-md-4 col-sm-4"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-text' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].maxValue" type="text" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>';
                } else {
                    template = template + '<wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" type="text" placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-text>';
                }
                return template;
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
                var template = '', fieldTypeWidgetTypeMap, widgetType;
                if (liveType === 'form') {
                    //Set 'Readonly field' placeholder for fields which are readonly and contain generated values if the user has not given any placeholder
                    if (fieldDef.readonly && fieldDef.generator === 'identity') {
                        fieldDef.placeholder = fieldDef.placeholder || '';
                    }
                    //Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap
                    fieldTypeWidgetTypeMap = getFieldTypeWidgetTypesMap('LIVEFORM');
                    widgetType = (fieldDef.widgetType || fieldTypeWidgetTypeMap[fieldDef.type][0]).toLowerCase();
                } else if (liveType === 'filter') {
                    fieldDef.placeholder = fieldDef.minPlaceholder || '';
                    widgetType = fieldDef.widget.toLowerCase();
                }
                template = template +
                    '<wm-composite widget="' + widgetType + '" show="{{formFields[' + index + '].show}}" class="live-field">' +
                    '<wm-label class="col-sm-3 col-xs-12" caption="{{formFields[' + index + '].displayName}}" hint="{{formFields[' + index + '].displayName}}" required="{{formFields[' + index + '].required}}"></wm-label>' +
                    '<div class="col-sm-9 col-xs-12 {{formFields[' + index + '].class}}">' +
                    '<wm-label class="form-control-static" caption="' + getCaptionByWidget(widgetType, index) + '" show="{{!isUpdateMode}}"></wm-label>';

                switch (widgetType) {
                case 'number':
                case 'text':
                    template += textNumberTemplate(fieldDef, index, widgetType);
                    break;
                case 'select':
                    template += selectTemplate(fieldDef, index);
                    break;
                case 'checkbox':
                case 'toggle':
                    template += checkboxTemplate(fieldDef, index, widgetType);
                    break;
                case 'checkboxset':
                    template += checkboxsetTemplate(fieldDef, index);
                    break;
                case 'radioset':
                    template += radiosetTemplate(fieldDef, index);
                    break;
                case 'slider':
                    template += sliderTemplate(fieldDef, index);
                    break;
                case 'password':
                    template += passwordTemplate(fieldDef, index);
                    break;
                case 'richtext':
                    template += richtextTemplate(fieldDef, index);
                    break;
                case 'textarea':
                    template += textareaTemplate(fieldDef, index);
                    break;
                case 'upload':
                    template += uploadTemplate(fieldDef, index);
                    break;
                case 'date':
                    template += dateTemplate(fieldDef, index);
                    break;
                case 'time':
                    template += timeTemplate(fieldDef, index);
                    break;
                case 'datetime':
                case 'timestamp':
                    template += dateTimeTemplate(fieldDef, index);
                    break;
                case 'rating':
                    template += ratingTemplate(fieldDef, index, liveType);
                    break;
                default:
                    template += defaultTemplate(fieldDef, index);
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
            * @param {array} definedActions Predefined actions for the widget
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
                            'required':     fieldObj.notNull === 'true' || fieldObj.notNull === true
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
             * @param {array} fields array of the columns/ buttons
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
