/*global wm, WM, _*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.DeviceVariableService
 * @requires $rootScope
 * @requires Variables
 * @requires Utils
 * @requires BaseVariablePropertyFactory
 * @requires CONSTANTS
 * @description
 * The 'DeviceVariableService' provides methods to work with Mobile API.
 */
wm.variables.services.DeviceVariableService = ['$rootScope', '$q', 'Variables', 'Utils', 'CONSTANTS', 'BaseVariablePropertyFactory',
    function ($rootScope, $q, Variables, Utils, CONSTANTS, BaseVariablePropertyFactory) {
        "use strict";
        var availableServices = {},
            propertyGroups = BaseVariablePropertyFactory.getPropertyGroups();
        function addPropertyToGroup(propertyDef) {
            if (propertyDef.group && propertyDef.subGroup) {
                var targetSubGroup = _.find(propertyGroups, {"name": propertyDef.subGroup, "parent": propertyDef.group});
                if (targetSubGroup && _.findIndex(targetSubGroup.properties, propertyDef.target) < 0) {
                    targetSubGroup.properties.push(propertyDef.target);
                }
            }
        }
        function invoke(options, success, error) {
            var variable = this,
                operation = availableServices[this.service][this.operation],
                successCb = function (data) {
                    variable.dataSet = data;
                    Utils.triggerFn(success);
                    Variables.initiateCallback('onSuccess', variable, data);
                },
                errorCb = function () {
                    Utils.triggerFn(error);
                    Variables.initiateCallback('onError', variable);
                };
            if (operation && CONSTANTS.hasCordova) {
                operation.invoke(this, options, successCb, errorCb);
            } else if (operation) {
                successCb(_.cloneDeep(operation.model || {}));
            } else {
                errorCb();
            }
            if (CONSTANTS.isRunMode) {
                $rootScope.$safeApply(variable.activeScope);
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
                availableServices[serviceName] =  (availableServices[serviceName] || {});
                availableServices[serviceName][operationName]  = serviceInfo;
                _.forEach(serviceInfo.properties, addPropertyToGroup);
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
            initiateCallback : function (eventName, variable, eventData) {
                return $q.when(Variables.initiateCallback(eventName, variable, eventData));
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
