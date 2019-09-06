/*global WM, */
/*Directive for Label */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/ac/widget/image.html',
            '<div class="ac-image-wrapper" init-widget>' +
            '   <div class="ac-horizontal-separator" ng-class="{\'visible\': separator}"></div>' +
            '   <div class="ac-image-container">' +
            '       <img class="ac-image" ng-src="{{imagesource}}" alt="{{alttext}}" ng-style="{\'background-color\': backgroundcolor, \'width\': imagewidth, \'height\': imageheight}">' +
            '   </div>'+
            '</div>'
        );
    }])
    .directive('acImage', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('ac.image', ['ac.base']),
            notifyFor = {
                'imagesize' : true,
                'imagestyle' : true,
                'imagesource' : true,
                'imagealignment' : true,
            },
            classnames = [{
                'name': 'image-size',
                'options': ['auto', 'strech', 'small', 'medium', 'large']
            },{
                'name': 'image-style',
                'options': ['default', 'person']
            },{
                'name': 'image-align',
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
            var element = wrapper.find('.ac-image');
            switch (key) {
                case 'imagesize' :
                    setClass(element, newVal, 'image-size');
                    break;
                case 'imagestyle' :
                    setClass(element, newVal, 'image-style');
                    break;
                case 'imagealignment' :
                    setClass(wrapper.find('.ac-image-container'), newVal, 'image-align');
                    break;
            }
        }

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/ac/widget/image.html'),
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