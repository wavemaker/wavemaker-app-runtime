/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Page dialog*/
describe("PageDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element;

    /*Verifying the common properties and events of a dialog*/
    verifyCommonDialogPropertiesAndEvents('page');

    /*Custom Test Suite for page dialog widget.*/
    describe("Executing custom test suite for Page dialog", function () {
        beforeEach(function () {
            widget.type = 'wm-pagedialog';
            widget.unCompiled = '<wm-pagedialog></wm-pagedialog>';
            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.variables');
            module('wm.widgets.base');
            module(function ($provide) {
                $provide.value("$routeParams");
            });

            inject(function (_$compile_, _$rootScope_, WidgetProperties) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $unCompiled = WM.element(widget.unCompiled);
                widgetConfig = WidgetProperties.getConfig('wm-pagedialog');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.$digest();
                iScope = element.find('.app-dialog.app-page-dialog').isolateScope();
                $rootScope.project = {};
                $rootScope.project.id = "wmId";
            });
        });

        /*Test Suite for testing the properties specific to page dialog widget.*/
        describe("Testing properties specific to page dialog", function () {
            it("should change height to 200px", function () {
                iScope.height =  "200px";
                iScope.$apply();
                expect(element.find('.app-dialog .app-dialog-body').css('height')).toBe('200px');
            });
            it("should change ok text to I agree", function () {
                var button;
                iScope.oktext = "I agree";
                iScope.$apply();
                button = element.find('.app-dialog-footer .btn-primary');
                expect(button.attr('caption')).toBe('I agree');
            });
        });
    });
});
