/*global WM, window, _, document, Hammer, moment*/
/*Directive for liveList */

WM.module('wm.widgets.live')
    .run(['$templateCache', function ($tc) {
        'use strict';

        $tc.put('template/widget/list.html',
                '<div class="app-livelist app-panel" ng-class="navigation" init-widget live-actions apply-styles="shell" listen-property="dataset">' +
                    '<div class="panel-heading" ng-if="title || subheading || iconclass">' +
                        '<h3 class="panel-title">' +
                            '<div class="pull-left"><i class="app-icon panel-icon {{iconclass}}" ng-show="iconclass"></i></div>' +
                            '<div class="pull-left">' +
                                '<div class="heading">{{title}}</div>' +
                                '<div class="description">{{subheading}}</div>' +
                            '</div>' +
                        '</h3>' +
                    '</div>' +
                    '<nav class="app-datanavigator" ng-if="navigation === \'Inline\' && !noDataFound">' +
                        '<ul class="pager"><li class="previous" ng-class="{\'disabled\': dataNavigator.isDisablePrevious}"><a href="javascript:void(0);" ' +
                            'ng-click="dataNavigator.navigatePage(\'prev\', $event)"><i class="wi wi-chevron-left"></i></a></li></ul>' +
                    '</nav>' +
                    '<ul data-identifier="list" tabindex="0" class="app-livelist-container clearfix" ng-show="!noDataFound" ng-class="listclass" wmtransclude apply-styles="scrollable-container">' +
                    '</ul>' +
                    '<div class="no-data-msg" ng-if="noDataFound && !variableInflight">{{nodatamessage}}</div>' +
                    '<div class="loading-data-msg" ng-if="variableInflight"><span><i class="app-icon panel-icon {{loadingicon}} fa-spin"></i><span class="loading-text">{{loadingdatamsg}}</span></span></div>' +
                    '<nav class="app-datanavigator" ng-if="navigation === \'Inline\' && !noDataFound">' +
                        '<ul class="pager"><li class="next" ng-class="{\'disabled\': dataNavigator.isDisableNext}"><a href="javascript:void(0);" ' +
                            'ng-click="dataNavigator.navigatePage(\'next\', $event)"><i class="wi wi-chevron-right"></i></a></li></ul>' +
                    '</nav>' +
                    '<div class="panel-footer" ng-if="navigation !== \'None\'" ng-show="(widgetid || dataNavigator.dataSize) && (showNavigation || (onDemandLoad && !variableInflight && !dataNavigator.isLastPage()))">' +
                        '<wm-datanavigator showrecordcount="{{show && showrecordcount}}" navigationalign="{{navigationalign}}" navigation="{{navControls}}" maxsize="{{maxsize}}" boundarylinks="{{boundarylinks}}" forceellipses="{{forceellipses}}" directionlinks="{{directionlinks}}"></wm-datanavigator>' +
                        '<a ng-show="onDemandLoad" href="javascript:void(0);" ng-click="dataNavigator.navigatePage(\'next\', $event)" class="app-button btn btn-justified {{paginationclass}}">{{ondemandmessage}}</a>' +
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
                return _map[key].clone(true);
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
        'DeviceVariableService',
        'LiveWidgetUtils',
        'FormWidgetUtils',
        '$filter',
        '$interpolate',
        '$parse',

        function (WidgetUtilService, PropertiesFactory, $tc, CONSTANTS, $compile, Utils, $rs, $servicevariable, $timeout, DeviceVariableService, LiveWidgetUtils, FormWidgetUtils, $filter, $interpolate, $parse) {
            'use strict';

            var widgetProps             = PropertiesFactory.getPropertiesOf('wm.livelist', ['wm.base', 'wm.containers', 'wm.base.events', 'wm.base.navigation', 'wm.layouts.panel.defaults']),
                liTemplateWrapper_start,
                liTemplateWrapper_end,
                notifyFor = {
                    'dataset'        : true,
                    'groupby'        : true,
                    'navigation'     : CONSTANTS.isStudioMode,
                    'itemsperrow'    : true,
                    'match'          : CONSTANTS.isStudioMode,
                    'padding'        : true,
                    'paginationclass': true
                },
                directiveDefn,
                NAVIGATION = {
                    'BASIC'    : 'Basic',
                    'CLASSIC'  : 'Classic',
                    'ADVANCED' : 'Advanced',
                    'SCROLL'   : 'Scroll',
                    'INLINE'   : 'Inline',
                    'PAGER'    : 'Pager',
                    'ONDEMAND' : 'On-Demand'
                };

            //Based on the given item, find the index of the list item
            function getItemIndex(listItems, item) {
                var matchIndex;
                listItems.each(function (index) {
                    var $li = WM.element(this),
                        liScope = $li.scope();
                    if (_.isEqual(liScope.item, item)) {
                        matchIndex = index;
                        return false;
                    }
                });
                return matchIndex;
            }

            function getVariable($is, variableName) {

                if (!variableName) {
                    return undefined;
                }

                var variables = $is.Variables || {};
                return variables[variableName];
            }

            // to get the list of columns from the dataSet/scopeDataSet
            function getColumnsFromDataSet(dataset) {
                if (WM.isObject(dataset)) {
                    if (WM.isArray(dataset) && WM.isObject(dataset[0])) {
                        return _.keys(dataset[0]);
                    }
                    return _.keys(dataset);
                }
                return [];
            }

            // to get list of all the columns from the properties-map
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

                dataSetParts    = $is.binddataset.split('.');
                refVariableName = Utils.getVariableName($is);
                refVariable     = getVariable($is, refVariableName);

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
                    // When binddataset is of the format: bind:Widgets.widgetName.selecteditem
                    details.fields = fields;
                }
                return details;
            }

            //* Fetch column bindings for the live list in case it is bound to a widget.
            function fetchDynamicColumns($is) {
                var fields = [],
                    result;
                result = getBoundWidgetDatasetDetails($is);
                if (result.fields) {
                    fields = result.fields;
                } else if (result.relFieldType) {
                    //Invoke the function to fetch sample data-structure for the field.
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
                    // If live list is bound to a widget, fetch the columns accordingly.
                    if (_.includes($is.binddataset, 'bind:Widgets.')) {
                        columns = fetchDynamicColumns($is);
                    }
                }
                // emit event to modify the liveList template
                $rs.$emit('livelist-template-modified', {
                    'widgetName' : $is.name,
                    'bindDataset': $is.binddataset,
                    'fields'     : columns,
                    'forceUpdate': forceUpdate
                });
            }

            function handlePageSizeDisplay($is, variableObj) {
                if (variableObj) {
                    var isBoundToLiveVariable = (variableObj.category === 'wm.LiveVariable'),
                        isBoundToQueryServiceVariable = (variableObj.category === 'wm.ServiceVariable') && (variableObj.serviceType === 'DataService');
                    // Make the "pageSize" property hidden so that no editing is possible for live and query service variables
                    $is.widgetProps.pagesize.show = !(isBoundToLiveVariable || isBoundToQueryServiceVariable);
                }
            }

            function setFetchInProgress($is, inProgress) {
                $is.$liScope.fetchInProgress = inProgress;
            }

            function _fetchNextOnScroll($is, $el) {
                var $dataNavigator = $el.find('> .panel-footer > [data-identifier=datanavigator]'),
                    navigator      = $dataNavigator.isolateScope();

                $rs.$evalAsync(function () {
                    setFetchInProgress($is, true);
                    navigator.navigatePage('next');
                    if (navigator.isLastPage()) {
                        setFetchInProgress($is, false);
                    }
                });
            }


            function bindScrollEvt($is, $el) {
                var lastScrollTop  = 0,
                    $ul            = $el.find('> ul'),
                    $scrollParent,
                    scrollNode;

                $scrollParent = $ul.children().first().scrollParent(false);

                if ($scrollParent[0] === document) {
                    scrollNode = document.body;
                } else {
                    scrollNode = $scrollParent[0];
                }

                // has scroll
                if (scrollNode.scrollHeight > scrollNode.clientHeight) {
                    $scrollParent
                        .each(function () {
                            //scrollTop property is 0 or undefined for body in IE, safari.
                            lastScrollTop = this === document ? (this.body.scrollTop || WM.element(window).scrollTop()) : this.scrollTop;
                        })
                        .off('scroll.scroll_evt')
                        .on('scroll.scroll_evt', function (evt) {
                            var target = evt.target,
                                clientHeight,
                                totalHeight,
                                scrollTop;
                            //scrollingElement is undefined for IE, safari. use body as target Element
                            target =  target === document ? (target.scrollingElement || document.body) : target;

                            clientHeight = target.clientHeight;
                            totalHeight  = target.scrollHeight;
                            scrollTop    = target === document.body ? WM.element(window).scrollTop() : target.scrollTop;

                            if ((lastScrollTop < scrollTop) && (totalHeight * 0.9 < scrollTop + clientHeight)) {
                                WM.element(this).off('scroll.scroll_evt');
                                _fetchNextOnScroll($is, $el);
                            }

                            lastScrollTop = scrollTop;
                        });
                } else {
                    // if there is no scrollable element register wheel event on ul element
                    $scrollParent = $ul;
                    $ul.on('wheel.scroll_evt', function (e) {
                        if (e.originalEvent.deltaY > 0) {
                            $ul.off('wheel.scroll_evt');
                            _fetchNextOnScroll($is, $el);
                        }
                    });
                }

                $el.data('$scrollParent', $scrollParent);
            }

            function applyWrapper($tmplContent, attrs, flag) {
                var tmpl = liTemplateWrapper_start;

                if (attrs.hasOwnProperty('onMouseenter')) {
                    tmpl += ' ng-mouseenter="onMouseenter({$event: $event, $scope: this})" ';
                }

                if (attrs.hasOwnProperty('onMouseleave')) {
                    tmpl += ' ng-mouseleave="onMouseleave({$event: $event, $scope: this})" ';
                }

                tmpl += liTemplateWrapper_end;
                tmpl = WM.element(tmpl);

                if (flag) {
                    tmpl.find('.app-list-item').append($tmplContent);
                } else {
                    tmpl.first().append($tmplContent);
                }
                return tmpl;
            }

            function prepareLITemplate(tmpl, attrs, flag, name) {
                var $tmpl = WM.element(tmpl),
                    $div  = WM.element('<div></div>').append($tmpl),
                    parentDataSet = attrs.dataset || attrs.scopedataset;

                if (parentDataSet) {
                    Utils.updateTmplAttrs($div, parentDataSet, name);
                }
                $tmpl = applyWrapper($tmpl, attrs, flag);

                return $tmpl;
            }

            //Sets dataNavigator class on change of paginationclass
            function setNavigationClass($is, $el, nv) {
                $timeout(function () {
                    var $dataNavigatorEl = $el.find('> .panel-footer > [data-identifier=datanavigator]'),
                        dataNavigatorScope;
                    if ($is.navigation && $dataNavigatorEl.length) {
                        dataNavigatorScope                 = $dataNavigatorEl.isolateScope();
                        dataNavigatorScope.navigationClass = nv;
                    }
                });
            }

            //Format the date with given date format
            function filterDate(value, format, defaultFormat) {
                if (format === 'timestamp') { //For timestamp format, return the epoch value
                    return value;
                }
                return $filter('date')(value, format || defaultFormat);
            }
            // This function adds the li elements if groupby is set.
            function addListElements(_s, $el, $is, attrs, listCtrl) {
                var $liTemplate,
                    groupedLiData,
                    groupDataByUserDefinedFn,
                    regex                    = /\W/g,
                    momentLocale             = moment.localeData(),
                    momentCalendarOptions    = Utils.getClonedObject(momentLocale._calendar),
                    momentCalendarDayOptions = momentLocale._calendarDay || {
                        'lastDay'  : '[Yesterday]',
                        'lastWeek' : '[Last] dddd',
                        'nextDay'  : '[Tomorrow]',
                        'nextWeek' : 'dddd',
                        'sameDay'  : '[Today]',
                        'sameElse' : 'L'
                    },
                    GROUP_BY_OPTIONS    = {
                        'ALPHABET' : 'alphabet',
                        'WORD'     : 'word',
                        'OTHERS'   : 'Others'
                    },
                    TIME_ROLLUP_OPTIONS = {
                        'HOUR'  : 'hour',
                        'DAY'   : 'day',
                        'WEEK'  : 'week',
                        'MONTH' : 'month',
                        'YEAR'  : 'year'
                    },
                    ROLLUP_PATTERNS    = {
                        'DAY'   : 'yyyy-MM-dd',
                        'WEEK'  : 'w \'Week\',  yyyy',
                        'MONTH' : 'MMM, yyyy',
                        'YEAR'  : 'YYYY',
                        'HOUR'  : 'hh:mm a'
                    },
                    groupedDataFieldName = '',
                    count                = 0;

                //Get the group by roll up string for time based group by options
                function getTimeRolledUpString(str, rollUp) {
                    var groupByKey,
                        currMoment = moment(),
                        strMoment  = moment(str),
                        getSameElseFormat = function () { //Set the sameElse option of moment calendar to user defined pattern
                            return '[' + filterDate(this.valueOf(), $is.dateformat, ROLLUP_PATTERNS.DAY) + ']';
                        };
                    switch (rollUp) {
                    case TIME_ROLLUP_OPTIONS.HOUR:
                        if (!strMoment.isValid()) { //If date is invalid, check if data is in forom of hh:mm a
                            strMoment = moment(new Date().toDateString() + ' ' + str);
                            if (strMoment.isValid()) {
                                momentLocale._calendar.sameDay = function () { //As only time is present, roll up at the hour level with given time format
                                    return '[' + filterDate(this.valueOf(), $is.dateformat, ROLLUP_PATTERNS.HOUR) + ']';
                                };
                            }
                        }
                        strMoment = strMoment.startOf('hour'); //round off to nearest last hour
                        momentLocale._calendar.sameElse = getSameElseFormat;
                        groupByKey = strMoment.calendar(currMoment);
                        break;
                    case TIME_ROLLUP_OPTIONS.WEEK:
                        groupByKey = filterDate(strMoment.valueOf(), $is.dateformat, ROLLUP_PATTERNS.WEEK);
                        break;
                    case TIME_ROLLUP_OPTIONS.MONTH:
                        groupByKey = filterDate(strMoment.valueOf(), $is.dateformat, ROLLUP_PATTERNS.MONTH);
                        break;
                    case TIME_ROLLUP_OPTIONS.YEAR:
                        groupByKey = strMoment.format(ROLLUP_PATTERNS.YEAR);
                        break;
                    case TIME_ROLLUP_OPTIONS.DAY:
                        strMoment = strMoment.startOf('day'); //round off to current day
                        momentLocale._calendar.sameElse = getSameElseFormat;
                        groupByKey = strMoment.calendar(currMoment);
                        break;

                    }
                    if (groupByKey === 'Invalid date') { //If invalid date is returned, Categorize it as Others.
                        return GROUP_BY_OPTIONS.OTHERS;
                    }
                    return groupByKey;
                }

                function groupDataByField(liData) {
                    var concatStr = _.get(liData, $is.groupby);

                    if (WM.isUndefined(concatStr) || _.isNull(concatStr)) {
                        return GROUP_BY_OPTIONS.OTHERS; // by default set the undefined groupKey as 'others'
                    }

                    // if match prop is alphabetic ,get the starting alphabet of the word as key.
                    if ($is.match === GROUP_BY_OPTIONS.ALPHABET) {
                        concatStr = concatStr.substr(0, 1);
                    }

                    if (_.includes(_.values(TIME_ROLLUP_OPTIONS), $is.match)) {
                        concatStr = getTimeRolledUpString(concatStr, $is.match);
                    }

                    return _.toLower(concatStr);
                }

                $el.find('> [data-identifier=list]').empty();

                // groups the fields based on the groupby value.
                if (_.includes($is.groupby, '(')) {
                    groupDataByUserDefinedFn = _s[$is.groupby.split('(')[0]];
                    groupedLiData = _.groupBy(_s.fieldDefs, groupDataByUserDefinedFn);
                } else {
                    if (!$is.orderby) { //Apply implicit orderby on group by clause, if order by not specified
                        _s.fieldDefs = FormWidgetUtils.getOrderedDataSet(_s.fieldDefs, $is.groupby);
                    }
                    if ($is.match === TIME_ROLLUP_OPTIONS.DAY) {
                        momentLocale._calendar = momentCalendarDayOptions; //For day, set the relevant moment calendar options
                    }
                    // handling case-in-sensitive scenario
                    _s.fieldDefs = _.orderBy(_s.fieldDefs, function (fieldDef) {
                        var groupKey = _.get(fieldDef, $is.groupby);
                        if (groupKey) {
                            return _.toLower(groupKey);
                        }
                    });
                    groupedLiData = _.groupBy(_s.fieldDefs, groupDataByField);
                    momentLocale._calendar = momentCalendarOptions; //Reset to default moment calendar options
                }

                // append data to li based on the grouped data.
                _.forEach(_.keys(groupedLiData), function (groupkey, index) {
                    var groupedData = groupedLiData[groupkey];
                    groupedDataFieldName     = '_groupData' + groupkey;
                    liTemplateWrapper_start  = '';
                    liTemplateWrapper_end    = '></li></ul></li>';

                    // replace special characters in groupkey by '_'
                    if (regex.test(groupedDataFieldName)) {
                        count = count + 1;
                        groupedDataFieldName = groupedDataFieldName.replace(regex, '_') + count;
                    }

                    // appending the sorted data to scope based to groupkey
                    _s[groupedDataFieldName] = _.sortBy(groupedData, function (data) {
                        data._groupIndex = index + 1;
                        return data[$is.groupby];
                    });

                    liTemplateWrapper_start +=  '<li class="app-list-item-group clearfix"><ul class="list-group" ng-class="listclass"><li class="app-list-item-header list-item" ng-class="{\'collapsible-content\' : collapsible}">' +
                                                '<h4>' + groupkey +
                                                '<div class="header-action">' +
                                                    '<i class="app-icon wi action wi-chevron-up" ng-if="collapsible" title="{{::$root.appLocale.LABEL_COLLAPSE}}/{{::$root.appLocale.LABEL_EXPAND}}"></i>' +
                                                    '<span ng-if="showcount" class="label label-default">' + _s[groupedDataFieldName].length + '</span>' +
                                                '</div>' +
                                                '</h4></li>';

                    liTemplateWrapper_start += '<li ng-repeat="item in ' +  groupedDataFieldName + ' track by $index" tabindex="0" ng-init="addCurrentItemWidgets(this);" ng-focus="onFocus($event)" class="app-list-item" ng-class="[itemsPerRowClass, _itemClass(this), {\'disable-item\': _disableItem(this)}]" ';

                    $liTemplate = prepareLITemplate(listCtrl.$get('listTemplate'), attrs, true, $is.name);

                    $el.find('> [data-identifier=list]').append($liTemplate);
                    $compile($liTemplate)($is.$liScope);
                });
            }

            // With given data, creates list items and updates the markup
            function updateFieldDefs($is, $el, data, attrs, listCtrl) {
                var unbindWatcher, _s, fieldDefs;

                _s         = $is.$liScope;
                fieldDefs  = _s.fieldDefs;

                if ($is.infScroll || $is.onDemandLoad) {
                    if (WM.isUndefined(fieldDefs)) {
                        _s.fieldDefs = fieldDefs = [];
                    }

                    if ($is.dataNavigator.isFirstPage()) {
                        _s.fieldDefs.length = 0;
                    }

                    _.forEach(data, function (item) {
                        fieldDefs.push(item);
                    });

                    $rs.$evalAsync(function () {
                        setFetchInProgress($is, false);
                        //Functionality of On-Demand and Scroll will be same except we don't attach scroll events
                        if (fieldDefs.length && !$is.onDemandLoad) {
                            $timeout(function () {
                                bindScrollEvt($is, $el);
                            }, 100);
                        }
                    });
                } else {
                    _s.fieldDefs = data;
                }

                if ($is.orderby) {
                    _s.fieldDefs = FormWidgetUtils.getOrderedDataSet(_s.fieldDefs, $is.orderby);
                }

                if ($is.groupby) {
                    addListElements(_s, $el, $is, attrs, listCtrl);
                    if ($is.collapsible) {
                        // on groupby header click, collapse or expand the list-items.
                        $el.find('li.app-list-item-header').on('click', function (e) {
                            var selectedGroup   = WM.element(e.target).closest('.list-group'),
                                selectedAppIcon = selectedGroup.find('li.app-list-item-header').find('.app-icon');

                            if (selectedAppIcon.hasClass('wi-chevron-down')) {
                                selectedAppIcon.removeClass('wi-chevron-down').addClass('wi-chevron-up');
                            } else {
                                selectedAppIcon.removeClass('wi-chevron-up').addClass('wi-chevron-down');
                            }

                            selectedGroup.find('.app-list-item').toggle();
                        });
                    }
                }

                if (!_s.fieldDefs.length) {
                    $is.noDataFound = true;
                    $is.selecteditem = undefined;
                }
                // deselect all the selected items on data change.
                $el.find('li.app-list-item.active').removeClass('active');

                // In run mode, making the first element selected, if flag is set
                // and prevent first item being selected in next page
                if ($is.selectfirstitem && !(_.get($is.dataNavigator, 'dn.currentPage') !== 1 && $is.multiselect)) {
                    unbindWatcher = $is.$watch(function () {
                        var items = $el.find('.list-group li.app-list-item:first');
                        if (items.length) {
                            $rs.$safeApply($is, function () {
                                $timeout(function () {
                                    var item = items.first();
                                    // If item has active class already, no need to click again
                                    if (!item.hasClass('active')) {
                                        item.click();
                                    }
                                }, 0, false);
                                unbindWatcher();
                            });
                        }
                    });
                }
                $timeout(function () {
                    //Set the list item class to active, If list item is present in selected items
                    _.forEach($is._items, function (item) {
                        var listItems = $el.find('.list-group li.app-list-item'),
                            itemIndex = getItemIndex(listItems, item),
                            $li       = WM.element(listItems[itemIndex]);
                        if (!_.isEqual(itemIndex, -1)) {
                            $li.addClass('active');
                        }
                    });
                });
            }

            function onDataChange($is, $el, nv, attrs, listCtrl) {
                if (nv) {
                    var boundVariableName = Utils.getVariableName($is),
                        variable = getVariable($is, boundVariableName),
                        category = variable && variable.category;

                    //Clone data if variable type is not static
                    nv = category === 'wm.Variable' ? nv : Utils.getClonedObject(nv);
                    $is.noDataFound = false;

                    if (nv.data) {
                        nv = nv.data;
                    } else {
                        if (!_.includes($is.binddataset, 'bind:Widgets.')) {
                            // data from the live list must have .data filed
                            if (category === 'wm.LiveVariable') {
                                return;
                            }
                        }
                    }

                    // If the data is a pageable object, then display the content.
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
                        if (nv.length) {
                            //If data is present, call on before data render event
                            $is.onBeforedatarender({$isolateScope: $is, $data: nv});
                        }
                        updateFieldDefs($is, $el, nv, attrs, listCtrl);
                    }
                } else {
                    if (CONSTANTS.isRunMode) {
                        updateFieldDefs($is, $el, [], attrs, listCtrl);
                    }
                }
            }

            function setupDataSource($is, $el, nv, attrs, listCtrl) {

                var $dataNavigator, // dataNavigator element
                    dataNavigator,  // dataNavigator scope
                    binddataset;

                if ($is.navigation !== 'None') {

                    $is.clear();

                    binddataset = $is.binddataset;
                    Utils.triggerFn($is._watchers.dataset);
                    $is.dataNavigator = undefined;
                    $timeout(function () {
                        $dataNavigator = $el.find('> .panel-footer > [data-identifier=datanavigator]');
                        dataNavigator = $dataNavigator.isolateScope();
                        $is.dataNavigator = dataNavigator;
                        dataNavigator.pagingOptions = {
                            maxResults: $is.pagesize || 20
                        };

                        // remove the existing watchers
                        Utils.triggerFn($is._watchers.dataNavigatorResult);
                        Utils.triggerFn($is._watchers.dataNavigatorMaxResults);

                        // create a watch on dataNavigator.result
                        $is._watchers.dataNavigatorResult = dataNavigator.$watch('result', function (_nv) {
                            onDataChange($is, $el, _nv, attrs, listCtrl);
                        }, true);
                        $is._watchers.dataNavigatorMaxResults = dataNavigator.$watch('maxResults', function (_nv) {
                            $is.pagesize = _nv;
                        }, true);

                        dataNavigator.dataset = binddataset;
                    });
                } else {
                    onDataChange($is, $el, nv, attrs, listCtrl);
                }
            }

            function studioMode_onDataSetChange($is, doNotRemoveTemplate) {
                var boundVariableName = Utils.getVariableName($is),
                    variable = getVariable($is, boundVariableName);
                //Assign variable name and type on widget scope if variable is available.
                if (variable) {
                    $is.variableName = variable.name;
                    $is.variableType = variable.category;
                }
                if ($is.oldbinddataset !== $is.binddataset && $is._isInitialized) {
                    if (!doNotRemoveTemplate) {
                        updateLiveListBindings($is, true);
                    }
                }
                handlePageSizeDisplay($is, variable);
            }

            function runMode_onDataSetChange($is, $el, nv, attrs, listCtrl) {
                if ($is.oldbinddataset !== $is.binddataset) {
                    setupDataSource($is, $el, nv, attrs, listCtrl);
                } else {
                    onDataChange($is, $el, nv, attrs, listCtrl);
                }
            }

            function onDataSetChange($is, $el, doNotRemoveTemplate, nv, attrs, listCtrl) {

                if (CONSTANTS.isStudioMode) {
                    studioMode_onDataSetChange($is, doNotRemoveTemplate);
                } else {
                    runMode_onDataSetChange($is, $el, nv, attrs, listCtrl);
                }

                $is.oldbinddataset = $is.binddataset;
            }

            function resetNavigation($is) {
                $is.showNavigation = false;
                $is.navControls    = undefined;
                $is.infScroll      = false;
                $is.onDemandLoad   = false;
            }

            function enableBasicNavigation($is) {
                $is.navControls    = NAVIGATION.BASIC;
                $is.showNavigation = true;
            }

            function enableInlineNavigation($is) {
                $is.navControls = NAVIGATION.INLINE;
            }

            function enableClassicNavigation($is) {
                $is.navControls    = NAVIGATION.CLASSIC;
                $is.showNavigation = true;
            }

            function enablePagerNavigation($is) {
                $is.navControls    = NAVIGATION.PAGER;
                $is.showNavigation = true;
            }

            function enableInfiniteScroll($is) {
                $is.infScroll = true;
            }

            function enableOnDemandLoad($is) {
                $is.onDemandLoad = true;
            }

            function onNavigationTypeChange($is, type) {
                resetNavigation($is);
                switch (type) {
                case NAVIGATION.BASIC:
                    enableBasicNavigation($is);
                    break;
                case NAVIGATION.INLINE:
                    enableInlineNavigation($is);
                    break;
                case NAVIGATION.ADVANCED:
                case NAVIGATION.CLASSIC:
                    enableClassicNavigation($is);
                    break;
                case NAVIGATION.SCROLL:
                    enableInfiniteScroll($is);
                    break;
                case NAVIGATION.PAGER:
                    enablePagerNavigation($is);
                    break;
                case NAVIGATION.ONDEMAND:
                    enableOnDemandLoad($is);
                    break;
                }
            }

            /* this function sets the itemclass depending on itemsperrow.
            if itemsperrow is 2 for large device, then itemclass is 'col-xs-1 col-sm-1 col-lg-2'
            if itemsperrow is 'lg-3' then itemclass is 'col-lg-3'
            */
            function setListClass($is) {
                var itemClass = '',
                    $liScope  = $is.$liScope;

                if ($is.itemsperrow) {
                    if (isNaN(parseInt($is.itemsperrow, 10))) {
                        // handling itemsperrow containing string of classes
                        _.forEach(_.split($is.itemsperrow, ' '), function (cls) {
                            var keys = _.split(cls, '-');
                            cls  = keys[0] + '-' + (12 / parseInt(keys[1], 10));
                            itemClass += ' ' + 'col-' + cls;
                        });
                        $liScope.itemsPerRowClass = itemClass.trim();
                    } else {
                        // handling itemsperrow having integer value.
                        $liScope.itemsPerRowClass = 'col-xs-' + (12 / parseInt($is.itemsperrow, 10));
                    }
                } else { //If itemsperrow is not specified make it full width
                    $liScope.itemsPerRowClass = 'col-xs-12';
                }
            }

            /* In case of run mode, the field-definitions will be generated from the markup
             * Define the property change handler. This function will be triggered when there is a change in the widget property
             */
            function propertyChangeHandler($is, $el, attrs, listCtrl, key, nv) {
                var doNotRemoveTemplate,
                    selectedVariable,
                    eleScope    = $el.scope(),
                    variable    = Utils.getVariableName($is, eleScope),
                    wp          = $is.widgetProps,
                    matchDataTypes  = ['string', 'date', 'time', 'datetime', 'timestamp'],
                    matchServiceDataTypes  = ['java.lang.String', 'java.sql.Date', 'java.sql.Time', 'java.sql.Datetime', 'java.sql.Timestamp'],
                    typeUtils = Utils.getService('TypeUtils'),
                    showOrHideMatchProperty = function () {
                        if (!$is.dataset || $is.groupby === 'Javascript') {
                            return;
                        }
                        selectedVariable = selectedVariable || eleScope.Variables[variable];
                        if (!$is.groupby || _.includes($is.groupby, '(')) {
                            wp.match.show = false;
                        } else if (selectedVariable) {
                            if (selectedVariable.category === 'wm.LiveVariable') {
                                wp.match.show = _.includes(matchDataTypes, _.toLower(Utils.extractType(typeUtils.getTypeForExpression($is.binddataset + '.' + $is.groupby))));
                            } else if (selectedVariable.category === 'wm.DeviceVariable') {
                                wp.match.show = _.includes(matchDataTypes, DeviceVariableService.getFieldType(variable, $is.groupby));
                            } else if (selectedVariable.category === 'wm.ServiceVariable' || selectedVariable.category === 'wm.Variable') {
                                wp.match.show = _.includes(matchServiceDataTypes, typeUtils.getTypeForExpression($is.binddataset + '.' + $is.groupby));
                            }
                        }
                        if (!wp.match.show) {
                            $is.$root.$emit('set-markup-attr', $is.widgetid, {'match': ''});
                            $is.match = '';
                        }
                        wp.showcount.show = wp.collapsible.show = $is.groupby ? true : false;

                        if (!wp.collapsible.show) {
                            $is.$root.$emit('set-markup-attr', $is.widgetid, {'collapsible': ''});
                            $is.collapsible = false;
                        }
                    };

                //checking if the height is set on the element then we will enable the overflow
                switch (key) {
                case 'dataset':
                    doNotRemoveTemplate = attrs.template === 'true';
                    onDataSetChange($is, $el, doNotRemoveTemplate, nv, attrs, listCtrl);
                    if ($is.widgetid) {
                        showOrHideMatchProperty();
                    }
                    break;
                case 'navigation':
                    if (nv === 'Advanced') { //Support for older projects where navigation type was advanced instead of clasic
                        $is.navigation = 'Classic';
                        return;
                    }
                    wp.navigationalign.show = !_.includes(['None', 'Scroll', 'Inline', 'On-Demand'], nv);
                    wp.showrecordcount.show = !_.includes(['Pager', 'Inline', 'Scroll', 'None', 'On-Demand'], nv);
                    wp.ondemandmessage.show = nv === 'On-Demand';
                    wp.paginationclass.show = !_.includes(['None', 'Scroll', 'Inline'], nv);
                    onNavigationTypeChange($is, nv);
                    setNavigationClass($is, $el, $is.paginationclass);
                    break;
                case 'groupby':
                    selectedVariable = eleScope.Variables[variable];
                    if ($is.widgetid) {
                        showOrHideMatchProperty();
                        // enablereorder is not shown with groupby
                        if (nv && nv !== '') {
                            $is.enablereorder     = false;
                            wp.enablereorder.show = false;
                            if (nv === 'Javascript') {
                                wp.groupby.isGroupBy = true;
                            } else {
                                wp.groupby.isGroupBy = false;
                            }
                        } else {
                            wp.enablereorder.show = true;
                        }
                    }
                    break;
                case 'match':
                    wp.dateformat.show = _.includes(['day', 'hour', 'month', 'week'], $is.match);
                    break;
                case 'padding':
                    $rs.$emit('apply-box-model-property', $el.find('> .app-livelist-container'), 'padding', nv);
                    break;
                case 'itemsperrow':
                    setListClass($is);
                    break;
                case 'paginationclass':
                    setNavigationClass($is, $el, nv);
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
                    },
                    'item': {
                        'get': function () {
                            return _scope.item;
                        }
                    }
                });
            }

            function getEvalFn($is, attrs, property, val, itemAttr) {
                var watchFn,
                    bindExpr,
                    evalFn,
                    interpolateFn,
                    $dummy,
                    $target;

                itemAttr = itemAttr === 'false' ? false : itemAttr;
                // when the property is binded
                if (_.startsWith(itemAttr, 'bind:')) {
                    $dummy  = WM.element('<div>');
                    $target = WM.element('<div>').attr(property, val);
                    $dummy.append($target);
                    Utils.updateTmplAttrs($dummy, attrs.dataset || attrs.scopedataset, $is.name);

                    // get the updated attribute
                    bindExpr = _.replace($target.attr(property), 'bind:', '');
                    watchFn  = $parse(bindExpr);
                    evalFn   = function ($s) { // evaluate the expression
                        return watchFn($s);
                    };
                } else if (_.includes(itemAttr, '{{') && _.includes(itemAttr, '}}')) {
                    interpolateFn = $interpolate(itemAttr);
                    evalFn = function ($s) { // use interpolateFn to get the updated value
                        return interpolateFn($s);
                    };
                } else { // when the property doesn't contain any binding or interpolation
                    evalFn = _.identity.bind(undefined, itemAttr);
                }

                return evalFn;
            }

            function createChildScope($is, $el, attrs) {
                var _scope      = $el.scope(), // scop which inherits controller's scope
                    $liScope    = _scope.$new(), // create a new child scope. List Items will be compiled with this scope.
                    $contextEl  = attrs.$$element.context,
                    itemClsAttr,
                    evalItemClassFn,
                    evalDisableItemFn,
                    disableItemAttr;

                $liScope.fieldDefs = [];
                itemClsAttr        = $contextEl.getAttribute('itemclass');
                disableItemAttr    = $contextEl.getAttribute('disableitem');

                evalItemClassFn   = getEvalFn($is, attrs, 'itemclass', attrs.itemclass, itemClsAttr);
                evalDisableItemFn = getEvalFn($is, attrs, 'disableitem', attrs.disableitem, disableItemAttr);

                // evt handlers will be created by isolateScope. redefine them on $liScope.
                WM.extend($liScope, {
                    'onClick'            : $is.onClick,
                    'onDblclick'         : $is.onDblclick,
                    'onTap'              : $is.onTap,
                    'onDoubletap'        : $is.onDoubletap,
                    'onMouseenter'       : $is.onMouseenter,
                    'onMouseleave'       : $is.onMouseleave,
                    'onEnterkeypress'    : $is.onEnterkeypress,
                    'onSetrecord'        : $is.onSetrecord,
                    'onBeforedatarender' : $is.onBeforedatarender,
                    'onPaginationchange' : $is.onPaginationchange,
                    '_itemClass'         : evalItemClassFn,
                    'itemsPerRowClass'   : '',
                    'addRow'             : $is.addRow,
                    'updateRow'          : $is.updateRow,
                    'deleteRow'          : $is.deleteRow,
                    'showcount'          : $is.showcount,
                    'collapsible'        : $is.collapsible,
                    '_disableItem'       : evalDisableItemFn
                });

                return $liScope;
            }
            // Triggers event to update or delete list item
            function triggerWMEvent($is, evt, name) {
                var $li = WM.element(evt.target).parents('li.app-list-item');
                if (!_.isEmpty($li)) {
                    $is.selecteditem = $li.scope().item;
                }
                $rs.$safeApply($is);
                $rs.$emit('wm-event', $is.name, name);
            }

            function checkSelectionLimit($is, count) {
                return (!$is.selectionlimit || count < $is.selectionlimit);
            }

            function getWidgets($el, name, index) {
                var prefix = 'li.app-list-item',
                    $target,
                    retVal = [];

                if (!WM.isDefined(name)) {
                    return;
                }

                if (!WM.isDefined(index)) {
                    $el.find(prefix + ' [init-widget][name="' + name + '"]')
                        .each(function () {
                            $target = WM.element(this);
                            if ($target.isolateScope) {
                                retVal.push($target.isolateScope());
                            }
                        });

                    return retVal;

                }
                index = +index || 0;
                index++;

                $target = $el.find(prefix + ':nth-child(' + index + ')').find('[init-widget][name="' + name + '"]');

                if ($target.length && $target.isolateScope) {
                    return [$target.isolateScope()];
                }
            }

            function updateSelectedItemsWidgets($is, $el) {
                // remove the existing entries
                if ($is.multiselect) {
                    $is.selectedItemWidgets.length = 0;
                }

                // find the active list item
                $el.find('li.app-list-item.active')
                    .each(function () {
                        var wid = {};

                        // find the widgets inside the list item and update the map
                        WM.element(this)
                            .find('[init-widget]')
                            .each(function () {
                                var $target = WM.element(this),
                                    _is;
                                if ($target.isolateScope) {
                                    _is = $target.isolateScope();

                                    if (_is.name) {
                                        wid[_is.name] = _is;
                                    }
                                }
                            });

                        if ($is.multiselect) {
                            $is.selectedItemWidgets.push(wid);
                        } else {
                            $is.selectedItemWidgets = wid;
                        }
                    });
            }
            function setItems($li, $is) {
                var _item = $li.scope().item;
                if ($li.hasClass('active')) {
                    $is._items.push(_item);
                } else {
                    $is._items = _.pullAllWith($is._items, [_item], _.isEqual);
                }
            }
            function clearItems($is, $el) {
                $el.find('li.app-list-item.active').removeClass('active'); // removing active class from previous selectedItem
                $is._items.length = 0;
            }
            function setupEvtHandlers($is, $el, attrs) {
                var pressStartTimeStamp = 0,
                    $hammerEl   = new Hammer($el[0], {}),
                    selectCount = 0;// Setting to true on first long press

                // handle on-tap/on-click events in bubble phase
                $el[0].addEventListener('click', function (evt) {
                    // returning if click event is triggered within 50ms after pressup event occurred
                    if (pressStartTimeStamp + 50 > Date.now()) {
                        return;
                    }

                    var $li      = WM.element(evt.target).closest('li.app-list-item'),
                        $liScope = $li && $li.scope();

                    if ($liScope && !$liScope._disableItem($liScope)) {
                        // trigger $apply, as 'click' or 'tap' is out of angular-scope
                        if (attrs.onClick) {
                            Utils.triggerFn($liScope.onClick, {$event: evt, $scope: $liScope});
                        }
                        if (attrs.onTap) {
                            Utils.triggerFn($liScope.onTap, {$event: evt, $scope: $liScope});
                        }

                        $rs.$safeApply($is);
                    }
                });


                // listen on to the click event for the ul element & get li clicked of the live-list
                $el[0].addEventListener('click', function (evt) {
                    // returning if click event is triggered within 50ms after pressup event occurred
                    if (pressStartTimeStamp + 50 > Date.now()) {
                        return;
                    }
                    var $li      = WM.element(evt.target).closest('li.app-list-item'),
                        $liScope = $li && $li.scope(),
                        isActive = $li.hasClass('active'),
                        first,
                        last,
                        $liItems;

                    if ($liScope && !$liScope._disableItem($liScope)) {
                        $is.firstSelectedItem = $is.firstSelectedItem || $li;
                        // Setting selectCount value based number of items selected.
                        selectCount = WM.isArray($is.selecteditem) ? $is.selecteditem.length : (WM.isObject($is.selecteditem) ? 1 : 0);

                        if ($is.multiselect && $rs.isMobileApplicationType) {
                            if (checkSelectionLimit($is, selectCount) || $li.hasClass('active')) {
                                $li.toggleClass('active');
                                setItems($li, $is);
                            } else {
                                Utils.triggerFn($is.onSelectionlimitexceed, {$event: evt, $scope: $is});
                            }
                        } else if ((evt.ctrlKey || evt.metaKey) && $is.multiselect) {
                            if (checkSelectionLimit($is, selectCount) || $li.hasClass('active')) {
                                $is.lastSelectedItem = $is.firstSelectedItem = $li;
                                $li.toggleClass('active');
                                setItems($li, $is);
                            } else {
                                Utils.triggerFn($is.onSelectionlimitexceed, {$event: evt, $scope: $is});
                            }
                        } else if (evt.shiftKey && $is.multiselect) {
                            $liItems = $el.find('li.app-list-item');
                            first    = $liItems.index($li);
                            last     = $liItems.index($is.firstSelectedItem);

                            // if first is greater than last, then swap values
                            if (first > last) {
                                last = [first, first = last][0];
                            }
                            if (checkSelectionLimit($is, last - first)) {
                                clearItems($is, $el);
                                _.forEach($liItems, function (element, index) {
                                    var $currentLi;
                                    if (index >= first && index <= last) {
                                        $currentLi = WM.element($liItems[index]);
                                        $currentLi.addClass('active');
                                        setItems($currentLi, $is);
                                    }
                                });
                                $is.lastSelectedItem = $li;
                            } else {
                                Utils.triggerFn($is.onSelectionlimitexceed, {$event: evt, $scope: $is});
                            }
                        } else {
                            if (!isActive || selectCount > 1) {
                                clearItems($is, $el);
                                $li.addClass('active');
                                setItems($li, $is);
                                $is.lastSelectedItem = $is.firstSelectedItem = $li;
                            }
                        }

                        updateSelectedItemsWidgets($is, $el);

                        $rs.$safeApply($is);
                    }
                }, true);

                $el.on('keydown', 'li.app-list-item', function (evt) {
                    var $liItems,
                        presentIndex,
                        firstIndex,
                        keyPressed,
                        $currentLi;

                    function setIndexValues() {
                        $liItems     = $el.find('li.app-list-item');
                        presentIndex = $liItems.index($is.lastSelectedItem);
                        firstIndex   = $liItems.index($is.firstSelectedItem);
                        selectCount  = WM.isArray($is.selecteditem) ? $is.selecteditem.length : (WM.isObject($is.selecteditem) ? 1 : 0);
                    }

                    keyPressed = Utils.getActionFromKey(evt);
                    if ($is.multiselect) {
                        if (keyPressed === 'SHIFT+UP' || keyPressed === 'SHIFT+LEFT') {
                            setIndexValues();
                            if (presentIndex > 0) {
                                if ((presentIndex === firstIndex || presentIndex < firstIndex) && checkSelectionLimit($is, selectCount)) {
                                    $currentLi = $is.lastSelectedItem = WM.element($liItems[presentIndex - 1]);
                                    $currentLi.toggleClass('active');
                                    setItems($currentLi, $is);
                                } else if (presentIndex > firstIndex) {
                                    $currentLi = WM.element($liItems[presentIndex]);
                                    $currentLi.toggleClass('active');
                                    setItems($currentLi, $is);
                                    $is.lastSelectedItem = WM.element($liItems[presentIndex - 1]);
                                } else {
                                    Utils.triggerFn($is.onSelectionlimitexceed, {$event: evt, $scope: $is});
                                }
                                $rs.$safeApply($is);
                            }
                        } else if (keyPressed === 'SHIFT+RIGHT' || keyPressed === 'SHIFT+DOWN') {
                            setIndexValues();
                            if (presentIndex < $liItems.length - 1) {
                                if ((presentIndex === firstIndex || presentIndex > firstIndex) && checkSelectionLimit($is, selectCount)) {
                                    $currentLi = $is.lastSelectedItem = WM.element($liItems[presentIndex + 1]);
                                    $currentLi.toggleClass('active');
                                    setItems($currentLi, $is);
                                } else if (presentIndex < firstIndex) {
                                    $currentLi = WM.element($liItems[presentIndex]);
                                    $currentLi.toggleClass('active');
                                    setItems($currentLi, $is);
                                    $is.lastSelectedItem = WM.element($liItems[presentIndex + 1]);
                                } else {
                                    Utils.triggerFn($is.onSelectionlimitexceed, {$event: evt, $scope: $is});
                                }
                                $rs.$safeApply($is);
                            }
                        }
                    }
                    if (!evt.shiftKey) {
                        if (keyPressed === 'UP-ARROW') {
                            setIndexValues();
                            if (presentIndex !== 0) {
                                $is.lastSelectedItem = WM.element($liItems[presentIndex - 1]);
                                $is.lastSelectedItem.focus();
                            }
                        } else if (keyPressed === 'DOWN-ARROW') {
                            setIndexValues();
                            if (presentIndex !== $liItems.length - 1) {
                                $is.lastSelectedItem = WM.element($liItems[presentIndex + 1]);
                                $is.lastSelectedItem.focus();
                            }
                        } else if (keyPressed === 'ENTER') {
                            setIndexValues();
                            WM.element($liItems[presentIndex]).trigger('click');
                        }
                    }
                });

                // listen on to the dblclick event for the ul element & get li dblclicked of the live-list
                $el.on('dblclick.wmActive', 'ul.app-livelist-container', function (evt) {
                    var $li = WM.element(evt.target).closest('li.app-list-item'),
                        $liScope = $li && $li.scope();

                    if ($liScope && !$liScope._disableItem($liScope)) {
                        // trigger $apply, as 'dblclick' or 'doubleTap' is out of angular-scope
                        if (attrs.onDblclick) {
                            Utils.triggerFn($liScope.onDblclick, {$event: evt, $scope: $liScope});
                        }
                        if (attrs.onDoubletap) {
                            Utils.triggerFn($liScope.onDoubletap, {$event: evt, $scope: $liScope});
                        }
                        $rs.$safeApply($is);
                    }
                });

                $hammerEl.on('pressup', function (evt) {
                    if (!$is.multiselect && $rs.isMobileApplicationType) {
                        var $li = WM.element(evt.target).closest('li.app-list-item');
                        $el.find('li.app-list-item.active').removeClass('active'); // removing active class from previous selectedItem
                        $li.addClass('active'); // adding active class to current selectedItem
                        setItems($li, $is);
                        $rs.$safeApply($is);
                        pressStartTimeStamp = Date.now();//Recording pressup event's timestamp
                    }
                });
                //Triggered on click of edit action
                $el.on('click', '[class*="edit-list-item"]', function (evt) {
                    triggerWMEvent($is, evt, 'update');
                });
                //Triggered on click of delete action
                $el.on('click', '[class*="delete-list-item"]', function (evt) {
                    triggerWMEvent($is, evt, 'delete');
                });
            }

            function preLinkFn($is, $el, attrs) {

                $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                // initialising oldDataSet to -1, so as to handle live-list with variable binding with live variables, during page 'switches' or 'refreshes'
                $is.oldbinddataset = CONSTANTS.isStudioMode ? attrs.dataset : undefined;
                $is.dataset     = []; // The data that is bound to the list. Stores the name for reference.
                $is.fieldDefs   = []; // The data required by the wmListItem directive to populate the items
                $is.noDataFound = false;
                Object.defineProperty($is, 'selecteditem', {
                    configurable: true
                });
                defineProps($is, $el);
                $el.removeAttr('title');
            }

            function configureDnD($el, $is) {
                var data;
                $el.find('.app-livelist-container').sortable({
                    'appendTo'    : 'body',
                    'containment' : $el.find('.app-livelist-container'),
                    'delay'       : 100,
                    'opacity'     : 0.8,
                    'helper'      : 'clone',
                    'z-index'     : 100,
                    'tolerance'   : 'pointer',
                    'start'       : function (evt, ui) {
                        ui.placeholder.height(ui.item.height());
                        WM.element(this).data('oldIndex', ui.item.index());
                    },
                    'update'      : function (evt, ui) {
                        var newIndex,
                            oldIndex,
                            draggedItem,
                            $dragEl;

                        data        = data || Utils.getClonedObject($is.$liScope.fieldDefs);
                        $dragEl     = WM.element(this);
                        newIndex    = ui.item.index();
                        oldIndex    = $dragEl.data('oldIndex');
                        draggedItem = _.pullAt(data, oldIndex)[0];

                        data.splice(newIndex, 0, draggedItem);
                        Utils.triggerFn($is.onReorder, {$event: evt, $data: data });
                        $dragEl.removeData('oldIndex');
                    }
                });
                $el.find('.app-livelist-container').droppable({'accept': '.app-list-item'});
            }

            function defineSelectedItemProp($is, $el) {
                Object.defineProperty($is, 'selecteditem', {
                    'configurable': true,
                    'get': function () {
                        if ($is.multiselect) {
                            return $is._items;
                        }
                        return $is._items && $is._items[0];
                    },
                    'set': function (items) {
                        $is._items.length = 0;
                        $el.find('li.app-list-item.active').removeClass('active'); // removing active class from previous selectedItem
                        if (_.isArray(items)) {
                            _.forEach(items, function (item) {
                                $is.selectItem(item);
                            });
                        } else {
                            $is.selectItem(items);
                        }
                    }
                });
            }
            // Select or delselect the live list item
            function toggleSelectedItem($is, $el, item, isSelect) {
                if (!WM.isDefined(item) || item === null) {
                    return;
                }
                var listItems = $el.find('.list-group li.app-list-item'),
                    itemIndex = WM.isNumber(item) ? item : getItemIndex(listItems, item),
                    $li       = WM.element(listItems[itemIndex]),
                    $liScope  = $li.length && $li.scope();
                //If deselectitem is true on item don't select item
                if ($liScope && !$liScope._disableItem($liScope)) {
                    if (!$is.multiselect) {
                        clearItems($is, $el);
                    }
                    if (isSelect) {
                        $li.addClass('active');
                    } else {
                        $li.removeClass('active');
                    }
                    setItems($li, $is);
                    updateSelectedItemsWidgets($is, $el);
                }
            }

            function onDestroy($is, $el, handlers) {
                var $scrollParent = $el.data('$scrollParent');
                Object.defineProperty($is, 'selecteditem', {'get': _.noop, 'set': _.noop});
                handlers.forEach(Utils.triggerFn);
                if ($scrollParent) { //In case of infinite scroll, get the scroll element and remove the scroll event
                    $scrollParent.off('.scroll_evt');
                }
            }

            //Gets current item widgets for given element
            function getCurrentItemWidgets(__s, element) {
                var wid = {};

                // find the widgets inside the list item and update the map
                element
                    .find('[init-widget]')
                    .each(function () {
                        var $target = WM.element(this),
                            _is;
                        if ($target.isolateScope) {
                            _is = $target.isolateScope();

                            if (_is.name) {
                                wid[_is.name] = _is;
                            }
                        }
                    });
                __s.currentItemWidgets = wid;
            }

            function postLinkFn($is, $el, attrs, listCtrl) {
                var $liScope,
                    $liTemplate,
                    variable,
                    _onDestroy,
                    handlers = [];

                variable = Utils.getVariableName($is);
                $liScope = createChildScope($is, $el, attrs);
                $is._items = [];
                $is.$liScope = $liScope;
                $is.variableInflight = false;
                $is.selectedItemWidgets = $is.multiselect ? [] : {}; // Array of objects containing widget's name - widget's scope map
                setListClass($is); //To add classes in studio mode

                if (CONSTANTS.isRunMode) {
                    if (!$is.groupby) {
                        liTemplateWrapper_start = '<li ng-repeat="item in fieldDefs track by $index" ng-focus="onFocus($event)" tabindex="0" class="app-list-item" ng-class="[itemsPerRowClass, _itemClass(this), {\'disable-item\': _disableItem(this)}]" ';
                        liTemplateWrapper_end   = ' ng-init="addCurrentItemWidgets(this);"></li>';
                        $liTemplate             = prepareLITemplate(listCtrl.$get('listTemplate'), attrs, false, $is.name);

                        $el.find('> [data-identifier=list]').append($liTemplate);
                        $el.find('> [data-identifier=list]').addClass('list-group');

                        $compile($liTemplate)($liScope);
                    }

                    //Add currentitem widgets on each template item scope
                    $liScope.addCurrentItemWidgets = function (__s) {
                        $timeout(function () {
                            $rs.$evalAsync(function () {
                                if ($is.groupby) {
                                    $el.find('li.app-list-item-group:nth-child(' + __s.item._groupIndex + ')').each(function () {
                                        WM.element(this).find('li.app-list-item:nth-child(' + (__s.$index + 2) + ')').each(function () {
                                            getCurrentItemWidgets(__s, WM.element(this));
                                        });
                                    });
                                } else {
                                    $el.find('li.app-list-item:nth-child(' + (__s.$index + 1) + ')')
                                        .each(function () {
                                            getCurrentItemWidgets(__s, WM.element(this));
                                        });
                                }
                            });
                        }, 0, false);
                    };

                    if (!$is.groupby && $is.enablereorder) {
                        configureDnD($el, $is);
                    }

                    $liScope.onFocus = function ($evt) {
                        $is.lastSelectedItem = WM.element($evt.target);
                    };

                    $is.$watch('binddataset', function (newVal) {
                        if (_.includes(newVal, 'selecteditem.')) {
                            LiveWidgetUtils.fetchDynamicData($is, function (data) {
                                onDataSetChange($is, $el, undefined, data, attrs, listCtrl);
                            });
                        }
                    });

                    setupEvtHandlers($is, $el, attrs);

                    $is.getWidgets = getWidgets.bind(undefined, $el);

                    $is.noDataFound = undefined === ($is.binddataset || $is.scopedataset);
                    handlers.push($rs.$on('toggle-variable-state', function (event, variableName, active) {
                        if (variable === variableName) {
                            $is.variableInflight = active;
                        }
                    }));
                    _onDestroy = onDestroy.bind(undefined, $is, $el, handlers);
                    $is.$on('$destroy', _onDestroy);
                    $el.on('$destroy', _onDestroy);
                } else {
                    $is.widgetProps.enablereorder.show = !$rs.isMobileApplicationType;
                    $el.find('.app-listtemplate').addClass($liScope.itemclass + ' ' + $liScope.itemsPerRowClass);
                }

                WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el, attrs, listCtrl), $is, notifyFor);

                defineSelectedItemProp($is, $el);
                // Select the given item
                $is.selectItem = function (item) {
                    toggleSelectedItem($is, $el, item, true);
                };
                // deselect the given item
                $is.deselectItem = function (item) {
                    toggleSelectedItem($is, $el, item, false);
                };
                //Empty the livelist content on clear
                $is.clear = function () {
                    _.set($is, '$liScope.fieldDefs', undefined);
                };
                //On pagination change through datanavigator
                $is._onPaginationchange = function (options) {
                    //On pagination change, scroll the page to top
                    if ($is.showNavigation) {
                        $is.$element.find('[data-identifier="list"]').scrollTop(0);
                    }
                    if ($is.onPaginationchange) {
                        $is.onPaginationchange(options);
                    }
                };

                // in the run mode navigation can not be changed dynamically
                // process the navigation type before the dataset is set.
                if (attrs.hasOwnProperty('shownavigation') && (attrs.shownavigation === 'true')) {
                    // for legacy applications
                    $is.navigation = NAVIGATION.BASIC;
                }
                onNavigationTypeChange($is, $is.navigation);

                WidgetUtilService.postWidgetCreate($is, $el, attrs);

                if (!attrs.widgetid && attrs.scopedataset) {
                    $is.$watch('scopedataset', function (nv) {
                        if (nv && !$is.dataset) {
                            updateFieldDefs($is, $el, nv);
                        }
                    }, true);
                }
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
                    'scopedataset'          : '=?',
                    'onClick'               : '&',
                    'onDblclick'            : '&',
                    'onMouseenter'          : '&',
                    'onMouseleave'          : '&',
                    'onEnterkeypress'       : '&',
                    'onSetrecord'           : '&',
                    'onBeforedatarender'    : '&',
                    'onPaginationchange'    : '&',
                    'onTap'                 : '&',
                    'onDoubletap'           : '&',
                    'onSelectionlimitexceed': '&'
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
 *                  Possible values are `None`, `Classic`, `Scroll`. <br>
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
