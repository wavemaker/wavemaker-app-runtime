/*global WM, */
/*Directive for checkbox */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        /*
        * TODO: ng-required is removed as the current angular version(v1.2.13) is having issues
        * with updating checkbox checked state based on initial dataValue if ng-checked-value is set
        * on updating angular version, ng-required attribute can be kept in the template
        * note: attribute 'ng-checked' removed as it is conflicting with the new property 'datavalue'
        */
        $templateCache.put('template/widget/form/checkbox.html',
            '<div class="app-checkbox checkbox" data-ng-class="{\'app-toggle\' : (type === \'toggle\')}" init-widget has-model data-ng-show="show" title="{{hint}}">' +
                '<label data-ng-class="{\'disabled\':disabled,\'unchecked\': (_model_=== uncheckedvalue || _model_ === false)}"' + $rootScope.getWidgetStyles() + '>' +
                    '<input type="checkbox" ' +
                        ' data-ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                        ' data-ng-readonly="readonly" ' +
                        ' data-ng-required="required"' +
                        ' data-ng-disabled="disabled" ' +
                        ' data-ng-change="_onChange({$event: $event, $scope: this})">' +
                    '</input>' +
                '<span class="caption">{{caption || "&nbsp;"}}</span>' +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" class="switch"/>'+
                '</label>' +
                /*Holder for the model for submitting values in a form*/
                '<input type="hidden" class="ng-hide model-holder" data-ng-disabled="disabled" value="{{_model_}}">' +
            '</div>'
            );
    }])
    .directive('wmCheckbox', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', '$templateCache', function (PropertiesFactory, WidgetUtilService, CONSTANTS, $templateCache) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.checkbox', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors']),
            notifyFor = {
                'startchecked': true,
                'readonly': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'startchecked':
                newVal = newVal === true || newVal === 'true';
                if (CONSTANTS.isStudioMode) {
                    scope.datavalue = newVal ? (scope.checkedvalue || true) : false;
                } else {
                    scope.datavalue = newVal ? (scope.checkedvalue || true) : scope.datavalue;
                }
                break;
            case 'readonly':
                scope.disabled = newVal;
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/checkbox.html')),
                    checkbox,
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                checkbox = template.find('input[type=checkbox]');
                if (tAttrs.checkedvalue) {
                    checkbox.attr('data-ng-true-value', "'" + tAttrs.checkedvalue + "'");
                }
                if (tAttrs.uncheckedvalue) {
                    checkbox.attr('data-ng-false-value', "'" + tAttrs.uncheckedvalue + "'");
                }
                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onClick')) {
                        template.attr('data-ng-click', 'onClick({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseenter')) {
                        template.attr('data-ng-mouseenter', 'onMouseenter({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseleave')) {
                        template.attr('data-ng-mouseleave', 'onMouseleave({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onFocus')) {
                        checkbox.attr('data-ng-focus', 'onFocus({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onBlur')) {
                        checkbox.attr('data-ng-blur', 'onBlur({$event: $event, $scope: this})');
                    }
                }
                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);

                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope, element, attrs) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                        if (!attrs.datavalue && !attrs.scopedatavalue) {
                            scope._model_ = attrs.uncheckedvalue || false;
                        }

                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmCheckbox
 * @restrict E
 *
 * @description
 * The `wmCheckbox` directive defines the checkbox widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=} caption
 *                  Caption / Label for the Checkbox widget. <br>
 *                  This property is bindable
 * @param {string=} name
 *                  Name of the checkbox widget.
 * @param {string=} hint
 *                  Title/hint for the checkbox. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of Checkbox widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the checkbox.
 * @param {string=} height
 *                  Height of the checkbox.
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the checkbox widget from a variable defined in the script workspace. <br>
 * $param {string=} datavalue
 *                  The value of the Checkbox widget <br>
 *                  This property is bindable.
 *                  Default value : 'false'
 * @param {string=} checkedvalue
 *                  This property defines the value of the checkbox widget when the widget is in the checked state.<br>
 *                  Default value: `false`. <br>
 * @param {string=} uncheckedvalue
 *                  This property defines the value of the checkbox widget when the widget is in the unchecked state.<br>
 * @param {boolean=} required
 *                   This property will be used to validate the state of the checkbox widget when used inside a form widget. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} startchecked
 *                   This property will be used to set the initial state of the checkbox widget. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the checkbox widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                   Disabled is a bindable property. <br>
 *                   This property will be used to disable/enable the checkbox widget on the web page. <br>
 *                   Default value: `false`. <br>
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
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>change count: {{changeCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="{{check1caption}}"></wm-label>
 *                   <wm-checkbox
 *                       hint="hint/title for checkbox"
 *                       checkedvalue="RED"
 *                       scopedatavalue="favitem1"
 *                       on-click="f('click');"
 *                       on-change="f('change');"
 *                       on-focus="f('focus');"
 *                       on-blur="f('blur');"
 *                       on-mouseenter="f('mouseenter');"
 *                       on-mouseleave="f('mouseleave')"
 *                       width="{{width}}"
 *                       height="{{height}}">
 *               </wm-composite>
 *
 *               <div>{{favitem1}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="{{check2caption}}"></wm-label>
 *                   <wm-checkbox
 *                       hint="hint/title for checkbox"
 *                       checkedvalue="GREEN"
 *                       scopedatavalue="favitem2"
 *                       on-click="f('click');"
 *                       on-change="f('change');"
 *                       on-focus="f('focus');"
 *                       on-blur="f('blur');"
 *                       on-mouseenter="f('mouseenter');"
 *                       on-mouseleave="f('mouseleave')"
 *                       width="{{width}}"
 *                       height="{{height}}">
 *               </wm-composite>
 *
 *               <div>{{favitem2}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="{{check3caption}}"></wm-label>
 *                   <wm-checkbox
 *                       hint="hint/title for checkbox"
 *                       checkedvalue="BLUE"
 *                       scopedatavalue="favitem3"
 *                       on-click="f('click');"
 *                       on-change="f('change');"
 *                       on-focus="f('focus');"
 *                       on-blur="f('blur');"
 *                       on-mouseenter="f('mouseenter');"
 *                       on-mouseleave="f('mouseleave')"
 *                       width="{{width}}"
 *                       height="{{height}}">
 *               </wm-composite>
 *
 *               <div>{{favitem3}}</div>
 *
 *               <wm-composite>
 *                   <wm-label caption="Item 1:"></wm-label>
 *                   <wm-text scopedatavalue="check1caption"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="Item 2:"></wm-label>
 *                   <wm-text scopedatavalue="check2caption"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="Item 3:"></wm-label>
 *                   <wm-text scopedatavalue="check3caption"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="width:"></wm-label>
 *                   <wm-text scopedatavalue="width"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="height:"></wm-label>
 *                   <wm-text scopedatavalue="height"></wm-text>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.changeCount =
 *              $scope.mouseenterCount =
 *              $scope.mouseleaveCount =
 *              $scope.focusCount =
 *              $scope.blurCount = 0;
 *              $scope.favcolors = [];
 *
 *              $scope.width = "50px";
 *              $scope.height= "20px";
 *
 *              $scope.check1caption = "RED";
 *              $scope.check2caption = "GREEN";
 *              $scope.check3caption = "BLUE";
 *
 *              $scope.isChecked = "true";
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */

