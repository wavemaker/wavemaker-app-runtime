/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents*/
/*global modulesToBeInjected*/

describe('Testing Widget: wm-buttongroup', function () {
    'use strict';

    var $compile,
        $rootScope,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-buttongroup name="buttonGroup1" hint="Help text for buttongroup" width="200" height="200" vertical="true" show="false" ' +
            'class="dummy-class" fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" '+/*textalign="center"*/+' backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png" ' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline" '+
            '></wm-buttongroup>';
    /**
     * TODO : textalign property not applied to widget. Need to check.
     */
    widget.type = 'wm-buttongroup'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-buttongroup widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {

        // test for vertical property
        describe('Test for vertical property', function () {
            var $unCompiled = WM.element('<wm-buttongroup vertical="true"></wm-buttongroup>');

            beforeEach(function () {

                modulesToBeInjected.forEach(function (moduleName) {
                    module(moduleName);
                });

                inject(function (_$compile_, _$rootScope_) {
                    $compile = _$compile_;
                    $rootScope = _$rootScope_;
                    $element = $compile($unCompiled)($rootScope);
                    iScope = $element.isolateScope();
                    iScope.$apply();
                });
            });

            it('should have given vertical property applied', function () {
                expect($element.hasClass('btn-group-vertical')).toBe(true);
            });
        });
    });
});
