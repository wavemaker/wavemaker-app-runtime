/*global WM, */
/*jslint todo: true */
/*Directive for tabs */

WM.module('wm.layouts.containers')
    .run(['$rootScope', '$templateCache', function ($rootScope, $templateCache) {
        'use strict';

        /* define the template for the tabs directive */
        $templateCache.put('template/layout/container/tabs.html',
                '<div class="app-tabs clearfix" init-widget data-ng-show="show"' + $rootScope.getWidgetStyles('shell') + '>' +
                    '<ul class="nav nav-tabs" data-ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}"></ul>' +
                    '<div class="tab-content"' + $rootScope.getWidgetStyles('container') + '  data-ng-class="{\'tab-stacked\': vertical, \'tab-justified\': justified}" wmtransclude></div>' +
                '</div>'
            );

        /* define the template for the tabpane directive */
        $templateCache.put('template/layout/container/tab-pane.html',
            '<div class="tab-pane" wmtransclude init-widget data-ng-show="show" data-ng-class="{active: isActive, disabled:disabled}" wm-navigable-element="true"></div>');

        /* define the template for the tabheader directive */
        $templateCache.put('template/layout/container/tab-header.html',
            '<li class="tab-header" data-ng-class="{active: tab.isActive, disabled: tab.disabled}" data-ng-show="tab.show" data-tab-id="{{tab.widgetid}}" data-ng-click="tab.select()" init-widget>' +
                '<a wmtransclude'  + $rootScope.getWidgetStyles('container') + '></a>' +
            '</li>');

        /* define the template for the tabcontent directive */
        $templateCache.put('template/layout/container/tab-content.html',
            '<div page-container wmtransclude page-container-target class="tab-body" data-tab-id="{{tab.widgetid}}" init-widget'  + $rootScope.getWidgetStyles() + '></div>');

    }])
    .directive('wmTabs', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', '$compile', 'CONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, $compile, CONSTANTS) {
        'use strict';

        /* get the properties related to the tabs */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabs', ['wm.base', 'wm.layouts', 'wm.containers']);

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'transclude': true,
            'template': $templateCache.get('template/layout/container/tabs.html'),
            /* define the controller for the tabs directive. tabpane directive will use this. */
            'controller': function ($scope, $element) {

                /* array which contains the scopes of the tabpanes */
                $scope.tabs = [];
                /* this method will register a tabpane with the tabs
                 * save the scope of the tabpane in the tabs array
                 */
                this.register = function (tabScope) {
                    $scope.tabs.push(tabScope);
                };

                /*
                 * this method will unregister a tabpane.
                 * remove the scope of the tabpane from the tabs array
                 */
                this.unregister = function (tab) {
                    var i, len = $scope.tabs.length;
                    for (i = 0; i < len; i++) { /* find the tab to be removed using the $id */
                        if ($scope.tabs[i].$id === tab.$id) {
                            break;
                        }
                    }
                    $scope.tabs.splice(i, 1); /* remove the tabpane from the tabs array */
                    /* remove the tabheader and tabcontent elements of the tab which is just removed/unregisterd */
                    $element.find('[data-tab-id="' + tab.widgetid + '"]').remove();
                };

                /*
                 * this method will be triggered by a tab when it is selected using the user click option.
                 * if there is any activeTab, set the active flag on it to false and trigger onDeselect callback of it
                 * trigger the onSelect callback of the selected tab
                 */
                this.selectTab = function (tab, skipOnSelect) {
                    var _tab = $scope.activeTab,
                        i,
                        tabs = $scope.tabs;
                    if (_tab) {
                        _tab.onDeselect();
                        _tab.isActive = false;
                    }
                    $scope.activeTab = tab;

                    for (i = 0; i < tabs.length; i++) {
                        if ($scope.activeTab.$id === tabs[i].$id) {
                            $scope.activeTabIndex = i;
                            break;
                        }
                    }

                    if (!skipOnSelect) {
                        tab.onSelect();
                    }

                };

                /* make selectedTab method available to the isolateScope of the tabs directive. */
                $scope.selectTab = this.selectTab;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /* save the reference to widgetProps in scope */
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {

                        var tabs = scope.tabs,
                            activeTab,
                            tab,
                            toolTipTarget,
                            addNewBtnTemplate =
                                '<li class="wm-widget-toolbar">' +
                                    '<button class="btn app-button add-new-tab" data-ng-click="_addNewTab()">' +
                                        '<i class="wm-icon add"></i>' +
                                        '{{::$root.locale.LABEL_ADD}}' +
                                    '</button>' +
                                '</li>';
                        /* find the first tab which has isdefaulttab set and make it active.
                         * mark the other tabs as inactive
                         */
                        tabs.forEach(function (tab) {
                            if (!activeTab) {
                                if (tab.isdefaulttab) {
                                    activeTab = tab;
                                }
                            } else {
                                tab.isActive = false;
                            }
                        });

                        /*selects a given tab and executes onBeforeSwitchTab before switching*/
                        function selectTab(tab, onBeforeSwitchTab) {
                            /*trigger onBeforeSwitchTab callback before switching*/
                            Utils.triggerFn(onBeforeSwitchTab);

                            if (tab) {
                                tab.select();
                            }
                        }

                        /* if isdefaulttab is not set on any of the tabs, then set the first tab as active */
                        activeTab = activeTab || tabs[0];
                        /*Set active only if at least one is present*/
                        if (activeTab) {
                            activeTab.isActive = true;
                            scope.selectTab(activeTab, true);
                        }
                        /**
                         * @ngdoc function
                         * @name wm.layouts.containers.directive:wmTabs#next
                         * @methodOf wm.layouts.containers.directive:wmTabs
                         * @function
                         *
                         * @description
                         * This methods moves from the current active tabpane to next tabpane
                         *
                         * @param {function} onBeforeSwitchTab
                         *                 Callback function to be triggered before moving to next tab.
                         */
                        /*method exposed to move to next tab from current active tab*/
                        scope.next = function (onBeforeSwitchTab) {
                            selectTab(tabs[scope.activeTabIndex + 1], onBeforeSwitchTab);
                        };

                        /**
                         * @ngdoc function
                         * @name wm.layouts.containers.directive:wmTabs#previous
                         * @methodOf wm.layouts.containers.directive:wmTabs
                         * @function
                         *
                         * @description
                         * This methods moves from the current tabpane to previous tabpane
                         *
                         * @param {function} onBeforeSwitchTab
                         *                 Callback function to be triggered before moving to previous tab.
                         */
                        /*method exposed to move to previous tab from current active tab*/
                        scope.previous = function (onBeforeSwitchTab) {
                            selectTab(tabs[scope.activeTabIndex - 1], onBeforeSwitchTab);
                        };
                        /**
                         * @ngdoc function
                         * @name wm.layouts.containers.directive:wmTabs#goToTab
                         * @methodOf wm.layouts.containers.directive:wmTabs
                         * @function
                         *
                         * @description
                         * This methods moves from the current tabpane to a given tab.
                         *
                         * @param {number} tabNum
                         *                 tabNumber to which the user needs to switch.(starts from 1)
                         * @param {function} onBeforeSwitchTab
                         *                 Callback function to be triggered before moving to given tab.
                         */
                        /*method exposed to move to a particular tab from current active tab*/
                        scope.goToTab = function (tabNum, onBeforeSwitchTab) {
                            /*to go to a particular tab, we need tabScope.
                            * If number is passed, we fetch the tabscope and then select that particular tab, else return*/
                            if (WM.isNumber(tabNum)) {
                                /*tabNum should be more than 0 and less than tabs length*/
                                if (tabNum > 0 && tabNum <= tabs.length) {
                                    tab = tabs[tabNum - 1];
                                } else {
                                    return;
                                }
                            } else {
                                return;
                            }
                            /*select the tab*/
                            selectTab(tab, onBeforeSwitchTab);
                        };

                        if (scope.widgetid) { /* if the widget is inside canvas, show add button */

                            toolTipTarget = element.find('ul.nav-tabs').first();

                            scope._addNewTab = function () {

                                scope.$root.$emit('canvas-add-widget', {
                                    'parentId': scope.widgetid,
                                    'widgetType': 'wm-tabpane'
                                });

                                selectTab(tabs[tabs.length - 1]);
                                addNewBtnTemplate.appendTo(toolTipTarget);
                            };

                            addNewBtnTemplate = $compile(addNewBtnTemplate)(scope);
                            addNewBtnTemplate.appendTo(toolTipTarget);
                        }

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmTabpane', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabpane', ['wm.base']);
        return {
            'restrict': 'E',
            'scope': {
                'onSelect': '&',
                'onDeselect': '&',
                'onClose': '&'
            },
            'replace': true,
            'require': '^wmTabs', /* require the controller of the parent directive. i.e, wmTabs */
            'transclude': true,
            'template': $templateCache.get('template/layout/container/tab-pane.html'),
            /*
             * define the controller for this directive so that the childs (tabheader, tabcontent) can use this controller for the communication.
             */
            'controller': function ($scope, $element) {
                /* targetContainer for the tab headers */
                var tabsTarget = $element.closest('.app-tabs').children('.nav-tabs');

                /* this method will be called by the tabheader child */
                this.registerHead = function (scope) {
                    /* append the tab header element to the .nav-tabs container */
                    tabsTarget.append(scope._element); /* scope._element is the reference of the header element */
                    $scope.tabHead = scope;
                    return $scope; /* return the scope of tabpane, so that header will be able to listen to the properties on this */
                };

                /* this method will be called by the tabcontent child */
                this.registerContent = function () {
                    /* return the scope of tabpane, so that content will be able to listen to the properties on this */
                    return $scope;
                };
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /* save the reference to widgetProps in scope */
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs, ctrl) {
                        /* register the tabpane with the tabs */
                        ctrl.register(scope);

                        /* when the scope is destoryed unregister the tabpane with the tabs */
                        scope.$on('$destroy', function () {
                            ctrl.unregister(scope);
                        });

                        /* using this method we will be able to select a tab[i.e, make it active] programatically */
                        scope.select = function () {
                            if (scope.isActive || scope.disabled) {
                                return;
                            }

                            /* some widgets like charts needs to be redrawn when a tab becomes active for the first time */
                            element.find('.ng-isolate-scope')
                                .each(function () {
                                    Utils.triggerFn(WM.element(this).isolateScope().redraw);
                                });
                            scope.isActive = true;
                            ctrl.selectTab(scope);
                        };

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmTabheader', ['$compile', 'PropertiesFactory', 'WidgetUtilService', '$templateCache', 'Utils', function ($compile, PropertiesFactory, WidgetUtilService, $templateCache, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabheader', ['wm.base', 'wm.layouts']),
            notifyFor = {
                'paneicon': true
            };

        /*Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'paneicon':
                scope.iconsource = Utils.getBackGroundImageUrl(newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'require': '^wmTabpane', /* require the controller of the parent directive. i.e, wmTabpane */
            'transclude': true,
            'template': $templateCache.get('template/layout/container/tab-header.html'),
            'compile': function () {

                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                        if (scope.widgetProps.show) {
                            delete scope.widgetProps.show;// show property should be handled from pane.
                        }
                    },
                    'post': function (scope, element, attrs, ctrl) {
                        /* find the target element to append the default template of the tabheader */
                        var transcludeTarget = element.children('[wmtransclude]'),
                            template;

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        /* if the tabheader is not provided with any content[i.e, no transcluded content] use the default template */
                        if (transcludeTarget.children().length === 0) {
                            /* default template for the tabheader */
                            template =
                                    '<div class="tab-heading">' +
                                        '<i class="app-icon" data-ng-show="iconsource" data-ng-style ="{backgroundImage:iconsource}">&nbsp;</i>' +
                                        '<span data-ng-bind-html="heading"></span>' +
                                        '<i data-ng-click="tab.onClose();" data-ng-if="tab.closable">&nbsp;</i>' +
                                    '</div>';

                            /* compile the default tempalte and append it to the target */
                            template = WM.element(template);
                            transcludeTarget.append(template);
                            $compile(template)(scope);
                        }

                        /*
                         * save a reference of the tabheader element in the scope. tabpane will use this.
                         * tabpane will append the tabheader element to .nav-tabs
                         */
                        scope._element = element;

                        /*
                         * register the tabheader with the tab pane
                         * save the reference of the tabpane's scope in tabheader's scope
                         */
                        scope.tab = ctrl.registerHead(scope);
                        scope.tab.isdefaulttab = scope.isdefaulttab;

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmTabcontent', ['PropertiesFactory', 'WidgetUtilService', '$templateCache', function (PropertiesFactory, WidgetUtilService, $templateCache) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabcontent', ['wm.base', 'wm.layouts']);

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'require': '^wmTabpane', /* require the controller of the parent directive. i.e, wmTabpane */
            'transclude': true,
            'template': $templateCache.get('template/layout/container/tab-content.html'),
            'compile': function () {

                return {
                    'pre': function (scope) {
                        scope.widgetProps = WM.copy(widgetProps);
                        if (scope.widgetProps.show) {
                            delete scope.widgetProps.show;// show property should be handled from pane.
                        }
                    },
                    'post': function (scope, element, attrs, ctrl) {
                        /*
                         * register the tabcontent with the tab pane
                         * save the reference of the tabpane's scope in tabcontent's scope
                         */
                        scope.tab = ctrl.registerContent(scope);

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmTabs
 * @restrict E
 *
 * @description
 * The `wmTabs` directive defines tabs widget. <br>
 * wmTabs can only contain wmTabpane widgets. <br>
 * wmTabs can not be inside wmTabs. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the tabs widget.
 * @param {string=} width
 *                  Width of the tabs widget.
 * @param {string=} height
 *                  Height of the tabs widget.
 * @param {boolean=} vertical
 *                  `vertical="true"` aligns the tabs vertically.
 *                  Default value: `false`
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the tabs on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  Align the content of the tab to left/right/center. <br>
 *                  Default value: `left`. <br>
 * @param {string=} taborder
 *                  Set the order of the tabs. <br>
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>
 *                   Align Tabs Vertically: <wm-checkbox scopedatavalue="vertical"></wm-checkbox><br>
 *                   <wm-composite>
 *                       <wm-label caption="width:"></wm-label>
 *                       <wm-text scopedatavalue="width"></wm-text>
 *                   </wm-composite>
 *                   <wm-composite>
 *                       <wm-label caption="height:"></wm-label>
 *                       <wm-text scopedatavalue="height"></wm-text>
 *                   </wm-composite>
 *               </div>
 *               <div>
 *                   Address1: {{address1}}
 *               </div>
 *               <div>
 *                   Address2: {{address2}}
 *               </div>
 *               <br>
 *               <wm-tabs vertical="{{vertical}}" width="{{width}}" height="{{height}}">
 *                   <wm-tabpane>
 *                       <wm-tabheader heading="tab1"></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab1:<br>
 *                           Address1:<br>
 *                           <wm-composite>
 *                               <wm-label caption="city:"></wm-label>
 *                               <wm-text scopedatavalue="address1.city"></wm-text>
 *                           </wm-composite>
 *                           <wm-composite>
 *                               <wm-label caption="state:"></wm-label>
 *                               <wm-text scopedatavalue="address1.state"></wm-text>
 *                           </wm-composite>
 *                           <wm-composite>
 *                               <wm-label caption="zip:"></wm-label>
 *                               <wm-text scopedatavalue="address1.zip"></wm-text>
 *                           </wm-composite>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *                   <wm-tabpane>
 *                       <wm-tabheader heading="tab2"></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab2:<br>
 *                           Address2:<br>
 *                           <wm-composite>
 *                               <wm-label caption="city:"></wm-label>
 *                               <wm-text scopedatavalue="address2.city"></wm-text>
 *                           </wm-composite>
 *                           <wm-composite>
 *                               <wm-label caption="state:"></wm-label>
 *                               <wm-text scopedatavalue="address2.state"></wm-text>
 *                           </wm-composite>
 *                           <wm-composite>
 *                               <wm-label caption="zip:"></wm-label>
 *                               <wm-text scopedatavalue="address2.zip"></wm-text>
 *                           </wm-composite>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *               </wm-tabs>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *               // set the default values
 *               $scope.vertical = true;
 *               $scope.width = 300;
 *               $scope.height = 300;
 *           }
 *       </file>
 *   </example>
 */

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmTabpane
 * @restrict E
 *
 * @description
 * The `wmTabpane` directive defines tab-pane widget. <br>
 * wmTabpane can be used only inside wmTabs. <br>
 * wmTabpane can not be inside wmTabpane. <br>
 * A tab can be selected using the scope method `select`.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the tabpane.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the tab on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} on-select
 *                  Callback function which will be triggered when the tab is selected.
 * @param {string=} on-deselect
 *                  Callback function which will be triggered when the tab is deselected.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>
 *                   tab1 selected {{tab1count}} times.
 *               </div>
 *               <div>
 *                   tab2 selected {{tab2count}} times.
 *               </div>
 *               <br>
 *               <wm-tabs>
 *                   <wm-tabpane on-select="onTab1Select()" on-deselect="onTab1Deselect()">
 *                       <wm-tabheader heading="tab1"></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab1:<br>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *                   <wm-tabpane on-select="onTab2Select()">
 *                       <wm-tabheader heading="tab2"></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab2:<br>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *               </wm-tabs>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.tab1count = 0;
 *              $scope.tab2count = 0;
 *              $scope.onTab1Select = function () {
 *                  console.log("inside tab1select");
 *                  $scope.tab1count++;
 *              }
 *              $scope.onTab1Deselect = function () {
 *                  console.log("inside tab1 Deselect");
 *              }
 *              $scope.onTab2Select = function() {
 *                  console.log("inside tab2select");
 *                  $scope.tab2count++;
 *              }
 *           }
 *       </file>
 *   </example>
 */

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmTabheader
 * @restrict E
 *
 * @description
 * The `wmTabheader` directive defines tab-header widget. <br>
 * wmTabheader can be used only inside wmTabpane. <br>
 * If there is no transcluded content, default template will be used. <br>
 *
 * Default template:<br>
 * &lt;div class='tab-heading'&gt; <br>
 * &lt;i class='app-icon' data-ng-show='iconsource' data-ng-style ='{backgroundImage:iconsource}'&gt;&nbsp;&lt;/i&gt; <br> { {heading} } <br>
 * &lt;i data-ng-click='tab.onClose();' data-ng-if='tab.closable'&gt;&nbsp;&lt;/i&gt; <br>
 * &lt;/div&gt;
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
 *                  Name of the tabheader.
 * @param {string=} heading
 *                  Title of the header. <br>
 *                  This property is bindable. <br>
 *                  Default value: `Tab Title`. <br>
 *                  This is will be used only when the default template is used.
 * @param {string=} paneicon
 *                  Icon which we displayed on the tab-header. <br>
 *                  This property is bindable. <br>
 *                  This is will be used only when the default template is used.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the tab on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} isdefaulttab
 *                  isdefaulttab is a bindable property. <br>
 *                  First tab with `isdefaulttab = true` will be displayed by default.<br>
 *                  Default value: `false`.
 * @param {string=} horizontalalign
 *                  Align the content of the tab-header to left/right/center. <br>
 *                  Default value: `left`.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <br>
 *               <wm-tabs>
 *                   <wm-tabpane>
 *                       <wm-tabheader heading="{{tab1heading}}"></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab1:<br>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *                   <wm-tabpane>
 *                       <wm-tabheader isdefaulttab="true"><a><wm-label caption="tab2"><wm-label></a></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab2:<br>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *               </wm-tabs>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.tab1heading = "Tab1";
 *           }
 *       </file>
 *   </example>
 */

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmTabcontent
 * @restrict E
 *
 * @description
 * The `wmTabcontent` directive defines tab-content widget. <br>
 * wmTabcontent can be used only inside wmTabpane.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the tabs widget.
 * @param {string=} width
 *                  Width of the tabs widget.
 * @param {string=} height
 *                  Height of the tabs widget.
 * @param {boolean=} vertical
 *                  `vertical="true"` aligns the tabs vertically.
 *                  Default value: `false`
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the tabs on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  Align the content of the tab to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <br>
 *               <wm-tabs>
 *                   <wm-tabpane>
 *                       <wm-tabheader heading="{{tab1heading}}"></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab1:<br>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *                   <wm-tabpane>
 *                       <wm-tabheader isdefaulttab="true"><a><wm-label caption="tab2"></wm-label></a></wm-tabheader>
 *                       <wm-tabcontent>
 *                           Content of tab2:<br>
 *                       </wm-tabcontent>
 *                   </wm-tabpane>
 *               </wm-tabs>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.tab1heading = "Tab1";
 *           }
 *       </file>
 *   </example>
 */