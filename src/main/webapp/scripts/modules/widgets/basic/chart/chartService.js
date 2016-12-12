/*global WM, nv, d3, _, studio, $*/
/*jslint todo : true*/

WM.module('wm.widgets.basic')
    .service('ChartService', [
        'Utils',
        function (Utils) {
            'use strict';
            var chartTypes = ['Column', 'Line', 'Area', 'Cumulative Line', 'Bar', 'Pie', 'Donut', 'Bubble'],
                allShapes = ['circle', 'square', 'diamond', 'cross', 'triangle-up', 'triangle-down'],
                themes = {
                    'Terrestrial': {
                        colors: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'],
                        tooltip: {
                            'backgroundColor': '#de7d28',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Annabelle': {
                        colors: ['#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39', '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6'],
                        tooltip: {
                            'backgroundColor': '#2e306f',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Azure': {
                        colors: ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'],
                        tooltip: {
                            'backgroundColor': '#3182bd',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Retro': {
                        colors: ['#0ca7a1', '#ffa615', '#334957', '#acc5c2', '#988f90', '#8accc9', '#515151', '#f27861', '#36c9fd', '#794668', '#0f709d', '#0d2738', '#44be78', '#4a1839', '#6a393f', '#557d8b', '#6c331c', '#1c1c1c', '#861500', '#09562a'],
                        tooltip: {
                            'backgroundColor': '#80513a',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Mellow': {
                        colors: ['#f0dcbf', '#88c877', '#aeb918', '#2e2c23', '#ddddd2', '#dfe956', '#4c963b', '#5d3801', '#e1eec3', '#cd8472', '#fcfab3', '#9a4635', '#9295ad', '#2e3f12', '#565677', '#557d8b', '#4f4d02', '#0c0c1b', '#833324', '#24120e'],
                        tooltip: {
                            'backgroundColor': '#7c9e73',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Orient': {
                        colors: ['#a80000', '#cc6c3c', '#f0e400', '#000084', '#fccc6c', '#009c6c', '#cc309c', '#78cc00', '#fc84e4', '#48e4fc', '#4878d8', '#186c0c', '#606060', '#a8a8a8', '#000000', '#d7d7d7', '#75a06e', '#190d0b', '#888888', '#694b84'],
                        tooltip: {
                            'backgroundColor': '#c14242',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'GrayScale': {
                        colors: ['#141414', '#353535', '#5b5b5b', '#848484', '#a8a8a8', '#c3c3c3', '#e0e0e0', '#c8c8c8', '#a5a5a5', '#878787', '#656565', '#4e4e4e', '#303030', '#1c1c1c', '#4f4f4f', '#3b3b3b', '#757575', '#606060', '#868686', '#c1c1c1'],
                        tooltip: {
                            'backgroundColor': '#575757',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Flyer': {
                        colors: ['#3f454c', '#5a646e', '#848778', '#cededf', '#74c4dd', '#0946ed', '#380bb1', '#000ff0', '#f54a23', '#1db262', '#bca3aa', '#ffa500', '#a86b32', '#63a18c', '#56795e', '#934343', '#b75f5f', '#752d2d', '#4e1111', '#920606'],
                        tooltip: {
                            'backgroundColor': '#47637c',
                            'textColor': '#FFFFFF'
                        }
                    },
                    'Luminosity': {
                        colors: ['#FFFFFF', '#e4e4e4', '#00bcd4', '#f0dd2f', '#00aabf', '#018376', '#e91e63', '#39e5d4', '#ff6d6d', '#00ff76', '#ff9800', '#969696', '#ff4200', '#e00000', '#95cbe5', '#5331ff', '#fff4a7', '#e7a800', '#0061e4', '#d5e7ff'],
                        tooltip: {
                            'backgroundColor': '#47637c',
                            'textColor': '#FFFFFF'
                        }
                    }
                },
                basicProperties = ['xaxislabel', 'yaxislabel', 'xunits', 'yunits', 'xnumberformat', 'xdateformat', 'ynumberformat', 'showvalues', 'showlabels', 'viewtype', 'areaviewtype', 'staggerlabels', 'reducexticks', 'offsettop', 'offsetbottom', 'offsetright', 'offsetleft', 'barspacing', 'xaxislabeldistance', 'yaxislabeldistance', 'theme', 'labeltype', 'donutratio', 'showlabelsoutside', 'showxdistance', 'showydistance', 'shape', 'nodatamessage', 'captions', 'showxaxis', 'showyaxis', 'centerlabel', 'customcolors', 'showlegend', 'legendtype', 'xdomain', 'ydomain', 'tooltips', 'linethickness', 'highlightpoints'],
                barSpacingMap = {
                    'small' : 0.3,
                    'medium' : 0.5,
                    'large' : 0.8
                },
                donutRatioMap = {
                    'small' : 0.3,
                    'medium' : 0.6,
                    'large' : 0.7
                },
                barSpacingMapInvert = _.invert(barSpacingMap),
                donutRatioMapInvert = _.invert(donutRatioMap),
                tickformats = {
                    'Thousand': {
                        'prefix': 'K',
                        'divider': 1000
                    },
                    'Million' : {
                        'prefix': 'M',
                        'divider': 1000000
                    },
                    'Billion' : {
                        'prefix': 'B',
                        'divider': 1000000000
                    }
                },
                chartId = '#preview-chart',
                dataTypeJSON = ['Column', 'Line', 'Pie', 'Bar', 'Donut', 'Bubble'],    //Charts that supports the data to be JSON;
                lineTypeCharts = ['Line', 'Area', 'Cumulative Line'],   //Charts that does not supports the string type of data in the xaxis in the nvd3;
                dataTypeArray = ['Cumulative Line', 'Area'];     //Charts that supports the data to be Array

            // returns true if chart type is pie
            function isPieChart(type) {
                return (type === 'Pie');
            }

            // returns true if chart type is pie
            function isLineChart(type) {
                return (type === 'Line');
            }

            // returns true if chart type is bar
            function isBarChart(type) {
                return (type === 'Bar');
            }

            // returns true if chart type is donut
            function isDonutChart(type) {
                return (type === 'Donut');
            }

            // returns true if chart type is bubble
            function isBubbleChart(type) {
                return (type === 'Bubble');
            }

            // returns true if chart type is column
            function isColumnChart(type) {
                return (type === 'Column');
            }

            // returns true if chart type is area
            function isAreaChart(type) {
                return (type === 'Area');
            }

            // returns true if chart type is pie or donut
            function isPieType(type) {
                return (isPieChart(type) || isDonutChart(type));
            }

            // The format of chart data is array of json objects in case of the following types of chart
            function isChartDataJSON(type) {
                return (_.includes(dataTypeJSON, type) || !_.includes(chartTypes, type));
            }

            // The format of chart data is array of objects in case of the following types of chart
            function isChartDataArray(type) {
                return (_.includes(dataTypeArray, type));
            }

            // returns true is the chart type is 'line', 'area' or 'cumulative line' else false
            function isLineTypeChart(type) {
                return (_.includes(lineTypeCharts, type));
            }

            //X/Y Domain properties are supported only for Column and Area charts
            function isAxisDomainSupported(type) {
                return isColumnChart(type) || isAreaChart(type);
            }

            //Returns bar spacing value
            function getBarSpacingValue(value, prop) {
                if (prop === 'value') {
                    return barSpacingMap[value];
                }
                if (prop === 'key') {
                    return barSpacingMapInvert[value];
                }
            }

            //Returns radius value
            function getRadiusValue(value, prop) {
                if (prop === 'value') {
                    return donutRatioMap[value];
                }
                if (prop === 'key') {
                    return donutRatioMapInvert[value];
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

            //Returns labels config
            function getLabelValues(showlabels, showlabelsoutside, prop) {
                var labelsConfig = {};
                switch (showlabels) {
                case 'hide':
                    labelsConfig.showlabels = false;
                    break;
                case 'inside':
                    labelsConfig.showlabels = true;
                    labelsConfig.showlabelsoutside = false;
                    break;
                case 'outside':
                    labelsConfig.showlabels = true;
                    labelsConfig.showlabelsoutside = true;
                    break;
                }
                return labelsConfig;
            }

            //Construct the sample data
            function constructSampleData(dataType, yaxisLength, shape) {
                var first_series = [],
                    second_series = [],
                    third_series = [],
                    first_series_array = [],
                    second_series_array = [],
                    third_series_array = [],
                    first_series_bubble = [],
                    second_series_bubble = [],
                    third_series_bubble = [],
                    data = [];
                switch (dataType) {
                case 'jsonFormat':
                    first_series = [
                        {'x': '01-01-2001', 'y': 4000000},
                        {'x': '01-01-2002', 'y': 1000000},
                        {'x': '01-01-2003', 'y': 5000000}
                    ];
                    second_series = [
                        {'x': '01-01-2001', 'y': 3000000},
                        {'x': '01-01-2002', 'y': 4000000},
                        {'x': '01-01-2003', 'y': 7000000}
                    ];
                    third_series = [
                        {'x': '01-01-2001', 'y': 2000000},
                        {'x': '01-01-2002', 'y': 8000000},
                        {'x': '01-01-2003', 'y': 6000000}
                    ];
                    data[0] = {
                        values: first_series,
                        key: 'Apples'
                    };
                    if (yaxisLength >= 2) {
                        data[1] = {
                            values: second_series,
                            key: 'Oranges'
                        };
                    }
                    if (yaxisLength >= 3) {
                        data[2] = {
                            values: third_series,
                            key: 'Grapes'
                        };
                    }
                    break;
                case 'lineChartFormat':
                    first_series = [
                        {'x': 1, 'y': 4000000},
                        {'x': 2, 'y': 1000000},
                        {'x': 3, 'y': 5000000}
                    ];
                    second_series = [
                        {'x': 1, 'y': 3000000},
                        {'x': 2, 'y': 4000000},
                        {'x': 3, 'y': 7000000}
                    ];
                    third_series = [
                        {'x': 1, 'y': 2000000},
                        {'x': 2, 'y': 8000000},
                        {'x': 3, 'y': 6000000}
                    ];
                    data[0] = {
                        values: first_series,
                        key: 'Apples'
                    };
                    if (yaxisLength >= 2) {
                        data[1] = {
                            values: second_series,
                            key: 'Oranges'
                        };
                    }
                    if (yaxisLength >= 3) {
                        data[2] = {
                            values: third_series,
                            key: 'Grapes'
                        };
                    }
                    break;
                case 'arrayFormat':
                    first_series_array = [
                        [1, 4000000],
                        [2, 1000000],
                        [3, 5000000]
                    ];
                    second_series_array = [
                        [1, 3000000],
                        [2, 4000000],
                        [3, 7000000]
                    ];
                    third_series_array = [
                        [1, 2000000],
                        [2, 8000000],
                        [3, 6000000]
                    ];
                    data[0] = {
                        values: first_series_array,
                        key: 'Apples'
                    };
                    if (yaxisLength >= 2) {
                        data[1] = {
                            values: second_series_array,
                            key: 'Oranges'
                        };
                    }
                    if (yaxisLength >= 3) {
                        data[2] = {
                            values: third_series_array,
                            key: 'Grapes'
                        };
                    }
                    break;
                case 'bubbleFormat':
                    shape = shape === 'random' ?  allShapes[Math.floor(Math.random() * allShapes.length)] : shape;
                    first_series_bubble = [
                        {'x': 80.66, 'y': 33739900,  'size': 78, 'shape': shape},
                        {'x': 79.84, 'y': 81902300,  'size': 90, 'shape': shape},
                        {'x': 78.6,  'y': 5523100,   'size': 45, 'shape': shape}
                    ];
                    second_series_bubble = [
                        {'x': 72.73, 'y': 79716200,  'size': 98, 'shape': shape},
                        {'x': 80.05, 'y': 61801600,  'size': 20, 'shape': shape},
                        {'x': 72.49, 'y': 73137200,  'size': 34, 'shape': shape}
                    ];
                    third_series_bubble = [
                        {'x': 68.09, 'y': 33739900,  'size': 45, 'shape': shape},
                        {'x': 81.55, 'y': 7485600,   'size': 78, 'shape': shape},
                        {'x': 68.60, 'y': 141850000, 'size': 56, 'shape': shape}
                    ];
                    data[0] = {
                        values: first_series_bubble,
                        key: 'Europe'
                    };
                    if (yaxisLength >= 2) {
                        data[1] = {
                            values: second_series_bubble,
                            key: 'Asia'
                        };
                    }
                    if (yaxisLength >= 3) {
                        data[2] = {
                            values: third_series_bubble,
                            key: 'Africa'
                        };
                    }
                    break;
                case 'pieChartFormat':
                    data = [
                        {'x': 'Group 1', 'y': 1000000},
                        {'x': 'Group 2', 'y': 2000000},
                        {'x': 'Group 3', 'y': 3000000},
                        {'x': 'Group 4', 'y': 4000000}
                    ];
                    break;
                }
                return data;
            }

            function getDataType(scope) {
                var type = scope.type;
                if (isLineChart(type)) {
                    return 'lineChartFormat';
                }
                if (isPieType(type)) {
                    return 'pieChartFormat';
                }
                if (isBubbleChart(type)) {
                    return 'bubbleFormat';
                }
                return isChartDataJSON(type) ? 'jsonFormat' : 'arrayFormat';
            }

            // Sample data to populate when no data is bound
            function getSampleData(scope) {
                return constructSampleData(getDataType(scope), _.split(scope.yaxisdatakey, ',').length, scope.shape);
            }

            //Check whether X/Y Domain was set to Min and is supported for the present chart
            function isAxisDomainValid(scope, axis) {
                if (scope[axis + 'domain'] === 'Min' && (isAxisDomainSupported(scope.type))) {
                    return true;
                }
                return false;
            }

            //Check whether min and max values are finite or not
            function areMinMaxValuesValid(values) {
                if (_.isFinite(values.min) && _.isFinite(values.max)) {
                    return true;
                }
                return false;
            }

            function getYScaleMinValue(value) {
                var _min = Math.floor(value);
                /* If the number has a) decimal part returning floor value - 0.1
                 b) no decimal part returning floor value - 1 */
                return Math.abs(value) - _min > 0 ? value - 0.1 : _min - 1;
            }

            //Chooses the data points of line/cumulative line/area chart and highlights them
            function highlightPoints(id, highlightpoints) {
                var chartSvg = id ? d3.select('#wmChart' + id + ' svg') : d3.select(chartId + ' svg');
                if (highlightpoints) {
                    chartSvg.selectAll('.nv-point').style({'stroke-width': '6px', 'fill-opacity': '.95', 'stroke-opacity': '.95'});
                } else {
                    chartSvg.selectAll('.nv-point').style({'stroke-width': '0px', 'fill-opacity': '0'});
                }
            }

            //Chooses the line of line/cumulative line and increases the thickness of it
            function setLineThickness(id, thickness) {
                var chartSvg = id ? d3.select('#wmChart' + id + ' svg') : d3.select(chartId + ' svg');
                thickness = thickness || 1.5;
                chartSvg.selectAll('.nv-line').style({'stroke-width': thickness});
            }

            //Constructing a common key value map for preview and canvas mode
            function initProperties(scope, propertyValueMap) {
                if (!propertyValueMap || Utils.isEmptyObject(propertyValueMap)) {
                    propertyValueMap = {};
                }
                _.forEach(basicProperties, function (prop) {
                    if (WM.isUndefined(propertyValueMap[prop])) {
                        propertyValueMap[prop] = scope[prop];
                    }
                });

                return propertyValueMap;
            }

            function getNumberValue(value, callback) {
                return isNaN(parseInt(value, 10)) ? callback(value, 'value') : value;
            }

            // Hide the properties that are passed to it
            function hideOrShowProperties(properties, scope, show, key) {
                var showKey = key || 'show';
                // sanity check
                show = WM.isDefined(show) ? show : false;

                var _widgetProps = scope.widgetProps;
                _.forEach(properties, function (prop) {
                    _widgetProps[prop][showKey] = show;
                });
            }

            //Formats the given value according to date format
            function getDateFormatedData(dateFormat, d) {
                dateFormat = dateFormat || '%x';
                return d3.time.format(dateFormat)(new Date(d));
            }

            //Formats the given value according to number format
            function getNumberFormatedData(numberFormat, d) {
                var formattedData,
                    divider,
                    prefix;
                formattedData = d3.format(numberFormat)(d);
                //formatting the data based on number format selected
                if (numberFormat) {
                    //Getting the respective divider[1000,1000000,1000000000] based on the number format choosen
                    divider = (tickformats[numberFormat] && tickformats[numberFormat].divider) || 0;
                    prefix = tickformats[numberFormat] && tickformats[numberFormat].prefix;
                    if (prefix && divider !== 0) {
                        formattedData = d3.format('.2f')(d / divider) + prefix;
                    }
                } else {
                    //Auto formatting the data when no formating option is chosen
                    formattedData = d >= 1000 ? d3.format('.1s')(d) : d;
                }
                return formattedData;
            }

            //Set the visibility property of the chart x,y axis due to a bug in the nvd3
            function toggleAxisShow(property, value) {
                var $xAxis = d3.select(chartId + ' g.nv-axis.nv-x'),
                    $yAxis = d3.select(chartId + ' g.nv-axis.nv-y');
                if (property === 'showxaxis') {
                    $xAxis.style('visibility', value ? 'visible' : 'hidden');
                } else {
                    $yAxis.style('visibility', value ? 'visible' : 'hidden');
                }
            }

            function modifyLegendPosition(scope, position, id) {
                var showLegend = isShowLegend(scope.showlegend),
                    chart_Id = id ? '#wmChart' + id : chartId,
                    legendWrap = d3.select(chart_Id + ' .nv-legendWrap'),
                    legendPadding = 5;
                //Return when showlegend is false
                if (!showLegend || !legendWrap[0][0]) {
                    return;
                }
                if (position === 'bottom') {
                    var legendWrapHeight = legendWrap[0][0].getBoundingClientRect().height,
                        wrap = d3.select(chart_Id + ' .nv-wrap'),
                        wrapTransform = (wrap && wrap.attr('transform')) ? wrap.attr('transform').replace(/, /g, ',') : '',
                        coordinates = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(wrapTransform),
                        getChartHeight = function () {
                            var chartHeight = WM.element(chart_Id + ' svg>.nvd3.nv-wrap')[0].getBoundingClientRect().height;
                            if (chartHeight === 0) { //fix for IE
                                chartHeight = (WM.element(chart_Id + ' svg')[0].getBoundingClientRect().height - (legendWrapHeight + 15));
                            }
                            return chartHeight;
                        };
                    legendWrap.attr('transform', 'translate(0 , ' + (getChartHeight() - legendWrapHeight - legendPadding) + ')');
                    wrap.attr('transform', 'translate(' + coordinates[1] + ',' + legendPadding + ')');
                }
            }

            //Returns value if legend need to shown or not
            function isShowLegend(value) {
                //Old projects will have either true or false
                if (value === 'false' || value === false) {
                    return false;
                }
                if (value === 'true' || value === true) {
                    return true;
                }
                //New projects will have either 'Hide Legend', 'Show Top', 'Show Bottom'
                return value === 'hide' ? false : true;
            }

            // intializes the chart obejct
            function initChart(scope, xDomainValues, yDomainValues, propertyValueMap, isPreview) {
                propertyValueMap =  initProperties(scope, propertyValueMap);
                var chart, xValue = {}, yValue = {}, colors = [], xaxislabel, yaxislabel, labelConfig, radius, barSpacing,
                    showLegend, xAxisValue;
                switch (scope.type) {
                case 'Column':
                    barSpacing = getNumberValue(propertyValueMap.barspacing, getBarSpacingValue) || barSpacingMap.medium;
                    chart = nv.models.multiBarChart()
                        .x(function (d) {
                            return d.x;
                        })
                        .y(function (d) {
                            return d.y;
                        })
                        .reduceXTicks(propertyValueMap.reducexticks)
                        .rotateLabels(0)
                        .showControls(false)
                        .stacked(propertyValueMap.viewtype === 'Stacked' ?  true : false)
                        .groupSpacing(barSpacing);
                    break;
                case 'Cumulative Line':
                    chart = nv.models.cumulativeLineChart()
                        .x(function (d) {
                            return d[0];
                        })
                        .y(function (d) {
                            return d[1];
                        })
                        .showControls(false)
                        .useInteractiveGuideline(propertyValueMap.tooltips);
                    break;
                case 'Line':
                    chart = nv.models.lineChart()
                        .useInteractiveGuideline(propertyValueMap.tooltips);
                    break;
                case 'Area':
                    chart = nv.models.stackedAreaChart()
                        .x(function (d) {
                            return d[0];
                        })
                        .y(function (d) {
                            return d[1];
                        })
                        .clipEdge(true)
                        .showControls(false)
                        .style(propertyValueMap.areaviewtype)
                        .useInteractiveGuideline(propertyValueMap.tooltips);
                    break;
                case 'Bar':
                    barSpacing = getNumberValue(propertyValueMap.barspacing, getBarSpacingValue) || barSpacingMap.medium;
                    chart = nv.models.multiBarHorizontalChart()
                        .x(function (d) {
                            return d.x;
                        })
                        .y(function (d) {
                            return d.y;
                        })
                        .showControls(false)
                        .stacked(propertyValueMap.viewtype === 'Stacked' ?  true : false)
                        .showValues(propertyValueMap.showvalues)
                        .groupSpacing(barSpacing);
                    break;
                case 'Pie':
                case 'Donut':
                    labelConfig = getLabelValues(propertyValueMap.showlabels, propertyValueMap.showlabelsoutside, 'value');
                    radius = getNumberValue(propertyValueMap.donutratio, getRadiusValue) || donutRatioMap.medium;
                    chart = nv.models.pieChart()
                        .x(function (d) {
                            return d.x;
                        })
                        .y(function (d) {
                            return d.y;
                        })
                        .showLabels(labelConfig.showlabels)
                        .labelType(propertyValueMap.labeltype)
                        .valueFormat(d3.format('%'))
                        .title(propertyValueMap.centerlabel)
                        .labelThreshold(0.04)
                        .labelsOutside(labelConfig.showlabelsoutside);
                    if (isDonutChart(scope.type)) {
                        chart.donut(true)
                            .donutRatio(radius);
                    }
                    break;
                case 'Bubble':
                    chart = nv.models.scatterChart()
                        .x(function (d) {
                            return d.x;
                        })
                        .y(function (d) {
                            return d.y;
                        })
                        .showDistX(propertyValueMap.showxdistance)
                        .showDistY(propertyValueMap.showydistance);
                    break;
                }

                if (xDomainValues) {
                    xValue.min = xDomainValues.min.x || xDomainValues.min[0];
                    xValue.max = xDomainValues.max.x || xDomainValues.max[0];
                    //If the values on the x axis are string then min max values gives Infinity
                    if (areMinMaxValuesValid(xValue)) {
                        //Reducing the min value to 0.1 so the min value is not missed out
                        xValue.min = getYScaleMinValue(xValue.min);
                        chart.xDomain([xValue.min, xValue.max]);
                    }
                }

                if (yDomainValues) {
                    //Reducing the min value to 1 so the min value is not missed out
                    yValue.min = yDomainValues.min.y || yDomainValues.min[1];
                    yValue.max = yDomainValues.max.y || yDomainValues.max[1];
                    //If the values on the y axis are string or invalid then min max values gives Infinity
                    if (areMinMaxValuesValid(yValue)) {
                        //Reducing the min value to 1 so the min value is not missed out
                        yValue.min = getYScaleMinValue(yValue.min);
                        chart.yDomain([yValue.min, yValue.max]);
                    }
                }

                //Setting the legend type choosen by user or default it will be furious
                chart.legend.vers((propertyValueMap.legendtype && propertyValueMap.legendtype.toLowerCase()) || 'furious');

                if (!_.includes(chartTypes, scope.type)) {
                    chart = nv.models.multiBarChart()
                        .x(function (d) {
                            return d.x;
                        })
                        .y(function (d) {
                            return d.y;
                        });
                }


                if (isPieType(scope.type)) {
                    //In case of pie/donut chart formatting the values of it
                    if (propertyValueMap.labeltype === 'percent') {
                        chart.valueFormat(d3.format('%'));
                    } else {
                        chart.valueFormat(function (d) {
                            return getNumberFormatedData(propertyValueMap.ynumberformat, d);
                        });
                    }
                    //Customizing the tooltips in case of the pie and donut when labelType is value
                    chart.tooltip.contentGenerator(function (key) {
                        yValue = getNumberFormatedData(propertyValueMap.ynumberformat, key.data.y);
                        return '<table>' +
                                    '<tbody>' +
                                         '<tr>' +
                                            '<td class="legend-color-guide"><div style="background-color:' + key.color + ';"></div></td>' +
                                            '<td class="key">' + key.data.x + '</td>' +
                                            '<td class="value">' + yValue + '</td>' +
                                        '</tr>' +
                                    '</tbody>' +
                                '</table>';
                    });
                } else {
                    chart.showXAxis(propertyValueMap.showxaxis)
                        .showYAxis(propertyValueMap.showyaxis);

                    //Setting the labels if they are specified explicitly or taking the axiskeys chosen
                    xaxislabel = propertyValueMap.xaxislabel || scope.xaxisdatakey || 'x caption';
                    yaxislabel = propertyValueMap.yaxislabel || scope.yaxisdatakey || 'y caption';
                    //Adding the units to the captions if they are specified
                    xaxislabel += propertyValueMap.xunits ? '(' + propertyValueMap.xunits + ')' : '';
                    yaxislabel += propertyValueMap.yunits ? '(' + propertyValueMap.yunits + ')' : '';

                    chart.xAxis
                        .axisLabel(Utils.prettifyLabels(xaxislabel))
                        .axisLabelDistance(propertyValueMap.xaxislabeldistance)
                        .staggerLabels(propertyValueMap.staggerlabels);

                    // If date format set format based date format
                    if (propertyValueMap.xdateformat || (isPreview && !isBubbleChart(scope.type))) {
                        if (isLineTypeChart(scope.type)) {
                            chart.xAxis.tickFormat(function (d) {
                                //get the actual value
                                xAxisValue = scope.xDataKeyArr[d];
                                return getDateFormatedData(propertyValueMap.xdateformat, xAxisValue);
                            });
                        } else {
                            chart.xAxis.tickFormat(function (d) {
                                return getDateFormatedData(propertyValueMap.xdateformat, d);
                            });
                        }
                    } else if (propertyValueMap.xnumberformat) {
                        chart.xAxis.tickFormat(function (d) {
                            return getNumberFormatedData(propertyValueMap.xnumberformat, d);
                        });
                    } else {
                        if (isLineTypeChart(scope.type)) {
                            chart.xAxis.tickFormat(function (d) {
                                //get the actual value
                                return scope.xDataKeyArr[d];
                            });
                        }
                    }
                    chart.yAxis
                        .axisLabel(Utils.prettifyLabels(yaxislabel))
                        .axisLabelDistance(propertyValueMap.yaxislabeldistance)
                        .staggerLabels(propertyValueMap.staggerlabels)
                        .tickFormat(function (d) {
                            return getNumberFormatedData(propertyValueMap.ynumberformat, d);
                        });
                    if (isBarChart(scope.type)) {
                        chart.valueFormat(function (d) {
                            return getNumberFormatedData(propertyValueMap.ynumberformat, d);
                        });
                    }
                }

                //Support for custom colors if user gives direct string of colors in text box
                if (WM.isString(propertyValueMap.customcolors) && propertyValueMap.customcolors) {
                    colors = _.split(propertyValueMap.customcolors, ',');
                }
                if (WM.isArray(propertyValueMap.customcolors)) {
                    colors = propertyValueMap.customcolors;
                }

                showLegend = isShowLegend(propertyValueMap.showlegend);
                chart.showLegend(showLegend)
                    .margin({top: propertyValueMap.offsettop, right: propertyValueMap.offsetright, bottom: propertyValueMap.offsetbottom, left: propertyValueMap.offsetleft})
                    .color(colors.length ? colors : themes[propertyValueMap.theme].colors);

                chart.tooltip.enabled(propertyValueMap.tooltips);
                scope.message = propertyValueMap.nodatamessage || 'No data found';
                //setting the no data message
                chart.noData(scope.message);

                return chart;
            }

            function postPlotChartProcess(scope, isPreview) {
                var id = isPreview ? null : scope.$id;
                //If user sets to highlight the data points and increase the thickness of the line
                if (isLineTypeChart(scope.type)) {
                    setLineThickness(id, scope.linethickness);
                    highlightPoints(id, scope.highlightpoints);
                }
                //Modifying the legend position only when legend is shown
                if (scope.showlegend) {
                    modifyLegendPosition(scope, scope.showlegend, id);
                }
            }

            this.isBarChart           = isBarChart;
            this.isBubbleChart        = isBubbleChart;
            this.isPieType            = isPieType;
            this.isChartDataJSON      = isChartDataJSON;
            this.isChartDataArray     = isChartDataArray;
            this.isLineTypeChart      = isLineTypeChart;
            this.getSampleData        = getSampleData;
            this.initChart            = initChart;
            this.isAxisDomainValid    = isAxisDomainValid;
            this.highlightPoints      = highlightPoints;
            this.setLineThickness     = setLineThickness;
            this.getBarSpacingValue   = getBarSpacingValue;
            this.getRadiusValue       = getRadiusValue;
            this.getLabelValues       = getLabelValues;
            this.modifyLegendPosition = modifyLegendPosition;
            this.toggleAxisShow       = toggleAxisShow;
            this.hideOrShowProperties = hideOrShowProperties;
            this.postPlotChartProcess = postPlotChartProcess;
            this.initProperties       = initProperties;
            this.allShapes            = allShapes;
            this.chartTypes           = chartTypes;
        }
    ]);
