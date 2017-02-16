/*global wm, WM, FileTransfer, cordova, _*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.plugins.offline.services.$OfflineFileUploadService
 * @description
 * wm.plugins.offline.services.$OfflineFileUploadService will store all uploaded files to $APP_DIR/files/uploads
 * directory and participates in the ChangeLogService flush. All local paths in the entities will be resolved the
 * remote path during flush.
 *
 */
wm.plugins.offline.services.OfflineFileUploadService = ['$cordovaFile', 'ChangeLogService', '$q', '$log',
    function ($cordovaFile, ChangeLogService, $q, $log) {
        'use strict';
        var storeKey  = 'offlineFileUpload',
            fileStore = {},
            uploadDir,
            initialized = false;

        /**
         * @ngdoc
         * @name wm.plugins.offline.services.$OfflineFileUploadService#init
         * @methodOf wm.plugins.offline.services.$OfflineFileUploadService
         * @description
         * Creates the uploads directory, if not exists.
         */
        this.init = function () {
            if (!initialized) {
                initialized = true;
                var uploadsDirName = 'uploads',
                    appDir = cordova.file.dataDirectory;
                $cordovaFile.checkDir(appDir, uploadsDirName).then(function () {
                    uploadDir = appDir + uploadsDirName;
                }, function () {
                    $cordovaFile.createDir(appDir, uploadsDirName).then(function () {
                        uploadDir = appDir + uploadsDirName;
                    });
                });
            }
        };

        /**
         * @ngdoc
         * @name wm.plugins.offline.services.$OfflineFileUploadService#uploadToServer
         * @methodOf wm.plugins.offline.services.$OfflineFileUploadService
         * @description
         * Uploads local file to the server. A mapping will be created between local path and remote path.
         * This will be used during ChangeLogService flush to resolve local paths in entities.
         * @param {object} params upload params
         * @param {function=} onSuccess callback on successful upload
         * @param {function=} onFail callback on upload failure
         */
        this.uploadToServer = function (params, onSuccess, onFail) {
            var ft = new FileTransfer();
            ft.upload(params.file, params.serverUrl, function (evt) {
                var response = JSON.parse(evt.response)[0];
                fileStore[params.file]             = response.path;
                fileStore[params.file + '?inline'] = response.inlinePath;
                onSuccess(evt);
            }, onFail, params.ftOptions);
        };

        /**
         * @ngdoc
         * @name wm.plugins.offline.services.$OfflineFileUploadService#upload
         * @methodOf wm.plugins.offline.services.$OfflineFileUploadService
         * @description
         * copies the local file to the 'uploads' directory. Actual upload to server happens during
         * ChangeLogService flush.
         * @param {string} localPath path of the file to upload
         * @param {string} serverUrl url of server to which the file has to be uploaded
         * @param {object} ftOptions file transfer options
         */
        this.upload = function (localPath, serverUrl, ftOptions) {
            var defer = $q.defer(),
                i = localPath.lastIndexOf('/'),
                soureDir = localPath.substring(0, i),
                soureFile = localPath.substring(i + 1),
                destFile = Date.now().toString();
            $cordovaFile.copyFile(soureDir, soureFile, uploadDir, destFile)
                .then(function () {
                    var filePath = uploadDir + '/' + destFile;
                    ChangeLogService.add('OfflineFileUploadService', 'uploadToServer', {
                        'file'     : filePath,
                        'serverUrl': serverUrl,
                        'ftOptions': ftOptions
                    });
                    defer.resolve({
                        'fileName'  : soureFile,
                        'path'      : filePath,
                        'length'    : 0,
                        'success'   : true,
                        'inlinePath': filePath + '?inline'
                    });
                }, defer.reject.bind());
            return defer.promise;
        };

        ChangeLogService.registerCallback({
            'preFlush' : function (flushContext) {
                fileStore = flushContext.get(storeKey);
            },
            /**
             * Replaces all local paths with the remote path using mappings created during 'uploadToServer'.
             */
            'preCall': function (change) {
                if (change.service === 'DatabaseService') {
                    change.params.data = _.mapValues(change.params.data, function (v) {
                        var remoteUrl = fileStore[v];
                        if (remoteUrl) {
                            $log.debug('swapped file path from %s -> %s', v, remoteUrl);
                            return remoteUrl;
                        }
                        return v;
                    });
                }
            }
        });

    }];