/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a iframe*/
describe("Testing Basic Widget: iframe", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-iframe name="iframe name" hint="iframe hint" ' +
            'width="250px" height="100px" show="true" class="btn-primary">' +
            '</wm-iframe>';

    widget.type = 'wm-iframe'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["hint"];

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);

    /*Custom Test Suite for wm-iframe widget.*/
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
            // check for hint property
            it('should have given hint', function () {
                expect($element.attr('hint')).toBe(iScope.hint);
            });

            //check for the iframesrc property
            it("should check the iframesrc put in property panel", function () {
                iScope.iframesrc = "login.html";
                iScope.$apply();
                expect($element.find('iframe').attr('src')).toMatch(iScope.iframesrc);
            });

            //check for the external https iframesrc property
            it("should check the external https iframesrc put in property panel", function () {
                iScope.iframesrc = "https://www.wavemakeronline.com/login/login";
                iScope.$apply();
                expect($element.find('iframe').attr('src')).toMatch(iScope.iframesrc);
            });

            //check for the external http iframesrc property
            it("should check the external http iframesrc put in property panel", function () {
                iScope.iframesrc = "http://dev.wavemaker.com/";
                iScope.$apply();
                expect($element.find('iframe').attr('src')).toMatch(iScope.iframesrc);
            });
        });
    });
});
