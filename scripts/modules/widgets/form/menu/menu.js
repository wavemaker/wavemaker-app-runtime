/*global WM */
/*Directive for menu */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/menu.html',
                '<div class="dropdown app-menu" init-widget data-ng-show="show" dropdown>' +
                    '<button class="btn btn-default app-button dropdown-toggle {{menuclass}}" dropdown-toggle' +
                        $rootScope.getWidgetStyles() +
                        '><i class="{{iconclass}}"></i>' +
                        ' {{caption}} ' +
                        '<span wmtransclude></span>' +
                        '<span class="caret"></span>' +
                    '</button>' +
                    '<ul class="dropdown-menu">' +
                        '<li data-ng-repeat="item in menuItems" data-ng-class="{\'disabled\': item.disabled}">' +
                            '<a title="{{item.label}}">' +
                                '<i class="{{item.icon}}"></i>' +
                                '{{item.label}}' +
                            '</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>'
            );
        $templateCache.put('template/widget/form/anchormenu.html',
                '<div class="dropdown app-menu" init-widget data-ng-show="show" dropdown>' +
                    '<a class="app-anchor dropdown-toggle {{menuclass}}" dropdown-toggle' +
                        $rootScope.getWidgetStyles() +
                        '><i class="{{iconclass}}"></i>' +
                        ' {{caption}} ' +
                        '<span wmtransclude></span>' +
                        '<span class="caret"></span>' +
                    '</a>' +
                    '<ul class="dropdown-menu">' +
                        '<li data-ng-repeat="item in menuItems" data-ng-class="{\'disabled\': item.disabled}">' +
                            '<a title="{{item.label}}">' +
                                '<i class="{{item.icon}}"></i>' +
                                '{{item.label}}' +
                            '</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>'
            );
    }])
    .directive('wmMenu', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', '$timeout', 'CONSTANTS', function ($templateCache, PropertiesFactory, WidgetUtilService, $timeout, CONSTANTS) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.menu', ['wm.base.editors', 'wm.base.editors.dataseteditors']),
            ALLFIELDS = 'All Fields',
            notifyFor = {
                'iconname' : true,
                'scopedataset': true,
                'dataset': true,
                'dropposition': true
            };

        function getMenuItems(newVal, scope) {
            var menuItems = [];
            if (WM.isString(newVal)) {
                menuItems = newVal.split(",").map(function (item) {
                    var _val = item && item.trim();
                    return {
                        'label': _val,
                        'value': _val
                    };
                });
            } else if (WM.isArray(newVal)) {
                if (WM.isObject(newVal[0])) {
                    menuItems = newVal.map(function (item) {
                        return {
                            'label': scope.displayfield ? item[scope.displayfield] : item.label,
                            'icon': item.icon,
                            'disabled': item.disabled,
                            'value': scope.datafield ? (scope.datafield === 'All Fields' ? item : item[scope.datafield]) : item
                        };
                    });
                } else {
                    menuItems = newVal.map(function (item) {
                        return {
                            'label': item,
                            'value': item
                        };
                    });
                }
            }

            return menuItems;
        }

        /*
         * update datafield, display field in the property panel
         */
        function updatePropertyPanelOptions(dataset, propertiesMap, scope) {
            var variableKeys = [];

            scope.widgetProps.datafield.options = [];
            scope.widgetProps.displayfield.options = [];
            scope.$root.$emit("set-markup-attr", scope.widgetid, {'datafield': '', 'displayfield': ''});

            if (WM.isString(dataset)) {
                return;
            }

            /* on binding of data*/
            if (WM.isArray(dataset)) {
                dataset = dataset[0] || dataset;
                variableKeys = WidgetUtilService.extractDataSetFields(dataset, propertiesMap) || [];
            }

            /*removing null values from the variableKeys*/
            WM.forEach(variableKeys, function (variableKey, index) {
                if (dataset[variableKey] === null || WM.isObject(dataset[variableKey])) {
                    variableKeys.splice(index, 1);
                }
            });

            /* re-initialize the property values */
            if (scope.newcolumns) {
                scope.newcolumns = false;
                scope.datafield = '';
                scope.displayfield = '';
                scope.$root.$emit("set-markup-attr", scope.widgetid, {'datafield': scope.datafield, 'displayfield': scope.displayfield});
            }

            scope.widgetProps.datafield.options = ['', ALLFIELDS].concat(variableKeys);
            scope.widgetProps.displayfield.options = [''].concat(variableKeys);
        }

        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case 'scopedataset':
            case 'dataset':
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && WM.isDefined(newVal) && newVal !== null) {
                    updatePropertyPanelOptions(newVal.data || newVal, newVal.propertiesMap, scope);
                }
                if (!scope.widgetid && newVal) {
                    scope.menuItems = getMenuItems(newVal.data || newVal, scope);
                }
                break;
            case 'dropposition':
                if (newVal === 'up') {
                    element.addClass('dropup');
                } else {
                    element.removeClass('dropup');
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {
                'scopedataset': '=?',
                'onSelect': '&'
            },
            'template': function (tElement, tAttrs) {

                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element($templateCache.get('template/widget/form/menu.html'));
                if (tAttrs.type && tAttrs.type === 'anchor') {
                    template = WM.element($templateCache.get('template/widget/form/anchormenu.html'));
                }
                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onSelect')) {
                        template.find('.dropdown-menu > li').attr('data-ng-click', 'onSelect({$event: $event, $scope: this, $item: item.value || item.label })');
                    }
                }

                return template[0].outerHTML;
            },
            'replace': true,
            'transclude': true,
            'compile': function (tElement) {
                return {
                    'pre': function (scope, element, attrs) {
                        //@Deprecated iconname; use iconclass instead
                        if (!attrs.iconclass && attrs.iconname) {
                            WM.element(tElement.context).attr('iconclass', 'glyphicon glyphicon-' + attrs.iconname);
                            attrs.iconclass = 'glyphicon glyphicon-' + attrs.iconname;
                        }
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (!scope.widgetid && attrs.hasOwnProperty('scopedataset')) {
                            $timeout(function () {
                                scope.$watch('scopedataset', function (newVal) {
                                    onPropertyChange('scopedataset', newVal);
                                });
                            }, 0, true);
                        }
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmMenu
 * @restrict E
 *
 * @description
 * The `wmMenu` directive defines a menu widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the menu widget.
 * @param {string=} caption
 *                  Content of the message. <br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the menu.
 * @param {string=} height
 *                  Height of the menu.
 * @param {object=} value
 *                  Set this property to a variable to populate the list of values to display.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the chart widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} iconclass
 *                  CSS class of the icon.
 * @param {string=} on-select
 *                  Callback function for `select` event
 *
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *              <wm-menu scopedataset="nodes"></wm-menu>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *          $scope.nodes = [
 *              {
 *                  "label": "item1",
 *                  "icon": "glyphicon glyphicon-euro"
 *              }, {
 *                  "label": "item2",
 *                  "icon": "glyphicon glyphicon-euro"
 *              }, {
 *                  "label": "item3",
 *                  "icon": "glyphicon glyphicon-euro"
 *              }, {
 *                  "label": "item4",
 *                  "icon": "glyphicon glyphicon-euro"
 *              }
 *          ];
 *          }
 *       </file>
 *   </example>
 */