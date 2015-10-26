/*global wm, WM, FileTransfer, _*/
/*jslint sub: true */
/*Service for uploading files to backend server.*/
wm.modules.wmCommon.services.FileUploadService =  ['$rootScope', 'Utils', function ($rootScope, Utils) {
    'use strict';

    function MultiFileUploadProgressTracker(total) {
        this.total = total;
        this.totalLoaded = 0;
        this.loaded = 0;
        this.fileLoaded = 0;
        this.setProgress = function (loaded) {
            this.fileLoaded = loaded;
        };
        this.getProgress = function () {
            return {
                loaded : this.loaded + this.fileLoaded,
                total : this.total
            };
        };
        this.flush = function () {
            this.loaded += this.fileLoaded;
            this.fileLoaded = 0;
        };
    }

    /**
     * Uploads single file.
     */
    function uploadFile(uploadUrl, file, onSuccess, onError, onProgress, onAbort) {
        var ft = new FileTransfer(),
            ftOptions = {
                fileKey : 'files',
                fileName: file.name,
                chunkedMode : false
            },
            getEventHandler = function (callback) {
                return function (event) {
                    event.target = event.target || {
                        status : event.responseCode,
                        response : event.response
                    };
                    callback(event);
                };
            };
        ft.onprogress = onProgress;
        ft.upload(file.path, uploadUrl, getEventHandler(onSuccess), getEventHandler(onError), ftOptions);
        return {
            abort : function () {
                ft.abort();
                onAbort();
            }
        };
    }

    /**
     * Uploads multiple files.
     */
    function uploadFiles(uploadUrl, files, onSuccess, onError, onProgress, onAbort) {
        var completeResponse = [],
            totalSize = _.reduce(files, function (total, f) {  return total + f.size; }, 0),
            progressTracker = new MultiFileUploadProgressTracker(totalSize),
            ft = null,
            aborted = false,
            onAllFilesComplete = function (event) {
                event.target.response = JSON.stringify(completeResponse);
                onSuccess(event);
                ft = null;
            },
            onComplete = function (event) {
                completeResponse.push(Utils.getValidJSON(event.response)[0]);
                if (!aborted && files.length > 0) {
                    uploadNextFile();
                } else {
                    onAllFilesComplete(event);
                }
            },
            onProgressOverride = function (event) {
                progressTracker.setProgress(event.loaded);
                onProgress(WM.extend(event, progressTracker.getProgress()));
            },
            uploadNextFile = function () {
                progressTracker.flush();
                ft = uploadFile(uploadUrl, files.pop(), onComplete, onComplete, onProgressOverride, onAbort);
            };
        uploadNextFile();
        return {
            abort : function () {
                aborted = true;
                if (ft) {
                    ft.abort();
                }
            }
        };
    }

    this.upload = function (files, relativePath, onSuccess, onError, onProgress, onAbort) {
        var uploadUrl = $rootScope.project.deployedUrl + '/services/file/uploadFile?relativePath=' + (relativePath || "");
        if (files.length === 1) {
            return uploadFile(uploadUrl, files[0], onSuccess, onError, onProgress, onAbort);
        }
        if (files.length > 1) {
            return uploadFiles(uploadUrl, files, onSuccess, onError, onProgress, onAbort);
        }
    };
}];