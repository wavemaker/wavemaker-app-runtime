/*global WM,_ */
/**
 * @ngdoc service
 * @name wm.widgets.basic.wmSpinner
 * @description
 * This service can be used to show/hide spinner on a page.
 */

WM.module('wm.widgets.basic').
    factory('wmSpinner', function ($animate) {
        "use strict";
        var spinnerMap = {},
            spinnerId = 0,
            appSpinner;

        function getAppSpinnerScope() {
            if (!appSpinner) {
                appSpinner = WM.element('body >.app-spinner:first').isolateScope();
                $animate.enabled(false, appSpinner);
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
             * @param {string} message for the spinner.
             * @param {id} optional id for the spinner. If not provided, service will generate the id.
             * @param {spinnerClass} spinnerClass, optional. ClassNames that are to be applied on the spinner.
             * @returns {number} spinnerId, this id needs to be passed while calling the hide method.
             */

            'show' : function (message, id, spinnerClass) {
                var spinnerScope = getAppSpinnerScope();

                id                   = id || ++spinnerId;
                spinnerMap[id]       = _.trim(message);
                spinnerScope.caption = _.without(_.values(spinnerMap), '', undefined).join('<br/>');
                spinnerScope.show    = true;

                spinnerScope.spinnerclass = spinnerClass;

                return id;
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