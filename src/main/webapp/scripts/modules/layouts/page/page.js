/*global WM, _*/

WM.module('wm.layouts.page')
    .directive('wmPage', ['DeviceViewService', 'CONSTANTS', '$rootScope', '$routeParams', 'Utils', '$timeout', 'Variables', 'NavigationVariableService', function (DeviceViewService, CONSTANTS, $rootScope, $routeParams, Utils, $timeout, Variables, NavigationVariableService) {
        'use strict';

        var extendVariables = function (scope, variables) {
            WM.forEach(variables, function (variable, name) {
                if (!scope.Variables.hasOwnProperty(name)) {
                    Object.defineProperty(scope.Variables, name, {
                        configurable: true,
                        get: function () {
                            return variable;
                        }
                    });
                }
            });
        };

        return {
            'restrict': 'E',
            'replace': true,
            'transclude': true,
            'template': '<div data-role="pageContainer" class="app-page container" wmtransclude></div>',
            'compile': function () {
                return {
                    'pre': function (scope, element, attrs) {
                        var pageName = (!$rootScope.isPrefabTemplate && scope.prefabname) || ($rootScope.isPrefabTemplate && "Main") || attrs.ngController.replace('PageController', ''),
                            variableScope = CONSTANTS.isStudioMode && !scope.prefabname && !scope.$parent.partialname ? $rootScope.domScope : scope,
                            containerScope,
                            count,
                            subView;

                        if (CONSTANTS.isRunMode) {
                            scope.Variables = {};
                            scope.Widgets = {};
                            /* only expose the widgets of the active page to rootScope */
                            if (!scope.$parent.partialname && !scope.prefabname) {
                                $rootScope.Widgets = scope.Widgets;
                            }
                            if (scope.$parent.partialname) {
                                /* get partial page container's scope */
                                containerScope = scope.$parent.Widgets && scope.$parent.Widgets[scope.$parent.partialcontainername];

                                /* expose partial's Widgets to its container's scope (to be visible to parent) */
                                if (containerScope) {
                                    containerScope.Widgets = scope.Widgets;
                                }
                            }
                        }

                        // define registerPageContainer and onPageContainerLoad methods in Run Mode.
                        if (!scope.registerPageContainer && CONSTANTS.isRunMode) {
                            count = 0;

                            scope.layout = {
                                'leftSection': false,
                                'rightSection': false,
                                'header': false,
                                'footer': false,
                                'search': false
                            };

                            scope.onPageLoad = function () {
                                // if the count is zero(means the page is ready), trigger update method of DeviceViewService
                                if (!count) {
                                    //trigger the onPageReady method
                                    Utils.triggerFn(scope.onPageReady);

                                    /* if subview element names found (appended with page-name after a '.'), navigate to the view element */
                                    if ($routeParams && $routeParams.name) {
                                        subView = $routeParams.name.split(".");
                                        if (subView.length > 1) {
                                            NavigationVariableService.navigateToView(subView.pop());
                                        }
                                    }

                                    /* update layout after the page is rendered */

                                    scope.layout.search = element.find('.app-header .app-search').length > 0;
                                    scope.layout.leftSection = element.find('[data-role="page-left-panel"]').length > 0;
                                    scope.layout.rightSection = element.find('[data-role="page-right-panel"]').length > 0;

                                    // update the device after some delay
                                    $timeout(function () {
                                        DeviceViewService.update(element, scope.layout.leftSection, scope.layout.rightSection, scope.layout.search);
                                    });
                                }
                            };

                            // increment the counter when a pageContainer is registered
                            scope.registerPagePart = function () {
                                count++;
                            };

                            scope.onPagePartLoad = function () {
                                --count; // decrement the counter when the a pageContainer is ready
                                scope.onPageLoad();
                            };

                            /* if specified, call handle route function in the page.js */
                            if (WM.isFunction(scope.handleRoute)) {
                                /*gather all the routeParams, send them as arguments to the fn except first element, as first element is pageName */
                                scope.handleRoute.apply(undefined, _.values($routeParams).slice(1));
                            }
                        }

                        /* register the page variables */
                        Variables.getPageVariables(pageName, function (variables) {
                            Variables.register(pageName, variables, true, variableScope);

                            /* update variables tree in studio */
                            if (CONSTANTS.isStudioMode && !scope.prefabname) {
                                $rootScope.$emit('update-variables-tree');
                            }

                            /* expose partial page's Variabes to its container's scope (to be visible to parent) */
                            if (containerScope) {
                                containerScope.Variables = scope.Variables;
                            }

                            /* if app variables loaded, extend page variables with them */
                            if ($rootScope.Variables) {
                                extendVariables(variableScope, $rootScope.Variables);
                                /* if specified, call page variables ready function in the page.js */
                                Utils.triggerFn(scope.onPageVariablesReady);
                            } else {
                                /* listen to the page-variables-ready event */
                                element.on('$destroy', $rootScope.$on('on-app-variables-ready', function (event, appVariables) {
                                    extendVariables(variableScope, $rootScope.Variables);
                                    /* if specified, call app variables ready function in the app.js */
                                    Utils.triggerFn(scope.$root.onAppVariablesReady, appVariables);
                                    /* if specified, call page variables ready function in the page.js */
                                    Utils.triggerFn(scope.onPageVariablesReady);
                                }));
                            }
                        });
                    },
                    'post': function (scope, element, attrs) {
                        element.addClass('layout-' + attrs.layouttype);

                        var handlers = [];
                        //check if the view is run mode then initialize the mobile behavior
                        if (CONSTANTS.isRunMode) {
                            Utils.triggerFn(scope.onPageLoad);
                            element.on('$destroy', function () {
                                /*destroy variables*/
                                Variables.unload(attrs.ngController.replace('PageController', ''), scope);
                                handlers.forEach(Utils.triggerFn);
                            });
                        }
                    }
                };
            }
        };
    }])
    .directive('wmPartial', ['CONSTANTS', '$rootScope', 'Utils', 'Variables', function (CONSTANTS, $rootScope, Utils, Variables) {
        'use strict';

        var extendVariables = function (scope, variables) {
            WM.forEach(variables, function (variable, name) {
                if (!scope.Variables.hasOwnProperty(name)) {
                    Object.defineProperty(scope.Variables, name, {
                        configurable: true,
                        get: function () {
                            return variable;
                        }
                    });
                }
            });
        };


        return {
            'restrict': 'E',
            'replace': true,
            'transclude': true,
            'template': '<section  data-role="partial" class="app-partial clearfix" wmtransclude></section>',
            'compile': function () {
                return {
                    'pre': function (scope, element, attrs) {
                        var pageName = attrs.ngController.replace('PageController', ''),
                            variableScope = CONSTANTS.isStudioMode && !scope.prefabname && !scope.$parent.partialname ? $rootScope.domScope : scope,
                            containerScope;
                        if (CONSTANTS.isRunMode) {
                            scope.Widgets = {};
                            scope.Variables = {};

                            /* get partial container's scope */
                            containerScope = scope.$parent.Widgets && scope.$parent.Widgets[scope.$parent.partialcontainername];

                            /* expose partial's Widgets to its container's scope (to be visible to parent) */
                            if (containerScope) {
                                containerScope.Widgets = scope.Widgets;
                            }
                        }

                        if (CONSTANTS.isStudioMode) {
                            containerScope = scope.$parent.Widgets && scope.$parent.Widgets[scope.$parent.partialcontainername];
                            if (containerScope && WM.isDefined(containerScope.Widgets)) {
                                scope.Widgets = {};
                                containerScope.Widgets = scope.Widgets;
                            }
                        }

                        Variables.getPageVariables(pageName, function (variables) {
                            Variables.register(pageName, variables, true, variableScope);

                            /* expose partial's Variables to its container's scope (to be visible to parent) */
                            if (CONSTANTS.isRunMode && containerScope) {
                                containerScope.Variables = scope.Variables;
                            }

                            if ($rootScope.Variables) {
                                extendVariables(scope, $rootScope.Variables);
                                if (CONSTANTS.isRunMode && scope.hasOwnProperty('onPageVariablesReady')) {
                                    Utils.triggerFn(scope.onPageVariablesReady, scope.Variables);
                                }
                            } else {
                                /* listen to the page-variables-ready event */
                                element.on('$destroy', $rootScope.$on('on-app-variables-ready', function (event, appVariables) {
                                    extendVariables(scope, $rootScope.Variables);
                                    /* if specified, call app variables ready function in the app.js */
                                    Utils.triggerFn(scope.$root.onAppVariablesReady, appVariables);
                                    if (CONSTANTS.isRunMode && scope.hasOwnProperty('onPageVariablesReady')) {
                                        Utils.triggerFn(scope.$root.onAppVariablesReady, appVariables);
                                        Utils.triggerFn(scope.onPageVariablesReady);
                                    }
                                }));
                            }
                        });
                    },
                    'post': function (scope, element, attrs) {

                        var handlers = [];
                        //check if the view is run mode then initialize the mobile behavior
                        if (CONSTANTS.isRunMode) {
                            // trigger onPageReady method if it is defined in the controller of partial
                            if (scope.hasOwnProperty('onPageReady')) {
                                Utils.triggerFn(scope.onPageReady);
                            }
                        }
                        /* canvasTree will listen for this event and will hide itself upon occurrence of it */
                        element.on('$destroy', function () {
                            /* destroy loaded variables */
                            Variables.unload(attrs.ngController.replace('PageController', ''), scope);
                            handlers.forEach(Utils.triggerFn);
                        });
                    }
                };
            }
        };
    }]);

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
 *<example module="wmCore">
 *    <file name="index.html">
 *        <div class="wm-app">
 *            <wm-page layouttype="three-column" columns="3" name="page1" data-ng-controller="MainPageController">
 *                <wm-header name="header1" backgroundcolor="#b4d5e0">
 *                </wm-header>
 *                <wm-top-nav name="top-nav1" backgroundcolor="#879488">
 *                    <wm-list horizontalalign="left" name="list1" backgroundcolor="#d1c9a9">
 *                        <wm-list-item name="list-item1" backgroundcolor="#c9ab87" >
 *                            <wm-anchor caption="Home" name="anchor1"  target="_top"></wm-anchor>
 *                        </wm-list-item>
 *                        <wm-list-item name="list-item2" backgroundcolor="#c9ab87">
 *                            <wm-anchor caption="Services" name="anchor2"  target="_top"></wm-anchor>
 *                        </wm-list-item>
 *                    </wm-list>
 *                </wm-top-nav>
 *                <wm-content name="content1" height="70%">
 *                    <wm-row name="row1">
 *                        <wm-left-panel contentwidth="2" name="left-panel1" backgroundcolor="#d6baba"></wm-left-panel>
 *                        <wm-column class="app-content-column" columnwidth="8" name="column1" backgroundcolor="#b0ced9">
 *                        </wm-column>
 *                        <wm-right-panel contentwidth="2" name="right-panel1" backgroundcolor="#86aab5"></wm-right-panel>
 *                    </wm-row>
 *                </wm-content>
 *                <wm-footer name="footer1">
 *                </wm-footer>
 *            </wm-page>
 *        </div>
 *    </file>
 *     <file name="script.js">
 *           function MainPageController ($scope) {
 *           }
 *     </file>
 *</example>
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
 *<example module="wmCore">
 *    <file name="index.html">
 *        <div class="wm-app">
 *            <wm-partial name="header" data-ng-controller="HeaderPageController">
 *                <wm-button caption="button1" name="button1" backgroundcolor="cadetblue"></wm-button>
 *            </wm-partial>
 *        </div>
 *    </file>
 *     <file name="script.js">
 *           function HeaderPageController ($scope) {
 *           }
 *     </file>
 *</example>
 */
