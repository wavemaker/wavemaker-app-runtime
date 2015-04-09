/*global describe, it, WM, beforeEach, expect*/
describe("\nUnit: Testing Editor Directives: Radio", function () {
    'use strict';
    var $compile, $rootScope, element, scope;

    beforeEach(WM.mock.module('wmCore'));

    beforeEach(WM.mock.inject(function ($compile, $rootScope) {
        element = WM.element('<wm-radio></wm-radio>');
        $compile(element)($rootScope);
        $rootScope.$digest();
        scope = $rootScope;
    }));

    it("should display radio button with label", function () {
        expect(element.find('input[type=radio]')[0]).toBeDefined();
        expect(element.find('label')[0]).toBeDefined();
    });

    it("should default name property is to be undefined", function () {
        expect(element.scope().name).toBeUndefined();
    });

    it("should default height is 24", function () {
        expect(element.scope().height).toBe(24);
    });
    it("should default showing property is to be TRUE", function () {
        expect(element.scope().showing).toBeTruthy();
    });

    it("should default editorBorder property is to be FALSE", function () {
        expect(element.scope().editorBorder).toBeTruthy();
    });

    /*Testing Bindings*/

    it("should caption width change to 50px ", function () {
        element.scope().captionSize = 50;
        element.scope().$apply();
        expect(element.find('label').width()).toBe(50);
    });
    it("should caption  change to radioButtonWidget ", function () {
        element.scope().caption = "radioButtonWidget";
        element.scope().$apply();
        expect(element.find('label').text()).toBe("radioButtonWidget");
    });
    it("should element width change to 200px ", function () {
        element.scope().width = 200;
        element.scope().$apply();
        expect(element.width()).toBe(200);
    });
    it("should element height change to 200px ", function () {
        element.scope().height = 200;
        element.scope().$apply();
        expect(element.height()).toBe(200);
    });
    it("should element minWidth change to 200px ", function () {
        element.scope().minWidth = 200;
        element.scope().$apply();
        expect(element.css('min-width')).toBe('200px');
    });
    it("should element minHeight change to 200px ", function () {
        element.scope().minHeight = 200;
        element.scope().$apply();
        expect(element.css('min-height')).toBe('200px');
    });
    it("should element must be invisible", function () {
        element.scope().showing = false;
        element.scope().$apply();
        expect(element.css('display')).toBe('none');
    });


    it("should radio button must be invisible when the editorBorder is FALSE", function () {
        element.scope().editorBorder = false;
        element.scope().$apply();
        expect(element.find('input[type="radio"]').hasClass('no-border')).toBeTruthy();
    });

    /* Unit tests for styles */
    it("should COLOR STYLE must be RED", function () {
        element.scope().color = '#FF0000';
        element.scope().$apply();
        expect(element.find('label').css('color')).toBe('rgb(255, 0, 0)');
    });
    it("should BORDER width STYLE must be 4px", function () {
        element.scope().border = '4px';
        element.scope().$apply();
        expect(element.css('border')).toBe('4px');
    });
    it("should BORDER COLOR STYLE must be RED", function () {
        element.scope().borderColor = '#FF0000';
        element.scope().$apply();
        expect(element.css('border-color')).toBe('rgb(255, 0, 0)');
    });
    it("should  BACKGROUND COLOR STYLE must be RED", function () {
        element.scope().backgroundColor = '#FF0000';
        element.scope().$apply();
        expect(element.css('background-color')).toBe('rgb(255, 0, 0)');
    });
    it("should MARGIN STYLE must be 10PX 5PX 3PX 2PX", function () {
        element.scope().margin = '10px 5px 3px 2px';
        element.scope().$apply();
        expect(element.css('margin')).toBe('10px 5px 3px 2px');
    });
    it("should PADDING STYLE must be 10PX 5PX 3PX 2PX", function () {
        element.scope().padding = '10px 5px 3px 2px';
        element.scope().$apply();
        expect(element.css('padding')).toBe('10px 5px 3px 2px');
    });
    it("should OPACITY must be 0.5", function () {
        element.scope().opacity = 0.5;
        element.scope().$apply();
        expect(element.css('opacity')).toBe('0.5');
    });
    it("should Z-INDEX must be 100", function () {
        element.scope().zIndex = 100;
        element.scope().$apply();
        expect(element.css('z-index')).toBe('100');
    });
    it("should FONT-FAMILY must be ARIAL", function () {
        element.scope().fontFamily = 'arial';
        element.scope().$apply();
        expect(element.find('label').css('font-family')).toBe('arial');
    });
    it("should FONT-WEIGHT must be LIGHTER", function () {
        element.scope().fontWeight = 'lighter';
        element.scope().$apply();
        expect(element.find('label').css('font-weight')).toBe('lighter');
    });
    it("should TEXT-ALIGN must be CENTER", function () {
        element.scope().textAlign = 'center';
        element.scope().$apply();
        expect(element.css('text-align')).toBe('center');
    });
    it("should VERTICAL-ALIGN must be BASELINE", function () {
        element.scope().verticalAlign = 'baseline';
        element.scope().$apply();
        expect(element.css('vertical-align')).toBe('baseline');
    });
    it("should FONT-VARIANT must be SMALL-CAPS", function () {
        element.scope().fontVariant = 'small-caps';
        element.scope().$apply();
        expect(element.css('font-variant')).toBe('small-caps');
    });

    it("should WORD-BREAK must be BREAK-WORD", function () {
        element.scope().wordBreak = 'break-word';
        element.scope().$apply();
        expect(element.css('word-break')).toBe('break-word');
    });
    it("should TEXT-DECORATION must be UNDERLINE", function () {
        element.scope().textDecoration = 'underline';
        element.scope().$apply();
        expect(element.find('label').css('text-decoration')).toBe('underline');
    });
    it("should CURSOR must be POINTER", function () {
        element.scope().cursor = 'pointer';
        element.scope().$apply();
        expect(element.css('cursor')).toBe('pointer');
    });
    it("should BORDER RADIUS must be 2PX 3PX 4PX 5PX", function () {
        element.scope().borderRadius = '2px 3px 4px 5px';
        element.scope().$apply();
        expect(element.css('border-top-left-radius')).toBe('2px 2px');
        expect(element.css('border-top-right-radius')).toBe('3px 3px');
        expect(element.css('border-bottom-right-radius')).toBe('4px 4px');
        expect(element.css('border-bottom-left-radius')).toBe('5px 5px');
    });

});