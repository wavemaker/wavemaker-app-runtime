/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Iframe dialog*/
describe("IframeDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        markup = '<wm-iframedialog name="iframedialog1" width="600" animation="shake" iconclass="wi wi-heart" iconwidth="20" iconheight="15" iconmargin="5"></wm-iframedialog>',
        dialogBody;

    /*Custom Test Suite for alert dialog widget.*/
    widget.type = 'wm-iframedialog';
    widget.widgetSelector = 'element';
    widget.unCompiled = WM.element(markup);

    //verifyCommonDialogPropertiesAndEvents(widget);
    commonWidgetTests_verifyStyles(widget, "true");

});
