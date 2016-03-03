/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Icon*/
describe("Testing Basic Widget: Icon", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-icon name="Icon name" title="Icon title" show="true" ' +
            'animation="bounce" iconclass="wi wi-star-border" iconsize="50px">' +
            '</wm-icon>';

    widget.type = 'wm-icon'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-icon widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {
            //inject the modules
            module('wm.common');
            module('wm.utils');
            module('wm.widgets');
            module('ngRoute');

            //inject the dependents
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

        //check for the iconclass property
        it("should change the iconclass as put in property panel", function () {
            expect($element.attr('iconclass')).toBe(iScope.iconclass);
        });

        //check for the iconsize property
        it("should change the iconsize as put in property panel", function () {
            expect($element.attr('iconsize')).toBe(iScope.iconsize);
        });

    });

});
