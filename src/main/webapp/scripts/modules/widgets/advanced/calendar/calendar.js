/*global WM,_ */
/*Directive for Calendar */

WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/calendar.html',
                '<div class="app-calendar" init-widget has-model ' +
                    ' data-ng-model ="_model_" data-ng-show = "show"' +
                    ' data-ng-change="_onChange({$event: $event, $scope: this})" apply-styles="shell">' +
                    '<div ui-calendar="calendarOptions.calendar" calendar="{{name}}" ng-model="eventSources"></div>' +
                '</div>');
    }])
    .directive('wmCalendar', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$compile',
        '$locale',
        'CONSTANTS',
        'Utils',
        function (PropertiesFactory, WidgetUtilService, $compile, $locale, CONSTANTS, Utils) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.calendar', ['wm.base', 'wm.base.datetime']),
                notifyFor = {
                    'dataset': true,
                    'height': true,
                    'controls': true,
                    'calendartype': true,
                    'view': true,
                    'multiselect': true
                },
                defaultHeaderOptions = {
                    'left': 'prev next today',
                    'center': 'title',
                    'right': 'month basicWeek basicDay'
                },
                VIEW_TYPES = {
                    'BASIC': 'basic',
                    'AGENDA': 'agenda'
                };

            /* datavalue property is removed from the calendar widget.*/
            delete widgetProps.datavalue;
            function updateCalendarOptions(scope) {
                var ctrls = scope.controls, viewType = scope.calendartype, left = '', right = '',
                    regEx = new RegExp('\\bday\\b', 'g');
                if (ctrls && viewType) {
                    if (_.includes(ctrls, 'navigation')) {
                        left += ' prev next';
                    }

                    if (_.includes(ctrls, 'today')) {
                        left += ' today';
                    }

                    if (_.includes(ctrls, 'month')) {
                        right += ' month';
                    }

                    if (_.includes(ctrls, 'week')) {
                        right += viewType === VIEW_TYPES.BASIC ?  ' basicWeek' : ' agendaWeek';
                    }

                    if (regEx.test(ctrls)) {
                        right += viewType === VIEW_TYPES.BASIC ?  ' basicDay' : ' agendaDay';
                    }

                    WM.extend(scope.calendarOptions.calendar.header, {'left': left, 'right': right});
                }
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(scope, key, newVal) {
                var calendar = scope.calendarOptions.calendar;
                switch (key) {
                case 'dataset':
                    scope.eventSources.length = 0;
                    newVal = WM.isObject(newVal) ? newVal : {};
                    scope.eventSources.push(newVal);
                    break;
                case 'height':
                    calendar.height = parseInt(newVal, 10);
                    break;
                case 'controls':
                case 'calendartype':
                    updateCalendarOptions(scope);
                    break;
                case 'view':
                    if (newVal !== 'month') {
                        calendar.defaultView = scope.calendartype + _.capitalize(newVal);
                    } else {
                        calendar.defaultView = newVal;
                    }
                    break;
                case 'multiselect':
                    scope.calendarOptions.calendar.selectable = newVal;
                    break;
                }
            }

            return {
                'restrict': 'E',
                'replace': true,
                'scope': {
                    "scopedataset": '=?',
                    "onEventdrop": "&",
                    "onEventresize": "&",
                    "onEventclick": "&",
                    "onViewrender": "&",
                    "onSelect": "&",
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
                            var handlers = [],
                                headerOptions = WM.copy(defaultHeaderOptions),
                                uiCalScope;

                            function eventProxy(method, event, delta, revertFunc, jsEvent, ui, view) {
                                var fn = scope[method] || WM.noop;
                                fn({$event: event, $delta: delta, $revertFunc: revertFunc, $jsEvent: jsEvent, $ui: ui, $view: view});
                            }
                            function eventClickProxy(event, jsEvent, view) {
                                scope.onEventclick({$event: event, $jsEvent: jsEvent, $view: view});
                            }
                            function viewRenderProxy(view) {
                                scope.currentview = {start: view.start._d.getTime(), end: view.end._d.getTime()};
                                scope.onViewrender({$view: view});
                            }
                            function eventRenderProxy(event, jsEvent, view) {
                                /*unable to pass jsEvent in angular expression, hence ignoring*/
                                scope.onEventrender({$event: event, jsEvent: {}, $view: view});
                            }
                            function onSelectProxy(start, end, jsEvent, view) {
                                scope.selecteddates = {start: start._d.getTime(), end: end._d.getTime()};
                                scope.onSelect({$start: start.getTime(), $end: end.getTime(), $view: view});
                            }
                            scope.calendarOptions = {
                                calendar: {
                                    height: parseInt(scope.height, 10),
                                    editable: true,
                                    selectable: false,
                                    header: headerOptions,
                                    eventDrop: eventProxy.bind(undefined, 'onEventdrop'),
                                    eventResize: eventProxy.bind(undefined, 'onEventresize'),
                                    eventClick: eventClickProxy,
                                    select: onSelectProxy,
                                    eventRender: eventRenderProxy,
                                    viewRender: viewRenderProxy,
                                    dayNames: $locale.DATETIME_FORMATS.DAY,
                                    dayNamesShort: $locale.DATETIME_FORMATS.SHORTDAY
                                }
                            };
                            scope.$root.$on('locale-change', function () {
                                scope.calendarOptions.calendar.dayNames = $locale.DATETIME_FORMATS.DAY;
                                scope.calendarOptions.calendar.dayNamesShort = $locale.DATETIME_FORMATS.SHORTDAY;
                            });

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
                            scope.eventRender = function (event, element) {
                                element.attr({'tooltip': event.title, 'tooltip-append-to-body': true});
                                $compile(element)(scope);
                            };
                            if (CONSTANTS.isRunMode) {
                                if (attrs.scopedataset) {
                                    handlers.push(scope.$watch('scopedataset', function (newVal) {
                                        scope.eventSources.push(newVal);
                                    }, true));
                                }
                                // find the isolateScope of the ui-calendar element
                                uiCalScope = element.children().first().isolateScope();
                                // define the redraw method. Accordion/tabs will trigger this
                                scope.redraw = _.debounce(function () {
                                    // destroy the calendar and re-initialize
                                    uiCalScope.destroy();
                                    uiCalScope.init();
                                }, 50);
                            }

                            scope.$on('$destroy', function () {
                                handlers.forEach(Utils.triggerFn);
                            });

                            scope.redraw = function () {
                                element.children().first().fullCalendar('render');
                            };
                            /* register the property change handler */
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

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
 * @param {string=} currentview
 *                  This property has two sub properties start and end. <br>
 *                  start is the first date in the calendar view.
 *                  end is the last date in the calendar view
 *                  This property is bindable
 * @param {string=} selecteddates
 *                  This property has two sub properties start and end. <br>
 *                  start is the first date in the selected dates.
 *                  end is the last date in selectd dates.
 *                  This property is bindable
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the widget on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} calendartype
 *                  This property specifies the type of the calendar widget. <br>
 *                  Possible Values: `basic`, `agenda` <br>
 *                  Default value: `basic`.
 * @param {string=} controls
 *                  This property specifies the controls to be shown on the calendar widget calendar widget. <br>
 *                  Accepts string in CSV format. <br>
 *                  Possible Values: `navigation`, `today`, `month`, `week`, `day` <br>
 *                  By default all these controls will be shown.
 * @param {string=} view
 *                  This property specifies defaultView of the calendar widget. <br>
 *                  Possible Values: `month`, `week`, `day` <br>
 *                  Default value: `month`.
 * @param {string=} on-select
 *                  Callback function which will be triggered when multiple dates are selected. The callback comes with following parameters: <br>
 *                  start: date object for start date <br>
 *                  end: date object for end date <br>
 *                  view: consisting all the properties related to current view of a calendar.
 * @param {string=} on-viewrender
 *                  Callback function which will be triggered when calendar view is changed. The callback comes with following parameter: <br>
 *                  view: consisting all the properties related to current view of a calendar.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <div>Selected Date: {{currentDate | date:'medium'}}</div><br>
                    <wm-calendar name="calendar1"
                        on-change="f($event, $scope)"
                        placeholder="{{placeholder}}"
                        datepattern="{{datepattern}}">
                    </wm-calendar><br>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.placeholder="Select a date";
                $scope.f = function (event, scope) {
                    $scope.currentDate = scope.datavalue;
                }
                $scope.events = [
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
            }
        </file>
    </example>
 */
