/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Chart Widget*/
describe("Chart", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widgetConfig,
        element,
        $element,
        widgetPie = {},
        markupPie = '<wm-chart type="Pie" offsetleft="0" offsetright="0" offsetbottom="0" offsettop="0" xaxisdatakey="" xaxislabel="" '  +
            ' ynumberformat = "Precision" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'reducexticks = "false"  showcontrols = "true" showvalues = "true" showlabels = "false"' +
            'labeltype = "value" showlabelsoutside = "false" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize"' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetColumn = {},
        markupColumn =   '<wm-chart type="Coloumn" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="" xaxislabel="" xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "" yaxislabel = "" yaxislabeldistance = "10" xunits="" yunits="" nodatamessage="no-data" ' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'reducexticks = "false" barspacing = "0.5" staggerlabels = "true" showcontrols = "true" showvalues = "true" ' +
            'aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetLine = {},
        markupLine = '<wm-chart type="Line" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="" xaxislabel="" xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "" yaxislabel = "" yaxislabeldistance = "10" xunits="" yunits="" nodatamessage="no-data" ' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            ' showvalues = "true" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetArea = {},
        markupArea =   '<wm-chart type="Area" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="" xaxislabel=""  xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "" yaxislabel = "" yaxislabeldistance = "10" xunits="" yunits="" nodatamessage="no-data"' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'showcontrols = "true" showvalues = "true" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetBar = {},
        markupBar = '<wm-chart type="Bar" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="" xaxislabel="" xaxislabeldistance = "10" xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "" yaxislabel = "" xunits="" yunits="" nodatamessage="no-data"' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            ' showcontrols = "true" showvalues = "true" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetCumulativeLine = {},
        markupCumulativeLine =   '<wm-chart type="Cumulative Line" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="" xaxislabel="" xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "" yaxislabel = "" yaxislabeldistance = "10" xunits="" yunits="" nodatamessage="no-data" ' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'showcontrols = "true" showvalues = "true" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetDonut = {},
        markupDonut = '<wm-chart type="Donut" offsetleft="0" offsetright="0" offsetbottom="0" offsettop="0" xaxisdatakey="" xaxislabel="" '  +
            'yaxisdatakey = "" yaxislabel = "" ydigits = "5" ynumberformat = "Precision" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'showcontrols = "true" showvalues = "true" showlabels = "false"' +
            'labeltype = "value" showlabelsoutside = "false" donutratio = "0.7" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>',
        widgetBubble = {},
        markupBubble =   '<wm-chart type="Bubble" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="" xaxislabel="" xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "" yaxislabel = "" ' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'showcontrols = "true" showvalues = "true" ' +
            'aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap"   showxdistance="true"  showydistance="true" bubblesize=""' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>';



    widgetPie.type = 'wm-chart';
    widgetPie.widgetSelector = 'element'; // perform common widget tests on this element

    widgetColumn.type = 'wm-chart';
    widgetColumn.widgetSelector = 'element'; // perform common widget tests on this element

    widgetLine.type = 'wm-chart';
    widgetLine.widgetSelector = 'element'; // perform common widget tests on this element

    widgetArea.type = 'wm-chart';
    widgetArea.widgetSelector = 'element'; // perform common widget tests on this element

    widgetBar.type = 'wm-chart';
    widgetBar.widgetSelector = 'element'; // perform common widget tests on this element

    widgetCumulativeLine.type = 'wm-chart';
    widgetCumulativeLine.widgetSelector = 'element'; // perform common widget tests on this element

    widgetDonut.type = 'wm-chart';
    widgetDonut.widgetSelector = 'element'; // perform common widget tests on this element

    widgetBubble.type = 'wm-chart';
    widgetBubble.widgetSelector = 'element'; // perform common widget tests on this element

    widgetPie.chartName = "Pie"
    widgetPie.$unCompiled = WM.element(markupPie);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetPie);
    commonWidgetTests_verifyCommonProperties(widgetPie);
    commonWidgetTests_verifyStyles(widgetPie);


    widgetColumn.chartName = "Column"
    widgetColumn.$unCompiled = WM.element(markupColumn);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetColumn);
    commonWidgetTests_verifyCommonProperties(widgetColumn);
    commonWidgetTests_verifyStyles(widgetColumn);

    widgetLine.chartName = "Line"
    widgetLine.$unCompiled = WM.element(markupLine);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetLine);
    commonWidgetTests_verifyCommonProperties(widgetLine);
    commonWidgetTests_verifyStyles(widgetLine);

    widgetArea.chartName = "Area"
    widgetArea.$unCompiled = WM.element(markupArea);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetArea);
    commonWidgetTests_verifyCommonProperties(widgetArea);
    commonWidgetTests_verifyStyles(widgetArea);

    widgetBar.chartName = "Bar"
    widgetBar.$unCompiled = WM.element(markupBar);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetBar);
    commonWidgetTests_verifyCommonProperties(widgetBar);
    commonWidgetTests_verifyStyles(widgetBar);

    widgetCumulativeLine.chartName = "CumulativeLine"
    widgetCumulativeLine.$unCompiled = WM.element(markupCumulativeLine);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetCumulativeLine);
    commonWidgetTests_verifyCommonProperties(widgetCumulativeLine);
    commonWidgetTests_verifyStyles(widgetCumulativeLine);

    widgetDonut.chartName = "Donut"
    widgetDonut.$unCompiled = WM.element(markupDonut);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetDonut);
    commonWidgetTests_verifyCommonProperties(widgetDonut);
    commonWidgetTests_verifyStyles(widgetDonut);

    widgetBubble.chartName = "Bubble"
    widgetBubble.$unCompiled = WM.element(markupBubble);
    commonWidgetTests_verifyInitPropsInWidgetScope(widgetBubble);
    commonWidgetTests_verifyCommonProperties(widgetBubble);
    commonWidgetTests_verifyStyles(widgetBubble);

    /* angular modules to be injected in beforeEach phase */
    var modulesToBeInjected = [
        'wm.common',
        'wm.utils',
        'wm.widgets',
        'wm.layouts',
        'wm.layouts.containers',
        'ngRoute',
        'wm.variables',
        'wm.plugins.database',
        'wm.plugins.webServices',
        'angular-gestures'
    ];

    var allCharts = [
        widgetPie,
        widgetColumn,
        widgetLine,
        widgetArea,
        widgetBar,
        widgetDonut,
        widgetCumulativeLine,
        widgetBubble
    ];
    var testVariable;

    /*Custom Test Suite for wm-chart widget.*/
    allCharts.forEach(function (chart) {
        describe('Executing custom test suite for Chart: ' + chart.type + '-' + chart.chartName, function () {
            beforeEach(function () {
                //inject the modules
                modulesToBeInjected.forEach(function (moduleName) {
                    module(moduleName);
                });


                //inject the dependents
                inject(function (_$compile_, _$rootScope_) {
                    $compile = _$compile_;
                    $rootScope = _$rootScope_;

                    $element = $compile(chart.$unCompiled.clone())($rootScope);
                    // if the widgetSelector is other than `element`,
                    // find the widget and its isolateScope using widgetSelector
                    if (chart.widgetSelector && chart.widgetSelector !== 'element') {
                        $element = $element.find(chart.widgetSelector).first();
                    }

                    iScope = $element.isolateScope();
                    iScope.$apply();
                });

            });

            /* This logic has to refactor based on commonWidgetTests_verifyBasicEvents method and implement the event tests
            it("test the onTransform event for: " + chart.chartName + "chart", function () {
                testVariable = "Before Transform";
                $element.onTransform = function () {
                    testVariable = "After Transform";
                };
                iScope.$apply();
                $element.onTransform();
                expect(testVariable).toBe("After Transform");
            });
            */

        });
    });


});
