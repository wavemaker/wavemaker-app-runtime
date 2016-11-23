/*global WM */
/*Directive for currency */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/currency.html',
            '<div init-widget has-model class="input-group app-currency" role="input"><span class="input-group-addon">{{currencysymbol}}</span>' +
                '<input type="number" focus-target class="form-control app-textbox app-currency-input" title="{{hint}}" apply-styles' +
                ' ng-model="_model_"' + /* _model_ is a private variable inside this scope */
                ' ng-readonly="readonly" ' +
                ' ng-required="required" ' +
                ' ng-disabled="disabled" ' +
                ' step="{{step}}"' +
                ' accesskey="{{::shortcutkey}}"' +
                ' ng-change="_onChange({$event: $event, $scope: this})">' +
            '</div>'
            );
    }])
    .directive('wmCurrency', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', '$locale', 'CURRENCYCONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, $locale, CURRENCYCONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.currency', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors']),
            notifyFor = {
                'currency': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'currency':
                if (CURRENCYCONSTANTS[newVal]) {
                    scope.currencysymbol = CURRENCYCONSTANTS[newVal].symbol;
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace' : true,
            'scope'   : {},
            'template': function (tElement, tAttrs) {

                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element($templateCache.get('template/widget/form/currency.html')),
                    target = template.children().last();

                /*setting the currency widget name attribute to the inner input element*/
                target.attr('name', tAttrs.name);

                if (!isWidgetInsideCanvas) {

                    if (tAttrs.hasOwnProperty('minvalue')) {
                        target.attr('min', '{{minvalue}}');
                    }

                    if (tAttrs.hasOwnProperty('maxchars')) {
                        target.attr('maxlength', '{{maxchars}}');
                    }

                    if (tAttrs.hasOwnProperty('maxvalue')) {
                        target.attr('max', '{{maxvalue}}');
                    }

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
                'pre': function (scope) {
                    scope.widgetProps = widgetProps;
                },
                'post': function (scope, element, attrs) {
                    /* to get the currency symbol from current locale*/
                    scope.$locale = $locale;

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

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
 * @name wm.widgets.form.directive:wmCurrency
 * @restrict E
 *
 * @description
 * The `wmCurrency` directive defines the currency widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $locale
 * @requires CURRENCYCONSTANTS
 *
 * @param {string=} name
 *                  Name of the currency widget.
 * @param {string=} placeholder
 *                  Placeholder for the currency.
 * @param {string=} currency
 *                  Currency symbol to be shown in the currency<br>
 *                  Default value: `USD`. <br>
 * @param {string=} hint
 *                  Title/hint for the currency. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the currency widget.
 * @param {string=} width
 *                  Width of the currency.
 * @param {string=} height
 *                  Height of the currency.
 * @param {string=} scopedatavalue
 *                  variable defined in controller scope. The value of this variable is set as the value to be shown in the currency.
 * @param {string=} datavalue
 *                  Value to be shown in the currency. <br>
 *                  This is a bindable property.
 * @param {number=} minvalue
 *                  Minimum value for currency.
 * @param {number=} maxvalue
 *                  Maximum value for currency.
 * @param {boolean=} required
 *                  This property defines if the currency is a required field while form submission. <br>
 *                  Default value: `false`. <br>
 *                  The value of this variable is set as the value to be shown in the currency.
 * @param {boolean=} readonly
 *                  This property will be used to make the currency widget readonly on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the currency widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  This is a bindable property. <br>
 *                  This property will be used to disable/enable the currency widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-mouseenter.
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
 *               <div>
 *                   <span style="font-weight:bold">Currency Amount:<span>
 *                   <span style="font-style:italic">{{amount}}</span>
 *               </div><br>
 *               <wm-currency
 *                  name="currency1"
 *                  hint="test"
 *                  scopedatavalue="amount"
 *                  minvalue="{{minvalue}}"
 *                  placeholder="{{placeholder}}"
 *                  currency="{{currency}}"
 *                  on-click="f('click');"
 *                  on-change="f('change');"
 *                  on-focus="f('focus');"
 *                  on-blur="f('blur');"
 *                  on-mouseenter="f('mouseenter');"
 *                  on-mouseleave="f('mouseleave')"
 *                  width="{{width}}"
 *                  height="{{height}}">
 *                </wm-currency><br><br>
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
 *               <wm-composite>
 *                   <wm-label caption="minvalue:"></wm-label>
 *                   <wm-text type="number" scopedatavalue="minvalue"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="currency:"></wm-label>
 *                   <wm-select scopedatavalue="currency" scopedataset="currencysymbol"></wm-select>
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
 *              $scope.amount = 10;
 *              $scope.placeholder = "sample currency";
 *              $scope.width = "200px";
 *              $scope.height= "30px";
 *              $scope.currency= "USD";
 *              $scope.currencysymbol = ["USD", "INR", "EUR"];

 *
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */
