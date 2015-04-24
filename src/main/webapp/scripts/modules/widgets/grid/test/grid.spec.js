/*global describe, it, WM, beforeEach, expect, module, inject*/
describe("\nUnit: Testing Grid Widget", function () {
    'use strict';
    var $compile, $rootScope, element, scope, dirScope, ctrl;

    beforeEach(function () {
        module('wm.widgets');
        module('wm.widgets.grid');
        module('wmCore');
        module('ngGrid');
        module(function ($provide) {
            $provide.value("$routeParams", {"project_name": "testProject"});
        });
        inject(function (_$compile_, _$rootScope_, $controller, $timeout) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-grid></wm-grid>')($rootScope);

            /* Commented below code as dataMapper function is no more in grid widget
            var sampleData = [
                {"name": "Moroni", "allowance": 505050505050505050, "paid": true},
                {"name": "Tiancum", "allowance": 53, "paid": false},
                {"name": "Jacob", "allowance": 27, "paid": false},
                {"name": "Nephi", "allowance": 29, "paid": false}
            ];
            element.isolateScope().dataMapper(sampleData);
            */

            $timeout.flush();
            $rootScope.$digest();
            scope = $rootScope;
            dirScope = element.isolateScope();
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
        it("should change border-radius to be 2PX 3PX 4PX 5PX", function () {
            element.isolateScope().borderradius = '2px 3px 4px 5px';
            element.isolateScope().$apply();
            expect(element.css('border-top-left-radius')).toBe('2px 2px');
            expect(element.css('border-top-right-radius')).toBe('3px 3px');
            expect(element.css('border-bottom-right-radius')).toBe('4px 4px');
            expect(element.css('border-bottom-left-radius')).toBe('5px 5px');
        });

        it("should change color style to be red", function () {
            element.isolateScope().color = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('color')).toBe('rgb(255, 0, 0)');
        });

        it("should change background color style to be red", function () {
            element.isolateScope().backgroundcolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('background-color')).toBe('rgb(255, 0, 0)');
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
        it("should change vertical-align to be baseline", function () {
            element.isolateScope().verticalalign = 'baseline';
            element.isolateScope().$apply();
            expect(element.css('vertical-align')).toBe('baseline');
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
    });

    /* Commented the test case as the grid is not initialized with sample data anymore.

    it(" should grid Data rows  must be rendered properly", function () {
        var noOfRows = element.find('.ngRow').length;
        console.log(element.find('.ngRow'));
        expect(noOfRows).toBe(4);
    });

    */

    it("should search binding must be working", function () {
        element.isolateScope().gridsearch = true;
        element.isolateScope().$apply();
        expect(element.find(".wm-search-box").hasClass('ng-hide')).toBeFalsy();
        element.isolateScope().gridsearch = false;
        element.isolateScope().$apply();
        expect(element.find(".wm-search-box").hasClass('ng-hide')).toBeTruthy();
    });

    /* Commented the test case as the grid is not initialized with sample data anymore.

    it("should delete row binding must be working", function () {
        runs(function () {
            element.isolateScope().deleterow = true;
            element.isolateScope().$apply();
        });
        waits(200);
        runs(function () {
            expect(element.find('.deleteRow').length).toBe(4);
        });
    });

    */

    it("should hide the GRID on setting show property to false", function () {
        element.isolateScope().show = false;
        element.isolateScope().$apply();
        expect(element.hasClass('ng-hide')).toBeTruthy();
    });

    /* Commented the test case as the grid is not initialized with sample data anymore.

    it("should row must be deleted when clicked the delete button in delete column", inject(function ($rootScope, $compile) {

        runs(function () {
            element.isolateScope().deleterow = true;
            element.isolateScope().$apply();
            spyOn(window, 'confirm').andReturn(true);
        });
        waits(200);
        runs(function () {
            element.find('.deleteRow').first().click();
        });
        waits(200);
        runs(function () {
            expect(element.find('.ngRow').length).toBe(3);
        });
    }));
    */
});