/*global WM, */
WM.module('wm.widgets')
    .config(function (WidgetPropertiesProvider) {
        "use strict";

        WidgetPropertiesProvider.addGroup({"name": "widgets", "namekey": "LABEL_WIDGETS", "iconclass": "widgets"});

        /* register the wm-login widget with its properties */
        WidgetPropertiesProvider.register("wm-login", {
            "widgetType": "wm-login",
            "template":
                "<wm-login>" +
                    "<wm-composite> " +
                        "<wm-label class='col-md-3' caption='Username'></wm-label> " +
                        "<wm-container class='col-md-9'>" +
                            "<wm-text placeholder='Enter username' name='usernametext' class='app-login-username' updateon='default'></wm-text>" +
                        "</wm-container> " +
                    "</wm-composite> " +
                    "<wm-composite> " +
                        "<wm-label class='col-md-3' caption='Password'></wm-label> " +
                        "<wm-container class='col-md-9'>" +
                            "<wm-text type='password' name='passwordtext' placeholder='Enter password' class='app-login-password' updateon='default'></wm-text>" +
                        "</wm-container>" +
                    "</wm-composite> " +
                    "<wm-button type='submit' caption='Sign in' width='100%' class='app-login-button btn-primary'></wm-button> " +
                    "<wm-composite> " +
                            "<wm-checkbox class='app-login-rememberme' scopedatavalue='user.rememberMe' ></wm-checkbox> " +
                            "<wm-label caption='Remember Me' class='app-login-remembermetext'></wm-label> " +
                            "<wm-anchor caption='Forgot Password' class='app-login-forgotlink'></wm-anchor> " +
                    "</wm-composite> " +
                "</wm-login>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-anchor widget with its properties */
        WidgetPropertiesProvider.register("wm-anchor", {
            "widgetType": "wm-anchor",
            "template": "<wm-anchor></wm-anchor>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-audio widget with its properties */
        WidgetPropertiesProvider.register("wm-audio", {
            "widgetType": "wm-audio",
            "template": "<wm-audio controls='controls' audiopreload='none'></wm-audio>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-chart widget with its properties */
        WidgetPropertiesProvider.register("wm-chart", {
            "template": "<wm-chart></wm-chart>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });
        WidgetPropertiesProvider.register("wm-chart-line", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Line'></wm-chart>"
        });
        WidgetPropertiesProvider.register("wm-chart-column", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Column'></wm-chart>"
        });
        WidgetPropertiesProvider.register("wm-chart-pie", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Pie'></wm-chart>"
        });
        WidgetPropertiesProvider.register("wm-chart-area", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Area'></wm-chart>"
        });
        WidgetPropertiesProvider.register("wm-chart-bar", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Bar'></wm-chart>"
        });

        WidgetPropertiesProvider.register("wm-chart-cumulativeline", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Cumulative Line'></wm-chart>"
        });

        WidgetPropertiesProvider.register("wm-chart-donut", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Donut'></wm-chart>"
        });

        WidgetPropertiesProvider.register("wm-chart-bubble", {
            "widgetType": "wm-chart",
            "template": "<wm-chart type='Bubble'></wm-chart>"
        });

        /* register the wm-datanavigator widget with its properties */
        WidgetPropertiesProvider.register("wm-datanavigator", {
            "widgetType": "wm-datanavigator",
            "template": "<wm-datanavigator></wm-datanavigator>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-html widget with its properties */
        WidgetPropertiesProvider.register("wm-html", {
            "widgetType": "wm-html",
            "template": "<wm-html></wm-html>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-iframe widget with its properties */
        WidgetPropertiesProvider.register("wm-iframe", {
            "widgetType": "wm-iframe",
            "template": "<wm-iframe></wm-iframe>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-label widget with its properties */
        WidgetPropertiesProvider.register("wm-label", {
            "widgetType": "wm-label",
            "template": "<wm-label></wm-label>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });
        /* register the wm-label widget with its properties */
        WidgetPropertiesProvider.register("wm-icon", {
            "widgetType": "wm-icon",
            "template": "<wm-icon></wm-icon>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-message widget with its properties */
        WidgetPropertiesProvider.register("wm-message", {
            "widgetType": "wm-message",
            "template": "<wm-message></wm-message>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-picture widget with its properties */
        WidgetPropertiesProvider.register("wm-picture", {
            "widgetType": "wm-picture",
            "template": "<wm-picture></wm-picture>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-label widget with its properties */
        WidgetPropertiesProvider.register("wm-progress", {
            "widgetType": "wm-progress",
            "template": "<wm-progress></wm-progress>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-search widget with its properties */
        WidgetPropertiesProvider.register("wm-search", {
            "widgetType": "wm-search",
            "template": "<wm-search></wm-search>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-spinner widget with its properties */
        WidgetPropertiesProvider.register("wm-spinner", {
            "widgetType": "wm-spinner",
            "template": "<wm-spinner show='true'></wm-spinner>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-tree widget with its properties */
        WidgetPropertiesProvider.register("wm-tree", {
            "widgetType": "wm-tree",
            "template": "<wm-tree></wm-tree>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-video widget with its properties */
        WidgetPropertiesProvider.register("wm-video", {
            "widgetType": "wm-video",
            "template": "<wm-video controls='controls' videopreload='none'></wm-video>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });


        /* register the wm-design-dialog widget with its properties */
        WidgetPropertiesProvider.register("wm-design-dialog", {
            "widgetType": "wm-design-dialog",
            "template":
                "<wm-view class='dialog-view'>" +
                    "<wm-dialog dialogtype='design-dialog' modal='true'>" +
                        "<wm-dialogheader></wm-dialogheader>" +
                        "<wm-dialogcontent>" +
                            "<wm-form class='app-dialog-form'>" +
                                "<wm-composite>" +
                                    "<wm-label class='col-md-3' caption='Name'></wm-label>" +
                                    "<wm-text></wm-text>" +
                                "</wm-composite>" +
                            "</wm-form>" +
                        "</wm-dialogcontent>" +
                        "<wm-dialogactions>" +
                            "<wm-button class='btn-secondary' caption='Cancel' on-click='closeDialog()'></wm-button>" +
                            "<wm-button class='btn-primary' caption='Save'></wm-button>" +
                        "</wm-dialogactions>" +
                    "</wm-dialog>" +
                "</wm-view>"
        });

        /* register the wm-dialog widget with its properties */
        WidgetPropertiesProvider.register("wm-dialog", {
            "widgetType": "wm-dialog",
            "template": "<wm-dialog></wm-dialog>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isDroppable": false,
            "parent": "wm-view"
        });

        /* register the wm-dialogheader widget with its properties */
        WidgetPropertiesProvider.register("wm-dialogheader", {
            "widgetType": "wm-dialogheader",
            "template": "<wm-dialogheader></wm-dialogheader>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDeletable": false,
            "canBeCopied": true,
            "isDroppable": false
        });

        /* register the wm-dialogcontent widget with its properties */
        WidgetPropertiesProvider.register("wm-dialogcontent", {
            "widgetType": "wm-dialogcontent",
            "template": "<wm-dialogcontent></wm-dialogcontent>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDeletable": false,
            "canBeCopied": true,
            "isDroppable": true
        });

        /* register the wm-dialogactions widget with its properties */
        WidgetPropertiesProvider.register("wm-dialogactions", {
            "widgetType": "wm-dialogactions",
            "template": "<wm-dialogactions></wm-dialogactions>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDeletable": false,
            "canBeCopied": true,
            "isDroppable": true
        });

        /* register the wm-alertdialog widget with its properties */
        WidgetPropertiesProvider.register("wm-alertdialog", {
            "widgetType": "wm-alertdialog",
            "template": "<wm-view class='dialog-view'><wm-alertdialog></wm-alertdialog></wm-view>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isDroppable": false,
            "parent": "wm-view"
        });

        /* register the wm-confirmdialog widget with its properties */
        WidgetPropertiesProvider.register("wm-confirmdialog", {
            "widgetType": "wm-confirmdialog",
            "template": "<wm-view class='dialog-view'><wm-confirmdialog></wm-confirmdialog></wm-view>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isDroppable": false,
            "parent": "wm-view"
        });

        /* register the wm-iframedialog widget with its properties */
        WidgetPropertiesProvider.register("wm-iframedialog", {
            "widgetType": "wm-iframedialog",
            "template": "<wm-view class='dialog-view'><wm-iframedialog></wm-iframedialog></wm-view>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isDroppable": false,
            "parent": "wm-view"
        });
        /* register the wm-logindialog widget with its properties */
        WidgetPropertiesProvider.register("wm-logindialog", {
            "widgetType": "wm-logindialog",
            "template":
                "<wm-view class='dialog-view'>" +
                    "<wm-logindialog modal='false' iconname='log-in' title='Login'>" +
                        "<wm-dialogheader></wm-dialogheader>" +
                        "<wm-dialogcontent>" +
                            "<wm-form>" +
                                "<wm-message scopedataset='loginMessage' class='app-login-dialog-message'></wm-message>" +
                                "<wm-composite>" +
                                    "<wm-label caption='Username' class='col-md-3'></wm-label>" +
                                    "<wm-container class='col-md-9'><wm-text placeholder='Enter username' class='app-login-dialog-username' name='usernametext' updateon='default'></wm-text></wm-container>" +
                                "</wm-composite>" +
                                "<wm-composite>" +
                                    "<wm-label caption='Password'  class='col-md-3'></wm-label>" +
                                    "<wm-container class='col-md-9'><wm-text type='password' placeholder='Enter password' class='app-login-dialog-password' name='passwordtext' updateon='default'></wm-text></wm-container>" +
                                "</wm-composite>" +
                            "</wm-form>" +
                        "</wm-dialogcontent>" +
                        "<wm-dialogactions>" +
                            "<wm-button class='btn-primary' caption='Sign in'></wm-button>" +
                        "</wm-dialogactions>" +
                    "</wm-logindialog>" +
                "</wm-view>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": false,
            "isDeletable": true,
            "canBeCopied": false,
            "isDroppable": false,
            "parent": "wm-view"
        });

        /* register the wm-pagedialog widget with its properties */
        WidgetPropertiesProvider.register("wm-pagedialog", {
            "widgetType": "wm-pagedialog",
            "template": "<wm-view class='dialog-view'><wm-pagedialog></wm-pagedialog></wm-view>",
            "isContainer": true,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isDroppable": false,
            "parent": "wm-view",
            "isPageContainer": true
        });

        /* register the wm-button widget with its properties */
        WidgetPropertiesProvider.register("wm-button", {
            "widgetType": "wm-button",
            "template": "<wm-button></wm-button>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-buttongroup widget with its properties */
        WidgetPropertiesProvider.register("wm-buttongroup", {
            "widgetType": "wm-buttongroup",
            "template":
                "<wm-buttongroup>" +
                    "<wm-button caption='left'></wm-button>" +
                    "<wm-button caption='center'></wm-button>" +
                    "<wm-button caption='right'></wm-button>" +
                "</wm-buttongroup>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-calendar widget with its properties */
        WidgetPropertiesProvider.register("wm-calendar", {
            "widgetType" : "wm-calendar",
            "template": "<wm-calendar></wm-calendar>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-checkbox widget with its properties */
        WidgetPropertiesProvider.register("wm-checkbox", {
            "widgetType": "wm-checkbox",
            "template": "<wm-checkbox></wm-checkbox>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });
        /* register the wm-checkboxset widget with its properties */
        WidgetPropertiesProvider.register("wm-checkboxset", {
            "widgetType": "wm-checkboxset",
            "template": "<wm-checkboxset></wm-checkboxset>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* Registering the wm-Colorpicker widget with its properties and it's behavior in the studio.*/
        WidgetPropertiesProvider.register("wm-colorpicker", {
            "widgetType": "wm-colorpicker",
            "template": "<wm-colorpicker></wm-colorpicker>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-composite widget with its properties */
        WidgetPropertiesProvider.register("wm-composite", {
            "template": "<wm-composite></wm-composite>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* Register the composite text widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-text", {
            "widgetType": "wm-composite-text",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-text></wm-text>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite currency widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-currency", {
            "widgetType": "wm-composite-currency",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-currency></wm-currency>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite radio widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-radio", {
            "widgetType" : "wm-composite-radio",
            "template":
                "<wm-composite>" +
                    "<wm-radio  caption='Label' class='col-md-push-3'></wm-radio>" +
                "</wm-composite>"
        });

        /* Register the composite radioset widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-radioset", {
            "widgetType" : "wm-composite-radioset",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-radioset height='auto'></wm-radioset>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite checkbox widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-checkbox", {
            "widgetType": "wm-composite-checkbox",
            "template":
                "<wm-composite>" +
                    "<wm-checkbox caption='Label' class='col-md-push-3'></wm-checkbox>" +
                "</wm-composite>"
        });
        /* Register the composite switch widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-switch", {
            "widgetType": "wm-composite-switch",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-switch datavalue='on'></wm-switch>" +
                    "</wm-container>" +
                "</wm-composite>"
        });
        /* Register the composite checkboxset widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-checkboxset", {
            "widgetType": "wm-composite-checkboxset",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-checkboxset height='auto'></wm-checkboxset>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite select widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-select", {
            "widgetType": "wm-composite-select",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-select></wm-select>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        WidgetPropertiesProvider.register("wm-composite-selectlocale", {
            "widgetType": "wm-composite-selectlocale",
            "template": '<wm-select dataset="bind:Variables.supportedLocale.dataSet" on-change="$root.changeLocale($scope)"></wm-select>'
        });

        /* Register the composite date widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-date", {
            "widgetType": "wm-composite-date",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-date></wm-date>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite time widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-time", {
            "widgetType": "wm-composite-time",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-time></wm-time>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite textarea widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-textarea", {
            "widgetType": "wm-composite-textarea",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-textarea></wm-textarea>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite colorpicker widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-colorpicker", {
            "widgetType": "wm-composite-colorpicker",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-colorpicker></wm-colorpicker>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* Register the composite slider widget with its properties */
        WidgetPropertiesProvider.register("wm-composite-slider", {
            "widgetType": "wm-composite-slider",
            "template":
                "<wm-composite>" +
                    "<wm-label class='col-md-3'></wm-label>" +
                    "<wm-container class='col-md-9'>" +
                        "<wm-slider></wm-slider>" +
                    "</wm-container>" +
                "</wm-composite>"
        });

        /* register the wm-currency widget with its properties */
        WidgetPropertiesProvider.register("wm-currency", {
            "widgetType": "wm-currency",
            "template": "<wm-currency></wm-currency>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-date widget with its properties */
        WidgetPropertiesProvider.register("wm-date", {
            "widgetType" : "wm-date",
            "template": "<wm-date></wm-date>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-fileupload widget with its properties */
        WidgetPropertiesProvider.register("wm-fileupload", {
            "widgetType": "wm-fileupload",
            "template": "<wm-fileupload></wm-fileupload>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-menu widget with its properties */
        WidgetPropertiesProvider.register("wm-menu", {
            "widgetType": "wm-menu",
            "template": "<wm-menu caption='Menu'></wm-menu>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-radio widget with its properties */
        WidgetPropertiesProvider.register("wm-radio", {
            "widgetType" : "wm-radio",
            "template": "<wm-radio></wm-radio>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-radioset widget with its properties */
        WidgetPropertiesProvider.register("wm-radioset", {
            "widgetType": "wm-radioset",
            "template": "<wm-radioset></wm-radioset>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-richTextEditor widget with its properties */
        WidgetPropertiesProvider.register("wm-richtexteditor", {
            "widgetType": "wm-richtexteditor",
            "template": "<wm-richtexteditor></wm-richtexteditor>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-select widget with its properties */
        WidgetPropertiesProvider.register("wm-select", {
            "widgetType" : "wm-select",
            "template": "<wm-select></wm-select>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-slider widget with its properties */
        WidgetPropertiesProvider.register("wm-slider", {
            "widgetType": "wm-slider",
            "template": "<wm-slider></wm-slider>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-switch widget with its properties */
        WidgetPropertiesProvider.register("wm-switch", {
            "widgetType": "wm-switch",
            "template": "<wm-switch></wm-switch>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-text widget with its properties */
        WidgetPropertiesProvider.register("wm-text", {
            "widgetType" : "wm-text",
            "template": "<wm-text></wm-text>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-textarea widget with its properties */
        WidgetPropertiesProvider.register("wm-textarea", {
            "widgetType": "wm-textarea",
            "template": "<wm-textarea></wm-textarea>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-time widget with its properties */
        WidgetPropertiesProvider.register("wm-time", {
            "widgetType" : "wm-time",
            "template": "<wm-time></wm-time>",
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-grid widget with its properties */
        WidgetPropertiesProvider.register("wm-grid", {
            "widgetType": "wm-grid",
            "template":
                '<wm-grid readonlygrid="true">' +
                    '<wm-grid-column caption="Column1" pcdisplay="true" mobiledisplay="true"></wm-grid-column>' +
                    '<wm-grid-column caption="Column2" pcdisplay="true" mobiledisplay="true"></wm-grid-column>' +
                    '<wm-grid-column caption="Column3" pcdisplay="true" mobiledisplay="true"></wm-grid-column>' +
                    '<wm-grid-column caption="Column4" pcdisplay="true" mobiledisplay="true"></wm-grid-column>' +
                    '<wm-grid-column caption="Column5" pcdisplay="true" mobiledisplay="true"></wm-grid-column>' +
                '</wm-grid>',
            "isContainer": false,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-livefilter widget with its properties */
        WidgetPropertiesProvider.register("wm-livefilter", {
            "widgetType": "wm-livefilter",
            "template": "<wm-livefilter></wm-livefilter>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false
        });

        /* register the wm-liveform widget with its properties */
        WidgetPropertiesProvider.register("wm-liveform", {
            "widgetType": "wm-liveform",
            "template": "<wm-liveform title='Details'></wm-liveform>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false
        });

        /* register the wm-livegrid widget with its properties */
        WidgetPropertiesProvider.register("wm-livegrid", {
            "widgetType": "wm-livegrid",
            "template":
                '<wm-livegrid>' +
                    '<wm-grid deleterow="true" updaterow="true" insertrow="true" gridfirstrowselect="true" readonlygrid="false"></wm-grid>' +
                    '<wm-liveform novalidate="false" title="Details"></wm-liveform>' +
                '</wm-livegrid>',
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false
        });

        /* register the wm-list widget with its properties */
        WidgetPropertiesProvider.register("wm-listtemplate", {
            "widgetType": "wm-listtemplate",
            "template": "<wm-listtemplate></wm-listtemplate>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": false
        });

        /* register the wm-livelist widget with its properties */
        WidgetPropertiesProvider.register("wm-livelist", {
            "widgetType": "wm-livelist",
            "template": "<wm-livelist listclass='list-group' itemclass='list-group-item'><wm-listtemplate layout='panel'></wm-listtemplate></wm-livelist>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-prefab widget with its properties */
        WidgetPropertiesProvider.register("wm-prefab", {
            "widgetType": "wm-prefab",
            "template": "<wm-prefab></wm-prefab>",
            "isContainer": false,
            "isResizable": true,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false
        });

        /** Add the composite widgets  to the FormWidgets subGroup*/
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "formwidgets",
                "namekey": "LABEL_WIDGETS_FORMWIDGETS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-button",
                        "name": "Button",
                        "namekey": "LABEL_WIDGET_BUTTON",
                        "iconclass": "button",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-buttongroup",
                        "name": "Button Group",
                        "namekey": "LABEL_WIDGET_BUTTON_GROUP",
                        "iconclass": "button-group",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-menu",
                        "name": "Menu",
                        "namekey": "LABEL_WIDGET_MENU",
                        "iconclass": "menu",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-text",
                        "name": "Text",
                        "namekey": "LABEL_WIDGET_TEXT",
                        "iconclass": "text",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-textarea",
                        "name": "Textarea",
                        "namekey": "LABEL_WIDGET_TEXTAREA",
                        "iconclass": "textarea",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-select",
                        "name": "Select",
                        "namekey": "LABEL_WIDGET_SELECT",
                        "iconclass": "select",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-radio",
                        "name": "Radio",
                        "namekey": "LABEL_WIDGET_RADIO",
                        "iconclass": "radio",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-radioset",
                        "name": "Radioset",
                        "namekey": "LABEL_WIDGET_RADIOSET",
                        "iconclass": "radioset",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-checkbox",
                        "name": "Checkbox",
                        "namekey": "LABEL_WIDGET_CHECKBOX",
                        "iconclass": "checkbox",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-switch",
                        "name": "Switch",
                        "namekey": "LABEL_WIDGET_SWITCH",
                        "iconclass": "switch",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-checkboxset",
                        "name": "Checkboxset",
                        "namekey": "LABEL_WIDGET_CHECKBOXSET",
                        "iconclass": "checkboxset",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-date",
                        "name": "Date",
                        "namekey": "LABEL_WIDGET_DATE",
                        "iconclass": "date",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-calendar",
                        "name": "Calendar",
                        "namekey": "LABEL_WIDGET_CALENDAR",
                        "iconclass": "calendar",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-time",
                        "name": "Time",
                        "namekey": "LABEL_WIDGET_TIME",
                        "iconclass": "time",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-currency",
                        "name": "Currency",
                        "namekey": "LABEL_WIDGET_CURRENCY",
                        "iconclass": "currency",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-fileupload",
                        "name": "Fileupload",
                        "namekey": "LABEL_WIDGET_FILEUPLOAD",
                        "iconclass": "fileupload",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-colorpicker",
                        "name": "Colorpicker",
                        "namekey": "LABEL_WIDGET_COLORPICKER",
                        "iconclass": "colorpicker",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-slider",
                        "name": "slider",
                        "namekey": "LABEL_WIDGET_SLIDER",
                        "iconclass": "slider",
                        "isDraggable": true
                    }
                ]
            }
        );


        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "basicwidgets",
                "namekey": "LABEL_WIDGETS_BASICWIDGETS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-label",
                        "name": "Label",
                        "namekey": "LABEL_WIDGET_LABEL",
                        "iconclass": "label",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-anchor",
                        "name": "Anchor",
                        "namekey": "LABEL_WIDGET_ANCHOR",
                        "iconclass": "anchor",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-icon",
                        "name": "Icon",
                        "namekey": "LABEL_WIDGET_ICON",
                        "iconclass": "icon",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-picture",
                        "name": "Picture",
                        "namekey": "LABEL_WIDGET_PICTURE",
                        "iconclass": "picture",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-tree",
                        "name": "Tree",
                        "namekey": "LABEL_WIDGET_TREE",
                        "iconclass": "tree",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-video",
                        "name": "Video",
                        "namekey": "LABEL_WIDGET_VIDEO",
                        "iconclass": "video",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-audio",
                        "name": "Audio",
                        "namekey": "LABEL_WIDGET_AUDIO",
                        "iconclass": "audio",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-html",
                        "name": "html",
                        "namekey": "LABEL_WIDGET_HTML",
                        "iconclass": "html",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-iframe",
                        "name": "iframe",
                        "namekey": "LABEL_WIDGET_IFRAME",
                        "iconclass": "iframe",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-message",
                        "name": "Message",
                        "namekey": "LABEL_WIDGET_MESSAGE",
                        "iconclass": "message",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-spinner",
                        "name": "Spinner",
                        "namekey": "LABEL_WIDGET_SPINNER",
                        "iconclass": "spinner",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-search",
                        "name": "Search",
                        "namekey": "LABEL_WIDGET_SEARCH",
                        "iconclass": "search",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-richtexteditor",
                        "name": "Richtext editor",
                        "namekey": "LABEL_WIDGET_RICHTEXTEDITOR",
                        "iconclass": "richtexteditor",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-datanavigator",
                        "name": "Data Navigator",
                        "namekey": "LABEL_WIDGET_DATANAVIGATOR",
                        "iconclass": "datanavigator",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-progress",
                        "name": "Progress bar",
                        "namekey": "LABEL_WIDGET_PROGRESS",
                        "iconclass": "progress",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-composite-selectlocale",
                        "name": "Select Locale",
                        "namekey": "LABEL_WIDGET_SELECTLOCALE",
                        "iconclass": "selectlocale",
                        "isDraggable": true
                    }
                ]
            }
        );

        /* Add the grid to the grids subGroup. */
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "grids",
                "namekey": "LABEL_WIDGETS_GRIDS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-grid",
                        "name": "Grid",
                        "namekey": "LABEL_WIDGET_GRID",
                        "iconclass": "grid",
                        "isDraggable": true
                    }
                ]
            }
        );

        /* Add the grid to the grids subGroup. */
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "charts",
                "namekey": "LABEL_WIDGETS_CHARTS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-chart-line",
                        "name": "Line",
                        "namekey": "LABEL_WIDGET_LINECHART",
                        "iconclass": "linechart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-column",
                        "name": "Column",
                        "namekey": "LABEL_WIDGET_COLUMNCHART",
                        "iconclass": "columnchart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-area",
                        "name": "Area",
                        "namekey": "LABEL_WIDGET_AREACHART",
                        "iconclass": "areachart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-pie",
                        "name": "Pie",
                        "namekey": "LABEL_WIDGET_PIECHART",
                        "iconclass": "piechart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-bar",
                        "name": "Bar",
                        "namekey": "LABEL_WIDGET_BARCHART",
                        "iconclass": "barchart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-cumulativeline",
                        "name": "Cumulative line",
                        "namekey": "LABEL_WIDGET_CUMULATIVELINECHART",
                        "iconclass": "cumulativelinechart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-donut",
                        "name": "Donut",
                        "namekey": "LABEL_WIDGET_DONUTCHART",
                        "iconclass": "donutchart",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-chart-bubble",
                        "name": "Bubble",
                        "namekey": "LABEL_WIDGET_BUBBLECHART",
                        "iconclass": "bubblechart",
                        "isDraggable": true
                    }
                ]
            }
        );

        /* Add the list to the list subGroup. */
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "livewidgets",
                "namekey": "LABEL_LIVE_WIDGETS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-livelist",
                        "name": "Live List",
                        "namekey": "LABEL_WIDGET_LIVELIST",
                        "iconclass": "livelist",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-liveform",
                        "name": "Live Form",
                        "namekey": "LABEL_WIDGET_LIVEFORM",
                        "iconclass": "liveform",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-livefilter",
                        "name": "Live Filter",
                        "namekey": "LABEL_WIDGET_LIVEFILTER",
                        "iconclass": "livefilter",
                        "isDraggable": true
                    }
                ]
            }
        );

        /* Add the list to the list subGroup. */
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "advancedwidgets",
                "namekey": "LABEL_ADVANCED_WIDGETS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-login",
                        "name": "Login",
                        "namekey": "LABEL_WIDGET_LOGIN",
                        "iconclass": "login",
                        "isDraggable": true
                    }
                ]
            }
        );

        /* Add the dialog to the dialogs subGroup. */
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "dialogs",
                "namekey": "LABEL_WIDGETS_DIALOGS",
                "parent": "widgets",
                "widgets": [
                    {
                        "widgetType": "wm-design-dialog",
                        "name": "Design Dialog",
                        "namekey": "LABEL_WIDGET_DESIGN_DIALOG",
                        "iconclass": "design-dialog",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-alertdialog",
                        "name": "Alert Dialog",
                        "namekey": "LABEL_WIDGET_ALERT_DIALOG",
                        "iconclass": "alert-dialog",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-confirmdialog",
                        "name": "Confirm Dialog",
                        "namekey": "LABEL_WIDGET_CONFIRM_DIALOG",
                        "iconclass": "confirm-dialog",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-iframedialog",
                        "name": "Iframe Dialog",
                        "namekey": "LABEL_WIDGET_IFRAME_DIALOG",
                        "iconclass": "iframe-dialog",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-pagedialog",
                        "name": "Page Dialog",
                        "namekey": "LABEL_WIDGET_PAGE_DIALOG",
                        "iconclass": "page-dialog",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-logindialog",
                        "name": "Login Dialog",
                        "namekey": "LABEL_WIDGET_LOGIN_DIALOG",
                        "iconclass": "login-dialog",
                        "isDraggable": true
                    }
                ]
            }
        );
    });
