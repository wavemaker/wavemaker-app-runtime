/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a message*/
describe("Testing Basic Widget: message", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-message caption="Message Caption" name="Message Name" type="success" ' +
            'show="true" animation="bounce" class="btn-primary"' +
            'on-close="eventHandler()">' +
            '</wm-message>';

    widget.type = 'wm-message'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-message widget.*/
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
                expect($element.hasClass('alert-success')).toBe(true);

                iScope.type = "error";
                iScope.$apply();
                expect($element.hasClass('alert-danger')).toBe(true);
            });
        });
    });
});
