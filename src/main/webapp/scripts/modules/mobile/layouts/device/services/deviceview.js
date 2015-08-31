/*global WM*/
/**
 * DeviceViewService is not required for Mobile Apps. But, this is being used app-runtime.
 * So, to circumvent the injection errors, this dummy service is being initialized.
 */
WM.module("wm.layouts.device").service("DeviceViewService", [function () {
    'use strict';
    return {
        update: WM.noop
    };
}]);