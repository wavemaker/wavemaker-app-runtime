/*global WM*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .directive('wmBreadcrumb', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', 'Utils', function (PropertiesFactory, WidgetUtilService, $rootScope, Utils) {
    'use strict';
    var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.breadcrumb', ['wm.layouts']),
        notifyFor = {
            'dataset': true,
            'scopedataset': true,
            'itemicon': true,
            'itemlabel': true,
            'itemlink': true
        };

    function getNodes(scope, newVal) {
        var nodes = [];
        if (WM.isString(newVal)) {
            newVal = newVal.trim();
            if (newVal) {
                nodes = newVal.split(',').map(function (item) {
                    return {
                        'label': item && item.trim()
                    };
                });
            }
        } else if (WM.isArray(newVal)) {
            WM.forEach((newVal),function(item){
                nodes.push({
                    'label':item[scope.itemlabel || "label"],
                    'icon':item[scope.itemicon || "icon"],
                    'link':item[scope.itemlink || "link"]
                })
            });
        } else if (WM.isObject(newVal)) {
            nodes = [{
                'label':newVal[scope.itemlabel || "label"],
                'icon':newVal[scope.itemicon || "icon"],
                'link':newVal[scope.itemlink || "link"]
            }];
        }

        if (scope.widgetid) { // when the widget is inside canvas
            scope.keys = WM.isObject(nodes[0]) ? Object.keys(nodes[0]) : [];
            /*Changing the properties like labels, link and icons*/
            scope.widgetProps.itemlabel.options = scope.widgetProps.itemicon.options = scope.widgetProps.itemlink.options = scope.keys;
        }
        return nodes;
    }

    function propertyChangeHandler(scope, element, key, newVal) {
        switch (key) {
            case 'dataset':
            case 'scopedataset':
            case 'itemicon':
            case 'itemlabel':
            case 'itemlink':
                scope.nodes = getNodes(scope, scope.dataset);
                break;
        }
    }



    return {
        'restrict': 'E',
        'replace': true,
        'scope': {},
        'transclude': true,
        'template': '<ol class="breadcrumb app-breadcrumb" data-ng-show="show" ' + $rootScope.getWidgetStyles() + 'data-element-type="wmBreadCrumb"  init-widget has-model >' +
            '<li data-ng-repeat="item in nodes" data-ng-class="{\'active\':$last}">' +
            '<i class="{{item.icon}}"></i> ' +
            '<a title="{{item.label}}" href="{{item.link}}" data-ng-if="!$last">' +
            '{{item.label}}' +
            '</a>' +
            '<label data-ng-if="$last">{{item.label}}</label>' +
            '</li>' +
            '</ol> ',
        'compile': function () {
            return {
                'pre': function (scope) {
                    /*Applying widget properties to directive scope*/
                    scope.widgetProps = widgetProps;
                },

                'post': function (scope, element, attrs) {
                    var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                     * style declarations.*/
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            };
        }
    };
}]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmBreadcrumb
 * @restrict E
 * @element ANY
 * @description
 * The 'wmBreadcrumb' directive defines a breadcrumb bar in the layout.
 * @example
 <example>
 <file name="index.html">
 <wm-breadcrumb>
 </wm-breadcrumb>
 </file>
 </example>
 */





