/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/page/header.html',
                '<header data-role="page-header"  page-container init-widget class="app-header clearfix"' + $rootScope.getWidgetStyles('container') + '>' +
                    '<div class="visible-xs-block col-xs-1" data-role="page-left-panel-icon"><a class="app-header-action glyphicon glyphicon-menu-hamburger"></a></div>' +
                    '<div class="col-sm-12 col-xs-11 app-header-container" wmtransclude page-container-target></div>' +
                '</header>'
            );
    }])
    .directive('wmHeader', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.header', ['wm.layouts', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/page/header.html'),
            'compile': function () {
                return {
                    'pre': function (scope, element) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
                        if (CONSTANTS.isRunMode) {
                            // this flag is used to change the layout of the mobile view accordingly
                            element.scope().layout.header = true;
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
 * @name wm.layouts.page.directive:wmHeader
 * @restrict E
 *
 * @description
 * The 'wmHeader' directive defines a header in the layout.
 * wmHeader is internally used by wmPage.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=} height
 *                  Height of the header.
 * @param {string=} horizontalalign
 *                  Align the content in the header to left/right/center.<br>
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
         <wm-header height="50px" horizontalalign='right'></wm-header>
     </file>
 </example>
 */
