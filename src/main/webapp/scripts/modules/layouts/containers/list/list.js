/*global WM*/
/*Directive for List and ListItem*/

/*Directive for List*/

WM.module('wm.layouts.containers')
    .directive('wmList', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.list', ['wm.layouts']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<ul class="app-list" ng-class="[layout]" data-ng-show="show" apply-styles="container" data-element-type="wmList" wmtransclude init-widget has-model ></ul>',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },

                    'post': function (scope, element, attrs) {
                        /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                         * style declarations.*/
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmListItem', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listitem', ['wm.layouts']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<li init-widget class="app-list-item" apply-styles="container" wmtransclude></li>',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },

                    'post': function (scope, element, attrs) {
                        /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                         * style declarations.*/
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmList
 * @restrict E
 * @element ANY
 * @description
 * The 'wmList' directive defines a dynamic list in the layout.
 * wmList is internally used by wmTopNav.
 *
 * @param {string=} name
 *                  Sets the name of the list.
 * @param {boolean=} height
 *                  Sets the height for the list.
 * @param {boolean=} layout
 *                  Sets the layout for the list.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the list widget on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} horizontalalign
 *                  Align the content of the list to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
 <example>
 <file name="index.html">
 <wm-top-nav>
    <wm-list></wm-list>
 </wm-top-nav>
 </file>
 </example>
 */

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmListItem
 * @restrict E
 * @element ANY
 * @description
 * The 'wmListItem' directive defines a list item in the layout.
 * wmListItem is internally used by wmList.
 * @example
 <example>
 <file name="index.html">
 <wm-list>
    <wm-list-item></wm-list-item>
 </wm-list>
 </file>
 </example>
 */
