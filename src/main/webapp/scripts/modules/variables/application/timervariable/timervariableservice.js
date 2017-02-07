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

        var methods, timerVariableObj, initiateCallback, DEFAULT_TIMER_DELAY = 500,
            fire = function (success, error) {
                return methods.fire(this, {scope: this.activeScope}, success, error);
            };

        /*function to initiate the callback and obtain the data for the callback variable.*/
        initiateCallback = Variables.initiateCallback;

        methods = {
            fire: function (variable, options, success, error) {
                if (WM.isDefined(variable._promise) || CONSTANTS.isStudioMode) {
                    return;
                }
                var repeatTimer = variable.repeating,
                    delay = variable.delay || DEFAULT_TIMER_DELAY,
                    event = "onTimerFire",
                    exec = function () {
                        initiateCallback(event, variable);
                    };

                variable._promise = repeatTimer ? $interval(exec, delay) : $timeout(function () {
                    exec();
                    variable._promise = undefined;
                }, delay);

                // destroy the timer on scope destruction
                callBackScope.$on('$destroy', function () {
                    variable.cancel(variable._promise);
                });

                return variable._promise;
            },
            cancel: function (variable, options) {
                var status;
                if (WM.isDefined(variable._promise)) {
                    if (variable.repeating) {
                        status = $interval.cancel(variable._promise);
                    } else {
                        status = $timeout.cancel(variable._promise);
                    }
                    variable._promise = undefined;
                }
                return status;
            }
        };

        timerVariableObj = {
            fire  : fire,
            invoke: fire,
            cancel: function () {
                return methods.cancel(this);
            }
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.TimerVariable', timerVariableObj, [], methods);

        return {
        };
    }];