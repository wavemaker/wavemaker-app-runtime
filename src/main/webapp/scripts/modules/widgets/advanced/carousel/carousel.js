/*global WM, */
/*jslint todo: true */
/*Directive for carousel */
WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/advanced/carousel/carousel.html',
                '<div init-widget class="app-carousel carousel slide" data-ng-show="show" apply-styles>' +
                    '<ol class="carousel-indicators">' +
                        '<li data-ng-repeat="content in contents" data-ng-class="{\'active\': activeIndex === $index}" data-ng-click="goTo($index)"></li>' +
                    '</ol>' +
                    '<div class="carousel-inner" wmtransclude>' +
                    '</div>' +
                    '<a class="left carousel-control" data-ng-click="previous()">' +
                        '<i class="glyphicon glyphicon-chevron-left"></i>' +
                    '</a>' +
                    '<a class="right carousel-control" data-ng-click="next()">' +
                        '<i class="glyphicon glyphicon-chevron-right"></i>' +
                    '</a>' +
                '</div>'
            );
        $templateCache.put('template/widget/advanced/carousel/design/carousel.html',
                 '<div init-widget class="app-carousel carousel slide" data-ng-show="show" apply-styles>' +
                     '<div class="carousel-inner" wmtransclude></div>' +
                     '<div class="carousel-actions">' +
                        '<ul class="pagination" >' +
                            '<li data-ng-repeat="content in contents" data-ng-class="{\'active\': activeIndex === $index}"">' +
                                '<a href="javascript:void(0);" data-ng-click="goTo($index)">{{$index + 1}}</a>' +
                            '</li>' +
                            '<li>' +
                                '<a  href="javascript:void(0);" data-ng-click="add()">' +
                                    '<i class="glyphicon glyphicon-plus"></i>' +
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                     '</div>' +
                 '</div>'
            );
        $templateCache.put('template/widget/advanced/carousel/carousel-content.html',
                             '<div class="app-carousel-item item" apply-styles init-widget wmtransclude></div>');
    }]).directive('wmCarousel', ['$interval', 'PropertiesFactory', '$templateCache', 'CONSTANTS', '$timeout', 'WidgetUtilService', function ($interval, PropertiesFactory, $templateCache, CONSTANTS, $timeout, WidgetUtilService) {
        'use strict';
        /* get the properties related to the carousel */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.carousel', ['wm.base', 'wm.containers']);
        return {
            'restrict' : 'E',
            'scope' : {},
            'transclude': true,
            'template': $templateCache.get('template/widget/advanced/carousel' + (CONSTANTS.isStudioMode ? '/design/' : '/') + 'carousel.html'),
            'replace' : true,
            'controller': function ($scope) {
                this.register = function (contentScope) {
                    /**check for the first index of the slide deck and class active**/
                    if (!$scope.contents.length) {
                        contentScope.getElement().addClass('active');
                    }

                    $scope.contents.push(contentScope);
                    /**In studio mode the last slide is selected after add**/
                    if (CONSTANTS.isStudioMode) {
                        $scope.last();
                    }
                };
                this.unregister = function (contentScope) {
                    var i, len = $scope.contents.length;
                    for (i = 0; i < len; i++) {
                        if ($scope.contents[i].$id === contentScope.$id) {
                            break;
                        }
                    }
                    $scope.contents.splice(i, 1);
                    $scope.goTo($scope.activeIndex);
                };
            },
            'compile' : function () {
                return {
                    'pre': function (scope) {
                        /* save the reference to widgetProps in scope */
                        scope.widgetProps = widgetProps;
                        scope.contents = [];
                        scope.activeIndex = 0;
                        /**Animation function to move the slides**/
                        function animateSlide($active, $next, type) {
                            var direction = type === 'next' ? 'left' : 'right';
                            $next.addClass(type);
                            $next[0].offsetWidth; // force reflow
                            $active.addClass(direction);
                            $next.addClass(direction);
                            $timeout(function () {
                                $next.removeClass([type, direction].join(' ')).addClass('active');
                                $active.removeClass(['active', direction].join(' '));
                            }, 600);
                        }
                        /** function for slide  to move to a specific slide index**/
                        scope.goTo = function (index) {
                            if (!scope.contents[scope.activeIndex]) {
                                return;
                            }
                            var oldElement = scope.contents[scope.activeIndex].getElement(),
                                newElement = scope.contents[index].getElement(),
                                type = 'next';
                            if (CONSTANTS.isStudioMode) {
                                oldElement.removeClass('active');
                                newElement.addClass('active');
                                scope.activeIndex  = index;
                            } else {
                                scope.stop();
                                if (scope.activeIndex > index) {
                                    type = 'prev';
                                }
                                animateSlide(oldElement, newElement, type);
                                scope.activeIndex  = index;
                                scope.play();
                            }
                        };
                        /**function to move to next slide**/
                        scope.next = function () {
                            if (scope.activeIndex > scope.contents.length - 2) {
                                scope.goTo(0);
                            } else {
                                scope.goTo(scope.activeIndex + 1);
                            }
                        };
                        /**function to move to previous slide**/
                        scope.previous = function () {
                            if (scope.activeIndex < 1) {
                                scope.goTo(scope.contents.length - 1);
                            } else {
                                scope.goTo(scope.activeIndex - 1);
                            }
                        };
                        /**function to move to first slide**/
                        scope.first = function () {
                            scope.goTo(0);
                        };
                        /**function to move to last slide**/
                        scope.last = function () {
                            scope.goTo(scope.contents.length - 1);
                        };
                        /**check studio mode and allow add of slides**/
                        if (CONSTANTS.isStudioMode) {
                            scope.add = function () {
                                scope.$root.$emit('canvas-add-widget', {
                                    'parentId': scope.widgetid,
                                    'widgetType': 'wm-carousel-content'
                                });
                            };
                        } else if (CONSTANTS.isRunMode) {
                            /**function to play the slides**/
                            scope.play = function () {
                                if (!scope.autoPlay) {
                                    scope.autoPlay = $interval(function () {
                                        scope.next();
                                    }, scope.animationinterval * 1000);
                                }
                            };
                            /**function to stop the slides**/
                            scope.stop = function () {
                                if (scope.autoPlay) {
                                    $interval.cancel(scope.autoPlay);
                                }
                                scope.autoPlay = undefined;
                            };
                        }
                    },
                    'post': function (scope, element, attrs) {
                        if (CONSTANTS.isRunMode) {
                            /**function to auto start the slide show**/
                            scope.play();
                        }
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]).directive('wmCarouselContent', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', function (PropertiesFactory, $templateCache, WidgetUtilService) {
        'use strict';
        /* Get the properties related to the carousel-content */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.carouselcontent', ['wm.base', 'wm.layouts']);
        return {
            'restrict': 'E',
            'scope': {},
            'transclude': true,
            'template': $templateCache.get('template/widget/advanced/carousel/carousel-content.html'),
            'replace': true,
            'require': '^wmCarousel',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /* save the reference to widgetProps in scope */
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs, controller) {
                        scope.getElement = function () {
                            return element;
                        };
                        scope.$on('$destroy', function () {
                            controller.unregister(scope);
                        });
                        controller.register(scope);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCarousel
 * @restrict E
 *
 * @description
 * The `wmCarousel` directive defines wm-carousel widget.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the carousel.
 * @param {string=} width
 *                  Width of the carousel widget.
 * @param {string=} height
 *                  Height of the carousel widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the carousel on the web page. <br>
 *                  Default value: `true`.
 * @param {number=} animationinterval
 *                  Defines the time interval (in seconds) between two slide transitions.  <br>
 *                  Default value: `3`.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-carousel animationinterval="5" height="100%">
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture5" picturesource="https://farm6.staticflickr.com/5002/5237179864_552d6098f5_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture name="picture6" width="100%" picturesource="https://farm4.staticflickr.com/3024/3103220799_16f3b1db98_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                </wm-carousel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.demo = true;
            }
        </file>
    </example>
 */
/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCarouselContent
 * @restrict E
 *
 * @description
 * The `wmCarouselContent` directive defines wm-carousel-content widget.<br>
 * This widget has to be used with in wm-carousel.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the carousel content.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the carousel on the web page. <br>
 *                  Default value: `true`.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-carousel animationinterval="5" height="100%">
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture5" picturesource="https://farm6.staticflickr.com/5002/5237179864_552d6098f5_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture name="picture6" width="100%" picturesource="https://farm4.staticflickr.com/3024/3103220799_16f3b1db98_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                </wm-carousel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.demo = true;
            }
        </file>
    </example>
 */