/*global WM, $ */
/*jslint todo: true */
/*Directive for tabs */

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        /* define the template for the tabs directive */
        $templateCache.put('template/layout/container/tabs.html',
                '<div class="app-tabs clearfix" init-widget apply-styles="container" wm-gestures="{{gestures}}" tabindex="-1">' +
                    '<ul class="nav nav-tabs" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}"></ul>' +
                    '<div class="tab-content" ng-class="{\'tab-stacked\': vertical, \'tab-justified\': justified}" wmtransclude></div>' +
                '</div>'
            );

        /* define the template for the tabpane directive */
        $templateCache.put('template/layout/container/tab-pane.html',
            '<div class="tab-pane" page-container init-widget ng-class="{disabled: isDisabled, active: isActive}" wm-navigable-element="true"><div class="tab-body app-ng-transclude" wm-smoothscroll="{{smoothscroll}}" apply-styles="container" page-container-target wmtransclude></div></div>');

    }])
    .directive('wmTabs', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', 'CONSTANTS', '$rootScope', '$compile', '$timeout', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, CONSTANTS, $rootScope, $compile, $timeout) {
        'use strict';

        /* get the properties related to the tabs */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabs', ['wm.base']),
            notifyFor = {
                'tabsposition'    : true,
                'defaultpaneindex': true
            };

        /*Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'tabsposition':
                scope.setTabsPosition(newVal);
                break;
            case 'defaultpaneindex':
                //If no active tab is set ie.. no isdefaulttab then honor the defaultpaneindex
                if (!scope.activeTab) {
                    scope.activeTab = scope.tabs[newVal || 0];
                }

                scope.selectTab(scope.activeTab, false, true);

                break;
            }
        }

        // This function adds swipe features on the element.
        function addSwipee($scope, $ele) {
            $ele.swipee({
                'direction': $.fn.swipee.DIRECTIONS.HORIZONTAL,
                //'threshold': 20,
                'onSwipeStart': function (e, data) {
                    data.totalTabs = this.find('>.tab-pane').length;
                    data.tabLength = this.find('>.tab-pane:first').width();
                    data.transformState = -$scope.activeTabIndex * data.tabLength;
                    this.css({
                        'transition': 'none'
                    });
                    $(this).addClass('swipee-transition');
                },
                'onSwipe': function (e, data) {
                    this.css({
                        'transform': 'translate3d(' + (data.transformState + data.length) + 'px, 0, 0)'
                    });
                },
                'onSwipeEnd': function (e, data) {
                    if (data.length < 0) {
                        $scope.next();
                    } else if (data.length > 0) {
                        $scope.previous();
                    }
                    this.css({
                        'transition': '',
                        'transform': 'translate3d(' + -1 * ($scope.activeTabIndex * 100 / data.totalTabs) + '%, 0, 0)'
                    });
                    this.one('webkitTransitionEnd', function () {
                        $(this).removeClass('swipee-transition');
                        $timeout(WM.noop, 500);
                    });
                }
            });
        }

        // Calculates the tabs left position depending on no. of tabs.
        function setTabsLeftPosition(activeIndex, noOfTabs, $el) {
            var leftVal;

            leftVal = (-1 * activeIndex * 100 / noOfTabs);
            $el.css({
                'transform': 'translate3d(' + leftVal + '%, 0, 0)'
            });
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'transclude': true,
            'template': $templateCache.get('template/layout/container/tabs.html'),
            /* define the controller for the tabs directive. tabpane directive will use this. */
            'controller': function ($scope, $element) {
                var $tabHeaderTarget = $element.find('> .nav.nav-tabs');
                /* array which contains the scopes of the tabpanes */
                $scope.tabs = [];
                this.tabIndex = 0;
                /* this method will register a tabpane with the tabs
                 * save the scope of the tabpane in the tabs array
                 */
                this.register = function (tabScope) {
                    $scope.tabs.push(tabScope);
                };
                //Register header element to append to nav-tabs
                this.registerHeader = function (tabScope) {
                    tabScope.tabId = this.tabIndex;
                    tabScope._headerElement.attr('data-tab-id', this.tabIndex);
                    $tabHeaderTarget.append(tabScope._headerElement);
                    $compile(tabScope._headerElement)(tabScope);
                    this.tabIndex++;
                };
                //Remove tab header on remove of tab pane
                this.unRegisterHeader = function (tabScope) {
                    $tabHeaderTarget.find('[data-tab-id=' + tabScope.tabId + ']').remove();
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
                 * skipActiveWidget to skip active widget selection for first time load, it should trigger
                 * only on click on header
                 */
                this.selectTab = function (tab, skipOnSelect, skipActiveWidget) {
                    var _tab = $scope.activeTab,
                        i,
                        hasSwipeTransition,
                        tabContent,
                        tabs = $scope.tabs;
                    if (!tab) {
                        return;
                    }
                    if (_tab) {
                        Utils.triggerFn(_tab.onDeselect);
                        _tab.isActive = false;
                    }
                    $scope.activeTab = tab;
                    tab.isActive = true;
                    for (i = 0; i < tabs.length; i++) {
                        if ($scope.activeTab.$id === tabs[i].$id) {
                            $scope.activeTabIndex = i;
                            break;
                        }
                    }
                    // Apply isActive on tabHeader.
                    $rootScope.$safeApply($scope);

                    if (!skipOnSelect) {
                        Utils.triggerFn(tab.onSelect);
                    }

                    if (tab) {
                        tabContent =  $element.find('.tab-content');
                        hasSwipeTransition = tabContent.hasClass('swipee-transition');

                        // add left position only when element is not having swipe.
                        if ($element.hasClass('has-transition') && !hasSwipeTransition) {
                            setTabsLeftPosition(tab.tabId, $scope.tabs.length, tabContent);
                        }

                        tab._animateIn();
                    }
                    // In studio mode on click on header set tab-pane as active widget
                    if (CONSTANTS.isStudioMode && !skipActiveWidget) {
                        $rootScope.$emit('set-active-widget', tab.widgetid);
                    }
                    // when tabContent is set to display external page, triggering $lazyLoad on select of the tab will render the content.
                    Utils.triggerFn(tab.$lazyLoad);
                };

                // This function assigns the width and transform values on the tab content.
                this.setTabsLeftAndWidth = function (activeIndex) {
                    var content = $element.find('.tab-content'),
                        noOfTabs = content.find('.tab-pane').length;

                    // set width on the tab-content
                    content.css({
                        'max-width': noOfTabs * 100 + '%',
                        'width': noOfTabs * 100 + '%'
                    });
                    content.find('.tab-pane').css({
                        'width': 100 / noOfTabs + '%'
                    });

                    setTabsLeftPosition(activeIndex, noOfTabs, content);
                };

                /* make selectedTab method available to the isolateScope of the tabs directive. */
                $scope.selectTab = this.selectTab;
                $scope.setTabsLeftAndWidth = this.setTabsLeftAndWidth;
            },
            link: {
                'pre': function (scope, element, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

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
                                    WM.element(el).children().eq(el.selectedIndex).scope().select();
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
                        $li,
                        $ul = element.find('> ul'),
                        content = element.find('.tab-content');

                    /* find the first tab which has isdefaulttab set and make it active.
                     * mark the other tabs as inactive
                     */
                    tabs.forEach(function (tab) {
                        if (!activeTab) {
                            if (tab.isdefaulttab && !attrs.defaultpaneindex) {
                                activeTab = tab;
                                activeTab.isActive = true;
                            }
                        } else {
                            tab.isActive = false;
                        }
                    });

                    scope.activeTab = activeTab;

                    /*selects a given tab and executes onBeforeSwitchTab before switching*/
                    function selectTab(tab, onBeforeSwitchTab) {
                        /*trigger onBeforeSwitchTab callback before switching*/
                        Utils.triggerFn(onBeforeSwitchTab);

                        if (tab) {
                            tab.select();
                        }
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

                        // wait till the tab headers are rendered
                        $timeout(function () {
                            var _liPosition;
                            $li = $ul.children();
                            _liPosition = $li.last().position();
                            if (_liPosition && (_liPosition.left > $ul.width())) {
                                $ul.on('mousewheel', function (e) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    _scrollHeader(e.originalEvent.wheelDelta);
                                });
                            }
                        });

                        // Adding swipe on tabs content
                        if (scope.gestures === 'on' && Utils.isMobile()) {
                            element.addClass('has-transition');
                            addSwipee(scope, content);
                        }

                        if (element.hasClass('has-transition')) {
                            scope.setTabsLeftAndWidth(scope.defaultpaneindex);
                        }
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
    .directive('wmTabpane', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', '$rootScope', 'CONSTANTS', '$compile', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, $rs, CONSTANTS, $compile) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabpane', ['wm.base', 'wm.layouts', 'wm.scrollablecontainer']),
            $headerEle  = '<li class="tab-header" ng-class="{active: isActive, disabled: isDisabled}" ng-show="showHeader" ng-click="select($event)" role="tab" tabindex="-1" hm-swipe-left="_onHeaderSwipeLeft($event);" hm-swipe-right="_onHeaderSwipeRight($event);">' +
                            '<a href="javascript:void(0);" role="button" tabindex="0">' +
                                '<div class="tab-heading">' +
                                    '<i class="app-icon {{paneicon}}" ng-if="paneicon"></i> ' +
                                    '<span ng-bind="title"></span>' +
                                    '<span ng-if="badgevalue" class="label label-{{badgetype}}">{{badgevalue}}</span>' +
                                '</div>' +
                            '</a>' +
                          '</li>',
            $opt,
            notifyFor  = {
                'disabled': CONSTANTS.isRunMode,
                'show'    : true
            };

        //Define the property change handler. This function will be triggered when there is a change in the widget property
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'disabled':
                scope.isDisabled = newVal;
                break;
            case 'show':
                scope.showHeader = newVal || CONSTANTS.isStudioMode;
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'require': '^wmTabs', /* require the controller of the parent directive. i.e, wmTabs */
            'transclude': true,
            'template': $templateCache.get('template/layout/container/tab-pane.html'),
            'compile': function () {
                return {
                    'pre': function (scope, element, attrs) {
                        if (attrs.heading && !attrs.title) {
                            attrs.title = attrs.heading;
                        }

                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        scope.$lazyLoad = WM.noop;
                    },
                    'post': function (scope, element, attrs, ctrl) {

                        var parentScope = element.closest('.app-tabs').isolateScope();

                        //To support backward compatibility for old projects
                        if (scope.title === undefined && !scope.bindtitle) {
                            scope.title = scope.heading || scope.bindheading;
                        }
                        scope._headerElement = WM.element($headerEle);
                        ctrl.registerHeader(scope);
                        /* register the tabpane with the tabs */
                        ctrl.register(scope);
                        /* when the scope is destoryed unregister the tabpane with the tabs */
                        scope.$on('$destroy', function () {
                            ctrl.unRegisterHeader(scope);
                            ctrl.unregister(scope);
                        });

                        /* using this method we will be able to select a tab[i.e, make it active] programatically */
                        scope.select = function ($event) {
                            // When called programatically $event won't be available
                            if ($event) {
                                $event.stopPropagation();
                                $event.preventDefault();
                            }
                            /* Return only if its already active or disabled ie.. in studio mode event if disabled
                              we will allow user to select tab */
                            if (scope.isActive || (scope.disabled && CONSTANTS.isRunMode)) {
                                if (scope.isActive) {
                                    $rs.$emit('set-active-widget', scope.widgetid);
                                }
                                return;
                            }

                            /* some widgets like charts needs to be redrawn when a tab becomes active for the first time */
                            element.find('.ng-isolate-scope')
                                .each(function () {
                                    Utils.triggerFn(WM.element(this).isolateScope().redraw);
                                });
                            scope.isActive = true;

                            if (CONSTANTS.isRunMode && parentScope.onChange) {
                                parentScope.onChange({'$event': $event, '$scope': parentScope, 'newPaneIndex': scope.tabId, 'oldPaneIndex': parentScope.activeTab.tabId || 0});
                            }

                            ctrl.selectTab(scope);
                        };

                        scope._animateIn = function () {
                            var ul,
                                $prevHeaderEle;

                            //when the animation is not present toggle the active class.
                            element.siblings('.active').removeClass('active');
                            element.addClass('active');


                            ul = scope._headerElement.parent()[0];
                            // move the tabheader into the viewport
                            if (scope.tabId) {
                                $prevHeaderEle = scope._headerElement.prev();
                                if ($prevHeaderEle.length) {
                                    ul.scrollLeft = $prevHeaderEle[0].offsetLeft;
                                }
                            } else {
                                ul.scrollLeft = 0;
                            }
                        };

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
                            $opt = WM.element('<option ng-bind-html="title"></option>');
                            $opt = $compile($opt)(scope);
                            element.closest('.app-tabs').children('select').append($opt);

                            scope.$on('$destroy', function () {
                                if ($opt) {
                                    $opt.remove();
                                }
                            });
                        }

                        //register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

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
 * @param {number=} defaultpaneindex
 *                  Makes the tab active for given index.This property has backward compatibility for isdefaulttab property. </br>
 *                  Default value: 0
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=} tabsposition
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
                    <wm-tabpane title="tab1">
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
                    </wm-tabpane>
                    <wm-tabpane title="tab2">
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
 * @param {string=} title
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
                    <wm-tabpane on-select="onTab1Select()" on-deselect="onTab1Deselect()" title="tab1">
                        Content for tab1:
                    </wm-tabpane>
                    <wm-tabpane on-select="onTab2Select()" title="tab2">
                        Content for tab2:
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