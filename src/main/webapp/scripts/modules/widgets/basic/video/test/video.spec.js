/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Video*/
describe("Testing Basic Widget: Video", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-video controls="true" videopreload="none" name="Video name" ' +
            'videoposter="http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg" ' +
            'mp4format="http://techslides.com/demos/sample-videos/small.mp4" show="true" ' +
            'oggformat="http://techslides.com/demos/sample-videos/small.ogv"' +
            'webmformat="http://techslides.com/demos/sample-videos/small.webm" ' +
            'autoplay="true" loop="true" muted="true" width="300px" height="300px" hint="Video hint">' +
            '</wm-video>';

    widget.type = 'wm-video'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-video widget.*/
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
            //check for the videoposter property
            it("should change the videoposter as put in property panel", function () {
                expect($element.attr('poster')).toBe(iScope.videoposter);
            });

            //check for the mp4 format property
            it("should change the mp4format as put in property panel", function () {
                expect($element.attr('src')).toBe(iScope.mp4format);

                iScope.mp4format = "Sample.mp4";
                iScope.$apply();
                expect($element.attr('src')).toBe("Sample.mp4");
            });

            //check for the videopreload property
            it("should change the videopreload as put in property panel", function () {
                expect($element.attr('videopreload')).toBe(iScope.videopreload);
            });

            //check for the controls property
            it("should change the controls as put in property panel", function () {
                expect($element.is('[controls]')).toBe(iScope.controls);
            });

            ////TODO: check for the autoplay property
            //it("should change the autoplay as put in property panel", function () {
            //    expect($element.attr('autoplay')).toBe(iScope.autoplay);
            //});

            //check for the loop property
            it("should change the loop as put in property panel", function () {
                expect($element.is('[loop]')).toBe(iScope.loop);
            });

            ////TODO: check for the muted property
            //it("should change the muted as put in property panel", function () {
            //    expect($element.attr('muted')).toBe(iScope.muted);
            //});
        });
    });
});


