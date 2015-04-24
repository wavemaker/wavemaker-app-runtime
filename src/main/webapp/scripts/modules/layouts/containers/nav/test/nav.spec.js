/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles*/

describe('Testing Widget: wm-nav', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-nav name="testNav" type="pills" layout="stacked" itemicon="en" itemlabel="en" itemlink="en" itemchildren="en" show="true" horizontalalign="left"' +
            'class="btn-nav" fontsize="20" fontfamily="Segoe UI" color="#0000FF"  whitespace="nowrap" ' +
            'color="#FFFFFF" backgroundimage="" backgroundrepeat="no-repeat" backgroundsize="300px, 300px" backgroundattachment="fixed" backgroundposition="0% 50%"  backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderbottom="3" borderleft="3" borderright="3" borderunit="px"' +
            'paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" paddingunit="%"' +
            'opacity="0.8" overflow="visible" cursor="nw-resize" zindex="100">' +
            '</wm-nav>'

    widget.PropertiesToBeExcluded = ["display", "hint", "animation", "tabindex", "badgevalue"];
    widget.type = 'wm-nav'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-nav widget.*/
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
            //check for the default show property
            it("should have default show property as true", function () {
                expect($element.isolateScope().show).toBeTruthy();
            });
            //check the show property
            it("should hide the element", function () {
                $element.isolateScope().show = false;
                $element.isolateScope().$apply();
                expect($element.hasClass('ng-hide')).toBeTruthy();
            });
            //check for the animation property
            it("should apply the animation property as selected from the property panel", function () {
                expect($element.attr('animation')).toBe(iScope.animation);
            });
            //check for the horizontalalign property
            it("should change the horizontalalgin property when the property is selected from the property panel", function () {
                expect($element.css('text-align')).toBe(iScope.horizontalalign);

                iScope.horizontalalign = "center";
                iScope.$apply();
                expect($element.css('text-align')).toBe('center');
            });
            // TO DO: Check for layout, type, and scopedataset
        });
    });
});

