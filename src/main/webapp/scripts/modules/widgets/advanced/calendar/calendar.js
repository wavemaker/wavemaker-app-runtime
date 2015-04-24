/*global WM, */
/*Directive for Calendar */

WM.module('wm.widgets.advanced')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/calendar.html',
                '<div class="app-calendar" init-widget has-model ' +
                    ' data-ng-model ="_model_" data-ng-show = "show"' +
                    ' data-ng-change="_onChange({$event: $event, $scope: this})" ' + $rootScope.getWidgetStyles("shell") +  '>' +
                    '<div ui-calendar="calendarOptions.calendar" calendar="{{name}}" ng-model="eventSources"></div>' +
                '</div>');
    }])
    .directive('wmCalendar', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$compile',
        '$locale',
        function (PropertiesFactory, WidgetUtilService, $compile, $locale) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.calendar', ['wm.base', 'wm.base.datetime']),
                notifyFor = {
                    'dataset': true,
                    'height': true
                };

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(element, scope, key, newVal) {
                switch (key) {
                case 'dataset':
                    scope.eventSources.push(newVal);
                    break;
                case 'height':
                    scope.calendarOptions.calendar.height = parseInt(newVal, 10);
                    break;
                }
            }

            return {
                'restrict': 'E',
                'replace': true,
                'scope': {
                    "onDayclick": "&",
                    "onEventdrop": "&",
                    "onEventresize": "&",
                    "onEventclick": "&",
                    "onEventrender": "&"
                },
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
                            scope.events = [];
                            scope.eventSources = [scope.events];
                        },
                        'post': function (scope, element, attrs) {
                            scope.onEventClickProxy = function (event, delta, revertFunc, jsEvent, ui, view) {
                                scope.onEventclick({$event: event, $delta: delta, $revertFunc: revertFunc, $jsEvent: jsEvent, $ui : ui, $view: view});
                            };
                            scope.calendarOptions = {
                                calendar: {
                                    height: parseInt(scope.height, 10),
                                    editable: true,
                                    header: {
                                        left: 'month basicWeek basicDay agendaWeek agendaDay',
                                        center: 'title',
                                        right: 'today prev,next'
                                    },
                                    dayClick: scope.onDayclick,
                                    eventDrop: scope.onEventdrop,
                                    eventResize: scope.onEventresize,
                                    eventClick: scope.onEventClickProxy,
                                    eventRender: scope.onEventrender,
                                    dayNames: $locale.DATETIME_FORMATS.DAY,
                                    dayNamesShort: $locale.DATETIME_FORMATS.SHORTDAY
                                }
                            };
                            scope.$root.$on('locale-change', function () {
                                scope.calendarOptions.calendar.dayNames = $locale.DATETIME_FORMATS.DAY;
                                scope.calendarOptions.calendar.dayNamesShort = $locale.DATETIME_FORMATS.SHORTDAY;
                            });


                            /* event source that calls a function on every view switch */
                          /*  scope.eventsF = function (start, end, timezone, callback) {
                                if (scope.eventsFunction) {
                                    callback(scope.eventsFunction(start, end, timezone));
                                }
                            };*/

                            /* add and removes an event source of choice */
                            scope.addRemoveEventSource = function (sources, source) {
                                var canAdd = 0;
                                WM.forEach(sources, function (value, key) {
                                    if (sources[key] === source) {
                                        sources.splice(key, 1);
                                        canAdd = 1;
                                    }
                                });
                                if (canAdd === 0) {
                                    sources.push(source);
                                }
                            };
                            /* add custom event*/
                            scope.addEvent = function (eventObject) {
                                scope.events.push(eventObject);
                            };
                            /* remove event */
                            scope.remove = function (index) {
                                scope.events.splice(index, 1);
                            };
                            /* Change View */
                            /*scope.changeView = function (view, calendar) {
                            };*/

                            /* Render Tooltip */
                            scope.eventRender = function (event, element, view) {
                                element.attr({'tooltip': event.title,
                                    'tooltip-append-to-body': true});
                                $compile(element)(scope);
                            };

                            /* register the property change handler */
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element, scope), scope, notifyFor);

                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
                }
            };
        }
    ]);


/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCalendar
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
 *              $scope.events = [
                                  {
                                    "title": "All Day Event",
                                    "start": "Fri May 06 2015 00:00:00 GMT+0530 (India Standard Time)"
                                  },
                                  {
                                    "title": "Long Event",
                                    "start": "Fri May 04 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "end": "Fri May 21 2015 00:00:00 GMT+0530 (India Standard Time)"
                                  },
                                  {
                                    "id": 999,
                                    "title": "Repeating Event",
                                    "start": "Fri May 01 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "allDay": false
                                  },
                                  {
                                    "id": 999,
                                    "title": "Repeating Event",
                                    "start": "Fri May 01 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "allDay": false
                                  },
                                  {
                                    "title": "Birthday Party",
                                    "start": "Fri May 06 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "end": "Fri May 09 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "allDay": false
                                  },
                                  {
                                    "title": "Click for Google",
                                    "start": "Fri May 23 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "end": "Fri May 24 2015 00:00:00 GMT+0530 (India Standard Time)",
                                    "url": "http://google.com/"
                                  }
                                ]
 *           }
 *       </file>
 *   </example>
 */