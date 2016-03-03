/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a Login Dialog*/
describe("LoginDialog", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        iScope,
        widget = {},
        widgetConfig,
        element,
        markup = '<wm-logindialog modal="false" iconclass="wi wi-sign-in" title="Login" name="logindialog1">'+
            '<wm-dialogheader name="LoginDialog" width="600" height="200" animation="shake" iconclass="wi wi-heart" iconwidth="20px" iconheight="20px" iconmargin="5px" hint="LoginDialog"></wm-dialogheader>'+
            '<wm-dialogcontent name="dialogcontent1">'+
            '<wm-form name="form1">'+
            '<wm-message scopedataset="loginMessage" class="app-login-dialog-message" name="message1"></wm-message>'+
            '<wm-composite name="composite1">'+
            '<wm-label caption="Username" class="col-md-3" name="label2"></wm-label>'+
            '<wm-container class="col-md-9" name="container1">'+
            '<wm-text placeholder="Enter username" class="app-login-dialog-username" name="usernametext" updateon="default"></wm-text>'+
            '</wm-container>'+
            '</wm-composite>'+
            '<wm-composite name="composite2">'+
            '<wm-label caption="Password" class="col-md-3" name="label3"></wm-label>'+
            '<wm-container class="col-md-9" name="container2">'+
            '<wm-text type="password" placeholder="Enter password" class="app-login-dialog-password" name="passwordtext" updateon="default"></wm-text>'+
            '</wm-container>'+
            '</wm-composite>'+
            '</wm-form>'+
            '</wm-dialogcontent>'+
            '<wm-dialogactions name="dialogactions1" show="true">'+
            '<wm-button class="btn-primary" caption="Sign in" name="button2"></wm-button>'+
            '</wm-dialogactions>'+
            '</wm-logindialog>',
        dialogBody;

    /*Custom Test Suite for alert dialog widget.*/
    widget.type = 'wm-logindialog';
    widget.widgetSelector = 'element';
    widget.unCompiled = WM.element(markup);

    //verifyCommonDialogPropertiesAndEvents(widget);
    commonWidgetTests_verifyStyles(widget, "true");

});