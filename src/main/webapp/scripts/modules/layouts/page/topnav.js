/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/topnav.html',
                '<section data-role="page-topnav" page-container init-widget class="app-top-nav" apply-styles wmtransclude page-container-target></section>'
            );
    }])
    .directive('wmTopNav', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.topnav', ['wm.layouts', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/page/topnav.html'),
            'compile': function () {
                return {
                    'pre': function (iScope, element) {
                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = WM.copy(widgetProps);
                        } else {
                            iScope.widgetProps = widgetProps;
                            element.scope().layout.navigationBar = true;
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
 * @name wm.layouts.page.directive:wmTopNav
 * @restrict E
 *
 * @description
 * The 'wmTopNav' directive defines a navigation bar in the layout.
 * wmTopNav is internally used by wmPage.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=} height
 *                  Height of the top nav.
 * @param {string=} horizontalalign
 *                  Align the elements in the top nav to left/right/center.<br>
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
        <wm-top-nav height="30px" horizontalalign='right'>
            <wm-list>
                <wm-list-item></wm-list-item>
            </wm-list>
        </wm-top-nav>
     </file>
 </example>
 */