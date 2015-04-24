/*global describe, it, WM, beforeEach, expect*/
describe('WaveMaker services', function () {
    'use strict';

    beforeEach(WM.mock.module('wmCore'));

    describe('\n\tUnit: Testing WaveMaker Widget Factory', function () {

        it('getWidgetFactory() returns 3 widgets', WM.mock.inject(function (WidgetFactory) {
            expect(WidgetFactory.getWidgetFactory().length).toEqual(3);
        }));

        it('check if components have 10 widgets', WM.mock.inject(function (WidgetFactory) {
            var components = WidgetFactory.getWidgetFactory().filter(function (widget) {
                return (widget.name === 'components');
            });
            expect(components[0]).toBeDefined();
            expect(components[0].widgets.length).toBe(10);
        }));
    });

    describe('\n\tUnit: Testing WaveMaker Widget Property Factory', function () {

        it('getProperties() returns properties for "wm-button"', WM.mock.inject(function (WidgetPropertyFactory) {
            expect(WidgetPropertyFactory.getProperties('wm-button')).toBeDefined();
        }));
    });

    describe('\n\tUnit: Testing WaveMaker Component Properties Factory', function () {

        it('getComponentProperties() returns properties for "wmText-style"', WM.mock.inject(function (ComponentProperties) {
            expect(ComponentProperties.getComponentProperties('wmText-style')).toBeDefined();
        }));
    });

    describe('\n\tUnit: Testing WaveMaker WmUI Factory', function () {

        it('getWmUIFactory() should returns valid header icons', WM.mock.inject(function (WmUIFactory) {
            var wmUi = WmUIFactory.getWmUIFactory();
            expect(wmUi.headerIcons).toBeDefined();
            expect(wmUi.headerIcons.rightIcons).toBeDefined();
            expect(wmUi.headerIcons.leftIcons).toBeDefined();
        }));
    });
});
