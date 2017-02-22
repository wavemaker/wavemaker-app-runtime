/*global wm, WM, _, cordova, document, window*/
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$DeviceService
 * @description
 * The 'wm.modules.wmCommon.services.$DeviceService' provides high-level API to interact with device.
 */
wm.modules.wmCommon.services.DeviceService = [
    '$document',
    '$q',
    '$rootScope',
    'Utils',
    //This is required for initialization
    'OfflineSecurityService',
    function ($document, $q, $rootScope, Utils) {
        'use strict';

        var isDeviceReady = true,
            isDeviceReadyEventListeners   = [],
            backBtnTapListeners = [],
            waitingFor = {};

        function triggerListeners(listeners) {
            _.forEach(listeners, function (l) {
                Utils.triggerFn(l);
            });
            listeners.length = 0;
        }

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceService#waitForInitialization
         * @methodOf wm.modules.wmCommon.services.$DeviceService
         * @description
         * Will hold the device ready until initialization for the given module over.
         *
         * @returns {object} a function to call then the initialization is over.
         */
        this.waitForInitialization = function (name) {
            var id = name + '-' + _.now();
            isDeviceReady = false;
            waitingFor[id] = {
                'id'    : id,
                'name'  : name
            };
            return function () {
                delete waitingFor[id];
                if (_.keys(waitingFor).length === 0) {
                    isDeviceReady = true;
                    triggerListeners(isDeviceReadyEventListeners);
                }
            };
        };
        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceService#whenDeviceReady
         * @methodOf wm.modules.wmCommon.services.$DeviceService
         * @description
         * Returns a promise that will be resolved when all wavemaker device modules and cordova modules are loaded.
         *
         * @returns {object} a promise that will be resolved when device api is ready..
         */
        this.whenDeviceReady = function () {
            var d = $q.defer();
            // Only in case of deployed mobile apps, wait for deviceready event.
            if (isDeviceReady) {
                d.resolve();
            } else {
                isDeviceReadyEventListeners.push(d.resolve);
            }
            return d.promise;
        };

        $document.on('backbutton', function () {
            _.forEach(backBtnTapListeners, function (fn) {
                return !(fn() === false);
            });
            $rootScope.$safeApply($rootScope);
        });
        /**
         *
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceService#onBackButtonTap
         * @methodOf wm.modules.wmCommon.services.$DeviceService
         * @description
         * When back button on android devices is tapped, then this function will invoke the given callback. The
         * registered callbacks are invoked in reverse chronological order. A callback can stop propagation by
         * returning boolean false.
         *
         * @param {Function} fn callback function to invoke.
         * @returns {Function} a function to call to deregister
         */
        this.onBackButtonTap = function (fn) {
            backBtnTapListeners.splice(0, 0, fn);
            return function () {
                var i = _.findIndex(backBtnTapListeners, function (v) {
                    return v === fn;
                });
                if (i >= 0) {
                    backBtnTapListeners.splice(i, 1);
                }
            };
        };
    }];