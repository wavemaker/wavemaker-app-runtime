/*global WM, _*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .directive('wmBreadcrumb', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.breadcrumb', ['wm.containers', 'wm.tabbar.dataProps']),
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
                _.forEach(newVal, function (item) {
                    nodes.push({
                        'label' : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlabel'}) || item.label,
                        'icon'  : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemicon'}) || item.icon,
                        'link'  : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlink'}) || item.link
                    });
                });
            } else if (WM.isObject(newVal)) {
                nodes = [{
                    'label': newVal[scope.itemlabel || "label"],
                    'icon': newVal[scope.itemicon || "icon"],
                    'link': newVal[scope.itemlink || "link"]
                }];
            }
            return nodes;
        }

        function propertyChangeHandler(scope, key, newVal) {
            var dataset = scope.dataset || {};
            switch (key) {
            case 'scopedataset':
            case 'dataset':
                dataset = newVal;
                //break statement is intentionally removed for the flow
            case 'itemicon':
            case 'itemlabel':
            case 'itemlink':
                scope.nodes = getNodes(scope, dataset.data || dataset);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'scopedataset': '=?'
            },
            'transclude': true,
            'template':
                '<ol class="breadcrumb app-breadcrumb" apply-styles data-element-type="wmBreadCrumb" init-widget listen-property="dataset">' +
                    '<li ng-repeat="item in nodes" ng-class="{\'active\':$last}">' +
                        '<i class="{{item.icon}}"></i> ' +
                        '<a title="{{item.label}}" href="{{item.link}}" ng-if="!$last">{{item.label}}</a>' +
                        '<label ng-if="$last">{{item.label}}</label>' +
                    '</li>' +
                '</ol> ',
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    var onPropertyChange = propertyChangeHandler.bind(undefined, scope);
                    WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    if (!attrs.widgetid && attrs.scopedataset) {
                        scope.$watch('scopedataset', function (newVal) {
                            onPropertyChange('scopedataset', newVal);
                        }, true);
                    }
                }
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
 *
 * @param {string=} name
 *                  Name of the breadcrumb.
 * @param {string=} height
 *                  Height of the breadcrumb.
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the breadcrumb widget from a variable defined in the page controller. <br>
 * @param {string=} value
 *                  This property displays the list of values to display in the breadcrumb widget. It is a bindable property.
 * @param {string=} itemicon
 *                  This property defines the value to be used as key for the icon from the list of values bound to the breadcrumb widget as an array of objects of different values.
 * @param {string=} itemlabel
 *                  This property defines the value to be used as key for the label from the list of values bound to the breadcrumb widget as an array of objects of different values.
 * @param {string=} itemlink
 *                  This property defines the value to be used as key for the link from the list of values bound to the breadcrumb widget as an array of objects of different values.
 * @param {boolean=} show
 *                  This property determines whether the breadcrumb widget is visible or not. It is a bindable property.
 *                  Default value: `true`. <br>
 * @param {boolean=} horizontalalign
 *                  Align the content of the breadcrumb widget to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-breadcrumb dataset="Users, Alan, Profile, PersonalInfo, Address" name="breadcrumb1"></wm-breadcrumb>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */





