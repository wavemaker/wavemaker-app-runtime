/*global WM,_*/
WM.module('wm.variables').run(['$rootScope',
    'DeviceVariableService',
    '$cordovaFileTransfer',
    'Utils',
    'DeviceFileOpenerService',
    function ($rootScope,
              DeviceVariableService,
              $cordovaFileTransfer,
              Utils,
              DeviceFileOpenerService) {
        "use strict";
        var operations,
            defaultFileTypesToOpen = {
                'doc' : {'label' : 'Microsoft Office Word Document', 'mimeType' : 'application/msword', 'extension' : 'doc'},
                'pdf' : {'label' : 'PDF Document', 'mimeType' : 'application/pdf', 'extension' : 'pdf'},
                'ppt' : {'label' : 'Microsoft Office Powerpoint', 'mimeType' : 'application/vnd.ms-powerpoint', 'extension' : 'ppt'},
                'xls' : {'label' : 'Microsoft Office Excel', 'mimeType' : 'application/vnd.ms-excel', 'extension' : 'xls'}
            };
        operations = {
            upload : {
                model: {
                    'fileName'    : '',
                    'path'        : '',
                    'length'      : 0,
                    'success'     : false,
                    'inlinePath'  : '',
                    'errorMessage': '',
                    'inProgress'  : false,
                    'loaded'       : 0
                },
                properties : [
                    {"target": "localFile", "type": "string", "value": "", "dataBinding": true},
                    {"target": "remoteFolder", "type": "string", "value": "", "dataBinding": true},
                    {"target": "onProgress", "hide" : false},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                requiredCordovaPlugins: ['FILE', 'FILETRANSFER'],
                invoke: function (variable, options, success, error) {
                    var serverUrl = $rootScope.project.deployedUrl + '/services/file/uploadFile?relativePath=' + (variable.remoteFolder || ''),
                        fileName = variable.localFile,
                        fileNameStartIndex = fileName.lastIndexOf('/'),
                        ftOptions = {fileKey : 'files',
                                       fileName: fileName,
                                       chunkedMode : false},
                        data;
                    if (fileNameStartIndex >= 0) {
                        ftOptions.fileName  = fileName.substring(fileNameStartIndex + 1);
                    }

                    ftOptions = Utils.addXsrfCookieHeader(ftOptions);
                    $rootScope.$emit('toggle-variable-state', variable, true);
                    data = {
                        'fileName'    : fileName,
                        'fileSize'    : 0,
                        'inProgress'  : true
                    };
                    variable.dataSet = data;
                    $cordovaFileTransfer.upload(serverUrl, variable.localFile, ftOptions)
                        .then(function (result) {
                            _.assignIn(data, JSON.parse(result.response)[0]);
                            data.loaded = data.length;
                            success(data);
                        }, error, function (event) {
                            data.length = event.total;
                            data.loaded = event.loaded;
                            DeviceVariableService.initiateCallback('onProgress', variable, data);
                        }).finally(function () {
                            data.inProgress = false;
                            $rootScope.$emit('toggle-variable-state', variable, false);
                        });
                }
            },
            'openFile' : {
                model: {},
                properties : [
                    {"target": "filePath", "type": "string", "value": "", "dataBinding": true},
                    {"target": "fileType", "type": "list", "options": _.mapValues(defaultFileTypesToOpen, 'label'),  "value": "pdf", "dataBinding": true},
                    {"target": "spinnerContext", "hide" : false},
                    {"target": "spinnerMessage", "hide" : false}
                ],
                invoke: function (variable, options, success, error) {
                    var fileType = defaultFileTypesToOpen[variable.fileType],
                        filePath = variable.filePath;
                    $rootScope.$emit('toggle-variable-state', variable, true);

                    // if relative path is given, then append url with deployedUrl, to access files in resources.
                    if (!Utils.isValidWebURL(filePath)) {
                        filePath = $rootScope.project.deployedUrl + '/' + filePath;
                    }
                    DeviceFileOpenerService.openRemoteFile(filePath, fileType.mimeType, fileType.extension)
                        .then(success, error)
                        .finally(function () {
                            $rootScope.$emit('toggle-variable-state', variable, false);
                        });
                }
            }
        };
        WM.forEach(operations, function (value, key) {
            DeviceVariableService.addOperation('file', key, value);
        });
}]);