/*global wm, WM, _, cordova, window*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$DeviceFileOpenerService
 * @description
 * The 'wm.modules.wmCommon.services.$DeviceFileOpenerService' downloads (if necessary) and opens a file or a url.
 */
wm.modules.wmCommon.services.DeviceFileOpenerService = [
    '$cordovaFile',
    '$cordovaFileOpener2',
    '$q',
    'DeviceService',
    'DeviceFileService',
    'DeviceFileCacheService',
    'DeviceFileDownloadService',
    'Utils',
    function ($cordovaFile,
              $cordovaFileOpener2,
              $q,
              DeviceService,
              DeviceFileService,
              DeviceFileCacheService,
              DeviceFileDownloadService,
              Utils) {
        'use strict';
        var downloadsFolder,
            initializationDone;

        /**
         * downloads the file at the url to downloads folder.
         *
         * @param url
         * @param extension extension (jpg, pdf) will be appended to the name of the downloaded file
         * @returns {*}
         */
        function generateFileName(url, extension) {
            var fileName = _.split(url, '?')[0];
            fileName = _.last(_.split(fileName, '/'));
            fileName = DeviceFileService.appendToFileName(fileName, _.now());
            if (extension) {
                return _.split(fileName, '.')[0] + '.' + extension;
            }
            return fileName;
        }

        /**
         * If the file is downloaded earlier, then the file path is returned. Otherwise, file is downloaded
         * and its path is returned.
         * @param url
         * @param extension if the file has to be downloaded, then extension (jpg, pdf) will be appended.
         * @returns a promise that is resolved with corresponding file path.
         */
        function getLocalPath(url, extension) {
            var defer = $q.defer();
            DeviceFileCacheService.getLocalPath(url)
                .then(function (filePath) {
                    var fileName, i, fromDir, fromFile;
                    //Is it part of downloaded folder.
                    if (_.startsWith(filePath, downloadsFolder)) {
                        defer.resolve(filePath);
                    } else {
                        fileName = generateFileName(url, extension);
                        i = filePath.lastIndexOf('/');
                        fromDir = filePath.substring(0, i);
                        fromFile = filePath.substring(i + 1);
                        $cordovaFile.copyFile(fromDir, fromFile, downloadsFolder, fileName)
                            .then(function () {
                                var newFilePath = downloadsFolder + fileName;
                                DeviceFileCacheService.addEntry(url, newFilePath);
                                defer.resolve(newFilePath);
                            });
                    }
                }, function () {
                    var fileName = generateFileName(url, extension);
                    DeviceFileDownloadService.download(url, false, downloadsFolder, fileName)
                        .then(function (filePath) {
                            DeviceFileCacheService.addEntry(url, filePath);
                            defer.resolve(filePath);
                        }, defer.reject);
                });
            return defer.promise;
        }

        /**
         * Creates (if not exists) a download folder.
         * @returns {*}
         */
        function init() {
            var downloadsParent,
                defer = $q.defer();
            if (Utils.isAndroid()) {
                downloadsParent = cordova.file.externalCacheDirectory;
            } else if (Utils.isIOS()) {
                downloadsParent = cordova.file.documentsDirectory + 'NoCloud/';
            } else {
                downloadsParent = cordova.file.dataDirectory;
            }
            $cordovaFile.createDir(downloadsParent, 'downloads').finally(function () {
                downloadsFolder = downloadsParent + 'downloads/';
                defer.resolve();
            });
            return defer.promise;
        }

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileOpenerService#openRemoteFile
         * @methodOf wm.modules.wmCommon.services.$DeviceFileOpenerService
         * @description
         * Opens the file at the given url. If the file was downloaded earlier, then file is opened.
         * Otherwise, file is downloaded and opened.
         * @param {string} url location of file
         * @param {string} mimeType Mime type is required to suggest applications to use to open the file.
         * @param {string} extension extension to add to the name of the file downloaed.
         * @returns {object} a promise that will be resolved when the file is opened.
         */
        this.openRemoteFile = function (url, mimeType, extension) {
            return getLocalPath(url, extension)
                .then(function (filePath) {
                    return $cordovaFileOpener2.open(filePath, mimeType);
                });
        };

        if (window.cordova && window.cordova.file) {
            initializationDone = DeviceService.waitForInitialization('DeviceFileOpenerService');
            init().finally(initializationDone);
        }
    }];