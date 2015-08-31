/*global WM, FileTransfer, window*/
/*jslint sub: true */
/*Directive for extending fileupload functionality for mobile applications.*/

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/mobileFileupload.html',
            '<button class="app-button btn btn-default" data-ng-click="openFileSelector()">' +
                '<i class="{{iconclass}}"></i> ' +
                '<span>{{caption}}</span>' +
            '</button>'
            );
    }]).directive('wmFileupload', ['$compile', '$templateCache', 'FileUploadService', 'FileSelectorService', 'CONSTANTS', function ($compile, $templateCache, FileUploadService, FileSelectorService,  CONSTANTS) {
        'use strict';

        return {
            restrict: 'E',
            priority: 1,
            link : function (scope, element) {
                scope = element.isolateScope();
                //Need this only in mobile
                if (CONSTANTS.hasCordova) {
                    var overrideContent = $compile($templateCache.get('template/widget/form/mobileFileupload.html'))(scope);
                    element.prepend(overrideContent).find('>.app-multi-file-upload, >.app-single-file-upload').remove();
                    scope.openFileSelector = function () {
                        var ft = { abort : WM.noop };
                        FileSelectorService.open({multiple : scope.multiple}, function (files) {
                            ft.abort = FileUploadService.upload(files,
                                                        scope.destination,
                                                        scope.fileUploadHandlers['onSuccess'],
                                                        scope.fileUploadHandlers['onError'],
                                                        scope.fileUploadHandlers['onProgress'],
                                                        scope.fileUploadHandlers['onAbort']).abort;
                        });
                        scope.abortUpload = function () {
                            ft.abort();
                        };
                    };
                }
            }
        };
    }]);