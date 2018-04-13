/*global WM, */
/*Directive for Iframe */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/iframe.html',
                '<div class="embed-responsive app-iframe" init-widget >' +
                    '<iframe class="embed-responsive-item iframe-content" scrolling="auto" marginheight="0" marginwidth="0" frameborder="0" ' +
                        'title="{{hint}}" seamless="seamless">' +
                    '</iframe>' +
                    '<div class="wm-content-info {{class}} readonly-wrapper" ng-if="showContentLoadError"><p class="wm-message" title="{{hintMsg}}">{{errMsg}}</p></div>' +
                '</div>'
            );
    }])
    .directive('wmIframe', ['PropertiesFactory', '$rootScope', 'WidgetUtilService', '$sce', 'Utils', function (PropertiesFactory, $rootScope, WidgetUtilService, $sce, Utils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.iframe', ['wm.base']),
            notifyFor = {
                'iframesrc': true,
                'width': true,
                'height': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            /*Monitoring the changes to the widget properties to apply the same as the widget attributes.*/
            switch (key) {
            case 'iframesrc':
                /*monitoring the iframe src property*/
                if (newVal && WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    /*applying the property value as src attribute value only if newVal is string */
                    newVal = scope.encodeurl ? Utils.encodeUrl(newVal) : newVal;
                    scope._iframesrc = $sce.trustAsResourceUrl(newVal);

                    /* check for 'http' urls in studio mode of SAAS studio version */
                    if (Utils.isInsecureContentRequest(newVal)) {
                        scope.showContentLoadError = true;
                        scope.errMsg = $rootScope.appLocale.MESSAGE_ERROR_CONTENT_DISPLAY + newVal;
                        scope.hintMsg = $rootScope.appLocale.MESSAGE_ERROR_CONTENT_DISPLAY + newVal;
                    } else {
                        scope.showContentLoadError = false;
                    }

                    element.children('iframe').attr('src', scope._iframesrc);
                } else {
                    element.children('iframe').attr('src', '');
                }
                break;
                case 'width':
                case 'height':
                    element.css(key, newVal);
                    break;
            }
        }

        return {
            'restrict': 'E',
            'scope'   : {},
            'replace' : true,
            'template': function (tElement, tAttrs) {
                var template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/iframe.html', tElement, tAttrs));
                /*Set name for the model-holder, to ease submitting a form*/
                template.find('.iframe-content').attr('name', tAttrs.name);

                return template[0].outerHTML;
            },
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmIframe
 * @restrict E
 *
 * @description
 * The 'wmIframe' directive defines an iframe widget.
 * This is a container widget for embedding some external url into the current page.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $sce
 * @requires $location
 *
 * @param {string=} name
 *                  Name of the iframe widget.
 * @param {string=} hint
 *                  Title/hint for the iframe widget.<br>
 *                  This is a bindable property. <br>
 * @param {string=} source
 *                  External URL that needs to be embedded within the iframe. <br>
 *                  This is a bindable property.
 * @param {string=} width
 *                  Width of the iframe widget.
 * @param {string=} height
 *                  Height of the iframe widget.
 * @param {boolean=} show
 *                  This property will be used to show/hide the iframe widget on the web page. <br>
 *                  This is a bindable property. <br>
 *                  Default value: `true`. <br>
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                Width: <wm-text scopedatavalue="width"></wm-text> <br><br>
                height: <wm-text scopedatavalue="height"></wm-text> <br><br>
                <div>
                   <wm-iframe width="{{width}}" height="{{height}}" iframesrc={{sourceURL}}></wm-iframe>
                </div>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
               $scope.width = "100%";
               $scope.height = "500px";

               $scope.sourceURL = "//www.wavemaker.com";
            }
        </file>
    </example>
 */