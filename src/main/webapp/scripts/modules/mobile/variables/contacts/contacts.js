/*global WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaContacts', function (DeviceVariableService, $cordovaContacts) {
    "use strict";
    var modelMeta = {
        'id' : {
            fieldName : 'id',
            type      : 'integer',
            value     : ''
        },
        'displayName' : {
            fieldName : 'displayName',
            type      : 'string',
            value     : ''
        },
        'phoneNumbers' : {
            fieldName : 'phoneNumbers',
            type      : 'array',
            value     : [{value : ''}]
        }
    },
        event = _.mapValues(modelMeta, 'value'),
        operations = {
            getContacts : {
                model : [event],
                requriedCordovaPlugins: ['CONTACTS'],
                properties : [
                    {"target": "startUpdate", "type": "boolean", "value": ""},
                    {"target": "contactFilter", "type": "string", "value": "", "dataBinding": true}
                ],
                invoke : function (variable, options, success) {
                    var findOptions = {
                            filter : variable.contactFilter,
                            multiple : true,
                            fields:  ['displayName']
                        };
                    $cordovaContacts.find(findOptions).then(function (data) {
                        data = _.filter(data, function (c) {
                            return c.phoneNumbers && c.phoneNumbers.length > 0;
                        });
                        success(data);
                    });
                },
                getMeta : function () {
                    return modelMeta;
                }
            }
        };
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('contacts', key, value);
    });
}]);