/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/pagecontent.html',
            '<div init-widget class="app-page-content app-content-column" apply-styles="container"><div class="app-ng-transclude" wmtransclude></div></div>'
            );
        $templateCache.put('template/layout/page/pagecontent-loader.html',
            '<div class="app-page-content-loader">' +
            '<div class="loader bg-primary"></div>' +
            '<div class="load-info"></div>' +
            '</div>'
            );
    }])
    .directive('wmPageContent', ['$route', '$rootScope', '$templateCache', '$timeout', 'PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', 'Utils', function ($route, $rootScope, $templateCache, $timeout, PropertiesFactory, WidgetUtilService, CONSTANTS, Utils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.pagecontent', ['wm.layouts', 'wm.base.events.touch']),
            notifyFor = {
                'columnwidth': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal, oldVal) {
            switch (key) {
            case 'columnwidth':
                /*If columnwidth is passed set the appropriate class*/
                element.removeClass('col-md-' + oldVal + ' col-sm-' + oldVal).addClass('col-md-' + newVal + ' col-sm-' + newVal);
                break;
            }
        }

        /*Delays transclusion for the variables to load.*/
        function waitForTransition($ele) {
            var iScope = $ele.isolateScope(),
                $spinnerEl;
            $ele.addClass('load');
            $spinnerEl = WM.element($templateCache.get('template/layout/page/pagecontent-loader.html'));
            $spinnerEl.appendTo($ele);
            Utils.listenOnce($rootScope, 'page-transition-end', function () {
                iScope.__load();
                Utils.triggerFn($ele.scope().onPagePartLoad);
            });
            Utils.listenOnce($rootScope, 'page-startupdate-variables-loaded', function () {
                $timeout(function () {
                    $spinnerEl.remove();
                    $ele.removeClass('load');
                }, 100);
            });
            iScope.loadmode = 'after-select';
            Utils.triggerFn($ele.scope().registerPagePart);
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            /* horizontalalign also bound to textAlign for similar function. horizontalalign overrides textalign */
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/page/pagecontent.html'),
            'compile': function () {
                return {
                    'pre': function (scope, element) {
                        var page = element.closest('.app-page'),
                            isPartOfPage = page.length === 1,
                            isPartOfChildPage = page.parent().closest('.app-page').length === 1;
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                        if (CONSTANTS.isRunMode  && scope.__isWMPage && isPartOfPage && !isPartOfChildPage) {
                            waitForTransition(element);
                        }
                    },

                    'post': function (scope, element, attrs) {
                        /*If columnwidth is passed set the appropriate class*/

                        if (scope.columnwidth) {
                            WM.element(element).addClass('col-md-' + scope.columnwidth + ' col-sm-' + scope.columnwidth);
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmPageContent
 * @restrict E
 *
 * @description
 * The 'wmPageContent' directive defines a pagecontent in the layout.
 * wmPageContent is internally used by wmRow.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} columnWidth Sets the width of the pagecontent, it varies between 1 and 12.<br>
 *                  columnWidth is restricted to a range, to suit bootstrap fluid grid system
 * @param {string=} horizontalalign
 *                  Align the content in the right panel to left/right/center.<br>
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
