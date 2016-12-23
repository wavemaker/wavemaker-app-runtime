/*global WM, _ */
/*Directive for message */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/message.html',
            '<p init-widget apply-styles class="alert app-message" ng-class="messageClass">' +
                '<i title="{{type}} Alert" class="{{type}} icon {{messageIconClass}}"></i>' +
                '<span ng-bind-html="messageContent"></span>' +
                '<button title="Close" type="button" class="btn-transparent close" ng-hide="hideclose">&times;</button>' +
            '</p>'
            );
    }])
    .directive('wmMessage', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', '$sce', 'Utils', function (PropertiesFactory, $templateCache, WidgetUtilService, $sce, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.message', ['wm.base']),
            notifyFor = {
                'type'   : true,
                'dataset': true,
                'caption': true
            };

        /*set caption, type & show properties */
        function setDataSet(dataset, scope) {
            if (!WM.isArray(dataset) && WM.isObject(dataset)) {
                scope.messageContent = $sce.trustAs($sce.HTML, dataset.caption);
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
                switch (newVal) {
                case 'success':
                    scope.messageClass = 'alert-success';
                    scope.messageIconClass = 'wi wi-done';
                    break;
                case 'error':
                    scope.messageClass = 'alert-danger';
                    scope.messageIconClass = 'wi wi-cancel';
                    break;
                case 'warn':  /*To support old projects with type as "warn"*/
                case 'warning':
                    scope.messageClass = 'alert-warning';
                    scope.messageIconClass = 'wi wi-bell';
                    break;
                case 'info':
                    scope.messageClass = 'alert-info';
                    scope.messageIconClass = 'wi wi-info';
                    break;
                case 'loading':
                    scope.messageClass = 'alert-info alert-loading';
                    scope.messageIconClass = 'fa fa-spinner fa-spin';
                    break;
                }
                break;
            case 'dataset':
                if (attrs.dataset) {
                    setDataSet(newVal, scope);
                }
                break;
            case 'caption':
                scope.messageContent = $sce.trustAsHtml(newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace' : true,
            'scope'   : {'scopedataset': '=?', 'onClose': '&'},
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element($templateCache.get('template/widget/message.html'));

                if (!isWidgetInsideCanvas) {
                    template.children().last().attr('ng-click', 'dismiss({$event: $event, $scope: this})');
                }
                return template[0].outerHTML;
            },
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    scope.hideclose = attrs.hideclose || attrs.hideClose || false;

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
                            scope.messageContent = caption || scope.messageContent;
                            scope.type = type || scope.type;
                        }
                    };

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, attrs), scope, notifyFor);

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);

                    // fields defined in scope: {} MUST be watched explicitly
                    // watching model attribute to the data for the message element.
                    if (!attrs.widgetid && attrs.scopedataset) {
                        scope.$watch('scopedataset', function (newVal) {
                            setDataSet(newVal, scope);
                        });
                    }
                }
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
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-message name="demoMessage" scopedataset="messageDataSet">
                </wm-message>
                <wm-composite>
                    <wm-label caption="Message Type:"></wm-label>
                    <wm-select scopedataset="content" datafield="All Fields" displayfield="type" scopedatavalue="messageDataSet"></wm-select>
                </wm-composite>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.content = [
                   {
                       type: 'success',
                       caption: 'Success Content'
                   },
                   {
                       type: 'error',
                       caption: 'Error Content'
                   },
                   {
                       type: 'warn',
                       caption: 'Warning Content'
                   },
                   {
                       type: 'info',
                       caption: 'Information Content'
                   }
               ];
               $scope.messageDataSet = $scope.content[0];

            }
        </file>
    </example>
 */