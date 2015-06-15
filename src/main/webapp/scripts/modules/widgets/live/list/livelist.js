/*global WM, window*/
/*jslint todo: true */
/*Directive for liveList */

WM.module('wm.widgets.live')
    .controller('listController', ["$rootScope", "$scope", "CONSTANTS", "Utils", function ($rootScope, $scope, CONSTANTS, Utils) {
        "use strict";
        $scope.dataset = []; // The data that is bound to the list. Stores the name for reference.
        $scope.fieldDefs = [];// The data required by the wmListItem directive to populate the items
        $scope.noDataFound = false;
        this.listScope = $scope;
        /*to get the list of columns from the dataSet/scopeDataSet*/
        function getColumnsFromDataSet(dataset) {
            return WM.isArray(dataset) && WM.isObject(dataset[0]) ? Object.keys(dataset[0]) : WM.isObject(dataset) ? Object.keys(dataset) : [];
        }

        /*to get list of all the columns from the properties-map */
        function getColumnsFromPropertiesMap(propertiesMap) {
            var columns = [];
            if (propertiesMap && propertiesMap.columns) {
                //populating the column definition in the columns
                propertiesMap.columns.forEach(function (column) {
                    columns.push(column.fieldName);
                });
            }
            return columns;
        }

        /* update the selectedItem dataType onchange of bindDataSet*/
        $scope.updateSelectedItemDataType = function (element) {
            var variable = element.scope() && element.scope().Variables && element.scope().Variables[Utils.getVariableName($scope)];
            /*check for sanity*/
            if (variable) {
                /* set the variable type info to the live-list selected-entry type, so that type matches to the variable for which variable is created*/
                $scope.widgetProps.selecteditem.type = variable.type;
            }
        };

        $scope.updateLiveListBindings = function (forceUpdate) {
            var columns = $scope.dataset && $scope.dataset.propertiesMap ?
                        getColumnsFromPropertiesMap($scope.dataset.propertiesMap) :
                        getColumnsFromDataSet($scope.dataset);

            /* emit event to modify the liveList template*/
            $rootScope.$emit("livelist-template-modified", {"widgetName": $scope.name, "bindDataset": $scope.binddataset, "fields": columns, "forceUpdate": forceUpdate});
        };

        $scope.handlePageSizeDisplay = function (variableObj) {
            /*Check for sanity*/
            if (variableObj) {
                /*Make the "pageSize" property readonly so that no editing is possible.*/
                $scope.widgetProps.pagesize.disabled = (variableObj.category === "wm.LiveVariable");
            }
        };

        /** This method is called whenever there is a change in the dataSet. It gets the new data and modifies the dom and emits an
         * event to update the markup*/
        $scope.watchVariableDataSet = function (newVal, oldVal, element) {

            if (newVal && newVal !== oldVal) {
                $scope.noDataFound = false;
                var variableObj = element.scope() && element.scope().Variables && element.scope().Variables[Utils.getVariableName($scope)];

                if (newVal.data) {
                    newVal = newVal.data;
                } else if (variableObj && variableObj.category === "wm.LiveVariable") {
                    return;
                }
                /*If the data is a pageable object, then display the content.*/
                if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                    newVal = newVal.content;
                }
                if (newVal.dataSet) {
                    newVal = newVal.dataSet;
                }
                if (WM.isObject(newVal) && !WM.isArray(newVal)) {
                    newVal = [newVal];
                }
                if (!$scope.binddataset) {
                    if (WM.isString(newVal)) {
                        newVal = newVal.split(',');
                    }
                }
                if (newVal instanceof Array) {
                    $scope.dataNavigator.pagingOptions = {
                        maxResults: $scope.pagesize || 20
                    };
                    if (!$scope.dataNavigatorWatched && $scope.dataNavigator && $scope.shownavigation) {
                        $scope.dataNavigator.dataset = $scope.binddataset;
                        $scope.dataNavigatorWatched = true;
                        /*Register a watch on the "result" property of the "dataNavigator" so that the paginated data is displayed in the live-list.*/
                        $scope.dataNavigator.$watch("result", function (newVal, oldVal) {
                            $scope.watchVariableDataSet(newVal, oldVal, element);
                        });
                        /*Register a watch on the "maxResults" property of the "dataNavigator" so that the "pageSize" is displayed in the live-list.*/
                        $scope.dataNavigator.$watch("maxResults", function (newVal) {
                            $scope.pagesize = newVal;
                        });
                    }
                    if (newVal.length === 0 && CONSTANTS.isRunMode) {
                        $scope.noDataFound = true;
                    }
                    $scope.createListItems(newVal);
                }
                /*Check for sanity*/
                if (CONSTANTS.isStudioMode && $scope.binddataset) {
                    $scope.handlePageSizeDisplay(variableObj);
                }
            } else if (!newVal && CONSTANTS.isRunMode) {
                $scope.createListItems([]);
            }
        };

        this.getListScope = function () {
            return this.listScope;
        };
        /** With given data, creates list items and updates the markup*/
        $scope.createListItems = function (data) {
            var newData = WM.copy(data);
            /*If the "maxResults" property has been set in the dataNavigator, that takes precedence. Hence splice the data only if it is not set.*/
            /** Set the data to field-definitions, now the template will be modified and rendered,
             * If pageSize is mentioned then splice the data to get the required data*/
            $scope.fieldDefs = ($scope.dataNavigator && !$scope.shownavigation && $scope.pagesize) ? newData.splice(0, $scope.pagesize) : data;
            $scope.elementScope.fieldDefs = $scope.fieldDefs;
        };

    }])
    .run(["$templateCache", "$rootScope", function ($templateCache, $rootScope) {
        "use strict";
        $templateCache.put("template/widget/list.html",
            '<div class="app-livelist" init-widget' + $rootScope.getWidgetStyles() + ' data-ng-show="show" >' +
                '<ul data-identifier="list" class="clearfix" title="{{hint}}" data-ng-class="listclass" wmtransclude></ul>' +
                '<div class="no-data-msg" data-ng-show="noDataFound">{{::$root.appLocale.MESSAGE_LIVELIST_NO_DATA}}</div>' +
                '<wm-datanavigator class="well well-sm clearfix" show="{{show && shownavigation}}" showrecordcount="{{show && showrecordcount}}"></wm-datanavigator>' +
            '</div>'
            );

    }])
    .directive('wmLivelist', ["$rootScope", "$templateCache", "$compile", "PropertiesFactory", "WidgetUtilService", "Utils", "CONSTANTS", "$timeout", function ($rootScope, $templateCache, $compile, PropertiesFactory, WidgetUtilService, Utils, CONSTANTS, $timeout) {
        "use strict";
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.livelist", ["wm.base.editors", "wm.base.events"]),
            listItemsMarkup = '',
            elementsMarkup_start = '<li data-ng-repeat="item in fieldDefs track by $index" ',
            elementsMarkup_end = ' class="app-list-item" compile="innerElements" data-ng-class="[itemsPerRowClass, itemclass]"></li>',
            notifyFor = {
                'dataset': true,
                'shownavigation': true,
                'showrecordcount': true,
                'itemsperrow': true
            };

        function getElementsMarkup(scope, attrs) {
            var isWidgetInsideCanvas = scope.widgetid,
                template = elementsMarkup_start;

            if (!isWidgetInsideCanvas) {
                if (attrs.hasOwnProperty('onMouseenter')) {
                    template += ' data-ng-mouseenter="onMouseenter({$event: $event, $scope: this})" ';
                }

                if (attrs.hasOwnProperty('onMouseleave')) {
                    template += ' data-ng-mouseleave="onMouseleave({$event: $event, $scope: this})" ';
                }
            }

            template += elementsMarkup_end;

            return template;
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {
                "scopedataset": "=?",
                'onClick': "&",
                'onMouseenter': "&",
                'onMouseleave': "&",
                "onEnterkeypress": "&",
                "onSetrecord": "&"
            },
            transclude: true,
            controller: 'listController',
            template: $templateCache.get("template/widget/list.html"),
            compile: function (tElement, tAttr) {

                /* in run mode there is separate controller for live-list widget but not in studio mode,
                 * to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttr.name + "Controller"] = WM.noop;
                }

                tAttr.listItemsMarkup = listItemsMarkup;
                return {
                    pre: function (scope, element) {
                        /*Properties could be enabled/disabled per widget. Hence copy is used.*/
                        scope.widgetProps = WM.copy(widgetProps);

                        /*This is to make the "Variables" & "Widgets" available in the Data-navigator it gets compiled with the live-list isolate Scope
                         * and "Variables", "Widgets" will not be available in that scope.
                         * element.scope() might refer to the controller scope/parent scope.*/
                        var elScope = element.scope();
                        Object.defineProperties(scope, {
                            'Variables': {
                                get: function () {
                                    return elScope.Variables;
                                }
                            },
                            'Widgets': {
                                get: function () {
                                    return elScope.Widgets;
                                }
                            }
                        });
                    },

                    post: function (scope, element, attrs) {
                        var iterMarkup,
                            itemsEle,
                            ele,
                            elementScope = element.scope().$new(),
                            unbindWatcher;
                        elementScope.onClick = scope.onClick;
                        elementScope.onMouseenter = scope.onMouseenter;
                        elementScope.onMouseleave = scope.onMouseleave;
                        elementScope.onEnterkeypress = scope.onEnterkeypress;
                        elementScope.onSetrecord = scope.onSetrecord;
                        elementScope.itemclass = scope.itemclass;
                        elementScope.itemsPerRowClass = scope.itemsPerRowClass;

                        scope.elementScope = elementScope;

                        if (!scope.binddataset && scope.dataset === undefined) {
                            scope.watchVariableDataSet('', undefined, element);
                        }

                        scope.dataNavigator = element.find('[data-identifier=datanavigator]').isolateScope();
                        /*initialising oldDataSet to -1,
                         * so as to handle live-list with variable binding with live variables, during page 'switches' or 'refreshes' */
                        scope.oldbinddataset = -1;
                        /** construct the elements inside the ul, it has a header and list of items.
                         * Using ng-repeat to get all the items
                         * using ng-if to check if this element has to be rendered, which is based on the pcDisplay,mobileDisplay properties along with the current device view*/
                        elementScope.innerElements = scope.markup;

                        /*Function to evaluate the binding for the attributes*/
                        /** The bound value is replaced with {{item.fieldname}} here. This is needed by the liveList when compiling
                         * inner elements*/
                        iterMarkup = function (elements) {
                            WM.forEach(elements, function (element) {
                                WM.forEach(element.attributes, function (attribute) {
                                    if (Utils.stringStartsWith(attribute.value, "bind:")) {
                                        var parentDataset = attrs.dataset || attrs.scopedataset,
                                            dataSetExpr,
                                            field;
                                        parentDataset = parentDataset.replace("bind:", "");
                                        dataSetExpr = new RegExp("(" + parentDataset + ")(\\[0\\])?(.data\\[\\$i\\])?(.content\\[\\$i\\])?", 'g');
                                        /*if the attribute value is "bind:xxxxx.xxxx", either the dataSet/scopeDataSet has to contain "xxxx.xxxx" */
                                        if (attribute.value.indexOf(parentDataset) !== -1) {
                                            field = attribute.value.replace("bind:", "");
                                            field = field.replace(dataSetExpr, "item");
                                            attribute.value = "{{" + field + "}}";
                                        }
                                    }
                                });
                                if (WM.element(element).children().length > 0) {
                                    iterMarkup(WM.element(element).children());
                                }
                            });
                        };

                        iterMarkup(elementScope.innerElements);

                        ele = getElementsMarkup(scope, attrs);

                        itemsEle = $compile(ele)(elementScope);
                        /**Compile the elements, remove the content from the ul and append the compiled one*/
                        if (CONSTANTS.isRunMode) {
                            WM.element(itemsEle).insertAfter(element.find("[data-identifier=listtemplate]"));
                            if (attrs.selectfirstitem === "true") {
                                unbindWatcher = scope.$watch(function () {
                                    var items = element.find('.list-group li:first-of-type');
                                    if (items.length) {
                                        $rootScope.$safeApply(scope, function () {
                                            $timeout(function () {items.first().click(); }, 0, false);
                                            unbindWatcher();
                                        });
                                    }
                                });
                            }
                        }

                        /** In case of run mode, the field-definitions will be generated from the markup*/
                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal, oldVal) {
                            switch (key) {
                            case "dataset":
                                scope.watchVariableDataSet(newVal, oldVal, element);
                                /* to add <wm-labels> in the markup, based on dataSet
                                */
                                if (CONSTANTS.isStudioMode) {
                                    if (attrs.template !== "true") {
                                        if ((scope.oldbinddataset !== -1 && scope.oldbinddataset !== scope.binddataset)) {
                                            scope.updateLiveListBindings(true);
                                        } else if (scope.oldbinddataset === -1 && !attrs.dataset) {
                                            scope.updateLiveListBindings();
                                        }
                                    }
                                    scope.oldbinddataset = scope.binddataset;
                                    /*update selectedItem dataType*/
                                    scope.updateSelectedItemDataType(element);
                                }
                                break;
                            case "shownavigation":
                                /*Check for sanity*/
                                if (CONSTANTS.isStudioMode) {
                                    scope.widgetProps.showrecordcount.show = newVal;
                                }
                                break;
                            case "itemsperrow":
                                /*Check for studio mode*/
                                if (CONSTANTS.isStudioMode) {
                                    var oldClass = oldVal && "col-md-" + 12 / (+oldVal),
                                        newClass = newVal && "col-md-" + 12 / (+newVal);
                                    element.find('.app-listtemplate').removeClass(oldClass).addClass(newClass);
                                }
                                break;
                            }
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                        if (CONSTANTS.isRunMode) {
                            scope.$watch("scopedataset", function (newVal) {
                                if (newVal && !scope.dataset) {
                                    scope.createListItems(newVal);
                                    elementScope.fieldDefs = scope.fieldDefs;
                                }
                            });
                            /*listen on to the click event for the ul element & get li clicked of the live-list */
                            element.on('click.wmActive', 'ul', function (evt) {
                                var liElement = WM.element(evt.target).closest('li.app-list-item'),
                                    liElScope = liElement.scope();
                                /* sanity-check: for li-element*/
                                if (liElement) {
                                    /*removing active class from previous selectedItem*/
                                    element.find('li.active').removeClass('active');
                                    /*adding active class to current selectedItem*/
                                    liElement.addClass('active');
                                    /*check for liElement scope*/
                                    if (liElScope) {
                                        /*update the selectedItem with current clicked li*/
                                        scope.selecteditem = liElScope.item || null;
                                        /*trigger $apply, as 'click' is out of angular-scope*/

                                        Utils.triggerFn(liElScope.onClick, {$event: evt, $scope: liElScope});
                                        $rootScope.$safeApply(scope);
                                    }
                                }
                            });
                        }
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.live.directive:wmLivelist
 * @restrict E
 *
 * @description
 * The `wmLivelist` directive defines a Live list widget. <br>
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $compile
 * @requires CONSTANTS
 * @requires Utils
 * @requires $compile
 *
 * @param {string=} name
 *                  Name of the list container.
 * @param {string=} width
 *                  Width of the list container.
 * @param {string=} height
 *                  Height of the list container.
 * @param {string=} itemsperrow
 *                  This property controls the number of widgets displayed within this widget container for a horizontal layout. <br>
 *                  Possible values are `1`, `2`, `3`, `4`, `6`, and `12`. <br>
 *                  default value: `1`.
 * @param {string=} dataset
 *                  Sets the data for the list.<br>
 *                  This is a bindable property.<br>
 *                  When bound to a variable, the data associated with the variable is displayed in the list.
 * @param {object=} scopedataset
 *                  Populate data for the list which is defined in the script<br>
 *                  The data is visible only in the run mode.<br>
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the list on the web page. <br>
 *                  default value: `true`.
 * @param {number=} pagesize
 *                  This property sets the number of items to show in the drop-down list.
 * @param {boolean=} shownavigation
 *                  This property controls whether or not navigation controls are displayed for the live-list.
 *                  default value: `false`.
 * @param {boolean=} showrecordcount
 *                  This property controls whether the total record count is displayed in the data navigator or not.
 *                  default value: `false`.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dbclick
 *                  Callback function which will be triggered when the widget is double-clicked.
 * @param {string=} on-mouseenter.
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @param {string=} on-enterkeypress
 *                  Callback function which will be triggered when the user hits ENTER/Return while focus is in this editor.
 * @param {string=} on-setrecord
 *                  Callback function which will be triggered when the record is set using the data-navigator.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *              <div>Selected Element: {{selectedItem}}</div>
 *              <wm-livelist
 *                  name="{{caption}}"
 *                  width="{{width}}"
 *                  height="{{height}}"
 *                  show="true"
 *                  scopedataset="dataset"
 *                  on-click="f($event)">
 *              </wm-livelist><br>
 *               <wm-composite>
 *                   <wm-label caption="caption:"></wm-label>
 *                   <wm-text scopedatavalue="caption"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="width:"></wm-label>
 *                   <wm-text scopedatavalue="width"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="height:"></wm-label>
 *                   <wm-text scopedatavalue="height"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="dataset:"></wm-label>
 *                   <wm-text
 *                      on-blur="blur($event, $scope)"
 *                      scopedatavalue="dataStr">
 *                   </wm-text>
 *               </wm-composite>
 *           </div>
 *       </file>
 *        <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.width = "400px";
 *              $scope.height= "200px";
 *              $scope.caption = " Users ";
 *
 *              $scope.dataset =
 *              $scope.dataStr = ["user", "admin", "superuser"];
 *
 *              $scope.f = function (event) {
 *                  $scope.selectedItem = event.target.innerText;
 *              };
 *              $scope.blur = function (event, scope) {
 *                  $scope.dataset = [];
 *                  $scope.dataset = scope.datavalue.split(',');
 *              }
 *           }
 *       </file>
 *   </example>
 */
