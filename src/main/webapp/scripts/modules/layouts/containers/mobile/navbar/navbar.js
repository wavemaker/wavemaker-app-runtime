/*global WM*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layouts/containers/mobile/navbar.html',
                            '<header init-widget class="app-header app-mobile-navbar {{class}}" data-ng-show="show"' + $rootScope.getWidgetStyles() + '>' +
                                '<div class="app-mobile-navbar-left">' +
                                    '<button type="button" class="btn" data-ng-show="leftNavPanel != undefined" data-ng-click="leftNavPanel.toggle();">'+
                                        '<i data-ng-class="leftnavpaneliconclass"></i>'+
                                    '</button>'+
                                    '<button type="button" class="btn" data-ng-show="backbutton" data-ng-click="goBack();">'+
                                        '<i data-ng-class="backbuttoniconclass"></i>{{backbuttonlabel}}'+
                                    '</button>'+
                                '</div>' +
                                '<h1 class="app-mobile-navbar-title">{{title}}</h1>' +
                                '<div class="app-mobile-navbar-right" wmtransclude>' +
                                '</div>' +
                            '</header>');
    }]).directive('wmMobileNavbar', ['$templateCache', 'PropertiesFactory', 'WidgetUtilService', '$window', function ($templateCache, PropertiesFactory, WidgetUtilService, $window) {
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
                        scope.goBack = function () {
                            $window.history.go(-1);
                        };
                        scope.leftNavPanel = WM.element(element.closest('.app-page').find('.app-left-panel:first')).isolateScope();
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





