/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a popover*/
describe("Testing Basic Widget: popover", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-popover caption="Popover caption" name="Popover Name" hint="Popover hint" tabindex="1" ' +
            'width="200px" height="200px" popoverwidth="300px" popoverheight="300px" show="true"' +
            'iconclass="glyphicon glyphicon-star-empty"iconwidth="20px" iconheight="20px" iconmargin="5px" ' +
            'iconurl="http://pngimg.com/upload/star_PNG1592.png" class="btn-primary" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            'animation="bounce" popoverplacement="bottom" popoverarrow="true"' +
            '>' +
            '</wm-popover>';

    widget.type = 'wm-popover'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["hint", "show"];

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);

    /*Custom Test Suite for wm-popover widget.*/
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
            // check for hint property
            it('should have given hint', function () {
                expect($element.find('a').attr('title')).toBe(iScope.hint);

                iScope.hint = 'updated';
                iScope.$apply();
                expect($element.find('a').attr('title')).toBe(iScope.hint);
            });

            //check for the popoverwidth property
            it("should change the popoverwidth as put in property panel", function () {
                expect($element.find('.popover-content').css('width')).toBe(iScope.popoverwidth);
            });

            //check for the popoverheight property
            it("should change the popoverheight as put in property panel", function () {
                expect($element.find('.popover-content').css('height')).toBe(iScope.popoverheight);
            });

            // check for show property
            it('should have proper display property based on given show value', function () {
                var isShowDefined = widget.$unCompiled[0].attributes.hasOwnProperty('show'),
                    initShowValue = isShowDefined ? iScope.show : true;

                expect($element.hasClass('ng-hide')).not.toBe(initShowValue);
            });

            //check for the popoverplacement property
            it("should change the popoverplacement as put in property panel", function () {
                expect($element.find('.popover').hasClass(iScope.popoverplacement)).toBe(true);
            });

            //check for the popoverarrow property
            it("should change the popoverarrow as put in property panel", function () {
                expect($element.find('.arrow').hasClass('ng-hide')).not.toBe(iScope.popoverarrow);
            });

            //check for the iconclass property
            it("should change the iconclass as put in property panel", function () {
                expect($element.find('i').hasClass(iScope.iconclass)).toBe(true);
            });

            //check for the iconwidth property
            it("should change the iconwidth as put in property panel", function () {
                expect($element.find('i').css('width')).toBe(iScope.iconwidth);
            });

            //check for the iconheight property
            it("should change the iconheight as put in property panel", function () {
                expect($element.find('i').css('height')).toBe(iScope.iconheight);
            });

            //check for the iconmargin property
            it("should change the iconmargin as put in property panel", function () {
                expect($element.find('i').css('margin')).toBe(iScope.iconmargin);
            });

            //check for the iconurl property
            it("should change the iconurl as put in property panel", function () {
                expect($element.find('img').attr('src')).toBe(iScope.iconurl);
            });

        });
    });
});
