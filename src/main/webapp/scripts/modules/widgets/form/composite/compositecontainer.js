/*global WM, */
/*Directive for composite container */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';

        $templateCache.put('template/widget/form/composite.html',
                '<div class="form-group app-composite-widget clearfix" init-widget' +
                ' data-ng-class="{\'caption-left\': captionposition == \'left\',\'caption-right\': captionposition == \'right\',\'caption-top\': captionposition == \'top\'}"' +
                ' title="{{hint}}"' +
                ' data-ng-disabled="disabled"' +
                ' data-ng-show="show"' +
                $rootScope.getWidgetStyles('container') +
                ' wmtransclude></div>'
            );
    }])
    .directive('wmComposite', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', function (PropertiesFactory, $templateCache, WidgetUtilService) {
        'use strict';
        /*Obtaining properties specific to select widget by extending from all editor related widget properties*/
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.composite', ['wm.base', 'wm.layouts']),
            notifyFor = {
                'required': true
            };
        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal) {
            switch (key) {
            case 'required':
                /*When a composite widget is set to required then it's label and input also set to required*/
                var labelEle = element.find('.control-label.ng-isolate-scope'),
                    inputEle = element.find('.form-control.ng-isolate-scope');
                WM.element(labelEle).isolateScope().required = newVal;
                WM.element(inputEle).isolateScope().required = newVal;
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'transclude': true,
            'scope': {},
            'template': $templateCache.get('template/widget/form/composite.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);

                        //if the widget is not inside canvas.
                        if (!scope.widgetid) {
                            /* add for attribute for label and id attribute for the input elements */
                            var labelEl = element.find('label'),
                                inputEl = element.find('input, select, textarea'),
                                inputName;

                            if (labelEl.length === 1 && inputEl.length === 1) {
                                inputName = inputEl.attr('name');
                                inputEl.attr('id', inputName);
                                labelEl.attr('for', inputName);
                            }
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmComposite
 * @restrict E
 *
 * @description
 * The directive defines a composite container which wraps our basic widgets inside.
 *
 * @scope
 *
 * @requires PropertiesFactory
 *
 * @param {string=} name
 *                  Name of the composite container.
 * @param {string=} hint
 *                  Title/hint for the container <br>
 *                  This property is bindable.
 * @param {boolean=} required
 *                  Required is a bindable property. <br>
 *                  This property determines required validation for a field. <br>
 *                  Default value: `false`.
 * @param {list=} captionposition
 *                 This property determines where is caption appears with respect to the field. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the container and the widgets inside, on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} horizontalalign
 *                  Sets the alignment for the widgets inside the container. <br>
 *                  Possible values are ["left", "center", "top"] <br>
 *                  Default Value : 'left'
 *  @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>hint: {{hint}}</div>
 *               <wm-composite widget="text" name="Composite" hint="{{hint}}" horizontalalign="{{horizontalalign}}" bordercolor="#912121" borderstyle="solid" borderleft="1" bordertop="1" borderright="1" borderbottom="1" borderunit="px">
 *                  <wm-label name="label"></wm-label>
 *                  <wm-text name="text"></wm-text>
 *               </wm-composite><br>
 *
 *               <wm-composite>
 *                   <wm-label caption="Hint:"></wm-label>
 *                   <wm-text scopedatavalue="hint"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="Horizontal Align:"></wm-label>
 *                   <wm-text scopedatavalue="horizontalalign"></wm-text>
 *               </wm-composite>
 *
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.hint = "Text";
 *              $scope.horizontalalign = "center";
 *           }
 *       </file>
 *   </example>
 */
