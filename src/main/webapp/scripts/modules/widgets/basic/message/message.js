/*global WM */
/*Directive for message */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/message.html',
            '<p class="alert app-message" data-ng-show="show" init-widget apply-styles ' +
                'data-ng-class=\'{' +
                '"alert-success":messageType.isSuccess, ' +
                '"alert-danger":messageType.isError, ' +
                '"alert-warning":messageType.isWarning, ' +
                '"alert-info":messageType.isInfo, ' +
                '"alert-info alert-loading":messageType.isLoading}\' ' +
                '><i class="icon"></i>' +
                '<span ng-bind-html="caption"></span>' +
                '<i class="close" data-ng-hide="hideClose">&times;</i>' +
            '</p>'
            );
    }])
    .directive('wmMessage', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', function (PropertiesFactory, $templateCache, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.message', ['wm.base']),
            notifyFor = {
                'type': true,
                'dataset': true
            };

        /*set caption, type & show properties */
        function setDataSet(dataset, scope) {
            if (!WM.isArray(dataset) && WM.isObject(dataset)) {
                scope.caption = dataset.caption;
                scope.type = dataset.type;
                scope.show = dataset.show = true;
            } else {
                scope.show = false;
            }
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, attrs, key, newVal) {
            switch (key) {
            case 'type':
                if (newVal === 'success') {
                    scope.messageType = {
                        isSuccess: true
                    };
                } else if (newVal === 'error') {
                    scope.messageType = {
                        isError: true
                    };
                } else if (newVal === 'warning') {
                    scope.messageType = {
                        isWarning: true
                    };
                } else if (newVal === 'warn') {/*Fallback to support old projects with type as "warn"*/
                    scope.type = 'warning';
                } else if (newVal === 'info') {
                    scope.messageType = {
                        isInfo: true
                    };
                } else if (newVal === 'loading') {
                    scope.messageType = {
                        isLoading: true
                    };
                }
                break;
            case 'dataset':
                if (attrs.dataset) {
                    setDataSet(newVal, scope);
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'scopedataset': '=?',
                'onClose': '&'
            },
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element($templateCache.get('template/widget/message.html'));

                if (!isWidgetInsideCanvas) {
                    template.children().last().attr('data-ng-click', 'dismiss({$event: $event, $scope: this})');
                }
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        scope.hideClose = attrs.hideClose || false;

                        /*on-click of close icon*/
                        scope.dismiss = function (eventObject) {
                            /* trigger the onClose function before closing */
                            /*If a javascript function is given call the function directly else trigger the custom 'close' event*/
                            scope.onClose({$event: eventObject.$event, $scope: eventObject.$scope});
                            if (scope.dataset) {
                                scope.dataset.show = false;
                                setDataSet(null, scope);
                            } else if (scope.scopedataset) {
                                scope.scopedataset.show = false;
                                setDataSet(null, scope);
                            } else {
                                scope.show = false;
                            }
                        };

                        /*function to be called explicitly, to manage show/hide properties*/
                        scope.toggle = function (showHide, caption, type) {
                            if (WM.isUndefined(showHide)) {
                                scope.show = !scope.show;
                            } else {
                                scope.show = showHide === 'show' ? true : (showHide === 'hide' ? false : showHide);
                                scope.caption = caption || scope.caption;
                                scope.type = type || scope.type;
                            }
                        };

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, attrs), scope, notifyFor);

                        /* fields defined in scope: {} MUST be watched explicitly */
                        /*watching model attribute to the data for the message element.*/
                        if (!scope.widgetid) {
                            if (attrs.scopedataset) {
                                scope.$watch('scopedataset', function (newVal) {
                                    setDataSet(newVal, scope);
                                });
                            }
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmMessage
 * @restrict E
 *
 * @description
 * The `wmMessage` directive defines the message widget. <br>
 * This widget exposes `dismiss` method which when invoked will destroy the message widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the message widget.
 * @param {string=} type
 *                  Type of the message. <br>
 *                  Possible values are `success`, `error`, `warn`, and `info`. <br>
 *                  Default value: `success`. <br>
 *                  This is a bindable property.
 * @param {string=} caption
 *                  Content of the message. <br>
 *                  This property is bindable.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the message widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the anchor. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, `etc`.
 * @param {string=} on-close
 *                  Callback function which will be triggered when message widget is closed.
 *
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <wm-message name="demoMessage" scopedataset="messageDataSet">
 *               </wm-message>
 *               <wm-composite>
 *                   <wm-label caption="Message Type:"></wm-label>
 *                   <wm-select scopedataset="content" datafield="All Fields" displayfield="type" scopedatavalue="messageDataSet"></wm-select>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.content = [
 *                  {
 *                      type: 'success',
 *                      caption: 'Success Content'
 *                  },
 *                  {
 *                      type: 'error',
 *                      caption: 'Error Content'
 *                  },
 *                  {
 *                      type: 'warn',
 *                      caption: 'Warning Content'
 *                  },
 *                  {
 *                      type: 'info',
 *                      caption: 'Information Content'
 *                  }
 *              ];
 *              $scope.messageDataSet = $scope.content[0];
 *
 *           }
 *       </file>
 *   </example>
 */