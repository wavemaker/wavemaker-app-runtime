/*global WM, wm, document, _*/
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
    "VariableService",
    "CONSTANTS",
    "VARIABLE_CONSTANTS",
    "DialogService",
    "$timeout",
    "Utils",
    "BindingManager",
    "MetaDataFactory",
    "WIDGET_CONSTANTS",
    "$q",
    "oAuthProviderService",
    function ($rootScope, BaseVariablePropertyFactory, ProjectService, FileService, VariableService, CONSTANTS, VARIABLE_CONSTANTS, DialogService, $timeout, Utils, BindingManager, MetaDataFactory, WIDGET_CONSTANTS, $q, oAuthProviderService) {
        "use strict";

        /**
         * Migrates old orderBy expression to new
         * e.g. field1,asc&fied2,desc --> field1 asc,field2 desc
         * @param variable for which migration to be done
         */
        function migrateOrderBy(variable) {
            /* migrate old orderBy properties */
            var orderBy = variable.orderBy || "";
            if (_.includes(orderBy, '&')) {
                orderBy = _.map(variable.orderBy.split('&'), function (clause) {
                    return clause.replace(/,/g, ' ');
                }).join(',');
            }
            variable.orderBy = orderBy;
        }

        /*flag to determine app mode
         true: RUN mode
         false: STUDIO mode
         */
        var runMode = CONSTANTS.isRunMode,
            DOT_EXPR_REX = /^\[("|')[\w\W]*(\1)\]$/,
            MAIN_PAGE = 'Main',
            startUpdateQueue = {},
            lazySartUpdateQueue = {},
            internalBoundNodeMap = {},
            serviceToCategoryMap = {},
            variableConfig = {
                "wm.LiveVariable": {
                    "collectionType" : "data",
                    "serviceTypes" : [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.DATABASE],
                    "category"       : "wm.LiveVariable",
                    "defaultName"    : "databaseVariable",
                    "spinnerInFlight": true,
                    "newVariableKey": "New Variable"
                },
                "wm.ServiceVariable" : {
                    "collectionType" : "data",
                    "serviceTypes" : [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.DATABASE_API, VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.WEB, VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.JAVA, VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.SECURITY],
                    "category"       : "wm.ServiceVariable",
                    "defaultName"    : "serviceVariable",
                    "spinnerInFlight": true,
                    "newVariableKey": "New Variable"
                },
                "wm.WebSocketVariable": {
                    "collectionType": "data",
                    "serviceTypes" : [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.WEB],
                    "category"      : "wm.WebSocketVariable",
                    "defaultName"   : "webSocketVariable",
                    "methods"       : ['open', 'send', 'close'],
                    "newVariableKey": "New Variable"
                },
                "wm.Variable": {
                    "collectionType": "data",
                    "serviceTypes" : [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.CUSTOM],
                    "category"      : "wm.Variable",
                    "defaultName"   : "staticVariable",
                    "hideInEvents"  : true
                },
                "wm.NavigationVariable": {
                    "collectionType": "action",
                    "serviceTypes": [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.NAVIGATION],
                    "category"      : "wm.NavigationVariable",
                    "defaultName"   : "navigationAction",
                    "newVariableKey": "New Action"
                },
                "wm.LoginVariable": {
                    "collectionType" : "action",
                    "serviceTypes": [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.LOGIN],
                    "category"       : "wm.LoginVariable",
                    "defaultName"    : "loginAction",
                    "appOnly"        : true,
                    "spinnerInFlight": true,
                    "newVariableKey": "New Action",
                    "hideInEvents"  : true
                },
                "wm.LogoutVariable": {
                    "collectionType" : "action",
                    "serviceTypes": [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.LOGOUT],
                    "category"       : "wm.LogoutVariable",
                    "defaultName"    : "logoutAction",
                    "appOnly"        : true,
                    "spinnerInFlight": true,
                    "newVariableKey": "New Action",
                    "hideInEvents"  : true
                },
                "wm.TimerVariable": {
                    "collectionType": "action",
                    "serviceTypes": [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.TIMER],
                    "category"      : "wm.TimerVariable",
                    "defaultName"   : "timerAction",
                    "newVariableKey": "New Action"
                },
                "wm.NotificationVariable": {
                    "collectionType": "action",
                    "serviceTypes": [VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.NOTIFICATION],
                    "category"      : "wm.NotificationVariable",
                    "defaultName"   : "notificationAction",
                    "newVariableKey": "New Action"
                }
            },

            variableCategoryToNameMap = {},
            self = this,
            /*Initializing a map to store all changes made to variables*/
            CRUDMAP = {
                CREATE : {},
                UPDATE : {},
                DELETE : {},
                MOVE   : {}
            },
            reloadRequired = [],

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
                _.forEach(variableConfig, function (variable) {
                    variableCategoryToNameMap[variable.category] = variable.defaultName;
                });
            },
            initServiceToCategoryMap = function () {
                // TODO[VIBHU]: To be initialized from variableConfig, remove hard coding
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.DATABASE] = ['wm.LiveVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.DATABASE_API] = ['wm.ServiceVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.WEB] = ['wm.ServiceVariable', 'wm.WebSocketVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.JAVA] = ['wm.ServiceVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.SECURITY] = ['wm.ServiceVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.CUSTOM] = ['wm.Variable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.NAVIGATION] = ['wm.NavigationVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.NOTIFICATION] = ['wm.NotificationVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.LOGIN] = ['wm.LoginVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.LOGOUT] = ['wm.LogoutVariable'];
                serviceToCategoryMap[VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.TIMER] = ['wm.TimerVariable'];
            },

        /*Function to set the variable name iterator with the specified value*/
            resetVariableNameIterator = function () {
                self.variableNameIterator = {};
                Object.keys(variableCategoryToNameMap).forEach(function (category) {
                    self.variableNameIterator[category] = 1;
                });
            },

        /*function to reload the variables of current context*/
            reloadVariables = function (success, error) {

                var pageVariablesLoaded = false,
                    appVariablesLoaded  = false;

                function handleSuccess() {
                    /*Executing success if both app and current page variables are reloaded*/
                    if (pageVariablesLoaded && appVariablesLoaded) {
                        Utils.triggerFn(success);
                    }
                }
                reloadRequired.push(VARIABLE_CONSTANTS.OWNER.APP);
                initAppVariables($rootScope, function () {
                    appVariablesLoaded = true;
                    handleSuccess();
                }, error);

                if ($rootScope.activePageName) {
                    reloadRequired.push($rootScope.activePageName);
                    initPageVariables($rootScope.activePageName, function () {
                        pageVariablesLoaded = true;
                        handleSuccess();
                    }, error);
                } else {
                    pageVariablesLoaded = true;
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
                        if ((newVal === oldVal && WM.isUndefined(newVal)) || (WM.isUndefined(newVal) && !WM.isUndefined(oldVal))) {
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
                            if (variable.autoUpdate && !WM.isUndefined(newVal) && WM.isFunction(variable.update)) {
                                variable.update();
                            }
                        } else if (variable.category === "wm.LiveVariable") {
                            if (variable.operation === "read") {
                                variable.filterFields[param] = {
                                    'value': newVal
                                };
                                /* if auto-update set for the variable with read operation only, get its data */
                                if (variable.autoUpdate && !WM.isUndefined(newVal) && WM.isFunction(variable.update)) {
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
                        } else if (variable.category === "wm.DeviceVariable") {
                            variable[param] = newVal;
                            if (variable.autoUpdate) {
                                variable.invoke();
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
                } else if(variable.category === "wm.DeviceVariable") {
                    variable[param] = bindingVal;
                }
            },

            timers = {},

            //debouncing callVariableMethod
            _invoke = function (variable, op) {
                var cancelFn = _.noop, debouncedFn, key = variable._id + '__' + op + '__' + (_.get(variable, ['activeScope', '$id']) || '');
                if (timers[key]) {
                    cancelFn = timers[key].cancel;
                }
                cancelFn();
                debouncedFn = _.debounce(function () {
                    variable[op]();
                }, 100);
                timers[key] = debouncedFn;
                debouncedFn();
            },

            processVariablePostBindUpdate = function (nodeName, nodeVal, nodeType, variable, noUpdate) {

                if (variable.category === 'wm.LiveVariable') {
                    if (variable.operation === 'read') {
                        if (nodeName === 'dataBinding') {
                            _.forEach(nodeVal, function (val, key) {
                                variable.filterFields[key] = {
                                    'value': val
                                };
                            });
                        } else {
                            variable.filterFields[nodeName] = {
                                'value': nodeVal,
                                'type' : nodeType
                            };
                        }
                        /* if auto-update set for the variable with read operation only, get its data */
                        if (variable.autoUpdate && !WM.isUndefined(nodeVal) && WM.isFunction(variable.update) && !noUpdate) {
                            _invoke(variable, 'update');
                        }
                    } else {
                        if (nodeName === 'dataBinding') {
                            variable.inputFields = nodeVal;
                        } else {
                            variable.inputFields[nodeName] = nodeVal;
                        }
                        /* if auto-update set for the variable with read operation only, get its data */
                        if (variable.autoUpdate && !WM.isUndefined(nodeVal) && WM.isFunction(variable[variable.operation + 'Record']) && !noUpdate) {
                            _invoke(variable, variable.operation + 'Record');
                        }
                    }
                } else if (variable.category === 'wm.ServiceVariable') {
                    if (variable.autoUpdate && !WM.isUndefined(nodeVal) && WM.isFunction(variable.update) && !noUpdate) {
                        _invoke(variable, 'update');
                    }
                } else if (variable.category === 'wm.LoginVariable') {
                    if (variable.autoUpdate && !WM.isUndefined(nodeVal) && WM.isFunction(variable.login) && !noUpdate) {
                        _invoke(variable, 'login');
                    }
                } else if (variable.category === 'wm.DeviceVariable') {
                    variable[nodeName] = nodeVal;
                    if (variable.autoUpdate && !WM.isUndefined(nodeVal) && WM.isFunction(variable.invoke) && !noUpdate) {
                        _invoke(variable, 'invoke');
                    }
                }
            },

            /*Function to get array of required variable objects*/
            getVariablesByNames = function (pageName, namesArray) {
                var tempCollection = [],
                    collection = self.variableCollection[pageName];
                _.each(namesArray, function (name) {
                    if (collection[name]) {
                        tempCollection.push(collection[name]);
                    }
                });
                return filterVariables(Utils.getClonedObject(tempCollection));
            },

            /*Function to check if map is empty in provided context*/
            isCrudEmpty = function (map, pageName) {
                /*If the map for particular page doesn't exist then considering its empty*/
                if (!map.CREATE[pageName]) {
                    return true;
                }
                return !map.CREATE[pageName].length && !map.UPDATE[pageName].length && !map.DELETE[pageName].length && !map.MOVE[pageName].length;
            },

            /*Function to call respective 'CRUD' service*/
            executeCrudOp = function (pageName, success, error) {
                function handleSuccess(crudMapCopy, pageName) {
                    if (isCrudEmpty(crudMapCopy, pageName)) {
                        /*trigger fn*/
                        Utils.triggerFn(success);
                    }
                }
                if (isCrudEmpty(CRUDMAP, pageName)) {
                    /*triggering success fn if map is empty*/
                    Utils.triggerFn(success);
                } else {
                    var params = {
                            projectId: $rootScope.project.id,
                            pageName : pageName
                        },
                        crudMapCopy = Utils.getClonedObject(CRUDMAP),//Making a cloned copy of crud map and using it in services
                        opTypes = ['CREATE', 'UPDATE'];
                    _.each(opTypes, function (op) {
                        if (crudMapCopy[op][pageName].length) {
                            CRUDMAP[op][pageName] = [];//Emptying array in original map
                            params.data = getVariablesByNames(pageName, crudMapCopy[op][pageName]);
                            VariableService[op.toLowerCase()](params, function () {
                                crudMapCopy[op][pageName] = [];//Emptying array in cloned map
                                handleSuccess(crudMapCopy, pageName);
                            }, function (errMsg) {
                                Utils.triggerFn(error, errMsg);
                            });
                        }
                    });
                    /*Making a call to move variables*/
                    if (crudMapCopy.MOVE[pageName].length) {
                        params.toPage = pageName === VARIABLE_CONSTANTS.OWNER.APP ? $rootScope.activePageName : VARIABLE_CONSTANTS.OWNER.APP;
                        CRUDMAP.MOVE[pageName] = [];//Emptying array in original map
                        params.data = getVariablesByNames(params.toPage, crudMapCopy.MOVE[pageName]);
                        VariableService.move(params, function () {
                            crudMapCopy.MOVE[pageName] = [];//Emptying array in cloned map
                            handleSuccess(crudMapCopy, pageName);
                        }, function (errMsg) {
                            Utils.triggerFn(error, errMsg);
                        });
                    }
                    /*Making a call to delete variables*/
                    if (crudMapCopy.DELETE[pageName].length) {
                        CRUDMAP.DELETE[pageName] = [];//Emptying array in original map
                        params.deletedNames = crudMapCopy.DELETE[pageName].join(',');
                        VariableService.delete(params, function () {
                            crudMapCopy.DELETE[pageName] = [];//Emptying array in cloned map
                            handleSuccess(crudMapCopy, pageName);
                        }, function (errMsg) {
                            Utils.triggerFn(error, errMsg);
                        });
                    }
                }
            },

            /**
             * Returns the object node for a bind object, where the value has to be updated
             * obj.target = "a"
             * @param obj
             * @param root
             * @param variable
             * @returns {*}
             */
            getTargetObj = function (obj, root, variable) {
                /*
                 * if the target key is in the form as "['my.param']"
                 * keep the target key as "my.param" and do not split further
                 * this is done, so that, the computed value against this binding is assigned as
                 *      {"my.param": "value"}
                 * and not as
                 *      {
                 *          "my": {
                 *              "param": "value"
                 *          }
                 *      }
                 */
                var target = obj.target,
                    targetObj,
                    rootNode = variable[root];
                if (DOT_EXPR_REX.test(target)) {
                    targetObj = rootNode;
                } else {
                    target = target.substr(0, target.lastIndexOf('.'));
                    if (obj.target === root) {
                        targetObj = variable;
                    } else if (target) {
                        targetObj = Utils.findValueOf(rootNode, target, true);
                    } else {
                        targetObj = rootNode;
                    }
                }
                return targetObj;
            },

            /**
             * Gets the key for the target object
             * the computed value will be updated against this key in the targetObject(computed by getTargetObj())
             * @param target
             * @param regex
             * @returns {*}
             */
            getTargetNodeKey = function (target) {
                /*
                 * if the target key is in the form as "['my.param']"
                 * keep the target key as "my.param" and do not split further
                 * this is done, so that, the computed value against this binding is assigned as
                 *      {"my.param": "value"}
                 * and not as
                 *      {
                 *          "my": {
                 *              "param": "value"
                 *          }
                 *      }
                 */
                var targetNodeKey;
                if (DOT_EXPR_REX.test(target)) {
                    targetNodeKey = target.replace(/^(\[["'])|(["']\])$/g, '');
                } else {
                    targetNodeKey = target.split(".").pop();
                }
                return targetNodeKey;
            },

            setValueToNode = function (target, obj, root, variable, value, noUpdate) {
                var targetNodeKey = getTargetNodeKey(target),
                    targetObj = getTargetObj(obj, root, variable);
                value = WM.isDefined(value) ? value : obj.value;
                /* sanity check, user can bind parent nodes to non-object values, so child node bindings may fail */
                if (targetObj) {
                    targetObj[targetNodeKey] = value;
                }
                processVariablePostBindUpdate(targetNodeKey, value, obj.type, variable, noUpdate);
            },

            /**
             * The model internalBoundNodeMap stores the reference to latest computed values against internal(nested) bound nodes
             * This is done so that the internal node's computed value is not lost, once its parent node's value is computed at a later point
             * E.g.
             * Variable.employeeVar has following bindings
             * "dataBinding": [
                 {
                     "target": "department.budget",
                     "value": "bind:Variables.budgetVar.dataSet"
                 },
                 {
                     "target": "department",
                     "value": "bind:Variables.departmentVar.dataSet"
                 }
             ]
             * When department.budget is computed, employeeVar.dataSet = {
             *  "department": {
             *      "budget": {"q1": 1111}
             *  }
             * }
             *
             * When department is computed
             *  "department": {
             *      "name": "HR",
             *      "location": "Hyderabad"
             *  }
             * The budget field (computed earlier) is LOST.
             *
             * To avoid this, the latest values against internal nodes (in this case department.budget) are stored in a map
             * These values are assigned back to internal fields if the parent is computed (in this case department)
             * @param target
             * @param root
             * @param variable
             */
            updateInternalNodes = function (target, root, variable) {
                var boundInternalNodes = _.keys(_.get(internalBoundNodeMap, [variable.activeScope.$id, variable.name, root])),
                    targetNodeKey = getTargetNodeKey(target),
                    internalNodes;
                function findInternalNodeBound() {
                    return _.filter(boundInternalNodes, function (node) {
                        return (node !== targetNodeKey && _.includes(node, targetNodeKey)) || (targetNodeKey === root && node !== targetNodeKey);
                    });
                }
                internalNodes = findInternalNodeBound();
                if ((internalNodes.length)) {
                    _.forEach(internalNodes, function (node) {
                        setValueToNode(node, {target: node}, root, variable, _.get(internalBoundNodeMap, [variable.activeScope.$id, variable.name, root, node]));
                    });
                }
            },

            /**
             * New Implementation (DataBinding Flat Structure with x-path targets)
             * processes a dataBinding object, if bound to expression, watches over it, else assigns value to the expression
             * @param obj dataBinding object
             * @param scope scope of the variable
             * @param root root node string (dataBinding for all variables, dataSet for static variable)
             * @param variable variable object
             */
            processBindObject = function (obj, scope, root, variable) {
                var target = obj.target,
                    targetObj = getTargetObj(obj, root, variable),
                    targetNodeKey = getTargetNodeKey(target);

                if (Utils.stringStartsWith(obj.value, "bind:")) {
                    BindingManager.register(scope, obj.value.replace("bind:", ""), function (newVal, oldVal) {
                        if ((newVal === oldVal && WM.isUndefined(newVal)) || (WM.isUndefined(newVal) && (!WM.isUndefined(oldVal) || !WM.isUndefined(targetObj[targetNodeKey])))) {
                            return;
                        }
                        // When a variable is bound to an empty object then its datset shouldn't be empty, if empty
                        // then the bind dialog won't contain datset values for that particular variable.
                        // Hence, check if the bound value is an empty object, then retain the old dataset, if defined.
                        if (!runMode && WM.isDefined(oldVal) && _.isEqual(newVal, {})) {
                                return;
                        }
                        //Skip cloning for blob column
                        if (!_.includes(['blob', 'file'], obj.type)) {
                            newVal = Utils.getClonedObject(newVal);
                        }
                        setValueToNode(target, obj, root, variable, newVal); // cloning newVal to keep the source clean

                        if (runMode) {
                            /*set the internal bound node map with the latest updated value*/
                            _.set(internalBoundNodeMap, [variable.activeScope.$id, variable.name, root, target], newVal);
                            /*update the internal nodes after internal node map is set*/
                            if (WM.isObject(newVal)) {
                                updateInternalNodes(target, root, variable);
                            }
                        }
                    }, {'deepWatch': true});
                } else if (WM.isDefined(obj.value)) {
                    setValueToNode(target, obj, root, variable, obj.value, true);
                    if (runMode && root !== targetNodeKey) {
                        _.set(internalBoundNodeMap, [variable.activeScope.$id, variable.name, root, target], obj.value);
                    }
                }
            },

            /**
             * This traverses the filterexpressions object recursively and process the bind string if any in the object
             * @param variable variable object
             * @param name name of the variable
             * @param scope scope of the variable
             */
            processFilterExpBindNode = function(scope, filterExpressions, success) {
                var bindFilExpObj = function(obj, targetNodeKey) {
                    if (Utils.stringStartsWith(obj[targetNodeKey], "bind:")) {
                        BindingManager.register(scope, obj[targetNodeKey].replace("bind:", ""), function (newVal, oldVal) {
                            if ((newVal === oldVal && WM.isUndefined(newVal)) || (WM.isUndefined(newVal) && !WM.isUndefined(oldVal))) {
                                return;
                            }
                            //Skip cloning for blob column
                            if (!_.includes(['blob', 'file'], obj.type)) {
                                newVal = Utils.getClonedObject(newVal);
                            }
                            //setting value to the root node
                            if (obj) {
                                //backward compatibility: where we are allowing the user to bind complete object
                                if(obj.target === "dataBinding") {
                                    //remove the existing databinding element
                                    filterExpressions.rules = [];
                                    //now add all the returned values
                                    _.forEach(newVal, function(value, target) {
                                        filterExpressions.rules.push({
                                            'target': target,
                                            'value': value,
                                            'matchMode': obj.matchMode || 'startignorecase',
                                            'required': false,
                                            'type':''
                                        })
                                    });
                                } else {
                                    obj[targetNodeKey] = newVal;
                                }
                            }

                            Utils.triggerFn(success, filterExpressions, newVal);
                        }, {'deepWatch': true});
                    }
                };

                var traverseFilterExpressions = function(filterExpressions) {
                    if (filterExpressions.rules) {
                        _.forEach(filterExpressions.rules, function (filExpObj, i) {
                            if (filExpObj.rules) {
                                traverseFilterExpressions(filExpObj);
                            } else {
                                if(filExpObj.matchMode === "between") {
                                    bindFilExpObj(filExpObj, "secondvalue");
                                }
                                bindFilExpObj(filExpObj, "value");
                            }
                        });
                    }
                };
                traverseFilterExpressions(filterExpressions);
            },

            /**
             * Old Implementation (DataBinding Recursive Structure)
             * processes a dataBinding object, if bound to expression, watches over it, else assigns value to the expression
             * @param node binding node object
             * @param parentNode parent object
             * @param scope scope of the variable
             * @param variable variable object
             */
            processBindNode = function (node, parentNode, scope, variable) {
                if (Utils.stringStartsWith(node.value, "bind:")) {
                    scope.$watch(node.value.replace("bind:", ""), function (newVal, oldVal) {
                        if ((newVal === oldVal && WM.isUndefined(newVal)) || (WM.isUndefined(newVal) && (!WM.isUndefined(oldVal) || !WM.isUndefined(parentNode[node.name])))) {
                            return;
                        }
                        parentNode[node.name] = newVal;
                        processVariablePostBindUpdate(node.name, newVal, node.type, variable);
                    }, true);
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
                var bindMap, root;

                /* un-register previous watchers, if any */
                watchers[scope.$id][name] = watchers[scope.$id][name] || [];
                watchers[scope.$id][name].forEach(Utils.triggerFn);

                /*
                 * new implementation: dataBinding is a flat array of binding objects with x-path targets
                 * old implementation: dataBinding is a recursive map of binding objects
                 * old implementation: dataBinding is an object map
                 */
                if (WM.isArray(variable.dataBinding)) {
                    bindMap = variable.dataBinding;
                    root = variable.category === "wm.Variable" ? "dataSet" : "dataBinding";
                    variable.dataBinding = {};
                    if (bindMap[0] && WM.isArray(bindMap[0].fields)) {
                        /* old projects(without migration): dataBinding is a recursive map of binding objects */
                        bindMap.forEach(function (node) {
                            processBindNode(node, variable, scope, variable);
                        });
                    } else {
                        /* new projects with flat bind map */
                        bindMap.forEach(function (node) {
                            /* for static variable change the binding with target 'dataBinding' to 'dataSet', as the results have to reflect directly in the dataSet */
                            if (variable.category === "wm.Variable" && node.target === 'dataBinding') {
                                node.target = 'dataSet';
                            }
                            processBindObject(node, scope, root, variable);
                        });
                    }
                } else {
                    /*
                     * oldest implementation: loop over each variable-binding object to check for bindings
                     * NOTE: Notification Variables still follow this structure, can not be removed
                     */
                    WM.forEach(variable.dataBinding, function (binding, param) {
                        if (typeof binding === 'object' && variable.category === 'wm.ServiceVariable') {
                            WM.forEach(binding, function (subParamBinding, subParam) {
                                bindVariableField({bindingVal: subParamBinding, paramName: subParam, variable: variable, variableName: name, parentNode: param, scope: scope});
                            });
                        }
                        bindVariableField({bindingVal: binding, paramName: param, variable: variable, variableName: name, scope: scope});
                    });
                }

                // Process bindings for navigation variable's dataSet
                if (runMode && variable.category === "wm.NavigationVariable" && WM.isArray(variable.dataSet)) {
                    bindMap = variable.dataSet;
                    root = "dataSet";
                    variable.dataSet = {};
                    /* new projects with flat bind map */
                    bindMap.forEach(function (node) {
                        processBindObject(node, scope, root, variable);
                    });
                }
            },

            /**
             * calls the default method on the variable to get data
             * e.g.
             * - 'update' method for Live/Service Variable
             * - 'invoke' method for Device Variable
             * @param variable
             */
            makeVariableCall = function (variable) {
                var method,
                    deferredVariableCall = $q.defer(),
                    forceResolve;
                switch (variable.category) {
                case 'wm.ServiceVariable':
                    method = 'update';
                    break;
                case 'wm.WebSocketVariable':
                    method = 'open';
                    deferredVariableCall.resolve();
                    break;
                case 'wm.LiveVariable':
                    /*
                     * For variable with operation other than 'read', call respective method in RUN mode
                     * In studio mode, DB and table related data is to be fetched and saved in the variable
                     * So, getData is called in STUDIO mode for liva variables with all types of operations
                     */
                    if (variable.operation !== 'read') {
                        method = variable.operation + 'Record';
                    } else {
                        method = 'update';
                    }
                    break;
                case 'wm.LoginVariable':
                    method = 'login';
                    break;
                case 'wm.TimerVariable':
                    method = 'fire';
                    deferredVariableCall.resolve();
                    break;
                case 'wm.DeviceVariable':
                    method = 'invoke';
                    forceResolve = true;
                    break;
                }
                if (WM.isFunction(variable[method])) {
                    /* TODO [VIBHU]: TEMP fix for continuous spinner issue in fetching contacts
                     * Variable has startUpdate and autoUpdate enabled
                     * autoUpdate call is going first and being met
                     * startUpdate call is going but not resolved by cordova. Needs to be checked
                     */
                    if (forceResolve) {
                        deferredVariableCall.resolve();
                    }
                    variable[method](undefined, deferredVariableCall.resolve, deferredVariableCall.reject);
                } else {
                    deferredVariableCall.reject();
                }
                return deferredVariableCall.promise;
            },

            /**
             * If the parent page(main page being loaded) is not ready
             * the variable is pushed in the startUpdateQueue, which is processed after the page is loaded
             *
             * If it is ready
             * the method on variable is simply called
             * @param variable
             */
            processVariableStartUpdate = function (variable, scope) {
                if ($rootScope._pageReady) {
                    lazySartUpdateQueue[scope.$id] = lazySartUpdateQueue[scope.$id] || [];
                    lazySartUpdateQueue[scope.$id].push(variable);
                } else {
                    startUpdateQueue[scope.$id] = startUpdateQueue[scope.$id] || [];
                    startUpdateQueue[scope.$id].push(variable);
                }
            },
            /*
            * Trigger update on variable based on run/studio mode
            * */
            updateVariableData = function (variable, name, context, scope, options) {
                /* assign variable name to the variable object for later use */
                variable.name = name;
                if (variable.init) {
                    variable.init();
                }
                if (runMode) {
                    variable.activeScope = scope;
                } else {
                    /* this copy is used by binding dialog in STUDIO mode */
                    self.studioCopy[context][name] = variable;
                }

                /* update variable bindings */
                updateVariableBinding(variable, name, scope);

                /* update variable bindings in case of live Variables */
                if (variable.operation == "read" && !_.isNil(variable.filterExpressions) && _.isObject(variable.filterExpressions)) {
                    /* un-register previous watchers, if any */
                    watchers[scope.$id][name] = watchers[scope.$id][name] || [];
                    watchers[scope.$id][name].forEach(Utils.triggerFn);

                    var onSuccess = function (filterExpressions, newVal) {
                        if (variable.operation === 'read') {
                            /* if auto-update set for the variable with read operation only, get its data */
                            if (variable.autoUpdate && !WM.isUndefined(newVal) && WM.isFunction(variable.update)) {
                                _invoke(variable, 'update');
                            }
                        } else {
                            /* if auto-update set for the variable with read operation only, get its data */
                            if (variable.autoUpdate && !WM.isUndefined(newVal) && WM.isFunction(variable[variable.operation + 'Record'])) {
                                _invoke(variable, variable.operation + 'Record');
                            }
                        }
                    };
                    processFilterExpBindNode(scope, variable.filterExpressions, onSuccess);
                }

                /*iterating over the collection to update the variables appropriately.*/
                if (variable.category === "wm.Variable") {
                    /*
                     * Case: a LIST type static variable having only one object
                     * and the object has all fields empty, remove that object
                     */
                    if (CONSTANTS.isRunMode && variable.isList && variable.dataSet.length === 1) {
                        var firstObj   = variable.dataSet[0],
                            isEmpty    = true,
                            checkEmpty = function (obj) {
                                _.forEach(obj, function (value) {
                                    if (!_.isEmpty(value)) {
                                        if (_.isObject(value)) {
                                            if (_.isArray(value)) {
                                                //If array, check if array is empty or if it has only one value and the value is empty
                                                isEmpty = _.isEmpty(value) || (value.length === 1 ? _.isEmpty(value[0]) : false);
                                            } else {
                                                //If object, loop over the object to check if it is empty or not
                                                checkEmpty(value);
                                            }
                                        } else {
                                            isEmpty = false;
                                        }
                                    }
                                    return isEmpty;
                                });
                            };
                        checkEmpty(firstObj);
                        if (isEmpty) {
                            variable.dataSet = [];
                        }
                    }
                } else if (variable.category === "wm.ServiceVariable") {
                    if (runMode) {
                        variable.canUpdate = true;
                        if (variable.startUpdate) {
                            processVariableStartUpdate(variable, scope);
                        }
                    } else {
                        //fetching the meta data in design mode always
                        if (WM.isFunction(variable.update)) {
                            variable.update(options);
                        }
                    }
                }  else if (variable.category === "wm.WebSocketVariable") {
                    if (variable.startUpdate && runMode) {
                        processVariableStartUpdate(variable, scope);
                    }
                } else if (variable.category === "wm.LiveVariable") {
                    migrateOrderBy(variable);
                    if (runMode) {
                        variable.canUpdate = true;
                        if (variable.startUpdate) {
                            processVariableStartUpdate(variable, scope);
                        }
                    } else {
                        if (variable.startUpdate && WM.isFunction(variable.update)) {
                            $timeout(function () {
                                variable.update();
                            }, null, false);
                        } else {
                            /*
                             * In studio mode, DB and table related data is to be fetched and saved in the variable
                             * So, getData is called in STUDIO mode for liva variables with all types of operations
                             * since startUpdate is unset, table data is not required, hence skipFetchData flag is set
                             */
                            $timeout(function () {
                                /* keeping the call in a timeout to wait for the widgets to load first and the binding to take effect */
                                if (WM.isFunction(variable.update)) {
                                    variable.update({skipFetchData: true});
                                }
                            }, null, false);
                        }
                    }
                } else if (variable.category === "wm.LoginVariable") {
                    if (runMode && variable.startUpdate) {
                        processVariableStartUpdate(variable, scope);
                    }
                } else if (variable.category === "wm.TimerVariable") {
                    if (runMode && variable.autoStart) {
                        processVariableStartUpdate(variable, scope);
                    }
                } else if (variable.category === "wm.DeviceVariable") {
                    if (runMode && variable.startUpdate) {
                        processVariableStartUpdate(variable, scope);
                    }
                }
            },

            isActionTypeVariable = function (variable) {
                var serviceType = getVariableServiceType(variable),
                    actionServiceTypes = getServiceTypesByCollectionType('action');
                return _.includes(actionServiceTypes, serviceType);
            },

            getVariableCollectionType = function(variable) {
                return variableConfig[variable.category].collectionType;
            },

            defineActionsOnScope = function (scope, context) {
                scope.Actions = {};
                WM.forEach(scope.Variables, function (variable, name) {
                    if (isActionTypeVariable(variable)) {
                        Object.defineProperty(scope.Actions, name, {
                            configurable: true,
                            get: function () {
                                return variable;
                            }
                        });
                    }
                });

                /* extend scope Actions with app Actions, in studio mode */
                if (context !== VARIABLE_CONSTANTS.OWNER.APP) {
                    WM.forEach(self.variableCollection[$rootScope.$id], function (variable, name) {
                        if (!scope.Actions.hasOwnProperty(name) && isActionTypeVariable(variable)) {
                            Object.defineProperty(scope.Actions, name, {
                                configurable: true,
                                get: function () {
                                    return variable;
                                }
                            });
                        }
                    });
                }
            },
            /*
             * Updates the variables in a context with their latest values
             * context refers to the namespace for the variables collection, like 'app'/page/partial/prefab
             */
            updateContextVariables = function (context, scope) {
                self.studioCopy[context] = {};

                scope = scope || pageScopeMap[context] || {};
                watchers[scope.$id] = {};

                /* Maintain a copy of the variables in the exposed collection
                 * Primary reason for this:
                 * StudioMode: any update to the dataSet or other properties by variable will not reflect in the actual collection
                 * RunMode: The same collection is used by same partials/prefabs appearing twice in a page */
                self.variableCollection[scope.$id] = Utils.getClonedObject(self.variableCollection[context]);

                scope.Variables = self.variableCollection[scope.$id];

                /* extend scope variables with app variables, in studio mode */
                if (context !== VARIABLE_CONSTANTS.OWNER.APP) {
                    WM.forEach(self.variableCollection[$rootScope.$id], function (variable, name) {
                        if (!scope.Variables.hasOwnProperty(name)) {
                            Object.defineProperty(scope.Variables, name, {
                                configurable: true,
                                get: function () {
                                    return variable;
                                }
                            });
                        }
                    });
                }
                _.forEach(self.variableCollection[scope.$id], function (variable, name) {
                    /*Define Property getter setter for operation Info*/
                    Object.defineProperty(variable, '_wmServiceOperationInfo', {
                        get: function () {
                            return MetaDataFactory.getByOperationId(variable.operationId, variable._prefabName);
                        },
                        configurable: true
                    });
                    //Trigger update on variable based on run/studio mode
                    updateVariableData(variable, name, context, scope);
                });

                // Expose the Actions in a separate namespace (Post 9.0)
                defineActionsOnScope(scope, context);
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

            /* function to set page variables for a specified page*/
            setPageVariables = function (pageName, pageVariables) {
                /* check for existence */
                self.variableCollection = self.variableCollection || {};
                /* set the variables*/
                self.variableCollection[pageName] = pageVariables || {};
            },

            /* function to get page variables for a specified page*/
            getPageVariables = function (pageName, success, error, skipEmptyCRUD) {
                var requestParams;
                if (!runMode && !skipEmptyCRUD) {
                    /*Initializing map with pageName context*/
                    CRUDMAP.CREATE[pageName] = [];
                    CRUDMAP.DELETE[pageName] = [];
                    CRUDMAP.UPDATE[pageName] = [];
                    CRUDMAP.MOVE[pageName] = [];
                }
                /* check for existence */
                if (self.variableCollection !== null && self.variableCollection[pageName] && (reloadRequired && !_.includes(reloadRequired, pageName))) {
                    Utils.triggerFn(success, self.variableCollection[pageName]);
                    return;
                }

                if (!runMode) {
                    requestParams = {
                        pageName : pageName,
                        projectId : $rootScope.project.id
                    };
                    VariableService.get(requestParams, function (variables) {
                        _.remove(reloadRequired, function (page) {
                            return page === pageName;
                        });
                        if (!WM.isObject(variables)) {
                            variables = {};
                        }

                        setPageVariables(pageName, variables);
                        Utils.triggerFn(success, variables);
                    }, function (errMsg) {
                        setPageVariables(pageName, undefined);
                        Utils.triggerFn(error, errMsg);
                    });
                }
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
                if (!runMode) {
                    /*Initializing map with 'APP' context*/
                    CRUDMAP.CREATE[VARIABLE_CONSTANTS.OWNER.APP] = [];
                    CRUDMAP.DELETE[VARIABLE_CONSTANTS.OWNER.APP] = [];
                    CRUDMAP.UPDATE[VARIABLE_CONSTANTS.OWNER.APP] = [];
                    CRUDMAP.MOVE[VARIABLE_CONSTANTS.OWNER.APP] = [];
                }
                if (self.variableCollection !== null && self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP] && (reloadRequired && !_.includes(reloadRequired, 'App'))) {
                    Utils.triggerFn(success, self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP]);
                    return;
                }

                var requestParams = {};
                if (!runMode) {
                    requestParams = {
                        pageName : VARIABLE_CONSTANTS.OWNER.APP,
                        projectId : $rootScope.project.id
                    };
                    VariableService.get(requestParams, function (variables) {
                        if (!WM.isObject(variables)) {
                            variables = {};
                        }
                        _.remove(reloadRequired, function (page) {
                            return page === 'App';
                        });
                        Utils.triggerFn(success, variables, true);
                    }, function (errMsg) {
                        Utils.triggerFn(error, errMsg);
                    });
                } else {
                    /* if in RUN mode append the path to requestParams and using file service */
                    requestParams = {
                        path: "app.variables.json"
                    };
                    FileService.read(requestParams, function (variables) {
                        if (!WM.isObject(variables)) {
                            variables = {};
                        }
                        Utils.triggerFn(success, variables, true);
                    }, function (errMsg) {
                        Utils.triggerFn(error, errMsg);
                    });
                }
            },

            /* Extend each variable in the provided collection with all the properties of that type
            *  The properties are fetched from the baseFactory.
            */
            extendVariables = function (variables) {
                // extend the variables with all properties not found in the variable
                WM.forEach(variables, function (variable, name) {
                    variables[name] = WM.extend(BaseVariablePropertyFactory.getProperties(variable.category), variable);

                    // removing dataSet for live variable
                    if (!runMode && variable.category === "wm.LiveVariable") {
                        variables[name].dataSet = [];
                    } else if (runMode && (variable.category === "wm.ServiceVariable" || variable.category === "wm.WebSocketVariable")) {
                        Object.defineProperty(variables[name], '_wmServiceOperationInfo', {
                            get: function () {
                                return MetaDataFactory.getByOperationId(variables[name].operationId, variables[name]._prefabName);
                            },
                            configurable: true
                        });

                        // service variable migration for old service variables not having controller names
                        if (runMode && !variable.controller && variable.operationId) {
                            variables[name].controller = variable.operationId.split('_')[0].replace(/Controller$/, '');
                        }
                    }
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
                        register(VARIABLE_CONSTANTS.OWNER.APP, appVariables, true, $rootScope);
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
            initPageVariables = function (pageName, success, error, isUpdatePageVariables) {
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
                    updateVariableValues(activePage, !isUpdatePageVariables);

                    /* emit an event to specify variables are loaded */
                    $rootScope.$emit('on-' + activePage + '-variables-ready', pageVariables);

                    /* check for sanity of success call back and call it */
                    Utils.triggerFn(success, self.variableCollection);
                }, function (errMsg) {
                    /* initialize the app variables collection to empty */
                    self.variableCollection[activePage] = {};

                    /* check for sanity of error call back and call it */
                    Utils.triggerFn(error, errMsg);
                });
            },

            /*function to initialize variable collection*/
            initVariableCollection = function (activeWorkspaceName, success, error, isUpdatePageVariables) {
                activePage = activeWorkspaceName;
                self.variableCollection = self.variableCollection || {};

                /* get application level variables */
                getAppVariables(function (appVariables, freshVariables) {
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
                var variables = self.variableCollection,
                    scopes,
                    i,
                    n;

                /* if scope provided, return the variable in that scope */
                if (scope) {
                    return (variables[scope.$id] && variables[scope.$id][variableName]) || self.variableCollection[$rootScope.$id][variableName];
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
                    /* case of searching a partial's variable, partial being loaded in a page */
                    for (i = 0, scopes = Object.keys(variables), n = scopes.length; i < n; i += 1) {
                        scope = scopes[i];
                        if (variables[scopes[i]][variableName]) {
                            return variables[scopes[i]][variableName];
                        }
                    }
                }

                if (!variables) {
                    return;
                }

                /* return the variable against active page or app (In studio mode, this is the writable variable obejct */
                return (variables[$rootScope.activePageName] && variables[$rootScope.activePageName][variableName]) || (variables[VARIABLE_CONSTANTS.OWNER.APP] && variables[VARIABLE_CONSTANTS.OWNER.APP][variableName]) || null;
            },

            /*function to update a variable object
            * variableName name of the variable, old name in case of name change
            * newProperties varible object with updated properties
            * isUpdate flag to decide if variable data set has to be update*/
            updateVariable = function (variableName, newProperties, isUpdate) {
                var newName = newProperties.name,
                    updated = false,
                    pageName = newProperties.owner === 'App' ? 'App' : ($rootScope.isPrefabTemplate ? MAIN_PAGE : $rootScope.activePageName),
                    oldOwner = pageName === 'App' ? $rootScope.activePageName : 'App',
                    scope = pageScopeMap[pageName];
                /* Condition: Checking for existence of the variable name, updating variable object*/
                if (_.find(self.variableCollection[pageName], {'_id': newProperties._id})) {
                    self.variableCollection[pageName][newName] = newProperties;
                    updated = true;
                    if (!_.includes(CRUDMAP.UPDATE[pageName], newName) && !_.includes(CRUDMAP.CREATE[pageName], newName)) {
                        CRUDMAP.UPDATE[pageName].push(newName);
                    }
                    if (variableName !== newName) {
                        delete self.variableCollection[pageName][variableName];
                        reloadRequired.push(pageName);
                    }
                } else if (_.find(self.variableCollection[oldOwner], {'_id': newProperties._id})) {
                    /*In case of owner change checking for variable existence in old scope and deleting*/
                    self.variableCollection[pageName][newName] = newProperties;
                    /*Removing those variable from old scope*/
                    delete self.variableCollection[oldOwner][variableName];
                    if (!_.includes(CRUDMAP.MOVE[oldOwner], newName)) {
                        CRUDMAP.MOVE[oldOwner].push(newName);
                    }
                    updated = true;
                }
                if (isUpdate) {
                    call('getData', newName, {scope: scope, skipFetchData: true});
                }
                return updated;
            },
            /*function to get the type of the variable by its name*/
            getType = function (name) {
                return getVariableByName(name) && getVariableByName(name).category;
            },

            getCategoriesByServiceType = function (serviceType) {
                return serviceToCategoryMap[serviceType];
            },

            getServiceTypesByCategory = function (category) {
                return variableConfig[category].serviceTypes;
            },

            getVariableServiceType = function (variableObject) {
                var category = variableObject.category,
                    serviceType = getServiceTypesByCategory(category);
                if (serviceType.length === 1) {
                    serviceType = serviceType[0];
                } else {
                    switch (category) {
                    case 'wm.LiveVariable':
                        serviceType = VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.DATABASE;
                        break;
                    case 'wm.ServiceVariable':
                        if (variableObject.serviceType === VARIABLE_CONSTANTS.SERVICE_TYPE_DATA) {
                            serviceType = VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.DATABASE_API;
                        } else if (variableObject.serviceType === VARIABLE_CONSTANTS.SERVICE_TYPE_JAVA) {
                            serviceType = VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.JAVA;
                        } else if (variableObject.serviceType === VARIABLE_CONSTANTS.SERVICE_TYPE_SECURITY) {
                            serviceType = VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.SECURITY;
                        } else {
                            serviceType = VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.WEB;
                        }
                        break;
                    default:
                        serviceType = serviceType[0];
                    }
                }
                return serviceType;
            },

            getServiceTypesByCollectionType = function (collectionType) {
                var serviceTypes = [],
                    isPrefabProject = $rootScope.isPrefabTemplate,
                    filteredVariables = [];

                if (!isPrefabProject) {
                    _.forEach(variableConfig, function (variable) {
                        if (!collectionType || collectionType.toLowerCase() === 'all' || variable.collectionType === collectionType) {
                            filteredVariables.push(variable);
                        }
                    });
                } else {
                    _.forEach(variableConfig, function (variable) {
                        if (!variable.appOnly && (!collectionType || collectionType.toLowerCase() === 'all' || variable.collectionType === collectionType)) {
                            filteredVariables.push(variable);
                        }
                        if(variable.category === 'wm.ServiceVariable') {
                            var securityIndex = variable.serviceTypes.indexOf(VARIABLE_CONSTANTS.VARIABLE_SERVICE_TYPES.SECURITY);
                            if (securityIndex !== -1) {
                                variable.serviceTypes.splice(securityIndex,1);
                            }
                        }
                    });
                }
                _.forEach(filteredVariables, function (variable) {
                    //checking for RBAC permissions. show only those services which are allowed
                    _.remove(variable.serviceTypes, function(serviceType) {
                        if(serviceType === 'database' || serviceType === 'databaseapi' ) {
                            return !$rootScope.preferences["project.database.create"];
                        }
                        if(serviceType === 'web') {
                            return !$rootScope.preferences["project.rest.create"] || !$rootScope.preferences["project.soap.create"] || !$rootScope.preferences["project.websocket.create"];
                        }
                        if(serviceType === 'java') {
                            return !$rootScope.preferences["project.javaservice.create"];
                        }
                    });
                    serviceTypes = _.union(serviceTypes, variable.serviceTypes);
                });
                return serviceTypes;
            },

            /* function to return variable category list to populate in filter dropdowns */
            getVariableCategoryList = function (collectionType, getKeysList) {
                var categoryList = {},
                    isPrefabProject = $rootScope.isPrefabTemplate,
                    filteredVariables = [];

                if (!isPrefabProject) {
                    _.forEach(variableConfig, function (variable) {
                        if (!collectionType || collectionType.toLowerCase() === 'all' || variable.collectionType === collectionType) {
                            filteredVariables.push(variable);
                        }
                    });
                } else {
                    _.forEach(variableConfig, function (variable) {
                        if (!variable.appOnly && (!collectionType || collectionType.toLowerCase() === 'all' || variable.collectionType === collectionType)) {
                            filteredVariables.push(variable);
                        }
                    });
                }
                _.forEach(filteredVariables, function (variable) {
                    categoryList[variable.category] = variable.category;
                });

                if (getKeysList) {
                    categoryList = Object.keys(categoryList);
                }

                return categoryList;
            },

            /* function to check if variable with specified name exists in the collection*/
            isExists = function (variableName, caseSensitive, unsavedVariableName) {
                var variables = self.variableCollection,
                    arrOfVariables;
                arrOfVariables = $rootScope.isPrefabTemplate ? _.keys(variables[MAIN_PAGE]) :  _.union(_.keys(variables[VARIABLE_CONSTANTS.OWNER.APP]), _.keys(variables[$rootScope.activePageName]));
                if (unsavedVariableName) {
                    arrOfVariables.push(unsavedVariableName);
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
                return BaseVariablePropertyFactory.invoke(method, type, variable, options, function (data, propertiesMap, pagingOptions) {
                    Utils.triggerFn(success, data, propertiesMap, pagingOptions);
                }, error);
            },

            updateVariableDataSet = function (name, data, propertiesMap, pagingOptions) {
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
                        "pagingOptions": pagingOptions
                    };
                } else {
                    returnObject[name].dataSet = data;
                }
            },

            /* function to create default non-conflicting name for a variable */
            generateUniqueName = function (category, name, overWrite, unsavedVariableName) {
                var defaultName,
                    nameIteratorKey = category;

                if (name) {
                    nameIteratorKey = name;
                    self.variableNameIterator[nameIteratorKey] = self.variableNameIterator[nameIteratorKey] || 0;
                    defaultName = name + (self.variableNameIterator[nameIteratorKey] || '');
                } else {
                    defaultName = variableCategoryToNameMap[category] + self.variableNameIterator[category];
                }

                if (!isExists(defaultName, true, unsavedVariableName) || overWrite) {
                    return defaultName;
                }

                /* increment the iterator for the category and look for unique name again*/
                self.variableNameIterator[nameIteratorKey] += 1;
                return generateUniqueName(category, name);
            },

            // registers a variable collection in the specified namespace
            register = function (nameSpace, variables, loadValuesInStudio, scope) {
                // extend the variables with properties from basefactory
                variables = extendVariables(variables);

                // store the variables in provided namespace
                pageScopeMap[nameSpace] = scope;
                self.variableCollection = self.variableCollection || {};
                self.variableCollection[nameSpace] = variables;

                // update the variable values in RUN mode
                if (loadValuesInStudio || runMode) {
                    updateContextVariables(nameSpace, scope);
                    // emit an event to specify variables are loaded
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
            retrieveEventCallbackVariables = function (variableName, context) {
                var variableArray = [],
                    methods,
                    varCollection = self.variableCollection,
                    contextsVariables = context ? [varCollection[context]] : [varCollection[VARIABLE_CONSTANTS.OWNER.APP], varCollection[$rootScope.activePageName]];

                if ($rootScope.isPrefabTemplate) {
                    contextsVariables = [varCollection.Main];
                }
                /*iterating over variable collection*/
                _.forEach(contextsVariables, function (variables) {
                    _.forEach(variables, function (curVariable, curVariableName) {
                        if (isEventCallbackVariable(curVariable.category)) {
                            /*checking if current variable name is not equal to the variable name provided.*/
                            if (!variableName || curVariableName !== variableName) {
                                methods = variableConfig[curVariable.category].methods;
                                variableArray.push({name: curVariableName, category: curVariable.category, methods : methods, serviceType: getVariableServiceType(curVariable)});
                            }
                        }
                    });
                });
                return _.uniq(variableArray);
            },
            saveContextVariables = function (context, contextVariables) {
                /*Updating variables using service*/
                _.each(contextVariables, function (varObj, name) {
                    updateVariable(name, varObj);
                });
            },

            /**
             * loops through the binding objects in the provided array, removes the ones with no value
             * @param bindings
             */
            cleanseBindings = function (bindings, variable) {
                var shouldCleanse,
                    requiredKeys = VARIABLE_CONSTANTS.DATA_BINDING_FIELDS,
                    redundantKeys;
                /* remove non-required keys from binding object */
                _.remove(bindings, function (binding) {
                    shouldCleanse = (WM.isUndefined(binding.value) || binding.value === '' || (_.isNull(binding.value) && variable && variable.category === 'wm.LiveVariable'));
                    if (!shouldCleanse) {
                        redundantKeys = _.difference(_.keys(binding), requiredKeys);
                        _.forEach(redundantKeys, function (key) {
                            binding[key] = undefined;
                        });
                    }
                    return shouldCleanse;
                });
            },

            /**
             * filters the variable collection before pushing into the respective file
             * removes the properties not set by the user
             * removes properties internally used by wm-dev team (starting with '_')
             * removes dataBindings with empty value
             * @param variables list of variables to filter
             */
            filterVariables = function (variables) {
                WM.forEach(variables, function (variable) {
                    WM.forEach(variable, function (propertyValue, propertyName) {
                        if (propertyValue === "" || propertyValue === undefined || (Utils.stringStartsWith(propertyName, '_') && propertyName !== '_id') || propertyName === "$$hashKey") {
                            delete variable[propertyName];
                        }
                    });

                    cleanseBindings(variable.dataBinding, variable);
                    if (variable.category === 'wm.NavigationVariable') {
                        cleanseBindings(variable.dataSet);
                    }
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
                    defaultName = generateUniqueName(type, undefined, undefined, options.unsavedVariableName);
                }

                /* create the variable object with its basic properties and return it */
                WM.extend(variableObj, BaseVariablePropertyFactory.getProperties(type), {name: defaultName}, options);
                return variableObj;
            },
            /*function to store a variable to the collection*/
            store = function (owner, name, variableObj, isUpdate, fetchData) {
                /* sanity checking */
                if (!variableObj) {
                    return;
                }
                var varCollectionObj = self.variableCollection,
                    scope;
                owner = $rootScope.isPrefabTemplate ? MAIN_PAGE : (owner || VARIABLE_CONSTANTS.OWNER.APP);
                scope = pageScopeMap[owner];

                /* Condition: If type does not exist yet, then create one */
                if (!varCollectionObj.hasOwnProperty(owner) || !varCollectionObj[owner]) {
                    varCollectionObj[owner] = {};
                }

                /* Assign a unique id to the newly created variable */
                variableObj['_id'] = "wm-" + name + "-" + variableObj.category + "-" + (new Date().getTime());

                /* Store variable based on type */
                varCollectionObj[owner][name] = variableObj;
                varCollectionObj[scope.$id][name] = Utils.getClonedObject(variableObj);
                varCollectionObj[scope.$id][name].name = name;
                self.studioCopy[owner][name] = varCollectionObj[scope.$id][name];

                if (variableObj.category === 'wm.LiveVariable') {
                    variableObj._isNew = true;
                    variableObj["filterExpressions"] = {};
                }

                /* if app level variable make it available in the active page scope */
                if (owner === VARIABLE_CONSTANTS.OWNER.APP) {
                    if ($rootScope.activePageName && pageScopeMap[$rootScope.activePageName]) {
                        Object.defineProperty(pageScopeMap[$rootScope.activePageName].Variables, name, {
                            configurable: true,
                            get: function () {
                                return varCollectionObj[scope.$id][name];
                            }
                        });
                    }
                }
                if (!_.includes(CRUDMAP.CREATE[owner], name)) {
                    CRUDMAP.CREATE[owner].push(name);/*Storing  created variable name in map*/
                }
                if (isUpdate) {
                    updateVariableData(varCollectionObj[scope.$id][name], name, owner, scope, {skipFetchData: !fetchData})
                }
            },
            initiateCallback = function (event, variable, response, info, skipDefaultNotification) {
                /*checking if event is available and variable has event property and variable event property bound to function*/
                var eventValues = variable[event],
                    retVal,
                    errorVariable,
                    callBackScope = variable.activeScope;

                /**
                 * For error event:
                 * trigger app level error handler.
                 * if no event is assigned, trigger default appNotification variable.
                 */
                if (event === VARIABLE_CONSTANTS.EVENT.ERROR && !skipDefaultNotification) {
                    // trigger the common error handler present in app.js
                    Utils.triggerFn($rootScope.onServiceError, variable, response, info);
                    if (!eventValues) {
                        /* in case of error, if no event assigned, handle through default notification variable */
                        errorVariable = getVariableByName(VARIABLE_CONSTANTS.DEFAULT_VAR.NOTIFICATION);
                        if (errorVariable) {
                            response = errorVariable.getMessage() || response;
                            $rootScope.$evalAsync(function () {
                                $rootScope.$emit("invoke-service", VARIABLE_CONSTANTS.DEFAULT_VAR.NOTIFICATION, {scope: callBackScope, message: response});
                            });
                        }
                    }
                }

                // if event values assigned, trigger them
                if (eventValues) {
                    retVal = Utils.triggerCustomEvents(event, eventValues, callBackScope, response, variable, info);
                }
                return retVal;
            },

            /* unloads the variables from the specified namespace */
            unload = function (namespace, scope) {
                /* sanity check */
                if (!namespace) {
                    return;
                }
                var scopeId = scope.$id;
                self.variableCollection = self.variableCollection || {};

                /*
                 * loop through each variable in the namespace and remove the watchers if any
                 */
                if (watchers[scopeId]) {
                    WM.forEach(self.variableCollection[namespace], function (variable, name) {
                        if (watchers[scopeId][name]) {
                            watchers[scopeId][name].forEach(Utils.triggerFn);
                        }

                        // remove bound map nodes
                        _.set(internalBoundNodeMap, scopeId, undefined);
                    });
                }

                /* remove the variables in namespace from the variable collection*/
                delete self.variableCollection[namespace];
                delete self.variableCollection[scopeId];
                if (!runMode) {
                    delete self.studioCopy[namespace];
                }
                // remove the destroyed scope references from map, to be garbage collected
                _.forEach(pageScopeMap, function(v,k) {
                    if(v.$$destroyed) {
                        delete pageScopeMap[k];
                    }
                });
            },

            //Trigger error handler before discarding queued requests
            triggerError = function (requestQueue) {
              _.forEach(requestQueue, function (requestObj) {
                  Utils.triggerFn(requestObj && requestObj.error);
              });
            },

            /* process the requests in the queue for a variable based on the inFlightBehavior flag of the variable */
            processRequestQueue = function (variable, requestQueue, handler, options) {
                /* process request queue for the variable only if it is not empty */
                if (requestQueue && requestQueue[variable.name] && requestQueue[variable.name].length) {
                    var requestObj,
                        inFlightBehavior = _.get(options, 'inFlightBehavior') || variable.inFlightBehavior;

                    switch (inFlightBehavior) {
                    case 'executeLast':
                        requestObj = requestQueue[variable.name].pop();
                        triggerError(requestQueue[variable.name]);
                        handler(requestObj.variable, requestObj.options, requestObj.success, requestObj.error);
                        requestQueue[variable.name] = null;
                        break;
                    case 'executeAll':
                        requestObj = requestQueue[variable.name].splice(0, 1).pop();
                        handler(requestObj.variable, requestObj.options, requestObj.success, requestObj.error);
                        break;
                    default:
                        triggerError(requestQueue[variable.name]);
                        requestQueue[variable.name] = null;
                        break;
                    }
                }
            },

            /*Function to delete the specified variable*/
            deleteVariable = function (name, pageName) {
                var i, pageContext, owner;
                /*Check if pageName is specified*/
                if (pageName) {
                    /*If "name" is specified, delete the specified variable from the page.
                    * Else, delete all the variables of that page.*/
                    if (name && !_.includes(CRUDMAP.DELETE[pageName], name)) {
                        CRUDMAP.DELETE[pageName].push(name);
                        delete self.variableCollection[pageName][name];
                        /* if in studio mode remove the studio copy of variable*/
                        if (CONSTANTS.isStudioMode) {
                            delete returnObject[name];
                            delete self.studioCopy[pageName][name];
                        }
                    } else {
                        _.each(self.variableCollection[pageName], function (variable) {
                            if (!_.includes(CRUDMAP.DELETE[pageName], variable.name)) {
                                CRUDMAP.DELETE[pageName].push(variable.name);
                            }
                        });
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
                        owner = self.variableCollection[i][name].owner === VARIABLE_CONSTANTS.OWNER.APP ? VARIABLE_CONSTANTS.OWNER.APP : $rootScope.activePageName;
                        if (!_.includes(CRUDMAP.DELETE[owner], name)) {
                            CRUDMAP.DELETE[owner].push(name);
                        }
                        delete self.variableCollection[i][name];
                        /* if in studio mode remove the studio copy of variable*/
                        if (CONSTANTS.isStudioMode && self.studioCopy[i]) {
                            delete self.studioCopy[i][name];
                        }
                        /*if the context is a page and not a scope id, return the page context*/
                        if (ProjectService.getPageNames().indexOf(i) > -1) {
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
                    varParamsArray = _.keys(variableParams),
                    index,
                    varParamCounter,
                    currentVarParam,
                    filteredVariables = [],
                    defaultContextArray = $rootScope.isPrefabTemplate ? [MAIN_PAGE] : [VARIABLE_CONSTANTS.OWNER.APP, $rootScope.activePageName];

                if (variableParams.owner) {
                    variableOwner = $rootScope.isPrefabTemplate ? MAIN_PAGE : (variableParams.owner === VARIABLE_CONSTANTS.OWNER.APP) ? VARIABLE_CONSTANTS.OWNER.APP : $rootScope.activePageName;
                }

                /*function to find the variables which match the all the keys in the object map provided*/
                function findMatchingVariables(contextVariables, context) {
                    variableNames = _.keys(contextVariables);

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

            getBindMap = function (type, parentReference, oldBindings, visitedNodes) {
                var types = $rootScope.dataTypes,
                    curFieldObj;

                oldBindings = oldBindings || {};
                if (!visitedNodes) {
                    visitedNodes = [];
                }
                if (visitedNodes.indexOf(type) !== -1) {
                    return;
                }

                if (types && types[type] && types[type].fields && Object.keys(types[type].fields).length) {
                    visitedNodes.push(type);
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
                        getBindMap(field.type, curFieldObj, oldBindings[fieldName], visitedNodes);
                    });
                }
            },

            getEvaluatedOrderBy = function (varOrder, optionsOrder) {
                var optionFields,
                    varOrderBy;
                //If options order by is not defined, return variable order
                if (!optionsOrder || WM.element.isEmptyObject(optionsOrder)) {
                    return varOrder;
                }
                //If variable order by is not defined, return options order
                if (!varOrder) {
                    return optionsOrder;
                }
                //If both are present, combine the options order and variable order, with options order as precedence
                varOrder     = _.split(varOrder, ',');
                optionsOrder = _.split(optionsOrder, ',');
                optionFields = _.map(optionsOrder, function (order) {
                    return _.split(_.trim(order), ' ')[0];
                });
                //If a field is present in both options and variable, remove the variable orderby
                _.remove(varOrder, function (orderBy) {
                    return _.includes(optionFields, _.split(_.trim(orderBy), ' ')[0]);
                });
                varOrderBy = varOrder.length ? ',' + _.join(varOrder, ',') : '';
                return _.join(optionsOrder, ',') + varOrderBy;
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

        initServiceToCategoryMap();
        initVariableNameMap();

        /*Initialize the variable name iterator to the default value.*/
        resetVariableNameIterator();

        /*
         * The event is emitted on page ready
         * all the variables with startUpdate flag enabled are triggered here.
         * This delay is to wait for the widgets to compile so that the same(and app variables) can be consumed as input to the variables.
         */
        if (CONSTANTS.isRunMode) {
            $rootScope.$on('page-ready', function (e, pageName) {
                /*
                 * checking on page name's equality to active page name.
                 * when swift navigation among two pages is done,
                 * the event for first page is emitted after the second page and its variables are loaded
                 */
                var pageScope = pageScopeMap[pageName],
                    pageScopeId = pageScope.$id,
                    restOAuthQueue = {},
                    oAuthVariableIndexes = [];

                //executes the authorization procedure for the variable sin the restOAuthQueue
                function performOAuth() {
                    _.forEach(restOAuthQueue[pageScopeId], function(variables, provider) {
                        oAuthProviderService.performAuthorization(undefined, provider, function() {
                            _.forEach(variables, makeVariableCall);
                        });
                    });
                }

                //check the variables of the start update for rest type and oauth configured.
                //Only push to rest queue if accesstoken doesn't exist in sessionStorage
                _.forEach(startUpdateQueue[pageScopeId], function(variable, $index) {
                    var securityDefn = {},
                        provider;
                    if (variable && variable.category === 'wm.ServiceVariable') {
                        securityDefn = _.get(variable._wmServiceOperationInfo, 'securityDefinitions.0');
                        if (securityDefn && securityDefn.type === VARIABLE_CONSTANTS.REST_SERVICE.SECURITY_DEFN_OAUTH2) {
                            provider = securityDefn[VARIABLE_CONSTANTS.REST_SERVICE.OAUTH_PROVIDER_KEY];
                            if (oAuthProviderService.getAccessToken(provider)) {
                                return;
                            }
                            restOAuthQueue[pageScopeId] = restOAuthQueue[pageScopeId] || {};
                            restOAuthQueue[pageScopeId][provider] = restOAuthQueue[pageScopeId][provider] || [];
                            restOAuthQueue[pageScopeId][provider].push(variable);
                            oAuthVariableIndexes.push($index);
                        }
                    }
                });

                if (!_.isEmpty(restOAuthQueue)) {
                    performOAuth();
                }
                //remove the variables of rest type and oauth configured
                _.pullAt(startUpdateQueue[pageScopeId], oAuthVariableIndexes);

                $q.all(_.map(startUpdateQueue[pageScopeId], makeVariableCall))
                    .finally(function () {
                        $rootScope.$emit('page-startupdate-variables-loaded', pageName);
                    });
                delete startUpdateQueue[pageScopeId];

                if (startUpdateQueue[$rootScope.$id]) {
                    _.forEach(startUpdateQueue[$rootScope.$id], makeVariableCall);
                    delete startUpdateQueue[$rootScope.$id];
                }
            });
            $rootScope.$on('partial-ready', function (event, scope) {
                var queue = lazySartUpdateQueue[scope.$id] || startUpdateQueue[scope.$id];
                if (queue) {
                    _.forEach(queue, makeVariableCall);
                    delete lazySartUpdateQueue[scope.$id];
                    delete startUpdateQueue[scope.$id];
                }
            });
        }

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
                        variable.bindCount = ((variable.bindCount || 0) + (bindCount || 1));
                    } else {
                        variable.bindCount -= 1;
                    }
                    writableVariable.bindCount = variable.bindCount;
                    /*Set the "saveVariables" to true so that when "save"/"run" buttons are clicked, the variables could be saved into the file.*/
                    updateVariable(writableVariable.name, writableVariable);
                    $rootScope.saveVariables = true;
                }
            });
            //Extend the event_options with variable types
            _.forEach(variableConfig, function (variable) {
                if (!variable.hideInEvents && !_.includes(WIDGET_CONSTANTS.EVENTS_OPTIONS, variable.newVariableKey)) {
                    WIDGET_CONSTANTS.EVENTS_OPTIONS.push(variable.newVariableKey);
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
             * @param {string} variableName existing name/old name name of the variable to be updated
             * @param {object} newProperties properties of the variable to be updated
             */
            'updateVariable': updateVariable,
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
             * @name $Variables#getByContext
             * @methodOf wm.variables.$Variables
             * @description
             * Gets variables for specified contextx
             */
            'getByContext': function (pages) {
                pages = pages || _.keys(pageScopeMap);
                return _.pick(self.variableCollection, pages);
            },
            /**
             * @ngdoc method
             * @name $Variables#getDuplicateVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Get array of duplicate variable names
             */
            'getDuplicateVariables': function () {
                return _.intersection(_.keys(self.variableCollection[VARIABLE_CONSTANTS.OWNER.APP]), _.keys(self.variableCollection[$rootScope.activePageName]));
            },
            /**
             * @ngdoc method
             * @name $Variables#getStudioCopy
             * @methodOf wm.variables.$Variables
             * @description
             * Gets all the variables in studio along with data inside the dataSet
             * @param {string} pages of which variables are required.
             */
            'getStudioCopy': function (pages) {
                if (pages && pages.length) {
                    return _.pick(self.studioCopy, pages);
                }
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
                /*activePage will not be there while in java service and db workspace*/
                if ($rootScope.isPrefabTemplate) {
                    activePageName = MAIN_PAGE;
                }
                if (updateValues) {
                    updateVariableValues(activePageName);
                }
                function onSuccess() {
                    $rootScope.$emit("update-variables-tree");
                    if (_.includes(reloadRequired, 'App')) {
                        reloadVariables(success, error);
                    } else if (_.includes(reloadRequired, activePageName)) {
                        initPageVariables(activePageName, success, error);
                    } else {
                        Utils.triggerFn(success);
                    }
                }                /* save app variables */
                executeCrudOp(VARIABLE_CONSTANTS.OWNER.APP, function () {
                    if (activePageName) {
                        /* save page variables */
                        executeCrudOp(activePageName, onSuccess, error);
                    } else {
                        onSuccess();
                    }
                }, error);
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
                if (updateValues) {
                    updateVariableValues(activePageName);
                }
                function onSuccess() {
                    if (_.includes(reloadRequired, activePageName)) {
                        initPageVariables(activePageName, success, error);
                    } else {
                        Utils.triggerFn(success);
                    }
                }
                /* save page variables */
                executeCrudOp(activePageName, onSuccess, error);
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

                if (updateValues) {
                    updateVariableValues();
                }
                function onSuccess() {
                    if (_.includes(reloadRequired, 'App')) {
                        reloadVariables(success, error);
                    } else {
                        Utils.triggerFn(success);
                    }
                }
                /* save app variables */
                executeCrudOp(VARIABLE_CONSTANTS.OWNER.APP, onSuccess, error);
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
             * @name $Variables#reloadVariables
             * @methodOf wm.variables.$Variables
             * @description
             * Reload the variable collection`
             *
             */
            'reloadVariables': reloadVariables,

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
             * @name $Variables#getServiceTypesByCollectionType
             * @methodOf wm.variables.$Variables
             * @description
             * Returns the variable category list supported
             * @param {string} collectionType grouping of the variable categories (data, call)
             * return {object} variable categories list
             */
            'getServiceTypesByCollectionType': getServiceTypesByCollectionType,

            /**
             * @ngdoc method
             * @name $Variables#getCategoriesByServiceType
             * @methodOf wm.variables.$Variables
             * @description
             * Returns the variable category list supported
             * @param {string} collectionType grouping of the variable categories (data, call)
             * return {object} variable categories list
             */
            'getCategoriesByServiceType': getCategoriesByServiceType,

            /**
             * @ngdoc method
             * @name $Variables#getServiceTypesByCategory
             * @methodOf wm.variables.$Variables
             * @description
             * Returns the variable category list supported
             * @param {string} collectionType grouping of the variable categories (data, call)
             * return {object} variable categories list
             */
            'getVariableServiceType': getVariableServiceType,

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
            createLiveVariable: function (variableDetails, fetchData) {
                /* call base service function to create the variable */
                var variableCategory = "wm.LiveVariable",
                    defaultName,
                    createdVariable,
                    variableName,
                    variableOwner;

                defaultName = variableDetails.name || Utils.initCaps(variableDetails.service) + Utils.initCaps(variableDetails.table) + "Data";

                /*If the default variable does not exist, create it.
                * Else, simply return the variable name.*/
                if (!isExists(defaultName)) {

                    createdVariable = create(variableCategory, {owner: variableDetails.owner || "Page", "isList": true}, defaultName);
                    variableName = createdVariable.name;
                    variableOwner = (createdVariable.owner === VARIABLE_CONSTANTS.OWNER.PAGE) ? $rootScope.activePageName : null;

                    /*Set the "liveSource" and "type" properties of the live-variable.*/
                    createdVariable.liveSource = variableDetails.service;
                    createdVariable.type = variableDetails.table;
                    createdVariable.package = variableDetails.package;
                    createdVariable.category = variableCategory;
                    createdVariable.isDefault = true;
                    _.forEach(['maxResults', 'startUpdate', 'autoUpdate', 'bindCount'], function (property) {
                        if (WM.isDefined(variableDetails[property])) {
                            createdVariable[property] = variableDetails[property];
                        }
                    });

                    /*adding a property to identify the database-type for the created live-variable*/
                    createdVariable.dbSystem = variableDetails.dbSystem;

                    /* Store the variable in proper category */
                    store(variableOwner, variableName, createdVariable, true, fetchData);
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
            createServiceVariable: function (variableDetails, overWrite, createNewVariable) {
                /* call base service function to create the variable */
                var variableCategory = "wm.ServiceVariable",
                    defaultName = variableDetails.name || Utils.initCaps(variableDetails.service) + Utils.initCaps(variableDetails.operation),
                    createdVariable,
                    variableName,
                    variableOwner,
                    bindMapCollection;

                /*If the default variable does not exist, create it.
                 * Else, simply return the variable name.*/
                if (!isExists(defaultName) || overWrite || createNewVariable) {
                    createdVariable = create(variableCategory, {owner: variableDetails.owner || "Page"}, defaultName, overWrite);
                    variableName = createdVariable.name;
                    variableOwner = (createdVariable.owner === VARIABLE_CONSTANTS.OWNER.PAGE) ? $rootScope.activePageName : null;

                    /*Set the "service" and "operation" properties of the service-variable.*/
                    createdVariable.service       = variableDetails.service;
                    createdVariable.operation     = variableDetails.operation;
                    createdVariable.operationType = variableDetails.operationType;
                    createdVariable.serviceType   = variableDetails.serviceType;
                    createdVariable.category      = variableCategory;
                    createdVariable.isDefault     = true;
                    createdVariable.controller    = variableDetails.controller;
                    createdVariable.operationId   = variableDetails.operationId;
                    createdVariable.type          = variableDetails.returnType;

                    _.forEach(['maxResults', 'startUpdate', 'autoUpdate', 'isList'], function (property) {
                        if (WM.isDefined(variableDetails[property])) {
                            createdVariable[property] = variableDetails[property];
                        }
                    });

                    /* insert sample param values if provided */
                    bindMapCollection = createdVariable.dataBinding;
                    WM.forEach(variableDetails.sampleParamValues, function (val, key) {
                        bindMapCollection.push({
                            "target": key,
                            "value" : val,
                            "type"  : "java.lang.String"
                        });
                    });
                    /* Store the variable in proper category */
                    store(variableOwner, variableName, createdVariable, true);
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
                var filteredVariables = filterByVariableKeys(variableDetails, false),
                    owner = VARIABLE_CONSTANTS.OWNER.APP;

                filteredVariables.forEach(function (variable) {
                    /*calling delete variable on each of the matching variables*/
                    if (variable.owner === VARIABLE_CONSTANTS.OWNER.PAGE) {
                        owner = $rootScope.isPrefabTemplate ? MAIN_PAGE : $rootScope.activePageName;
                    }
                    deleteVariable(variable.name, owner);
                });
            },

            /**
             * @ngdoc method
             * @name $Variables#getMappedServiceQueryParams
             * @methodOf wm.variables.$Variables
             * @description
             * returns array of query param names for variable other then page,size,sort
             * @params {params} params of the variable
             */
            getMappedServiceQueryParams: function (params) {
                return _.map(_.reject(params, function (param) {
                    return _.includes(VARIABLE_CONSTANTS.PAGINATION_PARAMS, param.name);
                }), function (param) {
                    return param.name;
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
            getBindMap: getBindMap,

            /**
             * @ngdoc method
             * @name $Variables#isActionTypeVariable
             * @methodOf wm.variables.$Variables
             * @description
             * Returns true if the variable passed is of Action type (New categorisation intriduced in 9.0)
             */
            isActionTypeVariable: isActionTypeVariable,

            /**
             * @ngdoc method
             * @name $Variables#getVariableCollectionType
             * @methodOf wm.variables.$Variables
             * @description
             * Returns variable collection type
             */
            getVariableCollectionType: getVariableCollectionType,
            /**
             * @ngdoc method
             * @name $Variables#addVariableConfig
             * @methodOf wm.variables.$Variables
             * @description
             * adds the variable config to the list.
             * @params config data
             * ex : {
             *          "collectionType": "call", //accepted values are 'call' or 'data'
             *          "category": "wm.NotificationVariable", // category name
             *          "defaultName": "notificationVariable" // default category name
             *      }
             */
            addVariableConfig : function (config) {
                variableConfig[config.category] = config;
                variableCategoryToNameMap[config.category] = config.defaultName;
                self.variableNameIterator[config.category] = 1;
                _.forEach(config.serviceTypes, function (serviceType) {
                    serviceToCategoryMap[serviceType] = serviceToCategoryMap[serviceType] || [];
                    serviceToCategoryMap[serviceType].push(config.category);
                });
            },

            isSpinnerType : function (category) {
                return variableConfig[category].spinnerInFlight;
            },
            getVariableConfig: function () {
                return variableConfig;
            },
            /**
             * @ngdoc method
             * @name $Variables#getEvaluatedOrderBy
             * @methodOf wm.variables.$Variables
             * @description
             * combines variable orderby and options orderby
             * @params {string} varOrder variable order by
             * @params {string} optionsOrder options order by
             */
            getEvaluatedOrderBy: getEvaluatedOrderBy,

            /**
             * This traverses the filterexpressions object recursively and process the bind string if any in the object
             * @param variable variable object
             * @param name name of the variable
             * @param scope scope of the variable
             */
            processFilterExpBindNode: processFilterExpBindNode
        };

        return returnObject;
    }
];
