/*global WM*/
/*Directive for List and ListItem*/

/*Directive for List*/

WM.module('wm.layouts.containers')
    .directive('wmList', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.list', ['wm.layouts']);

        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'transclude': true,
            'template'  : '<ul class="app-list" ng-class="[layout]" apply-styles="container" data-element-type="wmList" wmtransclude init-widget></ul>',
            'link'   : {
                'pre': function (scope) {
                    /*Applying widget properties to directive scope*/
                    scope.widgetProps = widgetProps;
                },

                'post': function (scope, element, attrs) {
                    /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                     * style declarations.*/
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }])
    .directive('wmListItem', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listitem', ['wm.layouts']);

        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'transclude': true,
            'template'  : '<li init-widget class="app-list-item" apply-styles="container" wmtransclude></li>',
            'link'      : {
                'pre': function (scope) {
                    scope.widgetProps = widgetProps;
                },

                'post': function (scope, element, attrs) {
                    /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                     * style declarations.*/
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-list>
                    <wm-list-item>
                        <wm-button class="btn-default" caption="Users" type="button"></wm-button>
                    </wm-list-item>
                    <wm-list-item>
                        <wm-button class="btn-default" caption="Products" type="button"></wm-button>
                    </wm-list-item>
                    <wm-list-item>
                        <wm-button class="btn-default" caption="Sales" type="button"></wm-button>
                    </wm-list-item>
                </wm-list>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-list>
                    <wm-list-item>
                        <wm-button class="btn-default" caption="Users" type="button"></wm-button>
                    </wm-list-item>
                    <wm-list-item>
                        <wm-button class="btn-default" caption="Products" type="button"></wm-button>
                    </wm-list-item>
                    <wm-list-item>
                        <wm-button class="btn-default" caption="Sales" type="button"></wm-button>
                    </wm-list-item>
                </wm-list>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
