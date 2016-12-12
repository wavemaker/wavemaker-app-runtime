/*global WM, */
/*Directive for Colorpicker */

WM.module('wm.widgets.form').requires = WM.module('wm.widgets.form').requires.concat(['colorpicker.module']);
/*Registering the colorpicker widget as a module.*/
WM.module('wm.widgets.form')
    /*Saving the colorpicker widget template using the $templateCache service.*/
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        /*Assigning the template to an identifier.*/
        $templateCache.put('template/widget/form/colorpicker.html',
            '<div title="{{hint}}" class="input-group app-colorpicker" init-widget has-model role="input">' +
                '<input colorpicker colorpicker-parent="true" focus-target class="form-control app-textbox" ' +
                ' ng-disabled="readonly || disabled"' +
                ' ng-required="required"' +
                ' ng-model="_model_"' +
                ' ng-change="_onChange({$event: $event, $scope: this})"' +
                ' accesskey="{{::shortcutkey}}"' +
                '><span class="input-group-addon" ng-style="{backgroundColor:_model_}">&nbsp;</span></div>');
    }])
    /*Colorpicker widget directive definition*/
    .directive('wmColorpicker', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
        'use strict';
        /*Obtaining the widget properties from the Base configurations, by combining widget properties and it's parent group's properties.*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.colorpicker', ['wm.base', 'wm.base.events', 'wm.base.events.focus', 'wm.base.events.change']);

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element($templateCache.get('template/widget/form/colorpicker.html')),
                    target = template.children().first();

                /*setting the color picker widget name attribute to the inner input element*/
                template.find('input').attr('name', tAttrs.name);

                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onClick')) {
                        target.attr('ng-click', 'onClick({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseenter')) {
                        target.attr('ng-mouseenter', 'onMouseenter({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseleave')) {
                        target.attr('ng-mouseleave', 'onMouseleave({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onFocus')) {
                        target.attr('ng-focus', 'onFocus({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onBlur')) {
                        target.attr('ng-blur', 'onBlur({$event: $event, $scope: this})');
                    }
                }
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
                    /*Executing WidgetUtilService method to initialize the widget with the essential configurations needed.*/
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmColorpicker
 * @restrict E
 *
 * @description
 * The `wmColorpicker` directive defines the colorpicker widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the colorpicker widget.
 * @param {string=} placeholder
 *                  Placeholder text for the widget. <br>
 * @param {number=} tabindex
 *                 This property specifies the tab order of Colorpicker widget. <br>
 *                  Default value : 0
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the colorpicker widget from a variable defined in the script workspace. <br>
 *                  The scope variable is updated whenever there is a change in the colorpicker value.
 * @param {string=} datavalue
 *                  Value of the colorpicker widget. Accepts the value from a studio variable or from another widget's value.<br>
 *                  This property is bindable.
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the colorpicker widget non-editable on the web page. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the colorpicker widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the widget on the web page. <br>
 *                  Default value: `false`.
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dblclick
 *                  Callback function which will be triggered when the widget is double clicked.
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
 *               <div style="width:100px; height:100px; background-color: {{color}}">
 *               </div><br>
 *
 *               <div>colorpicker value: <span style="font-weight: bold; color: {{color}};">{{color}}</span></div><br>
 *
 *               <div style="font-weight: bold; color: {{color}};">Hello there. Change the way I look using the colorpicker widget.</div><br>
 *
 *               <wm-colorpicker
 *                   scopedatavalue="color"
 *                   on-click="f('click');"
 *                   on-change="f('change');"
 *                   on-focus="f('focus');"
 *                   on-blur="f('blur');"
 *                   on-mouseenter="f('mouseenter');"
 *                   on-mouseleave="f('mouseleave')">
 *               </wm-colorpicker><br>
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
 *
 *              $scope.color = "blue";
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */
