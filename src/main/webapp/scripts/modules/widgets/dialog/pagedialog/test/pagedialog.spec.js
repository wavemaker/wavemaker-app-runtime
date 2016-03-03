/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Page dialog*/
describe('Testing Widget: wm-pagedialog', function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        markup = '<wm-pagedialog name="PageName" oktext="Acccept" title="PageContent" width="600" height="200" content="header"'+
                 'animation="shake" iconclass="wi wi-heart" iconwidth="20" iconheight="15" iconmargin="5"></wm-pagedialog>',
        dialogBody;

    /*Custom Test Suite for alert dialog widget.*/
    widget.type = 'wm-pagedialog';
    widget.widgetSelector = 'element';
    widget.unCompiled = WM.element(markup);

    //verifyCommonDialogPropertiesAndEvents(widget);
    commonWidgetTests_verifyStyles(widget, "true");

});