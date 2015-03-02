/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents*/
/*global modulesToBeInjected*/

describe('Testing Widget: wm-button', function () {
    'use strict';

    var $compile,
        $rootScope,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-button name="submitBtn" tabindex="1" type="submit" hint="Help text for submit button" caption="Submit" ' +
                'width="200" height="200" show="true" disabled="disabled" iconname="saved" class="btn-primary" ' +
                'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
                'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
                'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
                'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
                'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
                'on-click="eventHandler()" on-dblclick="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()" ' +
                'on-focus="eventHandler()" on-blur="eventHandler()" ' +
            '></wm-button>';

    widget.type = 'wm-button'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    // map of eventName-selector. events target will be the element which satisfies the given selector.
    // this selector should be relative to widgetSelector
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element',
        'focus': 'element',
        'blur': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);

    /*Custom Test Suite for wm-button widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {

        // test for caption property
        describe('Test for caption property', function () {
            var $unCompiled = WM.element('<wm-button caption="{{buttonCaption}}"></wm-button>');

            beforeEach(function () {

                modulesToBeInjected.forEach(function (moduleName) {
                    module(moduleName);
                });

                inject(function (_$compile_, _$rootScope_) {
                    $compile = _$compile_;
                    $rootScope = _$rootScope_;
                    $rootScope.buttonCaption = 'Submit Button';
                    $element = $compile($unCompiled)($rootScope);
                    iScope = $element.isolateScope();
                    iScope.$apply();
                });
            });

            it('should have given caption', function () {
                expect($element.text().trim()).toBe($rootScope.buttonCaption);
            });
        });

        //test for iconname property
        describe('Test for iconname property', function () {

            var iconName = 'home',
                $unCompiled = WM.element('<wm-button iconname="' + iconName + '"></wm-button>');

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

            it('should have given iconname', function () {
                expect($element.find('> i.glyphicon-' + iconName + ':not(.ng-hide)').length).toBe(1);
                expect($element.find('> img.ng-hide').length).toBe(1);
            });
        });

        //test for iconurl property
        describe('Test for iconurl property', function () {
            var iconUrl = 'http://findicons.com/files/icons/582/the_last_order/128/url_history.png',
                $unCompiled = WM.element('<wm-button iconurl="' + iconUrl + '"></wm-button>');

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

            it('should have given iconurl', function () {
                expect($element.find('> img[src="' + iconUrl + '"]:not(.ng-hide)').length).toBe(1);
                expect($element.find('> i.ng-hide').length).toBe(1);
            });
        });

        //test for iconwidth and iconheight properties
        describe('Test for iconwidth and iconheight properties', function () {

            var iconSize = '32px',
                $unCompiled = WM.element('<wm-button iconname="home" iconwidth="' + iconSize + '" iconheight="' + iconSize + '"></wm-button>');

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

            it('should have given iconwidth and iconheight', function () {
                var $iconEl = $element.find('> i');
                expect($iconEl.css('width')).toBe(iconSize);
                expect($iconEl.css('height')).toBe(iconSize);
            });
        });

        //test for iconwidth and iconheight properties
        describe('Test for iconmargin property', function () {

            var iconMargin = '20px',
                $unCompiled = WM.element('<wm-button iconname="home" iconmargin="' + iconMargin + '"></wm-button>');

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

            it('should have given iconmargin', function () {
                var $iconEl = $element.find('> i');
                expect($iconEl.css('margin')).toBe(iconMargin);
            });
        });
    });
});
