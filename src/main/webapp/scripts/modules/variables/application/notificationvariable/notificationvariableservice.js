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

wm.variables.services.NotificationVariableService = function (BaseVariablePropertyFactory, DialogService, $rootScope, wmToaster, Variables) {
    "use strict";

    /* properties of a basic variable - should contain methods applicable on this particular object */
    var methods = {
            notify: function (variable, options, success, error) {
                var variableName = variable.name,
                    dialogId = "notification" + variable.operation + "dialog",
                    commonPageDialogId = 'Common' + _.capitalize(variable.operation) + 'Dialog',
                    variableOwner = variable.owner,
                    operation = variable.operation,
                    toasterOptions = (WM.element('[toaster-options]').scope() && WM.element('[toaster-options]').scope().config) || {},
                    scope,
                    initiateCallback = Variables.initiateCallback;

                //callback function to execute on click of the custom notification element
                function customNotificationOnClick(toasterClass) {
                    if (variable.onClick) {
                        initiateCallback('onClick', variable, scope, options.data);
                    } else {
                        wmToaster.hide(toasterClass);
                    }
                }
                //callback function to execute on hide of the custom notification element
                function customNotificationOnHide() {
                    if (variable.onHide) {
                        initiateCallback('onHide', variable, scope, options.data);
                    }
                }
                if (operation === 'toast') {
                    var type = (options.class || variable.dataBinding.class || "info").toLowerCase(),
                        body = options.message || variable.dataBinding.text,
                        timeout = parseInt(variable.dataBinding.duration),
                        positionClass = "toast-" + (options.position || variable.dataBinding.toasterPosition || 'bottom right').replace(' ', '-'),
                        content = variable.dataBinding.page;
                    toasterOptions.position = positionClass;
                    //check the variable scope and call the callback functions accordingly
                    if (variableOwner === 'Application') {
                        scope = $rootScope || {};
                    } else {
                        scope = options.scope || {};
                    }
                    //check for the older projects not having content property in the variable
                    if (variable.dataBinding.content && variable.dataBinding.content === 'page') {
                        if (content) {
                            wmToaster.createCustomNotification(content, variableName, timeout, positionClass, customNotificationOnClick.bind(undefined, variableName), customNotificationOnHide, scope);
                        }
                    } else {
                        wmToaster.show(type, "", body, timeout, undefined, customNotificationOnClick, customNotificationOnHide);
                    }
                } else {
                /* get the callback scope for the variable based on its owner */
                    if (variableOwner === "Application") {
                        scope = $rootScope || {};
                    } else {
                        scope = options.scope.$$childTail || {};
                    }
                    dialogId = (variableOwner === 'App' && WM.element('[name=' + commonPageDialogId + ']').length) ? commonPageDialogId : dialogId;
                    DialogService.showDialog(dialogId, {
                        resolve: {
                            dialogParams: function () {
                                return {
                                    notificationDetails: {
                                        'title'           : options.title || variable.dataBinding.title,
                                        'text'            : options.message || variable.dataBinding.text,
                                        'okButtonText'    : options.okButtonText || variable.dataBinding.okButtonText,
                                        'cancelButtonText': options.cancelButtonText || variable.dataBinding.cancelButtonText,
                                        'alerttype'       : options.alerttype || variable.dataBinding.alerttype,
                                        'onOk'            : variableName + "onOk",
                                        'onCancel'        : variableName + "onCancel",
                                        'onClose'         : variableName + "onClose"
                                    },
                                    onOk: function () {
                                        initiateCallback('onOk', variable, scope, options.data);
                                        DialogService.hideDialog(dialogId);
                                    },
                                    onCancel: function () {
                                        initiateCallback('onCancel', variable, scope, options.data);
                                        DialogService.hideDialog(dialogId);
                                    },
                                    onClose: function () {
                                        initiateCallback('onClose', variable, scope, options.data);
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
                if (WM.isString(text)) {
                    variable.dataBinding.text = text;
                }
                return variable.dataBinding.text;
            },
            getTitle: function (variable) {
                return variable.dataBinding.title;
            },
            setTitle: function (variable, text) {
                if (WM.isString(text)) {
                    variable.dataBinding.title = text;
                }
                return variable.dataBinding.title;
            },
            getOkButtonText: function (variable) {
                return variable.dataBinding.okButtonText;
            },
            setOkButtonText: function (variable, text) {
                if (WM.isString(text)) {
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
                if (WM.isString(type)) {
                    variable.dataBinding.class = type;
                }
                return variable.dataBinding.class;
            },
            getToasterPosition: function (variable) {
                return variable.dataBinding.class;
            },
            setToasterPosition: function (variable, position) {
                if (WM.isString(position)) {
                    variable.dataBinding.position = position;
                }
                return variable.dataBinding.position;
            },

            getAlertType: function (variable) {
                return variable.dataBinding.alerttype;
            },
            setAlertType: function (variable, alerttype) {
                if (WM.isString(alerttype)) {
                    variable.dataBinding.alerttype = alerttype;
                }
                return variable.dataBinding.alerttype;
            },

            getCancelButtonText: function (variable) {
                return variable.dataBinding.cancelButtonText;
            },
            setCancelButtonText: function (variable, text) {
                if (WM.isString(text)) {
                    variable.dataBinding.cancelButtonText = text;
                }
                return variable.dataBinding.cancelButtonText;
            }
        },
        notify = function (options) {
            options = options || {};
            options.scope = this.activeScope;
            methods.notify(this, options);
        },
        basicVariableObj = {
            notify: notify,
            invoke: notify,
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
