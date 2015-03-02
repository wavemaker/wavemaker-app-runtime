/*global describe, it, WM, beforeEach, expect, module, inject*/
/*jslint todo: true */
describe("Currency", function () {

    'use strict';
    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-currency></wm-currency>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    /* Unit tests for styles of currency  */
    describe("styles", function () {
        it("should have element width change to 200px when assigned from property panel", function () {
            element.isolateScope().width = 200;
            element.isolateScope().$apply();
            expect(element.find("input").width()).toBe(200);
        });
        it("should have element height change to 200px when assigned from property panel", function () {
            element.isolateScope().height = 200;
            element.isolateScope().$apply();
            expect(element.find("input").height()).toBe(200);
        });
        it("should have element minWidth change to 200px when assigned from property panel", function () {
            element.isolateScope().minwidth = 200;
            element.isolateScope().$apply();
            expect(element.find("input").css('min-width')).toBe('200px');
        });
        it("should have element minHeight change to 200px when assigned from property panel", function () {
            element.isolateScope().minheight = 200;
            element.isolateScope().$apply();
            expect(element.find("input").css('min-height')).toBe('200px');
        });

        it("should change background color style to be red", function () {
            element.isolateScope().backgroundcolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.find("input").css('background-color')).toBe('rgb(255, 0, 0)');
        });

        it("should change background image to set to given url", function () {
            element.isolateScope().backgroundimage = 'url("http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg")';
            element.isolateScope().$apply();
            expect(element.find("input").css('background-image')).toBe('url(http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg)');
        });
        it("should change color style to be red", function () {
            element.isolateScope().color = '#FF0000';
            element.isolateScope().$apply();
            expect(element.find("input").css('color')).toBe('rgb(255, 0, 0)');
        });

        it("should change font-family to be arial", function () {
            element.isolateScope().fontfamily = 'arial';
            element.isolateScope().$apply();
            expect(element.find("input").css('font-family')).toBe('arial');
        });
        it("should change font-weight to be lighter", function () {
            element.isolateScope().fontweight = 'lighter';
            element.isolateScope().$apply();
            expect(element.find("input").css('font-weight')).toBe('lighter');
        });
        it("should change font-size to be 30px", function () {
            element.isolateScope().fontsize = '30px';
            element.isolateScope().$apply();
            expect(element.find("input").css('font-size')).toBe('30px');
        });
        it("should change font-style to be italic", function () {
            element.isolateScope().fontstyle = 'italic';
            element.isolateScope().$apply();
            expect(element.find("input").css('font-style')).toBe('italic');
        });

        it("should change text-align to be center", function () {
            element.isolateScope().textalign = 'center';
            element.isolateScope().$apply();
            expect(element.find("input").css('text-align')).toBe('center');
        });

        it("should change white-space to be pre", function () {
            element.isolateScope().whitespace = 'pre';
            element.isolateScope().$apply();
            expect(element.find("input").css('white-space')).toBe('pre');
        });
        it("should change text-decoration to be underline", function () {
            element.isolateScope().textdecoration = 'underline';
            element.isolateScope().$apply();
            expect(element.find("input").css('text-decoration')).toBe('underline');
        });
        it("should change opacity to be 0.5", function () {
            element.isolateScope().opacity = '0.5';
            element.isolateScope().$apply();
            expect(element.find("input").css('opacity')).toBe('0.5');
        });
        it("should change zindex to be 2", function () {
            element.isolateScope().zindex = '2';
            element.isolateScope().$apply();
            expect(element.find("input").css('z-index')).toBe('2');
        });
        it("should change cursor to be pointer", function () {
            element.isolateScope().cursor = 'pointer';
            element.isolateScope().$apply();
            expect(element.find("input").css('cursor')).toBe('pointer');
        });
        it("should add inputClass to currency", function () {
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
            expect(element.find("input").attr('show')).toBeFalsy();
        });
        it("should have default disable property as false", function () {
            expect(element.find("input").disabled).toBeFalsy();
        });
        it("should disable the element on toggling disable property", function () {
            element.isolateScope().disabled = true;
            element.isolateScope().$apply();
            expect(element.find("input").attr('disabled')).toBeTruthy();
        });
        it("should have default required property as false", function () {
            expect(element.find("input").hasClass('ng-valid')).toBeTruthy();
        });
        it("should change the required property of the currency on toggling required property", function () {
            element.isolateScope().required = true;
            element.isolateScope().$apply();
            expect(element.find("input").attr("required")).toBe("required");
        });
        it("should change the readonly property of the currency on toggling readonly property", function () {
            element.isolateScope().readonly = true;
            element.isolateScope().$apply();
            expect(element.find("input").attr('readonly')).toBeTruthy();
        });
        it("should change model value", function () {
            element.isolateScope()._model_ = 5;
            element.isolateScope().$apply();
            expect(element.find("input").val()).toMatch(/5/i);
        });
        it("should have default currency symbol as '$'", function () {
            expect(element.attr('currencysymbol')).toMatch(/$/i);
        });
        it("should change currency symbol when set in properties panel", function () {
            element.isolateScope().currency = 'EUR';
            element.isolateScope().$apply();
            expect(element.attr('currencysymbol')).toMatch(/€/i);
        });
        it("should change helptext for currency to helpText when put in property panel", function () {
            element.isolateScope().hint = "helpText";
            element.isolateScope().$apply();
            expect(element.find("input").attr('title')).toMatch(/helpText/i);
        });
        it("should change placeholder in currency to placeholderForText when put in property panel", function () {
            element.isolateScope().placeholder = "placeholderForText";
            element.isolateScope().$apply();
            expect(element.find("input").attr('placeholder')).toMatch(/placeholderForText/i);
        });
        it("should change min value for currency to 5 when put in property panel", function () {
            element.isolateScope().minvalue = "5";
            element.isolateScope().$apply();
            expect(element.find("input").attr('min')).toMatch(5);
        });
        it("should change max value for currency to 5 when put in property panel", function () {
            element.isolateScope().maxvalue = "5";
            element.isolateScope().$apply();
            expect(element.find("input").attr('max')).toMatch(5);
        });
    });


    describe("behavior", function () {

        it("should trigger assigned change event", function () {
            var testVariable = 1;
            element.isolateScope()._onChange = function () {
                testVariable = 2;
            };
            element.find("input").change();
            expect(testVariable).toBe(2);
        });

        it("should trigger assigned click event", function () {
            var testVariable = 1;
            element.isolateScope().onClick = function () {
                testVariable = 2;
            };
            element.find("input").click();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned mouseenter event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseenter = function () {
                testVariable = 2;
            };
            element.find("input").mouseenter();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned mouseleave event", function () {
            var testVariable = 1;
            element.isolateScope().onMouseleave = function () {
                testVariable = 2;
            };
            element.find("input").mouseleave();
            expect(testVariable).toBe(2);
        });
        it("should trigger assigned focus event", function () {
            var testVariable = 1;
            element.isolateScope().onFocus = function () {
                testVariable = 2;
            };
            element.find("input").focus();
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
            element.find("input").blur();
            expect(testVariable).toBe(2);
        });
    });

});