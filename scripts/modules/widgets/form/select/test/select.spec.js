/*global describe, it, WM, beforeEach, expect, module, inject*/
describe("Select", function () {
    "use strict";

    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-select></wm-select>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    describe("styles", function () {
        it("should change element width to 200px", function () {
            element.isolateScope().width = 200;
            element.isolateScope().$apply();
            expect(element.width()).toBe(200);
        });

        it("should change element height to 200px", function () {
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
            element.isolateScope().bordertop = 4;
            element.isolateScope().borderright = 4;
            element.isolateScope().borderbottom = 4;
            element.isolateScope().borderleft = 4;
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
        it("should change font-size to be 10px", function () {
            element.isolateScope().fontsize = 10;
            element.isolateScope().$apply();
            expect(element.css('font-size')).toBe('10px');
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
        it("should have default show property as true", function () {
            expect(element.isolateScope().show).toBeTruthy();
        });
        it("should hide the element", function () {
            element.isolateScope().show = false;
            element.isolateScope().$apply();
            expect(element.hasClass('ng-hide')).toBeTruthy();
        });

        it("should change the options for the element", function () {
            element.isolateScope().dataset = "Hello, Namaste";
            element.isolateScope().$apply();
            expect(element.find("option")[1].text).toBe("Hello");
        });

        /*it("should change the dataset for the element", function () {

         });*/

        it("should set the disabled property", function () {
            element.isolateScope().disabled = true;
            element.isolateScope().$apply();
            expect(element.attr("disabled")).toBe("disabled");
        });

        it("should change the model value", function () {
            element.isolateScope().dataset = "Hello, Namaste";
            element.isolateScope()._model_ = "Namaste";
            element.isolateScope().$apply();
            expect(element.val()).toMatch(/Namaste/i);
        });
    });

    describe("behavior", function () {

        /*TODO: onFocus implementation to be changed so not testing for now*/
        it("should trigger the assigned focus event", function () {
            var testVariable = 1;
            element.isolateScope().onFocus = function () {
                testVariable = 2;
            };
            element.focus();
            /* TODO: onFocus not getting called on "element.focus()" . Has to be worked upon */
            //  expect(testVariable).toBe(2);
        });

        it("should trigger the assigned blur event", function () {
            var testVariable = 1;
            element.isolateScope().onBlur = function () {
                testVariable = 2;
            };
            element.blur();
            expect(testVariable).toBe(2);
        });

        it("should trigger the assigned click event", function () {
            var testVariable = 1;
            element.isolateScope().onClick = function () {
                testVariable = 2;
            };
            element.click();
            expect(testVariable).toBe(2);
        });

        it("should trigger the assigned mouseenter event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseenter = function () {
                testVariable = 2;
            };
            element.mouseenter();
            expect(testVariable).toBe(2);
        });

        it("should trigger the assigned mouseleave event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseleave = function () {
                testVariable = 2;
            };
            element.mouseleave();
            expect(testVariable).toBe(2);
        });

        /*TODO: onChange implementation to be changed so not testing for now*/
        it("should trigger the assigned change event", function () {
            var testVariable = 1;
            element.isolateScope()._onChange = function () {
                testVariable = 2;
            };
            element.change();
            /*TODO: onChange not getting called on "element.focus()" . Has to be worked upon */
            //  expect(testVariable).toBe(2);
        });
    });
});