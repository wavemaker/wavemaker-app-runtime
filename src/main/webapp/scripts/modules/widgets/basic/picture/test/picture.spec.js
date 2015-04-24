/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a picture*/
describe("Testing Basic Widget: picture", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-picture name="Picture Name" tabindex="2" hint="Picture Hint"' +
            'picturesource="http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg"' +
            'pictureaspect="H" shape="rounded" ' +
            'show="true" disabled="true" animation="bounce" class="btn-primary" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            'on-click="eventHandler()" on-dblclick="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()" >' +
            '</wm-picture>';

    widget.type = 'wm-picture'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

     //map of eventName-selector. events target will be the element which satisfies the given selector.
     //this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'blur': 'element',
        'focus': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-picture widget.*/
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
            //check for the picturesource property
            it("should change the picturesource as put in property panel", function () {
                expect($element.attr('src')).toBe(iScope.picturesource);
            });

            //check for the shape property
            it("should change the shape as put in property panel", function () {
                iScope.shape = "rounded";
                iScope.$apply();
                expect($element.hasClass('img-rounded')).toBe(true);
            });

            //check for the disabled property
            it("should change the disabled as put in property panel", function () {
                expect($element.is('[disabled]')).toBe(true);
            });

            //check for the pictureaspect property
            it("should change the pictureaspect as put in property panel", function () {
                iScope.pictureaspect = 'H';
                iScope.$apply();
                expect($element.css('width')).toBe('100%');

                iScope.pictureaspect = 'V';
                iScope.$apply();
                expect($element.css('height')).toBe('100%');

                iScope.pictureaspect = 'Both';
                iScope.$apply();
                expect($element.css('width')).toBe('100%');
                expect($element.css('height')).toBe('100%');
            });
        });
    });
});
