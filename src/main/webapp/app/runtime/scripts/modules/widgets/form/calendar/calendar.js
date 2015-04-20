/*global WM, */
/*Directive for Calendar */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/calendar.html',
                '<div class="app-calendar" init-widget has-model ' +
                    ' data-ng-model ="_model_" data-ng-show = "show"' +
                    ' data-ng-change="_onChange({$event: $event, $scope: this})" ' + $rootScope.getWidgetStyles() + '>' +
                    '<datepicker show-weeks="true" class="well well-sm"></datepicker>' +
                    /*Holder for the model for submitting values in a form*/
                    '<input data-ng-disabled="disabled" class="model-holder ng-hide" data-ng-model="_model_">' +
                '</div>');
    }])
    .directive('wmCalendar', [
        '$filter',
        'PropertiesFactory',
        'WidgetUtilService',
        '$timeout',
        function ($filter, PropertiesFactory, WidgetUtilService, $timeout) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.calendar', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
                notifyFor = {
                    'disabled': true
                };

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(element, key, newVal) {
                switch (key) {
                case 'disabled':
                    if (newVal) {
                        element.find('button').prop('disabled', true);
                    } else {
                        element.find('button').removeAttr('disabled');
                    }
                    break;
                }
            }

            return {
                'restrict': 'E',
                'replace': true,
                'scope': {},
                'template': function (tElement, tAttrs) {
                    var template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/calendar.html', tElement, tAttrs));
                    /*Set name for the model-holder, to ease submitting a form*/
                    template.find('.model-holder').attr('name', tAttrs.name);
                    if (tAttrs.hasOwnProperty('disabled')) {
                        template.find('datepicker').attr('date-disabled', true);
                    }

                    return template[0].outerHTML;
                },
                'compile': function () {
                    return {
                        'pre': function (scope) {
                            scope.widgetProps = widgetProps;
                        },
                        'post': function (scope, element, attrs) {
                            if (scope.widgetid) {
                                $timeout(function () { // when the widget is inside canvas, update the datavalue after datepicker is compiled
                                    if ((!scope.datavalue && isNaN(Date.parse(scope.datavalue))) || scope.datavalue === 0) {
                                        scope._model_ = scope.datavalue = new Date();
                                    } else {
                                        scope._model_ = scope.datavalue = $filter('date')(scope.datavalue, scope.datepattern);
                                    }
                                }, undefined, false);
                            }

                            /* register the property change handler */
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);

                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
                }
            };
        }
    ]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmCalendar
 * @restrict E
 *
 * @description
 * The directive defines a calendar widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $filter
 * @requires WidgetUtilService
 * @requires $timeout
 *
 * @param {string=} name
 *                  Name of the calendar widget.
 * @param {string=} placeholder
 *                  Placeholder for the Calendar widget.
 * @param {string=} hint
 *                  Title/hint for the date <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of Calendar widget. <br>
 *                  Default value : 0
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the Calendar widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the current selected value of the Calendar widget. <br>
 *                  This property is bindable
 * @param {string=} datepattern
 *                  display pattern of dates. <br>
 *                  This property is bindable.
 *@param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`.
 * @param {boolean=} autofocus
 *                   This property makes the Calendar widget get focused automatically when the page loads.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the widget on the web page. <br>
 *                  Default value: `true`.
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
 * @param {string=} on-mouseenter
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>Selected Date: {{currentDate | date:'medium'}}</div><br>
 *               <wm-calendar name="calendar1"
 *                   on-change="f($event, $scope)"
 *                   placeholder="{{placeholder}}"
 *                   datepattern="{{datepattern}}"
 *               </wm-calendar><br>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.placeholder="Select a date"
 *              $scope.datepattern="dd-MMMM-yyyy"
 *
 *              $scope.f = function (event, scope) {
 *                  $scope.currentDate = scope.datavalue;
 *              }
 *           }
 *       </file>
 *   </example>
 */