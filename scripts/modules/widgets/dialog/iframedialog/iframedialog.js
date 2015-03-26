/*global WM, wmCoreModule, wmDialog*/
/*Directive for Iframe dialog */

WM.module('wm.widgets.dialog')
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/iframedialog.html",
            '<div class="app-dialog modal-dialog app-iframe-dialog" dialogclass init-widget data-ng-show="show" data-ng-style="{width: dialogWidth}"><div class="modal-content">' +
                '<wm-dialogheader iconclass={{iconclass}}  iconwidth={{iconwidth}} iconheight={{iconheight}} iconmargin={{iconmargin}} caption={{title}}></wm-dialogheader>' +
                '<div class="app-dialog-body modal-body" data-ng-style="{height:bodyHeight}">' +
                    '<wm-iframe iframesrc="{{iframeurl}}" wm-widget-overlay height="100%" width="100%"></wm-iframe>' +
                '</div>' +
                '<div class="app-dialog-footer modal-footer">' +
                    '<wm-button class="btn-primary" caption={{oktext}} on-click="okButtonHandler()"></wm-button>' +
                '</div>' +
            '</div></div>'
            );
    }]).directive('wmIframedialog',["$templateCache", 'PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', '$sce', '$window', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, $sce, $window) {
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
                if(scope.width && CONSTANTS.isRunMode){
                    //update the modal element in the UI for getting shadow and width set
                    element.closest('.modal-dialog').css('width',newVal);
                } else if(CONSTANTS.isStudioMode){
                    scope.dialogWidth = newVal;
                }
                break;
            case "height":
                if (scope.height) {
                    //set the height for the Run Mode
                    if(newVal.indexOf('%') > 0 ){
                        scope.bodyHeight = ($window.innerHeight*(parseInt(newVal)/100) - 112);
                    } else {
                        scope.bodyHeight = parseInt(newVal - 112);
                    }
                }
                break;
            }
        }

        return {
            "restrict": "E",
            "controller": "DialogController",
            "scope": {
                dialogid: '@',
                onOk: '&',
                onClose: '&'
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
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    "post": function (scope, element, attrs, dialogCtrl) {
                        /* handles ok button click*/
                        if (!scope.okButtonHandler) {
                            scope.okButtonHandler = function () {
                                dialogCtrl._OkButtonHandler(attrs.onOk);
                            };
                        }

                        if (CONSTANTS.isStudioMode) {
                            element.addClass('modal-content');
                        }

                        /* register the property change handler */
                        if (scope.propertyManager) {
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
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
 * @param {string=} name
 *                  Name of the dialog.
 * @param {string=} title
 *                  title of the dialog.
 * @param {string=} height
 *                  Height of the dialog.
 * @param {string=} width
 *                  Width of the dialog.
 * @param {string=} oktext
 *                  oktext is a bindable property. <br>
 *                  Text to be shown in dialog's Ok button.
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} url
 *                  url sets the url whose content needs to be shown in the iframe dialog
 * @param {string=} iconclass
 *                  iconclass sets the icon for dialog header
 * @param {string=} on-close
 *                  Callback function which will be triggered when the dialog is closed.
 * @param {string=} on-ok
 *                  Callback function which will be triggered when the ok button for the dialog is clicked.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <wm-view name="view1" class="dialog-view">
 *               <wm-iframedialog name="iframedialog1" url="http://www.wavemaker.com" controller="Ctrl" iconclass="globe" oktext="OK Button" on-ok="onOkCallBack()" on-close="onCloseCallBack()">
 *               </wm-iframedialog>
 *           </wm-view>
 *           <wm-button on-click="iframedialog1.show" caption="show dialog"></wm-button>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.onCloseCallBack = function () {
 *                  console.log("inside close callback");
 *              }
 *              $scope.onOkCallBack = function () {
 *                  console.log("inside ok callback");
 *              }
 *          }
 *       </file>
 *   </example>
 */
