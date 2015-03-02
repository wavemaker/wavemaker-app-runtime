/*global wm, WM*/
/*jslint todo: true */
/*jslint sub: true */


/**
 * @ngdoc service
 * @name wm.variables.TimerVariableService
 * @requires $rootScope
 * @requires $routeParams
 * @requires BaseVariablePropertyFactory
 * @description
 * The 'TimerVariableService' provides methods to work with TimerVariable
 */

wm.variables.services.TimerVariableService = ['Variables',
    'BaseVariablePropertyFactory',
    '$rootScope',
    '$interval',
    '$timeout',
    'CONSTANTS',
    function (Variables, BaseVariablePropertyFactory, $rootScope, $interval, $timeout, CONSTANTS) {
        "use strict";

        var methods, timerVariableObj, initiateCallback, timerMap = {}, DEFAULT_TIMER_DELAY = 500;

        /*function to initiate the callback and obtain the data for the callback variable.*/
        initiateCallback = Variables.initiateCallback;

        methods = {
            fire: function (variable, options, success, error) {
                if (WM.isDefined(timerMap[variable.name]) || CONSTANTS.isStudioMode) {
                    return;
                }
                var repeatTimer = variable.repeating,
                    delay = variable.delay || DEFAULT_TIMER_DELAY,
                    event = "onTimerFire",
                    callBackScope = options.scope || $rootScope,
                    exec = function () {
                        initiateCallback(event, variable, callBackScope);
                    };

                timerMap[variable.name] = repeatTimer ? $interval(exec, delay) : $timeout(function () {
                    exec();
                    timerMap[variable.name] = undefined;
                }, delay);
            },
            cancel: function (variable, options) {
                if (WM.isDefined(timerMap[variable.name])) {
                    if (variable.repeating) {
                        $interval.cancel(timerMap[variable.name]);
                    } else {
                        $timeout.cancel(timerMap[variable.name]);
                    }
                    timerMap[variable.name] = undefined;
                }
            }
        };

        timerVariableObj = {
            fire: function (success, error) {
                methods.fire(this, {scope: this.activeScope}, success, error);
            },
            cancel: function () {
                return methods.cancel(this);
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.TimerVariable', timerVariableObj, [], methods);

        return {
        };
    }];