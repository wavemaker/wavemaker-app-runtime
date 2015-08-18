/*global WM, window */

WM.module('wm.widgets.live')
    .run(["$templateCache", '$rootScope', function ($templateCache, $rootScope) {
        "use strict";

        $templateCache.put("template/widget/livefilter/livefilter.html",
            '<div data-identifier="livefilter" class="app-livefilter clearfix" init-widget title="{{hint}}" data-ng-show="show" ' +
                $rootScope.getWidgetStyles() +
                '><div data-identifier="filter-elements" ng-transclude></div>' +
                '<div class="basic-btn-grp form-action clearfix app-button-group" style="text-align: right;"></div>' +
                '</div>'
            );
    }]).directive('wmLivefilter', ['PropertiesFactory',
        '$rootScope',
        '$templateCache',
        'WidgetUtilService',
        '$compile',
        'CONSTANTS',
        'QueryBuilder',
        'Variables',
        '$filter',
        'Utils',
        function (PropertiesFactory, $rootScope, $templateCache, WidgetUtilService, $compile, CONSTANTS, QueryBuilder, Variables, $filter, Utils) {
            "use strict";
            var widgetProps = PropertiesFactory.getPropertiesOf("wm.livefilter", ["wm.layouts", "wm.containers"]),
                filterMarkup = '',
                notifyFor;
            if (CONSTANTS.isStudioMode) {
                notifyFor = {
                    'dataset': true,
                    'layout': true,
                    'pagesize': true
                };
            } else {
                notifyFor = {
                    'dataset': true,
                    'layout': true
                };
            }

            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {},
                controller: function ($scope) {
                    $scope.dateTimeFormats = Utils.getDateTimeDefaultFormats();
                    $scope.isDateTime = Utils.getDateTimeTypes();
                    $scope.isUpdateMode = true;
                    $scope.getWidgetType = function (type) {
                        var widgetType;
                        switch (type) {
                        case "date":
                            widgetType = "date";
                            break;
                        case "time":
                            widgetType = "time";
                            break;
                        case "datetime":
                            widgetType = "datetime";
                            break;
                        case "boolean":
                            widgetType = "checkbox";
                            break;
                        default:
                            widgetType = "text";
                            break;
                        }
                        return widgetType;
                    };
                    $scope.__compileWithIScope = true;
                    $scope.clearFilter = function () {
                        WM.forEach($scope.formFields, function (filterField) {
                            //Added check for range field
                            if (!filterField.readonly && filterField.show) {
                                if (filterField.isRange) {
                                    filterField.minValue = '';
                                    filterField.maxValue = '';
                                } else {
                                    filterField.value = '';
                                }
                            }
                        });
                        /*Setting result to the default data*/
                        $scope.orderBy = '';
                        $scope.filter();
                    };
                    $scope.applyFilter = function (options) {
                        options = options || {};
                        options.page = options.page || 1;
                        options.orderBy = options.orderBy || $scope.orderBy || '';
                        $scope.filter(options);
                    };

                    $scope.filter = function (options) {
                        var formFields = [],
                            query,
                            variable = $scope.Variables[$scope.variableName],
                            page = 1,
                            orderBy,
                            ORACLE_DB_SYSTEM = "oracle",
                            DB_SYS_KEY = "dbSystem",
                            isOracleDbSystem = function () {
                                return variable && variable[DB_SYS_KEY] && variable[DB_SYS_KEY].toLowerCase() === ORACLE_DB_SYSTEM;
                            };


                        options = options || {};
                        page = options.page || page;
                        orderBy = options.orderBy || "";
                        $scope.orderBy = options.orderBy;
                        orderBy = orderBy.split(",").join(" ");
                        WM.forEach($scope.formFields, function (filterField) {
                            var fieldValue,
                                noQuotes = false,
                                minValue = filterField.minValue,
                                maxvalue = filterField.maxValue,
                                colName = variable.getModifiedFieldName(filterField.field);
                            /* if field is part of a related entity, column name will be 'entity.fieldName' */
                            if (filterField.isRelated) {
                                colName += '.' + filterField.lookupField;
                            }
                            if (filterField.isRange) {
                                if ($scope.isDateTime[filterField.widget]) {
                                    minValue = $filter('date')(minValue, $scope.dateTimeFormats[filterField.widget]);
                                    maxvalue = $filter('date')(maxvalue, $scope.dateTimeFormats[filterField.widget]);
                                }
                                if (minValue && maxvalue) {
                                    formFields.push({
                                        clause: "('" + minValue + "'<=" + colName + " AND " + colName + "<='" + maxvalue + "')"
                                    });
                                } else if (minValue) {
                                    formFields.push({
                                        clause: "('" + minValue + "'<=" + colName + ")"
                                    });
                                } else if (maxvalue) {
                                    formFields.push({
                                        clause: "(" + colName + "<='" + maxvalue + "')"
                                    });
                                }
                            } else {
                                switch (filterField.widget) {
                                case 'select':
                                case 'radioset':
                                    if (filterField.type === "boolean") {
                                        if (WM.isDefined(filterField.value) && !WM.isString(filterField.value)) {
                                            fieldValue = filterField.value;
                                        }
                                        noQuotes = true;
                                    } else {
                                        fieldValue = filterField.value;
                                    }
                                    break;
                                case 'checkboxset':
                                    if (filterField.value && filterField.value.length) {
                                        fieldValue = filterField.value;
                                    }
                                    break;
                                case 'date':
                                case 'time':
                                    if (filterField.value) {
                                        fieldValue = $filter('date')(filterField.value, $scope.dateTimeFormats[filterField.widget]);
                                    }
                                    break;
                                case 'datetime':
                                    if (filterField.value) {
                                        /* Case: if the database type is oracle, for 'datetime' fields append native 'toDate' function in the query */
                                        if (isOracleDbSystem()) {
                                            fieldValue = $filter('date')(filterField.value, $scope.dateTimeFormats[filterField.widget + "_oracle"]);
                                            fieldValue = "to_date('" + fieldValue + "', 'YYYY-MM-DD HH24:MI:SS')";
                                            noQuotes = true;
                                        } else {
                                            fieldValue = $filter('date')(filterField.value, $scope.dateTimeFormats[filterField.widget]);
                                        }
                                    }
                                    break;
                                case 'checkbox':
                                    if (WM.isDefined(filterField.value) && !WM.isString(filterField.value)) {
                                        fieldValue = filterField.value;
                                    }
                                    noQuotes = true;
                                    break;
                                default:
                                    fieldValue = filterField.value;
                                    break;
                                }
                                if (WM.isDefined(fieldValue) && fieldValue !== '' && fieldValue !== null) {
                                    formFields.push({
                                        column: colName,
                                        value: fieldValue,
                                        noQuotes: noQuotes
                                    });
                                }
                            }
                        });

                        query = QueryBuilder.getQuery({
                            "tableName": $scope.result.propertiesMap.entityName,
                            "filterFields": formFields,
                            "orderby": orderBy
                        });

                        /* Sending size = variable.maxResults because the number of records
                         * should be fetched according to the page size of the widget bound
                         * to result of livefilter. */
                        QueryBuilder.executeQuery({
                            "databaseName": variable.liveSource,
                            "query": query,
                            "page": page,
                            "size": $scope.pagesize || 20,
                            "nativeSql": false,
                            "prefabName": variable.prefabName
                        }, function (data) {
                            var tempObj = {};
                            /*Set the response in "result" so that all widgets bound to "result" of the live-filter are updated.*/
                            $scope.result.data = data.content;
                            /*Create an object as required by the formFields for live-variable so that all further calls to getData take place properly.
                            * This is used by widgets such as dataNavigator.*/
                            WM.forEach(formFields, function (filterField) {
                                tempObj[filterField.column] = {};
                                tempObj[filterField.column]['value'] = filterField.value;
                            });
                            $scope.result.formFields = tempObj;
                            /*Set the paging options also in the result so that it could be used by the dataNavigator.
                            * "currentPage" is set to "1" because each time the filter is applied, the dataNavigator should display results from the 1st page.*/
                            $scope.result.pagingOptions = {
                                "dataSize": data.totalElements,
                                "maxResults": $scope.pagesize || 20,
                                "currentPage": page
                            };
                        });
                    };
                    $scope.constructDefaultData = function (dataset) {
                        var columnObj = dataset.propertiesMap.columns,
                            colDef,
                            colDefArray = [],
                            column,
                            numColumns = Math.min(columnObj.length, 5),
                            index;
                        for (index = 0; index < numColumns; index++) {
                            column = columnObj[index];
                            colDef = {};
                            colDef.field = column.fieldName;
                            colDef.displayName = Utils.prettifyLabel(column.fieldName);
                            colDef.widget = $scope.getWidgetType(column.type);
                            colDef.isRange = false;
                            colDef.filterOn = column.fieldName;
                            colDef.lookupType = '';
                            colDef.lookupField = '';
                            colDef.minPlaceholder = '';
                            colDef.maxPlaceholder = '';
                            colDef.placeholder = '';
                            colDef.datepattern = '';
                            colDef.class = '';
                            colDef.required = '';
                            colDef.minValue = '';
                            colDef.maxValue = '';
                            colDef.multiple = '';
                            colDef.value = '';
                            colDef.type = column.type;
                            colDef.isPrimaryKey = column.isPrimaryKey;
                            colDef.generator = column.generator;
                            colDef.show = true;
                            if (column.isRelated) {
                                /* otherwise build object with required configuration */
                                colDef.field = column.fieldName.charAt(0).toLowerCase() + column.fieldName.slice(1);
                                colDef.displayName = colDef.field;
                                colDef.isRelated = true;
                                colDef.lookupType = column.relatedEntityName;
                                colDef.lookupField = '';
                                WM.forEach(column.columns, function (subcolumn) {
                                    if (subcolumn.isPrimaryKey) {
                                        colDef.lookupField = subcolumn.fieldName;
                                    }
                                });
                                colDef.relatedEntityName = column.relatedEntityName;
                            } else {
                                colDef.isRelated = false;
                            }
                            colDefArray.push(colDef);
                        }

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
                },
                template: function (element) {
                    filterMarkup = element.html();
                    return $templateCache.get("template/widget/livefilter/livefilter.html");
                },
                compile: function (tElement, tAttr) {
                    tAttr.gridColumnMarkup = filterMarkup;

                    return {
                        pre: function (scope, element) {
                            var elScope = element.scope();
                            scope.widgetProps = WM.copy(widgetProps);
                            scope.filterElement = element;
                            scope.Variables = elScope.Variables;
                            scope.Widgets = elScope.Widgets;
                        },
                        post: function (scope, element, attrs) {
                            var variableRegex = /^bind:Variables\.(.*)\.dataSet$/,
                                handlers = [],
                                layoutObj = {
                                    'One Column': 1,
                                    'Two Column': 2,
                                    'Three Column': 3,
                                    'Four Column': 4
                                },
                                defaultButtonsArray = [
                                    {
                                        key : 'filter',
                                        class: 'btn-primary',
                                        iconname: 'filter',
                                        action: 'filter()',
                                        displayName: 'Filter',
                                        show: true,
                                        type: 'button'
                                    },
                                    {
                                        key : 'clear',
                                        class: 'btn',
                                        iconname: 'clear',
                                        action: 'clearFilter()',
                                        displayName: 'Clear',
                                        show: true,
                                        type: 'button'
                                    }];
                            scope.filterContainer = element;
                            scope.primaryKey = null;

                            scope.getActiveLayout = function () {
                                return layoutObj[scope.layout] || 1;
                            };

                            function updateAllowedValues() {
                                var variable = scope.Variables[scope.variableName];
                                WM.forEach(scope.formFields, function (filterField) {
                                    var query, tableName, columns, fieldColumn;

                                    fieldColumn = variable.getModifiedFieldName(filterField.field);
                                    if (filterField.widget === 'select' || filterField.widget === 'radioset' || filterField.widget === 'checkboxset') {
                                        if (filterField.isRelated) {
                                            tableName = filterField.lookupType;
                                            columns = filterField.lookupField;
                                            query = QueryBuilder.getQuery({
                                                "tableName": tableName,
                                                "columns": [" DISTINCT " + columns + " AS " + columns]
                                            });
                                            filterField.datafield = columns;
                                            filterField.displayfield = columns;
                                        } else {
                                            query = QueryBuilder.getQuery({
                                                "tableName": scope.result.propertiesMap.entityName,
                                                "columns": [" DISTINCT " + fieldColumn + " AS " + filterField.field]
                                            });
                                            filterField.datafield = filterField.field;
                                            filterField.displayfield = filterField.field;
                                        }
                                        /* Sending size = 500 because we want to populate all data values in widgets
                                         * like select box, checkbox set etc.
                                         * NOTE: Currently backend is returning max. 100 records for any page size
                                         * more than 100. So this size will need to change once backend is fixed to
                                         * return all records instead of max 100 records in this case. */
                                        QueryBuilder.executeQuery({
                                            "databaseName": variable.liveSource,
                                            "query": query,
                                            "page": 1,
                                            "size": 500,
                                            "nativeSql": false,
                                            "prefabName": variable.prefabName
                                        }, function (data) {
                                            filterField.dataset = data.content;
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
                                        oldData;
                                    /*If properties map is populated and if columns are presented for filter construction*/
                                    if (newVal.propertiesMap && WM.isArray(newVal.propertiesMap.columns)) {
                                        /*TODO: Add oldval and newval equality check after equality check fix*/
                                        /* old data cached to avoid live variable data's effect on filter */
                                        oldData = (scope.result && scope.result.data) || [];

                                        scope.variableName = scope.binddataset.match(variableRegex)[1];
                                        scope.result = newVal;

                                        /* The filter is not depending on variable's data, as filter is making explicit call through QUERY
                                         * Hence, to avoid flicker when data from explicit call is rendered, the live variable's data is ignored
                                         */
                                        scope.result.data = oldData;

                                        /*Set the "variableName" along with the result so that the variable could be used by the data navigator during navigation.*/
                                        scope.result.variableName = scope.variableName;
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
                                                        filterField.widget = scope.getWidgetType(filterField.type);
                                                        scope.$root.$emit("set-markup-attr", scope.widgetid, {'type': filterField.type, 'widget': filterField.widget}, 'wm-filter-field[field=' + filterField.field + ']');
                                                    }
                                                }
                                            });
                                        }
                                        buttonsObj = defaultButtonsArray;

                                        /* call method to update allowed values for select type filter fields */
                                        updateAllowedValues();

                                        /*On load check if default value exists and apply filter*/
                                        scope.filter();
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
                                            bindDataSetChanged: true
                                        };
                                        scope.$root.$emit('filterDefs-modified', designerObj);
                                    }
                                    break;
                                case "layout":
                                    if (CONSTANTS.isStudioMode && scope.newcolumns) {
                                        scope.newcolumns = false;
                                        designerObj = {
                                            widgetName: scope.name,
                                            fieldDefs: scope.formFields,
                                            buttonDefs: scope.buttonArray,
                                            variableName: scope.variableName,
                                            scopeId: scope.$id,
                                            numColumns: scope.getActiveLayout()
                                        };
                                        $rootScope.$emit('filterDefs-modified', designerObj);
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
                                    scope.filterConstructed = true;
                                }
                            }));
                            scope.$on("$destroy", function () {
                                handlers.forEach(Utils.triggerFn);
                            });
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
                }
            };
        }])
    .directive("wmFilterField", ["$compile", "Utils", "CONSTANTS", "BindingManager", "LiveWidgetUtils", function ($compile, Utils, CONSTANTS, BindingManager, LiveWidgetUtils) {
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

                        var expr,
                            exprWatchHandler,
                            template,
                            index,
                            defaultVal,
                            parentIsolateScope = scope.parentIsolateScope,
                            columnsDef = WM.extend(LiveWidgetUtils.getColumnDef(attrs), {
                                'field': attrs.field || attrs.binding,
                                'filterOn': attrs.filterOn || attrs.field || attrs.binding,
                                'isRange': attrs.isRange === "true" || attrs.isRange === true,
                                'isRelated': attrs.isRelated === "true" || attrs.isRelated === true,
                                'widget': attrs.widget,
                                'lookupType': attrs.lookupType,
                                'lookupField': attrs.lookupField,
                                'minPlaceholder': attrs.minPlaceholder,
                                'maxPlaceholder': attrs.maxPlaceholder,
                                'relatedEntityName': attrs.relatedEntityName
                            });

                        columnsDef.key = columnsDef.field;

                        /*Set the default value*/
                        if (attrs.value) {
                            /*If the default value is bound variable, keep watch on the expression*/
                            if (Utils.stringStartsWith(attrs.value, 'bind:') && CONSTANTS.isRunMode) {
                                expr = attrs.value.replace('bind:', '');
                                if (scope.Variables && !Utils.isEmptyObject(scope.Variables) && scope.$eval(expr)) {
                                    defaultVal = scope.$eval(expr);
                                    columnsDef.value = defaultVal;
                                    if (columnsDef.isRange) {
                                        columnsDef.minValue = defaultVal;
                                        columnsDef.maxValue = defaultVal;
                                    }
                                } else {
                                    exprWatchHandler = BindingManager.register(scope, expr, function (newVal) {
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
                                defaultVal = attrs.value;
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
                        parentIsolateScope.formFields = parentIsolateScope.formFields || [];
                        parentIsolateScope.columnsDefCreated = true;
                        index = parentIsolateScope.formFields.push(columnsDef) - 1;

                        template = LiveWidgetUtils.getTemplate(columnsDef, index, "filter");
                        element.html(template);
                        $compile(element.contents())(parentIsolateScope);

                        parentIsolateScope.$on('$destroy', function () {
                            if (exprWatchHandler) {
                                exprWatchHandler();
                            }
                        });
                    }
                };
            }
        };
    }])
    .directive("wmFilterAction", ["$compile", function ($compile) {
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

                        var buttonTemplate, index, buttonDef = {
                            'key': attrs.key || attrs.binding,
                            'displayName': attrs.displayName || attrs.caption,
                            'show': attrs.show === "true" || attrs.show === true,
                            'class': attrs.class || '',
                            'iconname': attrs.iconname,
                            'action': attrs.action
                        };
                        scope.parentIsolateScope.buttonArray = scope.parentIsolateScope.buttonArray || [];
                        index = scope.parentIsolateScope.buttonArray.push(buttonDef) - 1;
                        scope.parentIsolateScope.columnsDefCreated = true;

                        buttonTemplate = '<wm-button caption="{{buttonArray[' + index + '].displayName}}" show="{{buttonArray[' + index + '].show}}" ' +
                            'class="{{buttonArray[' + index + '].class}}" iconname="{{buttonArray[' + index + '].iconname}}" ' +
                            'on-click="' + buttonDef.action + '" type="{{buttonArray[' + index + '].type}}" ></wm-button>';
                        element.closest('[data-identifier="livefilter"]').find('.basic-btn-grp').append($compile(buttonTemplate)(scope.parentIsolateScope));
                        $compile(element.contents())(scope.parentIsolateScope);
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
 * @param {string=} layout
 *                  This property controls how contained widgets are displayed within the widget container. <br>
 *                  Possible values are `One Column`, `Two Column`, `Three Column`, and `Four Column`. <br>
 *                  Default value is `One Column`.
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

