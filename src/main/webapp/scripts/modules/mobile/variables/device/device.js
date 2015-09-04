/*global wm, WM*/
WM.module('wm.variables').run(['MobileVariableService', '$cordovaNetwork', '$cordovaGeolocation', '$cordovaCamera', '$cordovaVibration', '$cordovaDevice', function (MobileVariableService, $cordovaNetwork, $cordovaGeolocation, $cordovaCamera, $cordovaVibration, $cordovaDevice) {
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
            capturePicture: {
                model : {
                    data: 'resources/images/imagelists/default-image.png'
                },
                properties : ['allowImageEdit', 'imageQuality', 'imageEncodingType', 'correctOrientation'],
                invoke : function (variable, options, success, error) {
                    var cameraOptions = {
                        quality : variable.imageQuality,
                        destinationType : 1, //only file url
                        sourceType : 1, //camera
                        allowEdit : variable.allowImageEdit,
                        encodingType : parseInt(variable.imageEncodingType, 10),
                        mediaType : 0, //always picture
                        correctOrientation : variable.correctOrientation
                    };
                    $cordovaCamera.getPicture(cameraOptions).then(function (data) {
                        success({ data : data});
                    }, error);
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
                    model: ''
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ model: $cordovaDevice.getModel()});
                }
            },
            getOS :   {
                model: {
                    os: ''
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ os: $cordovaDevice.getPlatform()});
                }
            },
            getOSVersion :   {
                model: {
                    osversion: ''
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success) {
                    success({ osversion: $cordovaDevice.getVersion()});
                }
            }

        };
    WM.forEach(operations, function (value, key) {
        MobileVariableService.addOperation('device', key, value);
    });
}]);