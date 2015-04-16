/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a search*/
describe("Testing Basic Widget: search", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-search name="Search name"' +
            'tabindex="1" placeholder="Search placeholder"' +
            'limit="4" searchkey="deptid" datafield="name" displaylabel="name" displayimagesrc="location"' +
            'class="btn-primary" show="true">' +
            '</wm-search>';

    widget.type = 'wm-search'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);

    /*Custom Test Suite for wm-search widget.*/
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
            //check for the placeholder property
            it("should change the placeholder as put in property panel", function () {
                expect($element.find('input').attr('placeholder')).toBe(iScope.placeholder);

                iScope.placeholder = "search";
                iScope.$apply();
                expect($element.find('input').attr('placeholder')).toBe(iScope.placeholder);
            });

            //check for the limit property
            it("should change the limit as put in property panel", function () {
                expect($element.attr('limit')).toMatch(iScope.limit);
            });

            //check for the searchkey property
            it("should change the searchkey as put in property panel", function () {
                expect($element.attr('searchkey')).toMatch(iScope.searchkey);
            });

            //check for the datafield property
            it("should change the datafield as put in property panel", function () {
                expect($element.attr('datafield')).toMatch(iScope.datafield);
            });

            //check for the displaylabel property
            it("should change the displaylabel as put in property panel", function () {
                expect($element.attr('displaylabel')).toMatch(iScope.displaylabel);
            });

            //check for the displayimagesrc property
            it("should change the displayimagesrc as put in property panel", function () {
                expect($element.attr('displayimagesrc')).toMatch(iScope.displayimagesrc);
            });
        });
    });
});
