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
        '$http',
        'Variables',

        function (PrefabManager, Utils, $compile, PropertiesFactory, WidgetUtilService, CONSTANTS, $timeout, WIDGET_CONSTANTS, $rs, DialogService, PrefabService, $http, Variables) {
            'use strict';

            var prefabDefaultProps   = PropertiesFactory.getPropertiesOf('wm.prefabs', ['wm.base']),
                depsMap              = {},
                prefabWidgetPropsMap = {},
                prefabMethodsMap     = {},
                propsSkipList        = ['width', 'height', 'show', 'animation'],
                propertyGroups,
                propertiesGroup,
                eventsGroup;

            function getAppContext() {
                var obj = Object.create($rs);

                obj.getDependency = function (key) {
                    if (key === 'DialogService') {
                        return DialogService
                    }

                    if (key === 'HttpService') {
                        return $http;
                    }
                };

                return obj;
            }

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler(scope, key, newVal, oldVal) {
                switch (key) {
                case 'height':
                    scope.overflow = newVal ? 'auto' : '';
                    break;
                }

                if (_.isFunction(scope.pfScope.onPropertyChange)) {
                    scope.pfScope.onPropertyChange(key, newVal, oldVal);
                }
            }

            function overrideResourcePath(scope, value) {
                if (_.startsWith(value, 'resources/')) {
                    return 'WEB-INF/prefabs/' + scope.prefabname + '/webapp/' + value;
                }
                return value;
            }

            if (CONSTANTS.isStudioMode) {
                (function () {
                    var groups = PropertiesFactory.getPropertyGroups(),
                        basicPropsSubGrp;

                    propertyGroups = groups.filter(function (group) {

                        if (group.name === 'properties') {
                            propertiesGroup = group;
                        } else if (group.name === 'events') {
                            eventsGroup = group;
                        }

                        return !!group.parent;
                    });

                    basicPropsSubGrp = _.find(propertiesGroup.subGroups, function (subGroup) {
                        return !subGroup.name;
                    });

                    propsSkipList = propsSkipList.concat(basicPropsSubGrp.properties);
                }());
            }

            function onConfigLoad($is, serverProps, config) {

                if (prefabWidgetPropsMap[$is.prefabname]) {
                    $is.widgetProps = Utils.getClonedObject(prefabWidgetPropsMap[$is.prefabname]);
                    $is._methodsMap = prefabMethodsMap[$is.prefabname];
                    if (CONSTANTS.isStudioMode) {
                        $is.serverProps = serverProps;
                    }
                    return;
                }

                var prefabProperties,
                    prefabEvents,
                    widgetProps = {},
                    userDefinedProps,
                    userDefinedEvents,
                    userDefinedMethods,
                    layoutProps,
                    behaviorProps;

                if (CONSTANTS.isStudioMode) {
                    prefabProperties = [];
                    prefabEvents     = [];

                    layoutProps = ['width', 'height'];
                    behaviorProps = ['show', 'animation'];

                    propertiesGroup.subGroups.splice(1, 0, {
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'properties',
                        'parent'         : 'properties',
                        'properties'     : prefabProperties,
                        'filteredProps'  : prefabProperties
                    }, {
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'layout',
                        'displayKey'     : 'LABEL_PROPERTYGROUP_LAYOUT',
                        'parent'         : 'properties',
                        'properties'     : layoutProps,
                        'filteredProps'  : layoutProps
                    }, {
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'behavior',
                        'displayKey'     : 'LABEL_PROPERTYGROUP_BEHAVIOR',
                        'parent'         : 'properties',
                        'properties'     : behaviorProps,
                        'filteredProps'  : behaviorProps
                    });

                    eventsGroup.subGroups.push({
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'events',
                        'parent'         : 'events',
                        'properties'     : prefabEvents
                    });

                    $is.serverProps = serverProps;
                }

                userDefinedProps = config.properties || {};
                userDefinedEvents = config.events || {};
                userDefinedMethods = config.methods || {};

                $is.prefabid     = config.id;

                _.forEach(userDefinedProps, function (prop, key) {

                    widgetProps[key] = prop;

                    if (Utils.stringStartsWith(prop.value, 'bind:')) {
                        prop.__value = prop.value;
                        prop.value = undefined;
                    }

                    if (CONSTANTS.isStudioMode) {

                        prop.value = overrideResourcePath($is, prop.value);

                        if (!_.includes(propsSkipList, key)) {
                            prefabProperties.push(key);
                        }

                        if (!prop.hasOwnProperty('show')) {
                            prop.show = true;
                        } else if (Utils.stringStartsWith(prop.show, 'bind:')) {
                            prop.__show = prop.show;
                            prop.show = true;
                        }

                        if (!prop.hasOwnProperty('disabled')) {
                            prop.disabled = false;
                        } else if (Utils.stringStartsWith(prop.disabled, 'bind:')) {
                            prop.__disabled = prop.disabled;
                            prop.disabled = false;
                        }

                        if (prop.type === 'number' && prop.widget === 'list') {
                            prop.widget = 'list-number';
                        }

                        prop.label = Utils.initCaps(key);
                        prop.helpText = prop.description;

                    }
                });

                _.forEach(userDefinedEvents, function (prop, key) {
                    widgetProps[key] = prop;

                    if (!CONSTANTS.isStudioMode) {
                        return;
                    }

                    prefabEvents.push(key);

                    prop.show = true;
                    prop.disabled = false;
                    prop.type = 'event';
                    prop.widget = 'eventlist';
                    prop.options = WIDGET_CONSTANTS.EVENTS_OPTIONS;
                    prop.helpText = prop.description;
                });

                _.forEach(prefabDefaultProps, function (prop, key) {
                    if (WM.isUndefined(widgetProps[key])) {
                        widgetProps[key] = prop;
                    }
                });

                prefabWidgetPropsMap[$is.prefabname] = widgetProps;
                prefabMethodsMap[$is.prefabname]     = userDefinedMethods;

                $is.widgetProps = Utils.getClonedObject(prefabWidgetPropsMap[$is.prefabname]);
                $is._methodsMap = prefabMethodsMap[$is.prefabname];
                if (CONSTANTS.isStudioMode) {
                    $is.serverProps = serverProps;
                }
            }

            function exposeMethodsOnWidget($is) {
                //for each method name property exposed,assign a method in the prefab widget scope
                _.forEach(prefabMethodsMap[$is.prefabname], function (methodObj, methodName) {
                    $is[methodName] = $is.ctrlScope[methodObj.method];
                });
            }

            return {
                'restrict': 'E',
                'scope'   : {'prefabname': '@'},
                'replace' : true,
                'template':
                    '<section data-role="prefab" init-widget class="app-prefab" ' +
                        'ng-style="{width:width, height:height, margin: margin, overflow: overflow}">' +
                    '</section>',
                'link': {
                    'pre': function ($is, $el, attrs) {
                        var serverProps;
                        function loadDependencies() {
                            if (CONSTANTS.isStudioMode) {
                                PrefabService.getAppPrefabServerProps({
                                    'projectID' : $rs.project.id,
                                    'prefabName': $is.prefabname
                                }, function (response) {
                                    serverProps = response || {};
                                });

                            }
                            PrefabManager.loadAppPrefabConfig($is.prefabname, onConfigLoad.bind(undefined, $is, serverProps));
                        }
                        if (CONSTANTS.isStudioMode && attrs.registrationRequired !== undefined) {
                            PrefabManager.registerPrefab($is.prefabname, loadDependencies);
                        } else {
                            loadDependencies();
                        }
                    },

                    'post': function ($is, $el, attrs) {
                        var prefabName = $is.prefabname;

                        $is.__compileWithIScope = true;

                        Object.defineProperty($is, 'appLocale', {
                            get: function () {
                                return $is.$root.appLocale;
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
                            if (parts[0] === $is.name) {
                                if (parts.length === 2) { // eventName should not have more than two parts when split with dot
                                    if ($is._methodsMap[parts[1]]) {
                                        event.stopPropagation(); // This is a method of THIS prefab, do not let other prefabs to process the same event.
                                        methodProps = $is._methodsMap[parts[1]]; // get the properties related to the method
                                        fnName = methodProps.method; // function to be invoked
                                        fn = $is.ctrlScope[fnName]; // get the function reference
                                        if (WM.isFunction(fn)) { // if function is defined on prefab's controller, invoke it
                                            Utils.triggerFn(fn);
                                        } else { // if it is custom event
                                            subParts = fnName.split('.');
                                            if (subParts.length === 2) { // check if it is related to dialogs placed inside prefab
                                                dialogId = subParts[0];
                                                if (subParts[1] === 'show') { // handle dialog related events
                                                    DialogService.showDialog(dialogId, {'scope': $is.ctrlScope});
                                                } else if (subParts[1] === 'hide') {
                                                    DialogService.hideDialog(dialogId);
                                                } else if (_.includes(['send', 'open', 'close'], subParts[1])) {
                                                    /*
                                                     * TODO: remove this block once event migration for prefabs is done
                                                     * this is to handle expression: websocketVariable.send/open/close
                                                     */
                                                    $rs.$emit('invoke-service', subParts[0], {'scope': $is.ctrlScope, method: subParts[1]});
                                                }
                                            } else { // Handle other events.
                                                $rs.$emit('invoke-service', fnName, {'scope': $is.ctrlScope});
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        $is.$on('$destroy', $rs.$on('invoke-service', listenerFn));

                        /* called on load of the prefab template*/
                        function onTemplateLoad() {
                            var script = PrefabManager.getScriptOf(prefabName);

                            var fn = new Function('Prefab', 'App', 'Utils', script);

                            $is.pfScope.isStudioMode = true;

                            fn($is.pfScope, getAppContext(), Utils, true);

                            /* scope of the controller */

                            _.forEach($is.widgetProps, function (propDetails, propName) {
                                if (propDetails.__value && !attrs.hasOwnProperty(propName)) {
                                    var key = propDetails.__value.replace('bind:', '');
                                    $is._watchers[propName] = $is.pfScope.$watch(key, function (nv) {
                                        $is[propName + '__updateFromWatcher'] = true;
                                        $is[propName] = overrideResourcePath($is, nv);
                                    });
                                }
                                if (propDetails.__show) {
                                    var key = propDetails.__show.replace('bind:', '');
                                    $is._watchers[propName] = $is.pfScope.$watch(key, function (nv) {
                                        $is.widgetProps[propName].show = nv;
                                    });
                                }
                                if (propDetails.__disabled) {
                                    var key = propDetails.__disabled.replace('bind:', '');
                                    $is._watchers[propName] = $is.pfScope.$watch(key, function (nv) {
                                        $is.widgetProps[propName].disabled = nv;
                                    });
                                }
                            });

                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is), $is);
                            WidgetUtilService.postWidgetCreate($is, $el, attrs);

                            Utils.triggerFn($is.pfScope.onReady);
                            if (CONSTANTS.isRunMode) {
                                Utils.triggerFn($is.onLoad);

                                $is.$on('$destroy', $is.onDestroy);
                            }

                            $is.ctrlScope = $is.pfScope;
                            //once the template is loaded, expose methods on the prefab widget
                            exposeMethodsOnWidget($is);
                        }

                        function compileTemplate(prefabContent) {
                            var versionMsg    = PrefabManager.getVersionMismatchMessage(prefabName),
                                versionMsgEle = '<div class="badge prefab-version" ng-if="showVersionMismatch"><span class="bold">' + versionMsg + '</span></div>',
                                prefabEle     = ($is.widgetid ? versionMsgEle : '') + '<div class="full-width full-height">' + prefabContent + '</div>',
                                $prefabEle    = WM.element(prefabEle);

                            var pfScope = $is.$new();

                            pfScope.Widgets = {};
                            $is.pfScope = pfScope;
                            $is.showVersionMismatch = versionMsg ? true : false;
                            // register the page variables for prefab (not putting studio mode check here as it is 10.x studio code only)
                            Variables.getPageVariables(prefabName, function (variables) {
                                Variables.register(prefabName, variables, true, $is.pfScope);
                                $el.append($prefabEle);
                                $compile($el.children())($is.pfScope);
                                $timeout(onTemplateLoad);
                            });
                        }

                        if (!depsMap[prefabName]) {
                            PrefabManager.loadDependencies(prefabName)
                                .then(function (templateContent) {
                                    var _content = PrefabManager.updateHTMLImportRefs(prefabName, templateContent);
                                    depsMap[prefabName] = {
                                        'templateContent': _content
                                    };
                                    compileTemplate(_content);
                                }, function() {
                                    $is._methodsMap = {}; //needed as this will be used while generating prefab event options when config load fails
                                });
                        } else { //dependencies already loaded.
                            compileTemplate(depsMap[prefabName].templateContent);
                        }
                        $is.showServerProps = $is.serverProps && _.keys($is.serverProps).length;
                    }
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
    .directive('wmPrefabRun', [
        '$rootScope',
        'Utils',
        '$compile',
        'PrefabManager',
        'WidgetUtilService',
        function ($rs, Utils, $compile, PrefabManager, WidgetUtilService) {
            'use strict';

            function isExternalResource(path) {
                return Utils.stringStartsWith(path, 'http://|https://|//');
            }

            return {
                'restrict': 'E',
                'scope'   : {},
                'replace' : true,
                'template': '<section  data-role="prefab" init-widget class="app-prefab app-prefab-run"></section>',
                'link'    : {
                    'pre': function ($is) {
                        var config = $rs.prefabConfig;
                        // for the initWidget to create properties handler we need to have widgetProps defined.
                        $is.widgetProps = config.properties || [];
                    },
                    'post': function ($is, element, attrs) {
                        var config = $rs.prefabConfig,
                            resources; // config read while bootstrapping the app

                        $is.__compileWithIScope = true;

                        //compile the prefab template and trigger postWidgetCreate and onInitPrefab methods
                        function compileTemplate() {
                            element.append(WM.element($rs.prefabTemplate));
                            $compile(element.children())($is);

                            // get the scope of prefab controller
                            var pfScope = element.find('[data-ng-controller]').scope();

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
                                },
                                'Actions': {
                                    'get': function () {
                                        return pfScope.Actions;
                                    }
                                }
                            });

                            WidgetUtilService.postWidgetCreate($is, element, attrs);

                            Utils.triggerFn(pfScope.onInitPrefab);

                            $is.ctrlScope = pfScope;
                        }

                        Object.defineProperty($is, 'appLocale', {
                            get: function () {
                                return $rs.appLocale;
                            }
                        });

                        if (config) {
                            resources = Utils.getClonedObject(config.resources);
                            if (resources.scripts) { // modify the script urls if necessary
                                resources.scripts = resources.scripts.map(function (script) {
                                    var _script = script && script.trim();
                                    if (!isExternalResource(_script) && _script.charAt(0) === '/') {
                                        _script = '.' + _script;
                                    }
                                    return _script;
                                });
                            }

                            if (resources.styles) { // modify the style urls if necessary
                                resources.styles = resources.styles.map(function (style) {
                                    var _style = style && style.trim();
                                    if (!isExternalResource(_style) && _style.charAt(0) === '/') {
                                        _style = '.' + _style;
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
                                            _file = '.' + _file;
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
                }
            };
        }
    ]);
