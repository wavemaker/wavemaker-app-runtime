/*global WM, wm, window, _*/
/*jslint todo: true */
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.prefab.$PrefabManager
 * @description
 * The `PrefabManager` service provides the methods for prefab actions.
 */

WM.module('wm.prefabs')
    .service('PrefabManager', [
        '$rootScope',
        '$timeout',
        '$ocLazyLoad',
        'PrefabService',
        'ProjectService',
        'Variables',
        'Utils',
        'wmToaster',
        'CONSTANTS',
        'i18nService',
        '$q',
        '$interval',
        'DialogService',
        'FileService',

        function ($rs, $timeout, $ocLazyLoad, PrefabService, ProjectService, Variables, Utils, wmToaster, CONSTANTS, i18nService, $q, $interval, DialogService, FileService) {
            'use strict';

            var studioPrefabNamePropertiesMap = {},
                studioPrefabNameConfigMap = {},
                appPrefabNamePropertiesMap = {},
                appPrefabNameConfigMap = {},
                activePrefabConfig,
                pendingTasks = {
                    resources: {}
                },
                projectDetails,
                versionMismatchMessages = {},
                prefabScriptCache = {},
                appPrefabs,
                workspacePrefabs;

            function getProjectId() {
                if (projectDetails) {
                    return projectDetails.id;
                }

                projectDetails = ProjectService.getDetails();
                return projectDetails && projectDetails.id;
            }

            /*@TODO: Deprecated. to be removed
             * update the studio-prefab properties in studioPrefabNamePropertiesMap
             */
            function onStudioPrefabsLoad(prefabs) {
                prefabs.forEach(function (prefab) {
                    studioPrefabNamePropertiesMap[prefab.name] = prefab;
                });
            }

            /*@TODO: Deprecated. to be removed
             * Get the list of studio-prefabs and update studioPrefabNamePropertiesMap.
             * returns promise.
             */
            function listStudioPrefabs() {
                studioPrefabNamePropertiesMap = {};
                return PrefabService.list().then(onStudioPrefabsLoad);
            }

            /*
             * update the app-prefab properties in appPrefabNamePropertiesMap
             */
            function onAppPrefabsLoad(prefabs) {
                prefabs.forEach(function (prefab) {
                    appPrefabNamePropertiesMap[prefab.name] = prefab;
                });
            }

            /*
             * Get the list of app-prefabs and update appPrefabNamePropertiesMap.
             * This method fetches the app-prefab properties in synchronous way.
             * Triggers the callback on success
             */
            function listAppPrefabs(callback) {

                appPrefabNamePropertiesMap = {};

                Utils.fetchContent(
                    'json',
                    Utils.preventCachingOf('services/projects/' + getProjectId() + '/prefabs'),
                    function (response) {
                        onAppPrefabsLoad(response);
                        Utils.triggerFn(callback);
                    },
                    function () {
                        wmToaster.show('error', $rs.locale.MESSAGE_ERROR_TITLE, $rs.locale.MESSAGE_ERROR_PROJECT_PREFAB_LIST_FAILED_DESC);
                    },
                    true
                );
            }

            /**
             * function merges the prefab configs from the studio and project
             * @returns prefab list
             */
            function processPrefabsList() {
                var deferred    = $q.defer();

                var projectPrefabs = Object.keys(appPrefabNamePropertiesMap),
                    studioPrefabs  = Object.keys(studioPrefabNamePropertiesMap),
                    prefabList     = _.union(projectPrefabs, studioPrefabs),
                    mergedPrefabs = {},
                    prefabObj;
                //this will merge the prefabs, first priority is given for the prefabs in project
                _.forEach(prefabList, function (prefabName) {
                    if (appPrefabNamePropertiesMap[prefabName]) {
                        prefabObj = appPrefabNamePropertiesMap[prefabName];
                        prefabObj.loadPrefabResource = true;
                    } else {
                        prefabObj = studioPrefabNamePropertiesMap[prefabName];
                    }
                    if (appPrefabNamePropertiesMap[prefabName] && !studioPrefabNamePropertiesMap[prefabName]) { //if the prefab is not in studio and exists in the project then categorize it as project prefab
                        prefabObj.isProjectPrefab = true;
                    }
                    if (appPrefabNamePropertiesMap[prefabName]) {
                        prefabObj.isPrefabInUse = true;
                    }
                    prefabObj.iconUrl = prefabObj.icon;
                    mergedPrefabs[prefabName] = prefabObj;
                });
                deferred.resolve(mergedPrefabs);

                return deferred.promise;
            }
            /*
             * Get the config.json of application prefab in synchronous way and trigger the callback with the response.
             */
            function loadAppPrefabConfig(prefabName, callback) {
                var configUrl,
                    config;

                config = appPrefabNameConfigMap[prefabName];

                if (config) {
                    Utils.triggerFn(callback, config);
                } else {
                    configUrl = CONSTANTS.isRunMode
                        ? 'app/prefabs/' + prefabName + '/config.json'
                        : Utils.getProjectResourcePath(getProjectId()) + 'WEB-INF/prefabs/' + prefabName + '/webapp/config.json';

                    Utils.fetchContent(
                        'json',
                        Utils.preventCachingOf(configUrl),
                        function (response) {
                            appPrefabNameConfigMap[prefabName] = response;
                            Utils.triggerFn(callback, response);
                        },
                        function () {
                            wmToaster.show('error', $rs.locale.MESSAGE_PREFAB_CONFIG_ERROR_TITLE, $rs.locale.MESSAGE_PREFAB_CONFIG_ERROR_DESC);
                        },
                        true
                    );
                }
            }

            /*
             * Get the config.json of studio-prefab in asynchronous way.
             * Returns a promise.
             */
            function loadStudioPrefabConfig(prefabName) {
                var configUrl, deferred = $q.defer();

                configUrl = 'services/prefabs/' + studioPrefabNamePropertiesMap[prefabName].id + '/files/webapp/config.json';

                Utils.fetchContent(
                    'json',
                    Utils.preventCachingOf(configUrl),
                    function (response) {
                        studioPrefabNameConfigMap[prefabName] = response;
                        deferred.resolve(response);
                    },
                    function (error) {
                        delete studioPrefabNamePropertiesMap[prefabName];
                        delete studioPrefabNameConfigMap[prefabName];
                        //wmToaster.show('error', $rs.locale.MESSAGE_PREFAB_CONFIG_ERROR_TITLE, $rs.locale.MESSAGE_PREFAB_CONFIG_ERROR_DESC);
                        //wmLogger.error("GOT_RESPONSE_FROM_SERVER", "Prefab config file error");
                        deferred.reject(error);
                    }
                );
                return deferred.promise;
            }

            /*
             * Get the config.json of prefabs in project in asynchronous way.
             * Returns a promise.
             */
            function loadProjectPrefabsConfig(prefabName) {
                var configUrl,
                    deferred = $q.defer();

                projectDetails = ProjectService.getDetails();
                configUrl      = 'services/projects/' + (projectDetails.studioProjectId || projectDetails.id) + '/prefabs/' + prefabName + '/files/config.json';
                //fetch the content from the prefab files directory in the project
                Utils.fetchContent(
                    'json',
                    Utils.preventCachingOf(configUrl),
                    function (response) {
                        appPrefabNameConfigMap[prefabName] = response;
                        deferred.resolve(response);
                    },
                    function (error) {
                        delete appPrefabs[prefabName];
                        delete appPrefabNameConfigMap[prefabName];
                        deferred.reject(error);
                    }
                );
                return deferred.promise;
            }

            /*
             * Get the config.json of all prefabs in project.
             * Configs are loaded in asynchronous way.
             * returns a promise
             */
            function getAppPrefabsConfig(isReloadRequest) {
                var deferred    = $q.defer(),
                    prefabNames = Object.keys(appPrefabNamePropertiesMap),
                    count       = prefabNames.length;

                function onConfigLoad() {
                    count -= 1;
                    if (!count) {
                        var content = Utils.getClonedObject(appPrefabNamePropertiesMap);
                        prefabNames
                            .forEach(function (prefabName) {
                                content[prefabName].config = appPrefabNameConfigMap[prefabName];
                            });
                        deferred.resolve(content);
                    }
                }
                /*
                * if the studio page has prefab then the directive will load the app prefab config, so do not load the config again
                * if it is a reload request then skip the check
                * if the appPrefabNamePropertiesMap is empty i.e project doesn't have prefabs in use then just resolve the request
                * */
                //if the studio page has prefabs then the prefab directive will load the config for the template, so do not load them again. (ignore if it is a prefab reload request)
                if (_.isEmpty(appPrefabNamePropertiesMap) || (!isReloadRequest && _.isEqual(_.keys(appPrefabNameConfigMap), _.keys(appPrefabNamePropertiesMap)))) {
                    deferred.resolve();
                } else {
                    if (isReloadRequest) { //empty the config only if it is a reload request
                        appPrefabNameConfigMap = {};
                    }
                    prefabNames.forEach(function (prefabName) {
                        loadProjectPrefabsConfig(prefabName)
                            .finally(onConfigLoad);
                    });
                }
                return deferred.promise;
            }


            /*
             * Get the config.json of all studio-prefabs.
             * Configs are loaded in asynchronous way.
             * returns a promise
             */
            function getAllStudioPrefabsConfig(appPrefabs, forceReload) {

                var deferred = $q.defer(),
                    prefabNames = Object.keys(studioPrefabNamePropertiesMap),
                    count = prefabNames.length;

                studioPrefabNameConfigMap = {};

                function onConfigLoad() {
                    count -= 1;
                    if (!count) {
                        var content = Utils.getClonedObject(studioPrefabNamePropertiesMap);
                        Object
                            .keys(studioPrefabNameConfigMap)
                            .forEach(function (prefabName) {
                                content[prefabName].config = studioPrefabNameConfigMap[prefabName];
                            });
                        deferred.resolve(content);
                    }
                }

                prefabNames.forEach(function (prefabName) {
                    //if the prefab config exists in the project then just ignore the workspace
                    if (appPrefabNamePropertiesMap[prefabName] && !forceReload) {
                        count -= 1;
                        return;
                    }
                    loadStudioPrefabConfig(prefabName)
                        .finally(onConfigLoad);
                });

                return deferred.promise;
            }

            /*
             * returns true if the version of the studio-prefab is not same as the app-prefab
             */
            function isPrefabVersionMismatch(prefabName) {
                var prefab = getProjectPrefab(prefabName);
                return prefab.workspaceVersion && (prefab.status === 'DEV' || prefab.version !== prefab.workspaceVersion);
            }

            /**
             * this function returns the filtered prefabs in development mode
             * @param prefabs
             */
            function getDevStatusPrefabs(prefabs) {
                return _.filter(prefabs, function (prefabConfig) {
                    return prefabConfig.status === 'DEV';
                });
            }
            //prepares the project prefabs map
            function prepareAppPrefabsNamePropertiesMap() {
                appPrefabNamePropertiesMap = {};
                _.forEach(appPrefabs, function (prefabObj) {
                    appPrefabNamePropertiesMap[prefabObj.name] = prefabObj;
                });
            }
            /**
             * this function sets the project prefabs
             * @param prefabs prefabs config array
             */
            function setProjectPrefabs(prefabs) {
                appPrefabs = prefabs;
                prepareAppPrefabsNamePropertiesMap();
            }

            /**
             * this function returns the project prefab config
             * @param prefabName name of the prefab
             * @returns {Object} prefab config
             */
            function getProjectPrefab(prefabName) {
                return Utils.getClonedObject(appPrefabNamePropertiesMap[prefabName]) || {};
            }

            //returns the raw project prefabs array
            function getProjectPrefabs() {
                return Utils.getClonedObject(appPrefabs) || [];
            }

            /**
             * this function is used to fetch the project prefabs
             * @returns {*|{url, method}} promise object
             */
            function fetchProjectPrefabs() {
                return ProjectService.getProjectPrefabs($rs.project.id)
                    .then(setProjectPrefabs);
            }

            function prepareWorkspacePrefabsNamePropertiesMap() {
                studioPrefabNamePropertiesMap = {};
                _.forEach(workspacePrefabs, function (prefabObj) {
                    studioPrefabNamePropertiesMap[prefabObj.name] = prefabObj;
                });
            }
            /**
             * this function sets the workspace prefabs
             * @param prefabs prefabs config array
             */
            function setWorkspacePrefabs(prefabs) {
                workspacePrefabs = prefabs;
                prepareWorkspacePrefabsNamePropertiesMap();
            }

            /**
             * this function returns the workspace prefab config
             * @returns {prefab} prefab object
             */
            function getWorkspacePrefab(prefabName) {
                return Utils.getClonedObject(studioPrefabNamePropertiesMap[prefabName]) || {};
            }

            /**
             * this function is used to fetch the project prefabs
             * @returns {*|{url, method}} promise object
             */
            function fetchWorkspacePrefabs() {
                return ProjectService.getWorkspacePrefabs($rs.project.id)
                    .then(setWorkspacePrefabs);
            }
            //constructs the prefab message for the prefabs
            function constructPrefabConflictMessage(prefab) {
                var msg, actionsBtnMsg = 'Update', pubV, curV;
                curV = prefab.version;
                pubV = prefab.workspaceVersion;
                if (Number(prefab.version) && Number(prefab.workspaceVersion)) {
                    var pubSplit = _.split(pubV, '.').map(Number);
                    var curSplit = _.split(curV, '.').map(Number);

                    if ((curSplit[0] < pubSplit[0]) || (curSplit[0] === pubSplit[0] && curSplit[1] < pubSplit[1])) {
                        msg = $rs.getLocalizedMessage('MESSAGE_PREFAB_VERSION_MISMATCH_OLDER', prefab.name, prefab.version, prefab.workspaceVersion, actionsBtnMsg);
                    } else {
                        actionsBtnMsg = 'Revert';
                        msg = $rs.getLocalizedMessage('MESSAGE_PREFAB_VERSION_MISMATCH_FUTURE', prefab.name, prefab.version, prefab.workspaceVersion, actionsBtnMsg);
                    }
                } else {
                    if (prefab.version !== prefab.workspaceVersion) {
                        msg = $rs.getLocalizedMessage('MESSAGE_PREFAB_VERSION_MISMATCH_CONFLICT', prefab.name, prefab.workspaceVersion, actionsBtnMsg);
                    }
                }
                if (prefab.status === 'DEV') {
                    msg = $rs.getLocalizedMessage('MESSAGE_PREFAB_VERSION_MISMATCH_DEVELOPMENT', prefab.name, prefab.version, prefab.workspaceVersion, actionsBtnMsg);
                }
                prefab.actionsBtnMsg = actionsBtnMsg;
                return msg;
            }
            /**
             *
             * @returns {Array}
             */
            function getPrefabVersionConflicts() {
                var conflicts = [],
                    prefabs = getProjectPrefabs();
                //prefab list consists of workspace version, project version and also status of the prefab
                _.forEach(prefabs, function (prefab) {
                    //if prefab workspace version doesn't exist do not show it as a conflict, might be the prefab is not published in the workspace yet
                    if (prefab.workspaceVersion && (prefab.version !== prefab.workspaceVersion || prefab.status === 'DEV')) {
                        prefab.versionMessage = constructPrefabConflictMessage(prefab);
                        conflicts.push(prefab);
                    }
                });
                return conflicts;
            }

            //assigns the version mismatch message for the prefabs.
            function setVersionMismatchMessages() {
                _.forEach(getProjectPrefabs(), function (prefab) {
                    var messageMap = versionMismatchMessages,
                        prefabName = prefab.name,
                        prefabProjectVersion = parseFloat(prefab.version),
                        prefabWorkspaceVersion  = parseFloat(prefab.workspaceVersion);
                    //if the prefab version is in draft condition show the message
                    if (prefab.status === 'DEV') {
                        messageMap[prefabName] = $rs.locale.MESSAGE_ARTIFACT_NOT_PUBLISHED;
                    } //@TODO:Implement these versions older, future, conflict
                    /*else if (_.isNumber(prefabProjectVersion) && _.isNumber(prefabWorkspaceVersion)) { //compare the version if they can be parsed
                        if (prefabProjectVersion > prefabWorkspaceVersion) {
                            messageMap[prefabName] = $rs.locale.MESSAGE_FUTURE_VERSION_PREFAB;
                        } else if (prefabProjectVersion < prefabWorkspaceVersion) {
                            messageMap[prefabName] = $rs.locale.MESSAGE_OLDER_VERSION_PREFAB;
                        }
                    } else if (prefab.version !== prefab.workspaceVersion) { //show the conflict message if they're not equal
                        messageMap[prefabName] = $rs.locale.MESSAGE_CONFLICT_VERSION_PREFAB;
                    }*/
                });
            }

            /**
             * this function gets the prefab version mismatch message
             * @param prefabName
             * @returns {string} version mismatch message
             */
            function getVersionMismatchMessage(prefabName) {
                return versionMismatchMessages[prefabName];
            }

            /*
             * Register the prefab in a synchronous way and trigger the callback on success.
             */
            function doRegistration(prefabName, callback, forceRegister) {

                /* register the prefab & then add the widget to canvas */
                PrefabService.register({
                    projectId: getProjectId(),
                    prefabId: studioPrefabNamePropertiesMap[prefabName].id,
                    forceRegister: forceRegister ? true : false
                }, function () {
                    appPrefabNamePropertiesMap[prefabName] = Utils.getClonedObject(studioPrefabNamePropertiesMap[prefabName]);
                    appPrefabNameConfigMap[prefabName] = studioPrefabNameConfigMap[prefabName];
                    Utils.triggerFn(callback);
                    // Refresh the prefabs list
                    $rs.$emit('list-prefabs');
                }, function (err) {
                    Utils.triggerFn(callback, err);
                });
            }

            /*
             * Check whether registration is required or not.
             * Register the prefab if it is never registered with the app.
             * If a legacy version of the prefab is found, show upgrade dialog.
             * Trigger the callback if the registration is not required.
             */
            function validateAndRegister(prefabName, callback, forceRegister) {
                if (!appPrefabNamePropertiesMap[prefabName] || isPrefabVersionMismatch(prefabName)) {
                    // prefab never registered.
                    doRegistration(prefabName, callback, forceRegister);
                } else {
                    // registration is not required
                    Utils.triggerFn(callback);
                }
            }

            /*
             * If the app-prefab properties are not available then load them and check for version mismatch
             */
            function registerPrefab(prefabName, callback, forceRegister) {

                if (appPrefabNamePropertiesMap === undefined) {
                    listAppPrefabs(validateAndRegister.bind(undefined, prefabName, callback, forceRegister));
                } else {
                    validateAndRegister(prefabName, callback, forceRegister);
                }
            }

            function deRegisterPrefab(projectId, prefabName, callback) {
                PrefabService.deRegister({
                    projectId: projectId,
                    data: {
                        prefabName: prefabName
                    }
                }, function () {
                    delete appPrefabNamePropertiesMap[prefabName];
                    Utils.triggerFn(callback);
                }, function (errMsg, errorDetails) {
                    Utils.triggerFn(callback, errMsg, errorDetails);
                });
            }

            /* callback function when prefab resource is loaded */
            function OnPrefabResourceLoad(count) {
                this.count = count;

                this.updateCount = function () {
                    this.count -= 1;
                };

                this.getCount = function () {
                    return this.count;
                };
            }

            /* load external scripts required by the prefab */
            function loadScripts(scripts) {
                var deferred = $q.defer(),
                    rand = Date.now(),
                    count = 0,
                    fnName = 'onPrefabResourceLoad' + rand,
                    obj,
                    intervalHandler;

                scripts = scripts.map(function (script) {
                    if (script.indexOf('onPrefabResourceLoad') !== -1) {
                        count += 1;
                        script = script.replace('onPrefabResourceLoad', fnName);
                    }
                    return script;
                });

                function onResourcesReady() {
                    if (!obj.getCount() && intervalHandler) {
                        $interval.cancel(intervalHandler);
                        intervalHandler = null;
                        deferred.resolve();
                    }
                }

                obj = new OnPrefabResourceLoad(count);

                window[fnName] = obj.updateCount.bind(obj);

                if (!scripts || !scripts.length) {
                    deferred.resolve();
                } else {
                    Utils.loadScripts(scripts, function () {
                        // some timeout for the scripts to execute
                        intervalHandler = $interval(onResourcesReady, 50, 10);
                    });
                }

                return deferred.promise;
            }

            /* load the external angular modules required by prefab */
            function loadModules(modules) {
                var deferred = $q.defer(), resolveFn;

                /* Modules are not yet supported in 10.x
                if (!modules || !modules.length) {
                    deferred.resolve();
                } else {
                    resolveFn = _.after(modules.length, function () {
                        $timeout(deferred.resolve, 200, false);
                    });

                    _.forEach(modules, function (module) {
                        $ocLazyLoad.jsLoader(module.files, function () {
                            $ocLazyLoad.inject(module.name).then(resolveFn);
                        }, {});
                    });
                }
                */

                deferred.resolve();
                return deferred.promise;
            }

            function cachePrefabScript(prefabName, script) {
                prefabScriptCache[prefabName] = script;
            }

            function getScriptOf(prefabName) {
                return prefabScriptCache[prefabName] || '';
            }

            /* loads the script, styles, variables, template of the prefab */
            function loadPrefabMinifiedPage(prefabName) {
                var deferred = $q.defer(),
                    url = '/pages/Main/page.min.json';
                /*read the file content*/
                FileService.read({
                    path: CONSTANTS.isRunMode
                        ? 'app/prefabs/' + prefabName + url
                        : 'WEB-INF/prefabs/' + prefabName + '/webapp' + url,
                    projectID: $rs.project.id
                }, function (prefabContent) {
                    var htmlMarkup = Utils.getDecodedData(prefabContent.markup) || '',
                        PREFAB_VARIABLE_NAMESPACE = '_MainPage_Variables_';
                    /*load the styles & scripts*/

                    cachePrefabScript(prefabName, Utils.getDecodedData(prefabContent.script));

                    WM.element('head').append('<style>'+ Utils.getDecodedData(prefabContent.styles) +'</style>');
                    window[PREFAB_VARIABLE_NAMESPACE] = Utils.getValidJSON(Utils.getDecodedData(prefabContent.variables)) || {};
                    /* append the isPrefab flag to each variable */
                    WM.forEach(window[PREFAB_VARIABLE_NAMESPACE], function (variable) {
                        variable._prefabName = prefabName;
                    });
                    /* set variables in prefab namespace, registration will occur in page directive */
                    Variables.setPageVariables(prefabName, window[PREFAB_VARIABLE_NAMESPACE]);
                    //In run-mode fetching metaData
                    if (CONSTANTS.isRunMode) {
                        Utils.getService('MetaDataFactory').load(prefabName)
                            .then(function () {
                                deferred.resolve(htmlMarkup);
                            });
                    } else {
                        deferred.resolve(htmlMarkup);
                    }
                });
                return deferred.promise;
            }

            function getPrefabResourceUrl(resourcePath, resourceBasePath, preventCache) {
                var _url = resourcePath;
                if (!Utils.stringStartsWith(resourcePath, 'http://|https://|//')) {
                    _url = (resourceBasePath + _url).replace('//', '/');
                }
                if (preventCache) {
                    _url = Utils.preventCachingOf(_url);
                }

                return _url;
            }

            function loadDependencies(prefabName) {
                var config = appPrefabNameConfigMap[prefabName],
                    resources,
                    resourcePath,
                    scriptFiles,
                    styleFiles,
                    modules,
                    handler,
                    deferred = $q.defer();

                if (!config) {
                    deferred.reject();
                    return deferred.promise;
                }

                resources = config.resources || {};

                resourcePath = CONSTANTS.isRunMode
                                ? 'app/prefabs/' + prefabName + '/'
                                : 'services/projects/' + getProjectId() + '/resources/info/web/WEB-INF/prefabs/' + prefabName + '/webapp/';

                if (pendingTasks.resources[prefabName]) {
                    handler = $rs.$on(prefabName + '-dependencies-ready', function (evt, prefabContent) {
                        evt.stopPropagation();
                        deferred.resolve(prefabContent);
                        handler();
                    });
                } else {
                    pendingTasks.resources[prefabName] = true;

                    scriptFiles = resources.scripts || [];
                    styleFiles = resources.styles || [];
                    modules = resources.modules || [];

                    scriptFiles = scriptFiles.map(function (file) {
                        return getPrefabResourceUrl(file, resourcePath, true);
                    });

                    modules = modules.map(function (module) {
                        module.files = module.files.map(function (file) {
                            return getPrefabResourceUrl(file, resourcePath, true);
                        });
                        return module;
                    });

                    styleFiles = styleFiles.map(function (file) {
                        if (!Utils.stringEndsWith(file, '/pages/Main/Main.css')) {
                            return getPrefabResourceUrl(file, resourcePath, true);
                        }
                        return undefined;
                    }).filter(function (file) {
                        return !!file;
                    });

                    Utils.loadStyleSheets(styleFiles);

                    loadScripts(scriptFiles)
                        .then(loadModules.bind(undefined, modules))
                        .then(loadPrefabMinifiedPage.bind(undefined, prefabName))
                        .then(function (prefabContent) {
                            pendingTasks.resources[prefabName] = undefined;
                            $rs.$emit(prefabName + '-dependencies-ready', prefabContent);
                            deferred.resolve(prefabContent);
                        });
                }

                return deferred.promise;
            }

            function removePrefab(params) {
                return PrefabService.remove(params);
            }

            /*
             * gets active prefab's config from respective config file and stores it in memory for later use
             */
            function getConfig(success, error, reload) {
                /* if config fetched already, return*/
                if (activePrefabConfig && !reload) {
                    Utils.triggerFn(success, activePrefabConfig);
                    return;
                }

                /* unset flag to force reload */
                $rs.reloadPrefabConfig = undefined;

                /* read the config from respective file */
                FileService.read({
                    projectID: $rs.project.id,
                    path: 'config.json'
                }, function (response) {
                    activePrefabConfig = response;
                    Utils.triggerFn(success, response);
                }, function (response) {
                    Utils.triggerFn(error, response);
                });
            }

            /*
             * saves active prefab's config in memory and in respective config file
             */
            function setConfig(config, success, error) {
                activePrefabConfig = config;
                FileService.write({
                    projectID: $rs.project.id,
                    path: 'config.json',
                    content: config
                }, function (response) {
                    Utils.triggerFn(success, response);
                }, function (response) {
                    Utils.triggerFn(error, response);
                });
            }

            function updateHTMLImportRefs(prefabName, markup) {
                var $markup = WM.element(markup);
                $markup.find('link[rel=import]')
                    .each(function () {
                        var $el  = WM.element(this),
                            href = $el.attr('href'),
                            resourcePath;

                        resourcePath = CONSTANTS.isRunMode
                            ? 'app/prefabs/' + prefabName + '/'
                            : 'services/projects/' + getProjectId() + '/resources/info/web/WEB-INF/prefabs/' + prefabName + '/webapp/';

                        $el.attr('href', getPrefabResourceUrl(href, resourcePath));
                    });
                return $markup[0].outerHTML;
            }

            function publishPrefabToWorkspace() {
                projectDetails = ProjectService.getDetails();
                var payload = {
                    'projectID' : projectDetails.studioProjectId || projectDetails.id,
                    'data'      : {
                        'prefabName' : projectDetails.name,
                        'version'    : projectDetails.version
                    }
                };
                return PrefabService.publishPrefabToWorkSpace(payload);
            }

            function publishPrefabToProject(targetProjectId, forceRegister) {
                projectDetails = ProjectService.getDetails();
                var payload = {
                    'urlParams' : {
                        'forceRegister' : !!forceRegister,
                        'projectID'     : projectDetails.studioProjectId || projectDetails.id
                    },
                    'data'      : {
                        'targetProjectId' : targetProjectId,
                        'prefabName'      : projectDetails.name,
                        'version'         : projectDetails.version
                    }
                };
                return PrefabService.publishPrefabToProject(payload);
            }

            function register(prefabId, options, successHandler, errorHandler) {
                PrefabService.register({
                    'projectId': $rs.project.studioProjectId || $rs.project.id,
                    'prefabId': prefabId,
                    'forceRegister': options.forceRegister,
                    'upgrade': !!options.upgrade,
                }, successHandler, errorHandler);
            }

            function isPrefabVersionConflictError(errObj) {
                var errKey = _.get(errObj, 'errors.error[0].messageKey');
                return errKey === 'com.wavemaker.platform.project$DependentPrefabExistWithDifferentVersion';
            }

            /**
             *
             * publishes the prefab to the workspace
             * @type {publishPrefabToWorkspace}
             *
             * @param {version} version
             */
            this.publishPrefabToWorkspace = publishPrefabToWorkspace;

            /**
             *
             * publishes the prefab to the project
             * @type {publishPrefabToProject}
             *
             * @param {targetProjectId} target project id where the changes have to be published
             */
            this.publishPrefabToProject = publishPrefabToProject;
            /**
             * @ngdoc function
             * @name wm.prefab.$PrefabManager#removePrefab
             * @methodOf wm.prefab.$PrefabManager
             * @function
             *
             * @description
             * remove the specified prefab
             *
             * @param {object} params specifying the prefabID which needs to be deleted
             */
            this.removePrefab = removePrefab;

            /**
             * @ngdoc function
             * @name PrefabManager#loadDependencies
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load the dependencies of the prefab
             */
            this.loadDependencies = loadDependencies;

            /**
             * @ngdoc function
             * @name PrefabManager#loadScripts
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load the script resources of the prefab
             */
            this.loadScripts = loadScripts;

            /**
             * @ngdoc function
             * @name PrefabManager#loadModules
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load the external angular modules of the prefab
             */
            this.loadModules = loadModules;

            /**
             * @ngdoc function
             * @name PrefabManager#listStudioPrefabs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load the list of prefabs in studio
             */
            this.listStudioPrefabs = listStudioPrefabs;

            /**
             * @ngdoc function
             * @name PrefabManager#getAllStudioPrefabsConfig
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load config.json files of all the prefabs in studio
             */
            this.getAllStudioPrefabsConfig = getAllStudioPrefabsConfig;

            /**
             * @ngdoc function
             * @name PrefabManager#getAppPrefabsConfig
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load config.json files of all the prefabs in project
             */
            this.getAppPrefabsConfig = getAppPrefabsConfig;

            /**
             * @ngdoc function
             * @name PrefabManager#processPrefabsList
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will process the studio and app prefabs list and returns the processed prefabs list
             */
            this.processPrefabsList = processPrefabsList;

            /**
             * @ngdoc function
             * @name PrefabManager#registerPrefab
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will register a prefab(copy from studio to app/project)
             */
            this.registerPrefab = registerPrefab;

            /**
             * @ngdoc function
             * @name PrefabManager#deRegisterPrefab
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * This function will deregister a prefab from project(Deletes prefab source from filemanager)
             */
            this.deRegisterPrefab = deRegisterPrefab;

            /**
             * @ngdoc function
             * @name PrefabManager#loadAppPrefabConfig
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load the config.json of app-prefab
             */
            this.loadAppPrefabConfig = loadAppPrefabConfig;

            /**
             * @ngdoc function
             * @name PrefabManager#getConfig
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will load the config.json of active prefab project
             * @param {success} success callback
             * @param {error} error callback
             * @param {reload} flag to force reload the config file
             */
            this.getConfig = getConfig;

            /**
             * @ngdoc function
             * @name PrefabManager#setConfig
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will save the config.json of active prefab project
             * @param {success} success callback
             * @param {error} error callback
             */
            this.setConfig = setConfig;

            /**
             * @ngdoc function
             * @name PrefabManager#updateHTMLImportRefs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will update the href urls for the html import elements
             * @param {string} prefabName name of the prefab
             * @param {string|object} markup prefab html content(string/jQuery Object)
             */
            this.updateHTMLImportRefs = updateHTMLImportRefs;
            /**
             * @ngdoc function
             * @name PrefabManager#fetchProjectPrefabs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will fetch the prefabs in the project
             */
            this.fetchProjectPrefabs = fetchProjectPrefabs;
            /**
             * @ngdoc function
             * @name PrefabManager#getProjectPrefabs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will get the prefabs in the project
             * @param {string} name of the prefab
             */
            this.getProjectPrefab = getProjectPrefab;
            /**
             * @ngdoc function
             * @name PrefabManager#fetchWorkspacePrefabs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will fetch the prefabs in the workspace
             */
            this.fetchWorkspacePrefabs = fetchWorkspacePrefabs;
            /**
             * @ngdoc function
             * @name PrefabManager#getProjectPrefabs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will get the prefab in the projects
             * @param {string} name of the prefab
             */
            this.getWorkspacePrefab = getWorkspacePrefab;
            /**
             * @ngdoc function
             * @name PrefabManager#getPrefabVersionConflicts
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will sort and return the conflicts in the prefabs in project
             * @param {prefabs} prefab list
             */
            this.getPrefabVersionConflicts = getPrefabVersionConflicts;
            /**
             * @ngdoc function
             * @name PrefabManager#getDevStatusPrefabs
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will get the prefabs with dev status
             * @param {prefabs} prefab list
             */
            this.getDevStatusPrefabs = getDevStatusPrefabs;
            /**
             * @ngdoc function
             * @name PrefabManager#setVersionMismatchMessages
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will assign the version mismatch
             */
            this.setVersionMismatchMessages = setVersionMismatchMessages;
            /**
             * @ngdoc function
             * @name PrefabManager#getVersionMismatchMessage
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will get the version mismatch message for the prefab
             * @param {prefab} prefab name for which the version message is needed
             */
            this.getVersionMismatchMessage = getVersionMismatchMessage;
            /**
             * @ngdoc function
             * @name PrefabManager#register
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will get the version mismatch message for the prefab
             * @param {prefabId} prefab id for the project
             * @param {success} success callback
             * @param {error} error callback
             */
            this.register = register;

            /**
             * @ngdoc function
             * @name PrefabManager#getScriptOf
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * returns the script of given prefab
             * @param {prefabName} name of the prefab
             */
            this.getScriptOf = getScriptOf;
            /**
             * @ngdoc function
             * @name PrefabManager#isPrefabVersionConflictError
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * returns true if the error message is related to the prefab conflicts.
             * @param {prefabName} name of the prefab
             */
            this.isPrefabVersionConflictError = isPrefabVersionConflictError;
        }
    ]);
