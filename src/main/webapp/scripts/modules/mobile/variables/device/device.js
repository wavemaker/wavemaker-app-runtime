/*global wm, WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaNetwork', '$cordovaGeolocation', '$cordovaVibration', '$cordovaDevice', '$cordovaAppVersion', '$rootScope', function (DeviceVariableService, $cordovaNetwork, $cordovaGeolocation, $cordovaVibration, $cordovaDevice, $cordovaAppVersion, $rootScope) {
    "use strict";
    $rootScope.$on('$cordovaNetwork:online', function () {
        $rootScope.networkStatus = true;
    });

    $rootScope.$on('$cordovaNetwork:offline', function () {
        $rootScope.networkStatus = false;
    });

    var operations = {
            getAppInfo: {
                model: {
                    appversion: 'X.X.X',
                    cordovaversion: 'X.X.X'
                },
                properties: ['startUpdate'],
                invoke: function (variable, options, success) {
                    $cordovaAppVersion.getVersionNumber().then(function (appversion) {
                        success({
                            appversion: appversion,
                            cordovaversion: $cordovaDevice.getCordova()
                        });
                    });
                }
            },
            getCurrentGeoPosition: {
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
                properties: ['startUpdate', 'geolocationHighAccuracy', 'geolocationMaximumAge', 'geolocationTimeout'],
                invoke: function (variable, options, success, error) {
                    var geoLocationOptions = {
                        maximumAge: variable.geolocationMaximumAge * 1000,
                        timeout: variable.geolocationTimeout * 1000,
                        enableHighAccuracy: variable.geolocationHighAccuracy
                    };
                    $cordovaGeolocation.getCurrentPosition(geoLocationOptions).then(function (position) {
                        var result = {
                            coords: {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                altitude: position.coords.altitude,
                                accuracy: position.coords.accuracy,
                                altitudeAccuracy: position.coords.altitudeAccuracy,
                                heading: position.coords.heading,
                                speed: position.coords.speed
                            },
                            timestamp: position.timestamp
                        };
                        success(result);
                    }, error);
                }
            },
            getDeviceInfo: {
                model: {
                    deviceModel: 'DEVICEMODEL',
                    os: 'DEVICEOS',
                    osVersion: 'X.X.X',
                    deviceUUID: 'DEVICEUUID'
                },
                properties: ['startUpdate'],
                invoke: function (variable, options, success) {
                    success({
                        deviceModel: $cordovaDevice.getModel(),
                        os: $cordovaDevice.getPlatform(),
                        osVersion: $cordovaDevice.getVersion(),
                        deviceUUID: $cordovaDevice.getUUID()
                    });
                }
            },
            getNetworkInfo: {
                model: {
                    connectionType: 'NONE',
                    isOnline: true,
                    isOffline: false
                },
                properties: ['autoUpdate', 'startUpdate', 'networkStatus'],
                invoke: function (variable, options, success) {
                    success({
                        connectionType: $cordovaNetwork.getNetwork(),
                        isOnline: $cordovaNetwork.isOnline(),
                        isOffline: $cordovaNetwork.isOffline()
                    });
                }
            },
            vibrate: {
                properties: ['vibrationtime'],
                invoke: function (variable) {
                    var vibrationTimeOptions = {
                        time: variable.vibrationtime * 1000
                    };
                    $cordovaVibration.vibrate(vibrationTimeOptions.time);
                }
            }
        };
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('device', key, value);
    });
}]);