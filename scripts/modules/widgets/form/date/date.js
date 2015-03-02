/*global WM */
/*Directive for date */

WM.module('wm.widgets.form')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/form/date.html',
            '<div class="date-wrapper input-group" init-widget has-model data-ng-show="show">' +
                '<input class="form-control app-textbox app-dateinput" datepicker-popup={{datepattern}} ' +
                    ' title="{{hint}}" ' +
                    ' min-date=mindate max-date=maxdate is-open=isOpen' +
                    ' data-ng-model="_proxyModel" ' + /* _proxyModel is a private variable inside this scope */
                    ' data-ng-readonly="readonly" ' +
                    ' data-ng-required="required" ' +
                    ' data-ng-disabled="disabled" ' +
                    ' data-ng-change="_onChange({$event: $event, $scope: this})" ' + /* private method defined in this scope */
                     $rootScope.getWidgetStyles() + ' >' +
                '</input>' +
                /*Holder for the model for submitting values in a form*/
                '<input class="model-holder ng-hide" data-ng-disabled="disabled" data-ng-model="_model_">' +
                '<span class="input-group-btn">' +
                    '<button type="button" class="btn btn-default"><i class="glyphicon glyphicon-calendar"></i></button>' +
                '</span>' +
            '</div>'
            );
    }])
    .directive('wmDate', ['PropertiesFactory', 'WidgetUtilService', '$templateCache', function (PropertiesFactory, WidgetUtilService, $templateCache) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.date', ['wm.base', 'wm.base.editors.abstracteditors', 'wm.base.datetime']),
            notifyFor = {
                'readonly': true,
                'disabled': true
            };

        function propertyChangeHandler(element, key, newVal) {
            switch (key) {
            case 'readonly':
            case 'disabled':
                // prevent the click events on decrement/increment buttons
                element.css('pointer-events', newVal ? 'none' : 'all');
                break;
            }
        }

        function _onClick(scope, evt) {
            evt.stopPropagation();
            scope.isOpen = !scope.isOpen;

            if (scope.onClick) {
                scope.onClick({$event: evt, $scope: scope});
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element($templateCache.get('template/widget/form/date.html')),
                    target = template.children('input.form-control');
                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.model-holder').attr('name', tAttrs.name);
                if (!isWidgetInsideCanvas) {

                    template.attr('data-ng-click', '_onClick($event)');

                    if (tAttrs.hasOwnProperty('onMouseenter')) {
                        template.attr('data-ng-mouseenter', 'onMouseenter({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onMouseleave')) {
                        template.attr('data-ng-mouseleave', 'onMouseleave({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onFocus')) {
                        target.attr('data-ng-focus', 'onFocus({$event: $event, $scope: this})');
                    }

                    if (tAttrs.hasOwnProperty('onBlur')) {
                        target.attr('data-ng-blur', 'onBlur({$event: $event, $scope: this})');
                    }
                }

                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);

                        scope._onClick = _onClick.bind(undefined, scope);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        /* _model_ acts as a converter for _proxyModel
                         * read operation of _model_/datavalue will return epoch format of the date
                         * write operation of _model_ will update _proxyModel with Date object.
                         *  */
                        Object.defineProperty(scope, '_model_', {
                            get: function () {
                                return this._proxyModel ?  this._proxyModel.valueOf() : undefined;
                            },
                            set: function (val) {
                                if (val) {
                                    if (WM.isDate(val)) {
                                        this._proxyModel = val;
                                    } else {
                                        var date = new Date(val);
                                        this._proxyModel = WM.isDate(date) ? date : undefined;
                                    }
                                } else {
                                    this._proxyModel = undefined;
                                }
                            }
                        });
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmDate
 * @restrict E
 *
 * @description
 * The directive defines a date  widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $templateCache
 *
 * @param {string=} name
 *                  Name of the date widget.
 * @param {string=} placeholder
 *                  Placeholder for the input field
 * @param {string=} hint
 *                  Title/hint for the date <br>
 *                  This property is bindable.
 * @param {string=} datepattern
 *                  display pattern of dates. <br>
 *                  This property is bindable.
 *@param {boolean=} required
 *                  required is a bindable property. <br>
 *                  if the required property is set to true, `required` class is applied to the label[an asterik will be displayed next to the content of the label']. <br>
 *                  Default value: `false`.
 * @param {string=} mindate
 *                  MinDate is the minimum date to start with
 * @param {string=} maxdate
 *                  MinDate is the maximum date to end with.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the widget on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the widget on the web page. <br>
 *                  Default value: `false`.
 * @param {string=} on-click
 *                  Callback function for `click` event.
 * @param {string=} on-mouseenter.
 *                  Callback function for `mouseenter` event.
 * @param {string=} on-mouseleave
 *                  Callback function for `mouseleave` event.
 * @param {string=} on-focus
 *                  Callback function for `focus` event.
 * @param {string=} on-blur
 *                  Callback function for `blur` event.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <div>Selected Date: {{currentDate | date:'medium'}}</div><br>
 *               <wm-date name="date1"
 *                   on-change="f($event, $scope)"
 *                   placeholder="{{placeholder}}"
 *                   hint="Add a date"
 *                   datepattern="{{datepattern}}"
 *                   mindate="{{mindate}}"
 *                  maxdate="{{maxdate}}">
 *               </wm-date><br>
 *               <wm-composite>
 *                   <wm-label caption="placeholder:"></wm-label>
 *                   <wm-text scopedatavalue="placeholder"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="datepattern:"></wm-label>
 *                   <wm-text scopedatavalue="datepattern"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="mindate:"></wm-label>
 *                   <wm-text scopedatavalue="mindate"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="maxdate:"></wm-label>
 *                   <wm-text scopedatavalue="maxdate"></wm-text>
 *               </wm-composite>
 *
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.placeholder="Fix a date"
 *              $scope.datepattern="dd-MM-yy"
 *              $scope.mindate="01-01-2014"
 *              $scope.maxdate="01-02-2014"
 *
 *              $scope.f = function (event, scope) {
 *                  $scope.currentDate = scope.datavalue;
 *              }
 *           }
 *       </file>
 *   </example>
 */