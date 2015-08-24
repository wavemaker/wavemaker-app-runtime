/*global WM,LocalFileSystem*/
/*jslint sub: true */
/*global window*/
/*Directive for fileupload */

wm.modules.wmCommon.services.FileSelectorService = ['$compile', '$rootScope',
    function ($compile, $rootScope) {
        var ele = $compile('<wm-mobile-file-browser/>')($rootScope.$new()),
            fileSelector = ele.isolateScope();
        WM.element('body:first').append(ele);
        this.open = function (config, onSelect) {
            config = WM.extend({ multiple : false }, config);
            fileSelector.multiple = config.multiple || false;
            fileSelector.onSelect = function (result) {
                onSelect(result.files);
            };
            fileSelector.show = true;
        };
        this.close = function () {
            fileSelector.show = false;
        };
    }];