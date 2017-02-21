/*global WM,_ */
/**
 * @ngdoc service
 * @name wm.widgets.basic.wmSpinner
 * @description
 * This service can be used to show/hide spinner on a page.
 */

WM.module('wm.widgets.basic').
    factory('wmSpinner', function ($compile, $rootScope) {
        "use strict";
        var spinnerContextMap = {
                'page': {}
            },
            spinnerId = 0,
            appSpinner;

        function getAppSpinnerScope() {
            if (!appSpinner) {
                appSpinner = WM.element('[name=globalspinner], [name=global-spinner]').eq(0).isolateScope();
            }
            return appSpinner;
        }

        /**
         *
         * @param spinnerContext gives the widget id of where the spinner to be inserted
         * @param message contains the spinner related message
         * @param id contains the spinnerId
         */
        function showContextSpinner(spinnerContext, message, id) {
            var $element         = WM.element('[name="' + spinnerContext + '"]'),
                spinnerTemplate  = '<wm-spinner name="' + spinnerContext + '-spinner" show="true"></wm-spinner>',
                $spinnerEl       = WM.element('[name="' + spinnerContext + '-spinner"]'),
                compiledEl;
            //if the element is not found then just return do not append the spinner.
            if (!$element.length) {
                return;
            }
            //if the spinner El already exists, add the new message to map and return id
            if (spinnerContextMap[spinnerContext] && $spinnerEl.length) {
                spinnerContextMap[spinnerContext][id] = _.trim(message);
                $spinnerEl.isolateScope().spinnerMessages = spinnerContextMap[spinnerContext];
                return id;
            }
            spinnerContextMap[spinnerContext] = {};
            spinnerContextMap[spinnerContext][id] = _.trim(message);
            compiledEl   = $compile(spinnerTemplate)($rootScope.$new());
            compiledEl.isolateScope().spinnerMessages = spinnerContextMap[spinnerContext];
            compiledEl.appendTo($element);
            return id;
        }

        /**
         *
         * @param spinnerContext gives the widget context of the spinner to be removed from
         * @param id spinnerId to be removed
         */
        function hideContextSpinner(spinnerContext, id) {
            var spinnerEle   = WM.element('[name="' + spinnerContext + '-spinner"]'),
                spinnerScope = spinnerEle.isolateScope();
            //return back if the element doesn't exist in the dom
            if (!spinnerEle.length) {
                return;
            }
            //remove the message from the spinner context map
            delete spinnerContextMap[spinnerContext][id];
            //if mapRef is empty then delete the reference from map and delete the spinner scope and element
            if (!_.isEmpty(spinnerContextMap[spinnerContext])) {
                spinnerScope.spinnerMessages = spinnerContextMap[spinnerContext];
                return;
            }
            delete spinnerContextMap[spinnerContext];
            spinnerScope.show = false;
            spinnerScope.$destroy(); //destroy the scope before removing the element from the DOM.
            spinnerEle.remove();
        }

        return {
            /**
             * @ngdoc method
             * @name  wm.widgets.basic.wmSpinner#show
             * @methodOf  wm.widgets.basic.wmSpinner
             * @description
             * Increments the spinner counter and Shows a spinner on the page.
             * @param {string} message for the spinner.
             * @param {number} optional id for the spinner. If not provided, service will generate the id.
             * @param {string} spinnerClass, optional. ClassNames that are to be applied on the spinner.
             * @returns {string} spinnerContext, this .
             */

            'show' : function (message, id, spinnerClass, spinnerContext) {
                var spinnerScope;
                id      = id || ++spinnerId;
                //if spinnerContext is passed, then append the spinner to the element(default method for variable calls).
                if (spinnerContext && spinnerContext !== 'page') {
                    return showContextSpinner(spinnerContext, message, id); //return after the compiled spinner is appended to the element reference
                }
                //the below functionality can be used to create a spinner by sending spinner message to the function.
                spinnerScope = getAppSpinnerScope();

                spinnerContextMap.page[id]   = _.trim(message);
                spinnerScope.spinnerMessages = spinnerContextMap.page;
                spinnerScope.show            = true;
                spinnerScope.spinnerclass    = spinnerClass;

                return id;
            },

            /**
             * @ngdoc method
             * @name  wm.widgets.basic.wmSpinner#hide
             * @methodOf  wm.widgets.basic.wmSpinner
             * @description
             * Hides the spinner when spinner count is zero.
             * @param {number} id spinnerId to be hidden.
             */

            'hide' : function (id) {
                var spinnerScope,
                    spinnerCount,
                    spinnerContext;

                //find the spinner context of the id from the spinnerContextMap
                spinnerContext = _.findKey(spinnerContextMap, function (obj) {
                    return _.includes(_.keys(obj), id);
                });
                //if spinnerContext exists just remove the spinner from the reference and destroy the scope associated.
                if (spinnerContext && spinnerContext !== 'page') {
                    hideContextSpinner(spinnerContext, id);
                    return;
                }
                //supports the earlier spinner service operations and also page context spinners
                spinnerScope = getAppSpinnerScope();

                if (id) {
                    delete spinnerContextMap.page[id];
                    spinnerScope.spinnerMessages = spinnerContextMap.page;
                    spinnerCount = Object.keys(spinnerContextMap.page).length;
                    if (spinnerCount === 0) {
                        spinnerScope.show = false;
                    }
                } else {
                    spinnerContextMap.page = {};
                }
            }
        };

    });