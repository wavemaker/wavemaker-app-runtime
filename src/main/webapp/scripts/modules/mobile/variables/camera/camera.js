/*global wm, WM*/
WM.module('wm.variables').run(['MobileVariableService', '$cordovaCamera', '$cordovaCapture', function (MobileVariableService, $cordovaCamera, $cordovaCapture) {
    "use strict";

    var operations = {
        capturePicture: {
            model: {
                data: 'resources/images/imagelists/default-image.png'
            },
            properties: ['allowImageEdit', 'imageQuality', 'imageEncodingType', 'correctOrientation'],
            invoke: function(variable, options, success, error) {
                var cameraOptions = {
                    quality           : variable.imageQuality,
                    destinationType   : 1, //only file url
                    sourceType        : 1, //camera
                    allowEdit         : variable.allowImageEdit,
                    encodingType      : parseInt(variable.imageEncodingType, 10),
                    mediaType         : 0, //always picture
                    correctOrientation: variable.correctOrientation
                };
                $cordovaCamera.getPicture(cameraOptions).then(function(data) {
                    success({data: data});
                }, error);
            }
        },
        captureVideo: {
            model: {
                data: ''
            },
            properties: [],
            invoke: function(variable, options, success, error) {
                var videoOptions = {
                    limit   : 1
                };
                $cordovaCapture.captureVideo(videoOptions).then(function(videoData) {
                    success({data: videoData});
                }, error);
            }
        }
    }
    WM.forEach(operations, function (value, key) {
        MobileVariableService.addOperation('camera', key, value);
    });
}]);