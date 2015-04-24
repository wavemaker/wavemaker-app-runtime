/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a text*/
describe("Testing Form Widget: text", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-text name="Text name" type="text" placeholder="Text placeholder" hint="Text hint" ' +
            'tabindex="2" width="300px" height="25px"' +
            'datavalue="25" minvalue="0" maxvalue="100" updateon="blur" updatedelay="10" places="2" ' +
            'required="false" regexp=".*" maxchars="100" autofocus="false" readonly="false" ' +
            'show="true" disabled="false" class="col-md-push-3" ' +
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
            '></wm-text>';

    widget.type = 'wm-text'; // type of the widget
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

    /*Custom Test Suite for wm-text widget.*/
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
             //check for the type property
            it("should change type for textbox to password when put in property panel", function () {
                iScope.type = "password";
                iScope.$apply();
                expect($element.attr('type')).toBe('password');
            });

            //check for the placeholder property
            it("should change placeholder in textbox to placeholderForText when put in property panel", function () {
                iScope.placeholder = "placeholderForText";
                iScope.$apply();
                expect($element.attr('placeholder')).toMatch(/placeholderForText/i);
            });

            //check for the maxchars property
            it("should change maxlength for textbox to 5 when put in property panel", function () {
                iScope.maxchars = "5";
                iScope.$apply();
                expect($element.attr('maxlength')).toMatch(5);
            });

            //check for the datavalue property
            it("should change datavalue for textbox to 25 when put in property panel", function () {
                iScope.datavalue = "25";
                iScope.$apply();
                expect($element.val()).toMatch(25);
            });

            //check for the minvalue property
            it("should change minvalue for textbox to 0 when put in property panel", function () {
                iScope.minvalue = "0";
                iScope.$apply();
                expect($element.attr('min')).toMatch(0);
            });

            //check for the maxvalue property
            it("should change maxvalue for textbox to 100 when put in property panel", function () {
                iScope.maxvalue = "100";
                iScope.$apply();
                expect($element.attr('max')).toMatch(100);
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

            //check for the updateon property
            it("should check the updateon as put in property panel", function () {
                expect($element.attr('updateon')).toMatch(iScope.updateon);
            });

            //check for the updatedelay property
            it("should check the updatedelay as put in property panel", function () {
                expect($element.attr('updatedelay')).toMatch(iScope.updatedelay);
            });

            //check for the places property
            it("should check the places as put in property panel", function () {
                expect($element.attr('places')).toMatch(iScope.places);
            });

            //check for the regexp property
            it("should check the regexp as put in property panel", function () {
                expect($element.attr('regexp')).toMatch(iScope.regexp);
            });
        });
    });
});
