/*global WM, window, cordova, _*/
/*jslint sub: true */

/*Directive for file Selector in mobile applications*/
WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/advanced/mobileFileBrowser.html',
                '<div class="app-file-browser" ng-show="show">' +
                    '<div class="modal-backdrop fade" ng-class="{in : show}"></div>' +
                    '<div class="modal fade" style="display: block;" ng-class="{in : show}" >' +
                        '<div class="modal-dialog">' +
                            '<div class="modal-content">' +
                                '<div class="modal-header clearfix">' +
                                    '<h4 class="modal-title pull-left">' +
                                        '<span ng-click="onFileClick(directory.parent)" ng-show="directory.parent">' +
                                            '<i class="wi wi-back"></i>' +
                                        '</span>' +
                                        ' {{directory.name}}' +
                                    '</h4>' +
                                    '<div ng-show="selectedFiles.length > 0" class="selected-file-button pull-right">' +
                                        '<i class="wi wi-file" ng-show="selectedFiles.length == 1"></i>' +
                                        '<i class="fa fa-files-o" ng-show="selectedFiles.length > 1"></i>' +
                                        ' {{selectedFiles.length}}' +
                                    '</div>' +
                                '</div>' +
                                '<div class="modal-body">' +
                                    '<div class="file-info-box" ng-repeat="file in directory.files">' +
                                        '<div class="file-info"  ng-class="{\'bg-primary\': file.isSelected}" ng-click="onFileClick(file)">' +
                                            '<i class="file-icon wi wi-folder" ng-if="!file.isFile"/>' +
                                            '<i class="file-icon wi wi-file {{getFileExtension(file.name)}}" ng-if="file.isFile"/>' +
                                            '<span class="file-name">{{file.name}}</span>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="modal-footer">' +
                                    '<button type="button" class="btn btn-primary" ng-show="selectedFiles && selectedFiles.length > 0" ng-click="submit()">Done</button>' +
                                    '<button type="button" class="btn btn-default" ng-click="show = false;">Close</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );
    }])
    .directive('wmMobileFileBrowser', [ '$templateCache', 'CONSTANTS', 'DeviceService', function ($templateCache, CONSTANTS, DeviceService) {
        'use strict';
        function loadFileSize(files, onComplete, index) {
            index = index || 0;
            if (index < files.length) {
                files[index].file(function (file) {
                    files[index].size = file.size;
                    loadFileSize(files, onComplete, index + 1);
                });
            } else {
                onComplete && onComplete(files);
            }
        }
        return {
            'restrict' : 'E',
            'replace'  : true,
            'template' : $templateCache.get('template/widget/advanced/mobileFileBrowser.html'),
            'scope'    : {'onSelect' : '&'},
            'link'     : function (scope) {
                var backButtonListenerDeregister;

                if (CONSTANTS.isStudioMode) {
                    return;
                }

                backButtonListenerDeregister = DeviceService.onBackButtonTap(function () {
                    if (scope.show) {
                        scope.show = false;
                        return false;
                    }
                });
                scope.$on('$destroy', function () {
                    backButtonListenerDeregister();
                });
                scope.selectedFiles = [];
                scope.directory = undefined;
                scope.getFileExtension = function (fileName) {
                    var extIndex = fileName ? fileName.lastIndexOf('.') : -1;
                    if (extIndex > 0) {
                        return fileName.substring(extIndex + 1);
                    }
                    return '';
                };
                scope.selectFile = function (file) {
                    if (!scope.multiple && scope.selectedFiles.length > 0) {
                        scope.selectedFiles[0].isSelected = false;
                        scope.selectedFiles = [];
                    }
                    scope.selectedFiles.push(file);
                    file.isSelected = true;
                };
                scope.deselectFile = function (file) {
                    _.remove(scope.selectedFiles, file);
                    file.isSelected = false;
                };
                scope.onFileClick = function (file) {
                    if (file.isFile) {
                        if (file.isSelected) {
                            scope.deselectFile(file);
                        } else {
                            scope.selectFile(file);
                        }
                    } else {
                        scope.goToDirectory(file);
                    }
                };
                scope.goToDirectory = function (directory) {
                    if (!directory.files) {
                        directory.createReader().readEntries(function (entries) {
                            directory.files = _.sortBy(entries, function (e) {
                                return (e.isFile ? '1_' : '0_') + e.name.toLowerCase();
                            });
                            directory.parent = scope.directory;
                            scope.directory = directory;
                            scope.$apply();
                        });
                    } else {
                        scope.directory = directory;
                    }
                };
                scope.submit = function () {
                    var files = [];
                    loadFileSize(scope.selectedFiles, function () {
                        _.forEach(scope.selectedFiles, function (f) {
                            f.isSelected = false;
                            files.push({ path: f.nativeURL,
                                        name: f.name,
                                        size : f.size});
                        });
                        scope.selectedFiles = [];
                        scope.show = false;
                        scope.onSelect({files: files});
                    });
                };
                scope.$watch('show', function () {
                    if (scope.show && !scope.directory) {
                        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (root) {
                            scope.goToDirectory(root);
                        });
                    }
                });
            }
        };
    }]);
