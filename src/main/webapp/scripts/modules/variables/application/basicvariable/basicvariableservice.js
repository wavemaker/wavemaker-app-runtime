/*global wm, WM*/
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.$BasicVariableService
 * @requires $rootScope
 * @requires $routeParams
 * @requires BaseVariablePropertyFactory
 * @description
 */

wm.variables.services.BasicVariableService = [
    "BaseVariablePropertyFactory",
    "Utils",
    function (BaseVariablePropertyFactory, Utils) {
        "use strict";

        /* properties of a basic variable - should contain methods applicable on this particular object */
        var methods = {
                getData: function (variable, options, success) {
                    /*Invoke the success callback with the data of the variable*/
                    Utils.triggerFn(success, variable.dataSet);
                    /* return the value since it is not an async call */
                    return variable.dataSet;
                },
                setData: function (variable, dataSet) {
                    /* check dataset sanity */
                    if (!dataSet) {
                        return variable.dataSet;
                    }
                    /* check array type dataset for list type variable */
                    if (variable.isList && !WM.isArray(dataSet)) {
                        return variable.dataSet;
                    }

                    /*change the dataSet*/
                    variable.dataSet = dataSet;

                    /* return the value since it is not an async call */
                    return variable.dataSet;
                },
                getValue: function (variable, key, index) {
                    index = index || 0;

                    /* return the value against the specified key */
                    return variable.isList ? variable.dataSet[index][key] : variable.dataSet[key];
                },
                setValue: function (variable, key, value) {
                    /* check param sanity */
                    if (!key || !value || variable.isList) {
                        return variable.dataSet;
                    }

                    /* set the value against the specified key */
                    variable.dataSet[key] = value;

                    /* return the new dataSet */
                    return variable.dataSet;
                },
                getItem: function (variable, index) {
                    /* return the object against the specified index */
                    return variable.isList ? variable.dataSet[index] : variable.dataSet;
                },
                setItem: function (variable, index, value) {
                    /* check param sanity */
                    if (!WM.isDefined(index) || !WM.isDefined(value) || !variable.isList) {
                        return variable.dataSet;
                    }

                    /* set the value against the specified index */
                    variable.dataSet[index] = value;

                    /* return the new dataSet */
                    return variable.dataSet;
                },
                addItem: function (variable, value, index) {
                    /* check param sanity */
                    if (!value || !variable.isList) {
                        return variable.dataSet;
                    }

                    /* check for index sanity */
                    index = index !== undefined ? index : variable.dataSet.length;

                    /* set the value against the specified index */
                    variable.dataSet.splice(index, 0, value);

                    /* return the new dataSet */
                    return variable.dataSet;
                },

                /*'index' can be index value of the element in array or an object with property values which need to be removed*/
                removeItem: function (variable, index, exactMatch) {
                    var indexValue;
                    /* check for index sanity */
                    index = index !== undefined ? index : variable.dataSet.length - 1;

                    if (WM.isObject(index)) {
                        indexValue = _.findIndex(variable.dataSet, index);
                        /*When exactMatch property is set to true delete only when every property values are same*/
                        if (indexValue > -1 && (!exactMatch || (exactMatch && WM.equals(variable.dataSet[indexValue], index)))) {
                            variable.dataSet.splice(indexValue, 1);
                        }
                    } else {
                        /* set the value against the specified index */
                        variable.dataSet.splice(index, 1);
                    }
                    /* return the new dataSet */
                    return variable.dataSet;
                },
                clearData: function (variable) {
                    /* empty the variable dataset */
                    variable.dataSet = variable.isList ? [] : {};

                    /* return the variable dataSet*/
                    return variable.dataSet;
                },
                getCount: function (variable) {
                    /* return the length of dataSet */
                    return variable.isList ? variable.dataSet.length : 1;
                }
            },
            basicVariableObj = {
                getData: function () {
                    return methods.getData(this);
                },
                setData: function (dataSet) {
                    return methods.setData(this, dataSet);
                },
                getValue: function (key, index) {
                    return methods.getValue(this, key, index);
                },
                setValue: function (key, value) {
                    return methods.setValue(this, key, value);
                },
                getItem: function (index) {
                    return methods.getItem(this, index);
                },
                setItem: function (index, value) {
                    return methods.setItem(this, index, value);
                },
                addItem: function (value, index) {
                    return methods.addItem(this, value, index);
                },
                removeItem: function (index, exactMatch) {
                    return methods.removeItem(this, index, exactMatch);
                },
                clearData: function () {
                    return methods.clearData(this);
                },
                getCount: function () {
                    return methods.getCount(this);
                }
            };

        /* register the variable to the base service*/
        BaseVariablePropertyFactory.register('wm.Variable', basicVariableObj, [], methods);

        return {

        };
    }
];
