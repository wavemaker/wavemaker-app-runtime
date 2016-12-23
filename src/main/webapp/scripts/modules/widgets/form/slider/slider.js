/*global WM */
/*Directive for slider */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/slider.html',
                '<div class="app-slider slider" init-widget has-model title="{{hint}}" apply-styles role="input">' +
                    '<span class="app-slider-value">{{minvalue}}</span>' +
                    '<span class="app-slider-value pull-right">{{maxvalue}}</span>' +
                    '<input class="range-input" type="range" focus-target title="{{_model_}}" min="{{minvalue}}" max="{{maxvalue}}" step="{{step}}"' +
                       ' ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                       ' ng-disabled="disabled"' +
                       ' accesskey="{{::shortcutkey}}"' +
                       ' ng-change="_onChange({$event: $event, $scope: this})" />' + /* private method defined in this scope */
                    '<div ng-show="readonly || disabled" class="readonly-wrapper"></div>' +
                '</div>'
            );
    }])
    .directive('wmSlider', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.slider', ['wm.base', 'wm.base.events.change']);
        return {
            'restrict': 'E',
            'replace' : true,
            'scope'   : {'onChange': '&'},
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/slider.html'));
                template.find('input').attr('name', tAttrs.name);
                return template[0].outerHTML;
            },
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {

                    /*Called from form reset when users clicks on form reset*/
                    scope.reset = function () {
                        //TODO implement custom reset logic here
                        scope._model_ = '';
                    };

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
 * @param {string=} hint
 *                  Title/hint for the slider. <br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the slider.
 * @param {string=} height
 *                  Height of the slider.
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the slider widget from a variable defined in the script workspace. <br>
 *                  The scope variable is updated whenever there is a change in the slider value.
 * @param {string=} datavalue
 *                  Value of the slider widget. Accepts the value from a studio variable or from another widget's value.<br>
 *                  This property is bindable.
 * @param {number=} minvalue
 *                  This property represents the start value of slider. <br>
 *                  This property is bindable.
 * @param {number=} maxvalue
 *                  This property represents the end value of slider. <br>
 *                  This property is bindable.
 * @param {number=} step
 *                  This property represents the no of steps the range is divided.
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the slider widget non-editable on the web page. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the slider widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the slider widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div>
 *               <wm-slider
 *                   caption="{{caption}}"
 *                   hint="hint/title for slider" *
 *                   width="{{width}}"
 *                   height="{{height}}"
 *                   color="{{color}}"
 *                   iconclass="{{icon}}">
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

