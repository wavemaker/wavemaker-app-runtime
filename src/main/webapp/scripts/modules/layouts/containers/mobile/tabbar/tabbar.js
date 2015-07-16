/*global WM, */
/*jslint todo: true */
/*Directive for tabbar*/
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/containers/mobile/tabbar/tabbar.html',
            '<div class="app-tabbar app-top-nav {{class}} {{position}}" init-widget>' +
                '<nav class="navbar navbar-default">' +
                    '<ul class="tab-items nav navbar-nav">' +
                        '<li class="tab-item" data-ng-repeat="item in tabItems">' +
                            '<a data-ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label })">' +
                                '<i class="app-icon" data-ng-class="item.icon"></i><label>{{item.label}}</label>' +
                            '</a>' +
                        '</li>' +
                        '<li class="menu-items dropdown" data-ng-class="{\'dropup\' : position == \'bottom\'}" dropdown>' +
                            '<a dropdown-toggle>' +
                                '<i class="app-icon {{morebuttoniconclass}}"></i><label>{{morebuttonlabel}}</label>' +
                            '</a>' +
                            '<ul class="dropdown-menu dropdown-menu-right" data-ng-class="{\'nav navbar-nav\' : menutype == \'thumbnail\'}">' +
                            '<li class="menu-item" data-ng-repeat="item in tabItems">' +
                                '<a data-ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label });">' +
                                '<i class="app-icon" data-ng-class="item.icon"></i><label>{{item.label}}</label>' +
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                        '</li>' +
                    '</ul>' +
                '</nav>' +
            '</div>');
    }]).directive('wmMobileTabbar', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', function ($templateCache, PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabbar', ['wm.base']),
            notifyFor = { 'dataset': true},
            propertyChangeHandler = function(scope, element, key, newVal) {
                switch (key) {
                case 'dataset':
                    if (WM.isArray(newVal)) {
                        scope.tabItems = newVal;
                    } else if (WM.isString(newVal)) {
                        scope.tabItems  = [];
                        WM.forEach(newVal.split(","), function (value) {
                            scope.tabItems.push({
                                "label" : value,
                                "icon" : 'glyphicon glyphicon-'+ value
                            });
                        });
                    }
                    break;
                }
            };
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
 * @param {string=} position
 *                  dropdown position, allowed values are 'up' or 'down'. Default value is up.
 * @param {string=} on-select
 *                  callback to be called when an item is clicked.
 * @param {string=} class
 *                 class to apply to the widget
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *              <wm-mobile-tabbar dataset="TAB1, TAB2, TAB3, TAB4"></wm-mobile-tabbar>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.demo = true;
 *           }
 *       </file>
 *   </example>
 */