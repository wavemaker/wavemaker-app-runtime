/*global WM*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .directive('wmNavbar', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', 'Utils', function (PropertiesFactory, WidgetUtilService, $rootScope, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.navbar', ['wm.layouts']),
            notifyFor = {
                'imgsrc': true
            };
        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'imgsrc':
                scope.imagesrc = Utils.getImageUrl(newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template':
                '<nav class="navbar navbar-default app-navbar" data-ng-show="show" ' + $rootScope.getWidgetStyles('container') + 'data-element-type="wmNavbar"  init-widget has-model >' +
                    '<div class="container-fluid">' +
                    /* Brand and toggle get grouped for better mobile display */
                        '<div class="navbar-header"> ' +
                            '<button type="button" class="btn-transparent navbar-toggle collapsed" data-toggle="collapse" data-target="collapse-content" ng-click="navbarCollapsed = !navbarCollapsed">' +
                                '<span class="sr-only">Toggle navigation</span>' +
                                '<i class="glyphicon glyphicon-option-vertical"></i>' +
                            '</button>' +
                            '<a class="navbar-brand" href="#" data-ng-if="title || imagesrc">' +
                                '<img data-identifier="img" class="brand-image" alt="{{title}}" width="20" height="20" data-ng-if="imgsrc" data-ng-src="{{imagesrc}}"/>' +
                                    '{{title}}' +
                            '</a>' +
                        '</div>' +
                        /* Collect the nav links, forms, and other content for toggling */
                        '<div class="collapse navbar-collapse" id="collapse-content" wmtransclude ng-init="navbarCollapsed = true" collapse="navbarCollapsed">' +
                        '</div>' +
                    '</div>' +
                '</nav> ',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },

                    'post': function (scope, element, attrs) {

                        /* Register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
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
 * @name wm.layouts.containers.directive:wmNavbar
 * @restrict E
 * @element ANY
 * @description
 * The 'wmNavbar' directive defines a dynamic navigation bar in the layout.
 * wmNavbar is internally used by wmTopNav.
 *
 * @param {string=} title
 *                  Title of the navabr. This property is a bindable property.
 * @param {string=} name
 *                  Name of the navbar.
 * @param {string=} height
 *                  Height of the navabr.
 * @param {string=} imagesource
 *                  This property sets the image source for the navbar. This property is a bindable property.
 * @param {string=} show
 *                  This property determines whether or not the navbar is visible. This property is a bindable property.
 * @param {boolean=} horizontalalign
 *                  This property aligns the content of the navbar to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
 <example>
 <file name="index.html">
 <wm-top-nav>
 <wm-navbar>
     <wm-nav></wm-nav>
     <wm-nav></wm-nav>
 </wm-navbar>
 </wm-top-nav>
 </file>
 </example>
 */





