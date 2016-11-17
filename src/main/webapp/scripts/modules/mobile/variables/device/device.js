/*global wm, WM, _*/
WM.module('wm.variables').run([
    '$cordovaNetwork',
    '$cordovaGeolocation',
    '$cordovaVibration',
    '$cordovaDevice',
    '$cordovaAppVersion',
    '$rootScope',
    'DeviceVariableService',
    function ($cordovaNetwork,
              $cordovaGeolocation,
              $cordovaVibration,
              $cordovaDevice,
              $cordovaAppVersion,
              $rootScope,
              DeviceVariableService) {
        "use strict";
        var operations;

        $rootScope.$on('$cordovaNetwork:online', function () {
            $rootScope.networkStatus = true;
        });

        $rootScope.$on('$cordovaNetwork:offline', function () {
            $rootScope.networkStatus = false;
        });

        operations = {
            getAppInfo: {
                model: {
                    appversion: 'X.X.X',
                    cordovaversion: 'X.X.X'
                },
                properties: [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true}
                ],
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
                requiredCordovaPlugins: ['GEOLOCATION'],
                properties: [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "autoUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "geolocationHighAccuracy", "type": "boolean", "value": true, "dataBinding": true},
                    {"target": "geolocationMaximumAge", "type": "number", "value": 3, "dataBinding": true},
                    {"target": "geolocationTimeout", "type": "number", "value": 5, "dataBinding": true}
                ],
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
                properties: [
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true}
                ],
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
                requiredCordovaPlugins: ['NETWORK'],
                properties: [
                    {"target": "autoUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "startUpdate", "type": "boolean", "value": true, "hide" : true},
                    {"target": "networkStatus", "type": "boolean", value: "bind:$root.networkStatus", "dataBinding": true, hide: true},
                    {"target": "onOnline", "hide" : false},
                    {"target": "onOffline", "hide" : false}
                ],
                invoke: function (variable, options, success) {
                    success({
                        connectionType: $cordovaNetwork.getNetwork(),
                        isOnline: $cordovaNetwork.isOnline(),
                        isOffline: $cordovaNetwork.isOffline()
                    });
                    if ($cordovaNetwork.isOnline()) {
                        DeviceVariableService.initiateCallback('onOnline', variable, options);
                    } else {
                        DeviceVariableService.initiateCallback('onOffline', variable, options);
                    }
                }
            },
            vibrate: {
                properties: [
                    {"target": "vibrationtime", "type": "number", "value": 2, "dataBinding": true}
                ],
                requiredCordovaPlugins: ['VIBRATE'],
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