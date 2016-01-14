/*global WM, */
/**
 * @ngdoc service
 * @name wm.widgets.basic.wmSpinner
 * @description
 * This service can be used to show/hide spinner on a page.
 */

WM.module('wm.widgets.basic').
    factory('wmSpinner', function () {
        "use strict";
        var spinnerMap = {},
            spinnerId = 0,
            appSpinner;

        function getAppSpinnerScope() {
            if (!appSpinner) {
                appSpinner = WM.element('body >.app-spinner:first').isolateScope();
            }
            return appSpinner;
        }

        return {
            /**
             * @ngdoc method
             * @name  wm.widgets.basic.wmSpinner#show
             * @methodOf  wm.widgets.basic.wmSpinner
             * @description
             * Increments the spinner counter and Shows a spinner on the page.
             * @param {string} message for the spinner
             * @returns {number} spinnerId, this id needs to be passed while calling the hide method.
             */

            'show' : function (message) {
                var spinnerScope = getAppSpinnerScope();

                spinnerMap[++spinnerId] = _.trim(message);
                spinnerScope.caption = _.without(_.values(spinnerMap), '', undefined).join('<br/>');
                spinnerScope.show = true;

                return spinnerId;
            },

            /**
             * @ngdoc method
             * @name  wm.widgets.basic.wmSpinner#hide
             * @methodOf  wm.widgets.basic.wmSpinner
             * @description
             * Hides the spinner when spinner count is zero.
             * @param {number} id sets the spinner count to zero.
             */

            'hide' : function (id) {
                var spinnerScope = getAppSpinnerScope(),
                    spinnerCount;

                if (id) {
                    delete spinnerMap[id];
                    spinnerScope.caption = _.without(_.values(spinnerMap), '', undefined).join('<br/>');
                    spinnerCount = Object.keys(spinnerMap).length;
                    if (spinnerCount === 0) {
                        getAppSpinnerScope().show = false;
                    }
                } else {
                    spinnerMap = {};
                }
            }
        };

    });