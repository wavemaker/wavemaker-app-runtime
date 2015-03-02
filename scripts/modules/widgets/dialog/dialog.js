/*global WM, wmCoreModule, document, window*/

WM.module('wm.widgets.dialog')
    /* Defining constants for wmDialog widget */
    .constant('LOCAL_CONSTANTS', {
        DEFAULT_DIALOG_HEADER_ICON_SIZE: "21px"
    }).run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/dialog/dialog.html",
            '<div class="app-dialog" init-widget data-ng-show="show" data-ng-style="{width: dialogWidth}" wmtransclude></div>'
            );
        $templateCache.put("template/widget/dialog/dialog-header.html",
            '<div data-ng-show="show" data-identifier="dialog-header" class="app-dialog-header modal-header" init-widget title="{{hint}}">' +
                '<button aria-label="Close" class="app-dialog-close close" data-ng-click="hideDialog()">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
                '<h4 class="app-dialog-title modal-title">' +
                    '<i class="{{iconclass}}" data-ng-style="{width:iconwidth, height:iconheight, margin:iconmargin}"></i>' +
                    '<span>{{caption}}</span>' +
                '</h4>' +
            '</div>'
            );
        $templateCache.put("template/widget/dialog/design.html",
            '<div class="app-dialog-body modal-body" data-ng-style="{height: height}" data-identifier="dialog-content" init-widget wmtransclude></div>'
            );
        $templateCache.put("template/widget/dialog/dialog-footer.html",
            '<div data-ng-show="show" class="app-dialog-footer modal-footer" data-identifier="actions" init-widget wmtransclude></div>'
            );

    }]).directive('wmDialog', ['PropertiesFactory', 'WidgetUtilService', 'DialogService', '$rootScope', "$templateCache", '$compile', 'CONSTANTS', '$window', function (PropertiesFactory, WidgetUtilService, DialogService, $rootScope, $templateCache, $compile, CONSTANTS, $window) {
        'use strict';
        var transcludedContent = "",
            id,
            widgetProps = PropertiesFactory.getPropertiesOf("wm.designdialog", ["wm.basicdialog", "wm.base"]),
            notifyFor = {
                'width': true,
                'height': true,
                'iconname': true,
                'iconwidth': true,
                'iconheight': true,
                'iconmargin': true,
                'iconclass': true,
                'title': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case "height":
                if (scope.content) {
                    //set the height for the Design Mode
                    if (newVal.indexOf('%') > 0) {
                        scope.content[key] = ($window.innerHeight * (window.parseInt(newVal) / 100) - 132);
                    } else {
                        scope.content[key] = window.parseInt(newVal - 122);
                    }
                }
                break;
            case "width":
                if (CONSTANTS.isStudioMode) {
                    scope.dialogWidth = newVal;
                }
                break;
            case "iconwidth":
            case "iconheight":
            case "iconmargin":
            case "iconclass":
                scope.header[key] = newVal;
                break;
            case "title":
                scope.header.caption = newVal;
                break;
            }
        }

        return {
            "restrict": "E",
            "transclude": (CONSTANTS.isStudioMode),
            "controller": function ($scope) {
                this.dialogtype = $scope.dialogtype;
            },
            "scope": {
                "dialogtype": '@',
                "dialogid": '@'
            },
            "template": function (template, attrs) {
                transcludedContent = template.html();
                /*to have script tag with name as id in run mode and to have div in studio to be able to style the dialog*/
                if (CONSTANTS.isRunMode) {
                    /* replacing wm-dialog with wm-dialog-container in run mode to have a container for header, content and footer.
                     wm-dialog-container has a template similar to wm-dialog, replacing since wm-dialog returns script tag*/
                    var dialog = template[0].outerHTML.replace("<wm-dialog ", "<wm-dialog-container ");
                    dialog = dialog.replace("</wm-dialog>", "</wm-dialog-container>");
                    transcludedContent = dialog;
                    id = attrs.name;
                    return '<script type="text/ng-template" id="' + id + '">' + transcludedContent + "</script>";
                }
                return $templateCache.get("template/widget/dialog/dialog.html");
            },
            "replace": true,
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    "post": function (scope, element, attrs) {

                        if (CONSTANTS.isStudioMode) {
                            element.append($compile(transcludedContent)(scope));
                            element.addClass('modal-content');
                        }
                        scope = scope || element.isolateScope();
                        scope.header = element.find('[data-identifier=dialog-header]').isolateScope() || {};
                        scope.content = element.find('[data-identifier=dialog-content]').isolateScope() || {};

                        /* register the property change handler */
                        if (scope.propertyManager) {
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmDialogContainer', ["$templateCache", "PropertiesFactory", "WidgetUtilService", "CONSTANTS", '$window', function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, $window) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.designdialog", ["wm.basicdialog", "wm.base"]),
            notifyFor = {
                'width': true,
                'height': true,
                'iconwidth': true,
                'iconheight': true,
                'iconmargin': true,
                'iconclass': true,
                'title': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case "height":
                if (scope.content) {
                    //set the height for the Run Mode
                    if (newVal.indexOf('%') > 0) {
                        scope.content[key] = ($window.innerHeight * (window.parseInt(newVal) / 100) - 112);
                    } else {
                        scope.content[key] = window.parseInt(newVal - 112);
                    }
                }
                break;
            case "width":
                if (scope.width && CONSTANTS.isRunMode) {
                    //update the modal element in the UI for getting shadow and width set
                    element.closest('.modal-dialog').css('width', newVal);
                }
                break;
            case "iconwidth":
            case "iconheight":
            case "iconmargin":
            case "iconclass":
                scope.header[key] = newVal;
                break;
            case "title":
                scope.header.caption = newVal;
                break;
            }
        }

        return {
            "restrict": "E",
            "transclude": true,
            "controller": function ($scope, $element) {
                this.dialogtype = $scope.dialogtype;
                this.onDialogOk = $scope.onOk;
                this.onDialogCancel = $scope.onCancel;
                this.onDialogClose = $scope.onClose;
                /*making the onclose function available to transclusion scope of wmDialogContainer so that the header can access it */
                $element.scope().onClose = $scope.onClose;
                $element.scope().onOpened = $scope.onOpened;
            },
            "scope": {
                "dialogid": '@',
                "onOk": '&',
                "onClose": '&',
                "onCancel": '&',
                "onOpened": '&'
            },
            "template": $templateCache.get("template/widget/dialog/dialog.html"),
            "replace": true,
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    "post": function (scope, element, attrs) {
                        scope = scope || element.isolateScope();
                        scope.header = element.find('[data-identifier=dialog-header]').isolateScope() || {};
                        scope.content = element.find('[data-identifier=dialog-content]').isolateScope() || {};

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmDialogheader', ["PropertiesFactory", "DialogService", "WidgetUtilService", "LOCAL_CONSTANTS", "$templateCache", "CONSTANTS", function (PropertiesFactory, DialogService, WidgetUtilService, LOCAL_CONSTANTS, $templateCache, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.dialog.dialogheader", ["wm.basicdialog", "wm.base"]),
            notifyFor = {
                'iconclass': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case "iconclass":
                if (scope.iconurl && newVal !== '' && newVal !== '_none_') {
                    scope.iconurl = '';
                    scope.iconwidth = scope.iconheight = LOCAL_CONSTANTS.DEFAULT_DIALOG_HEADER_ICON_SIZE;
                } else if (!scope.iconurl && newVal !== '' && newVal !== '_none_') {
                    scope.iconwidth = scope.iconheight = LOCAL_CONSTANTS.DEFAULT_DIALOG_HEADER_ICON_SIZE;
                } else {
                    scope.iconwidth = scope.iconheight = '';
                }
                break;
            }
        }

        return {
            "restrict": 'E',
            "replace": true,
            "controller": 'DialogController',
            "scope": {},
            "template": $templateCache.get("template/widget/dialog/dialog-header.html"),
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    "post": function (scope, element, attrs, dialogCtrl) {
                        var parentEl,
                            onCloseEventName,
                            onOpenedEventName;

                        parentEl = element.parent();

                        /* accessing the onClose from parent scope*/
                        scope.onClose = scope.$parent.onClose;
                        scope.onOpened = scope.$parent.onOpened;
                        scope.dialogid = parentEl.attr('dialogid');

                        element.scope().dialogid = scope.dialogid;
                        /* getting on-close attr from parent*/
                        onCloseEventName = parentEl.attr("on-close");
                        onOpenedEventName = parentEl.attr("on-opened");

                        scope.hideDialog = function () {
                            if (dialogCtrl) {
                                /*handles close button click*/
                                dialogCtrl._CloseButtonHandler(onCloseEventName);
                            }
                        };
                        if (onOpenedEventName && dialogCtrl && CONSTANTS.isRunMode) {
                            /*handles close button click*/
                            dialogCtrl._OnOpenedHandler(onOpenedEventName);
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmDialogcontent', ["$templateCache", "PropertiesFactory", "WidgetUtilService", function ($templateCache, PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.dialog.dialogcontent", ["wm.base"]);

        return {
            "restrict": 'E',
            "replace": true,
            "require": '?^wmDialog',
            "scope": {},
            "transclude": true,
            "template": $templateCache.get("template/widget/dialog/design.html"),
            "compile": function () {
                return {
                    pre: function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    "post": function (scope, element, attrs) {
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }

        };
    }]).directive('wmDialogactions', ["PropertiesFactory", "WidgetUtilService", "$templateCache", "DialogService", function (PropertiesFactory, WidgetUtilService, $templateCache, DialogService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.dialog.dialogactions", ["wm.base"]);

        return {
            "restrict": 'E',
            "replace": true,
            "transclude": true,
            "scope": {},
            "template": $templateCache.get("template/widget/dialog/dialog-footer.html"),
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    "post": function (iScope, element, attrs) {
                        var scope = element.scope();
                        scope.closeDialog = function () {
                            DialogService.hideDialog(scope.dialogid);
                        };
                        WidgetUtilService.postWidgetCreate(iScope, element, attrs);
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialog
 * @restrict E
 *
 * @description
 * The `wmDialog` directive defines design dialog widget. <br>
 * wmDialog should contain `wmDialogheader`, `wmDialogcontent`, `wmDialogactions` inside it <br>
 * A dialog is created in an independent view.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires DialogService
 * @requires $rootScope
 * @requires $templateCache
 * @requires $compile
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
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value:`true`.
 * @param {boolean=} modal
 *                  True value for Modal property shows up a modal dialog. <br>
 *                  Default value:`true`.
 * @param {string=} iconclass
 *                  iconclass sets the icon for dialog header
 * @param {string=} on-close
 *                  Callback function which will be triggered when the dialog is collapsed.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <wm-view name="view1" class="dialog-view">
 *               <wm-dialog name="dialog1" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
 *                  <wm-dialogheader name="dialogheader1"></wm-dialogheader>
 *                   <wm-dialogcontent name="dialog-content1">
 *                       <wm-form name="form1">
 *                           <wm-composite widget="text" name="composite1">
 *                               <wm-label caption="Name" name="label5"></wm-label>
 *                               <wm-text name="text2"></wm-text>
 *                           </wm-composite>
 *                       </wm-form>
 *                   </wm-dialogcontent>
 *                   <wm-dialogactions name="dialog-actions1" show="true">
 *                      <wm-button on-click="dialog1.hide" caption="hide dialog"></wm-button>
 *                   </wm-dialogactions>
 *               </wm-dialog>
 *           </wm-view>
 *           <wm-button on-click="dialog1.show" caption="show dialog"></wm-button>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.onCloseCallBack = function () {
 *                  console.log("inside close callback");
 *              }
 *          }
 *       </file>
 *   </example>
 */


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogheader
 * @restrict E
 *
 * @description
 * The `wmDialogheader` directive defines dialog header. <br>
 * wmDialogheader can be used only inside wmDialog. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the dialogheader.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <wm-view name="view1" class="dialog-view">
 *               <wm-dialog name="dialog1" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
 *                  <wm-dialogheader name="dialogheader1"></wm-dialogheader>
 *                   <wm-dialogcontent name="dialog-content1">
 *                       <wm-form name="form1">
 *                           <wm-composite widget="text" name="composite1">
 *                               <wm-label caption="Name" name="label5"></wm-label>
 *                               <wm-text name="text2"></wm-text>
 *                           </wm-composite>
 *                       </wm-form>
 *                   </wm-dialogcontent>
 *                   <wm-dialogactions name="dialog-actions1" show="true">
 *                       <wm-button on-click="dialog1.hide" caption="hide dialog"></wm-button>
 *                   </wm-dialogactions>
 *                   </wm-dialog>
 *           </wm-view>
 *           <wm-button on-click="dialog1.show" caption="show dialog"></wm-button>
 *           </file>
 *       <file name="script.js">
 *              function Ctrl($scope) {
 *                  $scope.onCloseCallBack = function () {
 *                      console.log("inside close callback");
 *                  }
 *              }
 *       </file>
 *   </example>
 */


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogcontent
 * @restrict E
 *
 * @description
 * The `wmDialogcontent` directive defines accordion-header widget. <br>
 * wmDialogcontent can be used only inside wmDialog. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $compile
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the dialogcontent.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <wm-view name="view1" class="dialog-view">
 *               <wm-dialog name="dialog1" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
 *                  <wm-dialogheader name="dialogheader1"></wm-dialogheader>
 *                   <wm-dialogcontent name="dialog-content1">
 *                       <wm-form name="form1">
 *                           <wm-composite widget="text" name="composite1">
 *                               <wm-label caption="Name" name="label5"></wm-label>
 *                               <wm-text name="text2"></wm-text>
 *                           </wm-composite>
 *                       </wm-form>
 *                   </wm-dialogcontent>
 *                   <wm-dialogactions name="dialog-actions1" show="true">
 *                      <wm-button on-click="dialog1.hide" caption="hide dialog"></wm-button>
 *                   </wm-dialogactions>
 *               </wm-dialog>
 *           </wm-view>
 *           <wm-button on-click="dialog1.show" caption="show dialog"></wm-button>
 *       </file>
 *       <file name="script.js">
 *              function Ctrl($scope) {
 *                  $scope.onCloseCallBack = function () {
 *                     console.log("inside close callback");
 *                  }
 *              }
 *       </file>
 *   </example>
 */


/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogactions
 * @restrict E
 *
 * @description
 * The `wmDialogactions` directive defines dialogactions widget. <br>
 * wmDialogactions can be used only inside wmDialog.<br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the dialogaction.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <wm-view name="view1" class="dialog-view">
 *               <wm-dialog name="dialog1" show="true" title="demo-dialog" on-close="onCloseCallBack()" controller="Ctrl">
 *                  <wm-dialogheader name="dialogheader1"></wm-dialogheader>
 *                   <wm-dialogcontent name="dialog-content1">
 *                       <wm-form name="form1">
 *                           <wm-composite widget="text" name="composite1">
 *                               <wm-label caption="Name" name="label5"></wm-label>
 *                               <wm-text name="text2"></wm-text>
 *                           </wm-composite>
 *                       </wm-form>
 *                   </wm-dialogcontent>
 *                   <wm-dialogactions name="dialog-actions1" show="true">
 *                       <wm-button on-click="dialog1.hide" caption="hide dialog"></wm-button>
 *                   </wm-dialogactions>
 *               </wm-dialog>
 *           </wm-view>
 *           <wm-button on-click="dialog1.show" caption="show dialog"></wm-button>
 *       </file>*
 *       <file name="script.js">
 *              function Ctrl($scope) {
 *                  $scope.onCloseCallBack = function () {
 *                     console.log("inside close callback");
 *                  }
 *              }
 *       </file>
 *   </example>
 */

/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmDialogContainer
 * @restrict E
 *
 * @description
 * The `wmDialogContainer` directive defines design dialog widget in run mode. <br>
 * It is identical to wmDialog. It is used internally to simluate wmDialog in run mode.
 */
