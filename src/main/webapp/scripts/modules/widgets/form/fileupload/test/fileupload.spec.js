/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a fileupload*/
describe("Testing Form Widget: fileupload", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-fileupload name="fileupload name" tabindex="2" caption="Upload caption" ' +
            'width="300px" fileuploadtitle="Drop your files here to start uploading." ' +
            'fileuploadmessage="You can also browse for files" multiple="true" ' +
            'show="true" contenttype="audio" destination="/resource/uploads" ' +
            'iconclass="wi wi-file-upload" class="col-md-push-3" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            '></wm-fileupload>';

    widget.type = 'wm-fileupload'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["animation", "badgevalue"];

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-fileupload widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {

            /*Include the required modules.*/
            module('wm.common');
            module('wm.utils');
            module('wm.widgets');
            module('ngRoute');

            inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $element = $compile(widget.$unCompiled.clone())($rootScope);

                // if the widgetSelector is other than `element`,
                // find the widget and its isolateScope using widgetSelector
                if (widget.widgetSelector && widget.widgetSelector !== 'element') {
                    $element = $element.find(widget.widgetSelector).first();
                }
                iScope = $element.isolateScope();
                iScope.$apply();
            });
        });

        describe("properties", function () {
            it("Enabling the multiple property in properties panel switch to the single file upload widget", function () {
                iScope.multiple = true;
                iScope.$apply();
                expect($element.find('.singleFileUpload').hasClass('ng-hide')).toBeFalsy();
            });

            it("Selecting the audio type in property panel must change the selection to audio type", function () {
                iScope.filetypefilter = "audio";
                iScope.$apply();
                expect($element.find(".app-single-file-upload input").attr("accept")).toBe("audio/*");
            });

            //check for the fileuploadtitle property
            it("should check the fileuploadtitle put in property panel", function () {
                iScope.fileuploadtitle = "Drop your files here to start uploading.";
                iScope.$apply();
                expect($element.find('[data-ng-bind="fileuploadtitle"]').text()).toMatch(iScope.fileuploadtitle);
            });

            //check for the fileuploadmessage property
            it("should check the fileuploadmessage put in property panel", function () {
                iScope.fileuploadmessage = "You can also browse for files";
                iScope.$apply();
                expect($element.find('[data-ng-bind="fileuploadmessage"]').text()).toMatch(iScope.fileuploadmessage);
            });

            //check for the destination property
            it("should check the destination put in property panel", function () {
                iScope.destination = "/resource/uploads";
                iScope.$apply();
                expect($element.attr('destination')).toMatch(iScope.destination);
            });

            //check for the iconclass property
            it("should check the iconclass put in property panel", function () {
                iScope.iconclass = "wi wi-file-upload";
                iScope.$apply();
                expect($element.find('.wi ').hasClass('wi-file-upload')).toBe(true);
            });
        });
    });
});
