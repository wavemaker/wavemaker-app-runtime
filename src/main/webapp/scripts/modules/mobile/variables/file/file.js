/*global WM*/
WM.module('wm.variables').run(['$rootScope', 'DeviceVariableService', '$cordovaFileTransfer', 'Utils', function ($rootScope, DeviceVariableService, $cordovaFileTransfer, Utils) {
    "use strict";

    var operations = {
        upload : {
            model: {
                'fileName'    : '',
                'path'        : '',
                'length'      : 0,
                'success'     : false,
                'inlinePath'  : '',
                'errorMessage': ''
            },
            properties : [
                {"target": "localFile", "type": "string", "value": "", "dataBinding": true},
                {"target": "remoteFolder", "type": "string", "value": "", "dataBinding": true}
            ],
            requiredCordovaPlugins: ['FILE', 'FILETRANSFER'],
            invoke: function (variable, options, success, error) {
                var serverUrl = $rootScope.project.deployedUrl + '/services/file/uploadFile?relativePath=' + (variable.remoteFolder || ''),
                    fileName = variable.localFile,
                    fileNameStartIndex = fileName.lastIndexOf('/'),
                    ftOptions = {fileKey : 'files',
                                   fileName: fileName,
                                   chunkedMode : false};
                if (fileNameStartIndex >= 0) {
                    ftOptions.fileName  = fileName.substring(fileNameStartIndex + 1);
                }

                ftOptions = Utils.addXsrfCookieHeader(ftOptions);

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