/*global WM*/
WM.module('wm.variables').run(['MobileVariableService', '$cordovaBarcodeScanner', function (MobileVariableService, $cordovaBarcodeScanner) {
    "use strict";

    var operations = {
        scanBarCode : {
            model: {
                data : {
                    text : 'BAR CODE',
                    format : "TEXT",
                    cancelled : false
                }
            },
            properties : [],
            invoke: function (variable, options, success, error) {
                $cordovaBarcodeScanner.scan().then(function (data) {
                    success({data : data});
                }, error);
            }
        }
    };
    WM.forEach(operations, function (value, key) {
        MobileVariableService.addOperation('scan', key, value);
    });
}]);