describe('Testing Widget: wm-alertdialog', function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        markup = '<wm-alertdialog name="NameAlert" id="NameAlert123" iconclass="wi wi-heart" title="DialogAlert" message="I am an information  box!" oktext="Accept"'+
                 'alerttype="information" width="600" height="200" animation="bounceIn" iconwidth="10" iconheight="15" iconmargin="10"></wm-alertdialog>',
        dialogBody;

    /*Custom Test Suite for alert dialog widget.*/
    widget.type = 'wm-alertdialog';
    widget.widgetSelector = 'element';
    widget.unCompiled = WM.element(markup);

    //verifyCommonDialogPropertiesAndEvents(widget);
    commonWidgetTests_verifyStyles(widget, "true");

});
