/*global WM, _ */
/*jslint todo: true */
/*Directive for segmented control */
WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/mobile/segmentedcontrol/segmentedcontrol.html',
            '<div class="app-segmented-control" hm-swipe-left="goToNext()" hm-swipe-right="goToPrev();" init-widget apply-styles="container">' +
                '<div class="app-segments-container">' +
                    '<ul class="list-inline" wmtransclude></ul>' +
                '</div>' +
                '<div class="btn-group btn-group-justified">' +
                    '<a class="btn btn-default" ng-repeat="content in contents" ng-class="{\'active btn-primary\' : $index == currentSelectedIndex}" ng-click="$event.stopPropagation(); showContent($index);">' +
                        '<i class="app-icon" ng-class="content.iconclass"></i> {{content.caption}}' +
                    '</a>' +
                '</div>' +
            '</div>');
        $templateCache.put('template/widget/mobile/segmentedcontrol/segmentcontent.html',
            '<li init-widget wmtransclude page-container page-container-target class="app-segment-content clearfix" wm-smoothscroll="{{smoothscroll}}" apply-styles="container" wm-navigable-element="true"></li>');
    }])
    .directive('wmSegmentedControl', ['$templateCache', 'PropertiesFactory', 'CONSTANTS', 'WidgetUtilService', 'Utils', function ($templateCache, PropertiesFactory, CONSTANTS, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.segmentedcontrol', ['wm.base']);
        return {
            'restrict' : 'E',
            'scope'    : {},
            'replace' : 'true',
            'transclude': true,
            'template' : $templateCache.get('template/widget/mobile/segmentedcontrol/segmentedcontrol.html'),
            'controller' : function ($scope) {
                this.addContent = function ($contentScope) {
                    $scope.contents.push($contentScope);
                };

                this.showContent = function (content) {
                    var contentIndex = _.findIndex($scope.contents, function (_content) {
                        return _content.$id === content.$id;
                    });
                    $scope.showContent(contentIndex);
                };
                /**
                 * Hides the current content and displays the next in position.
                 */
                $scope.goToNext = function () {
                    $scope.showContent($scope.currentSelectedIndex + 1);
                };
                /**
                 * Hides the current content and displays the previous in position.
                 */
                $scope.goToPrev = function () {
                    $scope.showContent($scope.currentSelectedIndex - 1);
                };
                /**
                 * Removes the content.
                 */
                this.removeContent = function (content) {
                    var index;

                    index = _.findIndex($scope.contents, function (_content) {
                        return _content.$id === content.$id;
                    });

                    _.pullAt($scope.contents, index);

                    if (index < $scope.contents.length) {
                        $scope.showContent(index);
                    } else if ($scope.contents.length > 0) {
                        $scope.showContent(0);
                    }
                };
            },
            'link' : {
                'pre' : function ($scope, $el, attrs) {
                    $scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                    $scope.contents = [];
                    $scope.animate = true;
                    $scope.currentSelectedIndex = 0;
                },
                'post' : function ($scope, $element, attrs) {
                    /**
                     * Displays content at the given index.
                     */
                    $scope.showContent = function (index) {
                        if (index < 0 || index >= $scope.contents.length) {
                            return;
                        }

                        var contents = $scope.contents,
                            currentContent = contents[index],
                            eventData = {
                                $scope: this,
                                $old  : $scope.currentSelectedIndex,
                                $new  : index
                            },
                            $segmentsCtr = $element.find(">.app-segments-container");

                        $scope.currentSelectedIndex = index;
                        Utils.triggerFn($scope.onBeforesegmentchange, eventData);
                        currentContent.onShow();
                        if (currentContent && currentContent.widgetid && CONSTANTS.isStudioMode && $scope.$root) {
                            $scope.$root.$emit('set-active-widget', currentContent.widgetid);
                        }
                        $segmentsCtr.animate(
                            { scrollLeft: index * $segmentsCtr.width()},
                            { duration: "fast" }
                        );
                        Utils.triggerFn($scope.onSegmentchange, eventData);
                    };
                    $scope.showContent(0);
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
                    WidgetUtilService.postWidgetCreate($scope, $element, attrs);
                }
            }
        };
    }])
    .directive('wmSegmentContent', ['$templateCache', 'PropertiesFactory', 'CONSTANTS', 'Utils', 'WidgetUtilService', function ($templateCache, PropertiesFactory, CONSTANTS, Utils, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.segmentcontent', ['wm.base', 'wm.containers', 'wm.containers.lazy', 'wm.scrollablecontainer']);
        return {
            'restrict'  : 'E',
            'replace'   : 'true',
            'scope'     : {},
            'transclude': true,
            'template'  : $templateCache.get('template/widget/mobile/segmentedcontrol/segmentcontent.html'),
            'require'   : '^wmSegmentedControl',
            'link'      : {
                'pre' : function ($scope, $el, attrs) {
                    $scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                    $scope.onShow = function () {
                        $scope.__load();
                    };
                    $scope.__onTransclude = function () {
                        Utils.triggerFn($scope.onReady);
                    };
                },
                'post' : function ($scope, element, attrs, controller) {
                    controller.addContent($scope);
                    $scope.navigate = function () {
                        controller.showContent($scope);
                    };
                    //remove the segment links
                    if (CONSTANTS.isStudioMode) {
                        $scope.$on('$destroy', function () {
                            controller.removeContent($scope);
                        });
                    }
                    WidgetUtilService.postWidgetCreate($scope, element, attrs);
                }
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
 *           <div ng-controller="Ctrl" class="wm-app">
 *                 <wm-segmented-control height="400" name="segmentedcontrol3">
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent7" iconclass="wi wi-link">
 *                          <wm-tile name="tile1" width="100%" height="100%" backgroundcolor="#db6a2c"></wm-tile>
 *                      </wm-segment-content>
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent9" iconclass="wi wi-video">
 *                          <wm-tile name="tile1" width="100%" height="100%" backgroundcolor="#72a68a"></wm-tile>
 *                      </wm-edcontent>
 *                      <wm-segment-content caption="" name="segmentedcontrolcontent4" iconclass="wi wi-picture">
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
 *           <div ng-controller="Ctrl" class="wm-app">
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
