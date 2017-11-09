/*global WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaBarcodeScanner', function (DeviceVariableService, $cordovaBarcodeScanner) {
    "use strict";

    var barcodeFormatOptions = {
        "ALL" : "ALL",
        "CODABAR" : "CODABAR (not supported in iOS)",
        "CODE_39" : "CODE_39",
        "CODE_93" : "CODE_93 (not supported in iOS)",
        "CODE_128" : "CODE_128",
        "DATA_MATRIX" : "DATA_MATRIX",
        "EAN_8" : "EAN_8",
        "EAN_13" : "EAN_13",
        "ITF" : "ITF",
        "PDF_417" : "PDF_417 (not supported in iOS)",
        "QR_CODE" : "QR_CODE",
        "RSS14" : "RSS14 (not supported in iOS)",
        "RSS_EXPANDED" : "RSS_EXPANDED (not supported in iOS)",
        "UPC_E" : "UPC_E",
        "UPC_A" : "UPC_A"
    },
        operations = {
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
                        "options"   : barcodeFormatOptions,
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