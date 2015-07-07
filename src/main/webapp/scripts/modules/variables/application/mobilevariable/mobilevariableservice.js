/*global wm, WM, navigator*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.services
 * @requires $rootScope
 * @requires Varibales
 * @requires BaseVariablePropertyFactory
 * @requires MobileApiDefaults
 * @description
 * The 'MobileApiDefaults' provides default objects that Mobile API return. These are helpful
 * as basic schemas for variable bindings on widgets.
 */
wm.variables.services.MobileApiDefaults = [function () {
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
        geoLocation = {
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
        };
    return {
        capturePicture: {
            data: 'blank-image.jpg'
        },
        getGeoLocation: geoLocation,
        getConnectionType: {
            data: 'No network connection'
        },
        listContacts : [contact]
    };
}];

/**
 * @ngdoc service
 * @name wm.variables.services
 * @requires $rootScope
 * @requires Varibales
 * @requires BaseVariablePropertyFactory
 * @requires MobileApiDefaults
 * @description
 * The 'MobileVariableService' provides methods to work with Mobile API.
 */
wm.variables.services.MobileVariableService = ['$rootScope', 'Variables', 'BaseVariablePropertyFactory', 'MobileApiDefaults',
    function ($rootScope, Variables, BaseVariablePropertyFactory, MobileApiDefaults) {
        "use strict";
        var initiateCallback = Variables.initiateCallback,
            methods = {
                capturePicture:  function (variable, options, success, error) {
                    var cameraOptions = {
                            quality : variable.imageQuality,
                            destinationType : 0, //only data url
                            sourceType : 1, //always camera
                            allowEdit : 0, // edit not required
                            encodingType : parseInt(variable.imageEncodingType, 10),
                            mediaType : 0, //always picture
                            correctOrientation : variable.correctOrientation,
                            saveToPhotoAlbum : variable.saveToPhotoAlbum
                        },
                        response = MobileApiDefaults.capturePicture;

                    if (navigator.camera && navigator.camera.getPicture) {
                        navigator.camera.getPicture(function (data) {
                            response.data = data;
                            success(response);
                        }, error, cameraOptions);
                    } else {
                        success(MobileApiDefaults.capturePicture);
                    }
                },
                getGeoLocation: function (variable, options, success, error) {
                    var geoLocationOptions = {
                        maximumAge: variable.geolocationMaximumAge * 1000,
                        timeout: variable.geolocationTimeout * 1000,
                        enableHighAccuracy: variable.geolocationHighAccuracy
                    };
                    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
                        navigator.geolocation.getCurrentPosition(success, error, geoLocationOptions);
                    } else {
                        success(MobileApiDefaults.getGeoLocation);
                    }
                },
                getConnectionType: function (variable, options, success) {
                    var connectionType =  MobileApiDefaults.getConnectionType;
                    if (navigator.connection) {
                        connectionType.data = navigator.connection.type;
                    }
                    success(connectionType);
                },
                listContacts : function (variable, options, success, error) {
                    var findOptions = {
                            filter : variable.contactFilter,
                            multiple : true
                        };
                    if (navigator.contacts) {
                        navigator.contacts.find('*', success, error, findOptions);
                    } else {
                        success(MobileApiDefaults.listContacts);
                    }
                }
            };

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
                fn = methods[this.operation],
                callBackScope = getCallBackScope(variable, options);
            if (fn) {
                fn(this, options, function (data) {
                    variable.dataSet = data;
                    if (success) {
                        success();
                    }
                    initiateCallback('onSuccess', variable, callBackScope, data);
                }, function () {
                    if (error) {
                        error();
                    }
                    initiateCallback('onError', variable, callBackScope);
                });
            }
        }

        BaseVariablePropertyFactory.register('wm.MobileVariable', {'invoke': invoke}, ['wm.mobileVariable'], methods);
        return {};
    }];