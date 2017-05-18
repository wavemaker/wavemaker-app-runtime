/*global WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaBarcodeScanner', function (DeviceVariableService, $cordovaBarcodeScanner) {
    "use strict";

    var operations = {
        scanBarCode : {
            model: {
                text : 'BAR CODE',
                format : "TEXT",
                cancelled : false
            },
            requiredCordovaPlugins: ['BARCODE_SCANNER'],
            properties : [
                {
                    "target"    : "barcodeFormat",
                    "type"      : "list",
                    "options"   : _.keyBy(["ALL", "QR_CODE", "DATA_MATRIX", "UPC_E", "UPC_A", "EAN_8", "EAN_13", "CODE_128", "CODE_39", "ITF"]),
                    "value"     : "ALL",
                    "group"     : "properties",
                    "subGroup"  : "behavior",
                    "hide"      : false
                }
            ],
            invoke: function (variable, options, success, error) {
                var config;
                if (variable.barcodeFormat && variable.barcodeFormat !== 'ALL') {
                    config = {formats : variable.barcodeFormat};
                }
                $cordovaBarcodeScanner.scan(config).then(function (data) {
                    success(data);
                }, error);
            }
        }
    };
    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('scan', key, value);
    });
}]);