/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a textarea*/
describe("Testing Form Widget: textarea", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-textarea name="textarea name" tabindex="2" placeholder="textarea placeholder" ' +
            'hint="textarea hint" width="500px" height="200px" updateon="blur" updatedelay="10" ' +
            'datavalue="25" required="false" maxchars="250" autofocus="false" ' +
            'show="true" readonly="false" disabled="false" class="col-md-push-3" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()"' +
            'on-focus="eventHandler()" on-blur="eventHandler()" ' +
            '></wm-textarea>';

    widget.type = 'wm-textarea'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["animation", "badgevalue"];

    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'focus': 'element',
        'blur': 'element'
    };
    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-textarea widget.*/
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
            it("should disable the $element on toggling disable property", function () {
                iScope.disabled = true;
                iScope.$apply();
                expect($element.attr('disabled')).toBeTruthy();
            });

            it("should change the required property of the textarea on toggling required property", function () {
                iScope.required = true;
                iScope.$apply();
                expect($element.attr("required")).toBeTruthy();
            });

            //check for the datavalue property
            it("should change datavalue for textbox to 25 when put in property panel", function () {
                iScope.datavalue = "25";
                iScope.$apply();
                expect($element.val()).toMatch(25);
            });

            it("should change the readonly property of the textarea on toggling readonly property", function () {
                iScope.readonly = true;
                iScope.$apply();
                expect($element.attr('readonly')).toBeTruthy();
            });

            it("should change placeholder in textarea to placeholderForText when put in property panel", function () {
                iScope.placeholder = "placeholderForText";
                iScope.$apply();
                expect($element.attr('placeholder')).toMatch(/placeholderForText/i);
            });

            it("should change maxlength for textarea to 5 when put in property panel", function () {
                iScope.maxchars = "5";
                iScope.$apply();
                expect($element.attr('maxlength')).toMatch(5);
            });

            //check for the autofocus property
            it("should set the autofocus property", function () {
                iScope.autofocus = true;
                iScope.$apply();
                expect($element.attr("autofocus")).toBe("autofocus");
            });

            //check for the updateon property
            it("should check the updateon as put in property panel", function () {
                expect($element.attr('updateon')).toMatch(iScope.updateon);
            });

            //check for the updatedelay property
            it("should check the updatedelay as put in property panel", function () {
                expect($element.attr('updatedelay')).toMatch(iScope.updatedelay);
            });
        });
    });
});
