/*global WM*/
WM.module('wm.variables').run(['$rootScope', 'DeviceVariableService', '$cordovaFileTransfer', function ($rootScope, DeviceVariableService, $cordovaFileTransfer) {
    "use strict";

    var operations = {
        upload : {
            model: {
                name: '',
                path: '',
                size: 0,
                type: ''
            },
            properties : ['localFile', 'remoteFolder'],
            invoke: function (variable, options, success, error) {
                var serverUrl = $rootScope.project.deployedUrl + '/services/file/uploadFile?relativePath=' + variable.remoteFolder,
                    fileName = variable.localFile,
                    fileNameStartIndex = fileName.lastIndexOf('/'),
                    ftOptions = {fileKey : 'files',
                                   fileName: fileName,
                                   chunkedMode : false};
                if (fileNameStartIndex >= 0) {
                    ftOptions.fileName  = fileName.substring(fileNameStartIndex + 1);
                }

                $cordovaFileTransfer.upload(serverUrl, variable.localFile, ftOptions)
                    .then(function (data) {
                        success(JSON.parse(data.response)[0]);
                    }, error);
            }
        }
    };
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('file', key, value);
    });
}]);