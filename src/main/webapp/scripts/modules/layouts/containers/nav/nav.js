/*global WM, _*/
/*Directive for Nav and NavItem*/

/*Directive for Nav*/

WM.module('wm.layouts.containers')
    .directive('wmNav', [
        'Utils',
        'PropertiesFactory',
        'WidgetUtilService',
        '$rootScope',
        '$compile',
        '$timeout',
        '$routeParams',
        'CONSTANTS',

        function (Utils, PropertiesFactory, WidgetUtilService, $rs, $compile, $timeout, $routeParams, CONSTANTS) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.nav', ['wm.layouts']),
                notifyFor = {
                    'dataset': true,
                    'scopedataset': true,
                    'itemicon': true,
                    'itemlabel': true,
                    'itemlink': true,
                    'itemchildren': true
                };

            function getNodes($is, nv) {
                var nodes = [];
                if (WM.isString(nv)) {
                    nv = _.trim(nv);
                    if (nv) {
                        nodes = nv.split(',').map(function (item) {
                            return {
                                'label': _.trim(item)
                            };
                        });
                    }
                } else if (WM.isArray(nv)) {
                    nodes = nv;
                } else if (WM.isObject(nv)) {
                    nodes = [nv];
                }
                /* re-initialize the property values */
                if ($is.newcolumns) {
                    $is.newcolumns   = false;
                    $is.itemlabel    = '';
                    $is.itemchildren = '';
                    $is.itemicon     = '';
                    $is.itemlink     = '';

                    $rs.$emit('set-markup-attr', $is.widgetid, {
                        'itemlabel'   : $is.itemlabel,
                        'itemchildren': $is.itemchildren,
                        'itemicon'    : $is.itemicon,
                        'itemlink'    : $is.itemlink
                    });
                }
                if ($is.widgetid) { // when the widget is inside canvas
                    $is.keys = _.keys(nodes[0]);
                    /*Changing the properties like labels,children and icons*/
                    $is.widgetProps.itemlabel.options = $is.widgetProps.itemchildren.options = $is.widgetProps.itemicon.options = $is.widgetProps.itemlink.options = $is.keys;
                }
                return nodes;
            }
            function constructNav($el, $is) {
                $el.empty();

                $el.off('.on-select');

                if ($is.nodes && $is.nodes.length) {
                    var iconField     = $is.itemicon     || 'icon',
                        labelField    = $is.itemlabel    || 'label',
                        itemField     = $is.itemlink     || 'link',
                        childrenField = $is.itemchildren || 'children';

                    $is.nodes.forEach(function (node) {
                        var $a           = WM.element('<a class="app-anchor"></a>'),
                            $li          = WM.element('<li class="app-nav-item"></li>').data('node-data', node),
                            $i           = WM.element('<i class="app-nav-icon"></i>'),
                            $caret       = WM.element('<span class="caret"></span>'),
                            itemLabel    = node[labelField],
                            itemClass    = node[iconField],
                            itemLink     = node[itemField],
                            itemChildren = node[childrenField],
                            $ul;

                        if ($routeParams.name === (itemLink && itemLink.substring(1))) {
                            $a.addClass('active');
                        }

                        if (itemChildren && WM.isArray(itemChildren)) {
                            $i.addClass(itemClass);
                            $a.html(itemLabel).attr('uib-dropdown-toggle', '').addClass('app-anchor dropdown-toggle').prepend($i).append($caret);
                            $li.append($a).attr('uib-dropdown', '').addClass('dropdown');
                            $ul = WM.element('<ul uib-dropdown-menu></ul>');
                            itemChildren.forEach(function (child) {
                                var $a_inner  = WM.element('<a class="app-anchor"></a>'),
                                    $li_inner = WM.element('<li class="app-nav-item"></li>').data('node-data', child),
                                    $i_inner  = WM.element('<i class="app-nav-icon"></i>');

                                itemLabel = child[labelField];
                                itemClass = child[iconField];
                                itemLink  = child[itemField];

                                $i_inner.addClass(itemClass);
                                $a_inner.html(itemLabel).attr('href', itemLink).prepend($i_inner);
                                $li_inner.append($a_inner);
                                $ul.append($li_inner);
                            });
                            $li.append($ul);
                            $el.append($li);
                        } else {
                            $i.addClass(itemClass);
                            $a.html(itemLabel).attr('href', itemLink).prepend($i);
                            $li.append($a);
                            $el.append($li);
                        }
                        $compile($li)($is);
                    });

                    $el.on('click.on-select', '.app-anchor', function (e) {
                        var $target = WM.element(this),
                            $li     = $target.closest('.app-nav-item');

                        $rs.$safeApply($is, function () {
                            $is.selecteditem = $li.data('node-data');
                            Utils.triggerFn($is.onSelect, {'$event': e, $scope: $is, '$item': $is.selecteditem});
                        });
                    });
                }
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($s, $is, $el, key, nv) {
                var variable;

                switch (key) {
                case 'dataset':
                    variable = $s.Variables[Utils.getVariableName($is, $s)];
                    if (variable && variable.category === 'wm.LiveVariable') {
                        nv = nv.data;
                    }

                    if (CONSTANTS.isStudioMode) {
                        if (variable && variable.type) {
                            $is.widgetProps.selecteditem.type = 'object, ' + variable.type;
                        } else {
                            $is.widgetProps.selecteditem.type = 'object';
                        }
                    }
                    // do not break here. continue with the next steps.
                case 'scopedataset':
                    $is.nodes = getNodes($is, nv);
                    constructNav($el, $is);
                    if ($is.widgetid) {
                        $rs.$emit('nav-dataset-modified', {'widgetName': $is.name});
                    }
                    break;
                case 'itemicon':
                case 'itemlabel':
                case 'itemlink':
                case 'itemchildren':
                    constructNav($el, $is);
                    break;
                }
            }

            return {
                'restrict'  : 'E',
                'replace'   : true,
                'scope'     : {'scopedataset': '=?'},
                'transclude': true,
                'template'  : '<ul class="nav app-nav" data-ng-show="show" apply-styles="container" data-element-type="wmNav" wmtransclude init-widget ' +
                                'data-ng-class="{\'nav-pills\': type == \'pills\',' +
                                             '\'nav-tabs\': type == \'tabs\',' +
                                             '\'navbar-nav\': type == \'navbar\',' +
                                             '\'nav-stacked\': layout == \'stacked\',' +
                                             '\'nav-justified\': layout == \'justified\'' +
                                '}"></ul>',
                'link'      : {
                    'pre': function ($is) {
                        if (CONSTANTS.isStudioMode) {
                            $is.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            $is.widgetProps = widgetProps;
                        }
                    },

                    'post': function ($is, $el, attrs) {
                        var onPropertyChange = propertyChangeHandler.bind(undefined, $el.scope(), $is, $el);

                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, $is, notifyFor);
                        if (!$is.widgetid && attrs.scopedataset) {
                            $timeout(function () {
                                $is.$watch('scopedataset', function (nv) {
                                    onPropertyChange('scopedataset', nv);
                                });
                            }, 0, true);
                        }
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmNavItem', [
        'PropertiesFactory',
        'WidgetUtilService',

        function (PropertiesFactory, WidgetUtilService) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.navitem', ['wm.layouts']);

            return {
                'restrict'  : 'E',
                'replace'   : true,
                'scope'     : {},
                'transclude': true,
                'template'  : '<li init-widget class="app-nav-item" apply-styles="container" wmtransclude></li>',
                'link'      : {
                    'pre': function ($is) {
                        $is.widgetProps = widgetProps;
                    },
                    'post': function ($is, $el, attrs) {
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmNav
 * @restrict E
 * @element ANY
 * @description
 * The 'wmNav' directive defines a dynamic navigation in the layout.
 * The 'wmNav' directive defines a nav in the layout to contain nav items.
 *
 * * *
 * @param {string=} name
 *                  Name of the nav widget.
 * @param {string=} type
 *                  Type of the nav widget. [Options: navbar, pills, tabs]
 * @param {string=} height
 *                  Height of the nav widget.
 * @param {string=} layout
 *                  This property controls how contained widgets are displayed within this widget container. [Options: Stacked, Justified]
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the nav widget from a variable defined in the controller page. <br>
 * @param {string=} selecteditem
 *                  Gives the selected item of the nav, when the nav widget is bound to a datasource. <br>
 *                  Will be undefined when nav contains wm-nav-items.
 * @param {string=} value
 *                  This property sets a variable to populate the list of values to display. This property is a bindable property.
 * @param {string=} itemicon
 *                  This property defines the value to be used as key for the icon from the list of values bound to the nav widget as an array of objects of different values.
 * @param {string=} itemlabel
 *                  This property defines the value to be used as key for the label from the list of values bound to the nav widget as an array of objects of different values.
 * @param {string=} itemlink
 *                  This property defines the value to be used as key for the link from the list of values bound to the nav widget as an array of objects of different values.
 * @param {string=} itemchildren
 *                  This property specifies the sub-menu items
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the nav widget on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  This property aligns the content of the nav to left/right/center.
 *                  Default value: `left`.
 * @param {string=} onSelect
 *                  Callback function which will be triggered when nav item is selected. <br>
 *                  Works only when the nav widget is bound to a datasource.

 * @example
    <example module="wmCore">
        <file name="index.html">
            <div class="wm-app" data-ng-controller="Ctrl">
                <wm-nav scopedataset="items"></wm-nav>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.items = [
                        {
                            "label": "Home",
                            "icon": "glyphicon glyphicon-home",
                            "link": "#/home"
                        },
                        {
                            "label": "Dropdown",
                            "children": [
                                {
                                    "label": "Action",
                                    "icon": "glyphicon glyphicon-book"
                                },
                                {
                                    "label": "Help",
                                    "icon": "glyphicon glyphicon-question-sign"
                                }
                            ]
                        },
                        {
                            "label": "Others",
                            "icon": "glyphicon glyphicon-shopping-cart",
                            "link": "http://www.example.com"
                        },
                        {
                            "label": "Inventory",
                            "icon": "glyphicon glyphicon-tags"
                        }
                   ];
              };
        </file>
    </example>
 */
/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmNavItem
 * @restrict E
 * @element ANY
 * @description
 * The 'wmNavItem' directive defines a nav item in the layout.
 * wmNavItem is internally used by wmNav.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div class="wm-app" data-ng-controller="Ctrl">
                <wm-nav>
                    <wm-nav-item>
                        <wm-anchor caption="Dashboard" iconclass="glyphicon glyphicon-dashboard" class="active"></wm-anchor>
                    </wm-nav-item>
                </wm-nav>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
