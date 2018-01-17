/*global WM, _*/
/*jslint sub:true*/
WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/global-progress.html',
            '<div class="app-global-progress-bar modal default" ng-if="instances.length > 0">' +
            '   <div class="modal-dialog app-dialog">' +
            '       <div class="modal-content">' +
            '           <ul class="instance-list list-unstyled">' +
            '               <li ng-repeat="instance in instances" class="instance-list-item">' +
            '                   <div class="row">' +
            '                       <div class="col-xs-8">' +
            '                           <label class="app-global-progress-bar-name h6">{{instance.name}}</label>' +
            '                       </div>' +
            '                       <div class="col-xs-4 app-global-progress-bar-progress-label-col">' +
            '                           <label class="app-global-progress-bar-progress-label h6">' +
            '                               {{instance.progressLabel}}</label>' +
            '                       </div>' +
            '                   </div>' +
            '                   <wm-progress minvalue="{{instance.min}}" maxvalue="{{instance.max}}" datavalue="{{instance.value}}" />' +
            '                   <button class="btn btn-secondary pull-right stop-btn" ng-if="instance.onStop" ng-click="instance.onStop();">' +
            '                       {{instance.stopButtonLabel}}' +
            '                   </button>' +
            '                   <div style="clear: both;"></div>' +
            '               </li>' +
            '               <li class="instance-list-item" ng-if="waitingQueue.length > 0">' +
            '                   <label class="global-progress-bar-ui-primary-label h6">' +
            '                       ({{waitingQueue.length}}) queued' +
            '                   </label>' +
            '               </li>' +
            '           </ul>' +
            '       </div>' +
            '   </div>' +
            '</div>'
            );
    }])
    .service('ProgressBarService', [
        '$compile',
        '$q',
        '$rootScope',
        '$templateCache',
        '$timeout',
        function (
            $compile,
            $q,
            $rootScope,
            $templateCache,
            $timeout
        ) {
            'use strict';
            var ele,
                MAX_PROCESS = 3,
                $scope = $rootScope.$new(true);
            $scope.instances = [];
            $scope.waitingQueue = [];

            function flushQueue() {
                var waitingQueue = $scope.waitingQueue;
                if (waitingQueue.length > 0 && waitingQueue[0]() !== false) {
                    waitingQueue.shift();
                    flushQueue();
                }
            }

            function addToQueue(instance) {
                var d = $q.defer();
                $scope.waitingQueue.push(function () {
                    if ($scope.instances.length < MAX_PROCESS) {
                        $scope.instances.push(instance);
                        d.resolve(instance);
                    } else {
                        return false;
                    }
                });
                flushQueue();
                return d.promise;
            }

            function removeInstance(instance) {
                return $timeout(function () {
                    _.remove($scope.instances, instance);
                    flushQueue();
                }, 1000);
            }

            function setInstaceProperty(instance, propertyName, propertyValue) {
                if (propertyName === 'value') {
                    if (instance.value >= instance.max) {
                        propertyValue = instance.max;
                    }
                    instance.value = propertyValue;
                    instance.progressLabel = instance.value + '/' + instance.max;
                } else if (propertyName === 'onStop' && _.isFunction(propertyValue)) {
                    instance.onStop = function () {
                        propertyValue();
                        removeInstance(instance);
                    };
                } else {
                    instance[propertyName] = propertyValue;
                }
            }

            function createInstance(name, min, max) {
                var api,
                    instance = {
                        'name': name,
                        'min': min || 0,
                        'max': max || 100,
                        'value': 0,
                        'progressLabel': '',
                        'stopButtonLabel' : 'Cancel',
                        'onStop': null
                    };
                api = {
                    'get': function (propertyName) {
                        return instance[propertyName];
                    },
                    'set': function (propertyName, propertyValue) {
                        setInstaceProperty(instance, propertyName, propertyValue);
                    },
                    'destroy': function () {
                        return removeInstance(instance);
                    }
                };
                return addToQueue(instance).then(function () {
                    return api;
                });
            }

            /**
             * @ngdoc function
             * @name wm.widgets.basic.ProgressBarService#createInstance
             * @methodOf wm.widgets.basic.ProgressBarService
             * @function
             *
             * @description
             * Returns a promise that will be resolved when an instance is available. At max, 3 instances can only run
             * in parallel and rest has to wait till a process is completed.
             *
             * A progress instance has the following properties.
             *
             *   1) min {number} minimum value, default value is 0 </br>
             *   2) max {number} maximum value, default value is 100 </br>
             *   3) value {number} progress value </br>
             *   4) progressLabel {string} process name </br>
             *   5) stopButtonLabel {string} label for stop button, default value is 'Cancel' </br>
             *   6) onStop {function} function to invoke when stop button is clicked. </br>
             *
             * A progress instance has 3 methods </br>
             *   1) set(property, value) -- sets value to the corresponding property </br>
             *   2) get(property) -- returns property value </br>
             *   3) destroy() -- closes the instance. </br>
             *
             * A progress instance will get auto closed when value and max are equal or when destroy method is called.
             *
             * @param {string} name name of the process whose progress is going to be shown
             * @param {number} min minimum value
             * @param {number} max maximum value
             *
             * @returns {object} a promise
             */
            this.createInstance = function (name, min, max) {
                if (!ele) {
                    ele = $compile($templateCache.get('template/widget/global-progress.html'))($scope);
                    WM.element('body:first').append(ele);
                }
                return createInstance(name, min, max);
            };
        }]);


/**
 * @ngdoc service
 * @name wm.widgets.basic.ProgressBarService
 * @description
 * The `ProgressBarService` provides methods to show a progress bar to display progress of a process.
 *
 * @example
 * <example module="wmCore">
 *  <file name="index.html">
 *      <div ng-controller="Ctrl" class="wm-app">
 *             <button ng-click="startProcess()">Start</button>
 *      </div>
 *  </file>
 *  <file name="script.js">
 *      function Ctrl($scope, $interval, ProgressBarService) {
 *          var intervalPromise,
 *              progressInstance,
 *              value = 0;
 *          function destroyProcess() {
 *              $interval.cancel(intervalPromise);
 *              progressInstance.destroy();
 *          }
 *          $scope.startProcess = function() {
 *              value = 0;
 *              ProgressBarService.createInstance('Demo Process', 0, 100)
 *                  .then(function(instance) {
 *                      progressInstance = instance;
 *                      intervalPromise = $interval(function() {
 *                          if (value < 100) {
 *                              instance.set('value', ++value);
 *                          } else {
 *                              destroyProcess();
 *                          }
 *                      }, 100);
 *                      instance.set('onStop', destroyProcess);
 *                  });
 *          };}
 *  </file>
 *  </example>
 */