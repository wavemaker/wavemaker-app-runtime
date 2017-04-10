/*global WM, _*/
/*jslint todo: true */
/*Directive for Wizard */

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        //Define the template for the wizard directive
        $templateCache.put('template/layout/container/wizard.html',
            '<div class="app-wizard panel clearfix" init-widget apply-styles="shell">' +
                '<div class="app-wizard-heading">' +
                    '<ul class="app-wizard-steps nav nav-pills {{stepClass}}"></ul>' +
                '</div>' +
                '<div class="app-wizard-body panel-body" apply-styles="inner-shell">' +
                    '<wm-message scopedataset="message"></wm-message>' +
                    '<div wmtransclude></div>' +
                '</div>' +
                '<div class="app-wizard-actions panel-footer">' +
                    '<a class="app-wizard-skip" name="skipStep_{{name}}" ng-if="currentStep.enableskip" title="Skip step" ng-click="skip()">Skip &raquo;</a>' +
                    '<div class="app-wizard-actions-right">' +
                        '<button type="button" name="cancelBtn_{{name}}" class="btn app-button btn-secondary" ng-if="cancelable" ng-click="cancel()" title="{{cancelbtnlabel}}">{{cancelbtnlabel}}</button>' +
                        '<button type="button" name="previousBtn_{{name}}" class="btn app-button btn-secondary" ng-if="steps.indexOf(currentStep) > 0" ng-click="prev()" ng-disabled="currentStep.disableprevious">' +
                            '<i class="app-icon wi wi-chevron-left"></i>' +
                            '<span class="btn-caption">{{previousbtnlabel}}</span>' +
                        '</button>' +
                        '<button type="button" name="nextBtn_{{name}}" class="btn app-button btn-primary" ng-if="steps.indexOf(currentStep) !== steps.length - 1" ng-click="next()" ng-disabled="currentStep.disablenext || currentStep.isFormInvalid">' +
                            '<span class="btn-caption">{{nextbtnlabel}}</span>' +
                            '<i class="app-icon wi wi-chevron-right"></i>' +
                        '</button>' +
                        '<button type="button" name="doneBtn_{{name}}" class="btn app-button btn-success" ng-if="(steps.indexOf(currentStep) === steps.length - 1) || currentStep.enabledone" ng-click="done()" ng-disabled="currentStep.disabledone || currentStep.isFormInvalid">' +
                            '<i class="app-icon wi wi-done"></i>' +
                            '<span class="btn-caption">{{donebtnlabel}}</span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
            );

        //Define the template for the wizard step directive
        $templateCache.put('template/layout/container/wizard-step.html',
            '<form init-widget wmtransclude class="app-wizard-step-content" ng-class="{\'current\': status === \'CURRENT\'}" data-step-id="{{stepIndex}}"></form>');
    }])
    .directive('wmWizard', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        '$compile',
        'CONSTANTS',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, $compile, CONSTANTS, Utils) {
            'use strict';

            //Get the properties related to the wizard
            var widgetProps  = PropertiesFactory.getPropertiesOf('wm.wizard', ['wm.base', 'wm.layouts', 'wm.containers']),
                STEP_STATUS  = {'COMPLETED': 'COMPLETED', 'CURRENT': 'CURRENT', 'DISABLED': 'DISABLED'},
                notifyFor    = {
                    'stepstyle'  : true,
                    'defaultstep': CONSTANTS.isRunMode,
                    'addchild'   : CONSTANTS.isStudioMode
                };

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler($s, ctrl, key, newVal, oldVal) {
                //Monitoring changes for properties and accordingly handling respective changes
                switch (key) {
                case 'stepstyle':
                    $s.stepClass = newVal && newVal === 'justified' ? 'nav-justified': '';
                    break;
                case 'defaultstep':
                    var step = _.find($s.steps, {'name': newVal}),
                        stepIndex;

                    //If the defaultstep has show true then only update the currentstep
                    if (step && step.show) {
                        $s.currentStep = step;
                        step.status    = STEP_STATUS.CURRENT;
                        stepIndex      = step.stepIndex - 1;

                        //Mark all previous step status COMPLETED
                        while(stepIndex >= 0) {
                            $s.steps[stepIndex].status = STEP_STATUS.COMPLETED;
                            stepIndex--;
                        }
                    }

                    break;
                case 'addchild':
                    ctrl.updateStepList();
                    break;
                }
            }
            
            function navigateToStep($is, stepIndex) {
                var step = $is.steps[stepIndex];

                //If only show then only navigate to next step else return false
                if (step && step.show) {
                    $is.currentStep        = step;
                    $is.currentStep.status = STEP_STATUS.CURRENT;

                    return true;
                }

                return false;
            }

            return {
                'restrict'  : 'E',
                'scope'     : {'onDone': '&', 'onCancel': '&'},
                'replace'   : true,
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/wizard.html'),
                'controller': ['$scope', '$element', function ($is, $element) {
                    var stepHeaderTarget  = $element.find('.app-wizard-steps');
                    $is.steps        = [];
                    this.dataStepId = 0;
                    //Register step
                    this.register = function (stepScope) {
                        $is.steps.push(stepScope);
                    };
                    //Register step header to append to header list
                    this.registerStepHeader = function (stepScope) {
                        stepScope.stepIndex = this.dataStepId;
                        stepScope._headerElement.attr('data-step-id', this.dataStepId);
                        stepHeaderTarget.append(stepScope._headerElement);
                        $compile(stepScope._headerElement)(stepScope);
                        this.dataStepId++;
                    };

                    //Updates widget step list
                    this.updateStepList = function () {
                        var options = [{'label': 'None', 'value': 'none'}];

                        _.map($is.steps, function (step) {
                           options.push({'label': step.name, 'value': step.name});
                        });

                        $is.widgetProps.defaultstep.options = options;
                    };

                    //Remove header element on removal of step
                    this.unRegisterHeaderElement = function (stepScope) {
                        stepHeaderTarget.find('[data-step-id="' + stepScope.stepIndex + '"]').remove();
                        $is.steps.splice(stepScope.stepIndex, 1);
                        //On removal of current step make first step as current step
                        if ($is.steps.length) {
                            $is.currentStep        = $is.steps[0];
                            $is.currentStep.status = STEP_STATUS.CURRENT;
                        }
                    };
                    if (CONSTANTS.isRunMode) {
                        //Function to navigate to next step
                        $is.next = function () {
                            var prevStep = $is.currentStep,
                                params   = {$isolateScope: $is, currentStep: prevStep, stepIndex: prevStep.stepIndex},
                                stepIndex;

                            if (prevStep.onNext) {
                                if (prevStep.onNext(params) === false) {
                                    return;
                                }
                            }

                            stepIndex = prevStep.stepIndex + 1;

                            //Get step index of next step which has show true
                            while (!$is.steps[stepIndex].show && stepIndex < $is.steps.length - 1) {
                                stepIndex++;
                            }

                            //If there are any steps which has show then only change state of current step else remain same
                            if (navigateToStep($is, stepIndex)) {
                                prevStep.status = STEP_STATUS.COMPLETED;
                            }
                        };
                        //Function to navigate to previous step
                        $is.prev = function () {
                            var params,
                                stepIndex,
                                prevStep = $is.currentStep;

                            if (prevStep.onPrev) {
                                params = {$isolateScope: $is, currentStep: prevStep, stepIndex: prevStep.stepIndex};
                                if (prevStep.onPrev(params) === false) {
                                    return;
                                }
                            }

                            stepIndex = prevStep.stepIndex - 1;

                            while(!$is.steps[stepIndex].show && stepIndex > 0) {
                                stepIndex--;
                            }

                            if (navigateToStep($is, stepIndex)) {
                                prevStep.status = STEP_STATUS.DISABLED;
                            }
                        };
                        //Function to skip current step
                        $is.skip = function () {
                            var params;
                            if ($is.currentStep.onSkip) {
                                params = {$isolateScope: $is, currentStep: $is.currentStep, stepIndex: $is.currentStep.stepIndex};
                                if ($is.currentStep.onSkip(params) === false) {
                                    return;
                                }
                            }
                            if ($is.currentStep.stepIndex + 1 < $is.steps.length) {
                                $is.currentStep.status = STEP_STATUS.COMPLETED;
                                navigateToStep($is, $is.currentStep.stepIndex + 1);
                            }
                        };
                        //Function to invoke on-Done event on wizard
                        $is.done = function () {
                            var params;
                            if ($is.onDone) {
                                params = {$isolateScope: $is, steps: $is.steps};
                                if ($is.onDone(params) === false) {
                                    return;
                                }
                            }
                        };
                        //Function to invoke on-Cancel event on wizard
                        $is.cancel = function () {
                            var params;
                            if ($is.onCancel) {
                                params = {$isolateScope: $is, steps: $is.steps};
                                if ($is.onCancel(params) === false) {
                                    return;
                                }
                            }
                        };
                    }
                }],
                link: {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, element, attrs, ctrl) {
                        var stepIndex = 0,
                            currentStep;

                        //On load also check the first show true step and make it as current step
                        while (!$is.steps[stepIndex].show && stepIndex < $is.steps.length - 1) {
                            stepIndex++;
                        }

                        currentStep = $is.steps[stepIndex];

                        if (currentStep && currentStep.show) {
                            $is.currentStep        = currentStep;
                            $is.currentStep.status = STEP_STATUS.CURRENT;
                        }

                        ctrl.updateStepList();

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, ctrl), $is, notifyFor);
                        //initialize the widget
                        WidgetUtilService.postWidgetCreate($is, element, attrs);
                    }
                }
            };
        }])
    .directive('wmWizardstep', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'CONSTANTS',
        '$rootScope',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, CONSTANTS, $rs, Utils) {
            'use strict';

            var widgetProps    = PropertiesFactory.getPropertiesOf('wm.wizardstep', ['wm.base']),
                STEP_STATUS    = {'COMPLETED': 'COMPLETED', 'CURRENT': 'CURRENT', 'DISABLED': 'DISABLED'},
                $headerElement = '<li class="app-wizard-step" ng-show="showHeader" ng-class="{active: status === \'COMPLETED\', current: status === \'CURRENT\', disabled: status === \'DISABLED\'}">' +
                                    '<a href="javascript:void(0)">' +
                                        '<span class="arrow"></span>' +
                                        '<i class="app-icon {{iconclass}}" ng-if="iconclass"></i> ' +
                                        '<span class="step-title" ng-bind="title"></span>' +
                                    '</a>' +
                                '</li>',
                notifyFor  = {
                    'show' : true,
                    'name' : CONSTANTS.isStudioMode
                };

            //Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler(scope, ctrl, key, newVal) {
                switch (key) {
                case 'show':
                    scope.showHeader = newVal || CONSTANTS.isStudioMode;
                    break;
                case 'name':
                    ctrl.updateStepList();
                    break;
                }
            }

            return {
                'restrict'  : 'E',
                'scope'     : {
                    'onNext'    : '&',
                    'onPrev'    : '&',
                    'onLoad'    : '&',
                    'onSkip'    : '&'
                },
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/wizard-step.html'),
                'replace'   : true,
                'require'   : '^wmWizard',
                'link'      : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs, ctrl) {
                        var $parentElement = $el.parent().closest('.app-wizard'),
                            parentIs       = $parentElement.isolateScope();
                        $is._headerElement  = WM.element($headerElement);
                        $is._formElement    = $el;
                        $is.status          = STEP_STATUS.DISABLED;
                        ctrl.registerStepHeader($is);
                        //Register step with wizard
                        ctrl.register($is);
                        if (CONSTANTS.isStudioMode) {
                            $is.$on('$destroy', function () {
                                ctrl.unRegisterHeaderElement($is);
                            });
                        } else {
                            //$watch on form valid status
                            $is.$watch($is.name + '.$valid', function (newVal) {
                                $is.isFormInvalid = !newVal;
                            });
                        }
                        //$watch on step load ie.. step is active and trigger onLoad event
                        $is.$watch('status', function (nv) {
                            if (nv === STEP_STATUS.CURRENT) {
                                $is.__load();
                                if (CONSTANTS.isRunMode) {
                                    if ($is.onLoad) {
                                        $is.onLoad({$isolateScope: $is});
                                    }
                                }
                                $el.find('.ng-isolate-scope')
                                    .each(function () {
                                        Utils.triggerFn(WM.element(this).isolateScope().redraw);
                                    });
                            }
                        });

                        $parentElement.on('click', '.app-wizard-step', function (event) {
                            event.stopPropagation();
                            var $headerEles     = $parentElement.find('.app-wizard-step'),
                                currentStepId   = WM.element(event.currentTarget).attr('data-step-id'),
                                $stepPanes      = $parentElement.find('.app-wizard-step-content'),
                                $currentStepEle = $parentElement.find('.app-wizard-step-content[data-step-id=' + currentStepId + ']'),
                                currentStep     = $currentStepEle.isolateScope(),
                                widgetId        = $currentStepEle.attr('widgetid');
                            if (CONSTANTS.isStudioMode) {
                                _.forEach($headerEles, function (headerEle) {
                                    WM.element(headerEle).scope().status = STEP_STATUS.DISABLED;
                                });
                                $stepPanes.removeClass('current');
                                $currentStepEle.addClass('current');
                                parentIs.currentStep = currentStep;
                                currentStep.status   = STEP_STATUS.CURRENT;
                                $rs.$emit('set-active-widget', widgetId);
                            } else {
                                if (currentStep.status === STEP_STATUS.COMPLETED) {
                                    _.forEach(parentIs.steps, function (step, index) {
                                        step.status = index < currentStep.stepIndex ? STEP_STATUS.COMPLETED : STEP_STATUS.DISABLED;
                                    });
                                    parentIs.currentStep        = currentStep;
                                    parentIs.currentStep.status = STEP_STATUS.CURRENT;
                                }
                            }
                            $rs.$safeApply($is);
                        });

                        //register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, ctrl), $is, notifyFor);

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmWizard
 * @restrict E
 *
 * @description
 * The `wmWizard` directive defines wizard widget. <br>
 * wmWizard can only contain wmWizardstep widgets. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the wizard.
 * @param {string=} width
 *                  Width of the wizard.
 * @param {string=} height
 *                  Height of the wizard.
 * @param {string=} nextbtnlabel
 *                  Label to Next step button
 * @param {string=} previousbtnlabel
 *                  Label to Previous step button
 * @param {string=} donebtnlabel
 *                  Label to Done button
 * @param {string=} cancelbtnlabel
 *                  Label to Cancel button
 * @param {string=} defaultstep
 *                  Name of the step which should load first on load of wizard
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the wizard on the web page. <br>
 *                  default value: `true`.
 *
 * @example
 <example module="wmCore">
     <file name="index.html">
         <div ng-controller="Ctrl" class="wm-app">
             <wm-wizard width="500">
                <wm-wizardstep title="Registration">
                </wm-wizardstep>
             </wm-wizard>
         </div>
     </file>
     <file name="script.js">
        function Ctrl($scope) {}
     </file>
 </example>
 */


/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmWizardstep
 * @restrict E
 *
 * @description
 * The `wmWizardstep` directive defines wizard step widget. <br>
 * wmWizardstep can be used only inside wmWizard. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the wizardstep.
 * @param {string=} title
 *                  Title of the step.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the step on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} disablenext
 *                  disablenext is a bindable property. <br>
 *                  This property will be used to enable/disable the next step button for wizard. <br>
 * @param {string=} on-next
 *                  Callback function which will be triggered when the next btn is clicked.
 * @param {string=} on-previous
 *                  Callback function which will be triggered when the previous btn is clicked.
 * @param {string=} on-load
 *                  Callback function which will be triggered on load of step.
 *
 * @example
 <example module="wmCore">
     <file name="index.html">
         <div ng-controller="Ctrl" class="wm-app">
            <wm-wizard width="500">
                <wm-wizardstep title="Registration">
                </wm-wizardstep>
            </wm-wizard>
         </div>
     </file>
     <file name="script.js">
        function Ctrl($scope) {}
     </file>
 </example>
 */