/*global WM, wm*/
/*jslint todo: true */
/**
 * @ngdoc service
 * @name wm.common.$ProjectService
 * @description
 * The `ProjectService` provides the details about the project apis.
 */

wm.modules.wmCommon.services.ProjectService = function ($location, BaseService, CONSTANTS, $http, Utils) {
    'use strict';

    /* Variable to store project details */
    var projectDetails = {};

    function create(params, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "create",
            data: {
                name: params.projectName,
                description: params.description,
                templateId: params.templateId,
                icon: params.icon
            }
        }, successCallback, failureCallback);
    }

    function copy(params, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "copy",
            data: {
                packageType: 'PROJECT',
                sourceProjectId: params.projectId,
                targetProjectName: params.targetProjectName
            }
        }, successCallback, failureCallback);
    }

    function open(projectName, successCallback, failureCallback) {
        BaseService.execute({
        }, successCallback, failureCallback);
    }

    function close(projectName, successCallback, failureCallback) {
        BaseService.execute({
        }, successCallback, failureCallback);
    }

    function remove(projectID, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "remove",
            urlParams: {
                projectID: projectID
            }
        }, successCallback, failureCallback);
    }

    function get(projectID, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "get",
            urlParams: {
                projectID: projectID
            }
        }, successCallback, failureCallback);
    }

    function list(successCallback, failureCallback) {
        BaseService.execute({
            target: "Project",
            action: "list"
        }, successCallback, failureCallback);
    }

    function run(details, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "run",
            data: {
                action: "inplaceDeploy",
                projectId: details.projectId
            },
            config: details.config
        }, successCallback, failureCallback);
    }

    function deploy(projectId, projectName, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "deploy",
            data: {
                "action": "deploy",
                "projectId": projectId,
                "deploymentInfo": {
                    "applicationName": projectName,
                    "databases": [],
                    "deploymentId": null,
                    "deploymentType": "WM_CLOUD",
                    "host": "",
                    "name": "WaveMaker Cloud 2",
                    "port": 0,
                    "token": "",
                    "deploymentUrl": ""
                }
            }
        }, successCallback, failureCallback);
    }

    function clean(projectId, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "clean",
            data: {
                "action": "inplaceUndeploy",
                "projectId": projectId
            }
        }, successCallback, failureCallback);
    }

    function importProject(details, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: 'import',
            data: details.content
        }, successCallback, failureCallback);
    }

    function exportProject(details, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "export",
            data: {
                fileType: "ZIP",
                packageType: "PROJECT",
                sourceName: details.projectId,
                targetName: details.projectName,
                templateName: details.templateName
            }
        }, successCallback, failureCallback);
    }

    function exportAsTemplate(details, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "export",
            data: {
                fileType: "ZIP",
                packageType: "TEMPLATE",
                sourceName: details.projectId,
                targetName: details.targetName,
                templateName: details.templateName
            }
        }, successCallback, failureCallback);
    }

    function downloadZip(details, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "downloadZip",
            urlParams: {
                projectID: details.projectID,
                path: details.path
            }
        }, successCallback, failureCallback);
    }

    function downloadWar(projectId, successCallback, failureCallback) {

        BaseService.execute({
            target: "Project",
            action: "downloadWar",
            urlParams: {
                projectID: projectId
            }
        }, successCallback, failureCallback);
    }

    function getUsers(projectID, successCallback, failureCallback) {
        BaseService.execute({
            target: "Project",
            action: "getUsers",
            urlParams: {
                projectID: projectID
            }
        }, successCallback, failureCallback);
    }

    function addUser(params, successCallback, failureCallback) {
        BaseService.execute({
            target: "Project",
            action: "addUser",
            urlParams: {
                projectID: params.projectID
            },
            data: params.userID
        }, successCallback, failureCallback);
    }

    function removeUser(params, successCallback, failureCallback) {
        BaseService.execute({
            target: "Project",
            action: "removeUser",
            urlParams: {
                projectID: params.projectID
            },
            data: params.userID
        }, successCallback, failureCallback);
    }

    function getDetails() {
        return WM.copy(projectDetails);
    }

    function setDetails(projectInfo) {
        projectDetails = projectInfo;
    }

    function updateDetails(params, successCallback, failureCallback) {
        BaseService.execute({
            target: "Project",
            action: 'updateDetails',
            urlParams: {
                projectID: params.projectID
            },
            data: params.projectDetails
        }, function (response) {
            setDetails(response);
            Utils.triggerFn(successCallback, response);
        }, failureCallback);
    }

    function getPages() {
        return WM.copy(projectDetails.pages);
    }

    function setPages(pages) {
        projectDetails.pages = pages;
    }

    function getId() {
        if (CONSTANTS.isStudioMode) {
            return projectDetails.id;
        }
        if (CONSTANTS.isRunMode) {
            return $location.$$absUrl.split('/')[3];
        }
    }

    function getDeployedUrl() {
        var locationUrl,
            lastIndex,
            projectDeployedUrl;

        /*If $location.$$absUrl is of the form http://localhost:8080/WM2c908a52446c435b01446cfdacf50013/#/Main,
         * remove # and the page name to get only the deployed url of the project.*/
        if (CONSTANTS.isRunMode) {
            locationUrl = $location.$$absUrl;
            lastIndex = locationUrl.split("#")[0].lastIndexOf("/");
            projectDeployedUrl = locationUrl.substr(0, lastIndex);
            lastIndex = projectDeployedUrl.lastIndexOf("/");
            if (projectDeployedUrl[lastIndex + 1] === "#") {
                projectDeployedUrl = projectDeployedUrl.substr(0, lastIndex);
            }
            if (projectDeployedUrl.indexOf('http') !== -1) {
                /*Removing the protocol from the url*/
                if (projectDeployedUrl.indexOf('https:') !== -1) {
                    projectDeployedUrl = projectDeployedUrl.substr(6);
                } else {
                    projectDeployedUrl = projectDeployedUrl.substr(5);
                }
            }

            return projectDeployedUrl;
        }
    }

    function validateName(name) {
        var projectNameRegEx = /^[\w ]+$/; /* regular expression for not allowing special characters, allows space */

        /* if projectName doesn't exists, return */
        if (!name) {
            return false;
        }
        return projectNameRegEx.test(name);
    }

    function projectExists(list, name) {
        var retVal, i;
        /* if list or name doesn't exist, return  */
        retVal = !list || !name;

        for (i = 0; i < list.length; i += 1) {
            /* if name found in list, return the index */
            if (list[i].name.toLowerCase() === name.toLowerCase()) {
                retVal = true;
                break;
            }
        }
        return retVal;
    }

    function projectProvatars(url, successCallback) {
        $http.get(url).then(function (response) {
            successCallback(response);
        });
    }

    /* APIs returned by the ProjectService.*/
    return {
        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#open
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * open the project.
         *
         * @param {string} params parameters object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        create: create,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#copy
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * copy the project.
         *
         * @param {string} params parameters object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        copy: copy,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#open
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * open the project.
         *
         * @param {string} projectName Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        open: open,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#close
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * close the project.
         *
         * @param {string} projectName Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        close: close,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#delete
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * delete the project.
         *
         * @param {string} projectID Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        remove: remove,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#get
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * get the projects .
         *
         * @param {string} projectID Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        get: get,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#list
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * list all the projects .
         *
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        list: list,

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
        run: run,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#deploy
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * deploy to cloud.
         *
         * @param {string} projectId of the project
         * @param {string} projectName of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        deploy: deploy,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#clean
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * unDeploys the specified project.
         *
         * @param {string} projectId Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        clean: clean,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#clean
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * imports a project into the studio.
         *
         * @param {object} details Details object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        import: importProject,
        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#export
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * export the specified project.
         *
         * @param {object} details Details object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        export: exportProject,
        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#exportAsTemplate
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * export the specified project as template.
         *
         * @param {object} details Details object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        exportAsTemplate: exportAsTemplate,
        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#downloadZip
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * download the specified project.
         *
         * @param {object} details Details object
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        downloadZip: downloadZip,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#downloadWar
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * download the specified project.
         *
         * @param {string} projectId Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        downloadWar: downloadWar,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#getUsers
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * return all users working on this project
         *
         * @param {object} projectID Name of the project
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        getUsers: getUsers,
        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#addUser
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * add user to the project
         *
         * @param {object} params - {projectId,userId}
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        addUser: addUser,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#removeUser
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * remove user from the project
         *
         * @param {object} params - {projectId,userId}
         * @param {function} successCallback to called on success
         * @param {function} failureCallback to called on failure
         */
        removeUser: removeUser,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#getDetails
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * get Details of the current project.
         */
        getDetails: getDetails,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#setDetails
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * set Details of the current project.
         *
         * @param {object} projectDetails project Details object
         */
        setDetails: setDetails,


        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#updateDetails
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * update the Details of the current project.
         *
         * @param {object} projectDetails project Details object
         */
        updateDetails: updateDetails,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#getPages
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         *  get the pages of the current project.
         */
        getPages: getPages,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#setPages
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * set the pages of the current project.
         *
         * @param {array} pages array of the project pages
         */
        setPages: setPages,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#getId
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * returns the id of the project service based on the 'mode'.
         *
         */
        getId: getId,

        getDeployedUrl: getDeployedUrl,
        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#validateName
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * returns 'true' if the name contains special characters and javascript keywords else returns 'false'.
         *
         */
        validateName: validateName,

        /**
         * @ngdoc function
         * @name wm.common.$ProjectService#projectExists
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * returns 'true' if name already exists in the project list.
         *
         */
        projectExists: projectExists,

        /**
         * @ngdoc function,
         * @name wm.common.$ProjectService#projectProvatars
         * @methodOf wm.common.$ProjectService
         * @function
         *
         * @description
         * returns the list of project avatars.
         *
         */
        projectProvatars: projectProvatars
    };

};