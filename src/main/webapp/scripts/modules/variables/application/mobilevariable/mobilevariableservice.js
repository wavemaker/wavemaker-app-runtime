/*global wm, WM, _, window, navigator*/
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
wm.variables.services.MobileService = [function () {
    "use strict";
    var contactName = {
            formatted: '',
            familyName: '',
            givenName: '',
            middleName: '',
            honorificPrefix: '',
            honorificSuffix: ''
        },
        contactField = {
            type: '',
            value: '',
            pref: false
        },
        contactOrganization = {
            pref: false,
            type: '',
            name: '',
            department: '',
            title: ''
        },
        contactAddress =  {
            pref: false,
            type: '',
            formatted: '',
            streetAddress: '',
            locality: '',
            region: '',
            postalCode: '',
            country: ''
        },
        contact = {
            id: '',
            displayName: '',
            name: contactName,
            nickname: '',
            phoneNumbers: [contactField],
            emails: [contactField],
            addresses: [contactAddress],
            ims:  [contactField],
            organizations: [contactOrganization],
            birthday: new Date(),
            note: '',
            photos: [contactField],
            categories: [contactField],
            urls: [contactField]
        },
        event = {
            title: '',
            notes: '',
            loc: '',
            start: new Date(),
            end: new Date()
        };
    return {
        calendar : {
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
        },
        camera: {
            capturePicture: {
                model : {
                    data: 'blank-image.jpg'
                },
                properties : ['imageQuality', 'imageEncodingType', 'correctOrientation', 'saveToPhotoAlbum'],
                invoke : function (variable, options, success, error) {
                    var cameraOptions = {
                        quality : variable.imageQuality,
                        destinationType : 0, //only data url
                        sourceType : 1, //always camera
                        allowEdit : 0, // edit not required
                        encodingType : parseInt(variable.imageEncodingType, 10),
                        mediaType : 0, //always picture
                        correctOrientation : variable.correctOrientation,
                        saveToPhotoAlbum : variable.saveToPhotoAlbum
                    };
                    navigator.camera.getPicture(function (data) {
                        success({ data : data});
                    }, error, cameraOptions);
                }
            }
        },
        contacts : {
            list : {
                model : [contact],
                properties : ['contactFilter'],
                invoke : function (variable, options, success, error) {
                    var findOptions = {
                            filter : variable.contactFilter,
                            multiple : true
                        };
                    navigator.contacts.find('*', success, error, findOptions);
                }
            }
        },
        device: {
            getConnectionType: {
                model: {
                    data : 'No Connection'
                },
                properties : [],
                invoke : function (variable, options, success, error) {
                    success({ data: navigator.connection.type});
                }
            }
        },
        location: {
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
                properties : ['geolocationHighAccuracy', 'geolocationMaximumAge', 'geolocationTimeout'],
                invoke: function (variable, options, success, error) {
                    var geoLocationOptions = {
                        maximumAge: variable.geolocationMaximumAge * 1000,
                        timeout: variable.geolocationTimeout * 1000,
                        enableHighAccuracy: variable.geolocationHighAccuracy
                    };
                    navigator.geolocation.getCurrentPosition(success, error, geoLocationOptions);
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

            if (operation && CONSTANTS.hasCardova) {
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