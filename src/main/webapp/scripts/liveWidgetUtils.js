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
        }
    ]);