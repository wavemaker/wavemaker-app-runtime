/*global WM, */
/*jslint todo: true */
/*Directive for tabbar*/
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/containers/mobile/tabbar/tabbar.html',
            '<div data-role="mobile-tabbar" class="app-tabbar app-top-nav {{class}} {{position}}" init-widget>' +
                '<nav class="navbar navbar-default">' +
                    '<ul class="tab-items nav navbar-nav">' +
                        '<li class="tab-item" data-ng-repeat="item in tabItems" data-ng-show="(tabItems.length == layout.max) || $index+1 < layout.max" >' +
                            '<a data-ng-href="{{item.link}}" data-ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label })">' +
                                '<i class="app-icon" data-ng-class="item.icon"></i><label>{{item.label}}</label>' +
                            '</a>' +
                        '</li>' +
                        '<li class="menu-items dropdown" data-ng-show="tabItems.length > layout.max" data-ng-class="{\'dropup\' : position == \'bottom\'}" dropdown>' +
                            '<a dropdown-toggle>' +
                                '<i class="app-icon {{morebuttoniconclass}}"></i><label>{{morebuttonlabel}}</label>' +
                            '</a>' +
                            '<ul class="dropdown-menu dropdown-menu-right" data-ng-class="{\'nav navbar-nav\' : menutype == \'thumbnail\'}">' +
                                '<li class="menu-item" data-ng-repeat="item in tabItems" data-ng-show="$index+1 >= layout.max">' +
                                    '<a data-ng-href="{{item.link}}" data-ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label });">' +
                                        '<i class="app-icon" data-ng-class="item.icon"></i><label>{{item.label}}</label>' +
                                    '</a>' +
                                '</li>' +
                            '</ul>' +
                        '</li>' +
                    '</ul>' +
                '</nav>' +
            '</div>');
    }]).directive('wmMobileTabbar', ['$window', '$templateCache', 'PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', function ($window, $templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabbar', ['wm.base', 'wm.tabbar.dataProps']),
            notifyFor = { 'dataset': true},
            layouts = [{'minwidth' : 2048, 'max': 12},
                       {'minwidth' : 1024, 'max': 10},
                       {'minwidth' : 768, 'max': 7},
                       {'minwidth' : 480, 'max': 5},
                       {'minwidth' : 0, 'max': 4}],
            getSuitableLayout = function (avaiableWidth) {
                return _.find(layouts, function (l) {
                    return avaiableWidth >= l.minwidth;
                });
            };
        function getItems(newVal) {
            return newVal.map(function (item) {
                return {
                    'label': item,
                    'icon': 'glyphicon glyphicon-' + item
                };
            });
        }
        function getTabItems(newVal, scope) {
            if (WM.isArray(newVal)) {
                var transformFn;
                if (WM.isObject(newVal[0])) {
                    transformFn = function (item) {
                        return {
                            'label': WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlabel'}) || item.label,
                            'icon': WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemicon'}) || item.icon,
                            'link': WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlink'}) || item.link
                        };
                    };
                    scope.tabItems = newVal.map(transformFn);
                } else {
                    scope.tabItems = getItems(newVal);
                }
            } else if (WM.isString(newVal)) {
                scope.tabItems = getItems(newVal.split(","));
            }
        }
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case 'dataset':
                /*if studio-mode, then update the itemlabel, itemicon, itemlink & itemchildren in property panel*/
                if (CONSTANTS.isStudioMode && WM.isDefined(newVal) && newVal !== null) {
                    WidgetUtilService.updatePropertyPanelOptions(newVal.data || newVal, newVal.propertiesMap, scope);
                }
                if (newVal) {
                    getTabItems(newVal.data || newVal, scope);
                }
                break;
            }
        }
        return {
            'scope' : {
                'onSelect': '&',
                'menutype': '&',
                'position': '&'
            },
            'restrict' : 'E',
            'replace' : true,
            'template' : $templateCache.get('template/layouts/containers/mobile/tabbar/tabbar.html'),
            'compile' : function () {
                return {
                    'pre' : function (scope) {
                        scope.widgetProps = widgetProps;
                        scope.position = "bottom"; /**top | bottom**/
                        scope.menutype = "thumbnail"; /**thumbnail | list**/
                    },
                    'post' : function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                        WM.element($window).resize(function () {
                            scope.layout = getSuitableLayout(element.parent().width());
                            scope.$apply();
                        });
                        scope.layout = getSuitableLayout(element.parent().width());
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers:wmMobileTabbar
 * @restrict E
 *
 * @description
 * The `wmTabbar` directive defines wm-tabbar widget.
 *
 *
 * @scope
 *
 * @param {string=} name
 *                  Name of the widget.
 * @param {string=} dropposition
 *                  dropdown position, allowed values are 'up' or 'down'. Default value is up.
 * @param {string=} on-select
 *                  callback to be called when an item is clicked.
 * @param {string=} class
 *                 class to apply to the widget
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *              <wm-mobile-tabbar dataset="home,star,music,cog,edit"></wm-mobile-tabbar>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.demo = true;
 *           }
 *       </file>
 *   </example>
 */