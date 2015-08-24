/*global WM, */
/*Directive for richtexteditor */

WM.module('wm.widgets.form').requires = WM.module('wm.widgets.form').requires.concat(['textAngular']);
WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/richtexteditor.html',
            '<div class="app-richtexteditor clearfix" init-widget has-model apply-styles data-ng-show="show">' +
                '<div text-angular data-ng-model="_model_"></div>' +
                '<div data-ng-bind-html="_model_" class="ta-preview" data-ng-show="showpreview"></div>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" data-ng-disabled="disabled">' +
            '</div>'
            );
    }])
    .directive('wmRichtexteditor', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', function (PropertiesFactory, $templateCache, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.richtexteditor', ['wm.base', 'wm.base.editors']),
            notifyFor = {
                'placeholder': true,
                'showpreview': true,
                'readonly': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, editorElement, btnElements, key, newVal) {
            switch (key) {
            case 'placeholder':
                scope._model_ = newVal;
                break;
            case 'showpreview':
                scope.showpreview = newVal;
                break;
            case 'readonly':
                /*to enable/disable picture, link & unlink buttons*/
                btnElements.attr('disabled', newVal === true);
                /*check for newVal*/
                if (newVal === true) {
                    /*listen on keypress, prevent default action*/
                    editorElement.on('keypress.readOnlyEvent', function (event) {
                        event.preventDefault();
                    });
                } else {
                    /*unbind readOnlyEvent keypress action*/
                    editorElement.off('.readOnlyEvent');
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {},
            'replace': true,
            'template': function (tElement, tAttrs) {
                var template = WM.element($templateCache.get('template/widget/richtexteditor.html'));
                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(
                            propertyChangeHandler.bind(undefined, scope, element.find('.ta-editor'), element.find('.fa-picture-o, .fa-link, .fa-unlink').parent('.btn')),
                            scope,
                            notifyFor
                        );

                        var hiddenInputEl = element.children('input');

                        if (!attrs.widgetid && attrs.scopedatavalue) {
                            scope.$on('$destroy', scope.$watch('_model_', function (newVal) {
                                hiddenInputEl.val(newVal);
                                scope._onChange();
                            }));
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmRichtexteditor
 * @restrict E
 *
 * @description
 * The `wmRichtexteditor` directive defines a rich text editor widget. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=}  name
 *                   Name of the rich-text-editor widget.
 * @param {string=}  placeholder
 *                   Initial text in the rich-text-editor widget.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the rich-text-editor widget.
 * @param {string=} width
 *                  Width of the rich-text-editor widget.
 * @param {string=} height
 *                  Height of the rich-text-editor widget.
 * @param {string=} scopedatavalue
 *                  The script variable that contains the data to be displayed on rich-text-editor widget.
 * @param {string=} datavalue
 *                  This is the default value to  be displayed on rich-text-editor widget. <br>
 *                  Note that the display value is just what the user sees initially, and is not always the dataValue returned by the widget. <br>
 *                  This is a bindable property.
 * @param {boolean=} readonly
 *                   Selecting this checkbox property prevents the user from being able to change the data value of a widget. <br>
 *                   Default value: `false`.
 * @param {boolean=} show
 *                   This is a bindable property. <br>
 *                   This property will be used to show/hide the rich-text-editor widget on the web page. <br>
 *                   Default value: `true`.
 * @param {boolean=} showpreview
 *                   To show or hide the preview part of the rich-text-editor widget. <br>
 *                   Default value: `false`.
 * @param {string=}  on-change
 *                   Callback function which will be triggered when the widget value is changed.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <wm-composite>
 *                   <wm-label caption="Placeholder:"></wm-label>
 *                   <wm-text scopedatavalue="placeholder"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="Show:"></wm-label>
 *                   <wm-checkbox name="checkbox1" scopedatavalue="show" checked="checked"></wm-checkbox>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="Show Preview:"></wm-label>
 *                   <wm-checkbox name="checkbox1" scopedatavalue="preview"></wm-checkbox>
 *               </wm-composite>
 *               <wm-richtexteditor name="example-richtexteditor" show='{{show}}' placeholder='{{placeholder}}' showpreview='{{preview}}'>
 *               </wm-richtexteditor>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.show=true;
 *              $scope.placeholder = "Sample Text";
 *          }
 *       </file>
 *   </example>
 */
