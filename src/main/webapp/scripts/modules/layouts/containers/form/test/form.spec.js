/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles*/

describe('Testing Widget: wm-formlayout', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        isNoValidateEnabled = true,
        widget = {},
        markup =
            '<wm-form title="form" name="testForm" target="_parent" width="400" height="400"' +
            'layout="one column" method="get" action="showMessage" autocomplete="off" align="left" captionposition="left" captionsize="100" horizontalalign="left" class="btn-form" fontsize="20" fontfamily="Segoe UI" color="#0000FF" whitespace="nowrap" ' +
            'color="#FFFFFF" backgroundrepeat="no-repeat" backgroundsize="300px, 300px" backgroundattachment="fixed" backgroundposition="0% 50%"  backgroundcolor="#00ff29"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderbottom="3" borderleft="3" borderright="3" borderunit="px"' +
            'paddingtop="3" paddingleft="3" enctype="multipart/form-data" novalidate=' + isNoValidateEnabled + 'paddingright="3" paddingbottom="3" paddingunit="%" margintop="3" marginleft="3" marginright="3" marginbottom="3" marginunit="px"' +
            'opacity="0.8" overflow="visible" cursor="nw-resize" zindex="100">' +
            '<wm-composite widget="text">' +
            '<wm-label></wm-label>' +
            '<wm-text></wm-text>' +
            '</wm-composite>' +
            '<wm-composite widget="textarea">' +
            '<wm-label></wm-label>' +
            '<wm-textarea></wm-textarea>' +
            '</wm-composite>' +
            '</wm-form>'

    widget.PropertiesToBeExcluded = ["display", "show", "hint", "animation", "tabindex", "badgevalue"];
    widget.type = 'wm-form'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-form widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {

            /*Include the required modules.*/

            var modulesToBeInjected = [
                'wm.common',
                'wm.utils',
                'wm.widgets',
                'wm.layouts',
                'wm.layouts.containers',
                'ngRoute',
                'wm.variables',
                'wm.plugins.database',
                'wm.plugins.webServices',
                'angular-gestures'
            ];

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

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
            //check for the method property
            it("should apply the mathod as selected from the property panel", function () {
                expect($element.attr('method')).toBe(iScope.method);

                iScope.method = "get";
                iScope.$apply();
                expect($element.attr('method')).toBe(iScope.method);
            });

            //check for the action property
            it("should apply the action property as per the value selected from the property panel", function () {
                expect($element.attr('action')).toBe(iScope.action);

                iScope.action = "showMessage";
                iScope.$apply();
                expect($element.attr('action')).toBe(iScope.action);
            });

            //check for the autocomplete property
            it("should apply autocomplete behaviour if the property is selected from the property panel", function () {
                expect($element.attr('autocomplete')).toBe("off");
            });

            //check for the captionposition property
            it("should apply the caption position property as per the value selected from the property panel", function () {
                expect($element.attr('captionposition')).toBe(iScope.captionposition);

                iScope.captionposition = "left";
                iScope.$apply();
                expect($element.attr('captionposition')).toBe(iScope.captionposition);
            });
            //check for the captionsize property
            it("should apply the caption size property as per the value selected from the property panel", function () {
                expect($element.attr('captionsize')).toBe(iScope.captionsize);
                iScope.captionsize = "100";
                iScope.$apply();
                expect($element.attr('captionsize')).toBe(iScope.captionsize);
            });
            //check for the horizontalalign property
            it("should change the horizontalalgin property when the property is selected from the property panel", function () {
                expect($element.css('text-align')).toBe(iScope.horizontalalign);

                iScope.horizontalalign = "center";
                iScope.$apply();
                expect($element.css('text-align')).toBe('center');
            });
            //check for the encType property
            it("check for encType property", function () {
                expect($element.attr('enctype')).toBe(iScope.enctype);
            });
            //check for the Submit button
            it("check for the presence of submit button in the form", function () {
                expect($element.children('.form-submit').length)>0;
            });
            //check for the Reset button
            it("check for the presence of reset button in the form", function () {
                expect($element.children('.form-reset').length)>0;
            });
            //check for the Cancel button
            it("check for the presence of cancel button in the form", function () {
                expect($element.children('.form-cancel').length)>0;
            });
            //TO DO: Add Test Cases for novalidate
        });
    });
});

