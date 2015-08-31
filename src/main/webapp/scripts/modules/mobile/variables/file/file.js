/*global WM*/
WM.module('wm.variables').run(['$rootScope', 'MobileVariableService', '$cordovaFileTransfer', function ($rootScope, MobileVariableService, $cordovaFileTransfer) {
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
                    fileNameStartIndex = fileName.lastIndexOf('/');
                if (fileNameStartIndex >= 0) {
                    fileName  = fileName.substring(fileNameStartIndex + 1);
                }
                $cordovaFileTransfer.upload(serverUrl, variable.localFile, {fileKey : 'files', fileName: fileName})
                    .then(function (data) {
                        success(JSON.parse(data.response)[0]);
                    }, error);
            }
        }
    };
    WM.forEach(operations, function (value, key) {
        MobileVariableService.addOperation('file', key, value);
    });
}]);