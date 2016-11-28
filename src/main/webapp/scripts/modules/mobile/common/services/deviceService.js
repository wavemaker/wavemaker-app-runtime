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
    'Utils',
    //This is required for initialization
    'OfflineSecurityService',
    function ($document, $q, Utils) {
        'use strict';

        var isDeviceReady = window.cordova ? false : true,
            isCordovaReady = false,
            isDeviceReadyEventListeners   = [],
            isCordovaReadyEventListeners   = [],
            deviceReadyCallBack,
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
         * @name wm.modules.wmCommon.services.$DeviceService#whenCordovaReady
         * @methodOf wm.modules.wmCommon.services.$DeviceService
         * @description
         * Returns a promise that will be resolved when all cordova modules are loaded.
         *
         * @returns {object} a promise that will be resolved when cordova api is ready..
         */
        this.whenCordovaReady = function () {
            var d = $q.defer();
            // Only in case of deployed mobile apps, wait for deviceready event.
            if (isCordovaReady) {
                d.resolve();
            } else {
                isCordovaReadyEventListeners.push(d.resolve);
            }
            return d.promise;
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

        if (!isDeviceReady) {
            deviceReadyCallBack = this.waitForInitialization('cordova ready');
            $document.one('deviceready', function () {
                isCordovaReady = true;
                deviceReadyCallBack();
                triggerListeners(isCordovaReadyEventListeners);
            });
        }
    }];