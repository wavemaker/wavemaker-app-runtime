/*global WM, moment*/

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
                if (value === "true") {
                    return true;
                }
                if (value === "false") {
                    return false;
                }
                return value;
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
                    'show': (attrs.show === "1" || attrs.show === "true"),
                    'type': attrs.type || 'text',
                    'primaryKey': attrs.primaryKey === "true" || attrs.primaryKey === true,
                    'generator': attrs.generator,
                    'readonly': attrs.readonly === "true" || attrs.readonly === true,
                    'multiple': attrs.multiple === "true" || attrs.multiple === true,
                    'datepattern': attrs.datepattern,
                    'class': attrs.class || '',
                    'required': attrs.required === "true" || attrs.required === true,
                    'placeholder': attrs.placeholder
                };
            }

            /*Returns step attribute value based on input type*/
            function getStepValue(type) {
                if (type === 'text') {
                    return "";
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
                if (type === "datetime" || type === "timestamp") {
                    caption += " | date:formFields[" + index + "].datepattern";
                } else if (type === "time") {
                    caption += " | date:\'HH:mm:ss\'";
                } else if (type === "date") {
                    caption += " | date:formFields[" + index + "].datepattern";
                } else if (type === "password") {
                    caption = "********";
                } else if (type === "select") {
                    caption =  'formFields[' + index + '].isRelated ? getDisplayExpr(formFields[' + index + '].value, formFields[' + index + '].displayvalue || formFields[' + index + '].displayfield) : formFields[' + index + '].value';
                }
                return caption;
            }

            function getFormFields(fieldDef, index, type) {
                var fields = "";
                Object.keys(fieldDef).forEach(function (field) {
                    if (fieldDef[field]) {
                        if (field === "key" || field === "field") {
                            fields += ' name="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === "displayvalue") {
                            fields += ' displayexpression="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === "permitted") {
                            fields += ' accept="{{formFields[' + index + '].' + field + '}}"';
                        } else if (field === "caption" || field === "type" || field === "show" || field === "placeholder" || field === "minPlaceholder" || field === "maxPlaceholder") {
                            // Avoid show attribute to support edit mode using isUpdateMode.
                        } else {
                            fields += ' ' + field + '="{{formFields[' + index + '].' + field + '}}"';
                        }
                    }
                });
                return fields;
            }

            /*Returns datatime/timestamp template*/
            function dateTimeTemplate(fieldDef, index) {
                var template = "";
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min date time';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max date time';
                    template = template +
                        '<div class="col-md-4 col-sm-4"><wm-datetime ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}" ></wm-datetime></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-datetime ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}" ></wm-datetime></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select date time';
                    template = template + '<wm-datetime ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}" ></wm-datetime>';
                }
                return template;
            }

            /*Returns time template*/
            function timeTemplate(fieldDef, index) {
                var template = "";
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
                var template = "";
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min time';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max time';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-date ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}"show="{{isUpdateMode}}"> </wm-date></div>' +
                         '<div class="col-md-1 col-sm-1"></div>' +
                         '<div class="col-md-4 col-sm-4"><wm-date ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-date></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select date';
                    template = template + '<wm-date ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}"show="{{isUpdateMode}}"> </wm-date>';
                }
                return template;
            }

            /*Returns upload template */
            function uploadTemplate(fieldDef, index) {
                var template = "";
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
                var template = "";
                fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                template += '<wm-textarea' + getFormFields(fieldDef, index) + 'scopedatavalue="formFields[' + index + '].value" show="{{isUpdateMode}}"></wm-textarea>';
                return template;
            }

            /*Returns richtext template */
            function richtextTemplate(fieldDef, index) {
                var template = "";
                template += '<wm-richtexteditor ' + getFormFields(fieldDef, index) + ' show="{{isUpdateMode}}"></wm-richtexteditor>';
                return template;
            }

            /*Returns password template */
            function passwordTemplate(fieldDef, index) {
                var template = "";
                fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                template = template + '<wm-text ' + getFormFields(fieldDef, index) + 'show="{{isUpdateMode}}" type="password" ></wm-text>';
                return template;
            }

            /*Returns slider template */
            function sliderTemplate(fieldDef, index, liveType) {
                var template = "", step = getStepValue(fieldDef.type);
                template = template + '<wm-slider  ' + getFormFields(fieldDef, index) + ' show="{{isUpdateMode}}" scopedatavalue="formFields[' + index + '].value"';
                if (step) {
                    template = template + ' step="' + step + '" ';
                }
                template = template + ' ></wm-slider>';
                return template;
            }

            /*Returns radioset template */
            function radiosetTemplate(fieldDef, index) {
                var template = "";
                template = template + '<wm-radioset ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].selected" dataset="" show="{{isUpdateMode}}"></wm-radioset>';
                return template;
            }

            /*Returns checkboxset template */
            function checkboxsetTemplate(fieldDef, index) {
                var template = "";
                template = template + '<wm-checkboxset ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].selected" dataset="" show="{{isUpdateMode}}"></wm-checkboxset>';
                return template;
            }

            /*Returns checkbox template */
            function checkboxTemplate(fieldDef, index) {
                var template = "";
                template = template + '<wm-checkbox ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" show="{{isUpdateMode}}" ></wm-checkbox>';
                return template;
            }

            /*Returns select template */
            function selectTemplate(fieldDef, index, liveType) {
                var template = "";
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Select Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Select Max Value';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-select ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}" ></wm-select></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-select ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}" ></wm-select></div>';

                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Select value';
                    template = template + '<wm-select ' + getFormFields(fieldDef, index) + ' scopedataset="formFields[' + index + '].dataset" scopedatavalue="formFields[' + index + '].value" placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-select>';
                }
                return template;
            }

            /*Returns text template */
            function textNumberTemplate(fieldDef, index, liveType) {
                var template = "", step, type;

                type = fieldDef.type;
                type = Utils.isNumberType(type) ? "number" : "text";
                step = getStepValue(type);

                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Enter Max Value';
                    template = template + '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].minValue" : "") + '" type="' + type + '" ' + (step ? (' step="' + step + '"') : "") + ' placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>' +
                        '<div class="col-md-1 col-sm-1"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].maxValue" : "") + '" type="' + type + '" ' + (step ? (' step="' + step + '"') : "") + ' placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>';
                } else {
                    fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                    template = template + '<wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="' + (CONSTANTS.isRunMode ? "formFields[" + index + "].value" : "") + '" type="' + type + '" ' + (step ? (' step="' + step + '"') : "") + ' placeholder="{{formFields[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-text>';
                }
                return template;
            }

            /*Returns default template */
            function defaultTemplate(fieldDef, index) {
                var template = "";
                if (fieldDef.isRange) {
                    template = template + '<div class="col-md-4 col-sm-4"><wm-text ' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" type="text" placeholder="{{formFields[' + index + '].minPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>' +
                        '<div class="col-md-4 col-sm-4"></div>' +
                        '<div class="col-md-4 col-sm-4"><wm-text' + getFormFields(fieldDef, index) + ' scopedatavalue="formFields[' + index + '].value" type="text" placeholder="{{formFields[' + index + '].maxPlaceholder}}" show="{{isUpdateMode}}"></wm-text></div>';
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
                var template = "", fieldTypeWidgetTypeMap, widgetType;
                if (liveType === "form") {
                    //Set "Readonly field" placeholder for fields which are readonly and contain generated values if the user has not given any placeholder
                    if (fieldDef.readonly && fieldDef.generator === "identity") {
                        fieldDef.placeholder = fieldDef.placeholder || '';
                    }
                    //Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap
                    fieldTypeWidgetTypeMap = Utils.getFieldTypeWidgetTypesMap();
                    widgetType = (fieldDef.widgetType || fieldTypeWidgetTypeMap[fieldDef.type][0]).toLowerCase();
                } else if (liveType === "filter") {
                    widgetType = fieldDef.widget.toLowerCase();
                }
                template = template +
                    '<wm-composite widget="' + widgetType + '" show="{{formFields[' + index + '].show}}" class="form-timestamp {{formFields[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{formFields[' + index + '].displayName}}" hint="{{formFields[' + index + '].displayName}}" required="{{formFields[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9">' +
                    '<wm-label class="form-control-static" caption="{{' + getCaptionByWidget(widgetType, index) + '}}" show="{{!isUpdateMode}}"></wm-label>';

                switch (widgetType) {
                case "number":
                case "text":
                    template += textNumberTemplate(fieldDef, index, liveType);
                    break;
                case "select":
                    template += selectTemplate(fieldDef, index, liveType);
                    break;
                case "checkbox":
                    template += checkboxTemplate(fieldDef, index, liveType);
                    break;
                case "checkboxset":
                    template += checkboxsetTemplate(fieldDef, index, liveType);
                    break;
                case "radioset":
                    template += radiosetTemplate(fieldDef, index, liveType);
                    break;
                case "slider":
                    template += sliderTemplate(fieldDef, index, liveType);
                    break;
                case "password":
                    template += passwordTemplate(fieldDef, index, liveType);
                    break;
                case "richtext":
                    template += richtextTemplate(fieldDef, index, liveType);
                    break;
                case "textarea":
                    template += textareaTemplate(fieldDef, index, liveType);
                    break;
                case "upload":
                    template += uploadTemplate(fieldDef, index, liveType);
                    break;
                case "date":
                    template += dateTemplate(fieldDef, index, liveType);
                    break;
                case "time":
                    template += timeTemplate(fieldDef, index, liveType);
                    break;
                case "datetime":
                case "timestamp":
                    template += dateTimeTemplate(fieldDef, index, liveType);
                    break;
                default:
                    template += defaultTemplate(fieldDef, index, liveType);
                    break;
                }
                template = template + '</div></wm-composite>';
                return template;
            }

            /*
            * @ngdoc function
            * @name wm.widgets.live.LiveWidgetUtils#getCustomActions
            * @methodOf wm.widgets.live.LiveWidgetUtils
            * @function
            *
            * @description
            * return the array of custom actions defined by the user.
            *
            * @param {string} actions actions of a button
            * @param {array} definedActions Predefined actions for the widget
            */
            function getCustomActions(actions, definedActions) {
                var customActions = [];
                actions = actions && actions.split(';');
                if (WM.isArray(actions)) {
                    actions.forEach(function (action) {
                        if (definedActions.indexOf(action) === -1) {
                            action = action.substring(0, action.indexOf('('));
                            customActions.push(action);
                        }
                    });
                }
                return customActions;
            }

            this.getDefaultValue = getDefaultValue;
            this.getFormButtons = getFormButtons;
            this.getCustomActions = getCustomActions;
            this.getColumnDef = getColumnDef;
            this.getTemplate = getTemplate;
        }
    ]);