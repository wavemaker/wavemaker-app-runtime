/*global WM, moment, _*/

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
        'Variables',

        function (Utils, CONSTANTS, Variables) {
            'use strict';

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

            function getEventTypes() {
                return ['onChange', 'onBlur', 'onFocus', 'onMouseleave', 'onMouseenter', 'onClick'];
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
                        key : 'reset',
                        class: 'form-reset btn-secondary',
                        iconclass: 'glyphicon glyphicon-refresh',
                        action: 'reset()',
                        displayName: 'Reset',
                        show: true,
                        type: 'button',
                        updateMode: true
                    },
                    {
                        key : 'cancel',
                        class: 'form-cancel btn-secondary',
                        iconclass: 'glyphicon glyphicon-remove-circle',
                        action: 'cancel()',
                        displayName: 'Cancel',
                        show: true,
                        type: 'button',
                        updateMode: true
                    },
                    {
                        key : 'save',
                        class: 'form-save btn-success',
                        iconclass: 'glyphicon glyphicon-save',
                        action: '',
                        displayName: 'Save',
                        show: true,
                        type: 'Submit',
                        updateMode: true
                    },
                    {
                        key : 'delete',
                        class: 'form-delete btn-secondary',
                        iconclass: 'glyphicon glyphicon-remove',
                        action: 'delete()',
                        displayName: 'Delete',
                        show: true,
                        type: 'button',
                        updateMode: false
                    },
                    {
                        key : 'edit',
                        class: 'form-update btn-secondary',
                        iconclass: 'glyphicon glyphicon-pencil',
                        action: 'edit()',
                        displayName: 'Edit',
                        show: true,
                        type: 'button',
                        updateMode: false
                    },
                    {
                        key : 'new',
                        class: 'form-new btn-success',
                        iconclass: 'glyphicon glyphicon-plus',
                        action: 'new()',
                        displayName: 'New',
                        show: true,
                        type: 'button',
                        updateMode: false
                    }];
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getFormActions
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return an object consisting form actions in edit and view mode.
             *
             * @param {boolean} getFlat returns a flat array of all actions
             */
            function getFormActions(getFlat) {
                var actions = {
                    'edit': ['cancel()', 'reset()', 'save()', 'saveAndNew()'],
                    'view': ['delete()', 'new()', 'edit()']
                };
                if (getFlat) {
                    return actions.view.concat(['formSave()', 'formCancel()']).concat(actions.edit);
                }
                return actions;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getGridActions
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return an array consisting of the grid default actions.
             *
             */
            function getGridActions() {
                return ['addNewRow()', 'deleteRow()', 'editRow()'];
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
                    'displayName': attrs.displayName || attrs.caption,
                    'show': (attrs.show === '1' || attrs.show === 'true'),
                    'type': attrs.type || 'text',
                    'primaryKey': attrs.primaryKey === 'true' || attrs.primaryKey === true,
                    'generator': attrs.generator,
                    'readonly': attrs.readonly === 'true' || attrs.readonly === true,
                    'multiple': attrs.multiple === 'true' || attrs.multiple === true,
                    'datepattern': attrs.datepattern,
                    'class': attrs.class || '',
                    'required': attrs.required === 'true' || attrs.required === true,
                    'placeholder': attrs.placeholder,
                    'maxValue' : attrs.maxValue,
                    'minValue' : attrs.minValue,
                    'maxvalue' : attrs.maxvalue,
                    'onChange': attrs.onChange,
                    'onBlur': attrs.onBlur,
                    'onFocus': attrs.onFocus,
                    'onMouseleave': attrs.onMouseleave,
                    'onMouseenter': attrs.onMouseenter,
                    'onClick': attrs.onClick
                };
            }

            /*Returns step attribute value based on input type*/
            function getStepValue(type) {
                if (type === 'text') {
                    return '';
                }
                if (type === 'float' || type === 'double') {
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
                if (type === 'datetime' || type === 'timestamp') {
                    caption += ' | date:formFields[' + index + '].datepattern || \'yyyy-MM-dd HH:mm:ss\'';
                } else if (type === 'time') {
                    caption += ' | date:\'HH:mm:ss\'';
                } else if (type === 'date') {
                    caption += ' | date:formFields[' + index + '].datepattern';
                } else if (type === 'password') {
                    caption = '********';
                } else if (type === 'select') {
                    caption =  'formFields[' + index + '].isRelated ? getDisplayExpr(formFields[' + index + '].value, formFields[' + index + '].displayvalue || formFields[' + index + '].displayfield) : formFields[' + index + '].value';
                } else if (type === 'rating') {
                    caption = '';
                }
                return caption;
            }

            function getFormFields(fieldDef, index, type) {
                var fields = '',
                    dateTypes = ['date', 'datetime'],
                    textTypes = ['text', 'password', 'textarea'],
                    excludeMaxValTypes = ['rating'],
                    eventTypes = getEventTypes();
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
                        } else if (_.includes(eventTypes, field)) {
                            fields += ' ' + Utils.hyphenate(field) + '="{{formFields[' + index + '].' + field + '}}"';
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
                    template = template + '<a class="col-md-8 col-sm-8 form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" data-ng-show="formFields[' + index + '].value != null"><i class="wm-icon wm-icon24 glyphicon glyphicon-file"></i></a>';
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
                var template = '', step = getStepValue(fieldDef.type);
                template = template + '<wm-slider  ' + getFormFields(fieldDef, index) + ' show="{{isUpdateMode}}" scopedatavalue="formFields[' + index + '].value"';
                if (step) {
                    template = template + ' step="' + step + '" ';
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
                var template = '', step;

                step = getStepValue(fieldDef.type);

                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Enter Max Value';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].minValue" : "") + '" type="' + type + '" ' + (step ? (' step="' + step + '"') : "") + ' placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].maxValue" : "") + '" type="' + type + '" ' + (step ? (' step="' + step + '"') : "") + ' placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                    template = template + '<wm-text ' + getFormFields(fieldDef, index, type) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].value" : "") + '" type="' + type + '" ' + (step ? (' step="' + step + '"') : "") + ' placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-text>';
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
                    fieldTypeWidgetTypeMap = Utils.getFieldTypeWidgetTypesMap();
                    widgetType = (fieldDef.widgetType || fieldTypeWidgetTypeMap[fieldDef.type][0]).toLowerCase();
                } else if (liveType === 'filter') {
                    fieldDef.placeholder = fieldDef.minPlaceholder || '';
                    widgetType = fieldDef.widget.toLowerCase();
                }
                template = template +
                    '<wm-composite widget="' + widgetType + '" show="{{formFields[' + index + '].show}}" class="form-timestamp">' +
                    '<wm-label class="col-sm-3 col-xs-12" caption="{{formFields[' + index + '].displayName}}" hint="{{formFields[' + index + '].displayName}}" required="{{formFields[' + index + '].required}}"></wm-label>' +
                    '<div class="col-sm-9 col-xs-12 {{formFields[' + index + '].class}}">' +
                    '<wm-label class="form-control-static" caption="{{' + getCaptionByWidget(widgetType, index) + '}}" show="{{!isUpdateMode}}"></wm-label>';

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
                    columnArray = rawObject.propertiesMap.columns;

                if (scope) {
                    scope.propertiesMap = rawObject.propertiesMap;
                    scope.columnArray = scope.propertiesMap.columns;
                    scope.primaryKey = scope.primaryKey || [];
                }
                columnArray.forEach(function (fieldObj, index) {
                    translatedObj[index] = {
                        "displayName": Utils.prettifyLabel(fieldObj.fieldName),
                        "show": true,
                        "primaryKey": fieldObj.isPrimaryKey,
                        "generator": fieldObj.generator,
                        "key": fieldObj.fieldName,
                        "value": "",
                        "type": fieldObj.isRelated ? "list" : fieldObj.fullyQualifiedType,
                        "maxvalue": '',
                        "isRelated": fieldObj.isRelated,
                        "readonly": fieldObj.isPrimaryKey,
                        "required": fieldObj.notNull === "true" || fieldObj.notNull === true,
                        "relatedFieldName": fieldObj.columns && fieldObj.columns[index] && fieldObj.columns[index].fieldName
                    };
                    if (fieldObj.defaultValue) {
                        translatedObj[index].defaultValue = getDefaultValue(fieldObj.defaultValue, fieldObj.type);
                    }
                    if (fieldObj.type === "string" || fieldObj.type === "character" || fieldObj.type === "text" || fieldObj.type === "blob" || fieldObj.type === "clob") {
                        translatedObj[index].maxvalue = fieldObj.length;
                    }
                    if (fieldObj.isPrimaryKey) {
                        /*Store the primary key of data*/
                        if (scope) {
                            scope.setPrimaryKey(fieldObj.fieldName);
                        }
                        /*If the field has assigned generator, make read only false*/
                        if (fieldObj.generator === "assigned") {
                            translatedObj[index].readonly = false;
                        } else {
                            /*Hiding primary if it is generated automatically(User can un-hide it from edit feilds dialog)*/
                            translatedObj[index].show = false;
                        }
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

            /*returning event options with type set to 'Default'*/
            function getEventOptions() {
                var eventsArray = ["NoEvent", "Javascript"].concat(Variables.retrieveEventCallbackVariables()),
                    eventsObject;
                eventsObject = eventsArray.map(function (event) {
                    return {
                        'name': event,
                        'type': 'Default'
                    };
                });
                return eventsObject;
            }
            /*Iterate over events and populate 'Javascript' with appropriate event name and args*/
            function getNewEventsObject(prefix, events) {
                var newEventName,
                    newCustomEvent,
                    eventNumber = 0,
                    customEvents = [],
                    args = '($event, $scope)';
                _.forEach(events, function (event, index) {
                    if (event === 'Javascript') {
                        newCustomEvent = prefix;
                        newEventName = newCustomEvent + args;
                        while (_.includes(events, newEventName)) {
                            eventNumber += 1;
                            newCustomEvent = prefix + eventNumber;
                            newEventName = newCustomEvent + args;
                        }
                        events[index] = newEventName;
                        customEvents = customEvents.concat(newCustomEvent);
                    }
                });
                return {
                    'events' : events,
                    'customEvents' : customEvents
                };
            }
            /*function to update script link visibility*/
            function toggleActionMessage(selectedItem, actionsList, isField, eventType, value) {
                if (isField && eventType) {
                    selectedItem[eventType] = value;
                    return selectedItem.include && !selectedItem.remove && _.includes(selectedItem[eventType], 'Javascript');
                }
                return selectedItem.include && !selectedItem.remove && !_.includes(actionsList, selectedItem.action);
            }

            this.getNewEventsObject = getNewEventsObject;
            this.toggleActionMessage = toggleActionMessage;
            this.getEventOptions = getEventOptions;
            this.getEventTypes = getEventTypes;
            this.getDefaultValue = getDefaultValue;
            this.getFormButtons = getFormButtons;
            this.getGridActions = getGridActions;
            this.getCustomItems = getCustomItems;
            this.getColumnDef = getColumnDef;
            this.getTemplate = getTemplate;
            this.getFormActions = getFormActions;
            this.translateVariableObject = translateVariableObject;
            this.getColumnCountByLayoutType = getColumnCountByLayoutType;
        }
    ]);
