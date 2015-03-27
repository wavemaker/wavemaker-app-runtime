/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Iframe dialog*/
describe("IframeDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $sce,
        iScope,
        widget = {},
        widgetConfig,
        element,
        iframe;

    /*Verifying the common properties and events of a dialog*/
    verifyCommonDialogPropertiesAndEvents('iframe');

    /*Custom Test Suite for Iframe widget.*/
    describe("Executing custom test suite for Iframe dialog", function () {
        beforeEach(function () {
            widget.type = 'wm-iframedialog';
            widget.unCompiled = '<wm-iframedialog></wm-iframedialog>';
            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.widgets.base');

            inject(function (_$compile_, _$rootScope_, WidgetProperties, _$sce_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $sce = _$sce_;
                $unCompiled = WM.element(widget.unCompiled);
                widgetConfig = WidgetProperties.getConfig('wm-iframedialog');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.preferences = {};
                $rootScope.$digest();
                /*Mocking the preferences object and setting blockNonSecureContent to true since it is unavailable*/
                $rootScope.preferences.blockNonSecureContent = true;
                iScope = element.find('.app-dialog.app-iframe-dialog').isolateScope();
            });
        });

        /*Test Suite for testing the properties specific to Iframe widget.*/
        describe("Testing properties specific to dialog", function () {
            it("should change height to 200px ", function () {
                iScope.height =  "200px";
                iScope.$apply();
                expect(element.find('.app-dialog .app-dialog-body').css('height')).toBe('200px');
            });
            it("should check the default content is www.wavemaker.com", function () {
                iframe = element.find('.app-dialog-body .app-iframe');
                expect(iframe.attr('src')).toBe('http://www.wavemaker.com');
            });
            it("should change content to ww.google.com Message", function () {
                iScope.iframeurl = $sce.trustAsResourceUrl("www.google.com");
                iScope.$apply();
                iframe = element.find('.app-dialog-body .app-iframe');
                expect(iframe.attr('src')).toBe('www.google.com');
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
