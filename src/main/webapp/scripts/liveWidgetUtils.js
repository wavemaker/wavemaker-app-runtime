/*global WM, moment*/

WM.module('wm.widgets.live')
    .service('LiveWidgetUtils', [
        'Utils',

        function (Utils) {
            'use strict';

            function formatBooleanValue(value) {
                if (value === "true") {
                    return true;
                }
                if (value === "false") {
                    return false;
                }
                return value;
            }

            function getDefaultValue(value, type) {
                if (Utils.isNumberType(type)) {
                    return isNaN(Number(value)) ? null : Number(value);
                }
                if (type === 'boolean') {
                    return formatBooleanValue(value);
                }
                return value;
            }

            this.getDefaultValue = getDefaultValue;
        }
    ]);