/*global WM, _, location */
/*Directive for menu */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/menu.html',
                '<div class="dropdown app-menu" init-widget uib-dropdown is-open="isOpen" auto-close="{{autoclose}}" role="input" listen-property="dataset" tabindex="-1">' +
                    '<button title="{{hint}}" class="btn app-button dropdown-toggle {{menuclass}}" uib-dropdown-toggle apply-styles focus-target accesskey="{{::shortcutkey}}">' +
                        '<i class="app-icon {{iconclass}}"></i>' +
                        ' <span class="caption">{{caption}}</span>' +
                        '<span wmtransclude></span>' +
                        '<span class="pull-right caret fa" ng-class="menuCaret"></span>' +
                    '</button>' +
                    '<wm-menu-dropdown menulayout="menulayout" items="menuItems" linktarget="linktarget" menualign="menualign"/>' +
                '</div>'
            );
        $templateCache.put('template/widget/form/anchormenu.html',
                '<div class="dropdown app-menu" init-widget uib-dropdown is-open="isOpen" auto-close="{{autoclose}}" role="input" listen-property="dataset" tabindex="-1">' +
                    '<a title="{{hint}}" ng-href="{{hasOnSelect ? \'javascript:void(0)\' : (link || \'javascript:void(0)\')}}" class="app-anchor dropdown-toggle {{menuclass}}" uib-dropdown-toggle apply-styles accesskey="{{::shortcutkey}}"><i class="app-icon {{iconclass}}"></i>' +
                        ' <span class="caption">{{caption}}</span>' +
                        '<span wmtransclude></span>' +
                        '<span class="pull-right caret fa" ng-class="menuCaret"></span>' +
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
                '<li ng-class="[item.class, {\'disabled\': item.disabled, \'dropdown-submenu\' : item.children.length > 0}]">' +
                    '<a ng-href="{{(item.hasOnSelect || item.action) ? \'javascript:void(0)\' : (item.link || \'javascript:void(0)\')}}" title="{{item.label}}">' +
                    '<span ng-if="item.children.length" class="pull-right fa caret" ng-class="{ \'fa-caret-left\': {{menualign === \'pull-right\'}}, \'fa-caret-right\': {{menualign === \'pull-left\' || menualign === undefined}}, \'fa-caret-down\': {{menualign === \'dropinline-menu\'}} }"></span>' +
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
                iconField     = scope.itemicon     || 'icon',
                classField    = scope.itemclass    || 'class',
                labelField    = scope.itemlabel    || 'label',
                linkField     = scope.itemlink     || 'link',
                actionField   = scope.itembadge    || 'action',
                childrenField = scope.itemchildren || 'children',
                userField     = scope.userrole     || 'role',
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
                    transformFn = function (result, item) {
                        var children = (WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemchildren'}) || item[childrenField]);

                        if (Utils.validateAccessRoles(item[scope.userrole])) {
                            result.push({
                                'label'     : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlabel'})  || item[labelField],
                                'icon'      : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemicon'})   || item[iconField],
                                'class'     : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemclass'})  || item[classField],
                                'disabled'  : item.disabled,
                                'link'      : scope.binditemlink ? WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlink'}) : item[linkField],
                                'value'     : scope.datafield ? (scope.datafield === 'All Fields' ? item : Utils.findValueOf(item, scope.datafield)) : item,
                                'children'  : (WM.isArray(children) ? children : []).reduce(transformFn, []),
                                'action'    : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemaction'}) || item[actionField],
                                'role'      : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'userrole'})   || item[userField],
                                'hasOnSelect' : scope.hasOnSelect
                            });
                        }

                        return result;
                    };
                    menuItems = newVal.reduce(transformFn, []);
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
                    scope.menuCaret = "fa-caret-down";
                    break;
                case POSITION.DOWN_LEFT:
                    element.removeClass('dropup');
                    scope.menualign = 'pull-right';
                    scope.menuCaret = "fa-caret-down";
                    break;
                case POSITION.UP_LEFT:
                    element.addClass('dropup');
                    scope.menualign = 'pull-right';
                    scope.menuCaret = "fa-caret-up";
                    break;
                case POSITION.UP_RIGHT:
                    element.addClass('dropup');
                    scope.menualign = 'pull-left';
                    scope.menuCaret = "fa-caret-up";
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
                        iScope.menuCaret = "fa-caret-down";
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
                        iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);

                        /**Set hasOnSelect, when there is
                         * 1. OnSelect event on the nav widget (when menu widget is present in the nav)
                         * 2. OnSelect event on the menu widget**/
                        scope.hasOnSelect = attrs.hasonselect ? Utils.getBooleanValue(attrs.hasonselect) : Utils.getBooleanValue(!!attrs.onSelect);

                        if (scope.type === 'anchor' && scope.$element) {
                            //Disable right click on the element when link is empty
                            Utils.disableRightClick(scope.$element.find('a'), scope.hasOnSelect, scope.action, scope.link);
                        }
                        /*Called from form reset when users  clicks on form reset*/
                        scope.reset = function () {
                            //TODO implement custom reset logic here
                        };
                        if(CONSTANTS.isRunMode) {
                            element.on('keydown', function (evt) {
                                var KEY_MOVEMENTS = Utils.getClonedObject(CONSTANTS.KEYBOARD_MOVEMENTS);
                                if (scope.menuposition === CONSTANTS.MENU_POSITION.UP_RIGHT) {
                                    KEY_MOVEMENTS.MOVE_UP = 'DOWN-ARROW';
                                    KEY_MOVEMENTS.MOVE_DOWN = 'UP-ARROW';
                                } else if (scope.menuposition === CONSTANTS.MENU_POSITION.UP_LEFT) {
                                    KEY_MOVEMENTS.MOVE_UP = 'DOWN-ARROW';
                                    KEY_MOVEMENTS.MOVE_DOWN = 'UP-ARROW';
                                    KEY_MOVEMENTS.MOVE_LEFT = 'RIGHT-ARROW';
                                    KEY_MOVEMENTS.MOVE_RIGHT = 'LEFT-ARROW';
                                } else if (scope.menuposition === CONSTANTS.MENU_POSITION.DOWN_LEFT) {
                                    KEY_MOVEMENTS.MOVE_LEFT = 'RIGHT-ARROW';
                                    KEY_MOVEMENTS.MOVE_RIGHT = 'LEFT-ARROW';
                                }
                                if (Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_DOWN || Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_RIGHT) {
                                    scope.isOpen = true;
                                    /*$timeout is used so that by then isOpen has the updated value.*/
                                    $timeout(function() {
                                        //Todo on open of dropdown first element should be focused
                                        element.children().find('li a:first').focus();
                                    });
                                    //preventing from page scroll when up/down arrow is pressed, in case of menu is opened.
                                    evt.preventDefault();
                                } else if (Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_UP || Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_LEFT) {
                                    scope.isOpen = false;
                                    element.find('li').removeClass('open');
                                    /*$timeout is used so that by then isOpen has the updated value. focus is setting back to the dropdown*/
                                    $timeout(function() {
                                        element.closest('.app-menu').find('[uib-dropdown-toggle]').focus();
                                    });
                                    //preventing from page scroll when up/down arrow is pressed, in case of menu is opened.
                                    evt.preventDefault();
                                }
                            });
                        }

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
                    scope.$parent.onSelect(args);
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
    .directive('wmMenuDropdownItem', ['$templateCache', '$compile', 'CONSTANTS', 'Utils', '$window', '$routeParams', "WidgetUtilService", "$timeout", function ($templateCache, $compile, CONSTANTS, Utils, $window, $routeParams, WidgetUtilService, $timeout) {
        'use strict';
        function openLink(link, target) {
            if (CONSTANTS.hasCordova && _.startsWith(link, '#')) {
                location.hash = link;
            } else {
                $window.open(link, target);
            }
        }
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
                var menuScope = element.closest('.dropdown').isolateScope(),
                    menuLink;

                if (scope.item.children && scope.item.children.length > 0) {
                    element.append('<wm-menu-dropdown items="item.children"  linktarget="linktarget" menualign="menualign"/>');
                    element.off('click');
                    $compile(element.contents())(scope);
                }

                if (menuScope && WM.isObject(scope.item)) {
                    menuLink = scope.item[menuScope.itemLink || 'link'];
                }

                //Disable right click on the element when menuLink is empty
                Utils.disableRightClick(element.find('a'), scope.item.hasOnSelect, scope.item.action, menuLink);

                //If nav item is menu then set it links active if route param is same as link
                if (element.closest('.app-nav-item').length && menuLink) {
                    //menuLink can be #/routeName or #routeName
                    if (WidgetUtilService.isActiveNavItem(menuLink, $routeParams.name)) {
                        menuScope.isOpen = true;
                        $timeout(function() {
                            element.addClass('active');
                            var $a = $("<a href='#'>link</a>");
                            WM.element('body').prepend($a);
                            $a.focus().remove();
                        });
                    }
                }

                scope.onSelect = function (args) {
                    var itemAction = args.$item[menuScope.itemaction || 'action'],
                        linkTarget = menuScope.linktarget || '_self';

                    //If link starts with # and not with #/ replace with #/
                    if (menuLink && _.startsWith(menuLink, '#') && !_.startsWith(menuLink, '#/')) {
                        menuLink = _.replace(menuLink, '#', '#/');
                    }

                    scope.$parent.onSelect(args);
                    if (itemAction) {
                        Utils.evalExp(element.closest('.dropdown').scope(), itemAction).then(function () {
                            if (menuLink) {
                                openLink(menuLink, linkTarget);
                            }
                        });
                    } else if (menuLink) {
                        //If action is not present and link is there
                        openLink(menuLink, linkTarget);
                    }
                };
                if (CONSTANTS.isRunMode) {
                    element.closest('.dropdown-menu > li').on("keydown", function (evt) {
                        var $rootel =  element.closest('.app-menu'),
                            $parent = element.closest('.app-menu > ul'),
                            $el,
                            $elescope = $rootel.isolateScope(),
                            KEY_MOVEMENTS = Utils.getClonedObject(CONSTANTS.KEYBOARD_MOVEMENTS),
                            ARROW_KEYS = ['LEFT-ARROW', 'RIGHT-ARROW', 'UP-ARROW', 'DOWN-ARROW'];
                        if ($elescope.menulayout === CONSTANTS.MENU_LAYOUT_TYPE.HORIZONTAL) {
                            KEY_MOVEMENTS.MOVE_UP = 'LEFT-ARROW';
                            KEY_MOVEMENTS.MOVE_LEFT = 'UP-ARROW';
                            KEY_MOVEMENTS.MOVE_RIGHT = 'DOWN-ARROW';
                            KEY_MOVEMENTS.MOVE_DOWN = 'RIGHT-ARROW';
                        } else {
                            if ($elescope.menuposition === CONSTANTS.MENU_POSITION.DOWN_LEFT || $elescope.menuposition === CONSTANTS.MENU_POSITION.UP_LEFT) {
                                KEY_MOVEMENTS.MOVE_LEFT = 'RIGHT-ARROW';
                                KEY_MOVEMENTS.MOVE_RIGHT = 'LEFT-ARROW';
                            } else if ($elescope.menuposition === 'inline') {
                                KEY_MOVEMENTS.MOVE_UP = 'LEFT-ARROW';
                                KEY_MOVEMENTS.MOVE_LEFT = 'UP-ARROW';
                                KEY_MOVEMENTS.MOVE_RIGHT = 'DOWN-ARROW';
                                KEY_MOVEMENTS.MOVE_DOWN = 'RIGHT-ARROW';
                            }
                        }
                        if (_.includes(ARROW_KEYS, Utils.getActionFromKey(evt))) {
                            //preventing from page scroll when up/down arrow is pressed, in case of menu is opened.
                            evt.preventDefault();
                        }
                        if ((Utils.getActionFromKey(evt) === KEY_MOVEMENTS.ON_ENTER && !(element.isolateScope() && element.isolateScope().item.link)) || Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_RIGHT) {
                            //when there is no link for the menu, on enter open the inner child elements and focus the first element
                            evt.stopPropagation();
                            if (element.children().length > 1) {
                                element.toggleClass('open');
                                element.children().find('li:first').find('a:first').focus();
                            } else {
                                element.find('a:first').focus();
                            }
                        } else if (Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_LEFT) {
                            if ($parent.children().first()[0] !== element[0]) {
                                $el = element.closest('ul').parent();
                                $el.find('li').removeClass('open');
                                $el.toggleClass('open');
                                $el.find('a:first').focus();
                                evt.stopPropagation();
                            }
                        } else if (Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_UP) {
                            if ($parent.children().first()[0] !== element[0]) {
                                evt.stopPropagation();
                                element.closest('li').prev().find('a:first').focus();
                            }
                        } else if (Utils.getActionFromKey(evt) === KEY_MOVEMENTS.MOVE_DOWN) {
                            evt.stopPropagation();
                            if ($parent.children().last()[0] === element[0] && ($elescope.menulayout !== CONSTANTS.MENU_LAYOUT_TYPE.HORIZONTAL && $elescope.menuposition === CONSTANTS.MENU_POSITION.UP_RIGHT || $elescope.menuposition === CONSTANTS.MENU_POSITION.UP_LEFT)) {
                                $rootel.isolateScope().isOpen = false;
                                $rootel.isolateScope().$apply();
                                $rootel.find('[uib-dropdown-toggle]').focus();
                                $rootel.find('li').removeClass('open');
                            } else {
                                element.closest('li').next().find('a').focus();
                            }
                        } else if ((Utils.getActionFromKey(evt) === KEY_MOVEMENTS.ON_TAB && $parent.children().last()[0] === element[0]) || Utils.getActionFromKey(evt) === KEY_MOVEMENTS.ON_ESCAPE) {
                            /*closing all the children elements when
                            * 1. Tab is clicked on the last element
                            * 2. When Escape key is clicked*/
                            evt.preventDefault();
                            $rootel.isolateScope().isOpen = false;
                            $rootel.isolateScope().$apply();
                            $rootel.find('[uib-dropdown-toggle]').focus();
                            $rootel.find('li').removeClass('open');
                        }
                    });
                }
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
 * @param {string=} itemicon
 *                  This property defines the value to be used as key for the icon from the list of values bound to the menu widget as an array of objects of different values.
 * @param {string=} itemlabel
 *                  This property defines the value to be used as key for the label from the list of values bound to the menu widget as an array of objects of different values.
 * @param {string=} itemaction
 *                  This property defines the value to be used as key for the action from the list of values bound to the menu widget as an array of objects of different values.
 * @param {string=} itemlink
 *                  This property defines the value to be used as key for the link from the list of values bound to the menu widget as an array of objects of different values.
 * @param {string=} itemchildren
 *                  This property specifies the sub-menu items
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
               <wm-menu autoclose="outsideClick" scopedataset="nodes" menuposition="down,right" caption="Menu" iconclass="wi wi-align-justify"></wm-menu>
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
                       "icon": "wi wi-euro-symbol",
                       "action": "Widgets.empForm.save()"
                   },
                   {
                       "label": "item3",
                       "icon": "wi wi-euro-symbol",
                       "action": "Widgets.empForm.new()"
                   },
                   {
                       "label": "item4",
                       "icon": "wi wi-euro-symbol",
                       "action": "Widgets.empForm.reset()"
                   }
               ];
            }
        </file>
    </example>
 */
