/*global WM*/
/*Directive for Icon*/

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/icon.html',
            '<i init-widget class="app-icon"  data-ng-class="iconclass" data-ng-show="show"  data-ng-style="{\'font-size\' : iconsize, \'color\' : color, \'opacity\' : opacity}"></i>'
            );
    }])
        .directive('wmIcon', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.icon', ['wm.base']);
        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/icon.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
}]);


/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmIcon
 * @restrict E
 * @element ANY
 * @description
 * The 'wmIcon' directive defines a icon.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the container widget.
 * @param {string=} title
 *                  Title of the container widget. <br>
 *                  This is a bindable property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the icon widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the icon widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, `etc`.
 * @param {string=} iconclass
 *                  class name of the icon. <br>
 *                  This is a bindable property.
 *
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-icon iconclass="glyphicon glyphicon-search" iconsize="3em"></wm-icon>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
