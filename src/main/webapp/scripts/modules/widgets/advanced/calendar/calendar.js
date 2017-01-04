/*global WM,_,moment */
/*Directive for Calendar */

WM.module('wm.widgets.advanced')
    .directive('wmCalendar', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$compile',
        '$locale',
        'CONSTANTS',
        'Utils',
        '$rootScope',
        '$timeout',
        '$templateCache',
        function (PropertiesFactory, WidgetUtilService, $compile, $locale, CONSTANTS, Utils, $rs, $timeout, $tc) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.calendar', ['wm.base', 'wm.base.datetime']),
                isMobile    = $rs.isMobileApplicationType || Utils.isMobile(),
                notifyFor   = isMobile ? {
                    'dataset'       : true,
                    'view'          : true
                } : {
                    'dataset'       : true,
                    'height'        : true,
                    'controls'      : true,
                    'calendartype'  : true,
                    'view'          : true,
                    'multiselect'   : true
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
            function updateCalendarOptions($is) {
                var ctrls = $is.controls, viewType = $is.calendartype, left = '', right = '',
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

                    WM.extend($is.calendarOptions.calendar.header, {'left': left, 'right': right});
                }
            }
            //to calculate the height for the event limit and parsing the value when it is percentage based.
            function calculateHeight(calendar, $el, $is) {
                var $parentEl    = $el.parent(),
                    parentHeight = $parentEl.css('height'),
                    elHeight     = $is.height,
                    computedHeight;
                if (_.includes(elHeight, '%')) {
                    if (_.includes(parentHeight, '%')) {
                        parentHeight = $parentEl.height();
                    }
                    computedHeight = (parseInt(parentHeight, 10) * Number(elHeight.replace(/\%/g, ''))) / 100;
                } else {
                    computedHeight = parseInt(elHeight, 10);
                }
                calendar.views.month.eventLimit = parseInt(computedHeight / 200, 10) + 1;
                return computedHeight;
            }

            function triggerCalendarChange($is) {
                var modelVal = $is._model_;
                $is.prepareCalendarEvents();
                //change the model so that the view is rendered again with the events , after the dataset is changed.
                $is._model_ = modelVal ? new Date(modelVal) : new Date();
                $is.onEventrender({$isolateScope: $is, $scope: $is, $data: $is.eventData});
            }

            function constructCalendarDataset($is, eventSource) {
                var properties = {title : $is.eventtitle,
                    allday      : $is.eventallday,
                    start       : $is.eventstart,
                    end         : $is.eventend,
                    className   : $is.eventclass
                    };
                _.forEach(eventSource, function (obj) {
                    _.mapKeys(properties, function (value, key) {
                        var objVal = _.get(obj, value);
                        if (key === 'start' || key === 'end') {
                            objVal = moment(objVal);
                        }
                        obj[key] = objVal;
                    });
                });
                return eventSource;
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, $el, key, newVal) {
                var calendar  = $is.calendarOptions && $is.calendarOptions.calendar,
                    eleScope  = $el.scope(),
                    eleIscope = $el.find('.uib-datepicker').isolateScope(),
                    variable  = Utils.getVariableName($is, eleScope),
                    eventSet = [],
                    dataSet;
                switch (key) {
                case 'dataset':
                    if (isMobile) {
                        triggerCalendarChange($is);
                        return;
                    }
                    $is.eventSources.length = 0;
                    if (CONSTANTS.isRunMode || (variable && eleScope.Variables[variable].category !== 'wm.ServiceVariable')) {
                        dataSet = Utils.getClonedObject(newVal.data || newVal);
                        dataSet = WM.isArray(dataSet) ? dataSet : WM.isObject(dataSet) ? [dataSet] : [];
                        dataSet = constructCalendarDataset($is, dataSet);
                        if (_.includes(_.keys(dataSet[0]), 'start')) {
                            _.forEach(dataSet, function (event) {
                                event.start = event.start || event.end;
                                if (event.start) {
                                    eventSet.push(event);
                                }
                            });
                            $is.eventSources.push(eventSet);
                        }
                    }
                    break;
                case 'height':
                    calendar.height = calculateHeight(calendar, $el, $is);
                    break;
                case 'controls':
                case 'calendartype':
                    updateCalendarOptions($is);
                    break;
                case 'view':
                    //For Mobile calendar view property should be set on uib element iscope
                    if (eleIscope && $is.widgetid) {
                        eleIscope.datepickerMode = newVal;
                        return;
                    }
                    if (!isMobile) {
                        if (newVal !== 'month') {
                            calendar.defaultView = $is.calendartype + _.capitalize(newVal);
                        } else {
                            calendar.defaultView = newVal;
                        }
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
                    if (isMobile) {
                        $tc.put('template/widget/calendar.html',
                            '<div init-widget has-model apply-styles="shell" class="app-date" listen-property="dataset" >' +
                                '<div uib-datepicker ng-model="_model_" ng-change="onModelUpdate(this);" datepicker-options="mobileCalendarOptions" apply-styles="inner-shell"></div>' +
                            '</div>');
                    } else {
                        $tc.put('template/widget/calendar.html',
                            '<div class="app-calendar" init-widget has-model ng-model ="_model_" listen-property="dataset"  ng-change="_onChange({$event: $event, $scope: this})" apply-styles="shell">' +
                                '<div ui-calendar="calendarOptions.calendar" calendar="{{name}}" ng-model="eventSources"></div>' +
                            '</div>');
                    }
                    var template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/calendar.html', tElement, tAttrs));
                    /*Set name for the model-holder, to ease submitting a form*/
                    template.find('.model-holder').attr('name', tAttrs.name);
                    if (tAttrs.hasOwnProperty('disabled')) {
                        template.find('datepicker').attr('date-disabled', true);
                    }

                    return template[0].outerHTML;
                },
                'link': {
                    'pre': function ($is) {
                        $is.widgetProps   = widgetProps;
                        $is.events = [];
                        $is.eventSources = [];
                    },
                    'post': function ($is, $el, attrs) {
                        var handlers            = [],
                            headerOptions       = Utils.getClonedObject(defaultHeaderOptions),
                            oldData,
                            multipleEventClass  = 'app-calendar-event',
                            doubleEventClass    = multipleEventClass + ' two',
                            singleEventClass    = multipleEventClass + ' one',
                            dateFormat          = 'YYYY/MM/DD',
                            wp                  = $is.widgetProps;

                        //returns the custom class for the events depending on the length of the events for that day.
                        function getDayClass(data) {
                            var date = data.date,
                                mode = data.mode,
                                eventDay,
                                eventsLength;
                            if (mode === 'day') {
                                eventDay = moment(date).startOf('day').format(dateFormat);
                                if (!_.isEmpty($is.eventData) && $is.eventData[eventDay]) {
                                    eventsLength = $is.eventData[eventDay].length;
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
                            var fn = $is[method] || WM.noop;
                            fn({$event: jsEvent, $data: event, $delta: delta, $revertFunc: revertFunc, $ui: ui, $view: view});
                        }
                        function eventClickProxy(event, jsEvent, view) {
                            $is.onEventclick({$event: jsEvent, $data: event, $view: view});
                        }
                        function viewRenderProxy(view) {
                            $is.currentview = {start: view.start.format(), end: view.end.format()};
                            $is.onViewrender({$view: view});
                        }
                        function eventRenderProxy(event, jsEvent, view) {
                            /*unable to pass jsEvent in angular expression, hence ignoring*/
                            $is.onEventrender({$event: {}, $data: event, $view: view});
                        }
                        function setSelectedData(start, end) {
                            var filteredDates   = [],
                                dataset         = $is.dataset;
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
                            $is.selecteddates = {start: start._d.getTime(), end: end._d.getTime()};
                            $is.selecteddata  = setSelectedData(start, end);
                            $is.onSelect({$start: start._d.getTime(), $end: end._d.getTime(), $view: view, $data: $is.selecteddata});
                        }
                        function onEventdropProxy(event, delta, revertFunc, jsEvent, ui, view) {
                            $is.onEventdrop({$event: jsEvent, $newData: event, $oldData: oldData, $delta: delta, $revertFunc: revertFunc, $ui: ui, $view: view});
                        }
                        function onEventresizeProxy(event, delta, revertFunc, jsEvent, ui, view) {
                            $is.onEventresize({$event: jsEvent, $newData: event, $oldData: oldData, $delta: delta, $revertFunc: revertFunc, $ui: ui, $view: view});
                        }
                        function onEventChangeStart(event, jsEvent, ui, view) {
                            oldData = Utils.getClonedObject(event);
                        }

                        function renderMobileView(viewObj) {
                            if (!viewObj) {
                                return;
                            }
                            $is.currentview = {start: moment(viewObj.date)._d.getTime(), end: moment(viewObj.date).add(1, 'month')._d.getTime()};
                            $is.onViewrender({$isolateScope: $is, $scope: $is, $view: $is.mobileCalendarOptions});
                        }

                        if (isMobile) {
                            $is.eventData = {};
                            //prepare calendar Events
                            $is.prepareCalendarEvents = function () {
                                var eventDay,
                                    dataset;
                                $is.eventData = {};
                                if (!$is.dataset) {
                                    return;
                                }
                                dataset = $is.dataset.data || $is.dataset;
                                dataset = WM.isArray(dataset) ? dataset : (WM.isObject(dataset) ? [dataset] : []);
                                $is.events = constructCalendarDataset($is, dataset);
                                _.forEach($is.events, function (event) {
                                    if (event.start) {
                                        eventDay = moment(event.start).startOf('day').format(dateFormat);
                                        if ($is.eventData[eventDay]) {
                                            $is.eventData[eventDay].push(event);
                                        } else {
                                            $is.eventData[eventDay] = [event];
                                        }
                                    }
                                });
                            };
                            //trigger on-select when the model is updated.
                            $is.onModelUpdate = function (eleScope) {
                                var selectedDate        = $is._model_ && moment($is._model_).startOf('day').format(dateFormat),
                                    selectedEventData   = $is.eventData[selectedDate],
                                    start               = moment($is._model_),
                                    end                 = moment($is._model_).endOf('day');
                                $is.selecteddata = selectedEventData;
                                $is.onSelect({$start: start._d.getTime(), $end: end._d.getTime(), $view: eleScope, $scope: $is, $isolateScope: $is, $data: selectedEventData});
                                if (selectedEventData) {
                                    $is.onEventclick({$event: this, $view: eleScope, $isolateScope: $is, $scope: $is, $data: selectedEventData});
                                }
                            };
                            /* Sets the calendar to refresh and also navigates to the date, if sent as param*/
                            $is.refresh = function (dtObj) {
                                dtObj = dtObj ? new Date(dtObj) : new Date($is._model_);
                                var isValid = !isNaN(dtObj.valueOf());
                                $is._model_ = isValid ? dtObj : new Date();
                                $rs.$safeApply($is);
                            };
                            $is.openCalendar = function () {
                                $is.isCalendarOpened = true;
                            };

                            $is.isCalendarOpened = false;

                            $is.mobileCalendarOptions = {
                                'showWeeks'     : false,
                                'customClass'   : getDayClass,
                                'datepickerMode': $is.view
                            };
                            //watch the child activeDt property which gives us the current month details.
                            if (CONSTANTS.isRunMode) {
                                $is.$on('$destroy', $is.$watch('$$childHead.activeDt', _.debounce(renderMobileView, 30), true));
                            }
                        } else {
                            $is.calendarOptions = {
                                calendar: {
                                    'height'          : parseInt($is.height, 10),
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

                            handlers.push($rs.$on('locale-change', function () {
                                $is.calendarOptions.calendar.dayNames      = $locale.DATETIME_FORMATS.DAY;
                                $is.calendarOptions.calendar.dayNamesShort = $locale.DATETIME_FORMATS.SHORTDAY;
                            }));

                            /* add and removes an event source of choice */
                            $is.addRemoveEventSource = function (sources, source) {
                                var canAdd = 0;
                                _.forEach(sources, function (value, key) {
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
                            $is.addEvent = function (eventObject) {
                                $is.events.push(eventObject);
                            };
                            /* remove event */
                            $is.remove = function (index) {
                                $is.events.splice(index, 1);
                            };
                            /* Change View */
                            /*scope.changeView = function (view, calendar) {
                             };*/
                            /* Render Tooltip */
                            $is.eventRender = function (event, el) {
                                el.attr({'tooltip': event.title, 'tooltip-append-to-body': true});
                                $compile(el)($is);
                            };

                            $is.$on('$destroy', function () {
                                handlers.forEach(Utils.triggerFn);
                            });

                            $is.redraw = function () {
                                $timeout(function () {
                                    $el.children().first().fullCalendar('render');
                                    propertyChangeHandler($is, $el, 'height');
                                }, undefined, false);
                            };
                        }

                        // To be used by binding dialog to construct tree against exposed properties for the widget
                        $is.getPropertyType = getPropertyType.bind(undefined, $is);
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el), $is, notifyFor);

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);

                        if (!isMobile) {
                            _.defer($is.redraw);
                        }

                        if (!attrs.widgetid && attrs.scopedataset) {
                            handlers.push($is.$watch('scopedataset', function (newVal) {
                                $is.eventSources.push(newVal);
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
