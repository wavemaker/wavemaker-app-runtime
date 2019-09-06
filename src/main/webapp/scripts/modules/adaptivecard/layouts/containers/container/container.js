/*global WM, */
/*Directive for Label */

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/ac/layout/container.html',
            '<div class="ac-container-wrapper" init-widget>' +
            '   <div class="ac-horizontal-separator" ng-class="{\'visible\': separator}"></div>' +
            '   <div class="ac-container" ng-class="{\'bleed\': bleed}" wmtransclude ng-style="{\'background-image\': \'url(\\\'\' + backgroundimage + \'\\\')\', \'min-height\': minheight}"></div>' +
            '</div>'
        );
    }])
    .directive('acContainer', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('ac.container.base', ['ac.base']),
            notifyFor = {
                'backgroundfillmode': true,
                'backgroundpositionx': true,
                'backgroundpositiony': true,
                'containerstyle' : true,
                'verticalcontentalignment' : true
            },
            classnames = [{
                'name': 'background-fill-mode',
                'options': ['repeat', 'repeatHorizontally', 'repeatVertically']
            },{
                'name': 'background-position-x',
                'options': ['left', 'center', 'right']
            },{
                'name': 'background-position-y',
                'options': ['top', 'center', 'bottom']
            },{
                'name': 'container-style',
                'options': ['default', 'emphasis', 'good', 'attention', 'warning', 'accent']
            },{
                'name': 'content-v-aligment',
                'options': ['top', 'center', 'bottom']
            }];

        function setClass(element, newVal, classType) {
            var options = _.find(classnames, {name: classType}).options;
            options = _.map(options, function (o) {
                return classType + '-' + o;
            });
            element.removeClass(options.join(' '));
            if (!_.isEmpty(newVal)) {
                element.addClass(classType + '-' + newVal);
            }
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(widget, attrs, key, newVal) {
            var element = widget.find('.ac-container');
            switch (key) {
                case 'backgroundfillmode' :
                    setClass(element, newVal, 'background-fill-mode');
                    break;
                case 'backgroundpositionx' :
                    setClass(element, newVal, 'background-position-x');
                    break;
                case 'backgroundpositiony' :
                    setClass(element, newVal, 'background-position-y');
                    break;
                case 'containerstyle' :
                    setClass(element, newVal, 'container-style');
                    break;
                case 'verticalcontentalignment' :
                    setClass(element, newVal, 'content-v-aligment');
                    break;
            }
        }

        return {
            'restrict': 'E',
            'transclude': true,
            'scope'   : {},
            'replace' : true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/ac/layout/container.html'),
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