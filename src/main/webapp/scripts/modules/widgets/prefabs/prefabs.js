/*global WM, wm, document, _, window*/
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
    .config(function ($httpProvider) {
        'use strict';

        $httpProvider.interceptors.push('debugModePrefabResourceInterceptor');
    })
    .service('DevModePrefab', [
        '$rootScope',
        '$compile',
        '$timeout',
        'Utils',
        'wmToaster',
        function ($rs, $compile, $timeout, Utils, wmToaster) {
            'use strict';

            var _dialogTemplate,
                _sessionStorage,
                _prefabNames,
                _settingsIcon,
                _dialogScope,
                _showDlgTimer,
                _settingIconAddedToDOM,
                SESSSION_STORAGE_KEY_PREFIX;

            SESSSION_STORAGE_KEY_PREFIX = '__prefab__devmode__url__';

            _sessionStorage = window.sessionStorage;
            _prefabNames    = [];
            _dialogTemplate = '' +
                '<div class="modal prefab-url-config-dialog" role="dialog">' +
                    '<div class="modal-dialog app-dialog" role="document">' +
                        '<div class="modal-content">' +
                            '<div class="modal-header app-dialog-header">' +
                                '<h4><i class="app-icon wi wi-settings fa-2x"></i>Development Mode Prefab URL Config</h4>' +
                            '</div>'+
                            '<div class="modal-body app-dialog-body">' +
                                '<table class="wm-table">' +
                                    '<thead>' +
                                        '<tr>' +
                                            '<th width="150">Prefab Name</th>' +
                                            '<th>Prefab Application Run URL</th>' +
                                        '</tr>' +
                                    '</thead>' +
                                '</table>' +
                                '<div class="prefab-url-config">' +
                                    '<table class="wm-table">' +
                                        '<tbody>' +
                                            '<tr ng-repeat="config in configs track by config.name">' +
                                                '<td width="150">{{config.name}}</td>' +
                                                '<td class="prefab-dev-url">' +
                                                    '<div>' +
                                                        '<input ng-model="config.url" class="form-control" placeholder="https://youDomain.com/appPrefabURL">' +
                                                    '</div>' +
                                                '</td>' +
                                            '</tr>' +
                                        '</tbody>' +
                                    '</table>' +
                                '</div>' +
                            '</div>' +
                            '<div class="modal-footer app-dialog-footer">' +
                                '<button class="btn btn-secondary" ng-click="cancel()">Cancel</button>' +
                                '<button class="btn btn-primary" ng-click="save()">Save</button>' +
                            '</div>' +
                        '</div>' +
                    '<div>' +
                '</div>';
            _settingsIcon = '' +
                '<div class="prefab-url-config-settings" title="Configure Prefab Dev URLs">' +
                    '<i class="app-icon wi wi-settings fa-3x"></i>' +
                '</div>';

            // close the prefab url config dialog
            function closeConfigDialog() {
                WM.element(document.body).find('> .prefab-url-config-dialog').remove();
            }

            // show the prefab url config dialog
            function showConfigDialog(force) {
                var $compiled,
                    showDlg = false,
                    configs = [];

                // destroy the scope with which the dialog is compiled last time
                if (_dialogScope && !_dialogScope.$$destroyed) {
                    _dialogScope.$destroy();
                }

                // prepare the prefabName-url model,
                // if the url for any prefab is not found in the session storage, show the dialog
                _.forEach(_prefabNames, function (pfName) {
                    var url = getPrefabDevUrl(pfName, false, true);
                    if (!url) {
                        showDlg = true;
                    }
                    configs.push({'name': pfName, 'url': url});
                });

                // force flag will be set when the dialog is opened from the settings icon
                if (!force && !showDlg) {
                    return;
                }

                // Create a new scope and populate required methods and model
                _dialogScope = $rs.$new();
                _dialogScope.configs = configs;
                _dialogScope.cancel  = closeConfigDialog;
                _dialogScope.save    = function () {
                    // update the provided url and update the session storage
                    // close and reload the project post save
                    _.forEach(configs, function (config) {
                        var i = -1;
                        if (config.url) {
                            i = config.url.indexOf('/#');
                            if (i !== -1) {
                                config.url = config.url.substring(0, i + 1);
                            }

                        }
                        _sessionStorage.setItem(SESSSION_STORAGE_KEY_PREFIX + config.name + '__', config.url);
                    });

                    closeConfigDialog();
                    window.location.reload();
                };
                $compiled = $compile(_dialogTemplate)(_dialogScope);

                WM.element(document.body).append($compiled);
            }

            // validate the prefab app url
            // if the end point is not accessible show an error message
            function isValidURL(pfName, url) {
                var isValid = true;
                Utils.fetchContent(
                    'json',
                    url + '/config.json',
                    _.noop,
                    function () {
                        isValid = false;
                        wmToaster.show('error', 'Error Loading Prefab Resources',
                            'Unable to load the resources of ' + pfName + ' from ' + url + '. \n Please make sure that the Prefab is accessible at given location or updated the url.');
                    },
                    true
                );
                return isValid;
            }

            // returns the dev url of a prefab from session storage
            // if the url is not found, open the config load during the load time
            function getPrefabDevUrl(pfName, registerIfNotFound, skipValidation) {
                var url = _sessionStorage.getItem(SESSSION_STORAGE_KEY_PREFIX + pfName + '__'),
                    $settingsIcon;

                // add an icon at the bottom right corner to access config dialog
                if (!_settingIconAddedToDOM) {
                    _settingIconAddedToDOM = true;
                    $settingsIcon = WM.element(_settingsIcon);
                    $settingsIcon.on('click', function () {
                        $rs.$evalAsync(function () {
                            showConfigDialog(true);
                        });

                    });
                    WM.element(document.body).append($settingsIcon);
                }

                if (!_.includes(_prefabNames, pfName)) {
                    _prefabNames.push(pfName);
                }

                // validate the url
                if (url && !skipValidation) {
                    if (!isValidURL(pfName, url)) {
                        return;
                    }
                }

                if (!url && registerIfNotFound) {
                    $timeout.cancel(_showDlgTimer);

                    _showDlgTimer = $timeout(showConfigDialog, 1000);
                }

                return url;
            }

            this.getPrefabDevUrl = getPrefabDevUrl;
        }
    ])
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
        'DevModePrefab',

        function (PrefabManager, Utils, $compile, PropertiesFactory, WidgetUtilService, CONSTANTS, $timeout, WIDGET_CONSTANTS, $rs, DialogService, PrefabService, debugModePrefabResourceInterceptor, DevModePrefab) {
            'use strict';

            var prefabDefaultProps   = PropertiesFactory.getPropertiesOf('wm.prefabs', ['wm.base']),
                depsMap              = {},
                prefabWidgetPropsMap = {},
                prefabMethodsMap     = {},
                propsSkipList        = ['width', 'height', 'show', 'animation'],
                notifyFor            = {'height': true, 'devmode': CONSTANTS.isStudioMode},
                propertyGroups,
                propertiesGroup,
                eventsGroup;

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler(scope, $el, key, newVal) {
                switch (key) {
                case 'height':
                    scope.overflow = newVal ? 'auto' : '';
                    break;
                case 'devmode':
                    $el.attr(key, newVal);
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

                        var serverProps, prefabDevUrl;

                        // In run mode when the devmode is on for a prefab, load the resources from the provided endpoint
                        if (CONSTANTS.isRunMode && attrs.devmode === 'on') {
                            prefabDevUrl = DevModePrefab.getPrefabDevUrl($is.prefabname, true);
                            if (prefabDevUrl) {
                                debugModePrefabResourceInterceptor.register($is.prefabname, prefabDevUrl);
                            }
                        }

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
                            var pfScope = $el.find('[data-ng-controller]').scope();

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
                        }

                        function compileTemplate(prefabContent) {
                            var prefabEle = WM.element('<div class="full-width full-height">' + prefabContent + '</div>');
                            $el.append(prefabEle);
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
                                });
                        } else { //dependencies already loaded.
                            compileTemplate(depsMap[prefabName].templateContent);
                        }
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el), $is, notifyFor);
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
