/*global WM, wm, window, cordova, _*/
/*jslint sub: true */

wm.variables.services.DeviceMediaService = ['$q', '$cordovaCamera', 'Utils',
    function ($q, $cordovaCamera, Utils) {
        'use strict';

        // image picker for device.
        function imagePicker() {
            var deferred = $q.defer(),
                filesObj = [];
            window.plugins.imagePicker.getPictures(
                function (files) {
                    // on success of pictures selection
                    _.each(files, function (filepath) {
                        filesObj.push({
                            'name' : filepath.split('/').pop(),
                            'path' : filepath
                        });
                    });
                    deferred.resolve(filesObj);
                },
                deferred.reject,
                {
                    'mediaType' : 0  // allows picture selection
                }
            );
            return deferred.promise;
        }

        function audioPicker(multiple) {
            var deferred          = $q.defer(),
                filesObj          = [];

            //if multiple is true allows user to select multiple songs
            //if icloud is true will show iCloud songs
            window.plugins.mediapicker.getAudio(function (files) {
                if (Utils.isAndroid()) {
                    // android returns a object with file details.
                    filesObj.push({
                        name : files.title,
                        path : files.exportedurl
                    });
                } else {
                    // iOS returns array of file detail objects.
                    _.each(files, function (file) {
                        filesObj.push({
                            name : file.title,
                            path : file.exportedurl
                        });
                    });
                }
                deferred.resolve(filesObj);
            },
                deferred.reject,
                multiple, Utils.isIphone());

            return deferred.promise;
        }

        // video picker for device.
        function videoPicker() {
            var deferred = $q.defer(),
                filesObj = [],
                cameraOptions = {
                    destinationType   : 1,  // file_uri
                    sourceType        : 0,  // photolibrary
                    mediaType         : 1  // allows video selection
                };

            $cordovaCamera.getPicture(cameraOptions)
                .then(function (filepath) {
                    // on video selection success
                    filesObj.push({
                        'name' : filepath.split("/").pop(),
                        'path' : filepath
                    });
                    deferred.resolve(filesObj);
                },
                    deferred.reject
                    );
            return deferred.promise;
        }

        this.videoPicker = videoPicker;
        this.audioPicker = audioPicker;
        this.imagePicker = imagePicker;
    }];
