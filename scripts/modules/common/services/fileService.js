/*global WM, wm*/
/*jslint todo: true */
/**
 * @ngdoc service
 * @name wm.common.$FileService
 * @description
 * The `FileService` provides the details about the project apis.
 */

wm.modules.wmCommon.services.FileService = function (BaseService, CONSTANTS) {
    'use strict';

    /* variable holding service target based on the app mode */
    var target = CONSTANTS.isRunMode ? "FILE_RUN" : "FILE";

    /* APIs returned by the FileService.*/
    return {

        /**
         * @ngdoc function
         * @name wm.common.$FileService#write
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * write into the file ( or create the file if it doesn't exist) in a page in the project.
         *
         * @param {object} params contain data of the file to be send
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        write: function (params, successCallback, failureCallback) {
            BaseService.execute({
                target: target,
                action: "write",
                urlParams: {
                    projectID: params.projectID,
                    filePath: params.path
                },
                data: params.content
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.common.$FileService#upload
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * write into the file ( or create the file if it doesn't exist) in a page in the project.
         *
         * @param {object} params contain data of the file to be send
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        upload: function (params, successCallback, failureCallback) {
            BaseService.execute({
                target: target,
                action: params.action,
                urlParams: {
                    projectID: params.projectID,
                    filePath: params.path
                },
                data: params.content
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.common.$FileService#read
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * read from the file in a page in the project.
         *
         * @param {object} params contain data of the file to be read
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        read: function (params, successCallback, failureCallback) {
            /*initialize url params*/
            var urlParams = {
                filePath: params.path
            };

            /* if in studio mode, append projectID to ural params*/
            if (CONSTANTS.isStudioMode) {
                urlParams.projectID = params.projectID;
            }

            BaseService.execute({
                target: target,
                action: "read",
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.common.$FileService#read
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * read from the file in a page in the project.
         *
         * @param {object} params contain data of the file to be read
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        remove: function (params, successCallback, failureCallback) {
            /*initialize url params*/
            var urlParams = {
                filePath: params.path
            };

            /* if in studio mode, append projectID to url params*/
            if (CONSTANTS.isStudioMode) {
                urlParams.projectID = params.projectID;
            }

            BaseService.execute({
                target: target,
                action: "remove",
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.common.$FileService#registerFileUploadWidget
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * registers the file-upload-widget to the studio.
         *
         * @param {string} projectId project id
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        registerFileUploadWidget: function (projectId, successCallback, failureCallback) {
            BaseService.execute({
                target: target,
                action: "registerFileUploadWidget",
                data: {
                    projectId: projectId,
                    action: "register"
                }
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.common.$FileService#addFolder
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * adds a new folder to the specified location
         *
         * @param {object} params contain request parameters
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        addFolder: function (params, successCallback, failureCallback) {
            BaseService.execute({
                target: target,
                action: "addFolder",
                urlParams: {
                    projectID: params.projectId,
                    folderPath: params.path
                }
            }, successCallback, failureCallback);
        }
    };
};