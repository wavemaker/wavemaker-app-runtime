/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a progress*/
describe("Testing Basic Widget: progress", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-progress-bar name="Progress name" type="success" hint="Progress hint" ' +
            'width="200px" height="20px" datavalue="40" minvalue="0" maxvalue="100" ' +
            'displayformat="percentage" pollinterval="10" show="true"' +
            'on-click="eventHandler()" on-dblclick="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()">' +
            '</wm-progress-bar>';

    widget.type = 'wm-progress-bar'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-progress-bar widget.*/
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
            it("should change the type as put in property panel", function () {
                iScope.type = "success";
                iScope.$apply();
                expect($element.find('div').hasClass('progress-bar-success')).toBe(true);

                iScope.type = "info";
                iScope.$apply();
                expect($element.find('div').hasClass('progress-bar-info')).toBe(true);
            });

            //check for the datavalue property
            it("should change the datavalue as put in property panel", function () {
                expect($element.find('div').attr('aria-valuenow')).toBe(iScope.datavalue);
            });

            //check for the minvalue property
            it("should change the minvalue as put in property panel", function () {
                expect($element.find('div').attr('aria-valuemin')).toMatch(iScope.minvalue);
            });

            //check for the maxvalue property
            it("should change the maxvalue as put in property panel", function () {
                expect($element.find('div').attr('aria-valuemax')).toMatch(iScope.maxvalue);
            });

            //check for the displayformat property
            it("should change the displayformat as put in property panel", function () {
                expect($element.attr('displayformat')).toMatch(iScope.displayformat);
            });

            //check for the pollinterval property
            it("should change the pollinterval as put in property panel", function () {
                expect($element.attr('pollinterval')).toMatch(iScope.pollinterval);
            });
        });
    });
});
