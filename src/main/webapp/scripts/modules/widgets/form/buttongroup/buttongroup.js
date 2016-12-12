/*global WM */
/*Directive for button group */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/button-group.html',
                '<div class="btn-group app-button-group" wmtransclude init-widget ng-class=\'{"btn-group-vertical": vertical}\' apply-styles="container" title="{{hint}}" role="input"></div>'
            );
    }])
    .directive('wmButtongroup', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', 'Utils', function ($templateCache, PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.buttongroup', ['wm.base']);

        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'template'  : $templateCache.get('template/widget/form/button-group.html'),
            'transclude': true,
            'link'      : {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {

                    /*Called from form reset when users clicks on form reset*/
                    scope.reset = function () {
                        //TODO implement custom reset logic here
                    };

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                Will you try this widget?? <br>
                <wm-buttongroup>
                    <wm-button backgroundcolor="teal" caption="Yes"></wm-button>
                    <wm-button backgroundcolor="DarkSlateBlue" caption="May be"></wm-button>
                    <wm-button backgroundcolor="crimson" caption="No"></wm-button>
                </wm-buttongroup>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {}
        </file>
    </example>
 */
