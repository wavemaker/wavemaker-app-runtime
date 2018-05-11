/*global wm, WM, window*/
/*Directive for fileupload */

wm.modules.wmCommon.services.FileSelectorService = ['$compile', '$rootScope', 'Utils', '$q',
    function ($compile, $rootScope, Utils, $q) {
        "use strict";
        var ele, fileSelector;

        this.open = function (config, onSelect) {
            if (!fileSelector) {
                ele = $compile('<wm-mobile-file-browser/>')($rootScope.$new());
                fileSelector = ele.isolateScope();
                WM.element('body:first').append(ele);
            }
            config = WM.extend({ multiple : false }, config);
            fileSelector.multiple = config.multiple || false;
            fileSelector.fileTypeToSelect = config.type;
            fileSelector.onSelect = function (result) {
                var selectedFiles = result.files,
                    $promisesList,
                    files;

                $promisesList = _.map(selectedFiles, function (file) {
                    return Utils.convertToBlob(file.path);
                });

                $q.all($promisesList).then(function (filesList) {
                    files = _.map(filesList, function (fileObj) {
                        var path = fileObj.filepath;
                        return {
                            'name'    : path.split('/').pop(),
                            'path'    : path,
                            'content' : fileObj.blob
                        };
                    });
                    onSelect(files);
                });
            };
            fileSelector.show = true;
        };
        this.close = function () {
            fileSelector.show = false;
        };
    }];