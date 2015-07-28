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

        function (Utils) {
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
                        displayName: 'reset',
                        show: true,
                        type: 'button',
                        updateMode: true
                    },
                    {
                        key : 'cancel',
                        class: 'form-cancel btn-secondary',
                        iconclass: 'glyphicon glyphicon-remove-circle',
                        action: 'cancel()',
                        displayName: 'cancel',
                        show: true,
                        type: 'button',
                        updateMode: true
                    },
                    {
                        key : 'save',
                        class: 'form-save btn-success',
                        iconclass: 'glyphicon glyphicon-save',
                        action: '',
                        displayName: 'save',
                        show: true,
                        type: 'submit',
                        updateMode: true
                    },
                    {
                        key : 'delete',
                        class: 'form-delete btn-secondary',
                        iconclass: 'glyphicon glyphicon-remove',
                        action: 'delete()',
                        displayName: 'delete',
                        show: true,
                        type: 'button',
                        updateMode: false
                    },
                    {
                        key : 'update',
                        class: 'form-update btn-secondary',
                        iconclass: 'glyphicon glyphicon-pencil',
                        action: 'update()',
                        displayName: 'update',
                        show: true,
                        type: 'button',
                        updateMode: false
                    },
                    {
                        key : 'new',
                        class: 'form-new btn-success',
                        iconclass: 'glyphicon glyphicon-plus',
                        action: 'new()',
                        displayName: 'new',
                        show: true,
                        type: 'button',
                        updateMode: false
                    }];
            }

            this.getDefaultValue = getDefaultValue;
            this.getFormButtons = getFormButtons;
        }
    ]);