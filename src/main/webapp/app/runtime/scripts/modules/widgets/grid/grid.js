/*global WM, wmGrid, confirm, window*/
/*jslint sub: true */
/*jslint todo: true */

/**
 * @ngdoc directive
 * @name wm.widgets.grid.directive:wmGrid
 * @restrict E
 *
 * @description
 * The `wmGrid` is the data grid used to display data in a tabular manner.<br>
 * `wmGrid` can be bound to variables and display the data associated with them.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $compile
 * @requires $controller
 * @requires CONSTANTS
 * @requires $rootScope
 *
 * @param {string=} caption
 *                  Caption of the grid.
 * @param {string=} name
 *                  Sets the name of the grid.
 * @param {string=} width
 *                  Sets the width of the grid.
 * @param {string=} height
 *                  Sets the height of the live grid.
 * @param {boolean=} showheader
 *                  This property determines if the header has to be shown/hidden. <br>
 *                  Defualt value: `true`. <br>
 * @param {string=} scopedataset
 *                  This property accepts the value for the grid widget from a variable defined in the controller page. <br>
 * @param {string=} dataset
 *                  This property determines the list of values to display for the grid. It is a bindable property.
 * @param {string=} editcolumns
 *                  This property determines the columns to edit for the grid.
 * @param {boolean=} readonlygrid
 *                  This property determines if the grid has read-only behaviour. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} show
 *                  This property determines whether the grid widget is visible or not. It is a bindable property.
 *                  Default value: `true`. <br>
 * @param {boolean=} showtotalrecords
 *                  This property controls whether the total record count is displayed in the data navigator or not. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} multiselect
                    Show a multiselect checkbox column in grid widget.
 * @param {boolean=} radiocolumn
 *                  Show a radio column in grid widget.
 * @param {boolean=} enablesearch
 *                  Show search box for searching in grid widget.
 * @param {boolean=} searchlabel
 *                  The search label to show for the search box.
 * @param {boolean=} showrowindex
 *                  Show row index column in the grid widget
 * @param {boolean=} selectfirstrecord
 *                  If this property is checked, the first record of the grid will be selected automatically when the grid is displayed.
 * @param {string=} click
 *                  Callback function which will be triggered on clicking the grid.
 * @param {string=} enterpresskey
 *                  Callback function which will be triggered on pressing the Enter key.
 * @param {string=} show
 *                  Callback function which will be triggered  any time a widget is shown due to changes in its parent's state.
 * @param {string=} hide
 *                  Callback function which will be triggered  any time a widget is hidden due to changes in its parent's state
 * @param {string=} onselect
 *                  Callback function which will be triggered when the grid is selected.
 * @param {string=} ondeselect
 *                  Callback function which will be triggered when the grid is unselected.
 * @param {string=} datasort
 *                  Callback function which will be triggered when the user clicks the grid headers to sort your grid.
 * @param {string=} headerclick
 *                  Callback function which will be triggered when the user clicks the grid headers.
 * @param {string=} rowclick
 *                  Callback function which will be triggered when the user clicks the rows in the grid.
 * @param {string=} columnselect
 *                  Callback function which will be triggered when the user selects a column.
 * @param {string=} columndeselect
 *                  Callback function which will be triggered when the user deselects a column.
 * @param {string=} recorddelete
 *                  Callback function which will be triggered when the user deletes a row.
 * @param {string=} beforerecordinsert
 *                  Callback function which will be triggered before a new row in inserted into the grid.
 * @param {string=} afterrecordinsert
 *                  Callback function which will be triggered after a new row in inserted into the grid.
 * @param {string=} beforerecordsupdate
 *                  Callback function which will be triggered when the record is set using the data-navigator.
 * @example
 *  <example module="wmCore">
 *      <file name="index.html">
 *          <div data-ng-controller="Ctrl" class="wm-app" style="height: 100%;">
 *              <wm-grid readonlygrid="false" name="grid3" dataset="{{data}}" shownavigation="false" enablesort="false">
 *              </wm-grid>
 *          </div>
 *      </file>
 *      <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.data = [{"deptid":1,"name":"Engineering","budget":1936760,"q1":445455,"q2":522925,"q3":426087,"q4":542293,"deptcode":"Eng","location":"San Francisco","tenantid":1},{"deptid":2,"name":"Marketing","budget":1129777,"q1":225955,"q2":271146,"q3":327635,"q4":305040,"deptcode":"Mktg","location":"New York","tenantid":1},{"deptid":3,"name":"General and Admin","budget":1452570,"q1":435771,"q2":290514,"q3":348617,"q4":377668,"deptcode":"G&A","location":"San Francisco","tenantid":1},{"deptid":4,"name":"Sales","budget":2743744,"q1":493874,"q2":658499,"q3":713373,"q4":877998,"deptcode":"Sales","location":"Austin","tenantid":1},{"deptid":5,"name":"Professional Services","budget":806984,"q1":201746,"q2":201746,"q3":177536,"q4":225955,"deptcode":"PS","location":"San Francisco","tenantid":2}];
 *          }
 *      </file>
 *  </example>
 */
WM.module('wm.widgets.grid')
    .directive('wmGrid', ['PropertiesFactory', 'WidgetUtilService', '$compile', '$controller', 'CONSTANTS', '$rootScope', '$timeout', 'Utils', function (PropertiesFactory, WidgetUtilService, $compile, $controller, CONSTANTS, $rootScope, $timeout, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.grid', ['wm.base', 'wm.base.editors']),
            gridColumnMarkup = '',
            notifyFor = {
                'width': true,
                'height': true,
                'gridfirstrowselect': true,
                'deleterow': true,
                'updaterow': true,
                'dataset': true,
                'showheader': true,
                'shownavigation': true,
                'insertrow': true,
                'show': true,
                'gridsearch': true,
                'searchlabel': true,
                'multiselect': true,
                'radioselect': true,
                'showrowindex': true,
                'enablesort': true,
                'readonlygrid': true,
                'gridcaption': true,
                'gridclass': true,
                'nodatamessage': true
            },
            getObjectIndexInArray = function (key, value, arr) {
                var index = -1;
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i][key] === value) {
                        index = i;
                        break;
                    }
                }
                return index;
            },
            readOnlyGridAttrUpdated;

        return {
            "restrict": 'E',
            "scope": {
                "scopedataset": '=?',
                "onSelect": "&",
                "onDeselect": "&",
                "onSort": "&",
                "onClick": "&",
                "onHeaderclick": "&",
                "onShow": "&",
                "onHide": "&",
                "onRowdeleted": "&",
                "onRowupdated": "&",
                "onBeforerowinsert": "&",
                "onRowinsert": "&",
                "onRowclick": "&",
                "onColumnselect": "&",
                "onColumndeselect": "&",
                "onEnterkeypress": "&",
                "onSetrecord": "&"
            },
            "replace": true,
            "transclude": false,
            "controller": 'gridController',
            "template": function (element) {
                /*set the raw gridColumnMarkup to the local variable*/
                gridColumnMarkup = element.html();
                return '<div data-identifier="grid" init-widget data-ng-show="show" title="{{hint}}" class="app-grid"' +
                    $rootScope.getWidgetStyles('shell') + '>' +
                    '<div class="app-datagrid"></div>' +
                    '<div class="table-footer well well-sm clearfix" ng-show="shownavigation || actions.length">' +
                        '<div class="app-datagrid-paginator col-md-6 col-sm-8 col-xs-12">' +
                            '<wm-datanavigator show="{{show && shownavigation}}" showrecordcount="{{show && showrecordcount}}">' +
                            '</wm-datanavigator>' +
                        '</div>' +
                        '<div class="app-datagrid-actions col-md-6 col-sm-4 col-xs-12">' +
                            '<wm-button ng-repeat="btn in actions" caption="{{btn.label}}" show="{{btn.show}}" class="btn-sm {{btn.class}}" ' +
                            'iconname="{{btn.icon}}" on-click="{{btn.action}}"></wm-button>' +
                        '</div>' +
                    '</div></div>';
            },
            'compile': function (tElement, tAttr) {
                var contextEl = tElement.context,
                    showHeader;
                /*Backward compatibility to support "gridnoheader".*/
                if (tAttr.gridnoheader) {
                    contextEl.removeAttribute('gridnoheader');
                    if (!tAttr.showheader) {
                        showHeader = !(tAttr.gridnoheader === 'true' || tAttr.gridnoheader === true);
                        delete tAttr.gridnoheader;
                        tAttr.showheader = showHeader;
                        contextEl.setAttribute('showheader', showHeader);
                    }
                }
                /*Backward compatibility to support "readonlygrid".*/
                if (WM.isUndefined(tAttr.readonlygrid)) {
                    tAttr.readonlygrid = false;
                    contextEl.setAttribute('readonlygrid', false);
                    readOnlyGridAttrUpdated = true;
                }

                /*set the raw gridColumnMarkup to the grid attribute*/
                tAttr.gridColumnMarkup = gridColumnMarkup;
                /* in run mode there is separate controller for grid widget but not in studio mode, to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttr.name + 'Controller'] = WM.noop;
                }
                return {
                    'pre': function (scope, element) {
                        scope.widgetProps = WM.copy(widgetProps);
                        /*Set the "allowPageable" flag in the scope to indicate that the grid accepts Pageable objects.*/
                        scope.allowPageable = true;

                        /*This is to make the "Variables" & "Widgets" available in the Grid scope.
                         * and "Variables", "Widgets" will not be available in that scope.
                         * element.scope() might refer to the controller scope/parent scope.*/
                        var elScope = element.scope();
                        scope.Variables = elScope.Variables;
                        scope.Widgets = elScope.Widgets;


                        Object.defineProperty(scope, 'selecteditem', {
                            configurable: true
                        });
                    },
                    'post': function (scope, element, attrs) {
                        scope.gridElement = element;
                        scope.displayAllFields = attrs.displayall === '';
                        scope.datagridElement = element.find('.app-datagrid');
                        var handlers = [], gridController;

                        scope.$on('$destroy', function () {
                            handlers.forEach(Utils.triggerFn);
                        });

                        WM.element(element).css({'position': 'relative'});
                        /*being done to trigger watch on the dataset property for first time if property is not defined(only for a simple grid not inside a live-grid)*/
                        if (scope.dataset === undefined && attrs.identifier !== 'grid') {
                            scope.watchVariableDataSet('', element);
                        }

                        /*
                         * Extend the properties from the grid controller exposed to end user in page script
                         * Kept in try/catch as the controller may not be available sometimes
                         */
                        if (CONSTANTS.isRunMode) {
                            try {
                                gridController = scope.name + 'Controller';
                                $controller(gridController, {$scope: scope});
                            } catch (ignore) {
                            }
                        }

                        scope.actions = [];

                        /* Event to update "insertrow", "updaterow" and "deleterow" properties based on "readonlygrid" value.
                         * NOTE: This is not handled in propertyChangeHandler because we have to update these properties only
                         * when user explicitly clicks readonlygrid checkbox. */
                        handlers.push($rootScope.$on('grid-action-properties-modified', function (event, readonlygrid) {
                            scope.deleterow = !readonlygrid;
                            scope.updaterow = !readonlygrid;
                            scope.insertrow = !readonlygrid;
                            $rootScope.$emit('set-markup-attr', scope.widgetid, {
                                'insertrow': scope.insertrow,
                                'updaterow': scope.updaterow,
                                'deleterow': scope.deleterow
                            });
                        }));

                        /* event emitted on building new markup from canvasDom */
                        handlers.push($rootScope.$on('compile-grid-columns', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if (scope.$id === scopeId) {
                                scope.fullFieldDefs = [];
                                scope.fieldDefs = [];

                                $compile(markup)(scope);
                                /*TODO: Check if grid options can be passed.*/
                                /*Invoke the function to render the operation columns.*/
                                scope.renderOperationColumns();
                                scope.setDataGridOption('colDefs', WM.copy(scope.fieldDefs));
                            }
                        }));
                        /* event emitted whenever grid actions are modified */
                        handlers.push($rootScope.$on('compile-grid-actions', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if (scope.$id === scopeId) {
                                scope.actions = [];
                                $compile(markup)(scope);
                            }
                        }));

                        /* compile all the markup tags inside the grid, resulting into setting the fieldDefs*/
                        $compile(attrs.gridColumnMarkup)(scope);

                        scope.datagridElement.datagrid(scope.gridOptions);

                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal, oldVal) {
                            /*Monitoring changes for styles or properties and accordingly handling respective changes.*/
                            switch (key) {
                            case 'width':
                                scope.datagridElement.datagrid('setGridDimensions', 'width', newVal);
                                break;
                            case 'height':
                                scope.datagridElement.datagrid('setGridDimensions', 'height', newVal);
                                break;
                            case 'gridfirstrowselect':
                                scope.setDataGridOption('selectFirstRow', newVal);
                                break;
                            case 'deleterow':
                                scope.renderOperationColumns();
                                scope.setDataGridOption('colDefs', WM.copy(scope.fieldDefs));
                                if (CONSTANTS.isStudioMode) {
                                    scope.widgetProps.confirmdelete.show = newVal;
                                    scope.widgetProps.deletemessage.show = newVal;
                                }
                                break;
                            case 'updaterow':
                                scope.renderOperationColumns();
                                scope.setDataGridOption('colDefs', WM.copy(scope.fieldDefs));
                                break;
                            case 'dataset':
                                scope.watchVariableDataSet(newVal, element);
                                break;
                            case 'showheader':
                                scope.setDataGridOption('showHeader', newVal);
                                break;
                            case 'gridsearch':
                                scope.setDataGridOption('enableSearch', newVal);
                                if (CONSTANTS.isStudioMode) {
                                    scope.widgetProps.searchlabel.show = newVal;
                                }
                                break;
                            case 'searchlabel':
                                scope.setDataGridOption('searchLabel', newVal);
                                break;
                            case 'multiselect':
                                if (CONSTANTS.isStudioMode && newVal) {
                                    scope.radioselect = false;
                                    scope.$root.$emit('set-markup-attr', scope.widgetid, {'radioselect': false});
                                }
                                scope.setDataGridOption('multiselect', newVal);
                                break;
                            case 'radioselect':
                                if (CONSTANTS.isStudioMode && newVal) {
                                    scope.multiselect = false;
                                    scope.$root.$emit('set-markup-attr', scope.widgetid, {'multiselect': false});
                                }
                                scope.setDataGridOption('showRadioColumn', newVal);
                                break;
                            case 'showrowindex':
                                scope.setDataGridOption('showRowIndex', newVal);
                                break;
                            case 'enablesort':
                                scope.setDataGridOption('enableSort', newVal);
                                break;
                            case 'shownavigation':
                                scope.enablePageNavigation();
                                /*Check for sanity*/
                                if (CONSTANTS.isStudioMode) {
                                    scope.widgetProps.showrecordcount.show = newVal;
                                }
                                break;
                            case 'insertrow':
                                scope.insertrow = (newVal === true || newVal === 'true');
                                var addNewRowButtonIndex = getObjectIndexInArray('key', 'addNewRow', scope.actions);
                                if (scope.insertrow) {
                                    // Add button definition to actions if it does not already exist.
                                    if (addNewRowButtonIndex === -1) {
                                        scope.actions.unshift({
                                            'key': 'addNewRow',
                                            'label': 'New',
                                            'value': 'new',
                                            'icon': 'new',
                                            'show': true,
                                            'class': 'btn-primary',
                                            'action': 'addNewRow()'
                                        });
                                    }
                                } else {
                                    if (scope.actions.length && addNewRowButtonIndex !== -1) {
                                        scope.actions.splice(addNewRowButtonIndex, 1);
                                    }
                                }
                                if (CONSTANTS.isStudioMode) {
                                    var actionsObj = {
                                        type: 'GRID',
                                        widgetName: scope.name,
                                        scopeId: scope.$id,
                                        buttonDefs: scope.actions
                                    };
                                    $rootScope.$emit('grid-defs-modified', actionsObj);
                                }
                                break;
                            case 'show':
                                /* handle show/hide events based on show property change */
                                if (newVal) {
                                    scope.onShow();
                                } else {
                                    scope.onHide();
                                }
                                break;
                            case 'readonlygrid':
                                /* For backward compatibility, if "readonlygrid" attribute is not there,
                                 * add it to the markup and save. Also set related properties - insertrow,
                                 * updaterow and deleterow to whatever their value is.
                                 * */
                                if (readOnlyGridAttrUpdated) {
                                    scope.insertrow = WM.isDefined(scope.insertrow) ? scope.insertrow : false;
                                    scope.updaterow = WM.isDefined(scope.updaterow) ? scope.updaterow : false;
                                    scope.deleterow = WM.isDefined(scope.deleterow) ? scope.deleterow : false;
                                    if (CONSTANTS.isStudioMode) {
                                        $rootScope.$emit('set-markup-attr', scope.widgetid, {
                                            'readonlygrid': false,
                                            'insertrow': scope.insertrow,
                                            'updaterow': scope.updaterow,
                                            'deleterow': scope.deleterow
                                        });
                                        $rootScope.$emit('save-workspace', undefined, true);
                                    }
                                    readOnlyGridAttrUpdated = undefined;
                                }
                                if (CONSTANTS.isStudioMode) {
                                    scope.widgetProps.deleterow.show = !newVal;
                                    scope.widgetProps.updaterow.show = !newVal;
                                    scope.widgetProps.insertrow.show = !newVal;
                                }
                                break;
                            case 'gridcaption':
                                scope.setDataGridOption('caption', newVal);
                                break;
                            case 'gridclass':
                                scope.datagridElement.datagrid('option', 'cssClassNames.grid', newVal);
                                break;
                            case 'nodatamessage':
                                scope.datagridElement.datagrid('option', 'dataStates.nodata', newVal);
                                break;
                            }
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                        /*Register a watch on the "bindDataSet" property so that whenever the dataSet binding is changed,
                        * the "dataNavigatorWatched" value is reset.*/
                        handlers.push(scope.$watch('binddataset', function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                scope.dataNavigatorWatched = false;
                            }
                        }));

                        Object.defineProperty(scope, 'selecteditem', {
                            get: function () {
                                var selectedRows = scope.datagridElement.datagrid('getSelectedRows');
                                if (selectedRows && selectedRows.length === 1) {
                                    return selectedRows[0];
                                }
                                return selectedRows;
                            }
                        });

                        if (CONSTANTS.isRunMode) {
                            handlers.push(scope.$watch('scopedataset', function (newVal) {
                                if (newVal && !scope.dataset) {
                                    /* decide new column defs required based on existing column defs for the grid */
                                    scope.newcolumns = !scope.columnDefsExists();
                                    scope.createGridColumns(newVal);
                                }
                            }));
                        }

                        $timeout(function () {
                            scope.dataNavigator = element.find('[data-identifier=datanavigator]').isolateScope();
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }, 0, false);
                    }
                };
            }
        };
    }])
    .controller("gridController", [
        "$rootScope",
        "$scope",
        "$timeout",
        "$element",
        "$compile",
        "Variables",
        "CONSTANTS",
        "Utils",
        "dateFilter",
        "wmToaster",
        "$servicevariable",
        function ($rootScope, $scope, $timeout, $element, $compile, Variables, CONSTANTS, Utils, dateFilter, wmToaster, $servicevariable) {
            'use strict';
            var columnObj = {
                    rowOperationsColumn: {
                        'field': 'rowOperations',
                        'type': 'custom',
                        'displayName': 'Actions',
                        'width': '80px',
                        'readonly': true,
                        'sortable': false,
                        'searchable': false,
                        'resizable': false,
                        'selectable': false,
                        'operations': [],
                        'opConfig': {}
                    }
                },
                rowOperations = {
                    'update': {
                        'config': {
                            'label': 'Update',
                            'value': 'update'
                        },
                        'property': 'updaterow'
                    },
                    'delete': {
                        'config': {
                            'label': 'Delete',
                            'value': 'delete'
                        },
                        'property': 'deleterow'
                    }
                },
                currentSearch,
                isBoundToLiveVariable,
                isBoundToLiveVariableRoot,
                isBoundToServiceVariable,
                navigatorResultWatch,
                navigatorMaxResultWatch,
            /*function to transform the service data to grid acceptable data*/
                transformData = function (dataObject, variableName) {
                    var newObj,
                        tempArr,
                        keys,
                        oldKeys,
                        numKeys,
                        newObject,
                        tempObj;

                    /*data sanity testing*/
                    dataObject = dataObject || [];

                    /*if the dataObject is not an array make it an array*/
                    if (!WM.isArray(dataObject)) {
                        /*if the data returned is of type string, make it an object inside an array*/
                        if (WM.isString(dataObject)) {
                            keys = variableName.substring(variableName.indexOf(".") + 1, variableName.length).split(".");
                            oldKeys = [];
                            numKeys = keys.length;
                            newObject = {};
                            tempObj = newObject;

                            /* loop over the keys to form appropriate data object required for grid */
                            WM.forEach(keys, function (key, index) {
                                /* loop over old keys to create new object at the iterative level*/
                                WM.forEach(oldKeys, function (oldKey) {
                                    tempObj = newObject[oldKey];
                                });
                                tempObj[key] = index === numKeys - 1 ? dataObject : {};
                                oldKeys.push(key);
                            });

                            /* change the string data to the new dataObject formed*/
                            dataObject = newObject;
                        }
                        dataObject = [dataObject];
                    } else {
                        /*if the dataObject is an array and each value is a string, then lite-transform the string to an object
                         * lite-transform: just checking if the first value is string and then transforming the object, instead of traversing through the whole array
                         * */
                        if (WM.isString(dataObject[0])) {
                            tempArr = [];
                            WM.forEach(dataObject, function (str) {
                                newObj = {};
                                newObj[variableName.split('.').join('-')] = str;
                                tempArr.push(newObj);
                            });
                            dataObject = tempArr;
                        }
                    }
                    return dataObject;
                },
            /* Function to populate the grid with data. */
                populateGridData = function (serviceData) {
                    var dataValid,
                        variableName,
                        gridElement,
                        parent;

                    if ($scope.binddataset) {
                        variableName = $scope.binddataset.substr($scope.binddataset.lastIndexOf("bind:Variables.") + 15);

                        /* Retrieve the variable details specific to the project in the root-scope */
                        /* As this event is registered on rootscope, it is triggered on destroy hence the object.keys length check is put skip
                         cases when the project object doesn't have variables */
                        $scope.gridVariable = serviceData;
                        if ($scope.gridVariable && $scope.gridVariable.propertiesMap) {
                            $scope.serverData = $scope.gridVariable.data;
                        }
                        if ($scope.gridVariable.propertiesMap) {
                            dataValid = $scope.serverData && !$scope.serverData.error;
                            /* if data exists and data is not error type, and data type is object then change it to array of data*/
                            if (dataValid && !WM.isArray($scope.serverData)) {
                                $scope.serverData = [$scope.serverData];
                            }
                        } else {
                            /*Transform the data if it is a object*/
                            serviceData = transformData(serviceData, variableName);
                            $scope.serverData = serviceData;
                        }

                        /*Function to remove the empty data*/
                        $scope.serverData = serviceData;

                        /*check if new column defs required*/
                        if ($scope.columnDefsExists() && !$scope.newDefsRequired) {
                            setGridData($scope.serverData);
                        } else if (CONSTANTS.isRunMode) {
                            $scope.newcolumns = true;
                            $scope.newDefsRequired = true;
                            $scope.createGridColumns($scope.serverData);
                        }
                    } else {
                        /*Allowing when the data is directly given to the dataset*/
                        $scope.serverData = serviceData;
                        setGridData($scope.serverData);
                    }

                    /* If grid is inside a hidden tab/accordian panel, set that panel's initialized flag to false to rerender grid on panel's focus */
                    gridElement = WM.element('[data-identifier="grid"][name="' + $scope.name + '"]');
                    if (gridElement.length && !gridElement[0].getBoundingClientRect().height) {
                        parent = gridElement.closest('.app-accordion-panel, .tab-pane').isolateScope();
                        if (parent) {
                            parent.initialized = false;
                        }
                    }
                },
                searchGrid = function (searchObj) {

                    var filterFields;

                    /*Set the filter fields based on the search options entered.*/
                    filterFields = {};
                    /*Set the filter options only when a field/column has been selected.*/
                    if (searchObj.field) {
                        currentSearch = searchObj;
                        filterFields[searchObj.field] = {
                            'value': searchObj.value
                        };
                    }

                    Variables.call('getData', $scope.variableName, {
                        "type": "wm.LiveVariable",
                        "isNotTriggerForRelated": true,
                        "page": 1,
                        "filterFields": filterFields,
                        "matchMode": 'anywhere',
                        "ignoreCase": true,
                        "scope": $scope.gridElement.scope()
                    }, function (data, propertiesMap, relatedData, pagingOptions) {
                        $scope.serverData = data;
                        /*Check for sanity*/
                        if ($scope.dataNavigator) {
                            $scope.dataNavigator.dataset = {
                                "data": data,
                                "propertiesMap": propertiesMap,
                                "relatedData": relatedData,
                                "pagingOptions": pagingOptions,
                                "filterFields": filterFields
                            };

                            /*If the current page does not contain any records due to deletion, then navigate to the previous page.*/
                            if ($scope.dataNavigator.pageCount < $scope.dataNavigator.currentPage) {
                                $scope.dataNavigator.navigatePage('prev');
                            }
                        }
                        setGridData($scope.serverData);

                    }, function (error) {
                        wmToaster.show('error', 'ERROR', 'No results found.');
                        setGridData([]);
                    });
                },
                sortHandler = function (sortObj, e) {
                    var filterFields,
                        sortOptions = sortObj.field + ',' + sortObj.direction;
                    /* Update the sort info for passing to datagrid */
                    $scope.gridOptions.sortInfo.field = sortObj.field;
                    $scope.gridOptions.sortInfo.direction = sortObj.direction;

                    if (sortObj.direction) {
                        $scope.sortInfo = WM.copy(sortObj);
                        if ($scope.gridsearch && currentSearch) {
                            /*Set the filter fields based on the search options entered.*/
                            filterFields = {};
                            /*Set the filter options only when a field/column has been selected.*/
                            if (currentSearch.field) {
                                filterFields[currentSearch.field] = {
                                    'value': currentSearch.value,
                                    'type': currentSearch.type
                                };
                            }
                        }

                        Variables.call('getData', $scope.variableName, {
                            'type': 'wm.LiveVariable',
                            'isNotTriggerForRelated': true,
                            'page': 1,
                            'filterFields': filterFields,
                            'orderBy': sortOptions,
                            'matchMode': 'anywhere',
                            'ignoreCase': true,
                            'scope': $scope.gridElement.scope()
                        }, function (data, propertiesMap, relatedData, pagingOptions) {
                            /*Navigate to the first page upon sorting.*/
                            $scope.dataNavigator.navigatePage("first");
                            $scope.serverData = data;
                            /*Check for sanity*/
                            if ($scope.dataNavigator) {
                                $scope.dataNavigator.dataset = {
                                    'data': data,
                                    'propertiesMap': propertiesMap,
                                    'relatedData': relatedData,
                                    'pagingOptions': pagingOptions,
                                    'filterFields': filterFields,
                                    'sortOptions': sortOptions
                                };

                                /*If the current page does not contain any records due to deletion, then navigate to the previous page.*/
                                if ($scope.dataNavigator.pageCount < $scope.dataNavigator.currentPage) {
                                    $scope.dataNavigator.navigatePage('prev');
                                }
                            }
                            setGridData($scope.serverData);

                        }, function (error) {
                            wmToaster.show('error', 'ERROR', error);
                        });
                    }
                    $scope.onSort({$event: e, $data: $scope.serverData});
                },
                getCompiledTemplate = function (htm, row, colDef) {
                    var isolateScope = $scope.$new();
                    isolateScope.row = row;
                    isolateScope.row.getProperty = function (field) {
                        return row[field];
                    };
                    isolateScope.colDef = colDef;
                    isolateScope.col = row[colDef.field];
                    return $compile(htm)(isolateScope);
                },
                /* Check whether it is non-empty row. */
                isEmptyRecord = function (record) {
                    var properties = Object.keys(record),
                        data,
                        isDisplayed;

                    return properties.every(function (prop, index) {
                        data = record[prop];
                        /* If fieldDefs are missing, show all columns in data. */
                        isDisplayed = ($scope.fieldDefs.length && WM.isDefined($scope.fieldDefs[index]) && (CONSTANTS.isMobile ?
                            $scope.fieldDefs[index].mobileDisplay : $scope.fieldDefs[index].pcDisplay)) ||
                            true;
                        /*Validating only the displayed fields*/
                        if (isDisplayed) {
                            return (data === null || data === undefined || data === '');
                        }
                        return true;
                    });
                },
                /* Function to remove the empty data. */
                removeEmptyRecords = function (serviceData) {
                    var allRecords = serviceData.data || serviceData,
                        filteredData = [];
                    if (allRecords && allRecords.length) {
                        /*Comparing and pushing the non-empty data columns*/
                        filteredData = allRecords.filter(function (record) {
                            return record && !isEmptyRecord(record);
                        });
                    }
                    return filteredData;
                },
                setGridData = function (serverData) {
                    var data = serverData;
                    /*If serverData has data but is undefined, then return*/
                    if (isBoundToLiveVariableRoot || WM.isDefined(serverData.propertiesMap)) {
                        if (!serverData.data || Utils.isEmptyObject(serverData.data)) {
                            return;
                        }
                        data = serverData.data;
                    }
                    $scope.gridData = removeEmptyRecords(data);
                    if ($scope.gridData && $scope.gridData.length === 0) {
                        $scope.datagridElement.datagrid('setStatus', 'nodata', $scope.nodatamessage);
                    } else {
                        $scope.datagridElement.datagrid('setStatus', 'ready');
                    }
                },
                onRecordDelete = function () {
                    /*Check for sanity*/
                    if ($scope.dataNavigator) {
                        $scope.dataNavigator.dataSize -= 1;
                        $scope.dataNavigator.calculatePagingValues();
                        /*If the current page does not contain any records due to deletion, then navigate to the previous page.*/
                        if ($scope.dataNavigator.pageCount < $scope.dataNavigator.currentPage) {
                            $scope.dataNavigator.navigatePage('prev');
                        } else {
                            $scope.dataNavigator.navigatePage();
                        }
                    } else {
                        Variables.call('getData', $scope.variableName, {
                            'type': 'wm.LiveVariable',
                            'isNotTriggerForRelated': true,
                            'page': $scope.dataNavigator ? $scope.dataNavigator.currentPage : 1,
                            'scope': $scope.gridElement.scope()
                        }, function (data) {
                            $scope.serverData = data;
                            setGridData($scope.serverData);
                        }, function (error) {
                            wmToaster.show('error', 'ERROR', error);
                        });
                    }
                },
                deleteRecord = function (row, cancelRowDeleteCallback) {
                    if ($scope.gridVariable.propertiesMap.tableType === "VIEW") {
                        wmToaster.show('info', 'Not Editable', 'Table of type view, not editable');
                        $scope.$root.$safeApply($scope);
                        return;
                    }
                    /* delete if user confirm to delete*/
                    if (confirm($scope.confirmdelete)) {

                        Variables.call("deleteRecord", $scope.variableName, {
                            "row": row,
                            "transform": true,
                            "scope": $scope.gridElement.scope()
                        }, function (success) {
                            /* check the response whether the data successfully deleted or not , if any error occurred show the
                             * corresponding error , other wise remove the row from grid */
                            if (success && success.error) {
                                wmToaster.show("error", "ERROR", success.error);
                                return;
                            }
                            /*Emit on row delete to handle any events listening to the delete action*/
                            $scope.$emit('on-row-delete', row);

                            onRecordDelete();

                            wmToaster.show("success", "SUCCESS", $scope.deletemessage);
                            /*custom EventHandler for row deleted event*/
                            $scope.onRowdeleted({$data: row});

                        }, function (error) {
                            wmToaster.show("error", "ERROR", error);
                        });
                    } else {
                        if (cancelRowDeleteCallback) {
                            cancelRowDeleteCallback();
                        }
                    }
                },
                insertRecord = function (rowData) {
                    /*TODO To be uncommented after onRowinsert gets the right value i.e., onRowinsert should have the value defined from the widget events.*/
                    /*if (WM.isDefined($scope.onRowinsert)) {
                        $scope.onRowinsert(rowData);
                        return;
                    }*/

                    var variable = $scope.gridElement.scope().Variables[$scope.variableName];

                    Variables.call("insertRecord", $scope.variableName, {
                        "row": rowData,
                        "transform": true,
                        "scope": $scope.gridElement.scope()
                    }, function (response) {
                        /*Display appropriate error message in case of error.*/
                        if (response.error) {
                            wmToaster.show('error', 'ERROR', response.error);
                        } else {
                            wmToaster.show('success', 'SUCCESS', 'Record added successfully');
                            $scope.initiateHighlightRow('last', response, $scope.primaryKey);
                        }
                    }, function (error) {
                        wmToaster.show('error', 'ERROR', error);
                    });
                },
                updateRecord = function (rowData, prevData) {
                    /*TODO To be uncommented after onRowupdated gets the right value i.e., onRowupdated should have the value defined from the widget events.*/
                    /*if (WM.isDefined($scope.onRowupdated)) {
                        $scope.onRowupdated(rowData);
                        return;
                    }*/
                    var variable = $scope.gridElement.scope().Variables[$scope.variableName];

                    Variables.call("updateRecord", $scope.variableName, {
                        "row": rowData,
                        "transform": true,
                        "prevData": prevData,
                        "scope": $scope.gridElement.scope()
                    }, function (response) {
                        /*Display appropriate error message in case of error.*/
                        if (response.error) {
                            /*disable readonly and show the appropriate error*/
                            wmToaster.show('error', 'ERROR', response.error);
                        } else {
                            $scope.operationType = "";
                            wmToaster.show('success', 'SUCCESS', 'Record updated successfully');
                            $scope.initiateHighlightRow('current', response, $scope.primaryKey);
                        }
                    }, function (error) {
                        wmToaster.show('error', 'ERROR', error);
                    });
                },
            /*Function to remove the column containing row operations.*/
                removeOperationColumns = function () {
                    var lastColumn = $scope.fieldDefs[$scope.fieldDefs.length - 1];
                    if (lastColumn.type === 'custom' && lastColumn.field === 'rowOperations') {
                        $scope.fieldDefs.pop();
                    }
                },
            /*Function to fetch the reference variable details when a grid2 is bound to another grid1 and grid1 is bound to a variable.*/
                fetchReferenceDetails = function () {
                    var bindDataSetSplit,
                        referenceWidgetName,
                        referenceWidget,
                        referenceBindDataSet,
                        referenceVariableName,
                        relatedFieldName,
                        referenceVariable;

                    bindDataSetSplit = $scope.binddataset.split(".");
                    relatedFieldName = bindDataSetSplit[3];

                    referenceWidgetName = bindDataSetSplit[1];
                    referenceWidget = $scope.Widgets[referenceWidgetName];
                    referenceBindDataSet = referenceWidget.binddataset;

                    /*the binddataset comes as bind:Variables.VariableName.dataset.someOther*/
                    referenceVariableName = referenceBindDataSet.replace("bind:Variables.", "");
                    referenceVariableName = referenceVariableName.substr(0, referenceVariableName.indexOf("."));

                    referenceVariable = Variables.getVariableByName(referenceVariableName);
                    return {
                        'referenceVariableName': referenceVariableName,
                        'relatedFieldName': relatedFieldName,
                        'referenceWidget': referenceWidget,
                        'referenceVariable': referenceVariable
                    };
                };
            /* Function to reset the column definitions dynamically. */
            $scope.resetColumnDefinitions = function () {
                $scope.fieldDefs = [];
                $scope.setDataGridOption('colDefs', WM.copy($scope.fieldDefs));
            };

            /*Function to render the column containing row operations.*/
            $scope.renderOperationColumns = function () {

                /*Return if no fieldDefs are present.*/
                if (!$scope.fieldDefs.length) {
                    return;
                }
                /*Invoke the function to remove the column containing row operations.*/
                removeOperationColumns();

                var opConfig = {},
                    operations = [];
                /*Loop through the "rowOperations"*/
                WM.forEach(rowOperations, function (field, fieldName) {
                    /* Add it to operations only if the corresponding property is enabled.*/
                    if ($scope[field.property]) {
                        opConfig[fieldName] = rowOperations[fieldName].config;
                        operations.push(fieldName);
                    }
                });

                /*Add the column for row operations only if at-least one operation has been enabled.*/
                if (operations.length) {
                    columnObj.rowOperationsColumn.operations = operations;
                    columnObj.rowOperationsColumn.opConfig = opConfig;
                    $scope.fieldDefs.push(columnObj.rowOperationsColumn);
                }
            };

            $scope.fieldDefs = [];
            $scope.fullFieldDefs = [];
            /* This is the array which contains all the selected items */
            $scope.selectedItems = [];

            $scope.$watch('gridData', function (newValue, oldValue) {
                if (WM.isDefined(newValue)) {
                    /*Setting the serial no's only when show navigation is enabled and data navigator is compiled
                     and its current page is set properly*/
                    if ($scope.shownavigation && $scope.dataNavigator && $scope.dataNavigator.currentPage) {
                        var startRowIndex = (($scope.dataNavigator.currentPage - 1) * $scope.dataNavigator.maxResults) + 1;
                        $scope.setDataGridOption('startRowIndex', startRowIndex);
                    }
                    /* If colDefs are available, but not already set on the datagrid, then set them.
                     * This will happen while switching from markup to design tab. */
                    var gridOptions = $scope.datagridElement.datagrid('getOptions');
                    if (!gridOptions.colDefs.length && $scope.fieldDefs.length) {
                        $scope.setDataGridOption('colDefs', WM.copy($scope.fieldDefs));
                    }
                    $scope.setDataGridOption('data', newValue);
                }
            });

            $scope.addNewRow = function () {
                var shouldInsert = $scope.onBeforerowinsert();
                if (WM.isUndefined(shouldInsert) || shouldInsert) {
                    $scope.datagridElement.datagrid('addNewRow');
                    $scope.$emit('add-new-row');
                    $rootScope.$safeApply($scope);
                }
            };

            $scope.gridOptions = {
                data: [],
                colDefs: $scope.fieldDefs,
                startRowIndex: 1,
                onRowSelect: function (rowData, e) {
                    $scope.selectedItems = $scope.datagridElement.datagrid('getSelectedRows');
                    $scope.onSelect({$data: rowData, $event: e});
                    $scope.onRowclick({$data: rowData, $event: e});
                    // For backward compatibility.
                    if (WM.isDefined($scope.onClick)) {
                        $scope.onClick({$data: rowData, $event: e});
                    }
                    $rootScope.$safeApply($scope);
                },
                onRowDeselect: function (rowData, e) {
                    $scope.selectedItems = $scope.datagridElement.datagrid('getSelectedRows');
                    $scope.onDeselect({$data: rowData, $event: e});
                    $rootScope.$safeApply($scope);
                },
                onColumnSelect: function (col, e) {
                    $scope.selectedColumns = $scope.datagridElement.datagrid('getSelectedColumns');
                    $scope.onColumnselect({$data: col, $event: e});
                    $rootScope.$safeApply($scope);
                },
                onColumnDeselect: function (col, e) {
                    $scope.selectedColumns = $scope.datagridElement.datagrid('getSelectedColumns');
                    $scope.onColumndeselect({$data: col, $event: e});
                    $rootScope.$safeApply($scope);
                },
                onHeaderClick: function (e) {
//                    /* if onSort function is registered invoke it when the column header is clicked */
//                    $scope.onSort({$event: e, $data: e.data.col});
                    $scope.onHeaderclick({$event: e, $data: e.data.col});
                },
                onRowDelete: function (rowData, cancelRowDeleteCallback, e) {
                    deleteRecord(rowData, cancelRowDeleteCallback);
                },
                onRowInsert: function (rowData, e) {
                    insertRecord(rowData);
                },
                beforeRowUpdate: function (rowData, e) {
                    /*TODO: Check why widgetid is undefined here.*/
                    $scope.$emit('update-row', $scope.widgetid, rowData);
                    $scope.prevData = rowData;
                    $rootScope.$safeApply($scope);
                    /*TODO: Bind this event.*/
//                    $scope.beforeRowupdate({$data: rowData, $event: e});
                },
                afterRowUpdate: function (rowData, e) {
                    updateRecord(rowData, $scope.prevData);
                },
                onSetRecord: function (rowData, e) {
                    $scope.onSetrecord({$data: rowData, $event: e});
                },
                allowDeleteRow: true,
                allowInlineEditing: true,
                sortInfo: {
                    'field': '',
                    'direction': ''
                },
                getCompiledTemplate: function (htm, row, colDef) {
                    return getCompiledTemplate(htm, row, colDef);
                }
            };

            $scope.resetPageNavigation = function () {
                /*Check for sanity*/
                if ($scope.dataNavigator) {
                    $scope.dataNavigator.resetPageNavigation();
                }
            };

            /*Function to enable page navigation for the grid.*/
            $scope.enablePageNavigation = function () {
                if ($scope.dataset) {
                    /*Check for sanity*/
                    if ($scope.shownavigation && $scope.dataNavigator) {

                        $scope.dataNavigator.pagingOptions = {
                            maxResults: $scope.pagesize || 5
                        };
                        /*De-register the watch if it is exists */
                        Utils.triggerFn(navigatorResultWatch);
                        $scope.dataNavigator.dataset = $scope.binddataset;
                        if (CONSTANTS.isStudioMode && $scope.variableType === 'wm.ServiceVariable') {
                            return;
                        }
                        /*Register a watch on the "result" property of the "dataNavigator" so that the paginated data is displayed in the live-list.*/
                        navigatorResultWatch = $scope.dataNavigator.$watch('result', function (newVal, oldVal) {
                            /* Check for sanity. */
                            if (WM.isDefined(newVal) && !WM.equals(newVal, oldVal)) {
                                $scope.watchVariableDataSet(newVal, $scope.gridElement);
                            }
                        });
                        /*De-register the watch if it is exists */
                        Utils.triggerFn(navigatorMaxResultWatch);
                        /*Register a watch on the "maxResults" property of the "dataNavigator" so that the "pageSize" is displayed in the live-list.*/
                        navigatorMaxResultWatch = $scope.dataNavigator.$watch('maxResults', function (newVal) {
                            $scope.pagesize = newVal;
                        });

                        $scope.dataNavigatorWatched = true;
                    }
                }
            };

            /*Function to dynamically fetch column definitions.*/
            $scope.fetchDynamicColumnDefs = function () {
                var fields,
                    result;

                /*Invoke the function to fetch the reference variable details when a grid2 is bound to another grid1 and grid1 is bound to a variable.*/
                result = fetchReferenceDetails();
                /*Check for sanity.*/
                if (result.referenceVariable) {
                    /*Invoke the function to fetch sample data-structure for the field.*/
                    fields = $servicevariable.getServiceModel({
                        typeRef: $rootScope.dataTypes[result.referenceVariable.package].fields[result.relatedFieldName].type,
                        variable: result.referenceVariable
                    });
                    $scope.watchVariableDataSet(fields, $scope.gridElement);
                }
            };

            /*Function to dynamically fetch data.*/
            $scope.fetchDynamicData = function () {
                var reference,
                    referenceVariableKey,
                    watchSelectedItem;

                /*Invoke the function to fetch the reference variable details when a grid2 is bound to another grid1 and grid1 is bound to a variable.*/
                reference = fetchReferenceDetails();

                /*Check if a watch is not registered on selectedItem.*/
                if (!$scope.selectedItemWatched) {
                    watchSelectedItem = reference.referenceWidget.$watch('selecteditem', function (newVal, oldVal) {

                        $scope.selectedItemWatched = true;

                        /*Check for sanity of newVal.*/
                        if (newVal && !WM.equals(newVal, oldVal)) {
                            /*Check if "referenceVariableKey" has already been computed.*/
                            if (!referenceVariableKey) {
                                /*Invoke the function to get the primary key.*/
                                referenceVariableKey = Variables.getVariableByName(reference.referenceVariableName).getPrimaryKey();

                                /*If the there is a single primary key, fetch the first element of the array.*/
                                if (referenceVariableKey.length === 1) {
                                    referenceVariableKey = referenceVariableKey[0];
                                }

                                /*De-register the watch on selected item.*/
                                watchSelectedItem();

                                /*Register a watch on the primary key field of the selected item.*/
                                reference.referenceWidget.$watch('selecteditem.' + referenceVariableKey, function (newVal) {
                                    /*Check for sanity.*/
                                    if (newVal) {
                                        /*Invoke the function to update the related data of the variable for the specified relatedFieldName.*/
                                        Variables.getVariableByName(reference.referenceVariableName).updateRelatedData({
                                            'id': reference.referenceWidget.selecteditem[referenceVariableKey],
                                            'relatedFieldName': reference.relatedFieldName,
                                            'scope': $scope.gridElement.scope()
                                        }, function (data, propertiesMap, relatedData, pagingOptions) {
                                            /*Check for sanity of data.*/
                                            if (WM.isDefined(data)) {
                                                if (!$scope.dataNavigatorWatched) {
                                                    $scope.dataNavigator.dataset = $scope.binddataset;
                                                }
                                                $scope.watchVariableDataSet(data, $scope.gridElement);
                                            }
                                            /*Check for sanity*/
                                            if ($scope.dataNavigator) {
                                                $scope.dataNavigator.dataset = {
                                                    "data": data,
                                                    "propertiesMap": propertiesMap,
                                                    "relatedData": relatedData,
                                                    "pagingOptions": pagingOptions
                                                };

                                                /*If the current page does not contain any records due to deletion, then navigate to the previous page.*/
                                                if ($scope.dataNavigator.pageCount < $scope.dataNavigator.currentPage) {
                                                    $scope.dataNavigator.navigatePage("prev");
                                                }
                                            }
                                        }, function (error) {
                                            wmToaster.show("error", "ERROR", error);
                                        });
                                    }
                                });
                            }
                        }
                    }, true);
                }
            };

            $scope.isDataValid = function () {
                var error;

                /*In case "data" contains "error" & "errorMessage", then display the error message in the grid.*/
                if ($scope.dataset.error) {
                    error = $scope.dataset.error;
                }
                if ($scope.dataset.data && $scope.dataset.data.error) {
                    if ($scope.dataset.data.errorMessage) {
                        error = $scope.dataset.data.errorMessage;
                    }
                }
                if (error) {
                    setGridData([]);
                    $scope.datagridElement.datagrid('error', error);
                    return false;
                }
                return true;
            };

            $scope.watchVariableDataSet = function (newVal, element) {
                /* TODO: In studio mode, service variable data should initially
                    be empty array, and metadata should be passed separately. */
                var variableName,
                    variableObj,
                    elScope,
                    result,
                    selectedItemIndex;
                $scope.datagridElement.datagrid('setStatus', 'loading');

                result = Utils.getValidJSON(newVal);

                /*Reset the values to undefined so that they are calculated each time.*/
                isBoundToLiveVariable = undefined;
                isBoundToLiveVariableRoot = undefined;
                isBoundToServiceVariable = undefined;
                $scope.gridVariable = '';

                //Converting newval to object if it is an Object that comes as a string "{"data" : 1}"
                if (result) {
                    newVal = result;
                }

                /*Return if data is invalid.*/
                if (!$scope.isDataValid()) {
                    return;
                }

                /*If the data is a pageable object, then display the content.*/
                if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                    newVal = newVal.content;
                }

                if (newVal) {
                    if (!$scope.dataNavigatorWatched) {
                        $scope.enablePageNavigation();
                    }
                } else {
                    $scope.resetPageNavigation();
                    /*for run mode, disabling the loader and showing no data found message if dataset is not valid*/
                    if (CONSTANTS.isRunMode) {
                        $scope.datagridElement.datagrid('setStatus', 'nodata', $scope.nodatamessage);
                        $scope.setDataGridOption('selectFirstRow', $scope.gridfirstrowselect);
                    }
                }
                if ($scope.binddataset) {
                    if ($scope.binddataset.indexOf('bind:Variables.') !== -1) {
                        /*the binddataset comes as bind:Variables.VariableName.dataset.someOther*/
                        variableName = $scope.binddataset.replace('bind:Variables.', '');
                        variableName = variableName.substr(0, variableName.indexOf('.'));
                    }
                    elScope = element.scope();
                    selectedItemIndex = $scope.binddataset.indexOf('selecteditem.');
                    if (selectedItemIndex !== -1) {
                        /*Check for studio mode.*/
                        if (CONSTANTS.isStudioMode) {
                            /*If "newVal" is not available(in studio mode, newVal will be same as bindDataSet with 'bind:' removed; for the first time)
                            , fetch column definitions dynamically.*/
                            if ($scope.binddataset === ('bind:' + newVal)) {
                                $scope.fetchDynamicColumnDefs();
                                return;
                            }
                        } else if (!newVal) { /*In run-mode, if "newVal" is not available, fetch data dynamically.*/
                            $scope.fetchDynamicData();
                        }
                    }

                    /*TODO to remove is studiomode check*/
                    if ($scope.variableName && (variableName !== $scope.variableName) && CONSTANTS.isStudioMode) {
                        $scope.fullFieldDefs = [];
                    }
                    $scope.variableName = variableName;
                    variableObj = elScope.Variables && elScope.Variables[$scope.variableName];

                    if (variableObj) {
                        /* set the variable type info to the grid selecteditem type (for reflection while binding to grid.selecteditem)*/
                        $scope.widgetProps.selecteditem.type = 'object, ' + variableObj.type;
                        $scope.variableType = variableObj.category;

                        /*Check if the variable is a liveVariable*/
                        isBoundToLiveVariable = $scope.variableType === 'wm.LiveVariable';
                        isBoundToLiveVariableRoot = isBoundToLiveVariable && $scope.binddataset.indexOf('dataSet.') === -1;
                        isBoundToServiceVariable = $scope.variableType === 'wm.ServiceVariable';

                        if (isBoundToLiveVariable) {
                            $scope.setDataGridOption('searchHandler', searchGrid);
                            $scope.setDataGridOption('sortHandler', sortHandler);

                            if ($scope.dataset.propertiesMap && $scope.dataset.propertiesMap.columns) {
                                $scope.primaryKey = variableObj.getPrimaryKey();
                                /* check if the tableTYpe is VIEW or TABLE and set readonly prop on grid for VIEW type table */
                                if ($scope.dataset.propertiesMap.tableType === 'VIEW') {
                                    $scope.readonlygrid = true;
                                }
                            }

                            $scope.contentBaseUrl = 'services/' + variableObj.liveSource + '/' + variableObj.type + '/';
                        }
                        /*if the grid is not bound to widgets*/
                    } else if ($scope.binddataset.indexOf('bind:Widgets') === -1) {
                        /*If the variable is deleted hiding the spinner and showing the no data found message*/
                        $scope.datagridElement.datagrid('setStatus', 'error', $scope.nodatamessage);
                    }

                    if (CONSTANTS.isStudioMode) {
                        /*Make the "pageSize" property readonly so that no editing is possible.*/
                        $scope.widgetProps.pagesize.disabled = $scope.variableType === 'wm.LiveVariable';
                    }
                }
                if (!WM.isObject(newVal) || (newVal && newVal.dataValue === '')) {
                    if (newVal === '' || (newVal && newVal.dataValue === '')) {
                        /* clear the grid columnDefs and data in studio */
                        if (CONSTANTS.isStudioMode && $scope.newcolumns) {
                            /* if new columns to be rendered, create new column defs*/
                            $scope.prepareFieldDefs();
                        }
                        /* render empty data in both studio and run modes */
                        setGridData([]);
                    }
                    return;
                }

                if (newVal) {
                    if (CONSTANTS.isStudioMode) {
                        $scope.createGridColumns(isBoundToLiveVariableRoot ? newVal.data : newVal, newVal.propertiesMap || undefined);
                    }
                    populateGridData(newVal);
                    if (isBoundToServiceVariable && CONSTANTS.isStudioMode) {
                        /*Checking if grid is bound to service variable, for which data cannot be loaded in studio mode,
                        in studio mode and if the fieldDefs are generated. */
                        $scope.gridData = [];
                        $scope.datagridElement.datagrid('setStatus', 'error', $rootScope.locale['MESSAGE_GRID_CANNOT_LOAD_DATA_IN_STUDIO']);
                    }
                } else if (CONSTANTS.isStudioMode) {
                    /* Put In case of error while fetching data from provided variable, prepare default fieldDefs
                     * Error cases:
                     * 1. empty variable provided
                     * 2. data not found for provided variable
                     */
                    $scope.datagridElement.datagrid('setStatus', 'nodata', $scope.nodatamessage);
                    $scope.setDataGridOption('selectFirstRow', $scope.gridfirstrowselect);
                    /* if new columns to be rendered, create new column defs*/
                    if ($scope.newcolumns) {
                        $scope.prepareFieldDefs();
                    }
                }
            };
            $scope.createGridColumns = function (data, propertiesMap) {
                /* this call back function receives the data from the variable */
                /* check whether data is valid or not */
                var dataValid = data && !data.error;
                /*if the data is type json object, make it an array of the object*/
                if (dataValid && !WM.isArray(data)) {
                    data = [data];
                }
                /* if new columns to be rendered, prepare default fieldDefs for the data provided*/
                if ($scope.newcolumns) {
                    if (propertiesMap) {
                        /*get current entity name from properties map*/
                        $scope.prepareFieldDefs(data, propertiesMap);
                    } else {
                        $scope.prepareFieldDefs(data);
                    }
                }
                /* Arranging Data for Pagination */
                /* if data exists and data is not error type the render the data on grid using setGridData function */
                if (dataValid) {
                    /*check for nested data if existed*/
                    $scope.serverData = data;
                    setGridData($scope.serverData);
                }
            };

            /* function to prepare fieldDefs for the grid according to data provided */
            $scope.prepareFieldDefs = function (data, propertiesMap) {
                var defaultFieldDefs,
                    properties,
                    columns,
                    gridObj;
                $scope.fieldDefs = [];
                /* if properties map is existed then fetch the column configuration for all nested levels using util function */
                if (propertiesMap) {
                    columns = Utils.fetchPropertiesMapColumns(propertiesMap);
                    properties = [Utils.resetObjectWithEmptyValues(columns)];
                } else {
                    properties = data;
                }
                /*call utility function to prepare fieldDefs for grid against given data (A MAX OF 10 COLUMNS ONLY)*/
                defaultFieldDefs = Utils.prepareFieldDefs(properties, $scope.displayAllFields ? -1 : 10);
                /*append additional properties*/
                WM.forEach(defaultFieldDefs, function (columnDef) {
                    columnDef.pcDisplay = true;
                    columnDef.mobileDisplay = true;
                    WM.forEach($scope.fullFieldDefs, function (column) {
                        if (column.field === columnDef.field) {
                            columnDef.pcDisplay = column.pcDisplay;
                            columnDef.mobileDisplay = column.mobileDisplay;
                            columnDef.customExpression = column.customExpression;
                            columnDef.width = column.width;
                            columnDef.textAlignment = column.textAlignment;
                            columnDef.backgroundColor = column.backgroundColor;
                            columnDef.textColor = column.textColor;
                            columnDef.widgetType = column.widgetType;
                            columnDef.displayName = column.displayName;
                            columnDef.searchPlaceholder = column.searchPlaceholder || (
                                    columnDef.type !== 'date' ? 'Search' : 'Enter date in yyyy-mm-dd'
                                )
                        }
                    });
                    /* if properties map is provided, append the same to column defs*/
                    if (propertiesMap) {
                        columnDef.type = columns[columnDef.field].type;
                        columnDef.primaryKey = columns[columnDef.field].isPrimaryKey;
                        columnDef.generator = columns[columnDef.field].generator;
                        columnDef.readonly = WM.isDefined(columns[columnDef.field].readonly) ?
                                columns[columnDef.field].readonly === "true" : columnDef.generator === 'identity';

                        /*Prevent searching and sorting on non-primary key columns in related tables.*/
                        columnDef.searchable = columnDef.sortable = !(columnDef.field && columnDef.field.indexOf('.') !== -1 && !columnDef.primaryKey);

                        if (columnDef.type === 'blob' && !columnDef.customExpression) {
                            if (columnDef.widgetType === 'image') {
                                columnDef.customExpression = '<img width="48px" height="28px" class="wm-icon wm-icon24 glyphicon glyphicon-file" data-ng-src="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"/>';
                            } else {
                                columnDef.customExpression = '<a ng-if="col != null" class="col-md-9" target="_blank" data-ng-href="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"><i class="wm-icon wm-icon24 glyphicon glyphicon-file"></i></a>';
                            }
                        }
                    }
                });

                /*prepare a copy of fieldDefs prepared
                 (defaultFieldDefs will be passed to markup and fieldDefs are used for grid)
                 (a copy is kept to prevent changes made by ng-grid in the fieldDefs)
                 */
                $scope.fieldDefs = WM.copy(defaultFieldDefs);

                /*push the fieldDefs in respective grid markup*/
                gridObj = {
                    widgetName : $scope.name,
                    fieldDefs: defaultFieldDefs,
                    scopeId: $scope.$id
                };
                $rootScope.$emit('grid-defs-modified', gridObj);
                $scope.setDataGridOption('colDefs', WM.copy($scope.fieldDefs));
            };

            $scope.setDataGridOption = function (optionName, newVal) {
                var option = {};
                if (WM.isDefined(newVal) && !WM.equals(newVal, $scope.gridOptions[optionName])) {
                    option[optionName] = newVal;
                    $scope.datagridElement.datagrid('option', option);
                    $scope.gridOptions[optionName] = newVal;
                }
            };

            $scope.initiateHighlightRow = function (index, row, primaryKey) {
                /*index === "last" indicates that an insert operation has been successfully performed and navigation to the last page is required.
                * Hence increment the "dataSize" by 1.*/
                if (index === 'last') {
                    $scope.dataNavigator.dataSize += 1;
                    /*Update the data in the current page in the grid after insert/update operations.*/
                    if (!$scope.shownavigation) {
                        index = 'current';
                    }
                }
                /*Re-calculate the paging values like pageCount etc that could change due to change in the dataSize.*/
                $scope.dataNavigator.calculatePagingValues();
                $scope.dataNavigator.navigatePage(index, null, true, function () {
                    /*$timeout is used so that by then $scope.dataset has the updated value.
                    * Highlighting of the row is done in the callback of page navigation so that the row that needs to be highlighted actually exists in the grid.*/
                    $timeout(function () {
                        $scope.highlightRow(row, $scope.dataset.data);
                    }, null, false);
                });
            };

            /* highlight the given row */
            $scope.highlightRow = function (result, data) {
                /* server is not updating immediately, so set the server data to success callback data */
                if (data) {
                    $scope.serverData = data;
                }
                $scope.datagridElement.datagrid('selectRow', result, true);
            };

            /* determines if the 'user-defined'(not default) columnDefs exists already for the grid */
            $scope.columnDefsExists = function () {
                var i, n;
                /* override the fieldDefs if user has untouched the columnDefs*/
                for (i = 0, n = $scope.fieldDefs.length; i < n; i = i + 1) {
                    /* if a binding field is found in the fieldDef, user has edited the columnDefs, don't override the columnDefs */
                    if ($scope.fieldDefs[i].field) {
                        return true;
                    }
                }
                /* modified column defs do not exist, return false*/
                return false;
            };

            $scope.deleteRow = function (row) {

                row = row || $scope.selectedItems[0];
                deleteRecord(row);
            };

            $scope.editRow = function (row) {
                row = row || $scope.selectedItems[0];
                $scope.gridOptions.beforeRowUpdate(row);
            };

            $scope.addRow = function () {
                $scope.addNewRow();
            };
        }])

/**
 * @ngdoc directive
 * @name wm.widgets.grid.directive:wmGridColumn
 * @restrict E
 *
 * @description
 * The `wmGridColumn` serves the purpose of providing column definitions to the parent `wmGrid` directive.
 * `wmGridColumn` is internally used by `wmGrid`.
 *
 * @requires $parse
 * @requires Utils
 *
 * @param {string=} caption
 *                  Sets the title of the column.
 * @param {string=} width
 *                  Sets the width of the column
 * @param {boolean=} pcdisplay
 *                  Sets the display property of the column on a pc.
 * @param {boolean=} mobiledisplay
 *                  Sets the display property of the column on a mobile.
 * @param {string=} textcolor
 *                  Sets the color of the text in all the rows of the column.
 * @param {string=} backgroundcolor
 *                  Sets the background color of the column.
 * @param {string=} textalignment
 *                  Sets the alignment of the text in all the rows of the column.
 * @param {string=} binding
 *                  Sets the binding for the column.<br>
 *                  The value provided will be evaluated in the 'dataset' or 'scopedataset' of the parent 'wmGrid' and the data will be displayed in the column.
 *
 * @example
 * <example module="wmCore">
 *     <file name="index.html">
 *         <div data-ng-controller="Ctrl" class="wm-app">
 *             <wm-grid readonlygrid="true" dataset="bind:Variables.gridVariable.dataSet">
 *                 <wm-grid-column binding="deptid" caption="deptid" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="budget" caption="budget" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="location" caption="location" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="q1" caption="q1" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="q2" caption="q2" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="q3" caption="q3" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="name" caption="name" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *                 <wm-grid-column binding="deptcode" caption="deptcode" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
 *             </wm-grid>
 *         </div>
 *     </file>
 *     <file name="script.js">
 *         function Ctrl($scope) {
 *             var deptData = '{"name":"HrdbDepartmentData","type":"Department","isList":true,"owner":"App","editJson":"","isBound":"","dataSet":{"data":[{"deptid":1,"name":"Engineering","budget":1936760,"q1":445455,"q2":522925,"q3":426087,"q4":542293,"deptcode":"Eng","location":"San Francisco","tenantid":1},{"deptid":2,"name":"Marketing","budget":1129777,"q1":225955,"q2":271146,"q3":327635,"q4":305040,"deptcode":"Mktg","location":"New York","tenantid":1},{"deptid":3,"name":"General and Admin","budget":1452570,"q1":435771,"q2":290514,"q3":348617,"q4":377668,"deptcode":"G&A","location":"San Francisco","tenantid":1},{"deptid":4,"name":"Sales","budget":2743744,"q1":493874,"q2":658499,"q3":713373,"q4":877998,"deptcode":"Sales","location":"Austin","tenantid":1},{"deptid":5,"name":"Professional Services","budget":806984,"q1":201746,"q2":201746,"q3":177536,"q4":225955,"deptcode":"PS","location":"San Francisco","tenantid":2}],"propertiesMap":{"columns":[{"fieldName":"deptid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"DEPTID","isPrimaryKey":true,"notNull":true,"length":255,"precision":19,"generator":"identity","isRelated":false,"defaultValue":null},{"fieldName":"name","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"NAME","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"budget","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"BUDGET","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q1","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q1","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q2","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q2","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q3","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q3","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q4","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q4","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"deptcode","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"DEPTCODE","isPrimaryKey":false,"notNull":false,"length":20,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"location","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"LOCATION","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"tenantid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"TENANTID","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null}],"primaryKeys":["deptid"],"entityName":"Department","fullyQualifiedName":"com.hrdb.Department","tableType":"TABLE"},"relatedData":{},"pagingOptions":{"dataSize":5,"maxResults":20}},"dataBinding":{},"saveInPhonegap":false,"firstRow":0,"maxResults":20,"designMaxResults":10,"service":"","operation":"read","operationType":"","startUpdate":true,"autoUpdate":false,"inFlightBehavior":"executeLast","transformationRequired":false,"columnField":"","dataField":"","onCanUpdate":"","onBeforeUpdate":"","onResult":"","onSuccess":"","onError":"","onPrepareSetData":"","liveSource":"hrdb","ignoreCase":false,"matchMode":"start","orderBy":"","category":"wm.LiveVariable","isDefault":true,"_id":"wm-wm.LiveVariable1428412293661","package":"com.hrdb.Department","tableName":"DEPARTMENT","tableType":"TABLE","propertiesMap":{"columns":[{"fieldName":"deptid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"DEPTID","isPrimaryKey":true,"notNull":true,"length":255,"precision":19,"generator":"identity","isRelated":false,"defaultValue":null},{"fieldName":"name","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"NAME","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"budget","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"BUDGET","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q1","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q1","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q2","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q2","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q3","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q3","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q4","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q4","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"deptcode","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"DEPTCODE","isPrimaryKey":false,"notNull":false,"length":20,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"location","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"LOCATION","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"tenantid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"TENANTID","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null}],"primaryKeys":["deptid"],"entityName":"Department","fullyQualifiedName":"com.hrdb.Department","tableType":"TABLE"},"bindCount":1}',
 *                 deptVar = JSON.parse(deptData);
 *             deptVar.getPrimaryKey = function () {return ["deptid"]};
 *             $scope.Variables = {"gridVariable": deptVar};
 *         }
 *     </file>
 * </example>
 */
    .directive('wmGridColumn', ['$parse', 'Utils', function ($parse, Utils) {
        'use strict';

        return {
            'restrict': 'E',
            'scope': true,
            'template': '<div></div>',
            'replace': true,
            'compile': function (tElement) {
                return {
                    'pre': function (scope, element, attrs) {
                        var textAlignment = attrs.textalignment || 'left',
                            backgroundColor = attrs.backgroundcolor || '',
                            textColor = attrs.textcolor || '',
                            width = attrs.width || '',
                            styleDef = 'width: ' + width +
                                '; background-color: ' + backgroundColor +
                                '; color: ' + textColor + ';',
                            columnDef = {
                                'field': attrs.binding,
                                'displayName': attrs.caption,
                                'pcDisplay': (attrs.pcdisplay === "1" || attrs.pcdisplay === "true"),
                                'mobileDisplay': (attrs.mobiledisplay === "1" || attrs.mobiledisplay === "true"),
                                'width': attrs.width || '*',
                                'textAlignment': textAlignment,
                                'backgroundColor': backgroundColor,
                                'textColor': textColor,
                                'type': attrs.type || 'string',
                                'primaryKey': attrs.primaryKey ? $parse(attrs.primaryKey)() : '',
                                'generator': attrs.generator,
                                'widgetType': attrs.widgetType,
                                'style': styleDef,
                                'searchPlaceholder': attrs.searchPlaceholder || (attrs.type !== 'date' ? 'Search' : 'Enter date in yyyy-mm-dd')
                            };

                        if (tElement.context.innerHTML) {
                            columnDef.customExpression = tElement.context.innerHTML;
                        }
                        /*Prevent searching and sorting on non-primary key columns in related tables.*/
                        columnDef.searchable = columnDef.sortable = !(columnDef.field && columnDef.field.indexOf('.') !== -1 && !columnDef.primaryKey);
                        columnDef.readonly = WM.isDefined(attrs.readonly) ? attrs.readonly === "true" : columnDef.generator === 'identity';

                        if (columnDef.type === 'blob' && !columnDef.customExpression) {
                            if (columnDef.widgetType === 'image') {
                                columnDef.customExpression = '<img width="48px" height="28px" class="wm-icon wm-icon24 glyphicon glyphicon-file" data-ng-src="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"/>';
                            } else {
                                columnDef.customExpression = '<a ng-if="col != null" class="col-md-9" target="_blank" data-ng-href="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"><i class="wm-icon wm-icon24 glyphicon glyphicon-file"></i></a>';
                            }
                        }
                        /* push the fieldDef in the object meant to have all fields */
                        scope.$parent.fullFieldDefs.push(columnDef);

                        /* This condition is for:
                         * Mobile/Tablet view in STUDIO mode.
                         * if page is in iFrame, we are in mobile/tablet view in studio mode
                         * hence, check for mobileDisplay flag
                         */
                        if (window.self !== window.top) {
                            if (!columnDef.mobileDisplay) {
                                return;
                            }
                        } else {
                            /* this condition will run for:
                             *  1. PC view in STUDIO mode
                             *  2. Mobile/tablet view in RUN mode
                             */
                            if (Utils.isMobile()) {
                                if (!columnDef.mobileDisplay) {
                                    return;
                                }
                            } else {
                                if (!columnDef.pcDisplay) {
                                    return;
                                }
                            }
                        }
                        /* push the fieldDef in the object meant for actual display in the grid (this will be passed to ng-grid) */
                        scope.$parent.fieldDefs.push(columnDef);
                        element.remove();
                    }
                };
            }
        };
    }])
    .directive('wmGridAction', ['$compile', 'CONSTANTS', function ($compile, CONSTANTS) {
        'use strict';
        return {
            "restrict": 'E',
            "scope": true,
            "replace": true,
            "compile": function () {
                return {
                    "post": function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with grid scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        var parentIsolateScope,
                            buttonDef = {
                                'key': attrs.key || attrs.binding,
                                'label': attrs.label || attrs.caption,
                                'show': (attrs.show === "1" || attrs.show === "true"),
                                'class': attrs.class || '',
                                'icon': attrs.icon,
                                'action': attrs.action,
                                'type': attrs.type || "button"
                            };

                        if (CONSTANTS.isRunMode) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = (element.parent() && element.parent().length > 0) ? element.parent().closest('[data-identifier="grid"]').isolateScope() || scope.$parent : scope.$parent;
                        }
                        parentIsolateScope.actions = parentIsolateScope.actions || [];
                        parentIsolateScope.actions.push(buttonDef);
                    }
                };
            }
        };
    }]);
