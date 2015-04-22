/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Colorpicker Test Suite*/
describe("ColorPicker", function () {

    'use strict';
    var $compile,
        $rootScope,
        $element,
        iScope,
        widget = {},
        script_variable = "#ffff11",
        markup =
            '<wm-colorpicker name="cpicker" tabindex="1" placeholder="pick" scopedatavalue="script_variable" datavalue="#ffffff" '+
            'readonly="true" disabled="true" class="dummy-class" '+
            'on-click="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()" ' +
            'on-focus="eventHandler()" on-blur="eventHandler()" on-dblclick="eventHandler()" on-change="eventHandler()" '+
            '></wm-colorpicker>';

    widget.type = 'wm-colorpicker'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        /*'click': 'element',
        'change': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'focus': 'element',
        'blur': 'element',
        'dblclick' : 'element'*/
        /*
            TODO : test cases for events supplied on event specific test cases
         */
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    //commonWidgetTests_verifyBasicEvents(widget);


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

        describe('properties', function(){
            //check for the placeholder property
            it("should change the placeholder property", function () {
                iScope.placeholder = "pick color";
                iScope.$apply();
                expect($element.find('input').attr('placeholder')).toBe('pick color');
            });

            //check for the tabindex property
            it("should change tabindex property to be 1", function () {
                expect($element.attr('tabindex')).toBe('1');
            });

            //check for the scopedatavalue property
            it("should change scopedatavalue to true when put in property panel", function () {
                expect($element.attr('scopedatavalue')).toBe('script_variable');
            });

            //check for the datavalue property
            it("should change datavalue to true when put in property panel", function () {
                iScope.datavalue = "#ffcc11";
                iScope.$apply();
                expect($element.find('input').val()).toBe('#ffcc11');
            });

            //check for the disabled property
            it("checking the disabled property", function () {
                expect($element.attr('disabled')).toBe('disabled');
            });

            //check for read only property
            it("checking the readonly property", function () {
                expect($element.attr('readonly')).toBe('readonly');
            });

        });

        describe('events', function(){
            //check for click event
            it("should trigger assigned click event", function () {
                var testVariable = 1;
                iScope.onClick = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').click();
                expect(testVariable).toBe(2);
            });

            //check for dbl click event
            /*it("should trigger assigned dblclick event", function () {
                var testVariable = 1;
                iScope.onDblclick = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').dblclick();
                expect(testVariable).toBe(2);
            });*/
            /*
                TODO : dbl click and change event should be implemented later
             */
            //check for change event
            /*it("should trigger assigned change event", function () {
                var testVariable = 1;
                iScope.onChange = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').change();
                expect(testVariable).toBe(2);
            });*/

            //check for mouseenter event
            it("should trigger assigned mouseenter event", function () {
                var testVariable = 1;
                iScope.onMouseenter = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').mouseenter();
                expect(testVariable).toBe(2);
            });

            //check for mouseleave event
            it("should trigger assigned mouseleave event", function () {
                var testVariable = 1;
                iScope.onMouseleave = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').mouseleave();
                expect(testVariable).toBe(2);
            });

            //check for focus event
            /*
                TODO : need to check the implementation
             */
            /*it("should trigger assigned focus event", function () {
                var testVariable = 1;
                iScope.onFocus = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').focus();
                expect(testVariable).toBe(2);
            });*/

            //check for blur event
            it("should trigger assigned blur event", function () {
                var testVariable = 1;
                iScope.onBlur = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                $element.find('input').blur();
                expect(testVariable).toBe(2);
            });
        });

    });
});