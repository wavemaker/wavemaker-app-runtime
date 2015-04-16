/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Anchor*/
describe("Testing Basic Widget: Anchor", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-anchor caption="Anchor link" badgevalue="Anchor badge"  name="Anchor name" ' +
            'hint="Anchor hint" tabindex="2" target="_parent" width="200px" height="200px" ' +
            'hyperlink="http://www.wavemaker.com" show="true" animation="bounce"' +
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
            'on-click="eventHandler()" on-dblclick="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()"' +
            'on-blur="eventHandler()" on-focus="eventHandler()">' +
            '</wm-anchor>';

    widget.type = 'wm-anchor'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'blur': 'element',
        'focus': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-anchor widget.*/
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
            //check for the target property
            it("should change the target as put in property panel", function () {
                expect($element.attr('target')).toBe(iScope.target);

                iScope.target = "_Self";
                iScope.$apply();
                expect($element.attr('target')).toBe(iScope.target);
            });

            //check for the hyperlink property
            it("should change the hyperlink as put in property panel", function () {
                expect($element.attr('href')).toBe(iScope.hyperlink);

                iScope.hyperlink = "www.google.com";
                iScope.$apply();
                expect($element.attr('href')).toBe(iScope.hyperlink);
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
