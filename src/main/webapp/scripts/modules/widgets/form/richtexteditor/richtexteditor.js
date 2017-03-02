/*global WM, Event, _, document*/
/*Directive for richtexteditor */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($tc) {
        'use strict';
        $tc.put('template/widget/richtexteditor.html',
            '<div class="app-richtexteditor clearfix" init-widget has-model apply-styles role="input">' +
                '<div text-angular ng-model="_model_" ta-disabled="readonly" placeholder="Enter text"></div>' +
                '<div ta-bind ng-model="_model_" class="ta-preview" ng-if="showpreview"></div>' +
                '<input class="model-holder ng-hide" ng-disabled="disabled">' +
            '</div>'
            );
    }])
    .directive('wmRichtexteditor', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        '$injector',
        'Utils',

        function (PropertiesFactory, $tc, WidgetUtilService, $injector, Utils) {
            'use strict';

            // Specific to textAngular.
            // Returns the cssRule corresponding to the placeholder
            function getRule(el) {
                var id = el.find('[contenteditable]').attr('id'),
                    rule;

                if (id) {
                    WM.element(document.head)
                        .find('style:not([id]):empty')
                        .each(function () {
                            var _rules = this.sheet.cssRules || this.sheet.rules;

                            _.forEach(_rules, function (_rule) {
                                if (_.includes(_rule.cssText, '#' + id)) {
                                    rule = _rule.style;
                                    return false;
                                }
                            });
                            if (rule) {
                                return false;
                            }
                        });
                }
                return rule || {};
            }

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.richtexteditor', ['wm.base']),
                notifyFor = {
                    'placeholder': true,
                    'showpreview': true
                },
                taApplyCustomRenderers;

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, $taEl, key, nv) {
                switch (key) {
                // placehodler for the textAngular works with the pseudo clasess (:before).
                // To update the placeholder dynamically, get a reference to the cssRule and update the content property with the new placeholder
                case 'placeholder':
                    if (!$is._rule) {
                        $is._rule = getRule($taEl);
                    }

                    $is._rule.content = '"' + nv + '"';

                    break;
                case 'showpreview':
                    $is.showpreview = nv;
                    break;
                }
            }

            function getCursorPosition() {
                var selection,
                    retObj,
                    taSelection;

                taSelection = $injector.get('taSelection');

                try {
                    selection  = taSelection.getSelection();
                    retObj     = {
                        'start': selection.start.offset,
                        'end'  : selection.end.offset
                    };
                } catch (e) {
                    retObj = {};
                }
                return retObj;
            }

            return {
                'restrict': 'E',
                'scope': {},
                'replace': true,
                'template': function (tElement, tAttrs) {
                    var template = WM.element($tc.get('template/widget/richtexteditor.html'));
                    /*Set name for the model-holder, to ease submitting a form*/
                    template.find('.model-holder').attr('name', tAttrs.name);
                    return template[0].outerHTML;
                },
                'link': {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(
                            propertyChangeHandler.bind(undefined, $is, $el.children().first()),
                            $is,
                            notifyFor
                        );

                        var hiddenInputEl = $el.children('input'),
                            ngModelCtrl;

                        if (!attrs.widgetid && attrs.scopedatavalue) {
                            $is.$on('$destroy', $is.$watch('_model_', function (newVal) {
                                hiddenInputEl.val(newVal);
                            }));
                        }

                        ngModelCtrl = $el.children('[text-angular]').controller('ngModel');
                        ngModelCtrl.$viewChangeListeners.push(function () {
                            if (!taApplyCustomRenderers) {
                                taApplyCustomRenderers = $injector.get("taApplyCustomRenderers");
                            }
                            $is.htmlcontent = taApplyCustomRenderers($is.datavalue);
                            $is._onChange(new Event('change'));
                        });

                        /*Called from form reset when users clicks on form reset*/
                        $is.reset = function () {
                            //TODO implement custom reset logic here
                            $is._model_ = '';
                        };

                        $is.getCursorPosition  = getCursorPosition;

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmRichtexteditor
 * @restrict E
 *
 * @description
 * The `wmRichtexteditor` directive defines a rich text editor widget. <br>
 *
 * <strong>method:</strong> <em>getCursorPosition</em> <br>
 * Returns the position of the cursor if the cursor is inside the editor. <br>
 * Returned object contains the start and end offsets. <br>
 * ```js
 * var position = widget.getCursorPosition(); // widget is the isolateScope of the richTextEditor widget.
 * // In run mode widgets can be accessed as -- $scope.Widgets._widgetName_
 * console.log(position); // prints {start: 4, end: 10}
 * ```
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
 * @param {string=} htmlcontent
 *                  This is the output value of rich-text-editor widget. <br>
 *                  This is the non-sanitized output of the widget. Includes iframe html content.<br>
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-composite>
                    <wm-label caption="Placeholder:"></wm-label>
                    <wm-text scopedatavalue="placeholder"></wm-text>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="Show:"></wm-label>
                    <wm-checkbox name="checkbox1" scopedatavalue="show" checked="checked"></wm-checkbox>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="Show Preview:"></wm-label>
                    <wm-checkbox name="checkbox1" scopedatavalue="preview"></wm-checkbox>
                </wm-composite>
                <wm-richtexteditor name="example-richtexteditor" show='{{show}}' placeholder='{{placeholder}}' showpreview='{{preview}}'>
                </wm-richtexteditor>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.show=true;
               $scope.placeholder = "Sample Text";
           }
        </file>
    </example>
 */
