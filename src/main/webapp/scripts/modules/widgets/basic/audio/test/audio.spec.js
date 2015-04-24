/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Audio*/
describe("Testing Basic Widget: Audio", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-audio name="Audio name" hint="Audio hint" tabindex="1"  width="200px" height="200px" mp3format="horse.mp3"' +
            'audiopreload="none" audiosupportmessage="Your browser does not support the audio tag." show="true" ' +
            'controls="controls" autoplay="true"  loop="loop" muted="false"' +
            'class="sample class" visibility="visible" display="inline">' +
            '</wm-audio>';

    widget.type = 'wm-audio'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-audio widget.*/
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
            //check for the mp3 format property
            it("should change the mp3format as put in property panel", function () {
                expect($element.attr('src')).toBe(iScope.mp3format);

                iScope.mp3format = "Sample.mp3";
                iScope.$apply();
                expect($element.attr('src')).toBe(iScope.mp3format);
            });

            //check for the audiopreload property
            it("should change the audiopreload as put in property panel", function () {
                expect($element.attr('preload')).toBe(iScope.audiopreload);

                iScope.audiopreload = "auto";
                iScope.$apply();
                expect($element.attr('preload')).toBe("auto");
            });

            //check for the audiosupportmessage property
            it("should change the audiosupportmessage as put in property panel", function () {
                expect($element.attr('audiosupportmessage')).toBe(iScope.audiosupportmessage);
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

            //TODO: check for the muted property
            //it("should change the muted as put in property panel", function () {
            //    expect($element.attr('muted')).toBe(iScope.muted);
            //});

        });
    });
});
