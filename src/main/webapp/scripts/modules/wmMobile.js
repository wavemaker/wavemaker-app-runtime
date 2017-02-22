/*global wm, WM*/

/**
 * This is to create mock mobile modules and services in runtime.
 */

//Mock Mobile module
WM.module('wm.mobile', []);

//Mock MobileVariableService
/*global wm, WM, _, cordova, document*/
/*jslint sub: true */
wm.modules.wmCommon.services.DeviceService = ['$q', function ($q) {
    'use strict';
    // Returns a promise that will be resolved when device is ready.
    this.whenDeviceReady = function () {
        var d = $q.defer();
        d.resolve();
        return d.promise;
    };
    this.onBackButtonTap = function () {
        return WM.noop;
    };
}];
wm.modules.wmCommon.services.DeviceFileCacheService = WM.noop;
wm.modules.wmCommon.services.DeviceFileDownloadService = WM.noop;
wm.modules.wmCommon.services.DeviceFileService = WM.noop;
wm.variables.services.DeviceVariableService = WM.noop;
wm.variables.services.FileSelectorService = WM.noop;
wm.variables.services.DeviceMediaService = WM.noop;