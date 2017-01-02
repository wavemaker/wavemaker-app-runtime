/*global WM, window,confirm */

WM.module('wm.widgets.live')
    .run(["$templateCache", function ($templateCache) {
        "use strict";

        $templateCache.put("template/widget/livegrid/livegrid.html",
                '<div class="app-livegrid" init-widget title="{{hint}}" apply-styles="container">' +
                    '<div wmtransclude></div>' +
                '</div>'
            );
    }]).directive('wmLivegrid', ['PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'DialogService',
        '$compile',
        '$timeout',
        'Utils',
        'CONSTANTS',
        'wmToaster',
        '$rootScope',
        'LiveWidgetUtils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, DialogService, $compile, $timeout, Utils, CONSTANTS, wmToaster, $rs, LiveWidgetUtils) {
            "use strict";
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.livegrid', ['wm.base']),
                gridMarkup = '',
                notifyFor = {
                    'formlayout': true
                },
                showErrorMessage = function () {
                    wmToaster.show('error', 'ERROR', $rs.appLocale.LABEL_ACCESS_DENIED);
                };

            //Sets form widgets
            function setFormWidgets($is) {
                $timeout(function () {
                    $is.formWidgets = LiveWidgetUtils.getFormFilterWidgets(WM.element('body').find('.app-liveform-dialog[dialogid=' + $is._dialogid + ']'));
                });
            }

            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {},
                controller: function ($scope) {
                    this.confirmMessage = function (okCallBack, cancelCallBack) {
                        if (!($scope.grid && $scope.grid.confirmdelete)) {
                            okCallBack();
                            return;
                        }
                        DialogService._showAppConfirmDialog({
                            'caption'   : 'Delete Record',
                            'iconClass' : 'wi wi-delete fa-lg',
                            'content'   : $scope.grid.confirmdelete,
                            'resolve'   : {
                                'confirmActionOk': function () {
                                    return okCallBack;
                                },
                                'confirmActionCancel': function () {
                                    return cancelCallBack;
                                }
                            }
                        });
                    };
                },
                template: function (element) {
                    gridMarkup = element.html();
                    return $templateCache.get('template/widget/livegrid/livegrid.html');
                },
                compile: function (tElement, tAttr) {
                    tAttr.gridColumnMarkup = gridMarkup;

                    return {
                        pre: function (iScope, $el, attrs) {
                            iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        },
                        post: function (scope, element, attrs) {
                            var handlers = [],
                                liveGridOptions = {
                                    'multiselect'        : false,
                                    'setGridEditMode'    : ''
                                },
                                gridWp;
                            /* For row delete , set the row fields to the gridform */
                            liveGridOptions.onRowDelete = function (row, callBackFn) {
                                scope.gridform.rowdata = row;
                                scope.gridform.delete(callBackFn);
                            };
                            /* call the registered methods in gridform's scope */
                            /*Function to obtain parsed regular expression as provided in properties.*/
                            scope.getRegExp = function () {
                                return new RegExp(scope.regexp);
                            };
                            scope.primaryKey = null;
                            scope.fullFieldDefs = [];
                            scope.fieldDefs = [];
                            scope.grid = element.find('[data-identifier=grid]').isolateScope();
                            scope.gridform = element.find('[data-identifier=liveform]').isolateScope();
                            scope.isLayoutDialog = false;
                            /*Add watchers or listeners only if the grid or form are present in the element*/
                            if (scope.grid && scope.gridform) {
                                scope.grid.datagridElement.datagrid('option', liveGridOptions);
                                scope.grid.parentgrid = true;
                                scope.grid.isGridPartOfLiveGrid = true;
                                scope.grid.newcolumns = scope.newcolumns;
                                /* check whether any row selected or not and set the flag in grid form widget */
                                scope.grid.$watch('selectedItems', function (newValue) {
                                    if (!(scope.grid && scope.gridform && (scope.grid.variableName === scope.gridform.variableName))) {
                                        return;
                                    }
                                    if (newValue && newValue.length > 0 && !scope.gridform.isSelected) {
                                        scope.gridform.isSelected = true;
                                    }

                                    /*Update the rowdata of only that grid form that is associated with the specific grid on which row selection is being performed...
                                     * Since both the grid & gridform are associated with the same "parentgrid", match the same*/
                                    if (newValue && newValue.length > 0) {
                                        if (scope.grid.multiselect) {
                                            scope.gridform.rowdata = newValue[0];
                                        } else {
                                            scope.gridform.rowdata = newValue[newValue.length - 1];
                                        }
                                        /*If the form is already in update mode, call the form update function*/
                                        if (scope.gridform.isUpdateMode) {
                                            scope.gridform.edit();
                                        }
                                    } else {
                                        scope.gridform.isSelected = false;
                                        scope.gridform.rowdata = '';
                                        scope.gridform.clearData();
                                    }
                                }, true);

                                scope.grid.$watch('fullFieldDefs', function (newVal) {
                                    scope.fullFieldDefs = newVal;
                                }, true);
                                scope.grid.$watch('fieldDefs', function (newVal) {
                                    scope.fieldDefs = newVal;
                                }, true);
                                scope.grid.$watch('serverData', function (newVal) {
                                    scope.serverData = newVal;
                                }, true);
                                /*On add new row call the form new function*/
                                handlers.push(scope.grid.$on('add-new-row', function () {
                                    scope.gridform.isSelected = true;
                                    scope.gridform.rowdata = '';
                                    /*In case of dialog layout set the previous data Array before clearing off*/
                                    if (scope.gridform.isLayoutDialog) {
                                        scope.gridform.setPrevformFields(scope.gridform.formFields);
                                        scope.gridform.formFields = [];
                                    }
                                    scope.gridform.new();
                                    if (scope.isLayoutDialog) {
                                        DialogService.showDialog(scope.gridform._dialogid, { 'resolve': {}, 'scope' : scope.gridform });
                                        setFormWidgets(scope.gridform);
                                    }
                                }));
                                /*On update row call the form update function*/
                                handlers.push(scope.grid.$on('update-row', function (event, widgetid, row, eventName) {
                                    scope.gridform.rowdata = row;
                                    /*In case of dialog layout set the previous data Array before clearing off*/
                                    if (scope.gridform.isLayoutDialog) {
                                        scope.gridform.setPrevformFields(scope.gridform.formFields);
                                        scope.gridform.formFields = [];
                                    }
                                    scope.gridform.isSelected = true;
                                    scope.gridform.edit();
                                    scope.$root.$safeApply(scope);
                                    if (scope.isLayoutDialog) {
                                        /*Open the dialog in view or edit mode based on the defaultmode property*/
                                        scope.gridform.isUpdateMode = (eventName === 'dblclick') ? scope.gridform.updateMode : true;
                                        DialogService.showDialog(scope.gridform._dialogid, {
                                            'resolve': {},
                                            'scope': scope.gridform
                                        });
                                        setFormWidgets(scope.gridform);
                                    }
                                }));
                                /* watch the primaryKey field in grid form , as soon as it updated change the live grid primary key */
                                scope.gridform.$watch('primaryKey', function (newVal) {
                                    scope.primaryKey = newVal;
                                });
                                /*On row delete clear the form*/
                                handlers.push(scope.gridform.$on('on-cancel', function () {
                                    scope.gridform.isUpdateMode = false;
                                    if (scope.isLayoutDialog) {
                                        DialogService.hideDialog(scope.gridform._dialogid);
                                    }
                                }));
                                /* this function will be called from liveform , when the service call ended */
                                handlers.push(scope.gridform.$on('on-result', function (event, operation, response, newForm, updateMode) {
                                    scope.gridform.isUpdateMode = WM.isDefined(updateMode) ? updateMode : newForm ? true : false;
                                    switch (operation) {
                                    case 'insert':
                                        if (newForm) {
                                            /*if new form is to be shown after insert, skip the highlight of the row*/
                                            scope.grid.gridfirstrowselect = false;
                                            scope.grid.initiateSelectItem('last', response, true);
                                        } else {
                                            /*The new row would always be inserted at the end of all existing records. Hence navigate to the last page and highlight the inserted row.*/
                                            scope.grid.initiateSelectItem('last', response);
                                        }
                                        break;
                                    case 'update':
                                        /*The updated row would be found in the current page itself. Hence simply highlight the row in the current page.*/
                                        if (newForm) {
                                            scope.grid.gridfirstrowselect = false;
                                            scope.grid.initiateSelectItem('current', response, true);
                                        } else {
                                            scope.grid.initiateSelectItem('current', response);
                                        }
                                        break;
                                    case 'delete':
                                        scope.grid.onRecordDelete();
                                        break;
                                    }
                                    scope.grid.updateVariable();
                                    if (scope.isLayoutDialog) {
                                        /*if new form is to be shown after update or insert, don't close the dialog*/
                                        if (newForm) {
                                            if (operation === 'insert') {
                                                scope.gridform.new();
                                            } else if (operation === 'update') {
                                                scope.gridform.edit();
                                            }
                                        } else {
                                            DialogService.hideDialog(scope.gridform._dialogid);
                                        }
                                    }
                                }));
                            } else if (scope.grid) {
                                //If form is not present along with the grid, disable the actions on grid
                                scope.grid.datagridElement.datagrid('option', {
                                    'beforeRowUpdate'    : function () {
                                        showErrorMessage();
                                    },
                                    'beforeRowDelete'     : function () {
                                        showErrorMessage();
                                    },
                                    'beforeRowInsert'     : function () {
                                        showErrorMessage();
                                    }
                                });
                            }
                            $compile(attrs.gridColumnMarkup)(scope);
                            function propertyChangeHandler(key, newVal) {
                                switch (key) {
                                case 'formlayout':
                                    if (scope.gridform) {
                                        scope.isLayoutDialog = newVal === 'dialog';
                                        scope.gridform.formlayout = newVal;
                                        scope.$root.$emit('set-markup-attr', scope.gridform.widgetid, {'formlayout': newVal});
                                    }
                                    break;
                                }
                            }
                            scope.$on('$destroy', function () {
                                handlers.forEach(Utils.triggerFn);
                            });
                            /* register the property change handler */
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);
                            $timeout(function () {
                                WidgetUtilService.postWidgetCreate(scope, element, attrs);
                            }, 0, false);

                            if (scope.widgetid && scope.grid) {
                                //Hide the grid CRUD call back events
                                gridWp = scope.grid.widgetProps;
                                gridWp.onRowdeleted.show      = false;
                                gridWp.onBeforerowinsert.show = false;
                                gridWp.onRowinsert.show       = false;
                                gridWp.onBeforerowupdate.show = false;
                                gridWp.onRowupdate.show       = false;
                            }
                        }
                    };
                }
            };
        }]);

/**
 * @ngdoc directive
 * @name wm.widgets.live.directive:wmLivegrid
 * @restrict E
 *
 * @description
 * The `wmLiveGrid` is the Combination of grid and grid form. Using Livegrid user can insert,update,delete the data in database
 * `wmLiveGrid` can be bound to variables and display the data associated with them.
 *
 * @scope
 *
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $compile
 * @requires $controller
 * @requires $timeout
 * @requires DialogService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the live grid.
 * @param {string=} width
 *                  Sets the width of the live grid.
 * @param {string=} height
 *                  Sets the height of the live grid.
 * @param {string=} formlayout
 *                  This property controls how the form appears. <br>
 *                  Possible values are `inline` and `dialog`. <br>
 *                  Default value is `inline`.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the button widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} confirmdelete
 *                  Sets the text to be displayed before delete operation on  any of the grid rows.<br>
 * @param {boolean=} gridfirstrowselect
 *                  When enabled, the first row of the grid is highlighted.<br>
 *                  Default value for `gridfirstrowselect` is `false`.
 * @param {boolean=} deleterow
 *                  When enabled, this displays Delete buttons in each row.<br>
 *                  When clicked on the button, the corresponding row is deleted.
 * @param {object=} dataset
 *                  Sets the data for the grid.<br>
 *                  The data is visible only in the run mode.<br>
 *                  This is a bindable property. <br>
 *                  When bound to a variable, the data associated with the variable is displayed in the grid.
 * @param {boolean=} showheader
 *                  Sets the display property of the grid header.<br>
 *                  When enabled, the grid header is not displayed.
 * @param {boolean=} gridsearch
 *                  When enabled, search is enabled for the grid to search through the grid data.<br>
 *                  The value entered in the Search text box is searched in the grid and the relevant rows are displayed.<br>
 *                  Default value for `gridsearch` is `false`.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <wm-livegrid dataset="gridVariable" gridsearch="true">
 *               </wm-livegrid>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *               var deptData = '{"type":"Department","isList":false,"owner":"Main","editJson":"","isBound":"","dataSet":[{"budget":1936760,"deptcode":"Eng","deptid":1,"location":"San Francisco","name":"Engineering","q1":445455,"q2":522925,"q3":426087,"q4":542293,"tenantid":1},{"budget":1129777,"deptcode":"Mktg","deptid":2,"location":"New York","name":"Marketing","q1":225955,"q2":271146,"q3":327635,"q4":305040,"tenantid":1},{"budget":1452570,"deptcode":"G&A","deptid":3,"location":"San Francisco","name":"General and Admin","q1":435771,"q2":290514,"q3":348617,"q4":377668,"tenantid":1},{"budget":2743744,"deptcode":"Sales","deptid":4,"location":"Austin","name":"Sales","q1":493874,"q2":658499,"q3":713373,"q4":877998,"tenantid":1},{"budget":806984,"deptcode":"PS","deptid":5,"location":"San Francisco","name":"Professional Services","q1":201746,"q2":201746,"q3":177536,"q4":225955,"tenantid":2}],"dataBinding":{},"saveInPhonegap":false,"activePage":"","operation":"read","liveSource":"hrdb","maxResults":500,"designMaxResults":50,"ignoreCase":false,"matchMode":"start","orderBy":"","autoUpdate":true,"startUpdate":true,"onCanUpdate":"","onBeforeUpdate":"","onResult":"","onSuccess":"","onError":"","onPrepareSetData":"","category":"wm.LiveVariable","_id":"wm-wm.LiveVariable1394024169342","name":"DepartmentLiveVariable1","package":"com.hrdb.data.Department","propertiesMap":{"columns":[{"propertyName":"BUDGET","type":"integer","fullyQualifiedType":"integer","columnName":"budget","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"DEPTID","type":"integer","fullyQualifiedType":"integer","columnName":"deptid","isPrimaryKey":true,"notNull":"true","length":"null","precision":"null","generator":"identity","isRelated":false},{"propertyName":"Q2","type":"integer","fullyQualifiedType":"integer","columnName":"q2","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"Q1","type":"integer","fullyQualifiedType":"integer","columnName":"q1","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"LOCATION","type":"string","fullyQualifiedType":"string","columnName":"location","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"Q4","type":"integer","fullyQualifiedType":"integer","columnName":"q4","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"DEPTCODE","type":"string","fullyQualifiedType":"string","columnName":"deptcode","isPrimaryKey":false,"notNull":"false","length":"20","precision":"null","generator":null,"isRelated":false},{"propertyName":"NAME","type":"string","fullyQualifiedType":"string","columnName":"name","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"Q3","type":"integer","fullyQualifiedType":"integer","columnName":"q3","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false},{"propertyName":"TENANTID","type":"integer","fullyQualifiedType":"integer","columnName":"tenantid","isPrimaryKey":false,"notNull":"false","length":"null","precision":"null","generator":null,"isRelated":false}],"entityName":"Department"},"relatedData":{},"data":[{"budget":1936760,"deptcode":"Eng","deptid":1,"location":"San Francisco","name":"Engineering","q1":445455,"q2":522925,"q3":426087,"q4":542293,"tenantid":1},{"budget":1129777,"deptcode":"Mktg","deptid":2,"location":"New York","name":"Marketing","q1":225955,"q2":271146,"q3":327635,"q4":305040,"tenantid":1},{"budget":1452570,"deptcode":"G&A","deptid":3,"location":"San Francisco","name":"General and Admin","q1":435771,"q2":290514,"q3":348617,"q4":377668,"tenantid":1},{"budget":2743744,"deptcode":"Sales","deptid":4,"location":"Austin","name":"Sales","q1":493874,"q2":658499,"q3":713373,"q4":877998,"tenantid":1},{"budget":806984,"deptcode":"PS","deptid":5,"location":"San Francisco","name":"Professional Services","q1":201746,"q2":201746,"q3":177536,"q4":225955,"tenantid":2}]}',
 *                   deptVar = JSON.parse(deptData);
 *               $scope.$root.variables["gridVariable"] = deptVar;
 *           }
 *       </file>
 *   </example>
 */