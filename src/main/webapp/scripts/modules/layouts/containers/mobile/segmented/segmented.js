/*global WM, */
/*jslint todo: true */
/*Directive for segmented control */
WM.module('wm.layouts.containers')
    .run(['$rootScope', '$templateCache', function ($rootScope, $templateCache) {
        'use strict';
        $templateCache.put('template/widget/mobile/segmentedcontrol/segmentedcontrol.html',
            '<div class="app-segmented-control {{class}}" data-ng-class="{\'animate\' : animate}" init-widget data-ng-show="show" '  + $rootScope.getWidgetStyles('container') + '>' +
                '<div class="btn-group btn-group-justified">' +
                    '<a class="btn btn-default" data-ng-repeat="content in contents" data-ng-class="{\'active\' : content.show}" data-ng-click=" $event.stopPropagation(); showContent($index);">' +
                       '<i class="app-icon" data-ng-class="content.iconclass"></i> {{content.caption}}' +
                    '</a>' +
                    '<a class="btn btn-default"  data-ng-if="add" data-ng-click="add()">' +
                       '<i class="glyphicon glyphicon-plus"></i> Add' +
                    '</a>' +
                '</div>' +
                '<div class="app-segments-container" wmtransclude></div>' +
            '</div>');
        $templateCache.put('template/widget/mobile/segmentedcontrol/segmentcontent.html',
                '<div init-widget wmtransclude data-ng-class="[\'app-segment-content\', class, slide, {\'active\' : show}]" ' +
                    ' data-ng-show="show" hm-swipe-left="parentCtrl.goToNext()" hm-swipe-right="parentCtrl.goToPrev()">' +
                '</div>');
    }])
    .directive('wmSegmentedControl', ['$templateCache', 'PropertiesFactory', 'CONSTANTS', function ($templateCache, PropertiesFactory, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.segmentedcontrol', ['wm.base', 'wm.containers']);
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
                    if ($scope.showContent) {
                        $scope.showContent($scope.contents.length - 1);
                    }
                };
                /**
                 * Hides the current content and displays the next in position.
                 */
                this.goToNext = function () {
                    $scope.showContent($scope.lastShownContentIndex + 1);
                };
                /**
                 * Hides the current content and displays the previous in position.
                 */
                this.goToPrev = function () {
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
                    },
                    'post' : function ($scope) {
                        /**
                         * Displays content at the given index.
                         */
                        $scope.showContent = function (index) {
                            if (index < 0 || index >= $scope.contents.length) {
                                return;
                            }
                            var i = $scope.lastShownContentIndex,
                                slide = (i > index ? 'right' : 'left'),
                                contents = $scope.contents,
                                eventData = {$scope: this,
                                            $old: $scope.lastShownContentIndex,
                                            $new: index};
                            $scope.onBeforesegmentchange(eventData);
                            if (contents[i]) {
                                contents[i].show = false;
                            }
                            contents[index].show = true;
                            if ($scope.animate) {
                                while (i !== undefined && i !== index) {
                                    contents[i].slide = slide;
                                    i = i > index ? i - 1 : i + 1;
                                }
                                contents[index].slide = '';
                            }
                            if ($scope.lastShownContentIndex >= 0 && CONSTANTS.isStudioMode) {
                                $scope.$root.$emit('set-active-widget', contents[index].widgetid);
                            }
                            $scope.lastShownContentIndex = index;
                            $scope.onSegmentchange(eventData);
                        };
                        /**add studio mode changes**/
                        if (CONSTANTS.isStudioMode) {
                            $scope.animate = false;
                            $scope.add = function () {
                                $scope.$root.$emit('canvas-add-widget', {
                                    'parentId': $scope.widgetid,
                                    'widgetType': 'wm-segment-content'
                                });
                            };
                        }
                        $scope.showContent(0);
                    }
                };
            }
        };
    }])
    .directive('wmSegmentContent', ['$templateCache', 'PropertiesFactory', function ($templateCache, PropertiesFactory) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.segmentcontent', ['wm.base']);
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
                        $scope.show = false;
                        $scope.slide = 'right';
                        $scope.parentCtrl = controller;
                        $scope.$on('$destroy', function () {
                            $scope.parentCtrl.removeContent($scope);
                        });
                        controller.addContent($scope);
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
