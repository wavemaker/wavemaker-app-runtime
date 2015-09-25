/*global WM*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaBarcodeScanner', function (DeviceVariableService, $cordovaBarcodeScanner) {
    "use strict";

    var operations = {
        scanBarCode : {
            model: {
                text : 'BAR CODE',
                format : "TEXT",
                cancelled : false
            },
            properties : [],
            invoke: function (variable, options, success, error) {
                $cordovaBarcodeScanner.scan().then(function (data) {
                    success(data);
                }, error);
            }
        }
    };
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('scan', key, value);
    });
}]);