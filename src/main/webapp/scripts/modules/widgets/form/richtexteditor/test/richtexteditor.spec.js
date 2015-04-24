/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a richtexteditor*/
describe("Testing Form Widget: richtexteditor", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            ' <wm-richtexteditor name="richtexteditor Name" tabindex="2" ' +
            'placeholder="richtexteditor Placeholder" width="500px" height="300px" ' +
            'readonly="true" showpreview="true" show="true" class="col-md-push-3" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            '></wm-richtexteditor>';

    widget.type = 'wm-richtexteditor'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["animation", "badgevalue"];

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-richtexteditor widget.*/
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
            //check for the placeholder property
            it("should check the placeholder as put in property panel", function () {
                expect($element.find('p').text()).toBe(iScope.placeholder);
            });

            //check for the readonly property
            it("should set the readonly property", function () {
                iScope.readonly = true;
                iScope.$apply();
                expect($element.attr("readonly")).toBe("readonly");
            });

            //check for the showpreview property
            it("should set the showpreview property", function () {
                iScope.showpreview = true;
                iScope.$apply();
                expect($element.attr("showpreview")).toMatch(iScope.showpreview);
            });
        });
    });
});
