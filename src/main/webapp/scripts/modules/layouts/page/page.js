/*global WM, _, document*/

WM.module('wm.layouts.page')
    .directive('wmPage', [
        'DeviceViewService',
        'CONSTANTS',
        '$rootScope',
        '$routeParams',
        'Utils',
        '$timeout',
        'Variables',
        'NavigationVariableService',
        '$location',

        function (DeviceViewService, CONSTANTS, $rs, $routeParams, Utils, $timeout, Variables, NavigationVariableService, $location) {
            'use strict';

            var appVariableReadyFired = false,
                unregister;

            //Sets page title
            function setPageTitle(pageTitle) {
                document.title = pageTitle;
            }

            // Update the title of the page in run mode
            function updatePageTitle($s, $el, pageTitle) {
                var expr;

                if (WM.isDefined(pageTitle)) {
                    if (_.startsWith(pageTitle, 'bind:')) {
                        expr = _.replace(pageTitle, 'bind:', '');
                        unregister = $s.$watch(expr, function (nv) {
                            if (WM.isDefined(nv)) {
                                setPageTitle(nv);
                            }
                        });

                        $s.$on('$destroy', unregister);
                        $el.on('$destroy', unregister);
                    } else {
                        setPageTitle(pageTitle);
                    }
                } else {
                    setPageTitle($rs.activePageName + ' - ' + $rs.projectName);
                }
            }

            return {
                'restrict'  : 'E',
                'replace'   : true,
                'transclude': true,
                'template'  : '<div data-role="pageContainer" class="app-page container" wmtransclude no-animate></div>',
                'link'      :  {
                    'pre': function ($s, $el, attrs) {
                        var pageName,
                            variableScope,
                            containerScope,
                            count,
                            subView,
                            AppManager;
                        /* if the page belongs to a prefab use the name of the prefab
                         * else if the project is of prefab type use `Main`
                         * else get the name of the page from the ng-controller attribute
                         */
                        pageName = $s.prefabname
                                        || ($rs.isPrefabTemplate && 'Main')
                                        || $s.$root._toBeActivatedPage;

                        variableScope = CONSTANTS.isStudioMode && !$s.prefabname && !$s.$parent.partialname ? $rs.domScope : $s;
                        $s._pageName = pageName;

                        if (CONSTANTS.isRunMode) {
                            $s.Actions   = {};
                            $s.Variables = {};
                            $s.Widgets   = {};
                            $rs.pageParams = $s.pageParams = $location.search();
                            $rs._pageReady = false;

                            Object.defineProperty($s, 'pageTitle', {
                               'get': function () {
                                   return document.title;
                               },
                                'set': function (val) {
                                   Utils.triggerFn(unregister);
                                   setPageTitle(val);
                                }
                            });
                            // only expose the widgets of the active page to rootScope
                            if (!$s.$parent.partialname && !$s.prefabname) {
                                $rs.Widgets       = $s.Widgets;
                                $rs.$activePageEl = $el;
                            }
                            if ($s.$parent.partialname) {
                                // get partial page container's scope
                                containerScope = $s.$parent.Widgets && $s.$parent.Widgets[$s.$parent.partialcontainername];

                                // expose partial's Widgets to its container's scope (to be visible to parent)
                                if (containerScope) {
                                    containerScope.Widgets = $s.Widgets;
                                }
                            }

                            // update the title of the application
                            if ($routeParams.name === $rs.activePageName) {
                                updatePageTitle($s, $el, attrs.pagetitle);
                            }
                        }

                        if (CONSTANTS.isStudioMode) {
                            containerScope = $s.$parent.Widgets && $s.$parent.Widgets[$s.$parent.partialcontainername];
                            if (containerScope && WM.isDefined(containerScope.Widgets)) {
                                containerScope.Widgets = $s.Widgets = {};
                            }
                        }
                        // define registerPageContainer and onPageContainerLoad methods in Run Mode.
                        if (!$s.registerPageContainer && CONSTANTS.isRunMode) {
                            count = 0;

                            $s.layout = {
                                'leftSection' : false,
                                'rightSection': false,
                                'header'      : false,
                                'footer'      : false,
                                'search'      : false
                            };

                            $s._onPageLoad = function () {
                                // if the count is zero(means the page is ready), trigger update method of DeviceViewService
                                if (!count) {
                                    /* if subview element names found (appended with page-name after a '.'), navigate to the view element */
                                    if ($routeParams && $routeParams.name) {
                                        subView = $routeParams.name.split('.');
                                        if (subView.length > 1) {
                                            NavigationVariableService.goToView(subView.pop());
                                        }
                                    }
                                    // update layout after the page is rendered
                                    $s.layout.search       = $el.find('[data-role="page-header"] .app-search');
                                    $s.layout.leftSection  = $el.find('[data-role="page-left-panel"]').length > 0;
                                    $s.layout.rightSection = $el.find('[data-role="page-right-panel"]').length > 0;

                                    // update the device after some delay
                                    $timeout(function () {
                                        DeviceViewService.update($el, $s.layout.leftSection, $s.layout.rightSection, $s.layout.search);
                                        $rs.$$postDigest(function () {
                                            /* triggering the event post digest, so that any expression watches are computed before the same*/
                                            $rs._pageReady = true;
                                            $rs.$emit('page-ready', pageName);

                                            //trigger the onPageReady method
                                            if ($s.hasOwnProperty('onPageReady')) {
                                                Utils.triggerFn($s.onPageReady);
                                                $s.registerPagePart = $s.onPagePartLoad = _.noop;
                                            }

                                            if ($rs.hasOwnProperty('onPageReady')) {
                                                Utils.triggerFn($rs.onPageReady, pageName, $s, $el);
                                            }
                                        });
                                    });
                                }
                            };

                            // increment the counter when a pageContainer is registered
                            $s.registerPagePart = function () {
                                count++;
                            };

                            $s.onPagePartLoad = function () {
                                --count; // decrement the counter when the a pageContainer is ready
                                $s._onPageLoad();
                            };

                            // if specified, call handle route function in the page.js
                            if (WM.isFunction($s.handleRoute)) {
                                // gather all the routeParams, send them as arguments to the fn except first element, as first element is pageName
                                $s.handleRoute.apply(undefined, _.values($routeParams).slice(1));
                            }
                        }

                        // set the page-level variables in run mode, design mode process is different
                        if (CONSTANTS.isRunMode && !$s.prefabname) {
                            AppManager = Utils.getService('AppManager');
                            Variables.setPageVariables(pageName, AppManager.getPageContent(pageName, 'variables'));
                        }
                        // register the page variables
                        Variables.getPageVariables(pageName, function (variables) {
                            Variables.register(pageName, variables, true, variableScope);

                            // expose partial page's Variabes to its container's scope (to be visible to parent)
                            if (containerScope) {
                                containerScope.Variables = $s.Variables;
                                containerScope.Actions = $s.Actions;
                            }

                            // if specified, call page variables ready function in the page.js
                            if (!appVariableReadyFired) {
                                Utils.triggerFn($rs.onAppVariablesReady, $rs.Variables);
                                appVariableReadyFired = true;
                            }

                            Utils.triggerFn($s.onPageVariablesReady);
                        });
                    },
                    'post': function ($s, $el, attrs) {
                        var handlers = [];
                        //check if the view is run mode then initialize the mobile behavior
                        if (CONSTANTS.isRunMode) {
                            // register session timeout handler
                            handlers.push($rs.$on('on-sessionTimeout', $s.onSessionTimeout));

                            Utils.triggerFn($s._onPageLoad);
                        }
                        // destroy variables
                        $el.on('$destroy', function () {
                            Variables.unload($s._pageName, $s);
                            handlers.forEach(Utils.triggerFn);
                        });
                    }
                }
            };
        }
    ])
    .directive('wmPartial', [
        'CONSTANTS',
        '$rootScope',
        'Utils',
        'Variables',
        '$timeout',

        function (CONSTANTS, $rs, Utils, Variables, $timeout) {
            'use strict';

            function triggerOnReady($s) {
                $timeout(function () {
                    $rs.$$postDigest(function () {
                        /* triggering the event post digest, so that any expression watches are computed before the same*/
                        $rs.$emit('partial-ready', $s);

                        // trigger onPageReady method if it is defined in the controller of partial
                        if ($s.hasOwnProperty('onPageReady')) {
                            Utils.triggerFn($s.onPageReady);
                            $s.registerPagePart = $s.onPagePartLoad = _.noop;
                        }
                        // trigger the onPagePartLoad of parent container
                        Utils.triggerFn($s.onPagePartLoad);
                    });
                });
            }

            //Sets variables for a parital page
            function setVariables($s, containerScope, variableScope, pageName) {
                Variables.getPageVariables(pageName, function (variables) {
                    //Set partial name on variable for included partial variables
                    if($s.partialname) {
                        _.forEach(variables, function (value) {
                            value._partialname = $s.partialname;
                        });
                    }
                    Variables.register(pageName, variables, true, variableScope);

                    // expose partial's Variables to its container's scope (to be visible to parent)
                    if (containerScope) {
                        containerScope.Variables = $s.Variables;
                        containerScope.Actions = $s.Actions;
                    }
                });
            }

            return {
                'restrict'   : 'E',
                'replace'    : true,
                'transclude' : true,
                'template'   : '<section data-role="partial" class="app-partial clearfix" wmtransclude></section>',
                'link'       : {
                    'pre': function ($s, $el, attrs) {
                        var pageName,
                            variableScope,
                            containerScope,
                            count = 0,
                            hasLazyWidgets;

                        pageName      = $s.partialname || $rs._toBeActivatedPage ;
                        variableScope = (CONSTANTS.isStudioMode && !$s.prefabname && !$s.partialname) ? $rs.domScope : $s;
                        $s._pageName = pageName;

                        if (CONSTANTS.isRunMode) {
                            $s.Widgets   = {};
                            $s.Variables = {};
                            $s.Actions = {};

                            // get partial container's scope
                            containerScope = $s.Widgets && $s.Widgets[$s.partialcontainername];

                            // expose partial's Widgets to its container's scope (to be visible to parent)
                            if (containerScope) {
                                containerScope.Widgets = $s.Widgets;
                            }

                            /**
                             * Will be called when a lazy widget (eg, calendar) or any partial is found in the markup,
                             * increment the counter to keep track of the number components to be loaded before triggering onPageReady
                             */
                            $s.registerPagePart = function () {
                                count++;
                                hasLazyWidgets = true;
                            };

                            /**
                             * Will be called when a page part (lazy widget or partial) is loaded.
                             * Decrement the counter, when all the page parts are loaded(ie, count become zero) trigger the onPageReady
                             * and trigger the onPagePartLoad of parent container.
                             */
                            $s.onPagePartLoad = function () {
                                --count; // decrement the counter when a pageContainer is ready
                                if (!count) {
                                    triggerOnReady($s);
                                }
                            };

                            /**
                             * This method will be called when a partial is loaded.
                             * If the partial doesn't contain any lazy widgets or partials
                             * invoke the onPageReady of the partial and invoke the onPagePartLoad of the parent container
                             */
                            $s._onPartialLoad = function () {
                                if (!hasLazyWidgets || !count) {
                                    triggerOnReady($s);
                                }
                            };

                        } else {
                            containerScope = $s.Widgets && $s.Widgets[$s.partialcontainername];
                            if (containerScope && WM.isDefined(containerScope.Widgets)) {
                                containerScope.Widgets = $s.Widgets = {};
                            }
                        }

                        setVariables($s, containerScope, variableScope, pageName);
                    },
                    'post': function ($s, $el, attrs) {

                        var handlers = [];
                        //check if the view is run mode then initialize the mobile behavior
                        if (CONSTANTS.isRunMode) {
                            // register session timeout handler
                            handlers.push($rs.$on('on-sessionTimeout', function () {
                                //check if 'onSessionTimeout' event is present in current partial page script
                                if ($s.hasOwnProperty('onSessionTimeout')) {
                                    Utils.triggerFn($s.onSessionTimeout);
                                }
                            }));

                            /**
                             * _onPartialMethod will trigger the onPageReady of the Partial and onPagePartLoad
                             * of the parent container once all the components(lazy widgets, partials) are loaded.
                             */
                            $s._onPartialLoad();
                        }
                        // canvasTree will listen for this event and will hide itself upon occurrence of it
                        $el.on('$destroy', function () {
                            // destroy loaded variables
                            Variables.unload($s._pageName, $s);
                            handlers.forEach(Utils.triggerFn);
                        });
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmPage
 * @restrict E
 *
 * @description
 * The 'wmPage' directive defines a page in the layout.
 * It is the main container which encloses the layout elements (Header, Nav bar, Content, Footer, Left and Right Panel).
 * It can optionally have views as child containers (As in case of a dialog).
 * It contains the layout definition (One column, two column etc).
 *
 * @requires DeviceViewService
 *
 * @param {string=} layouttype
 *                  Type of the layout.
 * @param {string=} columns
 *                  Number of columns in the content, this is required for dom manipulation in mobile view.<br>
 * @param {string=} data-ng-controller
 *                  The name of the controller for the page.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div class="wm-app">
                <wm-page data-ng-controller="MainPageController">
                    <wm-header height="50" backgroundcolor="teal">Content of Header</wm-header>
                     <wm-top-nav height="30" backgroundcolor="tomato">Content of TopNav</wm-top-nav>
                     <wm-content>
                         <wm-left-panel columnwidth="2" backgroundcolor="#fd4c70">Content of LeftNav</wm-left-panel>
                         <wm-page-content columnwidth="8" backgroundcolor="#0097a4">Content of Page</wm-page-content>
                         <wm-right-panel columnwidth="2" backgroundcolor="#934cfd">Content of RightNav</wm-right-panel>
                     </wm-content>
                     <wm-footer backgroundcolor="#f66f8a">Content of Footer</wm-footer>
                </wm-page>
            </div>
        </file>
        <file name="script.js">
            function MainPageController($scope) {}
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmPartial
 * @restrict E
 *
 * @description
 * The 'wmPartial' directive defines a part of a page in the layout. <br>
 * Page container widgets(eg, header, footer etc) can include wmPartials.
 *
 *
 * @param {string=} data-ng-controller
 *                  The name of the controller for the page.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div class="wm-app">
                <wm-partial data-ng-controller="MainPageController">
                    <wm-button caption="button1" backgroundcolor="cadetblue"></wm-button>
                </wm-partial>
            </div>
        </file>
        <file name="script.js">
            function MainPageController ($scope) {}
        </file>
    </example>
 */
