/*global WM */
/*Directive for Textarea */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/textarea.html',
                '<textarea init-widget has-model class="form-control app-textarea" ' +
                    ' data-ng-model="_model_" title="{{hint}}"' +
                    ' data-ng-show = "show" ' +
                    ' data-ng-disabled="disabled" ' +
                    ' data-ng-readonly="readonly"' +
                    ' data-ng-required="required" ' +
                    ' data-ng-change="_onChange({$event: $event, $scope: this})" ' +
                    $rootScope.getWidgetStyles() +
                    ' >' +
                '</textarea>'
            );
    }])
    .directive('wmTextarea', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        /*Obtaining properties specific to textarea widget by extending from all editor related widget properties*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.textarea', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/form/textarea.html', tElement, tAttrs)),
                    updateon,
                    debounce;

                if (!isWidgetInsideCanvas) {

                    updateon = tAttrs.updateon || 'blur';
                    debounce = tAttrs.updatedelay || 0;

                    template.attr('ng-model-options', '{ updateOn:"' + updateon + '", debounce: ' + debounce + '}');

                    if (tAttrs.hasOwnProperty('maxchars')) {
                        template.attr('maxlength', '{{maxchars}}');
                    }
                }
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
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
 * @name wm.widgets.form.directive:wmTextarea
 * @restrict E
 *
 * @description
 * The `wmTextarea` directive defines the textarea widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the textarea widget.
 * @param {string=} hint
 *                  Title/hint for the textarea. <br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the textarea.
 * @param {string=} height
 *                  Height of the textarea.
 * @param {string=} placeholder
 *                  Placeholder for the textarea.
 * @param {string=} hint
 *                  Hint for the textarea
 * @param {string=} scopedatavalue
 *                  variable defined in controller scope. The value of this variable is set as the value to be shown in the textarea
 * @param {string=} datavalue
 *                  Value to be shown in the textarea
 * @param {number=} maxchars
 *                  Maximum characters allowed in the textarea
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the textarea widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the textarea widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} readonly
 *                  Readonly is a bindable property. <br>
 *                  This property will be used to make the textarea widget readonly on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} required
 *                  Required is a bindable property. <br>
 *                  This property defines if the textarea is a required field while form submission. <br>
 *                  Default value: `false`. <br>
 *                  The value of this variable is set as the value to be shown in the textarea
 * @param {string=} on-click
 *                  Callback function for `click` event.
 * @param {string=} on-change
 *                  Callback function for `change` event.
 * @param {string=} on-mouseenter.
 *                  Callback function for `mouseenter` event.
 * @param {string=} on-mouseleave
 *                  Callback function for `mouseleave` event.
 * @param {string=} on-focus
 *                  Callback function for `focus` event.
 * @param {string=} on-blur
 *                  Callback function for `blur` event.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>change count: {{changeCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div><br>
 *               <div style="font-weight:bold">Textarea content:</div><br>
 *               <div style="font-style:italic">{{content}}</div><br>
 *               <wm-textarea
 *                  name="textarea1"
 *                  hint="test"
 *                  scopedatavalue="content"
 *                  placeholder="{{placeholder}}"
 *                  maxchars="{{maxchars}}"
 *                  on-click="f('click');"
 *                  on-change="f('change');"
 *                  on-focus="f('focus');"
 *                  on-blur="f('blur');"
 *                  on-mouseenter="f('mouseenter');"
 *                  on-mouseleave="f('mouseleave')"
 *                  width="{{width}}"
 *                  height="{{height}}">
 *                </wm-textarea><br><br>
 *               <wm-composite>
 *                   <wm-label caption="width:"></wm-label>
 *                   <wm-text scopedatavalue="width"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="height:"></wm-label>
 *                   <wm-text scopedatavalue="height"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="placeholder:"></wm-label>
 *                   <wm-text scopedatavalue="placeholder"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="maxchars:"></wm-label>
 *                   <wm-text type="number" scopedatavalue="maxchars" disabled='{{!!value}}'></wm-text>
 *               </wm-composite>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.changeCount =
 *              $scope.mouseenterCount =
 *              $scope.mouseleaveCount =
 *              $scope.focusCount =
 *              $scope.blurCount = 0;
 *              $scope.placeholder = "sample textarea";
 *              $scope.content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum porta gravida nisi, ac volutpat nibh adipiscing et."
 *
 *              $scope.width = "300px";
 *              $scope.height= "80px";
 *
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */