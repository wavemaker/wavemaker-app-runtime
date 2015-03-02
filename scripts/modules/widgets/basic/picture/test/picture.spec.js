/*global describe, it, WM, beforeEach, expect, module, inject*/
describe("Picture", function () {
    "use strict";

    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        module(function ($provide) {
            $provide.value("$routeParams", {"project_name" : "myproject"});
        });
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-picture picturesource="http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg"></wm-picture>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

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
            element.isolateScope().margintop = '10';
            element.isolateScope().marginright = '5';
            element.isolateScope().marginbottom = '3';
            element.isolateScope().marginleft = '2';
            element.isolateScope().$apply();
            expect(element.css('margin')).toBe('10px 5px 3px 2px');
        });

        it("should change padding style to be 10PX 5PX 3PX 2PX", function () {
            element.isolateScope().paddingtop = '10';
            element.isolateScope().paddingright = '5';
            element.isolateScope().paddingbottom = '3';
            element.isolateScope().paddingleft = '2';
            element.isolateScope().$apply();
            expect(element.css('padding')).toBe('10px 5px 3px 2px');
        });

        it("should change border-width style to be 4px", function () {
            element.isolateScope().bordertop = '4';
            element.isolateScope().borderright = '4';
            element.isolateScope().borderbottom = '4';
            element.isolateScope().borderleft = '4';
            element.isolateScope().$apply();
            expect(element.css('border-left-width')).toBe('4px');
            expect(element.css('border-right-width')).toBe('4px');
            expect(element.css('border-bottom-width')).toBe('4px');
            expect(element.css('border-top-width')).toBe('4px');
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

        it("should change text-align to be center", function () {
            element.isolateScope().textalign = 'center';
            element.isolateScope().$apply();
            expect(element.css('text-align')).toBe('center');
        });
    });

    describe("properties", function () {
        it("should have default show property as true", function () {
            expect(element.isolateScope().show).toBeTruthy();
        });

        it("should hide the element", function () {
            element.isolateScope().show = false;
            element.isolateScope().$apply();
            expect(element.hasClass('ng-hide')).toBeTruthy();
        });

        it("changing source property of the image", function () {
            element.isolateScope().picturesource = "http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg";
            element.isolateScope().$apply();
            expect(element.attr("src")).toBe('http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg');
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
