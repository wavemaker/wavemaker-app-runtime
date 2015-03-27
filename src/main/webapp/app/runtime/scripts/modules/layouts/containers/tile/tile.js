/*global WM*/
/*Directive for Tile*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/tile/tile.html',
            '<div init-widget class="app-tile panel" data-ng-show="show" ' + $rootScope.getWidgetStyles() + ' wm-navigable-element="true">'+
            '   <div class="app-tile-body panel-body" wmtransclude >'+
            '   </div>'+
            '</div>');
    }])
    .directive('wmTile', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.tile', ['wm.layouts', 'wm.containers', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    $template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/tile/tile.html', tElement, tAttrs));

                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onEnterkeypress')) {
                        $template.attr('data-ng-keypress', 'onKeypress({$event: $event, $scope: this})');
                    }
                }
                return $template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
                    },
                    'post': function (scope, element, attrs) {
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (!scope.widgetid) {
                            scope.onKeypress = function (args) {
                                var action = Utils.getActionFromKey(args.$event);
                                if (action === 'ENTER') {
                                    scope.onEnterkeypress(args);
                                }
                            };
                        }
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmTile
 * @restrict E
 * @element ANY
 * @description
 * The 'wmTile' directive defines a tile in the page. 'wmTile' and 'wmContainer' are same from UI perspective, but 'wmTile' uses panel classes.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the tile widget.
 * @param {string=} width
 *                  Width of the tile.
 * @param {string=} height
 *                  height of the tile.
 * @param {string=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the chart widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} horizontalalign
 *                  Align the content in the right container to left/right/center.<br>
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
 *
 * @example
 * <example module="wmCore">
 * <file name="index.html">
 *  <div data-ng-controller="Ctrl" class="wm-app">
 *      <br>
 *      <wm-tile width="400" margintop="10" marginright="10" marginleft="10" marginbottom="10" backgroundcolor="#2F80E7" color="#fff"  paddingtop="10" paddingleft="10" paddingbottom="10" paddingright="10">
 *           <wm-icon iconsize="2em" iconclass="glyphicon glyphicon-user"></wm-icon>
 *           <wm-label width="100%" textalign="center" fontsize="3" fontunit="em" fontweight="bold" caption="12680"></wm-label>
 *           <wm-label width="100%" caption="Signups" textalign="center" fontweight="bold"></wm-label>
 *       </wm-tile>
 *  </div>
 * </file>
 * <file name="script.js">
 *   function Ctrl($scope) {}
 * </file>
 * </example>
 */
