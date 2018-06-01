/*global WM, _*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .directive('wmBreadcrumb', ['PropertiesFactory', 'WidgetUtilService', 'Utils', '$location', 'CONSTANTS', '$rootScope', '$timeout', function (PropertiesFactory, WidgetUtilService, Utils, $location, CONSTANTS, $rs, $timeout) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.breadcrumb', ['wm.containers', 'wm.menu.dataProps']),
            notifyFor = {
                'dataset': true,
                'scopedataset': true,
                'itemchildren': true,
                'itemicon': true,
                'itemclass': true,
                'itemlabel': true,
                'itemlink': true,
                'itemid': true
            };

        /**
         * Gets the first path found based on the key provided inside info Object.
         * @param scope : isolateScope of widget.
         * @param info : Info object which has properties key(Active Page Name) and isPathFound[boolean] is set true if path found.
         * @param childObj : a child Object form children Array.
         * @param path : the final path.
         * @returns {*|Array}: returns array of objects which represents the final path.
         */
        function getPath(scope, info, childObj, path) {
            path = path || [];
            // return if path already found.
            if (info.isPathFound) {
                return path;
            }
            // if key is matched set path found to true and return the path.
            if (childObj[scope.itemid] === info.key) {
                info.isPathFound = true;
                // only push the child object by omiting the children within it.
                path.push(_.omit(childObj, scope.itemchildren));
                return path;
            }
            // if the node has children make a recursive call.
            if (childObj[scope.itemchildren]) {
                path.push(_.omit(childObj, scope.itemchildren));
                childObj[scope.itemchildren].forEach(function (child) {
                    getPath(scope, info, child, path);
                });
                // if path is not found in that node pop the node.
                if (!info.isPathFound) {
                    path.pop();
                }
            }
            // return the path.
            return path;
        }

        /**
         * Constructs the node array where ecah object will have id, link, icon and label property.
         * @param scope : isolateScope of the widget
         * @param newVal : array of objects.
         * @returns {Array} : return the node array which is used to construct the breadcrumb.
         */
        function constructNodes(scope, newVal) {
            var nodes = [],
                iconField     = scope.itemicon     || 'icon',
                labelField    = scope.itemlabel    || 'label',
                linkField     = scope.itemlink     || 'link',
                classField    = scope.itemclass    || 'class',
                actionField   = scope.itemaction   || 'action',
                itemIdField   = scope.itemid       || 'itemid';
            _.forEach(newVal, function (item) {
                nodes.push({
                    'id'       : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemid'})    || item[itemIdField],
                    'icon'     : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemicon'})  || item[iconField],
                    'class'    : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemclass'}) || item[classField],
                    'label'    : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlabel'}) || item[labelField],
                    'action'   : WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemaction'}) || item[actionField],
                    'link'     : Utils.getHref(scope, item, WidgetUtilService.getEvaluatedData(scope, item, {expressionName: 'itemlink'}), scope.hasOnBeforeNavigate, item.action, linkField)
                });
            });
            return nodes;
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
                nodes = constructNodes(scope, newVal);
            } else if (WM.isObject(newVal)) {
                // dynamically generate the path only if the itemchildren property is set.
                if (scope.itemchildren) {
                    // pass the active page name as key
                    nodes = constructNodes(scope, getPath(scope, {key: scope.pageName || $rs.activePageName}, newVal));
                } else {
                    nodes = [{
                        'label'     : newVal[scope.itemlabel  || "label"],
                        'icon'      : newVal[scope.itemicon   || "icon"],
                        'class'     : newVal[scope.itemclass  || "class"],
                        'link'      : newVal[scope.itemlink   || "link"],
                        'id'        : newVal[scope.itemid     || "itemid"]
                    }];
                }
            }
            return nodes;
        }

        function propertyChangeHandler(scope, key, newVal) {
            var dataset = scope.dataset || {};
            switch (key) {
            case 'scopedataset':
            case 'dataset':
                dataset = newVal;
                //break statement is intentionally removed for the flow
            case 'itemicon':
            case 'itemclass':
            case 'itemlabel':
            case 'itemlink':
            case 'itemid':
            case 'itemchildren':
                scope.nodes = getNodes(scope, dataset.data || dataset);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'scopedataset': '=?',
                'onBeforenavigate': '&'
            },
            'transclude': true,
            'template':
                '<ol class="breadcrumb app-breadcrumb" apply-styles data-element-type="wmBreadCrumb" init-widget listen-property="dataset">' +
                    '<li ng-repeat="item in nodes track by $index" ng-class="[item.class, {\'active\':$last}]">' +
                        '<i class="{{item.icon}}"></i> ' +
                        '<a title="{{item.label}}" ng-href="{{item.link || \'javascript:void(0)\'}}" ng-click = onItemClick(item)  ng-if="!$last">{{item.label}}</a>' +
                        '<label ng-if="$last">{{item.label}}</label>' +
                    '</li>' +
                '</ol> ',
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, $el, attrs) {
                    var onPropertyChange = propertyChangeHandler.bind(undefined, scope);

                    // If the widget is in partial set the partial page name as pageName or set active page name.
                    scope.pageName = $el.closest('.app-partial').attr('name');

                    WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, $el, attrs);

                    //Set hasOnBeforeNavigate only when there is onBeforenavigate event on the widget
                    scope.hasOnBeforeNavigate = !!attrs.onBeforenavigate;
                    if (!attrs.widgetid && attrs.scopedataset) {
                        scope.$watch('scopedataset', function (newVal) {
                            onPropertyChange('scopedataset', newVal);
                        }, true);
                    }

                    if (CONSTANTS.isRunMode) {
                        $timeout(function() {
                            $el.find('a').each(function(i, el){
                                if (el.href === 'javascript:void(0)') {
                                    //Disable right click on the element when link is empty
                                    Utils.disableRightClick(WM.element(el));
                                }
                            });
                        }, 100);
                        scope.onItemClick = function ($item) {
                            var link = $item.link || '',
                                navFn = scope.onBeforenavigate,
                                canNavigate = _.isFunction(navFn) ? navFn({$isolateScope: scope, $item: $item}) !== false  : true,
                                index,
                                queryParams,
                                params = {};
                            if (link && canNavigate) {
                                /* removing spl characters from the beginning of the path.
                                   1. #/Main  -> Main
                                   2. .#/Main/abc -> Main/abc
                                */
                                link = _.first(link.match(/[\w]+.*/g));

                                //If url params are present, construct params object and pass it to search
                                index = link.indexOf('?');
                                if (index !== -1) {
                                    queryParams = _.split(link.substring(index + 1, link.length), '&');
                                    link = link.substring(0, index);
                                    _.forEach(queryParams, function (param) {
                                        param = _.split(param, '=');
                                        params[param[0]] = param[1];
                                    });
                                }
                                //search method is passed with empty object to remove url parameters.
                                $location.path(link).search(params);
                            }
                        };
                    }
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmBreadcrumb
 * @restrict E
 * @element ANY
 * @description
 * The 'wmBreadcrumb' directive defines a breadcrumb bar in the layout.
 *
 * @param {string=} name
 *                  Name of the breadcrumb.
 * @param {string=} height
 *                  Height of the breadcrumb.
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the breadcrumb widget from a variable defined in the page controller. <br>
 * @param {string=} value
 *                  This property displays the list of values to display in the breadcrumb widget. It is a bindable property.
 * @param {string=} itemicon
 *                  This property defines the value to be used as key for the icon from the list of values bound to the breadcrumb widget as an array of objects of different values.
 * @param {string=} itemlabel
 *                  This property defines the value to be used as key for the label from the list of values bound to the breadcrumb widget as an array of objects of different values.
 * @param {string=} itemlink
 *                  This property defines the value to be used as key for the link from the list of values bound to the breadcrumb widget as an array of objects of different values.
 * @param {boolean=} show
 *                  This property determines whether the breadcrumb widget is visible or not. It is a bindable property.
 *                  Default value: `true`. <br>
 * @param {boolean=} horizontalalign
 *                  Align the content of the breadcrumb widget to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-breadcrumb dataset="Users, Alan, Profile, PersonalInfo, Address" name="breadcrumb1"></wm-breadcrumb>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */





