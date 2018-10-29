/*global WM, wmCoreModule, wmDialog*/
/*Directive for Iframe dialog */

WM.module('wm.widgets.dialog')
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/iframedialog.html",
            '<div init-widget class="app-view dialog-view clearfix" wm-navigable-element="true">' +
                '<div class="app-dialog modal-dialog app-iframe-dialog" dialogclass>' +
                    '<div class="modal-content">' +
                        '<wm-dialogheader iconclass="{{iconclass}}" iconurl="{{iconurl}}" closable="{{closable}}"  iconwidth="{{iconwidth}}" iconheight="{{iconheight}}" iconmargin="{{iconmargin}}" caption="{{title}}" ng-if="showheader"></wm-dialogheader>' +
                        '<div class="app-dialog-body modal-body" apply-styles="scrollable-container">' +
                            '<wm-iframe encodeurl="{{encodeurl}}" iframesrc="{{iframeurl}}" height="100%" width="100%" hint="{{hint}}"></wm-iframe>' +
                        '</div>' +
                        '<div class="app-dialog-footer modal-footer" ng-if="showactions">' +
                            '<wm-button class="btn-primary ok-action" caption={{oktext}} on-click="okButtonHandler()"></wm-button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
            );
    }])
    .directive('wmIframedialog', ["$templateCache", 'PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', '$sce', '$window', 'Utils', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, $sce, $window, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.iframedialog", ["wm.basicdialog", "wm.base", "wm.dialog.onOk"]),
            notifyFor = {
                'url': true,
                'height': true,
                'width' : true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case "url":
                scope.iframeurl = $sce.trustAsResourceUrl(newVal);
                break;
            case "width":
                if (newVal) {
                    //update the modal element in the UI for getting shadow and width set
                    element.closest('.modal-dialog').css('width', newVal);
                }
                break;
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
                    /*iframe dialog is always modal, so setting backdrop to static*/
                    return '<script backdrop="static" type="text/ng-template" id="' + id + '">' + transcludedContent + "</script>";
                }
                return $templateCache.get("template/widget/dialog/iframedialog.html");
            },
            "link": {
                "pre": function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                "post": function (scope, element, attrs, dialogCtrl) {
                    /* handles ok button click*/
                    if (!scope.okButtonHandler) {
                        scope.okButtonHandler = function () {
                            dialogCtrl._OkButtonHandler(attrs.onOk);
                        };
                    }

                    scope._onCloseCallback = dialogCtrl._CloseButtonHandler.bind(undefined, attrs.onClose, true);

                    /* register the property change handler */
                    if (scope.propertyManager) {
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                    }

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    element.removeClass(scope.class);
                }
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmIframedialog
 * @restrict E
 *
 * @description
 * The `wmIframedialog` directive defines iframe dialog widget. <br>
 * An iframe dialog is created in an independent view.
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
 * @param {string=} oktext
 *                  oktext is a bindable property. <br>
 *                  Text to be shown in dialog's Ok button.
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
 * @param {string=} url
 *                  url sets the url whose content needs to be shown in the iframe dialog
 * @param {list=} animation
 *                  This property controls the animation of the dialog. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are "bounce", "flash", "pulse", "rubberBand", "shake", etc.
 * @param {string=} iconclass
 *                  iconclass sets the icon for dialog header
 * @param {string=} iconwidth
 *                  Optional, This sets the width of the icon in dialog header
 * @param {string=} iconheight
 *                  Optional, This sets the height of the icon in dialog header
 * @param {string=} iconmargin
 *                  Optional, This sets the margin of the icon in dialog header
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
            <div ng-controller="Ctrl">
                    <wm-iframedialog name="iframeDialog" url="//www.wavemaker.com"
                        controller="Ctrl" iconclass="globe" oktext="Close"
                        on-ok="onOkCallBack()">
                    </wm-iframedialog>
                <wm-button on-click="Widgets.iframeDialog.open()" caption="show dialog" class="btn-success"></wm-button>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope, DialogService) {
               $scope.onOkCallBack = function () {
                   console.log("inside ok callback");
                   DialogService.close('iframeDialog');
               }
           }
        </file>
    </example>
 */
