/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents*/
/*global modulesToBeInjected*/

describe('Testing Widget: wm-calendar', function () {
    'use strict';

    var $compile,
        $rootScope,
        $element,
        iScope,
        widget = {},
        script_variable = "01/01/2015",
        markup =
            '<wm-calendar name="calendar1" tabindex="1" hint="pick date" scopedatavalue="script_variable" required="true" ' +
            'autofocus="true" datavalue="Fri Jan 02 2015 00:00:00 GMT+0530 (India Standard Time)" datepattern="yyyy-MM-dd" disabled="true" show="false" ' +
            'placeholder="select date" ' +
            'class="dummy class" fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline" ' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()"' +
            'on-focus="eventHandler()" on-blur="eventHandler()" on-change="eventHandler()" ' +
            '></wm-calendar>';

    widget.type = 'wm-calendar'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'change': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'focus': 'element',
        'blur': 'element'
    };
    widget.PropertiesToBeExcluded = ['hint'];

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

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

        //check for the placeholder property
        it("should change placeholder in calendar to newplaceholder when put in property panel", function () {
            iScope.placeholder = "newplaceholder";
            iScope.$apply();
            expect($element.find('input').attr('placeholder')).toMatch(/newplaceholder/i);
        });

        //check for the scopedatavalue property
        it("should match the given value", function () {
            expect($element.attr('scopedatavalue')).toMatch('script_variable');
        });

        //check for the datavalue property
        it("should change datavalue of calendar to 01/02/2015 when put in property panel", function () {
            iScope.datavalue = "05/14/2015";
            iScope.$apply();
            expect($element.find('input').val()).toMatch('05/14/2015');
        });

        //check for the datepattern property
        it("should match the given date pattern", function () {
            expect($element.attr("datepattern")).toMatch('yyyy-MM-dd');
        });

        //check for the required property
        it("should set the required property", function () {
            iScope.required = true;
            iScope.$apply();
            expect($element.attr("required")).toBe("required");
        });

        //check for the autofocus property
        it("should set the autofocus property", function () {
            iScope.autofocus = true;
            iScope.$apply();
            expect($element.attr("autofocus")).toBe("autofocus");
        });

        //check for the disabled property
        it("should disable the $element on toggling disable property", function () {
            iScope.disabled = true;
            iScope.$apply();
            expect($element.attr('disabled')).toBeTruthy();
        });

        /**
         * TODO : to add test cases for on dayclick, eventdrop, eventresize events
         */

    });
});
