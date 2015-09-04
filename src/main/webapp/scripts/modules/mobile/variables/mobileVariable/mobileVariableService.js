/*global wm, WM, _*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.MobileVariableService
 * @requires $rootScope
 * @requires Varibales
 * @requires Utils
 * @requires BaseVariablePropertyFactory
 * @requires CONSTANTS
 * @description
 * The 'MobileVariableService' provides methods to work with Mobile API.
 */
wm.variables.services.MobileVariableService = ['$rootScope', 'Variables', 'Utils', 'CONSTANTS',
    function ($rootScope, Variables, Utils, CONSTANTS) {
        "use strict";
        var initiateCallback = Variables.initiateCallback,
            availableServices = {};

        function getCallBackScope(variable, options) {
            /* get the callback scope for the variable based on its owner */
            if (variable.owner === "App") {
                return $rootScope || {};
            }
            if (variable.prefabName) {
                return options.scope || {};
            }
            return (options && options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
        }

        function invoke(options, success, error) {
            var variable = this,
                operation = availableServices[this.service][this.operation],
                callBackScope = getCallBackScope(variable, options),
                successCb = function (data) {
                    variable.dataSet = data;
                    Utils.triggerFn(success);
                    initiateCallback('onSuccess', variable, callBackScope, data);
                },
                errorCb = function () {
                    Utils.triggerFn(error);
                    initiateCallback('onError', variable, callBackScope);
                };
            if (operation && CONSTANTS.hasCordova) {
                operation.invoke(this, options, successCb, errorCb);
            } else if (operation) {
                successCb(_.cloneDeep(operation.model));
            } else {
                errorCb();
            }
        }
        return {
            /**
            * @ngdoc method
            * @name $MobileVariableService#addOperation
            * @methodOf wm.variables.MobileVariableService
            * @description
            * adds a new operation.
            * @params serviceName Name of the service to which this operation belongs
            * @params operationName Name of the operation
            * @params serviceInfo A Javascript that honors the below structure.
            *   {
            *       // model is used to understand the schema returned on successful invocation  of the variable.
            *       model: {},
            *       // An array of properties that are can be shown to the user.
            *       properties : [],
            *       // A function to be invoked
            *       invoke: function (variable, options, success, error) {}
            *   }
            */
            addOperation : function (serviceName, operationName, serviceInfo) {
                var service = availableServices[serviceName] =  (availableServices[serviceName] || {});
                service[operationName]  = serviceInfo;
            },
            listServices : function () {
                var  allServices = [];
                WM.forEach(availableServices, function (service, name) {
                    allServices[name] = name;
                });
                return allServices;
            },
            getOperation : function (serviceName, operationName) {
                var operation =  {};
                if (serviceName && operationName) {
                    operation = availableServices[serviceName][operationName] || {};
                }
                return operation;
            },
            listAllOperations : function (serviceName) {
                return _.keys(availableServices[serviceName]);
            },
            listAllProperties : function () {
                var allProperties = [];
                WM.forEach(availableServices, function (service) {
                    WM.forEach(service, function (api) {
                        allProperties.push(api.properties);
                    });
                });
                return _.chain(allProperties).flatten().uniq().value();
            },
            invoke : invoke
        };
    }];