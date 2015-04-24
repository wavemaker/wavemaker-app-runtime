/*global WM,document,FormData,XMLHttpRequest*/
/*jslint sub: true */
/*global window*/
/*Directive for fileupload */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/fileupload.html',
                '<div data-ng-show="show" class="app-fileupload" init-widget ' + $rootScope.getWidgetStyles("shell") + ' >' +
                    '<div data-ng-show="multiple" class="app-multi-file-upload">' +
                        '<div class="drop-box" drag-files="onFileSelect($event,$files)">' +
                            '<i class="{{iconclass}}"/>' +
                            '<div class="message">' +
                                '<label data-ng-bind="fileuploadtitle"></label>' +
                                    '<form class="form-horizontal" name="{{multipleFileFormName}}" enctype="multipart/form-data">' +
                                        '<input class="file-input" type="file" name="file" on-file-select="onFileSelect($event, $files)" data-ng-attr-accept="{{chooseFilter}}" multiple>' +
                                        '<a href="javascript:void(0);" class="app-anchor" data-ng-bind="fileuploadmessage"></a>' +
                                    '</form>' +
                            '</div>' +
                        '</div>' +
                        '<div class="app-files-upload-status multiple" data-ng-style="{height: height, overflow: overflow}" ></div>' +
                    '</div>' +
                    '<div class="app-single-file-upload" data-ng-hide="multiple">' +
                        '<div class="app-button-wrapper">' +
                            '<form class="form-horizontal" name="{{singleFileFormName}}" enctype="multipart/form-data" >' +
                                '<input class="file-input" type="file"  name="file" on-file-select="uploadSingleFile($event, $files)" data-ng-attr-accept="{{chooseFilter}}">' +
                                '<button class="app-button btn btn-default">' +
                                    '<i class="{{iconclass}}"></i> ' +
                                    '<span>{{caption}}</span>' +
                                '</button>' +
                            '</form>' +
                        '</div>' +
                        '<div class="app-files-upload-status single"></div>' +
                    '</div>' +
                '</div>');

        $templateCache.put('template/widget/form/upload-directive.html',
                '<div class="status">' +
                              '<div class="action"><span class="badge" data-ng-bind="fileExtension"></span></div>' +
                    '<div class="name" title="{{fileName}}" data-ng-bind="fileName"></div>' +
                    '<div class="size" title="{{fileSize}}" data-ng-bind="fileSize"></div>' +
                    '<div class="upload-status">' +
                        '<div class="progress" data-ng-hide="showStatusMessage"><div class="progress-bar progress-bar-info progress-bar-striped" data-ng-style="{width:progressWidth}"></div></div>' +
                        '<label title="{{status_messsage}}" data-ng-bind="status_messsage" data-ng-show="showStatusMessage"></label>' +
                    '</div>' +
                    '<div class="action" data-ng-if="isAbortVisible"><button class="cancel glyphicon glyphicon-remove" title="Cancel" data-ng-click="abortUpload()"></button></div>' +
                '</div>');
    }])
    .directive('onFileSelect', ['$parse', '$timeout', function ($parse, $timeout) {
        'use strict';
        return function (scope, elem, attrs) {
            /*get the function reference from the directive*/
            var fn = $parse(attrs['onFileSelect']);
            elem.bind('change', function (evt) {
                /* get the selected file references */
                var files = [], fileList, i;
                if (window.FormData) {
                    fileList = evt.target.files;
                    if (fileList.length !== null) {
                        for (i = 0; i < fileList.length; i += 1) {
                            files[i] = fileList.item(i);
                        }
                    }
                } else { // for IE9, IE9 doesn't have FormData File API
                    files = [this.value];
                }
                /* call the function by passing file references */
                $timeout(function () {
                    fn(scope, {
                        $files: files,
                        $event: evt
                    });
                });
            });
            /* make previous value to null if user selects files again */
            elem.bind('click', function () {
                this.value = null;
            });
        };
    }])
    /* Test directive to test drag and drop test of browser */
    .directive('dropAvailable', ['$parse', '$timeout', function ($parse, $timeout) {
        'use strict';
        return function (scope, elem, attrs) {
            /*check whether dom element contains draggable element*/
            if (document.createElement('span').hasOwnProperty('draggable')) {
                var fn = $parse(attrs['dropAvailable']);
                $timeout(function () {
                    fn(scope);
                });
            }
        };
    }])
    .directive('dragFiles', ['$parse', '$timeout', function ($parse, $timeout) {
        'use strict';
        return function (scope, elem, attrs) {
            /*check whether dom element contains draggable element*/
            var div = document.createElement('div'), fn,
                dragDropSupport = ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
            if (dragDropSupport) {
                fn = $parse(attrs['dragFiles']);
                elem.bind('dragenter', function (evt) {
                    evt.preventDefault();
                });
                elem.bind('dragover', function (evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    /*add specific class for styling when user dragged into drop box*/
                    elem.addClass('file-dragover');
                });
                elem.bind('dragleave', function () {
                    elem.removeClass('file-dragover');
                });
                elem.bind('drop', function (evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    elem.removeClass('file-dragover');
                    /* get the dropped file references */
                    var files = [],
                        fileList = evt.originalEvent.dataTransfer.files,
                        i;
                    if (fileList !== null) {
                        for (i = 0; i < fileList.length; i += 1) {
                            files.push(fileList.item(i));
                        }
                    }
                    /* pass the file references to parsed function and invocate it*/
                    $timeout(function () {
                        fn(scope, {
                            $files: files,
                            $event: evt
                        });
                    });
                });

            }
        };
    }])
    .directive('uploadDirective', ['$templateCache', '$rootScope', 'DialogService', 'Utils', 'wmToaster', function ($templateCache, $rootScope, DialogService, Utils, wmToaster) {
        'use strict';
        var UPLOAD_SERVICE = 'resources/upload?relativePath=',
            UPLOAD_LOCATION = 'resources/uploads/';
        return {
            replace: true,
            restrict: 'E',
            template: $templateCache.get('template/widget/form/upload-directive.html'),
            scope: true,
            link: function (scope, element, attrs) {
                var xhr;
                scope.uploadData = {
                    file: undefined,
                    uploadPath: undefined
                };
                scope.showStatusMessage = true;
                scope.status_messsage = 'Waiting..';
                scope.isAbortVisible = false;
                scope.progressWidth = '0%';
                scope.isAborted = false;
                scope.fileNameSeperator = ";";

                /*to set the upload url for the widget*/
                (function setUploadUrl() {
                    var parentPrefab = element.closest('.app-prefab'),
                        prefabScope,
                        prefabName;
                    /*if the file upload is in a prefab, then get the prefab-name from the prefab's scope*/
                    if (parentPrefab) {
                        prefabScope = parentPrefab.isolateScope();
                        prefabName = prefabScope ? prefabScope.prefabname : null;
                    }
                    /*set the upload-url*/
                    scope.uploadUrl = prefabName ? ('prefabs/' + prefabName + '/' + UPLOAD_SERVICE) : 'services/' + UPLOAD_SERVICE;
                }());

                /* this function handles different event callbacks */
                function handleEvent(event, eventName, eventCallback, callbackParams) {
                    if (eventName.indexOf('(') !== -1) {
                        eventCallback({
                            $event: event,
                            params: callbackParams
                        });
                    } else {
                        if (eventName.indexOf('.show') > -1) {
                            DialogService.showDialog(eventName.slice(0, eventName.indexOf('.show')));
                            return;
                        }
                        if (eventName.indexOf('.hide') > -1) {
                            DialogService.hideDialog(eventName.slice(0, eventName.indexOf('.hide')));
                            return;
                        }
                        $rootScope.$emit('invoke-service', eventName, {scope: element.scope()});
                    }
                }

                /* upload progress callback , called when upload is progress */
                function onProgress(evt) {
                    scope.$apply(function () {
                        handleEvent(evt, attrs.onProgress || "", scope.onProgress);
                        if (scope.isAbortVisible === false) {
                            scope.isAbortVisible = true;
                        }
                        scope.showStatusMessage = false;
                        scope.progressWidth = Math.round(evt.loaded * 100 / evt.total) + '%';
                    });
                }

                /* error callback when upload is failed */
                function onFail(evt) {
                    scope.$apply(function () {
                        handleEvent(evt, attrs.onError || "", scope.onError);
                        scope.isAbortVisible = false;
                        scope.showStatusMessage = true;
                        scope.status_messsage = 'Failed';
                    });
                    if (scope.multiple === false) {
                        wmToaster.show('error',  'File upload failed');
                    }
                }

                /* handle the error based on status code */
                function handleError(evt) {
                    onFail(evt);
                }

                /* upload success call back, when upload is successfully completed */
                function onSuccess(evt) {
                    if (window.FormData) { // Check for IE9
                        var response;

                        if (evt.target.status !== 200) {
                            handleError(evt);
                            return;
                        }

                        /* Checking for empty error String from server response*/
                        response = Utils.getValidJSON(evt.target.response);
                        if (!response) {
                            response = null;
                        }
                        if (response && response.result && response.result.error) {
                            evt.target.status = 500;
                            /* Faking Internal Server Error (500) */
                            handleError(evt);
                            return;
                        }
                    }
                    scope.$apply(function () {
                        scope.showStatusMessage = true;
                        scope.status_messsage = 'Complete';
                        scope.isAbortVisible = false;
                        scope.filename = (scope.filename && scope.multiple ? scope.filename + scope.fileNameSeperator : "") + scope.fileName;
                        scope.filepath = (scope.filepath && scope.multiple ? scope.filepath + scope.fileNameSeperator : "")  + scope.filePath;
                        handleEvent(evt, attrs.onSuccess || "", scope.onSuccess, scope.filePath);
                    });
                    if (scope.multiple === false) {
                        wmToaster.show('success', 'File Uploaded');
                    }
                }

                function safeAbort(evt) {
                    handleEvent(evt, attrs.onAbort || "", scope.onAbort);
                    scope.isAbortVisible = false;
                    scope.showStatusMessage = true;
                    scope.status_messsage = 'Aborted';
                }

                /* when upload cancelled by user, this callback will be called */
                function onAbort(evt) {
                    if ($rootScope.$$phase || scope.$$phase) {
                        safeAbort(evt);

                    } else {
                        scope.$apply(function () {
                            safeAbort(evt);
                        });
                    }
                }

                /* will be triggered whenever file is chosen or dropped into dropbox */
                scope.uploadContent = function (newVal) {
                    var uploadConfig, fd;
                    if (window.FormData) {
                        if (newVal.file && newVal.uploadPath) {
                            if (xhr !== undefined) {
                                return;
                            }
                            /* create formData */
                            fd = new FormData();
                            /* append file to form data */
                            fd.append('file', newVal.file, newVal.file.name);
                            /* create ajax xmlHttp request */
                            xhr = new XMLHttpRequest();
                            /* create progress,success,error,aborted event handlers */
                            xhr.upload.addEventListener('progress', onProgress);
                            xhr.addEventListener('load', onSuccess, null);
                            xhr.addEventListener('error', onFail, null);
                            xhr.addEventListener('abort', onAbort, null);
                            xhr.open('POST', scope.uploadUrl + newVal.destination);
                            xhr.send(fd);
                            scope.fileSize = newVal.file.formattedSize;
                            scope.fileName = newVal.file.name;
                            scope.filePath = UPLOAD_LOCATION + newVal.destination;
                            if (scope.filePath.charAt(scope.filePath.length - 1) === '/') {
                                scope.filePath += scope.fileName;
                            } else {
                                scope.filePath +=  '/' + scope.fileName;
                            }
                        }
                    } else { // IE9 patch
                        uploadConfig = {
                            url: scope.uploadUrl + newVal.destination,
                            formName: scope.singlefileupload ? scope.singleFileFormName : scope.multipleFileFormName
                        };
                        Utils.fileUploadFallback(uploadConfig, onSuccess, onFail);
                        scope.fileSize = '';
                        scope.fileName = newVal.file.split('\\').pop();
                        scope.filePath = newVal.file;
                    }
                    scope.fileExtension = scope.fileName.substring(scope.fileName.lastIndexOf('.') + 1);
                };

                /* Abort upload when user clicked cancel upload */
                scope.abortUpload = function () {
                    xhr.abort();
                };
            }
        };
    }])
    .directive('wmFileupload', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', '$compile', '$timeout', 'wmToaster', 'Utils', function (PropertiesFactory, $templateCache, WidgetUtilService, $compile, $timeout, wmToaster, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.fileupload', ['wm.base', 'wm.base.editors', 'wm.base.events.successerror']),
            selectedUploadTypePath = 'resources',
            notifyFor = {
                'uploadpath': true,
                'contenttype': true,
                'destination': true
            };
        return {
            restrict: 'E',
            replace: true,
            scope: {
                'onSelect': '&',
                'onSuccess': '&',
                'onError': '&',
                'onProgress': '&',
                'onAbort': '&'
            },
            template: $templateCache.get('template/widget/form/fileupload.html'),
            compile: function () {
                return {
                    pre: function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;

                    },

                    post: function (scope, element, attrs) {
                        scope.chooseFilter = '';
                        scope.singleFileFormName = scope.name + '-single-fileupload';
                        scope.multipleFileFormName = scope.name + '-multiple-fileupload';
                        /* Chaange file accept filter when user changes */
                        var FILESIZE_MB = 1048576,
                        /*1 mb size in bytes*/
                            FILESIZE_KB = 1024,
                        /* 1 kb size bytes */
                            MAXFILEUPLOAD_SIZE = 31457280,
                            MAX_FILE_UPLOAD_FORMATTED_SIZE = '30MB',
                            changeFilter = function (choosen) {
                                if (choosen.indexOf('all') > -1) {
                                    scope.chooseFilter = '';
                                } else {
                                    var filters = [];
                                    if (choosen.indexOf('image') > -1) {
                                        filters.push('image/*');
                                    }
                                    if (choosen.indexOf('audio') > -1) {
                                        filters.push('audio/*');
                                    }
                                    if (choosen.indexOf('video') > -1) {
                                        filters.push('video/*');
                                    }
                                    if (filters.length > 0) {
                                        scope.chooseFilter = filters.join();
                                    }
                                }
                            },
                            getFileSize = function (fileSize) {
                                var size;
                                if (fileSize > FILESIZE_MB) {
                                    size = (Math.round(fileSize * 100 / FILESIZE_MB) / 100).toString() + 'MB';
                                } else {
                                    size = (Math.round(fileSize * 100 / FILESIZE_KB) / 100).toString() + 'KB';
                                }
                                return size;
                            },
                        /* function to call user-defined on-select fn*/
                            onFileSelect = function ($event, $files) {
                                $timeout(function () {
                                    scope.onSelect({
                                        $event: WM.extend($event.$files || {}, $files),
                                        $scope: scope
                                    });
                                });
                            },
                        /* function to call user-defined on-error fn*/
                            onError = function ($event, $file) {
                                scope.onError({
                                    $event: WM.extend($event.$files || {}, $file),
                                    $scope: scope
                                });
                            },
                        /* function to handle single and multiple file uploads*/
                            uploadFile = function ($evt, $file, statusContainer) {
                                var uploadWidget, compiled, widgetScope, fileSize, uploadData = {};
                                /* Checking if the selected file is valid for the choosen filter type */
                                if (!scope.isValidFile($file.name)) {
                                    onError($evt, $file);
                                    wmToaster.show('error', 'Expected a ' + scope.contenttype + ' file');
                                    return;
                                }
                                if ($file.size) {
                                    fileSize = getFileSize($file.size);
                                } else {
                                    fileSize = '';
                                }
                                /* if file size exceeds limit , throw error message */
                                if ($file.size > MAXFILEUPLOAD_SIZE) {
                                    onError($evt, $file);
                                    wmToaster.show('error', 'FILE SIZE EXCEEDED LIMIT. MAX UPLOAD SIZE IS ' + MAX_FILE_UPLOAD_FORMATTED_SIZE);
                                    return;
                                }

                                /* create upload status directive for each selected or dropped file */
                                uploadWidget = WM.element('<upload-directive></upload-directive>');
                                uploadWidget.attr({
                                    'on-success': attrs.onSuccess,
                                    'on-abort': attrs.onAbort,
                                    'on-select': attrs.onSelect,
                                    'on-progress': attrs.onProgress
                                });
                                WM.element(statusContainer).append(uploadWidget);
                                compiled = $compile(uploadWidget)(scope);
                                widgetScope = compiled.scope();

                                /* to trigger upload directive upload method set the required fields of upload widget */
                                $file.formattedSize = fileSize;
                                uploadData = {
                                    file: $file,
                                    uploadPath: selectedUploadTypePath,
                                    destination: scope.destination || ''
                                };
                                widgetScope.uploadData = uploadData;
                                widgetScope.uploadContent(uploadData);
                            };

                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal) {
                            /*Monitoring changes for styles or properties and accordingly handling respective changes.*/
                            switch (key) {
                            case 'uploadpath':
                                scope.changeServerUploadPath(newVal);
                                break;
                            case 'contenttype':
                                changeFilter(newVal);
                                break;
                            case 'destination':
                                scope.destination = newVal;
                                break;
                            }
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                        /* change server path based on user option */
                        scope.changeServerUploadPath = function (path) {
                            selectedUploadTypePath = path;
                        };

                        /*this function to append upload status dom elements to widget */
                        scope.onFileSelect = function ($event, $files) {
                            /*call on-select event-fn*/
                            onFileSelect($event, $files);
                            var index, statusEle;
                            statusEle = element.find('.app-files-upload-status.multiple');
                            for (index = 0; index < $files.length; index += 1) {
                                uploadFile($event, $files[index], statusEle);
                            }
                        };

                        /* Checking if the selected file is valid for the choosen filter type */
                        scope.isValidFile = function (filename) {
                            var isValid;
                            switch (scope.contenttype) {
                            case 'image':
                                isValid = Utils.isImageFile(filename);
                                break;
                            case 'audio':
                                isValid = Utils.isAudioFile(filename);
                                break;
                            case 'video':
                                isValid = Utils.isVideoFile(filename);
                                break;
                            case 'all':
                                isValid = true;
                                break;
                            }
                            return isValid;
                        };

                        /* Upload the single file using upload directive */
                        scope.uploadSingleFile = function ($evt, $file) {
                            /* to call on-select event-fn*/
                            onFileSelect($evt, $file);
                            /* Delete previous html node , when new file is uploading */
                            var statusEle = element.find('.app-files-upload-status.single');
                            statusEle.html('');
                            uploadFile($evt, $file[0], statusEle);
                        };
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };

    }]);
/*Directive for FileUpload */
/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmFileupload
 * @restrict E
 *
 * @description
 * The `wmFileupload` directive is used to upload single/upload multiple files. It gives the drag and drop options form multiple fileupload.
 * fileupload widget shows the progress bar and preview of the fileupload,also one can abort the upload when the upload is progress.
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $location
 * @requires $compile
 * @requires $timeout
 * @requires $parse
 * @requires DialogService
 * @requires Utils
 * @requires wmToaster
 *
 * @param {string=} name
 *                  Name of the fileupload widget.
 * @param {string=} caption
 *                  Caption/Label for the fileupload widget. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the fileupload widget.
 * @param {string=} width
 *                  Width of the fileupload widget.
 * @param {string=} height
 *                  Height of the file upload widget.
 * @param {string=} title
 *                  Title of the Fileuplaod widget. <br>
 *                  Default value: `Drop your files here to start uploading`
 * @param {string=} message
 *                  Message of the Fileuplaod widget. <br>
 *                  Default value: `You can also browse for files`
 * @param {boolean=} singlefileupload
 *                  Switch to single to multiple or multiple to single  file upload widgets. <br>
 *                  Default value: `false`.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the file upload widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} filtertype
 *                  filters for the file input. <br>
 *                  Possible values are `all`, `audio`, `image`, and `video`. <br>
 *                  Default value: `all`.
 * @param {string=} uploadpath
 *                  path to the folder in server where to store. <br>
 *                  By default it stores in 'resources' folder in server. <br>
 *                  This is a bindable property.
 * @param {string=} iconclass
 *                  This property defines the class of the icon that is applied to the button. <br>
 *                  This is a bindable property.
 * @param {string=} on-success
 *                  Callback function which will be triggered when the file upload is success.
 * @param {string=} on-error
 *                  Callback function which will be triggered when the file upload results in an error.
 * @param {string=} on-select
 *                  Callback function which will be triggered when the tab is selected.
 * @param {string=} on-progress
 *                  Callback function which will be triggered when the file upload operation is in progress.
 * @param {string=} on-abort
 *                  Callback function which will be triggered when the file upload operation is aborted.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <wm-fileupload on-success="success($event)" on-fail="fail($event)"></wm-fileupload>
 *               <toaster-container toaster-options="{'limit': 1,'time-out': 2000, 'position-class': 'toast-bottom-right'}"></toaster-container>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope,wmToaster) {
 *              $scope.success = function ($event) {
 *                 wmToaster.show("success", "SUCCESS", "successfully uploaded");
 *              }
 *              $scope.fail=function($event){
 *                wmToaster.show("error", "ERROR", "upload failed");
 *              }
 *           }
 *       </file>
 *   </example>
 */
