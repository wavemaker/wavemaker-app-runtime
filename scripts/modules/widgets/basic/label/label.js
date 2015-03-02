/*global WM, */
/*Directive for Label */

WM.module('wm.widgets.basic')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/label.html',
            '<label class="control-label app-label" data-ng-show="show" title="{{hint}}" init-widget ' +
                ' data-ng-class="{required:required}" ' +
                $rootScope.getWidgetStyles() +
                '></label>'
            );
    }])
    .directive('wmLabel', ['PropertiesFactory', 'WidgetUtilService', '$sce', function (PropertiesFactory, WidgetUtilService, $sce) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.label', ['wm.base', 'wm.base.editors', 'wm.base.events']),
            notifyFor = {
                'caption': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal) {
            switch (key) {
            case 'caption':
                if (WM.isObject(newVal)) {
                    element.text(JSON.stringify(newVal));
                } else {
                    element.html(($sce.trustAs($sce.HTML, newVal.toString()).toString()));
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/label.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmLabel
 * @restrict E
 *
 * @description
 * The `wmLabel` directive defines the label widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $sce
 *
 * @param {string=} name
 *                  Name of the label widget.
 * @param {string=} hint
 *                  Title/hint for the label. <br>
 *                  This property is bindable.
 * @param {string=} caption
 *                  Content of the label. <br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the label.
 * @param {string=} height
 *                  Height of the label.
 * @param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the label widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} on-click
 *                  Callback function for `click` event.
 * @param {string=} on-dblclick
 *                  Callback function for `dblclick` event.
 * @param {string=} on-mouseenter.
 *                  Callback function for `mouseenter` event.
 * @param {string=} on-mouseleave
 *                  Callback function for `mouseleave` event.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>dbl click count: {{dblclickCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <wm-label bordertop="1" borderleft="1" borderright="1" borderbottom="1" bordercolor="crimson" borderstyle="solid" paddingtop="4" paddingleft="4" paddingright="4" paddingbottom="4"
 *                   caption="{{caption}}"
 *                   hint="hint/title for label"
 *                   show="{{show}}"
 *                   width="{{width}}"
 *                   height="{{height}}"
 *                   color="{{color}}"
 *                   required="{{required}}"
 *                   on-click="f('click');"
 *                   on-dblclick="f('dblclick');"
 *                   on-mouseenter="f('mouseenter');"
 *                   on-mouseleave="f('mouseleave')">
 *               </wm-label><br>
 *               <wm-composite>
 *                   <wm-label caption="caption:"></wm-label>
 *                   <wm-text scopedatavalue="caption"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="show:"></wm-label>
 *                   <wm-checkbox scopedatavalue="show"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="required:"></wm-label>
 *                   <wm-checkbox scopedatavalue="required"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="width:"></wm-label>
 *                   <wm-text scopedatavalue="width"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="height:"></wm-label>
 *                   <wm-text scopedatavalue="height"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="color:"></wm-label>
 *                   <wm-select scopedatavalue="color" scopedataset="colors"></wm-select>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.dblclickCount =
 *              $scope.mouseenterCount =
 *              $scope.mouseleaveCount = 0;
 *
 *              $scope.required = true;
 *              $scope.show = true;
 *              $scope.width = "100px";
 *              $scope.height= "30px";
 *              $scope.caption = " Wavemaker! ";
 *              $scope.color = "blue";
 *
 *              $scope.icons = ["ok", "star", "remove", "user", "random"];
 *              $scope.colors = ["blue", "crimson", "green", "orange", "red"];
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */