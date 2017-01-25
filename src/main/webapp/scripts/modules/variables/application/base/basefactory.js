/*global WM, wm, _*/
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
    'VARIABLE_CONSTANTS',
    function (WIDGET_CONSTANTS, Utils, VARIABLE_CONSTANTS) {

        "use strict";
        var variableEventOptions = [], /*A copy of the variable to preserve the actual value.*/
            result,
            properties,
            propertyGroups,
            variableMap,
            variableRegex = '^[a-zA-Z_][A-Za-z0-9_]+$',
            matchModes = Utils.getMatchModes();

        /* make events compatible to select widget options */
        _.forEach(Utils.getClonedObject(WIDGET_CONSTANTS.EVENTS_OPTIONS), function (event) {
            variableEventOptions.push({'name': event, 'category': 'Default'});
        });

        result = {
            "properties": {
                "wm.Variable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "type": {"type": "list", "widgettype": "typeahead", "options": {"string": "LABEL_STRING", "boolean": "LABEL_BOOLEAN", "number": "LABEL_NUMBER", "date": "LABEL_DATE", "entry": "LABEL_ENTRY"}, "value": "string", "required": true},
                    "isList": {"type": "boolean", "value": false},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "editJson": {"type": "json"},
                    "isBound": {"type": "boolean"},
                    "dataSet": {"type": "string", "value": {dataValue: ""}, "hide": true},
                    "dataBinding": {"type": "list", "value": [{"target": "dataValue", "type": "string"}], "hide": true},
                    "saveInPhonegap": {"type": "boolean", "value": false, "hide": true}
                },
                "wm.ServiceVariable": {
                    "isList": {"hide": true, "required": false},
                    "editJson": {"hide": true, "required": false},
                    "dataSet": {"type": "string", "value": [], "hide": true},
                    "type": {"hide": true, "required": false},
                    "maxResults": {"type": "number", "value": 20, "disabled": true, "hide": true},
                    "designMaxResults": {"type": "number", "value": 10, "disabled": true, "hide": true},
                    "orderBy": {"type": "string", "placeholder": "field1 asc,field2 desc", "hide": true},
                    "service": {"type": "list", "required": true, "widgettype": "typeahead"},
                    "operation": {"type": "list", "required": true, "widgettype": "typeahead", groupBy: 'type', 'propertyName': 'name'},
                    "operationType": {"type": "string", "hide": true},
                    "startUpdate": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": false},
                    "autoUpdate": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": true},
                    "inFlightBehavior": {"type": "list", "options": {"doNotExecute": "doNotExecute", "executeLast": "executeLast", "executeAll": "executeAll"}, "value": "executeLast"},
                    "transformationRequired": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": false},
                    "columnField": {"type": "list", "options": {}, "hide": true},
                    "dataField": {"type": "list", "options": {}, "hide": true},
                    "dataBinding": {"type": "list", "value": [], "hide": true},
                    "spinnerContext": {"type": "list", "options": {"": "", "page": "page"}, "placeholder": "Search Widgets", "widgettype": "typeahead"},
                    "spinnerMessage": {"type": "string"},

                    /* Events */
                    "onCanUpdate": {"type": 'event', "options": variableEventOptions},
                    "onBeforeUpdate": {"type": 'event', "options": variableEventOptions},
                    "onResult": {"type": 'event', "options": variableEventOptions},
                    "onBeforeDatasetReady": {"type": 'event', "options": variableEventOptions},
                    "onSuccess": {"type": 'event', "options": variableEventOptions},
                    "onError": {"type": 'event', "options": variableEventOptions}
                },
                "wm.LiveVariable": {
                    "service": {"hide": true, "required": false},
                    "editJson": {"hide": true},
                    "transformationRequired": {"hide": true},
                    "operation": {"options": {"read": "read", "insert": "insert", "update": "update", "delete": "delete"}, "value": "read", "widgettype": "typeahead"},
                    "liveSource": {"type": "list", "required": true, "widgettype": "typeahead"},
                    "type": {"hide": false, "options": {}, value: "", "required": true, "widgettype": "typeahead"},
                    "maxResults": {"disabled": false, "hide": false},
                    "designMaxResults": {"disabled": false, "hide": false},
                    "ignoreCase": {"type": "boolean", "value": true},
                    "matchMode": {"type": "list", "options": matchModes, "value": "start"},
                    "orderBy": {"type": "string", "placeholder": "field1 asc,field2 desc", "hide": false, "widgettype": "order-by", "order": "desc"},
                    "autoUpdate": {"value": true},
                    "startUpdate": {"value": true}
                },
                "wm.LoginVariable": {
                    "transformationRequired": {"hide": true},
                    "isList": {value: ""},
                    "maxResults": {value: ""},
                    "designMaxResults": {value: ""},
                    "operation": {"hide": true, "required": false},
                    "service": {"hide": true, "required": false},
                    "dataSet": {"value": {username: "", password: "", rememberme: false}},
                    "dataBinding": {"type": "list", "value": [{"target": "username", "type": "string"}, {"target": "password", "type": "string"}, {"target": "rememberme", "type": "boolean"}], "hide": true},
                    "startUpdate": {"value": false},
                    "autoUpdate": {"value": false},
                    "useDefaultSuccessHandler": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": true}
                },
                "wm.LogoutVariable": {
                    "transformationRequired": {"hide": true},
                    "isList": {value: ""},
                    "maxResults": {value: ""},
                    "designMaxResults": {value: ""},
                    "operation": {"hide": true, "required": false},
                    "service": {"hide": true, "required": false},
                    "dataSet": {"value": ""},
                    "dataBinding": {"value": ""},
                    "startUpdate": {"hide": true, "value": ""},
                    "autoUpdate": {"hide": true, "value": ""},
                    "redirectTo": {"type": "list", "options": [], value: "", "widgettype": "typeahead"},
                    "useDefaultSuccessHandler": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": true}
                },
                "wm.NavigationVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "operation": {"type": "list", "required": true, "options": {"goToPreviousPage": "goToPreviousPage", "gotoPage": "gotoPage", "gotoTab": "gotoTab", "gotoAccordion": "gotoAccordion"}, "value": "gotoPage"},
                    "dataBinding": {"type": "string", "value": [], "hide": true},
                    "pageTransitions": {"type": "list", "options": {"none": "none", "slide": "slide", "pop": "pop", "fade": "fade", "flip": "flip"}, "value": "none", "hide": true},
                    "dataSet": {"hide": true, "value": []}
                },
                "wm.NotificationVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "operation": {"type": "list", "required": true, "options": {"alert": "alert", "confirm": "confirm", "toast": "toast"}, "value": "alert"}, //"prompt", "warnOnce" to be added
                    "onCancel": {"type": 'event', "options": variableEventOptions, "disabled": true, "hide": true},
                    "onClose": {"type": 'event', "options": variableEventOptions},
                    "onOk": {"type": 'event', "options": variableEventOptions},
                    'onHide': {'type': 'event', 'options': variableEventOptions},
                    'onClick': {'type': 'event', 'options': variableEventOptions},
                    "dataBinding": {"type": "string", "value": [], "hide": true}
                },
                "wm.TimerVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "autoStart": {"type": "boolean", "value": false},
                    "repeating": {"type": "boolean", "value": false},
                    "delay": {"type": "number", "value": 500},
                    "onTimerFire": {"type": "event", "options": variableEventOptions}
                },
                "wm.DeviceVariable" : {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "dataSet": {"type": "string", "value": {dataValue: ""}, "hide": true},
                    "dataBinding": {"type": "object", "value": [], "hide": true},
                    "service": {"type": "list", "options": [], "required": true},
                    "operation": {"type": "list", "hide": true, "options": [], "required": true},
                    "autoUpdate": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": false, "hide": true},
                    "startUpdate": {"type": "boolean", "widgettype": "boolean-inputfirst", "value": false, "hide": true},
                    /*events*/
                    "onSuccess": {"type": "event", "options": variableEventOptions},
                    "onError": {"type": "event", "options": variableEventOptions},
                    "onProgress": {"type": "event", "options": variableEventOptions, "hide": true},
                    "onOnline": {"type": "event", "options": variableEventOptions, "hide": true},
                    "onOffline": {"type": "event", "options": variableEventOptions, "hide": true},
                    "onBeforePush": {"type": "event", "options": variableEventOptions, "hide": true}
                },
                "wm.WebSocketVariable": {
                    "name": {"type": "string", "required": true, "pattern": variableRegex},
                    "owner": {"type": "list", "options": {"Page": "LABEL_PAGE", "App": "LABEL_APPLICATION"}, "value": "Page"},
                    "dataSet": {"type": "string", "value": [], "hide": true},
                    "service": {"type": "list", "required": true, "widgettype": "typeahead"},
                    "type": {"hide": true},
                    "operation": {"hide": true},
                    "operationId": {"hide": true},
                    "startUpdate": {"type": "boolean", "widgettype": "boolean", "displayName": "Connect on page load", "value": true},
                    "dataUpdateStrategy": {"type": "string", "widgettype": "list", "options": {"refresh": "Refresh dataSet", "append": "Add as last record in dataSet", "prepend": "Add as first record in dataSet"}, "value": "refresh", "displayName": "On New Data"},
                    "dataLimit": {"type": "number", "value": 20},
                    "dataBinding": {"type": "list", "value": [], "hide": true},

                    /* Events */
                    "onBeforeOpen": {"type": 'event', "options": variableEventOptions},
                    "onOpen": {"type": 'event', "options": variableEventOptions},
                    "onBeforeMessageSend": {"type": 'event', "options": variableEventOptions},
                    "onMessageReceive": {"type": 'event', "options": variableEventOptions},
                    "onError": {"type": 'event', "options": variableEventOptions},
                    "onBeforeClose": {"type": 'event', "options": variableEventOptions},
                    "onClose": {"type": 'event', "options": variableEventOptions}
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
                {"name": "serveroptions", "properties": ["downloadFile", "matchMode", "maxResults", "designMaxResults", "orderBy", "ignoreCase"], "parent": "properties"},
                {"name": "behavior", "properties": ["useDefaultSuccessHandler", "clearDataOnLogout", "autoUpdate", "startUpdate", "inFlightBehavior", "loadingDialog", "saveInCookie", "refireOnDbChange", "redirectTo", "autoStart", "delay", "repeating", "pageTransitions"], "parent": "properties"},
                {"name": "dataset", "properties": ["dataUpdateStrategy", "dataLimit"], "parent": "properties"},
                {"name": "mobile", "properties": ["saveInPhonegap"], "parent": "properties"},
                {"name": "Inputs", "properties": ["pageName", "viewName", "tabName", "accordionName", "segmentName", "dataBinding"], "parent": "properties", "propertyTarget": 'dataBinding'},
                {"name": "spinner", "properties": ["spinnerContext", "spinnerMessage"], "parent": "properties"},

                /* properties under data tab */
                {"name": "Inputs", "properties": [], "parent": "data", "propertyTarget": 'dataBinding, dataSet'},
                {"name": "inputfields", "properties": [], "parent": "data", "propertyTarget": 'dataBinding'},
                {"name": "filterfields", "properties": [], "parent": "data", "propertyTarget": 'dataBinding'},
                {"name": "bindings", "properties": [], "parent": "data", "propertyTarget": 'dataBinding'},
                {"name": "dataTransformation", "properties": ["transformationRequired", "columnField", "dataField"], "parent": "data"},

                /* properties under events tab */
                {"properties": VARIABLE_CONSTANTS.EVENTS, "parent": "events"}
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
                variablePropertiesObject.variableProps = Utils.getClonedObject(properties[variableCategory]);
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
            return variableMap[category] ? Utils.getClonedObject(variableMap[category].properties) : {};
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
