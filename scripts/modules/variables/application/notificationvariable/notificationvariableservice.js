/*global wm, WM*/
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.$NotificationVariableService
 * @requires Variables
 * @requires $rootScope
 * @requires BaseVariablePropertyFactory
 * @requires CONSTANTS
 * @description
 * The 'NotificationVariableService' provides methods to work with Notification variables
 */

wm.variables.services.NotificationVariableService = function (BaseVariablePropertyFactory, DialogService, $rootScope, wmToaster) {
    "use strict";

    /* properties of a basic variable - should contain methods applicable on this particular object */
    var methods = {
            notify: function (variable, options, success, error) {
                var variableName = variable.name,
                    dialogId = "notification" + variable.operation + "dialog",
                    variableOwner = variable.owner,
                    operation = variable.operation,
                    toasterOptions = (WM.element('[toaster-options]').scope() && WM.element('[toaster-options]').scope().config) || {},
                    scope;


                if (operation === 'toast') {
                    var type = variable.dataBinding.class.toLowerCase(),
                        body = variable.dataBinding.text,
                        timeout = parseInt(variable.dataBinding.duration),
                        positionClass = "toast-" + variable.dataBinding.toasterPosition.replace(" ", "-");
                    toasterOptions.position = positionClass || 'toast-bottom-right';
                    wmToaster.show(type, "", body, timeout);
                } else {
                    /* get the callback scope for the variable based on its owner */
                    if (variableOwner === "Application") {
                        scope = $rootScope || {};
                    } else {
                        scope = options.scope.$$childTail || {};
                    }

                    DialogService.showDialog(dialogId, {
                        resolve: {
                            dialogParams: function () {
                                return {
                                    notificationDetails: {
                                        'text': variable.dataBinding.text,
                                        'okButtonText': variable.dataBinding.okButtonText,
                                        'cancelButtonText': variable.dataBinding.cancelButtonText,
                                        'alerttype': variable.dataBinding.alerttype,
                                        'onOk': variableName + "onOk",
                                        'onCancel': variableName + "onCancel",
                                        'onClose': variableName + "onClose"
                                    },
                                    onOk: function () {
                                        if (variable.onOk.trim()) {
                                            if (WM.isFunction(scope[variableName + "onOk"])) {
                                                scope[variableName + "onOk"](variable, null);
                                            } else {
                                                $rootScope.$emit('invoke-service', variable.onOk, {scope: scope});
                                            }
                                        }
                                        DialogService.hideDialog(dialogId);
                                    },
                                    onCancel: function () {
                                        if (variable.onCancel.trim()) {
                                            if (WM.isFunction(scope[variableName + "onCancel"])) {
                                                scope[variableName + "onCancel"](variable, null);
                                            } else {
                                                $rootScope.$emit('invoke-service', variable.onCancel, {scope: scope});
                                            }
                                        }
                                        DialogService.hideDialog(dialogId);
                                    },
                                    onClose: function () {
                                        if (variable.onClose.trim()) {
                                            if (WM.isFunction(scope[variableName + "onClose"])) {
                                                scope[variableName + "onClose"](variable, null);
                                            } else {
                                                $rootScope.$emit('invoke-service', variable.onClose, {scope: scope});
                                            }
                                        }
                                        DialogService.hideDialog(dialogId);
                                    }
                                };
                            }
                        },
                        scope: scope
                    });
                }
            },
            getOperation: function (variable) {
                return variable.operation;
            },
            getMessage: function (variable) {
                return variable.dataBinding.text;
            },
            setMessage: function (variable, text) {
                if (typeof text === 'string') {
                    variable.dataBinding.text = text;
                }
                return variable.dataBinding.text;
            },
            getOkButtonText: function (variable) {
                return variable.dataBinding.okButtonText;
            },
            setOkButtonText: function (variable, text) {
                if (typeof text === 'string') {
                    variable.dataBinding.okButtonText = text;
                }
                return variable.dataBinding.okButtonText;
            },

            getToasterDuration: function (variable) {
                return variable.dataBinding.duration;
            },
            setToasterDuration: function (variable, duration) {
                variable.dataBinding.duration = duration;
                return variable.dataBinding.duration;
            },
            getToasterClass: function (variable) {
                return variable.dataBinding.class;
            },
            setToasterClass: function (variable, type) {
                if (typeof type === 'string') {
                    variable.dataBinding.class = type;
                }
                return variable.dataBinding.class;
            },
            getToasterPosition: function (variable) {
                return variable.dataBinding.class;
            },
            setToasterPosition: function (variable, position) {
                if (typeof position === 'string') {
                    variable.dataBinding.position = position;
                }
                return variable.dataBinding.position;
            },

            getAlertType: function (variable) {
                return variable.dataBinding.alerttype;
            },
            setAlertType: function (variable, alerttype) {
                if (typeof alerttype === 'string') {
                    variable.dataBinding.alerttype = alerttype;
                }
                return variable.dataBinding.alerttype;
            },

            getCancelButtonText: function (variable) {
                return variable.dataBinding.cancelButtonText;
            },
            setCancelButtonText: function (variable, text) {
                if (typeof text === 'string') {
                    variable.dataBinding.cancelButtonText = text;
                }
                return variable.dataBinding.cancelButtonText;
            }
        },
        basicVariableObj = {
            notify: function () {
                methods.notify(this, {scope: this.activeScope});
            },
            getOperation: function () {
                return methods.getOperation(this, {scope: this.activeScope});
            },
            getMessage: function () {
                return methods.getMessage(this);
            },
            setMessage: function (text) {
                return methods.setMessage(this, text);
            },
            getOkButtonText: function () {
                return methods.getOkButtonText(this);
            },
            setOkButtonText: function (text) {
                return methods.setOkButtonText(this, text);
            },
            getToasterDuration: function () {
                return methods.getToasterDuration(this);
            },
            setToasterDuration: function (duration) {
                return methods.setToasterDuration(this, duration);
            },
            getToasterClass: function () {
                return methods.getToasterClass(this);
            },
            setToasterClass: function (type) {
                return methods.setToasterClass(this, type);
            },
            getToasterPosition: function () {
                return methods.getToasterPosition(this);
            },
            setToasterPosition: function (position) {
                return methods.setToasterPosition(this, position);
            },
            getAlertType: function () {
                return methods.getAlertType(this);
            },
            setAlertType: function (alerttype) {
                return methods.setAlertType(this, alerttype);
            },
            getCancelButtonText: function () {
                return methods.getCancelButtonText(this);
            },
            setCancelButtonText: function (text) {
                return methods.setCancelButtonText(this, text);
            }
        };

    /* register the variable to the base service*/
    BaseVariablePropertyFactory.register('wm.NotificationVariable', basicVariableObj, [], methods);

    return {

    };
};
