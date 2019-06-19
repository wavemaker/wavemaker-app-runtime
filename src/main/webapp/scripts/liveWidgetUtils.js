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
        'CONSTANTS',
        "DB_CONSTANTS",
        'WidgetUtilService',
        'Variables',
        '$timeout',
        'WIDGET_CONSTANTS',
        '$servicevariable',
        '$q',
        function (Utils, $rs, FormWidgetUtils, PropertiesFactory, $compile, CONSTANTS, DB_CONSTANTS, WidgetUtilService, Variables, $timeout, WIDGET_CONSTANTS, $servicevariable, $q) {
            'use strict';
            var keyEventsWidgets       = ['number', 'text', 'select', 'password', 'textarea'],
                definedEvents          = ['onBlur', 'onFocus', 'onChange'],
                eventTypes             = definedEvents.concat(['onMouseleave', 'onMouseenter', 'onClick', 'onSelect', 'onSubmit', 'onBeforeadd', 'onAdd',
                                                'onBeforeremove', 'onRemove', 'onBeforereorder', 'onReorder', 'onBeforeservicecall', 'onChipselect', 'onChipclick']),
                allEventTypes          = eventTypes.concat('onKeypress', 'onKeydown', 'onKeyup'),
                defaultNgClassesConfig = {'className': '', 'condition': ''},
                isDataSetWidgets       = Utils.getDataSetWidgets(),
                resetDataSetProps      = ['datafield', 'searchkey', 'displaylabel', 'displayfield', 'displayexpression', 'orderby', 'displayimagesrc'],
                LIVE_CONSTANTS         = {
                    'EMPTY_KEY'     : 'EMPTY_NULL_FILTER',
                    'EMPTY_VALUE'   : $rs.appLocale && $rs.appLocale.LABEL_NO_VALUE,
                    'LABEL_KEY'     : 'key',
                    'LABEL_VALUE'   : 'value',
                    'NULL_EMPTY'    : ['null', 'empty'],
                    'NULL'          : 'null',
                    'EMPTY'         : 'empty'
                },
                MATCH_MODES = {
                    'BETWEEN'     : 'between',
                    'GREATER'     : 'greaterthanequal',
                    'LESSER'      : 'lessthanequal',
                    'NULL'        : 'null',
                    'EMPTY'       : 'empty',
                    'NULLOREMPTY' : 'nullorempty',
                    'EQUALS'      : 'exact'
                },
                VIEW_MODE_OPTIONS = {
                    'DEFAULT'   : 'default',
                    'LABEL'     : 'label'
                },
                ALLFIELDS   = 'All Fields';

            //Returns true if the value is defined and is not empty or null
            function isDefined (val) {
                return WM.isDefined(val) && val !== '' && val !== null;
            }

            //Returns true if widget is autocomplete or chips
            function isSearchWidgetType(widget) {
                return _.includes(['autocomplete', 'typeahead', 'chips'], widget);
            }
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
                if (/^\d+$/.test(value)) { //Check if the value is a string of number type like '123'
                    return +value;
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
            function getDefaultValue(value, type, widget) {
                if (_.startsWith(value, 'bind:')) {
                    return value;
                }
                if (widget) {
                    if (widget === 'number' || widget === 'slider' || widget === 'currency') {
                        return isNaN(Number(value)) ? null : Number(value);
                    }
                    if (widget === 'checkbox' || widget === 'toggle') {
                        return formatBooleanValue(value);
                    }
                    return value;
                }
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
                            widgetType  :   'button',
                            key         :    'reset',
                            class       :    'form-reset btn-secondary',
                            iconclass   :    'wi wi-refresh',
                            action      :    'reset()',
                            displayName :    'Reset',
                            show        :    'true',
                            type        :    'button',
                            'position'  :    'footer',
                            updateMode  :    true,
                            shortcutkey : ''
                        },
                        {
                            widgetType  :   'button',
                            key         :   'cancel',
                            class       :   'form-cancel btn-secondary',
                            iconclass   :   'wi wi-cancel',
                            action      :   'cancel()',
                            displayName :   'Cancel',
                            show        :   'true',
                            type        :   'button',
                            'position'  :   'footer',
                            updateMode  :   true,
                            shortcutkey : ''
                        },
                        {
                            widgetType  :   'button',
                            key         :   'save',
                            class       :   'form-save btn-success',
                            iconclass   :   $rs.isMobileApplicationType ? 'wi wi-done' : 'wi wi-save',
                            action      :   '',
                            displayName :   'Save',
                            show        :   'true',
                            type        :   'submit',
                            'position'  :   'footer',
                            updateMode  :   true,
                            shortcutkey : ''
                        },
                        {
                            widgetType  :   'button',
                            key         :   'delete',
                            class       :   'form-delete btn-secondary',
                            iconclass   :   'wi wi-trash',
                            action      :   'delete()',
                            displayName :   'Delete',
                            show        :   'true',
                            type        :   'button',
                            'position'  :   'footer',
                            updateMode  :   false,
                            shortcutkey : ''
                        },
                        {
                            widgetType  :   'button',
                            key         :   'edit',
                            class       :   'form-update btn-secondary',
                            iconclass   :   'wi wi-pencil',
                            action      :   'edit()',
                            displayName :   'Edit',
                            show        :   'true',
                            type        :   'button',
                            'position'  :   'footer',
                            updateMode  :   false,
                            shortcutkey : ''
                        },
                        {
                            widgetType  :   'button',
                            key         :   'new',
                            class       :   'form-new btn-success',
                            iconclass   :   'wi wi-plus',
                            action      :   'new()',
                            displayName :   'New',
                            show        :   'true',
                            type        :   'button',
                            'position'  : 'footer',
                            updateMode  :   false,
                            shortcutkey : ''
                        }
                    ];
                    break;
                case 'LIVEFILTER':
                    defaultButtons = [
                        {
                            widgetType  :   'button',
                            key         :   'filter',
                            class       :   'btn-primary',
                            iconclass   :   'wi wi-filter-list',
                            action      :   'filter()',
                            displayName :   'Filter',
                            show        :   'true',
                            'position'  :   'footer',
                            type        :   'button',
                            shortcutkey : ''
                        },
                        {
                            widgetType  :   'button',
                            key         :   'clear',
                            class       :   'btn-secondary',
                            iconclass   :   'wi wi-trash',
                            action      :   'clearFilter()',
                            displayName :   'Clear',
                            'position'  :   'footer',
                            show        :   'true',
                            type        :   'button',
                            shortcutkey : ''
                        }];
                    break;
                case 'GRID':
                    defaultButtons = [
                        {
                            'widgetType' : 'button',
                            'key'        : 'addNewRow',
                            'displayName': 'New',
                            'iconclass'  : 'wi wi-plus',
                            'show'       : 'true',
                            'class'      : 'btn-primary',
                            'action'     : 'addNewRow()',
                            'position'   : 'footer',
                            shortcutkey : ''
                        }
                    ];
                    break;
                case 'GRIDROW':
                    defaultButtons = [
                        {
                            'key'        : 'updaterow',
                            'displayName': '',
                            'title'      : 'Edit',
                            'iconclass'  : 'wi wi-pencil',
                            'show'       : 'true',
                            'class'      : 'btn-transparent',
                            'action'     : 'editRow($event)'
                        },
                        {
                            'key'        : 'deleterow',
                            'displayName': '',
                            'title'      : 'Delete',
                            'iconclass'  : 'wi wi-trash',
                            'show'       : 'true',
                            'class'      : 'btn-transparent',
                            'action'     : 'deleteRow($event)'
                        }
                    ];
                    break;
                case 'FORM':
                    defaultButtons = [
                        {
                            widgetType  : 'button',
                            key         : 'reset',
                            class       : 'form-reset btn-secondary',
                            iconclass   : 'wi wi-refresh',
                            action      : '',
                            displayName : 'Reset',
                            show        : 'true',
                            type        : 'reset',
                            position    : 'footer',
                            updateMode  : true,
                            shortcutkey : ''
                        },
                        {
                            widgetType  : 'button',
                            key         : 'save',
                            class       : 'form-save btn-success',
                            iconclass   : $rs.isMobileApplicationType ? 'wi wi-done' : 'wi wi-save',
                            action      : '',
                            displayName : 'Save',
                            show        : 'true',
                            type        : 'submit',
                            position    : 'footer',
                            updateMode  : true,
                            shortcutkey : ''
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
                    'integer'    : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider', 'currency', 'autocomplete', 'chips'],
                    'big_integer': ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider', 'currency', 'autocomplete', 'chips'],
                    'short'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'autocomplete', 'chips'],
                    'float'      : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'autocomplete', 'chips'],
                    'big_decimal': ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'autocomplete', 'chips'],
                    'number'     : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'autocomplete', 'chips'],
                    'double'     : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'autocomplete', 'chips'],
                    'long'       : ['number', 'text', 'select', 'checkboxset', 'radioset', 'rating', 'slider', 'currency', 'autocomplete', 'chips'],
                    'byte'       : ['number', 'text', 'select', 'checkboxset', 'radioset', 'slider', 'currency', 'autocomplete', 'chips'],
                    'string'     : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp', 'switch', 'currency', 'autocomplete', 'chips', 'colorpicker'],
                    'character'  : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'switch', 'currency', 'autocomplete', 'chips'],
                    'text'       : ['text', 'number',  'textarea', 'password', 'richtext', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp', 'switch', 'currency', 'autocomplete', 'chips', 'colorpicker'],
                    'date'       : ['date', 'text', 'number', 'select', 'checkboxset', 'radioset', 'autocomplete', 'chips'],
                    'time'       : ['time', 'text', 'number', 'select', 'checkboxset', 'radioset', 'autocomplete', 'chips'],
                    'timestamp'  : ['timestamp', 'text', 'number', 'select', 'checkboxset', 'radioset', 'autocomplete', 'chips'],
                    'datetime'   : ['datetime', 'text', 'select', 'checkboxset', 'radioset', 'autocomplete', 'chips'],
                    'boolean'    : ['checkbox', 'radioset', 'toggle', 'select'],
                    'list'       : ['select', 'radioset', 'checkboxset', 'switch', 'autocomplete', 'chips'],
                    'clob'       : ['text', 'textarea', 'richtext'],
                    'blob'       : ['upload'],
                    'file'       : ['upload'],
                    'custom'     : ['text', 'number',  'textarea', 'password', 'checkbox', 'toggle', 'slider', 'richtext', 'currency', 'switch', 'select', 'checkboxset', 'radioset', 'date', 'time', 'timestamp', 'rating', 'datetime', 'autocomplete', 'chips', 'colorpicker', 'upload']
                };
                return fieldTypeWidgetTypeMap;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getMatchModeTypesMap
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * return the match modes based on the data type
             */
            function getMatchModeTypesMap(multiMode) {
                var typesMap = {
                        'number': ['number', 'integer', 'big_integer', 'short', 'float', 'big_decimal', 'double', 'long', 'byte'],
                        'string': ['string', 'text'],
                        'character': ['character'],
                        'date': ['date','time',  'timestamp', 'datetime']
                    },
                    modes = {
                        'number': ['exact', 'notequals', 'lessthan', 'lessthanequal', 'greaterthan', 'greaterthanequal', 'null', 'isnotnull'],
                        'string': ['anywhereignorecase', 'anywhere', 'startignorecase', 'start', 'endignorecase', 'end', 'exactignorecase', 'exact', 'notequalsignorecase', 'notequals', 'null', 'isnotnull', 'empty', 'isnotempty', 'nullorempty'],
                        'character': ['exactignorecase', 'exact', 'notequalsignorecase', 'notequals', 'null', 'isnotnull', 'empty', 'isnotempty', 'nullorempty'],
                        'date': ['exact', 'lessthan', 'lessthanequal', 'greaterthan', 'greaterthanequal', 'null', 'notequals', 'isnotnull']
                    },
                    matchModeTypesMap = {
                        'boolean'    : ['exact', 'null', 'isnotnull'],
                        'clob'       : [],
                        'blob'       : []
                    };

                if (multiMode) {
                    modes.number.push('in', 'notin', 'between');
                    modes.date.push('between');
                    modes.string.push('in', 'notin');
                    modes.character.push('in', 'notin');
                }

                _.forEach(typesMap, function (types, primType) {
                    _.forEach(types, function (type) {
                        matchModeTypesMap[type] = modes[primType];
                    });
                });
                //this is used in filter criteria when the user types the column name manually and where we dont know the type of the column
                matchModeTypesMap['default'] = _.union(modes['number'], modes['string'], modes['character'], modes['date'], modes['date']);
                return matchModeTypesMap;
            }

            //Populate the filter options with localized messages
            function getMatchModeMsgs(appLocale) {
                return {
                    'start'            : appLocale.LABEL_STARTS_WITH,
                    'startignorecase'  : appLocale.LABEL_STARTS_WITH_IGNORECASE,
                    'end'              : appLocale.LABEL_ENDS_WITH,
                    'endignorecase'    : appLocale.LABEL_ENDS_WITH_IGNORECASE,
                    'anywhere'         : appLocale.LABEL_CONTAINS,
                    'anywhereignorecase': appLocale.LABEL_CONTAINS_IGNORECASE,
                    'exact'            : appLocale.LABEL_IS_EQUAL_TO,
                    'exactignorecase'  : appLocale.LABEL_IS_EQUAL_TO_IGNORECASE,
                    'notequals'        : appLocale.LABEL_IS_NOT_EQUAL_TO,
                    'notequalsignorecase': appLocale.LABEL_IS_NOT_EQUAL_TO_IGNORECASE,
                    'lessthan'         : appLocale.LABEL_LESS_THAN,
                    'lessthanequal'    : appLocale.LABEL_LESS_THAN_OR_EQUALS_TO,
                    'greaterthan'      : appLocale.LABEL_GREATER_THAN,
                    'greaterthanequal' : appLocale.LABEL_GREATER_THAN_OR_EQUALS_TO,
                    'null'             : appLocale.LABEL_IS_NULL,
                    'isnotnull'        : appLocale.LABEL_IS_NOT_NULL,
                    'empty'            : appLocale.LABEL_IS_EMPTY,
                    'isnotempty'       : appLocale.LABEL_IS_NOT_EMPTY,
                    'nullorempty'      : appLocale.LABEL_IS_NULL_OR_EMPTY,
                    'in'               : appLocale.LABEL_IN,
                    'notin'            : appLocale.LABEL_NOT_IN,
                    'between'          : appLocale.LABEL_BETWEEN
                };
            }
            function toBoolean(val, identity) {
                return val === 'false' ? false : (val === 'true' || val === '' || val === identity || val);
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
                var columnDef    = {},
                    widgetType   = attrs.widget || (attrs.widgetType && attrs.widgetType.toLowerCase()) || getFieldTypeWidgetTypesMap()[attrs.type || 'text'][0],
                    excludeKeys  = ['$attr', '$$element', 'initWidget', 'role', 'wmResizable', 'wmWidgetDrag', 'value'],
                    booleanAttrs = ['readonly', 'multiple', 'required', 'disabled', 'primaryKey', 'period'];
                /*Loop through the attrs keys and set it to columndef*/
                _.each(attrs, function (value, key) {
                    if (_.includes(booleanAttrs, key)) {
                        columnDef[key] = toBoolean(value, key);
                        return;
                    }
                    /*Exclude special type of keys*/
                    if (!_.includes(excludeKeys, key)) {
                        columnDef[key] = value;
                    }
                });
                /*Handle special cases properties*/
                columnDef.displayname   = attrs.displayname || (widgetType === 'checkbox' ? '' : attrs.caption);
                columnDef.pcDisplay     = WM.isDefined(attrs.pcDisplay) ? (attrs.pcDisplay === 'true') : true;
                columnDef.mobileDisplay = WM.isDefined(attrs.mobileDisplay) ? (attrs.mobileDisplay === 'true') : true;
                columnDef.type          = attrs.type || 'text';
                columnDef.widget        = widgetType; /*Widget type support for older projects*/
                columnDef.show          = WM.isDefined(attrs.show) ? (attrs.show === 'false' ? false : (attrs.show === 'true' || attrs.show)) : true;
                columnDef.name          = columnDef.name || columnDef.key || columnDef.field;
                columnDef.step          = !isNaN(columnDef.step) ? +columnDef.step : undefined;
                //Set required to false for widgets, which do not support required property
                columnDef.required      = _.includes(['checkboxset', 'chips', 'rating', 'silder', 'richtext'], widgetType) ? false : columnDef.required;
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
                    'displayName'   :   attrs.displayName || attrs.label || attrs.caption || '',
                    'show'          :   _.isUndefined(attrs.show) ? 'true' : (attrs.show || 'false'),
                    'class'         :   attrs.class || '',
                    'conditionalclass': attrs.conditionalclass,
                    'conditionalstyle': attrs.conditionalstyle,
                    'iconclass'     :   attrs.iconclass,
                    'title'         :   _.isUndefined(attrs.title) ? (attrs.displayName || '') : attrs.title,
                    'action'        :   attrs.action,
                    'accessroles'   :   attrs.accessroles,
                    'shortcutkey'   :   attrs.shortcutkey,
                    'disabled'      :   attrs.disabled || 'false',
                    'tabindex'      :   attrs.tabindex ? +attrs.tabindex : undefined,
                    'widgetType'    :   attrs.widgetType || 'button',
                    'hyperlink'     :   attrs.hyperlink,
                    'target'        :   attrs.target
                };
            }

            /*Returns row defs attributes to grid*/
            function getRowDef(attrs) {
                return {
                    'content'                :  attrs.content,
                    'expandicon'             :  attrs.expandicon,
                    'collapseicon'           :  attrs.collapseicon,
                    'position'               :  attrs.position || '0',
                    'closeothers'            :  _.isUndefined(attrs.closeothers) ? 'true' : (attrs.closeothers || 'false'),
                    'height'                 :  attrs.height,
                    'onBeforerowexpand'      :  attrs.onBeforerowexpand,
                    'onRowexpand'            :  attrs.onRowexpand,
                    'onBeforerowcollapse'    :  attrs.onBeforerowcollapse,
                    'onRowcollapse'          :  attrs.onRowcollapse,
                    'widgetType'             :  attrs.widgetType || 'button',
                    'displayName'            :  attrs.displayName,
                    'title'                  :   _.isUndefined(attrs.title) ? (attrs.displayName || '') : attrs.title,
                    'show'                   :  _.isUndefined(attrs.show) ? 'true' : (attrs.show || 'false'),
                    'disabled'               :  attrs.disabled || 'false',
                    'class'                  :  attrs.class,
                    'columnwidth'            :  attrs.columnwidth || '30px'
                };
            }

            /*Returns step attribute value based on input type*/
            function getStepValue(fieldObj) {
                return fieldObj.scale ? Math.pow(10, fieldObj.scale * -1) : 0;
            }

            function evaluateExpr(scope, object, displayExpr) {
                if (!displayExpr) {
                    displayExpr = Object.keys(object)[0];
                    //If dataset is not ready, display expression will not be defined
                    if (!displayExpr) {
                        return;
                    }
                }
                return WidgetUtilService.updateAndEvalExp(object, displayExpr, scope);
            }

            function getDisplayExpr(scope, object, displayExpr) {
                var caption = [];
                if (WM.isObject(object)) {
                    if (WM.isArray(object)) {
                        _.forEach(object, function (obj) {
                            caption.push(evaluateExpr(scope, obj, displayExpr));
                        });
                    } else {
                        caption.push(evaluateExpr(scope, object, displayExpr));
                    }
                    return _.join(caption, ',');
                }
                return object;
            }

            function getCaptionByWidget(type, index, fieldDef) {
                if (fieldDef.isRelated) {
                    return 'getDisplayExpr(formFields[' + index + '].value, formFields[' + index + '].displayexpression || formFields[' + index + '].displayfield || formFields[' + index + '].displaylabel)';
                }
                if (type === 'password') {
                    return '\'********\'';
                }
                var caption = 'formFields[' + index + '].value';
                if (type === 'datetime' || type === 'timestamp') {
                    caption += ' | date:formFields[' + index + '].datepattern || \'yyyy-MM-dd hh:mm:ss a\'';
                } else if (type === 'time') {
                    caption += ' | date:formFields[' + index + '].timepattern ||  \'hh:mm a\'';
                } else if (type === 'date') {
                    caption += ' | date:formFields[' + index + '].datepattern ||  \'yyyy-MMM-dd\'';
                } else if (type === 'rating' || type === 'upload') {
                    caption = '';
                } else if (isDataSetWidgets[type] && fieldDef.datafield === ALLFIELDS) {
                    return 'getDisplayExpr(formFields[' + index + '].value, formFields[' + index + '].displayexpression || formFields[' + index + '].displayfield || formFields[' + index + '].displaylabel)';
                }
                return caption;
            }

            function getFormFields(fieldDef) {
                var fields = '',
                    evtTypes,
                    excludeProperties,
                    fieldKeys,
                    formEvents = Utils.getClonedObject(definedEvents);
                if (fieldDef.widget === 'autocomplete') {
                    //For autocomplete, change is triggered using onSubmit event
                    _.pull(formEvents, 'onChange');
                    formEvents.push('onSubmit');
                }
                evtTypes          = _.pull(getEventTypes(), formEvents);
                excludeProperties = formEvents.concat(['caption', 'type', 'show', 'maxplaceholder', 'readonly', 'inputtype', 'widgettype', 'dataset', 'value',
                    'key', 'field', 'pcDisplay', 'mobileDisplay', 'generator', 'isRelated', 'displayname', 'primaryKey', 'step', 'widget', 'validationmessage', 'permitted', 'dataoptions']);
                fieldKeys         = _.pullAll(_.keys(fieldDef), excludeProperties);
                _.forEach(fieldKeys, function (field) {
                    if (!fieldDef[field]) {
                        return;
                    }
                    switch (field) {
                    case 'name':
                        fields += ' name="' + fieldDef[field] + '_formWidget"';
                        break;
                    case 'widgetid':
                        fields += ' widgetid="' + fieldDef.widgetid + '_' + fieldDef.name + '"';
                        break;
                    case 'textAlignment':
                        fields += ' textalign="' + fieldDef[field] + '"';
                        break;
                    case 'ngclass':
                        fields += ' ng-class="' + fieldDef[field] + '"';
                        break;
                    default:
                        if (_.includes(evtTypes, field)) {
                            fields += ' ' + Utils.hyphenate(field) + '="' + fieldDef[field] + '"';
                        } else if (_.isString(fieldDef[field])) {
                            fields += ' ' + field + '="' + fieldDef[field].replace(/"/g, "'") + '"';
                        } else {
                            fields += ' ' + field + '="' + fieldDef[field] + '"';
                        }
                    }
                });
                _.forEach(formEvents, function (evt) {
                    fields += ' ' + Utils.hyphenate(evt) + '="_' + evt + 'Field($event, $scope, newVal, oldVal);' + (fieldDef[evt] || '') + '"';
                });
                return fields;
            }

            function getDataSetFields(fieldDef, index, $el) {
                var template;
                if (isSearchWidgetType(fieldDef.widget)) {
                    template = ' datafield="{{formFields[' + index + '].datafield}}" searchkey="{{formFields[' + index + '].searchkey}}" displaylabel="{{formFields[' + index + '].displaylabel}}" displayfield="{{formFields[' + index + '].displayfield}}"';
                } else {
                    template = ' datafield="{{formFields[' + index + '].datafield}}" displayfield="{{formFields[' + index + '].displayfield}}" compareby="{{formFields[' + index + '].compareby}}"';
                }
                if (!fieldDef.dataset || _.isObject(fieldDef.dataset)) {
                    //In studio mode, set default option instead of scopedataset and add representational data indicator
                    if (CONSTANTS.isStudioMode && $el) {
                        template = template + ' dataset="Option 1, Option 2, Option 3" ';
                        $el.attr('data-evaluated-dataset', '');
                    } else {
                        template = template + ' scopedataset="formFields[' + index + '].dataset" dataset="" ';
                    }
                } else {
                    template = template + ' dataset="{{formFields[' + index + '].dataset}}" ';
                }
                return template;
            }
            /*Returns the default template*/
            function getDefaultTemplate(widgetType, fieldDef, index, minPlaceholderDefault, maxPlaceholderDefault, defaultPlaceholder, additionalFields) {
                var template = '',
                    widgetName = 'wm-' + widgetType,
                    //If view mode widget is default, show the widget in view mode. So, don't add show/hide condition for update/view mode
                    updateModeCondition = fieldDef.viewmodewidget === VIEW_MODE_OPTIONS.DEFAULT ? '' : (widgetType === 'richtexteditor' ? 'show = "{{isUpdateMode}}"' : 'ng-if="isUpdateMode"'),
                    allowInvalidAttr = fieldDef.widget === 'number' ? ' allowinvalid=true ' : '',
                    readonly = (widgetType !== 'richtexteditor' || fieldDef.readonly ? 'readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' : '');
                additionalFields = additionalFields || '';
                if (fieldDef.isRange) {
                    fieldDef.placeholder = fieldDef.displayformat ? '' : (_.isUndefined(fieldDef.placeholder) ? minPlaceholderDefault : fieldDef.placeholder);
                    fieldDef.maxplaceholder = fieldDef.displayformat ? '' : (_.isUndefined(fieldDef.maxplaceholder) ? maxPlaceholderDefault : fieldDef.maxplaceholder);
                    template = template +
                        '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-6' : 'col-sm-6') + '"><' + widgetName + ' ' +  getFormFields(fieldDef) + ' scopedatavalue="formFields[' + index + '].minValue" placeholder="{{formFields[' + index + '].placeholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + allowInvalidAttr + updateModeCondition +  additionalFields + '></' +  widgetName + '></div>' +
                        '<div class="' + ($rs.isMobileApplicationType ? 'col-xs-6' : 'col-sm-6') + '"><' + widgetName + ' ' +  getFormFields(fieldDef) + ' scopedatavalue="formFields[' + index + '].maxValue" placeholder="{{formFields[' + index + '].maxplaceholder}}" readonly="{{!isUpdateMode || formFields[' + index + '].readonly}}"' + allowInvalidAttr + updateModeCondition + additionalFields + '></' +  widgetName + '></div>';
                } else {
                    fieldDef.placeholder = fieldDef.displayformat ? '' : (_.isUndefined(fieldDef.placeholder) ? defaultPlaceholder : fieldDef.placeholder);
                    template = template + '<' + widgetName + ' ' +  getFormFields(fieldDef) + ' scopedatavalue="formFields[' + index + '].value" ' + readonly + allowInvalidAttr + updateModeCondition + additionalFields + '></' +  widgetName + '>';
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
                var template = '',
                    events   = ['change', 'click', 'focus', 'blur', 'mouseenter', 'mouseleave'],
                    eventTl  = '';
                //Generate the events templates
                _.forEach(events, function (event) {
                    var eventName = 'on' + _.capitalize(event);
                    if (fieldDef[eventName]) {
                        eventTl += ' ng-' + event + '="' + fieldDef[eventName] + '"';
                    }
                });
                if (fieldDef.filetype === 'image') {
                    template = template + '<a class="form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" ng-show="formFields[' + index + '].href"><img style="height:2em" class="wi wi-file" ng-src="{{formFields[' + index + '].href}}"/></a>';
                } else {
                    template = template + '<a class="form-control-static" target="_blank" href="{{formFields[' + index + '].href}}" ng-show="formFields[' + index + '].href"><i class="wi wi-file"></i></a>';
                }
                template = template + '<input wm-valid-file class="app-blob-upload" data-ng-class="{\'file-readonly\': formFields[' + index + '].readonly}" required="{{formFields[' + index + '].required}}" type="file" name="{{formFields[' + index + '].key + \'_formWidget\'}}" ng-required="{{formFields[' + index + '].required}}" ' +
                    'ng-readonly="{{formFields[' + index + '].readonly}}" data-ng-show="isUpdateMode" data-ng-model="formFields[' + index + '].value" accept="{{formFields[' + index + '].permitted}}"' + eventTl;
                //Add multiple flag
                if (fieldDef.multiple) {
                    template += ' multiple ';
                }
                template += '/>';
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
                    stepVal = fieldDef.step;
                additionalFields = stepVal ? ' step="' + stepVal + '" ' : '';
                return getDefaultTemplate('slider', fieldDef, index, '', '', '', additionalFields);
            }

            function getColorPickerTemplate(fieldDef, index) {
                return getDefaultTemplate('colorpicker', fieldDef, index, 'Select Color', 'Select Color', 'Select Color');
            }

            /*Returns chips template */
            function getChipsTemplate(fieldDef, index) {
                var additionalFields = getDataSetFields(fieldDef, index) + ' dataoptions="formFields[' + index + '].dataoptions"';
                return getDefaultTemplate('chips', fieldDef, index, '', '', 'Type here...', additionalFields);
            }

            /*Returns radioset template */
            function getRadiosetTemplate(fieldDef, index, $el) {
                var additionalFields = getDataSetFields(fieldDef, index, $el);
                return getDefaultTemplate('radioset', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns checkboxset template */
            function getCheckboxsetTemplate(fieldDef, index, $el) {
                var additionalFields = getDataSetFields(fieldDef, index, $el);
                return getDefaultTemplate('checkboxset', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns checkbox template */
            function getCheckboxTemplate(fieldDef, index, widgetType) {
                var additionalFields = widgetType === 'toggle' ? 'type="toggle"' : '';
                additionalFields += fieldDef.caption ? ' caption="' + fieldDef.caption + '" ' : '';
                return getDefaultTemplate('checkbox', fieldDef, index, '', '', '', additionalFields);
            }

            /*Returns select template */
            function getSelectTemplate(fieldDef, index) {
                var additionalFields = getDataSetFields(fieldDef, index);
                return getDefaultTemplate('select', fieldDef, index, 'Select Min value', 'Select Max value', 'Select value', additionalFields);
            }

            /*Returns text template */
            function getTextNumberTemplate(fieldDef, index) {
                var stepVal, additionalFields;
                stepVal = fieldDef.step;
                additionalFields = 'type="{{formFields[' + index + '].inputtype}}" ' + (stepVal ? (' step="' + stepVal + '"') : "");
                return getDefaultTemplate('text', fieldDef, index, 'Enter Min value', 'Enter Max value', 'Enter value', additionalFields);
            }

            function getRatingTemplate(fieldDef, index) {
                var additionalFields = ' maxvalue="{{formFields[' + index + '].maxvalue}}" ' + getDataSetFields(fieldDef, index);
                return getDefaultTemplate('rating', fieldDef, index, '', '', '', additionalFields);
            }

            function getSwitchTemplate(fieldDef, index, $el) {
                var additionalFields = getDataSetFields(fieldDef, index, $el);
                return getDefaultTemplate('switch', fieldDef, index, '', '', '', additionalFields);
            }

            function getCurrencyTemplate(fieldDef, index) {
                var additionalFields,
                    stepVal = fieldDef.step;
                additionalFields = 'currency="{{formFields[' + index + '].currency}}" ' + stepVal ? ' step="' + stepVal + '" ' : '';
                return getDefaultTemplate('currency', fieldDef, index, 'Enter Min value', 'Enter Max value', 'Enter value', additionalFields);
            }

            function getSearchTemplate(fieldDef, index) {
                var additionalFields = ' type="autocomplete" dataoptions="formFields[' + index + '].dataoptions"  width="{{formFields[' + index + '].width}}"' +  getDataSetFields(fieldDef, index);
                return getDefaultTemplate('search', fieldDef, index, '', '', 'Search', additionalFields);
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
            function getTemplate(fieldDef, index, $el) {
                var template = '',
                    widgetType,
                    fieldTypeWidgetTypeMap = getFieldTypeWidgetTypesMap(),
                    controlLayout = $rs.isMobileApplicationType ? 'col-xs-12' : 'col-sm-12',
                    displayLabel,
                    validAttr;

                //Set 'Readonly field' placeholder for fields which are readonly and contain generated values if the user has not given any placeholder
                if (fieldDef.readonly && fieldDef.generator === 'identity') {
                    fieldDef.placeholder = fieldDef.placeholder || '';
                }
                //Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap
                widgetType  = fieldDef.widget || fieldTypeWidgetTypeMap[fieldDef.type][0];
                widgetType  = widgetType.toLowerCase();

                validAttr = 'ngform[\'' + fieldDef.name + '_formWidget\'].$invalid';
                // check for invalid class in autocomplete when $invalid is not set.
                if (widgetType === 'autocomplete') {
                    validAttr += ' || ngform[\'' + fieldDef.name + '_formWidget\'].$$element.hasClass(\'ng-invalid\')';
                    validAttr = '(' + validAttr + ')';
                }

                //If displayname is bound, set to empty value. This is to prevent bind: showing up in label
                fieldDef.displayname = (CONSTANTS.isRunMode && _.startsWith(fieldDef.displayname, 'bind:')) ? '' : fieldDef.displayname;

                displayLabel = '<label ng-if="formFields[' + index + '].displayname" ng-style="{width: captionsize}" class="app-label control-label formfield-label" title="{{formFields[' + index + '].displayname}}" ng-class="[_captionClass , {\'text-danger\': ' + validAttr + ' &&  ngform[\'' + fieldDef.name + '_formWidget\'].$touched && isUpdateMode, required: isUpdateMode && formFields[' + index + '].required}]">{{formFields[' + index + '].displayname}}</label>';

                template    = template +
                    '<div class="live-field form-group app-composite-widget clearfix caption-{{captionposition}}" widget="' + widgetType + '" >' + displayLabel +
                    '<div class="{{formFields[' + index + '].class}}" ng-class="formFields[' + index + '].displayname ? _widgetClass : \'' + controlLayout + '\'">' +
                    '<label class="form-control-static app-label" ng-show="!isUpdateMode && formFields[' + index + '].viewmodewidget !== \'' + VIEW_MODE_OPTIONS.DEFAULT + '\'" ng-bind-html="' + getCaptionByWidget(widgetType, index, fieldDef) + '"></label>';

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
                    template += getCheckboxsetTemplate(fieldDef, index, $el);
                    break;
                case 'radioset':
                    template += getRadiosetTemplate(fieldDef, index, $el);
                    break;
                case 'slider':
                    template += getSliderTemplate(fieldDef, index);
                    break;
                case 'colorpicker':
                    template += getColorPickerTemplate(fieldDef, index);
                    break;
                case 'chips':
                    template += getChipsTemplate(fieldDef, index);
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
                    template += getSwitchTemplate(fieldDef, index, $el);
                    break;
                case 'currency':
                    template += getCurrencyTemplate(fieldDef, index);
                    break;
                case 'typeahead':
                case 'autocomplete':
                    template += getSearchTemplate(fieldDef, index);
                    break;
                default:
                    template += getDefaultTemplate('text', fieldDef, index, 'Enter Min value', 'Enter Max value', 'Enter value');
                    break;
                }

                template = template + '<p ng-if="!(' + validAttr + ' && ngform[\'' + fieldDef.name + '_formWidget\'].$touched) && isUpdateMode" class="help-block">{{formFields[' + index + '].hint}}</p>';
                template = template + '<p ng-if="' + validAttr + ' &&  ngform[\'' + fieldDef.name + '_formWidget\'].$touched && isUpdateMode" class="help-block text-danger">{{formFields[' + index + '].validationmessage}}</p>';
                template = template + '</div></div>';
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
                    columnArray = rawObject.propertiesMap ? rawObject.propertiesMap.columns : undefined,
                    fieldNames = [],
                    widgetsMap = getFieldTypeWidgetTypesMap();

                if (scope) {
                    scope.propertiesMap = rawObject.propertiesMap;
                    scope.columnArray = scope.propertiesMap.columns;
                    scope.primaryKey = scope.primaryKey || [];
                }
                _.each(columnArray, function (fieldObj) {
                    if (fieldObj.systemInserted || fieldObj.systemUpdated) {
                        return;
                    }
                    var column;
                    if (!_.includes(fieldNames, fieldObj.fieldName) && !fieldObj.readonly) {
                        fieldNames.push(fieldObj.fieldName);
                        column = {
                            'displayname'   : Utils.prettifyLabel(fieldObj.fieldName),
                            'show'          : true,
                            'primaryKey'    : fieldObj.isPrimaryKey,
                            'generator'     : fieldObj.generator,
                            'period'        : fieldObj.period,
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
                            column.step = getStepValue(fieldObj);
                        }
                        column.widget = widgetsMap[column.type || 'custom'][0];
                        if (fieldObj.defaultValue) {
                            column.defaultvalue = getDefaultValue(fieldObj.defaultValue, fieldObj.type);
                        }
                        if (fieldObj.length > 0 && (fieldObj.type === 'string' || fieldObj.type === 'character' || fieldObj.type === 'text' || fieldObj.type === 'blob' || fieldObj.type === 'clob')) {
                            column.maxchars = fieldObj.length;
                        }
                        if (fieldObj.isPrimaryKey) {
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
            function getColumnCountByLayoutType(layout, numOfColumns) {
                if (layout) {
                    var layoutObj = {
                        'One Column'   : 1,
                        'Two Column'   : 2,
                        'Three Column' : 3,
                        'Four Column'  : 4
                    };
                    return layoutObj[layout] || 1;
                }
                return numOfColumns || 1;
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
            function getCustomFieldKey(fields, key, prefix, definedKeys) {
                var keys = definedKeys || fields.map(function (event) {
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
                    height,
                    getValue = function (val) {
                        val =  parseInt(val, 10);
                        return isNaN(val) ? '' : val;
                    };
                switch (type) {
                case 'width':
                    /*extract the width and width unit from width*/
                    width = column.width || '';
                    value = getValue(width);
                    unit = width.indexOf('%') === -1 ? 'px' : '%';

                    column.widthValue = value;
                    column.widthUnit = unit;
                    break;
                case 'height':
                    /*extract the width and width unit from width*/
                    height = column.height || '';
                    value = getValue(height);
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
                    if (WM.isDefined(column.widthValue) && column.widthValue !== '' && !isNaN(column.widthValue)) {
                        column.width = column.widthValue + column.widthUnit;
                    } else if (!column.widthValue || (!column.widthValue.length && Utils.stringStartsWith(column.width, column.widthValue))) {
                        /* Reset the width to default value when the widthValue is cleared from the UI. */
                        column.width = undefined;
                    }
                    column.widthValue = undefined;
                    column.widthUnit = undefined;
                    break;
                case 'height':
                    if (WM.isDefined(column.heightValue) && column.heightValue !== '' && !isNaN(column.heightValue)) {
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

            //Get the inner form widget for the form field
            function getFormFieldWidget(scope, element) {
                var $formWidgetEl;
                if (!scope.formWidget) {
                    $formWidgetEl  = element.find('[name="' + scope.name + '_formWidget"]'); //Find out the form widget inside the form field
                    scope.formWidget = $formWidgetEl.length ? $formWidgetEl.isolateScope() : undefined;

                    //Remove the formWidget on scope, if widget is destroyed
                    scope.formWidget && scope.formWidget.$on('$destroy', function () {
                        scope.formWidget = undefined;
                    });
                }
                return scope.formWidget;
            }

            /**
             * This function gets the service query param of service variable bound to the widget
             * @param $is Widget scope.
             * @param variable : variable instance
             * @param fields : dataset terminals
             * @returns : promise
             */
            function getServiceParams($is, variable, fields) {
                var deferred             = $q.defer(),
                    queryParams          = [],
                    searchOptions        = [];
                    $servicevariable.getServiceOperationInfo(variable.operation, variable.service, function (serviceOperationInfo) {
                        queryParams = Variables.getMappedServiceQueryParams(serviceOperationInfo.parameters);
                        // don't update search options if there is no query service param
                        if (queryParams && queryParams.length > 0) {
                            searchOptions = _.map(queryParams, function (value) {
                                return value;
                            });
                        }
                        deferred.resolve(searchOptions.length ? searchOptions : fields);
                    });
                return deferred.promise;
            }

            /**
             * To show custom options for the widget property in the properties panel.
             * @param $el : widget element
             * @param $is : widget scope
             * @param prop : property name
             * @param fields : terminals.
             * @returns {*}
             */
            function getCutomizedOptions($is, prop, fields) {
                var parts    = _.split($is.binddataset, /\W/),
                    variable = Variables.getVariableByName(parts[2]),
                    isBoundToServiceVariable = variable && variable.category === 'wm.ServiceVariable';
                if (prop === 'searchkey') {
                    // return service query param if bound to service variable.
                    if (isBoundToServiceVariable) {
                        return getServiceParams($is, variable, fields);
                    }
                    return fields;
                }
            }

            //function to update datafield, display field in the property panel
            function updatePropertyPanelOptions(scope) {
                WidgetUtilService.updatePropertyPanelOptions(scope);
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
                var template       = '',
                    wdgtProperties = scope.widgetProps, //Find out the form widget inside the form field
                    formWidget     = getFormFieldWidget(scope, element),
                    fieldDef       = parentScope.formFields[index],
                    resetProps     = {},
                    eleScope       = element.scope(),
                    variable,
                    selectedVariable;

                function setFormField() {
                    if (CONSTANTS.isRunMode) {
                        fieldDef[key] = newVal;
                    }
                }

                function compileField() {
                    //On changing of a property in studio mode, generate the template again so that change is reflected
                    template = getTemplate(fieldDef, index, element);
                    //Destroy the scopes of the widgtes inside the form field
                    element.find('.ng-isolate-scope')
                        .each(function () {
                            var elIscope = WM.element(this).isolateScope();
                            if (elIscope) {
                                elIscope.$destroy();
                            }
                        });
                    //Remove only live-field so that overlay won't get overrided
                    element.find('.live-field').remove();
                    element.append(template);
                    $compile(element.contents())(parentScope);
                }

                function updateGroupBy() {
                    if (wdgtProperties.groupby) {
                        variable    = Utils.getVariableName(scope, eleScope);
                        selectedVariable = eleScope && eleScope.Variables[variable];
                        FormWidgetUtils.showOrHideMatchProperty(scope, selectedVariable, wdgtProperties);
                        wdgtProperties.dateformat.show = _.includes(['day', 'hour', 'month', 'week'], scope.match);
                    }
                }

                //For show and required, expression is bound. So, no need to apply on inner widget
                if (formWidget && (key !== 'show' && key !== 'readonly')) {
                    formWidget[key] = newVal; //Set the property on the form widget inside the form field widget
                }
                switch (key) {
                case 'dataset':
                    /*if studio-mode, then update the displayField & dataField in property panel for dataset widgets*/
                    if (scope.widgetid && isDataSetWidgets[attrs.widget]) {

                        updatePropertyPanelOptions(scope);

                        if (WM.isDefined(newVal) && newVal !== null) {
                            if (newVal === '') {
                                _.forEach(resetDataSetProps, function (prop) {
                                    resetProps[prop]    = '';
                                    fieldDef[prop]      = undefined;
                                    scope[prop]         = undefined;
                                });
                                $rs.$emit('set-markup-attr', scope.widgetid, resetProps);
                                wdgtProperties.limit.show = true;
                            } else {
                                wdgtProperties.limit.show = scope.widget === 'autocomplete';
                            }

                            element.removeAttr('data-evaluated-dataset');
                        } else {
                            //Show limit if dataset is not bound
                            wdgtProperties.limit.show = true;
                        }
                        if (scope.widget === 'autocomplete' || scope.widget === 'chips') {
                            wdgtProperties.matchmode.show = false;
                            var isBoundToVariable = Utils.stringStartsWith(scope.binddataset, 'bind:Variables.');
                            if (isBoundToVariable) {
                                var matchModeAttr = element.attr('matchmode');
                                var variable = _.get(eleScope.Variables, Utils.getVariableName(scope));
                                if (variable && variable.category === 'wm.LiveVariable') {
                                    wdgtProperties.matchmode.show = true;
                                    // set default matchmode when no value is set.
                                    if (!matchModeAttr) {
                                        $rs.$emit('set-markup-attr', scope.widgetid, {'matchmode': 'startignorecase'});
                                    }
                                } else if (matchModeAttr) { // empty matchmode when dataset is set other than liveVariable
                                    $rs.$emit('set-markup-attr', scope.widgetid, {'matchmode': ''});
                                }
                            }
                        }

                        //Refresh the properties panel sub group show/false as limit property is updated
                        scope.$emit('wms:refresh-properties-panel');
                        //For checkboxset and radioset, compile the field again to reflect the change in studio mode
                        if (scope.widget === 'checkboxset' || scope.widget === 'radioset') {
                            compileField();
                        }
                        updateGroupBy();
                    }
                    break;
                case 'inputtype':
                    FormWidgetUtils.setPropertiesTextWidget(wdgtProperties, newVal);
                    break;
                case 'show':
                    if (CONSTANTS.isStudioMode && newVal) {
                        Utils.getService('LiveWidgetsMarkupManager').updateFieldMarkup({'formName': parentScope.name, 'fieldName': scope.name});
                        element.parents('[widgettype="wm-gridcolumn"]').removeClass('hide');
                    }
                    setFormField();
                    break;
                case 'displayname':
                    element.find('label.formfield-label').attr('title', newVal).text(newVal);
                    setFormField();
                    break;
                case 'maxplaceholder':
                    //In case of range, add the placeholder to the second widget
                    element.find('.form-control').last().attr('placeholder', newVal);
                    break;
                case 'groupby':
                    if (scope.widgetid) {
                        updateGroupBy();
                        if (newVal && newVal !== '') {
                            if (newVal === WIDGET_CONSTANTS.EVENTS.JAVASCRIPT) {
                                wdgtProperties.groupby.isGroupBy = true;
                            } else {
                                wdgtProperties.groupby.isGroupBy = false;
                            }
                        }
                    }
                    setFormField();
                    break;
                case 'match':
                    if (scope.widgetid) {
                        wdgtProperties.dateformat.show = _.includes(['day', 'hour', 'month', 'week'], scope.match);
                    }
                    setFormField();
                    break;
                case 'disabled':
                case 'readonly':
                case 'required':
                case 'validationmessage':
                case 'hint':
                    setFormField();
                    break;
                case 'active':
                    if (scope.widgetid && newVal) {
                        if (scope.widget === 'password' || scope.widget === 'text') {
                            FormWidgetUtils.setPropertiesTextWidget(wdgtProperties, scope.inputtype);
                        } else if (isDataSetWidgets[scope.widget]) {
                            updatePropertyPanelOptions(scope);
                            updateGroupBy();
                        }
                    }
                    break;
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
            function getWidgetProps(widgetType, fieldType) {
                var widgetProps,
                    baseProperties,
                    extendedProperties,
                    textWidgets = ['text', 'password'],
                    setDefaultValueProps = function () {
                        var defaultProp;
                        /*Use default value instead of datavalue for fields*/
                        if (widgetType === 'radioset') {
                            defaultProp = 'selectedvalue';
                        } else if (widgetType === 'checkboxset') {
                            defaultProp = 'selectedvalues';
                        } else {
                            defaultProp = 'datavalue';
                        }
                        if (widgetProps[defaultProp]) {
                            widgetProps.defaultvalue = WM.copy(widgetProps[defaultProp]);
                            widgetProps.defaultvalue.bindable = 'in-bound';
                            widgetProps[defaultProp].show = false;
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
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors'];
                    break;
                case 'slider':
                    baseProperties      = 'wm.slider';
                    extendedProperties  = ['wm.base', 'wm.base.events.change'];
                    break;
                case 'colorpicker':
                    baseProperties      = 'wm.colorpicker';
                    extendedProperties  = ['wm.base', 'wm.base.events', 'wm.base.events.focus', 'wm.base.events.change'];
                    break;
                case 'chips':
                    baseProperties      = 'wm.chips';
                    extendedProperties  = ['wm.base', 'wm.base.editors.dataseteditors'];
                    break;
                case 'richtext':
                    baseProperties      = 'wm.richtexteditor';
                    extendedProperties  = ['wm.base'];
                    break;
                case 'select':
                    baseProperties      = 'wm.select';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.editors.dataseteditors', 'wm.base.events.keyboard'];
                    break;
                case 'checkboxset':
                    baseProperties      = 'wm.checkboxset';
                    extendedProperties  = ['wm.base', 'wm.base.editors.dataseteditors'];
                    break;
                case 'radioset':
                    baseProperties      = 'wm.radioset';
                    extendedProperties  = ['wm.base', 'wm.base.editors.dataseteditors'];
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
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors'];
                    break;
                case 'currency':
                    baseProperties      = 'wm.currency';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors'];
                    break;
                case 'number':
                    baseProperties      = 'wm.number';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors'];
                    break;
                case 'typeahead':
                case 'autocomplete':
                    baseProperties      = 'wm.search';
                    extendedProperties  = ['wm.base', 'wm.base.editors.abstracteditors'];
                    break;
                default:
                    baseProperties      = 'wm.text';
                    extendedProperties  = ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard'];
                    break;
                }
                widgetProps                   = PropertiesFactory.getPropertiesOf(baseProperties, extendedProperties);
                widgetProps.displayname       =  {'type': "string", 'show': true, 'bindable': "in-bound"};
                widgetProps.widget            = {'type': 'label', 'show': true, 'class': "form-control-static"};

                if (_.includes(textWidgets, widgetType)) {
                    /*In form and filter, type conflicts with data type. Change the type to input type.*/
                    widgetProps.inputtype = WM.copy(widgetProps.type);
                    delete widgetProps.type;
                } else if (isDataSetWidgets[widgetType]) {
                    widgetProps.dataset.value   = '';
                    widgetProps.datafield.value = '';
                    if (widgetType === 'autocomplete') {
                        widgetProps.type.show = false;
                    }
                    widgetProps.limit = {'type': 'number', 'show': true};

                    if (fieldType === 'wm-form-field' && widgetProps.datavalue) {
                        widgetProps.datavalue.getTypeFrom = 'expr:getDataValueType()';
                    }
                } else if (widgetType === 'upload') {
                    widgetProps = WM.extend(widgetProps, {
                        'readonly'   : {'type': 'boolean', 'bindable': 'in-bound', 'show': true},
                        'filetype'   : {'type': 'data-list', 'options': ['image', 'audio', 'video'], 'show': true},
                        'extensions' : {'type': 'string', 'show': true},
                        'onTap'      : {'show': false}
                    });
                } else if (widgetType === 'toggle') {
                    widgetProps.caption.show = false;
                }

                setDefaultValueProps();

                if (fieldType === 'wm-form-field') {
                    widgetProps.validationmessage      =  {'type': "string", 'bindable': "in-bound"};
                    widgetProps.validationmessage.show = widgetProps.required && widgetProps.required.show;
                } else if (fieldType === 'wm-filter-field') {
                    widgetProps.maxplaceholder =  {'type': "string", 'bindable': "in-bound", "show": true};
                    widgetProps.maxdefaultvalue =  Utils.getClonedObject(widgetProps.defaultvalue) || {};
                }

                /*No support for scopedatavalue and scopedataset for fields yet*/
                if (widgetProps.scopedatavalue) {
                    delete widgetProps.scopedatavalue;
                }
                if (widgetProps.scopedataset) {
                    delete widgetProps.scopedataset;
                }
                //Ignore the default getter setter on in out bound properties as it is set explicitly for form field
                _.forEach(widgetProps, function (prop) {
                   if (prop.bindable === 'in-out-bound' || prop.bindable === 'out-bound') {
                       _.set(prop, 'ignoreGetterSetters', true);
                   }
                });
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
                if (!attrs.maxplaceholder && attrs.maxPlaceholder) {
                    changeAttr('maxplaceholder', 'maxPlaceholder');
                }
                if (!attrs.maxchars && attrs.maxvalue && (attrs.inputtype === 'text' || attrs.inputtype === 'password' || attrs.widget === 'textarea')) {
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
                scope.widgetProps = getWidgetProps(attrs.widget, fieldType);
                //Apply app defaults for date time widgets
                if (scope.widget === 'date') {
                    attrs.appDefaults= '{"datepattern": "dateFormat"}';
                } else if (scope.widget === 'time') {
                    attrs.appDefaults= '{"timepattern": "timeFormat"}';
                } else if (scope.widget === 'datetime' || scope.widget === 'timestamp') {
                    attrs.appDefaults= '{"datepattern": "dateTimeFormat"}';
                }
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
                // Removing first occurance of "bind:"
                // Removing curly brackets and get each expression.
                classExpression = classExpression.substring(0, 5) === 'bind:' ? classExpression.substring(5) : classExpression;
                conditionalClasses = classExpression.replace('bind:').substring(1, classExpression.length - 1).split(',');
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
                return ngClassExpression.length ? 'bind:' + ngClassExpression : ngClassExpression;
            }

            function setColumnCustomExpression(column) {
                var widgetNgClassesExpression = generateNgClassExpression(column.widgetConfig.ngClasses);
                switch (column.widgetType) {
                case 'image':
                    if (column.type === 'blob') {
                        column.customExpression = '<wm-picture show="' + column.widgetConfig.src + '!= null" width="48px" picturesource="' + column.widgetConfig.src + '" class="" conditionalclass="" conditionalstyle=""></wm-picture>';
                    } else {
                        column.customExpression = '<wm-picture picturesource="' + column.widgetConfig.src + '" hint="' + column.widgetConfig.src + '"' +
                            ' class="' + column.widgetConfig.class + '" conditionalclass="' + widgetNgClassesExpression + '" conditionalstyle="' + column.widgetConfig.conditionalstyle + '"></wm-picture>';
                    }
                    break;
                case 'button':
                    column.customExpression = '<wm-button caption="' + column.widgetConfig.title + '" show="true" class="' + column.widgetConfig.class + '" iconclass="' +
                        column.widgetConfig.icon + '" on-click="' + column.widgetConfig.action + '" conditionalclass="' + widgetNgClassesExpression + '" conditionalstyle="' + column.widgetConfig.conditionalstyle + '"></wm-button>';
                    break;
                case 'checkbox':
                    column.customExpression = '<wm-checkbox datavalue="' + column.widgetConfig.model + '" disabled="' + column.widgetConfig.disabled + '" ' +
                        'class = "' + column.widgetConfig.class + '" conditionalclass="' + widgetNgClassesExpression + '" conditionalstyle="' + column.widgetConfig.conditionalstyle + '"></wm-checkbox>';
                    break;
                case 'anchor':
                    if (column.type === 'blob') {
                        column.customExpression = '<wm-anchor caption="" hyperlink="' + column.widgetConfig.hyperlink + '" target="_blank" iconclass="wm-icon wm-icon24 wi wi-file" class="col-md-9" show="' + column.widgetConfig.hyperlink + '!= null"></wm-anchor>';
                    } else {
                        column.customExpression = '<wm-anchor caption="' + column.widgetConfig.title + '" hyperlink="' + column.widgetConfig.hyperlink + '" ' +
                            'class = "' + column.widgetConfig.class + '" conditionalclass="' + widgetNgClassesExpression + '" conditionalstyle="' + column.widgetConfig.conditionalstyle + '"></wm-anchor>';
                    }
                    break;
                case 'label':
                    column.customExpression = '<wm-label caption="' + column.widgetConfig.title + '" ' +
                        'class = "' + column.widgetConfig.class + '" conditionalclass="' + widgetNgClassesExpression + '" condtionalstyle="' + column.widgetConfig.conditionalstyle + '"></wm-label>';
                    break;
                case 'icon':
                    column.customExpression = '<wm-icon caption="' + column.widgetConfig.title + '" iconclass="' + column.widgetConfig.icon + '" iconposition="' + column.widgetConfig.iconposition + '" ' +
                        'class = "' + column.widgetConfig.class + '" conditionalclass="' + widgetNgClassesExpression + '" conditionalstyle="' + column.widgetConfig.conditionalstyle + '"></wm-icon>';
                    break;
                default:
                    if (column.type === 'blob') {
                        column.customExpression = '<wm-anchor caption="" hyperlink="' + column.widgetConfig.src + '" target="_blank" iconclass="wm-icon wm-icon24 wi wi-file" class="col-md-9" show="' + column.widgetConfig.src +  '!= null"></wm-anchor>';
                    }
                }
            }

            function setDefaultWidgetConfig(column) {
                var widgetType = column.widgetType,
                    field = column.field,
                    val = column.widgetType === 'button' ? "bind:row.getProperty('" + field + "') || 'Button'" : "bind:row.getProperty('" + field + "')",
                    widgetNgClasses = [Utils.getClonedObject(defaultNgClassesConfig)];
                /* Not storing widget config, it is only on for UI display. Only customExpression will be saved. */
                column.widgetConfig = {};
                switch (widgetType) {
                case 'image':
                    column.widgetConfig = {
                        'src': val,
                        'class': '',
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': ''
                    };
                    break;
                case 'button':
                    column.widgetConfig = {
                        'icon': '',
                        'action': '',
                        'title': val,
                        'class': 'btn-sm btn-primary',
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': ''
                    };
                    break;
                case 'checkbox':
                    column.widgetConfig = {
                        'model': val,
                        'disabled': 'bind:colDef.readonly',
                        'class': '',
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': ''
                    };
                    break;
                case 'anchor':
                    column.widgetConfig = {
                        'title'    : val,
                        'hyperlink': val,
                        'class'    : '',
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': ''
                    };
                    break;
                case 'label':
                    column.widgetConfig = {
                        'title'    : val,
                        'class'    : '',
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': ''
                    };
                    break;
                case 'icon':
                    column.widgetConfig = {
                        'title'        : val,
                        'class'        : '',
                        'icon'         : 'wi wi-star-border',
                        'iconposition' : 'left',
                        'ngClasses'    : widgetNgClasses,
                        'conditionalstyle': ''
                    };
                    break;
                default:
                    column.widgetConfig = {
                        'src': val,
                        'class': '',
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': ''
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
                    widgetNgStyle,
                    widgetSrc,
                    widgetModel,
                    widgetHyperlink,
                    el;
                column.widgetConfig = {};
                /* If custom expression does not contain any HTML tags, append span. */
                if (!Utils.isValidHtml(customExpression)) {
                    customExpression = '<span>' + customExpression + '</span>';
                }
                el = WM.element(customExpression);
                widgetClass = el.attr('widget-class') || el.attr('class');
                widgetNgClasses = parseNgClasses(el.attr('conditionalclass'));
                widgetNgStyle = el.attr('conditionalstyle');
                switch (widgetType) {
                case 'image':
                    widgetSrc = el.attr('data-ng-src') || el.attr('picturesource');
                    column.widgetConfig = {
                        'src': widgetSrc,
                        'class': widgetClass,
                        'ngClasses': widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
                    };
                    break;
                case 'button':
                    widgetIcon   = el.attr('iconclass') || el.attr('iconname');
                    widgetTitle  = el.attr('caption');
                    widgetAction = el.attr('on-click');
                    column.widgetConfig = {
                        'icon'      : widgetIcon,
                        'action'    : widgetAction,
                        'title'     : widgetTitle,
                        'class'     : widgetClass,
                        'ngClasses' : widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
                    };
                    break;
                case 'checkbox':
                    widgetModel    = el.attr('ng-model') || el.attr('datavalue');
                    widgetDisabled = el.attr('ng-disabled') || el.get(0).getAttribute('disabled');
                    column.widgetConfig = {
                        'model'     : widgetModel,
                        'disabled'  : widgetDisabled,
                        'class'     : widgetClass,
                        'ngClasses' : widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
                    };
                    break;
                case 'anchor':
                    widgetTitle     = el.attr('caption');
                    widgetHyperlink = el.attr('hyperlink');
                    column.widgetConfig = {
                        'title'     : widgetTitle,
                        'hyperlink' : widgetHyperlink,
                        'class'     : widgetClass,
                        'ngClasses' : widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
                    };
                    break;
                case 'label':
                    widgetTitle  = el.attr('caption');
                    column.widgetConfig = {
                        'title'     : widgetTitle,
                        'class'     : widgetClass,
                        'ngClasses' : widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
                    };
                    break;
                case 'icon':
                    widgetTitle  = el.attr('caption');
                    widgetIcon   = el.attr('iconclass');
                    column.widgetConfig = {
                        'title'        : widgetTitle,
                        'icon'         : widgetIcon,
                        'class'        : widgetClass,
                        'iconposition' : el.attr('iconposition') || 'left',
                        'ngClasses'    : widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
                    };
                    break;
                default:
                    column.widgetConfig = {
                        'src'       : '',
                        'class'     : widgetClass,
                        'ngClasses' : widgetNgClasses,
                        'conditionalstyle': widgetNgStyle
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
            function fetchPropertiesMapColumns(propertiesMap, bindDataSet) {
                var columns = {}, columnName, data = {}, primaryKey, typeUtils = Utils.getService('TypeUtils');
                /* iterated trough the propertiesMap columns of all levels and build object with columns having required configuration*/
                _.forEach(propertiesMap.columns, function (val) {
                    /* if the object is nested type repeat the above process for that nested object through recursively */
                    if (val.isRelated) {
                        if (val.isList) {
                            return;
                        }
                        data.relatedData = data.relatedData || {};
                        var relatedTableColumns = typeUtils.getFieldsForExpr(bindDataSet + '.' + val.fieldName),
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
                            columnNameTypeMap: columnNameTypeMap,
                            columnObjs: val.columns
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
                    columns[columnName].period = val.period;
                });
                return {
                    'columns'     : columns,
                    'relatedData' : data.relatedData
                };
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getBoundWidgetDetails
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Returns the widget details - widget name, referenceWidget for the inner widgets
             *
             * @param {string} bindDataSet bound dataset of the widget
             * @param {object} WidgetScopes Widget scopes
             *
             */
            function getBoundWidgetDetails(bindDataSet, WidgetScopes) {
                var widgetName,
                    relatedFieldName,
                    bindDataSetSplit,
                    referenceWidget,
                    widgetRegEx = /Widgets./g,
                    isBoundToSelectedItemSubset = bindDataSet.indexOf('selecteditem.') !== -1;
                //Get the reference widget name. As widget can be inner widget (like Widgets.tab.Widgets.grid), find the last inner widget
                while (widgetRegEx.exec(bindDataSet) !== null) {
                    bindDataSetSplit =  _.split(bindDataSet.substr(widgetRegEx.lastIndex, bindDataSet.length), '.');
                    widgetName       = _.head(bindDataSetSplit);
                    relatedFieldName = isBoundToSelectedItemSubset && _.last(bindDataSetSplit);
                    referenceWidget  = _.get(WidgetScopes, widgetName);
                    WidgetScopes     = referenceWidget && referenceWidget.Widgets;
                }
                return {
                    'widgetName'       : widgetName,
                    'relatedFieldName' : relatedFieldName,
                    'referenceWidget'  : referenceWidget,
                    'WidgetScopes'     : WidgetScopes
                }
            }

            function fetchReferenceDetails($scope, elScope) {
                var referenceBindDataSet,
                    referenceVariableName,
                    relatedFieldType,
                    fields,
                    details,
                    referenceVariable,
                    bindDataSet      = $scope.binddataset,
                    WidgetScopes     = elScope ? elScope.Widgets : $scope.Widgets,
                    widgetDetails    = getBoundWidgetDetails(bindDataSet, WidgetScopes),
                    referenceWidget  = widgetDetails.referenceWidget,
                    relatedFieldName = widgetDetails.relatedFieldName;
                if (referenceWidget) {
                    referenceBindDataSet = referenceWidget.binddataset;
                    /*the binddataset comes as bind:Variables.VariableName.dataset.someOther*/
                    referenceVariableName = referenceBindDataSet.replace('bind:Variables.', '');
                    referenceVariableName = referenceVariableName.substr(0, referenceVariableName.indexOf('.'));

                    referenceVariable = Variables.getVariableByName(referenceVariableName);
                    fields = (referenceVariable !== null) && $rs.dataTypes &&
                        $rs.dataTypes[referenceVariable.package || referenceVariable.type].fields;
                }
                details = {
                    'referenceVariableName' : referenceVariableName,
                    'referenceWidget'       : referenceWidget,
                    'referenceVariable'     : referenceVariable,
                    'relatedFieldName'      : relatedFieldName
                };
                /* If binddataset is of the format: bind:Widgets.widgetName.selecteditem.something,
                 * i.e. widget is bound to a subset of selected item, get type of that subset.*/
                if (relatedFieldName && fields) {
                    relatedFieldType         = fields[relatedFieldName].type;
                    details.relatedFieldType = relatedFieldType;
                } else {
                    /* When binddataset is of the format: bind:Widgets.widgetName.selecteditem */
                    details.fields = fields;
                }
                return details;
            }
            function fetchDynamicData($scope, elScope, success, error) {
                var reference,
                    referenceVariableKey,
                    watchSelectedItem,
                    referenceVariable;
                /*Invoke the function to fetch the reference variable details when a grid2 is bound to another grid1 and grid1 is bound to a variable.*/
                reference         = fetchReferenceDetails($scope, elScope);
                referenceVariable = Variables.getVariableByName(reference.referenceVariableName);
                /*Check if a watch is not registered on selectedItem or if the relatedField is a one-to-many relation because this field value will directly be available in the data*/
                if ($scope.selectedItemWatched || !referenceVariable || !referenceVariable.isRelatedFieldMany(reference.relatedFieldName)) {
                    return;
                }
                watchSelectedItem = reference.referenceWidget.$watch('selecteditem', function (newVal, oldVal) {

                    $scope.selectedItemWatched = true;

                    /*Check for sanity of newVal.*/
                    /*Check for sanity of newVal.*/
                    if (newVal && !WM.equals(newVal, oldVal)) {
                        /*Check if "referenceVariableKey" has already been computed.*/
                        if (!referenceVariableKey && referenceVariable && referenceVariable.category === 'wm.LiveVariable') {
                            /*Invoke the function to get the primary key.*/
                            referenceVariableKey = referenceVariable.getPrimaryKey();

                            /*If the there is a single primary key, fetch the first element of the array.*/
                            if (referenceVariableKey.length === 1) {
                                referenceVariableKey = referenceVariableKey[0];
                            }

                            /*De-register the watch on selected item.*/
                            watchSelectedItem();

                            /*Register a watch on the primary key field of the selected item.*/
                            reference.referenceWidget.$watch('selecteditem.' + referenceVariableKey, function (newVal) {
                                /*Check for sanity.*/
                                if (newVal) {
                                    /*Invoke the function to update the related data of the variable for the specified relatedFieldName.*/
                                    referenceVariable.updateRelatedData({
                                        'id': reference.referenceWidget.selecteditem[referenceVariableKey],
                                        'relatedFieldName': reference.relatedFieldName
                                    }, function (data) {
                                        /*Check for sanity of data.*/
                                        if (WM.isDefined(data)) {
                                            Utils.triggerFn(success, data);
                                        }
                                    }, function (err) {
                                        Utils.triggerFn(error, err);
                                    });
                                } else {
                                    Utils.triggerFn(success, {});
                                }
                            });
                        }
                    } else {
                        Utils.triggerFn(success, undefined);
                    }
                }, true);
            }
            function getRowOperationsColumn() {
                return {
                    'field'         : 'rowOperations',
                    'type'          : 'custom',
                    'displayName'   : 'Actions',
                    'width'         : '120px',
                    'readonly'      : true,
                    'sortable'      : false,
                    'searchable'    : false,
                    'resizable'     : false,
                    'selectable'    : false,
                    'show'          : true,
                    'operations'    : [],
                    'opConfig'      : {},
                    'pcDisplay'     : true,
                    'mobileDisplay' : true,
                    'include'       : true,
                    'isRowOperation': true
                };
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getDistinctFieldProperties
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Returns the properties required for dataset widgets
             *
             * @param {object} variable variable for the widget
             * @param {object} formField definition of the column/ field
             *
             */
            function getDistinctFieldProperties(variable, formField) {
                var props = {},
                    fieldColumn;
                if (formField.isRelated) {
                    props.tableName     = formField.lookupType;
                    fieldColumn         = formField.lookupField;
                    props.distinctField = fieldColumn;
                    props.aliasColumn   = fieldColumn.replace('.', '$'); //For related fields, In response . is replaced by $
                    props.filterExpr    = formField.filterexpressions ? (_.isObject(formField.filterexpressions) ? formField.filterexpressions : JSON.parse(formField.filterexpressions)) : {};
                } else {
                    props.tableName     = variable.propertiesMap.entityName;
                    fieldColumn         = formField.field || formField.key;
                    props.distinctField = fieldColumn;
                    props.aliasColumn   = fieldColumn;
                }
                return props;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getDistinctValues
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Returns the distinct values for a field
             *
             * @param {object} formField definition of the column/ field
             * @param {string} widget widget property on the field
             * @param {object} variable variable for the widget
             * @param {function} callBack Function to be executed after fetching results
             *
             */
            function getDistinctValues(formField, widget, variable, callBack) {
                var props,
                    dataSetWidgetTypes = Utils.getDataSetWidgets();

                if (dataSetWidgetTypes[formField[widget]] && (!formField.isDataSetBound || widget === 'filterwidget')) {
                    props = getDistinctFieldProperties(variable, formField);

                    variable.getDistinctDataByFields({
                        'fields'        : props.distinctField,
                        'entityName'    : props.tableName,
                        'pagesize'      : formField.limit,
                        'filterExpr'    : formField.filterexpressions ? JSON.parse(formField.filterexpressions) : {}
                    }, function (data) {
                        callBack(formField, data, props.aliasColumn);
                    });
                }
            }
            //Method to set the header config of the data table
            function setHeaderConfig(headerConfig, config, field) {
                _.forEach(headerConfig, function (cols) {
                    if (cols.isGroup) {
                        if (cols.field === field) {
                            cols.columns.push(config);
                        } else {
                            setHeaderConfig(cols.columns, config, field);
                        }
                    }
                });
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#setHeaderConfigForTable
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Sets the header config for data table
             *
             * @param {object} headerConfig current header config
             * @param {object} config current column/ group config
             * @param {object} $parentEl parent element
             *
             */
            function setHeaderConfigForTable(headerConfig, config, $parentEl) {
                if (_.isEmpty($parentEl)) {
                    headerConfig.push(config);
                } else {
                    setHeaderConfig(headerConfig, config, $parentEl.attr('name'));
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#setFormWidgetsValues
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Set the values of the widgets inside the form/ liveform (other than form fields) in form data
             *
             * @param {object} $el current header config
             * @param {object} dataObject current column/ group config
             *
             */
            function setFormWidgetsValues($s, $el, dataObject) {
                var parentScope;
                if (!$el) {
                    return;
                }
                $el.find('.form-elements [role="input"]').each(function () {
                    var $inputEl = WM.element(this),
                        fieldKey,
                        fieldTarget,
                        fieldName,
                        val;
                    //Get the values of the widgets (other than form fields and composite widgets)
                    if (_.isEmpty($inputEl.closest('[data-role="form-field"]')) && !$inputEl.hasClass('app-composite-widget')) {
                        fieldKey = $inputEl.attr('key') || $inputEl.attr('name');
                        fieldTarget = _.split(fieldKey, '.');
                        fieldName = fieldTarget[0],
                        val      = $inputEl.isolateScope() && $inputEl.isolateScope().datavalue;
                        if (val && !_.has(dataObject, fieldKey)) {
                            if (fieldTarget.length === 1) {
                                dataObject[fieldName] = val;
                            } else {
                                dataObject[fieldName]                 = dataObject[fieldName] || {};
                                dataObject[fieldName][fieldTarget[1]] = val;
                            }
                        }
                    }
                });
                //Form fields wont't contain grid widgets get those using attribute and add to form data
                $el.find('[data-identifier="table"]').each(function () {
                    var formWidget = WM.element(this).isolateScope();
                    _.set(dataObject, formWidget.key || formWidget.name, formWidget.datavalue || formWidget.dataset);
                });

                if ($s._widgettype !== 'wm-liveform') {
                    $s.dataoutput = dataObject;
                    return;
                }

                //Form fields wont't contain form widgets get those using attribute and add to form data
                $el.find('[data-identifier="liveform"]')
                    .filter(function () { //Check for the first level inner form
                        return WM.element(this).parent().closest('[data-identifier="liveform"]').attr('name') === $s.name;
                    })
                    .each(function () {
                        var $formEle   = WM.element(this),
                            formWidget = $formEle.isolateScope(),
                            formKey    = $formEle.attr('key') || formWidget.name,
                            dataOutput;
                        //If is list is true, push the new data object, else assign the form data
                        if ($formEle.attr('is-list') === 'true') {
                            dataOutput = _.isArray(_.get(dataObject, formKey)) ? _.get(dataObject, formKey) : [];
                            _.set(dataObject, formKey, dataOutput.concat(formWidget.dataoutput));
                        } else {
                            _.set(dataObject, formKey, formWidget.dataoutput);
                        }
                    });

                $s.dataoutput = dataObject;

                //If parent form is present, update the dataoutput of the parent form
                parentScope = $el.parent().closest('[data-identifier="liveform"]').isolateScope();
                if (parentScope) {
                    parentScope.constructDataObject();
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getFormWidgets
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * function to get widgets on form/filter isolate scope
             *
             * @param {object} element from which widgets needs to be retrieved
             */
            function getFormFilterWidgets(element, nameAttr) {
                var wid = {};
                element.find('[init-widget]').not('[name*="_formWidget"]').each(function () {
                    var $target = WM.element(this),
                        _is;
                    if ($target.isolateScope) {
                        _is = $target.isolateScope();
                        //If name attribute is passed, get the value from attribute
                        if (nameAttr) {
                            wid[$target.attr(nameAttr)] = _is;
                        } else if (_is.name) {
                            wid[_is.name] = _is;
                        }
                    }
                });

                return wid;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.populateFormWidgets
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * function to set form widgets scopes on form/filter
             *
             * @param {object} $scope $scope of the parent widget
             * @param {string} prop Property to be set on scope
             * @param {object} fieldScope isolate scope of the form field
             */
            function populateFormWidgets($scope, prop, fieldScope) {
                if (fieldScope.name && !_.endsWith(fieldScope.name, '_formWidget')) {
                    $scope[prop] = $scope[prop] || {};
                    $scope[prop][fieldScope.name] = fieldScope;
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getViewModeWidgets
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * function to get view mode widgets for grid
             */
            function getViewModeWidgets() {
                return ['image', 'button', 'checkbox', 'label', 'anchor', 'icon'];
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.fetchRelatedFieldData
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * This function fetches the data for the related field in live form/ grid
             *
             * @param {object} columnDef field definition
             * @param {string} relatedField related field name
             * @param {string} datafield Datafield to be set on widget
             * @param {string} widget Type of the widget
             * @param {object} elScope element scope
             * @param {object} parentScope live form// grid scope
             */
            function fetchRelatedFieldData(columnDef, relatedField, datafield, widget, elScope, parentScope) {
                var boundVariable = elScope.Variables[parentScope.variableName || Utils.getVariableName(parentScope)],
                    primaryKeys,
                    displayField;
                if (!boundVariable) {
                    return;
                }
                primaryKeys         = boundVariable.getRelatedTablePrimaryKeys(relatedField);
                columnDef.datafield = datafield;
                if (CONSTANTS.isRunMode) {
                    columnDef._primaryKey = _.isEmpty(primaryKeys) ? undefined : primaryKeys[0];
                    columnDef.compareby = primaryKeys && primaryKeys.join(',');
                }

                displayField = datafield === ALLFIELDS ? undefined : datafield;
                columnDef.displayfield = displayField = (columnDef.displayfield || displayField || columnDef._primaryKey);
                //For autocomplete widget, set the dataset and  related field. Autocomplete widget will make the call to get related data
                if (isSearchWidgetType(widget)) {
                    columnDef.dataoptions  = {'relatedField': relatedField, 'filterExpr': columnDef.filterexpressions ? columnDef.filterexpressions : {}};
                    columnDef.dataset      = parentScope.binddataset;
                    columnDef.searchkey    = columnDef.searchkey || displayField;
                    columnDef.displaylabel = columnDef.displayfield = (columnDef.displaylabel || displayField);
                } else {
                    var callbackFn = function(filterexpressions) {
                        columnDef.filterexpressions = filterexpressions;
                        boundVariable.getRelatedTableData(relatedField, {
                            'pagesize': columnDef.limit,
                            'orderBy': columnDef.orderby ? _.replace(columnDef.orderby, /:/g, ' ') : '',
                            'filterFields': {},
                            'filterExpr': columnDef.filterexpressions ? columnDef.filterexpressions : {}
                        }, function (response) {
                            columnDef.dataset       = response;
                            columnDef.displayfield  = columnDef.displayfield || _.head(_.keys(_.get(response, '[0]')));
                        });

                    };
                    interpolateBindExpressions(parentScope, columnDef.filterexpressions, callbackFn);
                }
            }

            /**
             * utility method used for forming the sql query
             * @param group
             * @param i
             * @returns {string}
             */
            function getMatchModeString(group, i) {
                var matchModeMsgs = getMatchModeMsgs($rs.appLocale);

                var matchMode = matchModeMsgs[group.rules[i].matchMode].replace(/\s/ig, "_").toUpperCase(), matchModeVal;
                switch (matchMode) {
                    case 'IN':
                    case 'NOT_IN':
                        matchModeVal = matchMode + " (" + group.rules[i].value + ")";
                        break;
                    case 'BETWEEN':
                        matchModeVal = matchMode + " " + group.rules[i].value + " AND " + (group.rules[i].secondvalue ? group.rules[i].secondvalue : "");
                        break;
                    default:
                        matchModeVal = matchMode + " " + group.rules[i].value;
                }
                return matchModeVal;
            }

            /**
             * recursively traverses the filterexpressions object and forms the sql query
             * @param group filterexpressions
             * @returns {string} final sql query
             */
            function compute(group) {
                if (!group) return "";
                if(group.rules) {
                    for (var str = "(", i = 0; i < group.rules.length; i++) {
                        i > 0 && (str += " <strong>" + group.condition + "</strong> ");
                        str += WM.isArray(group.rules[i].rules) ? compute(group.rules[i]) : group.rules[i].target + " " + getMatchModeString(group, i);
                    }
                    return str + ")";
                }
                return "";
            }

            /**
             * used in liveform, livefilter, datatables(inline, quickedit) to show the saved query
             */
            function getQuery(filterExpressions) {
                return compute(filterExpressions ? (_.isObject(filterExpressions) ? filterExpressions : JSON.parse(filterExpressions)) : {});
            }

            /**
             * used to interpolate the bind expression for keys in the query builder
             * @param scope where we find the variable obj
             * @param filterexpressions - obj containing all the rule objs
             * @param callbackFn - function to be called with the new replaced values if any in the filterexpressions object
             */
            function interpolateBindExpressions(scope, filterexpressions, callbackFn) {
                var debouncedFn = _.debounce(function () {
                    if (_.isFunction(callbackFn)) {
                        callbackFn(filterexpressions);
                    }
                }, 300);

                var onSuccess = function (filterExpressions, newVal) {
                    filterexpressions = JSON.stringify(filterExpressions);
                    debouncedFn();
                };

                var onreadyFunction = function() {
                    /**
                     * calling the debounced function first for the case where if there is any filterexpression without the bindedvariables.
                     * without this it will never be called. processFilterExpBindNode will be called only for the binded variable expressions.
                     */
                    debouncedFn();
                    var filterExpressions = filterexpressions ? (_.isObject(filterexpressions) ? filterexpressions : JSON.parse(filterexpressions)) : {};
                    Variables.processFilterExpBindNode(scope, filterExpressions, onSuccess);
                };

                if ($rs._pageReady) {
                    onreadyFunction();
                } else {
                    $rs.$on('page-ready', function (e, pageName) {
                        onreadyFunction();
                    });
                }
            }

            //Set the data field properties on dataset widgets
            function setDataFields(formField, widget, dataOptions) {
                if (isSearchWidgetType(formField[widget])) { //For search widget, set search key and display label
                    formField.datafield    = dataOptions.aliasColumn || LIVE_CONSTANTS.LABEL_KEY;
                    formField.searchkey    = dataOptions.distinctField || LIVE_CONSTANTS.LABEL_KEY;
                    formField.displaylabel = formField.displayfield = (dataOptions.aliasColumn || LIVE_CONSTANTS.LABEL_VALUE);
                } else {
                    formField.datafield    = LIVE_CONSTANTS.LABEL_KEY;
                    formField.displayfield = LIVE_CONSTANTS.LABEL_VALUE;
                }
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#setFieldDataSet
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to set the dataSet on the fields
             *
             * @param {object} formField definition of the column/ field
             * @param {object} data data returned from the server
             * @param {string} aliasColumn column field name
             * @param {string} widget widget property on the field
             * @param {boolean} isEnableEmptyFilter is null or empty values allowed on filter
             *
             */
            function setFieldDataSet(formField, data, aliasColumn, widget, isEnableEmptyFilter) {
                var emptySupportWidgets = ['select', 'radioset'],
                    emptyOption         = {};
                formField.dataset = [];
                if (isEnableEmptyFilter && _.includes(emptySupportWidgets, formField[widget]) && !formField.isRange && !formField.multiple) {
                    //If empty option is selected, push an empty object in to dataSet
                    emptyOption[LIVE_CONSTANTS.LABEL_KEY]   = LIVE_CONSTANTS.EMPTY_KEY;
                    emptyOption[LIVE_CONSTANTS.LABEL_VALUE] = LIVE_CONSTANTS.EMPTY_VALUE;
                    formField.dataset.push(emptyOption);
                }
                _.each(data.content, function (key) {
                    var value  = key[aliasColumn],
                        option = {};
                    if (value !== null && value !== '') {
                        option[LIVE_CONSTANTS.LABEL_KEY]   = value;
                        option[LIVE_CONSTANTS.LABEL_VALUE] = value;
                        formField.dataset.push(option);
                    }
                });
                setDataFields(formField, widget, aliasColumn);
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#getDistinctValuesForField
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to fetch the distinct values for a field
             *
             * @param {object} scope scope of the widget
             * @param {object} formFields definitions of the column/ field
             * @param {string} widget widget property on the field
             * @param {boolean} isEnableEmptyFilter is null or empty values allowed on filter
             *
             */
            function getDistinctValuesForField(scope, formField, widget, isEnableEmptyFilter) {
                var variable = scope.Variables[scope.variableName || Utils.getVariableName(scope)];
                if (!variable || variable.category !== 'wm.LiveVariable' || scope.widgetid || !formField || formField.isDataSetBound) {
                    return;
                }
                //For autocomplete widget, widget will fetch the data. Set properties on the widget itself. Other widgets, fetch the data.
                if (isSearchWidgetType(formField[widget]) && _.includes(scope.binddataset, 'bind:Variables.')) {
                    formField.dataoptions = getDistinctFieldProperties(variable, formField);
                    setDataFields(formField, widget, formField.dataoptions);
                    formField.dataset     = scope.binddataset;
                } else {
                    var callbackFn = function(filterexpressions) {
                        formField.filterexpressions = filterexpressions;
                        getDistinctValues(formField, widget, variable, function (formField, data, aliasColumn) {
                            setFieldDataSet(formField, data, aliasColumn, widget, isEnableEmptyFilter);
                        });
                    };
                    interpolateBindExpressions(scope, formField.filterexpressions, callbackFn);
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.LiveWidgetUtils#fetchDistinctValues
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to fetch the distinct values for a field
             *
             * @param {object} scope scope of the widget
             * @param {object} formFields definitions of the column/ field
             * @param {string} widget widget property on the field
             * @param {boolean} isEnableEmptyFilter is null or empty values allowed on filter
             *
             */
            function fetchDistinctValues(scope, formFields, widget, isEnableEmptyFilter) {
                if (scope.widgetid || _.isEmpty(scope[formFields])) {
                    return;
                }
                _.forEach(scope[formFields], function (formField) {
                    getDistinctValuesForField(scope, formField, widget, isEnableEmptyFilter)
                });
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getEditModeWidget
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * This function returns the default widget for grid
             *
             * @param {object} colDef field definition
             */
            function getEditModeWidget(colDef) {
                var fieldTypeWidgetTypeMap = getFieldTypeWidgetTypesMap();
                if (colDef.relatedEntityName && colDef.primaryKey) {
                    return 'select';
                }
                return (fieldTypeWidgetTypeMap[colDef.type] && fieldTypeWidgetTypeMap[colDef.type][0]) || 'text';
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getEnableEmptyFilter
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * This function checks if enable filter options is set on live filter
             *
             * @param {object} enableemptyfilter empty filter options
             */
            function getEnableEmptyFilter(enableemptyfilter) {
                return enableemptyfilter && _.intersection(enableemptyfilter.split(','), LIVE_CONSTANTS.NULL_EMPTY).length > 0;
            }

            //Loop through the form fields and set touched state as touched
            function setTouchedState(ngForm) {
                if (ngForm.$valid) { //If form is valid, return here
                    return;
                }
                _.forEach(ngForm, function (field, key) {
                    var elVisible = true;
                    if (_.isObject(field)) {
                        //Fields has $modelValue. Check for this property and call $setTouched
                        if (_.has(field, '$modelValue') && field.$setTouched) {
                            if (field.$$element) {
                                elVisible = field.$$element.is(':visible');
                            }
                            if (elVisible) {
                                field.$setTouched();
                            }
                        } else if (_.has(field, '$submitted') && key !== '$$parentForm') {
                            //Check for the inner forms and call the set touched mehtod on inner form fields
                            setTouchedState(field);
                        }
                    }
                });
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.highlightInvalidFields
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * This function loops through the form fields and set touched state as touched
             *
             * @param {object} ngForm angular form object
             */
            function highlightInvalidFields(ngForm) {
                setTouchedState(ngForm)
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.setGetterSettersOnField
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * This function sets getters setters on in out properties of form field
             *
             * @param {object} scope scope of the form field widget
             * @param {object} element form field element
             */
            function setGetterSettersOnField(scope, element) {
                _.forEach(scope.widgetProps, function (value, key) {
                    if (value.bindable === 'in-out-bound') {
                        if (!scope.hasOwnProperty(key)) {
                            Object.defineProperty(scope, key, {
                                get: function () {
                                    return  _.get(getFormFieldWidget(scope, element), key);
                                },
                                set: function (val) {
                                    _.set(getFormFieldWidget(scope, element), key, val);
                                }
                            });
                        }
                    } else if (value.bindable === 'out-bound') {
                        if (!scope.hasOwnProperty(key)) {
                            Object.defineProperty(scope, key, {
                                get: function () {
                                    return  _.get(getFormFieldWidget(scope, element), key);
                                }
                            });
                        }
                    }
                });
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getEmptyMatchMode
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to get the match mode based on the filter selected
             *
             * @param {object} enableemptyfilter empty filter options
             */
            function getEmptyMatchMode(enableemptyfilter) {
                var matchMode,
                    emptyFilterOptions = _.split(enableemptyfilter, ',');
                if (_.intersection(emptyFilterOptions, LIVE_CONSTANTS.NULLEMPTY).length === 2) {
                    matchMode = MATCH_MODES.NULLOREMPTY;
                } else if (_.includes(emptyFilterOptions, LIVE_CONSTANTS.NULL)) {
                    matchMode = MATCH_MODES.NULL;
                } else if (_.includes(emptyFilterOptions, LIVE_CONSTANTS.EMPTY)) {
                    matchMode = MATCH_MODES.EMPTY;
                }
                return matchMode;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.getRangeMatchMode
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to get the match mode for range
             *
             * @param {string} minValue min value selected
             * @param {string} maxValue max value selected
             */
            function getRangeMatchMode(minValue, maxValue) {
                var matchMode;
                //If two values exists, then it is between. Otherwise, greater or lesser
                if (isDefined(minValue) && isDefined(maxValue)) {
                    matchMode = MATCH_MODES.BETWEEN;
                } else if (isDefined(minValue)) {
                    matchMode = MATCH_MODES.GREATER;
                } else if (isDefined(maxValue)) {
                    matchMode = MATCH_MODES.LESSER;
                }
                return matchMode;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.getRangeFieldValue
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to get the field value for range
             *
             * @param {string} minValue min value selected
             * @param {string} maxValue max value selected
             */
            function getRangeFieldValue(minValue, maxValue) {
                var fieldValue;
                if (isDefined(minValue) && isDefined(maxValue)) {
                    fieldValue = [minValue, maxValue];
                } else if (isDefined(minValue)) {
                    fieldValue = minValue;
                } else if (isDefined(maxValue)) {
                    fieldValue = maxValue;
                }
                return fieldValue;
            }
            /**
             * @ngdoc function
             * @name wm.widgets.live.applyFilterOnField
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Function to get the updated values when filter on field is changed
             *
             * @param {object} $scope scope of the filter field/form field
             * @param {object} filterDef filter/form definition of the field
             * @param {boolean} isFirst boolean value to check if this method is called on load
             */
            function applyFilterOnField($scope, filterDef, newVal, isFirst) {
                var variable       = $scope.Variables[$scope.variableName],
                    fieldName      = filterDef.field || filterDef.key,
                    formFields     = $scope.formFields || $scope.fullFieldDefs,
                    filterOnFields = _.filter(formFields, {'filterOn': fieldName});

                newVal = WM.isDefined(newVal) ? newVal : ((filterDef.isRange ? getRangeFieldValue(filterDef.minValue, filterDef.maxValue) : filterDef.value));
                if (!variable || (isFirst && (_.isUndefined(newVal) || newVal === ''))) {
                    return;
                }
                //Loop over the fields for which the current field is filter on field
                _.forEach(filterOnFields, function (filterField) {
                    var filterOn     = filterField.filterOn,
                        filterKey    = filterField.field || filterField.key,
                        lookUpField  = filterDef.lookupField || filterDef._primaryKey,
                        filterFields = {},
                        filterWidget = filterField.editWidgetType || filterField.widget,
                        filterVal,
                        fieldColumn,
                        matchMode;
                    if (!isDataSetWidgets[filterWidget] || filterField.isDataSetBound || filterOn === filterKey) {
                        return;
                    }
                    //For related fields, add lookupfield for query generation
                    if (filterDef && filterDef.isRelated) {
                        filterOn += '.' +  lookUpField;
                    }
                    if (isDefined(newVal)) {
                        if (filterDef.isRange) {
                            matchMode = getRangeMatchMode(filterDef.minValue, filterDef.maxValue);
                        } else if (getEnableEmptyFilter($scope.enableemptyfilter) && newVal === LIVE_CONSTANTS.EMPTY_KEY) {
                            matchMode = getEmptyMatchMode($scope.enableemptyfilter);
                        } else {
                            matchMode = MATCH_MODES.EQUALS;
                        }
                        filterVal = (_.isObject(newVal) && !_.isArray(newVal)) ? newVal[lookUpField] : newVal;
                        filterFields[filterOn] = {
                            'value'     : filterVal,
                            'matchMode' : matchMode
                        };
                    } else {
                        filterFields = {};
                    }
                    fieldColumn = filterKey;

                    if (isSearchWidgetType(filterWidget) && filterField.dataoptions) {
                        filterField.dataoptions.filterFields = filterFields;
                    } else {
                        variable.getDistinctDataByFields({
                            'fields'         : fieldColumn,
                            'filterFields'   : filterFields,
                            'pagesize'       : filterField.limit
                        }, function (data) {
                            setFieldDataSet(filterField, data, fieldColumn, 'widget', getEnableEmptyFilter($scope.enableemptyfilter));
                        });
                    }
                });
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getDataTableFilterWidget
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Get the default filter widget type
             *
             * @param {string} type data type of the field
             */
            function getDataTableFilterWidget(type) {
                var fieldTypeWidgetTypeMap = getFieldTypeWidgetTypesMap(),
                    widget = fieldTypeWidgetTypeMap[type] && fieldTypeWidgetTypeMap[type][0];
                if (type === 'boolean') {
                    widget = 'select';
                }
                if (_.includes(['text', 'number', 'select', 'autocomplete', 'date', 'time', 'datetime'], widget)) {
                    return widget;
                }
                return 'text';
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.setFormValidationType
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Add or remove the novalidate attribute based on the validation type
             *
             * @param {object} $is isolate scope of the widget
             */
            function setFormValidationType($is) {
                var $ele;
                if ($is.isLayoutDialog) {
                    $ele = WM.element('body').find('.app-liveform-dialog[dialogid="' + $is._dialogid + '"] .app-liveform');
                } else {
                    $ele = $is.element;
                }
                if ($is.validationtype === 'none' || $is.validationtype === 'default') {
                    $ele.attr('novalidate', '');
                } else {
                    $ele.removeAttr('novalidate');
                }
            }

            //Function to find out the first invalid element in form
            function findInvalidElement($formEle, ngForm) {
                var $ele    = $formEle.find('.ng-invalid:visible:first'),
                    formObj = ngForm;
                //If element is form, find out the first invalid element in this form
                if ($ele.is('form')) {
                    formObj = ngForm && ngForm[$ele.attr('name')];
                    return findInvalidElement($ele, formObj);
                }
                return {
                    'ngForm' : formObj,
                    '$ele'   : $ele
                };
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.validateFieldsOnSubmit
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Disable the form submit if form is in invalid state. Highlight all the invalid fields if validation type is default
             *
             * @param {object} $scope isolate scope of the widget
             * @param {object} ngForm angular form object
             * @param {object} $formEle form element
             */
            function validateFieldsOnSubmit($scope, ngForm, $formEle) {
                var $invalidEle,
                    eleForm,
                    $invalidForm,
                    ngEle;
                //Disable the form submit if form is in invalid state. For delete operation, do not check the validation.
                if ($scope.operationType !== 'delete' && ($scope.validationtype === 'html' || $scope.validationtype === 'default') && ngForm && ngForm.$invalid) {
                    //For blob type required fields, even if file is present, required error is shown.
                    //To prevent this, if value is present set the required validity to true
                    WM.element($formEle.find('input[type="file"].app-blob-upload')).each(function () {
                        var $blobEL = WM.element(this);
                        if ($blobEL.val()) {
                            ngForm[$blobEL.attr('name')].$setValidity('required', true);
                        }
                    });
                    if (ngForm.$invalid) {
                        if ($scope.validationtype === 'default') {
                            $scope.highlightInvalidFields();
                        }
                        //Find the first invalid untoched element and set it to touched.
                        // Safari does not form validations. this will ensure that error is shown for user
                        eleForm      = findInvalidElement($formEle, ngForm);
                        $invalidForm = eleForm.ngForm;
                        $invalidEle  = eleForm.$ele;
                        if ($invalidEle.length) {
                            // on save click in page layout liveform, focus of autocomplete widget opens full-screen search.
                            if ($invalidEle.attr('type') !== 'autocomplete') {
                                $timeout(function () {
                                    $invalidEle.focus();
                                }, undefined, false);
                            }
                            ngEle = $invalidForm && $invalidForm[$invalidEle.attr('name')];
                            if (ngEle && ngEle.$setTouched) {
                                ngEle.$setTouched();
                            }
                            return true;
                        }
                    }
                    return false;
                }
                return false;
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getFieldLayoutConfig
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Returns caption and widget bootstrap classes for the field
             *
             * @param {string} captionWidth width given for the caption
             * @param {string} captionPosition position for the form field
             */
            function getFieldLayoutConfig(captionWidth, captionPosition) {
                var captionCls = '',
                    widgetCls = '';

                captionPosition = captionPosition || 'top';

                if (captionPosition === 'top') {
                    if (($rs.selectedViewPort && $rs.selectedViewPort.os === 'android') || !$rs.isMobileApplicationType || Utils.isAndroid()) { //Is android or not a mobile application
                        captionCls = widgetCls = 'col-xs-12';
                    } else if ($rs.isMobileApplicationType) { //Is a mobile application and not android
                        captionCls   = 'col-xs-4';
                        widgetCls    = 'col-xs-8';
                    }
                } else if (captionWidth) {
                    // handling itemsperrow containing string of classes
                    _.forEach(_.split(captionWidth, ' '), function (cls) {
                        var keys = _.split(cls, '-'),
                            tier = keys[0],
                            captionWidth,
                            widgetWidth;
                        captionWidth = parseInt(keys[1], 10);
                        widgetWidth  = 12 - captionWidth;
                        widgetWidth  = widgetWidth <= 0 ? 12 : widgetWidth;
                        captionCls += ' ' + 'col-' + tier + '-' + captionWidth;
                        widgetCls  += ' ' + 'col-' + tier + '-' + widgetWidth;
                    });
                }
                return {
                    'captionCls' : captionCls,
                    'widgetCls'  : widgetCls
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.toggleFilterMode
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * hide filtermode option if it is a dynamic table. For dynamic table we dont have table columns.
             * So checking headerConfig array because it is set only when we have table columns and column group
             *
             * @param {$is} Scope of the widget(datatable scope)
             */
            function toggleFilterMode($is) {
                $is.widgetProps.filtermode.showindesigner = !_.isEmpty($is.headerConfig);
                // check for dynamic table
                if (_.isEmpty($is.headerConfig)) {
                    $rs.$emit('set-markup-attr', $is.widgetid, {'filtermode': ''});
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.live.getDefaultViewModeWidget
             * @methodOf wm.widgets.live.LiveWidgetUtils
             * @function
             *
             * @description
             * Returns the default value for view mode widget in live form
             *
             * @param {widget} widget form field widget
             */
            function getDefaultViewModeWidget(widget) {
                if (_.includes(['checkbox', 'toggle', 'rating', 'upload'], widget)) {
                    return VIEW_MODE_OPTIONS.DEFAULT;
                }
                return VIEW_MODE_OPTIONS.LABEL;
            }

            this.getEventTypes              = getEventTypes;
            this.getDefaultValue            = getDefaultValue;
            this.getLiveWidgetButtons       = getLiveWidgetButtons;
            this.getColumnDef               = getColumnDef;
            this.getButtonDef               = getButtonDef;
            this.getRowDef                  = getRowDef;
            this.getTemplate                = getTemplate;
            this.translateVariableObject    = translateVariableObject;
            this.getColumnCountByLayoutType = getColumnCountByLayoutType;
            this.getCustomFieldKey          = getCustomFieldKey;
            this.getStepValue               = getStepValue;
            this.splitDimension             = splitDimension;
            this.mergeDimension             = mergeDimension;
            this.getFieldTypeWidgetTypesMap = getFieldTypeWidgetTypesMap;
            this.getMatchModeTypesMap       = getMatchModeTypesMap;
            this.getMatchModeMsgs           = getMatchModeMsgs;
            this.fieldPropertyChangeHandler = fieldPropertyChangeHandler;
            this.preProcessFields           = preProcessFields;
            this.setColumnConfig            = setColumnConfig;
            this.fetchPropertiesMapColumns  = fetchPropertiesMapColumns;
            this.fetchDynamicData           = fetchDynamicData;
            this.fetchReferenceDetails      = fetchReferenceDetails;
            this.getBoundWidgetDetails      = getBoundWidgetDetails;
            this.getRowOperationsColumn     = getRowOperationsColumn;
            this.getDistinctValues          = getDistinctValues;
            this.setHeaderConfigForTable    = setHeaderConfigForTable;
            this.setFormWidgetsValues       = setFormWidgetsValues;
            this.getWidgetProps             = getWidgetProps;
            this.getFormFilterWidgets       = getFormFilterWidgets;
            this.populateFormWidgets        = populateFormWidgets;
            this.getViewModeWidgets         = getViewModeWidgets;
            this.parseNgClasses             = parseNgClasses;
            this.fetchRelatedFieldData      = fetchRelatedFieldData;
            this.isSearchWidgetType         = isSearchWidgetType;
            this.interpolateBindExpressions = interpolateBindExpressions;
            this.getQuery                   = getQuery;
            this.compute                    = compute;
            this.getEditModeWidget          = getEditModeWidget;
            this.setFieldDataSet            = setFieldDataSet;
            this.fetchDistinctValues        = fetchDistinctValues;
            this.getDistinctValuesForField  = getDistinctValuesForField;
            this.getDistinctFieldProperties = getDistinctFieldProperties;
            this.getEnableEmptyFilter       = getEnableEmptyFilter;
            this.highlightInvalidFields     = highlightInvalidFields;
            this.setGetterSettersOnField    = setGetterSettersOnField;
            this.applyFilterOnField         = applyFilterOnField;
            this.getEmptyMatchMode          = getEmptyMatchMode;
            this.getRangeMatchMode          = getRangeMatchMode;
            this.getRangeFieldValue         = getRangeFieldValue;
            this.getDataTableFilterWidget   = getDataTableFilterWidget;
            this.setFormValidationType      = setFormValidationType;
            this.validateFieldsOnSubmit     = validateFieldsOnSubmit;
            this.getFieldLayoutConfig       = getFieldLayoutConfig;
            this.getDefaultViewModeWidget   = getDefaultViewModeWidget;
            this.getDisplayExpr             = getDisplayExpr;
            this.getCutomizedOptions        = getCutomizedOptions;
            this.toggleFilterMode           = toggleFilterMode;
        }
    ])
    .directive('liveActions', ['Utils', 'wmToaster', '$rootScope', 'DialogService', function (Utils, wmToaster, $rs, DialogService) {
        'use strict';
        var getRecords = function (options, operation, success, error) {
                var variable    = options.variable,
                    widgetScope = options.scope,
                    index,
                    dataNavigator;

                if (widgetScope.navigation !== 'None' && widgetScope.dataNavigator) {
                    dataNavigator = widgetScope.dataNavigator;

                    //If operation is delete, decrease the data size and check if navigation to previous page is required
                    if (operation === 'delete') {
                        dataNavigator.dataSize -= 1;
                        dataNavigator.calculatePagingValues();
                        index = dataNavigator.pageCount < dataNavigator.dn.currentPage ? 'prev' : undefined;
                    } else {
                        //If operation is insert, go to last page. If update operation, stay on current page
                        index = operation === 'insert' ? 'last' : 'current';
                        if (index === 'last') {
                            dataNavigator.dataSize += 1;
                        }
                        dataNavigator.calculatePagingValues();
                    }

                    dataNavigator.navigatePage(index, null, true, function (response) {
                        Utils.triggerFn(success, response);
                    });
                } else {
                    variable.update({}, function (response) {
                        Utils.triggerFn(success, response);
                    }, function (err) {
                        Utils.triggerFn(error, err);
                    });
                }
            },
            insertRecord = function (options, success, error) {
                var variable = options.variable,
                    dataObject = {
                        'row'              : options.row,
                        'transform'        : true,
                        'multipartData'    : options.multipartData,
                        'skipNotification' : true
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
                        'row'              : options.row,
                        'prevData'         : options.prevData,
                        'multipartData'    : options.multipartData,
                        'transform'        : true,
                        'rowData'          : options.rowData,
                        'skipNotification' : true
                    };

                variable.updateRecord(dataObject, function (response) {
                    Utils.triggerFn(success, response);
                }, function (err) {
                    Utils.triggerFn(error, err);
                });
            },
            deleteRecord = function (options, success, error) {
                var variable   = options.variable,
                    confirmMsg = options.scope.confirmdelete || 'Are you sure you want to delete this?',
                    dataObject = {
                        'row'              : options.row,
                        'transform'        : true,
                        'skipNotification' : true
                    },
                    deleteFn = function () {
                        variable.deleteRecord(dataObject, function (response) {
                            Utils.triggerFn(success, response);
                        }, function (err) {
                            Utils.triggerFn(error, err);
                        });
                    };
                DialogService._showAppConfirmDialog({
                    'caption'   :  _.get($rs.appLocale, 'MESSAGE_DELETE_RECORD') || 'Delete Record',
                    'content'   : confirmMsg,
                    'oktext'    : options.scope.deleteoktext,
                    'canceltext': options.scope.deletecanceltext,
                    'iconClass' : 'wi wi-delete fa-lg',
                    'resolve'   : {
                        'confirmActionOk': function () {
                            return deleteFn;
                        },
                        'confirmActionCancel': function () {
                            return function () {
                                Utils.triggerFn(options.cancelDeleteCallback);
                            };
                        }
                    }
                });
            },
            performOperation = function (operation, options) {
                var fn = WM.noop,
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
                    if (operation !== 'read') {
                        getRecords(options, operation, function () {
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
