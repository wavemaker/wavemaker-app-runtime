/*global WM, wm, document*/
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
    .directive('wmPrefab', [
        'PrefabManager',
        'Utils',
        '$compile',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$timeout',
        'WIDGET_CONSTANTS',

        function (PrefabManager, Utils, $compile, PropertiesFactory, WidgetUtilService, CONSTANTS, $timeout, WIDGET_CONSTANTS) {
            'use strict';

            var prefabDefaultProps = PropertiesFactory.getPropertiesOf('wm.prefabs', ['wm.base']),
                depsMap = {},
                propertyGroups,
                propertiesGroup,
                eventsGroup,
                prefabWidgetPropsMap = {};

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

            function onConfigLoad(scope, details) {

                if (prefabWidgetPropsMap[scope.prefabname]) {
                    scope.widgetProps = WM.copy(prefabWidgetPropsMap[scope.prefabname]);
                    return;
                }

                var prefabProperties,
                    prefabEvents,
                    widgetProps = {};

                if (CONSTANTS.isStudioMode) {
                    prefabProperties = [];
                    prefabEvents = [];

                    propertiesGroup.subGroups.splice(1, 0, {
                        'boundPrefabName': scope.prefabname,
                        'name': scope.prefabname + '_' + 'properties',
                        'parent': 'properties',
                        'properties': prefabProperties
                    });

                    eventsGroup.subGroups.push({
                        'boundPrefabName': scope.prefabname,
                        'name': scope.prefabname + '_' + 'events',
                        'parent': 'events',
                        'properties': prefabEvents
                    });
                }

                scope.userDefinedProps = details.properties || {};
                scope.prefabid = details.id;

                WM.forEach(scope.userDefinedProps, function (prop, key) {

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

                prefabWidgetPropsMap[scope.prefabname] = widgetProps;

                scope.widgetProps = WM.copy(prefabWidgetPropsMap[scope.prefabname]);
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
                        'pre': function (scope, element, attrs) {
                            if (CONSTANTS.isStudioMode && attrs.registrationRequired !== undefined) {
                                PrefabManager.registerPrefab(
                                    scope.prefabname,
                                    PrefabManager.loadAppPrefabConfig.bind(
                                        undefined,
                                        scope.prefabname,
                                        onConfigLoad.bind(undefined, scope)
                                    )
                                );
                            } else {
                                PrefabManager.loadAppPrefabConfig(scope.prefabname, onConfigLoad.bind(undefined, scope));
                            }
                        },

                        'post': function (scope, element, attrs) {
                            var prefabName = scope.prefabname;

                            scope.__compileWithIScope = true;

                            Object.defineProperty(scope, "appLocale", {
                                get: function () {
                                    return scope.$root.appLocale;
                                }
                            });

                            /* called on load of the prefab template*/
                            function onTemplateLoad() {
                                var pfScope = element.find('[data-ng-controller]').scope();
                                /* scope of the controller */

                                WM.forEach(scope.widgetProps, function (propDetails, propName) {
                                    if (propDetails.__value && !attrs.hasOwnProperty(propName)) {
                                        var key = propDetails.__value.replace('bind:', '');
                                        scope._watchers[propName] = pfScope.$watch(key, function (nv) {
                                            scope[propName + '__updateFromWatcher'] = true;
                                            scope[propName] = nv;
                                        });
                                    }
                                });
                                WidgetUtilService.postWidgetCreate(scope, element, attrs);

                                Utils.triggerFn(pfScope.onInitPrefab);
                                if (CONSTANTS.isRunMode) {
                                    Utils.triggerFn(scope.onLoad);

                                    scope.$on('$destroy', scope.onDestroy);
                                }

                                scope.ctrlScope = pfScope;
                            }

                            function compileTemplate(prefabContent) {
                                var prefabEle = WM.element('<div class="full-width full-height">' + prefabContent + '</div>');
                                element.append(prefabEle);
                                $compile(element.children())(scope);
                                $timeout(onTemplateLoad);
                                //scope.$root.$safeApply(scope);
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
                                resources = WM.copy(config.resources);
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
