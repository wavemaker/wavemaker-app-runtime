/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a slider*/
describe("Testing Form Widget: slider", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-slider name="Slider name" hint="Slider hint" ' +
            'width="400px" height="50px" minvalue="0" ' +
            'maxvalue="100" step="5" readonly="false" disabled="false" show="true" class="col-md-push-3" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            '></wm-slider>';

    widget.type = 'wm-slider'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["animation", "badgevalue"];

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-slider widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {

            /*Include the required modules.*/
            module('wm.common');
            module('wm.utils');
            module('wm.widgets');
            module('ngRoute');

            inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $element = $compile(widget.$unCompiled.clone())($rootScope);

                // if the widgetSelector is other than `element`,
                // find the widget and its isolateScope using widgetSelector
                if (widget.widgetSelector && widget.widgetSelector !== 'element') {
                    $element = $element.find(widget.widgetSelector).first();
                }
                iScope = $element.isolateScope();
                iScope.$apply();
            });
        });

        describe("properties", function () {
            //check for the readonly property
            it("should set the datavalue property", function () {
                iScope.datavalue = "25";
                iScope.$apply();
                expect($element.find('input').attr("title")).toBe("25");
            });

            //check for the minvalue property
            it("should set the minvalue property", function () {
                iScope.minvalue = "0";
                iScope.$apply();
                expect($element.find('input').attr("min")).toBe("0");
            });

            //check for the maxvalue property
            it("should set the maxvalue property", function () {
                iScope.maxvalue = "100";
                iScope.$apply();
                expect($element.find('input').attr("max")).toBe("100");
            });

            //check for the step property
            it("should set the step property", function () {
                iScope.step = "5";
                iScope.$apply();
                expect($element.find('input').attr("step")).toBe("5");
            });

            //check for the readonly property
            it("should set the readonly property", function () {
                iScope.readonly = true;
                iScope.$apply();
                expect($element.attr("readonly")).toBe("readonly");
            });

            //check for the disabled property
            it("should set the disabled property", function () {
                iScope.disabled = true;
                iScope.$apply();
                expect($element.attr("disabled")).toBe("disabled");
            });
        });
    });
});
