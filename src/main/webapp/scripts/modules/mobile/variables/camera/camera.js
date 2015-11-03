/*global wm, WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaCamera', '$cordovaCapture', function (DeviceVariableService, $cordovaCamera, $cordovaCapture) {
    "use strict";

    var operations = {
        captureImage: {
            model: {
                imagePath: 'resources/images/imagelists/default-image.png'
            },
            properties: ['allowImageEdit', 'imageQuality', 'imageEncodingType', 'correctOrientation', 'imageTargetWidth', 'imageTargetHeight'],
            invoke: function(variable, options, success, error) {
                var cameraOptions = {
                    quality           : variable.imageQuality,
                    destinationType   : 1, //only file url
                    sourceType        : 1, //camera
                    allowEdit         : variable.allowImageEdit,
                    encodingType      : parseInt(variable.imageEncodingType, 10),
                    mediaType         : 0, //always picture
                    correctOrientation: variable.correctOrientation,
                    targetWidth       : variable.imageTargetWidth,
                    targetHeight      : variable.imageTargetHeight
                };
                $cordovaCamera.getPicture(cameraOptions).then(function(data) {
                    success({imagePath: data});
                }, error);
            }
        },
        captureVideo: {
            model: {
                videoPath: ''
            },
            properties: [],
            invoke: function(variable, options, success, error) {
                var videoOptions = {
                    limit   : 1
                };
                $cordovaCapture.captureVideo(videoOptions).then(function(data) {
                    success({videoPath: data[0].fullPath});
                }, error);
            }
        }
    }
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('camera', key, value);
    });
}]);