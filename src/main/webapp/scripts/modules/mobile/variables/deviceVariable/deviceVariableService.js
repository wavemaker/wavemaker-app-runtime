/*global wm, WM, _*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.DeviceVariableService
 * @requires $rootScope
 * @requires Varibales
 * @requires Utils
 * @requires BaseVariablePropertyFactory
 * @requires CONSTANTS
 * @description
 * The 'DeviceVariableService' provides methods to work with Mobile API.
 */
wm.variables.services.DeviceVariableService = ['$rootScope', 'Variables', 'Utils', 'CONSTANTS',
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
                successCb(_.cloneDeep(operation.model || {}));
            } else {
                errorCb();
            }
        }
        return {
            /**
            * @ngdoc method
            * @name $DeviceVariableService#addOperation
            * @methodOf wm.variables.DeviceVariableService
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
                return _.sortBy(_.keys(availableServices));
            },
            getOperation : function (serviceName, operationName) {
                var operation =  {};
                if (serviceName && operationName) {
                    operation = availableServices[serviceName][operationName] || {};
                }
                return operation;
            },
            initiateCallback : function (eventName, variable, options, eventData) {
                var callBackScope = getCallBackScope(variable, options);
                Variables.initiateCallback(eventName, variable, callBackScope, eventData);
            },
            listAllOperations : function (serviceName) {
                return _.sortBy(_.keys(availableServices[serviceName]));
            },
            listAllProperties : function () {
                var allProperties = [],
                    properties = [];
                WM.forEach(availableServices, function (service) {
                    WM.forEach(service, function (api) {
                        properties = _.map(_.reject(api.properties, {dataBinding: true}), 'target');
                        allProperties.push(properties);
                    });
                });
                return _.chain(allProperties).flatten().uniq().value();
            },
            getFieldType : function (variable, fieldName) {
                var operation =  this.getOperation(variable.service, variable.operation),
                    metaData;
                if (operation.hasOwnProperty('getMeta')) {
                    metaData = operation.getMeta();
                    return metaData && metaData[fieldName] && metaData[fieldName].type;
                }
            },
            invoke : invoke
        };
    }];