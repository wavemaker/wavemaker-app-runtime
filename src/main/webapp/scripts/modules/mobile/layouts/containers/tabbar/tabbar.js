/*global WM,_ */
/*jslint todo: true */
/*Directive for tabbar*/
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/containers/mobile/tabbar/tabbar.html',
            '<div data-role="mobile-tabbar" class="app-tabbar app-top-nav" init-widget listen-property="dataset">' +
                '<nav class="navbar navbar-default">' +
                    '<ul class="tab-items nav navbar-nav">' +
                        '<li class="tab-item" ng-repeat="item in tabItems" ng-show="(tabItems.length == layout.max) || $index+1 < layout.max" >' +
                            '<a data-ng-class="{\'active\' : item.active}" ng-href="{{item.link}}" ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label })">' +
                                '<i class="app-icon" ng-class="item.icon"></i><label>{{item.label}}</label>' +
                            '</a>' +
                        '</li>' +
                        '<li class="menu-items dropdown" ng-show="tabItems.length > layout.max" ng-class="{\'dropup\' : position == \'bottom\'}" uib-dropdown>' +
                            '<a uib-dropdown-toggle>' +
                                '<i class="app-icon {{morebuttoniconclass}}"></i><label>{{morebuttonlabel}}</label>' +
                            '</a>' +
                            '<ul class="dropdown-menu-right" uib-dropdown-menu ng-class="{\'nav navbar-nav\' : menutype == \'thumbnail\'}">' +
                                '<li class="menu-item" ng-repeat="item in tabItems" ng-show="$index+1 >= layout.max">' +
                                    '<a data-ng-class="{\'active\' : item.active}" ng-href="{{item.link}}" ng-click="onSelect({$event: $event, $scope: this, $item: item.value || item.label });">' +
                                        '<i class="app-icon" ng-class="item.icon"></i><label>{{item.label}}</label>' +
                                    '</a>' +
                                '</li>' +
                            '</ul>' +
                        '</li>' +
                    '</ul>' +
                '</nav>' +
            '</div>');
    }])
    .directive('wmMobileTabbar', [
        '$window',
        '$templateCache',
        'PropertiesFactory',
        '$routeParams',
        'WidgetUtilService',
        'Utils',
        function ($window,
                  $templateCache,
                  PropertiesFactory,
                  $routeParams,
                  WidgetUtilService,
                  Utils) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.tabbar', ['wm.base', 'wm.tabbar.dataProps']),
                notifyFor   = { 'dataset': true, 'position': true},
                layouts     = [
                    {'minwidth' : 2048, 'max': 12},
                    {'minwidth' : 1024, 'max': 10},
                    {'minwidth' : 768,  'max': 7},
                    {'minwidth' : 480,  'max': 5},
                    {'minwidth' : 0,    'max': 4}
                ];

            function getSuitableLayout(avaiableWidth) {
                return _.find(layouts, function (l) {
                    return avaiableWidth >= l.minwidth;
                });
            }

            function getItems(newVal) {
                return newVal.map(function (item) {
                    return {
                        'label': item,
                        'icon': 'wi wi-' + item
                    };
                });
            }
            function getTabItems(newVal, scope) {
                var activePageName = $routeParams.name,
                    transformFn;
                if (WM.isArray(newVal)) {
                    if (WM.isObject(newVal[0])) {
                        transformFn = function (item) {
                            var link = WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlink'}) || item.link;
                            return {
                                'label': WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlabel'}) || item.label,
                                'icon': WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemicon'}) || item.icon,
                                'link': link,
                                'active' : _.includes([activePageName, '#' + activePageName, '#/' + activePageName], link)
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

            function propertyChangeHandler(scope, $el, key, newVal, oldVal) {
                switch (key) {
                case 'position':
                    $el.removeClass(oldVal).addClass(newVal);
                    break;
                case 'dataset':
                    if (newVal) {
                        getTabItems(newVal.data || newVal, scope);
                    }
                    break;
                }
            }

            function onResize(scope, element) {
                scope.$root.$evalAsync(function () {
                    scope.layout = getSuitableLayout(element.parent().width());
                });
            }

            function onDestroy() {
                WM.element($window).off('.tabbar');
            }

            function registerResizeHandler(scope, element) {
                WM.element($window).on('resize.tabbar', _.debounce(onResize.bind(undefined, scope, element), 20));
            }

            return {
                'scope' : {
                    'menutype': '&',
                    'position': '&'
                },
                'restrict' : 'E',
                'replace'  : true,
                'template' : $templateCache.get('template/layouts/containers/mobile/tabbar/tabbar.html'),
                'link'     : {
                    'pre' : function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        scope.position = 'bottom'; /**top | bottom**/
                        scope.menutype = 'thumbnail'; /**thumbnail | list**/
                    },
                    'post' : function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);

                        registerResizeHandler(scope, element);

                        scope.layout = getSuitableLayout(element.parent().width());
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        scope.$on('$destroy', onDestroy);
                        element.on('$destroy', onDestroy);
                    }
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
 * @param {string=} dataset
 *                  This is a bindable property. Dataset should resolve to an array of objects.
 * @param {string=} itemlabel
 *                  The property of the dataset object that has to be used as label.
 * @param {string=} itemlink
 *                  The property of the dataset object that has to be used as link.
 * @param {string=} itemicon
 *                  The property of the dataset object that has to be used as icon.
 * @param {string=} show
 *                  This property determines whether or not the tabbar is visible. This property is a bindable property.
 * @param {string=} morebuttoniconclass
 *                  Icon to use for the 'more' button.
 * @param {string=} morebuttonlabel
 *                  label to use for the 'more' button. Default value is 'more'.
 * @param {string=} on-select
 *                  callback to be called when an item is clicked.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *              <wm-mobile-tabbar dataset="home,star,music,edit"></wm-mobile-tabbar>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.demo = true;
 *           }
 *       </file>
 *   </example>
 */