/*global WM*/
/* Directive for Container */

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/container/container.html',
            '<div page-container init-widget class="app-container" apply-styles="container" wm-smoothscroll="{{smoothscroll}}" wmtransclude page-container-target></div>'
            );
    }])
    .directive('wmContainer', ['PropertiesFactory', 'WidgetUtilService', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.container', [ 'wm.containers', 'wm.dynamicstyles', 'wm.base.events.touch']);

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
 *                  Width of the container widget.
 * @param {string=} height
 *                  Height of the container widget.
 * @param {string=} content
 *                  Sets content for the container. <br>
 *                  It can be Inline content(incase of html widget) or Page's content(incase of page container widgets) will be included in the widget.<br>
 *                  Default value: `Inline Content`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the container widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the container widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, etc.
 * @param {string=} horizontalalign
 *                  Align the content in the container to left/right/center.<br>
 * @param {string=} click
 *                  Callback function which will be triggered when the container widget is clicked.
 * @param {string=} double-click
 *                  Callback function which will be triggered when the container widget is double clicked.
 * @param {string=} mouse-over
 *                  Callback function which will be triggered when mouse moves over the container widget.
 * @param {string=} mouse-out
 *                  Callback function which will be triggered when mouse moves away from the container widget.
 * @param {string=} mouse-enter
 *                  Callback function which will be triggered when mouse enters inside the container widget.
 * @param {string=} mouse-leave
 *                  Callback function which will be triggered when mouse leaves the container widget.
 * @param {string=} enter-key-press
 *                  Callback function which will be triggered when enter key is pressed.
 * @param {string=} swipeup
 *                  Callback function which will be triggered when the container widget is swiped out.
 * @param {string=} swipedown
 *                  Callback function which will be triggered when the container widget is swiped down.
 * @param {string=} swiperight
 *                  Callback function which will be triggered when the container widget is swiped right.
 * @param {string=} swipeleft
 *                  Callback function which will be triggered when the container widget is swiped left.
 * @param {string=} pinchin
 *                  Callback function which will be triggered when the container widget is pinched in.
 * @param {string=} pinchout
 *                  Callback function which will be triggered when the container widget is pinched out.
 *
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-container width="400" height="400" backgroundcolor="#979797" padding="50px 0 0 0">
                    <wm-composite>
                        <wm-label class="col-md-3" caption="First Name"></wm-label>
                        <wm-container class="col-md-9">
                            <wm-text></wm-text>
                        </wm-container>
                    </wm-composite>
                    <wm-composite>
                        <wm-label class="col-md-3" caption="Last Name"></wm-label>
                        <wm-container class="col-md-9">
                            <wm-text></wm-text>
                        </wm-container>
                    </wm-composite>
                    <wm-container horizontalalign="right">
                        <wm-button class="btn-secondary" caption="Cancel" type="button"></wm-button>
                        <wm-button class="btn-primary" caption="Save" type="button"></wm-button>
                    </wm-container>
                </wm-container>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
