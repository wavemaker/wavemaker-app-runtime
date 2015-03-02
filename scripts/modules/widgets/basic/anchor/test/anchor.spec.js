/*global describe, it, WM, beforeEach, expect, module, inject*/
describe("Anchor", function () {

    'use strict';
    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-anchor></wm-anchor>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    describe("styles", function () {
        it("should change margin style to be 10PX 5PX 3PX 2PX", function () {
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
        it("should change font-size to be large", function () {
            element.isolateScope().fontsize = 14;
            element.isolateScope().$apply();
            expect(element.css('font-size')).toBe('14px');
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
        it("should change text-decoration to be underline", function () {
            element.isolateScope().textdecoration = 'underline';
            element.isolateScope().$apply();
            expect(element.css('text-decoration')).toBe('underline');
        });
    });

    describe("properties", function () {
        it("should change the caption as put in property panel", function () {
            expect(element.text()).toMatch(/link/i);
            element.isolateScope().caption = "sample";
            element.isolateScope().$apply();
            expect(element.text()).toMatch(/sample/i);
        });

        it("should have default show property as true", function () {
            expect(element.isolateScope().show).toBeTruthy();
        });
        it("should hide the element", function () {
            element.isolateScope().show = false;
            element.isolateScope().$apply();
            expect(element.hasClass('ng-hide')).toBeTruthy();
        });

        it("should have default caption property as link", function () {
            expect(element.isolateScope().caption).toMatch(/link/i);
        });
    });

    describe("behavior", function () {
        it("should trigger assigned click event", function () {
            var testVariable = 1;
            element.isolateScope().onClick = function () {
                testVariable = 2;
            };
            element.click();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned mouseenter event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseenter = function () {
                testVariable = 2;
            };
            element.mouseenter();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned mouseleave event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseleave = function () {
                testVariable = 2;
            };
            element.mouseleave();
            expect(testVariable).toBe(2);
        });
    });

});