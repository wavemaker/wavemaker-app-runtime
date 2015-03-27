/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Colorpicker Test Suite*/
describe("ColorPicker", function () {

    'use strict';
    var $compile, $rootScope, element, scope;
    /*configurations to be executed before each test*/
    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-colorpicker></wm-colorpicker>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    /* Unit tests for styles */
    /* Commented the code as no style attribute is attached with colorpicker widget.

    describe("styles", function () {
        it("should have element width change to 200px when assigned from property panel", function () {
            element.isolateScope().width = 200;
            element.isolateScope().$apply();
            expect(element.width()).toBe(200);
        });
        it("should have element height change to 200px when assigned from property panel", function () {
            element.isolateScope().height = 200;
            element.isolateScope().$apply();
            expect(element.height()).toBe(200);
        });
        it("should have element minWidth change to 200px when assigned from property panel", function () {
            element.isolateScope().minwidth = 200;
            element.isolateScope().$apply();
            expect(element.css('min-width')).toBe('200px');
        });
        it("should have element minHeight change to 200px when assigned from property panel", function () {
            element.isolateScope().minheight = 200;
            element.isolateScope().$apply();
            expect(element.css('min-height')).toBe('200px');
        });

        it("should change margin style to be 10PX 5PX 3PX 2PX", function () {
            //values vary since for now all margins except bottom need unit
            element.isolateScope().margintop = 10;
            element.isolateScope().marginright = 5;
            element.isolateScope().marginbottom = 3;
            element.isolateScope().marginleft = 2;
            element.isolateScope().$apply();
            expect(element.css('margin')).toBe('10px 5px 3px 2px');
        });
        it("should change padding style to be 10PX 5PX 3PX 2PX", function () {
            element.isolateScope().paddingtop = 10;
            element.isolateScope().paddingright = 5;
            element.isolateScope().paddingbottom = 3;
            element.isolateScope().paddingleft = 2;
            element.isolateScope().$apply();
            expect(element.css('padding')).toBe('10px 5px 3px 2px');
        });

        it("should change border-width style to be 4px", function () {
            element.isolateScope().bordertop = 10;
            element.isolateScope().borderright = 5;
            element.isolateScope().borderbottom = 3;
            element.isolateScope().borderleft = 2;
            element.isolateScope().$apply();
            expect(element.css('border-left-width')).toBe('2px');
            expect(element.css('border-right-width')).toBe('5px');
            expect(element.css('border-bottom-width')).toBe('3px');
            expect(element.css('border-top-width')).toBe('10px');
        });
        it("should change border color style to be red", function () {
            element.isolateScope().bordercolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('border-color')).toBe('rgb(255, 0, 0)');
        });

        it("should change background color style to be red", function () {
            element.isolateScope().backgroundcolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('background-color')).toBe('rgb(255, 0, 0)');
        });
        it("should change color style to be red", function () {
            element.isolateScope().color = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('color')).toBe('rgb(255, 0, 0)');
        });

        it("should change font-family to be arial", function () {
            element.isolateScope().fontfamily = 'arial';
            element.isolateScope().$apply();
            expect(element.css('font-family')).toBe('arial');
        });
        it("should change font-weight to be lighter", function () {
            element.isolateScope().fontweight = 'lighter';
            element.isolateScope().$apply();
            expect(element.css('font-weight')).toBe('lighter');
        });
        it("should change font-variant to be small-caps", function () {
            element.isolateScope().fontvariant = 'small-caps';
            element.isolateScope().$apply();
            expect(element.css('font-variant')).toBe('small-caps');
        });
        it("should change font-style to be italic", function () {
            element.isolateScope().fontstyle = 'italic';
            element.isolateScope().$apply();
            expect(element.css('font-style')).toBe('italic');
        });
        it("should change text-align to be center", function () {
            element.isolateScope().textalign = 'center';
            element.isolateScope().$apply();
            expect(element.css('text-align')).toBe('center');
        });

        it("should change white-space to be nowrap", function () {
            element.isolateScope().whitespace = 'nowrap';
            element.isolateScope().$apply();
            expect(element.css('white-space')).toBe('nowrap');
        });
        it("should change word-break to be break-word", function () {
            element.isolateScope().wordbreak = 'break-word';
            element.isolateScope().$apply();
            expect(element.css('word-break')).toBe('break-word');
        });
        it("should change text-decoration to be underline", function () {
            element.isolateScope().textdecoration = 'underline';
            element.isolateScope().$apply();
            expect(element.css('text-decoration')).toBe('underline');
        });

        it("should change opacity to be 0.5", function () {
            element.isolateScope().opacity = 0.5;
            element.isolateScope().$apply();
            expect(element.css('opacity')).toBe('0.5');
        });
        it("should change cursor to be pointer", function () {
            element.isolateScope().cursor = 'pointer';
            element.isolateScope().$apply();
            expect(element.css('cursor')).toBe('pointer');
        });
        it("should change z-index to be 100", function () {
            element.isolateScope().zindex = 100;
            element.isolateScope().$apply();
            expect(element.css('z-index')).toBe('100');
        });
    });

    Commented the code as no style attribute is attached with colorpicker widget.*/

    /* Unit Tests for properties */
    describe("properties", function () {
        it("should have default show property as true", function () {
            expect(element.isolateScope().show).toBeTruthy();
        });
        it("should hide the element on toggling show property", function () {
            element.isolateScope().show = false;
            element.isolateScope().$apply();
            expect(element.hasClass('ng-hide')).toBeTruthy();
        });
        it("should have default disable property as false", function () {
            expect(element.isolateScope().disabled).toBeFalsy();
        });
        it("should disable the element on toggling disable property", function () {
            element.isolateScope().disabled = true;
            element.isolateScope().$apply();
            expect(element.find('input').attr('disabled')).toBeTruthy();
        });
        it("should have default required property as false", function () {
            expect(element.find('input').hasClass('ng-valid')).toBeTruthy();
        });
        it("should change the required property of the textbox on toggling required property", function () {
            element.isolateScope().required = true;
            element.isolateScope().$apply();
            expect(element.find('input').attr("required")).toBeTruthy();
        });
        it("should have default readonly property as false", function () {
            expect(element.isolateScope().readonly).toBeFalsy();
        });
        it("should change the readonly property of the textbox on toggling readonly property", function () {
            element.isolateScope().readonly = true;
            element.isolateScope().$apply();
            expect(element.find('input').attr('readonly')).toBeTruthy();
        });
        it("should set the model of the colorpicker widget", function () {
            element.isolateScope()._model_ = "#FFFFFF";
            element.isolateScope().$apply();
            expect(element.find('input').val()).toBe("#FFFFFF");
        });
        it("should set border color style from model", function () {
            element.isolateScope()._model_ = "#FFFFFF";
            element.isolateScope().$apply();
            expect(element.css('border-right-color')).toBe('rgb(255, 255, 255)');
        });
    });

    /*Unit Tests for events.*/
    describe("behavior", function () {
        it("should trigger assigned click event", function () {
            var testVariable = 1;
            element.isolateScope().onClick = function () {
                testVariable = 2;
            };
            element.find('input').click();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned mouse-leave event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseleave = function () {
                testVariable = 2;
            };
            element.find('input').mouseleave();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned mouse-enter event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseenter = function () {
                testVariable = 2;
            };
            element.find('input').mouseenter();
            expect(testVariable).toBe(2);
        });
    });

});