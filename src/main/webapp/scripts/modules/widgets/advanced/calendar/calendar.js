/*global WM,_,moment */
/*Directive for Calendar */

WM.module('wm.widgets.advanced')
    .run(['$templateCache', 'Utils', '$rootScope', function ($tc, Utils, $rs) {
        'use strict';
        var isMobile = Utils.isMobile() || $rs.isMobileApplicationType;
        if (isMobile) {
            $tc.put('template/widget/calendar.html',
                '<div init-widget has-model apply-styles="shell" class="app-date">' +
                    '<uib-datepicker ng-model="_model_" ng-change="onModelUpdate(this);" ' +
                    'datepicker-options="mobileCalendarOptions"></uib-datepicker>' +
                '</div>');
        } else {
            $tc.put('template/widget/calendar.html',
                '<div class="app-calendar" init-widget has-model ng-model ="_model_"' +
                    ' ng-change="_onChange({$event: $event, $scope: this})" apply-styles="shell">' +
                    '<div ui-calendar="calendarOptions.calendar" calendar="{{name}}" ng-model="eventSources"></div>' +
                '</div>');
        }
    }])
    .directive('wmCalendar', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$compile',
        '$locale',
        'CONSTANTS',
        'Utils',
        '$rootScope',
        '$timeout',
        function (PropertiesFactory, WidgetUtilService, $compile, $locale, CONSTANTS, Utils, $rs, $timeout) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.calendar', ['wm.base', 'wm.base.datetime']),
                isMobile = $rs.isMobileApplicationType || Utils.isMobile(),
                notifyFor = isMobile ? {
                    'dataset'     : true
                } : {
                    'dataset'     : true,
                    'height'      : true,
                    'controls'    : true,
                    'calendartype': true,
                    'view'        : true,
                    'multiselect' : true
                },
                defaultHeaderOptions = {
                    'left'  : 'prev next today',
                    'center': 'title',
                    'right' : 'month basicWeek basicDay'
                },
                VIEW_TYPES = {
                    'BASIC' : 'basic',
                    'AGENDA': 'agenda'
                };

            /* datavalue property is removed from the calendar widget.*/
            if (!isMobile) {
                delete widgetProps.datavalue;
            }
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
            //to calculate the height for the event limit and parsing the value when it is percentage based.
            function calculateHeight(calendar, element) {
                var parentHeight      = element.parent().attr('height'),
                    elHeight          = element.attr('height'),
                    computedHeight;
                if (_.includes(elHeight, '%')) {
                    computedHeight = (parentHeight * Number(elHeight.replace(/\%/g, ''))) / 100;
                } else {
                    computedHeight = parseInt(elHeight, 10);
                }
                calendar.views.month.eventLimit = parseInt(computedHeight / 200, 10) + 1;
                return computedHeight;
            }

            function triggerCalendarChange(scope) {
                var modelVal = scope._model_;
                scope.prepareCalendarEvents();
                //change the model so that the view is rendered again with the events , after the dataset is changed.
                scope._model_ = modelVal ? new Date(modelVal) : new Date();
                scope.onViewrender({$scope: scope});
                scope.onEventrender({$scope: scope, $data: scope.eventData});
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(scope, element, key, newVal) {
                var calendar = scope.calendarOptions && scope.calendarOptions.calendar,
                    eleScope = element.scope(),
                    variable = Utils.getVariableName(scope, eleScope);
                switch (key) {
                case 'dataset':
                    if (isMobile) {
                        triggerCalendarChange(scope);
                        return;
                    }
                    scope.eventSources.length = 0;
                    if (CONSTANTS.isRunMode || (variable && eleScope.Variables[variable].category !== 'wm.ServiceVariable')) {
                        newVal = WM.isArray(newVal) ? newVal : [];
                        if (_.intersection(_.keys(newVal[0]), ['allDay', 'start', 'end']).length === 3) {
                            scope.eventSources.push(newVal);
                        }
                    }
                    break;
                case 'height':
                    calendar.height = calculateHeight(calendar, element);
                    break;
                case 'controls':
                case 'calendartype':
                    if (!isMobile) {
                        updateCalendarOptions(scope);
                    }
                    break;
                case 'view':
                    if (isMobile) {
                        return;
                    }
                    if (newVal !== 'month') {
                        calendar.defaultView = scope.calendartype + _.capitalize(newVal);
                    } else {
                        calendar.defaultView = newVal;
                    }
                    break;
                case 'multiselect':
                    calendar.selectable = newVal;
                    break;
                }
            }

            /**
             * Returns the data-type for properties in the widget.
             * Pushes the meta data against these types in $rs.dataTypes, as $rs.dataTypes will be referred for the data-types returned.
             * @param $is
             * @param prop
             * @returns {*}
             */
            function getPropertyType($is, prop) {
                var type,
                    types = $rs.dataTypes;

                switch (prop) {
                case 'selecteddates':
                case 'currentview':
                    type = $is.widgettype + '_' + prop;
                    types[type] = {
                        'fields': {
                            'start': {
                                'type': 'date, datetime, number, string'
                            },
                            'end': {
                                'type': 'date, datetime, number, string'
                            }
                        }
                    };
                    break;
                }
                return type;
            }

            return {
                'restrict': 'E',
                'replace': true,
                'scope': {
                    'scopedataset'  : '=?',
                    'onEventdrop'   : '&',
                    'onEventresize' : '&',
                    'onEventclick'  : '&',
                    'onViewrender'  : '&',
                    'onSelect'      : '&',
                    'onEventrender' : '&'
                },
                'template': function (tElement, tAttrs) {
                    var template    = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/calendar.html', tElement, tAttrs));
                    /*Set name for the model-holder, to ease submitting a form*/
                    template.find('.model-holder').attr('name', tAttrs.name);
                    if (tAttrs.hasOwnProperty('disabled')) {
                        template.find('datepicker').attr('date-disabled', true);
                    }

                    return template[0].outerHTML;
                },
                'link': {
                    'pre': function (scope) {
                        scope.widgetProps   = widgetProps;
                        scope.events        = [];
                        scope.eventSources  = [scope.events];
                    },
                    'post': function (scope, element, attrs) {
                        var handlers            = [],
                            headerOptions       = Utils.getClonedObject(defaultHeaderOptions),
                            oldData,
                            multipleEventClass  = 'app-calendar-event',
                            doubleEventClass    = multipleEventClass + ' two',
                            singleEventClass    = multipleEventClass + ' one',
                            dateFormat          = 'YYYY/MM/DD',
                            wp = scope.widgetProps;
                        //returns the custom class for the events depending on the length of the events for that day.
                        function getDayClass(data) {
                            var date = data.date,
                                mode = data.mode;
                            if (mode === 'day') {
                                var eventDay = moment(date).startOf('day').format(dateFormat),
                                    eventsLength;
                                if (!_.isEmpty(scope.eventData) && scope.eventData[eventDay]) {
                                    eventsLength = scope.eventData[eventDay].length;
                                    if (eventsLength === 1) {
                                        return singleEventClass;
                                    }
                                    if (eventsLength === 2) {
                                        return doubleEventClass;
                                    }
                                    return multipleEventClass;
                                }
                                return '';
                            }
                        }
                        function eventProxy(method, event, delta, revertFunc, jsEvent, ui, view) {
                            var fn = scope[method] || WM.noop;
                            fn({$event: jsEvent, $data: event, $delta: delta, $revertFunc: revertFunc, $ui: ui, $view: view});
                        }
                        function eventClickProxy(event, jsEvent, view) {
                            scope.onEventclick({$event: jsEvent, $data: event, $view: view});
                        }
                        function viewRenderProxy(view) {
                            scope.currentview = {start: view.start._d.getTime(), end: view.end._d.getTime()};
                            scope.onViewrender({$view: view});
                        }
                        function eventRenderProxy(event, jsEvent, view) {
                            /*unable to pass jsEvent in angular expression, hence ignoring*/
                            scope.onEventrender({$event: {}, $data: event, $view: view});
                        }
                        function setSelectedData(start, end) {
                            var filteredDates   = [],
                                dataset         = scope.dataset;
                            if (!dataset) {
                                return;
                            }
                            dataset = dataset.data || dataset;
                            _.forEach(dataset, function (value) {
                                if (!value.start) {
                                    return;
                                }
                                var eventDate   = moment(new Date(value.start)).format('MM/DD/YYYY'),
                                    startDate   = moment(new Date(start)).format('MM/DD/YYYY'),
                                    endDate     = moment(new Date(end)).format('MM/DD/YYYY'),
                                    eventExists = moment(eventDate).isSameOrAfter(startDate) && moment(eventDate).isBefore(endDate);
                                if (eventExists) {
                                    filteredDates.push(value);
                                }
                            });
                            return filteredDates;
                        }
                        function onSelectProxy(start, end, jsEvent, view) {
                            scope.selecteddates = {start: start._d.getTime(), end: end._d.getTime()};
                            scope.selecteddata  = setSelectedData(start, end);
                            scope.onSelect({$start: start._d.getTime(), $end: end._d.getTime(), $view: view, $data: scope.selecteddata});
                        }
                        function onEventdropProxy(event, delta, revertFunc, jsEvent, ui, view) {
                            scope.onEventdrop({$event: jsEvent, $newData: event, $oldData: oldData, $delta: delta, $revertFunc: revertFunc, $ui: ui, $view: view});
                        }
                        function onEventresizeProxy(event, delta, revertFunc, jsEvent, ui, view) {
                            scope.onEventresize({$event: jsEvent, $newData: event, $oldData: oldData, $delta: delta, $revertFunc: revertFunc, $ui: ui, $view: view});
                        }
                        function onEventChangeStart(event, jsEvent, ui, view) {
                            oldData = Utils.getClonedObject(event);
                        }

                        if (isMobile) {
                            scope.eventData = {};
                            wp.view.options = ['day', 'month', 'year'];
                            //prepare calendar Events
                            scope.prepareCalendarEvents = function () {
                                var eventDay;
                                scope.eventData = {};
                                if (!scope.dataset) {
                                    return;
                                }
                                scope.events = WM.isArray(scope.dataset) ? scope.dataset : (WM.isObject(scope.dataset) ? [scope.dataset] : []);
                                _.forEach(scope.events, function (event, index) {
                                    if (event.start) {
                                        eventDay = moment(event.start).startOf('day').format(dateFormat);
                                        if (scope.eventData[eventDay]) {
                                            scope.eventData[eventDay].push(event);
                                        } else {
                                            scope.eventData[eventDay] = [event];
                                        }
                                    }
                                });
                            };
                            //trigger on-select when the model is updated.
                            scope.onModelUpdate = function (eleScope) {
                                var selectedDate        = scope._model_ && moment(scope._model_).startOf('day').format(dateFormat),
                                    selectedEventData   = scope.eventData[selectedDate],
                                    start               = moment(scope._model_),
                                    end                 = moment(scope._model_).endOf('day');
                                scope.selecteddata = selectedEventData;
                                scope.onSelect({$start: start._d.getTime(), $end: end._d.getTime(), $view: eleScope, $scope: eleScope, $data: selectedEventData});
                                scope.onEventclick({$event: this, $data: selectedEventData, $view: eleScope});
                            };

                            scope.openCalendar = function () {
                                scope.isCalendarOpened = true;
                            };

                            scope.isCalendarOpened = false;

                            scope.mobileCalendarOptions = {
                                'showWeeks'     : false,
                                'customClass'   : getDayClass,
                                'datepickerMode': scope.view
                            };
                        } else {
                            scope.calendarOptions = {
                                calendar: {
                                    'height'          : parseInt(scope.height, 10),
                                    'editable'        : true,
                                    'selectable'      : false,
                                    'header'          : headerOptions,
                                    'eventDrop'       : onEventdropProxy,
                                    'eventResizeStart': onEventChangeStart,
                                    'eventDragStart'  : onEventChangeStart,
                                    'eventResize'     : onEventresizeProxy,
                                    'eventClick'      : eventClickProxy,
                                    'select'          : onSelectProxy,
                                    'eventRender'     : eventRenderProxy,
                                    'viewRender'      : viewRenderProxy,
                                    'dayNames'        : $locale.DATETIME_FORMATS.DAY,
                                    'dayNamesShort'   : $locale.DATETIME_FORMATS.SHORTDAY,
                                    'views'           : {
                                        'month': {
                                            'eventLimit': 0
                                        }
                                    }
                                }
                            };
                            scope.$root.$on('locale-change', function () {
                                scope.calendarOptions.calendar.dayNames      = $locale.DATETIME_FORMATS.DAY;
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

                            scope.$on('$destroy', function () {
                                handlers.forEach(Utils.triggerFn);
                            });

                            scope.redraw = function () {
                                $timeout(function () {
                                    element.children().first().fullCalendar('render');
                                });
                            };
                        }

                        // To be used by binding dialog to construct tree against exposed properties for the widget
                        scope.getPropertyType = getPropertyType.bind(undefined, scope);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (!attrs.widgetid && attrs.scopedataset) {
                            handlers.push(scope.$watch('scopedataset', function (newVal) {
                                scope.eventSources.push(newVal);
                            }, true));
                        }
                    }
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
            <div ng-controller="Ctrl" class="wm-app">
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
                $scope.placeholder = 'Select a date';
                $scope.f = function (event, scope) {
                    $scope.currentDate = scope.datavalue;
                }
                $scope.events = [
                    {
                        'title' : 'All Day Event',
                        'start' : 'Fri May 06 2015 00:00:00 GMT+0530 (India Standard Time)'
                    },
                    {
                        'title' : 'Long Event',
                        'start' : 'Fri May 04 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'end'   : 'Fri May 21 2015 00:00:00 GMT+0530 (India Standard Time)'
                    },
                    {
                        'id'    : 999,
                        'title' : 'Repeating Event',
                        'start' : 'Fri May 01 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'allDay': false
                    },
                    {
                        'id'    : 999,
                        'title' : 'Repeating Event',
                        'start' : 'Fri May 01 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'allDay': false
                    },
                    {
                        'title' : 'Birthday Party',
                        'start' : 'Fri May 06 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'end'   : 'Fri May 09 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'allDay': false
                    },
                    {
                        'title' : 'Click for Google',
                        'start' : 'Fri May 23 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'end'   : 'Fri May 24 2015 00:00:00 GMT+0530 (India Standard Time)',
                        'url'   : 'http://google.com/'
                    }
                ]
            }
        </file>
    </example>
 */
