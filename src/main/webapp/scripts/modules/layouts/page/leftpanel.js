/*global WM*/

WM.module('wm.layouts.page')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/page/leftpanel.html',
                '<aside data-role="page-left-panel" page-container init-widget class="app-left-panel" ' + $rootScope.getWidgetStyles('container') + ' >' +
                    '<div class="app-ng-transclude" wmtransclude page-container-target></div>' +
                '</aside>'
            );
    }])
    .directive('wmLeftPanel', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.leftpanel', ['wm.layouts', 'wm.base.events.touch']),
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
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/page/leftpanel.html', tElement, tAttrs));

                if (!isWidgetInsideCanvas) {
                    /*** fix for old projects ***/
                    if (!tAttrs.columnwidth) {
                        template.attr('columnwidth', '2');
                    }
                }
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
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
 * @name wm.layouts.page.directive:wmLeftPanel
 * @restrict E
 *
 * @description
 * The 'wmLeftPanel' directive defines a left panel in the layout.
 * wmLeftPanel is internally used by wmContent.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} horizontalalign
 *                  Align the content in the left panel to left/right/center.<br>
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
 *
 * @example
 <example module="wmCore">
     <file name="index.html">
        <wm-left-panel horizontalalign='right' columnWidth='x'></wm-left-panel> where x varies from 1 to 12
     </file>
 </example>
 */

