/*global WM, */
/*Directive for Label */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/ac/widget/card.html',
            '<div class="ac-card" init-widget wmtransclude></div>'
        );
    }])
    .directive('acCard', ['$rootScope', 'PropertiesFactory', 'WidgetUtilService', 'Utils', 'Variables', function ($rs, PropertiesFactory, WidgetUtilService, Utils, Variables) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('ac.card', ['ac.base']),
            notifyFor = {
                'text' : true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, attrs, key, newVal) {
            switch (key) {
                case 'text':
                    Utils.setNodeContent(element, newVal);
                    break;
            }
        }

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/ac/widget/card.html'),
            'link'    : {
                'pre': function ($s, $el, attrs) {
                    $s.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;// register the page variables
                    setTimeout(function () {
                        var pageName = $rs.activePageName;
                        var variableScope = $rs.domScope;
                        Variables.getPageVariables(pageName, function (variables) {
                            Variables.register(pageName, variables, true, variableScope);
                        });
                    }, 1000);
                },
                'post': function (scope, element, attrs) {

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element, attrs), scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);