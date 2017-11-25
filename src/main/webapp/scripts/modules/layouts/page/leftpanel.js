/*global WM, _*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/leftpanel.html',
                '<aside data-role="page-left-panel" wm-smoothscroll="{{smoothscroll}}" page-container init-widget class = "app-left-panel" hm-swipe-left="collapse();" ' +
                '       data-ng-class="[animation, expanded ? \'left-panel-expanded\' : \'left-panel-collapsed\']" ' +
                '       apply-styles="container">' +
                '   <div class="app-ng-transclude" wmtransclude page-container-target></div>' +
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
                        /*If columnwidth is passed set the appropriate class*/
                        if (scope.columnwidth) {
                            setLeftPanelWidth(element, ['md', 'sm'], scope.columnwidth);
                        }
                        scope.toggle = function () {
                            if (scope.expanded) {
                                scope.collapse();
                            } else {
                                scope.expand();
                            }
                        };
                        scope.expand = function () {
                            var appPage = element.closest('.app-page');
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
                            var appPage = element.closest('.app-page');
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
                        element.closest('.app-page').addClass('left-panel-collapsed-container');
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

