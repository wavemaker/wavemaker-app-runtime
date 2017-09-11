/*global WM, wmDialog*/
/*jslint sub:true*/

/**
 * @ngdoc service
 * @name wm.widgets.dialog.DialogService
 * @description
 * The `DialogService` provides methods for showing and hiding dialogs of a particular id.
 */

/*
 $uibModal injected to open the dialog using $uibModal.open
 $rootScope injected to maintain the default value for scope to be passed $uibModal.open
 */
WM.module('wm.widgets.dialog')
    .service('DialogService', ['$rootScope', '$uibModal', 'CONSTANTS', '$uibModalStack', function ($rootScope, $uibModal, CONSTANTS, $uibModalStack) {
        'use strict';

        /*
         keep track of all the dialog instances that got opened.
         remove from $uibModalInstances when a dialog is closed using hideDialog
         */
        var $uibModalInstances = {},
        /*dialogId is the id of the dialog to be opened
         and params is a key value pair with values for resolve, scope, windowClass that are required as options in $uibModal
         */
            openDialogIds = [];
        //close all the popovers before opening/closing the dialog
        function closePopover() {
            WM.element('.app-popover').remove();
        }
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
            if (!dialogId || ($uibModalInstances && $uibModalInstances[dialogId])) {
                return;
            }
            //remove the popovers in the page to avoid the overlap with dialog
            closePopover();

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
            keyboard = template.attr('closable');
            /* to change original keyboard value(which is string) to boolean because $uibModal.open expects boolean */
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

            dialogContainer.find('wm-dialog, wm-dialog-container, wm-pagedialog-container, wm-alertdialog, wm-confirmdialog, wm-pagedialog, wm-iframedialog, wm-logindialog').
                attr({
                    'controller': controller,
                    'dialogid': dialogId
                });
            content = dialogContainer.html();
            dialogContainer = null;
            /* dialogContainer will be eligible for GC */

            $uibModalInstances[dialogId] = $uibModal.open({
                template: content,
                controller: controller || dialogId + "Controller",
                backdrop: backdrop,
                keyboard: keyboard,
                windowTemplateUrl: "template/widget/dialog/dialog-template.html",
                resolve: params.resolve || null,
                scope: params.scope || (CONSTANTS.isStudioMode ? $rootScope : WM.element("[data-ng-controller='AppController']").scope()),
                windowClass: windowClass || params.windowClass || ""
            });

            $uibModalInstances[dialogId].result.then(null,
                /* called when dialog closes on backdrop click*/
                function () {
                    // destroy the scope of the dialog
                    if ($uibModalInstances[dialogId].scope) {
                        $uibModalInstances[dialogId].scope.$destroy();
                    }
                    $uibModalInstances[dialogId] = null;
                });

            // save a reference to the scope which with dialog got compiled.
            $uibModalInstances[dialogId].opened.then(function () {
                var dialogCtrlScope = $uibModalStack.getTop().value.modalScope,
                    onCloseFn       = params.onClose;

                // onClose function defined in _props (from .open method) will take precedence
                if (params._props) {
                    onCloseFn = params._props.onClose;
                    WM.extend(dialogCtrlScope, params._props);
                }

                $uibModalInstances[dialogId].scope = dialogCtrlScope;

                if (dialogCtrlScope) {
                    if (WM.isFunction(onCloseFn)) {
                        dialogCtrlScope.$on('$destroy', onCloseFn);
                    }
                }

                if (WM.isFunction(params.onOpen)) {
                    params.onOpen($uibModalInstances[dialogId].scope);
                }
            });

            openDialogIds.push(dialogId);
        }


        /* close specific open dialog using dialog ID*/
        function _closeDialog(dialogId) {
            //remove the popovers in the page to avoid the overlap with dialog
            closePopover();
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
            var dialogIs;

            /* id must be provided to close the dialog*/
            if (!dialogId || ($uibModalInstances && !$uibModalInstances[dialogId])) {
                return;
            }
            //remove the popovers in the page to avoid the overlap with dialog
            closePopover();

            if (dialogId) {
                dialogIs = WM.element('[name=' + dialogId + ']').length && WM.element('[name=' + dialogId + ']').isolateScope();

                if (dialogIs && dialogIs._onCloseCallback) {
                    dialogIs._onCloseCallback();
                }
            }

            $uibModalInstances[dialogId].close();
            // destroy the scope of the dialog
            if ($uibModalInstances[dialogId].scope) {
                $uibModalInstances[dialogId].scope.$destroy();
            }
            $uibModalInstances[dialogId] = null;
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
            var dialogId = params.dialogId || "global-confirm-dialog",
                template,
                controller,
                content,
                backdrop,
                keyboard,
                windowClass,
                dialogCaption,
                dialogContainer,
                confirmDialog;

            /* id must be provided to open the dialog*/
            if ($uibModalInstances && $uibModalInstances[dialogId]) {
                return;
            }
            //remove the popovers in the page to avoid the overlap with dialog
            closePopover();
            template = WM.element("script[id=" + dialogId + "]");
            controller = params.controller;
            content = template.html();

            /* convert the content to DOM (uncompiled version) , it will be easy to add attributes*/
            dialogContainer = WM.element("<div></div>").html(content);

            dialogCaption = $rootScope.locale ? $rootScope.locale[params.caption] || params.caption : params.caption;
            backdrop = params.backdrop || template.attr('backdrop');
            /* backdrop expects 3 values from {true, false, static}*/
            if (backdrop !== 'static') {
                if (backdrop === 'false') {
                    /* to change original backdrop value(which is string) to boolean because $uibModal.open expects boolean or 'static' */
                    backdrop = false;
                } else if (backdrop === 'true' || backdrop === 'undefined') {
                    /* to maintain the default value as maintained by bootstrap modal */
                    backdrop = true;
                }
            }
            keyboard = params.closable || template.attr('closable');
            if (keyboard === 'false') {
                /* to change original keyboard value(which is string) to boolean because $uibModal.open expects boolean */
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
            confirmDialog = dialogContainer.find('wm-confirmdialog');
            confirmDialog.
                attr({
                    'controller': controller,
                    'dialogid': dialogId,
                    'title': dialogCaption,
                    'message': $rootScope.locale ? $rootScope.locale[params.content] || params.content : params.content,
                    'messageclass': params.contentClass || '',
                    'iconname': params.iconName || '',
                    'iconclass': params.iconClass || '',
                    'oktext': params.oktext || ($rootScope.locale ? $rootScope.locale["LABEL_OK"] : 'OK'),
                    'canceltext': params.canceltext || ($rootScope.locale ? $rootScope.locale["LABEL_CANCEL"] : 'CANCEL')
                });

            if (params.onOk) {
                confirmDialog.attr('on-ok', params.onOk);
            }
            if (params.onCancel) {
                confirmDialog.attr('on-cancel', params.onCancel);
            }
            if (params.onClose) {
                confirmDialog.attr('on-close', params.onClose);
            }

            if (params.okParams) {
                confirmDialog.attr('ok-params', params.okParams);
            }
            if (params.cancelParams) {
                confirmDialog.attr('cancel-params', params.cancelParams);
            }

            content = dialogContainer.html();
            dialogContainer = null;
            /* dialogContainer will be eligible for GC */

            $uibModalInstances[dialogId] = $uibModal.open({
                template: content,
                controller: controller || dialogId + "Controller",
                backdrop: backdrop,
                keyboard: keyboard,
                resolve: params.resolve || null,
                scope: params.scope || $rootScope,
                windowClass: windowClass || params.windowClass || "",
                windowTemplateUrl: "template/widget/dialog/dialog-template.html"
            });

            $uibModalInstances[dialogId].result.then(null,
                /* called when dialog closes on backdrop click*/
                function () {
                    var dialogScope = $uibModalInstances[dialogId].scope;
                    if (dialogScope.onClose) {
                        dialogScope.onClose();
                    }
                    $uibModalInstances[dialogId] = null;
                });

            // save a reference to the scope which with dialog got compiled.
            $uibModalInstances[dialogId].opened.then(function () {
                $uibModalInstances[dialogId].scope = $uibModalStack.getTop().value.modalScope;
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
            //remove the popovers in the page to avoid the overlap with dialog
            closePopover();
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
            //remove the popovers in the page to avoid the overlap with dialog
            closePopover();
            showDialog(dialogId, obj);
        }

        /**
         * @ngdoc function
         * @name wm.widgets.dialog.DialogService#_showAppConfirmDialog
         * @methodOf wm.widgets.dialog.DialogService
         * @function
         *
         * @description
         * shows Confirm Dialog in app and sets it parameters
         *
         * @param {object} params required for confirm dialog(oktext, canceltext, callbacks, message, icon)
         */
        function _showAppConfirmDialog(params) {
            params = params || {};
            params.controller = 'AppConfirmDialogController';
            params.dialogId   = '_app-confirm-dialog';
            params.onOk       = 'confirmDialogActionOk()';
            params.onCancel   = 'confirmDialogActionCancel()';
            params.oktext     = _.get($rootScope.appLocale, 'LABEL_OK') || 'Ok';
            params.canceltext = _.get($rootScope.appLocale, 'LABEL_CANCEL') || 'Cancel';
            showConfirmDialog(params);
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
        this._showAppConfirmDialog = _showAppConfirmDialog;
        this.closeAllDialogs = closeAllDialogs;
    }])
    .controller('AppConfirmDialogController', ['$scope', 'confirmActionOk', 'confirmActionCancel', 'DialogService', 'Utils', '$timeout', function ($scope, confirmActionOk, confirmActionCancel, DialogService, Utils, $timeout) {
        'use strict';
        $scope.confirmDialogActionOk = function () {
            Utils.triggerFn(confirmActionOk);
            DialogService.close('_app-confirm-dialog');
        };

        $scope.confirmDialogActionCancel = function () {
            DialogService.close('_app-confirm-dialog');
        };

        $scope.$on('$destroy', function () {
            Utils.triggerFn(confirmActionCancel);
        });

        //Fccus the cancel button on open
        $timeout(function () {
            WM.element('.cancel-action').focus();
        });
    }]);