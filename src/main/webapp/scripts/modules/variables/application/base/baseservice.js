/*global WM, wm, document*/
/*jslint todo: true */
/*jslint sub: true */
/**
 * @ngdoc service
 * @name wm.variables.$Variables
 * @requires $rootScope
 * @requires BaseVariablePropertyFactory
 * @description
 * This is the factory responsible for creating, storing and deleting
 * the variables. It manages Simple, Live and Service variables.
 */
wm.variables.services.Variables = [
    '$rootScope',
    'BaseVariablePropertyFactory',
    "ProjectService",
    "FileService",
    "CONSTANTS",
    "VARIABLE_CONSTANTS",
    "DialogService",
    "$timeout",
    "Utils", function ($rootScope, BaseVariablePropertyFactory, ProjectService, FileService, CONSTANTS, VARIABLE_CONSTANTS, DialogService, $timeout, Utils) {
        "use strict";

        /*flag to determine app mode
         true: RUN mode
         false: STUDIO mode
         */
        var runMode = CONSTANTS.isRunMode,
            variableConfig = [
                {
                    "collectionType": "call",
                    "category": "wm.NavigationVariable",
                    "labelKey": "LABEL_VARIABLE_NAVIGATION",
                    "defaultName": "navigationVariable"
                },
                {
                    "collectionType": "call",
                    "category": "wm.NotificationVariable",
                    "labelKey": "LABEL_VARIABLE_NOTIFICATION",
                    "defaultName": "notificationVariable"
                },
                {
                    "collectionType": "data",
                    "category": "wm.Variable",
                    "labelKey": "LABEL_VARIABLE_BASIC",
                    "defaultName": "staticVariable"
                },
                {
                    "collectionType": "data",
                    "category": "wm.ServiceVariable",
                    "labelKey": "LABEL_VARIABLE_SERVICE",
                    "defaultName": "serviceVariable"
                },
                {
                    "collectionType": "data",
                    "category": "wm.LiveVariable",
                    "labelKey": "LABEL_VARIABLE_LIVE",
                    "defaultName": "liveVariable"
                },
                {
                    "collectionType": "data",
                    "category": "wm.TimerVariable",
                    "labelKey": "LABEL_VARIABLE_TIMER",
                    "defaultName": "timerVariable"
                },
                {
                    "collectionType": "data",
                    "category": "wm.LoginVariable",
                    "labelKey": "LABEL_VARIABLE_LOGIN",
                    "defaultName": "loginVariable",
                    "appOnly": true
                },
                {
                    "collectionType": "data",
                    "category": "wm.LogoutVariable",
                    "labelKey": "LABEL_VARIABLE_LOGOUT",
                    "defaultName": "logoutVariable",
                    "appOnly": true
                }
            ],
            variableCategoryToNameMap = {},
            self = this,

            returnObject,

            pageScopeMap = {},

        /* active controller's scope, passed by the initializer controller */
            activeScope,

        /* active page, passed by the initializer controller */
            activePage,

        /* array storing the variable binding watchers, required to de-register previous watchers if any */
            watchers = {},

        /*Function to initialize category-to-name map*/
            initVariableNameMap = function () {
                variableCategoryToNameMap = {};
                variableConfig.forEach(function (variable) {
                    variableCategoryToNameMap[variable.category] = variable.defaultName;
                });
            },

        /*Function to set the variable name iterator with the specified value*/
            resetVariableNameIterator = function () {
                self.variableNameIterator = {};
                Object.keys(variableCategoryToNameMap).forEach(function (category) {
                    self.variableNameIterator[category] = 1;
                });
            },

        /*function to reset the services object for the project*/
            resetVariables = function (newVariablesObject) {
                self.variableCollection = newVariablesObject || self.variableCollection;
                if (!newVariablesObject) {
                    /*Initialize the variable name iterator to the default value.*/
                    resetVariableNameIterator();
                }
            },

            /* function to update binding of a field of a variable */
            bindVariableField = function (props) {
                var bindingVal = props.bindingVal,
                    param = props.paramName,
                    variable = props.variable,
                    variableName = props.variableName,
                    variableScope = props.scope || {};

                if (Utils.stringStartsWith(bindingVal, "bind:")) {
                    /* if binding is present, watch on the expression */
                    watchers[variableScope.$id][variableName].push(variableScope.$watch(bindingVal.replace("bind:", ""), function (newVal, oldVal) {
                        /* don't perform any action if new value is coming as undefined(data source getting destroyed) */
                        if (WM.isUndefined(newVal) && !WM.isUndefined(oldVal)) {
                            return;
                        }
                        if (variable.category === "wm.Variable") {
                            variable.dataSet[param] = newVal;
                        } else if (variable.category === "wm.ServiceVariable") {
                            if (props.parentNode) {
                                variable.dataBinding[props.parentNode][param] = newVal;
                            } else {
                                variable.dataBinding[param] = newVal;
                            }
                            /* if auto-update set for the variable, get its data */
                            if (variable.autoUpdate && !WM.isUndefined(newVal)) {
                                variable.update();
                            }
                        } else if (variable.category === "wm.LiveVariable") {
                            if (variable.operation === "read") {
                                variable.filterFields[param] = {
                                    'value': newVal
                                };
                                /* if auto-update set for the variable with read operation only, get its data */
                                if (variable.autoUpdate && !WM.isUndefined(newVal)) {
                                    variable.update();
                                }
                            } else {
                                variable.inputFields[param] = newVal;
                                /* if auto-update set for the variable with read operation only, get its data */
                                if (variable.autoUpdate && !WM.isUndefined(newVal)) {
                                    variable[variable.operation + 'Record']();
                                }
                            }
                        } else if (variable.category === "wm.NotificationVariable" || variable.category === "wm.NavigationVariable") {
                            variable.dataBinding[param] = newVal;
                        } else if (variable.category === "wm.LoginVariable") {
                            variable.dataBinding[param] = newVal;
                            /* if auto-update set for the variable, get its data */
                            if (variable.autoUpdate && !WM.isUndefined(newVal)) {
                                variable.login();
                            }
                        }
                    }));
                } else if (variable.category === "wm.LiveVariable") {
                    /* binding is not present, apply the value written for binding */
                    if (variable.operation === "read") {
                        variable.filterFields[param] = {
                            'value': bindingVal
                        };
                    } else {
                        variable.inputFields[param] = bindingVal;
                    }
                } else if (variable.category === "wm.Variable") {
                    /* if there is already a value defined in the dataSet, give it preference over value in dataBinding */
                    if (variable.dataBinding[param]) {
                        variable.dataSet[param] = variable.dataSet[param] || variable.dataBinding[param];
                    }
                }
            },

            processVariablePostBindUpdate = function (nodeName, nodeVal, variable) {
                if (variable.category === "wm.LiveVariable") {
                    if (variable.operation === "read") {
                        variable.filterFields[nodeName] = {
                            'value': nodeVal
                        };
                        /* if auto-update set for the variable with read operation only, get its data */
                        if (variable.autoUpdate && !WM.isUndefined(nodeVal)) {
                            variable.update();
                        }
                    } else {
                        variable.inputFields[nodeName] = nodeVal;
                        /* if auto-update set for the variable with read operation only, get its data */
                        if (variable.autoUpdate && !WM.isUndefined(nodeVal)) {
                            variable[variable.operation + 'Record']();
                        }
                    }
                } else if (variable.category === "wm.ServiceVariable") {
                    if (variable.autoUpdate && !WM.isUndefined(nodeVal)) {
                        variable.update();
                    }
                } else if (variable.category === "wm.LoginVariable") {
                    if (variable.autoUpdate && !WM.isUndefined(nodeVal)) {
                        variable.login();
                    }
                }
            },

            processBindNode = function (node, parentNode, scope, variable) {
                if (Utils.stringStartsWith(node.value, "bind:")) {
                    scope.$watch(node.value.replace("bind:", ""), function (newVal, oldVal) {
                        if (WM.isUndefined(newVal) && (!WM.isUndefined(oldVal) || !WM.isUndefined(parentNode[node.name]))) {
                            return;
                        }
                        parentNode[node.name] = newVal;
                        processVariablePostBindUpdate(node.name, newVal, variable);
                    });
                } else {
                    if (WM.isDefined(node.value)) {
                        parentNode[node.name] =  node.value;
                        if (variable.category === "wm.LiveVariable") {
                            /* binding is not present, apply the value written for binding */
                            if (variable.operation === "read") {
                                variable.filterFields[node.name] = {
                                    'value': node.value
                                };
                            } else {
                                variable.inputFields[node.name] = node.value;
                            }
                        }
                    }
                    if (node.fields && node.fields.length) {
                        parentNode[node.name] = WM.isObject(parentNode[node.name]) ? parentNode[node.name] : {};
                        WM.forEach(node.fields, function (field) {
                            processBindNode(field, parentNode[node.name], scope, variable);
                        });
                    }
                }
            },

            /* function to update the binding for a variable */
            updateVariableBinding = function (variable, name, scope) {

                /* un-register previous watchers, if any */
                watchers[scope.$id][name] = watchers[scope.$id][name] || [];
                watchers[scope.$id][name].forEach(Utils.triggerFn);

                /*
                 * new implementation: dataBinding is an array of binding maps
                 * old implementation: dataBinding is an object map
                 */
                if (WM.isArray(variable.dataBinding)) {
                    var bindMap = variable.dataBinding;
                    variable.dataBinding = {};
                    bindMap.forEach(function (node) {
                        processBindNode(node, variable, scope, variable);
                    });
                } else {
                    /* loop over each variable-binding object to check for bindings */
                    WM.forEach(variable.dataBinding, function (binding, param) {
                        if (typeof binding === 'object' && variable.category === 'wm.ServiceVariable') {
                            WM.forEach(binding, function (subParamBinding, subParam) {
                                bindVariableField({bindingVal: subParamBinding, paramName: subParam, variable: variable, variableName: name, parentNode: param, scope: scope});
                            });
                        }
                        bindVariableField({bindingVal: binding, paramName: param, variable: variable, variableName: name, scope: scope});
                    });
                }
            },

            /*
             * Updates the variables in a context with their latest values
             * context refers to the namespace for the variables collection, like 'app'/page/partial/prefab
             */
            updateContextVariables = function (context, scope) {
                $rootScope.variables = $rootScope.variables || {};
                self.studioCopy[context] = {};

                scope = scope || pageScopeMap[context] || {};
                watchers[scope.$id] = {};

                /* Maintain a copy of the variables in the exposed collection
                 * Primary reason for this:
                 * StudioMode: any update to the dataSet or other properties by variable will not reflect in the actual collection
                 * RunMode: The same collection is used by same partials/prefabs appearing twice in a page */
                self.variableCollection[scope.$id] = WM.copy(self.variableCollection[context]) || {};
                scope.Variables = self.variableCollection[scope.$id];

                /* extend scope variables with app variables, in studio mode */
                if (CONSTANTS.isStudioMode && context !== VARIABLE_CONSTANTS.OWNER.APP) {
                    if (!scope.Variables.hasOwnProperty(name)) {
                        WM.forEach(self.variableCollection[$rootScope.$id], function (variable, name) {
                            Object.defineProperty(scope.Variables, name, {
                                configurable: true,
                                get: function () {
                                    return variable;
                                }
                            });
                        });
                    }
                }
                WM.forEach(self.variableCollection[scope.$id], function (variable, name) {
                    /* assign variable name to the variable object for later use */
                    variable.name = name;

                    if (runMode) {
                        variable.activeScope = scope;
                    } else {
                        /* this copy is used by binding dialog in STUDIO mode */
                        self.studioCopy[context][name] = variable;
                    }


                    /* update variable bindings */
                    updateVariableBinding(variable, name, scope);

                    /*iterating over the collection to update the variables appropriately.*/
                    if (variable.category === "wm.Variable") {
                        $rootScope.variables[name] = variable.dataSet.dataValue;
                    } else if (variable.category === "wm.ServiceVariable") {
                        if (!runMode || variable.startUpdate) {
                            /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                            $timeout(function () {
                                variable.update();
                            }, null, false);
                        }
                    } else if (variable.category === "wm.LiveVariable") {
                        $rootScope.variables[name] = $rootScope.variables[name] || {};
                        if (!runMode || variable.startUpdate) {
                            /*
                            * For variable with operation other than 'read', call respective method in RUN mode
                            * In studio mode, DB and table related data is to be fetched and saved in the variable
                            * So, getData is called in STUDIO mode for liva variables with all types of operations
                            */
                            if (runMode && variable.operation !== 'read') {
                                /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                                $timeout(function () {
                                    variable[variable.operation + 'Record']();
                                }, null, false);
                            } else {
                                /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                                $timeout(function () {
                                    variable.update();
                                }, null, false);
                            }
                        } else if (variable.operation !== 'read') {
                            /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                            $timeout(function () {
                                variable.update();
                            }, null, false);
                        }
                    } else if (variable.category === "wm.LoginVariable") {
                        if (runMode && variable.startUpdate) {
                            /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                            $timeout(function () {
                                variable.login();
                            }, null, false);
                        }
                    } else if (variable.category === "wm.TimerVariable") {
                        if (runMode && variable.autoStart) {
                            /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                            $timeout(function () {
                                variable.fire();
                            }, null, false);
                        }
                    }
                });
            },

        /* function to update variable values in $rootScope */
            updateVariableValues = function (activePageName, isUpdatePageVariables) {

                /*If the flag to update only page level variables is set, then do not trigger the update function for app-level variables*/
                if (!isUpdatePageVariables) {
                    /* app level variables */
                    updateContextVariables(VARIABLE_CONSTANTS.OWNER.APP);
                }

                /* page level variables */
                if (activePageName) {
                    updateContextVariables(activePageName);
                }
            },

            /* function to write contents on a file */
            writeFile = function (params, success, error) {
                FileService.write({
                    projectID: $rootScope.project.id,
                    path: params.path,
                    content: (typeof params.content === 'object') ? JSON.stringify(params.content, null, '\t') : params.content
                }, function () {
                    Utils.triggerFn(success);
                }, function () {
                    Utils.triggerFn(error, $rootScope.locale["MESSAGE_ERROR_SAVE_FILE_DESC"]);
                });
            },

        /* function to set page variables for a specified page*/
            setPageVariables = function (pageName, pageVariables) {
                /* check for existence */
                self.variableCollection = self.variableCollection || {};
                /* set the variables*/
                self.variableCollection[pageName] = pageVariables || {};
            },

            /* function to get page variables for a specified page*/
            getPageVariables = function (pageName, success, error) {
                var params;
                /* check for existence */
                if (self.variableCollection !== null && self.variableCollection[pageName]) {
                    Utils.triggerFn(success, self.variableCollection[pageName]);
                    return;
                }

                params = {
                    path: "pages/" + pageName + "/" + pageName + ".variables.json"
                };

                /* if in STUDIO mode append the project ID to request params */
                if (!runMode) {
                    params.projectID = $rootScope.project.id;
                }

                /*Method to read page level variables from the path specified*/
                FileService.read(params, function (variables) {
                    if (!WM.isObject(variables)) {
                        variables = {};
                    }

                    setPageVariables(pageName, variables);
                    Utils.triggerFn(success, variables);
                }, function (errMsg) {
                    setPageVariables(pageName, undefined);
                    Utils.triggerFn(error, errMsg);
                });
            },

        /* function to set page variables for a specified page*/
            setAppVariables = function (appVariables) {
                /* check for existence */
                self.variableCollection = self.variableCollection || {};
                /* set the variables*/
                self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP] = appVariables;
            },

            /* function to get application variables */
            getAppVariables = function (success, error) {
                /* check for existence */
                if (self.variableCollection !== null && self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP]) {
                    Utils.triggerFn(success, self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP]);
                    return;
                }

                var requestParams = {
                    path: "app.variables.json"
                };

                /* if STUDIO mode, append project ID to request params */
                if (!runMode) {
                    requestParams.projectID = $rootScope.project.id;
                }

                /* call file service to read the variables file */
                FileService.read(requestParams, function (variables) {
                    if (!WM.isObject(variables)) {
                        variables = {};
                    }
                    Utils.triggerFn(success, variables, true);
                }, function (errMsg) {
                    Utils.triggerFn(error, errMsg);
                });
            },

            /* Extend each variable in the provided collection with all the properties of that type
            *  The properties are fetched from the baseFactory.
            */
            extendVariables = function (variables) {
                /* extend the variables with all properties not found in the variable */
                WM.forEach(variables, function (variable, name) {
                    variables[name] = WM.extend(BaseVariablePropertyFactory.getProperties(variable.category), variable);
                });

                return variables;
            },

            /* function to initialize variables for passed page */
            initAppVariables = function (scope, success, error) {
                self.variableCollection = self.variableCollection || {};

                /* get application level variables */
                getAppVariables(function (appVariables, freshVariables) {
                    /*if the file is empty, initialize the collection to empty object*/
                    if (typeof appVariables !== 'object') {
                        appVariables = {};
                    }

                    /* extend and update the app variables only if freshly loaded */
                    if (freshVariables) {
                        appVariables = extendVariables(appVariables);

                        /* store the global variables collection */
                        self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP] = appVariables;
                        pageScopeMap[VARIABLE_CONSTANTS.OWNER.APP] = $rootScope;
                        updateContextVariables(VARIABLE_CONSTANTS.OWNER.APP, $rootScope);

                        /* emit an event to specify app-variables are loaded */
                        $rootScope.$emit('on-app-variables-ready', appVariables);
                    }

                    /* check for sanity of success call back and call it */
                    Utils.triggerFn(success, appVariables);

                }, function (errMsg) {
                    /* initialize the global variables collection to empty */
                    self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP] = {};
                    pageScopeMap[VARIABLE_CONSTANTS.OWNER.APP] = $rootScope;

                    /* check for sanity of error call back and call it */
                    Utils.triggerFn(error, errMsg);
                });
            },

            /* function to initialize variables for passed page */
            initPageVariables = function (pageName, scope, options) {
                /* param sanity check */
                options = options || {};
                options.updateAppVariables = options.updateAppVariables || false;

                /* initialize the scope */
                activeScope = scope;
                activePage = pageName;
                self.variableCollection = self.variableCollection || {};

                /* get page level variables */
                getPageVariables(activePage, function (pageVariables) {

                    /*if the file is empty, initialize the collection to empty object*/
                    if (typeof pageVariables !== 'object') {
                        pageVariables = {};
                    }

                    pageVariables = extendVariables(pageVariables);

                    /* store the page variables collection */
                    self.variableCollection[activePage] = pageVariables;
                    updateVariableValues(activePage, !options.updateAppVariables);

                    /* emit an event to specify variables are loaded */
                    $rootScope.$emit('on-' + activePage + '-variables-ready', pageVariables);

                    /* check for sanity of success call back and call it */
                    Utils.triggerFn(options.success, self.variableCollection);
                }, function (errMsg) {
                    /* initialize the app variables collection to empty */
                    self.variableCollection[activePage] = {};

                    /* check for sanity of error call back and call it */
                    Utils.triggerFn(options.error, errMsg);
                });
            },

            /*function to initialize variable collection*/
            initVariableCollection = function (activeWorkspaceName, scope, success, error, isUpdatePageVariables) {
                /* initialize the scope */
                activeScope = scope;
                activePage = activeWorkspaceName;
                self.variableCollection = self.variableCollection || {};

                /* get application level variables */
                getAppVariables(activePage, function (appVariables, freshVariables) {
                    /*if the file is empty, initialize the collection to empty object*/
                    if (typeof appVariables !== 'object') {
                        appVariables = {};
                    }

                    appVariables = extendVariables(appVariables);

                    /* store the global variables collection */
                    self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP] = appVariables;

                    /* emit an event to specify app-variables are loaded */
                    if (freshVariables) {
                        $rootScope.$emit('on-app-variables-ready', appVariables);
                    }

                    /* get page level variables */
                    getPageVariables(activeWorkspaceName, function (pageVariables) {

                        /*if the file is empty, initialize the collection to empty object*/
                        if (typeof pageVariables !== 'object') {
                            pageVariables = {};
                        }

                        pageVariables = extendVariables(pageVariables);

                        /* store the page variables collection */
                        self.variableCollection[activeWorkspaceName] = pageVariables;
                        updateVariableValues(activeWorkspaceName, isUpdatePageVariables);

                        /* emit an event to specify variables are loaded */
                        $rootScope.$emit('on-' + activeWorkspaceName + '-variables-ready', pageVariables);

                        /* check for sanity of success call back and call it */
                        Utils.triggerFn(success, self.variableCollection);
                    }, function (errMsg) {
                        /* initialize the app variables collection to empty */
                        self.variableCollection[activeWorkspaceName] = {};

                        /* check for sanity of error call back and call it */
                        Utils.triggerFn(error, errMsg);
                    });

                }, function (errMsg) {
                    /* initialize the global variables collection to empty */
                    self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP] = {};

                    /* check for sanity of error call back and call it */
                    Utils.triggerFn(error, errMsg);
                });
            },

            /*function to return a variable object respective to a name*/
            getVariableByName = function (variableName, scope) {
                var variables = self.variableCollection;

                /* if scope provided, return the variable in that scope */
                if (scope) {
                    return variables[scope.$id][variableName] || self.variableCollection[$rootScope.$id][variableName];
                }

                /* in Run Mode, find and return the variable against active page or app */
                if (CONSTANTS.isRunMode) {
                    scope = pageScopeMap[$rootScope.activePageName];
                    if (scope && variables[scope.$id][variableName]) {
                        return variables[scope.$id][variableName];
                    }
                    scope = pageScopeMap[VARIABLE_CONSTANTS.OWNER.APP];
                    if (scope && variables[scope.$id][variableName]) {
                        return variables[scope.$id][variableName];
                    }
                }

                /* return the variable against active page or app (In studio mode, this is the writable variable obejct */
                return (variables[VARIABLE_CONSTANTS.OWNER.APP] && variables[VARIABLE_CONSTANTS.OWNER.APP][variableName]) || (variables[$rootScope.activePageName] && variables[$rootScope.activePageName][variableName]) || null;
            },

            /*function to get the type of the variable by its name*/
            getType = function (name) {
                return getVariableByName(name) && getVariableByName(name).category;
            },

           /* function to return variable category list to populate in filter dropdowns */
            getVariableCategoryList = function (collectionType, getKeysList) {
                var categoryList = {},
                    isPrefabProject = $rootScope.isPrefabTemplate;

                if (!isPrefabProject) {
                    variableConfig.forEach(function (variable) {
                        if (!collectionType || collectionType.toLowerCase() === 'all' || variable.collectionType === collectionType) {
                            categoryList[variable.category] = variable.labelKey;
                        }
                    });
                } else {
                    variableConfig.forEach(function (variable) {
                        if (!variable.appOnly && (!collectionType || collectionType.toLowerCase() === 'all' || variable.collectionType === collectionType)) {
                            categoryList[variable.category] = variable.labelKey;
                        }
                    });
                }

                if (getKeysList) {
                    categoryList = Object.keys(categoryList);
                }

                return categoryList;
            },

           /* function to check if variable with specified name exists in the collection*/
            isExists = function (variableName, caseSensitive) {
                var variables = self.variableCollection,
                    arrOfVariables = [],
                    item,
                    iter = 0;
                if (variables[VARIABLE_CONSTANTS.OWNER.APP]) {
                    for (item in variables[VARIABLE_CONSTANTS.OWNER.APP]) {
                        arrOfVariables[iter++] = item;
                    }
                }
                if (variables[$rootScope.activePageName]) {
                    for (item in variables[$rootScope.activePageName]) {
                        arrOfVariables[iter++] = item;
                    }
                }
                return Utils.isDuplicateName(arrOfVariables, variableName, caseSensitive);
            },

            /* function exposed to call method available with a variable */
            call = function (method, name, options, success, error) {
                /* check params sanity */
                options = options || {};

                /* if variable name or method not given, return error */
                if (!name || !method) {
                    Utils.triggerFn(error);
                    return;
                }

                var variable = getVariableByName(name, options.scope),
                    type = variable.category;

                /*invoke the getData method of the specified variable category*/
                BaseVariablePropertyFactory.invoke(method, type, variable, options, function (data, propertiesMap, relatedData, pagingOptions) {
                    Utils.triggerFn(success, data, propertiesMap, relatedData, pagingOptions);
                }, error);
            },

            updateVariableDataSet = function (name, data, propertiesMap, relatedData, pagingOptions) {
                /* sanity checking */
                if (!returnObject[name]) {
                    return;
                }
                /* if returned data is not object, make it as an object with variableName as key*/
                if (!WM.isObject(data)) {
                    var temp = data;
                    data = {};
                    data['value'] = temp;
                }
                /*Check if propertiesMap exist, then store it. Else, directly store the data*/
                if (propertiesMap) {
                    returnObject[name].dataSet = {
                        "data": data,
                        "propertiesMap": propertiesMap,
                        "relatedData": relatedData,
                        "pagingOptions": pagingOptions
                    };
                } else {
                    returnObject[name].dataSet = data;
                }
            },

           /* function to create default non-conflicting name for a variable */
            generateUniqueName = function (category, name, overWrite) {
                var defaultName;

                if (name) {
                    defaultName = name;
                } else {
                    defaultName = variableCategoryToNameMap[category] + self.variableNameIterator[category];
                }

                if (!isExists(defaultName, true) || overWrite) {
                    return defaultName;
                }

                /* increment the iterator for the category and look for unique name again*/
                self.variableNameIterator[category] += 1;
                return generateUniqueName(category);
            },

            /* registers a variable collection in the specified namespace */
            register = function (nameSpace, variables, loadValuesInStudio, scope) {
                /* extend the variables with properties from basefactory */
                variables = extendVariables(variables);

                /* store the variables in provided namespace */
                pageScopeMap[nameSpace] = scope;
                self.variableCollection = self.variableCollection || {};
                self.variableCollection[nameSpace] = variables;

                /* update the variable values in RUN mode */
                if (loadValuesInStudio || runMode) {
                    updateContextVariables(nameSpace, scope);
                    /* emit an event to specify variables are loaded */
                    $rootScope.$emit('on-' + nameSpace + '-variables-ready', variables);
                }
            },

            isEventCallbackVariable = function (category) {
                var retVal = false;
                if (category !== "wm.Variable") {
                    retVal = true;
                }
                return retVal;
            },

        /*function to retrieve service and live variables from the collection, other than the variable name provided.*/
            retrieveEventCallbackVariables = function (variableName) {
                var key, variableArray = [], index, contextVariables, currentVariable, varCollection = self.variableCollection;
                /*iterating over variable collection*/
                for (key in varCollection) {
                    contextVariables = varCollection[key];
                    /*iterating over the context variables (App or Page) to get variables*/
                    for (index in contextVariables) {
                        currentVariable = contextVariables[index];
                        /*checking if variable to be excluded is provided.*/
                        if (variableName) {
                            /*checking if current variable name is not equal to the variable name provided.*/
                            if (index !== variableName &&
                                    (isEventCallbackVariable(currentVariable.category))) {
                                variableArray.push(index);
                            }
                        } else {
                            /*if variable name not provided, return array containing all service and live variables.*/
                            if (isEventCallbackVariable(currentVariable.category)) {
                                variableArray.push(index);
                            }
                        }

                    }
                }
                return variableArray;
            },
            saveContextVariables = function (context, contextVariables) {
                var variables = self.variableCollection;
                variables[context] = contextVariables;
            },

        /*
         * filters the variable collection before pushing into the respective file
         * removes the data not set by the user
         */
            filterVariables = function (variables) {
                WM.forEach(variables, function (variable) {
                    WM.forEach(variable, function (propertyValue, propertyName) {
                        if (propertyValue === "" || propertyValue === undefined) {
                            delete variable[propertyName];
                        }
                    });
                });
                return variables;
            },
        /*function to create a variable*/
            create = function (type, options, name, overWrite) {
                /* type sanity checking */
                type = type || "wm.Variable";
                var variableObj = {},
                    defaultName = '';

                options = WM.isObject(options) ? options : {};

                /* if name prefix provided, create another category and iterator for that category*/
                if (name) {
                    defaultName = generateUniqueName(type, name, overWrite);
                } else {
                    defaultName = generateUniqueName(type);
                }

                /* create the variable object with its basic properties and return it */
                WM.extend(variableObj, BaseVariablePropertyFactory.getProperties(type), {name: defaultName}, options);
                return variableObj;
            },
        /*function to store a variable to the collection*/
            store = function (owner, name, variableObj, variableCollectionObject, isUpdate) {
                /* sanity checking */
                if (!variableObj) {
                    return;
                }
                var varCollectionObj = variableCollectionObject || self.variableCollection,
                    scope;
                owner = owner || VARIABLE_CONSTANTS.OWNER.APP;
                scope = pageScopeMap[owner];

                /* Condition: If type does not exist yet, then create one */
                if (!varCollectionObj.hasOwnProperty(owner) || !varCollectionObj[owner]) {
                    varCollectionObj[owner] = {};
                }

                /* Assign a unique id to the newly created variable */
                variableObj['_id'] = "wm-" + variableObj.category + name +  (new Date().getTime());

                /* Store variable based on type */
                varCollectionObj[owner][name] = variableObj;
                varCollectionObj[scope.$id][name] = WM.copy(variableObj);
                varCollectionObj[scope.$id][name].name = name;
                self.studioCopy[owner][name] = varCollectionObj[scope.$id][name];

                /* if app level variable make it available in the active page scope */
                if (owner === VARIABLE_CONSTANTS.OWNER.APP) {
                    Object.defineProperty(pageScopeMap[$rootScope.activePageName].Variables, name, {
                        configurable: true,
                        get: function () {
                            return varCollectionObj[scope.$id][name];
                        }
                    });
                }

                if (isUpdate) {
                    call('getData', name, {scope: scope});
                }
            },
            initiateCallback = function (event, variable, callBackScope, response) {
                /*checking if event is available and variable has event property and variable event property bound to function*/
                var eventValue = variable[event];
                callBackScope = variable.activeScope;
                if (eventValue) {
                    /* if event value is javascript, call the function defined in the callback scope of the variable */
                    if (eventValue === 'Javascript' && typeof callBackScope[variable.name + event] === 'function') {
                        return callBackScope[variable.name + event](variable, response);
                    }

                    if (eventValue.indexOf('.show') > -1) {
                        DialogService.showDialog(eventValue.slice(0, eventValue.indexOf('.show')));
                        return;
                    }
                    if (eventValue.indexOf('.hide') > -1) {
                        DialogService.hideDialog(eventValue.slice(0, eventValue.indexOf('.hide')));
                        return;
                    }

                    /* invoking the variable in a timeout, so that the current variable dataSet values are updated before invoking */
                    $timeout(function () {
                        $rootScope.$emit("invoke-service", variable[event], {scope: callBackScope});
                        $rootScope.$safeApply(callBackScope);
                    }, null, false);
                }
            },

            /* unloads the variables from the specified namespace */
            unload = function (namespace, scope) {
                /* sanity check */
                if (!namespace) {
                    return;
                }
                self.variableCollection = self.variableCollection || {};

                /*
                 * loop through each variable in the namespace and remove the watchers if any
                 */
                if (watchers[scope.$id]) {
                    WM.forEach(self.variableCollection[namespace], function (variable, name) {
                        if (watchers[scope.$id][name]) {
                            watchers[scope.$id][name].forEach(Utils.triggerFn);
                        }
                    });
                }

                /* remove the variables in namespace from the variable collection*/
                delete self.variableCollection[namespace];
                delete self.variableCollection[scope.$id];
            },

            /* process the requests in the queue for a variable based on the inFlightBehavior flag of the variable */
            processRequestQueue = function (variable, requestQueue, handler) {
                /* process request queue for the variable only if it is not empty */
                if (requestQueue[variable.name] && requestQueue[variable.name].length) {
                    var requestObj;
                    switch (variable.inFlightBehavior) {
                    case 'executeLast':
                        requestObj = requestQueue[variable.name].pop();
                        handler(requestObj.variable, requestObj.options, requestObj.success, requestObj.error);
                        requestQueue[variable.name] = null;
                        break;
                    case 'executeAll':
                        requestObj = requestQueue[variable.name].splice(0, 1).pop();
                        handler(requestObj.variable, requestObj.options, requestObj.success, requestObj.error);
                        break;
                    default:
                        requestQueue[variable.name] = null;
                        break;
                    }
                }
            },

            /*Function to delete the specified variable*/
            deleteVariable = function (name, pageName) {
                var i, pageContext;
                /*Check if pageName is specified*/
                if (pageName) {
                    /*If "name" is specified, delete the specified variable from the page.
                    * Else, delete all the variables of that page.*/
                    if (name) {
                        delete self.variableCollection[pageName][name];
                        /* if in studio mode remove the studio copy of variable*/
                        if (CONSTANTS.isStudioMode) {
                            delete returnObject[name];
                            delete self.studioCopy[pageName][name];
                        }
                    } else {
                        delete self.variableCollection[pageName];
                        /* if in studio mode remove the studio copy */
                        if (CONSTANTS.isStudioMode) {
                            delete self.studioCopy[pageName];
                        }
                    }
                    return;
                }
                /* Condition: Checking for existence of the variable name inside each category, deleting if found */
                for (i in self.variableCollection) {
                    if (self.variableCollection.hasOwnProperty(i) && self.variableCollection[i].hasOwnProperty(name)) {
                        delete self.variableCollection[i][name];
                        /* if in studio mode remove the studio copy of variable*/
                        if (CONSTANTS.isStudioMode && self.studioCopy[i]) {
                            delete self.studioCopy[i][name];
                        }
                        /*if the context is a page and not a scope id, return the page context*/
                        if (ProjectService.getPages().indexOf(i) > -1) {
                            pageContext = i;
                        }
                    }
                }

                /*if deleted variable page context is available, return it else, return false*/
                if (pageContext) {
                    return pageContext;
                }
                return false;
            },

        /*function to filter the variable collection based on the object map provided*/
            filterByVariableKeys = function (variableParams, searchAllContexts) {
                var variables = self.variableCollection,
                    currentVariable,
                    variableOwner,
                    variableNames,
                    varParamsArray = Object.keys(variableParams),
                    index,
                    varParamCounter,
                    currentVarParam,
                    filteredVariables = [],
                    defaultContextArray = ["App", $rootScope.activePageName];

                if (variableParams.owner) {
                    variableOwner = (variableParams.owner === VARIABLE_CONSTANTS.OWNER.APP) ? VARIABLE_CONSTANTS.OWNER.APP : $rootScope.activePageName;
                }

                /*function to find the variables which match the all the keys in the object map provided*/
                function findMatchingVariables(contextVariables, context) {
                    variableNames = Object.keys(contextVariables);

                    /*iterating over the variables of a specific context, either app or page*/
                    for (index = 0; index < variableNames.length; index++) {
                        currentVariable = variables[context][variableNames[index]];

                        /*iterating over the filter keys provided and validating if the
                        * current variable's properties match the filter keys provided*/
                        for (varParamCounter = 0; varParamCounter < varParamsArray.length; varParamCounter++) {
                            currentVarParam = varParamsArray[varParamCounter];

                            /*checking if the properties match, if so pushing the param key to the
                            * temp array*/
                            if (currentVariable[currentVarParam] !== variableParams[currentVarParam]) {
                                break;
                            }
                        }
                        /*if all properties have been matched and are validated to true, then push
                         * the current variable to the filtered variables array*/
                        if (varParamCounter === varParamsArray.length) {
                            if (filteredVariables.indexOf(currentVariable) === -1) {
                                currentVariable.name = variableNames[index];
                                filteredVariables.push(currentVariable);
                            }
                        }
                    }
                }

                /*if searchAllContexts is false, use the variable owner if provided, else use the
                * default contexts - app and active-page to filter the variables.*/
                if (!searchAllContexts) {
                    /*if the variable owner is available, then provide the context to filter variables*/
                    if (variableOwner) {
                        findMatchingVariables(variables[variableOwner], variableOwner);
                    } else {
                        /*if no variable owner and searchAllContexts is false, restrict the contexts
                        * to default variable contexts*/
                        defaultContextArray.forEach(function (context) {
                            findMatchingVariables(variables[context], context);
                        });
                    }
                } else {
                    /*if searchAllContext is true, then use each context in the
                     * variable collection for filtering the collection*/
                    Object.keys(variables).forEach(function (context) {
                        /*only filtering the context for app and pages, ignoring scope-id contexts*/
                        if (isNaN(context)) {
                            findMatchingVariables(variables[context], context);
                        }
                    });
                }
                return filteredVariables;
            },

            getBindMap = function (type, parentReference, oldBindings, typeChain) {
                var types = $rootScope.dataTypes,
                    curFieldObj,
                    typeChainArr;

                oldBindings = oldBindings || {};
                typeChain = typeChain || "";
                typeChainArr = typeChain.split("~");
                if (typeChainArr.indexOf(type) !== -1) {
                    return;
                }
                typeChain += "~" + type;
                if (types && types[type] && types[type].fields) {
                    parentReference.fields = [];
                    WM.forEach(types[type].fields, function (field, fieldName) {
                        curFieldObj = {
                            "name": fieldName,
                            "type": field.type,
                            "isList": field.isList
                        };
                        if (oldBindings[fieldName] && !WM.isObject(oldBindings[fieldName])) {
                            curFieldObj.value = oldBindings[fieldName];
                        }
                        parentReference.fields.push(curFieldObj);
                        getBindMap(field.type, curFieldObj, oldBindings[fieldName], typeChain);
                    });
                }
            };

        /*
         * This object is used to collect all the variables and keep them organized
         * based on their nature.
         * This stores the actual collection retrieved from and stored to the variable files
         */
        this.variableCollection = null;

        /*
         * This object has the variable collection along with modified properties
         * such as dataSet (modified in studio mode)
         * This is only required in studio mode.
         */
        this.studioCopy = {};

        /*check the project ID existence in RUN mode*/
        if (runMode) {
            $rootScope.project = {
                id: ProjectService.getId()
            };
        }
        /*
         * This object stores the variables (name, value) pairs
         * so that widgets can access those
         */
        $rootScope.variables = $rootScope.variables || {};

        initVariableNameMap();

        /*Initialize the variable name iterator to the default value.*/
        resetVariableNameIterator();

        /*Check for Studio mode.*/
        if (CONSTANTS.isStudioMode) {
            /*Register a listener on the rootScope to update the variable with binding information.*/
            $rootScope.$on('bind-widget-to-variable', function (event, variableName, isBind, scope, bindCount) {
                event.stopPropagation();
                var variable = getVariableByName(variableName, scope),
                    writableVariable = getVariableByName(variableName);
                /*Check for variable if in case, variable is deleted and for live variables.*/
                if (variable && variable.category === 'wm.LiveVariable' && variable.operation === 'read') {
                    /*If a variable has been selected for "binding", increment the bindCount.
                    * Else, if the variable has been selected for "unbinding", decrement the bindCount.*/
                    if (isBind) {
                        if (!variable.startUpdate) {
                            variable.bindCount = ((variable.bindCount || 0) + (bindCount || 1));
                            writableVariable.startUpdate = variable.startUpdate = true;
                            variable.update();
                        }
                    } else {
                        variable.bindCount -= 1;
                        /*When the bindCount becomes 0, set the "startUpdate" flag to false*/
                        if (!variable.bindCount) {
                            writableVariable.startUpdate = variable.startUpdate = false;
                        }
                    }
                    writableVariable.bindCount = variable.bindCount;
                    /*Set the "saveVariables" to true so that when "save"/"run" buttons are clicked, the variables could be saved into the file.*/
                    $rootScope.saveVariables = true;
                }
            });
        }

        returnObject = {
            /**
             * @ngdoc method
             * @name $Variables#create
             * @methodOf wm.variables.$Variables
             * @description
             * Creates all kinds of variables (simple, live and service).
             * @param {string} variableType type of the variable to be created
             * @param {object} options contains all the possible configuration values for a variable
             */
            'create': create,

            /**
             * @ngdoc method
             * @name $Variables#store
             * @methodOf wm.variables.$Variables
             * @description
             * Stores a variable instance based on the type of the variable as its key
             * @param {string} type: type of the expected variable
             * @param {object} varObj: object storing the variable attributes
             */
            'store': store,
            /**
             * @ngdoc method
             * @name $Variables#isExists
             * @methodOf wm.variables.$Variables
             * @description
             * Checks whether the variable with specified name exists in store
             * @param {string} variableName name of the variable to be checked for existence
             */
            'isExists': isExists,
            /**
             * @ngdoc method
             * @name $Variables#isNameAvailable
             * @methodOf wm.variables.$Variables
             * @description
             * Checks whether the variable with specified values exists in store
             * @param {object} variableObj object whose values should be checked with existing variables
             */
            'isNameAvailable': function (variableObj) {
                var variableNameAvailable = false,
                    existingVariable = getVariableByName(variableObj.name);

                /* check if the name is available in existing collection*/
                if (variableObj && variableObj['_id'] === existingVariable['_id']) {
                    variableNameAvailable = true;
                }

                return variableNameAvailable;
            },
            /**
             * @ngdoc method
             * @name $Variables#getVariableByName
             * @methodOf wm.variables.$Variables
             * @description
             * Gets a variable instance based on the provided name
             * @param {string} name name of the expected variable
             */
            'getVariableByName': getVariableByName,
            /**
             * @ngdoc method
             * @name $Variables#updateVariable
             * @methodOf wm.variables.$Variables
             * @description
             * Updates a variable instance based on the provided name
             * @param {string} name name of the variable to be updated
             */
            'updateVariable': function (newProperties) {
                var i;
                /* Condition: Checking for existence of the variable name inside each category, updating value if found */
                for (i in self.variableCollection) {
                    if (self.variableCollection.hasOwnProperty(i) && self.variableCollection[i].hasOwnProperty(newProperties.name)) {
                        self.variableCollection[i][newProperties.name] = newProperties;
                    }
                }
                return false;
            },
            /**
             * @ngdoc method
             * @name $Variables#delete
             * @methodOf wm.variables.$Variables
             * @description
             * Deletes a requested variable
             * @param {string} name name of the variable to be deleted
             */
            'delete': deleteVariable,
            /**
             * @ngdoc method
             * @name $Variables#getAll
             * @methodOf wm.variables.$Variables
             * @description
             * Gets all the variables in store
             */
            'getAll': function () {
                return self.variableCollection;
            },

            /**
             * @ngdoc method
             * @name $Variables#getStudioCopy
             * @methodOf wm.variables.$Variables
             * @description
             * Gets all the variables in studio along with data inside the dataSet
             */
            'getStudioCopy': function () {
                return self.studioCopy;
            },

            /**
             * @ngdoc method
             * @name $Variables#saveVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Saves global variables in the file "app.variables.json"  and page level variables corresponding to active page separately, and show toaster message on Success/Failure
             * @param {string} activePageName Name of the active page.
             * @param {function} success success callback function.
             * @param {function} error error callback function.
             * @param {object} updateValues flag to update the variable values.
             *
             */
            'saveVariables': function (activePageName, success, error, updateValues) {
                var variables = self.variableCollection,
                    appVariables = WM.copy(variables[VARIABLE_CONSTANTS.OWNER.APP]),
                    pageVariables = WM.copy(variables[activePageName]);
                if (activePageName && updateValues) {
                    updateVariableValues(activePageName);
                }

                /* filter the variables and remove unset properties from it */
                appVariables = filterVariables(appVariables);
                pageVariables = filterVariables(pageVariables);

                /* save app variables */
                writeFile({path: "app.variables.json", content: appVariables}, function () {
                    if (activePageName) {
                        /* save page variables */
                        writeFile({path: "../../pages/" + activePageName + "/" + activePageName + ".variables.json", content: pageVariables}, function () {
                            Utils.triggerFn(success);
                        }, function (errMsg) {
                            Utils.triggerFn(error, errMsg);
                        });
                    } else {
                        Utils.triggerFn(success);
                    }
                }, function (errMsg) {
                    Utils.triggerFn(error, errMsg);
                });
            },

            /**
             * @ngdoc method
             * @name $Variables#savePageVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Saves page level variables corresponding to active page separately, and show toaster message on Success/Failure
             * @param {string} activePageName Name of the active page.
             * @param {function} success success callback function.
             * @param {function} error error callback function.
             * @param {object} updateValues flag to update the variable values.
             *
             */
            'savePageVariables': function (activePageName, success, error, updateValues) {
                /* sanity check */
                if (!activePageName) {
                    return;
                }
                var variables = self.variableCollection,
                    pageVariables = WM.copy(variables[activePageName]);
                if (updateValues) {
                    updateVariableValues(activePageName);
                }

                /* filter the variables and remove unset properties from it */
                pageVariables = filterVariables(pageVariables);

                /* save page variables */
                writeFile({path: "pages/" + activePageName + "/" + activePageName + ".variables.json", content: pageVariables}, function () {
                    Utils.triggerFn(success);
                }, function (errMsg) {
                    Utils.triggerFn(error, errMsg);
                });
            },

            /**
             * @ngdoc method
             * @name $Variables#saveAppVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Saves global variables in the file "app.variables.json" and show toaster message on Success/Failure
             * @param {function} success success callback function.
             * @param {function} error error callback function.
             * @param {object} updateValues flag to update the variable values.
             *
             */
            'saveAppVariables': function (success, error, updateValues) {
                var variables = self.variableCollection,
                    appVariables = WM.copy(variables[VARIABLE_CONSTANTS.OWNER.APP]);

                if (updateValues) {
                    updateVariableValues();
                }

                /* filter the variables and remove unset properties from it */
                appVariables = filterVariables(appVariables);

                /* save app variables */
                writeFile({path: "app.variables.json", content: appVariables}, function () {
                    Utils.triggerFn(success);
                }, function (errMsg) {
                    Utils.triggerFn(error, errMsg);
                });
            },

            /**
             * @ngdoc method
             * @name $Variables#init
             * @methodOf wm.variables.$Variables
             * @description
             * Initializes the variable collection.
             * The app variables and the current page variables are loaded.
             * The values and bindings of each variable is also initialized.
             * @param {function} success callback
             * @param {function} error callback
             *
             */
            'init': initVariableCollection,

            /**
             * @ngdoc method
             * @name $Variables#initAppVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Initialize the app variable collection for the project
             * @param {function} success callback
             * @param {function} error callback
             *
             */
            'initAppVariables': initAppVariables,

            /**
             * @ngdoc method
             * @name $Variables#initPageVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Initialize the variable collection for a page of the project
             * @param {function} success callback
             * @param {function} error callback
             *
             */
            'initPageVariables': initPageVariables,

            /**
             * @ngdoc method
             * @name $Variables#resetVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Reset the variable collection
             * @param {object} newVariablesObject variables object
             *
             */
            'resetVariables': resetVariables,

            /**
             * @ngdoc method
             * @name $Variables#resetVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Returns the variable category list supported
             * @param {string} collectionType grouping of the variable categories (data, call)
             * return {object} variable categories list
             */
            'getVariableCategoryList': getVariableCategoryList,

            /**
             * @ngdoc method
             * @name $Variables#getType
             * @methodOf wm.variables.$Variables
             * @description
             * Returns type of the variable
             * @param {string} name Name of the variable.
             * @returns {string} type of the variable
             *
             */
            'getType': getType,

            /**
             * @ngdoc method
             * @name $Variables#getVariableNameIterator
             * @methodOf wm.variables.$Variables
             * @description
             * Returns variableNameIterator
             */
            'getVariableNameIterator': function () {
                return self.variableNameIterator;
            },

            /**
             * @ngdoc method
             * @name $Variables#resetVariableNameIterator
             * @methodOf wm.variables.$Variables
             * @description
             * Resets the variableNameIterator
             */
            'resetVariableNameIterator': resetVariableNameIterator,

            /**
             * @ngdoc method
             * @name $Variables#call
             * @methodOf wm.variables.$Variables
             * @description
             * calls the specified method of a variable category
             * @params {string} method method name of variable category to ba called
             * @params {string} name name of variable
             * @params {object} other helper options for the method
             * @params {function} success success callback method
             * @params {function} error error callback method
             */
            'call': call,

            /**
             * @ngdoc method
             * @name $Variables#generateUniqueName
             * @methodOf wm.variables.$Variables
             * @description
             * generates a unique name for a variable
             * @params {string}  category category of the variable
             * @params {string} name name of variable
             * @params {object} other helper options for the method
             * @params {function} success success callback method
             * @params {function} error error callback method
             * @returns {string} unique name of the variable
             */
            generateUniqueName: generateUniqueName,

            /**
             * @ngdoc method
             * @name $Variables#register
             * @methodOf wm.variables.$Variables
             * @description
             * registers a variable collection in the specified namespace
             * @params {string}  category category of the variable
             * @params {string} name name of variable
             * @params {object} other helper options for the method
             * @params {function} success success callback method
             * @params {function} error error callback method
             * @returns {string} unique name of the variable
             */
            register: register,

            /**
             * @ngdoc method
             * @name $Variables#retrieveEventCallbackVariables
             * @methodOf wm.variables.$Variables
             * @description
             * retrieves the service and live variables from the collection
             * @params {string} name of variable to exclude from collection
             * @returns {array} array containing all the service and live variables other than the variable name provided.
             */
            retrieveEventCallbackVariables: retrieveEventCallbackVariables,

            /**
             * @ngdoc method
             * @name $Variables#isEventCallbackVariable
             * @methodOf wm.variables.$Variables
             * @description
             * determines if a variable has event callbacks
             * @params {string} variable category
             * @returns {array} true if variable has event callbacks else false
             */
            isEventCallbackVariable: isEventCallbackVariable,

            /**
             * @ngdoc method
             * @name $Variables#saveContextVariables
             * @methodOf wm.variables.$Variables
             * @description
             * saves the variables based on the context provided
             * @params {string} variable context
             */
            saveContextVariables: saveContextVariables,

            /**
             * @ngdoc method
             * @name $Variables#updateVariableDataSet
             * @methodOf wm.variables.$Variables
             * @description
             * updates the dataSet property of a variable with specified name in the collection
             * @params {string} variable context
             */
            updateVariableDataSet: updateVariableDataSet,

            /**
             * @ngdoc method
             * @name $Variables#createLiveVariable
             * @methodOf wm.variables.$Variables
             * @description
             * creates a live variable based on the specified details
             * @params {object} variable details
             */
            createLiveVariable: function (variableDetails) {
                /* call base service function to create the variable */
                var variableCategory = "wm.LiveVariable",
                    defaultName = variableDetails.service.charAt(0).toUpperCase() + variableDetails.service.slice(1) + variableDetails.table.charAt(0).toUpperCase() + variableDetails.table.slice(1) + "Data",
                    createdVariable,
                    variableName,
                    variableOwner;

                /*If the default variable does not exist, create it.
                * Else, simply return the variable name.*/
                if (!isExists(defaultName)) {

                    createdVariable = create(variableCategory, {owner: variableDetails.owner || "Page", "isList": true}, defaultName);
                    variableName = createdVariable.name;
                    variableOwner = (createdVariable.owner === VARIABLE_CONSTANTS.OWNER.PAGE) ? $rootScope.activePageName : null;

                    /*Set the "liveSource" and "type" properties of the live-variable.*/
                    createdVariable.liveSource = variableDetails.service;
                    createdVariable.type = variableDetails.table;
                    createdVariable.category = variableCategory;
                    createdVariable.isDefault = true;
                    delete createdVariable.name;

                    /* Store the variable in proper category */
                    store(variableOwner, variableName, createdVariable, null, true);

                    /*Update the tree with the newly added variable under the appropriate category(i.e., basic/service/live variables)*/
                    $rootScope.$emit("update-variables-tree", {name: variableName, category: variableCategory, properties: createdVariable});
                } else {
                    variableName = defaultName;
                }

                /*Return the name of the newly created variable.*/
                return variableName;
            },

            /**
             * @ngdoc method
             * @name $Variables#createServiceVariable
             * @methodOf wm.variables.$Variables
             * @description
             * creates a service variable based on the specified details
             * @params {object} variable details
             */
            createServiceVariable: function (variableDetails, overWrite) {
                /* call base service function to create the variable */
                var variableCategory = "wm.ServiceVariable",
                    defaultName = variableDetails.name || variableDetails.service.charAt(0).toUpperCase() + variableDetails.service.slice(1) + variableDetails.operation.charAt(0).toUpperCase() + variableDetails.operation.slice(1),
                    createdVariable,
                    variableName,
                    variableOwner,
                    bindMapCollection;

                /*If the default variable does not exist, create it.
                 * Else, simply return the variable name.*/
                if (!isExists(defaultName) || overWrite) {
                    createdVariable = create(variableCategory, {owner: variableDetails.owner || "Page"}, defaultName, overWrite);
                    variableName = createdVariable.name;
                    variableOwner = (createdVariable.owner === VARIABLE_CONSTANTS.OWNER.PAGE) ? $rootScope.activePageName : null;

                    /*Set the "service" and "operation" properties of the service-variable.*/
                    createdVariable.service = variableDetails.service;
                    createdVariable.operation = variableDetails.operation;
                    createdVariable.operationType = variableDetails.operationType;
                    createdVariable.serviceType = variableDetails.serviceType;
                    createdVariable.category = variableCategory;
                    createdVariable.dataBinding[0].fields = [];
                    createdVariable.isDefault = true;
                    createdVariable.type = variableDetails.returnType;

                    if (variableDetails.wmServiceOperationInfo) {
                        createdVariable.wmServiceOperationInfo = variableDetails.wmServiceOperationInfo;
                    }

                    delete createdVariable.name;

                    /* insert sample param values if provided */
                    bindMapCollection = createdVariable.dataBinding[0].fields;
                    WM.forEach(variableDetails.sampleParamValues, function (val, key) {
                        bindMapCollection.push({
                            "name": key,
                            "value": val,
                            "type": "java.lang.String"
                        });
                    });

                    /* Store the variable in proper category */
                    store(variableOwner, variableName, createdVariable, null, true);

                    /*Update the tree with the newly added variable under the appropriate category(i.e., basic/service/live variables)*/
                    $rootScope.$emit("update-variables-tree", {name: variableName, category: variableCategory, properties: createdVariable});
                } else {
                    variableName = defaultName;
                }

                /*Return the name of the newly created variable.*/
                return variableName;
            },

            /**
             * @ngdoc method
             * @name $Variables#deleteDefaultVariable
             * @methodOf wm.variables.$Variables
             * @description
             * deletes the specified default variable
             * @params {object} variable details
             */
            deleteDefaultVariable: function (variableDetails) {
                /*filter the variable collection by using the provided object map as a filter key*/
                var filteredVariables = filterByVariableKeys(variableDetails, false);

                filteredVariables.forEach(function (variable) {
                    /*calling delete variable on each of the matching variables*/
                    deleteVariable(variable.name, variable.owner);
                });
            },

            /**
             * @ngdoc method
             * @name $Variables#initiateCallback
             * @methodOf wm.variables.$Variables
             * @description
             * handles the triggering of event for a variable in RUN mode
             * @params {event} event to be triggered (onSuccess, onError, etc.)
             * @params {variable} variable details object
             * @params {callBackScope} scope of the callback function (if defined by user)
             * @params {response} response returned by the variable's service
             */
            initiateCallback: initiateCallback,

            /**
             * @ngdoc method
             * @name $Variables#unload
             * @methodOf wm.variables.$Variables
             * @description
             * unloads the variables in specified namespace
             * @params {namespace} the namespace from which the variables are to be unloaded. E.g. the 'page name' for page variables and 'app' for app variables
             */
            unload: unload,

            /**
             * @ngdoc method
             * @name $Variables#getAppVariables
             * @methodOf wm.variables.$Variables
             * @description
             * loads and returns the app variables
             * @params {pageName} event to be triggered (onSuccess, onError, etc.)
             * @params {success} success handler
             * @params {error} error handler
             */
            getAppVariables: getAppVariables,

            /**
             * @ngdoc method
             * @name $Variables#getPageVariables
             * @methodOf wm.variables.$Variables
             * @description
             * reads and returns the variables from specified page name
             * @params {pageName} event to be triggered (onSuccess, onError, etc.)
             * @params {success} success handler
             * @params {error} error handler
             */
            getPageVariables: getPageVariables,

            /**
             * @ngdoc method
             * @name $Variables#setPageVariables
             * @methodOf wm.variables.$Variables
             * @description
             * set the variables for specified page name
             * @params {pageName} name of the page
             * @params {pageVariables} variable object
             */
            setPageVariables: setPageVariables,

            /**
             * @ngdoc method
             * @name $Variables#processRequestQueue
             * @methodOf wm.variables.$Variables
             * @description
             * process the requests in the queue for a variable based on the inFlightBehavior flag of the variable
             * @params {variable} variable object whose request queue is to be processed
             * @params {requestQueue} request queue for the variable
             * @params {handler} handler of the variable request, separate handlers for service and live variables
             */
            processRequestQueue: processRequestQueue,

            /**
             * @ngdoc method
             * @name $Variables#filterByVariableKeys
             * @methodOf wm.variables.$Variables
             * @description
             * filter the variable collection based on the params provided and return the appropriate variable found
             * @params {variableParams} params needed to filter the variable collection and find variable
             */
            filterByVariableKeys: filterByVariableKeys,

            /**
             * @ngdoc method
             * @name $Variables#getBindMap
             * @methodOf wm.variables.$Variables
             * @description
             * gets the bind map structure for a variable based on the type provided
             * @params {type} the type for which the the map is to be prepared
             * @params {parentReference} reference for the target bind map to be prepared at
             */
            getBindMap: getBindMap
        };

        return returnObject;
    }
];
