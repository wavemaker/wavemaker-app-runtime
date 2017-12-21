/*global WM, navigator */
/*Directive for network info toaster*/

WM.module('wm.widgets.advanced')
    .run([
        '$templateCache',

        function ($tc) {
            'use strict';

            $tc.put('template/widget/advanced/networkInfoToaster.html',
                '<div class="network-info-toaster" data-ng-show="showMessage" ng-switch="networkState">' +
                '   <div class="info" ng-switch-when="-3">' +
                '       <label class="message">{{::$root.appLocale.MESSAGE_NETWORK_NOT_AVAILABLE}}</label>' +
                '       <button class="btn btn-default hide-btn" data-ng-click="hideMessage()">{{::$root.appLocale.LABEL_HIDE_NETWORK_INFO}}</button>' +
                '   </div>' +
                '   <div class="info" ng-switch-when="-2">' +
                '       <label class="message">{{::$root.appLocale.MESSAGE_SERVICE_NOT_AVAILABLE}}</label>' +
                '       <button class="btn btn-default hide-btn" data-ng-click="hideMessage()">{{::$root.appLocale.LABEL_HIDE_NETWORK_INFO}}</button>' +
                '   </div>' +
                '   <div class="info" ng-switch-when="-1">' +
                '       <label class="message">{{::$root.appLocale.MESSAGE_SERVICE_AVAILABLE}}</label>' +
                '       <button class="btn btn-default hide-btn" data-ng-click="hideMessage()">{{::$root.appLocale.LABEL_HIDE_NETWORK_INFO}}</button>' +
                '       <button class="btn btn-primary connect-btn" data-ng-click="connect()">{{::$root.appLocale.LABEL_CONNECT_TO_SERVICE}}</button>' +
                '   </div>' +
                '   <div class="info" ng-switch-when="0">' +
                '       <label class="message">{{::$root.appLocale.MESSAGE_SERVICE_CONNECTING}}</label>' +
                '   </div>' +
                '   <div class="info" ng-switch-when="1">' +
                '       <label class="message">{{::$root.appLocale.MESSAGE_SERVICE_CONNECTED}}</label>' +
                '   </div>' +
                '</div>');
        }
    ])
    .directive('wmNetworkInfoToaster', [
        '$rootScope',
        '$templateCache',
        '$timeout',
        'NetworkService',
        function ($rootScope, $templateCache, $timeout, NetworkService) {
            'use strict';

            return {
                'restrict': 'E',
                'replace' : true,
                'scope'   : {},
                'template': $templateCache.get('template/widget/advanced/networkInfoToaster.html'),
                'compile' : function () {
                    return {
                        'pre': function ($is) {
                            var watcherDestroyer;
                            $is.showMessage = false;
                            $is.isServiceConnected = NetworkService.isConnected();
                            $is.isServiceAvailable = NetworkService.isAvailable();
                            $is.hideMessage = function () {
                                $is.showMessage = false;
                            };
                            $is.connect = function () {
                                NetworkService.connect();
                            };
                            watcherDestroyer = $rootScope.$on('onNetworkStateChange', function (event, data) {
                                var autoHide = false;
                                $is.showMessage = true;
                                if (data.isConnected) {
                                    $is.networkState = 1;
                                    autoHide = true;
                                } else if (data.isConnecting) {
                                    $is.networkState = 0;                                    
                                } else if (data.isServiceAvailable) {
                                    $is.networkState = -1;                                    
                                } else if (data.isNetworkAvailable && !data.isServiceAvailable) {
                                    $is.networkState = -2;
                                } else {
                                    $is.networkState = -3;
                                }
                                if (autoHide) {
                                    $timeout(function () {
                                        $is.showMessage = false;
                                    }, 5000);
                                }
                            });
                            $is.$on('$destroy', function () {
                                watcherDestroyer();
                            });
                        }
                    };
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmNetworkInfoToaster
 * @restrict E
 *
 * @description
 * The `wmNetworkInfoToaster` directive show a toaster when the app is not connected to backend server
 * and when the backend service is available for app to connect.
 *
 * @scope
 * @requires $rootScope
 * @requires $templateCache
 * @requires NetworkService
 */

