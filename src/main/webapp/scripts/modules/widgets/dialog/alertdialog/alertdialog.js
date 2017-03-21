/*global WM, wmCoreModule, wmDialog, _*/
/*Directive for alert dialog */

WM.module('wm.widgets.dialog')
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/alertdialog.html",
            '<div class="app-dialog modal-dialog app-alert-dialog" ng-class="{type:type}" dialogclass init-widget apply-styles="container">' +
                '<div class="modal-content">' +
                    '<wm-dialogheader closable="{{closable}}" iconclass="{{iconclass}}" iconwidth="{{iconwidth}}" iconheight="{{iconheight}}" iconmargin="{{iconmargin}}" caption="{{title}}"></wm-dialogheader>' +
                    '<div class="app-dialog-body modal-body" apply-styles="scrollable-container">' +
                        '<p class="app-dialog-message text-{{alerttype}}"> {{message}}</p>' +
                    '</div>' +
                    '<div class="app-dialog-footer modal-footer">' +
                        '<wm-button  class="btn-primary"  caption={{oktext}} on-click="okButtonHandler()"></wm-button>' +
                    '</div>' +
                '</div>' +
            '</div>'
            );
    }]).directive('wmAlertdialog', ["$templateCache", "PropertiesFactory", "WidgetUtilService", "CONSTANTS", 'Utils', '$window', 'DeviceService', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, Utils, $window, DeviceService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.alertdialog", ["wm.basicdialog", "wm.base", "wm.dialog.onOk"]),
            notifyFor = {
                'message': true,
                'oktext': true,
                'height': true,
                'width' : true,
                'type': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            switch (key) {
            case "height":
                if (scope.height) {
                    //set the height for the Run Mode
                    if (newVal.indexOf('%') > 0) {
                        scope.bodyHeight = ($window.innerHeight * (parseInt(newVal, 10) / 100) - 112);
                    } else {
                        scope.bodyHeight = parseInt(newVal - 112, 10);
                    }
                }
                break;
            case "message":
                /*handling default values for notification alert dialog in studio*/
                if (attrs.notificationdialog) {
                    scope.message = attrs.message || "Alert Notification Message";
                }
                break;
            case "width":
                if (newVal) {
                    element.closest('.modal-dialog').css('width', newVal);
                }
                break;
            case 'title':
                if (attrs.notificationdialog) {
                    scope.title = attrs.title || "Alert";
                }
                break;
            }
        }

        return {
            "restrict": "E",
            "controller": "DialogController",
            "scope": {
                "dialogid": '@',
                "onOk": '&',
                "onClose": '&'
            },
            "replace": true,
            "template": function (template, attrs) {
                /*if the script tag has not been created already, set inscript to false*/
                if (template.attr('inscript') === undefined) {
                    template.attr('inscript', false);
                }
                /* in run mode, when script tag is not created, create script, else return normal template*/
                if (CONSTANTS.isRunMode && (template.attr('inscript') === "false")) {
                    /*once script tag is created, set inscript attribute to true*/
                    template.attr('inscript', true);
                    var transcludedContent = template[0].outerHTML,
                        id = attrs.name;
                    /*alert dialog is always modal, so setting backdrop to static*/
                    return '<script backdrop="static" type="text/ng-template" id="' + id + '">' + transcludedContent + "</script>";
                }
                return $templateCache.get("template/widget/dialog/alertdialog.html");
            },
            "link": {
                "pre": function (iScope, element, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                    /* for the notification-alert dialogs do not allow the user to edit the properties other than class */
                    if (attrs.widgetid && attrs.notificationdialog) { //widget is in canvas
                        var wp = iScope.widgetProps;
                        _.keys(wp).forEach(function (propName) {
                            if (propName !== 'class') {
                                wp[propName].disabled = true;
                            }
                        });
                    }
                },
                "post": function (scope, element, attrs, dialogCtrl) {
                    var modalWindowElScope = element.closest('[uib-modal-window]').isolateScope(),
                        backButtonListenerDeregister;
                    if (CONSTANTS.isRunMode && element.attr('inscript')) {
                        backButtonListenerDeregister = DeviceService.onBackButtonTap(function () {
                            dialogCtrl._CancelButtonHandler();
                            return false;
                        });
                        scope.$on('$destroy', function () {
                            backButtonListenerDeregister();
                        });
                    }
                    /* handles ok button click*/
                    if (!scope.okButtonHandler) {
                        scope.okButtonHandler = function () {
                            dialogCtrl._OkButtonHandler(attrs.onOk);
                        };
                    }

                    if (modalWindowElScope) {
                        element.closest('[uib-modal-window]').css({
                            'z-index': 1050 + modalWindowElScope.index * 10,
                            'display': 'block'
                        });
                    }

                    /* register the property change handler */
                    if (scope.propertyManager) {
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);
                    }

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmAlertdialog
 * @restrict E
 *
 * @description
 * The `wmAlertdialog` directive defines alert dialog widget. <br>
 * An alert dialog is created in an independent view.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $templateCache
 * @requires CONSTANTS
 *
 * @param {string=} title
 *                  title of the dialog.
 * @param {string=} name
 *                  Name of the dialog.
 * @param {string=} message
 *                  message is a bindable property. <br>
 *                  message to be shown in the dialog.
 * @param {string=} oktext
 *                  oktext is a bindable property. <br>
 *                  Text to be shown in dialog's Ok button.
 * @param {list=} alerttype
 *                  alerttype sets the type for the alert dialog.
 *                  Valid values are /information/error/success/warning.
 * @param {string=} width
 *                  Width of the dialog.
 * @param {string=} height
 *                  Height of the dialog.
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} closable
 *                  closable enables close icon on header also enables close of dialog with ESC key
 * @param {list=} animation
 *                  This property controls the animation of the dialog. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are "bounce", "flash", "pulse", "rubberBand", "shake", etc.
 * @param {string=} iconclass
 *                  Icon sets the icon for dialog header.
 * @param {string=} iconwidth
 *                  Optional, This sets the width of the icon in dialog header.
 * @param {string=} iconheight
 *                  Optional, This sets the height of the icon in dialog header.
 * @param {string=} iconmargin
 *                  Optional, This sets the margin of the icon in dialog header.
 * @param {string=} on-ok
 *                  Callback function which will be triggered when the ok button for the dialog is clicked.
 * @param {string=} on-cancel
 *                  Callback function which will be triggered when the cancel button for the dialog is clicked.
 * @param {string=} on-opened
 *                  Callback function which will be triggered after the dialog is opened.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-view class="dialog-view">
                    <wm-alertdialog name="alertDialog"></wm-alertdialog>
                </wm-view>
                <button ng-click="showDialog()" class="btn-success">Show Dialog</button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope, DialogService) {
                $scope.showDialog = function () {
                    DialogService.open("alertDialog");
                };
            }
            function alertDialogController() {};
        </file>
    </example>
 */