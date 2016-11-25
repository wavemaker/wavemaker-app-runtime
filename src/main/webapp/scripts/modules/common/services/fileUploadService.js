/*global wm, WM, FileTransfer, _, window, FormData, XMLHttpRequest*/
/*jslint sub: true */
/*Service for uploading files to backend server.*/
wm.modules.wmCommon.services.FileUploadService =  ['$rootScope', 'Utils', '$q', 'CONSTANTS', function ($rootScope, Utils, $q, CONSTANTS) {
    'use strict';

    var FILE_UPLOAD_STATUSES = {
        'QUEUED'        : 'queued',
        'IN_PROGRESS'   : 'inprogress',
        'SUCCESS'       : 'success',
        'ERROR'         : 'error',
        'ABORTED'       : 'abort'
    };

    function transformEvent(event) {
        event.target = event.target || {
            status: event.responseCode,
            response: event.response
        };
        return event;
    }

    /* prepares file object */
    function FileTransferObject(file, transferFn, promise, abortFn) {
        this.name = file.name;
        this.size = file.size || '';
        this.status = FILE_UPLOAD_STATUSES.QUEUED;
        this.start = function () {
            if (this.status === FILE_UPLOAD_STATUSES.QUEUED) {
                this.status = FILE_UPLOAD_STATUSES.IN_PROGRESS;
                Utils.triggerFn(transferFn);
            }
        };
        this.then = function (onSuccess, onError, onProgress) {
            var self = this;
            promise.then(function (event) {
                self.status = FILE_UPLOAD_STATUSES.SUCCESS;
                Utils.triggerFn(onSuccess, event);
            }, function (event) {
                self.status = FILE_UPLOAD_STATUSES.ERROR;
                Utils.triggerFn(onError, event);
            }, function (event) {
                self.progress = Math.round(event.loaded / event.total * 100);
                Utils.triggerFn(onProgress, event);
            });
            return this;
        };
        this.finally = function (onFinal) {
            promise.finally(onFinal);
        };
        /* aborts the file upload */
        this.abort = function () {
            this.status = FILE_UPLOAD_STATUSES.ABORTED;
            Utils.triggerFn(abortFn);
            this.finally();
        };
    }

    /* upload file using fileTransfer */
    function uploadWithFileTransfer(file, url, options) {
        var defer = $q.defer(),
            ft = new FileTransfer(),
            uploadUrl = $rootScope.project.deployedUrl + '/' + url,
            ftOptions = {
                'fileKey'   : options.paramName,
                'fileName'  : file.name,
                'chunkedMode': false
            },
            transferFn = function () {
                ft.upload(file.path,
                    uploadUrl,
                    function (event) {
                        defer.resolve(transformEvent(event));
                    },
                    function (event) {
                        defer.reject(transformEvent(event));
                    },
                    ftOptions);
            };
        ft.onprogress = function (event) {
            defer.notify(transformEvent(event));
        };
        return new FileTransferObject(file, transferFn, defer.promise, ft.abort.bind(ft));
    }

    /* upload file with ajax calling */
    function uploadWithAjax(file, url, options) {
        var defer = $q.defer(),
            fd = new FormData(),
            xhr;
        /* append file to form data */
        if (WM.isArray(file)) {
            WM.forEach(file, function (fileObject) {
                if (fileObject.file && fileObject.uploadPath) {
                    fd.append(options.paramName, fileObject.file, fileObject.file.name);
                }
            });
        } else if (WM.isObject(file)) {
            fd.append(options.paramName, file, file.name);
        }
        /* create ajax xmlHttp request */
        xhr = new XMLHttpRequest();
        /* create progress,success,error,aborted event handlers */
        xhr.upload.addEventListener('progress', defer.notify.bind(defer));
        xhr.addEventListener('load', defer.resolve.bind(defer));
        xhr.addEventListener('error', defer.reject.bind(defer));
        xhr.open('POST', url);
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        return new FileTransferObject(file, xhr.send.bind(xhr, fd), defer.promise, xhr.abort.bind(xhr));
    }

    /* upload the file - IE9 support */
    function uploadWithIframe(file, url, options) {
        var defer = $q.defer(),
            uploadConfig = {
                url: url,
                formName: options.formName
            },
            transferFn = function () {
                Utils.fileUploadFallback(uploadConfig, function (event) {
                    defer.resolve(event);
                }, function (event) {
                    defer.reject(event);
                });
            };
        return new FileTransferObject(file, transferFn, defer.promise, WM.noop);
    }

    /* upload the next file depending on the status */
    function starNextFileTransfer(fts) {
        var ft = _.find(fts, function (ft) {
                return ft.status === FILE_UPLOAD_STATUSES.QUEUED;
            });
        if (ft) {
            ft.start();
            ft.finally(starNextFileTransfer.bind(undefined, fts));
        }
    }

    /* upload the max no of files at once i.e. two at once based on max*/
    function startFileTransfers(fts, max) {
        var i = 0, len = fts.length;
        while (i < max && i < len) {
            starNextFileTransfer(fts);
            i++;
        }
    }

    /**
     * This function uploads the file to the given url endpoint.
     *
     * @param file file to upload
     * @param url http endpoint to which the file has to be submitted.
     * @param options
     * @returns a promise to listen for success, event, onProgress.
     *  One can also abort the upload by simply calling abort function.
     */
    this.upload = function (files, config, options) {
        var fileTransfers = [],
            url = config.uploadUrl;
        options = _.extend({
            'paramName' : config.fileParamName
        }, options);

        if (CONSTANTS.hasCordova) {
            _.forEach(files, function (file) {
                fileTransfers.push(uploadWithFileTransfer(file, url, options));
            });
        } else if (window.FormData) {
            _.forEach(files, function (file) {
                fileTransfers.push(uploadWithAjax(file, url, options));
            });
        } else {
            _.forEach(files, function (file) {
                fileTransfers.push(uploadWithIframe(file, url, options));
            });
        }
        startFileTransfers(fileTransfers, 2);
        return fileTransfers;
    };
}];