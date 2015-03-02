/*global WM, wmCoreModule, wmDialog*/
/*Directive for page dialog */

WM.module('wm.widgets.dialog')
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/pagedialog.html",
            '<div class="app-dialog app-page-dialog" dialogclass init-widget data-ng-show="show" page-container  data-ng-style="{width: dialogWidth}">' +
                '<wm-dialogheader iconclass={{iconclass}} caption={{title}}  iconwidth={{iconwidth}} iconheight={{iconheight}} iconmargin={{iconmargin}}></wm-dialogheader>' +
                '<div class="app-dialog-body modal-body" data-ng-style="{height:bodyHeight}" page-container-target></div>' +
                '<div class="app-dialog-footer modal-footer">' +
                    '<wm-button  class="btn-primary" caption={{oktext}} on-click="okButtonHandler()"></wm-button>' +
                '</div>' +
            '</div>'
            );
    }]).directive('wmPagedialog', ["$templateCache", "PropertiesFactory", "WidgetUtilService", "CONSTANTS", '$window', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, $window) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.pagedialog", ["wm.basicdialog", "wm.base", "wm.dialog.onOk"]),
            notifyFor = {
                'height': true,
                'width' : true
            };
        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
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
                case "width":
                    if(scope.width && CONSTANTS.isRunMode){
                        //update the modal element in the UI for getting shadow and width set
                        element.closest('.modal-dialog').css('width', newVal);
                    }else if(CONSTANTS.isStudioMode){
                        scope.dialogWidth = newVal;
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
                    /*page dialog is always modal, so setting backdrop to static*/
                    return '<script backdrop="static" type="text/ng-template" id="' + id + '">' + transcludedContent + "</script>";
                }
                return $templateCache.get("template/widget/dialog/pagedialog.html");
            },
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = WM.copy(widgetProps);
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
 * @name wm.widgets.dialog.directive:wmPagedialog
 * @restrict E
 *
 * @description
 * The `wmPagedialog` directive defines page dialog widget. <br>
 * A page dialog is created in an independent view.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $templateCache
 * @requires CONSTANTS
 * @requires $routeParams
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
 *                  Default value:`true`.
 * @param {string=} page
 *                  page sets the page from the project whose content needs to be shown in the page dialog
 * @param {string=} iconname
 *                  iconname sets the icon for dialog header
 * @param {string=} on-close
 *                  Callback function which will be triggered when the dialog is closed.
 * @param {string=} on-ok
 *                  Callback function which will be triggered when the ok button for the dialog is clicked.
 *
 * @example
 *    <example module="wmCore">
 *        <file name="index.html">
 *            <wm-view name="view1" class="dialog-view">
 *                <wm-pagedialog name="pagedialog1" controller="Ctrl" iconname="globe" oktext="OK Button" on-ok="onOkCallBack()" on-close="onCloseCallBack()">
 *                </wm-pagedialog>
 *            </wm-view>
 *            <wm-button on-click="pagedialog1.show" caption="show dialog"></wm-button>
 *        </file>
 *        <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.onCloseCallBack = function () {
 *                  console.log("inside close callback");
 *              }
 *              $scope.onOkCallBack = function () {
 *                  console.log("inside ok callback");
 *              }
 *          }
 *       </file>
 *    </example>
 */