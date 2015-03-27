/*global describe, it, WM, beforeEach, expect, module, inject*/
/*jslint todo: true */

describe("Checkbox", function () {

    'use strict';
    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-checkbox></wm-checkbox>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    /* Unit tests for styles */
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

        it("should change padding style to be 10PX 5PX 3PX 2PX", function () {
            element.isolateScope().paddingtop = 10;
            element.isolateScope().paddingright = 5;
            element.isolateScope().paddingbottom = 3;
            element.isolateScope().paddingleft = 2;
            element.isolateScope().$apply();
            expect(element.css('padding')).toBe('10px 5px 3px 2px');
        });
        it("should change margin style to be 10PX 5PX 3PX 2PX", function () {
            element.isolateScope().margintop = 10;
            element.isolateScope().marginright = 5;
            element.isolateScope().marginbottom = 3;
            element.isolateScope().marginleft = 2;
            element.isolateScope().$apply();
            expect(element.css('margin')).toBe('10px 5px 3px 2px');
        });
        it("should change opacity to be 0.5", function () {
            element.isolateScope().opacity = '0.5';
            element.isolateScope().$apply();
            expect(element.css('opacity')).toBe('0.5');
        });
        it("should change zindex to be 2", function () {
            element.isolateScope().zindex = '2';
            element.isolateScope().$apply();
            expect(element.css('z-index')).toBe('2');
        });
        it("should change cursor to be pointer", function () {
            element.isolateScope().cursor = 'pointer';
            element.isolateScope().$apply();
            expect(element.css('cursor')).toBe('pointer');
        });
        it("should add inputClass to checkbox", function () {
            element.isolateScope().class = 'inputClass';
            element.isolateScope().$apply();
            expect(element.hasClass('inputClass')).toBeTruthy();
        });
    });

    /* Unit tests for properties */
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
            expect(element.attr('disabled')).toBeTruthy();
        });
        it("should have default required property as false", function () {
            expect(element.hasClass('ng-valid')).toBeTruthy();
        });
        it("should change the required property of the checkbox on toggling required property", function () {
            element.isolateScope().required = true;
            element.isolateScope().$apply();
            expect(element.attr("required")).toBeTruthy();
        });
        it("should have default readonly property as false", function () {
            expect(element.isolateScope().readonly).toBeFalsy();
        });
        it("should change the readonly property of the checkbox on toggling readonly property", function () {
            element.isolateScope().readonly = true;
            element.isolateScope().$apply();
            expect(element.attr('readonly')).toBeTruthy();
        });
        it("should change value in checkbox to true when checked in property panel", function () {
            element.isolateScope().checked = true;
            element.isolateScope().$apply();
            expect(element.is(":checked")).toBeTruthy();

        });
        it("should change helptext for checkbox to helpText when put in property panel", function () {
            element.isolateScope().hint = "helpText";
            element.isolateScope().$apply();
            expect(element.attr('title')).toMatch(/helpText/i);
        });
        it("should change model value", function () {
            element.isolateScope()._model_ = true;
            element.isolateScope().$apply();
            expect(element.val()).toBeTruthy();
        });
    });


    describe("behavior", function () {

        /*TODO onChange implementation to be changed so not testing for now*/
        it("should trigger assigned change event", function () {
            var testVariable = 1;
            element.isolateScope()._onChange = function () {
                testVariable = 2;
            };
            element.change();
            /*
             TODO: onChange not getting called on "element.change()" . Has to be worked upon
             */
            /*
             expect(testVariable).toBe(2);
             */
        });

        it("should trigger assigned click event", function () {
            var testVariable = true;
            element.isolateScope().onClick = function () {
                testVariable = false;
            };
            element.click();
            expect(testVariable).toBeFalsy();
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
        it("should trigger assigned focus event", function () {
            var testVariable = 1;
            element.isolateScope().onFocus = function () {
                testVariable = 2;
            };
            element.focus();
            /*
             TODO: onFocus not getting called on "element.focus()" . Has to be worked upon
             */
            /*
             expect(testVariable).toBe(2);
             */
        });
        it("should trigger assigned blur event", function () {
            var testVariable = 1;
            element.isolateScope().onBlur = function () {
                testVariable = 2;
            };
            element.blur();
            expect(testVariable).toBe(2);
        });
    });

});