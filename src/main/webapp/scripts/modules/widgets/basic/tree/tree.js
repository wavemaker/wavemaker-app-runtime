/*global WM, _, document*/
/*Directive for Tree */

WM.module('wm.widgets.basic')
    .directive('wmTree', [
        'PropertiesFactory',
        '$rootScope',
        'WidgetUtilService',
        '$timeout',
        'Utils',

        function (PropertiesFactory, $rootScope, WidgetUtilService, $timeout, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.tree', ['wm.base', 'wm.base.editors']),
                notifyFor = {
                    'scopedataset': true,
                    'dataset': true,
                    'treeicons': true,
                    'nodelabel': true,
                    'nodeicon': true,
                    'nodechildren': true
                },
                defaultTreeIconClass = 'plus-minus',
                ICON_CLASSES = {
                    'folder': {
                        'expanded': 'glyphicon-folder-open',
                        'collapsed': 'glyphicon-folder-close'
                    },
                    'circle-plus-minus': {
                        'expanded': 'glyphicon-minus-sign',
                        'collapsed': 'glyphicon-plus-sign'
                    },
                    'chevron': {
                        'expanded': 'glyphicon-chevron-down',
                        'collapsed': 'glyphicon-chevron-right'
                    },
                    'menu': {
                        'expanded': 'glyphicon-menu-down',
                        'collapsed': 'glyphicon-menu-right'
                    },
                    'triangle': {
                        'expanded': 'glyphicon-triangle-bottom',
                        'collapsed': 'glyphicon-triangle-right'
                    },
                    'expand-collapse': {
                        'expanded': 'glyphicon-collapse-down',
                        'collapsed': 'glyphicon-expand'
                    },
                    'plus-minus': {
                        'expanded': 'glyphicon-minus',
                        'collapsed': 'glyphicon-plus'
                    }
                };

            function constructNodes(scope, nodes, parent) {

                var iconField = scope.nodeicon || 'icon',
                    labelField = scope.nodelabel || 'label',
                    childrenField = scope.nodechildren || 'children',
                    $ul = WM.element('<ul></ul>'),
                    collapsedIconClass = ICON_CLASSES[scope.treeicons || defaultTreeIconClass].collapsed;

                parent.append($ul);
                nodes.forEach(function (node) {
                    var $li = WM.element('<li></li>'),
                        expandCollapseIcon,
                        $iconNode = WM.element('<i></i>'),
                        nodeLabel = node[labelField],
                        nodeIcon = node[iconField],
                        nodeChildren = node[childrenField];

                    $li.data('nodedata', node)
                        .append($iconNode)
                        .append('<span class="title">' + nodeLabel + '</span>')
                        .appendTo($ul);

                    if (nodeIcon) {
                        $iconNode.addClass(nodeIcon);
                    }

                    if (nodeChildren && nodeChildren.length) { // parent node
                        $li.addClass('parent-node collapsed');
                        expandCollapseIcon = WM.element('<i class="glyphicon collapsed ' +  collapsedIconClass + '"></i>');
                        if (nodeIcon) {
                            $iconNode.addClass(nodeIcon);
                        }
                        $li.prepend(expandCollapseIcon);
                        if (!scope.widgetid) { // when the widget is in canvas render only the first level
                            constructNodes(scope, nodeChildren, $li);
                        }
                    } else {
                        if (!nodeIcon) {
                            $iconNode.addClass('leaf-node');
                        }
                        $li.addClass('leaf-node');
                    }
                });
            }

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
                    nodes = newVal;
                } else if (WM.isObject(newVal)) {
                    nodes = [newVal];
                }

                if (scope.widgetid) { // when the widget is inside canvas
                    scope.keys = WM.isObject(nodes[0]) ? Object.keys(nodes[0]) : [];
                    /*Changing the properties like labels,children and icons*/
                    scope.widgetProps.nodelabel.options = scope.widgetProps.nodechildren.options = scope.widgetProps.nodeicon.options = scope.keys;
                }
                return nodes;
            }

            function changeTreeIcons(element, newVal, oldVal) {
                newVal = newVal || defaultTreeIconClass;
                oldVal = oldVal || defaultTreeIconClass;
                element.find('i.expanded').switchClass(ICON_CLASSES[oldVal].expanded, ICON_CLASSES[newVal].expanded);
                element.find('i.collapsed').switchClass(ICON_CLASSES[oldVal].collapsed, ICON_CLASSES[newVal].collapsed);
            }

            function renderTree(element, scope) {
                element.empty();
                if (scope.nodes.length) {
                    var docFrag = document.createDocumentFragment();
                    constructNodes(scope, scope.nodes, WM.element(docFrag));
                    element.append(docFrag);
                }
            }

            function propertyChangeHandler(scope, element, key, newVal, oldVal) {
                switch (key) {
                case 'scopedataset':
                case 'dataset':
                    scope.nodes = getNodes(scope, newVal);
                    renderTree(element, scope);
                    break;
                case 'nodeicon':
                case 'nodelabel':
                case 'nodechildren':
                    renderTree(element, scope);
                    break;
                case 'treeicons':
                    changeTreeIcons(element, newVal, oldVal);
                    break;
                }
            }

            function bindEvents(scope, element) {

                element.on('click', function (evt) {
                    var target = WM.element(evt.target), li = target.closest('li'),
                        fn,
                        path = '',
                        treeIcons = ICON_CLASSES[scope.treeicons || defaultTreeIconClass];
                    scope.selecteditem = {};
                    evt.stopPropagation();

                    if (target.is('i')) {
                        if (target.hasClass('collapsed')) {
                            target.switchClass('collapsed ' + treeIcons.collapsed, 'expanded ' + treeIcons.expanded);
                            li.switchClass('collapsed').addClass('expanded');
                        } else if (target.hasClass('expanded')) {
                            target.switchClass('expanded ' + treeIcons.expanded, 'collapsed ' + treeIcons.collapsed);
                            li.removeClass('expanded').addClass('collapsed');
                        }
                    } else if (target.is('span.title')) {
                        element.find('.selected').removeClass('selected');
                        li.addClass('selected');
                        scope.selecteditem = WM.copy(li.data('nodedata'));

                        target.parents('.app-tree li')
                            .each(function () {
                                var current = WM.element(this).children('.title').text();
                                path = '/' + current + path;
                            });

                        scope.selecteditem.path = path;
                        fn = scope.onSelect({$event: evt, $scope: scope, $item: scope.selecteditem});
                        Utils.triggerFn(fn);
                        $rootScope.$safeApply(scope);
                    }
                });

            }

            return {
                'restrict': 'E',
                'scope': {
                    'scopedataset': '=?',
                    'onSelect': '&'
                },
                'template': '<div class="app-tree" init-widget ' + $rootScope.getWidgetStyles('container') + ' data-ng-show="show"></div>',
                'replace': true,
                'compile': function () {
                    return {
                        'pre': function (scope) {
                            scope.widgetProps = WM.copy(widgetProps);
                        },
                        'post': function (scope, element, attrs) {

                            if (!scope.widgetid) {
                                bindEvents(scope, element);
                            }

                            // wait till all the properties are set in the scope.
                            renderTree = _.debounce(renderTree, 20);

                            var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element);
                            WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);

                            if (!scope.widgetid && attrs.scopedataset) {
                                $timeout(function () {
                                    scope.$watch('scopedataset', function (newVal) {
                                        onPropertyChange('scopedataset', newVal);
                                    });
                                }, 0, true);
                            }

                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
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
 * @param {string=} nodelabel
 *                  This property from the dataset will be used to display label for the tree node.
 * @param {string=} nodeicon
 *                  This property from the dataset will be used to display icon for the tree node.
 * @param {string=} nodechildren
 *                  This property from the dataset will be used to display children for the tree node.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the tree widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} on-select
 *                  Callback function which will be triggered on selection of the widget.
 *
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *              <wm-tree scopedataset="nodes"></wm-tree>
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
 *                  "icon": "glyphicon glyphicon-euro",
 *                  "children": [{
 *                      "label": "item2.1",
 *                      "icon": "glyphicon glyphicon-euro",
 *                      "children": [{
 *                          "label": "item2.1",
 *                          "icon": "glyphicon glyphicon-euro",
 *                          "children": [{
 *                              "label": "item2.1",
 *                              "icon": "glyphicon glyphicon-euro"
 *                          }, {
 *                              "label": "item2.2",
 *                              "icon": "glyphicon glyphicon-euro"
 *                          }, {
 *                              "label": "item2.3",
 *                              "icon": "glyphicon glyphicon-euro"
 *                          }, {
 *                              "label": "item2.4",
 *                              "icon": "glyphicon glyphicon-euro"
 *                          }]
 *                      }]
 *                  }, {
 *                      "label": "item2.2",
 *                      "icon": "glyphicon glyphicon-euro"
 *                  }, {
 *                      "label": "item2.3",
 *                      "icon": "glyphicon glyphicon-euro"
 *                  }, {
 *                      "label": "item2.4",
 *                      "icon": "glyphicon glyphicon-euro"
 *                  }]
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
