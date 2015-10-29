/*global WM */
/*Directive for Text */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/text.html',
            '<input class="form-control app-textbox" init-widget has-model apply-styles role="input"' +
                ' title="{{hint}}" ' +
                ' data-ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                ' data-ng-readonly="readonly" ' +
                ' data-ng-required="required" ' +
                ' data-ng-disabled="disabled" ' +
                ' data-ng-show="show" ' +
                ' pattern="{{regexp}}"' +
                ' data-ng-change="_onChange({$event: $event, $scope: this})">' +
                '</input>'
            );
    }])
    .directive('wmText', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.text', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard']),
            notifyFor = {
                'type': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, attrs, key, newVal) {
            switch (key) {
            case 'type':
                scope.widgetProps.datavalue.type = (newVal === 'number' || newVal === 'date') ? newVal : 'string';
                scope.widgetProps.accept.show = newVal === 'file';
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/form/text.html', tElement, tAttrs)),
                    updateon,
                    debounce;

                if (!isWidgetInsideCanvas) {

                    updateon = tAttrs.updateon || 'blur';
                    debounce = tAttrs.updatedelay || 0;

                    template.attr('ng-model-options', '{ updateOn:"' + updateon + '", debounce: ' + debounce + '}');

                    if (tAttrs.hasOwnProperty('maxchars')) {
                        template.attr('maxlength', '{{maxchars}}');
                    }

                    if (tAttrs.hasOwnProperty('minvalue')) {
                        template.attr('min', '{{minvalue}}');
                    }

                    if (tAttrs.hasOwnProperty('maxvalue')) {
                        template.attr('max', '{{maxvalue}}');
                    }
                }
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (iScope) {
                        if (CONSTANTS.isStudioMode) {
                            iScope.widgetProps = WM.copy(widgetProps);
                        } else {
                            iScope.widgetProps = widgetProps;
                        }
                    },
                    'post': function (scope, element, attrs) {

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, attrs), scope, notifyFor);

                        /*Called from form reset when users clicks on form reset*/
                        scope.reset = function () {
                            //TODO implement custom reset logic here
                            scope._model_ = '';
                        };

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmText
 * @restrict E
 *
 * @description
 * The `wmText` directive defines the text widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the text widget.
 * @param {string=} type
 *                  Type of the text box. <br>
 *                  valid value is: text/number/email/url/password/date <br>
 *                  Default value: `text`
 * @param {string=} placeholder
 *                  Placeholder for the textbox.
 * @param {string=} hint
 *                  Title/hint for the text. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of text widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the text.
 * @param {string=} height
 *                  Height of the text.
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the text widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  Value of the text widget <br>
 *                  This property is bindable.
 * @param {number=} minvalue
 *                  Minimum value for textbox type number <br>
 *                  This property is bindable.
 * @param {number=} maxvalue
 *                  Maximum value for textbox type number <br>
 *                  This property is bindable.
 * @param {string=} updateon
 *                  Possible values are "blur", "default" <br>
 *                  If the selected value is `blur`: datavalue will be updated on blur event, `default`: datavalue will be updated on keyup.
 * @param {number=} updatedelay
 *                  The amount of delay in milliseconds to update the datavalue.
 * @param {boolean=} required
 *                  Required is a bindable property. <br>
 *                  This property defines if the text widget is a required field while form submission. <br>
 *                  Default value: `false`. <br>
 *                  The value of this variable is set as the value to be shown in the textbox
 * @param {string=} regexp
 *                  Regular expression to be used to validate user input for client-side input validation
 * @param {number=} maxchars
 *                  Maximum characters allowed in the textbox <br>
 *                  This property is bindable.
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} readonly
 *                  Readonly is a bindable property. <br>
 *                  This property will be used to make the text widget non-editable on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the text widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the text widget on the web page. <br>
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
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div style="display:inline-block;margin-right:200px">
 *                  <div style="font-weight:bold">Example 1:</div><br>
 *                  <div>single click count: {{clickCount}}</div>
 *                  <div>change count: {{changeCount}}</div>
 *                  <div>mouse enter count: {{mouseenterCount}}</div>
 *                  <div>mouse leave count: {{mouseleaveCount}}</div>
 *                  <div>key press count: {{keypressCount}}</div>
 *                  <div>focus count: {{focusCount}}</div>
 *                  <div>blur count: {{blurCount}}</div><br>
 *                  <wm-text
 *                      name="text1"
 *                      hint="test"
 *                      datavalue="{{value}}"
 *                      minvalue="{{minvalue}}"
 *                      maxchars="{{maxchars}}"
 *                      placeholder="{{placeholder}}"
 *                      type="{{type}}"
 *                      on-click="f('click');"
 *                      on-change="f('change');"
 *                      on-focus="f('focus');"
 *                      on-blur="f('blur');"
 *                      on-mouseenter="f('mouseenter');"
 *                      on-mouseleave="f('mouseleave');"
 *                      on-keypress="f('keypress')"
 *                      width="{{width}}"
 *                      height="{{height}}">
 *                  </wm-text><br><br>
 *                  <wm-composite>
 *                      <wm-label caption="width:"></wm-label>
 *                      <wm-text scopedatavalue="width"></wm-text>
 *                  </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="height:"></wm-label>
 *                      <wm-text scopedatavalue="height"></wm-text>
 *                   </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="placeholder:"></wm-label>
 *                      <wm-text scopedatavalue="placeholder"></wm-text>
 *                  </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="datavalue:"></wm-label>
 *                      <wm-text scopedatavalue="value"></wm-text>
 *                  </wm-composite>
 *                  <wm-composite>
 *                       <wm-label caption="maxchars:"></wm-label>
 *                      <wm-text type="number" scopedatavalue="maxchars" disabled='{{!!value || type==="number"}}'></wm-text>
 *                  </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="type:"></wm-label>
 *                      <wm-select scopedatavalue="type" scopedataset="types"></wm-select>
 *                  </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="minvalue:"></wm-label>
 *                      <wm-text type="number" scopedatavalue="minvalue" disabled='{{ type!=="number" }}'></wm-text>
 *                  </wm-composite>
 *               </div>
 *               <div style="display:inline-block;vertical-align:top">
 *                  <div style="font-weight:bold">Example 2:</div><br>
 *                  <div style="font-weight:bold">Details:</div><br>
 *                  <div style="font-style:italic">{{person}}</div><br>
 *                  <wm-composite>
 *                      <wm-label caption="name:"></wm-label>
 *                      <wm-text scopedatavalue="person.name" type="text"></wm-text>
 *                  </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="age:"></wm-label>
 *                      <wm-text scopedatavalue="person.age" type="number"></wm-text>
 *                  </wm-composite>
 *                  <wm-composite>
 *                      <wm-label caption="email:"></wm-label>
 *                      <wm-text scopedatavalue="person.email" type="email"></wm-text>
 *                  </wm-composite>
 *               </div>
 *           </div>
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
 *              $scope.type = "text";
 *              $scope.placeholder = "sample textbox";
 *              $scope.person = {};
 *              $scope.person.name = "ABC";
 *              $scope.person.age = "20";
 *              $scope.person.email = "abc@xyz.com";
 *              $scope.width = "200px";
 *              $scope.height= "30px";
 *              $scope.types = ["text", "number", "email", "url", "password", "date"];
 *
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */