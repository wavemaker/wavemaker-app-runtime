/*global describe, it, WM, beforeEach, expect, module, inject*/
describe("Spinner", function () {
    "use strict";

    var $compile, $rootScope, element, scope;

    beforeEach(function () {
        module('wm.widgets');
        module('wmCore');
        module(function ($provide) {
            $provide.value("$routeParams", {"project_name" : "testproject"});
        });
        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            element = $compile('<wm-spinner></wm-spinner>')($rootScope);
            $rootScope.$digest();
            scope = $rootScope;
        });
    });

    describe("styles", function () {
        it("should have element width change to 200px when assigned from property panel", function () {
            element.isolateScope().imagewidth = 200;
            element.isolateScope().$apply();
            expect(element.find(".spinner-image").width()).toBe(200);
        });
        it("should have element height change to 200px when assigned from property panel", function () {
            element.isolateScope().imageheight = 200;
            element.isolateScope().$apply();
            expect(element.find(".spinner-image").height()).toBe(200);
        });

        it("should change background color style to be red", function () {
            element.isolateScope().backgroundcolor = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('background-color')).toBe('rgb(255, 0, 0)');
        });
        it("should change background image to set to given url", function () {
            element.isolateScope().image = 'http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg';
            element.isolateScope().$apply();
            expect(element.find('.spinner-image').css('background-image')).toBe('url(http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg)');
        });
        it("should change color style to be red", function () {
            element.isolateScope().color = '#FF0000';
            element.isolateScope().$apply();
            expect(element.css('color')).toBe('rgb(255, 0, 0)');
        });

        it("should change font-size to be large", function () {
            element.isolateScope().fontsize = '18';
            element.isolateScope().$apply();
            expect(element.css('font-size')).toBe('18px');
        });
        it("should change font-style to be italic", function () {
            element.isolateScope().fontstyle = 'italic';
            element.isolateScope().$apply();
            expect(element.css('font-style')).toBe('italic');
        });
        it("should change font-family to be arial", function () {
            element.isolateScope().fontfamily = 'arial';
            element.isolateScope().$apply();
            expect(element.css('font-family')).toBe('arial');
        });
        it("should change white-space to be nowrap", function () {
            element.isolateScope().whitespace = 'nowrap';
            element.isolateScope().$apply();
            expect(element.css('white-space')).toBe('nowrap');
        });
    });

    describe("properties", function () {
        it("changing source property of the spinner image", function () {
            element.isolateScope().image = "http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg";
            element.isolateScope().$apply();
            expect(element.find(".spinner-image").css("background-image")).toBe('url(http://superbwebsitebuilders.com/wp-content/uploads/2013/06/Google.jpg)');
        });
        it("changing caption property of the spinner", function () {
            element.isolateScope().caption = "";
            element.isolateScope().$apply();
            expect(element.find(".spinner-text").html()).toBe('');
        });

        it("changing title of the spinner", function () {
            element.isolateScope().hint = "testSpinner";
            element.isolateScope().$apply();
            expect(element.attr("title")).toBe('testSpinner');
        });
    });
});