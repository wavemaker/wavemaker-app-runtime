/*global wm, WM, _, window, Connection*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.services
 * @requires $rootScope
 * @requires Varibales
 * @requires BaseVariablePropertyFactory
 * @requires MobileService
 * @description
 * The 'MobileService' is a wrapper over cardova. This acts as a integration point of Cardova API
 * and Wavemaker variables.
 */
wm.variables.services.MobileService = ['$cordovaContacts', '$cordovaNetwork', '$cordovaGeolocation', '$cordovaCamera', '$cordovaBarcodeScanner', function ($cordovaContacts, $cordovaNetwork, $cordovaGeolocation, $cordovaCamera, $cordovaBarcodeScanner) {
    "use strict";
    var event = {
            title: '',
            notes: '',
            loc: '',
            start: new Date(),
            end: new Date()
        };
    return {
        //TODO: Enable calendar variable after the cordova plugin is added.
        /*calendar : {
            //Ref: https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin
            addEvent: {
                model : {
                    data: ''
                },
                properties : ['eventTitle', 'eventNotes', 'eventLocation', 'eventStart', 'eventEnd'],
                invoke : function (variable, options, success, error) {
                    window.plugins.calendar.createEvent(variable.eventTitle,
                                                        variable.eventLocation,
                                                        variable.eventNotes,
                                                        variable.eventStart,
                                                        variable.eventEnd,
                                                        success,
                                                        error);
                }
            },
            removeEvent: {
                model : {
                    data: ''
                },
                properties : ['eventTitle', 'eventStart', 'eventEnd'],
                invoke : function (variable, options, success, error) {
                    window.plugins.calendar.deleteEvent(variable.eventTitle,
                                                        null,
                                                        null,
                                                        variable.eventStart,
                                                        variable.eventEnd,
                                                        success,
                                                        error);
                }
            },
            listEvents: {
                model : [event],
                properties : ['eventTitle', 'eventStart', 'eventEnd'],
                invoke : function (variable, options, success, error) {
                    window.plugins.calendar.findEvent(variable.eventTitle,
                                                        null,
                                                        null,
                                                        variable.eventStart,
                                                        variable.eventEnd,
                                                        success,
                                                        error);
                }
            },
        },*/
        contacts : {
            list : {
                model : [{
                    id: '',
                    displayName: '',
                    phoneNumbers: [{value : ''}]
                }],
                properties : ['startUpdate', 'contactFilter'],
                invoke : function (variable, options, success, error) {
                    var findOptions = {
                            filter : variable.contactFilter,
                            multiple : true,
                            fields:  ['displayName']
                        };
                    $cordovaContacts.find(findOptions).then(function(data) {
                        data = _.filter(data, function (c) {
                            return c.phoneNumbers && c.phoneNumbers.length > 0;
                        });
                        success(data);
                    });
                }
            }
        },
        device: {
            getConnectionType: {
                model: {
                    data : 'NONE'
                },
                properties : ['startUpdate'],
                invoke : function (variable, options, success, error) {
                    success({ data: $cordovaNetwork.getNetwork()});
                }
            },
            capturePicture: {
                model : {
                    data: 'resources/images/imagelists/default-image.png'
                },
                properties : ['allowImageEdit', 'imageQuality', 'imageEncodingType', 'correctOrientation'],
                invoke : function (variable, options, success, error) {
                    var cameraOptions = {
                        quality : variable.imageQuality,
                        destinationType : 1, //only file url
                        sourceType : 1, //camera
                        allowEdit : variable.allowImageEdit,
                        encodingType : parseInt(variable.imageEncodingType, 10),
                        mediaType : 0, //always picture
                        correctOrientation : variable.correctOrientation
                    };
                    $cordovaCamera.getPicture(cameraOptions).then(function (data) {
                        success({ data : data});
                    }, error);
                }
            },
            getGeoLocation : {
                model: {
                    coords: {
                        latitude: 0,
                        longitude: 0,
                        altitude: 0,
                        accuracy: 0,
                        altitudeAccuracy: 0,
                        heading: 0,
                        speed: 0
                    },
                    timestamp: 0
                },
                properties : ['startUpdate', 'geolocationHighAccuracy', 'geolocationMaximumAge', 'geolocationTimeout'],
                invoke: function (variable, options, success, error) {
                    var geoLocationOptions = {
                        maximumAge: variable.geolocationMaximumAge * 1000,
                        timeout: variable.geolocationTimeout * 1000,
                        enableHighAccuracy: variable.geolocationHighAccuracy
                    };
                    $cordovaGeolocation.getCurrentPosition(geoLocationOptions).then(success, error);
                }
            }
        },
        scan : {
            scanBarCode : {
                model: {
                    data : {
                        text : 'BAR CODE',
                        format : "TEXT",
                        cancelled : false,
                    },
                },
                properties : [],
                invoke: function (variable, options, success, error) {
                    $cordovaBarcodeScanner.scan().then(function (data) {
                        success({data : data})
                    }, error);
                }
            }
        }
    };
}];

/**
 * @ngdoc service
 * @name wm.variables.services
 * @requires $rootScope
 * @requires Varibales
 * @requires Utils
 * @requires BaseVariablePropertyFactory
 * @requires MobileService
 * @description
 * The 'MobileVariableService' provides methods to work with Mobile API.
 */
wm.variables.services.MobileVariableService = ['$rootScope', 'Variables', 'Utils', 'BaseVariablePropertyFactory', 'MobileService', 'CONSTANTS',
    function ($rootScope, Variables, Utils, BaseVariablePropertyFactory, MobileService, CONSTANTS) {
        "use strict";
        var initiateCallback = Variables.initiateCallback;

        function getCallBackScope(variable, options) {
            /* get the callback scope for the variable based on its owner */
            if (variable.owner === "App") {
                return $rootScope || {};
            }
            if (variable.prefabName) {
                return options.scope || {};
            }
            return (options.scope && options.scope.$$childTail) ? options.scope.$$childTail : {};
        }

        function invoke(options, success, error) {
            var variable = this,
                operation = MobileService[this.service][this.operation],
                callBackScope = getCallBackScope(variable, options),
                successCb = function (data) {
                    variable.dataSet = data;
                    Utils.triggerFn(success);
                    initiateCallback('onSuccess', variable, callBackScope, data);
                },
                errorCb = function () {
                    Utils.triggerFn(error);
                    initiateCallback('onError', variable, callBackScope);
                };
            if (operation && CONSTANTS.hasCordova) {
                operation.invoke(this, options, successCb, errorCb);
            } else if (operation){
                successCb(_.cloneDeep(operation.model));
            } else {
                errorCb();
            }
        }

        BaseVariablePropertyFactory.register('wm.MobileVariable', {'invoke': invoke}, ['wm.mobileVariable'], {});
        return {};
    }];