/*global WM, _*/
/*jslint nomen: true*/

WM.module('wm.widgets.basic')
    .service('wmToaster', ['toaster', '$rootScope', '$compile', '$timeout', function (toaster, $rs, $compile, $timeout) {
        'use strict';
        var _showToaster = function (type, title, desc, timeout, bodyOutputType, onClickHandler, onHideCallback) {
            /*pop the toaster only if either title or description are defined*/
            if (title || desc) {
                /*call pop function in toaster to show the toaster*/
                /*Not closing the toaster only in case type is not success and there is not timeout specified*/

                if (!timeout) {
                    timeout = (timeout !== 0 && type === 'success') ? 5000 : 0;
                }

                // if the desc is an object, stringify it. $sce.trustAsHtml will throw an error otherwise
                if (!bodyOutputType && WM.isObject(desc)) {
                    desc = JSON.stringify(desc);
                }

                toaster.pop(type, title, desc, timeout, bodyOutputType || 'trustedHtml', onClickHandler, undefined, undefined, undefined, onHideCallback);
            }
        },  classlist = [],
            idCount = 0,
            idMapper = {};
        $rs.toasterClasses = {};
        //renders the custom notification call
        function renderNotification(template, newClass, timeout, position, onclickHandler, onHideCallback, scope) {
            $rs.toasterClasses[newClass] = 'custom-toaster ' + newClass;
            if (!_.includes(classlist, newClass)) {
                idMapper[newClass] = ++idCount;
            }
            var trustedHtml = $compile(template)(scope),
                toastTemplate = '<toaster-container name = "' + newClass + '" toaster-options="{\'limit\': 1,\'time-out\': 2000, \'position-class\': \'' + position + '\', \'icon-classes\': toasterClasses, \'toaster-id\': ' + idMapper[newClass] + '}"></toaster-container>';
            if (!_.includes(classlist, newClass)) {
                WM.element('body').append($compile(toastTemplate)($rs));
                classlist.push(newClass);
            }
            $timeout(function () {
                toaster.pop({type: newClass, body: trustedHtml[0].outerHTML, onHideCallback: onHideCallback, toasterId: idMapper[newClass], timeout: timeout, bodyOutputType: 'trustedHtml', clickHandler: onclickHandler});
            }, 350);
        }

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
             * @param {string} bodyOutputType of the notification
             * @param {function} onClickHandler of the notification
             * @param {function} onHideCallback of the notification
             */
            show: function (type, title, desc, timeout, bodyOutputType, onClickHandler, onHideCallback) {
                _showToaster(type, title, desc, timeout, bodyOutputType, onClickHandler, onHideCallback);
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
            hide: function (toasterClass) {
                if (toasterClass) {
                    var toastClassIndex = classlist.indexOf(toasterClass);
                    if (toastClassIndex > -1) {
                        classlist.splice(toastClassIndex, 1);
                    }
                    //remove the element from dom
                    WM.element('[name=' + toasterClass + ']').remove();
                    return;
                }
                WM.element('.toast').hide();
            },

            /**
             * @ngdoc function
             * @name $wmToaster#createCustomNotification
             * @methodOf wm.widgets.basic.$wmToaster
             * @function
             *
             * @description
             * pops-up a toaster depending on the page name parameter 'content' .
             *
             * @param {string} content the page name you want to display
             * @param {string} className the notification variable name
             * @param {number} timeout the duration of the notification to be displayed
             * @param {string} position the position of the notification
             * @param {method} onClickHandler handles the method of click on notification
             * @param {method} onHideCallback handles the method on hide of notification
             */
            createCustomNotification: function (content, className, timeout, position, onClickHandler, onHideCallback, pScope) {
                renderNotification('<wm-container content="' + content + '"></wm-container>', className, timeout, position, onClickHandler, onHideCallback, pScope);
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