/*global WM, _*/
/*Directive for checkbox */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/checkbox.html',
            '<div class="app-checkbox checkbox" ng-class="{\'app-toggle\' : (type === \'toggle\')}" init-widget has-model title="{{hint}}" role="input">' +
                '<label ng-class="{disabled:disabled || readonly, unchecked: isUnchecked(), required: required && _caption }" apply-styles role="button">' +
                    '<input focus-target type="checkbox" ' +
                        ' ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                        ' ng-readonly="readonly" ' +
                        ' ng-required="required"' +
                        ' ng-disabled="disabled || readonly" ' +
                        ' accesskey="{{::shortcutkey}}"' +
                        ' ng-change="_onChange({$event: $event, $scope: this})">' +
                    '<span class="caption" ng-bind-html="_caption"></span>' +
                    '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" class="switch"/>' +
                '</label>' +
                /*Holder for the model for submitting values in a form*/
                '<input type="hidden" class="ng-hide model-holder" ng-disabled="disabled" value="{{_model_}}">' +
            '</div>'
            );
    }])
    .directive('wmCheckbox', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', '$templateCache', 'FormWidgetUtils', 'Utils', function (PropertiesFactory, WidgetUtilService, CONSTANTS, $templateCache, FormWidgetUtils, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.checkbox', ['wm.base', 'wm.dynamicstyles', 'wm.base.editors.abstracteditors']),
            notifyFor = {
                'caption' : true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'caption':
                if (!WM.isDefined(newVal) || newVal === '') {
                    scope._caption = '&nbsp;';
                } else {
                    scope._caption = newVal;
                }
                break;
            }
        }

        /**
         * when the checkedvalue(ng-true-value) or uncheckedvalue(ng-false-value) or datavalue(ng-model) is not a string and not a boolean convert to string
         * @param value: boolean in string format or string
         * @returns value: string
         */
        function stringify(value) {
            //For boolean values, numbers and if value contains quotes, do not add quotes
            if (!(value === 'true' || value === 'false' || _.includes(value, "'") || !isNaN(parseInt(value, 10)))) {
                value = "'" + value + "'";
            }
            return value;
        }

        function getDefaultValue(attrs) {
            var _model_;
            if (attrs.hasOwnProperty('uncheckedvalue')) {
                if (attrs.uncheckedvalue === 'true') {
                    _model_ = true;
                } else if (attrs.uncheckedvalue === 'false') {
                    _model_ = false;
                } else {
                    _model_ = attrs.uncheckedvalue;
                }
            }
            return _model_;
        }

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/form/checkbox.html')),
                    checkbox,
                    _dataValue,
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),

                    setTrueFalseValues = function (attr, property) {
                        var value = tAttrs[attr];
                        if (value) {
                            //If boolean type value or value contains quotes, do not add the quotes
                            value = stringify(value);
                            checkbox.attr(property, value);
                        }
                    };
                checkbox = template.find('input[type=checkbox]');
                setTrueFalseValues('checkedvalue', 'ng-true-value');
                setTrueFalseValues('uncheckedvalue', 'ng-false-value');

                if (tAttrs.datavalue && !_.startsWith(tAttrs.datavalue, 'bind:')) {
                    _dataValue = stringify(tAttrs.datavalue);
                    tElement.attr('datavalue', _dataValue);
                    tAttrs.datavalue = _dataValue;
                }

                if (!isWidgetInsideCanvas) {
                    WidgetUtilService.addEventAttributes(template, tAttrs, FormWidgetUtils.getProxyEventsMap());
                    WidgetUtilService.addEventAttributes(checkbox, tAttrs, FormWidgetUtils.getFocusBlurEvents());
                }
                /*Set name for the model-holder, to ease submitting a form*/
                checkbox.attr('name', tAttrs.name);

                return template[0].outerHTML;
            },
            'link': {
                'pre': function (scope, element, attrs) {
                    /*Applying widget properties to directive scope*/
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                    if (!attrs.datavalue && !attrs.scopedatavalue) {
                        scope._model_ = getDefaultValue(attrs);
                    }

                    scope._caption = '&nbsp;';

                },
                'post': function (scope, element, attrs) {
                    //hide the caption property for the toggle widget
                    if (scope.widgetid) {
                        scope.widgetProps.caption.show = (scope.type !== 'toggle');
                    }
                    scope.eventProxy = FormWidgetUtils.eventProxy.bind(undefined, scope);
                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                    /*Called from form reset when users clicks on form reset*/
                    scope.reset = function () {
                        scope._model_ = getDefaultValue(attrs) || false;
                    };
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    var checkbox = element.children().first().children().first()[0];

                    scope.isUnchecked = function () {
                        return !checkbox.checked;
                    };
                }
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
 *           <div ng-controller="Ctrl" class="wm-app">
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
 *                   <wm-checkbox type="toggle"
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


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmToggle
 * @restrict E
 *
 * @description
 * The `wmToggle` directive defines the toggle widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=} caption
 *                  Caption / Label for the Toggle widget. <br>
 *                  This property is bindable
 * @param {string=} name
 *                  Name of the toggle widget.
 * @param {string=} hint
 *                  Title/hint for the toggle. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of Toggle widget. <br>
 *                  Default value : 0
 * @param {string=} width
 *                  Width of the toggle.
 * @param {string=} height
 *                  Height of the toggle.
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the toggle widget from a variable defined in the script workspace. <br>
 * $param {string=} datavalue
 *                  The value of the Toggle widget <br>
 *                  This property is bindable.
 *                  Default value : 'false'
 * @param {string=} checkedvalue
 *                  This property defines the value of the toggle widget when the widget is in the checked state.<br>
 *                  Default value: `false`. <br>
 * @param {string=} uncheckedvalue
 *                  This property defines the value of the toggle widget when the widget is in the unchecked state.<br>
 * @param {boolean=} required
 *                   This property will be used to validate the state of the toggle widget when used inside a form widget. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the toggle widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                   Disabled is a bindable property. <br>
 *                   This property will be used to disable/enable the toggle widget on the web page. <br>
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
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <wm-composite>
 *                   <wm-label caption="{{check3caption}}"></wm-label>
 *                   <wm-checkbox type="toggle"
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
 *              $scope.isChecked = "true";
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */
