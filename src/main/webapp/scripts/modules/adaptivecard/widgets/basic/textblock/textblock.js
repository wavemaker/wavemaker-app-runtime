/*global WM, */
/*Directive for Label */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/ac/widget/textblock.html',
            '<div class="ac-textblock-wrapper" init-widget>' +
            '   <div class="ac-horizontal-separator" ng-class="{\'visible\': separator}"></div>' +
            '   <div class="ac-textblock" ng-class="{\'wrap-text\': wrap, \'subtle-content\': issubtle}"></div>' +
            '</div>'
        );
    }])
    .directive('acTextblock', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('ac.textblock', ['ac.base']),
            notifyFor = {
                'text' : true,
                'size' : true,
                'color' : true,
                'weight' : true,
                'horizontalalignment' : true,
            },
            classnames = [{
                'name': 'font-size',
                'options': ['default', 'small', 'medium', 'large', 'extraLarge']
            },{
                'name': 'text-color',
                'options': ['default', 'dark', 'light', 'accent', 'good', 'warning', 'attention']
            },{
                'name': 'font-weight',
                'options': ['default', 'lighter', 'bolder']
            },{
                'name': 'text-align',
                'options': ['left', 'center', 'right']
            }];

        function setClass(element, newVal, classType) {
            var options = _.find(classnames, {name: classType}).options;
            options = _.map(options, function (o) {
                return classType + '-' + o;
            });
            element.removeClass(options.join(' '));
            element.addClass(classType+ '-' + newVal);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(wrapper, attrs, key, newVal) {
            var element = wrapper.find('.ac-textblock');
            switch (key) {
                case 'text':
                    Utils.setNodeContent(element, newVal);
                    break;
                case 'size' :
                    setClass(element, newVal, 'font-size');
                    break;
                case 'color' :
                    setClass(element, newVal, 'text-color');
                    break;
                case 'weight' :
                    setClass(element, newVal, 'font-weight');
                    break;
                case 'horizontalalignment' :
                    setClass(element, newVal, 'text-align');
                    break;
            }
        }

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/ac/widget/textblock.html'),
            'link'    : {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element, attrs), scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);