/*global wm, WM, _, window, document, cordova*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$ExtAppMessageService
 * @description
 * The 'wm.modules.wmCommon.services.$ExtAppMessageService' receives all the external requests and pass the requests
 * to handlers that have registered.
 */
wm.modules.wmCommon.services.ExtAppMessageService = [
    '$rootScope',
    function ($rootScope) {
        'use strict';
        var handlers = [];
        $rootScope.$on("externalAppMessageReceived", function (e, message) {
            _.forEach(handlers, function (handler) {
                var matches = handler && message.address.match(handler.pattern);
                if (matches && matches.length > 0) {
                    handler.callBack(message);
                }
            });
        });
        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$ExtAppMessageService#addMessageListener
         * @methodOf wm.modules.wmCommon.services.$ExtAppMessageService
         * @description
         * adds a listener for a message whose address matches with the given regex pattern.
         *
         * @param {string} messageAddressPattern a regex pattern that is used to target messages to listen.
         * @param {Function} listener function to invoke when message that matches regex is received.
         *                  message received will be sent as first argument.
         * @returns {Function} a function which removes the listener when invoked.
         */
        this.addMessageListener = function (messageAddressPattern, listener) {
            var handler = {
                'pattern' : new RegExp(messageAddressPattern),
                'callBack' : listener
            }, i = handlers.length;
            handlers.push(handler);
            return function () {
                handlers[i] = undefined;
            };
        };
    }];