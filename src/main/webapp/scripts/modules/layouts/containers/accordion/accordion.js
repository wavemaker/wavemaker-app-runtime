/*global WM, _ */
/*jslint todo: true */
/*Directive for Accordion */
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/layout/container/accordion.html', '<div class="app-accordion panel-group" wmtransclude init-widget data-ng-show="show" apply-styles="container"></div>');

        $templateCache.put('template/layout/container/accordion-pane.html',
            '<div class="app-accordion-panel panel panel-default" init-widget wmtransclude data-ng-show="show" wm-navigable-element="true"></div>'
            );

        $templateCache.put('template/layout/container/accordion-header.html',
                '<div class="panel-heading" data-ng-click="pane.togglePane()" init-widget apply-styles="container">' +
                    '<h3 class="panel-title">' +
                        '<a href="javascript:void(0)" class="accordion-toggle" wmtransclude></a>' +
                    '</h3>' +
                    '<div class="panel-actions"><span class="label label-{{badgetype}}">{{badgevalue}}</span><button type=button class="app-icon glyphicon panel-action" data-ng-class="pane.active ? \'glyphicon-minus\': \'glyphicon-plus\'"></button></div>' +
                '</div>'
            );
        $templateCache.put('template/layout/container/accordion-content.html',
                '<div class="panel-collapse collapse"  data-ng-class="pane.active ? \'collapse in\' : \'collapse\'" init-widget page-container apply-styles="container">' +
                    '<div class="panel-body" wmtransclude page-container-target></div>' +
                '</div>'
            );
    }])
    .directive('wmAccordion', ['$templateCache', 'WidgetUtilService', 'PropertiesFactory', function ($templateCache, WidgetUtilService, PropertiesFactory) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.accordion', ['wm.base',  'wm.containers']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': $templateCache.get('template/layout/container/accordion.html'),
            'controller': function ($scope) {
                /* Contains the isolateScopes of accordion-panes. */
                this.panes = [];

                /* save the scope of the accordion-pane */
                this.register = function (paneScope) {
                    this.panes.push(paneScope);
                };

                /* function to collapse the accordion-panes */
                this.closeOthers = function () {
                    /* process the request only when closeothers attribute is present on accordion */
                    if ($scope.closeothers) {
                        WM.forEach(this.panes, function (pane) {
                            if (pane.active) {
                                /* trigger the onCollapse method on the pane which is about to be collapsed */
                                pane.onCollapse();
                            }
                            /* update the `active` flag of the pane */
                            pane.active = false;
                        });
                    }
                };
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs, ctrl) {
                        var defaultPane;
                        defaultPane = _.find(ctrl.panes, function (pane) { return pane.isdefaultpane; }) || ctrl.panes[0];
                        defaultPane.expand();

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmAccordionpane', ['$templateCache', 'WidgetUtilService', 'PropertiesFactory', 'Utils', function ($templateCache, WidgetUtilService, PropertiesFactory, Utils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.accordionpane', ['wm.base']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'onExpand': '&',
                'onCollapse': '&'
            },
            'transclude': true,
            'template': $templateCache.get('template/layout/container/accordion-pane.html'),
            'require': '^wmAccordion',
            'controller': function ($scope) {
                /* returns the scope of the accordion pane. accordion-header and accordion-content uses this */
                this.getPaneScope = function () {
                    return $scope;
                };
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs, panesCtrl) {

                        /* register accordion-pane with accordion */
                        panesCtrl.register(scope);

                        /* toggle the state of the pane */
                        scope.togglePane = function () {
                            /* flip the active flag */
                            scope.active = !scope.active;
                            if (scope.active) {
                                /* some widgets like charts needs to be redrawn when a accordion pane becomes active for the first time */
                                element.find('.ng-isolate-scope')
                                    .each(function () {
                                        Utils.triggerFn(WM.element(this).isolateScope().redraw);
                                    });
                                // when accordionContent is set to display external page, triggering $lazyLoad on expand of the accordion pane will render the content.
                                Utils.triggerFn(scope.accordionContent.$lazyLoad);
                                /* trigger the onExpand call back */
                                scope.onExpand();
                                panesCtrl.closeOthers(scope);
                                scope.active = true;
                            } else {
                                /* trigger the onCollapse callback */
                                scope.onCollapse();
                            }
                        };

                        /* Expose the method `expand` on pane. Triggering this method will expand the pane. */
                        scope.expand = function () {
                            if (!scope.active) {
                                scope.togglePane();
                            }
                        };

                        /* Expose the method `collapse` on pane. Triggering this method will collapse the pane. */
                        scope.collapse = function () {
                            if (scope.active) {
                                scope.togglePane();
                            }
                        };

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmAccordionheader', ['$templateCache', 'WidgetUtilService', 'PropertiesFactory', '$compile', function ($templateCache, WidgetUtilService, PropertiesFactory, $compile) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.accordionheader', ['wm.base', 'wm.layouts']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': $templateCache.get('template/layout/container/accordion-header.html'),
            'require': '^wmAccordionpane',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                        if (scope.widgetProps.show) {
                            delete scope.widgetProps.show;// show property should be handled from pane.
                        }
                    },
                    'post': function (scope, element, attrs, paneCtrl) {
                        var transcludeTarget = element.find('[wmtransclude]'),
                            template;

                        if (transcludeTarget.children().length === 0) { /* if there is no transcluded content, use the default template for the header */
                            template =
                                '<i class="app-icon panel-icon {{iconclass}}" data-ng-show="iconclass"></i>' +
                                '<span class="heading" data-ng-bind-html="heading"></span>' +
                                '<span class="description" data-ng-bind-html="description"></span>';
                            transcludeTarget.append($compile(template)(scope));
                        }
                        scope.pane = paneCtrl.getPaneScope();
                        scope.pane.isdefaultpane = scope.isdefaultpane;

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmAccordioncontent', ['$templateCache', 'WidgetUtilService', 'PropertiesFactory', 'CONSTANTS', function ($templateCache, WidgetUtilService, PropertiesFactory, CONSTANTS) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.accordioncontent', ['wm.base', 'wm.layouts',  'wm.containers']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': $templateCache.get('template/layout/container/accordion-content.html'),
            'require': '^wmAccordionpane',
            'compile': function () {
                return {
                    'pre': function (iScope) {

                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = WM.copy(widgetProps);
                            delete iScope.widgetProps.show;
                        } else {
                            iScope.widgetProps = widgetProps;
                        }

                        // define $lazyLoad method on iScope.
                        // pageContainer widget will override this.
                        iScope.$lazyLoad = WM.noop;
                    },
                    'post': function (iScope, element, attrs, paneCtrl) {
                        iScope.pane = paneCtrl.getPaneScope();

                        // save a reference of accordionContent in accordionPane
                        // accordionPane will use this reference to trigger $lazyLoad method.
                        iScope.pane.accordionContent = iScope;

                        // define isActive property on the iScope of accordion content.
                        // this property will be used by page-container directive.
                        // when content property is set, the page corresponding to the value of content will be loaded on demand.
                        // if the pane is active (i.e, expanded) page will be loaded immediately.
                        Object.defineProperty(iScope, 'isActive', {
                            get: function () {
                                return this.pane.active;
                            }
                        });
                        WidgetUtilService.postWidgetCreate(iScope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmAccordion
 * @restrict E
 *
 * @description
 * The `wmAccordion` directive defines accordion widget. <br>
 * wmAccordion can only contain wmAccordionpane widgets. <br>
 * wmAccordion can not be inside wmAccordion. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the accordion.
 * @param {string=} tabindex
 *                  The tabindex attribute specifies the tab order of an element.
 * @param {string=} width
 *                  Width of the accordion.
 * @param {string=} height
 *                  Height of the accordion.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the accordion on the web page. <br>
 *                  default value: `true`.
 * @param {boolean=} closeothers
 *                  True value for closeothers property will collapse the panes that are expanded on expand of a pane. <br>
 *                  False value for closeothers property will not collapse the expaneded panes on expand of a pane. <br>
 *                  Default value: `true`.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-accordion width="400px" height="400px" closeothers="false" horizontalalign='right'>
                    <wm-accordionpane>
                        <wm-accordionheader heading="pane1"></wm-accordionheader>
                        <wm-accordioncontent>content of the pane1</wm-accordioncontent>
                    </wm-accordionpane>
                    <wm-accordionpane>
                        <wm-accordionheader heading="pane2"></wm-accordionheader>
                        <wm-accordioncontent>content of pane 2</wm-accordioncontent>
                    </wm-accordionpane>
                </wm-accordion>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmAccordionpane
 * @restrict E
 *
 * @description
 * The `wmAccordionpane` directive defines accordion-pane widget. <br>
 * wmAccordionpane can be used only inside wmAccordion. <br>
 * wmAccordionpane can not be inside wmAccordionpane. <br>
 * accordion-pane can be expanded/collapsed using the scope methods expand/collapse respectively.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the accordionpane.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the accordion on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} on-expand
 *                  Callback function which will be triggered when the pane is expanded.
 * @param {string=} on-collapse
 *                  Callback function which will be triggered when the pane is collapsed.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-accordion>
                    <wm-accordionpane on-expand="expandCallback()" on-collapse="collapseCallback()">
                        <wm-accordionheader heading="pane1"></wm-accordionheader>
                        <wm-accordioncontent>content of the pane1</wm-accordioncontent>
                    </wm-accordionpane>
                    <wm-accordionpane>
                        <wm-accordionheader heading="pane2"></wm-accordionheader>
                        <wm-accordioncontent>content of pane 2</wm-accordioncontent>
                    </wm-accordionpane>
                </wm-accordion>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.expandCallback = function () {
                    console.log("inside expand callback");
                }
                $scope.collapseCallback = function () {
                    console.log("inside collapse callback");
                }
            }
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmAccordionheader
 * @restrict E
 *
 * @description
 * The `wmAccordionheader` directive defines accordion-header widget. <br>
 * wmAccordionheader can be used only inside wmAccordionpane. <br>
 * If there is no transcluded content, default template will be used. <br>
 *
 * Default template:<br>
 * &lt;i class="app-icon" data-ng-show = "iconsource"  data-ng-style ="{backgroundImage:iconsource}"&gt;&nbsp;&lt;/i&gt;
 *  {{heading}} <span class="description" data-ng-if="description"&gt; - { {description} }&lt;/span&gt;
 * &lt; class="app-icon" data-ng-class="pane.active ? panel-open-false: panel-open-true"&gt;&nbsp;&lt;/i&gt;
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $compile
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the accordionheader.
 * @param {string=} heading
 *                  Title of the header. <br>
 *                  This property is bindable. <br>
 *                  Default value: `Heading`. <br>
 *                  This is will be used only when the default template is used.
 * @param {string=} description
 *                  description of the accordion header. <br>
 *                  This is will be used only when the default template is used.
 * @param {string=} iconclass
 *                  Icon which we displayed on the header. <br>
 *                  This property is bindable. <br>
 *                  This is will be used only when the default template is used.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the accordion on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  Align the content of the accordion-header to left/right/center. <br>
 *                  Default value: `left`.
 * @param {boolean=} isdefaultpane
 *                  This is a bindable property. <br>
 *                  It will be used to make one accordion pane open by default. <br>
 *                  Default value: `false`.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-accordion>
                    <wm-accordionpane>
                        <wm-accordionheader heading="{{heading1}}" description="{{description1}}"></wm-accordionheader>
                        <wm-accordioncontent>content of the pane1</wm-accordioncontent>
                    </wm-accordionpane>
                    <wm-accordionpane>
                    <wm-accordionheader><a><i class="default-pane-icon"></i><span>Pane2</span></a></wm-accordionheader>
                        <wm-accordioncontent>content of pane 2</wm-accordioncontent>
                    </wm-accordionpane>
                </wm-accordion>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.heading1 = "Pane1";
                $scope.description1 = "this is pane1";
            }
        </file>
    </example>
 */


/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmAccordioncontent
 * @restrict E
 *
 * @description
 * The `wmAccordioncontent` directive defines accordion-content widget. <br>
 * wmAccordioncontent can be used only inside wmAccordionpane.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the accordioncontent.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the accordion on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  Align the content of the accordion-content to left/right/center.
 *                  Default value: `left`.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-accordion>
                    <wm-accordionpane>
                        <wm-accordionheader heading="{{heading1}}" description="{{description1}}"></wm-accordionheader>
                        <wm-accordioncontent>
                            This is the content of Pane1
                            <wm-button caption="inside pane1" on-click="f()"></wm-button>
                        </wm-accordioncontent>
                    </wm-accordionpane>
                    <wm-accordionpane>
                        <wm-accordionheader><a><i class="default-pane-icon"></i><span>Pane2</span></a></wm-accordionheader>
                        <wm-accordioncontent>
                            {{pane2content}}
                        </wm-accordioncontent>
                    </wm-accordionpane>
                    <wm-accordionpane show="{{showPane3}}">
                        <wm-accordionheader heading="pane3"></wm-accordionheader>
                        <wm-accordioncontent>
                            this is pane 3
                        </wm-accordioncontent>
                    </wm-accordionpane>
                </wm-accordion>

                <wm-button on-click="toggle()" caption="{{showHidePane}}"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.heading1 = "Pane1";
                $scope.description1 = "this is pane1";
                $scope.showPane3 = false;
                $scope.showHidePane = "Show Pane 3";

                $scope.f = function () {
                    console.log(" inside function f");
                }

                $scope.toggle = function () {
                    $scope.showPane3 = !$scope.showPane3;
                    if($scope.showPane3) {
                        $scope.showHidePane = "Hide Pane 3";
                    } else {
                        $scope.showHidePane = "Show Pane 3";
                    }
                }

                $scope.pane2content = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
            }
        </file>
    </example>
 */
