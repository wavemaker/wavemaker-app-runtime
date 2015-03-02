/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/page/footer.html',
                '<footer data-role="page-footer" page-container page-container-target init-widget class="app-footer clearfix"' + $rootScope.getWidgetStyles('container') + ' wmtransclude></footer>'
            );
    }])
    .directive('wmFooter', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, CONSTANTS) {
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
                    'pre': function (scope, element) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
                        if (CONSTANTS.isRunMode) {
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
        <wm-footer height="30px" horizontalalign='right'></wm-footer>
     </file>
 </example>
 */