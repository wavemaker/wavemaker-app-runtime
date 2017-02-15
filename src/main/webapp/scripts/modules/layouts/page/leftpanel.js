/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/leftpanel.html',
                '<aside data-role="page-left-panel" page-container init-widget class="app-left-panel" hm-swipe-left="collapse();" data-ng-class="animation" apply-styles="container">' +
                    '<div class="app-ng-transclude" wmtransclude page-container-target></div>' +
                '</aside>'
            );
    }])
    .directive('wmLeftPanel', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', '$timeout', 'CONSTANTS', 'Utils', function (PropertiesFactory, WidgetUtilService, $rootScope, $timeout, CONSTANTS, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.leftpanel', ['wm.layouts', 'wm.base.events.touch']),
            notifyFor = {
                'columnwidth': true,
                'animation': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal, oldVal) {
            switch (key) {
            case 'columnwidth':
                /*If columnwidth is passed set the appropriate class*/
                element.removeClass('col-md-' + oldVal + ' col-sm-' + oldVal).addClass('col-md-' + newVal + ' col-sm-' + newVal);
                break;
            case 'animation':
                var appPage = element.closest('.app-page');
                if (newVal === 'slide-in') {
                    appPage.addClass('slide-in-left-panel-container');
                } else {
                    appPage.removeClass('slide-in-left-panel-container');
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/page/leftpanel.html', tElement, tAttrs));

                if (!isWidgetInsideCanvas) {
                    /*** fix for old projects ***/
                    if (!tAttrs.columnwidth) {
                        template.attr('columnwidth', '2');
                    }
                }
                return template[0].outerHTML;
            },
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
                            WM.element(element).addClass('col-md-' + scope.columnwidth + ' col-sm-' + scope.columnwidth);
                        }
                        var eventName = 'click.leftNavToggle';
                        scope.toggle = function () {
                            if (element.hasClass('visible')) {
                                scope.collapse();
                            } else {
                                scope.expand();
                            }
                        };
                        scope.expand = function () {
                            var appPage = element.closest('.app-page'),
                                skipEvent = true;
                            element.addClass('visible');
                            if (scope.animation === 'slide-in') {
                                appPage.addClass('slide-in-left-panel-container slide-left');
                            }
                            element.on(eventName, function () {
                                skipEvent = true;
                            });
                            appPage.addClass('left-panel-container');
                            appPage.on(eventName, function () {
                                if (!skipEvent) {
                                    scope.collapse();
                                }
                                skipEvent = false;
                            });
                        };
                        scope.collapse = function () {
                            var appPage = element.closest('.app-page');
                            appPage.removeClass('left-panel-container');
                            element.removeClass('visible');
                            element.off(eventName);
                            appPage.off(eventName);
                            if (scope.animation === 'slide-in') {
                                appPage.removeClass('slide-left');
                                //Remove the container class after the animation completion.
                                $timeout(function () {
                                    appPage.removeClass('slide-in-left-panel-container');
                                }, 600);
                            }
                        };
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        scope.collapse();
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

