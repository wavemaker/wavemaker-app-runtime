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
                requiredCordovaPlugins: ['CONTACTS'],
                properties : [
                    {"target": "startUpdate", "type": "boolean"},
                    {"target": "autoUpdate", "type": "boolean"},
                    {"target": "contactFilter", "type": "string", "value": "", "dataBinding": true}
                ],
                invoke : function (variable, options, success, error) {
                    var findOptions = {
                            filter : variable.contactFilter,
                            multiple : true,
                            fields:  ['displayName', 'name']
                        };

                    function getName(c) {
                        var name = c.displayName;
                        // In IOS, displayName is undefined, so using the formatted name.
                        if (!name || name === "") {
                            if (c.name.formatted) {
                                return c.name.formatted;
                            }
                        }
                        return name;
                    }

                    $cordovaContacts.find(findOptions).then(function (data) {
                        data = _.filter(data, function (c) {
                            c.displayName = getName(c);
                            return c.phoneNumbers && c.phoneNumbers.length > 0;
                        });
                        success(data);
                    }, error);
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