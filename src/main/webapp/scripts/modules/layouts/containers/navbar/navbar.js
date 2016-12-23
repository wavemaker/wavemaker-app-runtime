/*global WM*/
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .directive('wmNavbar', ['PropertiesFactory', 'WidgetUtilService', 'Utils', '$timeout', function (PropertiesFactory, WidgetUtilService, Utils, $timeout) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.navbar', ['wm.base']),
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
        //Show without delay along with animation.
        function toggleNavCollapse(element) {
            element.toggleClass('in');
        }
        //Hide after animation with delay
        function delayToggleNavCollapse(element) {
            $timeout(function () {
                toggleNavCollapse(element);
            }, 500);
        }
        //Toggle collapse on toggle button click in mobile-view
        function toggleCollapse(element) {
            element.animate({ 'height': 'toggle'});
            if (element.hasClass('in')) {
                delayToggleNavCollapse(element);
            } else {
                toggleNavCollapse(element);
            }
        }

        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'transclude': true,
            'template'  :
                '<nav class="navbar navbar-default app-navbar" apply-styles="container" data-element-type="wmNavbar" init-widget>' +
                    '<div class="container-fluid">' +
                    /* Brand and toggle get grouped for better mobile display */
                        '<div class="navbar-header"> ' +
                            '<button type="button" class="btn-transparent navbar-toggle collapsed" data-toggle="collapse" ng-click="toggleCollapse()">' +
                                '<span class="sr-only">Toggle navigation</span>' +
                                '<i class="{{menuiconclass}}"></i>' +
                            '</button>' +
                            '<a class="navbar-brand" href="#/" ng-if="title || imagesrc">' +
                                '<img data-identifier="img" class="brand-image" alt="{{title}}" height="20" ng-if="imgsrc" ng-src="{{imagesrc}}"/>' +
                                ' <span class="title">{{title}}</span>' +
                            '</a>' +
                        '</div>' +
                        /* Collect the nav links, forms, and other content for toggling */
                        '<div class="collapse navbar-collapse" id="collapse-content" wmtransclude></div>' +
                    '</div>' +
                '</nav> ',
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },

                'post': function (scope, element, attrs) {
                    var collapseContent = element.children().find('> #collapse-content');
                    /* Register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                    scope.toggleCollapse = toggleCollapse.bind(undefined, collapseContent);
                    /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or style declarations.*/
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-top-nav>
                    <wm-navbar title="Brand">
                        <wm-nav type="navbar" class="navbar-left"></wm-nav>
                        <wm-nav type="navbar" class="navbar-right"></wm-nav>
                    </wm-navbar>
                </wm-top-nav>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
