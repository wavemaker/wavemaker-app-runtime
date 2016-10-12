/*global WM,moment, _, document */
/*Directive for time */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/time.html',
            '<div class="app-timeinput input-group dropdown" uib-dropdown init-widget has-model apply-styles role="input" title="{{hint}}">' +
                '<input class="form-control app-textbox display-input" ng-model="_timeModel" accesskey="{{::shortcutkey}}" ng-change="updateTimeModel()" ng-model-options="{updateOn: \'blur\'}" ng-required="required">' +
                '<div uib-dropdown is-open="isOpen" class="dropdown" dropdown-append-to-body="true" auto-close="outsideClick">' +
                    '<div uib-dropdown-menu>' +
                        '<div uib-timepicker ng-model="_proxyModel" hour-step="hourstep" minute-step="minutestep" show-meridian="ismeridian" show-seconds="showseconds" ng-change="selectTime($event)"></div>' +
                    '</div>' +
                '</div>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" ng-disabled="disabled" ng-model="_model_">' +
                '<span class="input-group-btn dropdown-toggle">' +
                    '<button type="button" class="btn btn-default btn-time"><i class="app-icon wi wi-access-time"></i></button>' +
                '</span>' +
            '</div>'
            );
        $templateCache.put('template/device/widget/form/time.html',
            '<input type="time" class="form-control app-textbox" init-widget has-model role="input"' +
            ' ng-model="_proxyModel" ' +
            ' ng-readonly="readonly" ' +
            ' ng-required="required" ' +
            ' ng-disabled="disabled" ' +
            ' ng-change="updateModel();_onChange({$event: $event, $scope: this})"> '
            );
    }])
    .directive('wmTime', ['$rootScope', 'PropertiesFactory', 'WidgetUtilService', '$timeout', '$templateCache', '$filter', 'Utils', '$interval', 'CONSTANTS', function ($rs, PropertiesFactory, WidgetUtilService, $timeout, $templateCache, $filter, Utils, $interval, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.time', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
            notifyFor = {
                'readonly'    : CONSTANTS.isRunMode,
                'disabled'    : CONSTANTS.isRunMode,
                'autofocus'   : true,
                'timepattern' : true
            };


        function setTimeModel(scope) {
            if (scope.timepattern === 'timestamp') {
                scope._timeModel = scope._proxyModel && scope._proxyModel.getTime();
            } else {
                scope._timeModel = $filter('date')(scope._proxyModel, scope.timepattern);
            }
        }

        function propertyChangeHandler(scope, element, key, newVal) {
            var inputEl = element.find('input'),
                buttonEl = element.find('button');
            switch (key) {
            case 'readonly':
            case 'disabled':
                inputEl.attr(key, newVal);
                buttonEl.attr('disabled', newVal);
                // prevent the click events on decrement/increment buttons
                element.css('pointer-events', (scope.readonly || scope.disabled) ? 'none' : 'all');
                break;
            case 'autofocus':
                inputEl.first().attr(key, newVal);
                break;
            case 'timepattern':
                scope.showseconds = _.includes(newVal, 'ss');
                scope.ismeridian  = _.includes(newVal, 'hh');
                setTimeModel(scope);
                break;
            }
        }

        function _onClick(scope, evt) {
            evt.stopPropagation();
            if (scope.onClick) {
                scope.onClick({$event: evt, $scope: scope});
            }
        }
        function _onTimeClick(scope, element, evt) {
            evt.stopPropagation();
            var timeOpen = scope.isOpen;
            $timeout(function () {
                element.parent().trigger('click');
                scope.isOpen = !timeOpen;
            });
        }

        return {
            'restrict': 'E',
            'replace' : true,
            'scope'   : {},
            'template': function (tElement, tAttrs) {
                var template = '',
                    isWidgetInsideCanvas,
                    target;

                if ($rs.isMobileApplicationType && tAttrs.type !== 'uib-picker') {
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/device/widget/form/time.html', tElement, tAttrs));
                    return template[0].outerHTML;
                }

                template = WM.element($templateCache.get('template/widget/form/time.html', tElement, tAttrs));
                isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                target = template.children('input.form-control');

                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.display-input').attr('name', tAttrs.name);
                if (!isWidgetInsideCanvas) {

                    template.attr('ng-click', '_onClick($event)');
                    template.find('.btn-time').attr('ng-click', '_onTimeClick($event)');
                    template.find('.display-input').attr('ng-click', '_onTimeClick($event)');

                    if (tAttrs.hasOwnProperty('onMouseenter')) {
                        template.attr('ng-mouseenter', 'onMouseenter({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseleave')) {
                        template.attr('ng-mouseleave', 'onMouseleave({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onFocus')) {
                        target.attr('ng-focus', 'onFocus({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onBlur')) {
                        target.attr('ng-blur', 'onBlur({$event: $event, $scope: this})');
                    }
                }

                return template[0].outerHTML;
            },
            'link': {
                'pre': function (scope, element, attrs) {
                    scope.widgetProps = widgetProps;
                    if ($rs.isMobileApplicationType && attrs.type !== 'uib-picker') {
                        scope._nativeMode = true;
                    }
                },
                'post': function (scope, element, attrs) {
                    var onPropertyChange = propertyChangeHandler.bind(undefined, scope, element),
                        isCurrentTime = false,
                        CURRENT_TIME = 'CURRENT_TIME',
                        timeInterval,
                    //Function to set/ cancel the timer based on the model passed
                        setTimeInterval = function (cancel) { //Cancel the existing timer
                            if (cancel) {
                                $interval.cancel(timeInterval);
                                return;
                            }
                            if (CONSTANTS.isRunMode) {
                                scope.disabled = true;
                                onPropertyChange('disabled', scope.disabled);
                                //Check if timer already exists. If time interval doesn't exist or state is canceled, create new timer
                                if (!timeInterval || timeInterval.$$state.value === 'canceled') {
                                    timeInterval = $interval(function () {
                                        scope._model_ = CURRENT_TIME; //Update the model every 1 sec
                                        scope._onChange();
                                    }, 1000);
                                }
                            }
                        },
                        setProxyModel = function (val) {
                            var dateTime;
                            if (val) {
                                if (isCurrentTime) {
                                    scope._proxyModel = new Date();
                                    setTimeInterval();
                                } else {
                                    dateTime = Utils.getValidDateObject(val);
                                    scope._proxyModel = WM.isDate(dateTime) ? dateTime : undefined;
                                    setTimeInterval(true);
                                }
                            } else {
                                scope._proxyModel = undefined;
                            }
                        };

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(onPropertyChange, scope, notifyFor);

                    /*Called from form reset when users clicks on form reset*/
                    scope.reset = function () {
                        //TODO implement custom reset logic here
                        scope._model_ = '';
                    };

                    /*
                     * Backward compatibility for ismeridian property which is deprecated.
                     * if ismeridian is false then time is set as 24hr clock format.
                     */
                    if (attrs.ismeridian === 'false' && !attrs.timepattern) {
                        scope.timepattern = scope.timepattern.replace('hh', 'HH').replace(' a', '');
                    }
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    scope._onClick = _onClick.bind(undefined, scope);
                    scope._onTimeClick = _onTimeClick.bind(undefined, scope, element);

                    /*update the model for device time*/
                    scope.updateModel = function () {
                        scope._model_ = scope._proxyModel;
                    };
                    /*update the model when changed manually*/
                    scope.updateTimeModel = function () {
                        if (!isNaN(Date.parse(moment().format('YYYY-MM-DD') + ' ' + scope._timeModel))) {
                            setProxyModel(scope._timeModel);
                            setTimeModel(scope);
                        } else {
                            this._proxyModel = undefined;
                        }
                    };
                    /*Function to be called on click of time picker*/
                    scope.selectTime = function (event) {
                        scope._model_ = scope._proxyModel;
                        scope._onChange({$event: event, $scope: scope});
                    };

                    if (!scope.widgetid) {
                        /* handle initial readonly/disabled values */
                        $timeout(function () {
                            onPropertyChange('disabled', scope.disabled);
                            onPropertyChange('readonly', scope.readonly);
                        });
                    }

                    /* _model_ acts as a converter for _proxyModel
                     * read operation of _model_/datavalue will return epoch format of the date
                     * write operation of _model_ will update _proxyModel with Date object.
                     *  */

                    Object.defineProperty(scope, '_model_', {
                        get: function () {
                            if (scope.widgetid && isCurrentTime) {
                                return CURRENT_TIME;
                            }
                            var timestamp = this._proxyModel ?  this._proxyModel.valueOf() : undefined;
                            this.timestamp = timestamp;
                            if (this.outputformat === "timestamp") {
                                return timestamp;
                            }
                            if (!this.outputformat) {
                                this.outputformat = 'HH:mm:ss';
                            }
                            return this._proxyModel ? $filter('date')(this._proxyModel, this.outputformat) : '';
                        },
                        set: function (val) {
                            var dateTime;
                            isCurrentTime = val === CURRENT_TIME;
                            if (scope._nativeMode) {
                                if (val) {
                                    if (isCurrentTime) {
                                        dateTime = new Date();
                                        setTimeInterval();
                                    } else {
                                        dateTime = Utils.getValidDateObject(val);
                                        setTimeInterval(true);
                                    }
                                    /*set the proxymodel and timestamp*/
                                    this._proxyModel = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate(), dateTime.getHours(), dateTime.getMinutes(), dateTime.getSeconds());
                                } else {
                                    this._proxyModel = undefined;
                                }
                                return;
                            }
                            setProxyModel(val);
                            setTimeModel(scope);
                        }
                    });

                    /*set the model if datavalue exists */
                    if (attrs.datavalue  && !_.startsWith(attrs.datavalue, 'bind:')) {
                        scope._model_ = attrs.datavalue;
                        if (attrs.datavalue === CURRENT_TIME) {
                            setTimeInterval();
                        }
                    }
                    scope.$on('$destroy', function () {
                        setTimeInterval(true);
                    });

                    //Add app-datetime class to the wrapper that are appended to body
                    $timeout(function () {
                        WM.element('body').find('> [uib-dropdown-menu] > [uib-timepicker]').parent().addClass('app-datetime');
                    });
                }
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmTime
 * @restrict E
 *
 * @description
 * The directive defines a time  widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $timeout
 *
 * @param {string=} name
 *                  Name of the time widget.
 * @param {string=} placeholder
 *                  Placeholder for the input field
 * @param {string=} hint
 *                  Title/hint for the time widget <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of time widget. <br>
 *                  Default value : 0
 * @param {string=} scopedatavalue
 *                  This property accepts the value for the  widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the value of the time widget. <br>
 *                  This property is bindable
 * @param {string=} timestamp
 *                  This property returns the unix timestamp (epoch) of the datavalue. <br>
 *                  This property can be used for intermediate calculations and validations. <br>
 * @param {string=} ismeridian
 *                  whether do display 12H or 24H. <br>
 * @param {string=} hourstep
 *                  Number of hours to increase or decrease
 * @param {string=} minutestep
 *                  Number of minutes to increase or decrease.
 *@param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`.
 * @param {boolean=} autofocus
 *                   This property makes the widget get focused automatically when the page loads.
 * @param {boolean=} readonly
 *                   Readonly is a bindable property. <br>
 *                   This property will be used to make the time widget readonly on the web page. <br>
 *                   Default value: `false`. <br>
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the widget on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the widget on the web page. <br>
 *                  Default value: `false`.
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-mouseenter
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <wm-time
 *                  on-change="f($event, $scope)"
 *                  name="time1"
 *                  placeholder="set the time"
 *                  outputformat="{{outputformat}}"
 *                  hourstep="{{hourstep}}"
 *                  minutestep="{{minutestep}}"
 *                  ismeridian="{{ismeridian}}">
 *               </wm-time><br>
 *
 *               <div>Selected Time: {{currentTime}}</div><br>
 *               <div>timestamp: {{currentTimestamp}}</div><br>
 *               <wm-composite>
 *                   <wm-label caption="output format:"></wm-label>
 *                   <wm-text scopedatavalue="outputformat"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="ismeridian :"></wm-label>
 *                   <wm-text scopedatavalue="ismeridian"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="hourstep:"></wm-label>
 *                   <wm-text scopedatavalue="hourstep"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="minutestep:"></wm-label>
 *                   <wm-text scopedatavalue="minutestep"></wm-text>
 *               </wm-composite>
 *
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.ismeridian="true"
 *              $scope.hourstep="2"
 *              $scope.minutestep="4"
 *              $scope.outputformat = "hh:mm a"
 *              $scope.f = function (event,scope) {
 *                  $scope.currentTime = scope.datavalue;
 *                  $scope.currentTimestamp = scope.timestamp;
 *              }
 *           }
 *       </file>
 *   </example>
 */

