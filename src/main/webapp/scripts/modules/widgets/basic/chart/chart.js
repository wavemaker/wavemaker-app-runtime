/*global WM, nv, d3, _ */
/*Directive for chart */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/chart.html',
            '<div init-widget class="app-chart" ng-class="{\'panel\': title}" apply-styles>' +
            '<div class="panel-heading" ng-if="title">' +
                '<h3 class="panel-title">' +
                    '<div class="pull-left"><i class="app-icon panel-icon {{iconclass}}" ng-show="iconclass"></i></div>' +
                    '<div class="heading">{{title}}</div>' +
                    '<div class="description">{{subheading}}</div>' +
                '</h3>' +
            '</div>' +
            '<div class="app-chart-inner" ng-class="{\'loading\':isLoadInProgress,\'panel-body\': title}">' +
                '<svg></svg>' +
                '<div class="wm-content-info readonly-wrapper {{class}}" ng-if="showContentLoadError && showNoDataMsg">' +
                    '<p class="wm-message" title="{{hintMsg}}" ng-class="{\'error\': invalidConfig}">{{errMsg}}</p>' +
                '</div>' +
                '<wm-spinner show="{{isLoadInProgress}}" caption="{{loadingdatamsg}}"></wm-spinner>' +
            '</div>' +
            '</div>'
            );
    }])
    .directive('wmChart', function (PropertiesFactory, $templateCache, $rootScope, WidgetUtilService, CONSTANTS, Utils, ChartService, DatabaseService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.chart', ['wm.base']),
           // properties of the respective chart type
            options = {
                'Bubble'         : ['bubblesize', 'shape']
            },
            NONE = 'none',
            isGroupByChecked,
            advanceDataProps = ['aggregation', 'aggregationcolumn', 'groupby', 'orderby'],
            //XPaths to get actual data of data points in charts
            chartDataPointXpath = {
                'Column'         : 'rect.nv-bar',
                'Bar'            : 'g.nv-bar',
                'Area'           : '.nv-stackedarea .nv-point',
                'Cumulative Line': '.nv-cumulativeLine .nv-scatterWrap path.nv-point',
                'Line'           : '.nv-lineChart .nv-scatterWrap path.nv-point',
                'Pie'            : '.nv-pieChart .nv-slice path',
                'Donut'          : '.nv-pieChart .nv-slice path',
                'Bubble'         : '.nv-scatterChart .nv-point-paths path'
            },
            //all properties of the chart
            allOptions = ['bubblesize', 'shape'],
            chartTypes = ChartService.chartTypes,
            styleProps = {
                'fontunit'      : 'font-size',
                'fontsize'      : 'font-size',
                'color'         : 'fill',
                'fontfamily'    : 'font-family',
                'fontweight'    : 'font-weight',
                'fontstyle'     : 'font-style',
                'textdecoration': 'text-decoration'
            },
            allShapes = ChartService.allShapes,
            notifyFor = {
                'dataset'           : true,
                'xaxisdatakey'      : true,
                'yaxisdatakey'      : true,
                'type'              : true,
                'height'            : true,
                'width'             : true,
                'show'              : true,
                'fontsize'          : true,
                'fontunit'          : true,
                'color'             : true,
                'fontfamily'        : true,
                'fontweight'        : true,
                'fontstyle'         : true,
                'textdecoration'    : true,
                'shape'             : true,
                'bubblesize'        : true,
                'tooltips'          : true,
                'groupby'           : true,
                'aggregation'       : true,
                'aggregationcolumn' : true,
                'orderby'           : true,
                'showlegend'        : true,
                'legendtype'        : true,
                'title'             : true,
                'nodatamessage'     : true,
                'subheading'        : true
            },
        // Getting the relevant aggregation function based on the selected option
            aggregationFnMap = {
                'average' : 'AVG',
                'count'   : 'COUNT',
                'maximum' : 'MAX',
                'minimum' : 'MIN',
                'sum'     : 'SUM'
            };

        //Function to get the variable from the bind dataset
        function getVariable(scope, element) {
            var variableName,
                elScope = element.scope();
                //Set the variable name based on whether the widget is bound to a variable opr widget
            if (_.includes(scope.binddataset, 'bind:Variables.')) {
                variableName = scope.binddataset.replace('bind:Variables.', '');
                variableName = variableName.substr(0, variableName.indexOf('.'));
            } else {
                variableName = _.get(scope.dataset, 'variableName');
            }

            return elScope.Variables ? elScope.Variables[variableName] : {};
        }
        // Configuring the properties panel based on the type of the chart chosen
        function togglePropertiesByChartType(scope) {
            // Initially hiding all the properties
            ChartService.hideOrShowProperties(allOptions, scope, false);
            // Showing the properties based on the type of the chart
            ChartService.hideOrShowProperties((chartTypes.indexOf(scope.type) === -1) ? options.Column : options[scope.type], scope, true);
        }

        // Based on the chart type, sets the options for the yaxisdatakey
        function setYAxisDataKey(scope, options) {
            options = options || getCutomizedOptions(scope, 'yaxisdatakey');
            if (ChartService.isPieType(scope.type)) {
                scope.widgetProps.yaxisdatakey.widget = 'list';
                scope.widgetProps.yaxisdatakey.options = options;
            } else {
                scope.widgetDataset.yaxisdatakey = options || [];
            }
        }

        function isGroupByEnabled(groupby) {
            return !!(groupby && groupby !== NONE);
        }

        //Removing the properties from the markup
        function resetProperties(scope) {
            //set all the values to default.
            scope.xaxisdatakey = scope.yaxisdatakey = '';
            scope.xaxislabel = scope.yaxislabel = '';
            scope.xunits = scope.yunits = '';
            scope.bubblesize = '';
            scope.widgetProps.aggregationcolumn.disabled = true;
            scope.widgetProps.aggregation.disabled = true;
            //Setting the values to the default
            if (scope.widgetid && scope.active) {
                $rootScope.$emit('update-widget-property', 'aggregation', '');
                $rootScope.$emit('update-widget-property', 'aggregationcolumn', '');
                $rootScope.$emit('update-widget-property', 'groupby', '');
                $rootScope.$emit('update-widget-property', 'orderby', '');
                $rootScope.$emit('update-widget-property', 'xdateformat', '');
                $rootScope.$emit('update-widget-property', 'formattype', '');
            }
        }

        // Displaying options for x axis based on the columns chosen in groupby column
        function filterXAxisOptions(scope) {
            var xAxisOptions = [];
            //Check if the data-set has been bound and the value is available in data-set.
            if (scope.binddataset && WM.isObject(scope.dataset)) {
                if (isGroupByEnabled(scope.groupby)) {
                    xAxisOptions = scope.groupby.split(',');
                    //Choosing first column in group by as x axis
                    scope.xaxisdatakey = xAxisOptions[0];
                    //Setting x axis options with group by columns
                    scope.widgetProps.xaxisdatakey.options = xAxisOptions;
                }
            }
            scope.$root.$emit('set-markup-attr', scope.widgetid, {'xaxisdatakey': scope.xaxisdatakey});
        }

        // Displaying options for y axis based on the columns chosen in aggregation column
        function filterYAxisOptions(scope) {
            var yAxisOptions = [],
                isAggregationApplied = (isGroupByEnabled(scope.groupby) && scope.aggregation && scope.aggregation !== 'none' && scope.aggregationcolumn);
            //Check if the data-set has been bound and the value is available in data-set.
            if (scope.binddataset && WM.isObject(scope.dataset)) {
                //If 'aggregation' is not 'none' and if the 'aggregationColumn' has not already been added into the axesOptions, then add it.
                if (isAggregationApplied) {
                    yAxisOptions.push(scope.aggregationcolumn);
                    //Choosing first column in aggregation by as y axis
                    scope.yaxisdatakey = yAxisOptions[0];
                    //Setting y axis options with aggregation columns
                    setYAxisDataKey(scope, yAxisOptions);
                } else {
                    //Setting y axis options with aggregation columns
                    setYAxisDataKey(scope);
                }
            }
            scope.$root.$emit('set-markup-attr', scope.widgetid, {'yaxisdatakey': scope.yaxisdatakey});
        }

        // Check if x and y axis that are chosen are valid to plot chart
        function isValidAxis(scope) {
            // Check if x axis and y axis are chosen and are not equal
            return scope.binddataset ? (scope.xaxisdatakey && scope.yaxisdatakey) : true;
        }

        // Check if aggregation is chosen
        function isAggregationEnabled(scope) {
            return !!((isGroupByEnabled(scope.groupby) && scope.aggregation !== NONE && scope.aggregationcolumn));
        }

        // Check if either groupby, aggregation or orderby is chosen
        function isDataFilteringEnabled(scope) {
            /*Query need to be triggered if any of the following cases satisfy
            * 1. Group By and aggregation both chosen
            * 2. Only Order By is chosen
            * */

            return isAggregationEnabled(scope) || (!scope.isVisuallyGrouped && scope.orderby);
        }

        /*Charts like Line,Area,Cumulative Line does not support any other datatype
        other than integer unlike the column and bar.It is a nvd3 issue. Inorder to
        support that this is a fix*/
        function getxAxisVal(scope, dataObj, xKey, index) {
            var value = _.get(dataObj, xKey);
            //If x axis is other than number type then add indexes
            if (ChartService.isLineTypeChart(scope.type) && !_.isNumber(scope.xAxisDataType)) {
                //Verification to get the unique data keys
                scope.xDataKeyArr.push(value);
                return index;
            }
            return value;
        }

        //Getting the min and max values among all the x values
        function getXMinMaxValues(datum) {
            if (!datum) {
                return;
            }
            var xValues = {};
            /*
             compute the min x value
             eg: When data has objects
                input: [{x:1, y:2}, {x:2, y:3}, {x:3, y:4}]
                min x: 1
             eg: When data has arrays
                input: [[10, 20], [20, 30], [30, 40]];
                min x: 10
            */
            xValues.min = _.minBy(datum.values, function (dataObject) {
                return (dataObject.x || dataObject[0]);
            });
            /*
             compute the max x value
             eg: When data has objects
                input: [{x:1, y:2}, {x:2, y:3}, {x:3, y:4}]
                max x: 3
             eg: When data has arrays
                input: [[10, 20], [20, 30], [30, 40]];
                max x: 30
             */
            xValues.max = _.maxBy(datum.values, function (dataObject) {
                return (dataObject.x || dataObject[0]);
            });
            return xValues;
        }

        //Getting the min and max values among all the y values
        function getYMinMaxValues(datum) {
            var yValues = {},
                minValues = [],
                maxValues = [];
            if (!datum) {
                return;
            }

            /*
             Getting the min and max y values among all the series of data
             compute the min y value
             eg: When data has objects
                input: [[{x:1, y:2}, {x:2, y:3}, {x:3, y:4}], [{x:2, y:3}, {x:3, y:4}, {x:4, y:5}]]
                min y values : '2'(among first set) & '3'(among second set)
                max y values : '4'(among first set) & '5'(among second set)

             eg: When data has arrays
                input: [[[10, 20], [20, 30], [30, 40]], [[20, 30], [30, 40], [40, 50]]]
                min y values : '20'(among first set) & '30'(among second set)
                max y values : '40'(among first set) & '50'(among second set)
             */

            _.forEach(datum, function (data) {
                minValues.push(_.minBy(data.values, function (dataObject) { return dataObject.y || dataObject[1]; }));
                maxValues.push(_.maxBy(data.values, function (dataObject) { return dataObject.y || dataObject[1]; }));
            });
            //Gets the least and highest values among all the min and max values of respective series of data
            yValues.min = _.minBy(minValues, function (dataObject) {
                return dataObject.y || dataObject[1];
            });
            yValues.max = _.maxBy(maxValues, function (dataObject) {
                return dataObject.y || dataObject[1];
            });
            return yValues;
        }

        //If the x-axis values are undefined, we return empty array else we return the values
        function getValidData(values) {
            return (values.length === 1 && values[0] === undefined) ? [] : values;
        }
        //Returns the single data point based on the type of the data chart accepts
        function valueFinder(scope, dataObj, xKey, yKey, index, shape) {
            var xVal = getxAxisVal(scope, dataObj, xKey, index),
                value = _.get(dataObj, yKey),
                yVal = parseFloat(value) || value,
                dataPoint = {},
                size = parseFloat(dataObj[scope.bubblesize]) || 2;

            if (ChartService.isChartDataJSON(scope.type)) {
                dataPoint.x = xVal;
                dataPoint.y = yVal;
                //only Bubble chart has the third dimension
                if (ChartService.isBubbleChart(scope.type)) {
                    dataPoint.size = size;
                    dataPoint.shape = shape || 'circle';
                }
            } else if (ChartService.isChartDataArray(scope.type)) {
                dataPoint = [xVal, yVal];
            }
            //Adding actual unwrapped data to chart data to use at the time of selected data point of chart event
            dataPoint._dataObj = dataObj;
            return dataPoint;
        }
        //Setting appropriate error messages
        function setErrMsg(scope, message) {
            if (scope.showNoDataMsg) {
                scope.showContentLoadError = true;
                scope.invalidConfig = true;
                $rootScope.$safeApply(scope, function () {
                    scope.errMsg = $rootScope.locale[message];
                });
            }
        }

        //Formatting the binded data compatible to chart data
        function getChartData(scope) {
            scope.sampleData = ChartService.getSampleData(scope);
            // scope variables used to keep the actual key values for x-axis
            scope.xDataKeyArr = [];
            //Plotting the chart with sample data when the chart dataset is not bound
            if (!scope.binddataset) {
                scope.xDataKeyArr = ChartService.getDateList();
                if (CONSTANTS.isStudioMode) {
                    scope.showContentLoadError = true;
                    scope.errMsg = $rootScope.locale.MESSAGE_INFO_SAMPLE_DATA;
                }
                return scope.sampleData;
            }

            if (CONSTANTS.isStudioMode) {
                // When binddataset value is there and chartData is not populated yet then a Loading message will be shown
                if (scope.binddataset && !scope.chartData) {
                    return [];
                }
                if (scope.isServiceVariable) {
                    scope.showContentLoadError = true;
                    scope.errMsg = $rootScope.locale.MESSAGE_INFO_SAMPLE_DATA;
                    scope.hintMsg = $rootScope.locale.MESSAGE_ERROR_DATA_DISPLAY + scope.name;
                    return scope.sampleData;
                }
                if (!scope.chartData) {
                    return scope.sampleData;
                }
            } else {
                if (!scope.chartData || !scope.chartData.length) {
                    return [];
                }
            }

            var datum = [],
                xAxisKey = scope.xaxisdatakey,
                yAxisKeys = scope.yaxisdatakey ? scope.yaxisdatakey.split(',') : [],
                dataSet = scope.chartData,
                yAxisKey,
                shapes = [],
                values  = [];

            if (WM.isArray(dataSet)) {
                if (ChartService.isPieType(scope.type)) {
                    yAxisKey = yAxisKeys[0];
                    datum = _.map(dataSet, function (dataObj, index) {
                        if (!Utils.isEmptyObject(dataSet[index])) {
                            return valueFinder(scope, dataSet[index], xAxisKey, yAxisKey);
                        }
                    });
                    datum = getValidData(datum);
                } else {
                    if (ChartService.isBubbleChart(scope.type)) {
                        shapes =  scope.shape === 'random' ? allShapes : scope.shape;
                    }
                    yAxisKeys.forEach(function (yAxisKey, series) {
                        values =  _.map(dataSet, function (dataObj, index) {
                            if (!Utils.isEmptyObject(dataSet[index])) {
                                return valueFinder(scope, dataSet[index], xAxisKey, yAxisKey, index, (WM.isArray(shapes) && shapes[series]) || scope.shape);
                            }
                        });
                        values = getValidData(values);
                        datum.push({
                            values: values,
                            key: Utils.prettifyLabels(yAxisKey)
                        });
                    });
                }
            }
            return datum;
        }

        //Returns orderby columns and their orders in two separate arrays
        function getLodashOrderByFormat(orderby) {
            var orderByColumns = [],
                orders = [],
                columns;
            _.forEach(_.split(orderby, ','), function (col) {
                columns = _.split(col, ':');
                orderByColumns.push(columns[0]);
                orders.push(columns[1]);
            });
            return {
                'columns' : orderByColumns,
                'orders'  : orders
            };
        }


        //Constructing the grouped data based on the selection of orderby, x & y axis
        function getVisuallyGroupedData(scope, queryResponse, groupingColumn) {
            var  chartData = [],
                groupData = {},
                groupValues = [],
                orderByDetails,
                maxLength,
                isAreaChart = ChartService.isAreaChart(scope.type),
                yAxisKey = _.first(_.split(scope.yaxisdatakey, ','));
            scope.xDataKeyArr = [];
            queryResponse = _.orderBy(queryResponse, _.split(scope.groupby, ','));
            if (scope.orderby) {
                orderByDetails = getLodashOrderByFormat(scope.orderby);
                queryResponse = _.orderBy(queryResponse, orderByDetails.columns, orderByDetails.orders);
            }
            queryResponse = _.groupBy(queryResponse, groupingColumn);
            //In case of area chart all the series data should be of same length
            if (isAreaChart) {
                maxLength = _.max(_.map(queryResponse, function (obj) {return obj.length; }));
            }
            _.forEach(queryResponse, function (values, groupKey) {
                groupValues = isAreaChart ? _.fill(new Array(maxLength), [0, 0]) : [];
                _.forEachRight(values, function (value, index) {
                    groupValues[index] = valueFinder(scope, value, scope.xaxisdatakey, yAxisKey, index);
                });
                groupData = {
                    key : groupKey,
                    values : groupValues
                };
                chartData.push(groupData);
            });
            return chartData;
        }

        //Replacing the '.' by the '$' because '.' is not supported in the alias names
        function getValidAliasName(aliasName) {
            return aliasName ? aliasName.replace(/\./g, '$') : null;
        }

        /*Decides whether the data should be visually grouped or not
        Visually grouped when a different column is choosen in the group by other than x and y axis and aggregation is not chosen*/
        function getGroupingDetails(scope) {
            if (isGroupByEnabled(scope.groupby) && !isAggregationEnabled(scope)) {
                var isVisuallyGrouped = false,
                    visualGroupingColumn,
                    groupingExpression,
                    groupbyColumns = scope.groupby && scope.groupby !== NONE ? scope.groupby.split(',') : [],
                    yAxisKeys = scope.yaxisdatakey ? scope.yaxisdatakey.split(',') : [],
                    groupingColumnIndex,
                    columns = [];

                if (groupbyColumns.length > 1) {
                    /*Getting the group by column which is not selected either in x or y axis*/
                    groupbyColumns.every(function (column, index) {
                        if (scope.xaxisdatakey !== column && WM.element.inArray(column, yAxisKeys) === -1) {
                            isVisuallyGrouped = true;
                            visualGroupingColumn = column;
                            groupingColumnIndex = index;
                            groupbyColumns.splice(groupingColumnIndex, 1);
                            return false;
                        }
                        return true;
                    });
                    //Constructing the groupby expression
                    if (visualGroupingColumn) {
                        columns.push(visualGroupingColumn);
                    }

                    if (groupbyColumns.length) {
                        columns = _.concat(columns, groupbyColumns);
                    }
                }
                //If x and y axis are not included in aggregation need to be included in groupby
                if (scope.xaxisdatakey !== scope.aggregationcolumn) {
                    columns.push(scope.xaxisdatakey);
                }
                _.forEach(yAxisKeys, function (key) {
                    if (key !== scope.aggregationcolumn) {
                        columns.push(key);
                    }
                });
                groupingExpression =  columns.join(',');
                // set isVisuallyGrouped flag in scope for later use
                scope.isVisuallyGrouped = isVisuallyGrouped;

                return {
                    expression: groupingExpression,
                    isVisuallyGrouped: isVisuallyGrouped,
                    visualGroupingColumn: visualGroupingColumn
                };
            }
            return {
                expression: '',
                isVisuallyGrouped: false,
                visualGroupingColumn: ''
            };
        }

        //Function to get the aggregated data after applying the aggregation & group by or order by operations.
        function getAggregatedData(scope, element, callback) {
            var variable,
                yAxisKeys = scope.yaxisdatakey ? scope.yaxisdatakey.split(',') : [],
                data = {},
                sortExpr,
                columns = [],
                colAlias,
                orderByColumns,
                groupByFields = [];

            variable = getVariable(scope, element);
            if (!variable) {
                return;
            }
            if (isGroupByEnabled(scope.groupby)) {
                groupByFields = _.split(scope.groupby, ',');
            }
            if (scope.orderby) {
                sortExpr = _.replace(scope.orderby, /:/g, ' ');
                columns = _.uniq(_.concat(columns, groupByFields, [scope.aggregationcolumn]));
                orderByColumns = getLodashOrderByFormat(scope.orderby).columns;
                //If the orderby column is chosen either in groupby or orderby then replace . with $ for that column
                _.forEach(_.intersection(columns, orderByColumns), function (col) {
                    colAlias = getValidAliasName(col);
                    sortExpr = _.replace(sortExpr, col, colAlias);
                });
            }
            if (isAggregationEnabled(scope)) {
                //Send the group by in the aggregations api only if aggregation is also chosen
                data.groupByFields = groupByFields;
                data.aggregations =  [
                    {
                        "field": scope.aggregationcolumn,
                        "type":  aggregationFnMap[scope.aggregation],
                        "alias": getValidAliasName(scope.aggregationcolumn)
                    }
                ];
            }
            //Execute the query.
            variable.getAggregatedData({
                'aggregations' : data,
                'sort'         : sortExpr
            }, function (response) {
                //Transform the result into a format supported by the chart.
                var chartData = [],
                    aggregationAlias = getValidAliasName(scope.aggregationcolumn),
                    xAxisAliasKey = getValidAliasName(scope.xaxisdatakey),
                    yAxisAliasKeys = [];

                yAxisKeys.forEach(function (yAxisKey) {
                    yAxisAliasKeys.push(getValidAliasName(yAxisKey));
                });

                WM.forEach(response.content, function (data) {
                    var obj = {};
                    // Set the response in the chartData based on 'aggregationColumn', 'xAxisDataKey' & 'yAxisDataKey'.
                    if (isAggregationEnabled(scope)) {
                        obj[scope.aggregationcolumn] = data[aggregationAlias];
                        obj[scope.aggregationcolumn] = _.get(data, aggregationAlias) || _.get(data, scope.aggregationcolumn);
                    }

                    obj[scope.xaxisdatakey] = _.get(data, xAxisAliasKey) || _.get(data, scope.xaxisdatakey);

                    yAxisKeys.forEach(function (yAxisKey, index) {
                        obj[yAxisKey] = data[yAxisAliasKeys[index]];
                        obj[yAxisKey] = _.get(data, yAxisAliasKeys[index]) || _.get(data, yAxisKey);
                    });

                    chartData.push(obj);
                });

                scope.chartData = chartData;

                Utils.triggerFn(callback);
            }, function () {
                scope.chartData = [];
                setErrMsg(scope, 'MESSAGE_ERROR_FETCH_DATA');
                Utils.triggerFn(callback);
            });
        }

        // Applying the font related styles for the chart
        function setTextStyle(properties, id) {
            var charttext = d3.select('#wmChart' + id + ' svg').selectAll('text');
            charttext.style(properties);
        }

        function angle(d) {
            var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
            return a > 90 ? a - 180 : a;
        }

        //This function sets maximum width for the labels that can be displayed.This will helpful when they are overlapping
        function setLabelsMaxWidth(scope) {
            var xTicks,
                tickWidth,
                maxLength,
                xDist,
                yDist,
                totalHeight,
                maxNoLabels,
                nthElement,
                labelsAvailableWidth,
                fontsize = parseInt(scope.fontsize, 10) || 12,
                isBarchart = ChartService.isBarChart(scope.type),
                barWrapper,
                yAxisWrapper,
                svgWrapper;
            //getting the x ticks in the chart
            xTicks = WM.element('#wmChart' + scope.$id + ' svg').find('g.nv-x').find('g.tick').find('text');

            //getting the distance between the two visible ticks associated with visible text
            xTicks.each(function () {
                var xTick = WM.element(this),
                    xTransform,
                    tickDist;
                if (xTick.text() && xTick.css('opacity') === '1') {
                    xTransform = xTick.parent().attr('transform').split(',');
                    xDist = parseFloat(xTransform[0].substr(10));
                    yDist = parseFloat(xTransform[1] || '0');
                    if (!isBarchart && xDist > 0) {
                        tickDist = xDist;
                    } else if (yDist > 0) {
                        tickDist = yDist;
                    }
                    if (tickWidth) {
                        tickWidth = tickDist - tickWidth;
                        return false;
                    }
                    tickWidth = tickDist;
                    return true;
                }
            });

            //In case of bar chart getting the available space for the labels to be displayed
            if (isBarchart) {
                barWrapper = WM.element('#wmChart' + scope.$id + ' svg>g.nv-wrap>g>g.nv-barsWrap')[0];
                yAxisWrapper = WM.element('#wmChart' + scope.$id + ' svg>g.nv-wrap>g>g.nv-y')[0];
                svgWrapper = WM.element('#wmChart' + scope.$id + ' svg')[0];
                //getting the total height of the chart
                totalHeight = barWrapper ? barWrapper.getBoundingClientRect().height : 0;
                //getting the labels available space
                labelsAvailableWidth = yAxisWrapper ? svgWrapper.getBoundingClientRect().width - yAxisWrapper.getBoundingClientRect().width : svgWrapper.getBoundingClientRect().width;

                //Setting the max length for the label
                maxLength = Math.round(labelsAvailableWidth / fontsize);
                //if available space for each label is less than the font-size
                //then limiting the labels to be displayed
                if (tickWidth < fontsize) {
                    //calculate the maximum no of labels to be fitted
                    maxNoLabels = totalHeight / fontsize;
                    //showing only the nth element
                    nthElement = Math.ceil(scope.chartData.length / maxNoLabels);
                    //showing up only some labels
                    d3.select('#wmChart' + scope.$id + ' svg').select('g.nv-x').selectAll('g.tick').select('text').each(function (text, i) {
                        //hiding every non nth element
                        if (i % nthElement !== 0) {
                            d3.select(this).attr('opacity', 0);
                        }
                    });
                }
            } else {
                //Setting the max length for the label
                maxLength = Math.round(tickWidth / fontsize);
            }

            //maxLength should always be a positive number
            maxLength = Math.abs(maxLength);
            //Validating if every label exceeds the max length and if so limiting the length and adding ellipsis
            xTicks.each(function () {
                if (this.textContent.length > maxLength) {
                    this.textContent = this.textContent.substr(0, maxLength) + '...';
                }
            });
        }

        // Returns the columns of that can be choosen in the x and y axis
        function getDefaultColumns(scope) {
            var defaultColumns = [],
                type,
                stringColumn,
                columns = scope.isLiveVariable ? scope.dataset.propertiesMap.columns : [],
                i,
                temp;


            for (i = 0; i < columns.length && defaultColumns.length <= 2; i += 1) {
                type = columns[i].type;
                if (!columns[i].isRelated && (Utils.isNumberType(type))) {
                    defaultColumns.push(columns[i].fieldName);
                } else if (type === 'string' && !stringColumn) {
                    stringColumn = columns[i].fieldName;
                }
            }
            //Other than bubble chart x: string type y: number type
            //Bubble chart x: number type y: number type
            if (stringColumn && defaultColumns.length > 0 && !ChartService.isBubbleChart(scope.type)) {
                temp = defaultColumns[0];
                defaultColumns[0] = stringColumn;
                defaultColumns[1] = temp;
            }

            return defaultColumns;
        }

        //Call user defined javascript function when user links it to click event of the widget.
        function attachClickEvent(scope) {
            var dataObj;
            d3.select('#wmChart' + scope.$id + ' svg').selectAll(chartDataPointXpath[scope.type]).style('pointer-events', 'all').on('click', function (data, index) {
                switch (scope.type) {
                case 'Column':
                case 'Bar':
                    dataObj = data._dataObj;
                    break;
                case 'Pie':
                case 'Donut':
                    dataObj = data.data._dataObj;
                    break;
                case 'Area':
                case 'Cumulative Line':
                case 'Line':
                    dataObj = data[0]._dataObj;
                    break;
                case 'Bubble':
                    dataObj = data.data.point[4]._dataObj;
                    break;
                }
                $rootScope.$safeApply(scope, function () {
                    scope.selecteditem = dataObj;
                    scope.onSelect && scope.onSelect({$event: d3.event, $isolateScope: scope, selectedChartItem: data, selectedItem: scope.selecteditem});
                });
            });
        }

        /*  Returns Y Scale min value
            Ex: Input   : 8.97
                Output  : 8.87

                Input   : 8
                Output  : 7
        */

        function postPlotProcess(scope, element, chart) {
            var chartSvg,
                pieLabels,
                pieGroups,
                angleArray,
                styleObj = {};

            ChartService.postPlotChartProcess(scope);

            if (!ChartService.isPieType(scope.type)) {
                setLabelsMaxWidth(scope);
            } else if (!scope.showlabelsoutside) {
                /** Nvd3 has a issue in rotating text. So we will use this as a temp fix.
                 * If the issue is resolved there, we can remove this.*/
                /* If it is a donut chart, then rotate the text and position them*/
                chartSvg = d3.select('#wmChart' + scope.$id + ' svg');
                pieLabels = chartSvg.select('.nv-pieLabels').selectAll('.nv-label');
                pieGroups = chartSvg.select('.nv-pie').selectAll('.nv-slice');
                angleArray = [];
                if (pieGroups && pieGroups.length) {
                    pieGroups.each(function () {
                        d3.select(this).attr('transform', function (d) {
                            angleArray.push(angle(d));
                        });
                    });
                    pieLabels.each(function (d, i) {
                        var group = d3.select(this);
                        WM.element(group[0][0]).find('text').attr('transform', 'rotate(' + angleArray[i] + ')');
                    });
                }
            }

            // prepare text style props object and set
            WM.forEach(styleProps, function (value, key) {
                if (key === 'fontsize' || key === 'fontunit') {
                    styleObj[value] = scope.fontsize + scope.fontunit;
                } else {
                    styleObj[value] = scope[key];
                }
            });
            setTextStyle(styleObj, scope.$id);

            /*
             * allow window-resize functionality, for only-run mode as
             * updating chart is being handled by watchers of height & width in studio-mode
             * */
            if (CONSTANTS.isRunMode) {
                Utils.triggerFn(scope._resizeFn && scope._resizeFn.clear);
                scope._resizeFn = nv.utils.windowResize(function () {
                    if (element[0].getBoundingClientRect().height) {
                        chart.update();
                        ChartService.postPlotChartProcess(scope);
                        if (!ChartService.isPieType(scope.type)) {
                            setLabelsMaxWidth(scope);
                        }
                    } else {
                        var parent = element.closest('.app-accordion-panel, .tab-pane').isolateScope();
                        if (parent) {
                            parent.initialized = false;
                        }
                    }
                });
            }
        }

        // prepares and configures the chart properties
        function configureChart(scope, element, datum) {
            //Copy the data only in case of pie chart with default data
            //Reason : when multiple pie charts are bound to same data, first chart theme will be applied to all charts
            var chartData = datum,
                xDomainValues,
                yDomainValues,
                chart,
                yformatOptions = {};

            if (datum.length > 0) {
                if (ChartService.isAxisDomainValid(scope, 'x')) {
                    xDomainValues = scope.binddataset ? getXMinMaxValues(datum[0]) : { 'min' : {'x': 1},  'max' : {'x' : 5}};
                }
                if (ChartService.isAxisDomainValid(scope, 'y')) {
                    yDomainValues = scope.binddataset ? getYMinMaxValues(datum) : { 'min' : {'y' : 1}, 'max' : {'y' : 5}};
                }
            }

            if (ChartService.isPieType(scope.type) && (!scope.binddataset || !scope.scopedataset)) {
                chartData = Utils.getClonedObject(scope.scopedataset || datum);
            }

            // get the chart object
            chart = ChartService.initChart(scope, xDomainValues, yDomainValues, null, !scope.binddataset);

            if (WM.isArray(chartData)) {
                scope.chart = chart;
                // changing the default no data message
                d3.select('#wmChart' + scope.$id + ' svg')
                    .datum(chartData)
                    .call(scope.chart);
                postPlotProcess(scope, element, chart);
                return chart;
            }
        }

        // Plotting the chart with set of the properties set to it
        function plotChart(scope, element) {
            var datum = [];
            //call user-transformed function
            scope.chartData = (scope.onTransform && scope.onTransform({$scope: scope})) || scope.chartData;

            //Getting the order by data only in run mode. The order by applies for all the charts other than pie and donut charts
            if (scope.isVisuallyGrouped && !ChartService.isPieType(scope.type)) {
                datum = scope.chartData;
            } else {
                datum = getChartData(scope);
            }
            // checking the parent container before plotting the chart
            if (!element[0].getBoundingClientRect().height) {
                return;
            }
            if (scope.clearCanvas) {
                //empty svg to add-new chart
                element.find('svg').replaceWith('<svg></svg>');
                scope.clearCanvas = false;
            }

            //In case of invalid axis show no data available message
            if (!isValidAxis(scope)) {
                datum = [];
            }
            nv.addGraph(function () {
                configureChart(scope, element, datum);
            }, function () {
                /*Bubble chart has an time out delay of 300ms in their implementation due to which we
                * won't be getting required data points on attaching events
                * hence delaying it 600ms*/
                setTimeout(function () {
                    attachClickEvent(scope);
                }, 600);
            });
            $rootScope.$safeApply(scope, function () {
                scope.isLoadInProgress = false;
            });
        }

        function plotChartProxy(scope, element) {
            $rootScope.$safeApply(scope, function () {
                scope.showContentLoadError = false;
                scope.invalidConfig = false;
            });
            //Checking if x and y axis are chosen
            if (!isValidAxis(scope) && CONSTANTS.isStudioMode) {
                setErrMsg(scope, 'MESSAGE_INVALID_AXIS');
                return [];
            }
            scope.isLoadInProgress = true;
            var groupingDetails = getGroupingDetails(scope);
            //If aggregation/group by/order by properties have been set, then get the aggregated data and plot the result in the chart.
            if (scope.binddataset && scope.isLiveVariable && (scope.filterFields || isDataFilteringEnabled(scope))) {
                getAggregatedData(scope, element, function () {
                    plotChart(scope, element);
                });
            } else { //Else, simply plot the chart.
                //In case of live variable resetting the aggregated data to the normal dataset when the aggregation has been removed
                if (scope.dataset && scope.dataset.data && scope.isLiveVariable) {
                    scope.chartData = scope.dataset.data;
                    if (isGroupByEnabled(scope.groupby) && groupingDetails.isVisuallyGrouped) {
                        scope.chartData = getVisuallyGroupedData(scope, scope.chartData, groupingDetails.visualGroupingColumn);
                    }

                }
                plotChart(scope, element);
            }
        }

        // sets the default x and y axis options
        function setDefaultAxisOptions(scope) {
            var defaultColumns = getDefaultColumns(scope);
            //If we get the valid default columns then assign them as the x and y axis
            //In case of service variable we may not get the valid columns because we cannot know the datatypes
            scope.xaxisdatakey = defaultColumns[0] || null;
            scope.yaxisdatakey = defaultColumns[1] || null;
            scope.$root.$emit('set-markup-attr', scope.widgetid, {'xaxisdatakey': scope.xaxisdatakey, 'yaxisdatakey': scope.yaxisdatakey});
        }

        function getCutomizedOptions(scope, prop, fields) {
            var groupByColumns = _.split(scope.groupby, ','),
                aggColumns = _.split(scope.aggregationcolumn, ',');
            if (!scope.binddataset) {
                return fields;
            }
            if (!scope.axisoptions) {
                scope.axisoptions = fields;
            }
            var newOptions;
            switch (prop) {
            case 'xaxisdatakey':
                //If group by enabled, columns chosen in groupby will be populated in x axis options
                if (isGroupByEnabled(scope.groupby)) {
                    newOptions = groupByColumns;
                }
                break;
            case 'yaxisdatakey':
                //If aggregation by enabled, columns chosen in aggregation will be populated in y axis options
                if (isAggregationEnabled(scope)) {
                    newOptions = aggColumns;
                } else if (scope.isLiveVariable) {
                    //In case of live variable populating only numeric columns
                    newOptions = scope.numericColumns;
                }
                break;
            case 'groupby':
                //Filtering only non primary key columns
                if (scope.isLiveVariable && scope.nonPrimaryColumns && scope.nonPrimaryColumns.length) {
                    newOptions = scope.nonPrimaryColumns;
                }
                break;
            case 'aggregationcolumn':
                //Set the 'aggregationColumn' to show all keys in case of aggregation function is count or to numeric keys in all other cases.
                if (scope.isLiveVariable && isAggregationEnabled(scope) && scope.aggregation !== 'count') {
                    newOptions = scope.numericColumns;
                }
                break;
            case 'orderby':
                //Set the 'aggregationColumn' to show all keys in case of aggregation function is count or to numeric keys in all other cases.
                if (scope.isLiveVariable && isAggregationEnabled(scope)) {
                    newOptions = _.uniq(_.concat(groupByColumns, aggColumns));
                }
                break;
            case 'bubblesize':
                if (scope.numericColumns && scope.numericColumns.length) {
                    newOptions = scope.numericColumns;
                }
                break;
            }

            return newOptions || fields || scope.axisoptions;
        }

        //Validates and returns valid sort epxression
        function updateOrderByExpr(scope) {
            var orderByConfig = getLodashOrderByFormat(scope.orderby),
                columns = orderByConfig.columns,
                orders = orderByConfig.orders,
                orderByOptions = scope.widgetProps.orderby.options,
                formats = [];
            //Adding only valid columns which are present in options
            _.forEach(columns, function (col, index) {
                if (_.includes(orderByOptions, col)) {
                    formats.push(_.join([col, orders[index]], ':'));
                }
            });
            scope.orderby = _.join(formats, ',');
            //updating the sort expression
            scope.$root.$emit('set-markup-attr', scope.widgetid, {'orderby': scope.orderby});
        }


        // Based on the chart type, sets the options for the yaxisdatakey
        function setOrderByColumns(scope) {
            scope.widgetProps.orderby.options = getCutomizedOptions(scope, 'orderby');
            if (scope.widgetProps.orderby.options) {
                //updates the orderby column based on the aggregation and orderby columns
                updateOrderByExpr(scope);
            }
        }

        //Function that iterates through all the columns and then fetching the numeric and non primary columns among them
        function setNumericandNonPrimaryColumns(scope) {
            var columns,
                type;
            scope.numericColumns = [];
            scope.nonPrimaryColumns = [];
            //Fetching all the columns
            if (scope.dataset && scope.dataset.propertiesMap) {
                columns = Utils.fetchPropertiesMapColumns(scope.dataset.propertiesMap);
            }

            if (columns) {
                //Iterating through all the columns and fetching the numeric and non primary key columns
                WM.forEach(Object.keys(columns), function (key) {
                    type = columns[key].type;
                    if (Utils.isNumberType(type)) {
                        scope.numericColumns.push(key);
                    }
                    //Hiding only table's primary key
                    if (columns[key].isRelatedPk === 'true' || !columns[key].isPrimaryKey) {
                        scope.nonPrimaryColumns.push(key);
                    }
                });
                scope.numericColumns = scope.numericColumns.sort();
                scope.nonPrimaryColumns = scope.nonPrimaryColumns.sort();
            }
        }

        function setWidgetTypes(scope) {
            if (ChartService.isPieType(scope.type)) {
                // If pie chart, set the display key for x and y axis datakey and subgroups
                scope.widgetProps.xaxisdatakey.displayKey = 'LABEL_PROPERTY_LABEL';
                scope.widgetProps.yaxisdatakey.displayKey = 'LABEL_PROPERTY_VALUES';
                PropertiesFactory.getPropertyGroup('xaxis').displayKey = 'LABEL_PROPERTY_LABEL_DATA';
                PropertiesFactory.getPropertyGroup('yaxis').displayKey = 'LABEL_PROPERTY_VALUE_DATA';

                // If it is a pie chart then the yaxisdatakey must be a single select else it has to be a multiselect
                scope.widgetProps.yaxisdatakey.widget = 'list';
                scope.widgetProps.groupby.widget = 'list';
            } else {
                scope.widgetProps.xaxisdatakey.displayKey = undefined;
                scope.widgetProps.yaxisdatakey.displayKey = undefined;
                PropertiesFactory.getPropertyGroup('xaxis').displayKey = undefined;
                PropertiesFactory.getPropertyGroup('yaxis').displayKey = undefined;

                scope.widgetProps.yaxisdatakey.widget = 'multi-select';
                scope.widgetProps.groupby.widget = 'multi-select';
            }
        }

        // enables/disables the aggregation column property
        function toggleAggregationColumnState(scope, aggregation) {
            scope.widgetProps.aggregationcolumn.disabled = !isGroupByChecked || (aggregation && aggregation === NONE);
        }

        // enables/disables the aggregation function property
        function toggleAggregationState(scope) {
            scope.widgetProps.aggregation.disabled = !isGroupByChecked;
            if (!isGroupByChecked) {
                scope.isVisuallyGrouped = false; //resetting isVisuallyGrouped flag to false when groupby property is empty
            }
            // enables/disables the aggregation column property
            toggleAggregationColumnState(scope, scope.aggregation);
        }

        //Sets the aggregation columns
        function setAggregationColumns(scope, aggregation) {
            //Set the 'aggregationColumn' to show all keys in case of aggregation function is count or to numeric keys in all other cases.
            scope.widgetProps.aggregationcolumn.options = aggregation === 'count' ? scope.axisoptions : scope.numericColumns;
        }

        //Sets the groupby columns to the non primary key columns and other than aggregation column if chosen
        function setGroupByColumns(scope, aggregationcolumn) {
            var index,
                columns = Utils.getClonedObject(scope.nonPrimaryColumns);
            //Removing the aggregation column out of the non primary columns
            if (scope.nonPrimaryColumns && aggregationcolumn) {
                index = _.indexOf(scope.nonPrimaryColumns, aggregationcolumn);
                if (index >= 0) {
                    columns.splice(index, 1);
                }
            }
        }

        //update property panel options and plot the chart
        function handleDataSet(scope, newVal, element) {
            var variableObj;
            scope.errMsg = '';
            //Resetting the flag to false when the binding was removed
            if (!newVal && !scope.binddataset) {
                scope.isVisuallyGrouped = false;
                scope.axisoptions = null;
            }

                variableObj = getVariable(scope, element);
                //setting the flag for the live variable in the scope for the checks
                scope.isLiveVariable = variableObj && variableObj.category === 'wm.LiveVariable' && WM.isArray(newVal.data);

            //If binded to a live variable feed options to the aggregation and group by
            if (scope.isLiveVariable && CONSTANTS.isStudioMode) {
                //Updating the numeric and non primary columns when dataset is changed
                setNumericandNonPrimaryColumns(scope);
            }

            //liveVariables contain data in 'data' property' of the variable
            scope.chartData = scope.isLiveVariable ? newVal && (newVal.data || '') : (newVal && newVal.dataValue === '' && _.keys(newVal).length === 1) ? '' : newVal;

            //if the data returned is an object make it an array of object
            if (!WM.isArray(scope.chartData) && WM.isObject(scope.chartData)) {
                scope.chartData = [scope.chartData];
            }

            // perform studio mode actions
            if (CONSTANTS.isStudioMode) {
                /*Explicitly calling "updatePropertyPanelOptions" since charts rely on properties map to find the non primary key columns and data type of the columns.
                 Properties map is getting set after updatePropertyPanelOptions is being called.
                 Need non primary key columns for group by and numeric columns for aggregation column and data type for automatic column selection.
                 */
                WidgetUtilService.updatePropertyPanelOptions(scope);
                //hiding the aggregation,group by and order by upon binding to the service variable
                ChartService.hideOrShowProperties(advanceDataProps, scope, scope.isLiveVariable);
                if (!scope.binddataset) {
                    resetProperties(scope);
                }
            }

            if (newVal && newVal.filterFields) {
                scope.filterFields = newVal.filterFields;
            }

            // plotchart for only valid data and only after bound variable returns data
            if (scope.chartData && !scope.variableInflight) {
                scope._plotChartProxy();
            }
        }

        // Define the property change handler. This function will be triggered when there is a change in the widget property
        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
            var styleObj = {};
            switch (key) {
            case 'dataset':
                if (!(scope.isServiceVariable && CONSTANTS.isStudioMode)) {
                    handleDataSet(scope, newVal, element);
                }
                break;
            case 'type':
                //Based on the change in type deciding the default margins
                if (ChartService.isPieType(scope.type)) {
                    scope.offsettop = 20;
                    scope.offsetright = 0;
                    scope.offsetbottom = 0;
                    scope.offsetleft = 0;
                } else if (oldVal === 'Pie' || oldVal === 'Donut') {
                    scope.offsettop = 25;
                    scope.offsetright = 25;
                    scope.offsetbottom = 55;
                    scope.offsetleft = 75;
                }

                if (oldVal !== newVal) {
                    scope.clearCanvas = true;
                }
                // In studio mode, configure properties dependent on chart type
                if (CONSTANTS.isStudioMode) {
                    togglePropertiesByChartType(scope);
                }
                scope._plotChartProxy();
                break;
            case 'fontsize':
            case 'fontunit':
            case 'color':
            case 'fontfamily':
            case 'fontweight':
            case 'fontstyle':
            case 'textdecoration':
                styleObj[styleProps[key]] = (key === 'fontsize' || key === 'fontunit') ? scope.fontsize + scope.fontunit : newVal;
                setTextStyle(styleObj, scope.$id);
                break;
            case 'aggregation':
                if (CONSTANTS.isStudioMode) {
                    //setting the aggregation columns
                    toggleAggregationColumnState(scope, newVal);
                    filterYAxisOptions(scope);
                    setOrderByColumns(scope);
                    if (newVal !== NONE) {
                        //Setting the aggregation columns based on the aggregation function chosen
                        setAggregationColumns(scope, newVal);
                    }
                }
                break;
            case 'groupby':
                if (CONSTANTS.isStudioMode) {
                    isGroupByChecked = isGroupByEnabled(newVal);
                    toggleAggregationState(scope);
                    widgetProps.groupby.selectedvalues = newVal;
                    if (isGroupByChecked) {
                        //Filtering x and y axis options based on the data filtering options
                        filterXAxisOptions(scope);
                        setOrderByColumns(scope);
                    } else {
                        //Showing all options
                        scope.widgetProps.xaxisdatakey.options = getCutomizedOptions(scope, 'xaxisdatakey');
                        setYAxisDataKey(scope);
                        //If groupby not selected then remove aggregation columns from markup
                        $rootScope.$emit('update-widget-property', 'aggregation', '');
                        $rootScope.$emit('update-widget-property', 'aggregationcolumn', '');
                    }
                }
                break;

            case 'aggregationcolumn':
                if (CONSTANTS.isStudioMode) {
                    //Setting the group by columns when aggregation column is changed
                    setGroupByColumns(scope, newVal);
                    filterYAxisOptions(scope);
                    setOrderByColumns(scope);
                }
                break;
            default:
                //In RunMode, the plotchart method will not be called for all property change
                scope._plotChartProxy();
                break;
            }
            if (_.includes(advanceDataProps, key)) {
                scope._plotChartProxy();
            }
        }

        //get the boolean value
        function getBooleanValue(val) {
            if (val === true || val === 'true') {
                return true;
            }
            if (val === false || val === 'false') {
                return false;
            }
            return val;
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {
                'scopedataset': '=?',
                'onTransform': '&',
                'onSelect': '&'
            },
            template: $templateCache.get('template/widget/form/chart.html'),
            compile: function () {
                return {
                    pre: function (iScope, $el, attrs) {
                        iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $el.removeAttr('title');
                    },
                    post: function (scope, element, attrs) {
                        var handlers = [],
                            variableObj,
                            showLabelsValue = scope.showlabels;
                        scope.getCutomizedOptions = getCutomizedOptions;
                        scope.onPropertyChange = setDefaultAxisOptions;
                        //migration for old projects
                        if (!_.includes(['outside', 'inside', 'hide'], showLabelsValue)) {
                            scope.showlabels        = getBooleanValue(scope.showlabels);
                            scope.showlabelsoutside = getBooleanValue(scope.showlabelsoutside);
                            scope.showlabels        = scope.showlabels ? (scope.showlabelsoutside ? 'outside' : 'inside') : 'hide';
                        }

                        // flag to prevent initial chart plotting on each property change
                        scope.chartReady = false;

                        scope._plotChartProxy = _.debounce(plotChartProxy.bind(undefined, scope, element), 100);

                        if (!scope.theme) {
                            //Default theme for pie/donut is Azure and for other it is Terrestrial
                            scope.theme = ChartService.isPieType(scope.type) ? 'Azure' : 'Terrestrial';
                        }

                        function onDestroy() {
                            handlers.forEach(Utils.triggerFn);
                            handlers = [];
                        }

                        //add id the the chart
                        element.attr('id', 'wmChart' + scope.$id);
                        scope.widgetDataset = {};

                        // register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        //Executing WidgetUtilService method to initialize the widget with the essential configurations.
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (scope.widgetid) {
                            //replot the chart after made changes in preview dialog
                            handlers.push($rootScope.$on('wms:replot-chart', function (event, activeChartScope) {
                                if (activeChartScope.$id === scope.$id) {
                                    scope._plotChartProxy();
                                }
                            }));
                            //Update the widget type, display key of properties and display key of groups based on the chart type
                            setWidgetTypes(scope);
                        }

                        // When there is not value binding, then plot the chart with sample data
                        if (!scope.binddataset && !attrs.scopedataset) {
                            scope._plotChartProxy();
                        }

                        // Run Mode Iniitilzation
                        if (CONSTANTS.isRunMode) {
                            scope.showNoDataMsg = false;
                            // fields defined in scope: {} MUST be watched explicitly
                            //watching scopedataset attribute to plot chart for the element.
                            if (attrs.scopedataset) {
                                handlers.push(scope.$watch('scopedataset', function (newVal) {
                                    scope.chartData = newVal || scope.chartData;
                                    scope._plotChartProxy();
                                }));
                            }
                        } else {
                            scope.showNoDataMsg = true;
                            // on canvas-resize, plot the chart again
                            handlers.push(scope.$root.$on('canvas-resize', function () {
                                scope._plotChartProxy();
                            }));
                        }

                        if (scope.binddataset && scope.binddataset.indexOf('bind:Variables.') !== -1) {
                            variableObj = getVariable(scope, element);
                            handlers.push($rootScope.$on('toggle-variable-state', function (event, boundVariable, active) {
                                //based on the active state and response toggling the 'loading data...' and 'no data found' messages
                                //variable is active.so showing loading data message
                                if (boundVariable.name === _.get(variableObj, 'name') && boundVariable.activeScope.$id === _.get(variableObj, 'activeScope.$id')) {
                                    scope.variableInflight = active;
                                    $rootScope.$safeApply(scope, function () {
                                        scope.isLoadInProgress = active;
                                    });
                                }
                            }));
                        }

                        //In case of Studio mode, service variable don't have dataset, so triggering it on binddataset change
                        handlers.push(scope.$watch('binddataset', function () {
                            variableObj = getVariable(scope, element);
                            scope.isServiceVariable = variableObj && (variableObj.category === 'wm.ServiceVariable' || variableObj.category === 'wm.WebSocketVariable');
                            if (scope.isServiceVariable && CONSTANTS.isStudioMode) {
                                handleDataSet(scope, scope.dataset, element);
                            }
                        }));

                        scope.$on('$destroy', onDestroy);
                        element.on('$destroy', onDestroy);

                        //Container widgets like tabs, accordions will trigger this method to redraw the chart.
                        scope.redraw = scope._plotChartProxy;
                    }
                };
            }
        };
    });

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmChart
 * @restrict E
 *
 * @description
 * The `wmChart` directive defines a chart widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the chart widget.
 * @param {list=} type
 *                  The type of the chart.
 * @param {string=} width
 *                  Width of the chart.
 * @param {string=} height
 *                  Height of the chart.
 * @param {string=} offset
 *                  This property controls the offset of the chart.
 * @param {string=} scopedatavalue
 *                  Variable defined in controller scope.<br>
 *                  The value of this variable is used as data in plotting chart.
 * @param {string=} dataset
 *                  Sets the data for the chart.<br>
 *                  This property supports binding with variables.<br>
 *                  When bound to a variable, the data associated with the variable becomes the basis for data for plotting the chart.
 * @param {list=} groupby
 *                  Shows the options to group the data.<br>
 * @param {list=} aggregation
 *                  Shows the options to aggregate the data in the chart.<br>
 * @param {list=} aggregationcolumn
 *                  Shows the options to aggregate the data in the chart.<br>
 * @param {list=} orderby
 *                  Shows the options to order the data.<br>
 * @param {list=} xaxisdatakey
 *                  The key of the object, i.e x-axis variable, on the chart.<br>
 * @param {string=} xaxislabel
 *                  The caption of x axis on the chart.<br>
 * @param {list=} xnumberformat
 *                  Shows the options to format the number type in x axis.<br>
 * @param {number=} xdigits
 *                  The number of digits to be displayed after decimal in x axis.<br>
 * @param {list=} xdateformat
 *                  Shows the options to format the date type in x axis.<br>
 * @param {number=} xaxislabeldistance
 *                  This property controls the distance between the x axis and its label.<br>
 * @param {number=} xaxisunits
 *                  This property controls the distance between the x axis and its label.
 * @param {list=} yaxisdatakey
 *                  The key of the object, i.e y-axis variable, on the chart.<br>
 * @param {string=} yaxislabel
 *                  The caption of x axis on the chart.<br>
 * @param {list=} ynumberformat
 *                  Shows the options to format the number type in x axis.<br>
 * @param {number=} ydigits
 *                  The number of digits to be displayed after decimal in x axis.<br>
 * @param {list=} ydateformat
 *                  Shows the options to format the date type in x axis.<br>
 * @param {number=} yaxislabeldistance
 *                  This property controls the distance between the x axis and its label.<br>
 * @param {number=} yaxisunits
 *                  Specifies the units for the y axis.<br>
 * @param {boolean=} show
 *                  Show isa bindable property. <br>
 *                  This property will be used to show/hide the chart widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} nodatamessage
 *                  This message will be displayed in grid, when there is no data to display. <br>
 * @param {boolean=} tooltips
 *                  This property controls whether to show the tooltip on hover. <br>
 * @param {boolean=} showlegend
 *                  This property controls whether to show the legends. <br>
 * @param {list=} legendposition
 *                  This property controls where to show the legends. <br>
 *                  Possible values are Top, Bottom.
 *                  Default value: `Top`. <br>
 *@param {boolean=} showvalues
 *                  This property controls showing of values on the bars. <br>
 *@param {boolean=} showlabels
 *                  This property controls showing of labels. <br>
 *@param {boolean=} showcontrols
 *                  This property controls showing the default controls for charts. <br>
 *@param {boolean=} staggerlabels
 *                  This property controls whether to stagger the labels which distributes labels into multiple lines. <br>
 *@param {boolean=} reducexticks
 *                  This property controls whether to reduce the xticks or not. <br>
 *@param {list=} labeltype
 *                  This property controls the type of the label to be shown in the chart. <br>
 *                  Key is the value of the key data, value is the data value, and percent represents the percentage that the slice of data represents. <br>
 *@param {number=} barspacing
 *                  This property controls the spacing between the bars and value ranges from 0.1 to 0.9. <br>
 *@param {number=} donutratio
 *                  This property controls the radius and value ranges from 0.1 to 1. <br>
 *@param {boolean=} showlabelsoutside
 *                  This property controls the labels should be outside or inside. <br>
 * @param {number=} bubblesize
 *                  This property controls the size of the bubble.<br>
 * @param {number=} showxdistance
 *                  This property enables showing the distance from the x axis.<br>
 * @param {number=} showydistance
 *                  This property enables showing the distance from the y axis.<br>
 * @param {string=} on-transform
 *                  Callback function for `transform` event.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Column" tooltips="false" staggerlabels="true" barspacing="0.2"></wm-chart>
                        </wm-gridcolumn>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Line" tooltips="false"></wm-chart>
                        </wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Area" tooltips="false"></wm-chart>
                        </wm-gridcolumn>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Pie" tooltips="false"></wm-chart>
                        </wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Bar" tooltips="false"></wm-chart>
                        </wm-gridcolumn>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Cumulative Line" tooltips="false"> </wm-chart>
                        </wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Donut" tooltips="false"></wm-chart>
                        </wm-gridcolumn>
                        <wm-gridcolumn columnwidth="6">
                            <wm-chart type="Bubble" tooltips="false"></wm-chart>
                        </wm-gridcolumn>
                    </wm-gridrow>
                </wm-layoutgrid>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
