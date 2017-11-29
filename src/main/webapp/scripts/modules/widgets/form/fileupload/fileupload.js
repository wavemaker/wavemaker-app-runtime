/*global WM,document,FormData, _*/
/*jslint sub: true */
/*global window*/
/*Directive for fileupload */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/fileupload.html',
                '<div class="app-fileupload" init-widget role="input">' +
                    /* drag and drop files UI in web */
                    '<div class="app-multi-file-upload" ng-if="!_isMobileType && multiple">' +
                        '<div class="drop-box" drag-files="onFileSelect($event,$files)" apply-styles>' +
                            '<i class="{{iconclass}}"/>' +
                            '<div class="message">' +
                                '<label ng-bind="caption" class="caption"></label>' +
                                '<form class="form-horizontal" name="{{scope.formName}}">' +
                                    '<input class="file-input" focus-target type="file" name="files" on-file-select="onFileSelect($event, $files)" ng-attr-accept="{{chooseFilter}}" multiple ng-disabled="disabled">' +
                                    '<a href="javascript:void(0);" class="app-anchor" ng-bind="fileuploadmessage"></a>' +
                                '</form>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    /* single file upload in web and single , multiple file upload UI in mobile runmode*/
                    '<div class="app-single-file-upload" ng-if="!_isCordova && (!multiple || _isMobileType)">' +
                        '<div class="app-button-wrapper">' +
                            '<form class="form-horizontal" name="{{scope.formName}}">' +
                            /* support for file upload in Mobileapp in its runmode (Web) */
                                '<input class="file-input" type="file" name="files" ng-if="multiple" on-file-select="onFileSelect($event, $files)" ng-attr-accept="{{chooseFilter}}" ng-disabled="disabled" multiple>' +
                                '<input class="file-input" type="file" name="files" ng-if="!multiple" on-file-select="onFileSelect($event, $files)" ng-attr-accept="{{chooseFilter}}" ng-disabled="disabled">' +
                                '<button focus-target class="app-button btn btn-default" apply-styles>' +
                                    '<i class="{{iconclass}}"></i> ' +
                                    '<span class="caption">{{caption}}</span>' +
                                '</button>' +
                            '</form>' +
                        '</div>' +
                        '<div class="app-files-upload-status single"></div>' +
                    '</div>' +
                    /* support for file upload in Mobile Application (device) */
                    '<button ng-if="_isCordova" focus-target class="app-button btn btn-default" ng-click="openFileSelector()" ng-disabled="disabled" apply-styles>' +
                        '<i class="{{iconclass}}"></i> ' +
                        '<span class="caption">{{caption}}</span>' +
                    '</button>' +
                    /* list of selectedfiles UI */
                    '<ul class="list-group file-upload" ng-style="{height: filelistheight, overflow: overflow}" ng-if="selectedFiles.length > 0 && mode === \'Select\'" >' +
                        '<li class="list-group-item file-upload-status" ng-repeat="ft in selectedFiles" >' +
                            '<div class="media upload-file-list">' +
                                '<div class="media-left media-middle file-icon {{getFileExtension(ft.name) | fileIconClass}}" title="{{getFileExtension(ft.name)}}"></div>' +
                                '<div class="media-body media-middle file-details">' +
                                    '<label class="upload-title">{{ft.name}}</label><br/>' +
                                    '<span class="filesize" ng-if="ft.fileLength  !== 0">{{ft.size | filesize:0}}</span>' +
                                '</div>' +
                            '</div>' +
                        '</li>' +
                    '</ul>' +
                    /* list of uploadedfiles UI */
                    '<ul class="list-group file-upload" ng-style="{height: filelistheight, overflow: overflow}" ng-if="fileTransfers.length > 0 && mode === \'Upload\'" >' +
                        '<li class="list-group-item file-upload-status {{ft.status}}" ng-hide="ft.status === \'abort\'" ng-repeat="ft in fileTransfers | filter : {status : \'!abort\'}" >' +
                            '<div class="media upload-file-list">' +
                                '<div class="media-left media-middle file-icon {{getFileExtension(ft.name) | fileIconClass}}" title="{{getFileExtension(ft.name)}}">' +
                                '</div>' +
                                '<div class="media-body media-middle file-details">' +
                                    '<div class="file-detail">' +
                                        '<p class="uploaddetails">' +
                                            '<label class="upload-title col-xs-8">{{ft.name}}</label>' +
                                            '<span class="text-muted filesize" ng-if="ft.fileLength  !== 0">{{ft.size | filesize:0}}</span>' +
                                        '</p>' +
                                        '<div class="progress" ng-show="ft.status === \'inprogress\'">' +
                                            '<div class="progress-bar progress-bar-striped progress-bar-info" ng-style="{width: (ft.progress +\'%\')}"></div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="media-right media-middle" ng-if="ft.status === \'inprogress\' || ft.status === \'queued\'">' +
                                    '<a class="btn btn-transparent" type="button" ng-click="abortUpload($event, ft)">' +
                                        '<i class="wi wi-stop"></i>' +
                                    '</a>' +
                                '</div>' +
                                '<div class="media-right media-middle status" ng-if="mode === \'Upload\'" ng-hide="ft.status === \'abort\' || ft.status === \'inprogress\'">' +
                                    '<span class="status-icon {{ft.status | stateClass }}"></span>' +
                                '</div>' +
                            '</div>' +
                        '</li>' +
                    '</ul>' +
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
    .directive('wmFileupload', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'wmToaster', 'Utils', 'Variables', 'ServiceFactory', '$rootScope', 'CONSTANTS', 'FileUploadService', 'FileSelectorService', 'DeviceMediaService', '$timeout', '$q', function (PropertiesFactory, $templateCache, WidgetUtilService, wmToaster, Utils, Variables, ServiceFactory, $rootScope, CONSTANTS, FileUploadService, FileSelectorService, DeviceMediaService, $timeout, $q) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.fileupload', ['wm.base', 'wm.base.advancedformwidgets', 'wm.base.events.successerror']),
            selectedUploadTypePath,
            notifyFor = {
                'uploadpath': true,
                'contenttype': true,
                'service': true,
                'operation': true,
                'mode': true,
                'multiple': true
            },
            MODE = {
                'SELECT' : 'Select',
                'UPLOAD' : 'Upload'
            },
            DEFAULT_CAPTIONS = {
                'MULTIPLE_UPLOAD'   : "Drop your files here to start uploading.",
                'MULTIPLE_SELECT'   : "Drop your files here.",
                'UPLOAD'            : 'Upload',
                'SELECT'            : 'Select'
            },
            DEVICE_CONTENTTYPES = {
                'IMAGE'   : 'image',
                'VIDEO'   : 'video',
                'AUDIO'   : 'audio',
                'FILES'   : 'files'
            },
            FILESIZE_MB = 1048576;

        /* this function returns the uploadUrl */
        function getUrlAndParamName(uploadUriPrefix, service, operation, destination) {
            var uploadUrl = '/file/uploadFile',
                variableObject,
                variableFilterData = {
                    'service'   : service,
                    'operation' : operation,
                    'category'  : 'wm.ServiceVariable'
                },
                name;
            uploadUriPrefix = uploadUriPrefix || '';
            destination     = destination ? '?relativePath=' + destination : '';
            /*fetching the variable object with service, operation*/
            variableObject = Variables.filterByVariableKeys(variableFilterData, true)[0];
            if (variableObject) {
                uploadUrl = variableObject._wmServiceOperationInfo.relativePath;
            }
            name = _.find(variableObject._wmServiceOperationInfo.parameters, {'type' : 'file'}).name || 'files';
            return {'uploadUrl' : uploadUriPrefix + uploadUrl + destination, 'fileParamName' : name};
        }

        function getAllServices(onSuccess) {
            ServiceFactory.getServicesWithType(function (response) {
                Utils.triggerFn(onSuccess, _.map(response, 'name'));
            });
        }

        /*emit event to workspace to create a service variable*/
        function createVariable(widgetId, service, operation) {
            var serviceType = ServiceFactory.getServiceObjectByName(service).type;
            $rootScope.$emit("create-service-variable", service, serviceType, operation);
            /*Saving service and operation in markup*/
            $rootScope.$emit("set-markup-attr", widgetId, {'service': service, 'operation': operation});
        }

        /* function to call user-defined on-error fn*/
        function onUploadError(scope, event) {
            if (scope._hasOnErrorEvt) {
                scope.onError({'$event': event, '$scope': scope});
                return;
            }
            if (!scope.multiple) {
                wmToaster.show('error',  'File upload failed');
            }
        }

        /* upload progress callback , called when upload is progress */
        function onUploadProgress(scope, event) {
            Utils.triggerFn(scope.onProgress, {'$event': event, '$scope': scope});
        }

        /* when upload cancelled by user, this callback will be called */
        function onUploadAbort(scope, event) {
            Utils.triggerFn(scope.onAbort, {'$event': event, '$scope': scope});
        }

        /* this function returns the response on upload success */
        function getSuccessResponse(event) {
            var response;
            if (event.target.status === 200) {
                /* Checking for empty error String from server response*/
                response = Utils.getValidJSON(event.target.response);
                if (response && response.result && response.result.error) {
                    /* Faking Internal Server Error (500) */
                    event.target.status = 500;
                    response = undefined;
                }
            }
            return response;
        }

        /* upload success callback , called when upload is sucess */
        function onUploadSuccess(scope, event) {
            // if post call failure because of 403 forbidden error,
            if (event.target.status === 403) {
                scope.uploadedFiles = [];
                onUploadError(scope, event);
                return;
            }
            if (window.FormData) { // Check for IE9
                var response = getSuccessResponse(event);
                if (response) {
                    scope.uploadedFiles.push(response[0]);
                } else {
                    onUploadError(scope, event);
                    return;
                }
            }
        }

        // Checking if the selected file is valid for the choosen filter type
        function isValidFile(filename, contenttype, extensionName, isMobileType) {
            var isValid,
                contentTypes;
            if (!contenttype) {
                return true;
            }
            contentTypes = _.toLower(contenttype).split(',');

            if (_.includes(contentTypes, 'image/*') || (_.includes(contentTypes, 'image') && isMobileType)) {
                isValid = Utils.isImageFile(filename);
                //If one of the content type chosen is image and user uploads image it is valid file
                if (isValid) {
                    return isValid;
                }
            }
            if (_.includes(contentTypes, 'audio/*') || (_.includes(contentTypes, 'audio') && isMobileType)) {
                isValid = Utils.isAudioFile(filename);
                //If one of the content type chosen is audio/* and user uploads audio it is valid file
                if (isValid) {
                    return isValid;
                }
            }
            if (_.includes(contentTypes, 'video/*') || (_.includes(contentTypes, 'video') && isMobileType)) {
                isValid = Utils.isVideoFile(filename);
                //If one of the content type chosen is video/* and user uploads video it is valid file
                if (isValid) {
                    return isValid;
                }
            }
            /*content type and the uploaded file extension should be same*/
            if (_.includes(contentTypes, '.' + _.toLower(extensionName))) {
                isValid = true;
            }
            return isValid;
        }

        /* this return the array of files which are having the file size not more than maxfilesize and filters based on contenttype */
        function getValidFiles($files, scope) {
            var validFiles = [],
                MAXFILEUPLOAD_SIZE = parseInt(scope.maxfilesize, 10) * FILESIZE_MB || FILESIZE_MB,
                MAX_FILE_UPLOAD_FORMATTED_SIZE = (scope.maxfilesize || '1') + 'MB';

            // if contenttype is files for mobile projects.
            if (scope.chooseFilter === DEVICE_CONTENTTYPES.FILES) {
                scope.chooseFilter = '';
            }

            _.forEach($files, function (file) {
                /* check for the file content type before uploading */
                if (!isValidFile(file.name, scope.chooseFilter, scope.getFileExtension(file.name), scope._isMobileType)) {
                    Utils.triggerFn(scope.onError);
                    wmToaster.show('error', 'Expected a ' + scope.contenttype + ' file');
                    return;
                }
                if (file.size > MAXFILEUPLOAD_SIZE) {
                    Utils.triggerFn(scope.onError);
                    wmToaster.show('error', 'File size exceeded limit. Max upload size is ' + MAX_FILE_UPLOAD_FORMATTED_SIZE);
                    return;
                }
                validFiles.push(file);
            });
            return validFiles;
        }

        /* this function uploads the validfiles */
        function uploadFiles($files, scope, uploadOptions) {
            var config = getUrlAndParamName(scope.uploadUrl, scope.service, scope.operation, scope.destination);
            scope.fileTransfers = FileUploadService.upload($files, config, uploadOptions);
            scope.uploadedFiles = [];
            _.map(scope.fileTransfers, function (ft) {
                ft.then(onUploadSuccess.bind(undefined, scope),
                    onUploadError.bind(undefined, scope),
                    onUploadProgress.bind(undefined, scope));
            });

            if (scope.fileTransfers.length) {
                //show success toaster after all file transfers are successful
                $q.all(scope.fileTransfers).then(function () {
                    if (scope._hasOnSuccessEvt) {
                        scope.onSuccess({'$scope': scope});
                        return;
                    }
                    wmToaster.show('success', 'File Uploaded');
                });
            }
        }

        /*Overwrite the caption only if they are default*/
        function getCaption(caption, mode, isMultiple, isMobileType) {
            if (_.includes(DEFAULT_CAPTIONS, caption)) {
                if (mode === MODE.UPLOAD) {
                    return isMultiple && !isMobileType ? DEFAULT_CAPTIONS.MULTIPLE_UPLOAD : DEFAULT_CAPTIONS.UPLOAD;
                }
                if (mode === MODE.SELECT) {
                    return isMultiple && !isMobileType ? DEFAULT_CAPTIONS.MULTIPLE_SELECT : DEFAULT_CAPTIONS.SELECT;
                }
            }
            return caption;
        }

        /**
         * Returns the data-type for properties in the widget.
         * For 'uploadedFiles', the type is dependent on the Variable against the service and operation selected
         * @param $is
         * @param prop
         * @returns {*}
         */
        function getPropertyType($is, prop) {
            var variable, type,
                types = $rootScope.dataTypes;
            switch (prop) {
            case 'uploadedFiles':
                variable = Variables.filterByVariableKeys({'service' : $is.service, 'operation' : $is.operation, 'category' : 'wm.ServiceVariable'}, true)[0];
                type = variable && variable.type;
                break;
            case 'selectedFiles':
                type = $is.widgettype + '_' + prop;
                types[type] = {
                    'fields': {
                        'name': {
                            'type': 'string'
                        },
                        'size': {
                            'type': 'number'
                        },
                        'type': {
                            'type': 'string'
                        }
                    }
                };
                if ($rootScope.isMobileApplicationType) {
                    types[type].fields['content'] = {
                        'type': 'file'
                    };
                }
                break;
            }
            return type;
        }

        return {
            restrict: 'E',
            priority: 10,
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
                    pre: function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        scope._isMobileType = $rootScope.isMobileApplicationType;
                        scope._isCordova = CONSTANTS.hasCordova;
                    },

                    post: function (scope, element, attrs) {
                        /*if the fileupload widget is inside prefab, then widget id will not be present.*/
                        var isStudioMode = CONSTANTS.isStudioMode && scope.widgetid,
                            parentPrefabScope = element.closest('.app-prefab').isolateScope(),
                            CONSTANT_FILE_SERVICE = 'FileService';
                        scope.uploadData = {
                            file: undefined,
                            uploadPath: undefined
                        };
                        scope.formName = scope.name + (scope.multiple ? '-multiple-fileupload' : '-single-fileupload');
                        scope.chooseFilter = '';
                        scope.uploadedFiles = {
                            "fileName": "",
                            "path": "",
                            "length": "",
                            "status": ""
                        };
                        scope._hasOnSuccessEvt = WM.isDefined(attrs.onSuccess);
                        scope._hasOnErrorEvt = WM.isDefined(attrs.onError);

                        scope.reset = function () {
                            //In case of upload mode
                            if (scope.fileTransfers) {
                                scope.fileTransfers.length = 0;
                            }
                            //In case of select mode
                            if (scope.selectedFiles) {
                                scope.selectedFiles.length = 0;
                            }
                        };
                        scope.uploadUrl = (parentPrefabScope && parentPrefabScope.prefabname) ? ('prefabs/' + parentPrefabScope.prefabname) : 'services';
                        /*fetching the list of the services only in studio mode for properties panel*/
                        if (isStudioMode) {
                            getAllServices(function (services) {
                                scope.widgetProps.service.options = services;
                            });
                            $rootScope.$on('update-fileupload', function (event, widgetId, serviceId) {
                                if (scope.widgetid === widgetId) {
                                    scope.service = serviceId;
                                    getAllServices(function (services) {
                                        scope.widgetProps.service.options = services;
                                    });
                                }
                            });
                        }
                        /* BOYINA: Need to check why we need this.
                        scope.uploadData = _.map(files, function (f) {
                            return {
                                file: f,
                                uploadPath: selectedUploadTypePath
                            };
                        });*/

                        /* change server path based on user option */
                        scope.changeServerUploadPath = function (path) {
                            selectedUploadTypePath = path;
                        };

                        /* this function aborts the file transfer */
                        scope.abortUpload = function (event, ft) {
                            ft.abort();
                            onUploadAbort(scope, event);
                        };

                        //Need this only in mobile
                        if (CONSTANTS.hasCordova) {
                            scope.openFileSelector = function () {
                                var uploadOptions = {formName: scope.formName};

                                // open the imagepicker view if contenttype is image.
                                if (scope.contenttype === DEVICE_CONTENTTYPES.IMAGE) {
                                    DeviceMediaService.imagePicker(scope.multiple).then(function (files) {
                                        scope.onFileSelect({}, files);
                                    });
                                    return;
                                }

                                // open the audiopicker view if contenttype is image.
                                if (scope.contenttype === DEVICE_CONTENTTYPES.AUDIO) {
                                    DeviceMediaService.audioPicker(scope.multiple).then(function (files) {
                                        scope.onFileSelect({}, files);
                                    });
                                    return;
                                }

                                //// open the videopicker view if contenttype is image.
                                if (scope.contenttype === DEVICE_CONTENTTYPES.VIDEO && Utils.isIphone()) {
                                    DeviceMediaService.videoPicker().then(function (files) {
                                        scope.onFileSelect({}, files);
                                    });
                                    return;
                                }

                                // open the file selector if contenttype is files.
                                FileSelectorService.open({multiple: scope.multiple}, function (files) {
                                    scope.onFileSelect({}, files);
                                });
                            };
                        }
                        /* this function returns the fileextension */
                        scope.getFileExtension = function (fileName) {
                            if (fileName && _.includes(fileName, '.')) {
                                return fileName.substring(fileName.lastIndexOf('.') + 1);
                            }
                            return 'file';
                        };

                        /*this function to append upload status dom elements to widget */
                        scope.onFileSelect = function ($event, $files) {
                            var uploadOptions = { formName : scope.formName};
                            scope.onSelect({
                                $event: WM.extend($event.$files || {}, $files),
                                $scope: scope
                            });
                            $files = getValidFiles($files, scope);
                            if (scope.mode === MODE.UPLOAD) {
                                uploadFiles($files, scope, uploadOptions);
                            } else {
                                scope.selectedFiles = $files;
                            }
                        };

                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal) {
                            /*Monitoring changes for styles or properties and accordingly handling respective changes.*/
                            switch (key) {
                            case 'uploadpath':
                                //BOYINA: why do we need uploadpath
                                scope.changeServerUploadPath(newVal);
                                break;
                            case 'contenttype':
                                scope.chooseFilter = newVal.split(" ").join(",");
                                break;
                            case 'service':
                                if (isStudioMode && !$rootScope.isTemplateBundleType) {
                                    if (scope.service === CONSTANT_FILE_SERVICE && !scope.operation) {
                                        scope.operation = 'uploadFile';
                                    }
                                    ServiceFactory.getServiceOperations(scope.service, function (response) {
                                        /*Pushing the operation options into the widget properties*/
                                        scope.widgetProps.operation.options = _.map(response, 'name');
                                    });
                                }
                                break;
                            case 'operation':
                                if (isStudioMode &&  scope.service && scope.operation) {
                                    createVariable(scope.widgetid, scope.service, scope.operation);
                                }
                                break;
                            case 'mode':
                            case 'multiple':
                                scope.formName = scope.name + (scope.multiple ? '-multiple-fileupload' : '-single-fileupload');
                                scope.caption = getCaption(scope.caption, scope.mode, scope.multiple, scope._isMobileType);
                                break;
                            }
                        }
                        // To be used by binding dialog to construct tree against exposed properties for the widget
                        scope.getPropertyType = getPropertyType.bind(undefined, scope);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                        $timeout(function () {
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        });
                    }
                };
            }
        };

    }])
    /* custom filter returns the filesize along with units */
    .filter('filesize', ['Utils', function (Utils) {
        'use strict';
        var units = [
            'bytes',
            'KB',
            'MB',
            'GB',
            'TB',
            'PB'
        ];

        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
                return Utils.isMobile() ? '' : '?';
            }
            var unit = 0;
            while (bytes >= 1024) {
                bytes /= 1024;
                unit++;
            }
            return bytes.toFixed(+precision) + ' ' + units[unit];
        };
    }])
    /* custom filter returns the icons depending on file upload status*/
    .filter('stateClass', function () {
        'use strict';
        var stateClassMap = {
            'success'   : 'wi wi-done text-success',
            'error'     : 'wi wi-cancel text-danger'
        };
        return function (state) {
            return stateClassMap[state.toLowerCase()];
        };
    })
    /* custom filter returns the fileicons depending on the fileextension */
    .filter('fileIconClass', function () {
        'use strict';
        var fileClassMapping = {
            'zip'       :   'fa-file-zip-o',
            'pdf'       :   'fa-file-pdf-o',
            'rar'       :   'fa-file-archive-o',
            'txt'       :   'fa-file-text-o',
            'ppt'       :   'fa-file-powerpoint-o',
            'pot'       :   'fa-file-powerpoint-o',
            'pps'       :   'fa-file-powerpoint-o',
            'pptx'      :   'fa-file-powerpoint-o',
            'potx'      :   'fa-file-powerpoint-o',
            'ppsx'      :   'fa-file-powerpoint-o',
            'mpg'       :   'fa-file-movie-o',
            'mp4'       :   'fa-file-movie-o',
            'mov'       :   'fa-file-movie-o',
            'avi'       :   'fa-file-movie-o',
            'mp3'       :   'fa-file-audio-o',
            'docx'      :   'fa-file-word-o',
            'js'        :   'fa-file-code-o',
            'md'        :   'fa-file-code-o',
            'html'      :   'fa-file-code-o',
            'css'       :   'fa-file-code-o',
            'xlsx'      :   'fa-file-excel-o',
            'png'       :   'fa-file-image-o',
            'jpg'       :   'fa-file-image-o',
            'jpeg'      :   'fa-file-image-o',
            'file'      :   'fa-file-o',
            'default'   :   'fa-file-o'
        };
        return function (fileExtension) {
            return 'fa ' + (fileClassMapping[fileExtension] || 'fa-file-o');
        };
    });
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
 * @param {boolean=} multiple
 *                  If set to true, multiple file upload is enabled. By default single file upload is enabled <br>
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
 *           <div ng-controller="Ctrl" class="wm-app">
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
