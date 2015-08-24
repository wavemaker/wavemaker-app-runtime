/*global WM */
/*Directive for button group */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/button-group.html',
                '<div class="btn-group app-button-group" wmtransclude init-widget data-ng-class=\'{"btn-group-vertical": vertical}\' apply-styles="container" title="{{hint}}" data-ng-show="show"></div>'
            );
    }])
    .directive('wmButtongroup', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', function ($templateCache, PropertiesFactory, WidgetUtilService) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.buttongroup', ['wm.base', 'wm.base.editors']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': $templateCache.get('template/widget/form/button-group.html'),
            'transclude': true,
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmButtongroup
 * @restrict E
 *
 * @description
 * The `wmButtongroup` directive defines a button group widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the button group widget.
 * @param {string=} hint
 *                  Title/hint for the button group widget.<br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the button group.
 * @param {string=} height
 *                  Height of the button group.
 * @param {object=} vertical
 *                  Determines whether the buttons should be vertical or not.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the Button Group widget on the web page. <br>
 *                  Default value: `true`. <br>
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *              <wm-buttongroup name="buttongroup1">
 *                    <wm-button style="background-color:#779cd4" caption="left" name="button1"></wm-button>
 *                    <wm-button style="background-color:#779cd4" caption="center" name="button2"></wm-button>
 *                    <wm-button style="background-color:#779cd4" caption="right" name="button3"></wm-button>
 *              </wm-buttongroup>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *
 *          }
 *       </file>
 *   </example>
 */
