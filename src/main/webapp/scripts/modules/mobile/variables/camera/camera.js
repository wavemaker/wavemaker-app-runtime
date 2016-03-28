/*global wm, WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaCamera', '$cordovaCapture', function (DeviceVariableService, $cordovaCamera, $cordovaCapture) {
    "use strict";

    var operations = {
        captureImage: {
            model: {
                imagePath: 'resources/images/imagelists/default-image.png'
            },
            properties: [
                {"target": "allowImageEdit", "type": "boolean", "value" : false, "dataBinding": true},
                {"target": "imageQuality", "type": "number", "value": 80, "dataBinding": true},
                {"target": "imageEncodingType", "type": "list", "options": {"0" : "JPEG", "1" : "PNG"}, "value" : "0", "dataBinding": true},
                {"target": "correctOrientation", "type": "boolean", "value" : true, "dataBinding": true},
                {"target": "imageTargetWidth", "type": "number", "dataBinding": true},
                {"target": "imageTargetHeight", "type": "number", "dataBinding": true}
            ],
            requiredCordovaPlugins: ['CAMERA', 'CAPTURE'],
            invoke: function(variable, options, success, error) {
                var cameraOptions = {
                    quality           : variable.imageQuality,
                    destinationType   : 1, //only file url
                    sourceType        : 1, //camera
                    allowEdit         : variable.allowImageEdit,
                    encodingType      : parseInt(variable.imageEncodingType, 10),
                    mediaType         : 0, //always picture
                    correctOrientation: variable.correctOrientation,
                    targetWidth       : WM.isNumber(variable.imageTargetWidth) ?  variable.imageTargetWidth : undefined,
                    targetHeight      : WM.isNumber(variable.imageTargetHeight) ? variable.imageTargetHeight : undefined,
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
            requiredCordovaPlugins: ['CAMERA', 'CAPTURE'],
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