/*global WM, wm, document, _*/
/*Directive for prefabs */

WM.module('wm.prefabs')
/**
 * @ngdoc directive
 * @name wm.prefab.directive:wmPrefab
 * @restrict E
 * @element ANY
 * @requires PrefabManager
 * @requires CONSTANTS
 * @requires $compile
 * @requires PropertiesFactory
 * @description
 * The 'wmPrefab' directive acts as a wrapper for the wm-prefab-internal directive.
 * wmPrefab will load the prefab config asynchronously and compiles the wm-prefab-internal directive.
*/
    .directive('wmPrefab', [
        'PrefabManager',
        'CONSTANTS',
        '$compile',
        function (PrefabManager, CONSTANTS, $compile) {
            'use strict';

            // once the config is loaded, create wm-prefab-internal and compile it
            function onConfigLoad($s, $el, tEl, tAttrs, config) {
                var $prefabInternal = document.createElement('wm-prefab-internal'),
                    $newScope       = $s.$new();

                _.forEach(tEl.context.attributes, function (tAttr) {
                    $prefabInternal.setAttribute(tAttr.name, tAttr.value);
                });

                $prefabInternal = WM.element($prefabInternal);

                $el.replaceWith($prefabInternal);

                $newScope.__prefabConfig = config;
                $compile($prefabInternal)($newScope);
            }

            function loadConfig($s, $el, tEl, tAttrs) {
                PrefabManager.loadAppPrefabConfig(tAttrs.prefabname, onConfigLoad.bind(undefined, $s, $el, tEl, tAttrs));
            }

            return {
                'restrict': 'E',
                'compile': function (tEl, tAttrs) {
                    return function ($s, $el) {
                        if (CONSTANTS.isStudioMode && tAttrs.registrationRequired !== undefined) {
                            PrefabManager.registerPrefab(tAttrs.prefabname, loadConfig.bind(undefined, $s, $el, tEl, tAttrs));
                        } else {
                            loadConfig($s, $el, tEl, tAttrs);
                        }
                    };
                }
            };
        }
    ])
    .directive('wmPrefabInternal', [
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

        function (PrefabManager, Utils, $compile, PropertiesFactory, WidgetUtilService, CONSTANTS, $timeout, WIDGET_CONSTANTS, $rs, DialogService, PrefabService) {
            'use strict';

            var prefabDefaultProps   = PropertiesFactory.getPropertiesOf('wm.prefabs', ['wm.base']),
                depsMap              = {},
                prefabWidgetPropsMap = {},
                prefabMethodsMap     = {},
                propsSkipList        = ['width', 'height', 'show', 'animation'],
                notifyFor            = {
                  'height': true
                },
                propertyGroups,
                propertiesGroup,
                eventsGroup;

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler(scope, key, newVal) {
                switch (key) {
                case 'height':
                    scope.overflow = newVal ? 'auto' : '';
                    break;
                }
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
                    methodsMap = {};

                if (CONSTANTS.isStudioMode) {
                    prefabProperties = [];
                    prefabEvents     = [];

                    propertiesGroup.subGroups.splice(1, 0, {
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'properties',
                        'parent'         : 'properties',
                        'properties'     : prefabProperties
                    }, {
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'layout',
                        'displayKey'     : 'LABEL_PROPERTYGROUP_LAYOUT',
                        'parent'         : 'properties',
                        'properties'     : ['width', 'height']
                    }, {
                        'boundPrefabName': $is.prefabname,
                        'name'           : $is.prefabname + '_' + 'behavior',
                        'displayKey'     : 'LABEL_PROPERTYGROUP_BEHAVIOR',
                        'parent'         : 'properties',
                        'properties'     : ['show', 'animation']
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
                $is.prefabid     = config.id;

                _.forEach(userDefinedProps, function (prop, key) {

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

                        if (prop.type === 'event') {
                            prefabEvents.push(key);
                        } else {
                            if (!_.includes(propsSkipList, key)) {
                                prefabProperties.push(key);
                            }
                        }

                        if (!prop.hasOwnProperty('show')) {
                            prop.show = true;
                        }

                        if (!prop.hasOwnProperty('disabled')) {
                            prop.disabled = false;
                        }

                        if (prop.type === 'number' && prop.widget === 'list') {
                            prop.widget = 'list-number';
                        }

                        if (prop.type === 'event') {
                            prop.options = WIDGET_CONSTANTS.EVENTS_OPTIONS;
                        } else {
                            prop.label = Utils.initCaps(key);
                        }
                    }
                });

                _.forEach(prefabDefaultProps, function (prop, key) {
                    if (WM.isUndefined(widgetProps[key])) {
                        widgetProps[key] = prop;
                    }
                });

                prefabWidgetPropsMap[$is.prefabname] = widgetProps;
                prefabMethodsMap[$is.prefabname]     = methodsMap;

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
                    'pre': function ($is, $el) {
                        var serverProps, $s;
                        if (CONSTANTS.isStudioMode) {
                            PrefabService.getAppPrefabServerProps({
                                'projectID' : $rs.project.id,
                                'prefabName': $is.prefabname
                            }, function (response) {
                                serverProps = response || {};
                            });
                        }

                        $s = $el.scope();

                        onConfigLoad($is, serverProps, $s.__prefabConfig);
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
                            var pfScope = $el.find('[data-ng-controller], [ng-controller]').scope();

                            if (!pfScope || pfScope.$$destroyed) {
                                return;
                            }

                            /* scope of the controller */

                            _.forEach($is.widgetProps, function (propDetails, propName) {
                                if (propDetails.__value && !attrs.hasOwnProperty(propName)) {
                                    var key = propDetails.__value.replace('bind:', '');
                                    $is._watchers[propName] = pfScope.$watch(key, function (nv) {
                                        $is[propName + '__updateFromWatcher'] = true;
                                        $is[propName] = nv;
                                    });
                                }
                            });
                            WidgetUtilService.postWidgetCreate($is, $el, attrs);

                            Utils.triggerFn(pfScope.onInitPrefab);
                            if (CONSTANTS.isRunMode) {
                                Utils.triggerFn($is.onLoad);

                                $is.$on('$destroy', $is.onDestroy);
                            }

                            $is.ctrlScope = pfScope;
                            //once the template is loaded, expose methods on the prefab widget
                            exposeMethodsOnWidget($is);
                        }

                        function compileTemplate(prefabContent) {
                            var versionMsg    = PrefabManager.getVersionMismatchMessage(prefabName),
                                versionMsgEle = '<div class="badge prefab-version" ng-if="showVersionMismatch"><span class="bold">' + versionMsg + '</span></div>',
                                prefabEle     = ($is.widgetid ? versionMsgEle : '') + '<div class="full-width full-height">' + prefabContent + '</div>',
                                $prefabEle    = WM.element(prefabEle);

                            $is.showVersionMismatch = !!versionMsg;
                            $el.append($prefabEle);
                            $compile($el.children())($is);
                            $timeout(onTemplateLoad);
                        }

                        if (!depsMap[prefabName]) {
                            PrefabManager.loadDependencies(prefabName)
                                .then(function (templateContent) {
                                    var _content = PrefabManager.updateHTMLImportRefs(prefabName, templateContent);
                                    depsMap[prefabName] = {
                                        'templateContent': _content
                                    };
                                    compileTemplate(_content);
                                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is), $is, notifyFor);
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
