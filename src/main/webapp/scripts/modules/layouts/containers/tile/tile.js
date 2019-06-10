/*global WM*/
/*Directive for Tile*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/tile/tile.html',
            '<div init-widget class="app-tile" apply-styles="container" ng-style="{width:width}" wm-navigable-element="true" wmtransclude></div>');
    }])
    .directive('wmTile', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.tile', ['wm.containers', 'wm.dynamicstyles', 'wm.base.events.touch']);

        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'transclude': true,
            'template'  : function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    $template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/tile/tile.html', tElement, tAttrs));

                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onEnterkeypress')) {
                        $template.attr('ng-keypress', 'onKeypress({$event: $event, $scope: this})');
                    }
                }
                return $template[0].outerHTML;
            },
            'link': {
                'pre': function (iScope, $el, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
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
 *                  Width of the tile widget.
 * @param {string=} height
 *                  Height of the tile widget.
 * @param {boolean=} Show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the tile widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the tile widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, etc.
 * @param {string=} horizontalalign
 *                  Align the content in the tile widget to left/right/center.<br>
 * @param {string=} click
 *                  Callback function which will be triggered when the tile widget is clicked.
 * @param {string=} double-click
 *                  Callback function which will be triggered when the tile widget is double-clicked.
 * @param {string=} mouse-over
 *                  Callback function which will be triggered when the mouse moves over the tile widget.
 * @param {string=} mouse-out
 *                  Callback function which will be triggered when the mouse moves away from the tile widget.
 * @param {string=} mouse-enter
 *                  Callback function which will be triggered when the mouse enters inside the tile widget.
 * @param {string=} mouse-leave
 *                  Callback function which will be triggered when the mouse leaves the tile widget.
 * @param {string=} enter-key-press
 *                  Callback function which will be triggered when the tile enter key is pressed.
 * @param {string=} swipeup
 *                  Callback function which will be triggered when the tile widget is swiped up.
 * @param {string=} swipedown
 *                  Callback function which will be triggered when the tile widget is swiped down.
 * @param {string=} swiperight
 *                  Callback function which will be triggered when the tile widget is swiped right.
 * @param {string=} swipeleft
 *                  Callback function which will be triggered when the tile widget is swiped left.
 * @param {string=} pinchin
 *                  Callback function which will be triggered when the tile widget is pinched in.
 * @param {string=} pinchout
 *                  Callback function which will be triggered when the tile widget is pinched out.
 *
 * @example
 * <example module="wmCore">
 * <file name="index.html">
 *  <div ng-controller="Ctrl" class="wm-app">
 *      <br>
 *      <wm-tile width="400" margin="10px" backgroundcolor="#2F80E7" color="#fff"  padding="10px">
 *           <wm-icon iconsize="2em" iconclass="wi wi-user"></wm-icon>
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
