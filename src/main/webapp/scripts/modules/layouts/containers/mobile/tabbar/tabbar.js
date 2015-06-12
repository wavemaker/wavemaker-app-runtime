/*global WM, */
/*jslint todo: true */
/*Directive for tabbar*/
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/containers/mobile/tabbar/tabbar.html',
            '<nav init-widget class="navbar app-tabbar {{class}}">' +
                '<ul class="nav app-tabbar-nav">' +
                    '<li class="item" data-ng-repeat="item in tabItems">' +
                        '<a data-ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label })">' +
                            '<i class="icon" data-ng-class="item.icon"></i>{{item.label}}' +
                        '</a>' +
                    '</li>' +
                    '<li class="item more-menu-item" data-ng-class="{\'dropup\' : dropposition == \'up\'}">' +
                        '<a class="more-menu-btn" data-ng-class="{\'active\' : showMoreItems}" data-ng-click="showMoreItems = !showMoreItems">' +
                            '<i class="icon {{morebuttoniconclass}}"></i>{{morebuttonlabel}}' +
                        '</a>' +
                        '<ul class="more-menu dropdown-menu list-unstyled" data-ng-show="showMoreItems"  data-ng-click="showMoreItems = false;">' +
                            '<li class="item" data-ng-repeat="item in tabItems">' +
                                '<a data-ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label });">' +
                                    '<i class="icon" data-ng-class="item.icon"></i>{{item.label}}' +
                                '</a>' +
                            '</li>' +
                         '</ul>' +
                    '</li>' +
                '</ul>' +
            '</nav>');

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
                                "icon" : ''
                            });
                        });
                    }
                    break;
                }
            };
        return {
            'scope' : {
                'onSelect': '&'
            },
            'restrict' : 'E',
            'replace' : true,
            'template' : $templateCache.get('template/layouts/containers/mobile/tabbar/tabbar.html'),
            'compile' : function () {
                return {
                    'pre' : function (scope) {
                        scope.widgetProps = widgetProps;
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