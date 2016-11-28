/*global WM, wmCoreModule, wmDialog*/
/*Directive for page dialog */

WM.module('wm.widgets.dialog')
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/pagedialog.html",
            '<div class="app-dialog modal-dialog app-page-dialog" dialogclass init-widget page-container>' +
                '<div class="modal-content">' +
                    '<wm-dialogheader iconclass={{iconclass}} closable="{{closable}}" caption={{title}} iconwidth={{iconwidth}} iconheight={{iconheight}} iconmargin={{iconmargin}}></wm-dialogheader>' +
                    '<div class="app-dialog-body modal-body" apply-styles="scrollable-container" page-container-target wmtransclude></div>' +
                    '<div class="app-dialog-footer modal-footer" ng-if="showactions">' +
                        '<wm-button  class="btn-primary" caption={{oktext}} on-click="okButtonHandler()"></wm-button>' +
                    '</div>' +
                '</div>' +
            '</div>'
            );
    }])
    .directive('wmPagedialog', ["$templateCache", "PropertiesFactory", "WidgetUtilService", "CONSTANTS", 'Utils', '$window', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, Utils, $window) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.pagedialog", ["wm.basicdialog", "wm.base", "wm.dialog.onOk"]),
            notifyFor = {
                'height': true,
                'width' : true
            };
        // Define the property change handler. This function will be triggered when there is a change in the widget property
        function propertyChangeHandler(scope, element, key, newVal) {
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
            case "width":
                if (newVal) {
                    //update the modal element in the UI for getting shadow and width set
                    element.closest('.modal-dialog').css('width', newVal);
                }
                break;
            }
        }
        return {
            "restrict"  : "E",
            "replace"   : true,
            "scope"     : {'dialogid': '@'},
            "transclude": CONSTANTS.isStudioMode,
            "template"  : function (template, attrs) {
                //if the script tag has not been created already, set inscript to false
                if (template.attr('inscript') === undefined) {
                    template.attr('inscript', false);
                }
                // in run mode, when script tag is not created, create script, else return normal template
                if (CONSTANTS.isRunMode && (template.attr('inscript') === "false")) {
                    //once script tag is created, set inscript attribute to true
                    template.attr('inscript', true);
                    var transcludedContent = template[0].outerHTML.replace("<wm-pagedialog ", "<wm-pagedialog-container "),
                        id = attrs.name;
                    transcludedContent = transcludedContent.replace("</<wm-pagedialog>", "</<wm-pagedialog-container>");
                    //page dialog is always modal, so setting backdrop to static
                    return '<script backdrop="static" type="text/ng-template" id="' + id + '">' + transcludedContent + "</script>";
                }
                return $templateCache.get("template/widget/dialog/pagedialog.html");
            },
            "link": {
                "pre": function (iScope) {
                    if (CONSTANTS.isStudioMode) {
                        iScope.widgetProps = Utils.getClonedObject(widgetProps);
                    } else {
                        iScope.widgetProps = widgetProps;
                    }
                },
                "post": function (scope, element, attrs, dialogCtrl) {
                    // handles ok button click
                    if (!scope.okButtonHandler) {
                        scope.okButtonHandler = function () {
                            dialogCtrl._OkButtonHandler(attrs.onOk);
                        };
                    }
                    // register the property change handler
                    if (scope.propertyManager) {
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                    }
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]).directive('wmPagedialogContainer', ["$templateCache", "PropertiesFactory", "WidgetUtilService", "CONSTANTS", 'Utils', '$window', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, Utils, $window) {
    'use strict';
    var widgetProps = PropertiesFactory.getPropertiesOf("wm.pagedialog", ["wm.basicdialog", "wm.base", "wm.dialog.onOk"]),
        notifyFor = {
            'height': true,
            'width' : true
        };
    // Define the property change handler. This function will be triggered when there is a change in the widget property
    function propertyChangeHandler(scope, element, key, newVal) {
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
        case "width":
            if (newVal) {
                //update the modal element in the UI for getting shadow and width set
                element.closest('.modal-dialog').css('width', newVal);
            }
            break;
        }
    }
    return {
        "restrict"  : "E",
        "transclude": true,
        "controller": "DialogController",
        "scope"     : {
            dialogid: '@',
            onOk    : '&',
            onClose : '&'
        },
        "replace"   : true,
        "template"  : $templateCache.get("template/widget/dialog/pagedialog.html"),
        "link"      : {
            "pre": function (iScope) {
                if (CONSTANTS.isStudioMode) {
                    iScope.widgetProps = Utils.getClonedObject(widgetProps);
                } else {
                    iScope.widgetProps = widgetProps;
                }
            },
            "post": function (scope, element, attrs, dialogCtrl) {
                // handles ok button click
                if (!scope.okButtonHandler) {
                    scope.okButtonHandler = function () {
                        dialogCtrl._OkButtonHandler(attrs.onOk);
                    };
                }
                // register the property change handler
                if (scope.propertyManager) {
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                }
                WidgetUtilService.postWidgetCreate(scope, element, attrs);
            }
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
 *                  Default value:`true`.
 * @param {string=} page
 *                  page sets the page from the project whose content needs to be shown in the page dialog.
 * @param {list=} content
 *                  This property will be include any other page/partial in this widget.
 *                  Possible values are 'login', 'header', 'footer', etc.
 * @param {list=} animation
 *                  This property controls the animation of the dialog. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are "bounce", "flash", "pulse", "rubberBand", "shake", etc.
 * @param {string=} iconclass
 *                  iconclass sets the icon for dialog header.
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
            <div ng-controller="Ctrl">
                <wm-view class="dialog-view">
                    <wm-pagedialog name="pageDialog" controller="Ctrl" iconclass="wi wi-globe"
                        content="dropdownMenu"
                        oktext="OK" on-ok="onOkCallBack()" on-close="onCloseCallBack()">
                    </wm-pagedialog>
                </wm-view>
                <wm-button on-click="pageDialog.show" caption="show dialog"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope, DialogService) {
                $scope.onCloseCallBack = function () {
                    console.log("inside close callback");
                    DialogService.close('pageDialog');
                }
                $scope.onOkCallBack = function () {
                    console.log("inside ok callback");
                    DialogService.close('pageDialog');
                }
                $scope.onOpenedCallBack = function () {
                    console.log("inside opened callback");
                }
            }
        </file>
    </example>
 */