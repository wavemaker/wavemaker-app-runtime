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
                properties : [
                    {"target": "eventTitle", "type": "string", "dataBinding": true},
                    {"target": "eventNotes", "type": "string", "dataBinding": true},
                    {"target": "eventLocation", "type": "string", "dataBinding": true},
                    {"target": "eventStart", "type": "string", "dataBinding": true},
                    {"target": "eventEnd", "type": "string", "dataBinding": true},
                    {"target": "recurringEvent", "type": "boolean", "dataBinding": true},
                    {"target": "recurringEventFrequency", "type": "string", "dataBinding": true}
                ],
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
                properties : [
                    {"target": "eventTitle", "type": "string", "dataBinding": true},
                    {"target": "eventLocation", "type": "string", "dataBinding": true},
                    {"target": "eventNotes", "type": "string", "dataBinding": true},
                    {"target": "eventStart", "type": "string", "dataBinding": true},
                    {"target": "eventEnd", "type": "string", "dataBinding": true}
                ],
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
                properties : [
                    {"target": "eventTitle", "type": "string", "dataBinding": true},
                    {"target": "eventLocation", "type": "string", "dataBinding": true},
                    {"target": "eventNotes", "type": "string", "dataBinding": true},
                    {"target": "eventStart", "type": "string", "dataBinding": true},
                    {"target": "eventEnd", "type": "string", "dataBinding": true},
                    {"target": "startUpdate", "type": "boolean"}
                ],
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