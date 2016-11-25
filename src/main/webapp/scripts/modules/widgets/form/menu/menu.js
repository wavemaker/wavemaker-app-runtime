/*global WM, _ */
/*Directive for menu */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/menu.html',
                '<div class="dropdown app-menu" init-widget uib-dropdown role="input" listen-property="dataset" tabindex="-1">' +
                    '<button title="{{hint}}" class="btn app-button dropdown-toggle {{menuclass}}" uib-dropdown-toggle apply-styles focus-target accesskey="{{::shortcutkey}}">' +
                        '<i class="app-icon {{iconclass}}"></i>' +
                        ' <span class="caption">{{caption}}</span>' +
                        '<span wmtransclude></span>' +
                        '<span class="pull-right caret fa fa-caret-down"></span>' +
                    '</button>' +
                    '<wm-menu-dropdown menulayout="menulayout" items="menuItems" linktarget="linktarget" menualign="menualign"/>' +
                '</div>'
            );
        $templateCache.put('template/widget/form/anchormenu.html',
                '<div class="dropdown app-menu" init-widget uib-dropdown role="input" listen-property="dataset" tabindex="-1">' +
                    '<a title="{{hint}}" href="javascript:void(0);" class="app-anchor dropdown-toggle {{menuclass}}" uib-dropdown-toggle apply-styles accesskey="{{::shortcutkey}}"><i class="app-icon {{iconclass}}"></i>' +
                        ' <span class="caption">{{caption}}</span>' +
                        '<span wmtransclude></span>' +
                        '<span class="pull-right caret fa fa-caret-down"></span>' +
                    '</a>' +
                    '<wm-menu-dropdown menulayout="menulayout" items="menuItems" linktarget="linktarget" menualign="menualign"/>' +
                '</div>'
            );
        $templateCache.put('template/widget/form/menu/dropdown.html',
                '<ul class="dropdown-menu {{menulayout}} {{menualign}} {{animateClass}}" uib-dropdown-menu>' +
                    '<wm-menu-dropdown-item ng-repeat="item in items" linktarget="linktarget" item="item" menualign="menualign"/>' +
                '</ul>'
            );
        $templateCache.put('template/widget/form/menu/dropdownItem.html',
                '<li ng-class="{\'disabled\': item.disabled, \'dropdown-submenu\' : item.children.length > 0}">' +
                    '<a tabindex="0" href="javascript:void(0);" title="{{item.label}}" ng-href="{{item.link}}" target="{{linktarget}}">' +
                    '<span ng-if="item.children.length" class="pull-right fa" ng-class="{ \'fa-caret-left\': {{menualign === \'pull-right\'}}, \'fa-caret-right\': {{menualign === \'pull-left\' || menualign === undefined}}, \'fa-caret-down\': {{menualign === \'dropinline-menu\'}} }"></span>' +
                        '<i class="app-icon {{item.icon}}"></i>' +
                        '{{item.label}}' +
                    '</a>' +
                '</li>'
            );
    }])
    .directive('wmMenu', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', '$timeout', 'Utils', 'CONSTANTS', 'FormWidgetUtils', function ($templateCache, PropertiesFactory, WidgetUtilService, $timeout, Utils, CONSTANTS, FormWidgetUtils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.menu', ['wm.base','wm.base.advancedformwidgets', 'wm.menu.dataProps']),
            notifyFor = {
                'iconname'      : true,
                'scopedataset'  : true,
                'dataset'       : true,
                'menuposition'  : true,
                'menualign'     : true,
                'linktarget'    : true
            },
            POSITION = {
                DOWN_RIGHT  : 'down,right',
                DOWN_LEFT   : 'down,left',
                UP_RIGHT    : 'up,right',
                UP_LEFT     : 'up,left',
                INLINE      : 'inline'
            };

        function getMenuItems(newVal, scope) {
            var menuItems = [],
                transformFn;
            if (WM.isString(newVal)) {
                menuItems = newVal.split(',').map(function (item) {
                    var _val = item && item.trim();
                    return {
                        'label': _val,
                        'value': _val
                    };
                });
            } else if (WM.isArray(newVal)) {
                newVal = FormWidgetUtils.getOrderedDataSet(newVal, scope.orderby);
                if (WM.isObject(newVal[0])) {
                    transformFn = function (item) {
                        var children = (WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemchildren'}) || item.children);
                        return {
                            'label'     : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlabel'}) || item.label,
                            'icon'      : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemicon'}) || item.icon,
                            'disabled'  : item.disabled,
                            'link'      : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlink'}) || item.link,
                            'value'     : scope.datafield ? (scope.datafield === 'All Fields' ? item : Utils.findValueOf(item, scope.datafield)) : item,
                            'children'  : (WM.isArray(children) ? children : []).map(transformFn)
                        };
                    };
                    menuItems = newVal.map(transformFn);
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

        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case 'scopedataset':
            case 'dataset':
                scope.itemlabel = scope.itemlabel || scope.displayfield;
                if (CONSTANTS.isRunMode && newVal) {
                    scope.menuItems = getMenuItems(newVal.data || newVal, scope);
                }
                break;
            case 'linktarget':
                scope.linktarget = newVal;
                break;
            case 'menuposition':
                switch (newVal) {
                case POSITION.DOWN_RIGHT:
                    element.removeClass('dropup');
                    scope.menualign = 'pull-left';
                    break;
                case POSITION.DOWN_LEFT:
                    element.removeClass('dropup');
                    scope.menualign = 'pull-right';
                    break;
                case POSITION.UP_LEFT:
                    element.addClass('dropup');
                    scope.menualign = 'pull-right';
                    break;
                case POSITION.UP_RIGHT:
                    element.addClass('dropup');
                    scope.menualign = 'pull-left';
                    break;
                case POSITION.INLINE:
                    scope.menualign = 'dropinline-menu';
                    break;
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
                var template = '';
                if (tAttrs.type && tAttrs.type === 'anchor') {
                    template = WM.element($templateCache.get('template/widget/form/anchormenu.html'));
                } else {
                    template = WM.element($templateCache.get('template/widget/form/menu.html'));
                }
                return template[0].outerHTML;
            },
            'replace': true,
            'transclude': true,
            'compile': function (tElement) {
                return {
                    'pre': function (iScope, element, attrs) {
                        //@Deprecated iconname; use iconclass instead
                        if (!attrs.iconclass && attrs.iconname) {
                            WM.element(tElement.context).attr('iconclass', 'wi wi-' + attrs.iconname);
                            attrs.iconclass = 'wi wi-' + attrs.iconname;
                        }
                        /* support for dropposition */
                        if (attrs.dropposition === 'up') {
                            if (attrs.menuposition === POSITION.DOWN_RIGHT) {
                                attrs.menuposition = POSITION.UP_RIGHT;
                            } else if (attrs.menuposition === POSITION.DOWN_LEFT) {
                                attrs.menuposition = POSITION.UP_LEFT;
                            }
                        } else if (attrs.dropposition === 'down') {
                            if (attrs.menuposition === POSITION.UP_RIGHT) {
                                attrs.menuposition = POSITION.DOWN_RIGHT;
                            } else if (attrs.menuposition === POSITION.UP_LEFT) {
                                attrs.menuposition = POSITION.DOWN_LEFT;
                            }
                        }
                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            iScope.widgetProps = widgetProps;
                        }
                    },
                    'post': function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);

                        /*Called from form reset when users clicks on form reset*/
                        scope.reset = function () {
                            //TODO implement custom reset logic here
                        };

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        if (!scope.widgetid && attrs.scopedataset) {
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
    }])
    .directive('wmMenuDropdown', ['$templateCache', 'CONSTANTS', function ($templateCache, CONSTANTS) {
        'use strict';
        var animated         = 'animated ',
            animationClasses = {
                'scale' : {
                    'name'      : 'wmScaleInLeft',
                    'down,right': 'wmScaleInLeft',
                    'down,left' : 'wmScaleInRight',
                    'up,right'  : 'wmScaleInTopLeft',
                    'up,left'   : 'wmScaleInTopRight'
                },
                'fade' : {
                    'name'      : 'fadeIn',
                    'down,right': 'fadeIn',
                    'down,left' : 'fadeIn',
                    'up,right'  : 'fadeIn',
                    'up,left'   : 'fadeIn'
                },
                'slide': {
                    'name'      : 'wmSlideInDown',
                    'down,right': 'wmSlideInDown',
                    'down,left' : 'wmSlideInDown',
                    'up,right'  : 'wmSlideInUp',
                    'up,left'   : 'wmSlideInUp'
                }
            },
            animation,
            menuPosition;
        return {
            'restrict': "E",
            'replace': true,
            'scope': {
                'items': '=',
                'menualign': '=',
                'menulayout': '=',
                'linktarget': '='
            },
            'template': $templateCache.get('template/widget/form/menu/dropdown.html'),
            'link': function (scope, element) {
                scope.onSelect = function (args) {
                    if (!args.$scope.item.link) {
                        scope.$parent.onSelect(args);
                    }
                };
                if (CONSTANTS.isRunMode) {
                    animation    = element.parent().isolateScope().animateitems;
                    menuPosition = scope.$parent.menuposition;
                    if (animation) { //If animation is set then add animation class based on menu position, if not set it to default
                        scope.animateClass = animated + (animationClasses[animation][menuPosition] || animationClasses[animation].name);
                    } else if (scope.items && element.parent().scope().animateClass) {
                        //Set same animation to sub menu items of that of the parent.
                        scope.animateClass = element.parent().scope().animateClass;
                    }
                }
            }
        };
    }])
    .directive('wmMenuDropdownItem', ['$templateCache', '$compile', 'CONSTANTS',  function ($templateCache, $compile, CONSTANTS) {
        'use strict';
        return {
            'restrict': "E",
            'replace': true,
            'scope': {
                'item': '=',
                'menualign': '=',
                'linktarget': '='
            },
            'template': function () {
                var template = WM.element($templateCache.get('template/widget/form/menu/dropdownItem.html'));
                if (!CONSTANTS.isStudioMode) {
                    template.attr('ng-click', 'onSelect({$event: $event, $scope: this, $item: item.value || item.label })');
                }
                return template[0].outerHTML;
            },
            'link': function (scope, element) {
                if (scope.item.children && scope.item.children.length > 0) {
                    element.append('<wm-menu-dropdown items="item.children"  linktarget="linktarget" menualign="menualign"/>');
                    element.off('click');
                    $compile(element.contents())(scope);
                }
                scope.onSelect = function (args) {
                    if (!args.$scope.item.link) {
                        scope.$parent.onSelect(args);
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
 * @param {string=} caption
 *                  Content / Label of the Menu widget. <br>
 *                  This property is bindable.
 * @param {string=} name
 *                  Name of the menu widget.
 * @param {string=} position
 *                  This property defined the Position of the Menu dropdown - up/down <br>
 *                  Possible values are ["up" ,"down"] <br>
 *                  Default value : "down"
 * @param {string=} width
 *                  Width of the menu.
 * @param {string=} height
 *                  Height of the menu.
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the Menu widget from a variable defined in the script workspace. <br>
 * @param {string=} dataset
 *                  This property accepts the options to create the Menu widget from a wavemaker studio variable (live or static) which can hold object, array or string data.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by a menu widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the menu widget when the list is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the Menu widget. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the chart widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} iconclass
 *                  CSS class of the icon.
 * @param {string=} on-select
 *                  Callback function which is executed when a Menu value is selected.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
               <wm-menu scopedataset="nodes" menuposition="down,right" caption="Menu" iconclass="wi wi-align-justify"></wm-menu>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
               $scope.nodes = [
                   {
                       "label": "item1",
                       "icon": "wi wi-euro-symbol",
                       "children" : [
                           {
                               "label": "sub-menu-item1",
                               "icon": "wi wi-euro-symbol"
                           },
                           {
                               "label": "sub-menu-item2",
                               "icon": "wi wi-euro-symbol",
                                "children" : [
                                    {
                                       "label": "sub-menu-child-item1",
                                       "icon": "wi wi-euro-symbol"
                                   },
                                   {
                                       "label": "sub-menu-child-item2",
                                       "icon": "wi wi-euro-symbol"
                                  }
                             ]
                           }
                       ]
                   },
                   {
                       "label": "item2",
                       "icon": "wi wi-euro-symbol"
                   },
                   {
                       "label": "item3",
                       "icon": "wi wi-euro-symbol"
                   },
                   {
                       "label": "item4",
                       "icon": "wi wi-euro-symbol"
                   }
               ];
            }
        </file>
    </example>
 */