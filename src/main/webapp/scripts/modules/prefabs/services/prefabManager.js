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

            var studioPrefabNamePropertiesMap,
                studioPrefabNameConfigMap = {},
                appPrefabNamePropertiesMap,
                appPrefabNameConfigMap = {},
                activePrefabConfig,
                pendingTasks = {
                    resources: {}
                },
                projectDetails;

            function getProjectId() {
                if (projectDetails) {
                    return projectDetails.id;
                }

                projectDetails = ProjectService.getDetails();
                return projectDetails && projectDetails.id;
            }

            /*
             * update the studio-prefab properties in studioPrefabNamePropertiesMap
             */
            function onStudioPrefabsLoad(prefabs) {
                prefabs.forEach(function (prefab) {
                    studioPrefabNamePropertiesMap[prefab.name] = prefab;
                });
            }

            /*
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
                        : Utils.getProjectResourcePath(getProjectId()) + 'app/prefabs/' + prefabName + '/config.json';

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
             * Get the config.json of all studio-prefabs.
             * Configs are loaded in asynchronous way.
             * returns a promise
             */
            function getAllStudioPrefabsConfig() {

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
                    loadStudioPrefabConfig(prefabName)
                        .finally(onConfigLoad);
                });

                return deferred.promise;
            }

            /*
             * returns true if the version of the studio-prefab is not same as the app-prefab
             */
            function isPrefabVersionMismatch(prefabName) {
                return studioPrefabNamePropertiesMap[prefabName].version !== appPrefabNamePropertiesMap[prefabName].version;
            }

            /*
             * Register the prefab in a synchronous way and trigger the callback on success.
             */
            function doRegistration(prefabName, callback) {

                /* register the prefab & then add the widget to canvas */
                PrefabService.register({
                    projectId: getProjectId(),
                    prefabId: studioPrefabNamePropertiesMap[prefabName].id
                }, function () {
                    appPrefabNamePropertiesMap[prefabName] = Utils.getClonedObject(studioPrefabNamePropertiesMap[prefabName]);
                    appPrefabNameConfigMap[prefabName] = studioPrefabNameConfigMap[prefabName];
                    Utils.triggerFn(callback);
                }, function () {
                    wmToaster.show('error', $rs.locale.MESSAGE_ERROR_TITLE, $rs.locale.MESSAGE_ERROR_PREFAB_REGISTER_FAILED_DESC);
                });
            }

            /*
             * Show the prefab upgradation dialog.
             */
            function showPrefabUpgradeDialog(prefabName) {
                DialogService
                    .showDialog('upgradePrefabDialog', {
                        'resolve': {
                            'upgradeFn': function () {
                                return function () {
                                    // register the prefab and reload the page
                                    doRegistration(prefabName, function () {
                                        Utils.getService('StudioActions')
                                            .saveProject()
                                            .then(function () {
                                                window.location.reload();
                                            });
                                    });
                                };
                            },
                            'prefabName': function () {
                                return prefabName;
                            }
                        }
                    });
            }

            /*
             * Check whether registration is required or not.
             * Register the prefab if it is never registered with the app.
             * If a legacy version of the prefab is found, show upgrade dialog.
             * Trigger the callback if the registration is not required.
             */
            function validateAndRegister(prefabName, callback) {
                if (!appPrefabNamePropertiesMap[prefabName]) {
                    // prefab never registered.
                    doRegistration(prefabName, callback);
                } else if (isPrefabVersionMismatch(prefabName)) {
                    // prefab is registered but the version of studio-prefab is not same as app-prefab
                    showPrefabUpgradeDialog(prefabName);
                    Utils.triggerFn(callback);
                } else {
                    // registration is not required
                    Utils.triggerFn(callback);
                }
            }

            /*
             * If the app-prefab properties are not available then load them and check for version mismatch
             */
            function registerPrefab(prefabName, callback) {

                if (appPrefabNamePropertiesMap === undefined) {
                    listAppPrefabs(validateAndRegister.bind(undefined, prefabName, callback));
                } else {
                    validateAndRegister(prefabName, callback);
                }
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

                return deferred.promise;
            }

            /* loads the script, styles, variables, template of the prefab */
            function loadPrefabMinifiedPage(prefabName) {
                var config = appPrefabNameConfigMap[prefabName], url, deferred = $q.defer();
                url = config.templateUrl.substr(0, config.templateUrl.lastIndexOf('/') + 1) + 'page.min.html';
                /*read the file content*/
                FileService.read({
                    path: 'app/prefabs/' + prefabName + url,
                    projectID: $rs.project.id
                }, function (prefabContent) {
                    var pageDom = WM.element("<div>" + prefabContent + "</div>"),
                        htmlMarkup = pageDom.find('script[id="Main.html"]').html() || '';
                    /*load the styles & scripts*/
                    WM.element('head').append(pageDom.find('style, script'));
                    /* append the isPrefab flag to each variable */
                    WM.forEach(window["_MainPage_Variables_"], function (variable) {
                        variable.prefabName = prefabName;
                    });
                    /* set variables in prefab namespace, registration will occur in page directive */
                    Variables.setPageVariables(prefabName, window["_MainPage_Variables_"]);
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

            function extendAppLocale(root) {
                var localePath = root + (root.lastIndexOf('/') === root.length - 1 ? '' : '/') + 'resources/i18n/';

                if (CONSTANTS.isRunMode) {
                    i18nService.loadComponentLocaleBundle(localePath);
                } else {
                    $rs.$emit('load-component-locale-bundle', localePath);
                }
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
                                : 'services/projects/' + getProjectId() + '/resources/info/web/app/prefabs/' + prefabName + '/';

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

                    extendAppLocale(resourcePath);

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
                            : 'services/projects/' + getProjectId() + '/resources/info/web/app/prefabs/' + prefabName + '/';

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

            function publishPrefabToProject(targetProjectId) {
                projectDetails = ProjectService.getDetails();
                var payload = {
                    'projectID' : projectDetails.studioProjectId || projectDetails.id,
                    'data'      : {
                        'targetProjectId' : targetProjectId,
                        'prefabName'      : projectDetails.name,
                        'version'         : projectDetails.version
                    }
                };
                return PrefabService.publishPrefabToProject(payload);
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
             * @name PrefabManager#registerPrefab
             * @methodOf wm.prefab.$PrefabManager
             * @description
             * this function will register a prefab(copy from studio to app/project)
             */
            this.registerPrefab = registerPrefab;

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
        }
    ]);
