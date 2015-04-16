/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a time*/
describe("Testing Form Widget: time", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-time name="Time name" tabindex="2" placeholder="Time placeholder" hint="Time hint"' +
            'datavalue="1428994369719" scopedatavalue="currentTime" ismeridian="true" hourstep="1" minutestep="15" required="false" ' +
            'autofocus="false" readonly="false" show="true" disabled="false"  class="col-md-push-3"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()"' +
            //TODO: 'on-focus="eventHandler()" on-blur="eventHandler()" ' +
            '></wm-text>';

    widget.type = 'wm-time'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["datavalue", "scopedatavalue", "animation", "badgevalue"];

    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element'
        //'focus': 'element',
        //'blur': 'element'
    };
    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-time widget.*/
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
            it("should change placeholder in time to placeholderForTime when put in property panel", function () {
                iScope.placeholder = "placeholderForTime";
                iScope.$apply();
                expect($element.find('input').attr('placeholder')).toMatch(/placeholderForTime/i);
            });

            //check for the hourstep property
            it("should change hourstep for time to 1 when put in property panel", function () {
                iScope.hourstep = "1";
                iScope.$apply();
                expect($element.attr('hourstep')).toMatch(1);
            });

            //check for the minutestep property
            it("should change minutestep for time to 15 when put in property panel", function () {
                iScope.minutestep = "15";
                iScope.$apply();
                expect($element.attr('minutestep')).toMatch(15);
            });

            //check for the ismeridian property
            it("should set the ismeridian property", function () {
                iScope.ismeridian = true;
                iScope.$apply();
                expect($element.attr("ismeridian")).toMatch(true);
            });

            //check for the required property
            it("should set the required property", function () {
                iScope.required = true;
                iScope.$apply();
                expect($element.attr("required")).toBe("required");
            });

            //check for the disable property
            it("should disable the $element on toggling disable property", function () {
                iScope.disabled = true;
                iScope.$apply();
                expect($element.attr('disabled')).toBeTruthy();
            });

            //check for the readonly property
            it("should change the readonly property of the time on toggling readonly property", function () {
                iScope.readonly = true;
                iScope.$apply();
                expect($element.attr('readonly')).toBeTruthy();
            });

            //check for the autofocus property
            it("should set the autofocus property", function () {
                iScope.autofocus = true;
                iScope.$apply();
                expect($element.attr("autofocus")).toBe("autofocus");
            });

            //check for the datavalue property
            it("should check the datavalue as put in property panel", function () {
                iScope.datavalue = 1428995261174;
                iScope.$apply();
                expect($element.find('input').val()).toBe('12:37:41 PM');
            });

            //check for the scopedatavalue property
            it("should check the scopedatavalue as put in property panel", function () {
                expect($element.attr('scopedatavalue')).toBe(iScope.scopedatavalue);
            });

        });
    });
});
