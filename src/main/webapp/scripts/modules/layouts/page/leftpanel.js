/*global WM, _, $ */

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/leftpanel.html',
                '<aside data-role="page-left-panel" wm-gestures="{{gestures}}" wm-smoothscroll="{{smoothscroll}}" page-container init-widget class = "app-left-panel" hm-swipe-left="collapse();" ' +
                '       data-ng-class="[animation, expanded ? \'left-panel-expanded\' : \'left-panel-collapsed\']" ' +
                '       apply-styles="container">' +
                '<div class="app-ng-transclude" wmtransclude page-container-target></div>' +
                '</aside>'
            );
    }])
    .directive('wmLeftPanel', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', '$timeout', 'CONSTANTS', 'Utils', '$templateCache', function (PropertiesFactory, WidgetUtilService, $rootScope, $timeout, CONSTANTS, Utils, $templateCache) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.leftpanel', ['wm.layouts', 'wm.base.events.touch', 'wm.scrollablecontainer']),
            notifyFor = {
                'columnwidth': true,
                'xscolumnwidth': true,
                'animation': true
            };

        function resetTransition($el) {
            $el.css({
                'transform': '',
                'opacity': '',
                'z-index': '',
                'width': ''
            });
        }


        // Returns the settings object that is used for s
        function getAnimationProperty(state, $s) {
            var styles,
                $transitionEls = state.leftPanel;
            if ($s.animation === 'slide-in') {
                styles = [
                    {
                        'target': state.leftPanel,
                        'css': {
                            'transform': 'translate3d(-100%, 0, 0)',
                            'opacity': 1,
                            'z-index': 101
                        }
                    },
                    {
                        'target': state.pageContainer,
                        'css': {
                            'transform': 'translate3d(${{ limit( 0, ((($D + $d) * 100 / w)), maxX ) + \'%\' }}, 0, 0)',
                            'opacity': 1,
                            'z-index': 101
                        }
                    }];
                $transitionEls = $transitionEls.add(state.pageContainer);

                if ($rootScope.isTabletApplicationType) {
                    styles = [
                        {
                            'target': state.leftPanel,
                            'css': {
                                'transform': 'translate3d(${{ limit(-100, -($d * 100 / leftW), 0) + \'%\' }}, 0, 0)'
                            }
                        },
                        {
                            'target': state.pageContainer,
                            'css': {
                                'transform': 'translate3d(${{ (($d) * 100 / pageW) + \'%\' }}, 0, 0)',
                                'width': '${{ (pageW - $d) + \'px\' }}',
                                'z-index': 101
                            }
                        }
                    ];
                }

            } else {
                styles = {
                    'transform': 'translate3d(${{ limit( -100, ((($D + $d) * 100 / w) - 100), 0 ) + \'%\'}}, 0, 0)',
                    'opacity': 1,
                    'z-index': 101
                };
            }


            return {
                'direction': $.fn.swipee.DIRECTIONS.HORIZONTAL,
                'threshold': 5,
                'bounds': function () {
                    var offset = 0;
                    if (!state.width) {
                        state.pageContainerWidth = state.pageContainer.width();
                        state.leftPanelWidth = state.leftPanel.width();
                        state.maxX = state.leftPanelWidth / state.pageContainerWidth * 100;

                        state.width = $s.animation === 'slide-in' ? state.pageContainerWidth : state.leftPanelWidth;
                    }
                    state.isExpanded = $s.expanded;

                    if (state.isExpanded) {
                        return {
                            'center': state.leftPanelWidth,
                            'lower': -(state.leftPanelWidth - offset)
                        };
                    }
                    if ($rootScope.isTabletApplicationType) {
                        offset = 53.32;
                    }
                    return {
                        'center': 0,
                        'upper': state.leftPanelWidth - offset
                    };
                },
                'context': function () {
                    return {
                        'w': state.width,
                        'pageW': state.pageContainerWidth,
                        'leftW': state.leftPanelWidth,
                        'maxX': state.maxX,
                        'limit': function (min, v, max) {
                            if (v < min) {
                                return min;
                            }
                            if (v > max) {
                                return max;
                            }
                            return v;
                        }
                    };
                },
                'animation': styles,
                'onLower': function () {
                    resetTransition($transitionEls);
                    state.isExpanded = false;
                    $s.collapse();
                },
                'onUpper': function () {
                    resetTransition($transitionEls);
                    state.isExpanded = true;
                    $s.expand();
                }
            };
        }

        function setLeftPanelWidth(element, devices, newVal, oldVal) {
            _.forEach(devices, function (device) {
                if (newVal) {
                    element.addClass('col-' + device + '-' + newVal);
                }
                if (oldVal) {
                    element.removeClass('col-' + device + '-' + oldVal);
                }
            });
        }

        function setPageWidthAndPosition(appPage, devices, newVal, oldVal) {
            _.forEach(devices, function (device) {
                if (newVal) {
                    appPage.addClass(' left-panel-container-' + device + '-' + (12 - newVal));
                }
                if (oldVal) {
                    appPage.removeClass(' left-panel-container-' + device + '-' + (12 - oldVal));
                }
            });
        }

        function listenForCollapseAction(scope, element, appPage) {
            var eventName = 'click.leftNavToggle',
                skipEvent = true;
            element.on(eventName, function () {
                skipEvent = true;
            });
            appPage.on(eventName, function () {
                if (!skipEvent) {
                    scope.collapse();
                }
                skipEvent = false;
            });
            return function () {
                element.off(eventName);
                appPage.off(eventName);
            };
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, scope, key, newVal, oldVal) {
            var appPage;
            switch (key) {
            case 'columnwidth':
                /*If columnwidth is passed set the appropriate class*/
                setLeftPanelWidth(element, ['md', 'sm'], newVal, oldVal);
                if (scope.animation === 'slide-in') {
                    setPageWidthAndPosition(element.closest('.app-page'), ['md', 'sm'], newVal, oldVal);
                }
                break;
            case 'xscolumnwidth':
                /*If columnwidth is passed set the appropriate class*/
                setLeftPanelWidth(element, ['xs'], newVal, oldVal);
                if (scope.animation === 'slide-in') {
                    setPageWidthAndPosition(element.closest('.app-page'), ['xs'], newVal, oldVal);
                }
                break;
            case 'animation':
                appPage = element.closest('.app-page');
                if (newVal === 'slide-in') {
                    appPage.removeClass('slide-over-left-panel-container')
                        .addClass('slide-in-left-panel-container');
                    setPageWidthAndPosition(appPage, ['md', 'sm'], scope.columnwidth);
                    setPageWidthAndPosition(appPage, ['xs'], scope.xscolumnwidth);
                } else if (newVal === 'slide-over') {
                    appPage.removeClass('slide-in-left-panel-container')
                        .addClass('slide-over-left-panel-container');
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': $templateCache.get('template/layout/page/leftpanel.html'),
            'compile': function () {
                return {
                    'pre': function (iScope) {
                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            iScope.widgetProps = widgetProps;
                        }
                    },

                    'post': function (scope, element, attrs) {
                        var pageContainer,
                            state,
                            swipeSettingsObj,
                            moveTo,
                            appPage;

                        /*If columnwidth is passed set the appropriate class*/
                        if (scope.columnwidth) {
                            setLeftPanelWidth(element, ['md', 'sm'], scope.columnwidth);
                        }
                        scope.toggle = function () {
                            moveTo = scope.expanded ? 'gotoLower' : 'gotoUpper';
                            appPage = element.closest('.app-page');

                            element.swipeAnimation(moveTo);

                            if (scope.expanded) {
                                scope.collapse();
                            } else {
                                scope.expand();
                            }
                        };
                        scope.expand = function () {
                            appPage = element.closest('.app-page');

                            element.removeClass('swipee-transition');

                            scope.expanded = true;
                            if (!($rootScope.isTabletApplicationType && scope.animation === 'slide-in')) {
                                scope.destroyCollapseActionListener = listenForCollapseAction(scope, element, appPage);
                            }
                            appPage.addClass('left-panel-expanded-container')
                                .removeClass('left-panel-collapsed-container');
                            if (scope.animation === 'slide-in') {
                                setPageWidthAndPosition(appPage, ['md', 'sm'], scope.columnwidth);
                                setPageWidthAndPosition(appPage, ['xs'], scope.xscolumnwidth);
                            }
                            $rootScope.leftPanelVisible = true;
                            $rootScope.$safeApply(scope);
                        };
                        scope.collapse = function () {
                            appPage = element.closest('.app-page');

                            element.addClass('swipee-transition');

                            scope.expanded = false;
                            appPage.addClass('left-panel-collapsed-container')
                                .removeClass('left-panel-expanded-container');
                            if (scope.animation === 'slide-in') {
                                setPageWidthAndPosition(appPage, ['md', 'sm'], null, scope.columnwidth);
                                setPageWidthAndPosition(appPage, ['xs'], null, scope.xscolumnwidth);
                            }
                            $rootScope.leftPanelVisible = false;
                            Utils.triggerFn(scope.destroyCollapseActionListener);
                            $rootScope.$safeApply(scope);
                        };
                        pageContainer = element.closest('.app-page');
                        pageContainer.addClass('left-panel-collapsed-container');

                        state = {
                            'colWidth': scope.columnwidth,
                            'leftPanel': element,
                            'pageContainer': pageContainer,
                            'leftPanelWidth': '',
                            'pageContainerWidth': ''
                        };
                        swipeSettingsObj = getAnimationProperty(state, scope);

                        // set the bindEvents to empty when gestures is off
                        if (scope.gestures === 'off') {
                            $.extend(swipeSettingsObj, {'bindEvents': []});
                        }

                        element.swipeAnimation(swipeSettingsObj);

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element, scope), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmLeftPanel
 * @restrict E
 *
 * @description
 * The 'wmLeftPanel' directive defines a left panel in the layout.
 * wmLeftPanel is internally used by wmContent.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} horizontalalign
 *                  Align the content in the left panel to left/right/center.<br>
 *                  Default value for horizontalalign is `left`.
 * @param {string=} on-swipeup
 *                  Callback function for `swipeup` event.
 * @param {string=} on-swipedown
 *                  Callback function for `swipedown` event.
 * @param {string=} on-swiperight
 *                  Callback function for `swiperight` event.
 * @param {string=} on-swipeleft
 *                  Callback function for `swipeleft` event.
 * @param {string=} on-pinchin
 *                  Callback function for `pinchin` event.
 * @param {string=} on-pinchdown
 *                  Callback function for `pinchdown` event.
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

