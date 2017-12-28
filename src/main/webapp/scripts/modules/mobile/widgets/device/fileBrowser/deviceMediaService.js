/*global WM, wm, window, cordova, _, FileReader, resolveLocalFileSystemURL, Blob */
/*jslint sub: true */

wm.variables.services.DeviceMediaService = ['$q', '$cordovaCamera', 'Utils', 'wmSpinner',
    function ($q, $cordovaCamera, Utils, wmSpinner) {
        'use strict';

        function getFileName(filepath) {
            return filepath.split('/').pop();
        }

        /**
         * Converts the file to blob using filepath
         * @param filePaths, array of file paths
         * @returns fileObj having name, path, content
         */
        function getFiles(filePaths) {
            var deferred  = $q.defer(),
                filesObj,
                $promises;

            $promises = _.map(filePaths, Utils.convertToBlob);

            $q.all($promises)
                .then(function (filesList) {
                    filesObj = _.map(filesList, function (fileObj) {
                        var path = fileObj.filepath;
                        return {
                            'name'    : getFileName(path),
                            'path'    : path,
                            'content' : fileObj.blob
                        };
                    });
                    deferred.resolve(filesObj);
                }, deferred.reject);

            return deferred.promise;
        }

        // image picker for device.
        function imagePicker(multiple) {
            var deferred = $q.defer(),
                maxImg = 1;

            if (multiple) {
                maxImg = 10;
            }
            window.imagePicker.getPictures(
                function (files) {
                    getFiles(files)
                        .then(deferred.resolve, deferred.reject);
                },
                deferred.reject,
                {
                    mediaType : 0,  // allows picture selection
                    maxImages: maxImg
                }
            );
            return deferred.promise;
        }

        function audioPicker(multiple) {
            var deferred = $q.defer(),
                filePaths,
                spinnerId = wmSpinner.show();

            //if multiple is true allows user to select multiple songs
            //if icloud is true will show iCloud songs
            window.plugins.mediapicker.getAudio(function (files) {
                if (Utils.isAndroid()) {
                    filePaths = [];
                    // android returns a object with file details.
                    filePaths.push(files.exportedurl);
                } else {
                    // iOS returns array of file detail objects.
                    filePaths = _.map(files, 'exportedurl');
                }
                getFiles(filePaths)
                    .then(deferred.resolve, deferred.reject);
            }, deferred.reject, multiple, Utils.isIphone());
            deferred.promise.finally(function () {
                wmSpinner.hide(spinnerId);
            });
            return deferred.promise;
        }

        // video picker for device.
        function videoPicker() {
            var deferred = $q.defer(),
                cameraOptions = {
                    destinationType   : 1,  // file_uri
                    sourceType        : 0,  // photolibrary
                    mediaType         : 1  // allows video selection
                };

            $cordovaCamera.getPicture(cameraOptions)
                .then(function (filepath) {
                    getFiles([filepath])
                        .then(deferred.resolve, deferred.reject);
                }, deferred.reject);

            return deferred.promise;
        }

        this.videoPicker = videoPicker;
        this.audioPicker = audioPicker;
        this.imagePicker = imagePicker;
    }];
