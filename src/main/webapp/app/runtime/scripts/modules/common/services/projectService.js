/*global WM, wm*/
/*jslint todo: true */
/**
 * @ngdoc service
 * @name wm.common.$ProjectService
 * @description
 * The `ProjectService` provides the details about the project apis.
 */

wm.modules.wmCommon.services.ProjectService = function (BaseService, CONSTANTS) {
    'use strict';

    function run(details, successCallback, failureCallback) {
        var target = CONSTANTS.isRunMode ? 'Project_Run' : 'Project';
        BaseService.execute({
            target: target,
            action: "run",
            data: {
                action: "inplaceDeploy",
                projectId: details.projectId
            },
            config: details.config
        }, successCallback, failureCallback);
    }

    /* APIs returned by the ProjectService.*/
    return {

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#run
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * deploy and run the specified project.
         *
         * @param {object} details Details object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        run: run
    };

};