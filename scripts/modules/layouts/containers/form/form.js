/*global WM*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/container/form.html',
                '<form role="form" init-widget class="panel app-form" ng-class="[captionAlignClass, captionPositionClass, formClassName]"' +
                ' autocomplete="autocomplete" ' + $rootScope.getWidgetStyles('container') +
                ' ><div class="panel-heading" data-ng-if="title"><h4 class="form-header panel-title">{{title}}</h4></div>' +
                    '<div class="form-body panel-body" wmtransclude></div>' +
                    '</form>'
            );
    }])
    .directive('wmForm', ['PropertiesFactory', 'WidgetUtilService', '$compile', function (PropertiesFactory, WidgetUtilService, $compile) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.form', ['wm.layouts', 'wm.base.events.touch']),
            notifyFor = {
                'captionsize': true,
                'novalidate': true,
                'autocomplete': true,
                'submitbutton': true,
                'resetbutton': true,
                'captionalign': true,
                'captionposition': true,
                'method': true,
                'action': true
            },
            submitBtnTemplate = '<wm-button class="form-submit" type="submit" caption="submit"></wm-button>';

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            var value, resetBtnTemplate;
            switch (key) {
            case 'captionsize':
                element.find('.form-group .app-label.ng-isolate-scope').each(function () {
                    WM.element(this).isolateScope().width = newVal;
                });
                break;
            case 'captionalign':
                scope.captionAlignClass = "align-"+ newVal;
                break;
            case 'captionposition':
                scope.captionPositionClass = "position-"+ newVal;
                break;
            case 'novalidate':
                if (newVal === true || newVal === 'true') {
                    element.attr('novalidate', '');
                } else {
                    element.removeAttr('novalidate');
                }
                break;
            case 'autocomplete':
                value = (newVal === true || newVal === 'true') ? 'on' : 'off';
                element.attr(key, value);
                break;
            case 'submitbutton':
                if (newVal === true || newVal === 'true') {
                    element.append($compile(submitBtnTemplate)(scope));
                } else {
                    element.find('.form-submit').remove();
                }
                break;
            case 'resetbutton':
                if (newVal === true || newVal === 'true') {
                    resetBtnTemplate = $compile('<wm-button class="reset-submit" type="reset" caption="reset" ' + (!scope.widgetid ? 'on-click="resetForm();"' : '') + ' ></wm-button>')(scope);
                    element.append(resetBtnTemplate);
                } else {
                    element.find('.reset-submit').remove();
                }
                break;
            case 'method':
                scope.widgetProps.enctype.show = newVal === 'post';
                break;
            case 'action':
                attrs.$set('action', newVal);
                break;
            }
        }

        function resetForm(element) {
            //Clear the html content from the widgets(file upload, rich text editor) after reset
            element.find('.app-files-upload-status, .app-richtexteditor [ng-model]').empty();
        }

        function bindEvents(scope, element) {
            element.on('submit', function (event) {
                if (scope.onSubmit) {
                    /*SerializeArray method doesn't give type file inputs, handle them separately and add them to the array*/
                    var fileTypeInputs = element.find('[type=file]'),
                        serializedArray = element.serializeArray(),
                        files;
                    if (fileTypeInputs.length > 0) {
                        WM.forEach(fileTypeInputs, function (input) {
                            files = input.files;
                            serializedArray.push({name: input.name, value: files});
                        })
                    }
                    return scope.onSubmit({$event: event, $scope: scope, $formData: serializedArray});
                }
            });
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/container/form.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        scope.layoutObj = {
                            'One Column': 1,
                            'Two Column': 2,
                            'Three Column': 3,
                            'Four Column': 4
                        };
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);

                        if (!scope.widgetid) {
                            bindEvents(scope, element);
                            scope.resetForm = resetForm.bind(undefined, element);
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmForm
 * @restrict E
 *
 * @description
 * The 'wmForm' directive defines a form in the layout.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $compile
 *
 * @param {string=} captionalign
 *                  Defines the alignment of the caption elements of widgets inside the form.<br>
 *                  Default value for captionalign is `left`.
 * @param {string=} captionposition
 *                  Defines the position of the caption elements of widgets inside the form.<br>
 *                  Default value for captionposition is `left`.
 * @param {string=} autocomplete
 *                  Sets autocomplete for the form.
 *                  Default value for autocomplete is `on`.
 * @param {string=} action
 *                  Sets action for the form.
 * @param {string=} method
 *                  Sets method for the form.
 * @param {string=} invalidate
 *                  Sets invalidate option for the form.
 * @param {string=} submitbutton
 *                  Adds a submit button to the form.
 * @param {string=} resetbutton
 *                  Adds a reset button to the form.
 * @param {string=} on-submit
 *                  Callback function for `submit` event.
 * @param {string=} on-swipeup
 *                  Callback function for `swipeup` event.
 * @param {string=} on-swipedown
 *                  Callback function for `swipedown` event.
 * @param {string=} on-swiperight
 *                  Callback function for `swiperight` event.
 * @param {string=} on-swipeleft
 *                  Callback function for `swipeleft` event.
 * @param {string=} on-pinchin
 *                  Callback function for `pinchin` event.
 * @param {string=} on-pinchdown
 *                  Callback function for `pinchdown` event.
 *
 *
 * @example
 <example module="wmCore">
     <file name="index.html">
         <wm-form>
             <wm-composite widget="text">
                 <wm-label></wm-label>
                 <wm-text></wm-text>
             </wm-composite>
             <wm-composite widget="textarea">
                 <wm-label></wm-label>
                 <wm-textarea></wm-textarea>
             </wm-composite>
         </wm-form>
     </file>
 </example>
 */
