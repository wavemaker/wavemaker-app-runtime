/*global WM, _*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/template.html',
                '<div data-role="template" class="app-template container" init-widget>' +
                    '<header data-role="page-header" class="app-header clearfix" data-ng-if="showheader">' +
                        'header content' +
                    '</header>' +
                    '<section data-role="page-topnav" class="app-top-nav" data-ng-if="showtopnav">' +
                        'topnav content' +
                    '</section>' +
                    '<main  data-role="page-content" class="app-content clearfix">' +
                        '<div class="row app-content-row clearfix">' +
                            '<aside data-role="page-left-panel" class="app-left-panel" data-ng-if="showleftnav">' +
                                '<div class="app-ng-transclude">' +
                                    'left-nav content' +
                                '</div>' +
                            '</aside>' +
                            '<div class="app-page-content app-content-column">' +
                                '<div class="app-ng-transclude" wmtransclude></div>' +
                            '</div>' +
                            '<aside data-role="page-right-panel" class="app-right-panel" data-ng-if="showrightnav">' +
                                '<div class="app-ng-transclude">' +
                                    'right-nav content' +
                                '</div>' +
                            '</aside>' +
                        '</div>' +
                    '</main>' +
                    '<footer data-role="page-footer" class="app-footer clearfix" data-ng-if="showfooter">' +
                        'footer content' +
                    '</footer>' +
                '</div>'
            );
    }])
    .directive('wmTemplate', [
        '$templateCache',
        'PropertiesFactory',
        'WidgetUtilService',

        function ($templateCache, PropertiesFactory, WidgetUtilService) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.template', []);

            return {
                'restrict': 'E',
                'replace': true,
                'transclude': true,
                'scope': {},
                'template': $templateCache.get('template/layouts/template.html'),
                'compile': function () {
                    return {
                        'pre': function (scope) {
                            scope.widgetProps = widgetProps;
                        },
                        'post': function (scope, element, attrs) {
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
                }
            };
        }
    ]);
