/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a select*/
describe("Testing Form Widget: select", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-select name="Select Name" tabindex="2" hint="Select hint" ' +
            'width="300px" height="50px" dataset="1,2,3" ' +
            'required="true" autofocus="true" readonly="true" multiple="true" ' +
            'disabled="true" show="true" class="col-md-push-3" ' +
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
            '></wm-select>';

    widget.type = 'wm-select'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["animation", "badgevalue"];

     //map of eventName-selector. events target will be the element which satisfies the given selector.
     //this selector should be relative to widgetSelector
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

    /*Custom Test Suite for wm-select widget.*/
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
            //check for the dataset property
            it("should change the options for the element", function () {
                iScope.dataset = "Hello, Namaste";
                iScope.$apply();
                expect($element.find("option")[1].text).toBe("Namaste");
            });

            //check for the dataset property
            it("should change the options for the element", function () {
                iScope.dataset = ["item1", "item2"];
                iScope.$apply();
                expect($element.find("option")[0].text).toBe("item1");
            });

            //check for the dataset property
            it("should change the options for the element", function () {
                iScope.dataset = {
                    "label1": "item1",
                    "label2": "item2"
                };
                iScope.$apply();
                expect($element.find("option")[1].text).toBe("item2");
            });

            //check for the autofocus property
            it("should set the autofocus property", function () {
                iScope.autofocus = true;
                iScope.$apply();
                expect($element.attr("autofocus")).toBe("autofocus");
            });

            //check for the readonly property
            it("should set the readonly property", function () {
                iScope.readonly = true;
                iScope.$apply();
                expect($element.attr("readonly")).toBe("readonly");
            });

            //check for the multiple property
            it("should set the multiple property", function () {
                iScope.multiple = true;
                iScope.$apply();
                expect($element.attr("multiple")).toBe("multiple");
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
