/*global wm, WM*/
/*jslint todo: true */
/*jslint sub: true */

/* "NotificationDialogController" is the controller for all notification dialogs. */

WM.module('wm.widgets.dialog')
    .controller('NotificationDialogController', ["$scope", "dialogParams", "Utils", function ($scope, dialogParams, Utils) {
        'use strict';
        $scope.notification = {};
        if (dialogParams.notificationDetails) {
            $scope.notification.text             = dialogParams.notificationDetails.text;
            $scope.notification.title            = dialogParams.notificationDetails.title;
            $scope.notification.okButtonText     = dialogParams.notificationDetails.okButtonText || "OK";
            $scope.notification.cancelButtonText = dialogParams.notificationDetails.cancelButtonText || "CANCEL";
            $scope.notification.alerttype        = dialogParams.notificationDetails.alerttype || "information";
        }
        /*called in case an onOk event is associated with the notification variable*/
        $scope.variableOnOk = function () {
            Utils.triggerFn(dialogParams.onOk);
        };
        /*called in case an onClose event is associated with the notification variable*/
        $scope.variableOnClose = function () {
            Utils.triggerFn(dialogParams.onClose);
        };
        /*called in case an onCancel event is associated with the notification variable*/
        $scope.variableOnCancel = function () {
            Utils.triggerFn(dialogParams.onCancel);
        };
    }]);
