/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a currency*/
describe("Testing Form Widget: currency", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-currency name="Currenct name" tabindex="3" placeholder="Enter value" ' +
            'currency="USD" hint="Currenct hint" width="150px" height="50px" ' +
            'datavalue="25" minvalue="0" maxvalue="100" required="false" ' +
            'readonly="false" show="true" disabled="false" class="col-md-push-3" ' +
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
            '></wm-currency>';

    widget.type = 'wm-currency'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["hint", "animation", "badgevalue"];
    widget.innerElement = "input";

    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'focus': 'element',
        'blur': 'element'
    };
    widget.innerElementEvents = "input";

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-currency widget.*/
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
            //check for the required property
            it("should set the required property", function () {
                iScope.required = true;
                iScope.$apply();
                expect($element.find("input").attr("required")).toBe("required");
            });

            //check for the disable property
            it("should disable the $element on toggling disable property", function () {
                iScope.disabled = true;
                iScope.$apply();
                expect($element.find("input").attr('disabled')).toBeTruthy();
            });

            //check for the readonly property
            it("should change the readonly property of the textbox on toggling readonly property", function () {
                iScope.readonly = true;
                iScope.$apply();
                expect($element.find("input").attr('readonly')).toBeTruthy();
            });

            //check for the currencysymbol property
            it("should change currency symbol when set in properties panel", function () {
                iScope.currency = 'EUR';
                iScope.$apply();
                expect($element.find("span").text()).toMatch(/€/i);
            });

            //check for the helptext property
            it("should change helptext for currency to helpText when put in property panel", function () {
                iScope.hint = "helpText";
                iScope.$apply();
                expect($element.find("input").attr('title')).toMatch(/helpText/i);
            });

            //check for the placeholder property
            it("should change placeholder in currency to placeholderForCurrency when put in property panel", function () {
                iScope.placeholder = "placeholderForCurrency";
                iScope.$apply();
                expect($element.find("input").attr('placeholder')).toMatch(/placeholderForCurrency/i);
            });

            //check for the minvalue property
            it("should change min value for currency to 5 when put in property panel", function () {
                iScope.minvalue = "5";
                iScope.$apply();
                expect($element.find("input").attr('min')).toMatch(5);
            });

            //check for the maxvalue property
            it("should change max value for currency to 5 when put in property panel", function () {
                iScope.maxvalue = "5";
                iScope.$apply();
                expect($element.find("input").attr('max')).toMatch(5);
            });
        });
    });
});
