/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents*/
/*global modulesToBeInjected*/

describe('Testing Widget: wm-button', function () {
    'use strict';

    var $compile,
        $rootScope,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-button name="button1" tabindex="1" badgevalue="1" type="submit" hint="submit button" width="100" height="30" disabled="false" ' +
            'animation="bounce" caption="Submit" iconclass="icon class" ' +
            'iconurl="http://www.google.com/doodle4google/images/splashes/featured.png" iconwidth="20" iconheight="12" iconmargin="5" ' +
            'class="dummy-class" fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png" ' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline" ' +
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()" ' +
            'on-focus="eventHandler()" on-blur="eventHandler()" ' +
            '></wm-button>';

    widget.type = 'wm-button'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'focus': 'element',
        'blur': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-button widget.*/
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

        // test for caption property
        it('should have given caption', function () {
            iScope.caption = "submitbtn";
            iScope.$apply();
            expect($element.find('.btn-caption').text().trim()).toBe('submitbtn');
        });

        //check for the badgevalue property
        it("should change badge value of button to bvalue", function () {
            iScope.badgevalue = "bvalue";
            iScope.$apply();
            expect($element.find('.badge').text()).toBe('bvalue');
        });

        //check for the type property
        it("should change type for button to reset", function () {
            expect($element.attr('type')).toBe('submit');
        });

        //check for the disabled property
        it("should disable the $element on toggling disable property", function () {
            iScope.disabled = true;
            iScope.$apply();
            expect($element.attr('disabled')).toBeTruthy();
        });

        //test for iconurl property
        it('should have given iconurl', function () {
            iScope.iconurl = "http://www.google.com/doodle4google/images/splashes/featured.png";
            iScope.$apply();
            expect($element.find('img').attr('src')).toBe("http://www.google.com/doodle4google/images/splashes/featured.png");
        });

        //test for iconwidth and iconheight properties
        it('should have given iconwidth and iconheight', function () {
            iScope.iconwidth = '15';
            iScope.iconheight = '15';
            iScope.$apply();
            expect($element.find('img').css('width')).toBe('15px');
            expect($element.find('img').css('height')).toBe('15px');

        });

        //test for icon margin properties
        it('should have given iconmargin', function () {
            expect($element.attr('iconmargin')).toBe('5');
        });
    });
});
