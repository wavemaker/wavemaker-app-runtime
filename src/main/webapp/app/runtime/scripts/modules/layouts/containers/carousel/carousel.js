/*global WM, */
/*jslint todo: true */
/*Directive for crousel */
WM.module('wm.layouts.containers')
    .run(['$rootScope', '$templateCache', function ($rootScope, $templateCache){
         'use strict';
         $templateCache.put('template/layout/container/carousel/carousel.html',
                            '<div init-widget class="app-carousel carousel slide" data-ng-show="show" ' + $rootScope.getWidgetStyles() + ' >'+
                                '<ol class="carousel-indicators">'+
                                    '<li data-ng-repeat="content in contents" data-ng-class="{\'active\': selectedContent === $index}" data-ng-click="goTo($index)"></li>'+
                                '</ol>'+
                                '<div class="carousel-inner" wmtransclude>'+
                                '</div>'+
                                '<a class="left carousel-control" data-ng-click="previous()">'+
                                    '<i class="glyphicon glyphicon-chevron-left"></i>'+
                                '</a>'+
                                '<a class="right carousel-control" data-ng-click="next()">'+
                                    '<i class="glyphicon glyphicon-chevron-right"></i>'+
                                '</a>'+
                            '</div>');
         $templateCache.put('template/layout/container/carousel/design/carousel.html',
                             '<div init-widget class="app-carousel carousel slide" data-ng-show="show" ' + $rootScope.getWidgetStyles() + ' >'+
                                 '<div class="carousel-inner" wmtransclude></div>'+
                                 '<div class="carousel-actions">'+
                                    '<ul class="pagination" >'+
                                        '<li data-ng-repeat="content in contents" data-ng-class="{\'active\': selectedContent === $index}"">'+
                                            '<a href="javascript:void(0);" data-ng-click="goTo($index)">{{$index + 1}}</a>'+
                                        '</li>'+
                                        '<li>'+
                                            '<a  href="javascript:void(0);" data-ng-click="add()">'+
                                                '<i class="glyphicon glyphicon-plus"></i>'+
                                            '</a>'+
                                        '</li>'+
                                    '</ul>'+
                                 '</div>'+
                             '</div>');
         $templateCache.put('template/layout/container/carousel/carousel-content.html',
                             '<div class="app-carousel-item item " data-ng-class="transition"' +
                                $rootScope.getWidgetStyles() +
                                ' init-widget wmtransclude>'+
                             '</div>');
    }]).directive('wmCarousel', ['$interval', 'PropertiesFactory', '$templateCache', 'CONSTANTS', function ($interval, PropertiesFactory, $templateCache, CONSTANTS) {
        'use strict';
        /* get the properties related to the carousel */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.carousel', ['wm.base', 'wm.containers']);
        return {
            'restrict' : 'E',
            'scope' : {},
            'transclude': true,
            'template': $templateCache.get('template/layout/container/carousel'+(CONSTANTS.isStudioMode ? '/design/' : '/')+'carousel.html'),
            'replace' : true,
            'controller': function ($scope, $element) {
                this.register = function(contentScope){
                    $scope.contents.push(contentScope);
                    $scope.last();
                };
                this.unregister = function (contentScope) {
                    var i, len = $scope.contents.length;
                    for (i = 0; i < len; i++) {
                        if ($scope.contents[i].$id === contentScope.$id) {
                            break;
                        }
                    }
                    $scope.contents.splice(i, 1);
                    $scope.goTo($scope.selectedContent);
                };
            },
            'compile' : function(tElement, tAttrs, transclude){
                return {
                    'pre': function (scope, element, attrs) {
                        /* save the reference to widgetProps in scope */
                        scope.widgetProps = widgetProps;
                        scope.contents = [];
                        scope.selectedContent = 0;
                        scope.goTo = function(index){
                            if(scope.selectedContent >= 0 && scope.selectedContent < scope.contents.length){
                                scope.contents[scope.selectedContent].moveOut();
                            }
                            if(index >= 0 &&  index < scope.contents.length){
                                scope.contents[index].moveIn();
                                scope.selectedContent  = index;
                            }
                        };
                        scope.next = function(){
                            if(scope.selectedContent > scope.contents.length - 2){
                                scope.goTo(0);
                            } else {
                                scope.goTo(scope.selectedContent + 1);
                            }
                        };
                        scope.previous = function(){
                            if(scope.selectedContent < 1){
                                scope.goTo(0);
                            } else {
                                scope.goTo(scope.selectedContent - 1);
                            }
                        };
                        scope.first = function(){
                            scope.goTo(0);
                        };
                        scope.last = function(){
                            scope.goTo(scope.contents.length -1);
                        };
                        if(CONSTANTS.isStudioMode){
                            scope.add = function(){
                                scope.$root.$emit('canvas-add-widget', {
                                                    'parentId': scope.widgetid,
                                                    'widgetType': 'wm-carousel-content'
                                                });
                            };
                        } else if(CONSTANTS.isRunMode) {
                            scope.play = function(){
                                if(!scope.autoPlay){
                                    scope.next();
                                    scope.autoPlay = $interval(function(){scope.next()}, scope.animationinterval * 1000);
                                }
                            };
                            scope.stop = function(){
                                if(scope.autoPlay){
                                    $interval.cancel(scope.autoPlay);
                                }
                                scope.autoPlay = undefined;
                            };
                        }
                     },
                    'post': function (scope, iElement, iAttrs, controller) {
                        if(CONSTANTS.isRunMode) {
                            scope.play();
                        }
                        scope.goTo(0);
                    }
                }
            },
        };
    }]).directive('wmCarouselContent', ['PropertiesFactory', '$templateCache', 'CONSTANTS', function (PropertiesFactory, $templateCache, CONSTANTS) {
        'use strict';
        /* get the properties related to the carousel-content */
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.carouselcontent', ['wm.base', 'wm.layouts']);
        return {
           'restrict' : 'E',
           'scope' : {},
           'transclude': true,
           'template': $templateCache.get('template/layout/container/carousel/carousel-content.html'),
           'replace' : true,
           'require': '^wmCarousel',
           'compile' : function(tElement, tAttrs){
               return {
                   'pre': function (scope, element, attrs, controller) {
                       scope.transition = '';
                        /* save the reference to widgetProps in scope */
                        scope.widgetProps = widgetProps;
                    },
                   'post': function (scope, element, attrs, controller) {
                        scope.moveIn = function(){
                            scope.transition = 'active';
                        };
                        scope.moveOut = function(){
                            scope.transition = '';
                        };
                        scope.$on('$destroy', function () {
                           controller.unregister(scope);
                        });
                       controller.register(scope);

                   }
               }
           },
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmCarousel
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
 * @param {string=} animationinterval
 *                  Defines the time interval (in seconds) between two slide transitions.  <br>
 *                  Default value: `3`.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <br>
 *               <wm-carousel height="400" name="carousel2" animationinterval="5" width="640">
 *                    <wm-carousel-content name="carousel_content5">
 *                        <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
 *                    </wm-carousel-content>
 *                    <wm-carousel-content name="carousel_content7">
 *                        <wm-picture width="100%" name="picture5" picturesource="https://farm6.staticflickr.com/5002/5237179864_552d6098f5_z_d.jpg"></wm-picture>
 *                    </wm-carousel-content>
 *                    <wm-carousel-content name="carousel_content8">
 *                        <wm-picture name="picture6" width="100%" picturesource="https://farm4.staticflickr.com/3024/3103220799_16f3b1db98_z_d.jpg"></wm-picture>
 *                    </wm-carousel-content>
 *                </wm-carousel>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *
 *           }
 *       </file>
 *   </example>
 */

 /**
  * @ngdoc directive
  * @name wm.layouts.containers.directive:wmCarouselContent
  * @restrict E
  *
  * @description
  * The `wmCarouselContent` directive defines wm-carousel-content widget.<br>
  * This widget has to be used with in wm-carousel.
  *
  *
  * @scope
  *
  * @requires $interval
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
  *   <example module="wmCore">
  *       <file name="index.html">
  *           <div data-ng-controller="Ctrl" class="wm-app">
  *               <br>
  *               <wm-carousel height="400" name="carousel2" animationinterval="5" width="640">
  *                    <wm-carousel-content name="carousel_content5">
  *                        <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
  *                    </wm-carousel-content>
  *                </wm-carousel>
  *           </div>
  *       </file>
  *       <file name="script.js">
  *           function Ctrl($scope) {
  *
  *           }
  *       </file>
  *   </example>
  */