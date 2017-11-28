/*global window, wm, WM, FileTransfer, cordova, _*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.plugins.offline.services.$OfflineFileUploadService
 * @description
 * wm.plugins.offline.services.$kOfflineFileUploadService will store all uploaded files to $APP_DIR/files/uploads
 * directory and participates in the ChangeLogService flush. All local paths in the entities will be resolved the
 * remote path during flush.
 *
 */
wm.plugins.offline.services.OfflineFileUploadService = [
    '$cordovaFile',
    'ChangeLogService',
    '$q',
    'DeviceService',
    'DeviceFileService',
    function ($cordovaFile,
              ChangeLogService,
              $q,
              DeviceService,
              DeviceFileService) {
        'use strict';
        var uploadDir;

        /**
         * @ngdoc
         * @name wm.plugins.offline.services.$OfflineFileUploadService#uploadToServer
         * @methodOf wm.plugins.offline.services.$OfflineFileUploadService
         * @description
         * Uploads local file to the server directly.
         * @param {object} params upload params
         * @param {function=} onSuccess callback on successful upload
         * @param {function=} onFail callback on upload failure
         */
        this.uploadToServer = function (params, onSuccess, onFail) {
            var ft = new FileTransfer();
            ft.upload(params.file, params.serverUrl, function (evt) {
                onSuccess(JSON.parse(evt.response)[0]);
                if (params.deleteOnUpload) {
                    DeviceFileService.removeFile(params.file);
                }
            }, onFail, params.ftOptions);
        };

        /**
         * @ngdoc
         * @name wm.plugins.offline.services.$OfflineFileUploadService#upload
         * @methodOf wm.plugins.offline.services.$OfflineFileUploadService
         * @description
         * copies the local file to the 'uploads' directory and adds an entry to offline change log so that file gets
         * actually uploaded in the next flush.
         * @param {string} localPath path of the file to upload
         * @param {string} serverUrl url of server to which the file has to be uploaded
         * @param {object} ftOptions file transfer options
         */
        this.upload = function (localPath, serverUrl, ftOptions) {
            var defer = $q.defer(),
                i = localPath.lastIndexOf('/'),
                soureDir = localPath.substring(0, i),
                soureFile = localPath.substring(i + 1),
                destFile = DeviceFileService.appendToFileName(soureFile);
            $cordovaFile.copyFile(soureDir, soureFile, uploadDir, destFile)
                .then(function () {
                    var filePath = uploadDir + '/' + destFile;
                    ChangeLogService.add('OfflineFileUploadService', 'uploadToServer', {
                        'file'     : filePath,
                        'serverUrl': serverUrl,
                        'ftOptions': ftOptions,
                        'deleteOnUpload' : true
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
        DeviceService.whenDeviceReady().then(function () {
            uploadDir = DeviceFileService.getUploadDirectory();
        });
    }];