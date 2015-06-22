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
                notifyFor = {
                    'dataset': true,
                    'layout': true
                };

            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {},
                controller: function ($scope) {
                    $scope.__compileWithIScope = true;
                    $scope.clearFilter = function () {
                        WM.forEach($scope.filterFields, function (filterField) {
                            //Added check for range field
                            if (filterField.isRange) {
                                filterField.minValue = '';
                                filterField.maxValue = '';
                            } else {
                                if (filterField.selected) {
                                    filterField.selected = '';
                                } else {
                                    filterField.value = '';
                                }
                            }
                        });
                        /*Setting result to the default data*/
                        $scope.filter();
                    };
                    $scope.filter = function () {
                        var filterFields = [],
                            query;
                        WM.forEach($scope.filterFields, function (filterField) {
                            if (filterField.isRange) {
                                if (filterField.widget === "date") {
                                    filterField.minValue = $filter('date')(filterField.minValue, 'yyyy-MM-dd');
                                    filterField.maxValue = $filter('date')(filterField.maxValue, 'yyyy-MM-dd');
                                }
                                if (filterField.minValue && filterField.maxValue) {
                                    filterFields.push({
                                        clause: "('" + filterField.minValue + "'<=" + filterField.field + " AND " + filterField.field + "<='" + filterField.maxValue + "')"
                                    });
                                } else if (filterField.minValue) {
                                    filterFields.push({
                                        clause: "('" + filterField.minValue + "'<=" + filterField.field + ")"
                                    });
                                } else if (filterField.maxValue) {
                                    filterFields.push({
                                        clause: "(" + filterField.field + "<='" + filterField.maxValue + "')"
                                    });
                                }
                            } else {
                                switch (filterField.widget) {
                                case 'select':
                                    if (filterField.selected) {
                                        if (filterField.isRelated) {
                                            filterFields.push({
                                                column: filterField.field + '.' + filterField.lookupField,
                                                value: filterField.selected
                                            });
                                        } else {
                                            filterFields.push({
                                                column: filterField.field,
                                                value: filterField.selected
                                            });
                                        }
                                    }
                                    break;
                                case 'date':
                                    if (filterField.value) {
                                        filterFields.push({
                                            column: filterField.field,
                                            value: $filter('date')(filterField.value, 'yyyy-MM-dd')
                                        });
                                    }
                                    break;
                                default:
                                    if (filterField.value) {
                                        filterFields.push({
                                            column: filterField.field,
                                            value: filterField.value
                                        });
                                    }
                                    break;
                                }
                            }
                        });

                        query = QueryBuilder.getQuery({
                            "tableName": $scope.result.propertiesMap.entityName,
                            "filterFields": filterFields
                        });

                        QueryBuilder.executeQuery({
                            "databaseName": Variables.getVariableByName($scope.variableName).liveSource,
                            "query": query,
                            "page": 1,
                            "size": 500,
                            "nativeSql": false
                        }, function (data) {
                            var tempObj = {};
                            /*Set the response in "result" so that all widgets bound to "result" of the live-filter are updated.*/
                            $scope.result.data = data.content;
                            /*Create an object as required by the filterFields for live-variable so that all further calls to getData take place properly.
                            * This is used by widgets such as dataNavigator.*/
                            WM.forEach(filterFields, function (filterField) {
                                tempObj[filterField.column] = {};
                                tempObj[filterField.column]['value'] = filterField.value;
                            });
                            $scope.result.filterFields = tempObj;
                            /*Set the paging options also in the result so that it could be used by the dataNavigator.
                            * "currentPage" is set to "1" because each time the filter is applied, the dataNavigator should display results from the 1st page.*/
                            $scope.result.pagingOptions = {
                                "dataSize": data.totalElements,
                                "maxResults": Variables.getVariableByName($scope.variableName).maxResults || 20,
                                "currentPage": 1
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
                            colDef.widget = column.type === "date" ? "date" : "text";
                            colDef.isRange = false;
                            colDef.filterOn = '';
                            colDef.lookupType = '';
                            colDef.lookupField = '';
                            colDef.minPlaceholder = '';
                            colDef.maxPlaceholder = '';
                            colDef.datepattern = '';
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
                },
                template: function (element) {
                    filterMarkup = element.html();
                    return $templateCache.get("template/widget/livefilter/livefilter.html");
                },
                compile: function (tElement, tAttr) {
                    tAttr.gridColumnMarkup = filterMarkup;

                    return {
                        pre: function (scope, element) {
                            scope.widgetProps = WM.copy(widgetProps);
                            scope.filterElement = element;
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
                                        displayName: 'filter',
                                        show: true,
                                        type: 'button'
                                    },
                                    {
                                        key : 'clear',
                                        class: 'btn',
                                        iconname: 'clear',
                                        action: 'clearFilter()',
                                        displayName: 'clear',
                                        show: true,
                                        type: 'button'
                                    }];
                            scope.filterContainer = element;
                            scope.primaryKey = null;
                            scope.buttonArray = scope.buttonArray || defaultButtonsArray;

                            scope.getActiveLayout = function () {
                                return layoutObj[scope.layout] || 1;
                            };

                            function updateAllowedValues() {
                                WM.forEach(scope.filterFields, function (filterField) {
                                    var query, tableName, columns;
                                    if (filterField.widget === 'select') {
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
                                                "columns": [" DISTINCT " + filterField.field + " AS " + filterField.field]
                                            });
                                            filterField.datafield = filterField.field;
                                            filterField.displayfield = filterField.field;
                                        }
                                        QueryBuilder.executeQuery({
                                            "databaseName": Variables.getVariableByName(scope.variableName).liveSource,
                                            "query": query,
                                            "page": 1,
                                            "size": 500,
                                            "nativeSql": false
                                        }, function (data) {
                                            filterField.dataset = data.content;
                                        });
                                    }
                                });
                            }
                            function applyFilterOnField() {
                                WM.forEach(scope.filterFields, function (filterField) {
                                    if (filterField.filterOn && filterField.filterOn !== '') {
                                        WM.forEach(scope.filterFields, function (fieldObj, index) {
                                            if (fieldObj.field === filterField.filterOn) {
                                                scope.$watch("filterFields[" + index + "].selected", function (newVal, oldVal) {
                                                    var filterFields = {},
                                                        query;

                                                    if (newVal !== oldVal) {
                                                        filterFields = [{
                                                            "column": [filterField.filterOn],
                                                            "value": newVal
                                                        }];
                                                        query = QueryBuilder.getQuery({
                                                            "tableName": scope.result.propertiesMap.entityName,
                                                            "columns": [" DISTINCT " + filterField.field],
                                                            "filterFields": filterFields
                                                        });

                                                        QueryBuilder.executeQuery({
                                                            "databaseName": Variables.getVariableByName(scope.variableName).liveSource,
                                                            "query": query,
                                                            "page": 1,
                                                            "size": 500,
                                                            "nativeSql": false
                                                        }, function (data) {
                                                            filterField.dataset = data.content;
                                                        });
                                                    }
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
                                        designerObj;
                                    /*If properties map is populated and if columns are presented for filter construction*/
                                    if (newVal.propertiesMap && WM.isArray(newVal.propertiesMap.columns)) {
                                        /*Check if propertiesMap in oldVal is defined, then it is not equal to newVal propertiesMap*/
                                        if (!oldVal || !oldVal.propertiesMap || !WM.equals(newVal.propertiesMap.columns, oldVal.propertiesMap.columns)) {
                                            scope.variableName = scope.binddataset.match(variableRegex)[1];
                                            scope.result = newVal;
                                            /*Set the "variableName" along with the result so that the variable could be used by the data navigator during navigation.*/
                                            scope.result.variableName = scope.variableName;
                                            /*transform the data to filter consumable data*/
                                            fieldsObj = scope.constructDefaultData(newVal);
                                            buttonsObj = defaultButtonsArray;

                                            /* call method to update allowed values for select type filter fields */
                                            updateAllowedValues();
                                            applyFilterOnField();
                                        }
                                    } else if (!newVal && CONSTANTS.isStudioMode) { /*Clear the variables when the live-filter has not been bound.*/
                                        //element.empty();
                                        scope.variableName = '';
                                        scope.result = '';
                                        scope.filterFields = '';
                                        scope.filterConstructed = false;
                                        scope.fieldObjectCreated = false;
                                        fieldsObj = [];
                                        buttonsObj = [];
                                    }
                                    if (CONSTANTS.isStudioMode && scope.newcolumns && fieldsObj) {
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
                                            fieldDefs: scope.filterFields,
                                            buttonDefs: scope.buttonArray,
                                            variableName: scope.variableName,
                                            scopeId: scope.$id,
                                            numColumns: scope.getActiveLayout()
                                        };
                                        $rootScope.$emit('filterDefs-modified', designerObj);
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
                                    scope.filterFields = undefined;
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
    .directive("wmFilterField", ["$compile", function ($compile) {
        'use strict';

        /* provides the template based on the form-field definition */
        var getTemplate = function (fieldDef, index) {
            var template = '',
                type;

            /*Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap*/
            switch (fieldDef.widget) {
            case 'slider':
                template = template +
                    '<wm-composite widget="slider" show="{{filterFields[' + index + '].show}}">' +
                    '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                    '<div class="col-md-8"><input type="range"/></div>' +
                    '</wm-composite>';
                break;
            case 'select':
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Enter Max Value';
                    template = template +
                        '<wm-composite widget="select" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-4"><wm-select name="{{filterFields[' + index + '].field}}" scopedataset="filterFields[' + index + '].dataset" scopedatavalue="filterFields[' + index + '].minValue" datafield="{{filterFields[' + index + '].datafield}}" displayfield="{{filterFields[' + index + '].displayfield}}" placeholder="{{filterFields[' + index + '].minPlaceholder}}"></wm-select></div>' +
                        '<div class="col-md-4"><wm-select name="{{filterFields[' + index + '].field}}" scopedataset="filterFields[' + index + '].dataset" scopedatavalue="filterFields[' + index + '].maxValue" datafield="{{filterFields[' + index + '].datafield}}" displayfield="{{filterFields[' + index + '].displayfield}}" placeholder="{{filterFields[' + index + '].maxPlaceholder}}"></wm-select></div>' +
                        '</wm-composite>';
                } else {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Value';
                    template = template + '<wm-composite widget="select" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-8"><wm-select name="{{filterFields[' + index + '].field}}" scopedataset="filterFields[' + index + '].dataset" scopedatavalue="filterFields[' + index + '].selected" datafield="{{filterFields[' + index + '].datafield}}" displayfield="{{filterFields[' + index + '].displayfield}}" placeholder="{{filterFields[' + index + '].minPlaceholder}}"></wm-select></div>' +
                        '</wm-composite>';
                }
                break;
            case 'text':
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Enter Max Value';
                    type = (fieldDef.type === "integer") ? "number" : "string";
                    template = template +
                        '<wm-composite widget="text" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-4"><wm-text name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].minValue" type="' + type + '" placeholder="{{filterFields[' + index + '].minPlaceholder}}"></wm-text></div>' +
                        '<div class="col-md-4"><wm-text name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].maxValue" type="' + type + '" placeholder="{{filterFields[' + index + '].maxPlaceholder}}"></wm-text></div>' +
                        '</wm-composite>';
                } else {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Value';
                    type = (fieldDef.type === "integer") ? "number" : "string";
                    template = template + '<wm-composite widget="text" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-8"><wm-text name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].value" type="' + type + '" placeholder="{{filterFields[' + index + '].minPlaceholder}}"></wm-text></div>' +
                        '</wm-composite>';
                }
                break;
            case 'date':
                if (fieldDef.isRange) {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Min Value';
                    fieldDef.maxPlaceholder = fieldDef.maxPlaceholder || 'Enter Max Value';
                    type = 'date';
                    template = template +
                        '<wm-composite widget="date" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-4"><wm-date name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].minValue" placeholder="{{filterFields[' + index + '].minPlaceholder}}" datepattern="{{filterFields[' + index + '].datepattern}}"></wm-date></div>' +
                        '<div class="col-md-4"><wm-date name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].maxValue" placeholder="{{filterFields[' + index + '].maxPlaceholder}}" datepattern="{{filterFields[' + index + '].datepattern}}"></wm-date></div>' +
                        '</wm-composite>';
                } else {
                    fieldDef.minPlaceholder = fieldDef.minPlaceholder || 'Enter Value';
                    type = 'date';
                    template = template + '<wm-composite widget="date" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-8"><wm-date name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].value" placeholder="{{filterFields[' + index + '].minPlaceholder}}"  datepattern="{{filterFields[' + index + '].datepattern}}"></wm-date></div>' +
                        '</wm-composite>';
                }
                break;
            default:
                if (fieldDef.isRange) {
                    template = template +
                        '<wm-composite widget="text" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-4"><wm-text name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].value" type="string"></wm-text></div>' +
                        '<div class="col-md-4"><wm-text name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].value" type="string"></wm-text></div>' +
                        '</wm-composite>';
                } else {
                    template = template + '<wm-composite widget="text" show="{{filterFields[' + index + '].show}}">' +
                        '<wm-label class="col-md-4" caption="{{filterFields[' + index + '].displayName}}"></wm-label>' +
                        '<div class="col-md-8"><wm-text name="{{filterFields[' + index + '].field}}" scopedatavalue="filterFields[' + index + '].value" type="string"></wm-text></div>' +
                        '</wm-composite>';
                }
                break;
            }
            return template;
        };

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

                        var template, index, fieldObject = {
                            'field': attrs.field || attrs.binding,
                            'displayName': attrs.displayName || attrs.caption,
                            'show': attrs.show === "true" || attrs.show === true,
                            'type': attrs.type || 'string',
                            'primaryKey': attrs.primaryKey === "true" || attrs.primaryKey === true,
                            'generator': attrs.generator,
                            'isRange': attrs.isRange === "true" || attrs.isRange === true,
                            'isRelated': attrs.isRelated === "true" || attrs.isRelated === true,
                            'filterOn': attrs.filterOn,
                            'widget': attrs.widget,
                            'lookupType': attrs.lookupType,
                            'lookupField': attrs.lookupField,
                            'minPlaceholder': attrs.minPlaceholder,
                            'maxPlaceholder': attrs.maxPlaceholder,
                            'datepattern': attrs.datepattern
                        };
                        scope.parentIsolateScope.filterFields = scope.parentIsolateScope.filterFields || [];
                        scope.parentIsolateScope.fieldObjectCreated = true;
                        index = scope.parentIsolateScope.filterFields.push(fieldObject) - 1;

                        template = getTemplate(fieldObject, index);
                        element.html(template);
                        $compile(element.contents())(scope.parentIsolateScope);
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
                        scope.parentIsolateScope.fieldObjectCreated = true;

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

