/*global wm, WM*/

/**
 * This is to create mock mobile modules and services in runtime.
 */

//Mock Mobile module
WM.module('wm.mobile', []);

//Mock MobileVariableService
wm.variables.services.DeviceVariableService = WM.noop;
wm.variables.services.FileSelectorService = WM.noop;