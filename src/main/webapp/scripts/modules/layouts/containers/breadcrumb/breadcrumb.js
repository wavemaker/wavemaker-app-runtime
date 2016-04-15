/*global WM*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .directive('wmBreadcrumb', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', '$timeout', function (PropertiesFactory, WidgetUtilService, CONSTANTS, $timeout) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.breadcrumb', ['wm.layouts', 'wm.tabbar.dataProps']),
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
                WM.forEach(newVal, function (item) {
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
                /*if studio-mode, then update the itemlabel, itemicon, itemlink & itemchildren in property panel*/
                if (CONSTANTS.isStudioMode && WM.isDefined(newVal) && newVal !== null) {
                    WidgetUtilService.updatePropertyPanelOptions(dataset.data || dataset, dataset.propertiesMap, scope);
                }
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
                '<ol class="breadcrumb app-breadcrumb" data-ng-show="show" apply-styles data-element-type="wmBreadCrumb"  init-widget has-model >' +
                    '<li data-ng-repeat="item in nodes" data-ng-class="{\'active\':$last}">' +
                        '<i class="{{item.icon}}"></i> ' +
                        '<a title="{{item.label}}" href="{{item.link}}" data-ng-if="!$last">{{item.label}}</a>' +
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
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope);
                        /* Register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (CONSTANTS.isRunMode && attrs.scopedataset) {
                            $timeout(function () {
                                scope.$watch('scopedataset', function (newVal) {
                                    onPropertyChange('scopedataset', newVal);
                                }, true);
                            }, 0);
                        }
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
            <div data-ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-breadcrumb dataset="Users, Alan, Profile, PersonalInfo, Address" name="breadcrumb1"></wm-breadcrumb>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */





