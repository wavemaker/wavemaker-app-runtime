/*global WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaContacts', function (DeviceVariableService, $cordovaContacts) {
    "use strict";

    var operations = {
        getContacts : {
            model : [{
                id: '',
                displayName: '',
                phoneNumbers: [{value : ''}]
            }],
            properties : ['startUpdate', 'contactFilter'],
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
            }
        }
    };
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('contacts', key, value);
    });
}]);