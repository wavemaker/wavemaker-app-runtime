/*global WM */
/*Directive for button */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/form/button.html',
            '<button class="btn app-button" init-widget apply-styles role="input">' +
                '<img data-identifier="img" class="button-image-icon" ng-src="{{iconsrc}}" ng-if="iconsrc" ng-style="{width:iconwidth ,height:iconheight, margin:iconmargin}"/>' +
                '<i class="app-icon {{iconclass}}" ng-style="{width:iconwidth, height:iconheight, margin:iconmargin, fontSize:iconwidth}" ng-if="showicon"></i> ' +
                '<span class="btn-caption"></span>' +
                '<span ng-if="badgevalue" class="badge pull-right">{{badgevalue}}</span>' +
            '</button>'
            );
    }])
    .directive('wmButton', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.button', ['wm.base', 'wm.dynamicstyles', 'wm.base.advancedformwidgets', 'wm.base.events', 'wm.base.events.focus', 'wm.base.events.keyboard']),
            notifyFor = {
                'iconclass': true,
                'iconurl': true,
                'caption': true,
                'iconposition': true,
                'hint': true,
                'disabled': true,
                'shortcutkey': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            switch (key) {
            case 'iconposition':
                element.attr('icon-position', newVal);
                break;
            case 'iconclass':
                /*showing icon when iconurl is not set*/
                scope.showicon = scope.iconclass !== '_none_' && newVal !== '' && !scope.iconurl;
                break;
            case 'iconurl':
                /*hiding icon when iconurl is set*/
                scope.showicon = newVal === '';
                scope.iconsrc = Utils.getImageUrl(newVal);
                break;
            case 'caption':
                Utils.setNodeContent(element.children('.btn-caption'), newVal);
                break;
            case 'hint':
                attrs.$set('title', newVal);
                break;
            case 'disabled':
                element[0].disabled = newVal;
                break;
            case 'shortcutkey':
                attrs.$set('accesskey', newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/form/button.html'),
            'compile': function (tElement) {
                return {
                    'pre': function (scope, element, attrs) {
                        //@Deprecated iconname; use iconclass instead
                        if (!attrs.iconclass && attrs.iconname) {
                            WM.element(tElement.context).attr('iconclass', 'glyphicon glyphicon-' + attrs.iconname);
                            attrs.iconclass = 'glyphicon glyphicon-' + attrs.iconname;
                        }

                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);

                        /*Called from form reset when users clicks on form reset*/
                        scope.reset = function () {
                            //TODO implement custom reset logic here
                        };

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmButton
 * @restrict E
 *
 * @description
 * The `wmButton` directive defines the button widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} caption
 *                  This property specifies the label of the button. <br>
 *                  This property is bindable.
 * @param {string=} badgevalue
 *                  This Property specifies inline Value to be displayed along with the label of the button. <br>
 *                  This property is bindable.
 * @param {string=} name
 *                  Name of the button widget.
 * @param {string=} type
 *                  Type of the button widget. <br>
 *                  valid value is: button/submit/reset <br>
 *                  Default value: `button`
 * @param {string=} hint
 *                  Title/hint for the button. <br>
 *                  This property is bindable.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the Button Widget. <br>
 * @param {string=} width
 *                  Width of the button.
 * @param {string=} height
 *                  Height of the button.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the button widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the button widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} animation
 *                  This property controls the animation of Button widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  possible values are "bounce", "flash", "pulse", "rubberBand", "shake" etc.
 * @param {string=} iconclass
 *                  CSS class of the icon.
 * @param {string=} iconurl
 *                  url of the icon.
 * @param {string=} iconwidth
 *                  width of the icon.
 *                  Default value: 16px
 * @param {string=} iconheight
 *                  height of the icon.
 *                  Default value: 16px
 * @param {string=} iconmargin
 *                  margin of the icon.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dblclick
 *                  Callback function which will be triggered when the widget is double clicked.
 * @param {string=} on-mouseenter
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 .
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <div>single click count: {{clickCount}}</div>
 *               <div>dbl click count: {{dblclickCount}}</div>
 *               <div>mouse enter count: {{mouseenterCount}}</div>
 *               <div>mouse leave count: {{mouseleaveCount}}</div>
 *               <div>focus count: {{focusCount}}</div>
 *               <div>blur count: {{blurCount}}</div>
 *               <wm-button
 *                   caption="{{caption}}"
 *                   hint="hint/title for button"
 *                   on-click="f('click');"
 *                   on-dblclick="f('dblclick');"
 *                   on-focus="f('focus');"
 *                   on-blur="f('blur');"
 *                   on-mouseenter="f('mouseenter');"
 *                   on-mouseleave="f('mouseleave')"
 *                   width="{{width}}"
 *                   height="{{height}}"
 *                   color="{{color}}"
 *                   iconclass="{{icon}}">
 *               </wm-button><br>
 *               <wm-composite>
 *                   <wm-label caption="caption:"></wm-label>
 *                   <wm-text scopedatavalue="caption"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="width:"></wm-label>
 *                   <wm-text scopedatavalue="width"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="height:"></wm-label>
 *                   <wm-text scopedatavalue="height"></wm-text>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="color:"></wm-label>
 *                   <wm-select scopedatavalue="color" scopedataset="colors"></wm-select>
 *               </wm-composite>
 *               <wm-composite>
 *                   <wm-label caption="icon:"></wm-label>
 *                   <wm-select scopedatavalue="icon" scopedataset="icons"></wm-select>
 *               </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.clickCount =
 *              $scope.dblclickCount =
 *              $scope.mouseenterCount =
 *              $scope.mouseleaveCount =
 *              $scope.focusCount =
 *              $scope.blurCount = 0;
 *
 *              $scope.width = "100px";
 *              $scope.height= "30px";
 *              $scope.caption = " Click Me! ";
 *              $scope.color = "crimson";
 *
 *              $scope.icons = ["ok", "star", "remove", "user", "random"];
 *              $scope.colors = ["crimson", "green", "orange", "red"];
 *
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */

