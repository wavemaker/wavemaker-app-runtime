/*global WM, wm*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.$BaseVariablePropertyFactory
 * @description
 * The `BaseVariablePropertyFactory` service provides the all the properties for variables.
 */
wm.variables.factories.BaseVariablePropertyFactory = [
    'WIDGET_CONSTANTS',
    'Utils',
    function (WIDGET_CONSTANTS, Utils) {

        "use strict";
        var variableEventOptions = {}, /*A copy of the variable to preserve the actual value.*/
            result,
            properties,
            propertyGroups,
            variableMap,
            variableRegex = '^[a-zA-Z_][A-Za-z0-9_-]+$';

        /* make events compatible to select widget options */
        WM.forEach(WM.copy(WIDGET_CONSTANTS.EVENTS_OPTIONS), function (event) {
            variableEventOptions[event] = event;
        });

        result = {
            "properties": {
                "wm.Variable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "type": {"type": "list", "options": {"string": "LABEL_STRING", "boolean": "LABEL_BOOLEAN", "number": "LABEL_NUMBER", "date": "LABEL_DATE", "entry": "LABEL_ENTRY"}, "value": "string", "required": true},
                    "isList": {"type": "boolean", "value": false},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "editJson": {"type": "json"},
                    "isBound": {"type": "boolean"},
                    "dataSet": {"type": "string", "value": {dataValue: ""}, "hide": true},
                    "dataBinding": {"type": "list", "value": [{"name": "dataSet", "type": "object", "fields": [{"name": "dataValue", "type": "string"}]}], "hide": true},
                    "saveInPhonegap": {"type": "boolean", "value": false, "hide": true}
                },
                "wm.ServiceVariable": {
                    "isList": {"hide": true, "required": false},
                    "editJson": {"hide": true, "required": false},
                    "dataSet": {"type": "string", "value": {dataValue: ""}, "hide": true},
                    "type": {"hide": true, "required": false},
                    "firstRow": {"type": "number", "value": 0, "disabled": true, "hide": true},
                    "maxResults": {"type": "number", "value": 20, "disabled": true, "hide": true},
                    "designMaxResults": {"type": "number", "value": 10, "disabled": true, "hide": true},
                    "service": {"type": "list", "required": true},
                    "operation": {"type": "list", "required": true},
                    "operationType": {"type": "string", "hide": true},
                    "startUpdate": {"type": "boolean", "value": false},
                    "autoUpdate": {"type": "boolean", "value": true},
                    "inFlightBehavior": {"type": "list", "options": {"doNotExecute": "doNotExecute", "executeLast": "executeLast", "executeAll": "executeAll"}, "value": "executeLast"},
                    "transformationRequired": {"type": "boolean-labelfirst", "value": false},
                    "columnField": {"type": "list", "options": {}, "hide": true},
                    "dataField": {"type": "list", "options": {}, "hide": true},
                    "dataBinding": {"type": "list", "value": [{"name": "dataBinding", "type": "object", "fields": []}], "hide": true},

                    /* Events */
                    "onCanUpdate": {"type": "list", "options": variableEventOptions},
                    "onBeforeUpdate": {"type": "list", "options": variableEventOptions},
                    "onResult": {"type": "list", "options": variableEventOptions},
                    "onSuccess": {"type": "list", "options": variableEventOptions},
                    "onError": {"type": "list", "options": variableEventOptions}
                },
                "wm.LiveVariable": {
                    "service": {"hide": true, "required": false},
                    "editJson": {"hide": true},
                    "transformationRequired": {"hide": true},
                    "operation": {"options": {"read": "read", "insert": "insert", "update": "update", "delete": "delete"}, "value": "read"},
                    "liveSource": {"type": "list", "required": true},
                    "type": {"hide": false, "options": {}, "required": true},
                    "firstRow": {"disabled": false, "hide": false},
                    "maxResults": {"disabled": false, "hide": false},
                    "designMaxResults": {"disabled": false, "hide": false},
                    "ignoreCase": {"type": "boolean", "value": false},
                    "matchMode": {"type": "list", "options": {"start": "start", "end": "end", "anywhere": "anywhere", "exact": "exact"}, "value": "start"},
                    "orderBy": {"type": "string", "placeholder": "e.g: 'field1,asc&field2,desc'"},
                    "autoUpdate": {"value": true},
                    "startUpdate": {"value": false},
                    "inFlightBehavior": {"type": "list", "options": {"doNotExecute": "doNotExecute", "executeLast": "executeLast", "executeAll": "executeAll"}, "value": "executeLast"}
                },
                "wm.LoginVariable": {
                    "transformationRequired": {"hide": true},
                    "isList": {value: ""},
                    "firstRow": {value: ""},
                    "maxResults": {value: ""},
                    "designMaxResults": {value: ""},
                    "operation": {"hide": true, "required": false},
                    "service": {"hide": true, "required": false},
                    "dataSet": {"value": {username: "", password: ""}},
                    "dataBinding": {"type": "list", "value": [{"name": "dataBinding", "type": "object", "fields": [{"name": "username", "type": "string"}, {"name": "password", "type": "string"}]}], "hide": true},
                    "startUpdate": {"value": false},
                    "autoUpdate": {"value": false},
                    "useDefaultSuccessHandler": {"type": "boolean", "value": true}
                },
                "wm.LogoutVariable": {
                    "transformationRequired": {"hide": true},
                    "isList": {value: ""},
                    "firstRow": {value: ""},
                    "maxResults": {value: ""},
                    "designMaxResults": {value: ""},
                    "operation": {"hide": true, "required": false},
                    "service": {"hide": true, "required": false},
                    "dataSet": {"value": ""},
                    "dataBinding": {"value": ""},
                    "startUpdate": {"hide": true, "value": ""},
                    "autoUpdate": {"hide": true, "value": ""},
                    "redirectTo": {"type": "list", "options": [], value: ""},
                    "useDefaultSuccessHandler": {"type": "boolean", "value": true}
                },
                "wm.NavigationVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "operation": {"type": "list", "options": {"goToPreviousPage": "goToPreviousPage", "gotoPage": "gotoPage", "gotoView": "gotoView", "gotoTab": "gotoTab", "gotoAccordion": "gotoAccordion"}, "value": "gotoPage"},
                    "pageName": {"type": "string", "required": true, "options": {}, "widgettype": "list"},
                    "viewName": {"type": "string", "options": {}, "widgettype": "list", "hide": true},
                    "tabName": {"type": "string", "options": {}, "widgettype": "list", "hide": true},
                    "accordionName": {"type": "string", "options": {}, "widgettype": "list", "hide": true},
                    "segmentName": {"type": "string", "options": {}, "widgettype": "list", "hide": true},
                    "dataBinding": {"type": "string", "value": {}, "hide": true},
                    "pageTransitions": {"type": "list", "options": {"none": "none", "slide": "slide", "pop": "pop", "fade": "fade", "flip": "flip"}, "value": "none", "hide": true}
                },
                "wm.NotificationVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "operation": {"type": "list", "options": {"alert": "alert", "confirm": "confirm", "toast": "toast"}, "value": "alert"}, //"prompt", "warnOnce" to be added
                    "text": {"type": "string"},
                    "okButtonText": {"type": "string"},
                    "alerttype": {"type": "list", "options": {"information": "information", "success": "success", "error": "error", "warning": "warning"}},
                    "cancelButtonText": {"type": "string", "disabled": true, "hide": true},
                    "onCancel": {"type": "list", "options": variableEventOptions, "disabled": true, "hide": true},
                    "onClose": {"type": "list", "options": variableEventOptions},
                    "onOk": {"type": "list", "options": variableEventOptions},
                    "duration": {"type": "list", "options": [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000], "hide": true},
                    "class": {"type": "list", "options": {"Success": "Success", "Error": "Error", "Warning": "Warning", "Info": "Info", "Misc": "Misc"}, "hide": true},
                    "toasterPosition": {"type": "list", "options": {"top left": "top left", "top center": "top center", "top right": "top right", "center left": "center left", "center center": "center center", "center right": "center right", "bottom left": "bottom left", "bottom center": "bottom center", "bottom right": "bottom right"}, "hide": true},
                    "dataBinding": {"type": "string", "value": {}, "hide": true}
                },
                "wm.TimerVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "autoStart": {"type": "boolean", "value": false},
                    "repeating": {"type": "boolean", "value": false},
                    "delay": {"type": "number", "value": 500},
                    "onTimerFire": {"type": "list", "options": variableEventOptions}
                },
                "wm.DeviceVariable" : {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "dataSet": {"type": "string", "value": {dataValue: ""}, "hide": true},
                    "dataBinding": {"type": "object", "value": {}, "hide": true},
                    "service": {"type": "list", "options": []},
                    "operation": {"type": "list", "hide": true, "options": []},
                    "startUpdate": {"type": "boolean", "value": false, "hide": true},
                    /*calendar event options*/
                    "eventTitle": {"type": "string", "dataBinding": true, "hide" : true},
                    "eventNotes": {"type": "string", "dataBinding": true, "hide" : true},
                    "eventLocation": {"type": "string", "dataBinding": true, "hide" : true},
                    "eventStart": {"type": "string", "dataBinding": true, "hide" : true},
                    "eventEnd": {"type": "string", "dataBinding": true, "hide" : true},
                    "recurringEvent": {"type": "boolean", "dataBinding": true, "hide" : true},
                    "recurringEventFrequency": {"type": "string", "dataBinding": true, "hide" : true},
                    /* capture picture options*/
                    "imageQuality": {"type": "number", "value": 80, "hide" : true},
                    "imageTargetWidth": {"type": "number", "hide" : true},
                    "imageTargetHeight": {"type": "number", "hide" : true},
                    "imageEncodingType": {"type": "list", "options": {"0" : "JPEG", "1" : "PNG"}, "value" : "0", "hide" : true},
                    "allowImageEdit": {"type": "boolean", "value" : false, "hide" : true},
                    "correctOrientation": {"type": "boolean", "value" : true, "hide" : true},
                    "saveToPhotoAlbum": {"type": "boolean", "value" : false, "hide" : true},
                    /* getGeoLocation options*/
                    "geolocationHighAccuracy": {"type": "boolean", "value": true, "hide" : true},
                    "geolocationMaximumAge": {"type": "number", "value": 3, "hide" : true},
                    "geolocationTimeout": {"type": "number", "value": 5, "hide" : true},
                    /* listContacts options */
                    "contactFilter": {"type": "string", "dataBinding": true,  "value": "", "hide" : true},
                    /* File Upload */
                    "localFile": {"type": "string", "dataBinding": true,  "value": "", "hide" : true},
                    "remoteFolder": {"type": "string", "dataBinding": true,  "value": "", "hide" : true},
                    /*events*/
                    "onSuccess": {"type": "list", "options": variableEventOptions},
                    "onError": {"type": "list", "options": variableEventOptions},
                    /*vibrate options*/
                    "vibrationtime": {"type": "number", "value": 2, "hide" : true}
                }
            },

            "propertyGroups": [
                /* tabs */
                {"name": "properties", "parent": ""},
                {"name": "data", "parent": ""},
                {"name": "events", "parent": ""},

                /* properties under behavior tab */

                {"properties": ["liveSource", "type", "isList"], "parent": "properties"},
                {"name": "service", "properties": ["service", "operation"], "parent": "properties"},
                {"name": "serveroptions", "properties": ["downloadFile", "matchMode", "firstRow", "maxResults", "designMaxResults", "orderBy", "ignoreCase"], "parent": "properties"},
                {"name": "behavior", "properties": ["useDefaultSuccessHandler", "clearDataOnLogout", "autoUpdate", "startUpdate", "inFlightBehavior", "loadingDialog", "saveInCookie", "refireOnDbChange", "redirectTo", "autoStart", "delay", "repeating", "pageTransitions"], "parent": "properties"},
                {"name": "mobile", "properties": ["saveInPhonegap"], "parent": "properties"},
                {"name": "json", "properties": ["editJson"], "parent": "properties"},
                {"name": "Inputs", "properties": ["pageName", "viewName", "tabName", "accordionName", "segmentName", "dataBinding"], "parent": "properties"},
                /* properties under data tab */
                {"name": "Inputs", "properties": ["text", "duration", "class", "toasterPosition", "okButtonText", "cancelButtonText", "alerttype", "dataBinding",
                                "eventTitle", "eventNotes", "eventLocation", "eventStart", "eventEnd", "recurringEvent", "recurringEventFrequency",
                                "imageTargetWidth", "imageTargetHeight", "imageQuality",  "imageEncodingType", "correctOrientation", "saveToPhotoAlbum", "allowImageEdit",
                                "geolocationMaximumAge", "geolocationTimeout", "geolocationHighAccuracy",
                                "contactFilter", "localFile", "remoteFolder", "vibrationtime"], "parent": "data"},
                {"name": "inputfields", "properties": ["dataSet", "dataBinding"], "parent": "data"},
                {"name": "filterfields", "properties": ["dataSet"], "parent": "data"},
                {"name": "bindings", "properties": [], "parent": "data"},
                {"name": "dataTransformation", "properties": ["transformationRequired", "columnField", "dataField"], "parent": "data"},

                /* properties under events tab */
                {"properties": ["onCanUpdate", "onBeforeUpdate", "onResult", "onSuccess", "onError", "onPrepareSetData", "onOk", "onCancel", "onClose", "onTimerFire"], "parent": "events"}
            ]
        };
        properties = result.properties;
        propertyGroups = result.propertyGroups;
        variableMap = {};

        function addNavigationOption(name, label) {
            properties['wm.NavigationVariable'].operation.options[name] = label;
        }
        /*
         If parents array is provided, inject the properties from the parents into variable and return,
         else return only the properties of the widget.
         */
        function getPropertiesOf(variableCategory, parentCategories) {
            /* Variable to hold all the properties of the requested variable category */
            var variablePropertiesObject = {}, tempPropertiesObject;
            /* Condition: Check if parent dependencies are there */
            if (!parentCategories) {
                /* This variableCategory doesn't inherit from other variableCategories.
                 Fetch the properties of only this variableCategory */
                variablePropertiesObject.variableProps = WM.copy(properties[variableCategory]);
            } else {
                /* If parent categories are present, add their properties to current variable */
                parentCategories = WM.isArray(parentCategories) ? parentCategories : [parentCategories];
                parentCategories.push(variableCategory);
                tempPropertiesObject = {};

                /* construct the properties object by inheriting from parentCategories */
                WM.forEach(parentCategories, function (parent) {
                    /* Fetch properties of individual dependency */
                    WM.forEach(properties[parent], function (propObj, propName) {
                        /* if property is not present create it */
                        if (!tempPropertiesObject[propName]) {
                            tempPropertiesObject[propName] = {};
                        }
                        /* Populate the fetched properties */
                        WM.forEach(propObj, function (value, key) {
                            tempPropertiesObject[propName][key] = value;
                        });

                    });
                });
                /* Assign the fetched properties to variableProps object for property panel */
                variablePropertiesObject.variableProps = tempPropertiesObject;
            }

            /* bind the properties with variable object */
            WM.forEach(variablePropertiesObject.variableProps, function (propObj, propName) {
                /* Get the previous value if present, else create new property */
                if (!variablePropertiesObject[propName]) {
                    variablePropertiesObject[propName] = (propObj.value === undefined) ? "" : propObj.value;
                }
            });

            /* return the completed object */
            return variablePropertiesObject;
        }

        /*
         * function to register a variable
         */
        function register(category, properties, parentCategories, methods) {
            variableMap[category] = {};

            WM.extend(properties, getPropertiesOf(category, parentCategories));

            variableMap[category].propertyMap = properties.variableProps;
            delete properties.variableProps;
            variableMap[category].properties = properties;

            variableMap[category].methods = methods;
        }

        /*
         * function to get the properties for a variable
         */
        function getProperties(category) {
            return variableMap[category] ? WM.copy(variableMap[category].properties) : {};
        }

        /*
         * function to get all the property groups
         */
        function getPropertyGroups() {
            return propertyGroups;
        }

        /*
         * function to get the property map for a variable
         */
        function getPropertyMap(category) {
            return variableMap[category] ? variableMap[category].propertyMap : undefined;
        }

        /* function to invoke the specified method of the specified variable category*/
        function invoke(method, variableType, variable, options, successCallBack, errorCallBack) {
            /*if variable is not valid, call the error callback and return*/
            if (!variableMap[variableType]) {
                Utils.triggerFn(errorCallBack, "variable is not valid");
                return;
            }
            /*Call the specified variable category's method*/
            return variableMap[variableType].methods[method](variable, options, successCallBack, errorCallBack);
        }

        return {
            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#addNavigationOption
             * @methodOf  wm.variables.$BaseVariablePropertyFactory
             * @description
             * This is a provision to add additional navigational options.
             * @param {string} name of the option or view
             * @param {string} label to display
             */
            addNavigationOption : addNavigationOption,
            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#getPropertiesOf
             * @methodOf  wm.variables.$BaseVariablePropertyFactory
             * @description
             * gets the properties along with the property map for the variable of a particular type
             */
            getPropertiesOf: getPropertiesOf,

            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#register
             * @methodOf  wm.variables.$BaseVariablePropertyFactory
             * @description
             * registers a variable type with the variable factory
             */
            register: register,

            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#getProperties
             * @methodOf wm.variables.$BaseVariablePropertyFactory
             * @description
             * gets the properties of a variable corresponding to a particular category
             */
            getProperties: getProperties,

            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#getProperties
             * @methodOf  wm.variables.$BaseVariablePropertyFactory
             * @description
             * gets the property groups of all variables
             */
            getPropertyGroups: getPropertyGroups,

            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#getPropertyMap
             * @methodOf  wm.variables.$BaseVariablePropertyFactory
             * @description
             * gets the property map of a variable corresponding to a particular category
             */
            getPropertyMap: getPropertyMap,

            /**
             * @ngdoc method
             * @name  wm.variables.$BaseVariablePropertyFactory#invoke
             * @methodOf wm.variables.$BaseVariablePropertyFactory
             * @description
             * invokes the specified method of the specified variable category
             * @param {string} method Name of the method to be invoked.
             * @param {string} variableType Type/category of the variable.
             * @param {string} variableName Name of the variable.
             */
            invoke: invoke
        };
    }
];
