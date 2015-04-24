/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a spinner*/
describe("Testing Basic Widget: spinner", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-spinner  caption="Spinner caption" name="Spinner name" ' +
            'image="http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg"' +
            'imagewidth="200px" imageheight="200px" show="true"  class="btn-primary" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'opacity="0.8" zindex="100" >' +
            '</wm-spinner>';

    widget.type = 'wm-spinner'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-spinner widget.*/
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
            describe("styles", function () {
                it("should have element width change to 200px when assigned from property panel", function () {
                    iScope.imagewidth = 200;
                    iScope.$apply();
                    expect($element.find(".spinner-image").width()).toBe(200);
                });
                it("should have element height change to 200px when assigned from property panel", function () {
                    iScope.imageheight = 200;
                    iScope.$apply();
                    expect($element.find(".spinner-image").height()).toBe(200);
                });

                it("should change background image to set to given url", function () {
                    iScope.image = 'http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg';
                    iScope.$apply();
                    expect($element.find('.spinner-image').css('background-image')).toBe('url(http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg)');
                });
            });
        });
    });
});
