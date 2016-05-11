/*global WM, window, _, wm */

WM.module('wm.widgets.live')
    .run(["$templateCache", function ($templateCache) {
        "use strict";

        $templateCache.put("template/widget/livefilter/livefilter.html",
                '<form data-identifier="livefilter" class="app-livefilter panel app-panel clearfix liveform-inline align-{{captionalign}} position-{{captionposition}}" init-widget title="{{hint}}" data-ng-show="show" apply-styles>' +
                    '<div class="panel-heading" ng-if="title || subheading || iconclass">' +
                        '<h3 class="panel-title">' +
                            '<div class="pull-left"><i class="app-icon panel-icon {{iconclass}}" ng-show="iconclass"></i></div>' +
                            '<div class="pull-left">' +
                                '<div class="heading">{{title}}</div>' +
                                '<div class="description">{{subheading}}</div>' +
                            '</div>' +
                            '<div class="panel-actions">' +
                                '<button type="button" class="app-icon wi panel-action" data-ng-if="collapsible" title="{{::$root.appLocale.LABEL_COLLAPSE}}/{{::$root.appLocale.LABEL_EXPAND}}" data-ng-class="expanded ? \'wi-minus\': \'wi-plus\'" data-ng-click="expandCollapsePanel($event);"></button>' +
                            '</div>' +
                        '</h3>' +
                    '</div>' +
                    '<div data-ng-show="expanded" class="panel-body">' +
                        '<div data-identifier="filter-elements" ng-transclude></div>' +
                        '<div class="hidden-filter-elements"></div>' +
                        '<div class="basic-btn-grp form-action panel-footer clearfix"></div>' +
                    '</div>' +
                '</form>'
            );
    }]).directive('wmLivefilter', ['PropertiesFactory',
        '$rootScope',
        '$templateCache',
        'WidgetUtilService',
        '$compile',
        'CONSTANTS',
        'QueryBuilder',
        'Utils',
        'wmToaster',
        '$controller',
        'LiveWidgetUtils',
        function (PropertiesFactory, $rootScope, $templateCache, WidgetUtilService, $compile, CONSTANTS, QueryBuilder, Utils, wmToaster, $controller, LiveWidgetUtils) {
            "use strict";
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.livefilter', ['wm.layouts', 'wm.containers']),
                filterMarkup = '',
                notifyFor,
                FILTER_CONSTANTS = {
                    'EMPTY_KEY'   : 'EMPTY_NULL_FILTER',
                    'EMPTY_VALUE' : 'No Value',
                    'NULLEMPTY'   : ['null', 'empty'],
                    'NULL'        : 'null',
                    'EMPTY'       : 'empty',
                    'LABEL_KEY'   : 'key',
                    'LABEL_VALUE' : 'value'
                },
                getEnableEmptyFilter = function (enableemptyfilter) {
                    return enableemptyfilter && _.intersection(enableemptyfilter.split(','), FILTER_CONSTANTS.NULLEMPTY).length > 0;
                };
            if (CONSTANTS.isStudioMode) {
                notifyFor = {
                    'dataset': true,
                    'pagesize': true
                };
            } else {
                notifyFor = {
                    'dataset': true
                };
            }

            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    "onBeforeservicecall": "&",
                    "onSuccess": "&",
                    "onError": "&"
                },
                controller: function ($scope, $attrs) {
                    /*
                     * Extend the properties from the form controller exposed to end user in page script
                     * Kept in try/catch as the controller may not be available sometimes
                     */
                    if (CONSTANTS.isRunMode) {
                        try {
                            var filterController = $attrs.name + "Controller";
                            $controller(filterController, {$scope: $scope});
                        } catch (ignore) {
                        }
                    }
                    /* when the service call ended this function will be called */
                    var onResult = function (data, status) {
                        /* whether service call success or failure call this method*/
                        if (status) {
                            /*if service call is success call this method */
                            Utils.triggerFn($scope.onSuccess, {$data: data});
                        } else {
                            /* if service call fails call this method */
                            Utils.triggerFn($scope.onError, {$data: data});
                        }

                    };
                    $scope.dateTimeFormats = Utils.getDateTimeDefaultFormats();
                    $scope.isDateTime = Utils.getDateTimeTypes();
                    $scope.isUpdateMode = true;
                    $scope.__compileWithIScope = true;
                    $scope.clearFilter = function () {
                        WM.forEach($scope.formFields, function (filterField) {
                            //Added check for range field
                            if (!filterField.readonly && filterField.show) {
                                if (filterField.isRange) {
                                    filterField.minValue = undefined;
                                    filterField.maxValue = undefined;
                                } else {
                                    filterField.value = undefined;
                                }
                            }
                        });
                        /*Setting result to the default data*/
                        $scope.filter();
                    };
                    $scope.applyFilter = function (options) {
                        options = options || {};
                        options.page = options.page || 1;
                        options.orderBy = options.orderBy || $scope.orderBy || '';
                        $scope.filter(options);
                    };

                    $scope.filter = function (options) {
                        var formFields = {},
                            variable = $scope.Variables[$scope.variableName],
                            page = 1,
                            orderBy,
                            isValid,
                            dataModel = {},
                            MATCH_MODES = {
                                'BETWEEN'     : 'between',
                                'GREATER'     : 'greaterthanequal',
                                'LESSER'      : 'lessthanequal',
                                'NULL'        : 'null',
                                'EMPTY'       : 'empty',
                                'NULLOREMPTY' : 'nullorempty'
                            },
                            emptyFilterOptions = $scope.enableemptyfilter.split(',');
                        options = options || {};
                        page = options.page || page;
                        orderBy = options.orderBy || $scope.orderBy || '';
                        $scope.orderBy = orderBy; //Store the order by in scope. This can be used to retain the sort after filtering
                        /* Copy the values to be sent to the user as '$data' before servicecall */
                        _.each($scope.formFields, function (field) {
                            if (!field.isRange) {
                                dataModel[field.field] = {
                                    'value': field.value
                                };
                            } else {
                                dataModel[field.field] = {
                                    'minValue': field.minValue,
                                    'maxValue': field.maxValue
                                };
                            }
                        });
                        /*Perform this function for the event onBeforeservicecall*/
                        try {
                            isValid = $scope.onBeforeservicecall({$data: dataModel});
                            if (isValid === false) {
                                return;
                            }
                            if (isValid && isValid.error) {
                                wmToaster.show('error', 'ERROR', isValid.error);
                                return;
                            }
                            /*Update these values in the formFields with new reference, inorder to maintain the UI values*/
                            _.each($scope.formFields, function (filterField) {
                                if (!filterField.isRange) {
                                    filterField._value = dataModel[filterField.field].value;
                                } else {
                                    filterField._minValue = dataModel[filterField.field].minValue;
                                    filterField._maxValue = dataModel[filterField.field].maxValue;
                                }
                            });
                        } catch (err) {
                            if (err.message === 'Abort') {
                                return;
                            }
                        }
                        /* Construct the formFields Variable to send it to the queryBuilder */
                        WM.forEach($scope.formFields, function (filterField) {
                            var fieldValue,
                                matchMode,
                                minValue = filterField._minValue,
                                maxvalue = filterField._maxValue,
                                colName  = filterField.field;
                            /* if field is part of a related entity, column name will be 'entity.fieldName' */
                            if (filterField.isRelated) {
                                colName += '.' + filterField.lookupField;
                            }
                            if (filterField.isRange) {
                                /*Based on the min and max values, decide the matchmode condition*/
                                if (minValue && maxvalue) {
                                    fieldValue = [minValue, maxvalue];
                                    matchMode = MATCH_MODES.BETWEEN;
                                } else if (minValue) {
                                    fieldValue = minValue;
                                    matchMode = MATCH_MODES.GREATER;
                                } else if (maxvalue) {
                                    fieldValue = maxvalue;
                                    matchMode = MATCH_MODES.LESSER;
                                }
                                if (WM.isDefined(fieldValue)) {
                                    formFields[colName] = {
                                        'value'     : fieldValue,
                                        'matchMode' : matchMode,
                                        'logicalOp' : 'AND'
                                    };
                                }
                            } else {
                                switch (filterField.widget) {
                                case 'select':
                                case 'radioset':
                                    if (getEnableEmptyFilter($scope.enableemptyfilter) && filterField._value === FILTER_CONSTANTS.EMPTY_KEY) {
                                        if (_.intersection(emptyFilterOptions, FILTER_CONSTANTS.NULLEMPTY).length === 2) {
                                            matchMode = MATCH_MODES.NULLOREMPTY;
                                        } else if (_.includes(emptyFilterOptions, FILTER_CONSTANTS.NULL)) {
                                            matchMode = MATCH_MODES.NULL;
                                        } else if (_.includes(emptyFilterOptions, FILTER_CONSTANTS.EMPTY)) {
                                            matchMode = MATCH_MODES.EMPTY;
                                        }
                                        fieldValue = filterField._value;
                                    } else {
                                        if (filterField.type === 'boolean') {
                                            if (WM.isDefined(filterField._value) && filterField._value !== '') {
                                                fieldValue = JSON.parse(filterField._value);
                                            }
                                        } else {
                                            fieldValue = filterField._value;
                                        }
                                    }
                                    break;
                                case 'checkboxset':
                                    if (filterField._value && filterField._value.length) {
                                        fieldValue = filterField._value;
                                    }
                                    break;
                                case 'checkbox':
                                case 'toggle':
                                    if (WM.isDefined(filterField._value) && filterField._value !== '') {
                                        fieldValue = JSON.parse(filterField._value);
                                    }
                                    break;
                                default:
                                    fieldValue = filterField._value;
                                    break;
                                }
                                if (WM.isDefined(fieldValue) && fieldValue !== '' && fieldValue !== null) {
                                    formFields[colName] = {};
                                    if (matchMode) {
                                        formFields[colName].matchMode = matchMode;
                                        fieldValue = undefined;
                                    } else if (filterField.type === 'string' || filterField.isRelated) { //Only for string types and related fields, custom match modes are enabled.
                                        formFields[colName].matchMode = matchMode || filterField.matchmode || variable.matchMode;
                                    }
                                    formFields[colName].value     = fieldValue;
                                    formFields[colName].logicalOp = 'AND';
                                }
                            }
                        });

                        variable.update({
                            'filterFields'       : formFields,
                            'orderBy'            : orderBy,
                            'page'               : page,
                            'pagesize'           : $scope.pagesize || 20,
                            'skipDataSetUpdate' : true //dont update the actual variable dataset
                        }, function (data, propertiesMap, pageOptions) {
                            if (data.error) {
                                /*disable readonly and show the appropriate error*/
                                wmToaster.show('error', 'ERROR', (data.error));
                                onResult(data, false);
                            } else {
                                /*Set the response in "result" so that all widgets bound to "result" of the live-filter are updated.*/
                                $scope.result.data = data;
                                /*Create an object as required by the formFields for live-variable so that all further calls to getData take place properly.
                                 * This is used by widgets such as dataNavigator.*/
                                $scope.result.formFields = Utils.getClonedObject(formFields);
                                /*Set the paging options also in the result so that it could be used by the dataNavigator.
                                 * "currentPage" is set to "1" because each time the filter is applied, the dataNavigator should display results from the 1st page.*/
                                $scope.result.pagingOptions = {
                                    "dataSize": pageOptions.dataSize,
                                    "maxResults": $scope.pagesize || 20,
                                    "currentPage": page
                                };
                                /*Save the page options. When the filter dataSet changes, filter is applied with these options*/
                                $scope.result.options = {
                                    "page": page,
                                    "orderBy": orderBy
                                };
                                onResult(data, true);
                            }
                        }, function (error) {
                            wmToaster.show('error', 'ERROR', error);
                            onResult(error, false);
                        });
                    };
                    $scope.constructDefaultData = function (dataset) {
                        var columnObj = dataset.propertiesMap.columns,
                            colDefArray = [],
                            numColumns = Math.min(columnObj.length, 5),
                            fieldTypeWidgetTypeMap = LiveWidgetUtils.getFieldTypeWidgetTypesMap();
                        _.each(columnObj, function (column, index) {
                            var colDef = {
                                'field'             :   column.fieldName,
                                'displayname'       :   Utils.prettifyLabel(column.fieldName),
                                'widget'            :   fieldTypeWidgetTypeMap[column.type][0],
                                'isRange'           :   false,
                                'filterOn'          :   '',
                                'lookupType'        :   '',
                                'lookupField'       :   '',
                                'minPlaceholder'    :   '',
                                'maxPlaceholder'    :   '',
                                'placeholder'       :   '',
                                'datepattern'       :   '',
                                'class'             :   '',
                                'width'             :   '',
                                'height'            :   '',
                                'textAlignment'     :   '',
                                'backgroundColor'   :   '',
                                'required'          :   '',
                                'minValue'          :   '',
                                'maxValue'          :   '',
                                'multiple'          :   '',
                                'value'             :   '',
                                'type'              :   column.type,
                                'step'              :   LiveWidgetUtils.getStepValue(column.type),
                                'ismeridian'        :   '',
                                'isPrimaryKey'      :   column.isPrimaryKey,
                                'generator'         :   column.generator,
                                'show'              :   true,
                                'pcDisplay'         :   true,
                                'mobileDisplay'     :   true
                            };
                            if (column.isRelated) {
                                /* otherwise build object with required configuration */
                                colDef.field = column.fieldName.charAt(0).toLowerCase() + column.fieldName.slice(1);
                                colDef.displayname = Utils.prettifyLabel(colDef.field);
                                colDef.isRelated = true;
                                colDef.lookupType = column.relatedEntityName;
                                colDef.lookupField = '';
                                _.each(column.columns, function (subcolumn) {
                                    if (subcolumn.isPrimaryKey) {
                                        colDef.lookupField = subcolumn.fieldName;
                                    }
                                });
                                colDef.relatedEntityName = column.relatedEntityName;
                            } else {
                                colDef.isRelated = false;
                            }
                            colDefArray.push(colDef);
                            /*Return false will break the loop after processing numColumns*/
                            return (index + 1) < numColumns;
                        });
                        return colDefArray;
                    };
                    /*Calls the filter function if default values are present*/
                    $scope.filterOnDefault = function () {
                        /*Check if default value is present for any filter field*/
                        var defaultObj = _.find($scope.formFields, function (obj) {
                            return obj.value;
                        });
                        /*If default value exists and data is loaded, apply the filter*/
                        if (defaultObj && $scope.result) {
                            $scope.filter();
                        }
                    };
                    $scope.expandCollapsePanel = function ($event) {
                        if ($scope.collapsible && CONSTANTS.isRunMode) {
                            if ($scope.expanded) {
                                if ($scope.onCollapse) {
                                    $scope.onCollapse({$event: $event, $scope: this});
                                }
                            } else {
                                if ($scope.onExpand) {
                                    $scope.onExpand({$event: $event, $scope: this});
                                }
                            }
                            /* flip the active flag */
                            $scope.expanded = !$scope.expanded;
                        }
                    };
                },
                template: function (element) {
                    filterMarkup = element.html();
                    return $templateCache.get("template/widget/livefilter/livefilter.html");
                },
                compile: function (tElement, tAttr) {
                    tAttr.gridColumnMarkup = filterMarkup;

                    return {
                        pre: function (iScope, element) {
                            var elScope = element.scope();
                            if (CONSTANTS.isStudioMode) {
                                iScope.widgetProps = Utils.getClonedObject(widgetProps);
                            } else {
                                iScope.widgetProps = widgetProps;
                            }
                            iScope.filterElement = element;
                            iScope.Variables = elScope.Variables;
                            iScope.Widgets = elScope.Widgets;
                            //Map for filterFields with filter key as key
                            iScope.filterFields = {};
                        },
                        post: function (scope, element, attrs) {
                            if (scope.expanded === undefined) {
                                scope.expanded = true;
                            }

                            var variableRegex = /^bind:Variables\.(.*)\.dataSet$/,
                                handlers = [],
                                defaultButtonsArray = LiveWidgetUtils.getLiveWidgetButtons('LIVEFILTER');
                            scope.filterContainer = element;
                            scope.primaryKey = null;

                            scope.getActiveLayout = function () {
                                return LiveWidgetUtils.getColumnCountByLayoutType(scope.layout);
                            };
                            /*Function to set the dataSet of the fields */
                            function setFieldDataSet(filterField, data, aliasColumn) {
                                var emptySupportWidgets = ['select', 'radioset'],
                                    isEnableEmptyFilter = getEnableEmptyFilter(scope.enableemptyfilter),
                                    emptyOption         = {};
                                filterField.dataset = [];
                                if (isEnableEmptyFilter && _.includes(emptySupportWidgets, filterField.widget) && !filterField.isRange) {
                                    /*If empty option is selected, push an empty object in to dataSet*/
                                    emptyOption[FILTER_CONSTANTS.LABEL_KEY]   = FILTER_CONSTANTS.EMPTY_KEY;
                                    emptyOption[FILTER_CONSTANTS.LABEL_VALUE] = FILTER_CONSTANTS.EMPTY_VALUE;
                                    filterField.dataset.push(emptyOption);
                                }
                                _.each(data.content, function (key) {
                                    var value  = key[aliasColumn],
                                        option = {};
                                    if (value !== null && value !== '') {
                                        option[FILTER_CONSTANTS.LABEL_KEY]   = value;
                                        option[FILTER_CONSTANTS.LABEL_VALUE] = value;
                                        filterField.dataset.push(option);
                                    }
                                });
                                filterField.datafield = FILTER_CONSTANTS.LABEL_KEY;
                                if (filterField.widget === 'typeahead') { //For search widget, set search key and display label
                                    filterField.searchkey    = FILTER_CONSTANTS.LABEL_VALUE;
                                    filterField.displaylabel = FILTER_CONSTANTS.LABEL_VALUE;
                                } else {
                                    filterField.displayfield = FILTER_CONSTANTS.LABEL_VALUE;
                                }
                            }
                            /*Function to fetch the data for dataset widgets*/
                            function updateAllowedValues() {
                                var variable = scope.Variables[scope.variableName];
                                if (!variable) {
                                    return;
                                }
                                _.forEach(scope.formFields, function (filterField) {
                                    var query,
                                        tableName,
                                        columns,
                                        aliasColumn,
                                        fieldColumn,
                                        dataSetWidgetTypes = Utils.getDataSetWidgets();

                                    fieldColumn = filterField.field;
                                    if (dataSetWidgetTypes[filterField.widget] && !filterField.tempDataset) {
                                        if (filterField.isRelated) {
                                            tableName   = filterField.lookupType;
                                            columns     = filterField.lookupField;
                                            aliasColumn = columns.replace('.', '_');
                                            query       = QueryBuilder.getQuery({
                                                'tableName' : tableName,
                                                'columns'   : [' DISTINCT ' + columns + ' AS ' + aliasColumn]
                                            });
                                        } else {
                                            aliasColumn = fieldColumn;
                                            query       = QueryBuilder.getQuery({
                                                'tableName' : scope.result.propertiesMap.entityName,
                                                'columns'   : [' DISTINCT ' + fieldColumn + ' AS ' + filterField.field]
                                            });
                                        }
                                        /* Sending size = 500 because we want to populate all data values in widgets
                                         * like select box, checkbox set etc.
                                         * NOTE: Currently backend is returning max. 100 records for any page size
                                         * more than 100. So this size will need to change once backend is fixed to
                                         * return all records instead of max 100 records in this case. */
                                        QueryBuilder.executeQuery({
                                            'databaseName' : variable.liveSource,
                                            'query'        : query,
                                            'page'         : 1,
                                            'size'         : 500,
                                            'nativeSql'    : false,
                                            'prefabName'   : variable.prefabName
                                        }, function (data) {
                                            setFieldDataSet(filterField, data, aliasColumn);
                                        });
                                    }
                                });
                            }
                            /*Function to retrieve the data of the cascading filter, when filterOnField option is given*/
                            function applyFilterOnField() {
                                var variable           = scope.Variables[scope.variableName],
                                    dataSetWidgetTypes = Utils.getDataSetWidgets();
                                if (!variable) {
                                    return;
                                }
                                _.forEach(scope.formFields, function (filterField) {
                                    var index,
                                        filterOn = filterField.filterOn;
                                    if (!dataSetWidgetTypes[filterField.widget] || filterField.tempDataset) {
                                        return;
                                    }
                                    if (filterOn && filterOn !== '' && filterOn !== filterField.field) {
                                        index = _.findIndex(scope.formFields, function (field) {
                                            return field.field === filterOn;
                                        });
                                        scope.$watch('formFields[' + index + '].value', function (newVal, oldVal) {
                                            var filterFields = {},
                                                query,
                                                fieldColumn;
                                            if (newVal !== oldVal) {
                                                filterFields = newVal ? [{
                                                    'column' : [filterOn],
                                                    'value'  : newVal
                                                }] : [];
                                                fieldColumn = filterField.field;
                                                query       = QueryBuilder.getQuery({
                                                    'tableName'    : scope.result.propertiesMap.entityName,
                                                    'columns'      : [' DISTINCT ' + fieldColumn + ' AS ' + filterField.field],
                                                    'filterFields' : filterFields
                                                });

                                                QueryBuilder.executeQuery({
                                                    'databaseName' : variable.liveSource,
                                                    'query'        : query,
                                                    'page'         : 1,
                                                    'size'         : 500,
                                                    'nativeSql'    : false,
                                                    'prefabName'   : variable.prefabName
                                                }, function (data) {
                                                    setFieldDataSet(filterField, data, fieldColumn);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                            function propertyChangeHandler(key, newVal, oldVal) {
                                switch (key) {
                                case "dataset":
                                    var fieldsObj,
                                        buttonsObj,
                                        designerObj,
                                        fieldTypeWidgetTypeMap = LiveWidgetUtils.getFieldTypeWidgetTypesMap(),
                                        elScope = element.scope();
                                    /*If properties map is populated and if columns are presented for filter construction*/
                                    if (newVal && newVal.propertiesMap && WM.isArray(newVal.propertiesMap.columns)) {
                                        if (!oldVal || !oldVal.propertiesMap || !WM.equals(newVal.propertiesMap.columns, oldVal.propertiesMap.columns) || !WM.equals(newVal.data, oldVal.data)) {
                                            /* old data cached to avoid live variable data's effect on filter.
                                             * The filter is not depending on variable's data, as filter is making explicit call through QUERY
                                             * Hence, to avoid flicker when data from explicit call is rendered, the live variable's data is ignored
                                             */
                                            scope.result = scope.result || {
                                                data: [],
                                                pagingOptions: newVal.pagingOptions,
                                                options: { /*Set default options with page 1*/
                                                    page: 1
                                                }
                                            };
                                            scope.variableName = scope.binddataset.match(variableRegex)[1];
                                            scope.variableObj = elScope.Variables && elScope.Variables[scope.variableName];
                                            scope.variableType = scope.variableObj.category;
                                            /*Set the "variableName" along with the result so that the variable could be used by the data navigator during navigation.*/
                                            scope.result.variableName = scope.variableName;
                                            scope.result.propertiesMap = newVal.propertiesMap;
                                            scope.result.widgetName = scope.name;
                                            scope.result.isBoundToFilter = true;
                                            /*transform the data to filter consumable data*/
                                            fieldsObj = scope.constructDefaultData(newVal);
                                            /*Set the type of the column to the default variable type*/
                                            if (scope.formFields && newVal && newVal.propertiesMap) {
                                                scope.formFields.forEach(function (filterField) {
                                                    var filterObj = _.find(newVal.propertiesMap.columns, function (obj) {
                                                        return obj.fieldName === filterField.field;
                                                    });
                                                    if (filterObj) {
                                                        filterField.type = filterObj.type;
                                                        /*For backward compatibility of datetime column types, set widget to datetime*/
                                                        if (CONSTANTS.isStudioMode && filterField.type === 'datetime' && (!filterField.widget || filterField.widget === 'text')) {
                                                            filterField.widget = fieldTypeWidgetTypeMap[filterField.type][0];
                                                            scope.$root.$emit("set-markup-attr", scope.widgetid, {
                                                                'type': filterField.type,
                                                                'widget': filterField.widget
                                                            }, 'wm-filter-field[field=' + filterField.field + ']');
                                                        }
                                                    }
                                                });

                                                //This creates filterFields as map with name of the field as key
                                                scope.formFields.map(function (field) {
                                                    scope.filterFields[field.key] = field;
                                                });
                                            }
                                            buttonsObj = defaultButtonsArray;

                                            /*On load check if default value exists and apply filter.
                                            * Call the filter with the result options*/
                                            scope.filter(scope.result.options);
                                        }
                                        /* call method to update allowed values for select type filter fields */
                                        updateAllowedValues();
                                        applyFilterOnField();
                                    } else if (!newVal && CONSTANTS.isStudioMode) { /*Clear the variables when the live-filter has not been bound.*/
                                        //element.empty();
                                        scope.variableName = '';
                                        scope.result = '';
                                        scope.formFields = '';
                                        scope.filterConstructed = false;
                                        scope.fieldObjectCreated = false;
                                        fieldsObj = [];
                                        buttonsObj = [];
                                    }
                                    if (CONSTANTS.isStudioMode && scope.newcolumns && fieldsObj) {
                                        scope.newcolumns = false;
                                        designerObj = {
                                            widgetName: scope.name,
                                            fieldDefs: fieldsObj,
                                            buttonDefs: buttonsObj,
                                            variableName: scope.variableName,
                                            scopeId: scope.$id,
                                            numColumns: scope.getActiveLayout(),
                                            bindDataSetChanged: true,
                                            widgettype: scope.widgettype
                                        };
                                        scope.$root.$emit('filterDefs-modified', designerObj);
                                    }
                                    break;
                                case "pagesize":
                                    if (WM.isDefined(scope.variableName) && WM.isDefined(newVal) && !WM.equals(newVal, oldVal)) {
                                        scope.filter();
                                    }
                                    break;
                                }
                            }

                            /* register the property change handler */
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                            /* event emitted on building new markup from canvasDom */
                            handlers.push($rootScope.$on('compile-filters', function (event, scopeId, markup, filterObj, variableName, fromDesigner) {

                                if (scope.$id === scopeId) {
                                    var markupObj = WM.element('<div>' + markup + '</div>'),
                                        fieldsObj = markupObj.find('wm-layoutgrid'),
                                        actionsObj = markupObj.find('wm-filter-action');

                                    scope.filterConstructed = fromDesigner;
                                    scope.variableName = variableName;
                                    scope.formFields = undefined;
                                    scope.buttonArray = undefined;

                                    element.find('[data-identifier="filter-elements"]').empty();
                                    element.find('.hidden-filter-elements').empty();
                                    element.find('.basic-btn-grp').empty();

                                    /* if layout grid template found, simulate canvas dom addition of the elements */
                                    if (fieldsObj && fieldsObj.length) {
                                        $rootScope.$emit('prepare-element', fieldsObj, function () {
                                            element.find('[data-identifier="filter-elements"]').append(fieldsObj);
                                            element.find('.basic-btn-grp').append(actionsObj);
                                            $compile(fieldsObj)(scope);
                                            $compile(actionsObj)(scope);
                                        });
                                    } else {
                                        /* else compile and add the form fields */
                                        fieldsObj = markupObj.find('wm-filter-field');
                                        element.find('[data-identifier="filter-elements"]').append(fieldsObj);
                                        element.find('.basic-btn-grp').append(actionsObj);
                                        $compile(fieldsObj)(scope);
                                        $compile(actionsObj)(scope);
                                    }
                                    /*To get dataset up on saving designer dialog for fields with widget type as checkboxsex, radioset */
                                    updateAllowedValues();
                                    applyFilterOnField();
                                    scope.filterConstructed = true;
                                }
                            }));
                            scope.$on("$destroy", function () {
                                handlers.forEach(Utils.triggerFn);
                            });

                            //Will be called after setting filter property.
                            scope.reRender = function () {
                                scope.filter(scope.result.options);
                            };

                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
                }
            };
        }])
    .directive("wmFilterField", ["$compile", "Utils", "CONSTANTS", "BindingManager", "LiveWidgetUtils", "WidgetUtilService", function ($compile, Utils, CONSTANTS, BindingManager, LiveWidgetUtils, WidgetUtilService) {
        'use strict';
        return {
            "restrict": 'E',
            "scope": {},
            "template": "<div init-widget data-role='filter-field'></div>",
            "replace": true,
            "compile": function (tElement) {
                return {
                    "pre": function (scope, element, attrs) {
                        LiveWidgetUtils.preProcessFields('wm-filter-field', scope, attrs, tElement);
                    },
                    "post": function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with live filter scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        scope.parentIsolateScope = (element.parent() && element.parent().length > 0) ? element.parent().closest('[data-identifier="livefilter"]').isolateScope() : scope.$parent;

                        /*
                         * Class : FilterField
                         * Discription : FilterField is intermediate class which extends FieldDef base class
                         * */
                        scope.FilterField = function () {
                        };

                        scope.FilterField.prototype = new wm.baseClasses.FieldDef();
                        var expr,
                            exprWatchHandler,
                            dataSetWatchHandler,
                            variable,
                            template,
                            index,
                            defaultVal,
                            parentIsolateScope = scope.parentIsolateScope,
                            columnsDef = new scope.FilterField(),
                            columnsDefProps = WM.extend(LiveWidgetUtils.getColumnDef(attrs), {
                                'field'             : attrs.field || attrs.binding,
                                'filterOn'          : attrs.filterOn,
                                'isRange'           : attrs.isRange === "true" || attrs.isRange === true,
                                'isRelated'         : attrs.isRelated === "true" || attrs.isRelated === true,
                                'lookupType'        : attrs.lookupType,
                                'lookupField'       : attrs.lookupField,
                                'relatedEntityName' : attrs.relatedEntityName
                            });

                        WM.extend(columnsDef, columnsDefProps);
                        columnsDef.key = columnsDef.field;
                        /*Set below properties on the scope, as post widget create is not called for this directive */
                        scope.required = columnsDef.required;
                        scope.readonly = columnsDef.readonly;
                        scope.disabled = columnsDef.disabled;
                        //This is used to call base set and get methods on widgets
                        scope.FilterField.prototype.$is = parentIsolateScope;
                        /*Support for old projects which were using value for default value*/
                        columnsDefProps.defaultvalue = attrs.defaultvalue || attrs.value;
                        /*Set the default value*/
                        if (columnsDef.defaultvalue) {
                            /*If the default value is bound variable, keep watch on the expression*/
                            if (Utils.stringStartsWith(columnsDef.defaultvalue, 'bind:') && CONSTANTS.isRunMode) {
                                expr = columnsDef.defaultvalue.replace('bind:', '');
                                if (parentIsolateScope.Variables && !Utils.isEmptyObject(parentIsolateScope.Variables) && parentIsolateScope.$eval(expr)) {
                                    defaultVal = scope.$eval(expr);
                                    columnsDef.value = defaultVal;
                                    if (columnsDef.isRange) {
                                        columnsDef.minValue = defaultVal;
                                        columnsDef.maxValue = defaultVal;
                                    }
                                } else {
                                    exprWatchHandler = BindingManager.register(parentIsolateScope, expr, function (newVal) {
                                        parentIsolateScope.formFields[index].value = newVal;
                                        if (columnsDef.isRange) {
                                            parentIsolateScope.formFields[index].minValue = newVal;
                                            parentIsolateScope.formFields[index].maxValue = newVal;
                                        }
                                        /*Apply the filter after the default value change*/
                                        parentIsolateScope.filterOnDefault();
                                    }, {"deepWatch": true, "allowPageable": true, "acceptsArray": false});
                                }
                            } else {
                                defaultVal = columnsDef.defaultvalue;
                                /*Assigning 'defaultVal' only in run mode as it can be evaluated only in run mode*/
                                if (CONSTANTS.isRunMode) {
                                    defaultVal = LiveWidgetUtils.getDefaultValue(defaultVal, columnsDef.type);
                                }
                                columnsDef.value = defaultVal;
                                if (columnsDef.isRange) {
                                    columnsDef.minValue = defaultVal;
                                    columnsDef.maxValue = defaultVal;
                                }
                            }
                        }
                        if (attrs.dataset) {
                            /*Store the dataset in tempdataset. If tempdataset is undefined, fetch the default values for field*/
                            columnsDef.tempDataset = attrs.dataset;
                            if (Utils.stringStartsWith(attrs.dataset, 'bind:') && CONSTANTS.isRunMode) {
                                expr = attrs.dataset.replace('bind:', '');
                                /*Watch on the bound variable. dataset will be set after variable is populated.*/
                                dataSetWatchHandler = parentIsolateScope.$watch(expr, function (newVal) {
                                    variable = parentIsolateScope.Variables[expr.split('.')[1]];
                                    if (WM.isObject(variable)) {
                                        if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                                            parentIsolateScope.formFields[index].dataset = newVal.content;
                                        } else if (variable.category === "wm.LiveVariable") {
                                            parentIsolateScope.formFields[index].dataset = newVal.data;
                                        } else {
                                            parentIsolateScope.formFields[index].dataset = newVal;
                                        }
                                        /* fallback to set datafield to 'All Fields' for backward compatibility */
                                        if (!attrs.datafield) {
                                            parentIsolateScope.formFields[index].datafield = "All Fields";
                                        }
                                    }
                                });
                            } else {
                                columnsDef.dataset = attrs.dataset;
                            }
                        }
                        scope.fieldDefConfig = columnsDef;
                        parentIsolateScope.formFields = parentIsolateScope.formFields || [];
                        parentIsolateScope.columnsDefCreated = true;
                        index = parentIsolateScope.formFields.push(columnsDef) - 1;

                        /* this condition will run for:
                         *  1. PC view in STUDIO mode
                         *  2. Mobile/tablet view in RUN mode
                         */
                        if (CONSTANTS.isRunMode) {
                            if (Utils.isMobile()) {
                                if (!columnsDef.mobileDisplay) {
                                    return;
                                }
                            } else {
                                if (!columnsDef.pcDisplay) {
                                    return;
                                }
                            }
                        }
                        if (!CONSTANTS.isRunMode || columnsDef.show) {
                            template = LiveWidgetUtils.getTemplate(columnsDef, index, parentIsolateScope.captionposition);
                            element.html(template);
                            $compile(element.contents())(parentIsolateScope);
                        } else {
                            template = LiveWidgetUtils.getHiddenTemplate(columnsDef, index);
                            element.closest('[data-identifier="livefilter"]').find('> .hidden-filter-elements').append($compile(template)(parentIsolateScope));
                        }

                        parentIsolateScope.$on('$destroy', function () {
                            if (exprWatchHandler) {
                                exprWatchHandler();
                            }
                            if (dataSetWatchHandler) {
                                dataSetWatchHandler();
                            }
                        });

                        // when the filter-field element is removed, remove the corresponding entry from parentIScope.formFields
                        element.on('$destroy', function () {
                            _.pullAt(parentIsolateScope.formFields, _.indexOf(parentIsolateScope.formFields, columnsDef));
                        });
                        WidgetUtilService.registerPropertyChangeListener(LiveWidgetUtils.fieldPropertyChangeHandler.bind(undefined, scope, element, attrs, parentIsolateScope, index), scope, undefined);

                        if (!scope.hasOwnProperty('datavalue')) {
                            Object.defineProperty(scope, 'datavalue', {
                                get: function () {
                                    return _.get(parentIsolateScope, ['formFields', [index], 'value']);
                                },
                                set: function (val) {
                                    _.set(parentIsolateScope, ['formFields', [index], 'value'], val);
                                }
                            });
                        }
                    }
                };
            }
        };
    }])
    .directive('wmFilterAction', ['$compile', 'LiveWidgetUtils', function ($compile, LiveWidgetUtils) {
        'use strict';

        return {
            "restrict": 'E',
            "scope": true,
            "template": '',
            "replace": true,
            "compile": function () {
                return {
                    "post": function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with live filter scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        scope.parentIsolateScope = (element.parent() && element.parent().length > 0) ? element.parent().closest('[data-identifier="livefilter"]').isolateScope() : scope.$parent;

                        var buttonTemplate, index, buttonDef = WM.extend(LiveWidgetUtils.getButtonDef(attrs), {
                            /*iconame support for old projects*/
                            'iconname': attrs.iconname,
                            'type': 'button'
                        });
                        scope.parentIsolateScope.buttonArray = scope.parentIsolateScope.buttonArray || [];
                        index = scope.parentIsolateScope.buttonArray.push(buttonDef) - 1;
                        scope.parentIsolateScope.columnsDefCreated = true;

                        buttonTemplate = '<wm-button caption="{{buttonArray[' + index + '].displayName}}" show="{{buttonArray[' + index + '].show}}" ' +
                            'class="{{buttonArray[' + index + '].class}}" iconclass="{{buttonArray[' + index + '].iconclass}}"' +
                            'on-click="' + buttonDef.action + '" type="{{buttonArray[' + index + '].type}}" ></wm-button>';
                        element.closest('[data-identifier="livefilter"]').find('.basic-btn-grp').append($compile(buttonTemplate)(scope.parentIsolateScope));
                        $compile(element.contents())(scope.parentIsolateScope);
                        //Removing the default template for the directive
                        element.remove();
                    }
                };
            }
        };
    }]);
/**
 * @ngdoc directive
 * @name wm.widgets.live.directive:wmLivefilter
 * @restrict E
 *
 * @description
 * The 'wmLivefilter' directive defines a live filter in the layout.
 *
 * @scope
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $templateCache
 * @requires Variables
 * @requires QueryBuilder
 * @requires $compile
 * @requires $rootScope
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the filter widget.
 * @param {string=} width
 *                  Width of the filter widget.
 * @param {string=} height
 *                  Height of the filter widget.
 * @param {string=} scopedataset
 *                  This property sets a variable to populate the data required to display the list of values.
 * @param {string=} dataset
 *                  This property sets the data to show in the filter. <br>
 *                  This is a bindable property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the filter on the web page. <br>
 *                  default value: `true`.
 * @param {string=} horizontalalign
 *                  This property used to set text alignment horizontally. <br>
 *                  Possible values are `left`, `center` and `right`.
 *
 * @example
 <example module="wmCore">
 <file name="index.html">
 <wm-livefilter>
 </wm-livefilter>
 </file>
 </example>
 */

