/*global WM */
/*Directive for slider */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/slider.html',
                   '<div class="app-slider slider" init-widget has-model data-ng-show="show" title="{{hint}}"'
                   + $rootScope.getWidgetStyles() +
                   '><span class="app-slider-value">{{minvalue}}</span>' +
                   '<input class="range-input" type="range" title="{{_model_}}" min="{{minvalue}}" max="{{maxvalue}}" step="{{step}}"' +
                       ' data-ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                       ' data-ng-disabled="disabled"' +
                       ' data-ng-change="_onChange({$event: $event, $scope: this})" ' + /* private method defined in this scope */
                    '/><span class="app-slider-value">{{maxvalue}}</span>' +
                    '<div data-ng-show="readonly || disabled" class="readonly-wrapper"></div>' +
                   '</div>'
            );
    }])
    .directive('wmSlider', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', function (PropertiesFactory, $templateCache, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.slider', ['wm.base', 'wm.base.editors', 'wm.base.events.change']);
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'onChange': '&'
            },
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/slider.html'));
                template.find('input').attr('name', tAttrs.name);
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmSlider
 * @restrict E
 *
 * @description
 * The `wmSlider` directive defines the slider widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the slider widget.
 * @param {string=} type
 *                  Type of the slider widget. <br>
 *                  valid value is: slider/submit/reset <br>
 *                  Default value: `slider`
 * @param {string=} hint
 *                  Title/hint for the slider. <br>
 *                  This property is bindable.
 * @param {string=} caption
 *                  Content of the Slider. <br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the slider.
 * @param {string=} height
 *                  Height of the slider.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the slider widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the slider widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} iconname
 *                  Name of the icon.
 * @param {string=} iconurl
 *                  url of the icon.
 * @param {string=} iconwidth
 *                  width of the icon.
 *                  Default value: 16px
 * @param {string=} iconheight
 *                  height of the icon.
 *                  Default value: 16px
 * @param {string=} iconmargin
 *                  margin of the icon.
 * @param {string=} on-focus
 *                  Callback function for `focus` event.
 * @param {string=} on-blur
 *                  Callback function for `blur` event.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div>
 *               <wm-slider
 *                   caption="{{caption}}"
 *                   hint="hint/title for slider" *
 *                   width="{{width}}"
 *                   height="{{height}}"
 *                   color="{{color}}"
 *                   iconname="{{icon}}">
 *               </wm-slider><br>
 *               <wm-composite>
 *                   <wm-label caption="caption:"></wm-label>
 *                   <wm-text scopedatavalue="caption"></wm-text>
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
 *               <wm-composite>
 *                   <wm-label caption="icon:"></wm-label>
 *                   <wm-select scopedatavalue="icon" scopedataset="icons"></wm-select>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.focusCount =
 *              $scope.blurCount = 0;
 *
 *              $scope.width = "100px";
 *              $scope.height= "30px";
 *              $scope.caption = " Slide Me! ";
 *              $scope.color = "crimson";
 *
 *              $scope.colors = ["crimson", "green", "orange", "red"];
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */

