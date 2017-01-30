/*global WM, _, document*/
/*Directive for Tree */

WM.module('wm.widgets.basic')
    .directive('wmTree', [
        'PropertiesFactory',
        '$rootScope',
        'WidgetUtilService',
        'Utils',
        'CONSTANTS',
        'FormWidgetUtils',

        function (PropertiesFactory, $rs, WidgetUtilService, Utils, CONSTANTS, FormWidgetUtils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.tree', ['wm.base', 'wm.containers','wm.containers.borderstyle']),
                notifyFor = {
                    'scopedataset' : true,
                    'dataset'      : true,
                    'treeicons'    : true,
                    'nodelabel'    : true,
                    'nodeicon'     : true,
                    'nodechildren' : true,
                    'orderby'      : true
                },
                defaultTreeIconClass = 'plus-minus',
                ICON_CLASSES = {
                    'folder': {
                        'expanded' : 'wi-folder-open',
                        'collapsed': 'wi-folder-close'
                    },
                    'circle-plus-minus': {
                        'expanded' : 'wi-remove-circle-outline',
                        'collapsed': 'wi-add-circle-outline'
                    },
                    'chevron': {
                        'expanded' : 'wi-keyboard-arrow-down',
                        'collapsed': 'wi-keyboard-arrow-right'
                    },
                    'menu': {
                        'expanded' : 'wi-arrow-down',
                        'collapsed': 'wi-arrow-right'
                    },
                    'triangle': {
                        'expanded' : 'wi-arrow-drop-down-circle',
                        'collapsed': 'wi-play-circle-filled'
                    },
                    'expand-collapse': {
                        'expanded' : 'wi-expand-less',
                        'collapsed': 'wi-expand-more'
                    },
                    'plus-minus': {
                        'expanded' : 'wi-minus',
                        'collapsed': 'wi-plus'
                    }
                };

            function constructNodes($is, nodes, parent, levels, deep, _evalDataValue) {

                var $ul           = WM.element('<ul></ul>'),
                    _iconClses    = ICON_CLASSES[$is.treeicons || defaultTreeIconClass],
                    _expr         = CONSTANTS.isRunMode ? $is.datavalue : undefined,
                    _iconCls,
                    _cls;

                _cls     = levels > 0 ? ' expanded ' : ' collapsed ';
                _iconCls = _cls + (levels > 0 ? _iconClses.expanded : _iconClses.collapsed);

                deep = deep || 0;

                parent.append($ul);
                nodes.forEach(function (node, idx) {
                    var $li             = WM.element('<li></li>'),
                        $iconNode       = WM.element('<i></i>'),
                        nodeLabel       = WidgetUtilService.getEvaluatedData($is, node, {expressionName: 'nodelabel'}) || node.label,
                        nodeIcon        = WidgetUtilService.getEvaluatedData($is, node, {expressionName: 'nodeicon'}) || node.icon,
                        nodeChildren    = WidgetUtilService.getEvaluatedData($is, node, {expressionName: 'nodechildren'}) || node.children,
                        nodeIdValue     = WidgetUtilService.getEvaluatedData($is, node, {expressionName: 'nodeid'}),
                        isNodeMatched   = false,
                        expandCollapseIcon;

                    $li.data('nodedata', node)
                        .append($iconNode)
                        .append('<span class="title">' + nodeLabel + '</span>')
                        .appendTo($ul);


                    // if datavalue(ie, expr) is provided select the tree node accordingly
                    // if datavalue === 'FirstNode' -- select the FirstNode at level 0
                    // if datavalue === 'LastNode' -- select the LastNode at level 0
                    // if datavalue is a bind expression evaluate the expression for each node of the tree till the condition is satisfied.

                    //if node identifier is present then verify the datavalue is bound expr or static value and compare with the node model
                    if ($is.bindnodeid || $is.nodeid) {
                        isNodeMatched = $is.binddatavalue ? nodeIdValue == _evalDataValue : nodeIdValue == _expr;
                        if (nodeIdValue) {
                            $li.attr('id', nodeIdValue);
                        }
                    } else if ($is.binddatavalue) { //evaluate the expression only if it is bound (useExpression)
                        isNodeMatched = !!$is.$eval(_expr, node);
                    }
                    // Perform LastNode check only at level 0.(ie, deep = 0);
                    if (!$is._selectNode && _expr) {
                        if ((_expr === 'FirstNode' && idx === 0)
                                || (!deep && _expr === 'LastNode' && idx === nodes.length - 1)
                                || isNodeMatched) {
                            // save a reference of the node to be selected in `_selectNode`
                            $is._selectNode = $li;
                            $is.datavalue   = nodeIdValue;
                        }
                    }

                    if (nodeIcon) {
                        $iconNode.addClass(nodeIcon);
                    }

                    if (nodeChildren && nodeChildren.length) { // parent node
                        $li.addClass('parent-node ' + _cls);
                        expandCollapseIcon = WM.element('<i class="wi ' + _iconCls  + ' "></i>');
                        if (nodeIcon) {
                            $iconNode.addClass(nodeIcon);
                        }
                        $li.prepend(expandCollapseIcon);
                        if (!$is.widgetid) { // when the widget is in canvas render only the first level
                            constructNodes($is, nodeChildren, $li, levels - 1, deep + 1, _evalDataValue);
                        }
                    } else {
                        if (!nodeIcon) {
                            $iconNode.addClass('leaf-node');
                        }
                        $li.addClass('leaf-node');
                    }
                });
            }

            function getNodes($is, newVal) {
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
                    newVal = FormWidgetUtils.getOrderedDataSet(newVal, $is.orderby);
                    nodes = newVal;
                } else if (WM.isObject(newVal)) {
                    nodes = [newVal];
                }
                return nodes;
            }

            function changeTreeIcons($el, nv, ov) {
                nv = nv || defaultTreeIconClass;
                ov = ov || defaultTreeIconClass;
                $el.find('i.expanded').removeClass(ICON_CLASSES[ov].expanded).addClass(ICON_CLASSES[nv].expanded);
                $el.find('i.collapsed').removeClass(ICON_CLASSES[ov].collapsed).addClass(ICON_CLASSES[nv].collapsed);
            }

            function toggleExpandCollapseNode($is, $i, $li) {
                var treeIcons = ICON_CLASSES[$is.treeicons || defaultTreeIconClass];

                if ($i.hasClass('collapsed')) {
                    $i.removeClass('collapsed ' + treeIcons.collapsed).addClass('expanded ' + treeIcons.expanded);
                    $li.removeClass('collapsed').addClass('expanded');
                } else if ($i.hasClass('expanded')) {
                    $i.removeClass('expanded ' + treeIcons.expanded).addClass('collapsed ' + treeIcons.collapsed);
                    $li.removeClass('expanded').addClass('collapsed');
                }
            }

            function renderTree($el, $is, attrs) {
                var levels = +attrs.levels || 0,
                    docFrag,
                    $li,
                    data,
                    path = '',
                    fn;

                $el.empty();

                if (attrs.widgetid) {
                    levels = 0;
                }
                if ($is.nodes && $is.nodes.length) {
                    docFrag = document.createDocumentFragment();
                    constructNodes($is, $is.nodes, WM.element(docFrag), levels, 0, $is.datavalue);
                    $el.append(docFrag);
                }

                if ($is._selectNode) {
                    $li = $is._selectNode;
                    $li.addClass('selected');
                    data = $li.data('nodedata');

                    $li.parentsUntil($el, 'li.parent-node.collapsed')
                        .each(function () {
                            var $current = WM.element(this),
                                $i       = $current.children('i.collapsed'),
                                $title   = $current.children('.title');
                            toggleExpandCollapseNode($is, $i, $current);

                            path = '/' + $title.text() + path;
                        });

                    $is.selecteditem = Utils.getClonedObject(data);
                    $is.selecteditem.path = path;

                    fn = $is.onSelect({$event: undefined, $scope: $is, $item: data, $path: path});
                    Utils.triggerFn(fn);
                    $rs.$safeApply($is);
                }
            }

            function propertyChangeHandler($is, $el, attrs, key, newVal, oldVal) {
                switch (key) {
                case 'scopedataset':
                case 'dataset':
                    $is.nodes = getNodes($is, newVal.data || newVal);
                    $is._selectNode = undefined;
                    $is.renderTree($el, $is, attrs);
                    break;
                case 'nodeicon':
                case 'nodelabel':
                case 'nodechildren':
                case 'orderby':
                    $is.renderTree($el, $is, attrs);
                    break;
                case 'treeicons':
                    changeTreeIcons($el, newVal, oldVal);
                    break;
                case 'datavalue':
                    $is.selectNodeById(newVal);
                    break;
                }
            }

            /**
             * this function selects the tree node through click event and script access
             * @param $is isolatescope of the widget
             * @param $el $element
             * @param evt if it is a click event, pass the event
             * @param value this is the evaluated node id value
             */
            function selectNode($is, $el, evt, value) {
                var target = evt && WM.element(evt.target),
                    $li = WM.isObject(value) ? value : $el.find('li[id="' + value + '"]:first'),
                    data,
                    path = '',
                    $liPath,
                    fn;

                $el.find('.selected').removeClass('selected');
                $li.addClass('selected');
                data = $li.data('nodedata');

                //if the selectNode is initiated by click event then use the element target from event
                $liPath = target ? target.parents('.app-tree li') : $li.find('span.title').parents('.app-tree li');

                //construct the path of the node
                $liPath
                    .each(function () {
                        var current = WM.element(this).children('.title').text();
                        path = '/' + current + path;
                    });

                //expand the current node till the parent level which is collapsed
                $li.parentsUntil($el, 'li.parent-node.collapsed')
                    .each(function () {
                        var $current = WM.element(this),
                            $i       = $current.children('i.collapsed');
                        toggleExpandCollapseNode($is, $i, $current);
                    });

                $is.selecteditem      = Utils.getClonedObject(data) || {};
                $is.selecteditem.path = path;

                //if it is a click event update the datavalue and assign a watch as the previous watch will break after assigning
                if (target) {
                    $is.datavalue = WidgetUtilService.getEvaluatedData($is, data, {expressionName: 'nodeid'});
                    $is.$watch('datavalue', function (newVal) {
                        propertyChangeHandler($is, undefined, undefined, 'datavalue', newVal);
                    }, true);
                }
                fn = $is.onSelect({$event: evt, $scope: $is, $item: data, $path: path});
                Utils.triggerFn(fn);
                $rs.$safeApply($is);
            }

            function bindEvents($is, element) {

                element.on('click', function (evt) {
                    var target = WM.element(evt.target),
                        li     = target.closest('li');

                    $is.selecteditem = {};
                    evt.stopPropagation();

                    if (target.is('i')) {
                        toggleExpandCollapseNode($is, target, li);
                    } else if (target.is('span.title')) {
                        selectNode($is, element, evt, li);
                    }
                });
            }

            return {
                'restrict': 'E',
                'scope'   : {'scopedataset': '=?', 'onSelect': '&'},
                'template': '<div class="app-tree" init-widget apply-styles="container" has-model listen-property="dataset"></div>',
                'replace' : true,
                'link'    : {
                    'pre': function ($is, $el, attrs) {
                        if (attrs.widgetid) {
                            $is.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            $is.widgetProps = widgetProps;
                        }

                    },
                    'post': function ($is, $el, attrs) {

                        if (!$is.widgetid) {
                            bindEvents($is, $el);
                        }

                        // wait till all the properties are set in the scope.
                        $is.renderTree = _.debounce(renderTree, 20);

                        $is.selectNodeById = selectNode.bind(undefined, $is, $el, WM.noop());

                        var onPropertyChange = propertyChangeHandler.bind(undefined, $is, $el, attrs);
                        WidgetUtilService.registerPropertyChangeListener(onPropertyChange, $is, notifyFor);

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);

                        if (!attrs.widgetid && attrs.scopedataset) {
                            $is.$watch('scopedataset', function (newVal) {
                                onPropertyChange('scopedataset', newVal);
                            }, true);
                        }

                        if (!attrs.widgetid && attrs.datavalue) {
                            $is.$watch('datavalue', function (newVal) {
                                onPropertyChange('datavalue', newVal);
                            }, true);
                        }
                    }
                }
            };

        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmTree
 * @restrict E
 *
 * @description
 * The `wmTree` directive defines a tree widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires WidgetUtilService
 * @requires $timeout
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the tree widget.
 * @param {string=} width
 *                  Width of the tree.
 * @param {string=} height
 *                  Height of the tree.
 * @param {string=} treeicons
 *                  This property sets expand-collapse icons on the tree. <br>
 *                  Possible values are `folder`, `plus-minus`, `circle-plus-minus`, `chevron`, `menu`, `triangle` and `expand-collapse`. <br>
 *                  Default value: `triangle`. <br>
 * @param {string=} scopedataset
 *                  The script variable that contains the data to be displayed on the tree widget.
 * @param {object=} dataset
 *                  Set this property to a variable to populate the list of values to display. <br>
 *                  This is a bindable property.
 * @param {string=} datavalue
 *                  Provided expression will be evaluated for each node of the tree and the first node which satisfies the given expression will be selected by default. <br>
 *                  This is a bindable property.
 * @param {string=} nodelabel
 *                  This property from the dataset will be used to display label for the tree node.
 * @param {string=} nodeicon
 *                  This property from the dataset will be used to display icon for the tree node.
 * @param {string=} nodechildren
 *                  This property from the dataset will be used to display children for the tree node.
 * @param {number=} levels
 *                  This property sets levels of the tree to be expanded by default.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the tree widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} on-select
 *                  Callback function which will be triggered on selection of the widget.
 *
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
               <wm-tree scopedataset="nodes" levels="2" datavalue="id==8" nodelabel="name" nodeicon="icon" nodechildren="children"></wm-tree>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
           $scope.nodes = [
              {
                "id": 1,
                "name": "Arts & Photography",
                "icon": "wi wi-add-a-photo",
                "children": [
                  {
                    "id": 2,
                    "name": "Architecture",
                    "children": []
                  },
                  {
                    "id": 3,
                    "name": "Graphic Design",
                    "icon": "wi wi-graphic-eq",
                    "children": []
                  },
                  {
                    "id": 4,
                    "name": "Music",
                    "icon": "wi wi-library-music",
                    "children": [
                      {
                        "id": 5,
                        "name": "Songbooks",
                        "children": []
                      },
                      {
                        "id": 6,
                        "name": "Instruments & Performers",
                        "children": [
                          {
                            "id": 7,
                            "name": "Brass",
                            "children": []
                          },
                          {
                            "id": 8,
                            "name": "Woodwinds",
                            "children": []
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "id": 9,
                "name": "Comics & Graphic Novels",
                "icon": "wi wi-library-books",
                "children": [
                  {
                    "id": 10,
                    "name": "Comic Strips",
                    "children": []
                  },
                  {
                    "id": 11,
                    "name": "Graphic Novels",
                    "children": []
                  },
                  {
                    "id": 12,
                    "name": "Manga",
                    "children": []
                  }
                ]
              },
              {
                "id": 13,
                "name": "Comic Strips",
                "children": []
              },
              {
                "id": 14,
                "name": "Mystery, Thriller and Suspense",
                "children": [
                  {
                    "id": 15,
                    "name": "Mystery",
                    "children": [
                      {
                        "id": 16,
                        "name": "Hard Boiled",
                        "children": []
                      },
                      {
                        "id": 17,
                        "name": "Police Procedurals",
                        "children": [
                          {
                            "id": 18,
                            "name": "British Detectives",
                            "children": []
                          },
                          {
                            "id": 19,
                            "name": "FBI Agents",
                            "children": []
                          },
                          {
                            "id": 20,
                            "name": "Police Officers",
                            "children": []
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "id": 21,
                "name": "Nonfiction",
                "children": [
                  {
                    "id": 22,
                    "name": "Biographies and Memoirs",
                    "children": []
                  },
                  {
                    "id": 23,
                    "name": "Business & Investing",
                    "children": []
                  },
                  {
                    "id": 24,
                    "name": "Computers & Technology",
                    "children": [
                      {
                        "id": 25,
                        "name": "Databases",
                        "children": []
                      },
                      {
                        "id": 26,
                        "name": "Hardware",
                        "children": []
                      },
                      {
                        "id": 27,
                        "name": "Software",
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ];
           }
        </file>
    </example>
 */
