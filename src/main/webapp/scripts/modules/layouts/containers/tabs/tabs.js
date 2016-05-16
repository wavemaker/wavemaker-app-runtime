/*global WM, */
/*jslint todo: true */
/*Directive for tabs */

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        /* define the template for the tabs directive */
        $templateCache.put('template/layout/container/tabs.html',
                '<div class="app-tabs clearfix" init-widget apply-styles="container" tabindex="-1">' +
                    '<ul class="nav nav-tabs" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}"></ul>' +
                    '<div class="tab-content" ng-class="{\'tab-stacked\': vertical, \'tab-justified\': justified}" wmtransclude hm-swipe-left="_onSwipeLeft();" hm-swipe-right="_onSwipeRight()"></div>' +
                '</div>'
            );

        /* define the template for the tabpane directive */
        $templateCache.put('template/layout/container/tab-pane.html',
            '<div class="tab-pane" wmtransclude init-widget ng-class="{disabled:disabled}" wm-navigable-element="true"></div>');

        /* define the template for the tabheader directive */
        $templateCache.put('template/layout/container/tab-header.html',
            '<li class="tab-header" ng-class="{active: tab.isActive, disabled: tab.disabled}" ng-show="tab.show" data-tab-id="{{tab.widgetid}}" ng-click="tab.select()"  hm-swipe-left="_onHeaderSwipeLeft($event);" hm-swipe-right="_onHeaderSwipeRight($event);" init-widget role="tab" tabindex="-1">' +
                '<a href="javascript:void(0);" wmtransclude apply-styles="container" role="button" tabindex="0"></a>' +
            '</li>');

        /* define the template for the tabcontent directive */
        $templateCache.put('template/layout/container/tab-content.html',
            '<div page-container wmtransclude page-container-target class="tab-body" data-tab-id="{{tab.widgetid}}" init-widget apply-styles  tabindex="0"></div>');

    }])
    .directive('wmTabs', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', 'CONSTANTS', '$rootScope', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, CONSTANTS, $rootScope) {
        'use strict';

        /* get the properties related to the tabs */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabs', ['wm.base', 'wm.layouts', 'wm.containers']),
            notifyFor = {
                'tabsposition': true
            };

        /*Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'tabsposition':
                scope.setTabsPosition(newVal);
                break;
            }
        }

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
                        Utils.triggerFn(_tab.onDeselect);
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
                        Utils.triggerFn(tab.onSelect);
                    }

                    if (tab) {
                        tab._animateIn($element.hasClass('has-transition'));
                    }

                    // when tabContent is set to display external page, triggering $lazyLoad on select of the tab will render the content.
                    Utils.triggerFn(tab.tabContent.$lazyLoad);
                };

                /* make selectedTab method available to the isolateScope of the tabs directive. */
                $scope.selectTab = this.selectTab;
            },
            link: {
                'pre': function (scope, element, attrs) {
                    /* save the reference to widgetProps in scope */
                    scope.widgetProps = widgetProps;

                    // In run mode when the tabs position is horizontal and transition is setup add 'has-transition' class
                    if (CONSTANTS.isRunMode && attrs.transition && attrs.transition !== 'none' && (!attrs.tabsposition || attrs.tabsposition === 'top' || attrs.tabsposition === 'bottom')) {
                        element.addClass('has-transition');
                    }

                    if (CONSTANTS.isStudioMode) {
                        // define the _select method. This will be called in studio mode when a tab is selected using tabslist dropdown
                        scope._select = function (el) {
                            if (el.selectedIndex) {
                                $rootScope.$safeApply($rootScope, function () {
                                    //trigger the select method on selected tab.
                                    WM.element(el).children().eq(el.selectedIndex).scope().tab.select();
                                });
                            }
                        };

                        // add the tabs-list element to the root element.
                        element
                            .append('<select class=tabs-list onchange="WM.element(this).scope()._select(this)" title="Select a Tab"><option hidden></option></select>');
                    }
                },
                'post': function (scope, element, attrs) {

                    var tabs = scope.tabs,
                        activeTab,
                        tab,
                        $ul = element.find('> ul');
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
                        activeTab.select();
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

                    scope.setTabsPosition = function (tabsposition) {
                        var _tabs = element.find('>ul.nav-tabs');
                        element.removeClass('inverted');
                        if (tabsposition === 'bottom' || tabsposition === 'right') {
                            element.addClass('inverted');
                            element.append(_tabs);
                        } else {
                            element.prepend(_tabs);
                        }
                        scope.vertical = (tabsposition === 'left' || tabsposition === 'right');
                    };

                    // function to scroll the header into the viewport
                    function _scrollHeader(delta) {
                        var left = $ul[0].scrollLeft,
                            _delta = -1 * delta;
                        $ul.animate({scrollLeft: left + _delta}, {'duration': 10});
                    }

                    if (CONSTANTS.isRunMode) {

                        // define functions to select next/previous tabs on swipe action
                        if (scope.transition && scope.transition !== 'none') {
                            scope._onSwipeLeft = function () {
                                // select next
                                selectTab(tabs[scope.activeTabIndex + 1]);
                            };

                            scope._onSwipeRight = function () {
                                // select previous
                                selectTab(tabs[scope.activeTabIndex - 1]);
                            };
                        }

                        element.find('> ul').on('mousewheel', function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            _scrollHeader(e.originalEvent.wheelDelta);
                        });
                    }

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                    /* initialize the widget */
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    scope.setTabsPosition(attrs.tabsposition || (attrs.vertical === "true" ? 'left' : 'top'));
                }
            }
        };
    }])
    .directive('wmTabpane', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', '$parse', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, $parse) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabpane', ['wm.base']);
        return {
            'restrict': 'E',
            'scope': {},
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
                this.registerContent = function (scope) {
                    $scope.tabContent = scope;
                    /* return the scope of tabpane, so that content will be able to listen to the properties on this */
                    return $scope;
                };

                this.registerCallback = function (name, value) {
                    if (!name || !value) {
                        return;
                    }

                    var fn = $parse(value);
                    $scope[name] = function (locals) {
                        locals = locals || {};
                        locals.$scope = $scope;
                        return fn($element.scope(), locals);
                    };
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

                        scope._animateIn = function (hasTransition) {

                            var index = element.index(),
                                $parent = element.parent(),
                                delta,
                                tabHeadEl,
                                ul;

                            // when the transition is setup animate the selected tab into the view.
                            if (hasTransition) {
                                delta = index * $parent.width();

                                $parent.animate({scrollLeft: delta}, {
                                    'duration': 'fast',
                                    'start'   : function () {
                                        element.addClass('active');
                                    },
                                    'complete': function () {
                                        element.siblings('.active').removeClass('active');
                                    }
                                });
                            } else {
                                //when the animation is not present toggle the active class.
                                element.siblings('.active').removeClass('active');
                                element.addClass('active');
                            }

                            tabHeadEl = scope.tabHead._element;
                            ul = tabHeadEl.parent()[0];
                            // move the tabheader into the viewport
                            if (tabHeadEl.index()) {
                                ul.scrollLeft = tabHeadEl.prev()[0].offsetLeft;
                            } else {
                                ul.scrollLeft = 0;
                            }
                        };

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmTabheader', ['$compile', 'PropertiesFactory', 'WidgetUtilService', '$templateCache', 'CONSTANTS', function ($compile, PropertiesFactory, WidgetUtilService, $templateCache, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabheader', ['wm.base', 'wm.layouts']);

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
                        delete scope.widgetProps.accessroles; // accessroles property should be handled from pane
                    },
                    'post': function (scope, element, attrs, ctrl) {
                        /* find the target element to append the default template of the tabheader */
                        var transcludeTarget = element.children('[wmtransclude]'),
                            template,
                            $opt;

                        /* if the tabheader is not provided with any content[i.e, no transcluded content] use the default template */
                        if (transcludeTarget.children().length === 0) {
                            /* default template for the tabheader */
                            template =
                                    '<div class="tab-heading">' +
                                    '<i class="app-icon {{paneicon}}" ng-if="paneicon"></i> ' +
                                        '<span ng-bind-html="heading"></span>' +
                                        '<i ng-click="tab.onClose();" ng-if="tab.closable">&nbsp;</i>' +
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

                        function _scrollHeader(delta) {
                            var $ul = element.parent(),
                                left = $ul[0].scrollLeft,
                                _delta = -2 * delta;
                            $ul.animate({scrollLeft: left + _delta}, {'duration': 10});
                        }

                        if (CONSTANTS.isRunMode) {
                            // define the functions to scroll the header into the view port on swipe.
                            scope._onHeaderSwipeLeft = function (e) {
                                _scrollHeader(e.deltaX);
                            };

                            scope._onHeaderSwipeRight = function (e) {
                                _scrollHeader(e.deltaX);
                            };
                        } else {
                            // create an option element and add it to the tabs-list element.
                            $opt = WM.element('<option ng-bind-html="heading"></option>');
                            $opt = $compile($opt)(scope);
                            element.closest('.app-tabs').children('select').append($opt);

                            scope.$on('$destroy', function () {
                                if ($opt) {
                                    $opt.remove();
                                }
                            });
                        }

                        if (CONSTANTS.isRunMode) {
                            if (attrs.onSelect) {
                                ctrl.registerCallback('onSelect', attrs._onSelect || attrs.onSelect);
                            }

                            if (attrs.onDeselect) {
                                ctrl.registerCallback('onDeselect', attrs._onDeselect || attrs.onDeselect);
                            }
                        }

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmTabcontent', ['PropertiesFactory', 'WidgetUtilService', '$templateCache', 'CONSTANTS', 'Utils', function (PropertiesFactory, WidgetUtilService, $templateCache, CONSTANTS, Utils) {
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
                    'pre': function (iScope) {
                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = Utils.getClonedObject(widgetProps);
                            delete iScope.widgetProps.show;// show property should be handled from pane.
                            delete iScope.widgetProps.accessroles; // accessroles property should be handled from pane
                        } else {
                            iScope.widgetProps = widgetProps;
                        }

                        // define $lazyLoad method on iScope.
                        // pageContainer widget will override this.
                        iScope.$lazyLoad = WM.noop;
                    },
                    'post': function (iScope, element, attrs, ctrl) {
                        /*
                         * register the tabcontent with the tab pane
                         * save the reference of the tabpane's scope in tabcontent's scope
                         */
                        iScope.tab = ctrl.registerContent(iScope);
                        // define isActive property on the iScope of tab content.
                        // this property will be used by page-container directive.
                        // when content property is set, the page corresponding to the value of content will be loaded on demand.
                        // if the tab is active (i.e, selected) page will be loaded immediately.
                        Object.defineProperty(iScope, 'isActive', {
                            get: function () {
                                return this.tab.isActive;
                            }
                        });

                        /* initialize the widget */
                        WidgetUtilService.postWidgetCreate(iScope, element, attrs);
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
 * @param {boolean=} tabsposition
 *                  Align the tab headers to left/right/top/bottom of the content. <br>
 *                  Default value: `top`
 * @param {string=} transition
 *                  Possible values are `none`, `slide`. <br>
 *                  When the transition value is other than `none`, animation will be used show the selected tab. <br>
 *                  Default value: `none`
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <div>
                    <wm-composite>
                        <wm-label caption="width:"></wm-label>
                        <wm-text scopedatavalue="width"></wm-text>
                    </wm-composite>
                    <wm-composite>
                        <wm-label caption="height:"></wm-label>
                        <wm-text scopedatavalue="height"></wm-text>
                    </wm-composite>
                </div>
                <div>Address1: {{address1}}</div>
                <div>Address2: {{address2}}</div>
                <br>
                <wm-tabs width="{{width}}" height="{{height}}">
                    <wm-tabpane>
                        <wm-tabheader heading="tab1"></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab1:<br>
                            Address1:<br>
                            <wm-composite>
                                <wm-label caption="city:"></wm-label>
                                <wm-text scopedatavalue="address1.city"></wm-text>
                            </wm-composite>
                            <wm-composite>
                                <wm-label caption="state:"></wm-label>
                                <wm-text scopedatavalue="address1.state"></wm-text>
                            </wm-composite>
                            <wm-composite>
                                <wm-label caption="zip:"></wm-label>
                                <wm-text scopedatavalue="address1.zip"></wm-text>
                            </wm-composite>
                        </wm-tabcontent>
                    </wm-tabpane>
                    <wm-tabpane>
                        <wm-tabheader heading="tab2"></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab2:<br>
                            Address2:<br>
                            <wm-composite>
                                <wm-label caption="city:"></wm-label>
                                <wm-text scopedatavalue="address2.city"></wm-text>
                            </wm-composite>
                            <wm-composite>
                                <wm-label caption="state:"></wm-label>
                                <wm-text scopedatavalue="address2.state"></wm-text>
                            </wm-composite>
                            <wm-composite>
                                <wm-label caption="zip:"></wm-label>
                                <wm-text scopedatavalue="address2.zip"></wm-text>
                            </wm-composite>
                        </wm-tabcontent>
                    </wm-tabpane>
                </wm-tabs>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                // set the default values
                $scope.tabsposition = "top";
                $scope.width = 300;
                $scope.height = 300;
            }
        </file>
    </example>
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <div>
                    tab1 selected {{tab1count}} times.
                </div>
                <div>
                    tab2 selected {{tab2count}} times.
                </div>
                <br>
                <wm-tabs>
                    <wm-tabpane on-select="onTab1Select()" on-deselect="onTab1Deselect()">
                        <wm-tabheader heading="tab1"></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab1:<br>
                        </wm-tabcontent>
                    </wm-tabpane>
                    <wm-tabpane on-select="onTab2Select()">
                        <wm-tabheader heading="tab2"></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab2:<br>
                        </wm-tabcontent>
                    </wm-tabpane>
                </wm-tabs>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
               $scope.tab1count = 0;
               $scope.tab2count = 0;
               $scope.onTab1Select = function () {
                   console.log("inside tab1select");
                   $scope.tab1count++;
               }
               $scope.onTab1Deselect = function () {
                   console.log("inside tab1 Deselect");
               }
               $scope.onTab2Select = function() {
                   console.log("inside tab2select");
                   $scope.tab2count++;
               }
            }
        </file>
    </example>
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
 * &lt;i class='app-icon' ng-show='iconsource' ng-style ='{backgroundImage:iconsource}'&gt;&nbsp;&lt;/i&gt; <br> { {heading} } <br>
 * &lt;i ng-click='tab.onClose();' ng-if='tab.closable'&gt;&nbsp;&lt;/i&gt; <br>
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-tabs>
                    <wm-tabpane>
                        <wm-tabheader heading="{{tab1heading}}"></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab1:<br>
                        </wm-tabcontent>
                    </wm-tabpane>
                    <wm-tabpane>
                        <wm-tabheader isdefaulttab="true"><a><wm-label caption="tab2"><wm-label></a></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab2:<br>
                        </wm-tabcontent>
                    </wm-tabpane>
                </wm-tabs>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
               $scope.tab1heading = "Tab1";
            }
        </file>
    </example>
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
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the tabs on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  Align the content of the tab to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-tabs>
                    <wm-tabpane>
                        <wm-tabheader heading="{{tab1heading}}"></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab1:<br>
                        </wm-tabcontent>
                    </wm-tabpane>
                    <wm-tabpane>
                        <wm-tabheader isdefaulttab="true"><a><wm-label caption="tab2"></wm-label></a></wm-tabheader>
                        <wm-tabcontent>
                            Content of tab2:<br>
                        </wm-tabcontent>
                    </wm-tabpane>
                </wm-tabs>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
               $scope.tab1heading = "Tab1";
            }
        </file>
    </example>
 */