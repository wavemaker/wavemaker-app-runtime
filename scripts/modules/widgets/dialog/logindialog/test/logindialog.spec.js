/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Login Dialog*/
describe("LoginDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        iScope,
        widget = {},
        widgetConfig,
        element;

    /*Verifying the common properties and events of a dialog*/
    verifyCommonDialogPropertiesAndEvents('login');

    /*Custom Test Suite for Login dialog widget.*/
    describe("Executing custom test suite for login dialog", function () {
        beforeEach(function () {
            widget.type = 'wm-logindialog';
            widget.unCompiled = '<wm-logindialog></wm-logindialog>';

            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.widgets.base');

            inject(function (_$compile_, _$rootScope_, WidgetProperties) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                widgetConfig = WidgetProperties.getConfig('wm-logindialog');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.$digest();
                iScope = element.find('.app-dialog.app-login-dialog').isolateScope();
            });
        });

        /*Test Suite for testing the properties specific to login dialog widget.*/
        describe("Testing properties specific to login dialog", function () {
            it("should change height to 200px ", function () {
                iScope.height =  "200px";
                iScope.$apply();
                expect(element.find('.app-dialog').css('height')).toBe('200px');
            });
        });

        /*Test Suite for testing the events specific to login dialog widget.*/
        describe("Testing events specific to login dialog", function () {
            it("test the onSuccess event", function () {
                var testVariable = "Before onSuccess";
                element.onSuccess = function () {
                    testVariable = "After onSuccess";
                };
                iScope.$apply();
                element.onSuccess();
                expect(testVariable).toBe("After onSuccess");
            });
            it("test the onError event", function () {
                var testVariable = "Before onError";
                element.onSuccess = function () {
                    testVariable = "After onError";
                };
                iScope.$apply();
                element.onSuccess();
                expect(testVariable).toBe("After onError");
            });
        });
    });
});