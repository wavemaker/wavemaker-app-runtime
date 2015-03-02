/*global WM*/
/*Directive for List and ListItem*/

/*Directive for List*/

WM.module('wm.layouts.containers')
    .directive('wmList', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', function (PropertiesFactory, WidgetUtilService, $rootScope) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.list', ['wm.layouts']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<ul class="app-list" ng-class="[layout]" data-ng-show="show"' + $rootScope.getWidgetStyles('container') + ' data-element-type="wmList" wmtransclude init-widget has-model ></ul>',
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
    .directive('wmListItem', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', function (PropertiesFactory, WidgetUtilService, $rootScope) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listitem', ['wm.layouts']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<li init-widget class="app-list-item"' + $rootScope.getWidgetStyles('container') + ' wmtransclude></li>',
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
