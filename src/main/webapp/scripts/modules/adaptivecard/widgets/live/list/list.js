/*global WM, */
/*Directive for Label */

WM.module('wm.widgets.live')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/ac/widgets/live/list.html',
            '<div class="ac-list" init-widget wmtransclude>' +
            '</div>'
        );
    }])
    .directive('acList', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('ac.list');

        return {
            'restrict': 'E',
            'transclude': true,
            'scope'   : {},
            'replace' : true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/ac/widgets/live/list.html'),
            'link'    : {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {

                    /* register the property change handler */
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);