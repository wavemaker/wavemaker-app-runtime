/*global WM*/
/*Directive for Icon*/

WM.module('wm.widgets.basic')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
    'use strict';
    $templateCache.put('template/widget/icon.html',
        '<i init-widget class="app-icon"  data-ng-class="iconclass" data-ng-show="show"  data-ng-style="{\'font-size\' : iconsize}"></i>'
    );
}])
    .directive('wmIcon', ['PropertiesFactory', 'WidgetUtilService', '$sce', function (PropertiesFactory, WidgetUtilService, $sce) {
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
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the container widget.
 * @param {string=} iconclass
 *                  class name of the icon.
 * @param {string=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the chart widget on the web page. <br>
 *                  Default value: `true`. <br>
 *
 *
 * @example
 * <example module="wmCore">
 * <file name="index.html">
 *  <div data-ng-controller="Ctrl" class="wm-app">
 *    <br>
 *    <wm-icon iconclass="glyphicon glyphicon-search"></wm-icon>
 *  </div>
 * </file>
 * <file name="script.js">
 *   function Ctrl($scope) {}
 * </file>
 * </example>
 */
