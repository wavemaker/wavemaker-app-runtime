/*global WM, window, _, document, Hammer*/
/*jslint todo: true */
/*Directive for liveList */

WM.module('wm.widgets.live')
    .run(['$templateCache', function ($tc) {
        'use strict';

        $tc.put('template/widget/list.html',
                    '<div class="app-livelist panel" init-widget live-actions apply-styles="shell" data-ng-show="show">' +
                        '<div class="panel-heading" data-ng-if="title"><h4 class="panel-title">{{title}}</h4></div>' +
                        '<ul data-identifier="list" class="clearfix" title="{{hint}}" data-ng-class="listclass" wmtransclude ' +
                                'data-ng-style="{height: height, overflow: overflow, paddingTop: paddingtop + paddingunit, paddingRight: paddingright + paddingunit, paddingLeft: paddingleft + paddingunit, paddingBottom: paddingbottom + paddingunit}">' +
                        '</ul>' +
                        '<div class="no-data-msg" data-ng-show="noDataFound">{{::$root.appLocale.MESSAGE_LIVELIST_NO_DATA}}</div>' +
                        '<div class="panel-footer" data-ng-if="navigation !== \'None\'">' +
                            '<wm-datanavigator showrecordcount="true" navcontrols="{{navControls}}"></wm-datanavigator>' +
                        '</div>' +
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
        '$servicevariable',
        '$timeout',

        function (WidgetUtilService, PropertiesFactory, $tc, CONSTANTS, $compile, Utils, $rs, $servicevariable, $timeout) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.livelist', ['wm.base', 'wm.base.editors', 'wm.base.events']),
                liTemplateWrapper_start = '<li data-ng-repeat="item in fieldDefs track by $index" class="app-list-item" data-ng-class="[itemsPerRowClass, itemclass]" ',
                liTemplateWrapper_end = '></li><li data-ng-show="fetchInProgress"><i class="fa fa-spinner fa-spin fa-2x"></i> loading...</li>',
                notifyFor = {
                    'dataset'        : true,
                    'height'         : true,
                    'navigation'     : CONSTANTS.isStudioMode,
                    'itemsperrow'    : CONSTANTS.isStudioMode
                },
                directiveDefn,
                NAVIGATION = {
                    'BASIC'    : 'Basic',
                    'ADVANCED' : 'Advanced',
                    'SCROLL'   : 'Scroll'
                };

            /* to return the bootstrap classes for the <li> w.r.t no. of items per row */
            function getRowClass(itemsperrow) {
                if (!itemsperrow) {
                    return undefined;
                }
                var col = itemsperrow && 12 / (+itemsperrow);

                return $rs.isMobileApplicationType ?  ' col-xs-' + col : 'col-sm-' + col;
            }

            function getVariable($is, variableName) {

                if (!variableName) {
                    return undefined;
                }

                var variables = $is.Variables || {};
                return variables[variableName];
            }

            /* update the selectedItem dataType onchange of bindDataSet*/
            function updateSelectedItemDataType($is, variable) {
                if (variable) {
                    /* set the variable type info to the live-list selected-entry type, so that type matches to the variable for which variable is created*/
                    $is.widgetProps.selecteditem.type = variable.type;
                }
            }

            /*to get the list of columns from the dataSet/scopeDataSet*/
            function getColumnsFromDataSet(dataset) {
                if (WM.isObject(dataset)) {
                    if (WM.isArray(dataset) && WM.isObject(dataset[0])) {
                        return _.keys(dataset[0]);
                    }
                    return _.keys(dataset);
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
                    refVariable,
                    refVariableName,
                    relFieldName,
                    relFieldType,
                    fields,
                    details,
                    isBoundToSelectedItemSubset = _.includes($is.binddataset, 'selecteditem.');

                dataSetParts = $is.binddataset.split('.');
                refVariableName = Utils.getVariableName($is);
                refVariable = getVariable($is, refVariableName);

                relFieldName = isBoundToSelectedItemSubset && dataSetParts[3];

                fields = $rs.dataTypes[refVariable.package].fields;
                details = {
                    'refVariableName': refVariableName,
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
            function fetchDynamicColumns($is) {
                var fields = [],
                    result;
                result = getBoundWidgetDatasetDetails($is);
                if (result.fields) {
                    fields = result.fields;
                } else if (result.relFieldType) {
                    /*Invoke the function to fetch sample data-structure for the field.*/
                    fields = $servicevariable.getServiceModel({
                        typeRef: result.relFieldType,
                        variable: result.refVariable
                    });
                }
                return WM.isObject(fields) ? _.keys(fields) : fields;
            }

            function updateLiveListBindings($is, forceUpdate) {
                var columns;

                if ($is.dataset && $is.dataset.propertiesMap) {
                    columns = getColumnsFromPropertiesMap($is.dataset.propertiesMap);
                } else {
                    columns = getColumnsFromDataSet($is.dataset);
                }

                if (!columns || !columns.length) {
                    /* If live list is bound to a widget, fetch the columns accordingly. */
                    if (_.includes($is.binddataset, 'bind:Widgets.')) {
                        columns = fetchDynamicColumns($is);
                    }
                }
                /* emit event to modify the liveList template*/
                $rs.$emit('livelist-template-modified', {
                    'widgetName' : $is.name,
                    'bindDataset': $is.binddataset,
                    'fields'     : columns,
                    'forceUpdate': forceUpdate
                });
            }

            function handlePageSizeDisplay($is, variableObj) {
                if (variableObj) {
                    /*Make the "pageSize" property readonly so that no editing is possible.*/
                    $is.widgetProps.pagesize.disabled = (variableObj.category === 'wm.LiveVariable');
                }
            }

            function setFetchInProgress($is, inProgress) {
                $is.$liScope.fetchInProgress = inProgress;
            }

            function bindScrollEvt($is, $el) {
                var $dataNavigator = $el.find('> .panel-footer > [data-identifier=datanavigator]'),
                    navigator = $dataNavigator.isolateScope();

                $el.find('> ul')
                    .children()
                    .first()
                    .scrollParent(false)
                    .off('scroll.livelist')
                    .on('scroll.livelist', function (evt) {
                        var target = evt.target,
                            clientHeight,
                            totalHeight,
                            scrollTop;

                        target =  target === document ? target.scrollingElement : target;

                        clientHeight = target.clientHeight;
                        totalHeight  = target.scrollHeight;
                        scrollTop    = target.scrollTop;

                        if (totalHeight * 0.9 < scrollTop + clientHeight) {
                            $rs.$safeApply($is, function () {
                                setFetchInProgress($is, true);
                                navigator.navigatePage('next');
                                if (navigator.isLastPage()) {
                                    setFetchInProgress($is, false);
                                }
                            });
                        }
                    });
            }

            /** With given data, creates list items and updates the markup*/
            function updateFieldDefs($is, $el, data) {
                var unbindWatcher,
                    _s = $is.$liScope,
                    fieldDefs = _s.fieldDefs;

                if ($is.infScroll) {
                    if (WM.isUndefined(fieldDefs)) {
                        _s.fieldDefs = fieldDefs = [];
                    }
                    _.forEach(data, function (item) {
                        fieldDefs.push(item);
                    });

                    $timeout(function () {
                        setFetchInProgress($is, false);
                        if (fieldDefs.length) {
                            bindScrollEvt($is, $el);
                        }
                    });
                } else {
                    _s.fieldDefs = data;
                }

                if (!data.length) {
                    $is.noDataFound = true;
                    $is.selecteditem = undefined;
                }

                /* In run mode, making the first element selected, if flag is set */
                if ($is.selectfirstitem) {
                    unbindWatcher = $is.$watch(function () {
                        var items = $el.find('.list-group li.app-list-item:first-of-type');
                        if (items.length) {
                            $rs.$safeApply($is, function () {
                                $timeout(function () {
                                    var item = items.first();
                                    /*If item has active class already, no need to click again*/
                                    if (!item.hasClass('active')) {
                                        item.click();
                                    }
                                }, 0, false);
                                unbindWatcher();
                            });
                        }
                    });
                }
            }

            function onDataChange($is, $el, nv) {
                if (nv) {
                    $is.noDataFound = false;

                    if (nv.data) {
                        nv = nv.data;
                    } else {
                        if (!_.includes($is.binddataset, 'bind:Widgets.')) {
                            var boundVariableName = Utils.getVariableName($is),
                                variable = getVariable($is, boundVariableName);
                            // data from the live list must have .data filed
                            if (variable && variable.category === 'wm.LiveVariable') {
                                return;
                            }
                        }
                    }

                    /*If the data is a pageable object, then display the content.*/
                    if (WM.isObject(nv) && Utils.isPageable(nv)) {
                        nv = nv.content;
                    }

                    if (WM.isObject(nv) && !WM.isArray(nv)) {
                        nv = [nv];
                    }
                    if (!$is.binddataset) {
                        if (WM.isString(nv)) {
                            nv = nv.split(',');
                        }
                    }
                    if (WM.isArray(nv)) {
                        updateFieldDefs($is, $el, nv);
                    }
                } else {
                    if (CONSTANTS.isRunMode) {
                        updateFieldDefs($is, $el, []);
                    }
                }
            }

            function setupDataSource($is, $el, nv) {

                var $dataNavigator, // dataNavigator element
                    dataNavigator,  // dataNavigator scope
                    binddataset;
                if ($is.navControls || $is.infScroll) {

                    binddataset = $is.binddataset;
                    Utils.triggerFn($is._watchers.dataset);

                    $timeout(function () {
                        $dataNavigator = $el.find('> .panel-footer > [data-identifier=datanavigator]');
                        dataNavigator = $dataNavigator.isolateScope();

                        dataNavigator.pagingOptions = {
                            maxResults: $is.pagesize || 20
                        };

                        // remove the existing watchers
                        Utils.triggerFn($is._watchers.dataNavigatorResult);
                        Utils.triggerFn($is._watchers.dataNavigatorMaxResults);

                        // create a watch on dataNavigator.result
                        $is._watchers.dataNavigatorResult = dataNavigator.$watch('result', function (_nv) {
                            onDataChange($is, $el, _nv);
                        }, true);
                        $is._watchers.dataNavigatorMaxResults = dataNavigator.$watch('maxResults', function (_nv) {
                            $is.pagesize = _nv;
                        }, true);

                        dataNavigator.dataset = binddataset;
                    });
                } else {
                    onDataChange($is, $el, nv);
                }
            }

            function studioMode_onDataSetChange($is, doNotRemoveTemplate) {
                var boundVariableName = Utils.getVariableName($is),
                    variable = getVariable($is, boundVariableName);
                if ($is.oldbinddataset !== $is.binddataset && $is._isInitialized) {
                    if (!doNotRemoveTemplate) {
                        updateLiveListBindings($is, true);
                    }
                }
                handlePageSizeDisplay($is, variable);
                updateSelectedItemDataType($is, variable);
            }

            function runMode_onDataSetChange($is, $el, nv) {
                if ($is.oldbinddataset !== $is.binddataset) {
                    setupDataSource($is, $el, nv);
                } else {
                    onDataChange($is, $el, nv);
                }
            }

            function onDataSetChange($is, $el, doNotRemoveTemplate, nv) {

                if (CONSTANTS.isStudioMode) {
                    studioMode_onDataSetChange($is, doNotRemoveTemplate);
                } else {
                    runMode_onDataSetChange($is, $el, nv);
                }

                $is.oldbinddataset = $is.binddataset;
            }

            function resetNavigation($is) {
                $is.navControls = undefined;
                $is.infScroll   = false;
            }

            function enableBasicNavigation($is) {
                $is.navControls = NAVIGATION.BASIC;
            }

            function enableAdvancedNavigation($is) {
                $is.navControls = NAVIGATION.ADVANCED;
            }

            function enableInfiniteScroll($is) {
                $is.infScroll = true;
            }

            function onNavigationTypeChange($is, type) {
                resetNavigation($is);
                switch (type) {
                case NAVIGATION.BASIC:
                    enableBasicNavigation($is);
                    break;
                case NAVIGATION.ADVANCED:
                    enableAdvancedNavigation($is);
                    break;
                case NAVIGATION.SCROLL:
                    enableInfiniteScroll($is);
                    break;
                }
            }

            /** In case of run mode, the field-definitions will be generated from the markup*/
            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, $el, attrs, key, nv, ov) {
                var doNotRemoveTemplate,
                    oldClass,
                    newClass;
                /**checking if the height is set on the element then we will enable the overflow**/

                switch (key) {
                case 'height':
                    if (nv) {
                        $is.overflow = 'auto';
                    }
                    break;
                case 'dataset':
                    doNotRemoveTemplate = attrs.template === 'true';
                    onDataSetChange($is, $el, doNotRemoveTemplate, nv);
                    break;
                case 'itemsperrow':
                    if (CONSTANTS.isStudioMode) {
                        oldClass = ov && 'col-md-' + 12 / (+ov);
                        newClass = nv && 'col-md-' + 12 / (+nv);
                        $el.find('.app-listtemplate').removeClass(oldClass).addClass(newClass);
                    }
                    break;
                case 'navigation':
                    if (CONSTANTS.isStudioMode) {
                        onNavigationTypeChange($is, nv);
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

            function createChildScope($is, $el, attrs) {
                var _scope = $el.scope(), // scop which inherits controller's scope
                    $liScope = _scope.$new(); // create a new child scope. List Items will be compiled with this scope.

                // evt handlers will be created by isolateScope. redefine them on $liScope.
                WM.extend($liScope, {
                    'onClick'           : $is.onClick,
                    'onDblclick'        : $is.onDblclick,
                    'onTap'             : $is.onTap,
                    'onDoubletap'       : $is.onDoubletap,
                    'onMouseenter'      : $is.onMouseenter,
                    'onMouseleave'      : $is.onMouseleave,
                    'onEnterkeypress'   : $is.onEnterkeypress,
                    'onSetrecord'       : $is.onSetrecord,
                    'itemclass'         : $is.itemclass,
                    'itemsPerRowClass'  : getRowClass(attrs.itemsperrow),
                    'addRow'            : $is.addRow,
                    'updateRow'         : $is.updateRow,
                    'deleteRow'         : $is.deleteRow
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
                tmpl = WM.element(tmpl);
                tmpl.first().append($tmplContent);
                return tmpl;
            }

            function prepareLITemplate(tmpl, attrs) {
                var $tmpl = WM.element(tmpl),
                    $div  = WM.element('<div></div>').append($tmpl),
                    parentDataSet = attrs.dataset || attrs.scopedataset;
                if (parentDataSet) {
                    $div.find('*').each(updateTmplAttrs.bind(undefined, parentDataSet));
                }
                $tmpl = applyWrapper($tmpl, attrs);
                return $tmpl;
            }
            /*Function to get data of all active elements*/
            function getSelectedItems($el) {
                var selectedItems = [];
                $el.find('li.active').each(function () {
                    var liScope = WM.element(this).scope();
                    selectedItems.push(liScope.item);
                });
                return selectedItems;
            }
            function setupEvtHandlers($is, $el, attrs) {
                var pressStartTimeStamp = 0,
                    $hammerEl = new Hammer($el[0], {}),
                    selectCount = 0,
                    isMultiSelect = false;// Setting to true on first long press
                /*listen on to the click event for the ul element & get li clicked of the live-list */
                $el.on('click.wmActive', 'ul', function (evt) {
                    /*returning if click event is triggered within 50ms after pressup event occurred*/
                    if (pressStartTimeStamp + 50 > Date.now()) {
                        return;
                    }
                    var $li = WM.element(evt.target).closest('li.app-list-item'),
                        $liScope = $li && $li.scope(),
                        isActive = $li.hasClass('active');
                    if ($liScope) {
                        if (isMultiSelect) {
                            $li.toggleClass('active');
                            selectCount += (isActive ? -1 : 1);
                            isMultiSelect = selectCount > 0;//Setting 'isMultiSelect' to false if no items are selected
                        } else {
                            selectCount = 0;
                            $el.find('li.active').removeClass('active'); // removing active class from previous selectedItem
                            if (!isActive) {
                                $li.addClass('active');
                            }
                            /*trigger $apply, as 'click' or 'tap' is out of angular-scope*/
                            if (attrs.onClick) {
                                Utils.triggerFn($liScope.onClick, {$event: evt, $scope: $liScope});
                            }
                            if (attrs.onTap) {
                                Utils.triggerFn($liScope.onTap, {$event: evt, $scope: $liScope});
                            }
                        }
                    }
                    $rs.$safeApply($is);
                });

                /*listen on to the dblclick event for the ul element & get li dblclicked of the live-list */
                $el.on('dblclick.wmActive', 'ul', function (evt) {
                    var $li = WM.element(evt.target).closest('li.app-list-item'),
                        $liScope = $li && $li.scope();

                    /*trigger $apply, as 'dblclick' or 'doubleTap' is out of angular-scope*/
                    if (attrs.onDblclick) {
                        Utils.triggerFn($liScope.onDblclick, {$event: evt, $scope: $liScope});
                    }
                    if (attrs.onDoubletap) {
                        Utils.triggerFn($liScope.onDoubletap, {$event: evt, $scope: $liScope});
                    }
                    $rs.$safeApply($is);
                });

                $hammerEl.on('pressup', function (evt) {
                    if (!isMultiSelect) {
                        selectCount = 0;
                        pressStartTimeStamp = evt.timeStamp;//Recording pressup event's timestamp
                        var $li = WM.element(evt.target).closest('li.app-list-item');
                        $el.find('li.active').removeClass('active'); // removing active class from previous selectedItem
                        selectCount += 1;
                        $li.addClass('active'); // adding active class to current selectedItem
                        isMultiSelect = true;
                        $rs.$safeApply($is);
                    }
                });
            }

            function preLinkFn($is, $el, attrs) {
                if (CONSTANTS.isStudioMode) {
                    $is.widgetProps = Utils.getClonedObject(widgetProps);
                } else {
                    $is.widgetProps = widgetProps;
                }

                // initialising oldDataSet to -1, so as to handle live-list with variable binding with live variables, during page 'switches' or 'refreshes'
                $is.oldbinddataset = CONSTANTS.isStudioMode ? attrs.dataset : undefined;
                $is.dataset     = [];   // The data that is bound to the list. Stores the name for reference.
                $is.fieldDefs   = []; // The data required by the wmListItem directive to populate the items
                $is.noDataFound = false;
                Object.defineProperty($is, 'selecteditem', {
                    configurable: true
                });
                defineProps($is, $el);
            }

            function postLinkFn($is, $el, attrs, listCtrl) {
                var $liScope,
                    $liTemplate;

                $liScope = createChildScope($is, $el, attrs);
                $is.$liScope = $liScope;

                if (CONSTANTS.isRunMode) {

                    $liTemplate = prepareLITemplate(listCtrl.$get('listTemplate'), attrs);
                    $el.find('> [data-identifier=list]').prepend($liTemplate);
                    $compile($liTemplate)($liScope);

                    if (attrs.scopedataset) {
                        $is.$watch('scopedataset', function (nv) {
                            if (nv && !$is.dataset) {
                                updateFieldDefs($is, $el, nv);
                            }
                        }, true);
                    }

                    setupEvtHandlers($is, $el, attrs);
                }
                /* register the property change handler */
                WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el, attrs), $is, notifyFor);

                Object.defineProperty($is, 'selecteditem', {
                    get: function () {
                        var selectedRows = getSelectedItems($el);
                        if (selectedRows && selectedRows.length === 1) {
                            return selectedRows[0];
                        }
                        return selectedRows;
                    }
                });
                // in the run mode navigation can not be changed dynamically
                // process the navigation type before the dataset is set.
                if (attrs.hasOwnProperty('shownavigation') && (attrs.shownavigation === "true")) {
                    // for legacy applications
                    $is.navigation = NAVIGATION.ADVANCED;
                }
                onNavigationTypeChange($is, $is.navigation);

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
                'template'  : $tc.get('template/widget/list.html'),
                'compile'   : compileFn
            };

            if (CONSTANTS.isRunMode) {
                directiveDefn.controller = 'listController';
                directiveDefn.scope = {
                    'scopedataset'      : '=?',
                    'onClick'           : '&',
                    'onDblclick'        : '&',
                    'onMouseenter'      : '&',
                    'onMouseleave'      : '&',
                    'onEnterkeypress'   : '&',
                    'onSetrecord'       : '&',
                    'onTap'             : '&',
                    'onDoubletap'       : '&'
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
 * @param {boolean=} selectfirstitem
 *                  This is a bindable property. <br>
 *                  When the value is true, the first item of the list is selected by default. <br>
 *                  default value: `false`.
 * @param {number=} pagesize
 *                  This property sets the number of items to show in the drop-down list.
 * @param {string=} navigation
 *                  Possible values are `None`, `Advanced`, `Scroll`. <br>
 *                  Navigation controls will be displayed based on the selected value.
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
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
               <div>Selected Element: {{selectedItem}}</div>
               <wm-livelist
                   name="{{caption}}"
                   width="{{width}}"
                   height="{{height}}"
                   show="true"
                   scopedataset="dataset"
                   on-click="f($event)">
                    <wm-listtemplate layout="inline">
                        <wm-button class="btn btn-primary" caption="{{item}}"></wm-button>
                    </wm-listtemplate>
               </wm-livelist><br>
                <wm-composite>
                    <wm-label caption="caption:"></wm-label>
                    <wm-text scopedatavalue="caption"></wm-text>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="width:"></wm-label>
                    <wm-text scopedatavalue="width"></wm-text>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="height:"></wm-label>
                    <wm-text scopedatavalue="height"></wm-text>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="dataset:"></wm-label>
                    <wm-text
                       on-blur="blur($event, $scope)"
                       scopedatavalue="dataStr">
                    </wm-text>
                </wm-composite>
            </div>
        </file>
         <file name="script.js">
           function Ctrl($scope) {
               $scope.width = "400px";
               $scope.height= "200px";
               $scope.caption = " Users ";

               $scope.dataset =
               $scope.dataStr = ["user", "admin", "superuser"];

               $scope.f = function (event) {
                   $scope.selectedItem = event.target.innerText;
               };
               $scope.blur = function (event, scope) {
                   $scope.dataset = [];
                   $scope.dataset = scope.datavalue.split(',');
               }
            }
        </file>
    </example>
 */
