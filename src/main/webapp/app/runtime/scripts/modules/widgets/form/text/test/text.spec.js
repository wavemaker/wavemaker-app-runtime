/*global describe, it, WM, beforeEach, expect, module, inject*/
/*jslint todo: true */
describe("Text", function () {

    'use strict';
    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-text></wm-text>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    /* Unit tests for styles of text  */
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

        it("should change padding style to be 10px 5px 3px 2px", function () {
            element.isolateScope().paddingtop = 10;
            element.isolateScope().paddingright = 5;
            element.isolateScope().paddingbottom = 3;
            element.isolateScope().paddingleft = 2;
            element.isolateScope().$apply();
            expect(element.css('padding')).toBe('10px 5px 3px 2px');
        });
        it("should change margin style to be 10px 5px 3px 2px", function () {
            element.isolateScope().margintop = 10;
            element.isolateScope().marginright = 5;
            element.isolateScope().marginbottom = 3;
            element.isolateScope().marginleft = 2;
            element.isolateScope().$apply();
            expect(element.css('margin')).toBe('10px 5px 3px 2px');
        });
        it("should change border color style to be red", function () {
            element.isolateScope().bordercolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('border-color')).toBe('rgb(255, 0, 0)');
        });
        it("should change border style to be solid", function () {
            element.isolateScope().borderstyle = 'solid';
            element.isolateScope().$apply();
            expect(element.css('border-style')).toBe('solid');
        });
        it("should change border width style to be 4px", function () {
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

        it("should change background color style to be red", function () {
            element.isolateScope().backgroundcolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('background-color')).toBe('rgb(255, 0, 0)');
        });

        it("should change background image to set to given url", function () {
            element.isolateScope().backgroundimage = 'http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg';
            element.isolateScope().$apply();
            expect(element.css('background-image')).toBe('url(http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg)');
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
        it("should change font-size to be 30px", function () {
            element.isolateScope().fontsize = 30;
            element.isolateScope().$apply();
            expect(element.css('font-size')).toBe('30px');
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

        it("should change white-space to be pre", function () {
            element.isolateScope().whitespace = 'pre';
            element.isolateScope().$apply();
            expect(element.css('white-space')).toBe('pre');
        });
        it("should change text-decoration to be underline", function () {
            element.isolateScope().textdecoration = 'underline';
            element.isolateScope().$apply();
            expect(element.css('text-decoration')).toBe('underline');
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
        it("should add inputClass to textbox", function () {
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
            expect(element.attr('show')).toBeFalsy();
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
        it("should change the required property of the textbox on toggling required property", function () {
            element.isolateScope().required = true;
            element.isolateScope().$apply();
            expect(element.attr("required")).toBeTruthy();
        });
        it("should have default readonly property as false", function () {
            expect(element.isolateScope().readonly).toBeFalsy();
        });
        it("should change the readonly property of the textbox on toggling readonly property", function () {
            element.isolateScope().readonly = true;
            element.isolateScope().$apply();
            expect(element.attr('readonly')).toBeTruthy();
        });
        it("should change model value", function () {
            element.isolateScope()._model_ = "testValue";
            element.isolateScope().$apply();
            expect(element.val()).toMatch(/testValue/i);
        });
        it("should change helptext for textbox to helpText when put in property panel", function () {
            element.isolateScope().hint = "helpText";
            element.isolateScope().$apply();
            expect(element.attr('title')).toMatch(/helpText/i);
        });
        it("should change type for textbox to password when put in property panel", function () {
            element.isolateScope().type = "password";
            element.isolateScope().$apply();
            expect(element.attr('type')).toBe('password');
        });
        it("should change placeholder in textbox to placeholderForText when put in property panel", function () {
            element.isolateScope().placeholder = "placeholderForText";
            element.isolateScope().$apply();
            expect(element.attr('placeholder')).toMatch(/placeholderForText/i);
        });
        it("should change maxlength for textbox to 5 when put in property panel", function () {
            element.isolateScope().maxchars = "5";
            element.isolateScope().$apply();
            expect(element.attr('maxlength')).toMatch(5);
        });
    });


    describe("behavior", function () {

        it("should trigger assigned change event", function () {
            var testVariable = 1;
            element.isolateScope()._onChange = function () {
                testVariable = 2;
            };
            element.change();
            expect(testVariable).toBe(2);
        });

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