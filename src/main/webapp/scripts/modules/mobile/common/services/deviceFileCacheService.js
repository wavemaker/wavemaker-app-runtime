/*global wm, WM, _, window, document, cordova*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$DeviceFileCacheService
 * @description
 * The 'wm.modules.wmCommon.services.$DeviceFileCacheService' provides API  to manage cache. This service requires 
 * cordova-plugin-file.A cache index with url and local file mapping is maintained. This cache index is saved to a file
 * called appCache.json. During app startup, cache index is constructed from appCache.json.
 */
wm.modules.wmCommon.services.DeviceFileCacheService = [
    '$cordovaFile',
    '$q',
    '$timeout',
    'DeviceService',
    'DeviceFileService',
    'DeviceFileDownloadService',
    function ($cordovaFile, $q, $timeout, DeviceService, DeviceFileService, DeviceFileDownloadService) {
        'use strict';
        var CACHE_FILE_INDEX_NAME = 'appCache.json',
            cacheIndex = {},
            initializationDone,
            writing = false,
            waitingToWrite = false;

        function writeCacheIndexToFile() {
            if (!writing) {
                writing = true;
                $cordovaFile.writeFile(cordova.file.dataDirectory,
                    CACHE_FILE_INDEX_NAME,
                    JSON.stringify(cacheIndex),
                    true)
                    .finally(function () {
                        if (waitingToWrite) {
                            $timeout(function () {
                                writing = false;
                                waitingToWrite = false;
                                writeCacheIndexToFile();
                            }, 5000);
                        } else {
                            writing = false;
                        }
                    });
            } else {
                waitingToWrite = true;
            }
        }

        function download(url, isPersistent, defer) {
            defer = defer || $q.defer();
            return DeviceFileDownloadService.download(url, isPersistent)
                .then(function (filepath) {
                    cacheIndex[url] = filepath;
                    writeCacheIndexToFile();
                    defer.resolve(filepath);
                }, defer.reject, defer.notify);
        }

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileCacheService#invalidateCache
         * @methodOf wm.modules.wmCommon.services.$DeviceFileCacheService
         * @description
         * Invalidates the complete cache index.
         */
        this.invalidateCache = function () {
            cacheIndex = {};
            writeCacheIndexToFile();
            return DeviceFileService.clearTemporaryStorage();
        };


        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileCacheService#getLocalPath
         * @methodOf wm.modules.wmCommon.services.$DeviceFileCacheService
         * @description
         * Returns that local path that corresponds to the given url. Based on option, remote resources will also
         * be downloaded, if local path for the resource is not found.
         *
         * @param {string} url URL path
         * @param {boolean} downloadIfNotExists if true and the resource is not found, then the resource will be
         * downloaded.
         * @param {boolean} isPersistent if true, then file is saved to persistent location.
         * @returns {object} the local file path or a promise that will be resolved with local file path or will be rejected if file is
         * not found.
         */
        this.getLocalPath = function (url, downloadIfNotExists, isPersistent) {
            var defer = $q.defer(),
                filePath = cacheIndex[url];
            if (cordova.file) {
                DeviceFileService.isValidPath(filePath)
                    .then(function () {
                        defer.resolve(filePath);
                    }, function () {
                        delete cacheIndex[url];
                        if (downloadIfNotExists) {
                            download(url, isPersistent, defer);
                        } else {
                            defer.reject();
                        }
                    });
            } else {
                defer.reject('File Plugin is not available');
            }
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileCacheService#addEntry
         * @methodOf wm.modules.wmCommon.services.$DeviceFileCacheService
         * @description
         * Adds a mapping entry of given url vs corresponding filepath to the cache.
         *
         * @param {string} url URL path
         * @param {string} filepath location of file
         */
        this.addEntry = function (url, filepath) {
            cacheIndex[url] = filepath;
            writeCacheIndexToFile();
        };

        if (window.cordova && window.cordova.file) {
            initializationDone = DeviceService.waitForInitialization('DeviceFileCacheService');
            $cordovaFile.readAsText(cordova.file.dataDirectory, CACHE_FILE_INDEX_NAME)
                .then(function (content) {
                    cacheIndex = JSON.parse(content);
                }).finally(initializationDone);
        }

    }];