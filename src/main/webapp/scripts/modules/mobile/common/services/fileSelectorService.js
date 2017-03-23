/*global WM,LocalFileSystem, _*/
/*jslint sub: true */
/*global window*/
/*Directive for fileupload */

wm.modules.wmCommon.services.FileSelectorService = ['$compile', '$rootScope', 'Utils', '$q',
    function ($compile, $rootScope, Utils, $q) {
        var ele = $compile('<wm-mobile-file-browser/>')($rootScope.$new()),
            fileSelector = ele.isolateScope();

        WM.element('body:first').append(ele);
        this.open = function (config, onSelect) {
            config = WM.extend({ multiple : false }, config);
            fileSelector.multiple = config.multiple || false;
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