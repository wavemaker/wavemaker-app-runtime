/*global WM*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/containers/mobile/navbar.html',
                '<header data-role="mobile-navbar" init-widget class="app-header app-mobile-navbar {{class}}" data-ng-show="show" apply-styles>' +
                    '<nav class="navbar">' +
                        '<div class="col-xs-4">' +
                            '<ul class="nav navbar-nav navbar-left">' +
                                '<li data-ng-if="leftNavPanel != undefined" >' +
                                    '<a data-ng-click="leftNavPanel.toggle();">' +
                                        '<i data-ng-class="leftnavpaneliconclass"></i>' +
                                    '</a>' +
                                '</li>' +
                                '<li data-ng-if="backbutton">' +
                                    '<a class="btn-back" type="button" data-ng-click="goBack();">' +
                                        '<i data-ng-class="backbuttoniconclass"></i><span>{{backbuttonlabel}}</span>' +
                                    '</a>' +
                                '</li>' +
                            '</ul>' +
                        '</div>' +
                        '<div class="col-xs-4">' +
                            '<div class="navbar-header"><h1 class="navbar-brand">{{title}}</h1></div>' +
                        '</div>' +
                        '<div class="col-xs-4">' +
                            '<ul class="nav navbar-nav navbar-right"><li wmtransclude></li></ul>' +
                        '</div>' +
                    '</nav>' +
                '</header>'
            );
    }]).directive('wmMobileNavbar', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', '$window', 'CONSTANTS', function ($templateCache, PropertiesFactory, WidgetUtilService, $window, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.mobile.navbar', ['wm.layouts']);
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': $templateCache.get('template/layouts/containers/mobile/navbar.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        scope.leftNavPanel = WM.element(element.closest('.app-page').find('.app-left-panel:first')).isolateScope();
                        if (CONSTANTS.isRunMode) {
                            scope.goBack = function () {
                                $window.history.go(-1);
                            };
                        }
                        /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                         * style declarations.*/
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmMobileNavbar
 * @restrict E
 * @element ANY
 * @description
 * The 'wmMobileNavbar' directive defines a dynamic navigation bar for a mobile applicatino.
 * wmNavbar is internally used by wmTopNav.
 *
 * @param {string=} title
 *                  Title to show at the center.
 * @param {string=} name
 *                  Name of the navbar.
 * @param {string=} height
 *                  Height of the navabr.
 * @param {string=} backbutton
 *                  if true, back button will be shown. Default true.
 * @param {string=} backbuttonlabel
 *                  back button label.
 * @param {string=} show
 *                  This property determines whether or not the navbar is visible. This property is a bindable property.
 *
 * @example
 <example>
 <file name="index.html">
 <wm-top-nav>
 <wm-mobile-navbar title="XMobile" fontweight="bold" fontsize="2" fontunit="em" paddingtop="5">
     <wm-button caption="" type="button" iconclass="fa fa-trash-o"></wm-button>
 </wm-mobile-navbar>
 </wm-top-nav>
 </file>
 </example>
 */





