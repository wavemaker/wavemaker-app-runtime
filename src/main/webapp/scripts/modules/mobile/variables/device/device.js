/*global wm, WM*/
WM.module('wm.variables').run(['MobileVariableService', '$cordovaNetwork', '$cordovaGeolocation', '$cordovaVibration', '$cordovaDevice', '$cordovaAppVersion', function (MobileVariableService, $cordovaNetwork, $cordovaGeolocation, $cordovaVibration, $cordovaDevice, $cordovaAppVersion) {
    "use strict";

    var operations = {
            getConnectionType: {
                model: {
                    data : 'NONE'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ data: $cordovaNetwork.getNetwork()});
                }
            },
            getGeoLocation : {
                model: {
                    coords: {
                        latitude: 0,
                        longitude: 0,
                        altitude: 0,
                        accuracy: 0,
                        altitudeAccuracy: 0,
                        heading: 0,
                        speed: 0
                    },
                    timestamp: 0
                },
                properties : ['startUpdate', 'geolocationHighAccuracy', 'geolocationMaximumAge', 'geolocationTimeout'],
                invoke: function (variable, options, success, error) {
                    var geoLocationOptions = {
                        maximumAge: variable.geolocationMaximumAge * 1000,
                        timeout: variable.geolocationTimeout * 1000,
                        enableHighAccuracy: variable.geolocationHighAccuracy
                    };
                    $cordovaGeolocation.getCurrentPosition(geoLocationOptions).then(success, error);
                }
            },
            vibrate :   {
                model: {
                    data: {}
                },
                properties : ['vibrationtime'],
                invoke: function (variable) {
                    var vibrationTimeOptions = {
                        time: variable.vibrationtime * 1000
                    };
                    $cordovaVibration.vibrate(vibrationTimeOptions.time);
                }
            },
            getModel :   {
                model: {
                    model: 'iPhone 5,1'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ model: $cordovaDevice.getModel()});
                }
            },
            getOS :   {
                model: {
                    os: 'iOS'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ os: $cordovaDevice.getPlatform()});
                }
            },
            getOSVersion :   {
                model: {
                    osversion: '0.0.0'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ osversion: $cordovaDevice.getVersion()});
                }
            },
            getCordovaVersion :   {
                model: {
                    version: '0.0.0'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ version: $cordovaDevice.getCordova()});
                }
            },
            getDeviceUUID :   {
                model: {
                    UUID: 'AC79F43E593BK11S'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ UUID: $cordovaDevice.getUUID()});
                }
            },
            getAppVersionNumber :   {
                model: {
                    appversion: '0.0.0'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    $cordovaAppVersion.getVersionNumber().then(function(appversion) {
                        success({appversion: appversion});
                    });
                }
            }
        };
    WM.forEach(operations, function (value, key) {
        MobileVariableService.addOperation('device', key, value);
    });
}]);