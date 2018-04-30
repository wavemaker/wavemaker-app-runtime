/*global wm, WM, _, window, document, cordova, FileReader*/
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$DeviceFileService
 * @description
 * The 'wm.modules.wmCommon.services.$DeviceFileService' has API to manage the app file storage. App file storage are of
 * two types, 1) Temporary and 2) Persistent. Files stored in temporary will be deleted by OS at any time. Files stored
 * in Persistent area are not deleted by OS, unless there is an user initiated delete action. Following folder is
 * maintained in each of these areas.
 *
 * <pre>
 *  {app-name}
 *     |-Media
 *         |- {app name} Images     (Image extensions: gif, jpg, png, svg, webp, jpeg, jif, jfif, jfi)
 *         |- {app name} Audio      (Video extensions: mp3, m4p, aiff, aa, aax, wma)
 *         |- {app name} Videos     (Audio extensions: mp4, mpg, avi, wma, mp2, 3gp, 3g2, m4p, m4v, mpg, fiv)
 *         |- {app name} Documents  (files that are not of image or video)
 * </pre>
 * This service requires cordova-plugin-file.
 */
wm.modules.wmCommon.services.DeviceFileService = [
    '$cordovaAppVersion',
    '$cordovaFile',
    '$q',
    'DeviceService',
    'Utils',
    function ($cordovaAppVersion, $cordovaFile, $q, DeviceService, Utils) {
        'use strict';
        var self = this,
            APP_NAME,
            initializationDone,
            fileTypeVsPathMap = {
                'temporary' : {},
                'persistent' : {}
            },
            IMAGE_EXTENSIONS = ['gif', 'jpg', 'png', 'svg', 'webp', 'jpeg', 'jif', 'jfif', 'jfi'],
            VIDEO_EXTENSIONS = ['mp4', 'mpg', 'avi', 'wma', 'mp2', '3gp', '3g2', 'm4p', 'm4v', 'mpg', 'fiv'],
            AUDIO_EXTENSIONS = ['mp3', 'm4p', 'aiff', 'aa', 'aax', 'wma'],
            APP_FOLDER_STRUCTURE = [{
                "name" : "{APP_NAME}",
                "children" : [{
                    "name" : "Media",
                    "children" : [
                        {
                            "name" : "{APP_NAME} Images",
                            "fileType" : 'IMAGE'
                        },
                        {
                            "name" : "{APP_NAME} Audio",
                            "fileType" : 'AUDIO'
                        },
                        {
                            "name" : "{APP_NAME} Vedios",
                            "fileType" : 'VIDEO'
                        },
                        {
                            "name" : "{APP_NAME} Documents",
                            "fileType" : 'DOCUMENT'
                        }
                    ]
                }]
            }],
            uploadDir;

        function createFolderIfNotExists(parent, folders, fileTypeLocationMap) {
            var childPromises = [];
            _.forEach(folders, function (folder) {
                var folderPath;
                folder.name = folder.name.replace('{APP_NAME}', APP_NAME);
                folderPath = parent + folder.name + '/';
                if (folder.fileType && !fileTypeLocationMap[folder.fileType]) {
                    fileTypeLocationMap[folder.fileType] = folderPath;
                }
                childPromises.push($cordovaFile.createDir(parent, folder.name, false).then(function () {
                    return createFolderIfNotExists(folderPath, folder.children, fileTypeLocationMap);
                }, function () {
                    return createFolderIfNotExists(folderPath, folder.children, fileTypeLocationMap);
                }));
            });
            if (childPromises.length > 0) {
                return $q.all(childPromises);
            }
        }

        function newFileName(folder, fileName, defer) {
            defer = defer || $q.defer();
            $cordovaFile.checkFile(folder, fileName).then(function () {
                var extIndex = fileName.lastIndexOf('.');
                if (extIndex > 0) {
                    fileName = fileName.substring(0, extIndex) + '_' + Date.now() + '.' + fileName.substring(extIndex + 1);
                } else {
                    fileName = fileName + '_' + Date.now();
                }
                newFileName(folder, fileName, defer);
            }, function () {
                defer.resolve(fileName);
            });
            return defer.promise;
        }

        function findFileType(fileName) {
            var extension;
            if (fileName.indexOf('.') > 0) {
                extension = _.last(fileName.split('.')).toLowerCase();
                if (_.indexOf(IMAGE_EXTENSIONS, extension) >= 0) {
                    return self.IMAGE_FILE_TYPE;
                }
                if (_.indexOf(VIDEO_EXTENSIONS, extension) >= 0) {
                    return self.VIDEO_FILE_TYPE;
                }
                if (_.indexOf(AUDIO_EXTENSIONS, extension) >= 0) {
                    return self.AUDIO_FILE_TYPE;
                }
            }
            return self.DOCUMENT_FILE_TYPE;
        }

        /**
         * Create the upload directory, if not exists.
         * @returns {*}
         */
        function setupUploadDirectory() {
            var uploadsDirName = 'uploads',
                appDir = cordova.file.dataDirectory;
            return $cordovaFile.checkDir(appDir, uploadsDirName).then(function () {
                uploadDir = appDir + uploadsDirName;
            }, function () {
                return $cordovaFile.createDir(appDir, uploadsDirName).then(function () {
                    uploadDir = appDir + uploadsDirName;
                });
            });
        }

        function init() {
            var d = $q.defer();
            self.PERSISTENT_ROOT_PATH = cordova.file.dataDirectory;
            self.TEMPORARY_ROOT_PATH = cordova.file.cacheDirectory;
            $cordovaAppVersion.getAppName().then(function (appName) {
                var promises = [];
                APP_NAME = appName;
                promises.push(createFolderIfNotExists(self.TEMPORARY_ROOT_PATH,
                    APP_FOLDER_STRUCTURE,
                    fileTypeVsPathMap.temporary));
                promises.push(createFolderIfNotExists(self.PERSISTENT_ROOT_PATH,
                    APP_FOLDER_STRUCTURE,
                    fileTypeVsPathMap.persistent));
                promises.push(setupUploadDirectory());
                $q.all(promises).then(d.resolve, d.reject);
            });
            return d.promise;
        }


        /**
         * @ngdoc property
         * @name wm.modules.wmCommon.services.$DeviceFileService#PERSISTENT_ROOT_PATH
         * @propertyOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Base path of the persistent storage.
         */
        this.PERSISTENT_ROOT_PATH = null;

        /**
         * @ngdoc property
         * @name wm.modules.wmCommon.services.$DeviceFileService#TEMPORARY_ROOT_PATH
         * @propertyOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Base path of the temporary storage.
         */
        this.TEMPORARY_ROOT_PATH = null;

        /**
         * @ngdoc property
         * @name wm.modules.wmCommon.services.$DeviceFileService#IMAGE_FILE_TYPE
         * @propertyOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * A constant value to indicate image file type.
         */
        this.IMAGE_FILE_TYPE = 'IMAGE';

        /**
         * @ngdoc property
         * @name wm.modules.wmCommon.services.$DeviceFileService#VIDEO_FILE_TYPE
         * @propertyOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * A constant value to indicate video file type.
         */
        this.VIDEO_FILE_TYPE = 'VIDEO';

        /**
         * @ngdoc property
         * @name wm.modules.wmCommon.services.$DeviceFileService#AUDIO_FILE_TYPE
         * @propertyOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * A constant value to indicate audio file type.
         */
        this.AUDIO_FILE_TYPE = 'AUDIO';

        /**
         * @ngdoc property
         * @name wm.modules.wmCommon.services.$DeviceFileService#DOCUMENT
         * @propertyOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * A constant value to indicate document (anything other than image, video, audio) file type.
         */
        this.DOCUMENT_FILE_TYPE = 'DOCUMENT';

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#findFolderPath
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Determines an appropriate folder for a file based on extension in its name.
         *
         * @param {boolean} persistent boolean flag that indicates whether storage has to be persistent or not.
         * @param {string} fileName name of the file
         * @returns {object} a promise that will be resolved with folder path.
         */
        this.findFolderPath = function (persistent, fileName) {
            var typeMap = persistent ? fileTypeVsPathMap.persistent : fileTypeVsPathMap.temporary,
                fileType = findFileType(fileName);
            return typeMap[fileType] || typeMap[this.DOCUMENT_FILE_TYPE];
        };


        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#isValidPath
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Returns true, if a file exists at the given path.
         *
         * @param {string} filePath File Path
         * @returns {object} a promise that will be resolved if file exists or will be rejected if file is not there.
         */
        this.isValidPath = function (filePath) {
            var defer = $q.defer(),
                folder,
                fileName;
            if (filePath) {
                folder = filePath.substring(0, filePath.lastIndexOf('/') + 1);
                fileName = _.last(filePath.split('/'));
                $cordovaFile.checkFile(folder, fileName)
                    .then(function () {
                        defer.resolve(filePath);
                    }, defer.reject);
            } else {
                defer.reject();
            }
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#copy
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Copies a given file to an appropriate directory based on file type.
         *
         * @param {boolean} persistent indicates whether storage has to be temporary or persistant.
         * @param {string} sourceFilePath the path of file that needs to be copied.
         * @returns {object} returns a promise that is resolved with the name of the file copy.
         */
        this.copy = function (persistent, sourceFilePath) {
            var sourceFilename = _.last(sourceFilePath.split('/')),
                destFolder = this.findFolderPath(persistent, sourceFilename),
                sourceFolder = sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'));
            return newFileName(destFolder, sourceFilename).then(function (destFilename) {
                return $cordovaFile.copyFile(sourceFolder, sourceFilename, destFolder, destFilename).then(function () {
                    return destFolder + destFilename;
                });
            });
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#clearTemporaryStorage
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Removes files in temporary storage.
         *
         * @returns {object} returns a promise that is resolved when deletion is completed.
         */
        this.clearTemporaryStorage = function () {
            return $cordovaFile.removeRecursively(this.TEMPORARY_ROOT_PATH + APP_NAME + '/', 'Media');
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#listFiles
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Returns a list of files present in that directory.
         *
         * @param {string} folder path of the folder
         * @param {string} search regex pattern to search for files
         * @returns {object} returns a promise.
         */
        this.listFiles = function (folder, search) {
            var defer = $q.defer();
            window.resolveLocalFileSystemURL(folder, function (directory) {
                if (!directory.files) {
                    directory.createReader().readEntries(function (entries) {
                        if (search) {
                            entries = _.filter(entries, function (e) {
                                return e.name.match(search);
                            });
                        }
                        entries = _.map(entries, function (e) {
                            return {
                                name : e.name,
                                isDirectory : e.isDirectory,
                                path : e.nativeURL
                            };
                        });
                        defer.resolve(entries);
                    }, defer.reject);
                } else {
                    defer.resolve([]);
                }
            }, defer.reject);
            return defer.promise;
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#newFileName
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Using the given file as seed, Recursively checks in the given folder for a non-conflicting new file name.
         * A file name search is started with seed file name. If a file already exists with the name, then current time
         * is appended to the end of file name. Search continues until a new file name is found.
         *
         * @param {string} folder path of the folder
         * @param {string} seedFileName the file name to start with
         * @returns {object} returns a promise that is resolved with the non-conflicting file name.
         */
        this.newFileName = newFileName;


        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#isPersistentType
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Checks the path and return whether the file is on persistent storage or not.
         *
         * @param {string} filePath  File Path
         * @returns {boolean} returns true, if the file belongs to persistent path.
         */
        this.isPersistentType = function (filePath) {
            return _.startsWith(filePath, this.PERSISTENT_ROOT_PATH);
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#addMediaToGallery
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * If the file present at given location is a photo or video, then that file will be visible in gallery app in
         * android. 
         *
         * @param {string} filePath  File Path
         * @returns {object} returns promise.
         */
        this.addMediaToGallery = function (filePath) {
            var d = $q.defer();
            if (Utils.isAndroid() && this.isPersistentType(filePath)) {
                cordova.plugins.MediaScannerPlugin.scanFile(filePath, d.resolve, d.reject);
            } else {
                d.resolve();
            }
            return d;
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#appendToFileName
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Appends the given str to the filename at before the file extension,
         * For example:
         *  appendToFileName("globe.jpg", "_123_") results in "globe_123_.jpg"
         *
         * @param {string} fileName  default value is 'noname'.
         * @param {string} str  string to be appended. default value is timestamp.
         * @returns {object} returns promise.
         */
        this.appendToFileName = function (fileName, str) {
            var splits;
            str = str || '_' + _.now();
            fileName = fileName || 'noname';
            splits = fileName.split('.');
            if (splits.length > 1) {
                splits[splits.length - 2] = splits[splits.length - 2] + str;
                return splits.join('.');
            }
            return fileName + str;
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#removeFile
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * removes the file at the specified location.
         *
         * @param {string} filePath absolute path of file
         */
        this.removeFile = function (filePath) {
            var i = filePath.lastIndexOf('/'),
                dir = filePath.substring(0, i + 1),
                file = filePath.substring(i + 1);
            return $cordovaFile.checkFile(dir, file).then(function () {
                var resolve = $q.resolve.bind($q);
                return $cordovaFile.removeFile(dir, file).then(resolve, resolve);
            }, $q.resolve.bind($q));
        };

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$DeviceFileService#removeFile
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * removes the directory at the specified location.
         *
         * @param {string} dirPath absolute path of directory
         */
        this.removeDir = function (dirPath) {
            var i = dirPath.lastIndexOf('/'),
                parentdir = dirPath.substring(0, i + 1),
                dir = dirPath.substring(i + 1),
                movedDir = dir + _.now();
            return $cordovaFile.checkDir(parentdir, dir).then(function () {
                /**
                 * If folder is remove directly without moving, then INVALID_MODIFICATION_ERR is thrown in android
                 * when a copy opertion is done with the same directory name. To avoid this, directory will be moved
                 * first and removed.
                 */
                return $cordovaFile.moveDir(parentdir, dir, parentdir, movedDir).then(function () {
                    var resolve = $q.resolve.bind($q);
                    return $cordovaFile.removeDir(parentdir, movedDir).then(resolve, resolve);
                });
            }, $q.resolve.bind($q));
        };

        /**
         * @ngdoc
         * @name wm.modules.wmCommon.services.$DeviceFileService#getUploadDirectory
         * @methodOf wm.modules.wmCommon.services.$DeviceFileService
         * @description
         * Returns the path of upload directory
         */
        this.getUploadDirectory = function () {
            return uploadDir;
        };

        /**
         * This function returns the mime type of the file.
         * @param filePath file path
         * @returns {*} promise
         */
        this.getMimeType = function (filePath) {
            var deferred = $q.defer();

            // find the mime type of the file
            $cordovaFile.checkFile(filePath, '').then(function (entry) {
                entry.file(function (data) {
                    deferred.resolve(data.type);
                });
            }, deferred.reject);

            return deferred.promise;
        };

        if (window.cordova && window.cordova.file) {
            /**
             * Default READ_CHUNK_SIZE is 256 Kb. But with that setting readJson method is failing. This is an issue
             * with cordova file plugin. So, increasing it to 512 Kb to read large database schema files (>256 Kb).
             */
            FileReader.READ_CHUNK_SIZE = 512 * 1024;
            initializationDone = DeviceService.waitForInitialization('DeviceFileService');
            init().finally(initializationDone);
        }

    }];