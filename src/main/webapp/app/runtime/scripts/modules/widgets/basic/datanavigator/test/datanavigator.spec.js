/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a datanavigator*/
describe("Testing Basic Widget: datanavigator", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-datanavigator name="datanavigator Name" width="300px" height="300px"' +
            ' show="true" showrecordcount="false"  horizontalalign="center" verticalalign="bottom" class="btn-primary" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline">' +
            '</wm-datanavigator>';

    widget.type = 'wm-datanavigator'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);


    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    //commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-datanavigator widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {

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
            //check for the showrecordcount property
            it("should change the showrecordcount as put in property panel", function () {
                expect($element.attr('showrecordcount')).toMatch(iScope.showrecordcount);
            });

            //check for the horizontalalign property
            it("should change the horizontalalign as put in property panel", function () {
                expect($element.attr('horizontalalign')).toMatch(iScope.horizontalalign);
            });

            //check for the verticalalign property
            it("should change the verticalalign as put in property panel", function () {
                expect($element.css('vertical-align')).toMatch(iScope.verticalalign);
            });
         });
    });
});
