/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a date*/
describe("Testing Form Widget: date", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-date name="Date name" tabindex="2" placeholder="Select date" hint="Date hint" ' +
            'width="200px" datepattern="yyyyMMdd" mindate="Thu Jan 01 2015 00:00:00 GMT+0530 (India Standard Time)" ' +
            'required="false" maxdate="Fri Jan 01 2016 00:00:00 GMT+0530 (India Standard Time)" ' +
            'autofocus="false" readonly="false" show="true" disabled="false" class="col-md-push-3" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()"' +
            //TODO: 'on-focus="eventHandler()" on-blur="eventHandler()" ' +
            '></wm-date>';

    widget.type = 'wm-date'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["hint", "animation", "badgevalue"];
    widget.innerElement = "input";

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

    /*Custom Test Suite for wm-date widget.*/
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
            //check for the hint property
            it("should change helptext for currency to helpText when put in property panel", function () {
                iScope.hint = "helpText";
                iScope.$apply();
                expect($element.find("input").attr('title')).toMatch(/helpText/i);
            });

            //check for the placeholder property
            it("should change placeholder in currency to placeholderForDate when put in property panel", function () {
                iScope.placeholder = "placeholderForDate";
                iScope.$apply();
                expect($element.find("input").attr('placeholder')).toMatch(/placeholderForDate/i);
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
            it("should change the readonly property of the textbox on toggling readonly property", function () {
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

            //check for the datepattern property
            it("should check the datepattern as put in property panel", function () {
                expect($element.attr('datepattern')).toMatch(iScope.datepattern);
            });

            //check for the mindate property
            it("should check the mindate as put in property panel", function () {
                expect($element.attr('mindate')).toBe(iScope.mindate);
            });

            //check for the maxdate property
            it("should check the maxdate as put in property panel", function () {
                expect($element.attr('maxdate')).toBe(iScope.maxdate);
            });

            //check for the datavalue property
            it("should check the datavalue as put in property panel", function () {
                iScope.datavalue = "Tue Dec 01 2015 00:00:00 GMT+0530 (India Standard Time)";
                iScope.$apply();
                expect($element.find('input').val()).toBe("Tue Dec 01 2015 00:00:00 GMT+0530 (India Standard Time)");
            });

            //check for the datavalue property
            it("should check the epoch datavalue as put in property panel", function () {
                iScope.datavalue = 1428995261174;
                iScope.$apply();
                expect($element.find('input').val()).toBe("Tue Apr 14 2015 12:37:41 GMT+0530 (India Standard Time)");
            });

        });
    });
});
