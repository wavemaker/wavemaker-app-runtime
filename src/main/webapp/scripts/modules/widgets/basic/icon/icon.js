/*global WM*/
/*Directive for Icon*/

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/icon.html',
            '<span class="app-icon-wrapper" init-widget ng-style="{\'font-size\' : iconsize, \'opacity\' : opacity}">' +
                '<i class="app-icon"  title="{{hint}}"  ng-style="{\'color\' : color}" ng-class="iconclass"></i> ' +
                '<label class="app-label" ng-if="caption">{{caption}}</label>' +
            '</span>'
            );
    }])
    .directive('wmIcon', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.icon', ['wm.base']),
            notifyFor   = {
                'iconposition': true
            };

        //Define the property change handler. This function will be triggered when there is a change in the widget property
        function propertyChangeHandler($is, $el, key, newVal) {
            switch (key) {
            case 'iconposition':
                $el.attr('icon-position', newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/icon.html'),
            'link'    : {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                    /* register the property change handler */
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
            <div ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-icon iconclass="wi wi-search" iconsize="3em"></wm-icon>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
