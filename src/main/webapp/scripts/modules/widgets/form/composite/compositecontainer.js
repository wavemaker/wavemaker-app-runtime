/*global WM, */
/*Directive for composite container */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/form/composite.html',
                '<div class="form-group app-composite-widget clearfix" init-widget apply-styles="container" role="input"' +
                ' ng-class="{\'caption-left\': captionposition == \'left\',\'caption-right\': captionposition == \'right\',\'caption-top\': captionposition == \'top\'}"' +
                ' title="{{hint}}"' +
                ' wmtransclude></div>'
            );
    }])
    .directive('wmComposite', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
            'use strict';
            /*Obtaining properties specific to select widget by extending from all editor related widget properties*/
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.composite', ['wm.base', 'wm.containers']),
                notifyFor   = {'required': true};

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(element, key, newVal) {
                var labelEle, inputElements;
                switch (key) {
                case 'required':
                    /*When a composite widget is set to required then it's label and input also set to required*/
                    labelEle      = element.find('.app-label.ng-isolate-scope');
                    inputElements = ['.input-group.ng-isolate-scope', '.form-control.ng-isolate-scope', 'app-radio.ng-isolate-scope', '.list-group', '.app-checkbox.ng-isolate-scope'];
                    if (labelEle.length) {
                        WM.element(labelEle).first().isolateScope().required = newVal;
                    }
                    inputElements.forEach(function (ele) {
                        var inputEle = element.find(ele);
                        if (inputEle.length) {
                            inputEle.each(function () {
                                WM.element(this).isolateScope().required = newVal;
                            });
                        }
                    });
                    break;
                }
            }

            return {
                'restrict'  : 'E',
                'replace'   : true,
                'transclude': true,
                'scope'     : {},
                'template'  : $templateCache.get('template/widget/form/composite.html'),
                'link'      : {
                    'pre': function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
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

                        /*Called from form reset when users clicks on form reset*/
                        scope.reset = function () {
                            //TODO implement custom reset logic here
                        };

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                }
            };
        }
    ]);


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
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <div>hint: {{hint}}</div>
 *               <wm-composite widget="text" name="Composite" hint="{{hint}}" horizontalalign="{{horizontalalign}}" bordercolor="#912121" borderstyle="solid" borderwidth="1px">
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
