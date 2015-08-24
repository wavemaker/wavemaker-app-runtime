/*global WM, */
/*jslint todo: true */
/*Directive for segmented control */
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/mobile/segmentedcontrol/segmentedcontrol.html',
            '<div class="app-segmented-control {{class}}" hm-swipe-left="goToNext()" hm-swipe-right="goToPrev();" init-widget data-ng-show="show" apply-styles="container">' +
                '<div class="btn-group btn-group-justified">' +
                    '<a class="btn btn-default" data-ng-repeat="content in contents" data-ng-class="{\'active btn-primary\' : $index == currentSelectedIndex}" data-ng-click="$event.stopPropagation(); showContent($index);">' +
                       '<i class="app-icon" data-ng-class="content.iconclass"></i> {{content.caption}}' +
                    '</a>' +
                '</div>' +
                '<div class="app-segments-container">' +
                    '<ul class="list-inline" wmtransclude></ul>' +
                '</div>' +
            '</div>');
        $templateCache.put('template/widget/mobile/segmentedcontrol/segmentcontent.html',
            '<li init-widget wmtransclude class="app-segment-content clearfix" ' + $rootScope.getWidgetStyles('container') +'></li>');
    }])
    .directive('wmSegmentedControl', ['$templateCache', 'PropertiesFactory', 'CONSTANTS', function ($templateCache, PropertiesFactory, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.segmentedcontrol', ['wm.base', 'wm.layouts', 'wm.containers']);
        return {
            'restrict' : 'E',
            'scope'    : {
                'onBeforesegmentchange' : '&',
                'onSegmentchange' : '&'
            },
            'replace' : 'true',
            'transclude': true,
            'template' : $templateCache.get('template/widget/mobile/segmentedcontrol/segmentedcontrol.html'),
            'controller' : function ($scope) {
                this.addContent = function ($contentScope) {
                    $scope.contents.push($contentScope);
                };
                /**
                 * Hides the current content and displays the next in position.
                 */
                $scope.goToNext = function () {
                    $scope.showContent($scope.lastShownContentIndex + 1);
                };
                /**
                 * Hides the current content and displays the previous in position.
                 */
                $scope.goToPrev = function () {
                    $scope.showContent($scope.lastShownContentIndex - 1);
                };
                /**
                 * Removes the content.
                 */
                this.removeContent = function (content) {
                    var i, len = $scope.contents.length;
                    for (i = 0; i < len; i++) {
                        if ($scope.contents[i].$id === content.$id) {
                            break;
                        }
                    }
                    $scope.contents.splice(i, 1);
                    if (i < $scope.contents.length) {
                        $scope.showContent(i);
                    } else if ($scope.contents.length > 0) {
                        $scope.showContent(0);
                    }
                };
            },
            'compile' : function () {
                return {
                    'pre' : function ($scope) {
                        $scope.widgetProps = widgetProps;
                        $scope.contents = [];
                        $scope.animate = true;
                        $scope.currentSelectedIndex = 0;
                    },
                    'post' : function ($scope, $element, attrs, ctrl) {
                        /**
                         * Displays content at the given index.
                         */
                        $scope.showContent = function (index) {
                            if (index < 0 || index >= $scope.contents.length) {
                                return;
                            }

                            var i = $scope.lastShownContentIndex,
                                contents = $scope.contents,
                                currentContent = contents[index],
                                eventData = {$scope: this,
                                            $old: $scope.lastShownContentIndex,
                                            $new: index},
                                $segmentsCtr = $element.find(".app-segments-container"),
                                $segment = $element.find(".app-segments-container > ul > li:nth-child(" + (index + 1) + ")") ,
                                scrollPos = $segmentsCtr.scrollLeft(),
                                left = $segment.position().left;
                            $scope.currentSelectedIndex = index;
                            $scope.onBeforesegmentchange(eventData);

                            if (currentContent && currentContent.widgetid && CONSTANTS.isStudioMode) {
                                $scope.$root.$emit('set-active-widget', currentContent.widgetid);
                            }

                            $segmentsCtr.animate(
                                { scrollLeft: (scrollPos + left)},
                                { duration: "slow" });

                            $scope.lastShownContentIndex = index;
                            $scope.onSegmentchange(eventData);
                        };
                        /**add studio mode changes**/
                        if (CONSTANTS.isStudioMode) {
                            $scope.add = function () {
                                $scope.$root.$emit('canvas-add-widget', {
                                    'parentId': $scope.widgetid,
                                    'widgetType': 'wm-segment-content'
                                });
                                $scope.currentSelectedIndex =  ($scope.contents.length - 1);
                            };
                        }
                    }
                };
            }
        };
    }])
    .directive('wmSegmentContent', ['$templateCache', 'PropertiesFactory', 'CONSTANTS', function ($templateCache, PropertiesFactory, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.segmentcontent', ['wm.base', 'wm.layouts', 'wm.containers']);
        return {
            'restrict' : 'E',
            'replace' : 'true',
            'scope' : {},
            'transclude': true,
            'template' : $templateCache.get('template/widget/mobile/segmentedcontrol/segmentcontent.html'),
            'require': '^wmSegmentedControl',
            'compile' : function () {
                return {
                    'pre' : function ($scope) {
                        $scope.widgetProps = widgetProps;
                    },
                    'post' : function ($scope, element, attrs, controller) {
                        controller.addContent($scope);
                        //remove the segment links
                        if (CONSTANTS.isStudioMode) {
                            $scope.$on('$destroy', function () {
                                controller.removeContent($scope);
                            });
                        }
                    }
                };
            }
        };
    }]);
/**
 * @ngdoc directive
 * @name wm.layouts.containers:wmSegmentedControl
 * @restrict E
 *
 * @description
 * The `wmSegmentedControl` directive defines wm-segmented-control widget.
 *
 *
 * @scope
 *
 * @param {string=} name
 *                  Name of the widget.
 * @param {string=} width
 *                  width of the widget.
 * @param {string=} height
 *                  Height of the widget.
 * @param {string=} show
 *                  If true, then the widget will be shown.
 * @param {string=} class
 *                 class to apply to the widget
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *                 <wm-segmented-control height="400" name="segmentedcontrol3">
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent7" iconclass="glyphicon glyphicon-link">
 *                          <wm-tile name="tile1" width="100%" height="100%" backgroundcolor="#db6a2c"></wm-tile>
 *                      </wm-segment-content>
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent9" iconclass="glyphicon glyphicon-facetime-video">
 *                          <wm-tile name="tile1" width="100%" height="100%" backgroundcolor="#72a68a"></wm-tile>
 *                      </wm-edcontent>
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent4" iconclass="glyphicon glyphicon-picture">
 *                          <wm-tile name="tile1" width="100%" height="100%" backgroundcolor="#80d3ed"></wm-tile>
 *                      </wm-segment-content>
 *                  </wm-segmented-control>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.demo = true;
 *           }
 *       </file>
 *   </example>
 */

/**
 * @ngdoc directive
 * @name wm.layouts.containers:wmSegmentContent
 * @restrict E
 *
 * @description
 * The `wmSegmentContent` directive defines wm-segment-content widget.
 *
 *
 * @scope
 *
 * @param {string=} name
 *                  Name of the widget.
 * @param {string=} caption
 *                  Title to display on the segment.
 * @param {string=} iconclass
 *                  class to use as an icon.
 * @param {string=} class
 *                 class to apply to the widget
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *                 <wm-segmented-control height="400" name="segmentedcontrol3">
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent7" iconclass="glyphicon glyphicon-link">
 *                          <wm-tile name="tile1" width="100%" height="100%" backgroundcolor="#db6a2c"></wm-tile>
 *                      </wm-segment-content>
 *                  </wm-segmented-control>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *           function Ctrl($scope) {
 *              $scope.demo = true;
 *           }
 *       </file>
 *   </example>
 */
