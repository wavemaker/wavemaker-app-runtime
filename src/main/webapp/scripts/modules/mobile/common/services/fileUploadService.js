/*global WM, FileTransfer*/
/*jslint sub: true */
/*Service for uploading files to backend server.*/

wm.modules.wmCommon.services.FileUploadService =  ['$rootScope', function ($rootScope) {
    'use strict';

    function MultiFileUploadProgressTracker(total){
        this.total = total;
        this.totalLoaded = 0;
        this.fileLoaded = 0;
        this.setProgress = function (loaded) {
            this.fileLoaded = loaded;
        };
        this.getProgress = function () {
            return {
                loaded : this.loaded + this.fileLoaded,
                total : this.total
            }
        };
        this.prepareForNextFile = function () {
            this.fileLoaded = 0;
        };
    }

    /**
     * Uploads multiple files.
     */
    function uploadFiles (uploadUrl, files, onSuccess, onError, onProgress, onAbort) {
        var completeResponse = [],
            totalSize = _.reduce(files, function(total, f) {  return total + f.size; }, 0),
            progressTracker = new MultiFileUploadProgressTracker(totalSize),
            ft = null,
            onAllFilesComplete = function () {
                event.target.response = JSON.stringify(completeResponse);
                onSuccess(event);
                ft = null;
            },
            onComplete = function (event) {
                completeResponse.push(Utils.getValidJSON(event.response)[0]);
                if (files.length > 0) {
                    uploadNextFile();
                } else {
                    onAllFilesComplete();
                }
            },
            onProgressOverride = function (event) {
                progressTracker.setProgress(event.loaded);
                WM.extend(event, progressTracker.getProgress());
                onProgress(event);
            },
            uploadNextFile = function () {
                progressTracker.prepareForNextFile();
                ft = uploadFile(uploadUrl, files.pop(), onComplete, onComplete, onProgressOverride, onAbort);
            };
        uploadNextFile();
        return {
            abort : function () {
                ft && ft.abort();
            }
        };
    }
    /**
     * Uploads single file.
     */
    function uploadFile(uploadUrl, file, onSuccess, onError, onProgress, onAbort) {
        var ft = new FileTransfer(),
            ftOptions = {
                fileKey : 'files',
                fileName: file.name
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

    this.upload = function (files, relativePath, onSuccess, onError, onProgress, onAbort) {
        var uploadUrl = $rootScope.project.deployedUrl +'/services/file/uploadFile?relativePath=' + (relativePath || "");
        if (files.length == 1) {
            return uploadFile(uploadUrl, files[0], onSuccess, onError, onProgress, onAbort);
        } else if (files.length > 1){
            return uploadFiles(uploadUrl, files, onSuccess, onError, onProgress, onAbort);
        }
    };
}];