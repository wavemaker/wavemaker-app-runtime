/*global WM, */
/*jslint nomen: true*/

WM.module('wm.widgets.basic')
    .service('wmToaster', ['toaster', function (toaster) {
        'use strict';
        var _showToaster = function (type, title, desc, timeout, bodyOutputType) {
            /*pop the toaster only if either title or description are defined*/
            if (title || desc) {
                /*hide all previous toasters*/
                WM.element('.toast').hide();
                /*call pop function in toaster to show the toaster*/
                /*Not closing the toaster only in case type is not success and there is not timeout specified*/

                if (!timeout) {
                    timeout = 0;
                    if (type === 'success') {
                        timeout = 5000;
                    }
                }

                toaster.pop(type, title, desc, timeout, bodyOutputType);
            }
        };

        return {

            /**
             * @ngdoc function
             * @name $wmToaster#success
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * pops-up a success message toaster.
             *
             * @param {string} title title to be displayed on the top
             * @param {string} desc of the notification
             */
            success: function (title, desc) {
                _showToaster('success', title, desc, 5000);
            },

            /**
             * @ngdoc function
             * @name $wmToaster#error
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * pops-up an error message toaster.
             *
             * @param {string} title title to be displayed on the top
             * @param {string} desc of the notification
             */
            error: function (title, desc) {
                _showToaster('error', title, desc, 0);
            },

            /**
             * @ngdoc function
             * @name $wmToaster#info
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * pops-up an info message toaster.
             *
             * @param {string} title title to be displayed on the top
             * @param {string} desc of the notification
             */
            info: function (title, desc) {
                _showToaster('info', title, desc, 0);
            },

            /**
             * @ngdoc function
             * @name $wmToaster#warn
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * pops-up a warn message toaster.
             *
             * @param {string} title title to be displayed on the top
             * @param {string} desc of the notification
             */
            warn: function (title, desc) {
                _showToaster('warning', title, desc, 0);
            },

            /**
             * @ngdoc function
             * @name $wmToaster#show
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * pops-up a toaster depending on the parameter 'type' ({success, error, warn, info}).
             *
             * @param {string} type the type of the message - {success, error, warn, info}
             * @param {string} title title to be displayed on the top
             * @param {string} desc of the notification
             * @param {string} timeout of the notification
             */
            show: function (type, title, desc, timeout, bodyOutputType) {
                _showToaster(type, title, desc, timeout, bodyOutputType);
            },

            /**
             * @ngdoc function
             * @name $wmToaster#hide
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * hides a toaster.
             */
            hide: function () {
                WM.element('.toast').hide();
            }
        };
    }]);

/**
 * @ngdoc service
 * @name wm.widgets.basic.$wmToaster
 *
 * @description
 * The `wmToaster` loads or pops up a toaster in the window corner for displaying notifications for the user.

 * @param {object=} toaster-options
 *                  toaster options include position-class, time-out duration, max. count of the toasters
 *
 * Toaster is a meek mechanism for showing notifications or messages.
 * The notification “pops up” onto the window corner upon the content over there, for the nonce.
 * These messages stay for a definite time span, or until the user clicks on them.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-composite>
                    <wm-label caption="Title:"></wm-label>
                    <wm-text scopedatavalue="notificationTitle"></wm-text>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="Description:"></wm-label>
                    <wm-text scopedatavalue="notificationDescription"></wm-text>
                </wm-composite>
                <wm-button on-click='notify("success")' caption='Notify Success' class="btn-success"></wm-button>
                <wm-button on-click='notify("error")' caption='Notify Error' class="btn-danger"></wm-button>
                <wm-button on-click='notify("info")' caption='Notify Info' class="btn-info"></wm-button>
                <wm-button on-click='notify("warning")' caption='Notify Warn' class="btn-warning"></wm-button>
                <toaster-container toaster-options="{'limit': 1,'time-out': 2000, 'position-class': 'toast-bottom-right'}"></toaster-container>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope, wmToaster) {
               $scope.notificationTitle = "Sample Title";
               $scope.notificationDescription = "Sample Description";
               $scope.notify = function (type) {
                   wmToaster.show(type, $scope.notificationTitle, $scope.notificationDescription);
               }
            }
        </file>
    </example>
 */