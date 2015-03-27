/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Chart Widget*/
describe("Chart", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        markup = '<wm-chart type="Pie" offsetleft="75" offsetright="25" offsetbottom="25" offsettop="25" xaxisdatakey="xaxis" xaxislabel="xaxislabel" xaxislabeldistance = "10" xdigits = "5"'  +
            'xnumberformat = "Precision" xdateformat = "%B" yaxisdatakey = "yaxis" yaxislabel = "yaxislabel" yaxislabeldistance = "10"' +
            'ydigits = "5" ynumberformat = "Precision" ydateformat = "%B" tooltips = "false" showlegend = "false" legendposition = "Bottom"' +
            'reducexticks = "false" barspacing = "0.5" staggerlabels = "true" showcontrols = "true" showvalues = "true" showlabels = "false"' +
            'labeltype = "value" showlabelsoutside = "false" donutratio = "0.7" aggregation="count" aggregationcolumn="eid" groupby="department.name,department.location"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'orderby = "eid" theme="Annabelle"' +
            '></wm-chart>';
    widget.type = 'wm-chart';
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    
    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for Chart widget.*/
    describe("Executing custom test suite for Chart", function () {
        beforeEach(function () {
            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.variables');
            module('wm.plugins.database');
            module('wm.plugins.webServices');

            inject(function (_$compile_, _$rootScope_, WidgetProperties) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $unCompiled = WM.element(widget.unCompiled);
                widgetConfig = WidgetProperties.getConfig('wm-chart');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.$digest();
                iScope = element.isolateScope();
            });
        });

        /*Test Suite for testing the properties specific to Chart widget.*/
        describe("Testing events specific to Chart", function () {
            it("test the onTransform event", function () {
                var testVariable = "Before Transform";
                element.onTransform = function () {
                    testVariable = "After Transform";
                };
                iScope.$apply();
                element.onTransform();
                expect(testVariable).toBe("After Transform");
            });
        });
    });
});
