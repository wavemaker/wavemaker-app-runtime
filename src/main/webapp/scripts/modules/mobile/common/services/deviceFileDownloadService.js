/*global wm, WM, _, cordova, window*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$DeviceFileDownloadService
 * @description
 * The 'wm.modules.wmCommon.services.$DeviceFileDownloadService' manages the download of files.This service requires
 * cordova-plugin-file.
 */
wm.modules.wmCommon.services.DeviceFileDownloadService = [
    '$cordovaFile',
    '$cordovaFileTransfer',
    '$q',
    'DeviceFileService',
    function ($cordovaFile, $cordovaFileTransfer, $q, DeviceFileService) {
        'use strict';
        var downloadQueue = [],
            concurrentDownloads = 0,
            MAX_CONCURRENT_DOWNLOADS = 2;

        //Start processing a download request
        function downloadFile(req) {
            concurrentDownloads++;
            if (!req.destFile) {
                req.destFile = _.split(req.url, '?')[0];
                req.destFile = _.last(_.split(req.destFile, '/'));
            }
            if (!req.destFolder) {
                req.destFolder = DeviceFileService.findFolderPath(req.isPersistent, req.destFile);
            }
            return DeviceFileService.newFileName(req.destFolder,  req.destFile)
                .then(function (newFileName) {
                    var filePath = req.destFolder + newFileName;
                    return $cordovaFileTransfer.download(req.url, filePath.replace(/ /g, "%20"), {trustAllHosts : true}, true)
                        .then(function () {
                            concurrentDownloads--;
                            return filePath;
                        }, function (response) {
                            concurrentDownloads--;
                            $cordovaFile.removeFile(req.destFolder, req.destFile);
                            throw new Error("Failed to downloaded  " + req.url + " with error " + JSON.stringify(response));
                        });
                });
        }

        function downloadNext() {
            var req;
            if (downloadQueue.length > 0) {
                req = downloadQueue.shift();
                downloadFile(req).then(function (filePath) {
                    req.defer.resolve(filePath);
                    downloadNext();
                }, function () {
                    req.defer.reject();
                    downloadNext();
                }, req.defer.notify);
            }
        }

        //Adds to download request queue
        function addToDownloadQueue(url, isPersistent, destFolder, destFile) {
            var defer = $q.defer();
            if (cordova.file) {
                downloadQueue.push({
                    url: url,
                    isPersistent: isPersistent,
                    destFolder: destFolder,
                    destFile: destFile,
                    defer: defer
                });
                if (concurrentDownloads < MAX_CONCURRENT_DOWNLOADS) {
                    downloadNext();
                }
            } else {
                defer.reject('cordova-plugin-file is required.');
            }
            return defer.promise;
        }

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileDownloadService#download
         * @methodOf wm.modules.wmCommon.services.$DeviceFileDownloadService
         * @description
         * Downloads
         *
         * @param {string} url URL to resource to be downloaded
         * @param {string} isPersistent Boolean flag that indicates whether Storage has to be persistent or temporary
         * @returns {Object} A promise object that will be resolved with downloaded file path.
         */
        this.download = addToDownloadQueue;

    }];