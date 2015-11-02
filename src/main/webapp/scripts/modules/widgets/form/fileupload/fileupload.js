/*global WM,document,FormData,XMLHttpRequest*/
/*jslint sub: true */
/*global window*/
/*Directive for fileupload */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/fileupload.html',
                '<div data-ng-show="show" class="app-fileupload" init-widget apply-styles="shell" role="input">' +
                    '<div data-ng-show="multiple" class="app-multi-file-upload">' +
                        '<div class="drop-box" drag-files="onFileSelect($event,$files)">' +
                            '<i class="{{iconclass}}"/>' +
                            '<div class="message">' +
                                '<label data-ng-bind="fileuploadtitle"></label>' +
                                    '<form class="form-horizontal" name="{{multipleFileFormName}}">' +
                                        '<input class="file-input" type="file" name="files" on-file-select="onFileSelect($event, $files)" data-ng-attr-accept="{{chooseFilter}}" multiple data-ng-disabled="disabled">' +
                                        '<a href="javascript:void(0);" class="app-anchor" data-ng-bind="fileuploadmessage"></a>' +
                                    '</form>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="app-single-file-upload" data-ng-hide="multiple">' +
                        '<div class="app-button-wrapper">' +
                            '<form class="form-horizontal" name="{{singleFileFormName}}">' +
                                '<input class="file-input" type="file"  name="files" on-file-select="uploadSingleFile($event, $files)" data-ng-attr-accept="{{chooseFilter}}" data-ng-disabled="disabled">' +
                                '<button class="app-button btn btn-default">' +
                                    '<i class="{{iconclass}}"></i> ' +
                                    '<span>{{caption}}</span>' +
                                '</button>' +
                            '</form>' +
                        '</div>' +
                        '<div class="app-files-upload-status single"></div>' +
                    '</div>' +
                    '<div class="app-files-upload-status multiple" data-ng-style="{height: height, overflow: overflow}" >' +
                        '<div class="upload-status">' +
                            '<label title="{{status_messsage}}" data-ng-bind="status_messsage" data-ng-show="showStatusMessage"></label>' +
                            '<div class="progress" data-ng-show="showProgress"><div class="progress-bar progress-bar-info progress-bar-striped" data-ng-style="{width:progressWidth}"></div></div>' +
                        '</div>' +
                        '<div class="status" data-ng-repeat="file in uploadedFiles" data-ng-show="isValidFiles()">' +
                                '<div class="action"><span class="badge" data-ng-bind="file.extension"></span></div>' +
                                '<div class="name" title="{{file.fileName}}" data-ng-bind="file.fileName"></div>' +
                                '<div class="size" title="{{file.length}}" data-ng-if="file.length !== 0" data-ng-bind="file.length | suffix: \' bytes\'"></div>' +
                                '<span class="state glyphicon" data-ng-class="{\'glyphicon-ok\' : file.status === \'success\', \'glyphicon-remove\' : file.status === \'Fail\'}"></span>' +
                                '<span data-ng-show="{{file.state === \'success\'}}" title="{{file.errorMessage}}">{{file.errorMessage}}</span>' +
                        '</div>' +
                        '<div class="action" data-ng-if="isAbortVisible"><button class="cancel glyphicon glyphicon-remove" title="Cancel" data-ng-click="abortUpload()"></button></div>' +
                    '</div>' +
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
    .directive('wmFileupload', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', '$compile', '$timeout', 'wmToaster', 'Utils', 'Variables', 'ServiceFactory', '$rootScope', 'VARIABLE_CONSTANTS', '$servicevariable', 'CONSTANTS', 'DialogService', function (PropertiesFactory, $templateCache, WidgetUtilService, $compile, $timeout, wmToaster, Utils, Variables, ServiceFactory, $rootScope, VARIABLE_CONSTANTS, $servicevariable, CONSTANTS, DialogService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.fileupload', ['wm.base', 'wm.base.editors', 'wm.base.events.successerror']),
            selectedUploadTypePath = 'resources',
            notifyFor = {
                'uploadpath': true,
                'contenttype': true,
                'service': true,
                'operation': true,
                'mode': true
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
                        var handlers = [], services = [], isPrefabInsideProject = false,
                            fetchServices = function (serviceId) {
                                services = [];
                                if (CONSTANTS.isStudioMode && isPrefabInsideProject) {
                                    return;
                                }
                                /*fetching all the services*/
                                ServiceFactory.getServicesWithType(function (response) {
                                    WM.forEach(response, function (service) {
                                        services.push(service.name);
                                    });
                                    /*Pushing the services and operation options into the widget properties*/
                                    scope.widgetProps.service.options = services;
                                    scope.service =  serviceId;
                                });
                            };
                        handlers.push($rootScope.$on('update-fileupload', function (event, widgetId, serviceId) {
                            if (scope.widgetid === widgetId) {
                                fetchServices(serviceId);
                            }
                        }));
                        scope.uploadData = {
                            file: undefined,
                            uploadPath: undefined
                        };
                        scope.chooseFilter = '';
                        scope.singleFileFormName = scope.name + '-single-fileupload';
                        scope.multipleFileFormName = scope.name + '-multiple-fileupload';
                        scope.showStatusMessage = false;
                        scope.progressWidth = '0%';
                        scope.showProgress = false;
                        scope.isAbortVisible = false;
                        scope.isAborted = false;
                        scope.fileNameSeperator = ";";
                        scope.uploadedFiles = {
                            "fileName": "",
                            "path": "",
                            "length": "",
                            "status": ""
                        };
                        scope.reset = function () {
                            scope.uploadedFiles = [];
                            scope.status_messsage = '';
                        };
                        /*fetching the list of the services only in studio mode for properties panel*/
                        if (CONSTANTS.isStudioMode && scope.service) {
                            fetchServices(scope.service);
                        }

                        /*to set the upload url for the widget*/
                        (function setUploadUrl() {
                            var parentPrefab = element.closest('.app-prefab'),
                                prefabScope,
                                prefabName;
                            /*Flag to decide whether the widget is wrapped in prefab and is in project*/
                            if (CONSTANTS.isStudioMode && !scope.widgetid) {
                                isPrefabInsideProject = true;
                            }
                            /*if the file upload is in a prefab, then get the prefab-name from the prefab's scope*/
                            if (parentPrefab) {
                                prefabScope = parentPrefab.isolateScope();
                                prefabName = prefabScope ? prefabScope.prefabname : null;
                            }
                            /*set the upload-url*/
                            scope.uploadUrl = prefabName ? ('prefabs/' + prefabName) : 'services';
                        }());

                        /* Chaange file accept filter when user changes */
                        var FILESIZE_MB = 1048576,
                        /*1 mb size in bytes*/
                            FILESIZE_KB = 1024,
                        /* 1 kb size bytes */
                            MAXFILEUPLOAD_SIZE = 31457280,
                            MAX_FILE_UPLOAD_FORMATTED_SIZE = '30MB',
                            CONSTANT_FILE_SERVICE = 'FileService',
                            MULTIPART_FORM_DATA =  "multipart/form-data",
                            operations = [],
                            xhr,
                            UPLOAD_LOCATION = '/src/main/webapp/',
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
                            wholeUploadContent = [],
                        /* function to call user-defined on-select fn*/
                            onFileSelect = function ($event, $files) {
                                $timeout(function () {
                                    scope.onSelect({
                                        $event: WM.extend($event.$files || {}, $files),
                                        $scope: scope
                                    });
                                });
                            },

                        /* this function handles different event callbacks */
                            handleEvent = function (event, eventName, eventCallback, callbackParams) {
                                if (eventName.indexOf('(') !== -1) {
                                    eventCallback({
                                        $event: event,
                                        $scope: callbackParams
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
                            },

                        /* error callback when upload is failed */
                            onFail = function (evt) {
                                scope.$apply(function () {
                                    handleEvent(evt, attrs.onError || "", scope.onError);
                                    scope.isAbortVisible = false;
                                    scope.status_messsage = 'Failed';
                                    scope.showProgress = false;
                                });
                                if (scope.multiple === false) {
                                    wmToaster.show('error',  'File upload failed');
                                }
                            },

                            handleError = function (evt) {
                                onFail(evt);
                            },


                        /* function to call user-defined on-error fn*/
                            onError = function ($event, $file) {
                                scope.onError({
                                    $event: WM.extend($event.$files || {}, $file),
                                    $scope: scope
                                });
                            },

                            getExtensionName = function (name) {
                                return name && (name.lastIndexOf('.') > -1 ? name.substring(name.lastIndexOf('.') + 1) : 'file');
                            },

                            onSuccess = function (evt) {
                                scope.filename = '';
                                scope.filepath = '';
                                if (window.FormData) { // Check for IE9
                                    var response,
                                        name = '',
                                        fileObject;
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
                                    if (scope.multiple) {
                                        WM.forEach(response, function (file, index) {
                                            name = file.fileName;
                                            scope.filename += name + ';';
                                            file.extension = getExtensionName(name);
                                            scope.filepath += file.path;
                                            if (index !== response.length - 1) {
                                                scope.filepath += ';';
                                            }
                                            file.status = file.success ? 'success' : 'fail';
                                        });
                                    } else {
                                        fileObject = response[0];
                                        name = fileObject.fileName;
                                        fileObject.extension = getExtensionName(name);
                                        scope.filename = fileObject.name;
                                        scope.filepath = fileObject.path;
                                        fileObject.status = fileObject.success ? 'success' : 'fail';
                                    }
                                    scope.uploadedFiles = response;
                                }
                                scope.$apply(function () {
                                    scope.status_messsage = 'Complete';
                                    scope.showProgress = false;
                                    scope.isAbortVisible = false;
                                    handleEvent(evt, attrs.onSuccess || "", scope.onSuccess, scope);
                                });
                                if (scope.multiple === false) {
                                    wmToaster.show('success', 'File Uploaded');
                                }
                            },

                        /* upload progress callback , called when upload is progress */
                            onProgress = function (evt) {
                                scope.$apply(function () {
                                    handleEvent(evt, attrs.onProgress || "", scope.onProgress);
                                    if (scope.isAbortVisible === false) {
                                        scope.isAbortVisible = true;
                                    }
                                    scope.showStatusMessage = true;
                                    scope.showProgress = true;
                                    scope.progressWidth = Math.round(evt.loaded * 100 / evt.total) + '%';
                                    scope.status_messsage = 'Uploading..';
                                });
                            },

                            safeAbort = function (evt) {
                                handleEvent(evt, attrs.onAbort || "", scope.onAbort);
                                scope.isAbortVisible = false;
                                scope.showStatusMessage = true;
                                scope.showProgress = false;
                                scope.status_messsage = 'Aborted';
                            },

                        /* when upload cancelled by user, this callback will be called */
                            onAbort = function (evt) {
                                if ($rootScope.$$phase || scope.$$phase) {
                                    safeAbort(evt);
                                } else {
                                    scope.$apply(function () {
                                        safeAbort(evt);
                                    });
                                }
                            },

                        /* will be triggered whenever file is chosen or dropped into dropbox */
                            uploadContent = function (newVal) {
                                var uploadConfig, fd,
                                    uploadUrl,
                                    variableObject,
                                    completeUrl,
                                    fileName;
                                xhr = undefined;
                                scope.uploadedFiles = [];
                                /*fetching the variable object with service, operation*/
                                variableObject = Variables.filterByVariableKeys({'service' : scope.service, 'operation' : scope.operation, 'category' : 'wm.ServiceVariable'}, true)[0];
                                if (variableObject) {
                                    uploadUrl = variableObject.wmServiceOperationInfo.relativePath;
                                } else {
                                    /*fallback for old projects when there is no associated variable*/
                                    uploadUrl = '/file/uploadFile';
                                }

                                completeUrl = scope.uploadUrl + uploadUrl;
                                if (scope.destination) {
                                    completeUrl += '?relativePath=' + scope.destination;
                                }

                                if (window.FormData) {
                                    if (xhr !== undefined) {
                                        return;
                                    }
                                    /* create formData */
                                    fd = new FormData();
                                    /* append file to form data */
                                    if (WM.isArray(newVal)) {
                                        WM.forEach(newVal, function (fileObject) {
                                            if (fileObject.file && fileObject.uploadPath) {
                                                fd.append('files', fileObject.file, fileObject.file.name);
                                            }
                                        });
                                    } else if (WM.isObject(newVal)) {
                                        if (newVal.file && newVal.uploadPath) {
                                            fd.append('files', newVal.file, newVal.file.name);
                                        }
                                    }
                                    /*Exposing the select files*/
                                    scope.selectedFiles = undefined;
                                    $timeout(function () {
                                        scope.selectedFiles = fd;
                                    });
                                    /*Uploading the files only when mode is Upload*/
                                    if (scope.mode === 'Select') {
                                        return;
                                    }
                                    /* create ajax xmlHttp request */
                                    xhr = new XMLHttpRequest();
                                    /* create progress,success,error,aborted event handlers */
                                    xhr.upload.addEventListener('progress', onProgress);
                                    xhr.addEventListener('load', onSuccess, null);
                                    xhr.addEventListener('error', onFail, null);
                                    xhr.addEventListener('abort', onAbort, null);
                                    xhr.open('POST', completeUrl);
                                    xhr.send(fd);
                                } else { // IE9 patch
                                    fileName = newVal[0].file.split('\\').pop();
                                    scope.uploadedFiles.push({
                                        'fileName' : fileName,
                                        'extension' : getExtensionName(fileName),
                                        'length' : 0
                                    });
                                    uploadConfig = {
                                        url: completeUrl,
                                        formName: scope.multiple ? scope.multipleFileFormName : scope.singleFileFormName
                                    };
                                    /*Uploading the files only when mode is Upload*/
                                    if (scope.mode === 'Select') {
                                        return;
                                    }
                                    Utils.fileUploadFallback(uploadConfig, onSuccess, onFail);
                                }
                            },

                        /* function to handle single and multiple file uploads*/
                            uploadFile = function ($evt, $file, statusContainer, isLastFile) {
                                var fileSize, uploadData = {};
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

                                /* to trigger upload directive upload method set the required fields of upload widget */
                                $file.formattedSize = fileSize;
                                uploadData = {
                                    file: $file,
                                    uploadPath: selectedUploadTypePath
                                };

                                /*pushing every content of the file into an array*/
                                wholeUploadContent.push(uploadData);
                                /*sending the request after we get the data of all files*/
                                if (isLastFile) {
                                    scope.uploadData = wholeUploadContent;
                                    uploadContent(wholeUploadContent);
                                }
                            },

                            getServiceType = function (service) {
                                return ServiceFactory.getServiceObjectByName(service).type;
                            },

                            /*emit event to workspace to create a service variable*/
                            createVariable = function (service, operation) {
                                scope.$root.$emit("create-service-variable", service, getServiceType(service), operation);
                                /*Saving service and operation in markup*/
                                $rootScope.$emit("set-markup-attr", scope.widgetid, {'service': service, 'operation': operation});
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
                            case 'service':
                                /*Fetching the services only if the widget is not inside a prefab and in project*/
                                if (CONSTANTS.isStudioMode && !isPrefabInsideProject) {
                                    operations = [];
                                    ServiceFactory.getServiceOperations(scope.service, function (response) {
                                        WM.forEach(response, function (operation) {
                                            operations.push(operation.name);
                                        });
                                        /*Pushing the operation options into the widget properties*/
                                        scope.widgetProps.operation.options = operations;
                                        if (scope.service === CONSTANT_FILE_SERVICE) {
                                            scope.operation = 'uploadFile';
                                        } else {
                                            scope.operation = '';
                                        }
                                    });
                                }
                                break;
                            case 'operation':
                                /*Fetching the services only if the widget is not inside a prefab and in project*/
                                if (CONSTANTS.isStudioMode && !isPrefabInsideProject) {
                                    if (scope.service && scope.operation) {
                                        createVariable(scope.service, scope.operation);
                                    }
                                }
                                break;
                            case 'mode':
                                scope.caption = scope.mode;
                                break;
                            }
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                        scope.fileUploadHandlers = {
                            onSuccess : onSuccess,
                            onProgress : onProgress,
                            onError : onFail,
                            onAbort : onAbort
                        };
;
                        /* change server path based on user option */
                        scope.changeServerUploadPath = function (path) {
                            selectedUploadTypePath = path;
                        };

                        /* Abort upload when user clicked cancel upload */
                        scope.abortUpload = function () {
                            xhr.abort();
                        };

                        /*this function to append upload status dom elements to widget */
                        scope.onFileSelect = function ($event, $files) {
                            var last = false,
                                filesCount = $files.length,
                                index,
                                statusEle;
                            /*call on-select event-fn*/
                            onFileSelect($event, $files);
                            statusEle = element.find('.app-files-upload-status.multiple');
                            wholeUploadContent = [];
                            for (index = 0; index < filesCount; index += 1) {
                                if (index === filesCount - 1) {
                                    last = true;
                                }
                                uploadFile($event, $files[index], statusEle, last);
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
                            if ($file.length) {
                                /* to call on-select event-fn*/
                                onFileSelect($evt, $file);
                                /* Delete previous html node , when new file is uploading */
                                var statusEle = element.find('.app-files-upload-status.single');
                                statusEle.html('');
                                wholeUploadContent = [];
                                uploadFile($evt, $file[0], statusEle, true);
                            }
                        };

                        scope.isValidFiles = function () {
                            return WM.isArray(scope.uploadedFiles) && scope.uploadedFiles.length;
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
