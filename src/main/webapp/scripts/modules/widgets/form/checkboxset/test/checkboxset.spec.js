/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a radioset*/
describe("Testing Form Widget: checkbox", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-radioset name="radioset name" tabindex="2" hint="radio set hint"' +
            'width="150px" height="auto" layout="stacked" datafield="All Fields" dataset="Option 1, Option 2, Option 3" ' +
            'usekeys="true" readonly="true" show="true" disabled="true"  class="btn-primary" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()"' +
            'on-blur="eventHandler()" on-focus="eventHandler()">' +
            '</wm-radioset>';

    widget.type = 'wm-checkboxset'; // type of the widget
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

    /*Custom Test Suite for wm-radioset widget.*/
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
            //check for the datafield property
            it("should check the datafield as put in property panel", function () {
                expect($element.attr('datafield')).toBe(iScope.datafield);
            });

            //check for the dataset property
            it("should check the dataset as put in property panel", function () {
                expect($element.attr('dataset')).toBe(iScope.dataset);
            });

            //check for the usekeys property
            it("should check the usekeys as put in property panel", function () {
                expect($element.attr('usekeys')).toMatch(iScope.usekeys);
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

            //check for the layout property
            it("should change the layout as put in property panel", function () {
                iScope.layout = "stacked";
                iScope.$apply();
                expect($element.hasClass('stacked')).toBe(true);
            });

            //check for the construction of the element from the dataset
            it("should check the construction of the element from the dataset", function () {
                iScope.dataset = "Option 1, Option 2, Option 3";
                iScope.$apply();
                var items = iScope.dataset.split(', ');
                _.forEach(items, function (item, index) {
                    var counter = index + 1;
                    expect($element.find('li:nth-child('+ counter +')').text()).toMatch(items[index]);
                });
            });
        });
    });
});
