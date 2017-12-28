/*global WM, navigator */
/*Directive for barcode scanner */

WM.module('wm.widgets.advanced')
    .run([
        '$templateCache',

        function ($tc) {
            'use strict';

            $tc.put('template/widget/advanced/barcodeScanner.html',
                '<button type="button" class="btn app-barcode" ng-model="_model_" init-widget has-model apply-styles title="{{hint}}" ng-click="openBarcodeScanner()" >' +
                    '<i class="{{iconclass}}" ng-style="{\'font-size\':iconsize}"></i> ' +
                    '<span class="btn-caption">{{caption}}</span>' +
                '</button>'
                );
        }
    ])
    .directive('wmBarcodescanner', [
        '$templateCache',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$rootScope',
        '$cordovaBarcodeScanner',
        'Utils',

        function ($tc, PropertiesFactory, WidgetUtilService, CONSTANTS, $rs, $cordovaBarcodeScanner, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.barcodescanner', ['wm.base', 'wm.base.advancedformwidgets']);

            function openBarcodeScanner($is) {
                var config;
                if (CONSTANTS.isStudioMode) {
                    return;
                }
                if (CONSTANTS.hasCordova) {
                    if ($is.barcodeformat && $is.barcodeformat !== 'ALL') {
                        config = {
                            'formats' : $is.barcodeformat
                        };
                    }
                    $cordovaBarcodeScanner.scan(config).then(function (data) {
                        $is.datavalue = $is._model_ = data.text;
                        $is.onSuccess({$scope: $is});
                        $rs.$safeApply($is);
                    });
                } else {
                    $is.onSuccess({$scope: $is});
                }
            }
            return {
                'restrict': 'E',
                'replace' : true,
                'scope'   : {onSuccess: '&'},
                'template': $tc.get('template/widget/advanced/barcodeScanner.html'),
                'link'    : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs) {
                        $is.openBarcodeScanner = openBarcodeScanner.bind(undefined, $is);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmBarcodescanner
 * @restrict E
 *
 * @description
 * The `wmBarcodescanner` directive defines the Barcode scanner widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $sce
 *
 * @param {string=} hint
 *                  Title/hint for the barcode scanner. <br>
 *                  This property is bindable.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the camera widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} iconclass
 *                  CSS class of the icon.
 * @param {string=} iconsize
 *                  size of the icon.
 *                  Default value: 3em
 * @param {string=} on-click
 *                  Clicking on the barcodescanner button opens a camera view and automatically scans a barcode, returning the data back.
 * @param {string=} on-success
 *                  Callback function which will be triggered when the widget barcode is successfully scanned.
 */

