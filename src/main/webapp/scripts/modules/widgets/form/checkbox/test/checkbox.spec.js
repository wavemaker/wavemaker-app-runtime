/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents*/
/*global modulesToBeInjected*/

describe('Testing Widget: wm-checkbox', function () {
    'use strict';

    var $compile,
        $rootScope,
        $element,
        iScope,
        widget = {},
        script_variable = 'true',
        markup =
            '<wm-checkbox caption="I agree" class="dummy-class" name="chbox1" tabindex="1" hint="tick" ' +
            'width="20" height="5" scopedatavalue="script_variable" required="true" startchecked="true" ' +
            'disabled="true" checkedvalue="true" uncheckedvalue="false" datavalue="true" ' +
            'class="col-md-push-3" fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline" ' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()" ' +
            /*'on-focus="eventHandler()" on-blur="eventHandler()"*/+ ' on-change="eventHandler()" '+
            '></wm-checkbox>';

    widget.type = 'wm-checkbox'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.innerElement = "label";
    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'change': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element'
        /*'focus': 'element',
        'blur': 'element'*/
        /*
         TODO : need to check the focus and blur event for checkbox
         */
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-button widget.*/
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

        //check for the caption property
        it("should change label to iaccept when put in property panel", function () {
            iScope.caption = "iaccept";
            iScope.$apply();
            expect($element.find('label').text()).toBe('iaccept');
        });

        //check for the tabindex property
        it("should change tabindex when put in property panel", function () {
            expect($element.attr('tabindex')).toBe('1');
        });

        //check for the scopedatavalue property
        it("should change scopedatavalue to true when put in property panel", function () {
            expect($element.attr('scopedatavalue')).toBe('script_variable');
        });

        //check for the datavalue property
        it("should change datavalue to true when put in property panel", function () {
            iScope.datavalue = "abc";
            iScope.$apply();
            expect($element.find('input:last').val()).toBe('abc');
        });

        //check for the checkedvalue property
        it("should change checkedvalue to on when put in property panel", function () {
            expect($element.attr('checkedvalue')).toBe('true');
        });

        //check for the uncheckedvalue property
        it("should change uncheckedvalue to off when put in property panel", function () {
            expect($element.attr('uncheckedvalue')).toBe('false');
        });

        //check for the required property
        it("should set the required property", function () {
            iScope.required = true;
            iScope.$apply();
            expect($element.find('input[type="checkbox"]').attr("required")).toBe("required");
        });

        //check for the startchecked property
        it("should set the startchecked property", function () {
            expect($element.attr("startchecked")).toBe("true");
        });

        //check for the disabled property
        it("should disable the $element on toggling disable property", function () {
            iScope.disabled = true;
            iScope.$apply();
            expect($element.attr('disabled')).toBe('disabled');
        });

    });
});
