/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Confirm Dialog*/
describe("ConfirmDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        iScope,
        widget = {},
        widgetConfig,
        element,
        dialogBody;

    /*Verifying the common properties and events of a dialog*/
    verifyCommonDialogPropertiesAndEvents('confirm');

    /*Custom Test Suite for confirm dialog widget.*/
    describe("Executing custom test suite for Confirm dialog", function () {
        beforeEach(function () {
            widget.type = 'wm-confirmdialog';
            widget.unCompiled = '<wm-confirmdialog></wm-confirmdialog>';
            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.widgets.base');

            inject(function (_$compile_, _$rootScope_, WidgetProperties) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                widgetConfig = WidgetProperties.getConfig('wm-confirmdialog');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.$digest();
                iScope = element.find('.app-dialog.app-confirm-dialog').isolateScope();
            });
        });

        /*Test Suite for testing the properties specific to confirm dialog widget.*/
        describe("Testing properties specific to confirm dialog", function () {
            it("should change height to 200px", function () {
                iScope.height =  "200px";
                iScope.$apply();
                expect(element.find('.app-dialog .app-dialog-body').css('height')).toBe('200px');
            });
            it("should change message to Dialog Message ", function () {
                iScope.message = "Dialog Message";
                iScope.$apply();
                dialogBody = element.find('.app-dialog-body');
                expect(dialogBody.text()).toMatch('Dialog Message');
            });
            it("should change ok text to I agree", function () {
                var button;
                iScope.oktext = "I agree";
                iScope.$apply();
                button = element.find('.app-dialog-footer .btn-primary');
                expect(button.attr('caption')).toBe('I agree');
            });
            it("should change cancel text to I don't agree", function () {
                var button;
                iScope.canceltext = "I don't agree";
                iScope.$apply();
                button = element.find('.app-dialog-footer .btn-secondary');
                expect(button.attr('caption')).toBe("I don't agree");
            });
        });
        describe("Testing events specific to confirm dialog", function () {
            it("test the onCancel event", function () {
                var testVariable = 5;
                element.onCancel = function () {
                    testVariable = 6;
                };
                iScope.$apply();
                element.onCancel();
                expect(testVariable).toBe(6);
            });
        });
    });
});
