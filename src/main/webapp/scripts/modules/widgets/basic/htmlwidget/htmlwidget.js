/*global WM*/
/*Directive for html */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/htmlTemplate.html',
            '<div class="app-html-container" init-widget title="{{hint}}" data-ng-show="show" apply-styles>' +
                '<div class="html-content"></div>' +
            ' </div>'
            );
    }])
    .directive('wmHtml', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.html', ['wm.base', 'wm.base.editors', 'wm.base.events']),
            notifyFor = {
                'content': true,
                'autoscroll': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, targetEl, key, newVal) {
            switch (key) {
            case 'content':
                targetEl.html(newVal);
                break;
            case 'autoscroll':
                newVal = newVal === true || newVal === 'true';
                element.css('overflow', newVal ? 'auto' : 'hidden');
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/htmlTemplate.html'),
            'compile': function (tElement) {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        var targetElement = element.children().first(),
                            content = tElement.context.innerHTML;

                        /* if content is provided as an attribute, give it preference */
                        scope.content = attrs.content || content;

                        /* set the html content*/
                        targetElement.html(scope.content);

                        element.css('overflow', 'hidden');

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element, targetElement), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmHtml
 * @restrict E
 *
 * @description
 * The 'wmHtml' directive defines a html-widget.
 * This is a container widget for the html content.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the html-widget.
 * @param {string=} hint
 *                  Title/hint for the html-widget.<br>
 *                  This is a bindable property. <br>
 * @param {string=} width
 *                  Width of the html-widget.
 * @param {string=} height
 *                  Height of the html-widget.
 * @param {string=} content
 *                  Content of the html-widget. <br>
 *                  This is a bindable property.
 * @param {boolean=} show
 *                  This property will be used to show/hide the html-widget on the web page. <br>
 *                  This is a bindable property. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} autoscroll
 *                  This property defines if the html-widget should be allowed to scroll automatically. <br>
 *                  Default value: `false`. <br>
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dblclick
 *                  Callback function which will be triggered when the widget is double-clicked.
 * @param {string=} on-mouseenter.
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                Show Html widget: <wm-checkbox scopedatavalue="show"></wm-checkbox> <br><br>
                Width: <wm-text scopedatavalue="width"></wm-text> <br><br>
                height: <wm-text scopedatavalue="height"></wm-text> <br><br>
                Click Count: {{clickCount}} <br><br>
                <div>
                   <wm-html width="{{width}}" height="{{height}}" show="{{show}}" on-click="f()" bordertop="2" borderleft="2" borderright="2" borderbottom="2" bordercolor="crimson" borderstyle="solid" paddingtop="10" paddingleft="10" paddingright="10" paddingbottom="10">
                       <div>
                           <h2 style="text-decoration:underline;">Html-widget content</h2>
                           <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                       </div>
                       <br>
                   </wm-html>
                </div>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
               $scope.clickCount = 0;
               $scope.width = "350px";
               $scope.height = "250px";
               $scope.show = true;

               $scope.f = function () {
                   $scope.clickCount++;
               }
            }
        </file>
    </example>
 */