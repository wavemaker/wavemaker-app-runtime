/*global WM, wmDialog*/
/*jslint todo: true */
/*jslint sub: true */

/* "DialogController" is the controller to handle onOk, onCancel, onClose events for all Dialogs. */

WM.module('wm.widgets.dialog')
    .controller('DialogController', function ($scope, DialogService, Utils, $rootScope, CONSTANTS) {
        "use strict";
        /* handles all types of events for dialog*/
        var handleEvent = function (eventName, hideDialog, callBack, callbackParams) {
            /* if the name is a function, execute the call back
             * if name is a dialog hide/show option, call the dialog hide show method accordingly
             * else invoke the service and finally close the current dialog*/
            if (eventName && eventName.indexOf("(") !== -1) {
                Utils.triggerFn(callBack, callbackParams);
                return;
            }

            // Studio Dialogs without individual templates do not have a "(" in the eventName. callBack() will return a reference to the actual callback.
            if (callBack) {
                if (CONSTANTS.isStudioMode) {
                    if (WM.isFunction(callBack())) {
                        Utils.triggerFn(callBack(), callbackParams);
                    }
                } else {
                    if (WM.isFunction(callBack)) {
                        Utils.triggerFn(callBack, callbackParams);
                    }
                }

            } else if (eventName.indexOf('.show') > -1) {
                DialogService.showDialog(eventName.slice(0, eventName.indexOf('.show')));
            } else if (eventName.indexOf('.hide') > -1) {
                DialogService.hideDialog(eventName.slice(0, eventName.indexOf('.hide')));
            } else {
                if (eventName.trim()) {
                    $rootScope.$emit('invoke-service', eventName);
                }
            }
            if (hideDialog) {
                DialogService.hideDialog($scope.dialogid);
            }
        };
        this._OkButtonHandler = function (eventName) {
            var eventParams;
            /*If "okParams" is a JSON string, then parse it. Else, pass it as is.*/
            if ($scope.okParams && $scope.okParams.indexOf("{") > -1) {
                eventParams = Utils.getValidJSON($scope.okParams);
            } else {
                eventParams = $scope.okParams;
            }
            eventName = eventName || '';
            /* handles all types of events*/
            handleEvent(eventName, true, $scope.onOk, eventParams);
        };
        this._CancelButtonHandler = function (eventName) {
            var eventParams;
            /*If "cancelParams" is a JSON string, then parse it. Else, pass it as is.*/
            if ($scope.cancelParams && $scope.cancelParams.indexOf("{") > -1) {
                eventParams = Utils.getValidJSON($scope.cancelParams);
            } else {
                eventParams = $scope.cancelParams;
            }
            eventName = eventName || '';
            /* handles all types of events*/
            handleEvent(eventName, true, $scope.onCancel, eventParams);
        };
        this._CloseButtonHandler = function (eventName) {
            eventName = eventName || '';
            /* handles all types of events*/
            handleEvent(eventName, true,  $scope.onClose);
        };
        this._OnOpenedHandler = function (eventName) {
            eventName = eventName || '';
            /* handles all types of events*/
            handleEvent(eventName, false, $scope.onOpened);
        };
    });