/*global WM */
/*Directive for Textarea */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/textarea.html',
                '<textarea init-widget has-model class="form-control app-textarea" apply-styles role="input" focus-target' +
                    ' ng-model="_model_" title="{{hint}}"' +
                    ' ng-disabled="disabled" ' +
                    ' ng-readonly="readonly"' +
                    ' ng-required="required" ' +
                    ' accesskey="{{::shortcutkey}}"' +
                    ' ng-change="_onChange({$event: $event, $scope: this})">' +
                '</textarea>'
            );
    }])
    .directive('wmTextarea', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, CONSTANTS) {
        'use strict';
        /*Obtaining properties specific to textarea widget by extending from all editor related widget properties*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.textarea', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard']);

        return {
            'restrict': 'E',
            'replace' : true,
            'scope'   : {},
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/form/textarea.html', tElement, tAttrs)),
                    updateon,
                    debounce;

                if (!isWidgetInsideCanvas) {

                    updateon = (tAttrs.updateon || 'blur') + ' change ';
                    debounce = tAttrs.updatedelay || 0;

                    template.attr('ng-model-options', '{ updateOn:"' + updateon + '", debounce: ' + debounce + '}');

                    if (tAttrs.hasOwnProperty('maxchars')) {
                        template.attr('maxlength', '{{maxchars}}');
                    }
                }
                return template[0].outerHTML;
            },
            'link': {
                'pre': function (scope) {
                    scope.widgetProps = widgetProps;
                },
                'post': function (scope, element, attrs) {

                    /*Called from form reset when users clicks on form reset*/
                    scope.reset = function () {
                        //TODO implement custom reset logic here
                        scope._model_ = '';
                    };

                    //set the resizable property to none in Studio Mode
                    if (CONSTANTS.isStudioMode) {
                        element.css('resize', 'none');
                    }
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
 * @param {string=} placeholder
 *                  Placeholder /hint for the textarea.
 * @param {string=} hint
 *                  Title/hint for the textarea. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of textarea widget <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the textarea.
 * @param {string=} height
 *                  Height of the textarea.
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the textarea widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  Value to be shown in the textarea widget <br>
 *                  This property is bindable.
 * @param {string=} updateon
 *                  Possible values are "blur" and "default" <br>
 *                  If the selected value is `blur`: datavalue will be updated on blur event, `default`: datavalue will be updated on keyup.
 * @param {number=} updatedelay
 *                  The amount of delay in milliseconds to update the datavalue.
 * @param {boolean=} required
 *                  Required is a bindable property. <br>
 *                  This property defines if the textarea is a required field while form submission. <br>
 *                  Default value: `false`. <br>
 * @param {number=} maxchars
 *                  Maximum characters allowed in the textarea
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} readonly
 *                  Readonly is a bindable property. <br>
 *                  This property will be used to make the textarea widget readonly on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the textarea widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the textarea widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-mouseenter
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 *@param {string=} on-keypress
 *                  Callback function which will be triggered when any key is pressed while widget is focused.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>change count: {{changeCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <div>key press count: {{keypressCount}}</div>
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
 *                  on-keypress="f('keypress')"
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
 *              $scope.keypressCount =
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