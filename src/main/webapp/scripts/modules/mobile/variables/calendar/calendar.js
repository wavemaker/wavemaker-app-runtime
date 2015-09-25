/*global WM, _*/
WM.module('wm.variables').run(['DeviceVariableService', '$cordovaCalendar', function (DeviceVariableService, $cordovaCalendar) {
    "use strict";
    var event = {
            title: '',
            message: '',
            location: '',
            startDate: '',
            endDate: ''
        },
        parseDate = function (dateStr, defaultDate) {
            return (dateStr && dateStr.length > 0) ? new Date(dateStr) : defaultDate;
        },
        defaultStartDate = new Date(new Date().getTime() - (3 * 30 * 24 * 60 * 60 * 1000)), // 3 months previous date
        defaultEndDate = new Date(new Date().getTime() + (3 * 30 * 24 * 60 * 60 * 1000)),   // 3 months later date
        operations = {
            createEvent: {
                properties : ['eventTitle', 'eventNotes', 'eventLocation', 'eventStart', 'eventEnd'],
                invoke : function (variable, options, success, error) {
                    var createEventOptions = {
                        title: variable.eventTitle,
                        location: variable.eventLocation,
                        notes: variable.eventNotes,
                        startDate: variable.eventStart,
                        endDate: variable.eventEnd
                    };
                    $cordovaCalendar.createEvent(createEventOptions).then(success, error);
                }
            },
            deleteEvent: {
                properties : ['eventTitle', 'eventLocation', 'eventNotes', 'eventStart', 'eventEnd'],
                invoke : function (variable, options, success, error) {
                    var removeEventOptions = {
                        newTitle: variable.eventTitle,
                        location: variable.eventLocation,
                        notes: variable.eventNotes,
                        startDate: variable.eventStart,
                        endDate: variable.eventEnd
                    };
                    $cordovaCalendar.deleteEvent(removeEventOptions).then(success, error);
                }
            },
            getEvents: {
                model : [event],
                properties : ['eventTitle', 'eventLocation', 'eventNotes', 'eventStart', 'eventEnd', 'startUpdate'],
                invoke : function (variable, options, success, error) {
                    var listEventOptions = {
                        title: variable.eventTitle,
                        location: variable.eventLocation,
                        notes: variable.eventNotes,
                        startDate: parseDate(variable.eventStart, defaultStartDate),
                        endDate: parseDate(variable.eventEnd, defaultEndDate)
                    };
                    $cordovaCalendar.findEvent(listEventOptions).then(success, error);
                }
            }
        };

    WM.forEach(operations, function (value, key) {
        DeviceVariableService.addOperation('calendar', key, value);
    });
}]);