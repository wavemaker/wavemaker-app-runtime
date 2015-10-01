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
         * @name wm.common.$FileService#readDir
         * @methodOf wm.common.$FileService
         * @function
         *
         * @description
         * read from the directory in the project.
         *
         * @param {object} params contain data of the directory to be read
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        readDir: function (params, successCallback, failureCallback) {
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
                action: "readDir",
                urlParams: urlParams
            }, successCallback, failureCallback);
        }
    };
};