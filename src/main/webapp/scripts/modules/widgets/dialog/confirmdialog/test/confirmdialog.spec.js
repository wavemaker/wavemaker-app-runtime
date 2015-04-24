/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Confirm dialog*/
describe('Testing Widget: wm-confirmdialog', function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        markup = '<wm-confirmdialog name="ConfirmName" title="ConfirmBox" message="I am confirm box message!" oktext="Accept" canceltext="Reject" width="600" height="200" ' +
                 'animation="shake" iconwidth="20" iconheight="15" iconmargin="5" iconclass="glyphicon glyphicon-heart"></wm-confirmdialog>',
        dialogBody;

    /*Custom Test Suite for alert dialog widget.*/
    widget.type = 'wm-confirmdialog';
    widget.widgetSelector = 'element';
    widget.unCompiled = WM.element(markup);

    //verifyCommonDialogPropertiesAndEvents(widget);
    commonWidgetTests_verifyStyles(widget, "true");

});
