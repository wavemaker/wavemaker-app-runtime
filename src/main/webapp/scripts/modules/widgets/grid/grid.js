/*global WM, wmGrid, confirm, window, wm, _, $*/
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
   <example module="wmCore">
       <file name="index.html">
           <div data-ng-controller="Ctrl" class="wm-app" style="height: 100%;">
               <wm-grid  name="grid3" dataset="{{data}}" navigation="Basic" enablesort="false"></wm-grid>
           </div>
       </file>
       <file name="script.js">
           function Ctrl($scope) {
               $scope.data = [{"deptid":1,"name":"Engineering","budget":1936760,"q1":445455,"q2":522925,"q3":426087,"q4":542293,"deptcode":"Eng","location":"San Francisco","tenantid":1},{"deptid":2,"name":"Marketing","budget":1129777,"q1":225955,"q2":271146,"q3":327635,"q4":305040,"deptcode":"Mktg","location":"New York","tenantid":1},{"deptid":3,"name":"General and Admin","budget":1452570,"q1":435771,"q2":290514,"q3":348617,"q4":377668,"deptcode":"G&A","location":"San Francisco","tenantid":1},{"deptid":4,"name":"Sales","budget":2743744,"q1":493874,"q2":658499,"q3":713373,"q4":877998,"deptcode":"Sales","location":"Austin","tenantid":1},{"deptid":5,"name":"Professional Services","budget":806984,"q1":201746,"q2":201746,"q3":177536,"q4":225955,"deptcode":"PS","location":"San Francisco","tenantid":2}];
           }
       </file>
 </example>
 */
WM.module('wm.widgets.grid')
    .directive('wmGrid', ['PropertiesFactory', 'WidgetUtilService', '$compile', '$controller', 'CONSTANTS', '$rootScope', '$timeout', 'Utils', 'LiveWidgetUtils', '$document', 'AppDefaults', function (PropertiesFactory, WidgetUtilService, $compile, $controller, CONSTANTS, $rootScope, $timeout, Utils, LiveWidgetUtils, $document, AppDefaults) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.grid', ['wm.base', 'wm.base.navigation']),
            gridColumnMarkup = '',
            notifyFor = {
                'width'              : true,
                'height'             : true,
                'gridfirstrowselect' : true,
                'deleterow'          : true,
                'updaterow'          : true,
                'dataset'            : true,
                'showheader'         : true,
                'navigation'         : true,
                'insertrow'          : true,
                'show'               : true,
                'gridsearch'         : true,
                'filtermode'         : true,
                'searchlabel'        : true,
                'multiselect'        : true,
                'radioselect'        : true,
                'showrowindex'       : true,
                'enablesort'         : true,
                'gridcaption'        : true,
                'gridclass'          : true,
                'rowngclass'         : CONSTANTS.isStudioMode,
                'rowclass'           : CONSTANTS.isStudioMode,
                'nodatamessage'      : true,
                'loadingdatamsg'     : true,
                'filternullrecords'  : true,
                'spacing'            : true,
                'exportformat'       : true
            },
            getObjectIndexInArray = function (key, value, arr) {
                var index = -1, i;
                for (i = 0; i < arr.length; i++) {
                    if (arr[i][key] === value) {
                        index = i;
                        break;
                    }
                }
                return index;
            },
            gridColumnCount,
            EDIT_MODE = {
                'QUICK_EDIT': 'quickedit',
                'INLINE'    : 'inline',
                'FORM'      : 'form',
                'DIALOG'    : 'dialog'
            };

        return {
            'restrict': 'E',
            'scope'   : {
                'scopedataset'      : '=?',
                'onSelect'          : '&',
                'onDeselect'        : '&',
                'onSort'            : '&',
                'onClick'           : '&',
                'onHeaderclick'     : '&',
                'onShow'            : '&',
                'onHide'            : '&',
                'onRowdeleted'      : '&',
                'onRowupdated'      : '&',
                'onBeforerowinsert' : '&',
                'onRowinsert'       : '&',
                'onRowclick'        : '&',
                'onRowdblclick'     : '&',
                'onColumnselect'    : '&',
                'onColumndeselect'  : '&',
                'onEnterkeypress'   : '&',
                'onSetrecord'       : '&',
                'onBeforerowupdate' : '&',
                'onRowupdate'       : '&',
                'onPaginationchange': '&',
                'onDatarender'      : '&',
                'onTap'             : '&'
            },
            'replace'   : true,
            'transclude': false,
            'controller': 'gridController',
            'template': function (element) {
                /*set the raw gridColumnMarkup to the local variable*/
                gridColumnMarkup = element.html();
                return '<div data-identifier="grid" init-widget class="app-grid app-panel panel" apply-styles="shell">' +
                    '<div class="panel-heading" ng-if="title || subheading || iconclass || exportOptions.length || _actions.header.length">' +
                        '<h3 class="panel-title">' +
                            '<div class="pull-left"><i class="app-icon panel-icon {{iconclass}}" data-ng-show="iconclass"></i></div>' +
                            '<div class="pull-left">' +
                                '<div class="heading">{{title}}</div>' +
                                '<div class="description">{{subheading}}</div>' +
                            '</div>' +
                            '<div class="panel-actions app-datagrid-actions" ng-if="exportOptions.length || _actions.header.length">' +
                                '<wm-button ng-repeat="btn in _actions.header" caption="{{btn.displayName}}" show="{{btn.show}}" class="{{btn.class}}" ng-class="{\'btn-sm\': spacing === \'condensed\'}" iconclass="{{btn.iconclass}}" disabled="{{btn.key === \'addNewRow\' && isGridEditMode}}"' +
                                 ' on-click="{{btn.action}}" type="button" shortcutkey="{{btn.shortcutkey}} tabindex="{{btn.tabindex}}" hint="{{btn.title}}"></wm-button>' +
                                '<wm-menu caption="Export" ng-if="exportOptions.length" name="{{::name}}-export" scopedataset="exportOptions" on-select="export($item)" menuposition="down,left"></wm-menu>' +
                            '</div>' +
                        '</h3>' +
                    '</div>' +
                    '<div class="app-datagrid"></div>' +
                    '<div class="panel-footer clearfix" ng-show="shownavigation || _actions.footer.length">' +
                        '<div class="app-datagrid-paginator" data-ng-show="show && shownavigation">' +
                            '<wm-datanavigator show="{{show && shownavigation}}" navigationalign="{{navigationalign}}" navigationsize="{{navigationSize}}" navigation="{{navControls}}" showrecordcount="{{show && showrecordcount}}" maxsize="{{maxsize}}" boundarylinks="{{boundarylinks}}" forceellipses="{{forceellipses}}" directionlinks="{{directionlinks}}"></wm-datanavigator>' +
                        '</div>' +
                        '<div class="app-datagrid-actions" ng-if="_actions.footer.length">' +
                            '<wm-button ng-repeat="btn in _actions.footer" caption="{{btn.displayName}}" show="{{btn.show}}" class="{{btn.class}}" ng-class="{\'btn-sm\': spacing === \'condensed\'}" iconclass="{{btn.iconclass}}" disabled="{{btn.key === \'addNewRow\' && isGridEditMode}}"' +
                                ' on-click="{{btn.action}}" type="button" shortcutkey="{{btn.shortcutkey}} tabindex="{{btn.tabindex}}"  hint="{{btn.title}}"></wm-button>' +
                        '</div>' +
                    '</div></div>';
            },
            'compile': function (tElement, tAttr) {
                var contextEl = tElement.context,
                    showHeader,
                    showNavigation,
                    exportIconMapping = {
                        'EXCEL' : 'fa fa-file-excel-o',
                        'CSV'   : 'fa fa-file-text-o'
                    };

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


                // backward compatibility for shownavigation
                if (tAttr.shownavigation) {
                    contextEl.removeAttribute('shownavigation');
                    showNavigation = tAttr.shownavigation === 'true' || tAttr.shownavigation === true;

                    delete tAttr.shownavigation;

                    if (!tAttr.navigation) {
                        tAttr.navigation = showNavigation ? 'Basic' : 'None';
                        contextEl.setAttribute('navigation', tAttr.navigation);
                    }
                }

                /*set the raw gridColumnMarkup to the grid attribute*/
                tAttr.gridColumnMarkup = gridColumnMarkup;
                gridColumnCount = (gridColumnMarkup.match(/<wm-grid-column/g) || []).length;
                /* in run mode there is separate controller for grid widget but not in studio mode, to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttr.name + 'Controller'] = WM.noop;
                }

                function defineSelectedItemProp(scope) {
                    Object.defineProperty(scope, 'selecteditem', {
                        get: function () {
                            if (scope.items && scope.items.length === 1) {
                                return scope.items[0];
                            }
                            return scope.items;
                        },
                        set: function (val) {
                            /*Select the rows in the table based on the new selected items passed*/
                            scope.items.length = 0;
                            scope.datagridElement.datagrid('selectRows', val);
                        }
                    });
                }

                return {
                    'pre': function (iScope, element, attrs) {

                        iScope.$on('security:before-child-remove', function (evt, childScope, childEl, childAttrs) {
                            evt.stopPropagation();
                            if (childAttrs.key === 'addNewRow') {
                                iScope._doNotAddNew = true;
                            }
                        });

                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            iScope.widgetProps = widgetProps;
                        }
                        /*Set the "allowPageable" flag in the scope to indicate that the grid accepts Pageable objects.*/
                        iScope.allowPageable = true;

                        /*This is to make the "Variables" & "Widgets" available in the Grid scope.
                         * and "Variables", "Widgets" will not be available in that scope.
                         * element.scope() might refer to the controller scope/parent scope.*/
                        var elScope = element.scope();
                        iScope.Variables  = elScope.Variables;
                        iScope.Widgets    = elScope.Widgets;
                        iScope.pageParams = elScope.pageParams;
                        iScope.appLocale  = $rootScope.appLocale;
                        iScope.columns    = {};
                        iScope.formfields = {};
                        $rootScope.$on('locale-change', function () {
                            iScope.appLocale = $rootScope.appLocale;
                        });

                        Object.defineProperty(iScope, 'selecteditem', {
                            configurable: true
                        });
                        element.removeAttr('title');
                        //Backward compatibility for old projects. If column select/ deselect event is present, set enablecolumnselection to true
                        if (!WM.isDefined(attrs.enablecolumnselection) && (attrs.onColumnselect || attrs.onColumndeselect)) {
                            iScope.enablecolumnselection = attrs.enablecolumnselection = true;
                            WM.element(tElement.context).attr('enablecolumnselection', true);
                        }
                    },
                    'post': function (scope, element, attrs) {
                        var runModeInitialProperties = {
                                'showrowindex'          : 'showRowIndex',
                                'multiselect'           : 'multiselect',
                                'radioselect'           : 'showRadioColumn',
                                'filternullrecords'     : 'filterNullRecords',
                                'enablesort'            : 'enableSort',
                                'showheader'            : 'showHeader',
                                'enablecolumnselection' : 'enableColumnSelection'
                            },
                            matchModesMap = {
                                'start'            : 'Starts with',
                                'end'              : 'Ends with',
                                'anywhere'         : 'Contains',
                                'exact'            : 'Is equal to',
                                'notequals'        : 'Is not equal to',
                                'lessthan'         : 'Less than',
                                'lessthanequal'    : 'Less than or equals to',
                                'greaterthan'      : 'Greater than',
                                'greaterthanequal' : 'Greater than or equals to',
                                'null'             : 'Is null',
                                'empty'            : 'Is empty',
                                'nullorempty'      : 'Is null or empty'
                            },
                            handlers = [],
                            liveGrid = element.closest('.app-livegrid'),
                            gridController;
                        function isInputBodyWrapper(target) {
                            var classes = ['.dropdown-menu', '.uib-typeahead-match', '.modal-dialog', '.toast'],
                                isInput = false;
                            _.forEach(classes, function (cls) {
                                if (target.closest(cls).length) {
                                    isInput = true;
                                    return false;
                                }
                            });
                            return isInput;
                        }
                        //Function to save the row on clicking outside, in case of quick edit
                        function documentClickBind(event) {
                            var $target = event.target;
                            //If click triggered from same grid or a dialog, do not save the row
                            if (element[0].contains($target) || event.target.doctype || isInputBodyWrapper($($target))) {
                                return;
                            }
                            scope.datagridElement.datagrid('saveRow');
                        }
                        /****condition for old property name for grid title*****/
                        if (attrs.gridcaption && !attrs.title) {
                            scope.title = scope.gridcaption;
                        }
                        scope.matchModeTypesMap = LiveWidgetUtils.getMatchModeTypesMap();
                        scope.emptyMatchModes   = ['null', 'empty', 'nullorempty'];
                        scope.matchModesMap     = matchModesMap;
                        scope.gridElement       = element;
                        scope.gridColumnCount   = gridColumnCount;
                        scope.displayAllFields  = attrs.displayall === '';
                        scope.datagridElement   = element.find('.app-datagrid');

                        scope.isPartOfLiveGrid = liveGrid.length > 0;
                        //Backward compatibility for readonly grid
                        if (attrs.readonlygrid && !WM.isDefined(attrs.editmode)) {
                            if (attrs.readonlygrid === 'true') {
                                scope.editmode = '';
                            } else {
                                if (scope.isPartOfLiveGrid) {
                                    scope.editmode = liveGrid.isolateScope().formlayout === 'inline' ? EDIT_MODE.FORM : EDIT_MODE.DIALOG;
                                } else {
                                    scope.editmode = EDIT_MODE.INLINE;
                                }
                            }
                        }

                        function onDestroy() {
                            handlers.forEach(Utils.triggerFn);
                            $document.off('click', documentClickBind);
                            Object.defineProperty(scope, 'selecteditem', {'get': _.noop, 'set': _.noop});
                        }

                        scope.$on('$destroy', onDestroy);
                        element.on('$destroy', onDestroy);

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

                        scope.actions      = [];
                        scope.rowActions   = [];
                        scope._actions     = {};
                        scope.headerConfig = [];
                        scope.items        = [];

                        /* event emitted on building new markup from canvasDom */
                        handlers.push($rootScope.$on('wms:compile-grid-columns', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if (scope.$id === scopeId) {
                                scope.fullFieldDefs = [];
                                scope.fieldDefs     = [];
                                scope.headerConfig  = [];

                                $compile(markup)(scope);
                                /*TODO: Check if grid options can be passed.*/
                                /*Invoke the function to render the operation columns.*/
                                if (markup === '') {
                                    scope.setGridData([], true);
                                }
                                scope.renderOperationColumns();
                                //Set the coldefs. Set forceset to true to rerender the grid
                                scope.setDataGridOption('colDefs', Utils.getClonedObject(scope.fieldDefs), true);
                            }
                        }));
                        /* event emitted whenever grid actions are modified */
                        handlers.push($rootScope.$on('wms:compile-grid-actions', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if (scope.$id === scopeId) {
                                scope.actions = [];
                                $compile(markup)(scope);
                            }
                        }));
                        /* event emitted whenever grid actions are modified */
                        handlers.push($rootScope.$on('wms:compile-grid-row-actions', function (event, scopeId, markup, fromDesigner) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            var prevLength, forceSet;
                            if (scope.$id === scopeId) {
                                scope.rowActions = [];
                                $compile(markup)(scope);
                            }
                            prevLength = scope.fieldDefs.length;
                            /*Invoke the function to render the operation columns.*/
                            scope.renderOperationColumns(fromDesigner);
                            forceSet = prevLength !== scope.fieldDefs.length;//since `fieldDefs` has reference to `colDefs` forcibly setting grid option
                            scope.setDataGridOption('colDefs', Utils.getClonedObject(scope.fieldDefs), forceSet);
                            scope.setDataGridOption('rowActions', Utils.getClonedObject(scope.rowActions));
                            scope.setDataGridOption('showHeader', scope.showheader);
                        }));

                        /* compile all the markup tags inside the grid, resulting into setting the fieldDefs*/
                        $compile(attrs.gridColumnMarkup)(scope);
                        scope.gridOptions.rowActions   = scope.rowActions;
                        scope.gridOptions.headerConfig = scope.headerConfig;
                        if (scope.rowActions.length && CONSTANTS.isStudioMode) {
                            scope.renderOperationColumns();
                        }
                        /*This is expose columns property to user so that he can programatically
                         * use columns to do some custom logic */
                        scope.gridOptions.colDefs.map(function (column) {
                            scope.columns[column.field] = column;
                        });

                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal) {
                            var actionsObj,
                                addNewRowButtonIndex;
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
                                if (CONSTANTS.isStudioMode) {
                                    scope.renderOperationColumns();
                                    scope.setDataGridOption('colDefs', Utils.getClonedObject(scope.fieldDefs));
                                }
                                break;
                            case 'updaterow':
                                if (CONSTANTS.isStudioMode) {
                                    scope.renderOperationColumns();
                                    scope.setDataGridOption('colDefs', Utils.getClonedObject(scope.fieldDefs));
                                }
                                break;
                            case 'dataset':
                                scope.watchVariableDataSet(newVal, element);
                                break;
                            case 'showheader':
                                if (CONSTANTS.isStudioMode && !scope.widgetid) {
                                    scope.setDataGridOption('showHeader', newVal);
                                }
                                break;
                            case 'gridsearch':
                                if (newVal) {
                                    scope.filtermode = 'search';
                                }
                                break;
                            case 'filtermode':
                                scope.setDataGridOption('filtermode', newVal);
                                break;
                            case 'searchlabel':
                                scope.setDataGridOption('searchLabel', newVal);
                                break;
                            case 'rowngclass':
                                scope.setDataGridOption('rowNgClass', newVal);
                                break;
                            case 'rowclass':
                                scope.setDataGridOption('rowClass', newVal);
                                break;
                            case 'multiselect':
                                if (CONSTANTS.isStudioMode) {
                                    if (newVal) {
                                        scope.radioselect = false;
                                        scope.widgetProps.radioselect.show = false;
                                        scope.widgetProps.radioselect.showindesigner = false;
                                        scope.$root.$emit('set-markup-attr', scope.widgetid, {'radioselect': false});
                                    }
                                    scope.setDataGridOption('multiselect', newVal);
                                }
                                break;
                            case 'radioselect':
                                if (CONSTANTS.isStudioMode) {
                                    if (newVal) {
                                        scope.multiselect = false;
                                        scope.widgetProps.multiselect.show = false;
                                        scope.widgetProps.multiselect.showindesigner = false;
                                        scope.$root.$emit('set-markup-attr', scope.widgetid, {'multiselect': false});
                                    }
                                    scope.setDataGridOption('showRadioColumn', newVal);
                                }
                                break;
                            case 'showrowindex':
                                if (CONSTANTS.isStudioMode) {
                                    scope.setDataGridOption('showRowIndex', newVal);
                                }
                                break;
                            case 'navigation':
                                if (newVal === 'Advanced') { //Support for older projects where navigation type was advanced instead of clasic
                                    scope.navigation = 'Classic';
                                    return;
                                }
                                if (newVal !== 'None') {
                                    scope.shownavigation = true;
                                    scope.enablePageNavigation();
                                }
                                scope.navControls = newVal;
                                /*Check for sanity*/
                                if (CONSTANTS.isStudioMode) {
                                    scope.widgetProps.showrecordcount.show = scope.widgetProps.showrecordcount.showindesigner = !_.includes(['None', 'Pager'], newVal);
                                }
                                break;
                            case 'insertrow':
                                if (scope._doNotAddNew) {
                                    return;
                                }
                                scope.insertrow = (newVal === true || newVal === 'true');
                                addNewRowButtonIndex = getObjectIndexInArray('key', 'addNewRow', scope.actions);
                                if (scope.insertrow) {
                                    // Add button definition to actions if it does not already exist.
                                    if (addNewRowButtonIndex === -1) {
                                        scope.actions.unshift(_.find(LiveWidgetUtils.getLiveWidgetButtons('GRID'), function (button) {
                                            return button.key === 'addNewRow';
                                        }));
                                    }
                                } else {
                                    if (scope.actions.length && addNewRowButtonIndex !== -1) {
                                        scope.actions.splice(addNewRowButtonIndex, 1);
                                    }
                                }
                                scope.populateActions();
                                if (CONSTANTS.isStudioMode) {
                                    actionsObj = {
                                        type: 'GRID',
                                        widgetName: scope.name,
                                        scopeId: scope.$id,
                                        buttonDefs: scope.actions
                                    };
                                    scope.updateMarkupForGrid(actionsObj);
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
                            case 'gridclass':
                                scope.datagridElement.datagrid('option', 'cssClassNames.grid', newVal);
                                break;
                            case 'nodatamessage':
                                scope.datagridElement.datagrid('option', 'dataStates.nodata', newVal);
                                break;
                            case 'loadingdatamsg':
                                scope.datagridElement.datagrid('option', 'dataStates.loading', newVal);
                                break;
                            case 'filternullrecords':
                                if (CONSTANTS.isStudioMode) {
                                    scope.datagridElement.datagrid('option', 'filterNullRecords', newVal);
                                }
                                break;
                            case 'spacing':
                                scope.datagridElement.datagrid('option', 'spacing', newVal);
                                if (newVal === 'condensed') {
                                    scope.navigationSize = 'small';
                                } else {
                                    scope.navigationSize = '';
                                }
                                break;
                            case 'exportformat':
                                scope.exportOptions = [];
                                if (newVal) {
                                    //Populate options for export drop down menu
                                    _.forEach(_.split(newVal, ','), function (type) {
                                        scope.exportOptions.push({
                                            'label'      : type,
                                            'icon'       : exportIconMapping[type]
                                        });
                                    });
                                }
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
                                if (scope.dataNavigator) {
                                    scope.dataNavigator.result = undefined;
                                }
                            }
                            //In run mode, If grid is bound to selecteditem subset, dataset is undefined and dataset watch will not be triggered. So, set the dataset to empty value
                            if (_.includes(newVal, 'selecteditem.')) {
                                if (CONSTANTS.isRunMode) {
                                    LiveWidgetUtils.fetchDynamicData(scope, function (data) {
                                        /*Check for sanity of data.*/
                                        if (WM.isDefined(data)) {
                                            scope.dataNavigatorWatched = true;
                                            scope.dataset = data;
                                            if (scope.dataNavigator) {
                                                scope.dataNavigator.dataset = data;
                                            }
                                        } else {
                                            scope.datagridElement.datagrid('setStatus', 'nodata', scope.nodatamessage);
                                        }
                                    });
                                } else {
                                    scope.datagridElement.datagrid('setStatus', 'error', $rootScope.locale.MESSAGE_GRID_CANNOT_LOAD_DATA_IN_STUDIO);
                                }
                            }
                        }));
                        handlers.push($rootScope.$on('toggle-variable-state', function (event, boundVariableName, active) {
                            var variableName = scope.variableName || Utils.getVariableName(scope);
                            /*based on the active state and response toggling the 'loading data...' and 'no data found' messages. */
                            if (boundVariableName === variableName) {
                                scope.variableInflight = active;
                                if (active) {
                                    scope.datagridElement.datagrid('setStatus', 'loading', scope.loadingdatamsg);
                                } else {
                                    //If grid is in edit mode or grid has data, dont show the no data message
                                    if (!scope.isGridEditMode && scope.gridData && scope.gridData.length === 0) {
                                        scope.datagridElement.datagrid('setStatus', 'nodata', scope.nodatamessage);
                                    } else {
                                        scope.datagridElement.datagrid('setStatus', 'ready');
                                    }
                                }
                            }
                        }));
                        defineSelectedItemProp(scope);
                        scope.shownavigation = scope.navigation !== 'None';
                        $timeout(function () {
                            scope.dataNavigator = element.find('[data-identifier=datanavigator]').isolateScope();
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);

                            if (CONSTANTS.isRunMode && attrs.scopedataset) {
                                handlers.push(scope.$watch('scopedataset', function (newVal) {
                                    if (newVal && !scope.dataset) {
                                        /* decide new column defs required based on existing column defs for the grid */
                                        scope.newcolumns = !scope.columnDefsExists();
                                        scope.createGridColumns(newVal);
                                    }
                                }));
                            }
                        }, 0, false);
                        //Will be called after setting grid column property.
                        scope._redraw = function (forceRender) {
                            if (forceRender) {
                                scope.datagridElement.datagrid(scope.gridOptions);
                            } else {
                                $timeout(function () {
                                    scope.datagridElement.datagrid('setColGroupWidths');
                                    scope.datagridElement.datagrid('addOrRemoveScroll');
                                });
                            }
                        };
                        scope.redraw = _.debounce(scope._redraw, 150);
                        if (!scope.widgetid && scope.editmode === EDIT_MODE.QUICK_EDIT) {
                            //In case of advanced inline, on tab keypress of grid, edit the first row
                            element.on('keyup', function (e) {
                                if (e.which !== 9 || !WM.element(e.target).hasClass('app-grid')) {
                                    return;
                                }
                                var $row;
                                $row = scope.datagridElement.find('.app-grid-content tr:first');
                                if ($row.length) {
                                    $row.trigger('click', [undefined, {action: 'edit'}]);
                                } else {
                                    scope.addNewRow();
                                }
                            });
                            $document.on('click', documentClickBind);
                        }

                        if (CONSTANTS.isRunMode) {
                            /**runModeInitialProperties are not triggered in property change handler in run mode.
                             * So, set these grid options based on the attribute values.
                             * This is done to prevent re-rendering of the grid for a property change in run mode**/
                            _.forEach(runModeInitialProperties, function (value, key) {
                                var attrValue = attrs[key];
                                if (WM.isDefined(attrValue)) {
                                    scope.gridOptions[value] = (attrValue === 'true' || attrValue === true);
                                }
                            });
                            scope.gridOptions.rowNgClass = scope.rowngclass;
                            scope.gridOptions.rowClass = scope.rowclass;
                            scope.gridOptions.editmode = scope.editmode;
                            /*Set isMobile value on the datagrid*/
                            scope.gridOptions.isMobile = Utils.isMobile();
                            scope.renderOperationColumns();
                        }

                        scope.gridOptions.dateFormat     = AppDefaults.get('dateFormat');
                        scope.gridOptions.timeFormat     = AppDefaults.get('timeFormat');
                        scope.gridOptions.dateTimeFormat = AppDefaults.get('dateTimeFormat');
                        scope.datagridElement.datagrid(scope.gridOptions);
                    }
                };
            }
        };
    }])
    .controller("gridController", [
        "$rootScope",
        "$scope",
        "$timeout",
        "$compile",
        "CONSTANTS",
        "Utils",
        "wmToaster",
        "$servicevariable",
        "LiveWidgetUtils",
        "DialogService",
        function ($rootScope, $scope, $timeout, $compile, CONSTANTS, Utils, wmToaster, $servicevariable, LiveWidgetUtils, DialogService) {
            'use strict';
            var rowOperations = {
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
                currentSort,
                isBoundToVariable,
                isBoundToWidget,
                isBoundToLiveVariable,
                isBoundToLiveVariableRoot,
                isBoundToServiceVariable,
                navigatorResultWatch,
                navigatorMaxResultWatch,
            /* Check whether it is non-empty row. */
                isEmptyRecord = function (record) {
                    var properties = Object.keys(record),
                        data,
                        isDisplayed;

                    return properties.every(function (prop, index) {
                        data = record[prop];
                        /* If fieldDefs are missing, show all columns in data. */
                        isDisplayed = ($scope.fieldDefs.length && WM.isDefined($scope.fieldDefs[index]) && (CONSTANTS.isMobile ? $scope.fieldDefs[index].mobileDisplay : $scope.fieldDefs[index].pcDisplay)) || true;
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
                setGridData = function (serverData, forceSet) {
                    var data = serverData;
                    /*If serverData has data but is undefined, then return*/
                    if (!forceSet && (isBoundToLiveVariableRoot || WM.isDefined(serverData.propertiesMap))) {
                        if (!serverData.data || Utils.isEmptyObject(serverData.data)) {
                            $scope.datagridElement.datagrid('setStatus', 'nodata', $scope.nodatamessage);
                            return;
                        }
                        data = serverData.data;
                    }
                    if ($scope.filternullrecords) {
                        $scope.gridData = removeEmptyRecords(data);
                    } else {
                        $scope.gridData = data;
                    }
                    if ($scope.gridData && $scope.gridData.length === 0) {
                        $scope.datagridElement.datagrid('setStatus', 'nodata', $scope.nodatamessage);
                    } else {
                        $scope.datagridElement.datagrid('setStatus', 'ready');
                    }
                    $scope.$root.$safeApply($scope);
                },
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
                        if (isBoundToVariable) {
                            variableName = $scope.binddataset.substr($scope.binddataset.lastIndexOf("bind:Variables.") + 15);
                        } else if (isBoundToWidget) {
                            variableName = serviceData.variableName;
                        }

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
                //Set filter fields based on the search obj
                setFilterFields = function (filterFields, searchObj) {
                    var field = searchObj.field;
                    /*Set the filter options only when a field/column has been selected.*/
                    if (field) {
                        filterFields[field] = {
                            'value'     : searchObj.value,
                            'logicalOp' : 'AND'
                        };
                        if (searchObj.matchMode) {
                            filterFields[field].matchMode = searchObj.matchMode;
                        }
                    }
                },
                getFilterFields = function (searchObj) {
                    var filterFields = {};
                    if (_.isArray(searchObj)) {
                        _.forEach(searchObj, function (obj) {
                            setFilterFields(filterFields, obj);
                        });
                    } else {
                        setFilterFields(filterFields, searchObj);
                    }
                    return filterFields;
                },
                searchGrid = function (searchObj) {
                    var variable  = $scope.gridElement.scope().Variables[$scope.variableName];
                    currentSearch = searchObj;
                    $scope.filterFields = getFilterFields(searchObj);
                    variable.update({
                        'type'         : 'wm.LiveVariable',
                        'page'         : 1,
                        'filterFields' : $scope.filterFields,
                        'matchMode'    : 'anywhere',
                        'ignoreCase'   : true,
                        'scope'        : $scope.gridElement.scope()
                    }, WM.noop, function () {
                        $scope.toggleMessage(true, 'error', 'No results found.');
                    });
                },
                sortHandler = function (sortObj, e) {
                    var filterFields,
                        variable     = $scope.gridElement.scope().Variables[$scope.variableName],
                        fieldName    = sortObj.field,
                        sortOptions  = sortObj.direction ? (fieldName + ' ' + sortObj.direction) : '';
                    /* Update the sort info for passing to datagrid */
                    $scope.gridOptions.sortInfo.field     = sortObj.field;
                    $scope.gridOptions.sortInfo.direction = sortObj.direction;
                    $scope.sortInfo = Utils.getClonedObject(sortObj);

                    if ($scope.isBoundToFilter && $scope.widgetName) {
                        /* if Grid bound to filter, get sorted data through filter widget (with applied filters in place)*/
                        $scope.Widgets[$scope.widgetName].applyFilter({'orderBy': sortOptions});
                    } else if (variable.category === 'wm.LiveVariable') {
                        if ($scope.filtermode && currentSearch) {
                            filterFields = getFilterFields(currentSearch);
                        }
                        /* else get sorted data through variable */
                        variable.update({
                            'type'         : 'wm.LiveVariable',
                            'page'         : 1,
                            'filterFields' : filterFields,
                            'orderBy'      : sortOptions,
                            'matchMode'    : 'anywhere',
                            'ignoreCase'   : true,
                            'scope'        : $scope.gridElement.scope()
                        }, function () {
                            $scope.onSort({$event: e, $data: $scope.serverData});
                        }, function (error) {
                            $scope.toggleMessage(true, 'error', error);
                        });
                    } else if (variable.category === 'wm.ServiceVariable') {
                        /* Will be called only in case of Query service variables */
                        variable.update({
                            'orderBy' : sortOptions,
                            'page'    : 1
                        }, function () {
                            $scope.onSort({$event: e, $data: $scope.serverData});
                        }, function (error) {
                            $scope.toggleMessage(true, 'error', error);
                        });
                    }
                },
                //Filter the data based on the search value and conditions
                getFilteredData = function (data, searchObj) {
                    var searchVal = _.toString(searchObj.value).toLowerCase(),
                        currentVal;
                    data = _.filter(data, function (obj) {
                        var isExists;
                        if (searchObj.field) {
                            currentVal = _.toString(_.get(obj, searchObj.field)).toLowerCase(); //If `int` converting to `string`
                        } else {
                            currentVal = _.values(obj).join(' ').toLowerCase(); //If field is not there, search on all the columns
                        }
                        switch (searchObj.matchMode) {
                        case 'start':
                            isExists = _.startsWith(currentVal, searchVal);
                            break;
                        case 'end':
                            isExists = _.endsWith(currentVal, searchVal);
                            break;
                        case 'exact':
                            isExists = _.isEqual(currentVal, searchVal);
                            break;
                        case 'notequals':
                            isExists = !_.isEqual(currentVal, searchVal);
                            break;
                        case 'null':
                            isExists = _.isNull(currentVal, searchVal);
                            break;
                        case 'empty':
                            isExists = _.isEmpty(currentVal, searchVal);
                            break;
                        case 'nullorempty':
                            isExists = _.isNull(currentVal, searchVal) || _.isEmpty(currentVal, searchVal);
                            break;
                        default:
                            isExists = _.includes(currentVal, searchVal);
                            break;
                        }
                        return isExists;
                    });
                    return data;
                },
                //Returns data filtered using searchObj
                getSearchResult = function (data, searchObj) {
                    if (!searchObj) {
                        return data;
                    }
                    if (_.isArray(searchObj)) {
                        _.forEach(searchObj, function (obj) {
                            data = getFilteredData(data, obj);
                        });
                    } else {
                        data = getFilteredData(data, searchObj);
                    }
                    return data;
                },
                /*Returns data sorted using sortObj*/
                getSortResult = function (data, sortObj) {
                    if (sortObj && sortObj.direction) {
                        data = _.orderBy(data, sortObj.field, sortObj.direction);
                    }
                    return data;
                },
                /*Function to handle both sort and search operations if bound to service/static variable*/
                handleOperation = function (searchSortObj, e, type) {
                    var data;
                    if ($scope.shownavigation) {
                        data = Utils.getClonedObject($scope.__fullData);
                    } else {
                        data = Utils.getClonedObject($scope.dataset);
                    }

                    //Storing in global variables for further use
                    //While sorting previously stored search obj(current search) is used.And viceversa
                    if (type === 'search') {
                        currentSearch = searchSortObj;
                    } else {
                        currentSort = searchSortObj;
                    }
                    if (WM.isObject(data) && !WM.isArray(data)) {
                        data = [data];
                    }
                    /*Both the functions return same 'data' if arguments are undefined*/
                    data = getSearchResult(data, currentSearch);
                    data = getSortResult(data, currentSort);
                    $scope.serverData = data;
                    if ($scope.shownavigation) {
                        //Reset the page number to 1
                        $scope.dataNavigator.dn.currentPage = 1;
                        $scope.dataNavigator.setPagingValues(data);
                    } else {
                        setGridData($scope.serverData);
                    }

                    if (type === 'sort') {
                        //Calling 'onSort' event
                        $scope.onSort({$event: e, $data: $scope.serverData});
                    }
                },
                //Search handler for default case, when no separate search handler is provided
                defaultSearchHandler = function (searchObj) {
                    var data  = Utils.getClonedObject($scope.gridData),
                        $rows = $scope.datagridElement.find('tbody tr.app-datagrid-row');
                    data = getSearchResult(data, searchObj);
                    //Compared the filtered data and original data, to show or hide the rows
                    _.forEach($scope.gridData, function (value, index) {
                        var $row = WM.element($rows[index]);
                        if (_.find(data, function (obj) {return _.isEqual(obj, value); })) {
                            $row.show();
                        } else {
                            $row.hide();
                        }
                    });
                    if (data && data.length) {
                        $scope.datagridElement.datagrid('setStatus', 'ready');
                        //Select the first row after the search
                        $scope.datagridElement.datagrid('selectFirstRow', $scope.gridfirstrowselect && !$scope.multiselect, true);
                    } else {
                        $scope.datagridElement.datagrid('setStatus', 'nodata', $scope.nodatamessage);
                        $scope.selecteditem = undefined;
                    }
                },
                getCompiledTemplate = function (htm, row, colDef, refreshImg) {
                    var rowScope = $scope.$new(),
                        el = WM.element(htm),
                        ngSrc,
                        imageEl;
                    rowScope.selectedItemData = rowScope.rowData = Utils.getClonedObject(row);
                    rowScope.row = row;
                    rowScope.row.getProperty = function (field) {
                        return row[field];
                    };
                    //return the compiled template if the template is row i.e when colDef doesn't exist.
                    if (!colDef) {
                        return $compile(el)(rowScope);
                    }
                    rowScope.colDef = colDef;
                    rowScope.columnValue = row[colDef.field];
                    if (refreshImg && colDef.widgetType === 'image') {
                        ngSrc = el.attr('data-ng-src');  //As url will be same but image changes in the backend after edit operation, add timestamp to src to force refresh the image
                        if (ngSrc) {
                            imageEl = el;
                        } else {
                            imageEl = el.find('img');  //If src is not present, check for the image tag inside
                            ngSrc = imageEl.attr('data-ng-src');
                        }
                        if (ngSrc) {
                            imageEl.attr('data-ng-src', ngSrc.concat((_.includes(ngSrc, '?') ? '&_ts=' : '?_ts=') + new Date().getTime())); //Add the current timestamp to the src to force refresh the image.
                        }
                    }
                    return $compile(el)(rowScope);
                },
                /*Compile the templates in the grid scope*/
                compileTemplateInGridScope = function (htm) {
                    var el = WM.element(htm);
                    return $compile(el)($scope);
                },
                deleteRecord = function (row, cancelRowDeleteCallback, evt, callBack) {
                    var variable,
                        isStaticVariable,
                        successHandler = function (success) {
                            /* check the response whether the data successfully deleted or not , if any error occurred show the
                             * corresponding error , other wise remove the row from grid */
                            if (success && success.error) {
                                $scope.toggleMessage(true, 'error', $scope.errormessage || success.error);
                                return;
                            }
                            /*Emit on row delete to handle any events listening to the delete action*/
                            $scope.$emit('on-row-delete', row);

                            $scope.onRecordDelete(callBack);
                            if (!isStaticVariable) {
                                $scope.updateVariable(row, callBack);
                            }
                            if ($scope.deletemessage) {
                                $scope.toggleMessage(true, 'success', $scope.deletemessage);
                            }
                            /*custom EventHandler for row deleted event*/
                            $scope.onRowdeleted({$event: evt, $data: row, $rowData: row});
                        },
                        deleteFn = function () {
                            if (isStaticVariable) {
                                variable.removeItem(row);
                                successHandler(row);
                                return;
                            }
                            variable.deleteRecord({
                                'row'              : row,
                                'transform'        : true,
                                'scope'            : $scope.gridElement.scope(),
                                'skipNotification' : true
                            }, successHandler, function (error) {
                                Utils.triggerFn(callBack, undefined, true);
                                Utils.triggerFn(cancelRowDeleteCallback);
                                $scope.toggleMessage(true, 'error', $scope.errormessage || error);
                            });
                        };
                    if ($scope.gridVariable.propertiesMap && $scope.gridVariable.propertiesMap.tableType === "VIEW") {
                        $scope.toggleMessage(true, 'info', 'Table of type view, not editable', 'Not Editable');
                        $scope.$root.$safeApply($scope);
                        return;
                    }
                    variable = $scope.gridElement.scope().Variables[$scope.variableName];
                    if (!variable) {
                        return;
                    }
                    isStaticVariable = variable.category === 'wm.Variable';
                    if (!$scope.confirmdelete) {
                        deleteFn();
                        Utils.triggerFn(cancelRowDeleteCallback);
                        return;
                    }
                    DialogService._showAppConfirmDialog({
                        'caption'   : 'Delete Record',
                        'iconClass' : 'wi wi-delete fa-lg',
                        'content'   : $scope.confirmdelete,
                        'resolve'   : {
                            'confirmActionOk': function () {
                                return deleteFn;
                            },
                            'confirmActionCancel': function () {
                                return function () {
                                    Utils.triggerFn(cancelRowDeleteCallback);
                                };
                            }
                        }
                    });
                },
                insertRecord = function (options) {
                    var variable = $scope.gridElement.scope().Variables[$scope.variableName],
                        dataObject = {
                            'row'              : options.row,
                            'transform'        : true,
                            'scope'            : $scope.gridElement.scope(),
                            'skipNotification' : true
                        },
                        isStaticVariable,
                        successHandler = function (response) {
                            /*Display appropriate error message in case of error.*/
                            if (response.error) {
                                $scope.toggleMessage(true, 'error', $scope.errormessage || response.error);
                                Utils.triggerFn(options.error, response);
                            } else {
                                if (options.event) {
                                    var row = WM.element(options.event.target).closest('tr');
                                    $scope.datagridElement.datagrid('hideRowEditMode', row);
                                }
                                $scope.toggleMessage(true, 'success', $scope.insertmessage);
                                $scope.initiateSelectItem('last', response, undefined, isStaticVariable, options.callBack);
                                if (!isStaticVariable) {
                                    $scope.updateVariable(response, options.callBack);
                                }
                                Utils.triggerFn(options.success, response);
                                $scope.onRowinsert({$event: options.event, $data: response, $rowData: response});
                            }
                        };

                    if (!variable) {
                        return;
                    }
                    isStaticVariable = variable.category === 'wm.Variable';
                    if (isStaticVariable) {
                        variable.addItem(options.row);
                        successHandler(options.row);
                        return;
                    }
                    variable.insertRecord(dataObject, successHandler, function (error) {
                        $scope.toggleMessage(true, 'error', $scope.errormessage || error);
                        Utils.triggerFn(options.error, error);
                        Utils.triggerFn(options.callBack, undefined, true);
                    });
                },
                updateRecord = function (options) {
                    /*TODO To be uncommented after onRowupdated gets the right value i.e., onRowupdated should have the value defined from the widget events.*/
                    /*if (WM.isDefined($scope.onRowupdated)) {
                        $scope.onRowupdated(rowData);
                        return;
                    }*/
                    var variable = $scope.gridElement.scope().Variables[$scope.variableName],
                        isStaticVariable,
                        dataObject = {
                            'row'              : options.row,
                            'prevData'         : options.prevData,
                            'transform'        : true,
                            'scope'            : $scope.gridElement.scope(),
                            'skipNotification' : true
                        },
                        successHandler = function (response) {
                            /*Display appropriate error message in case of error.*/
                            if (response.error) {
                                /*disable readonly and show the appropriate error*/
                                $scope.toggleMessage(true, 'error', $scope.errormessage || response.error);
                                Utils.triggerFn(options.error, response);
                            } else {
                                if (options.event) {
                                    var row = WM.element(options.event.target).closest('tr');
                                    $scope.datagridElement.datagrid('hideRowEditMode', row);
                                }
                                $scope.operationType = "";
                                $scope.toggleMessage(true, 'success', $scope.updatemessage);
                                $scope.initiateSelectItem('current', response, undefined, isStaticVariable, options.callBack);
                                if (!isStaticVariable) {
                                    $scope.updateVariable(response, options.callBack);
                                }
                                Utils.triggerFn(options.success, response);
                                $scope.onRowupdate({$event: options.event, $data: response, $rowData: response});
                            }
                        };

                    if (!variable) {
                        return;
                    }
                    isStaticVariable = variable.category === 'wm.Variable';
                    if (isStaticVariable) {
                        variable.setItem(options.prevData, options.row);
                        successHandler(options.row);
                        return;
                    }
                    variable.updateRecord(dataObject, successHandler, function (error) {
                        $scope.toggleMessage(true, 'error', $scope.errormessage || error);
                        Utils.triggerFn(options.error, error);
                        Utils.triggerFn(options.callBack, undefined, true);
                    });
                },
                setImageProperties = function (variableObj) {
                    if (!variableObj) {
                        return;
                    }
                    $scope.primaryKey     = variableObj.getPrimaryKey();
                    $scope.contentBaseUrl = ((variableObj.prefabName !== "" && variableObj.prefabName !== undefined) ? "prefabs/" + variableObj.prefabName : "services") + '/' + variableObj.liveSource + '/' + variableObj.type + '/';
                },
                selectItemOnSuccess = function (row, skipSelectItem, callBack) {
                    /*$timeout is used so that by then $scope.dataset has the updated value.
                     * Selection of the item is done in the callback of page navigation so that the item that needs to be selected actually exists in the grid.*/
                    /*Do not select the item if skip selection item is specified*/
                    $timeout(function () {
                        if (!skipSelectItem) {
                            $scope.selectItem(row, $scope.dataset && $scope.dataset.data);
                        }
                        Utils.triggerFn(callBack);
                    }, undefined, false);
                };
            $scope.setGridData = setGridData.bind(undefined);
            $scope.rowFilter = {};
            $scope.updateMarkupForGrid = function (config) {
                if ($scope.widgetid) {
                    Utils.getService('LiveWidgetsMarkupManager').updateMarkupForGrid(config);
                }
            };
            $scope.updateVariable = function (row, callBack) {
                var variable = $scope.gridElement.scope().Variables[$scope.variableName],
                    sortOptions;
                if ($scope.isBoundToFilter) {
                    //If grid is bound to filter, call the apply fiter and update filter options
                    if (!$scope.shownavigation) {
                        sortOptions = _.isEmpty($scope.sortInfo) ? '' : $scope.sortInfo.field + ' ' + $scope.sortInfo.direction;
                        $scope.Widgets[$scope.widgetName].applyFilter({'orderBy': sortOptions});
                    }
                    $scope.Widgets[$scope.widgetName].updateAllowedValues();
                    return;
                }
                if (variable && !$scope.shownavigation) {
                    variable.update({
                        'type': 'wm.LiveVariable'
                    }, function () {
                        selectItemOnSuccess(row, true, callBack);
                    });
                }
            };
            /* Function to reset the column definitions dynamically. */
            $scope.resetColumnDefinitions = function () {
                $scope.fieldDefs = [];
                $scope.setDataGridOption('colDefs', Utils.getClonedObject($scope.fieldDefs));
            };

            /*Function to render the column containing row operations.*/
            $scope.renderOperationColumns = function (fromDesigner) {
                var rowActionCol,
                    opConfig = {},
                    operations = [],
                    insertPosition,
                    rowOperationsColumn = LiveWidgetUtils.getRowOperationsColumn(),
                    config = {
                        'name'  : rowOperationsColumn.field,
                        'field' : rowOperationsColumn.field
                    };
                /*Return if no fieldDefs are present.*/
                if (!$scope.fieldDefs.length) {
                    return;
                }
                rowActionCol = _.find($scope.fullFieldDefs, {'field': 'rowOperations', type : 'custom'}); //Check if column is fetched from markup
                _.remove($scope.fieldDefs, {type : 'custom', field : 'rowOperations'});//Removing operations column
                _.remove($scope.headerConfig, {field : rowOperationsColumn.field});
                /*Loop through the "rowOperations"*/
                _.forEach(rowOperations, function (field, fieldName) {
                    /* Add it to operations only if the corresponding property is enabled.*/
                    if (_.some($scope.rowActions, {'key' : field.property}) || (!fromDesigner && $scope[field.property])) {
                        opConfig[fieldName] = rowOperations[fieldName].config;
                        operations.push(fieldName);
                    }
                });

                /*Add the column for row operations only if at-least one operation has been enabled.*/
                if ($scope.rowActions.length) {
                    if (rowActionCol) { //If column is present in markup, push the column or push the default column
                        insertPosition = rowActionCol.rowactionsposition ? _.toNumber(rowActionCol.rowactionsposition) : $scope.fieldDefs.length;
                        $scope.fieldDefs.splice(insertPosition, 0, rowActionCol);
                        if (insertPosition === 0) {
                            $scope.headerConfig.unshift(config);
                        } else {
                            $scope.headerConfig.push(config);
                        }
                    } else {
                        $scope.fieldDefs.push(rowOperationsColumn);
                        $scope.headerConfig.push(config);
                    }
                } else if (!fromDesigner && operations.length) {
                    rowOperationsColumn.operations = operations;
                    rowOperationsColumn.opConfig = opConfig;
                    $scope.fieldDefs.push(rowOperationsColumn);
                    $scope.headerConfig.push(config);
                }
                $scope.setDataGridOption('headerConfig', $scope.headerConfig);
            };

            $scope.fieldDefs = [];
            $scope.fullFieldDefs = [];
            /* This is the array which contains all the selected items */
            $scope.selectedItems = [];

            $scope.$watch('gridData', function (newValue) {
                var startRowIndex,
                    gridOptions;

                if (WM.isDefined(newValue)) {
                    /*Setting the serial no's only when show navigation is enabled and data navigator is compiled
                     and its current page is set properly*/
                    if ($scope.shownavigation && $scope.dataNavigator && $scope.dataNavigator.dn.currentPage) {
                        startRowIndex = (($scope.dataNavigator.dn.currentPage - 1) * ($scope.dataNavigator.maxResults || 1)) + 1;
                        $scope.setDataGridOption('startRowIndex', startRowIndex);
                    }
                    /* If colDefs are available, but not already set on the datagrid, then set them.
                     * This will happen while switching from markup to design tab. */
                    gridOptions = $scope.datagridElement.datagrid('getOptions');
                    if (!gridOptions.colDefs.length && $scope.fieldDefs.length) {
                        $scope.setDataGridOption('colDefs', Utils.getClonedObject($scope.fieldDefs));
                    }
                    $scope.setDataGridOption('data', Utils.getClonedObject(newValue));
                }
            });

            $scope.addNewRow = function () {
                $scope.datagridElement.datagrid('addNewRow');
                $scope.$emit('add-new-row');
                $rootScope.$emit("wm-event", $scope.widgetid, "create");
            };

            $scope.isGridEditMode = false;
            $scope.gridData = [];
            $scope.gridOptions = {
                data: Utils.getClonedObject($scope.gridData),
                colDefs: $scope.fieldDefs,
                startRowIndex: 1,
                onDataRender: function () {
                    // select rows selected in previous pages. (Not finding intersection of data and selecteditems as it will be heavy)
                    if (!$scope.multiselect) {
                        $scope.items.length = 0;
                    }
                    $scope.datagridElement.datagrid('selectRows', $scope.items);
                    $scope.selectedItems = $scope.datagridElement.datagrid('getSelectedRows');
                    if ($scope.gridData.length) {
                        $scope.onDatarender({$isolateScope: $scope, $data: $scope.gridData});
                    }
                },
                onRowSelect: function (rowData, e) {
                    $scope.selectedItems = $scope.datagridElement.datagrid('getSelectedRows');
                    /*
                     * in case of single select, update the items with out changing the reference.
                     * for multi select, keep old selected items in tact
                     */
                    if ($scope.multiselect) {
                        if (_.findIndex($scope.items, rowData) === -1) {
                            $scope.items.push(rowData);
                        }
                    } else {
                        $scope.items.length = 0;
                        $scope.items.push(rowData);
                    }
                    $scope.onSelect({$data: rowData, $event: e, $rowData: rowData});
                    $scope.onRowclick({$data: rowData, $event: e, $rowData: rowData});
                    // For backward compatibility.
                    if (WM.isDefined($scope.onClick)) {
                        $scope.onClick({$data: rowData, $event: e, $rowData: rowData});
                    }
                    if (WM.isDefined($scope.onTap)) {
                        $scope.onTap({$data: rowData, $event: e, $rowData: rowData});
                    }
                    $rootScope.$safeApply($scope);
                },
                onRowDblClick: function (rowData, e) {
                    $scope.onRowdblclick({$data: rowData, $event: e, $rowData: rowData});
                    $rootScope.$safeApply($scope);
                },
                onRowDeselect: function (rowData, e) {
                    if ($scope.multiselect) {
                        $scope.items = _.pullAllWith($scope.items, [rowData], _.isEqual);
                    }
                    $scope.selectedItems = $scope.datagridElement.datagrid('getSelectedRows');
                    $scope.onDeselect({$data: rowData, $event: e, $rowData: rowData});
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
                onHeaderClick: function (col, e) {
//                    /* if onSort function is registered invoke it when the column header is clicked */
//                    $scope.onSort({$event: e, $data: e.data.col});
                    $scope.onHeaderclick({$event: e, $data: col});
                },
                onRowDelete: function (rowData, cancelRowDeleteCallback, e, callBack) {
                    deleteRecord(rowData, cancelRowDeleteCallback, e, callBack);
                },
                onRowInsert: function (rowData, e, callBack) {
                    insertRecord({'row': rowData, event: e, 'callBack': callBack});
                },
                beforeRowUpdate: function (rowData, e, eventName) {
                    /*TODO: Check why widgetid is undefined here.*/
                    $scope.$emit('update-row', $scope.widgetid, rowData, eventName);
                    $scope.prevData = Utils.getClonedObject(rowData);
                    $rootScope.$safeApply($scope);
                    $rootScope.$emit('wm-event', $scope.widgetid, 'update');
                    /*TODO: Bind this event.*/
//                    $scope.beforeRowupdate({$data: rowData, $event: e});
                },
                afterRowUpdate: function (rowData, e, callBack) {
                    updateRecord({'row': rowData, 'prevData': $scope.prevData, 'event': e, 'callBack': callBack});
                },
                onBeforeRowUpdate: function (rowData, e) {
                    return $scope.onBeforerowupdate({$event: e, $data: rowData, $rowData: rowData});
                },
                onBeforeRowInsert: function (rowData, e) {
                    return $scope.onBeforerowinsert({$event: e, $data: rowData, $rowData: rowData});
                },
                sortInfo: {
                    'field': '',
                    'direction': ''
                },
                getCompiledTemplate: function (htm, row, colDef, refreshImg) {
                    return getCompiledTemplate(htm, row, colDef, refreshImg);
                },
                compileTemplateInGridScope: function (htm) {
                    return compileTemplateInGridScope(htm);
                },
                getBindDataSet: function () {
                    return $scope.binddataset;
                },
                setGridEditMode: function (val) {
                    $scope.isGridEditMode = val;
                    $rootScope.$safeApply($scope);
                },
                noChangesDetected: function () {
                    $scope.toggleMessage(true, 'info', 'No changes detected', '');
                    $rootScope.$safeApply($scope);
                },
                afterSort: function (e) {
                    $rootScope.$safeApply($scope);
                    $scope.onSort({$event: e, $data: $scope.serverData});
                },
                //Function to loop through events and trigger
                handleCustomEvents: function (e, options) {
                    if (!options) {
                        var $ele          = WM.element(e.target),
                            $button       = $ele.closest('button'),
                            key           = $button.attr('data-action-key'),
                            events        = _.find($scope.rowActions, {'key' : key}).action || '',
                            callBackScope = $button.scope(),
                            $row          = $ele.closest('tr'),
                            rowId         = $row.attr('data-row-id'),
                            data          = $scope.gridOptions.data[rowId];
                        if (events) {
                            Utils.triggerCustomEvents(e, events, callBackScope, data);
                        }
                    } else {
                        $scope.datagridElement.datagrid('toggleEditRow', e, options);
                    }
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
                if ($scope.dataset && _.get($scope.dataset, 'dataValue') !== '' && !_.isEmpty($scope.dataset)) {
                    /*Check for sanity*/
                    if ($scope.dataNavigator) {

                        $scope.dataNavigator.pagingOptions = {
                            maxResults: $scope.pagesize || 5
                        };
                        /*De-register the watch if it is exists */
                        Utils.triggerFn(navigatorResultWatch);
                        $scope.dataNavigator.dataset = $scope.binddataset;

                        /*Register a watch on the "result" property of the "dataNavigator" so that the paginated data is displayed in the live-list.*/
                        navigatorResultWatch = $scope.dataNavigator.$watch('result', function (newVal) {
                            /* Check for sanity. */
                            if (WM.isDefined(newVal)) {
                                if (WM.isArray(newVal)) {
                                    $scope.dataset = [].concat(newVal);
                                } else if (WM.isObject(newVal)) {
                                    $scope.dataset = WM.extend({}, newVal);
                                } else {
                                    $scope.dataset = newVal;
                                }
                            }
                        }, true);
                        /*De-register the watch if it is exists */
                        Utils.triggerFn(navigatorMaxResultWatch);
                        /*Register a watch on the "maxResults" property of the "dataNavigator" so that the "pageSize" is displayed in the live-list.*/
                        navigatorMaxResultWatch = $scope.dataNavigator.$watch('maxResults', function (newVal) {
                            $scope.pagesize = newVal;
                        });

                        $scope.dataNavigatorWatched = true;
                        //If dataset is a pageable object, data is present inside the content property
                        if (WM.isObject($scope.dataset) && Utils.isPageable($scope.dataset)) {
                            $scope.__fullData = $scope.dataset.content;
                        } else {
                            $scope.__fullData = $scope.dataset;
                        }
                        $scope.dataset    = undefined;
                    }
                }
            };

            /*Function to dynamically fetch column definitions.*/
            $scope.fetchDynamicColumnDefs = function () {
                var fields,
                    result,
                    f,
                    dataKeys;

                /*Invoke the function to fetch the reference variable details when a grid2 is bound to another grid1 and grid1 is bound to a variable.*/
                result = LiveWidgetUtils.fetchReferenceDetails($scope);
                if (result.fields) {
                    f = result.fields;
                    dataKeys = Object.keys(f);
                    fields = {};
                    dataKeys.forEach(function (key) {
                        fields[key] = '';
                    });
                } else if (result.relatedFieldType) {
                    /*Invoke the function to fetch sample data-structure for the field.*/
                    fields = $servicevariable.getServiceModel({
                        typeRef: result.relatedFieldType,
                        variable: result.referenceVariable
                    });
                }
                if (fields) {
                    $scope.watchVariableDataSet(fields, $scope.gridElement);
                }
            };

            $scope.isDataValid = function () {
                var error,
                    dataset = $scope.dataset || {};

                /*In case "data" contains "error" & "errorMessage", then display the error message in the grid.*/
                if (dataset.error) {
                    error = dataset.error;
                }
                if (dataset.data && dataset.data.error) {
                    if (dataset.data.errorMessage) {
                        error = dataset.data.errorMessage;
                    }
                }
                if (error) {
                    setGridData([]);
                    $scope.datagridElement.datagrid('setStatus', 'error', error);
                    return false;
                }
                return true;
            };

            $scope.watchVariableDataSet = function (newVal, element) {
                /* TODO: In studio mode, service variable data should initially
                    be empty array, and metadata should be passed separately. */
                var variableName,
                    widgetName,
                    variableObj,
                    elScope,
                    result,
                    isBoundToSelectedItem,
                    isBoundToSelectedItemSubset,
                    isBoundToQueryServiceVariable,
                    isBoundToProcedureServiceVariable,
                    isBoundToFilter,
                    gridSortString,
                    variableSortString,
                    columns,
                    isPageable = false,
                    widgetBindingDetails,
                    relatedTables,
                    wp;
                $scope.datagridElement.datagrid('setStatus', 'loading', $scope.loadingdatamsg);
                //After the setting the watch on navigator, dataset is triggered with undefined. In this case, return here.
                if ($scope.dataNavigatorWatched && _.isUndefined(newVal) && $scope.__fullData) {
                    return;
                }
                result = Utils.getValidJSON(newVal);

                /*Reset the values to undefined so that they are calculated each time.*/
                isBoundToLiveVariable                = undefined;
                isBoundToLiveVariableRoot            = undefined;
                isBoundToServiceVariable             = undefined;
                isBoundToFilter                      = undefined;
                $scope.gridVariable                  = '';
                /* Always set newcolumns equal to value of redrawColumns coming from datamodel design controller. */
                if (CONSTANTS.isStudioMode && WM.isDefined($scope.$parent) && $scope.$parent.redrawColumns) {
                    $scope.newcolumns = $scope.$parent.redrawColumns;
                }

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
                    variableSortString = Utils.getOrderByExpr(newVal.sort);
                    newVal = newVal.content;
                    isPageable = true;
                }
                //If value is empty or in studio mode, dont enable the navigation
                if (CONSTANTS.isRunMode && newVal && _.get(newVal, 'dataValue') !== '' && !_.isEmpty(newVal)) {
                    if ($scope.shownavigation && !$scope.dataNavigatorWatched) {
                        $scope.enablePageNavigation();
                        return;
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
                    isBoundToVariable = $scope.binddataset.indexOf('bind:Variables.') !== -1;
                    isBoundToWidget = $scope.binddataset.indexOf('bind:Widgets.') !== -1;
                    if (isBoundToVariable) {
                        /*the binddataset comes as bind:Variables.VariableName.dataset.someOther*/
                        variableName = $scope.binddataset.replace('bind:Variables.', '');
                        variableName = variableName.substr(0, variableName.indexOf('.'));
                    } else if (isBoundToWidget) {
                        widgetName = $scope.binddataset.replace('bind:Widgets.', '').split(".")[0];
                        isBoundToFilter = $scope.Widgets[widgetName] && ($scope.Widgets[widgetName]._widgettype === 'wm-livefilter' || $scope.Widgets[widgetName].widgettype === 'wm-livefilter');

                        $scope.isBoundToFilter = isBoundToFilter;
                        $scope.widgetName = widgetName;

                        variableName = Utils.getVariableName($scope);
                        variableObj = element.scope().Variables && element.scope().Variables[variableName];
                        isBoundToSelectedItem = $scope.binddataset.indexOf('selecteditem') !== -1;
                        isBoundToSelectedItemSubset = $scope.binddataset.indexOf('selecteditem.') !== -1;
                        if (isBoundToSelectedItemSubset || isBoundToSelectedItem) {
                            if (variableName === null) {
                                widgetBindingDetails = LiveWidgetUtils.fetchReferenceDetails($scope);
                                if (!widgetBindingDetails.fields) {
                                    relatedTables = (widgetBindingDetails.referenceVariable && widgetBindingDetails.referenceVariable.relatedTables) || [];
                                    variableName = widgetBindingDetails.referenceVariableName;
                                    relatedTables.forEach(function (val) {
                                        if (val.columnName === widgetBindingDetails.relatedFieldName) {
                                            variableName = val.watchOn;
                                        }
                                    });
                                }
                            }
                            /*Check for studio mode.*/
                            if (CONSTANTS.isStudioMode && newVal !== '') {
                                /*If "newVal" is not available(in studio mode, newVal will be same as bindDataSet with 'bind:' removed; for the first time)
                                 , fetch column definitions dynamically.*/
                                if (($scope.binddataset === ('bind:' + newVal)) || (WM.isArray(newVal) && !newVal.length)) {
                                    $scope.fetchDynamicColumnDefs();
                                    return;
                                }
                            }
                        }
                    }
                    elScope = element.scope();

                    /*TODO to remove is studiomode check*/
                    if ($scope.variableName && (variableName !== $scope.variableName) && CONSTANTS.isStudioMode) {
                        $scope.fullFieldDefs = [];
                        $scope.headerConfig   = [];
                    }
                    $scope.variableName = variableName;
                    variableObj = elScope.Variables && elScope.Variables[$scope.variableName];

                    $scope.setDataGridOption('searchHandler', defaultSearchHandler);
                    if (variableObj && isBoundToVariable) {
                        $scope.variableType = variableObj.category;

                        /*Check if the variable is a liveVariable*/
                        isBoundToLiveVariable = $scope.variableType === 'wm.LiveVariable';
                        isBoundToLiveVariableRoot = isBoundToLiveVariable &&
                            $scope.binddataset.indexOf('dataSet.') === -1 &&
                            $scope.binddataset.indexOf('selecteditem') === -1;
                        isBoundToServiceVariable = $scope.variableType === 'wm.ServiceVariable';
                        if (isBoundToServiceVariable && variableObj.serviceType === 'DataService') {
                            isBoundToProcedureServiceVariable = variableObj.controller === 'ProcedureExecution';
                            isBoundToQueryServiceVariable     = variableObj.controller === 'QueryExecution';
                        }

                        if (isBoundToLiveVariable || isBoundToQueryServiceVariable) {
                            if (!_.isEmpty($scope.sortInfo)) {
                                gridSortString = $scope.sortInfo.field + ' ' + $scope.sortInfo.direction;
                                variableSortString = _.get(variableObj, ['_options', 'orderBy']) || variableSortString;
                                if (gridSortString !== variableSortString) {
                                    $scope.datagridElement.datagrid('resetSortIcons');
                                    $scope.sortInfo = {};
                                    $scope.setDataGridOption('sortInfo', {});
                                }
                            }
                        }
                        if (isBoundToLiveVariable) {
                            $scope.setDataGridOption('searchHandler', searchGrid);
                            $scope.setDataGridOption('sortHandler', sortHandler);
                            setImageProperties(variableObj);
                        } else if (isBoundToQueryServiceVariable) {
                            /*Calling the specific search and sort handlers*/
                            $scope.setDataGridOption('sortHandler', sortHandler);
                        } else if (isBoundToProcedureServiceVariable) {
                            $scope.setDataGridOption('searchHandler', handleOperation);
                            $scope.setDataGridOption('sortHandler', handleOperation);
                        } else {
                            /*Calling the specific search and sort handlers*/
                            $scope.setDataGridOption('searchHandler', handleOperation);
                            if (isPageable) {
                                $scope.setDataGridOption('sortHandler', sortHandler);
                            } else {
                                $scope.setDataGridOption('sortHandler', handleOperation);
                            }
                        }
                    } else if (isBoundToFilter) {
                        /*If the variable is deleted hiding the spinner and showing the no data found message*/
                        $scope.setDataGridOption('sortHandler', sortHandler);
                        setImageProperties(variableObj);
                    } else if ($scope.binddataset.indexOf('bind:Widgets') === -1) {
                        /*if the grid is not bound to widgets*/
                        /*If the variable is deleted hiding the spinner and showing the no data found message*/
                        $scope.datagridElement.datagrid('setStatus', 'error', $scope.nodatamessage);
                    }
                }
                /* Disable/Update the properties in properties panel which are dependent on binddataset value. */
                if (CONSTANTS.isStudioMode) {
                    wp = $scope.widgetProps;
                    /*Make the "pageSize" property hidden so that no editing is possible for live and query service variables*/
                    wp.pagesize.show    = !(isBoundToLiveVariable || isBoundToQueryServiceVariable || isBoundToFilter);
                    wp.exportformat.show  = wp.exportformat.showindesigner  = isBoundToLiveVariable || isBoundToFilter;
                    wp.multiselect.show = wp.multiselect.showindesigner = ($scope.isPartOfLiveGrid ? false : wp.multiselect.show);
                    /* If bound to live filter result, disable grid search. */
                    if (isBoundToWidget && $scope.widgetid && _.includes($scope.binddataset, 'livefilter')) {
                        if ($scope.filtermode) {
                            $rootScope.$emit('update-widget-property', 'filtermode', '');
                        }
                        wp.filtermode.disabled = true;
                    } else {
                        wp.filtermode.disabled = false;
                    }
                }
                if (!WM.isObject(newVal) || (newVal && newVal.dataValue === '')) {
                    if (newVal === '' || (newVal && newVal.dataValue === '')) {
                        /* clear the grid columnDefs and data in studio */
                        if (CONSTANTS.isStudioMode && $scope.newcolumns) {
                            /* if new columns to be rendered, create new column defs*/
                            $scope.prepareFieldDefs();
                            $scope.newcolumns = false;
                        }
                        if (!$scope.variableInflight) {
                            /* If variable has finished loading and resultSet is empty,
                             * render empty data in both studio and run modes */
                            setGridData([]);
                        }
                    }
                    return;
                }

                if (newVal) {
                    if (CONSTANTS.isStudioMode) {
                        $scope.createGridColumns(isBoundToLiveVariableRoot ? newVal.data : newVal, newVal.propertiesMap || undefined);
                        $scope.newcolumns = false;
                    }
                    /*Set the type of the column to the default variable type*/
                    if ($scope.fieldDefs && $scope.columnDefsExists() && newVal.propertiesMap) {
                        columns = Utils.fetchPropertiesMapColumns(newVal.propertiesMap);
                        $scope.fieldDefs.forEach(function (fieldDef) {
                            Object.keys(columns).forEach(function (key) {
                                if (key === fieldDef.field) {
                                    fieldDef.type = columns[key].type;
                                }
                            });
                        });
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
                        $scope.newcolumns = false;
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
                    gridObj,
                    options = {};

                $scope.fieldDefs = [];
                /* if properties map is existed then fetch the column configuration for all nested levels using util function */
                if (propertiesMap) {
                    columns = Utils.fetchPropertiesMapColumns(propertiesMap);
                    properties = [Utils.resetObjectWithEmptyValues(columns)];
                } else {
                    properties = data;
                }
                options.columnUpperBound = $scope.displayAllFields ? -1 : 10;
                /*call utility function to prepare fieldDefs for grid against given data (A MAX OF 10 COLUMNS ONLY)*/
                defaultFieldDefs = Utils.prepareFieldDefs(properties, options);
                /*append additional properties*/
                WM.forEach(defaultFieldDefs, function (columnDef) {
                    columnDef.pcDisplay = true;
                    columnDef.mobileDisplay = true;
                    WM.forEach($scope.fullFieldDefs, function (column) {
                        if (column.field && column.field === columnDef.field) {
                            columnDef.pcDisplay = column.pcDisplay;
                            columnDef.mobileDisplay = column.mobileDisplay;
                            columnDef.customExpression = column.customExpression;
                            columnDef.width = column.width;
                            columnDef.textAlignment = column.textAlignment;
                            columnDef.backgroundColor = column.backgroundColor;
                            columnDef.textColor = column.textColor;
                            columnDef.widgetType = column.widgetType;
                            columnDef.displayName = column.displayName;
                            columnDef.class = column.class;
                            columnDef.ngclass = column.ngclass;
                            columnDef.formatpattern = column.formatpattern;
                            columnDef.datepattern = column.datepattern;
                            columnDef.currencypattern = column.currencypattern;
                            columnDef.fractionsize = column.fractionsize;
                            columnDef.suffix = column.suffix;
                            columnDef.prefix = column.prefix;
                            columnDef.accessroles = column.accessroles;
                        }
                    });
                    /* if properties map is provided, append the same to column defs*/
                    if (propertiesMap) {
                        columnDef.type = columns[columnDef.field].type;
                        columnDef.primaryKey = columns[columnDef.field].isPrimaryKey;
                        columnDef.generator = columns[columnDef.field].generator;
                        columnDef.readonly = WM.isDefined(columns[columnDef.field].readonly) ?
                                    columns[columnDef.field].readonly === 'true' : (_.includes(['identity', 'uniqueid'], columnDef.generator) && columns[columnDef.field].isRelatedPk !== 'true');
                        if (columnDef.type === 'timestamp' || columnDef.type === 'datetime' || columnDef.type === 'date') {
                            if (!columnDef.formatpattern) {
                                columnDef.formatpattern = 'toDate';
                            }
                            if (!columnDef.datepattern) {
                                columnDef.datepattern = columnDef.type === 'date' ? 'yyyy-MM-dd' : 'dd-MMM-yyyy HH:mm:ss';
                            }
                        }
                        if (columnDef.type === 'blob' && !columnDef.customExpression) {
                            if (columnDef.widgetType === 'image') {
                                columnDef.customExpression = '<img ng-if="columnValue != null" width="48px" class="wm-icon wm-icon24 wi wi-file" data-ng-src="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"/>';
                            } else {
                                columnDef.customExpression = '<a ng-if="columnValue != null" class="col-md-9" target="_blank" data-ng-href="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"><i class="wm-icon wm-icon24 wi wi-file"></i></a>';
                            }
                        }
                    }
                    //For readonly grid each field should be checked on readonly
                    if (!$scope.editmode) {
                        columnDef.readonly = true;
                    }
                });

                /*prepare a copy of fieldDefs prepared
                 (defaultFieldDefs will be passed to markup and fieldDefs are used for grid)
                 (a copy is kept to prevent changes made by ng-grid in the fieldDefs)
                 */
                $scope.fieldDefs = Utils.getClonedObject(defaultFieldDefs);

                /*push the fieldDefs in respective grid markup*/
                gridObj = {
                    widgetName : $scope.name,
                    fieldDefs: defaultFieldDefs,
                    scopeId: $scope.$id
                };
                $scope.updateMarkupForGrid(gridObj);
                $scope.setDataGridOption('colDefs', Utils.getClonedObject($scope.fieldDefs));
            };

            $scope.setDataGridOption = function (optionName, newVal, forceSet) {
                if (!$scope.datagridElement.datagrid('instance')) {
                    return;
                }
                var option = {};
                if (WM.isDefined(newVal) && (!WM.equals(newVal, $scope.gridOptions[optionName]) || forceSet)) {
                    option[optionName] = newVal;
                    $scope.datagridElement.datagrid('option', option);
                    $scope.gridOptions[optionName] = newVal;
                }
            };

            $scope.initiateSelectItem = function (index, row, skipSelectItem, isStaticVariable, callBack) {
                /*index === "last" indicates that an insert operation has been successfully performed and navigation to the last page is required.
                * Hence increment the "dataSize" by 1.*/
                if (index === 'last') {
                    if (!isStaticVariable) {
                        $scope.dataNavigator.dataSize += 1;
                    }
                    /*Update the data in the current page in the grid after insert/update operations.*/
                    if (!$scope.shownavigation) {
                        index = 'current';
                    }
                }
                /*Re-calculate the paging values like pageCount etc that could change due to change in the dataSize.*/
                $scope.dataNavigator.calculatePagingValues();
                $scope.dataNavigator.navigatePage(index, null, true, function () {
                    if ($scope.shownavigation || isStaticVariable) {
                        selectItemOnSuccess(row, skipSelectItem, callBack);
                    }
                });
            };

            $scope.selectItem = function (item, data) {
                /* server is not updating immediately, so set the server data to success callback data */
                if (data) {
                    $scope.serverData = data;
                }
                $scope.datagridElement.datagrid('selectRow', item, true);
            };

            /** TODO deprecate this highlight the given row and use selectItem **/
            $scope.highlightRow = $scope.selectItem;

            /* deselect the given item*/
            $scope.deselectItem = function (item) {
                $scope.datagridElement.datagrid('deselectRow', item);
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

            $scope.deleteRow = function (evt) {
                var row;
                if (evt && evt.target) {
                    $scope.datagridElement.datagrid('deleteRowAndUpdateSelectAll', evt);
                } else {
                    row = evt || $scope.selectedItems[0];
                    deleteRecord(row);
                }
            };

            $scope.editRow = function (evt) {
                var row;
                if (evt && evt.target) {
                    $scope.datagridElement.datagrid('toggleEditRow', evt);
                } else {
                    row = evt || $scope.selectedItems[0];
                    $scope.gridOptions.beforeRowUpdate(row);
                }
            };

            $scope.addRow = function () {
                $scope.addNewRow();
            };


            $scope.onRecordDelete = function (callBack) {
                var index;
                /*Check for sanity*/
                if ($scope.dataNavigator) {
                    $scope.dataNavigator.dataSize -= 1;
                    $scope.dataNavigator.calculatePagingValues();
                    /*If the current page does not contain any records due to deletion, then navigate to the previous page.*/
                    index = $scope.dataNavigator.pageCount < $scope.dataNavigator.dn.currentPage ? 'prev' : undefined;
                    $scope.dataNavigator.navigatePage(index, null, true, function () {
                        $timeout(function () {
                            Utils.triggerFn(callBack);
                        }, undefined, false);
                    });
                }
            };

            $scope.call = function (operation, data, success, error) {
                data.success = success;
                data.error = error;
                switch (operation) {
                case "create":
                    insertRecord(data);
                    break;
                case "update":
                    updateRecord(data);
                    break;
                case "delete":
                    deleteRecord(data);
                    break;
                }
            };
            //On click of item in export menu, download the file in respective format
            $scope.export = function ($item) {
                var filterFields,
                    variable     = $scope.gridElement.scope().Variables[$scope.variableName],
                    sortOptions  = _.isEmpty($scope.sortInfo) ? '' : $scope.sortInfo.field + ' ' + $scope.sortInfo.direction;
                if ($scope.isBoundToFilter) {
                    $scope.Widgets[$scope.widgetName].applyFilter({'orderBy': sortOptions, 'exportFormat': $item.label});
                } else {
                    filterFields = $scope.filterFields || {};
                    variable.download({
                        'matchMode'    : 'anywhere',
                        'filterFields' : filterFields,
                        'orderBy'      : sortOptions,
                        'exportFormat' : $item.label,
                        'logicalOp'    : 'AND'
                    });
                }
            };
            //Populate the _actions based on the position property
            $scope.populateActions = function () {
                $scope._actions.header = [];
                $scope._actions.footer = [];
                _.forEach($scope.actions, function (action) {
                    if (_.includes(action.position, 'header')) {
                        $scope._actions.header.push(action);
                    }
                    if (_.includes(action.position, 'footer')) {
                        $scope._actions.footer.push(action);
                    }
                });
            };
            //Function to be executed on any row filter change
            $scope.onRowFilterChange = function () {
                var searchObj = [];
                //Convert row filters to a search object and call search handler
                _.forEach($scope.rowFilter, function (value, key) {
                    if (WM.isDefined(value.value) || _.includes($scope.emptyMatchModes, value.matchMode)) {
                        searchObj.push({
                            'field'     : key,
                            'value'     : value.value,
                            'matchMode' : value.matchMode
                        });
                    }
                });
                $scope.gridOptions.searchHandler(searchObj, undefined, 'search');
            };
            //Function to be executed on filter condition change
            $scope.onFilterConditionSelect = function (field, value) {
                $scope.rowFilter[field] = $scope.rowFilter[field] || {};
                $scope.rowFilter[field].matchMode = value;
                if (_.includes($scope.emptyMatchModes, value)) {
                    $scope.rowFilter[field].value = undefined;
                }
                $scope.onRowFilterChange();
            };
            //Function to be executed on clearing a row filter
            $scope.clearRowFilter = function (field) {
                if ($scope.rowFilter && $scope.rowFilter[field]) {
                    $scope.rowFilter[field].value = undefined;
                    $scope.onRowFilterChange();
                }
            };
            //Show clear icon if value exists
            $scope.showClearIcon = function (field) {
                var value = $scope.rowFilter[field] && $scope.rowFilter[field].value;
                return WM.isDefined(value) && value !== '' && value !== null;
            };
            //Function to display the toaster type can be error or success
            $scope.toggleMessage = function (show, type, msg, header) {
                if (show && msg) {
                    wmToaster.show(type, WM.isDefined(header) ? header : type.toUpperCase(), msg);
                } else {
                    wmToaster.hide();
                }
            };
        }])
/**
 * @ngdoc directive
 * @name wm.widgets.grid.directive:wmGridColumnGroup
 * @restrict E
 *
 * @description
 * The `wmGridColumnColumn` serves the purpose of providing column group definitions to the parent `wmGrid` directive.
 * `wmGridColumnColumn` is internally used by `wmGrid`.
 *
 * @requires LiveWidgetUtils
 *
 * @param {string=} caption
 *                  Sets the title of the column.
 * @param {string=} name
 *                  Sets the name of the column
 */
    .directive('wmGridColumnGroup', ['LiveWidgetUtils', 'CONSTANTS', 'BindingManager', 'Utils', function (LiveWidgetUtils, CONSTANTS, BindingManager, Utils) {
        'use strict';

        return {
            'restrict': 'E',
            'scope': true,
            'template': '<div ng-transclude></div>',
            'replace': true,
            'transclude': true,
            'link': {
                'pre': function (scope, element, attrs) {
                    var exprWatchHandlers = [],
                        $parentEl         = element.parent(),
                        parentScope       = scope.$parent,
                        config            = {
                            'field'           : attrs.name,
                            'displayName'     : attrs.caption,
                            'columns'         : [],
                            'isGroup'         : true,
                            'accessroles'     : attrs.accessroles,
                            'backgroundColor' : attrs.backgroundcolor,
                            'textAlignment'   : attrs.textalignment || 'center',
                            'class'           : attrs.colClass || ''
                        };
                    //Watch any property if it is bound
                    function watchProperty(property, expression) {
                        exprWatchHandlers[property] = BindingManager.register(parentScope, expression, function (newVal) {
                            if (WM.isDefined(newVal)) {
                                if (property === 'displayName') {
                                    scope.datagridElement.datagrid('setColumnProp', config.field, property, newVal, true);
                                }
                            }
                        }, {'deepWatch': true, 'allowPageable': true, 'acceptsArray': false});
                    }

                    LiveWidgetUtils.setHeaderConfigForTable(parentScope.headerConfig, config, $parentEl);

                    if (CONSTANTS.isRunMode) {
                        //Check if any property is bound and watch on that expression
                        _.each(config, function (value, property) {
                            if (Utils.stringStartsWith(value, 'bind:')) {
                                watchProperty(property, value.replace('bind:', ''));
                            }
                        });
                        /*destroy watch handler on scope destroy*/
                        scope.$on('$destroy', function () {
                            _.forEach(exprWatchHandlers, Utils.triggerFn);
                        });
                    }
                }
            }
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
  <example module="wmCore">
      <file name="index.html">
          <div data-ng-controller="Ctrl" class="wm-app">
              <wm-grid dataset="bind:Variables.gridVariable.dataSet">
                  <wm-grid-column binding="deptid" caption="deptid" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="budget" caption="budget" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="location" caption="location" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="q1" caption="q1" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="q2" caption="q2" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="q3" caption="q3" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="name" caption="name" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
                  <wm-grid-column binding="deptcode" caption="deptcode" pcdisplay="true" mobiledisplay="true"></wm-grid-column>
              </wm-grid>
          </div>
      </file>
      <file name="script.js">
          function Ctrl($scope) {
              var deptData = '{"name":"HrdbDepartmentData","type":"Department","isList":true,"owner":"App","editJson":"","isBound":"","dataSet":{"data":[{"deptid":1,"name":"Engineering","budget":1936760,"q1":445455,"q2":522925,"q3":426087,"q4":542293,"deptcode":"Eng","location":"San Francisco","tenantid":1},{"deptid":2,"name":"Marketing","budget":1129777,"q1":225955,"q2":271146,"q3":327635,"q4":305040,"deptcode":"Mktg","location":"New York","tenantid":1},{"deptid":3,"name":"General and Admin","budget":1452570,"q1":435771,"q2":290514,"q3":348617,"q4":377668,"deptcode":"G&A","location":"San Francisco","tenantid":1},{"deptid":4,"name":"Sales","budget":2743744,"q1":493874,"q2":658499,"q3":713373,"q4":877998,"deptcode":"Sales","location":"Austin","tenantid":1},{"deptid":5,"name":"Professional Services","budget":806984,"q1":201746,"q2":201746,"q3":177536,"q4":225955,"deptcode":"PS","location":"San Francisco","tenantid":2}],"propertiesMap":{"columns":[{"fieldName":"deptid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"DEPTID","isPrimaryKey":true,"notNull":true,"length":255,"precision":19,"generator":"identity","isRelated":false,"defaultValue":null},{"fieldName":"name","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"NAME","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"budget","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"BUDGET","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q1","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q1","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q2","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q2","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q3","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q3","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q4","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q4","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"deptcode","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"DEPTCODE","isPrimaryKey":false,"notNull":false,"length":20,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"location","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"LOCATION","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"tenantid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"TENANTID","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null}],"primaryKeys":["deptid"],"entityName":"Department","fullyQualifiedName":"com.hrdb.Department","tableType":"TABLE"},"relatedData":{},"pagingOptions":{"dataSize":5,"maxResults":20}},"dataBinding":{},"saveInPhonegap":false,"maxResults":20,"designMaxResults":10,"service":"","operation":"read","operationType":"","startUpdate":true,"autoUpdate":false,"inFlightBehavior":"executeLast","transformationRequired":false,"columnField":"","dataField":"","onCanUpdate":"","onBeforeUpdate":"","onResult":"","onSuccess":"","onError":"","onPrepareSetData":"","liveSource":"hrdb","ignoreCase":false,"matchMode":"start","orderBy":"","category":"wm.LiveVariable","isDefault":true,"_id":"wm-wm.LiveVariable1428412293661","package":"com.hrdb.Department","tableName":"DEPARTMENT","tableType":"TABLE","propertiesMap":{"columns":[{"fieldName":"deptid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"DEPTID","isPrimaryKey":true,"notNull":true,"length":255,"precision":19,"generator":"identity","isRelated":false,"defaultValue":null},{"fieldName":"name","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"NAME","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"budget","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"BUDGET","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q1","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q1","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q2","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q2","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q3","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q3","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"q4","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"Q4","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"deptcode","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"DEPTCODE","isPrimaryKey":false,"notNull":false,"length":20,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"location","type":"string","hibernateType":"string","fullyQualifiedType":"string","columnName":"LOCATION","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null},{"fieldName":"tenantid","type":"integer","hibernateType":"integer","fullyQualifiedType":"integer","columnName":"TENANTID","isPrimaryKey":false,"notNull":false,"length":255,"precision":19,"generator":null,"isRelated":false,"defaultValue":null}],"primaryKeys":["deptid"],"entityName":"Department","fullyQualifiedName":"com.hrdb.Department","tableType":"TABLE"},"bindCount":1}',
                 deptVar = JSON.parse(deptData);
              deptVar.getPrimaryKey = function () {return ["deptid"]};
              $scope.Variables = {"gridVariable": deptVar};
          }
      </file>
  </example>
 */
    .directive('wmGridColumn', ['$parse', 'Utils', 'CONSTANTS', 'BindingManager', 'LiveWidgetUtils', function ($parse, Utils, CONSTANTS, BindingManager, LiveWidgetUtils) {
        'use strict';

        return {
            'restrict': 'E',
            'scope': true,
            'template': '<div></div>',
            'replace': true,
            'compile': function (tElement) {
                return {
                    'pre': function (scope, element, attrs) {

                        /*
                         * Class : ColumnDef
                         * Description : ColumnDef is intermediate class which extends FieldDef base class
                         * */
                        scope.ColumnDef = function () {};
                        scope.ColumnDef.prototype = new wm.baseClasses.FieldDef();
                        scope.ColumnDef.prototype.setProperty = function (property, newval) {
                            this.$is.setProperty.call(this, property, newval);
                            if (property === 'displayName') {
                                scope.datagridElement.datagrid('setColumnProp', this.field, property, newval);
                            } else {
                                this.$is.redraw && this.$is.redraw(true);
                            }
                        };
                        /*
                         * Class : fieldDef
                         * Description : fieldDef is intermediate class which extends FieldDef base class
                         * */
                        scope.fieldDef = function () {};
                        scope.fieldDef.prototype = new wm.baseClasses.FieldDef();
                        scope.fieldDef.prototype.setProperty = function (property, newval) {
                            //Get the scope of the current editable widget and set the value
                            var $el     = scope.datagridElement.find('[data-field-name="' + this.field + '"]'),
                                elScope = $el.isolateScope();
                            property = property === 'value' ? 'datavalue' : property;
                            elScope[property] = newval;
                        };
                        scope.fieldDef.prototype.getProperty = function (property) {
                            //Get the scope of the current editable widget and get the value
                            var $el     = scope.datagridElement.find('[data-field-name="' + this.field + '"]'),
                                elScope = $el.isolateScope();
                            property = property === 'value' ? 'datavalue' : property;
                            return elScope[property];
                        };

                        var index,
                            fieldTypeWidgetTypeMap = LiveWidgetUtils.getFieldTypeWidgetTypesMap(),
                            exprWatchHandlers = [],
                            config,
                            textAlignment = attrs.textalignment || 'left',
                            backgroundColor = attrs.backgroundcolor || '',
                            textColor = attrs.textcolor || '',
                            width = attrs.width === 'px' ?  '' : (attrs.width || ''),
                            styleDef = 'width: ' + width +
                                '; background-color: ' + backgroundColor +
                                '; color: ' + textColor + ';',
                            //Obj of its base with setter and getter defined
                            columnDef = new scope.ColumnDef(),
                            fieldDef = new scope.fieldDef(),
                            columnDefProps,
                            updateCustomExpression = function (column) {
                                LiveWidgetUtils.setColumnConfig(column);
                            },
                            parentScope = scope.$parent,
                            $parentEl   = element.parent(),
                            variable,
                            events,
                            fieldDefProps = {
                                'field': attrs.binding
                            },
                            skipWatchProps = ['dataset', 'defaultvalue', 'disabled', 'readonly'];
                        function watchProperty(property, expression) {
                            exprWatchHandlers[property] = BindingManager.register(parentScope, expression, function (newVal) {
                                if (WM.isDefined(newVal)) {
                                    columnDef.setProperty(property, newVal);
                                }
                            }, {"deepWatch": true, "allowPageable": true, "acceptsArray": false});
                        }

                        //Will be used in ColumnDef prototype methods to re-render grid.
                        scope.ColumnDef.prototype.$is = parentScope;
                        scope.fieldDef.prototype.$is  = parentScope;
                        //Get the fefault filter widget type
                        function getFilterWidget(type) {
                            var widget = fieldTypeWidgetTypeMap[type] && fieldTypeWidgetTypeMap[type][0];
                            if (type === 'boolean') {
                                widget = 'select';
                            }
                            if (_.includes(['text', 'number', 'select', 'autocomplete', 'date', 'time', 'datetime'], widget)) {
                                return widget;
                            }
                            return 'text';
                        }
                        columnDefProps = {
                            'field'             : attrs.binding,
                            'displayName'       : attrs.caption,
                            'pcDisplay'         : WM.isDefined(attrs.pcdisplay) ? attrs.pcdisplay === 'true' : true,
                            'mobileDisplay'     : WM.isDefined(attrs.mobiledisplay) ? attrs.mobiledisplay === 'true' : true,
                            'width'             : width,
                            'textAlignment'     : textAlignment,
                            'backgroundColor'   : backgroundColor,
                            'textColor'         : textColor,
                            'type'              : attrs.type || 'string',
                            'primaryKey'        : attrs.primaryKey ? $parse(attrs.primaryKey)() : '',
                            'generator'         : attrs.generator,
                            'isRelatedPk'       : attrs.isRelatedPk === 'true',
                            'widgetType'        : attrs.widgetType,
                            'style'             : styleDef,
                            'class'             : attrs.colClass || '',
                            'ngclass'           : attrs.colNgClass || '',
                            'datepattern'       : attrs.datepattern,
                            'formatpattern'     : attrs.formatpattern,
                            'currencypattern'   : attrs.currencypattern,
                            'fractionsize'      : attrs.fractionsize,
                            'suffix'            : attrs.suffix,
                            'prefix'            : attrs.prefix,
                            'accessroles'       : attrs.accessroles || '',
                            'editWidgetType'    : attrs.editWidgetType || (fieldTypeWidgetTypeMap[attrs.type] && fieldTypeWidgetTypeMap[attrs.type][0]) || 'text',
                            'dataset'           : attrs.dataset,
                            'datafield'         : attrs.datafield,
                            'placeholder'       : attrs.placeholder,
                            'disabled'          : !attrs.disabled ? false : (attrs.disabled === 'true' || attrs.disabled),
                            'required'          : !attrs.required ? false : (attrs.required === 'true' || attrs.required),
                            'displaylabel'      : attrs.displaylabel,
                            'searchkey'         : attrs.searchkey,
                            'displayfield'      : attrs.displayfield,
                            'sortable'          : attrs.sortable !== 'false',
                            'searchable'        : (attrs.type === 'blob' || attrs.type === 'clob') ? false : attrs.searchable !== 'false',
                            'show'              : attrs.show === 'false' ? false : (attrs.show === 'true' || !attrs.show || attrs.show),
                            'rowactionsposition': attrs.rowactionsposition,
                            'filterwidget'      : attrs.filterwidget || getFilterWidget(attrs.type || 'string'),
                            'filterplaceholder' : attrs.filterplaceholder,
                            'relatedEntityName' : attrs.relatedEntityName,
                            'checkedvalue'      : attrs.checkedvalue,
                            'uncheckedvalue'    : attrs.uncheckedvalue
                        };
                        LiveWidgetUtils.setHeaderConfigForTable(parentScope.headerConfig, {
                            'field'         : columnDefProps.field,
                            'displayName'   : columnDefProps.displayName
                        }, $parentEl);
                        columnDefProps.defaultvalue = LiveWidgetUtils.getDefaultValue(attrs.defaultvalue, columnDefProps.type, columnDefProps.editWidgetType);
                        events = _.filter(_.keys(attrs), function (key) {return _.startsWith(key, 'on'); });
                        _.forEach(events, function (eventName) {
                            columnDefProps[eventName] = attrs[eventName];
                        });
                        //Extends the columnDef class with column meta data
                        WM.extend(columnDef, columnDefProps);
                        WM.extend(fieldDef, fieldDefProps);
                        parentScope.formfields[fieldDef.field] = fieldDef;
                        if (tElement.context.innerHTML) {
                            columnDef.customExpression = tElement.context.innerHTML;
                        }
                        columnDef.readonly = WM.isDefined(attrs.readonly) ? attrs.readonly === 'true' : (_.includes(['identity', 'uniqueid'], columnDef.generator) && !columnDef.isRelatedPk);

                        if (columnDef.type === 'blob' && !columnDef.customExpression) {
                            if (columnDef.widgetType !== 'image') {
                                columnDef.customExpression = '<a ng-if="columnValue != null" class="col-md-9" target="_blank" data-ng-href="{{contentBaseUrl + row[primaryKey] + \'/content/\'+ colDef.field}}"><i class="wm-icon wm-icon24 wi wi-file"></i></a>';
                            }
                        }
                        /* push the fieldDef in the object meant to have all fields */
                        index = parentScope.fullFieldDefs.push(columnDef) - 1;
                        columnDef.index = index;
                        /* Backward compatibility for widgetType */
                        if (columnDef.widgetType && !columnDef.customExpression) {
                            updateCustomExpression(columnDef);
                            if (CONSTANTS.isStudioMode && parentScope.fullFieldDefs.length === parentScope.gridColumnCount) {
                                /* Update markup for grid. */
                                config = {
                                    widgetName : scope.name,
                                    scopeId    : parentScope.$id,
                                    fieldDefs  : parentScope.fullFieldDefs
                                };
                                scope.updateMarkupForGrid(config);
                                scope.$root.$emit('save-workspace', true);
                            }
                        }
                        /*check if any attribute has binding. put a watch for the attributes*/
                        if (CONSTANTS.isRunMode) {
                            _.each(columnDef, function (value, property) {
                                if (Utils.stringStartsWith(value, 'bind:') && !_.includes(skipWatchProps, property)) {
                                    watchProperty(property, value.replace('bind:', ''));
                                }
                            });
                        }
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
                        /* push the fieldDef in the object meant for actual display in the grid (this will be passed to ng-grid) */
                        parentScope.fieldDefs.push(columnDef);
                        element.remove();
                        /*destroy watch handler on scope destroy*/
                        scope.$on('$destroy', function () {
                            _.forEach(exprWatchHandlers, Utils.triggerFn);
                        });
                        //Fetch the filter options for select widget when filtermode is row
                        if (CONSTANTS.isRunMode && parentScope.filtermode === 'multicolumn' && columnDef.filterwidget === 'select') {
                            variable = parentScope.gridElement.scope().Variables[Utils.getVariableName(parentScope)];
                            if (variable && variable.category === 'wm.LiveVariable') {
                                columnDef.isLiveVariable = true;
                                if (columnDef.relatedEntityName) {
                                    columnDef.isRelated   = true;
                                    columnDef.lookupType  = columnDef.relatedEntityName;
                                    columnDef.lookupField = _.split(columnDef.field, '.')[1];
                                }
                                LiveWidgetUtils.getDistinctValues(columnDef, variable, function (field, data, aliascolumn) {
                                    field.filterdataset = _.pull(_.map(data.content, aliascolumn), null);
                                });
                            }
                        }
                    }
                };
            }
        };
    }])
    .directive('wmGridAction', ['CONSTANTS', 'LiveWidgetUtils', function (CONSTANTS, LiveWidgetUtils) {
        'use strict';
        return {
            'restrict': 'E',
            'scope': true,
            'replace': true,
            'compile': function () {
                return {
                    'post': function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with grid scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        var parentIsolateScope,
                            $parentElement = element.parent(),
                            buttonDef =  WM.extend(LiveWidgetUtils.getButtonDef(attrs), {
                                /*iconame support for old projects*/
                                'icon': attrs.icon
                            });
                        buttonDef.position = attrs.position || 'footer';
                        if (CONSTANTS.isRunMode) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = ($parentElement && $parentElement.length > 0) ? $parentElement.closest('[data-identifier="grid"]').isolateScope() || scope.$parent : scope.$parent;
                        }
                        parentIsolateScope.actions = parentIsolateScope.actions || [];
                        parentIsolateScope.actions.push(buttonDef);

                        parentIsolateScope.populateActions();
                    }
                };
            }
        };
    }])
    .directive('wmGridRowAction', ['CONSTANTS', 'LiveWidgetUtils', function (CONSTANTS, LiveWidgetUtils) {
        'use strict';
        return {
            'restrict': 'E',
            'scope': true,
            'replace': true,
            'compile': function () {
                return {
                    'post': function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with grid scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        var parentIsolateScope,
                            buttonDef =  LiveWidgetUtils.getButtonDef(attrs),
                            $parentElement = element.parent();
                        delete buttonDef.shortcutkey;
                        if (CONSTANTS.isRunMode) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = ($parentElement && $parentElement.length > 0) ? $parentElement.closest('[data-identifier="grid"]').isolateScope() || scope.$parent : scope.$parent;
                        }
                        parentIsolateScope.rowActions = parentIsolateScope.rowActions || [];
                        parentIsolateScope.rowActions.push(buttonDef);
                    }
                };
            }
        };
    }]);
