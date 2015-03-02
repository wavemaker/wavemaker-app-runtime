/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Alert*/
describe("AlertDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        dialogBody;

    /*Verifying the common properties and events of a dialog*/
    verifyCommonDialogPropertiesAndEvents('alert');

    /*Custom Test Suite for alert dialog widget.*/
    describe("Executing custom test suite for alert dialog", function () {
        beforeEach(function () {
            widget.type = 'wm-alertdialog';
            widget.unCompiled = '<wm-alertdialog></wm-alertdialog>';
            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.widgets.base');

            inject(function (_$compile_, _$rootScope_, WidgetProperties) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $unCompiled = WM.element(widget.unCompiled);
                widgetConfig = WidgetProperties.getConfig('wm-alertdialog');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.$digest();
                iScope = element.find('.app-dialog.app-alert-dialog').isolateScope();
            });
        });

        /*Test Suite for testing the properties specific to alert dialog widget.*/
        describe("Testing properties specific to dialog", function () {
            it("should change height to 200px", function () {
                iScope.height =  "200px";
                iScope.$apply();
                expect(element.find('.app-dialog .app-dialog-body').css('height')).toBe('200px');
            });
            it("should change message to Dialog Message", function () {
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
            it("should change alert type to success", function () {
                var message;
                iScope.alerttype = "success";
                iScope.$apply();
                message = element.find('.app-dialog-body .app-dialog-message');
                expect(message.attr('class')).toMatch(/success/i);
            });
        });
    });
});
