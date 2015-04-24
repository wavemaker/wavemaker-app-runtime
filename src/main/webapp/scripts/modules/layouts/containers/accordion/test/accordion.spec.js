/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope, commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents*/

describe('Testing Widget: wm-accordion', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-accordion>' +
                '<wm-accordionpane>' +
                    '<wm-accordionheader></wm-accordionheader>' +
                    '<wm-accordioncontent></wm-accordioncontent>' +
                '</wm-accordionpane>' +
            '</wm-accordion>';

    widget.type = 'wm-accordion'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
});

describe('Testing Widget: wm-accordionpane', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-accordion>' +
                '<wm-accordionpane>' +
                    '<wm-accordionheader></wm-accordionheader>' +
                    '<wm-accordioncontent></wm-accordioncontent>' +
                '</wm-accordionpane>' +
            '</wm-accordion>';

    widget.type = 'wm-accordionpane'; // type of the widget
    widget.widgetSelector = '.app-accordion-panel'; // perform common widget tests on the first element which satisfies this selector
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
});


describe('Testing Widget: wm-accordionheader', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-accordion>' +
                '<wm-accordionpane>' +
                    '<wm-accordionheader></wm-accordionheader>' +
                    '<wm-accordioncontent></wm-accordioncontent>' +
                '</wm-accordionpane>' +
            '</wm-accordion>';

    widget.type = 'wm-accordionheader'; // type of the widget
    widget.widgetSelector = '.app-accordion-panel .panel-heading'; // perform common widget tests on the first element which satisfies this selector
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
});

describe('Testing Widget: wm-accordioncontent', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-accordion>' +
                '<wm-accordionpane>' +
                    '<wm-accordionheader></wm-accordionheader>' +
                    '<wm-accordioncontent></wm-accordioncontent>' +
                '</wm-accordionpane>' +
            '</wm-accordion>';

    widget.type = 'wm-accordioncontent'; // type of the widget
    widget.widgetSelector = '.app-accordion-panel .panel-collapse '; // perform common widget tests on the first element which satisfies this selector
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
});
