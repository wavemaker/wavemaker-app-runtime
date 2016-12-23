/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/row.html',
                '<div init-widget class="row app-row clearfix" apply-styles wmtransclude></div>'
            );
    }])
    .directive('wmRow', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.row', ['wm.layouts', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/page/row.html'),
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmRow
 * @restrict E
 *
 * @description
 * The 'wmRow' directive defines a row in the layout.
 * wmRow is internally used by wmContent.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} height
 *                  Height of the row.
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
            <div class="wm-app" data-ng-controller="Ctrl">
                <wm-row style="height:200px">
                    <wm-column columnWidth="10" backgroundcolor="teal" style="height:100%"></wm-column>
                    <wm-column columnWidth="2" backgroundcolor="tomato" style="height:100%"></wm-column>
                </wm-row>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
