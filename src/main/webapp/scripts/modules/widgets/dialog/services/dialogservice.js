/*global WM, wmDialog*/
/*jslint sub:true*/

/**
 * @ngdoc service
 * @name wm.widgets.dialog.DialogService
 * @description
 * The `DialogService` provides methods for showing and hiding dialogs of a particular id.
 */

/*
 $modal injected to open the dialog using $modal.open
 $rootScope injected to maintain the default value for scope to be passed $modal.open
 */
WM.module('wm.widgets.dialog')
    .service('DialogService', ['$rootScope', '$modal', 'CONSTANTS', '$modalStack', function ($rootScope, $modal, CONSTANTS, $modalStack) {
        'use strict';

        /*
         keep track of all the dialog instances that got opened.
         remove from $modalInstances when a dialog is closed using hideDialog
         */
        var $modalInstances = {},
        /*dialogId is the id of the dialog to be opened
         and params is a key value pair with values for resolve, scope, windowClass that are required as options in $modal
         */
            openDialogIds = [];

        /**
         * @deprecated
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#showDialog
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * shows a dialog with a particular id
         * <div class="alert alert-danger">
         * [DEPRECATED] -- Use DialogService.open method instead.
         * </div>
         *
         * @param {string} dialogId id of the dialog to be opened
         * @param {object} params for the dialog
         */
        function showDialog(dialogId, params) {

            /* id must be provided to open the dialog*/
            if (!dialogId || ($modalInstances && $modalInstances[dialogId])) {
                return;
            }
            var template = WM.element("script[id=" + dialogId + "]"),
                controller = template.attr('controller'),
                content = template.html(),
                backdrop,
                keyboard,
                windowClass,

            /* convert the content to DOM (uncompiled version) , it will be easy to add attributes*/
                dialogContainer = WM.element("<div></div>").html(content),
                modal;

            modal = template.attr('modal');
            /*
             Modal : True => Backdrop : Static
             Modal : False => Backdrop : True
             */
            if (modal === 'true') {
                backdrop = 'static';
            } else {
                backdrop = true;
            }
            keyboard = template.attr('keyboard');
            /* to change original keyboard value(which is string) to boolean because $modal.open expects boolean */
            keyboard = keyboard !== 'false';
            /* in case no params are passed, creating an empty object*/
            if (!params) {
                params = {};
            }

            /* to apply the class to modal div added by bootstrap*/
            windowClass = dialogContainer.find("wm-dialog, wm-alertdialog, wm-confirmdialog, wm-pagedialog, wm-iframedialog, wm-logindialog").attr('dialogclass');
            /* to apply dialogclass and theme class (which gets applied to parent view) to modal dialog div*/
            if (!windowClass) {
                windowClass = (dialogContainer.find("wm-dialog-container").attr('dialogclass') || "") + (template.parent().attr("theme") || "") + " default";
            }
            /*
             setting the id and controller values.
             id to be used for closing the dialog by default close button in the dialog and support close if multiple dialogs are opened.
             controller value to be used later.
             */

            dialogContainer.find('wm-dialog, wm-dialog-container, wm-alertdialog, wm-confirmdialog, wm-pagedialog, wm-iframedialog, wm-logindialog').
                attr({
                    'controller': controller,
                    'dialogid': dialogId
                });
            content = dialogContainer.html();
            dialogContainer = null;
            /* dialogContainer will be eligible for GC */

            $modalInstances[dialogId] = $modal.open({
                template: content,
                controller: controller || dialogId + "Controller",
                backdrop: backdrop,
                keyboard: keyboard,
                windowTemplateUrl: "template/widget/dialog/dialog-template.html",
                resolve: params.resolve || null,
                scope: params.scope || (CONSTANTS.isStudioMode ? $rootScope : WM.element("[data-ng-controller='AppController']").scope()),
                windowClass: windowClass || params.windowClass || ""
            });

            $modalInstances[dialogId].result.then(null,
                /* called when dialog closes on backdrop click*/
                function () {
                    // destroy the scope of the dialog
                    if ($modalInstances[dialogId].scope) {
                        $modalInstances[dialogId].scope.$destroy();
                    }
                    $modalInstances[dialogId] = null;
                });

            // save a reference to the scope which with dialog got compiled.
            $modalInstances[dialogId].opened.then(function () {
                var dialogCtrlScope = $modalStack.getTop().value.modalScope;
                if (params._props) {
                    WM.extend(dialogCtrlScope, params._props);
                }
                $modalInstances[dialogId].scope = dialogCtrlScope;

                if (WM.isFunction(params.onOpen)) {
                    params.onOpen($modalInstances[dialogId].scope);
                }
            });

            openDialogIds.push(dialogId);
        }


        /* close specific open dialog using dialog ID*/
        function _closeDialog(dialogId) {
            var dialogRef = openDialogIds.indexOf(dialogId);
            if (dialogRef !== -1) {
                openDialogIds.splice(dialogRef, 1);
            }
        }
        /**
         * @deprecated
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#hideDialog
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * hides a dialog with a particular id
         * <div class="alert alert-danger">
         * [DEPRECATED] -- Use DialogService.close method instead.
         * </div>
         *
         * @param {string} dialogId id of the dialog to be closed
         */
        function hideDialog(dialogId) { /* to close the dialog, hideDialog MUST be used*/

            /* id must be provided to close the dialog*/
            if (!dialogId || ($modalInstances && !$modalInstances[dialogId])) {
                return;
            }
            $modalInstances[dialogId].close();
            // destroy the scope of the dialog
            if ($modalInstances[dialogId].scope) {
                $modalInstances[dialogId].scope.$destroy();
            }
            $modalInstances[dialogId] = null;
            /* to pop the dialog id from the openDialogIds array */
            _closeDialog(dialogId);
        }

        /**
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#showConfirmDialog
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * shows Confirm Dialog and sets it parameters
         *
         * @param {object} params required for confirm dialog(oktext, canceltext, callbacks, message, icon)
         */

        function showConfirmDialog(params) {

            var dialogId = "global-confirm-dialog",
                template,
                controller,
                content,
                backdrop,
                keyboard,
                windowClass,
                dialogCaption,
                dialogContainer;

            /* id must be provided to open the dialog*/
            if ($modalInstances && $modalInstances[dialogId]) {
                return;
            }
            template = WM.element("script[id=" + dialogId + "]");
            controller = params.controller;
            content = template.html();

            /* convert the content to DOM (uncompiled version) , it will be easy to add attributes*/
            dialogContainer = WM.element("<div></div>").html(content);

            dialogCaption = $rootScope.locale[params.caption] || params.caption;
            backdrop = params.backdrop || template.attr('backdrop');
            /* backdrop expects 3 values from {true, false, static}*/
            if (backdrop !== 'static') {
                if (backdrop === 'false') {
                    /* to change original backdrop value(which is string) to boolean because $modal.open expects boolean or 'static' */
                    backdrop = false;
                } else if (backdrop === 'true' || backdrop === 'undefined') {
                    /* to maintain the default value as maintained by bootstrap modal */
                    backdrop = true;
                }
            }
            keyboard = params.keyboard || template.attr('keyboard');
            if (keyboard === 'false') {
                /* to change original keyboard value(which is string) to boolean because $modal.open expects boolean */
                keyboard = false;
            } else if (keyboard === 'true' || keyboard === 'undefined') {
                /* to maintain the default value as maintained by bootstrap modal */
                keyboard = true;
            }
            /* in case no params are passed, creating an empty object*/
            if (!params) {
                params = {};
            }
            /* to apply the class to modal div added by bootstrap*/

            windowClass = dialogContainer.find("wm-confirmdialog").attr('dialogclass');
            /* to apply dialogclass and theme class (which gets applied to parent view) to modal dialog div*/
            if (!windowClass) {
                windowClass = (dialogContainer.find("wm-dialog-container").attr('dialogclass') || "") + (template.parent().attr("theme") || "") + " default";
            }
            /*
             setting the id and controller values.
             id to be used for closing the dialog by default close button in the dialog and support close if multiple dialogs are opened.
             controller value to be used later.
             */

            dialogContainer.find('wm-confirmdialog').
                attr({
                    'controller': controller,
                    'dialogid': dialogId,
                    'title': dialogCaption,
                    'message': $rootScope.locale[params.content] || params.content,
                    'messageclass': params.contentClass || '',
                    'iconname': params.iconName || '',
                    'iconclass': params.iconClass || '',
                    'oktext': params.oktext || $rootScope.locale["LABEL_OK"],
                    'canceltext': params.canceltext || $rootScope.locale["LABEL_CANCEL"]
                });

            if (params.onOk) {
                dialogContainer.find('wm-confirmdialog').attr('on-ok', params.onOk);
            }
            if (params.onCancel) {
                dialogContainer.find('wm-confirmdialog').attr('on-cancel', params.onCancel);
            }
            if (params.onClose) {
                dialogContainer.find('wm-confirmdialog').attr('on-close', params.onClose);
            }

            if (params.okParams) {
                dialogContainer.find('wm-confirmdialog').attr('ok-params', params.okParams);
            }
            if (params.cancelParams) {
                dialogContainer.find('wm-confirmdialog').attr('cancel-params', params.cancelParams);
            }

            content = dialogContainer.html();
            dialogContainer = null;
            /* dialogContainer will be eligible for GC */

            $modalInstances[dialogId] = $modal.open({
                template: content,
                controller: controller || dialogId + "Controller",
                backdrop: backdrop,
                keyboard: keyboard,
                resolve: params.resolve || null,
                scope: params.scope || $rootScope,
                windowClass: windowClass || params.windowClass || "",
                windowTemplateUrl: "template/widget/dialog/dialog-template.html"
            });

            $modalInstances[dialogId].result.then(null,
                /* called when dialog closes on backdrop click*/
                function () {
                    $modalInstances[dialogId] = null;
                });

            // save a reference to the scope which with dialog got compiled.
            $modalInstances[dialogId].opened.then(function () {
                $modalInstances[dialogId].scope = $modalStack.getTop().value.modalScope;
            });
            openDialogIds.push(dialogId);
        }
        /**
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#closeAllDialogs
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * hides all dialogs open at a time
         */
        /* close all opened dialogs */
        function closeAllDialogs() {
            var index;
            for (index = 0; index < openDialogIds.length; index += 1) {
                hideDialog(openDialogIds[index]);
            }
        }

        /**
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#open
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * shows a dialog with a particular id <br>
         * Example:
         * ```js
         *     // controller of the page
         *     function PageController($scope) {
         *          // click event handler for the button on which the dialog needs to be opened.
         *          function btnClickHandler() {
         *              DialogService.open('userDetailsDialog', $scope, {key1: 'value1', key2: 'value2'});
         *          }
         *     }
         *
         *     function DialogController($scope) {
         *          // DialogController's scope extends the scope[2nd argument]
         *          // We will be able to access the properties[3rd argument] on the DialogController's scope.
         *          // console.log($scope.key1) // prints `value1`
         *          // console.log($scope.key2) // prints `value2`
         *     }
         * ```
         *
         * @param {string} dialogId id of the dialog to be opened
         * @param {object} [parentScope] scope with which dialog controller's scope needs to be extended. <br>
         *                 If the scope is not provided, $rootScope is extended.
         * @param {object} [properties] properties that are to be defined on the dialog controller's scope.
         *
         */
        function open(dialogId, parentScope, properties) {
            var obj = {
                'scope': parentScope,
                '_props': properties
            };
            showDialog(dialogId, obj);
        }

        /**
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#close
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * close/hide a dialog with a particular id
         *
         * @param {string} dialogId id of the dialog to be closed
         */

        this.open = open;
        this.close = hideDialog;
        this.hideDialog = hideDialog;
        this.showDialog = showDialog;
        this.showConfirmDialog = showConfirmDialog;
        this.closeAllDialogs = closeAllDialogs;
    }]);