/*global WM*/
/*Directive for Container*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/container/container.html',
            '<div page-container init-widget class="app-container" data-ng-show="show" ' + $rootScope.getWidgetStyles('container') + ' wmtransclude page-container-target></div>'
            );
    }])
    .directive('wmContainer', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.container', ['wm.layouts', 'wm.containers', 'wm.base.events.touch']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    $template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/container/container.html', tElement, tAttrs));

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
 * @name wm.layouts.containers.directive:wmContainer
 * @restrict E
 * @element ANY
 * @description
 * The 'wmContainer' directive defines a container in the page.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the container widget.
 * @param {string=} width
 *                  Width of the container.
 * @param {string=} height
 *                  height of the container.
 * @param {string=} content
 *                  Sets content for the container. <br>
 *                  It can be Inline content(incase of html widget) or Page's content(incase of page container widgets) will be included in the widget.<br>
 *                  Default value: `Inline Content`. <br>
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
 <example module="wmCore">
 <file name="index.html">
 <wm-container>
 <wm-composite widget="text">
 <wm-label></wm-label>
 <wm-text></wm-text>
 </wm-composite>
 <wm-composite widget="textarea">
 <wm-label></wm-label>
 <wm-textarea></wm-textarea>
 </wm-composite>
 </wm-container>
 </file>
 </example>
 */
