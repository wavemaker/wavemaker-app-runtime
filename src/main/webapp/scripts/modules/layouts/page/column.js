/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/page/column.html',
                '<div init-widget class="app-column" apply-styles="container"><div class="app-ng-transclude" wmtransclude></div></div>'
            );
    }])
    .directive('wmColumn', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.column', ['wm.layouts', 'wm.base.events.touch']),
            notifyFor = {
                'columnwidth': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal, oldVal) {
            switch (key) {
            case 'columnwidth':
                /*If columnwidth is passed set the appropriate class*/
                element.removeClass('col-md-' + oldVal + ' col-sm-' + oldVal).addClass('col-md-' + newVal + ' col-sm-' + newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            /* horizontalalign also bound to textAlign for similar function. horizontalalign overrides textalign */
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/page/column.html'),
            'compile': function () {
                return {
                    'pre': function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },

                    'post': function (scope, element, attrs) {
                        /*If columnwidth is passed set the appropriate class*/

                        if (scope.columnwidth) {
                            WM.element(element).addClass('col-md-' + scope.columnwidth + ' col-sm-' + scope.columnwidth);
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.page.directive:wmColumn
 * @restrict E
 *
 * @description
 * The 'wmColumn' directive defines a column in the layout.
 * wmColumn is internally used by wmRow.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} columnWidth Sets the width of the column, it varies between 1 and 12.<br>
 *                  columnWidth is restricted to a range, to suit bootstrap fluid grid system
 * @param {string=} horizontalalign
 *                  Align the content in the right panel to left/right/center.<br>
 *                  Default value for horizontalalign is `left`.
 * @param {string=} on-swipeup
 *                  Callback function for `swipeup` event.
 * @param {string=} on-swipedown
 *                  Callback function for `swipedown` event.
 * @param {string=} on-swiperight
 *                  Callback function for `swiperight` event.
 * @param {string=} on-swipeleft
 *                  Callback function for `swipeleft` event.
 * @param {string=} on-pinchin
 *                  Callback function for `pinchin` event.
 * @param {string=} on-pinchdown
 *                  Callback function for `pinchdown` event.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <div style="padding:10px">
                    <input type="number" min="1" max="12" step="1" data-ng-model="colWidth" style="width: 100px; height: 35px;padding-left:10px;font-size:1.2em">
                    <div style="margin-top:10px">
                        <wm-column columnwidth="{{colWidth}}" style="background-color:teal; height: 100px"></wm-column>
                    </div>
                </div>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.colWidth = 6;
            }
        </file>
    </example>
 */
