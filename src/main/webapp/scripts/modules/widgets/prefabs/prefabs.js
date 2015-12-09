/*global WM, wm, document, _*/
/*Directive for prefabs */

WM.module('wm.prefabs')
/**
 * @ngdoc directive
 * @name wm.prefab.directive:wmPrefab
 * @restrict E
 * @element ANY
 * @requires PrefabManager
 * @requires Utils
 * @requires $compile
 * @requires PropertiesFactory
 * @description
 * The 'wmPrefab' directive defines a prefab in editors. It is draggable over the canvas.
*/
    .factory('debugModePrefabResourceInterceptor',
        [
            function () {
                'use strict';

                var configs = [],
                    cache   = {},
                    enableInterceptor;

                function getDevModePrefabUrl(requestUrl) {

                    var matchFound,
                        redirectUrl,
                        url;

                    url = cache[requestUrl];
                    if (url) {
                        return url;
                    }

                    matchFound = _.some(configs, function (config) {
                        var resourceMatch = config.resourceMatch,
                            servicesMatch = config.servicesMatch,
                            prefabName    = config.prefabName,
                            _url,
                            index;

                        index = requestUrl.indexOf(resourceMatch);

                        if (index !== -1) {
                            _url = requestUrl.substr(index + prefabName.length + 13);
                        } else {
                            index = requestUrl.indexOf(servicesMatch);
                            if (index !== -1) {
                                _url = requestUrl.substr(index + prefabName.length + 10);

                                _url = '/services/' + _url;
                            }
                        }

                        redirectUrl = config.prefabAppUrl + _url;
                        return !!_url;
                    });

                    if (matchFound) {
                        cache[requestUrl] = redirectUrl;
                        return redirectUrl;
                    }
                }

                function requestInterceptor(config) {

                    if (enableInterceptor) {
                        var _url = getDevModePrefabUrl(config.url);

                        if (_url) {
                            config.url = _url;
                        }
                    }
                    return config;
                }

                function registerConfig(pfName, url) {
                    enableInterceptor = true;

                    if (!url.endsWith('/')) {
                        url = url + '/';
                    }

                    configs.push(
                        {
                            'prefabName'    : pfName,
                            'prefabAppUrl'  : url,
                            'resourceMatch' : 'app/prefabs/' + pfName + '/',
                            'servicesMatch' : '/prefabs/' + pfName + '/'
                        }
                    );
                }

                return {
                    'request' : requestInterceptor,
                    'register': registerConfig
                };
            }
        ])
    /*.config(function ($httpProvider) {
        'use strict';

        $httpProvider.interceptors.push('debugModePrefabResourceInterceptor');
    })*/
    .directive('wmPrefab', [
        'PrefabManager',
        'Utils',
        '$compile',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$timeout',
        'WIDGET_CONSTANTS',
        '$rootScope',
        'DialogService',
        'PrefabService',
        'debugModePrefabResourceInterceptor',

        function (PrefabManager, Utils, $compile, PropertiesFactory, WidgetUtilService, CONSTANTS, $timeout, WIDGET_CONSTANTS, $rootScope, DialogService, PrefabService, debugModePrefabResourceInterceptor) {
            'use strict';

            var prefabDefaultProps = PropertiesFactory.getPropertiesOf('wm.prefabs', ['wm.base']),
                depsMap = {},
                propertyGroups,
                propertiesGroup,
                eventsGroup,
                prefabWidgetPropsMap = {},
                prefabMethodsMap = {};

            if (CONSTANTS.isStudioMode) {
                (function () {
                    var groups = PropertiesFactory.getPropertyGroups();

                    propertyGroups = groups.filter(function (group) {

                        if (group.name === 'properties') {
                            propertiesGroup = group;
                        } else if (group.name === 'events') {
                            eventsGroup = group;
                        }

                        return !!group.parent;
                    });

                }());
            }

            function onConfigLoad(iScope, serverProps, config) {

                if (prefabWidgetPropsMap[iScope.prefabname]) {
                    iScope.widgetProps = Utils.getClonedObject(prefabWidgetPropsMap[iScope.prefabname]);
                    iScope._methodsMap = prefabMethodsMap[iScope.prefabname];
                    if (CONSTANTS.isStudioMode) {
                        iScope.serverProps = serverProps;
                    }
                    return;
                }

                var prefabProperties,
                    prefabEvents,
                    widgetProps = {},
                    userDefinedProps,
                    methodsMap = {};

                if (CONSTANTS.isStudioMode) {
                    prefabProperties = [];
                    prefabEvents = [];

                    propertiesGroup.subGroups.splice(1, 0, {
                        'boundPrefabName': iScope.prefabname,
                        'name': iScope.prefabname + '_' + 'properties',
                        'parent': 'properties',
                        'properties': prefabProperties
                    });

                    eventsGroup.subGroups.push({
                        'boundPrefabName': iScope.prefabname,
                        'name': iScope.prefabname + '_' + 'events',
                        'parent': 'events',
                        'properties': prefabEvents
                    });

                    iScope.serverProps = serverProps;
                }

                userDefinedProps = config.properties || {};
                iScope.prefabid = config.id;

                WM.forEach(userDefinedProps, function (prop, key) {

                    if (prop.type === 'method') {
                        methodsMap[key] = prop;
                        return;
                    }

                    widgetProps[key] = prop;

                    if (Utils.stringStartsWith(prop.value, 'bind:')) {
                        prop.__value = prop.value;
                        prop.value = undefined;
                    }

                    if (CONSTANTS.isStudioMode) {
                        var found = propertyGroups.some(function (group) {
                            return group.properties.indexOf(key) !== -1;
                        });

                        if (!found) {
                            if (prop.type === 'event') {
                                prefabEvents.push(key);
                            } else {
                                prefabProperties.push(key);
                            }
                        }

                        if (!prop.hasOwnProperty('show')) {
                            prop.show = true;
                        }

                        if (!prop.hasOwnProperty('disabled')) {
                            prop.disabled = false;
                        }

                        if (prop.type === 'event') {
                            prop.options = WIDGET_CONSTANTS.EVENTS_OPTIONS;
                        } else {
                            prop.label = Utils.initCaps(key);
                        }
                    }
                });

                WM.forEach(prefabDefaultProps, function (prop, key) {
                    if (WM.isUndefined(widgetProps[key])) {
                        widgetProps[key] = prop;
                    }
                });

                prefabWidgetPropsMap[iScope.prefabname] = widgetProps;
                prefabMethodsMap[iScope.prefabname] = methodsMap;

                iScope.widgetProps = Utils.getClonedObject(prefabWidgetPropsMap[iScope.prefabname]);
                iScope._methodsMap = prefabMethodsMap[iScope.prefabname];
                if (CONSTANTS.isStudioMode) {
                    iScope.serverProps = serverProps;
                }
            }

            return {
                'restrict': 'E',
                'scope': {
                    'prefabname': '@'
                },
                'replace': true,
                'template':
                    '<section  data-role="prefab" init-widget class="app-prefab" ' +
                        'data-ng-style="{' +
                            'width:width, height:height,' +
                            'marginBottom: marginbottom + marginunit, ' +
                            'marginLeft: marginleft + marginunit, ' +
                            'marginRight: marginright + marginunit, ' +
                            'marginTop: margintop + marginunit ' +
                        '}" data-ng-show="show">' +
                    '</section>',
                'compile': function () {
                    return {
                        'pre': function (iScope, element, attrs) {
                            /*
                            if (attrs.debugurl) {
                                debugModePrefabResourceInterceptor.register(iScope.prefabname, attrs.debugurl);
                            }
                            */

                            var serverProps;
                            function loadDependencies() {
                                if (CONSTANTS.isStudioMode) {
                                    PrefabService.getAppPrefabServerProps({
                                        'projectID': $rootScope.project.id,
                                        'prefabName': iScope.prefabname
                                    }, function (response) {
                                        serverProps = response || {};
                                    });

                                }
                                PrefabManager.loadAppPrefabConfig(iScope.prefabname, onConfigLoad.bind(undefined, iScope, serverProps));
                            }
                            if (CONSTANTS.isStudioMode && attrs.registrationRequired !== undefined) {
                                PrefabManager.registerPrefab(
                                    iScope.prefabname,
                                    loadDependencies
                                );
                            } else {
                                loadDependencies();
                            }
                        },

                        'post': function (iScope, element, attrs) {
                            var prefabName = iScope.prefabname;

                            iScope.__compileWithIScope = true;

                            Object.defineProperty(iScope, 'appLocale', {
                                get: function () {
                                    return iScope.$root.appLocale;
                                }
                            });

                            function listenerFn(event, eventName) {
                                var parts, methodProps, fn, fnName, subParts, dialogId;
                                if (!eventName) {
                                    return;
                                }

                                // split the event name by dot.
                                // If the first part is event Name process the event, ignore otherwise
                                parts = eventName.split('.');
                                if (parts[0] === iScope.name) {
                                    if (parts.length === 2) { // eventName should not have more than two parts when split with dot
                                        if (iScope._methodsMap[parts[1]]) {
                                            event.stopPropagation(); // This is a method of THIS prefab, do not let other prefabs to process the same event.
                                            methodProps = iScope._methodsMap[parts[1]]; // get the properties related to the method
                                            fnName = methodProps.method; // function to be invoked
                                            fn = iScope.ctrlScope[fnName]; // get the function reference
                                            if (WM.isFunction(fn)) { // if function is defined on prefab's controller, invoke it
                                                Utils.triggerFn(fn);
                                            } else { // if it is custom event
                                                subParts = fnName.split('.');
                                                if (subParts.length === 2) { // check if it is related to dialogs placed inside prefab
                                                    dialogId = subParts[0];
                                                    if (subParts[1] === 'show') { // handle dialog related events
                                                        DialogService.showDialog(dialogId, {'scope': iScope.ctrlScope});
                                                    } else if (subParts[1] === 'hide') {
                                                        DialogService.hideDialog(dialogId);
                                                    }
                                                } else { // Handle other events.
                                                    $rootScope.$emit('invoke-service', fnName, {'scope': iScope.ctrlScope});
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            iScope.$on('$destroy', $rootScope.$on('invoke-service', listenerFn));

                            /* called on load of the prefab template*/
                            function onTemplateLoad() {
                                var pfScope = element.find('[data-ng-controller]').scope();
                                /* scope of the controller */

                                WM.forEach(iScope.widgetProps, function (propDetails, propName) {
                                    if (propDetails.__value && !attrs.hasOwnProperty(propName)) {
                                        var key = propDetails.__value.replace('bind:', '');
                                        iScope._watchers[propName] = pfScope.$watch(key, function (nv) {
                                            iScope[propName + '__updateFromWatcher'] = true;
                                            iScope[propName] = nv;
                                        });
                                    }
                                });
                                WidgetUtilService.postWidgetCreate(iScope, element, attrs);

                                Utils.triggerFn(pfScope.onInitPrefab);
                                if (CONSTANTS.isRunMode) {
                                    Utils.triggerFn(iScope.onLoad);

                                    iScope.$on('$destroy', iScope.onDestroy);
                                }

                                iScope.ctrlScope = pfScope;
                            }

                            function compileTemplate(prefabContent) {
                                var prefabEle = WM.element('<div class="full-width full-height">' + prefabContent + '</div>');
                                element.append(prefabEle);
                                $compile(element.children())(iScope);
                                $timeout(onTemplateLoad);
                            }

                            if (!depsMap[prefabName]) {
                                PrefabManager.loadDependencies(prefabName).then(function (templateContent) {
                                    depsMap[prefabName] = {
                                        "templateContent": templateContent
                                    };
                                    compileTemplate(templateContent);
                                });
                            } else { //dependencies already loaded.
                                compileTemplate(depsMap[prefabName].templateContent);
                            }
                            iScope.showServerProps = iScope.serverProps && Object.keys(iScope.serverProps).length;
                        }
                    };
                }
            };
        }
    ])
/**
 * @ngdoc directive
 * @name wm.prefab.directive:wmPrefabRun
 * @restrict E
 * @element ANY
 * @requires $rootScope
 * @requires Utils
 * @requires $compile
 * @description
 * 'wmPrefabRun' creates a container for the prefab project to work properly in run mode.
 */
    .directive("wmPrefabRun", [
        "$rootScope",
        "Utils",
        "$compile",
        "PrefabManager",
        "WidgetUtilService",
        function ($rootScope, Utils, $compile, PrefabManager, WidgetUtilService) {
            "use strict";

            function isExternalResource(path) {
                return Utils.stringStartsWith(path, 'http://|https://|//');
            }

            return {
                "restrict": "E",
                "scope": {},
                "replace": true,
                "template": '<section  data-role="prefab" init-widget class="app-prefab app-prefab-run"></section>',
                "compile": function () {
                    return {
                        "pre": function (scope) {
                            var config = $rootScope.prefabConfig;
                            // for the initWidget to create properties handler we need to have widgetProps defined.
                            scope.widgetProps = config.properties || [];
                        },
                        "post": function (scope, element, attrs) {
                            var config = $rootScope.prefabConfig,
                                resources; // config read while bootstrapping the app
                            scope.__compileWithIScope = true;

                            //compile the prefab template and trigger postWidgetCreate and onInitPrefab methods
                            function compileTemplate() {
                                element.append(WM.element($rootScope.prefabTemplate));
                                $compile(element.children())(scope);

                                // get the scope of prefab controller
                                var pfScope = element.find("[data-ng-controller]").scope();

                                // expose the Page Variables and Widgets on the outer scope.
                                Object.defineProperties(element.scope(), {
                                    'Widgets': {
                                        'get': function () {
                                            return pfScope.Widgets;
                                        }
                                    },
                                    'Variables': {
                                        'get': function () {
                                            return pfScope.Variables;
                                        }
                                    }
                                });

                                WidgetUtilService.postWidgetCreate(scope, element, attrs);

                                Utils.triggerFn(pfScope.onInitPrefab);

                                scope.ctrlScope = pfScope;
                            }

                            Object.defineProperty(scope, "appLocale", {
                                get: function () {
                                    return scope.$root.appLocale;
                                }
                            });

                            if (config) {
                                resources = Utils.getClonedObject(config.resources);
                                if (resources.scripts) { // modify the script urls if necessary
                                    resources.scripts = resources.scripts.map(function (script) {
                                        var _script = script && script.trim();
                                        if (!isExternalResource(_script) && _script.charAt(0) === '/') {
                                            _script = "." + _script;
                                        }
                                        return _script;
                                    });
                                }

                                if (resources.styles) { // modify the style urls if necessary
                                    resources.styles = resources.styles.map(function (style) {
                                        var _style = style && style.trim();
                                        if (!isExternalResource(_style) && _style.charAt(0) === '/') {
                                            _style = "." + _style;
                                        }
                                        return _style;
                                    });
                                }

                                if (resources.modules) {
                                    // modify the module files urls if necessary
                                    resources.modules = resources.modules.map(function (module) {
                                        module.files = module.files.map(function (file) {
                                            var _file = file && file.trim();
                                            if (!isExternalResource(_file) && _file.charAt(0) === '/') {
                                                _file = "." + _file;
                                            }
                                            return _file;
                                        });
                                        return module;
                                    });
                                }

                                Utils.loadStyleSheets(resources.styles);
                                PrefabManager.loadScripts(resources.scripts)
                                    .then(PrefabManager.loadModules.bind(undefined, resources.modules))
                                    .then(compileTemplate);

                            }
                        }
                    };
                }
            };
        }
    ]);
