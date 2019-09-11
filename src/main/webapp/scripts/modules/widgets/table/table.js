/*global WM, wmTable, confirm, window, wm, _, $, moment*/
/*jslint sub: true */
/*jslint todo: true */

/**
 * @ngdoc directive
 * @name wm.widgets.table.directive:wmTable
 * @restrict E
 *
 * @description
 * The `wmTable` is the data grid used to display data in a tabular manner.<br>
 * `wmTable` can be bound to variables and display the data associated with them.
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
               <wm-table  name="grid3" dataset="{{data}}" navigation="None" enablesort="false"></wm-table>
           </div>
       </file>
       <file name="script.js">
           function Ctrl($scope) {
               $scope.data = [{"deptid":1,"name":"Engineering","budget":1936760,"q1":445455,"q2":522925,"q3":426087,"q4":542293,"deptcode":"Eng","location":"San Francisco","tenantid":1},{"deptid":2,"name":"Marketing","budget":1129777,"q1":225955,"q2":271146,"q3":327635,"q4":305040,"deptcode":"Mktg","location":"New York","tenantid":1},{"deptid":3,"name":"General and Admin","budget":1452570,"q1":435771,"q2":290514,"q3":348617,"q4":377668,"deptcode":"G&A","location":"San Francisco","tenantid":1},{"deptid":4,"name":"Sales","budget":2743744,"q1":493874,"q2":658499,"q3":713373,"q4":877998,"deptcode":"Sales","location":"Austin","tenantid":1},{"deptid":5,"name":"Professional Services","budget":806984,"q1":201746,"q2":201746,"q3":177536,"q4":225955,"deptcode":"PS","location":"San Francisco","tenantid":2}];
           }
       </file>
 </example>
 */
WM.module('wm.widgets.table')
    .directive('wmTable', ['PropertiesFactory', 'WidgetUtilService', '$compile', '$controller', 'CONSTANTS', '$rootScope', '$timeout', 'Utils', 'LiveWidgetUtils', '$document', 'AppDefaults', function (PropertiesFactory, WidgetUtilService, $compile, $controller, CONSTANTS, $rs, $timeout, Utils, LiveWidgetUtils, $document, AppDefaults) {
        'use strict';
        var gridColumnCount,
            widgetProps           = PropertiesFactory.getPropertiesOf('wm.table', ['wm.base', 'wm.base.navigation', 'wm.layouts.panel.defaults']),
            gridColumnMarkup      = '',
            notifyFor             = {
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
                'loadingicon'        : true,
                'filternullrecords'  : true,
                'spacing'            : true,
                'exportformat'       : true,
                'editmode'           : CONSTANTS.isStudioMode,
                'shownewrow'         : true
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
            EDIT_MODE             = {
                'QUICK_EDIT': 'quickedit',
                'INLINE'    : 'inline',
                'FORM'      : 'form',
                'DIALOG'    : 'dialog'
            };

        function resetFlags($is) {
            $is.isBoundToStaticVariable           = false;
            $is.isBoundToLiveVariable             = false;
            $is.isBoundToLiveVariableRoot         = false;
            $is.isBoundToServiceVariable          = false;
            $is.isBoundToDataServiceType          = false;
            $is.isBoundToProcedureServiceVariable = false;
            $is.isBoundToQueryServiceVariable     = false;
            $is.isBoundToSelectedItem             = false;
            $is.isBoundToSelectedItemSubset       = false;
            $is.isBoundToFilter                   = false;
        }
        //Sets flags on data table like isBoundToLiveVariable etc.,
        function setFlags($is, eleScope) {
            var binddataset = $is.binddataset,
                variableType,
                boundToInnerDataSet,
                WidgetScopes,
                widgetType,
                widgetDetails;
            //Reset the variable and widget flags on $is before setting them.
            resetFlags($is);
            //Set the variable and widget flags on $is
            $is.isBoundToVariable = _.startsWith(binddataset, 'bind:Variables.');
            $is.isBoundToWidget   = _.startsWith(binddataset, 'bind:Widgets.');
            $is.variableName      = Utils.getVariableName($is);
            $is.variable          = _.get(eleScope.Variables, $is.variableName);
            if ($is.isBoundToVariable && $is.variable) {
                $is.variableType               = variableType = $is.variable.category;
                $is.isBoundToStaticVariable    = variableType === 'wm.Variable';
                $is.isBoundToWebSocketVariable = variableType === 'wm.WebSocketVariable';
                $is.isBoundToLiveVariable      = variableType === 'wm.LiveVariable';
                boundToInnerDataSet            = _.includes(binddataset, 'dataSet.');
                if ($is.isBoundToLiveVariable) {
                    $is.isBoundToLiveVariableRoot = !boundToInnerDataSet;
                } else {
                    $is.isBoundToServiceVariable = variableType === 'wm.ServiceVariable';
                    $is.isBoundToDataServiceType = ($is.isBoundToServiceVariable && $is.variable.serviceType === 'DataService');
                    if ($is.isBoundToDataServiceType) {
                        $is.isBoundToProcedureServiceVariable = $is.variable.controller === 'ProcedureExecution';
                        $is.isBoundToQueryServiceVariable     = $is.variable.controller === 'QueryExecution';
                    }
                }
            } else if ($is.isBoundToWidget) {
                $is.isBoundToSelectedItem       = binddataset.indexOf('selecteditem') !== -1;
                $is.isBoundToSelectedItemSubset = binddataset.indexOf('selecteditem.') !== -1;
                WidgetScopes                    = $is.Widgets;
                //Get the reference widget name. As widget can be inner widget (like Widgets.tab.Widgets.grid), find the last inner widget
                widgetDetails       = LiveWidgetUtils.getBoundWidgetDetails(binddataset, WidgetScopes);
                $is.widgetName      = widgetDetails.widgetName;
                widgetType          = _.get(widgetDetails.WidgetScopes, $is.widgetName + '._widgettype') || _.get(widgetDetails.WidgetScopes, $is.widgetName + '.widgettype');
                $is.isBoundToFilter = widgetType === 'wm-livefilter';
            }
        }

        function showExportOptions($is) {
            //showing export options in case of widget bound to live variables and query service variable.
            return $is.isBoundToLiveVariable || $is.isBoundToFilter || ($is.isBoundToQueryServiceVariable && $is.variable.isList);
        }

        return {
            'restrict'   : 'E',
            'scope'      : {
                'scopedataset'      : '=?',
                'onSelect'          : '&',
                'onDeselect'        : '&',
                'onSort'            : '&',
                'onClick'           : '&',
                'onHeaderclick'     : '&',
                'onShow'            : '&',
                'onHide'            : '&',
                'onBeforerowinsert' : '&',
                'onBeforerowdelete' : '&',
                'onRowinsert'       : '&',
                'onBeforerowupdate' : '&',
                'onRowupdate'       : '&',
                'onError'           : '&',
                'onRowdeleted'      : '&',
                'onRowdelete'       :  '&',
                'onBeforeformrender': '&',
                'onFormrender'      : '&',
                'onRowclick'        : '&',
                'onRowdblclick'     : '&',
                'onColumnselect'    : '&',
                'onColumndeselect'  : '&',
                'onEnterkeypress'   : '&',
                'onSetrecord'       : '&',
                'onDatarender'      : '&',
                'onBeforedatarender': '&',
                'onTap'             : '&',
                'onBeforeexport'    : '&'
            },
            'replace'    : true,
            'transclude' : false,
            'controller' : 'gridController',
            'template'   : function (element) {
                /*set the raw gridColumnMarkup to the local variable*/
                gridColumnMarkup = element.html();
                return '<div data-identifier="table" init-widget class="app-grid app-panel panel" apply-styles="shell">' +
                    '<div class="panel-heading" ng-if="title || subheading || iconclass || exportOptions.length || _actions.header.length">' +
                        '<h3 class="panel-title">' +
                            '<div class="pull-left"><i class="app-icon panel-icon {{iconclass}}" data-ng-show="iconclass"></i></div>' +
                            '<div class="pull-left">' +
                                '<div class="heading">{{title}}</div>' +
                                '<div class="description">{{subheading}}</div>' +
                            '</div>' +
                            '<div class="panel-actions app-datagrid-actions" ng-if="exportOptions.length || _actions.header.length">' +
                                '<wm-button ng-repeat="btn in _actions.header | filter: {widgetType: \'button\'} track by $index" caption="{{btn.displayName}}" show="bind:btn.show" class="{{btn.class}}" ng-class="{\'btn-sm\': spacing === \'condensed\', \'disabled-new\': btn.key === \'addNewRow\' && (isGridEditMode || isLoading)}" iconclass="{{btn.iconclass}}"' +
                                    ' on-click="{{btn.action}}" type="button" shortcutkey="{{btn.shortcutkey}}" tabindex="{{btn.tabindex}}"  hint="{{btn.title}}" disabled="bind:btn.disabled"></wm-button>' +
                                '<wm-anchor ng-repeat="btn in _actions.header | filter: {widgetType: \'anchor\'} track by $index" hyperlink="{{btn.hyperlink}}" target="{{btn.target}}" caption="{{btn.displayName}}" show="bind:btn.show" class="{{btn.class}}" ng-class="{\'disabled-new\': btn.key === \'addNewRow\' && (isGridEditMode || isLoading)}" iconclass="{{btn.iconclass}}"' +
                                    ' on-click="{{btn.action}}" shortcutkey="{{btn.shortcutkey}}" tabindex="{{btn.tabindex}}"  hint="{{btn.title}}"></wm-anchor>' +
                                '<wm-menu autoclose="always" caption="{{$root.appLocale.LABEL_EXPORT}}" ng-if="exportOptions.length" name="{{::name}}-export" scopedataset="exportOptions" on-select="export($item)" menuposition="down,left"></wm-menu>' +
                            '</div>' +
                        '</h3>' +
                    '</div>' +
                    '<div class="app-datagrid"></div>' +
                    '<div class="panel-footer clearfix" ng-show="_actions.footer.length || (shownavigation && (isStudioMode || (dataNavigator.dataSize > pagesize)))">' +
                        '<div class="app-datagrid-paginator" ng-show="(isStudioMode || (dataNavigator.dataSize && (dataNavigator.dataSize > pagesize))) && show && shownavigation">' +
                            '<wm-pagination show="{{show && shownavigation}}" navigationalign="{{navigationalign}}" navigationsize="{{navigationSize}}" navigation="{{navControls}}" showrecordcount="{{show && showrecordcount}}" maxsize="{{maxsize}}" boundarylinks="{{boundarylinks}}" forceellipses="{{forceellipses}}" directionlinks="{{directionlinks}}"></wm-pagination>' +
                        '</div>' +
                        '<div class="app-datagrid-actions" ng-if="_actions.footer.length">' +
                            '<wm-button ng-repeat="btn in _actions.footer | filter: {widgetType: \'button\'} track by $index" caption="{{btn.displayName}}" show="bind:btn.show" class="{{btn.class}}" ng-class="{\'btn-sm\': spacing === \'condensed\', \'disabled-new\': btn.key === \'addNewRow\' && (isGridEditMode || isLoading)}" iconclass="{{btn.iconclass}}"' +
                                ' on-click="{{btn.action}}" type="button" shortcutkey="{{btn.shortcutkey}}" tabindex="{{btn.tabindex}}"  hint="{{btn.title}}" disabled="bind:btn.disabled"></wm-button>' +
                            '<wm-anchor ng-repeat="btn in _actions.footer | filter: {widgetType: \'anchor\'} track by $index" hyperlink="{{btn.hyperlink}}" target="{{btn.target}}" caption="{{btn.displayName}}" show="bind:btn.show" class="{{btn.class}}" ng-class="{\'disabled-new\': btn.key === \'addNewRow\' && (isGridEditMode || isLoading)}" iconclass="{{btn.iconclass}}"' +
                                ' on-click="{{btn.action}}" shortcutkey="{{btn.shortcutkey}}" tabindex="{{btn.tabindex}}"  hint="{{btn.title}}"></wm-anchor>' +
                        '</div>' +
                    '</div></div>';
            },
            'compile': function (tElement, tAttr) {
                var showHeader,
                    showNavigation,
                    contextEl         = tElement.context,
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
                gridColumnCount = (gridColumnMarkup.match(/<wm-table-column/g) || []).length;
                /* in run mode there is separate controller for grid widget but not in studio mode, to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttr.name + 'Controller'] = WM.noop;
                }

                function defineSelectedItemProp(scope) {
                    Object.defineProperty(scope, 'selecteditem', {
                        get: function () {
                            if (scope.multiselect) {
                                return scope.items;
                            }
                            if (_.isEmpty(scope.items)) {
                                return {};
                            }
                            return scope.items[0];
                        },
                        set: function (val) {
                            /*Select the rows in the table based on the new selected items passed*/
                            scope.items.length = 0;
                            scope.callDataGridMethod('selectRows', val);
                        }
                    });
                }

                return {
                    'pre': function ($is, element, attrs) {

                        $is.$on('security:before-child-remove', function (evt, childScope, childEl, childAttrs) {
                            evt.stopPropagation();
                            if (childAttrs.key === 'addNewRow') {
                                $is._doNotAddNew = true;
                            }
                        });

                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        /*Set the "allowPageable" flag in the scope to indicate that the grid accepts Pageable objects.*/
                        $is.allowPageable = true;
                        /*This is to make the "Variables" & "Widgets" available in the Grid scope.
                         * and "Variables", "Widgets" will not be available in that scope.
                         * element.scope() might refer to the controller scope/parent scope.*/
                        var elScope    = element.scope();
                        $is.Variables  = elScope.Variables;
                        $is.Actions    = elScope.Actions;
                        $is.Widgets    = elScope.Widgets;
                        $is.pageParams = elScope.pageParams;
                        $is.appLocale  = $rs.appLocale;
                        $is.columns    = {};
                        $is.formfields = {};

                        Object.defineProperty($is, 'selecteditem', {
                            configurable: true
                        });
                        element.removeAttr('title');
                        //Backward compatibility for old projects. If column select/ deselect event is present, set enablecolumnselection to true
                        if (!WM.isDefined(attrs.enablecolumnselection) && (attrs.onColumnselect || attrs.onColumndeselect)) {
                            $is.enablecolumnselection = attrs.enablecolumnselection = true;
                            WM.element(tElement.context).attr('enablecolumnselection', true);
                        }
                        $is.isStudioMode = CONSTANTS.isStudioMode;
                    },
                    'post': function ($is, element, attrs) {
                        var runModeInitialProperties = {
                                'showrowindex'          : 'showRowIndex',
                                'multiselect'           : 'multiselect',
                                'radioselect'           : 'showRadioColumn',
                                'filternullrecords'     : 'filterNullRecords',
                                'enablesort'            : 'enableSort',
                                'showheader'            : 'showHeader',
                                'enablecolumnselection' : 'enableColumnSelection',
                                'shownewrow'            : 'showNewRow'
                            },
                            handlers                 = [],
                            liveGrid                 = element.closest('.app-livegrid'),
                            wp                       = $is.widgetProps,
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
                            $is.callDataGridMethod('saveRow');
                        }
                        function onDestroy() {
                            handlers.forEach(Utils.triggerFn);
                            Utils.triggerFn($is.navigatorResultWatch);
                            Utils.triggerFn($is.navigatorMaxResultWatch);
                            Utils.triggerFn($is.gridDataWatch);
                            $document.off('click', documentClickBind);
                            Object.defineProperty($is, 'selecteditem', {'get': _.noop, 'set': _.noop});
                        }
                        //Will be called after setting grid column property.
                        function _redraw(forceRender) {
                            if (forceRender) {
                                $is.datagridElement.datatable($is.gridOptions);
                            } else {
                                $timeout(function () {
                                    $is.callDataGridMethod('setColGroupWidths');
                                    $is.callDataGridMethod('addOrRemoveScroll');
                                });
                            }
                        }
                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal) {
                            var addNewRowButtonIndex,
                                isFormMode,
                                enableNewRow;
                            /*Monitoring changes for styles or properties and accordingly handling respective changes.*/
                            switch (key) {
                            case 'width':
                                $is.callDataGridMethod('setGridDimensions', 'width', newVal);
                                break;
                            case 'height':
                                $is.callDataGridMethod('setGridDimensions', 'height', newVal);
                                break;
                            case 'gridfirstrowselect':
                                $is.setDataGridOption('selectFirstRow', newVal);
                                break;
                            case 'deleterow':
                                if ($is.widgetid) {
                                    $is.renderOperationColumns();
                                    $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs));
                                }
                                break;
                            case 'updaterow':
                                if ($is.widgetid) {
                                    $is.renderOperationColumns();
                                    $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs));
                                }
                                break;
                            case 'dataset':
                                $is.watchVariableDataSet(newVal);
                                break;
                            case 'showheader':
                                if (CONSTANTS.isStudioMode) {
                                    $is.setDataGridOption('showHeader', newVal);
                                }
                                break;
                            case 'gridsearch':
                                if (newVal) {
                                    $is.filtermode = 'search';
                                }
                                break;
                            case 'filtermode':
                                $is.setDataGridOption('filtermode', newVal);
                                break;
                            case 'searchlabel':
                                $is.setDataGridOption('searchLabel', newVal);
                                break;
                            case 'rowngclass':
                                $is.setDataGridOption('rowNgClass', newVal);
                                break;
                            case 'rowclass':
                                $is.setDataGridOption('rowClass', newVal);
                                break;
                            case 'multiselect':
                                if ($is.widgetid) {
                                    if (newVal) {
                                        $is.radioselect = false;
                                        wp.radioselect.disabled = false;
                                        $is.$root.$emit('set-markup-attr', $is.widgetid, {'radioselect': false});
                                    }
                                    $is.setDataGridOption('multiselect', newVal);
                                }
                                break;
                            case 'radioselect':
                                if ($is.widgetid) {
                                    if (newVal) {
                                        $is.multiselect = false;
                                        wp.multiselect.disabled = false;
                                        $is.$root.$emit('set-markup-attr', $is.widgetid, {'multiselect': false});
                                    }
                                    $is.setDataGridOption('showRadioColumn', newVal);
                                }
                                break;
                            case 'showrowindex':
                                if ($is.widgetid) {
                                    $is.setDataGridOption('showRowIndex', newVal);
                                }
                                break;
                            case 'navigation':
                                if (newVal === 'Advanced') { //Support for older projects where navigation type was advanced instead of clasic
                                    $is.navigation = 'Classic';
                                    return;
                                }
                                if (newVal !== 'None') {
                                    $is.shownavigation = true;
                                    $is.enablePageNavigation();
                                }
                                $is.navControls = newVal;
                                /*Check for sanity*/
                                if ($is.widgetid) {
                                    wp.showrecordcount.show = wp.showrecordcount.showindesigner = !_.includes(['None', 'Pager'], newVal);
                                }
                                break;
                            case 'insertrow':
                                if ($is._doNotAddNew) {
                                    return;
                                }
                                $is.insertrow = (newVal === true || newVal === 'true');
                                addNewRowButtonIndex = getObjectIndexInArray('key', 'addNewRow', $is.actions);
                                if ($is.insertrow) {
                                    // Add button definition to actions if it does not already exist.
                                    if (addNewRowButtonIndex === -1) {
                                        $is.actions.unshift(_.find(LiveWidgetUtils.getLiveWidgetButtons('GRID'), function (button) {
                                            return button.key === 'addNewRow';
                                        }));
                                    }
                                } else {
                                    if ($is.actions.length && addNewRowButtonIndex !== -1) {
                                        $is.actions.splice(addNewRowButtonIndex, 1);
                                    }
                                }
                                $is.populateActions();
                                break;
                            case 'show':
                                /* handle show/hide events based on show property change */
                                if (newVal) {
                                    $is.onShow();
                                } else {
                                    $is.onHide();
                                }
                                break;
                            case 'gridclass':
                                $is.callDataGridMethod('option', 'cssClassNames.grid', newVal);
                                break;
                            case 'nodatamessage':
                                $is.callDataGridMethod('option', 'dataStates.nodata', newVal);
                                break;
                            case 'loadingdatamsg':
                                $is.callDataGridMethod('option', 'dataStates.loading', newVal);
                                break;
                            case 'loadingicon':
                                $is.callDataGridMethod('option', 'loadingicon', newVal);
                                break;
                            case 'filternullrecords':
                                if (CONSTANTS.isStudioMode) {
                                    $is.callDataGridMethod('option', 'filterNullRecords', newVal);
                                }
                                break;
                            case 'spacing':
                                $is.callDataGridMethod('option', 'spacing', newVal);
                                if (newVal === 'condensed') {
                                    $is.navigationSize = 'small';
                                } else {
                                    $is.navigationSize = '';
                                }
                                break;
                            case 'exportformat':
                                $is.exportOptions = [];
                                if (newVal) {
                                    //Populate options for export drop down menu
                                    _.forEach(_.split(newVal, ','), function (type) {
                                        $is.exportOptions.push({
                                            'label'      : type,
                                            'icon'       : exportIconMapping[type]
                                        });
                                    });
                                }
                                //showing onBeforeexport callback event when any of the export format is selected.
                                if ($is.widgetid) {
                                    wp.onBeforeexport.show = ($is.exportOptions.length > 0);
                                }
                                break;
                            case 'editmode':
                                if ($is.widgetid) {
                                    isFormMode = ($is.editmode === EDIT_MODE.DIALOG || $is.editmode === EDIT_MODE.FORM);
                                    wp.onRowdelete.show         = !isFormMode;
                                    wp.onBeforerowinsert.show   = !isFormMode;
                                    wp.onRowinsert.show         = !isFormMode;
                                    wp.onBeforerowupdate.show   = !isFormMode;
                                    wp.onRowupdate.show         = !isFormMode;
                                    wp.onError.show             = !isFormMode;
                                    wp.onFormrender.show        = !isFormMode;
                                    wp.onBeforeformrender.show  = !isFormMode;
                                }
                                break;
                            case 'shownewrow':
                                //Enable new row if shownew is true or addNewRow buton is present
                                enableNewRow = newVal || _.some($is.actions, function(act){
                                        return _.includes(act.action, 'addNewRow()');
                                    });
                                $is.callDataGridMethod('option', 'actionsEnabled.new', enableNewRow);
                                break;
                            }
                        }

                        /****condition for old property name for grid title*****/
                        if (attrs.gridcaption && !attrs.title) {
                            $is.title = $is.gridcaption;
                        }
                        $is.noModifyTitle     = attrs.noModifyTitle === 'true';
                        $is.matchModeTypesMap = LiveWidgetUtils.getMatchModeTypesMap();
                        $is.emptyMatchModes   = ['null', 'empty', 'nullorempty', 'isnotnull', 'isnotempty'];
                        $is.matchModeMsgs     = LiveWidgetUtils.getMatchModeMsgs($is.appLocale);
                        $is.gridElement       = element;
                        $is.gridColumnCount   = gridColumnCount;
                        $is.displayAllFields  = attrs.displayall === '';
                        $is.datagridElement   = element.find('.app-datagrid');
                        $is.isPartOfLiveGrid  = liveGrid.length > 0;
                        $is.actions           = [];
                        $is.rowActions        = [];
                        $is._actions          = {};
                        $is.headerConfig      = [];
                        $is.items             = [];
                        $is.shownavigation    = $is.navigation !== 'None';
                        $is.redraw            = _.debounce(_redraw, 150);
                        $is.setFlags          = setFlags.bind(undefined, $is, element.scope());
                        $is.showExportOptions = showExportOptions.bind(undefined, $is);
                        //Backward compatibility for readonly grid
                        if (attrs.readonlygrid || !WM.isDefined(attrs.editmode)) {
                            if (attrs.readonlygrid === 'true') {
                                $is.editmode = '';
                            } else {
                                if ($is.isPartOfLiveGrid) {
                                    $is.editmode = liveGrid.isolateScope().formlayout === 'inline' ? EDIT_MODE.FORM : EDIT_MODE.DIALOG;
                                } else {
                                    $is.editmode = attrs.readonlygrid ? EDIT_MODE.INLINE : '';
                                }
                            }
                        }
                        WM.element(element).css({'position': 'relative'});
                        /*being done to trigger watch on the dataset property for first time if property is not defined(only for a simple grid not inside a live-grid)*/
                        if ($is.dataset === undefined && attrs.identifier !== 'grid') {
                            $is.watchVariableDataSet('');
                        }
                        /* event emitted on building new markup from canvasDom */
                        handlers.push($rs.$on('wms:compile-grid-columns', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if ($is.$id === scopeId) {
                                $is.fullFieldDefs = [];
                                $is.fieldDefs     = [];
                                $is.headerConfig  = [];

                                $compile(markup)($is);
                                /*TODO: Check if grid options can be passed.*/
                                /*Invoke the function to render the operation columns.*/
                                if (markup === '') {
                                    $is.setGridData([], true);
                                }
                                $is.renderOperationColumns();
                                //Set the coldefs. Set forceset to true to rerender the grid
                                $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs), true);
                            }
                        }));
                        /* event emitted whenever grid actions are modified */
                        handlers.push($rs.$on('wms:compile-grid-actions', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if ($is.$id === scopeId) {
                                $is.actions = [];
                                $compile(markup)($is);
                            }
                        }));
                        /* event emitted whenever grid row defs are modified */
                        handlers.push($rs.$on('wms:compile-grid-rowdefs', function (event, scopeId, markup) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            if ($is.$id === scopeId) {
                                $is.rowDef = {};
                                $compile(markup)($is);
                            }
                        }));
                        /* event emitted whenever grid actions are modified */
                        handlers.push($rs.$on('wms:compile-grid-row-actions', function (event, scopeId, markup, fromDesigner) {
                            /* as multiple grid directives will be listening to the event, apply fieldDefs only for current grid */
                            var prevLength, forceSet;
                            if ($is.$id === scopeId) {
                                $is.rowActions = [];
                                $compile(markup)($is);
                            }
                            prevLength = $is.fieldDefs.length;
                            /*Invoke the function to render the operation columns.*/
                            $is.renderOperationColumns(fromDesigner);
                            forceSet = prevLength !== $is.fieldDefs.length;//since `fieldDefs` has reference to `colDefs` forcibly setting grid option
                            $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs), forceSet);
                            $is.setDataGridOption('rowActions', Utils.getClonedObject($is.rowActions));
                            $is.setDataGridOption('showHeader', $is.showheader);
                        }));
                        handlers.push($rs.$on('locale-change', function () {
                            $is.appLocale     = $rs.appLocale;
                            $is.matchModeMsgs = LiveWidgetUtils.getMatchModeMsgs($is.appLocale);
                            $is.callDataGridMethod('option', 'messages.selectField', $rs.appLocale.MESSAGE_SELECT_FIELD);
                        }));
                        /*Register a watch on the "bindDataSet" property so that whenever the dataSet binding is changed,
                         * the "dataNavigatorWatched" value is reset.*/
                        handlers.push($is.$watch('binddataset', function (newVal, oldVal) {
                            var innerDataSetRegEx = /dataSet(\[\$i\])?\./, //Anything which matches dataSet. or dataSet[$i]
                                typeUtils;
                            if (newVal !== oldVal) {
                                $is.dataNavigatorWatched = false;
                                if ($is.dataNavigator) {
                                    $is.dataNavigator.result = undefined;
                                }
                            }
                            $is.setFlags();
                            if (($is.isBoundToVariable && innerDataSetRegEx.test(newVal)) || $is.isBoundToSelectedItem || $is.isBoundToSelectedItemSubset) {
                                //If bound to inner dataset, defualt value is not present. So, dataset watch may not be triggered. To prevent loading icon showing continuously, show no data found.
                                $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                            }
                            //In run mode, If grid is bound to selecteditem subset, dataset is undefined and dataset watch will not be triggered. So, set the dataset to empty value
                            if (_.includes(newVal, 'selecteditem.')) {
                                if (CONSTANTS.isRunMode) {
                                    LiveWidgetUtils.fetchDynamicData($is, element.scope(), function (data) {
                                        /*Check for sanity of data.*/
                                        if (WM.isDefined(data)) {
                                            $is.dataNavigatorWatched = true;
                                            $is.dataset = data;
                                            if ($is.dataNavigator) {
                                                $is.dataNavigator.dataset = data;
                                            }
                                        } else {
                                            $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                                        }
                                    });
                                } else {
                                    $is.callDataGridMethod('setStatus', 'error', $rs.locale.MESSAGE_GRID_CANNOT_LOAD_DATA_IN_STUDIO);
                                }
                            }
                            if ($is.widgetid) {
                                /* Disable/Update the properties in properties panel which are dependent on binddataset value. */
                                /*Make the "pageSize" property hidden so that no editing is possible for live and query service variables*/
                                wp.pagesize.show     = !($is.isBoundToLiveVariable || $is.isBoundToQueryServiceVariable) || ($is.isBoundToWidget ? !$is.isBoundToFilter : false);
                                wp.exportformat.show = wp.exportformat.showindesigner = wp.exportdatasize.show = wp.exportdatasize.showindesigner = ($is.showExportOptions());
                                wp.multiselect.show  = wp.multiselect.showindesigner = ($is.isPartOfLiveGrid ? false : wp.multiselect.show);
                                /* hide filtermode option if it is a dynamic table.*/
                                LiveWidgetUtils.toggleFilterMode($is);
                                /* If bound to live filter result, disable grid search. */
                                wp.filtermode.disabled = $is.isBoundToFilter;
                            }
                            //Set grid columns on binddataset change if grid is bound to service variable
                            if (CONSTANTS.isStudioMode && ($is.isBoundToServiceVariable || $is.isBoundToWebSocketVariable)) {
                                //If columns are to be created, call the create grid columns method
                                if ($is.newcolumns) {
                                    typeUtils = Utils.getService('TypeUtils');
                                    $is.createGridColumns(typeUtils.getFieldsForExpr($is.binddataset, {
                                        'getFieldInfo': true,
                                        'filter': 'terminal'
                                    }));
                                }
                                $is.datagridElement.datatable('setStatus', 'error', $rs.locale.MESSAGE_GRID_CANNOT_LOAD_DATA_IN_STUDIO);
                            }
                        }));
                        handlers.push($rs.$on('toggle-variable-state', function (event, boundVariable, active) {
                            //based on the active state and response toggling the 'loading data...' and 'no data found' messages.
                            if ($is.isBoundToLiveVariable || $is.isBoundToServiceVariable || $is.isBoundToFilter) {
                                if (boundVariable.name === _.get($is.variable, 'name') && boundVariable.activeScope.$id === _.get($is.variable, 'activeScope.$id')) {
                                    $is.variableInflight = active;
                                    if (active) {
                                        $is.callDataGridMethod('setStatus', 'loading', $is.loadingdatamsg);
                                    } else {
                                        //If grid is in edit mode or grid has data, dont show the no data message
                                        if (!$is.isGridEditMode && $is.gridData && $is.gridData.length === 0) {
                                            $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                                        } else {
                                            $is.callDataGridMethod('setStatus', 'ready');
                                        }
                                    }
                                }
                            }
                        }));
                        /* compile all the markup tags inside the grid, resulting into setting the fieldDefs*/
                        $compile(attrs.gridColumnMarkup)($is);
                        $is.gridOptions.rowActions   = $is.rowActions;
                        $is.gridOptions.headerConfig = $is.headerConfig;
                        if ($is.rowActions.length && $is.widgetid) {
                            $is.renderOperationColumns();
                        }
                        /*This is expose columns property to user so that he can programatically
                         * use columns to do some custom logic */
                        $is.gridOptions.colDefs.map(function (column) {
                            $is.columns[column.field] = column;
                        });
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, $is, notifyFor);
                        defineSelectedItemProp($is);
                        $timeout(function () {
                            $is.dataNavigator = element.find('[data-identifier="pagination"]').isolateScope();
                            WidgetUtilService.postWidgetCreate($is, element, attrs);

                            if (!$is.widgetid && attrs.scopedataset) {
                                handlers.push($is.$watch('scopedataset', function (newVal) {
                                    if ($is.dataNavigatorWatched) {
                                        $is.dataNavigator.dataset = newVal;
                                    } else {
                                        $is.dataset = newVal;
                                    }
                                    $is.resetSortStatus();
                                }));
                            }
                        }, 0, false);
                        if (!$is.widgetid && $is.editmode === EDIT_MODE.QUICK_EDIT) {
                            //In case of advanced inline, on tab keypress of grid, edit the first row
                            element.on('keyup', function (e) {
                                if (e.which !== 9 || !WM.element(e.target).hasClass('app-grid')) {
                                    return;
                                }
                                var $row;
                                $row = $is.datagridElement.find('.app-grid-content tr:first');
                                if ($row.length) {
                                    $row.trigger('click', [undefined, {action: 'edit'}]);
                                } else {
                                    $is.addNewRow();
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
                                    $is.gridOptions[value] = (attrValue === 'true' || attrValue === true);
                                }
                            });
                            $is.gridOptions.rowNgClass = $is.rowngclass;
                            $is.gridOptions.rowClass   = $is.rowclass;
                            $is.gridOptions.editmode   = $is.editmode;
                            $is.gridOptions.formPosition = $is.formposition;
                            /*Set isMobile value on the datagrid*/
                            $is.gridOptions.isMobile   = Utils.isMobile();
                            $is.renderOperationColumns();
                        }

                        $is.gridOptions.dateFormat     = AppDefaults.get('dateFormat');
                        $is.gridOptions.timeFormat     = AppDefaults.get('timeFormat');
                        $is.gridOptions.dateTimeFormat = AppDefaults.get('dateTimeFormat');
                        $is.gridOptions.name           = $is.name || $is.$id;
                        $is.gridOptions.messages       = {
                            'selectField': $rs.appLocale.MESSAGE_SELECT_FIELD
                        };
                        $is.datagridElement.datatable($is.gridOptions);
                        $is.callDataGridMethod('setStatus', 'loading', $is.loadingdatamsg);

                        $is.$on('$destroy', onDestroy);
                        element.on('$destroy', onDestroy);
                    }
                };
            }
        };
    }])
    .controller('gridController', [
        '$rootScope',
        '$scope',
        '$timeout',
        '$compile',
        'CONSTANTS',
        'Utils',
        'wmToaster',
        '$servicevariable',
        'LiveWidgetUtils',
        'DialogService',
        function ($rs, $is, $timeout, $compile, CONSTANTS, Utils, wmToaster, $servicevariable, LiveWidgetUtils, DialogService) {
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
                ROW_OPS_FIELD = "rowOperations",
                isDataSetWidgets = Utils.getDataSetWidgets(),
                OPERATION = {
                    'NEW': 'new',
                    'EDIT': 'edit',
                    'DELETE': 'delete'
                };
            /* Check whether it is non-empty row. */
            function isEmptyRecord(record) {
                var properties = Object.keys(record),
                    data,
                    isDisplayed;

                return properties.every(function (prop, index) {
                    data = record[prop];
                    /* If fieldDefs are missing, show all columns in data. */
                    isDisplayed = ($is.fieldDefs.length && WM.isDefined($is.fieldDefs[index]) && (CONSTANTS.isMobile ? $is.fieldDefs[index].mobileDisplay : $is.fieldDefs[index].pcDisplay)) || true;
                    /*Validating only the displayed fields*/
                    if (isDisplayed) {
                        return (data === null || data === undefined || data === '');
                    }
                    return true;
                });
            }
            /* Function to remove the empty data. */
            function removeEmptyRecords(serviceData) {
                var allRecords = serviceData.data || serviceData,
                    filteredData = [];
                if (allRecords && allRecords.length) {
                    /*Comparing and pushing the non-empty data columns*/
                    filteredData = allRecords.filter(function (record) {
                        return record && !isEmptyRecord(record);
                    });
                }
                return filteredData;
            }
            function setGridData(serverData, forceSet) {
                var data = serverData;
                /*If serverData has data but is undefined, then return*/
                if (!forceSet && ($is.isBoundToLiveVariableRoot || WM.isDefined(serverData.propertiesMap))) {
                    if (!serverData.data || Utils.isEmptyObject(serverData.data)) {
                        return;
                    }
                    data = serverData.data;
                }
                if ($is.filternullrecords) {
                    $is.gridData = removeEmptyRecords(data);
                } else {
                    $is.gridData = data;
                }
                if (!$is.variableInflight) {
                    if ($is.gridData && $is.gridData.length === 0) {
                        $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                    } else {
                        $is.callDataGridMethod('setStatus', 'ready');
                    }
                }
                $is.$root.$safeApply($is);
            }
            /*function to transform the service data to grid acceptable data*/
            function transformData(dataObject) {
                var newObj,
                    tempArr,
                    keys,
                    oldKeys,
                    numKeys,
                    newObject,
                    tempObj,
                    variableName;

                /*data sanity testing*/
                dataObject = dataObject || [];
                variableName = $is.variableName;
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
            }
            //Get search value based on the time
            function getSearchValue(value, type) {
                if (Utils.isNumberType(type)) {
                    return _.toNumber(value);
                }
                if (type === 'datetime') {
                    return moment(value).valueOf();
                }
                return _.toString(value).toLowerCase();
            }
            //Filter the data based on the search value and conditions
            function getFilteredData(data, searchObj) {
                var searchVal    = getSearchValue(searchObj.value, searchObj.type),
                    currentVal;
                data = _.filter(data, function (obj) {
                    var isExists;
                    if (searchObj.field) {
                        currentVal = getSearchValue(_.get(obj, searchObj.field), searchObj.type);
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
                    case 'isnotnull':
                        isExists = !_.isNull(currentVal, searchVal);
                        break;
                    case 'empty':
                        isExists = _.isEmpty(currentVal, searchVal);
                        break;
                    case 'isnotempty':
                        isExists = !_.isEmpty(currentVal, searchVal);
                        break;
                    case 'nullorempty':
                        isExists = _.isNull(currentVal, searchVal) || _.isEmpty(currentVal, searchVal);
                        break;
                    case 'lessthan':
                        isExists = currentVal < searchVal;
                        break;
                    case 'lessthanequal':
                        isExists = currentVal <= searchVal;
                        break;
                    case 'greaterthan':
                        isExists = currentVal > searchVal;
                        break;
                    case 'greaterthanequal':
                        isExists = currentVal >= searchVal;
                        break;
                    default:
                        isExists = Utils.isNumberType(searchObj.type) ? _.isEqual(currentVal, searchVal) : _.includes(currentVal, searchVal);
                        break;
                    }
                    return isExists;
                });
                return data;
            }
            //Returns data filtered using searchObj
            function getSearchResult(data, searchObj) {
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
            }
            /*Returns data sorted using sortObj*/
            function getSortResult(data, sortObj) {
                if (sortObj && sortObj.direction) {
                    data = _.orderBy(data, sortObj.field, sortObj.direction);
                }
                return data;
            }
            /* Function to populate the grid with data. */
            function populateGridData(serviceData) {
                var data;

                if ($is.binddataset) {
                    $is.gridVariable = serviceData;
                    if (!$is.isBoundToLiveVariable && !$is.isBoundToFilter) {
                        //Transform the data if it is a object
                        serviceData = transformData(serviceData);
                    }
                    //Apply filter and sort, if data is refreshed through Refresh data method
                    if (!$is.shownavigation && $is._isClientSearch) {
                        data = Utils.getClonedObject(serviceData);
                        data = getSearchResult(data, $is.filterInfo);
                        data = getSortResult(data, $is.sortInfo);
                        $is.serverData = data;
                    } else {
                        $is.serverData = serviceData;
                    }
                } else {
                    /*Allowing when the data is directly given to the dataset*/
                    $is.serverData = serviceData;
                }
                /*check if new column defs required*/
                if ($is.columnDefsExists() && !$is.newDefsRequired) {
                    setGridData($is.serverData);
                } else if (!$is.widgetid) {
                    $is.newcolumns = true;
                    $is.newDefsRequired = true;
                    $is.createGridColumns($is.serverData);
                }
            }
            //Set filter fields based on the search obj
            function setFilterFields(filterFields, searchObj) {
                var field = searchObj && searchObj.field;
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
            }
            function getFilterFields(searchObj) {
                var filterFields = {};
                if (_.isArray(searchObj)) {
                    _.forEach(searchObj, function (obj) {
                        setFilterFields(filterFields, obj);
                    });
                } else {
                    setFilterFields(filterFields, searchObj);
                }
                return filterFields;
            }
            function refreshLiveVariable(page, success, error) {
                var sortInfo     = $is.sortInfo,
                    sortOptions  = sortInfo && sortInfo.direction ? (sortInfo.field + ' ' + sortInfo.direction) : '',
                    filterFields = getFilterFields($is.filterInfo);
                $is.variable.listRecords({
                    'filterFields' : filterFields,
                    'orderBy'      : sortOptions,
                    'page'         : page || 1
                }, success, error);
            }
            function refreshQueryServiceVariable(page, success, error) {
                var sortInfo     = $is.sortInfo,
                    sortOptions  = sortInfo && sortInfo.direction ? (sortInfo.field + ' ' + sortInfo.direction) : '';
                $is.variable.invoke({
                    'orderBy'      : sortOptions,
                    'page'         : page || 1
                }, success, error);
            }
            function refreshServiceVariable(options, success, error) {
                options = options || {};
                $is.variable.invoke(options, success, error);
            }
            function refreshLiveFilter() {
                var sortInfo     = $is.sortInfo,
                    sortOptions  = sortInfo && sortInfo.direction ? (sortInfo.field + ' ' + sortInfo.direction) : '';
                $is.Widgets[$is.widgetName].applyFilter({'orderBy': sortOptions});
            }
            function searchGrid(searchObj) {
                $is.filterInfo = searchObj;
                refreshLiveVariable(1, WM.noop, function () {
                    $is.toggleMessage(true, 'error', $is.nodatamessage);
                });
            }
            function sortHandler(sortObj, e) {
                /* Update the sort info for passing to datagrid */
                $is.gridOptions.sortInfo.field     = sortObj.field;
                $is.gridOptions.sortInfo.direction = sortObj.direction;
                $is.sortInfo = Utils.getClonedObject(sortObj);

                if ($is.isBoundToFilter && $is.widgetName) {
                    refreshLiveFilter();
                } else if ($is.isBoundToLiveVariable) {
                    refreshLiveVariable(1, function () {
                        $is.onSort({$event: e, $data: $is.serverData});
                    }, function (error) {
                        $is.toggleMessage(true, 'error', error);
                    });
                } else if ($is.isBoundToQueryServiceVariable) {
                    refreshQueryServiceVariable(1, function () {
                        $is.onSort({$event: e, $data: $is.serverData});
                    }, function (error) {
                        $is.toggleMessage(true, 'error', error);
                    });
                } else if ($is.isBoundToServiceVariable) {
                    refreshServiceVariable({
                        'page'      : 1,
                        'orderBy'   : $is.sortInfo && $is.sortInfo.direction ? ($is.sortInfo.field + ' ' + $is.sortInfo.direction) : ''
                    }, function () {
                        $is.onSort({$event: e, $data: $is.serverData});
                    }, function (error) {
                        $is.toggleMessage(true, 'error', error);
                    })
                }  else {
                    //Fall back to default client side sort
                    handleOperation(sortObj, e, 'sort')
                }
            }
            /*Function to handle both sort and search operations if bound to service/static variable*/
            function handleOperation(searchSortObj, e, type) {
                var data;
                data = $is.shownavigation ? Utils.getClonedObject($is.__fullData) : Utils.getClonedObject($is.dataset);
                if (type === 'search') {
                    $is.filterInfo = searchSortObj;
                } else {
                    $is.sortInfo = searchSortObj;
                }
                if (WM.isObject(data) && !WM.isArray(data)) {
                    data = [data];
                }
                /*Both the functions return same 'data' if arguments are undefined*/
                data = getSearchResult(data, $is.filterInfo);
                data = getSortResult(data, $is.sortInfo);
                $is.serverData = data;
                if ($is.shownavigation) {
                    //Reset the page number to 1
                    $is.dataNavigator.dn.currentPage = 1;
                    $is.dataNavigator.setPagingValues(data);
                } else {
                    setGridData($is.serverData);
                }

                if (type === 'sort') {
                    //Calling 'onSort' event
                    $is.onSort({$event: e, $data: $is.serverData});
                }
            }
            //Search handler for default case, when no separate search handler is provided
            function defaultSearchHandler(searchObj) {
                var data  = Utils.getClonedObject($is.gridData),
                    $rows = $is.datagridElement.find('tbody tr.app-datagrid-row');
                $is.filterInfo = searchObj;
                data = getSearchResult(data, searchObj);
                //Compared the filtered data and original data, to show or hide the rows
                _.forEach($is.gridData, function (value, index) {
                    var $row = WM.element($rows[index]);
                    if (_.find(data, function (obj) {return _.isEqual(obj, value); })) {
                        $row.show();
                    } else {
                        $row.hide();
                    }
                });
                if (data && data.length) {
                    $is.callDataGridMethod('setStatus', 'ready');
                    //Select the first row after the search for single select
                    if ($is.gridfirstrowselect && !$is.multiselect) {
                        $is.callDataGridMethod('selectFirstRow', true, true);
                    }
                } else {
                    $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                    $is.selecteditem = undefined;
                }
                $is.callDataGridMethod('updateSelectAllCheckboxState');
            }
            function getCompiledTemplate(htm, row, colDef, refreshImg) {
                var rowScope = $is.$new(),
                    el = WM.element(htm),
                    ngSrc,
                    imageEl;
                rowScope.row = Utils.getClonedObject(row);;
                rowScope.row.getProperty = function (field) {
                    return _.get(row, field);
                };
                rowScope.rowData = rowScope.row;
                //return the compiled template if the template is row i.e when colDef doesn't exist.
                if (!colDef) {
                    return $compile(el)(rowScope);
                }
                rowScope.colDef = colDef;
                rowScope.columnValue = _.get(row, colDef.field);
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
            }
            /*Compile the templates in the grid scope*/
            function compileTemplateInGridScope(htm) {
                var el = WM.element(htm);
                return $compile(el)($is);
            }
            function deleteRecord(options) {
                var variable,
                    variableType,
                    row = options.row,
                    cancelRowDeleteCallback = options.cancelRowDeleteCallback,
                    evt = options.evt,
                    callBack = options.callBack,
                    successHandler = function (success) {
                        /* check the response whether the data successfully deleted or not , if any error occurred show the
                         * corresponding error , other wise remove the row from grid */
                        if (success && success.error) {
                            $is.toggleMessage(true, 'error', $is.errormessage || success.error);
                            return;
                        }
                        $is.onRecordDelete(callBack);
                        if (variableType === 'wm.LiveVariable') {
                            $is.updateVariable(row, callBack);
                        }
                        $is.toggleMessage(true, 'success', $is.deletemessage);
                        /*custom EventHandler for row deleted event*/
                        $is.onRowdelete({$event: evt, $data: row, $rowData: row, $isolateScope: $is});
                        $is.onRowdeleted({$event: evt, $data: row, $rowData: row, $isolateScope: $is});
                    },
                    deleteFn = function () {
                        if (variableType === 'wm.LiveVariable' || variableType === 'wm.Variable') {
                            if (variableType === 'wm.Variable') {
                                variable.removeItem(row);
                                successHandler(row);
                                return;
                            }
                            variable.deleteRecord({
                                'row'               : row,
                                'transform'         : true,
                                'scope'             : $is.gridElement.scope(),
                                'skipNotification'  : true,
                                'period'            : options.period
                            }, successHandler, function (error) {
                                Utils.triggerFn(callBack, undefined, true);
                                $is.onError({$event: evt, $isolateScope: $is, $operation: OPERATION.DELETE, $data: error});
                                $is.toggleMessage(true, 'error', $is.errormessage || error);
                            });
                        } else {
                            $is.onRowdelete({$event: evt, $rowData: row, $isolateScope: $is});
                        }
                        Utils.triggerFn(cancelRowDeleteCallback);
                    };
                variable     = $is.variable;
                variableType = $is.variable && $is.variable.category;
                if (!$is.confirmdelete) {
                    deleteFn();
                    Utils.triggerFn(cancelRowDeleteCallback);
                    return;
                }
                DialogService._showAppConfirmDialog({
                    'caption'   : _.get($rs.appLocale, 'MESSAGE_DELETE_RECORD') || 'Delete Record',
                    'iconClass' : 'wi wi-delete fa-lg',
                    'content'   : $is.confirmdelete,
                    'oktext'    : $is.deleteoktext,
                    'canceltext': $is.deletecanceltext,
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
            }
            /* Navigate the target to first, or last page depending on the sort information*/
            function getNavigationTargetBySortInfo() {
                return $is.sortInfo && $is.sortInfo.direction === 'desc' && _.includes($is.primaryKey,$is.sortInfo.field) ? 'first' : 'last';
            }
            function insertRecord(options) {
                var variable     = $is.variable,
                    variableType = $is.variable && $is.variable.category,
                    dataObject = {
                        'row'              : options.row,
                        'transform'        : true,
                        'scope'            : $is.gridElement.scope(),
                        'skipNotification' : true,
                        'period'           : options.period
                    },
                    successHandler = function (response) {
                        /*Display appropriate error message in case of error.*/
                        if (response.error) {
                            $is.onError({$event: options.event, $isolateScope: $is, $operation: OPERATION.NEW, $data: response.error});
                            $is.toggleMessage(true, 'error', $is.errormessage || response.error);
                            Utils.triggerFn(options.error, response);
                        } else {
                            if (options.event) {
                                var row = WM.element(options.event.target).closest('tr');
                                $is.callDataGridMethod('hideRowEditMode', row);
                            }
                            $is.toggleMessage(true, 'success', $is.insertmessage);
                            if (variableType === 'wm.LiveVariable') {
                                $is.initiateSelectItem($is.getNavigationTargetBySortInfo(), response, undefined, $is.isBoundToStaticVariable, options.callBack);
                                $is.updateVariable(response, options.callBack);
                            }
                            Utils.triggerFn(options.success, response);
                            $is.onRowinsert({$event: options.event, $data: response, $rowData: response, $isolateScope: $is});
                        }
                    };

                if (variableType === 'wm.LiveVariable' || variableType === 'wm.Variable') {
                    if (variableType === 'wm.Variable') {
                        variable.addItem(options.row);
                        successHandler(options.row);
                        return;
                    }
                    variable.insertRecord(dataObject, successHandler, function (error) {
                        $is.onError({$event: options.event, $isolateScope: $is, $operation: OPERATION.NEW, $data: error});
                        $is.toggleMessage(true, 'error', $is.errormessage || error);
                        Utils.triggerFn(options.error, error);
                        Utils.triggerFn(options.callBack, undefined, true);
                    });
                } else {
                    $is.onRowinsert({$event: options.event, $rowData: options.row, $isolateScope: $is});
                }
            }
            function updateRecord(options) {
                var variable = $is.variable,
                    variableType = $is.variable && $is.variable.category,
                    dataObject = {
                        'row'              : options.row,
                        'prevData'         : options.prevData,
                        'transform'        : true,
                        'scope'            : $is.gridElement.scope(),
                        'skipNotification' : true,
                        'period'           : options.period
                    },
                    successHandler = function (response) {
                        /*Display appropriate error message in case of error.*/
                        if (response.error) {
                            $is.onError({$event: options.event, $isolateScope: $is, $operation: OPERATION.EDIT, $data: response.error});
                            /*disable readonly and show the appropriate error*/
                            $is.toggleMessage(true, 'error', $is.errormessage || response.error);
                            Utils.triggerFn(options.error, response);
                        } else {
                            if (options.event) {
                                var row = WM.element(options.event.target).closest('tr');
                                $is.callDataGridMethod('hideRowEditMode', row);
                            }
                            $is.toggleMessage(true, 'success', $is.updatemessage);
                            if (variableType === 'wm.LiveVariable') {
                                $is.initiateSelectItem('current', response, undefined, $is.isBoundToStaticVariable, options.callBack);
                                $is.updateVariable(response, options.callBack);
                            }
                            Utils.triggerFn(options.success, response);
                            $is.onRowupdate({$event: options.event, $data: response, $rowData: response, $isolateScope: $is});
                        }
                    };

                if (variableType === 'wm.LiveVariable' || variableType === 'wm.Variable') {
                    if (variableType === 'wm.Variable') {
                        variable.setItem(options.prevData, options.row);
                        successHandler(options.row);
                        return;
                    }
                    variable.updateRecord(dataObject, successHandler, function (error) {
                        $is.onError({$event: options.event, $isolateScope: $is, $operation: OPERATION.EDIT, $data: error});
                        $is.toggleMessage(true, 'error', $is.errormessage || error);
                        Utils.triggerFn(options.error, error);
                        Utils.triggerFn(options.callBack, undefined, true);
                    });
                } else {
                    $is.onRowupdate({$event: options.event, $rowData: options.row, $isolateScope: $is});
                }
            }
            function setImageProperties(variableObj) {
                if (!variableObj) {
                    return;
                }
                $is.primaryKey     = variableObj.getPrimaryKey();
                $is.contentBaseUrl = ((variableObj._prefabName !== "" && variableObj._prefabName !== undefined) ? "prefabs/" + variableObj._prefabName : "services") + '/' + variableObj.liveSource + '/' + variableObj.type + '/';
            }
            function selectItemOnSuccess(row, skipSelectItem, callBack) {
                /*$timeout is used so that by then $is.dataset has the updated value.
                 * Selection of the item is done in the callback of page navigation so that the item that needs to be selected actually exists in the grid.*/
                /*Do not select the item if skip selection item is specified*/
                $timeout(function () {
                    if (!skipSelectItem) {
                        $is.selectItem(row, $is.dataset && $is.dataset.data);
                    }
                    Utils.triggerFn(callBack);
                }, undefined, false);
            }
            //Reset the sort based on sort returned by the call
            function resetSortStatus(variableSort) {
                var gridSortString;
                if (!_.isEmpty($is.sortInfo)) {
                    gridSortString = $is.sortInfo.field + ' ' + $is.sortInfo.direction;
                    variableSort = _.get($is.variable, ['_options', 'orderBy']) || variableSort;
                    if (variableSort) { //If multiple order by fields are present, compare with the first one
                        variableSort = _.head(_.split(variableSort, ','));
                    }
                    if (gridSortString !== variableSort) {
                        $is.callDataGridMethod('resetSortIcons');
                        $is.sortInfo = {};
                        $is.setDataGridOption('sortInfo', {});
                    }
                }
            }
            //Check the filters applied and remove if dat does not contain any filters
            function checkFiltersApplied(variableSort) {
                var variable = $is.variable;
                if ($is.isBoundToLiveVariable) {
                    if (_.isEmpty(_.get(variable, ['_options', 'filterFields']))) {
                        $is.clearFilter(true);
                    }
                    resetSortStatus(variableSort);
                    return;
                }
                if ($is.isBoundToQueryServiceVariable) {
                    resetSortStatus(variableSort);
                }
            }
            function updateMarkupForGrid(config) {
                if ($is.widgetid) {
                    Utils.getService('LiveWidgetsMarkupManager').updateMarkupForGrid(config);
                }
            }
            function updateVariable(row, callBack) {
                var variable = $is.variable;
                if ($is.isBoundToFilter) {
                    //If grid is bound to filter, call the apply fiter and update filter options
                    if (!$is.shownavigation) {
                        refreshLiveFilter();
                    }
                    $is.Widgets[$is.widgetName].fetchDistinctValues();
                    return;
                }
                if (variable && !$is.shownavigation) {
                    refreshLiveVariable(1, function () {
                        selectItemOnSuccess(row, true, callBack);
                    });
                }
            }
            /* Function to reset the column definitions dynamically. */
            function resetColumnDefinitions() {
                $is.fieldDefs = [];
                $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs));
            }
            /*Function to render the column containing row operations.*/
            function renderOperationColumns(fromDesigner) {
                var rowActionCol,
                    opConfig = {},
                    operations = [],
                    insertPosition,
                    rowOperationsColumn = LiveWidgetUtils.getRowOperationsColumn(),
                    config = {
                        'name'  : rowOperationsColumn.field,
                        'field' : rowOperationsColumn.field,
                        'isPredefined' : true
                    };
                /* hide filtermode option if it is a dynamic table.*/
                if ($is.widgetid) {
                  LiveWidgetUtils.toggleFilterMode($is);
                }
                /*Return if no fieldDefs are present.*/
                if (!$is.fieldDefs.length) {
                    return;
                }
                rowActionCol = _.find($is.fullFieldDefs, {'field': ROW_OPS_FIELD, type : 'custom'}); //Check if column is fetched from markup
                _.remove($is.fieldDefs, {type : 'custom', field : ROW_OPS_FIELD});//Removing operations column
                _.remove($is.headerConfig, {field : rowOperationsColumn.field});
                /*Loop through the "rowOperations"*/
                _.forEach(rowOperations, function (field, fieldName) {
                    /* Add it to operations only if the corresponding property is enabled.*/
                    if (_.some($is.rowActions, {'key' : field.property}) || (!fromDesigner && $is[field.property])) {
                        opConfig[fieldName] = rowOperations[fieldName].config;
                        operations.push(fieldName);
                    }
                });

                /*Add the column for row operations only if at-least one operation has been enabled.*/
                if ($is.rowActions.length) {
                    if (rowActionCol) { //If column is present in markup, push the column or push the default column
                        insertPosition = rowActionCol.rowactionsposition ? _.toNumber(rowActionCol.rowactionsposition) : $is.fieldDefs.length;
                        $is.fieldDefs.splice(insertPosition, 0, rowActionCol);
                        if (insertPosition === 0) {
                            $is.headerConfig.unshift(config);
                        } else {
                            $is.headerConfig.push(config);
                        }
                    } else {
                        $is.fieldDefs.push(rowOperationsColumn);
                        $is.headerConfig.push(config);
                    }
                } else if (!fromDesigner && operations.length) {
                    rowOperationsColumn.operations = operations;
                    rowOperationsColumn.opConfig = opConfig;
                    $is.fieldDefs.push(rowOperationsColumn);
                    $is.headerConfig.push(config);
                }
                $is.setDataGridOption('headerConfig', $is.headerConfig);
            }
            function addNewRow() {
                if (!$is.isGridEditMode) { //If grid is already in edit mode, do not add new row
                    $is.callDataGridMethod('addNewRow');
                    $is.$emit('add-new-row');
                    $rs.$emit("wm-event", $is.widgetid, "create");
                }
            }
            function resetPageNavigation() {
                /*Check for sanity*/
                if ($is.dataNavigator) {
                    $is.dataNavigator.resetPageNavigation();
                }
            }
            /*Function to enable page navigation for the grid.*/
            function enablePageNavigation() {
                if ($is.dataset && _.get($is.dataset, 'dataValue') !== '' && !_.isEmpty($is.dataset)) {
                    /*Check for sanity*/
                    if ($is.dataNavigator) {

                        $is.dataNavigator.pagingOptions = {
                            maxResults: $is.pagesize || 5
                        };
                        /*De-register the watch if it is exists */
                        Utils.triggerFn($is.navigatorResultWatch);
                        $is.dataNavigator.dataset = $is.binddataset || $is.dataset;

                        /*Register a watch on the "result" property of the "dataNavigator" so that the paginated data is displayed in the live-list.*/
                        $is.navigatorResultWatch = $is.dataNavigator.$watch('result', function (newVal) {
                            /* Check for sanity. */
                            if (WM.isDefined(newVal)) {
                                //Watch will not be triggered if dataset and new value are equal. So trigger the property change handler manually
                                //This happens in case, if dataset is directly updated.
                                if (_.isEqual($is.dataset, newVal)) {
                                    $is.watchVariableDataSet(newVal);
                                } else {
                                    if (WM.isArray(newVal)) {
                                        $is.dataset = [].concat(newVal);
                                    } else if (WM.isObject(newVal)) {
                                        $is.dataset = WM.extend({}, newVal);
                                    } else {
                                        $is.dataset = newVal;
                                    }
                                }
                            } else {
                                $is.dataset = undefined;
                            }
                        }, true);
                        /*De-register the watch if it is exists */
                        Utils.triggerFn($is.navigatorMaxResultWatch);
                        /*Register a watch on the "maxResults" property of the "dataNavigator" so that the "pageSize" is displayed in the live-list.*/
                        $is.navigatorMaxResultWatch = $is.dataNavigator.$watch('maxResults', function (newVal) {
                            $is.pagesize = newVal;
                        });

                        $is.dataNavigatorWatched = true;
                        //If dataset is a pageable object, data is present inside the content property
                        if (WM.isObject($is.dataset) && Utils.isPageable($is.dataset)) {
                            $is.__fullData = $is.dataset.content;
                        } else {
                            $is.__fullData = $is.dataset;
                        }
                        $is.dataset    = undefined;
                    }
                }
            }
            /*Function to dynamically fetch column definitions.*/
            function fetchDynamicColumnDefs() {
                var fields,
                    result,
                    f,
                    dataKeys,
                    TypeUtils;

                /*Invoke the function to fetch the reference variable details when a grid2 is bound to another grid1 and grid1 is bound to a variable.*/
                result = LiveWidgetUtils.fetchReferenceDetails($is);
                if (result.fields) {
                    f = result.fields;
                    dataKeys = Object.keys(f);
                    fields = {};
                    dataKeys.forEach(function (key) {
                        fields[key] = '';
                    });
                } else if (result.relatedFieldType) {
                    TypeUtils = Utils.getService('TypeUtils');
                    /*Invoke the function to fetch sample data-structure for the field.*/
                    fields = TypeUtils.getFieldsForExpr(result.relatedFieldType, {'getFieldInfo' : true, 'filter' : 'terminal'});
                }
                if (fields) {
                    $is.watchVariableDataSet(fields);
                }
            }
            function isDataValid() {
                var error,
                    dataset = $is.dataset || {};

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
                    $is.callDataGridMethod('setStatus', 'error', error);
                    return false;
                }
                return true;
            }
            function setSortSearchHandlers(isPageable) {
                $is._isClientSearch = false;
                $is._isPageSearch   = false;

                if ($is.isBoundToVariable && $is.variable) {
                    if ($is.isBoundToLiveVariable) {
                        $is.setDataGridOption('searchHandler', searchGrid);
                        $is.setDataGridOption('sortHandler', sortHandler);
                        setImageProperties($is.variable);
                    } else if ($is.isBoundToQueryServiceVariable) {
                        $is._isPageSearch = true;
                        $is.setDataGridOption('searchHandler', defaultSearchHandler);
                        $is.setDataGridOption('sortHandler', sortHandler);
                    } else if ($is.isBoundToProcedureServiceVariable) {
                        $is._isClientSearch = true;
                        $is.setDataGridOption('searchHandler', handleOperation);
                        $is.setDataGridOption('sortHandler', handleOperation);
                    } else {
                        /*Calling the specific search and sort handlers*/
                        if (isPageable) {
                            $is._isPageSearch = true;
                            $is.setDataGridOption('searchHandler', defaultSearchHandler);
                            $is.setDataGridOption('sortHandler', sortHandler);
                        } else {
                            $is._isClientSearch = true;
                            $is.setDataGridOption('searchHandler', handleOperation);
                            $is.setDataGridOption('sortHandler', handleOperation);
                        }
                    }
                } else if ($is.isBoundToFilter) {
                    /*If the variable is deleted hiding the spinner and showing the no data found message*/
                    $is.setDataGridOption('sortHandler', sortHandler);
                    setImageProperties($is.variable);
                } else if ($is.isBoundToSelectedItem) {
                    $is._isClientSearch = true;
                    $is.setDataGridOption('searchHandler', handleOperation);
                    $is.setDataGridOption('sortHandler', handleOperation);
                } else if ($is.binddataset.indexOf('bind:Widgets') === -1) {
                    /*if the grid is not bound to widgets*/
                    /*If the variable is deleted hiding the spinner and showing the no data found message*/
                    $is.callDataGridMethod('setStatus', 'error', $is.nodatamessage);
                }
            }
            function watchVariableDataSet(newVal) {
                /* TODO: In studio mode, service variable data should initially
                 be empty array, and metadata should be passed separately. */
                var variableName,
                    result,
                    variableSortString,
                    columns,
                    isPageable = false,
                    widgetBindingDetails,
                    relatedTables;
                $is.setFlags();
                if (CONSTANTS.isStudioMode && ($is.isBoundToServiceVariable || $is.isBoundToWebSocketVariable)) {
                    return;
                }
                //After the setting the watch on navigator, dataset is triggered with undefined. In this case, return here.
                if ($is.dataNavigatorWatched && _.isUndefined(newVal) && $is.__fullData) {
                    return;
                }
                //If variable is in loading state, show loading icon
                if ($is.variableInflight) {
                    $is.callDataGridMethod('setStatus', 'loading', $is.loadingdatamsg);
                }

                result = Utils.getValidJSON(newVal);

                /*Reset the values to undefined so that they are calculated each time.*/
                $is.gridVariable                  = '';
                /* Always set newcolumns equal to value of redrawColumns coming from datamodel design controller. */
                if ($is.widgetid && WM.isDefined($is.$parent) && $is.$parent.redrawColumns) {
                    $is.newcolumns = $is.$parent.redrawColumns;
                }

                //Converting newval to object if it is an Object that comes as a string "{"data" : 1}"
                if (result) {
                    newVal = result;
                }

                /*Return if data is invalid.*/
                if (!$is.isDataValid()) {
                    return;
                }

                /*If the data is a pageable object, then display the content.*/
                if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                    variableSortString = Utils.getOrderByExpr(newVal.sort);
                    newVal = newVal.content;
                    isPageable = true;
                }

                if ($is.binddataset) {
                    setSortSearchHandlers(isPageable);
                }

                //If value is empty or in studio mode, dont enable the navigation
                if (CONSTANTS.isRunMode && newVal && _.get(newVal, 'dataValue') !== '' && !_.isEmpty(newVal)) {
                    if ($is.shownavigation && !$is.dataNavigatorWatched) {
                        $is.enablePageNavigation();
                        return;
                    }
                } else {
                    $is.resetPageNavigation();
                    /*for run mode, disabling the loader and showing no data found message if dataset is not valid*/
                    if (CONSTANTS.isRunMode) {
                        $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                        $is.setDataGridOption('selectFirstRow', $is.gridfirstrowselect);
                    }
                }
                if (CONSTANTS.isRunMode && !$is.shownavigation) {
                    checkFiltersApplied(variableSortString);
                }
                if ($is.binddataset) {
                    if ($is.isBoundToWidget) {
                        if ($is.isBoundToSelectedItemSubset || $is.isBoundToSelectedItem) {
                            if ($is.variableName === null) {
                                widgetBindingDetails = LiveWidgetUtils.fetchReferenceDetails($is);
                                if (!widgetBindingDetails.fields) {
                                    relatedTables = (widgetBindingDetails.referenceVariable && widgetBindingDetails.referenceVariable.relatedTables) || [];
                                    variableName = widgetBindingDetails.referenceVariableName;
                                    relatedTables.forEach(function (val) {
                                        if (val.columnName === widgetBindingDetails.relatedFieldName) {
                                            variableName = val.watchOn;
                                        }
                                    });
                                    $is.variableName = variableName;
                                    $is.variable     = _.get($is.gridElement.scope().Variables, $is.variableName);
                                }
                            }
                            /*Check for studio mode.*/
                            if ($is.widgetid && newVal !== '') {
                                /*If "newVal" is not available(in studio mode, newVal will be same as bindDataSet with 'bind:' removed; for the first time)
                                 , fetch column definitions dynamically.*/
                                if (($is.binddataset === ('bind:' + newVal)) || (WM.isArray(newVal) && !newVal.length)) {
                                    $is.fetchDynamicColumnDefs();
                                    return;
                                }
                            }
                        }
                    }
                }
                if (!WM.isObject(newVal) || (newVal && newVal.dataValue === '')) {
                    if (newVal === '' || (newVal && newVal.dataValue === '')) {
                        /* clear the grid columnDefs and data in studio */
                        if ($is.widgetid && $is.newcolumns) {
                            /* if new columns to be rendered, create new column defs*/
                            $is.prepareFieldDefs();
                            $is.newcolumns = false;
                        }
                        if (!$is.variableInflight) {
                            /* If variable has finished loading and resultSet is empty,
                             * render empty data in both studio and run modes */
                            setGridData([]);
                        }
                    }
                    return;
                }

                if (newVal) {
                    if ($is.widgetid) {
                        $is.createGridColumns($is.isBoundToLiveVariableRoot ? newVal.data : newVal, newVal.propertiesMap || undefined);
                        $is.newcolumns = false;
                    }
                    /*Set the type of the column to the default variable type*/
                    if ($is.fieldDefs && $is.columnDefsExists() && newVal.propertiesMap) {
                        columns = Utils.fetchPropertiesMapColumns(newVal.propertiesMap);
                        $is.fieldDefs.forEach(function (fieldDef) {
                            Object.keys(columns).forEach(function (key) {
                                if (key === fieldDef.field) {
                                    fieldDef.type = columns[key].type;
                                }
                            });
                        });
                    }
                    populateGridData(newVal);
                    if ($is.isBoundToServiceVariable && CONSTANTS.isStudioMode) {
                        /*Checking if grid is bound to service variable, for which data cannot be loaded in studio mode,
                         in studio mode and if the fieldDefs are generated. */
                        $is.gridData = [];
                        $is.callDataGridMethod('setStatus', 'error', $rs.locale['MESSAGE_GRID_CANNOT_LOAD_DATA_IN_STUDIO']);
                    }
                } else if ($is.widgetid) {
                    /* Put In case of error while fetching data from provided variable, prepare default fieldDefs
                     * Error cases:
                     * 1. empty variable provided
                     * 2. data not found for provided variable
                     */
                    $is.callDataGridMethod('setStatus', 'nodata', $is.nodatamessage);
                    $is.setDataGridOption('selectFirstRow', $is.gridfirstrowselect);
                    /* if new columns to be rendered, create new column defs*/
                    if ($is.newcolumns) {
                        $is.prepareFieldDefs();
                        $is.newcolumns = false;
                    }
                }
            }
            function createGridColumns(data, propertiesMap) {
                /* this call back function receives the data from the variable */
                /* check whether data is valid or not */
                var dataValid = data && !data.error;
                /*if the data is type json object, make it an array of the object*/
                if (dataValid && !WM.isArray(data)) {
                    data = [data];
                }
                /* if new columns to be rendered, prepare default fieldDefs for the data provided*/
                if ($is.newcolumns) {
                    if (propertiesMap) {
                        /*get current entity name from properties map*/
                        $is.prepareFieldDefs(data, propertiesMap);
                    } else {
                        $is.prepareFieldDefs(data);
                    }
                }
                /* Arranging Data for Pagination */
                /* if data exists and data is not error type the render the data on grid using setGridData function */
                if (dataValid) {
                    /*check for nested data if existed*/
                    $is.serverData = data;
                    setGridData($is.serverData);
                }
            }
            /* function to prepare fieldDefs for the grid according to data provided */
            function prepareFieldDefs(data, propertiesMap) {
                var defaultFieldDefs,
                    properties,
                    columns,
                    gridObj,
                    options = {};

                $is.fieldDefs = [];
                $is.headerConfig = [];
                /* if properties map is existed then fetch the column configuration for all nested levels using util function */
                if (propertiesMap) {
                    columns = Utils.fetchPropertiesMapColumns(propertiesMap);
                    properties = [Utils.resetObjectWithEmptyValues(columns)];
                } else {
                    properties = data;
                }
                options.columnUpperBound = $is.displayAllFields ? -1 : 10;
                options.noModifyTitle    = $is.noModifyTitle;
                /*call utility function to prepare fieldDefs for grid against given data (A MAX OF 10 COLUMNS ONLY)*/
                if (CONSTANTS.isStudioMode && ($is.isBoundToServiceVariable || $is.isBoundToWebSocketVariable)) {
                    var StudioUtils = Utils.getService('StudioUtils');
                    defaultFieldDefs = StudioUtils.getFieldsForService(properties);
                } else {
                    defaultFieldDefs = Utils.prepareFieldDefs(properties, options);
                }

                /*append additional properties*/
                WM.forEach(defaultFieldDefs, function (columnDef) {
                    var newColumn,
                        columnValue;
                    columnDef.pcDisplay     = true;
                    columnDef.mobileDisplay = true;
                    columnDef.searchable    = true;
                    columnDef.type          = 'string';
                    WM.forEach($is.fullFieldDefs, function (column) {
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
                        newColumn            = columns[columnDef.field];
                        columnDef.type       = newColumn.type;
                        columnDef.primaryKey = newColumn.isPrimaryKey;
                        columnDef.generator  = newColumn.generator;
                        columnDef.readonly   = WM.isDefined(newColumn.readonly) ? newColumn.readonly === 'true' : newColumn.relatedEntityName ? !newColumn.isPrimaryKey : _.includes(['identity', 'uniqueid', 'sequence'], newColumn.generator);
                        if (columnDef.type === 'timestamp' || columnDef.type === 'datetime' || columnDef.type === 'date') {
                            if (!columnDef.formatpattern) {
                                columnDef.formatpattern = 'toDate';
                            }
                            if (!columnDef.datepattern) {
                                columnDef.datepattern = columnDef.type === 'date' ? 'yyyy-MM-dd' : 'dd-MMM-yyyy HH:mm:ss';
                            }
                        }
                        if (columnDef.type === 'blob' && !columnDef.customExpression) {
                            columnValue = 'bind:row.getProperty(\'' + columnDef.field + '\')';
                            if (columnDef.widgetType === 'image') {
                                columnDef.customExpression = '<wm-picture show="' + columnValue + '!= null" width="48px" picturesource="' + columnValue + '" class="" conditionalclass=""></wm-picture>';
                            } else {
                                columnDef.customExpression = '<wm-anchor caption="" hyperlink="' + columnValue + '" target="_blank" iconclass="wm-icon wm-icon24 wi wi-file" class="col-md-9" show="' + columnValue + ' != null"></wm-anchor>';
                            }
                        }
                    }
                    $is.headerConfig.push({
                        'name'  : columnDef.field,
                        'field' : columnDef.field
                    });
                });

                /*prepare a copy of fieldDefs prepared
                 (defaultFieldDefs will be passed to markup and fieldDefs are used for grid)
                 (a copy is kept to prevent changes made by ng-grid in the fieldDefs)
                 */
                $is.fieldDefs = Utils.getClonedObject(defaultFieldDefs);

                renderOperationColumns();

                /*push the fieldDefs in respective grid markup*/
                gridObj = {
                    widgetName : $is.name,
                    fieldDefs: defaultFieldDefs,
                    scopeId: $is.$id
                };
                $is.updateMarkupForGrid(gridObj);
                $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs));
            }
            function setDataGridOption(optionName, newVal, forceSet) {
                if (!$is.datagridElement.datatable('instance')) {
                    return;
                }
                var option = {};
                if (WM.isDefined(newVal) && (!WM.equals(newVal, $is.gridOptions[optionName]) || forceSet)) {
                    option[optionName] = newVal;
                    $is.datagridElement.datatable('option', option);
                    $is.gridOptions[optionName] = newVal;
                }
            }
            function initiateSelectItem(index, row, skipSelectItem, isStaticVariable, callBack) {
                /*index === "last" indicates that an insert operation has been successfully performed and navigation to the last page is required.
                 * Hence increment the "dataSize" by 1.*/
                if (index === 'last') {
                    if (!isStaticVariable) {
                        $is.dataNavigator.dataSize += 1;
                    }
                    /*Update the data in the current page in the grid after insert/update operations.*/
                    if (!$is.shownavigation) {
                        index = 'current';
                    }
                }
                /*Re-calculate the paging values like pageCount etc that could change due to change in the dataSize.*/
                $is.dataNavigator.calculatePagingValues();
                $is.dataNavigator.navigatePage(index, null, true, function () {
                    if ($is.shownavigation || isStaticVariable) {
                        selectItemOnSuccess(row, skipSelectItem, callBack);
                    }
                });
            }
            function selectItem(item, data) {
                /* server is not updating immediately, so set the server data to success callback data */
                if (data) {
                    $is.serverData = data;
                }
                //For live variable, on update/insert while selecting the row, remove the keys with empty array
                if (_.isObject(item) && $is.variable && $is.variable.category === 'wm.LiveVariable') {
                    item = _.omitBy(item, function (value) {
                        return _.isArray(value) && _.isEmpty(value);
                    });
                }
                $is.callDataGridMethod('selectRow', item, true);
            }
            /* deselect the given item*/
            function deselectItem(item) {
                $is.callDataGridMethod('deselectRow', item);
            }
            /* determines if the 'user-defined'(not default) columnDefs exists already for the grid */
            function columnDefsExists() {
                var i, n;
                /* override the fieldDefs if user has untouched the columnDefs*/
                for (i = 0, n = $is.fieldDefs.length; i < n; i = i + 1) {
                    /* if a binding field is found in the fieldDef, user has edited the columnDefs, don't override the columnDefs */
                    if ($is.fieldDefs[i].field) {
                        return true;
                    }
                }
                /* modified column defs do not exist, return false*/
                return false;
            }
            function deleteRow(evt) {
                var row;
                if (evt && evt.target) {
                    $is.callDataGridMethod('deleteRowAndUpdateSelectAll', evt);
                } else {
                    //Wait for the selected item to get updated
                    $timeout(function () {
                        row = evt || $is.selectedItems[0];
                        deleteRecord({row: row});
                    });
                }
            }
            function editRow(evt) {
                var row;
                if (evt && evt.target) {
                    $is.callDataGridMethod('toggleEditRow', evt, {'selectRow': true});
                } else {
                    //For live form, call the update function with selected item
                    if ($is.editmode === 'form' || $is.editmode === 'dialog') {
                        row = evt || $is.selectedItems[0];
                        $is.gridOptions.beforeRowUpdate(row);
                    } else {
                        //Wait for the selected item to get updated
                        $timeout(function () {
                            row = $is.datagridElement.find('tr.active');
                            if (row.length) {
                                $is.callDataGridMethod('toggleEditRow', undefined, {$row: row, action: 'edit'});
                            }
                        });
                    }
                }
            }
            function addRow() {
                $is.addNewRow();
            }
            function onRecordDelete(callBack) {
                var index;
                /*Check for sanity*/
                if ($is.dataNavigator) {
                    $is.dataNavigator.dataSize -= 1;
                    $is.dataNavigator.calculatePagingValues();
                    /*If the current page does not contain any records due to deletion, then navigate to the previous page.*/
                    index = $is.dataNavigator.pageCount < $is.dataNavigator.dn.currentPage ? 'prev' : undefined;
                    $is.dataNavigator.navigatePage(index, null, true, function () {
                        $timeout(function () {
                            Utils.triggerFn(callBack);
                        }, undefined, false);
                    });
                }
            }
            function call(operation, data, success, error) {
                data.success = success;
                data.error   = error;
                switch (operation) {
                case 'create':
                    insertRecord(data);
                    break;
                case 'update':
                    updateRecord(data);
                    break;
                case 'delete':
                    deleteRecord(data);
                    break;
                }
            }
            //On click of item in export menu, download the file in respective format
            function exportData($item) {
                var filterFields,
                    variable = $is.variable,
                    sortOptions = _.isEmpty($is.sortInfo) ? '' : $is.sortInfo.field + ' ' + $is.sortInfo.direction,
                    isValid,
                    requestData,
                    columns = {};
                _.forEach($is.fieldDefs, function (fieldDef) {
                    // Do not add the row operation actions column to the exported file.
                    //Do not add the column with show property 'false' to the exported file.
                    if(fieldDef.field === ROW_OPS_FIELD || !fieldDef.show) {
                        return;
                    }
                    var option = {
                        'header': fieldDef.displayName
                    };
                    // If column has exportexpression, then send form the expression as required by backend.
                    // otherwise send the field name.
                    if (fieldDef.exportexpression) {
                        option.expression = fieldDef.exportexpression;
                    } else {
                        option.field = fieldDef.field;
                    }
                    columns[fieldDef.field] = option;
                });
                if ($is.isBoundToFilter) {
                    requestData = {'orderBy': sortOptions, 'exportType': $item.label, 'exportSize': $is.exportdatasize,'columns': columns};
                } else if ($is.showExportOptions()) {
                    filterFields = getFilterFields($is.filterInfo);
                    requestData = {
                        'matchMode'    : 'anywhereignorecase',
                        'filterFields' : filterFields,
                        'orderBy'      : sortOptions,
                        'exportType'   : $item.label,
                        'logicalOp'    : 'AND',
                        'exportSize'   : $is.exportdatasize,
                        'columns'      : columns
                    };
                }
                isValid = $is.onBeforeexport({$data: requestData});
                if(isValid === false){
                    return;
                }
                requestData.fields = _.values(requestData.columns);
                if ($is.isBoundToFilter) {
                    $is.Widgets[$is.widgetName].applyFilter(requestData);
                } else if ($is.showExportOptions()) {
                    variable.download({data: requestData});
                }
            }
            //Populate the _actions based on the position property
            function populateActions() {
                $is._actions.header = [];
                $is._actions.footer = [];
                _.forEach($is.actions, function (action) {
                    if (_.includes(action.position, 'header')) {
                        $is._actions.header.push(action);
                    }
                    if (_.includes(action.position, 'footer')) {
                        $is._actions.footer.push(action);
                    }
                });
            }

            //Function to get the updated values when filter on field is changed for multicolumn filter
            function getFilterOnFieldValues(filterDef) {
                var variable       = $is.Variables[$is.variableName],
                    fieldName      = filterDef.field,
                    formFields     = $is.fullFieldDefs,
                    filterOnFields = _.filter(formFields, {'filteronfilter': fieldName}),
                    newVal         = _.get($is.rowFilter, [fieldName, 'value']);

                if (!variable) {
                    return;
                }
                //Loop over the fields for which the current field is filter on field
                _.forEach(filterOnFields, function (filterField) {
                    var filterOn     = filterField.filteronfilter,
                        filterKey    = filterField.field,
                        filterFields = {},
                        filterWidget = filterField.filterwidget;

                    if (!isDataSetWidgets[filterWidget] || filterOn === filterKey || filterField._isFilterDataSetBound || !filterField._isLiveVariable) {
                        return;
                    }

                    filterFields[filterOn] = (WM.isDefined(newVal) && newVal !== '' && newVal !== null) ? {'value' : newVal} : {};

                    if (filterWidget === 'autocomplete' && filterField.filterdataoptions) {
                        filterField.filterdataoptions.filterFields = filterFields;
                    } else {
                        variable.getDistinctDataByFields({
                            'fields'         : filterKey,
                            'filterFields'   : filterFields
                        }, function (data) {
                            filterField.__filterdataset = _.pull(_.map(data.content, filterKey), null);
                        });
                    }
                });
            }
            //Function to be executed on any row filter change
            function onRowFilterChange(fieldName) {
                var searchObj = [],
                    field     = _.find($is.fullFieldDefs, {'field': fieldName});
                //Convert row filters to a search object and call search handler
                _.forEach($is.rowFilter, function (value, key) {
                    if ((WM.isDefined(value.value) && value.value !== '') || _.includes($is.emptyMatchModes, value.matchMode)) {
                        if (field && key === field.field) {
                            value.type      = value.type || field.type;
                            value.matchMode = value.matchMode || _.get($is.matchModeTypesMap[value.type], 0);
                        }
                        searchObj.push({
                            'field'     : key,
                            'value'     : value.value,
                            'matchMode' : value.matchMode,
                            'type'      : value.type
                        });
                    }
                });
                $is.gridOptions.searchHandler(searchObj, undefined, 'search');

                //If field is passed, update any filter on field values if present
                if (field) {
                    getFilterOnFieldValues(field);
                }
            }
            //Function to be executed on filter condition change
            function onFilterConditionSelect(field, condition) {
                $is.rowFilter[field] = $is.rowFilter[field] || {};
                $is.rowFilter[field].matchMode = condition;
                //For empty match modes, clear off the value and call filter
                if (_.includes($is.emptyMatchModes, condition)) {
                    $is.rowFilter[field].value = undefined;
                    $is.onRowFilterChange();
                } else {
                    //If value is present, call the filter. Else, focus on the field
                    if (WM.isDefined($is.rowFilter[field].value) && $is.rowFilter[field].value !== '') {
                        $is.onRowFilterChange();
                    } else {
                        $timeout(function () {
                            $is.Widgets[($is.name || $is.$id) + '_filter_' + field].focus();
                        });
                    }
                }
            }
            //Function to be executed on clearing a row filter
            function clearRowFilter(fieldName) {
                if ($is.rowFilter && $is.rowFilter[fieldName]) {
                    $is.rowFilter[fieldName].value = undefined;
                    $is.onRowFilterChange(fieldName);
                }
            }
            //Show clear icon if value exists
            function showClearIcon(field) {
                var value = $is.rowFilter[field] && $is.rowFilter[field].value;
                return WM.isDefined(value) && value !== '' && value !== null;
            }
            //Function to display the toaster type can be error or success
            function toggleMessage(show, type, msg, header) {
                if (show && msg) {
                    wmToaster.show(type, WM.isDefined(header) ? header : type.toUpperCase(), msg);
                } else {
                    wmToaster.hide();
                }
            }
            //On pagination change, scroll the page to top
            function onPaginationchange() {
                $is.datagridElement.find('.app-grid-content').scrollTop(0);
            }
            //Clear the all the filters applied
            function clearFilter(skipFilter) {
                var $gridElement;
                $is.filterInfo = {};
                if ($is.filtermode === 'multicolumn') {
                    $is.rowFilter = {};
                    if (!skipFilter) {
                        $is.onRowFilterChange();
                    }
                } else if ($is.filtermode === 'search') {
                    $gridElement = $is.datagridElement;
                    $gridElement.find('[data-element="dgSearchText"]').val('');
                    $gridElement.find('[data-element="dgFilterValue"]').val('');
                    if (!skipFilter) {
                        $gridElement.find('.app-search-button').trigger('click');
                    }
                }
            }
            //Refresh the grid data with the filter and sort applied
            function refreshData(isSamePage) {
                var page = isSamePage ? $is.dataNavigator.dn.currentPage : 1;
                if ($is.isBoundToLiveVariable) {
                    refreshLiveVariable(page);
                    return;
                }
                if ($is.isBoundToQueryServiceVariable) {
                    refreshQueryServiceVariable(page);
                    return;
                }
                if ($is.isBoundToServiceVariable) {
                    refreshServiceVariable();
                    return;
                }
                if ($is.isBoundToFilter) {
                    refreshLiveFilter();
                }
            }
            //This method is called form the datanavigator
            function onDataNavigatorDataSetChange(newVal) {
                var data,
                    variableSort;
                if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                    variableSort = Utils.getOrderByExpr(newVal.sort);
                    $is.__fullData = newVal.content;
                } else {
                    $is.__fullData = newVal;
                }
                checkFiltersApplied(variableSort);
                if ($is._isClientSearch) {
                    data = Utils.getClonedObject($is.__fullData);
                    if (WM.isObject(data) && !WM.isArray(data)) {
                        data = [data];
                    }
                    data = getSearchResult(data, $is.filterInfo);
                    data = getSortResult(data, $is.sortInfo);
                    return data;
                }
                return newVal;
            }
            //Function to call the jqeury datagrid method
            function callDataGridMethod() {
                if (!$is.datagridElement.datatable('instance')) {
                    return; //If datagrid is not initiliazed or destroyed, return here
                }
                return $is.datagridElement.datatable.apply($is.datagridElement, arguments);
            }
            //Function to hide the edited row
            function hideEditRow() {
                var $row = $is.datagridElement.find('tr.row-editing');
                if ($row.length) {
                    $is.callDataGridMethod('hideRowEditMode', $row);
                }
            }
            //Function to save the row
            function saveRow() {
                $is.callDataGridMethod('saveRow');
            }
            //Function to cancel the edit
            function cancelRow() {
                var $row = $is.datagridElement.find('tr.row-editing');
                if ($row.length) {
                    $is.callDataGridMethod('cancelEdit', $row);
                }
            }
            //On change of a field, update the filter on fields
            function _onChangeField($event, $ws, newVal) {
                $is.applyFilterOnField(_.find($is.fullFieldDefs, {'field': $ws.$element.attr('data-field-name')}), newVal);
            }
            //On submit of a autocomplete field, update the filter on fields
            function _onSubmitField($event, $ws) {
                $is.applyFilterOnField(_.find($is.fullFieldDefs, {'field': $ws.$element.attr('data-field-name')}), $ws.datavalue);
            }

            $is.setGridData                  = setGridData.bind(undefined);
            $is.rowFilter                    = {};
            $is.filterInfo                   = {};
            $is.fieldDefs                    = [];
            $is.fullFieldDefs                = [];
            $is.selectedItems                = [];
            $is.isGridEditMode               = false;
            $is.formWidgets                  = {};
            $is.gridData                     = [];
            $is.updateMarkupForGrid          = updateMarkupForGrid;
            $is.resetSortStatus              = resetSortStatus;
            $is.updateVariable               = updateVariable;
            $is.resetColumnDefinitions       = resetColumnDefinitions;
            $is.renderOperationColumns       = renderOperationColumns;
            $is.addNewRow                    = addNewRow;
            $is.resetPageNavigation          = resetPageNavigation;
            $is.enablePageNavigation         = enablePageNavigation;
            $is.fetchDynamicColumnDefs       = fetchDynamicColumnDefs;
            $is.isDataValid                  = isDataValid;
            $is.watchVariableDataSet         = watchVariableDataSet;
            $is.createGridColumns            = createGridColumns;
            $is.prepareFieldDefs             = prepareFieldDefs;
            $is.setDataGridOption            = setDataGridOption;
            $is.initiateSelectItem           = initiateSelectItem;
            $is.getNavigationTargetBySortInfo= getNavigationTargetBySortInfo;
            $is.selectItem                   = selectItem;
            $is.highlightRow                 = $is.selectItem;
            $is.deselectItem                 = deselectItem;
            $is.columnDefsExists             = columnDefsExists;
            $is.deleteRow                    = deleteRow;
            $is.editRow                      = editRow;
            $is.addRow                       = addRow;
            $is.hideEditRow                  = hideEditRow;
            $is.saveRow                      = saveRow;
            $is.cancelRow                    = cancelRow;
            $is.onRecordDelete               = onRecordDelete;
            $is.call                         = call;
            $is.export                       = exportData;
            $is.populateActions              = populateActions;
            $is.onRowFilterChange            = onRowFilterChange;
            $is.onFilterConditionSelect      = onFilterConditionSelect;
            $is.clearRowFilter               = clearRowFilter;
            $is.showClearIcon                = showClearIcon;
            $is.toggleMessage                = toggleMessage;
            $is.onPaginationchange           = onPaginationchange;
            $is.clearFilter                  = clearFilter;
            $is.refreshData                  = refreshData;
            $is.onDataNavigatorDataSetChange = onDataNavigatorDataSetChange;
            $is.callDataGridMethod           = callDataGridMethod;
            $is._onChangeField               = _onChangeField;
            $is._onSubmitField               = _onSubmitField;
            $is.applyFilterOnField           = LiveWidgetUtils.applyFilterOnField.bind(undefined, $is);

            $is.gridDataWatch = $is.$watch('gridData', function (newValue) {
                var startRowIndex,
                    gridOptions;

                if (WM.isDefined(newValue)) {
                    /*Setting the serial no's only when show navigation is enabled and data navigator is compiled
                     and its current page is set properly*/
                    if ($is.shownavigation && $is.dataNavigator && $is.dataNavigator.dn.currentPage) {
                        startRowIndex = (($is.dataNavigator.dn.currentPage - 1) * ($is.dataNavigator.maxResults || 1)) + 1;
                        $is.setDataGridOption('startRowIndex', startRowIndex);
                    }
                    /* If colDefs are available, but not already set on the datagrid, then set them.
                     * This will happen while switching from markup to design tab. */
                    gridOptions = $is.callDataGridMethod('getOptions');

                    if (!gridOptions) {
                        return;
                    }

                    if (!gridOptions.colDefs.length && $is.fieldDefs.length) {
                        $is.setDataGridOption('colDefs', Utils.getClonedObject($is.fieldDefs));
                    }
                    //Map the col defs to columns
                    _.map(gridOptions.colDefs, function (column) {
                        $is.columns[column.field] = column;
                    });
                    //If data and colDefs are present, call on before data render event
                    if (!_.isEmpty(newValue) && gridOptions.colDefs.length) {
                        $is.onBeforedatarender({$isolateScope: $is, $data: newValue, $columns: $is.columns});
                    }
                    $is.setDataGridOption('data', Utils.getClonedObject(newValue));
                }
            });
            $is.gridOptions = {
                data: Utils.getClonedObject($is.gridData),
                colDefs: $is.fieldDefs,
                startRowIndex: 1,
                onDataRender: function () {
                    // select rows selected in previous pages. (Not finding intersection of data and selecteditems as it will be heavy)
                    if (!$is.multiselect) {
                        $is.items.length = 0;
                    }
                    $is.callDataGridMethod('selectRows', $is.items);
                    $is.selectedItems = $is.callDataGridMethod('getSelectedRows');
                    if ($is.gridData.length) {
                        $is.onDatarender({$isolateScope: $is, $data: $is.gridData});
                    }
                    //On render, apply the filters set for query service variable
                    if (CONSTANTS.isRunMode && $is._isPageSearch && $is.filterInfo) {
                        defaultSearchHandler($is.filterInfo);
                    }
                },
                onRowSelect: function (rowData, e) {
                    $is.selectedItems = $is.callDataGridMethod('getSelectedRows');
                    /*
                     * in case of single select, update the items with out changing the reference.
                     * for multi select, keep old selected items in tact
                     */
                    if ($is.multiselect) {
                        if (_.findIndex($is.items, rowData) === -1) {
                            $is.items.push(rowData);
                        }
                    } else {
                        $is.items.length = 0;
                        $is.items.push(rowData);
                    }
                    $is.onSelect({$data: rowData, $event: e, $rowData: rowData, $isolateScope: $is});
                    $is.onRowclick({$data: rowData, $event: e, $rowData: rowData, $isolateScope: $is});
                    // For backward compatibility.
                    if (WM.isDefined($is.onClick) && !$is.widgetid) {
                        $is.onClick({$data: rowData, $event: e, $rowData: rowData, $isolateScope: $is});
                    }
                    if (WM.isDefined($is.onTap)) {
                        $is.onTap({$data: rowData, $event: e, $rowData: rowData, $isolateScope: $is});
                    }
                    $rs.$safeApply($is);
                },
                onRowDblClick: function (rowData, e) {
                    $is.onRowdblclick({$data: rowData, $event: e, $rowData: rowData, $isolateScope: $is});
                    $rs.$safeApply($is);
                },
                onRowDeselect: function (rowData, e) {
                    if ($is.multiselect) {
                        $is.items = _.pullAllWith($is.items, [rowData], _.isEqual);
                        $is.selectedItems = $is.callDataGridMethod('getSelectedRows');
                        $is.onDeselect({$data: rowData, $event: e, $rowData: rowData, $isolateScope: $is});
                        $rs.$safeApply($is);
                    }
                },
                onColumnSelect: function (col, e) {
                    $is.selectedColumns = $is.callDataGridMethod('getSelectedColumns');
                    $is.onColumnselect({$data: col, $event: e});
                    $rs.$safeApply($is);
                },
                onColumnDeselect: function (col, e) {
                    $is.selectedColumns = $is.callDataGridMethod('getSelectedColumns');
                    $is.onColumndeselect({$data: col, $event: e});
                    $rs.$safeApply($is);
                },
                onHeaderClick: function (col, e) {
                    /* if onSort function is registered invoke it when the column header is clicked */
                    $is.onHeaderclick({$event: e, $data: col});
                },
                onRowDelete: function (rowData, cancelRowDeleteCallback, e, callBack,options) {
                    deleteRecord(_.extend({}, options, {'row': rowData, 'cancelRowDeleteCallback': cancelRowDeleteCallback, 'evt': e, 'callBack': callBack}));
                },
                onRowInsert: function (rowData, e, callBack, options) {
                    insertRecord(_.extend({}, options, {'row': rowData, event: e, 'callBack': callBack}));
                },
                beforeRowUpdate: function (rowData, e, eventName) {
                    $is.$emit('update-row', $is.widgetid, rowData, eventName);
                    $is.prevData = Utils.getClonedObject(rowData);
                    $rs.$safeApply($is);
                    $rs.$emit('wm-event', $is.widgetid, 'update');
                },
                afterRowUpdate: function (rowData, e, callBack, options) {
                    updateRecord(_.extend({}, options, {'row': rowData, 'prevData': $is.prevData, 'event': e, 'callBack': callBack}));
                },
                onBeforeRowUpdate: function (rowData, e, options) {
                    return $is.onBeforerowupdate({$event: e, $data: rowData, $rowData: rowData, $isolateScope: $is, options: options});
                },
                onBeforeRowInsert: function (rowData, e, options) {
                    return $is.onBeforerowinsert({$event: e, $data: rowData, $rowData: rowData, $isolateScope: $is, options: options});
                },
                onBeforeRowDelete: function (rowData, e, options) {
                    return $is.onBeforerowdelete({$event: e, $rowData: rowData, $isolateScope: $is, options: options});
                },
                onFormRender: function ($row, e, operation) {
                    $is.formWidgets = LiveWidgetUtils.getFormFilterWidgets($row, 'data-field-name');
                    $is.onFormrender({$event: e, formWidgets: $is.formWidgets, $operation: operation});
                    $rs.$safeApply($is);
                },
                onBeforeFormRender: function (rowData, e, operation) {
                    //On Form render, update the filter on field values
                    _.forEach($is.fullFieldDefs, function(fieldDef) {
                        $is.applyFilterOnField(fieldDef, _.get(rowData, fieldDef.field));
                    });
                    return $is.onBeforeformrender({$event: e, $rowData: rowData, $operation: operation});
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
                    return $is.binddataset;
                },
                setGridEditMode: function (val) {
                    $is.isGridEditMode = val;
                    if (!val) {
                        $is.formWidgets = {};
                    }
                    $rs.$safeApply($is);
                },
                setGridState: function (val) {
                    $is.isLoading = val === 'loading';
                },
                noChangesDetected: function () {
                    $is.toggleMessage(true, 'info', $is.appLocale.MESSAGE_NO_CHANGES, '');
                    $rs.$safeApply($is);
                },
                afterSort: function (e) {
                    $rs.$safeApply($is);
                    $is.onSort({$event: e, $data: $is.serverData});
                },
                //Function to loop through events and trigger
                handleCustomEvents: function (e, options) {
                    if (!options) {
                        var $ele          = WM.element(e.target),
                            $button       = $ele.closest('button'),
                            key           = $button.attr('data-action-key'),
                            events        = _.find($is.rowActions, {'key' : key}).action || '',
                            callBackScope = $button.scope(),
                            $row          = $ele.closest('tr'),
                            rowId         = $row.attr('data-row-id'),
                            data          = $is.gridOptions.data[rowId];
                        if (events) {
                            Utils.triggerCustomEvents(e, events, callBackScope, data);
                        }
                    } else {
                        $is.callDataGridMethod('toggleEditRow', e, options);
                    }
                },
                //Function to redraw the widgets on resize of columns
                redrawWidgets: function () {
                    //Widgets inside the filter row and edit row
                    $is.datagridElement.find('tr.filter-row .ng-isolate-scope, tr.row-editing .ng-isolate-scope').each(function () {
                        Utils.triggerFn(WM.element(this).isolateScope().redraw);
                    });
                },
                searchHandler: handleOperation,
                sortHandler: handleOperation,
                timeoutCall: function (fn, delay) {
                    $timeout(fn, delay, false);
                },
                safeApply: function () {
                    $rs.$safeApply($is);
                }
            };
        }])
/**
 * @ngdoc directive
 * @name wm.widgets.table.directive:wmTableColumnGroup
 * @restrict E
 *
 * @description
 * The `wmTableColumnColumn` serves the purpose of providing column group definitions to the parent `wmTable` directive.
 * `wmTableColumnColumn` is internally used by `wmTable`.
 *
 * @requires LiveWidgetUtils
 *
 * @param {string=} caption
 *                  Sets the title of the column.
 * @param {string=} name
 *                  Sets the name of the column
 */
    .directive('wmTableColumnGroup', ['LiveWidgetUtils', 'CONSTANTS', 'BindingManager', 'Utils', function (LiveWidgetUtils, CONSTANTS, BindingManager, Utils) {
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
                            newVal = WM.isDefined(newVal) ? newVal : '';
                            if (property === 'displayName') {
                                scope.callDataGridMethod('setColumnProp', config.field, property, newVal, true);
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
 * @name wm.widgets.table.directive:wmTableColumn
 * @restrict E
 *
 * @description
 * The `wmTableColumn` serves the purpose of providing column definitions to the parent `wmTable` directive.
 * `wmTableColumn` is internally used by `wmTable`.
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
 *                  The value provided will be evaluated in the 'dataset' or 'scopedataset' of the parent 'wmTable' and the data will be displayed in the column.
 *
 * @example
  <example module="wmCore">
      <file name="index.html">
          <div data-ng-controller="Ctrl" class="wm-app">
              <wm-table dataset="bind:Variables.gridVariable.dataSet">
                  <wm-table-column binding="deptid" caption="deptid" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="budget" caption="budget" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="location" caption="location" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="q1" caption="q1" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="q2" caption="q2" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="q3" caption="q3" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="name" caption="name" pcdisplay="true" mobiledisplay="true"></wm-table-column>
                  <wm-table-column binding="deptcode" caption="deptcode" pcdisplay="true" mobiledisplay="true"></wm-table-column>
              </wm-table>
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
    .directive('wmTableColumn', ['$parse', 'Utils', 'CONSTANTS', 'BindingManager', 'LiveWidgetUtils', function ($parse, Utils, CONSTANTS, BindingManager, LiveWidgetUtils) {
        'use strict';
        var isDataSetWidgets = Utils.getDataSetWidgets();
        return {
            'restrict': 'E',
            'scope': true,
            'template': '<div></div>',
            'replace': true,
            'compile': function (tElement) {

                var columnProperties = ['generator', 'widgetType', 'datepattern', 'currencypattern', 'fractionsize', 'suffix', 'prefix', 'accessroles', 'dataset', 'datafield', 'validationmessage',
                    'placeholder', 'displaylabel', 'searchkey', 'displayfield', 'rowactionsposition', 'filterplaceholder', 'relatedEntityName', 'checkedvalue', 'uncheckedvalue', 'showdropdownon', 'dataentrymode',
                    'filterOn', 'filterdataset', 'filterdatafield', 'filterdisplayfield', 'filterdisplaylabel', 'filtersearchkey', 'filteronfilter', 'editdatepattern', 'exportexpression', 'filterexpressions', 'regexp'];

                return {
                    'pre': function (scope, element, attrs) {
                        //Get the form widget scope in edit mode
                        function getFormWidgetScope(fieldName) {
                            var $el = scope.datagridElement.find('[data-field-name="' + fieldName + '"]');
                            return $el.isolateScope();
                        }
                        /*
                         * Class : ColumnDef
                         * Description : ColumnDef is intermediate class which extends FieldDef base class
                         * */
                        scope.ColumnDef = function () {};
                        scope.ColumnDef.prototype = new wm.baseClasses.FieldDef();
                        scope.ColumnDef.prototype.setProperty = function (property, newval) {
                            this.$is.setProperty.call(this, property, newval);
                            if (property === 'displayName') {
                                scope.callDataGridMethod('setColumnProp', this.field, property, newval);
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
                            var elScope = getFormWidgetScope(this.field);
                            property = property === 'value' ? 'datavalue' : property;
                            elScope[property] = newval;
                        };
                        scope.fieldDef.prototype.getProperty = function (property) {
                            //Get the scope of the current editable widget and get the value
                            var elScope = getFormWidgetScope(this.field);
                            property = property === 'value' ? 'datavalue' : property;
                            return elScope[property];
                        };
                        scope.fieldDef.prototype.focus = function () {
                            var elScope = getFormWidgetScope(this.field);
                            elScope.focus();
                        };

                        var index,
                            exprWatchHandlers = [],
                            config,
                            columnValue,
                            textAlignment = attrs.textalignment || 'left',
                            backgroundColor = attrs.backgroundcolor,
                            textColor = attrs.textcolor,
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
                            bindings,
                            fieldDefProps = {
                                'field': attrs.binding
                            },
                            skipWatchProps = ['dataset', 'defaultvalue', 'disabled', 'readonly', 'filterdataset'];
                        function watchProperty(property, expression) {
                            exprWatchHandlers[property] = BindingManager.register(parentScope, expression, function (newVal) {
                                newVal = WM.isDefined(newVal) ? newVal : '';
                                columnDef.setProperty(property, newVal);
                            }, {'deepWatch': true, 'allowPageable': true, 'acceptsArray': false});
                        }

                        //Will be used in ColumnDef prototype methods to re-render grid.
                        scope.ColumnDef.prototype.$is = parentScope;
                        scope.fieldDef.prototype.$is  = parentScope;

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
                            'style'             : styleDef,
                            'class'             : attrs.colClass,
                            'ngclass'           : attrs.colNgClass,
                            'formatpattern'     : attrs.formatpattern === 'toNumber' ? 'numberToString' : attrs.formatpattern,
                            'disabled'          : !attrs.disabled ? false : (attrs.disabled === 'true' || attrs.disabled),
                            'required'          : !attrs.required ? false : (attrs.required === 'true' || attrs.required),
                            'period'            : !attrs.period ? false : attrs.period === 'true',
                            'sortable'          : attrs.sortable !== 'false',
                            'searchable'        : (attrs.type === 'blob' || attrs.type === 'clob') ? false : attrs.searchable !== 'false',
                            'show'              : attrs.show === 'false' ? false : (attrs.show === 'true' || !attrs.show || attrs.show),
                            'limit'             : attrs.limit ? +attrs.limit : undefined,
                            'filterwidget'      : attrs.filterwidget || LiveWidgetUtils.getDataTableFilterWidget(attrs.type || 'string'),
                            'filterexpressions' : attrs.filterexpressions || '{}',
                            'minvalue'          : isNaN(+attrs.minvalue) ? attrs.minvalue : +attrs.minvalue,
                            'maxvalue'          : isNaN(+attrs.maxvalue) ? attrs.maxvalue : +attrs.maxvalue,
                            'maxchars'          : isNaN(+attrs.maxchars) ? attrs.maxchars : +attrs.maxchars,
                            'editinputtype'     : attrs.editinputtype || 'text',
                            'filterinputtype'   : attrs.filterinputtype || 'text'
                        };

                        _.forEach(columnProperties, function (key) {
                            columnDefProps[key] = attrs[key];
                        });
                        columnDefProps.defaultvalue   = LiveWidgetUtils.getDefaultValue(attrs.defaultvalue, columnDefProps.type, columnDefProps.editWidgetType);
                        columnDefProps.editWidgetType = attrs.editWidgetType || LiveWidgetUtils.getEditModeWidget(columnDefProps);
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
                        columnDef.readonly = WM.isDefined(attrs.readonly) ? attrs.readonly === 'true' : columnDef.relatedEntityName ? !columnDef.primaryKey : _.includes(['identity', 'uniqueid', 'sequence'], columnDef.generator);

                        if (columnDef.type === 'blob' && !columnDef.customExpression) {
                            if (columnDef.widgetType !== 'image') {
                                columnValue = 'row.getProperty(\'' + columnDef.field + '\')';
                                columnDef.customExpression = '<wm-anchor caption="" hyperlink="bind:' + columnValue + '" target="_blank" iconclass="wm-icon wm-icon24 wi wi-file" class="col-md-9" show="bind:' + columnValue + '!= null"></wm-anchor>';
                            }
                        }
                        /* push the fieldDef in the object meant to have all fields */
                        index = parentScope.fullFieldDefs.push(columnDef) - 1;
                        columnDef.index = index;
                        /* Backward compatibility for widgetType */
                        if (columnDef.widgetType && !columnDef.customExpression) {
                            updateCustomExpression(columnDef);
                            if (parentScope.widgetid && parentScope.fullFieldDefs.length === parentScope.gridColumnCount) {
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
                            if (attrs.dataset) {
                                /*If dataset is undefined, fetch the default values for field*/
                                columnDef.isDataSetBound = true;
                            } else {
                                if (isDataSetWidgets[columnDef.editWidgetType]) {
                                    if (columnDef.relatedEntityName && columnDef.primaryKey) {
                                        //Fetch the data for the related fields
                                        columnDef.isDataSetBound = true;
                                        bindings = _.split(columnDef.field, '.');
                                        var eleScope = element.scope();
                                        //now its an async all, by the time it fetches the data, datatable._getEditableTemplate renders the
                                        // template seeing the isDefinedData value as undefined. to avoid that we are setting this to true before now
                                        if (!LiveWidgetUtils.isSearchWidgetType(columnDef.editWidgetType)) {
                                            columnDef.isDefinedData = true;
                                        }
                                        LiveWidgetUtils.fetchRelatedFieldData(columnDef, _.head(bindings), _.last(bindings), columnDef.editWidgetType, eleScope, parentScope);
                                    } else {
                                        LiveWidgetUtils.getDistinctValuesForField(parentScope, columnDef, 'editWidgetType');
                                        if (columnDef.editWidgetType === 'autocomplete' && _.includes(parentScope.binddataset, 'bind:Variables.')) {
                                            columnDef.isAutoCompleteDataSet = true;
                                        }
                                    }
                                }
                            }
                        }
                        //Set the headet config for grouping structure
                        LiveWidgetUtils.setHeaderConfigForTable(parentScope.headerConfig, {
                            'field'         : columnDefProps.field,
                            'displayName'   : columnDefProps.displayName
                        }, $parentEl);
                        /* push the fieldDef in the object meant for actual display in the grid (this will be passed to ng-grid) */
                        parentScope.fieldDefs.push(columnDef);
                        element.remove();
                        /*destroy watch handler on scope destroy*/
                        scope.$on('$destroy', function () {
                            _.forEach(exprWatchHandlers, Utils.triggerFn);
                        });
                        //Fetch the filter options for select widget when filtermode is row
                        if (CONSTANTS.isRunMode && parentScope.filtermode === 'multicolumn' && isDataSetWidgets[columnDef.filterwidget]) {
                            variable = parentScope.gridElement.scope().Variables[Utils.getVariableName(parentScope)];
                            if (attrs.filterdataset) {
                                columnDef._isFilterDataSetBound = true;
                            } else if (variable && variable.category === 'wm.LiveVariable') {
                                columnDef._isLiveVariable = true;
                                if (columnDef.relatedEntityName) {
                                    columnDef.isRelated   = true;
                                    columnDef.lookupType  = columnDef.relatedEntityName;
                                    columnDef.lookupField = _.split(columnDef.field, '.')[1];
                                }
                                if (columnDef.filterwidget === 'autocomplete') {
                                    columnDef.filterdataoptions = LiveWidgetUtils.getDistinctFieldProperties(variable, columnDef);
                                } else {
                                    LiveWidgetUtils.getDistinctValues(columnDef, 'filterwidget', variable, function (field, data, aliascolumn) {
                                        field.__filterdataset = _.pull(_.map(data.content, aliascolumn), null);
                                    });
                                }
                            }
                        }
                    }
                };
            }
        };
    }])
    .directive('wmTableAction', ['CONSTANTS', 'LiveWidgetUtils', function (CONSTANTS, LiveWidgetUtils) {
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
                                'icon': attrs.icon,
                                'widgetType': attrs.widgetType || 'button',
                                'hyperlink': attrs.hyperlink,
                                'target': attrs.target
                            });
                        buttonDef.position = attrs.position || 'footer';
                        if (CONSTANTS.isRunMode) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = ($parentElement && $parentElement.length > 0) ? $parentElement.closest('[data-identifier="table"]').isolateScope() || scope.$parent : scope.$parent;
                        }
                        parentIsolateScope.actions = parentIsolateScope.actions || [];
                        parentIsolateScope.actions.push(buttonDef);

                        parentIsolateScope.populateActions();
                    }
                };
            }
        };
    }])
    .directive('wmTableRowAction', ['CONSTANTS', 'LiveWidgetUtils', function (CONSTANTS, LiveWidgetUtils) {
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
                            parentIsolateScope = scope.parentIsolateScope = ($parentElement && $parentElement.length > 0) ? $parentElement.closest('[data-identifier="table"]').isolateScope() || scope.$parent : scope.$parent;
                        }
                        parentIsolateScope.rowActions = parentIsolateScope.rowActions || [];
                        parentIsolateScope.rowActions.push(buttonDef);
                    }
                };
            }
        };
    }])
    .directive('wmTableRow', ['CONSTANTS', 'LiveWidgetUtils', function(CONSTANTS, LiveWidgetUtils) {
        'use strict';
        return {
            'restrict': 'E',
            'scope': true,
            'replace': true,
            'compile': function () {
                return {
                    'pre': function (scope, element, attrs) {
                        scope.partialParams = [];
                    },
                    'post': function (scope, element, attrs) {
                        var parentIsolateScope,
                            rowDef =  LiveWidgetUtils.getRowDef(attrs),
                            $parentElement = element.parent();
                        if (CONSTANTS.isRunMode) {
                           parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = ($parentElement && $parentElement.length > 0) ? $parentElement.closest('[data-identifier = "table"]').isolateScope() || scope.$parent : scope.$parent;
                        }
                        rowDef.partialParams = scope.partialParams;
                        parentIsolateScope.rowDef = parentIsolateScope.rowDef || {};
                        parentIsolateScope.rowDef = rowDef;

                    }
                }
            }

        }
    }]);
