/*global WM, window, _*/
/*jslint todo: true */
/*Directive for liveList */

WM.module('wm.widgets.live')
    .run(['$templateCache', '$rootScope', function ($tc, $rs) {
        'use strict';

        $tc.put('template/widget/list.html',
                    '<div class="app-livelist" init-widget ' + $rs.getWidgetStyles('shell') + ' data-ng-show="show">' +
                        '<ul data-identifier="list" class="clearfix" title="{{hint}}" data-ng-class="listclass" wmtransclude ' +
                                'data-ng-style="{height: height, overflow: overflow, paddingTop: paddingtop + paddingunit, paddingRight: paddingright + paddingunit, paddingLeft: paddingleft + paddingunit, paddingBottom: paddingbottom + paddingunit}"></ul>' +
                        '<div class="no-data-msg" data-ng-show="noDataFound">{{::$root.appLocale.MESSAGE_LIVELIST_NO_DATA}}</div>' +
                        '<wm-datanavigator class="well well-sm clearfix" show="{{show && shownavigation}}" showrecordcount="{{show && showrecordcount}}"></wm-datanavigator>' +
                    '</div>'
                );

    }])
    .controller('listController', [

        function () {
            'use strict';
            var _map = {};

            this.$set = function (key, value) {
                _map[key] = value;
            };

            this.$get = function (key) {
                return _map[key];
            };
        }
    ])
    .directive('wmLivelist', [
        'WidgetUtilService',
        'PropertiesFactory',
        '$templateCache',
        'CONSTANTS',
        '$compile',
        'Utils',
        '$rootScope',
        'Variables',
        '$servicevariable',
        '$timeout',

        function (WidgetUtilService, PropertiesFactory, $tc, CONSTANTS, $compile, Utils, $rs, Variables, $servicevariable, $timeout) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.livelist', ['wm.base.editors', 'wm.base.events']),
                liTemplateWrapper_start = '<li data-ng-repeat="item in fieldDefs track by $index" class="app-list-item" data-ng-class="[itemsPerRowClass, itemclass]" ',
                liTemplateWrapper_end = '></li>',
                notifyFor = {
                    'dataset': true,
                    'shownavigation': true,
                    'showrecordcount': true,
                    'itemsperrow': true
                },
                directiveDefn;

            /* update the selectedItem dataType onchange of bindDataSet*/
            function updateSelectedItemDataType($is, $el) {
                var _s = $el.scope(),
                    _v = _s && _s.Variables,
                    variable = _v && _v[$is.boundVariableName];

                if (variable) {
                    /* set the variable type info to the live-list selected-entry type, so that type matches to the variable for which variable is created*/
                    $is.widgetProps.selecteditem.type = variable.type;
                }
            }

            /*to get the list of columns from the dataSet/scopeDataSet*/
            function getColumnsFromDataSet(dataset) {
                if (WM.isObject(dataset)) {
                    if (WM.isArray(dataset) && WM.isObject(dataset[0])) {
                        return Object.keys(dataset[0]);
                    }
                    return Object.keys(dataset);
                }
                return [];
            }

            /*to get list of all the columns from the properties-map */
            function getColumnsFromPropertiesMap(propertiesMap) {
                if (propertiesMap && propertiesMap.columns) {
                    //populating the column definition in the columns
                    return propertiesMap.columns.map(function (column) {
                        return column.fieldName;
                    });
                }
                return [];
            }

            /* Function to get details of widget the live list is bound to.
             * Example: If live list is bound to the selected items of a grid
             * (binddataset - bind:Widgets.gridId.selecteditem), we first find the
             * variable bound to the grid, get its type and columns, and then generate
             * corresponding bindings for the live list.*/
            function getBoundWidgetDatasetDetails($is) {
                var dataSetParts,
                    refWidget,
                    refWidgetName,
                    refVariable,
                    refVariableName,
                    refBindDataSet,
                    relFieldName,
                    relFieldType,
                    fields,
                    details,
                    isBoundToSelectedItemSubset = _.includes($is.binddataset, 'selecteditem.');

                dataSetParts = $is.binddataset.split('.');

                refWidgetName = dataSetParts[1];
                refWidget = $is.Widgets[refWidgetName];
                refBindDataSet = refWidget.binddataset;

                /*the binddataset comes as bind:Variables.VariableName.dataset.someOther*/
                refVariableName = refBindDataSet.replace('bind:Variables.', '');
                refVariableName = refVariableName.substr(0, refVariableName.indexOf('.'));
                refVariable = Variables.getVariableByName(refVariableName);

                relFieldName = isBoundToSelectedItemSubset && dataSetParts[3];

                fields = $rs.dataTypes[refVariable.package].fields;
                details = {
                    'refVariableName': refVariableName,
                    'refWidget': refWidget,
                    'refVariable': refVariable
                };
                /* If binddataset is of the format: bind:Widgets.widgetName.selecteditem.something,
                 * i.e. widget is bound to a subset of selected item, get type of that subset.*/
                if (relFieldName) {
                    relFieldType = fields[relFieldName].type;
                    details.relFieldType = relFieldType;
                } else {
                    /* When binddataset is of the format: bind:Widgets.widgetName.selecteditem */
                    details.fields = fields;
                }
                return details;
            }

            /* Fetch column bindings for the live list in case it is bound to a widget. */
            function fetchDynamicColumns() {
                var fields = [],
                    result;
                result = getBoundWidgetDatasetDetails();
                if (result.fields) {
                    fields = result.fields;
                } else if (result.relFieldType) {
                    /*Invoke the function to fetch sample data-structure for the field.*/
                    fields = $servicevariable.getServiceModel({
                        typeRef: result.relFieldType,
                        variable: result.refVariable
                    });
                }
                return WM.isObject(fields) ? Object.keys(fields) : fields;
            }

            function updateLiveListBindings($is, forceUpdate) {
                var columns;

                if ($is.dataset && $is.dataset.propertiesMap) {
                    columns = getColumnsFromPropertiesMap($is.dataset.propertiesMap);
                } else {
                    getColumnsFromDataSet($is.dataset);
                }

                if (!columns.length) {
                    /* If live list is bound to a widget, fetch the columns accordingly. */
                    if (_.includes($is.binddataset, 'bind:Widgets.')) {
                        columns = fetchDynamicColumns();
                    }
                }
                /* emit event to modify the liveList template*/
                $rs.$emit('livelist-template-modified', {'widgetName': $is.name, 'bindDataset': $is.binddataset, 'fields': columns, 'forceUpdate': forceUpdate});
            }

            function handlePageSizeDisplay($is, variableObj) {
                /*Check for sanity*/
                if (variableObj) {
                    /*Make the "pageSize" property readonly so that no editing is possible.*/
                    $is.widgetProps.pagesize.disabled = (variableObj.category === 'wm.LiveVariable');
                }
            }

            /** With given data, creates list items and updates the markup*/
            function createListItems($is, $el, data) {
                var newData = WM.copy(data),
                    unbindWatcher;
                /*If the "maxResults" property has been set in the dataNavigator, that takes precedence. Hence splice the data only if it is not set.*/
                /** Set the data to field-definitions, now the template will be modified and rendered,
                 * If pageSize is mentioned then splice the data to get the required data*/
                $is.fieldDefs = ($is.dataNavigator && !$is.shownavigation && $is.pagesize) ? newData.splice(0, $is.pagesize) : data;
                $is.$liScope.fieldDefs = $is.fieldDefs;

                /* In run mode, making the first element selected, if flag is set */
                if (CONSTANTS.isRunMode && $is.selectfirstitem) {
                    unbindWatcher = $is.$watch(function () {
                        var items = $el.find('.list-group li:first-of-type');
                        if (items.length) {
                            $rs.$safeApply($is, function () {
                                $timeout(function () {items.first().click(); }, 0, false);
                                unbindWatcher();
                            });
                        }
                    });
                }
            }
            /** This method is called whenever there is a change in the dataSet. It gets the new data and modifies the dom and emits an
             * event to update the markup*/
            function watchVariableDataSet($is, $el, newVal) {

                if (newVal) {
                    $is.noDataFound = false;
                    var _s = $el.scope(),
                        _v = _s && _s.Variables,
                        variableObj = _v && _v[$is.boundVariableName];

                    if (newVal.data) {
                        newVal = newVal.data;
                    } else if (variableObj && variableObj.category === 'wm.LiveVariable' && _.includes($is.binddataset, 'bind:Widgets.')) {
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
                    if (!$is.binddataset) {
                        if (WM.isString(newVal)) {
                            newVal = newVal.split(',');
                        }
                    }
                    if (WM.isArray(newVal)) {
                        $is.dataNavigator.pagingOptions = {
                            maxResults: $is.pagesize || 20
                        };
                        if (!$is.dataNavigatorWatched && $is.dataNavigator && $is.shownavigation) {
                            $is.dataNavigator.dataset = $is.binddataset;
                            $is.dataNavigatorWatched = true;
                            /*Register a watch on the "result" property of the "dataNavigator" so that the paginated data is displayed in the live-list.*/
                            $is.dataNavigator.$watch('result', function (newVal) {
                                watchVariableDataSet($is, $el, newVal);
                            });
                            /*Register a watch on the "maxResults" property of the "dataNavigator" so that the "pageSize" is displayed in the live-list.*/
                            $is.dataNavigator.$watch('maxResults', function (newVal) {
                                $is.pagesize = newVal;
                            });
                        }
                        if (newVal.length === 0 && CONSTANTS.isRunMode) {
                            $is.noDataFound = true;
                        }
                        createListItems($is, $el, newVal);
                    }
                    /*Check for sanity*/
                    if (CONSTANTS.isStudioMode && $is.binddataset) {
                        handlePageSizeDisplay($is, variableObj);
                    }
                } else if (!newVal && CONSTANTS.isRunMode) {
                    createListItems($is, $el, []);
                }
            }


            /** In case of run mode, the field-definitions will be generated from the markup*/
            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, $el, attrs, key, newVal, oldVal) {
                switch (key) {
                case 'dataset':
                    $is.boundVariableName = Utils.getVariableName($is);
                    watchVariableDataSet($is, $el, newVal);
                    /* to add <wm-labels> in the markup, based on dataSet*/
                    if (CONSTANTS.isStudioMode) {
                        if (attrs.template !== 'true') {
                            if (($is.oldbinddataset !== -1 && $is.oldbinddataset !== $is.binddataset)) {
                                updateLiveListBindings($is, true);
                            } else if ($is.oldbinddataset === -1 && !attrs.dataset) {
                                updateLiveListBindings($is);
                            }
                        }
                        $is.oldbinddataset = $is.binddataset;
                        /*update selectedItem dataType*/
                        updateSelectedItemDataType($is, $el);
                    }
                    break;
                case 'shownavigation':
                    /*Check for sanity*/
                    if (CONSTANTS.isStudioMode) {
                        $is.widgetProps.showrecordcount.show = newVal;
                    }
                    break;
                case 'itemsperrow':
                    /*Check for studio mode*/
                    if (CONSTANTS.isStudioMode) {
                        var oldClass = oldVal && 'col-md-' + 12 / (+oldVal),
                            newClass = newVal && 'col-md-' + 12 / (+newVal);
                        $el.find('.app-listtemplate').removeClass(oldClass).addClass(newClass);
                    }
                    break;
                }
            }

            function defineProps($is, $el) {
                /*This is to make the "Variables" & "Widgets" available in the Data-navigator it gets compiled with the live-list isolate Scope
                 * and "Variables", "Widgets" will not be available in that scope.
                 * element.scope() might refer to the controller scope/parent scope.*/
                var _scope = $el.scope(); // scope inherited from controller's scope

                Object.defineProperties($is, {
                    'Variables': {
                        'get': function () {
                            return _scope.Variables;
                        }
                    },
                    'Widgets': {
                        'get': function () {
                            return _scope.Widgets;
                        }
                    }
                });
            }

            function createChildScope($is, $el) {
                var _scope = $el.scope(), // scop which inherits controller's scope
                    $liScope = _scope.$new(); // create a new child scope. List Items will be compiled with this scope.

                // evt handlers will be created by isolateScope. redefine them on $liScope.
                WM.extend($liScope, {
                    'onClick'           : $is.onClick,
                    'onMouseenter'      : $is.onMouseenter,
                    'onMouseleave'      : $is.onMouseleave,
                    'onEnterkeypress'   : $is.onEnterkeypress,
                    'onSetrecord'       : $is.onSetrecord,
                    'itemclass'         : $is.itemclass,
                    'itemsPerRowClass'  : $is.itemsPerRowClass
                });

                return $liScope;
            }

            // Function to evaluate the binding for the attributes
            // The bound value is replaced with {{item.fieldname}} here. This is needed by the liveList when compiling inner elements
            function updateTmplAttrs(parentDataSet, idx, node) {
                var _parentDataSet = parentDataSet.replace('bind:', ''),
                    regex = new RegExp('(' + _parentDataSet + ')(\\[0\\])?(.data\\[\\$i\\])?(.content\\[\\$i\\])?(\\[\\$i\\])?', 'g');
                _.forEach(node.attributes, function (attr) {
                    var value = attr.value;

                    if (_.startsWith(value, 'bind:')) {
                        /*if the attribute value is "bind:xxxxx.xxxx", either the dataSet/scopeDataSet has to contain "xxxx.xxxx" */
                        if (_.includes(value, _parentDataSet)) {
                            value = value.replace('bind:', '');
                            value = value.replace(regex, 'item');
                            attr.value = '{{' + value + '}}';
                        }
                    }
                });
            }

            function applyWrapper($tmplContent, attrs) {
                var tmpl = liTemplateWrapper_start;

                if (attrs.hasOwnProperty('onMouseenter')) {
                    tmpl += ' data-ng-mouseenter="onMouseenter({$event: $event, $scope: this})" ';
                }

                if (attrs.hasOwnProperty('onMouseleave')) {
                    tmpl += ' data-ng-mouseleave="onMouseleave({$event: $event, $scope: this})" ';
                }

                tmpl += liTemplateWrapper_end;
                tmpl = WM.element(tmpl).append($tmplContent);
                return tmpl;
            }

            function prepareLITemplate(tmpl, attrs) {
                var $tmpl = WM.element(tmpl),
                    $div = WM.element('<div></div>').append($tmpl);
                $div.find('*').each(updateTmplAttrs.bind(undefined, attrs.dataset || attrs.scopedataset));
                $tmpl = applyWrapper($tmpl, attrs);
                return $tmpl;
            }

            function setupEvtHandlers($is, $el) {
                /*listen on to the click event for the ul element & get li clicked of the live-list */
                $el.on('click.wmActive', 'ul', function (evt) {
                    var $li = WM.element(evt.target).closest('li.app-list-item'),
                        $liScope = $li.scope();
                    /* sanity-check: for li-element*/
                    if ($li) {
                        /*removing active class from previous selectedItem*/
                        $el.find('li.active').removeClass('active');
                        /*adding active class to current selectedItem*/
                        $li.addClass('active');
                        /*check for liElement scope*/
                        if ($liScope) {
                            /*update the selectedItem with current clicked li*/
                            $is.selecteditem = $liScope.item || null;
                            /*trigger $apply, as 'click' is out of angular-scope*/

                            Utils.triggerFn($liScope.onClick, {$event: evt, $scope: $liScope});
                            $rs.$safeApply($is);
                        }
                    }
                });
            }

            function preLinkFn($is, $el) {
                $is.widgetProps = WM.copy(widgetProps);

                // initialising oldDataSet to -1, so as to handle live-list with variable binding with live variables, during page 'switches' or 'refreshes'
                $is.oldbinddataset = -1;
                $is.dataset = []; // The data that is bound to the list. Stores the name for reference.
                $is.fieldDefs = [];// The data required by the wmListItem directive to populate the items
                $is.noDataFound = false;

                defineProps($is, $el);
            }

            function postLinkFn($is, $el, attrs, listCtrl) {
                var $liScope,
                    $liTemplate;

                $is.dataNavigator = $el.find('[data-identifier=datanavigator]').isolateScope();

                $liScope = createChildScope($is, $el);
                $is.$liScope = $liScope;

                if (!$is.binddataset && $is.dataset === undefined) {
                    watchVariableDataSet($is, $el, '');
                }

                if (CONSTANTS.isRunMode) {

                    $liTemplate = prepareLITemplate(listCtrl.$get('listTemplate'), attrs);
                    $compile($liTemplate)($liScope);

                    $el.find('[data-identifier=list]').append($liTemplate);

                    if (attrs.scopedataset) {
                        $is.$watch('scopedataset', function (newVal) {
                            if (newVal && !$is.dataset) {
                                createListItems($is, $el, newVal);
                                $liScope.fieldDefs = $is.fieldDefs;
                            }
                        }, true);
                    }

                    setupEvtHandlers($is, $el);
                }
                /* register the property change handler */
                WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el, attrs), $is, notifyFor);
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            function compileFn($tEl, tAttrs) {
                /* in run mode there is separate controller for live-list widget but not in studio mode,
                 * to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttrs.name + 'Controller'] = WM.noop;
                }

                return {
                    'pre' : preLinkFn,
                    'post': postLinkFn
                };
            }

            directiveDefn = {
                'restrict'  : 'E',
                'replace'   : true,
                'transclude': true,
                'scope'     : {},
                'controller': 'listController',
                'template'  : $tc.get('template/widget/list.html'),
                'compile'   : compileFn
            };

            if (CONSTANTS.isRunMode) {
                directiveDefn.scope = {
                    'scopedataset'      : '=?',
                    'onClick'           : '&',
                    'onMouseenter'      : '&',
                    'onMouseleave'      : '&',
                    'onEnterkeypress'   : '&',
                    'onSetrecord'       : '&'
                };
            }

            return directiveDefn;
        }
    ]);

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
