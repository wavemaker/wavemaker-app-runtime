/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles*/

ddescribe('Testing Widget: wm-breadcrumb', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        scopedataset  = "Home",
        widget = {},
        markup =
            '<wm-breadcrumb name="testBreadCrumb"' +
            'height="200" scopedataset=' + scopedataset + ' show="true" horizontalalign="left" itemlabel="label" itemicon="label" itemlink="label" class="btn-breadcrumb" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF"  whitespace="nowrap" ' +
            'backgroundrepeat="no-repeat" backgroundsize="300px, 300px" backgroundattachment="fixed" backgroundposition="0% 50%"  backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderbottom="3" borderleft="3" borderright="3" borderunit="px"' +
            'paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" paddingunit="%"' +
            'opacity="0.8" overflow="visible" cursor="nw-resize" zindex="100" ' +
            '></wm-breadcrumb>';

    widget.PropertiesToBeExcluded = ["display", "hint", "animation", "tabindex", "badgevalue"];
    widget.type = 'wm-breadcrumb'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-breadcrumb widget.*/
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

            //check for the itemicon property
            it("should change the itemicon as put in property panel", function () {
                iScope.itemicon = "label";
                iScope.$apply();
                expect($element.attr('itemicon')).toBe(iScope.itemicon);
            });

            //check for the itemlabel property
            it("should change the itemlabel as put in property panel", function () {
                iScope.itemlabel = "label";
                iScope.$apply();
                expect($element.attr('itemlabel')).toBe(iScope.itemlabel);
            });

            //check for the itemlink property
            it("should change the itemlink as put in property panel", function () {
                iScope.itemlink = "label";
                iScope.$apply();
                expect($element.attr('itemlink')).toBe(iScope.itemlink);
            });

            //check for the horizontalalign property
            it("should change the horizontalalgin property when the property is selected from the property panel", function () {
                expect($element.attr('horizontalalign')).toBe(iScope.horizontalalign);

                iScope.horizontalalign = "left";
                iScope.$apply();
                expect($element.attr('horizontalalign')).toBe(iScope.horizontalalign);
            });
            /*TODO:
             1. Check for value property.
             2. Check for scopedataset property
             3. Modify test cases for itemlabel, itemicon, and itemlink
             */
        });
    });
});

