/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles*/

describe('Testing Widget: wm-tabs', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        isVertical = true,
        widget = {},
        markup =
        '<wm-tabs name="testTabs" width="100" vertical=' + isVertical + 'ahow="true" horizontalalign="left" taborder="tabtitle1"' +
            'class="btn-tabs" fontsize="20" fontfamily="Segoe UI" color="#0000FF"  whitespace="nowrap"' +
            'color="#FFFFFF" backgroundimage="" backgroundrepeat="no-repeat" backgroundsize="300px, 300px" backgroundattachment="fixed" backgroundposition="0% 50%"  backgroundcolor="#00ff29"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderbottom="3" borderleft="3" borderright="3" borderunit="px"' +
            'margintop="3" marginleft="3" marginright="3" marginbottom="3" marginunit="px"' +
            'opacity="0.8" overflow="visible" cursor="nw-resize" zindex="100" visibility="visible" display="block">'
        '</wm-tabs>'

    widget.PropertiesToBeExcluded = ["display", "hint", "animation", "tabindex", "badgevalue"];
    widget.type = 'wm-tabs'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-tabs widget.*/
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
            //check for the vertical property
            it("should render vertical tabs when this property is selected from the property panel", function () {
                expect($element.hasClass('ng-stacked')).toBe(iScope.vertical);
                $element.isolateScope().vertical = false;
                iScope.$apply();
                expect($element.hasClass('ng-stacked')).toBe(false);
            });
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
            //check for the horizontalalign property
            it("should change the horizontalalgin property when the property is selected from the property panel", function () {
                expect($element.attr('horizontalalign')).toBe(iScope.horizontalalign);

                iScope.horizontalalign = "left";
                iScope.$apply();
                expect($element.attr('horizontalalign')).toBe(iScope.horizontalalign);
            });
            //check for the taborder property
            it("should change the order of the tabs as selected from the property panel", function () {
                expect($element.attr('taborder')).toBe(iScope.taborder);

                iScope.taborder = "tabtitle1";
                iScope.$apply();
                expect($element.attr('taborder')).toBe(iScope.taborder);
            });

        });
    });
});

