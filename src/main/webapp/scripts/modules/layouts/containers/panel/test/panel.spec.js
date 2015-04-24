/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles*/

describe('Testing Widget: wm-panel', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        isCollapsible = true,
        isClosable = true,
        widget = {},
        markup =
            '<wm-panel title="title" name="testPanel" description="desc" width="100" showheader="true" helptext="help"' +
            'show="true" collapsible=' + isCollapsible +  'closable=' + isClosable + 'actions="showdialog" expanded="true"' +
            'animation="bounce" iconclass="label" horizontalalign="left"' +
            'class="btn-panel" fontsize="20" fontfamily="Segoe UI" color="#0000FF"  whitespace="nowrap"' +
            'color="#FFFFFF" backgroundimage="" backgroundrepeat="no-repeat" backgroundsize="300px, 300px" backgroundattachment="fixed" backgroundposition="0% 50%"  backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderbottom="3" borderleft="3" borderright="3" borderunit="px"' +
            'margintop="3" marginleft="3" marginright="3" marginbottom="3" marginunit="px"' +
            'opacity="0.8" overflow="visible" cursor="nw-resize" zindex="100" visibility="visible" display="block"' +
            'on-click="eventHandler()" on-dblclick="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()">' +
        '</wm-panel>'

    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element'
    };
    widget.PropertiesToBeExcluded = ["display", "hint", "animation", "tabindex", "badgevalue"];
    widget.type = 'wm-panel'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-panel widget.*/
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
            //check for the default collapsible property
            it("should have default collapsible property as true", function () {
                expect($element.attr('collapsible')).toBeTruthy();
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
            // TO DO: Check for closable property
            // TO DO: Check for help panel property
        });
    });
});

