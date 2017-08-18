/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/footer.html',
                '<footer data-role="page-footer" page-container page-container-target init-widget class="app-footer clearfix" apply-styles="container" wmtransclude></footer>'
            );
    }])
    .directive('wmFooter', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', 'Utils',  function (PropertiesFactory, WidgetUtilService, CONSTANTS, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.footer', ['wm.layouts', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/page/footer.html'),
            'compile': function () {
                return {
                    'pre': function (iScope, element) {
                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            iScope.widgetProps = widgetProps;
                            // this flag is used to change the layout of the mobile view accordingly
                            element.scope().layout.footer = true;
                        }
                    },

                    'post': function (scope, element, attrs) {
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmFooter
 * @restrict E
 *
 * @description
 * The 'wmFooter' directive defines a footer in the layout.
 * wmFooter is internally used by wmPage.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=} height
 *                  Height of the footer.
 * @param {string=} horizontalalign
 *                  Align the content in the footer to left/right/center.<br>
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