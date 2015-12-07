/*global WM, */
/*Directive for anchor */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/anchor.html',
                '<a data-identifier="anchor" class="app-anchor" init-widget data-ng-show="show" title="{{hint}}" apply-styles role="button" accesskey="{{shortcutkey}}">' +
                    '<img data-identifier="img" class="anchor-image-icon" data-ng-src="{{iconsrc}}" data-ng-if="showimage" data-ng-style="{width:iconwidth ,height:iconheight, margin:iconmargin}"/>' +
                    '<i class="app-icon {{iconclass}}" data-ng-style="{width:iconwidth, height:iconheight, margin:iconmargin}" data-ng-if="showicon"></i> ' +
                    '<span class="anchor-caption"></span>' +
                    '<span data-ng-if="badgevalue" class="badge pull-right">{{badgevalue}}</span>' +
                '</a>'
            );

    }]).directive('wmAnchor', ['PropertiesFactory', 'WidgetUtilService', '$sce', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, $sce, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.anchor', ['wm.base', 'wm.base.editors', 'wm.base.events', 'wm.base.events.focus']),
            notifyFor = {
                'iconname': true,
                'iconurl': true,
                'target': true,
                'hyperlink': true,
                'caption': true,
                'iconposition': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            switch (key) {
            case 'target':
                attrs.$set('target', newVal);
                break;
            case 'iconposition':
                element.attr('icon-position', newVal);
                break;
            case 'hyperlink':
                attrs.$set('href', newVal);
                /* if hyperlink starts with 'www.' append 'http://' in the beginning */
                if (CONSTANTS.isRunMode && Utils.stringStartsWith(newVal, 'www.')) {
                    scope.hyperlink =  'http://' + newVal;
                }
                break;
            case 'iconclass':
                /*showing icon when iconurl is not set*/
                scope.showicon = scope.iconclass !== '_none_' && newVal !== '' && !scope.iconurl;
                break;
            case 'iconurl':
                /*hiding icon when iconurl is set*/
                /*showing icon when iconurl is not set*/
                var showIcon = newVal === '';
                scope.showicon = showIcon;
                scope.showimage = !showIcon;
                scope.iconsrc = Utils.getImageUrl(newVal);
                break;
            case 'caption':
                if (WM.isObject(newVal)) {
                    element.children('.anchor-caption').text(JSON.stringify(newVal));
                } else {
                    element.children('.anchor-caption').html(($sce.trustAs($sce.HTML, newVal.toString()).toString()));
                }
                break;
            }

        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/anchor.html'),
            'compile': function (tElement) {
                return {
                    'pre': function (scope, element, attrs) {
                        //@Deprecated iconname; use iconclass instead
                        if (!attrs.iconclass && attrs.iconname) {
                            WM.element(tElement.context).attr('iconclass', 'glyphicon glyphicon-' + attrs.iconname);
                            attrs.iconclass = 'glyphicon glyphicon-' + attrs.iconname;
                        }
                        scope.showicon = !scope.iconurl;
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        if (!attrs.hyperlink && !attrs.href) {
                            element.attr('href', 'javascript:void(0)');
                        }
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmAnchor
 * @restrict E
 *
 * @description
 * The `wmAnchor` directive defines the anchor widget.
 * It can be dragged and moved in the canvas.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $sce
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the anchor.
 * @param {string=} hint
 *                  Title/hint for the anchor. <br>
 *                  This is a bindable property.
 * @param {string=} caption
 *                  Content of the anchor. <br>
 *                  This is a bindable property.
 * @param {string=} badgevalue
 *                  Value to be displayed as badge for the anchor. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the anchor.
 * @param {string=} target
 *                  Target property of the anchor. <br>
 *                  Possible values are: <br>
 *                  `_blank` : Opens the linked document in a new window. <br>
 *                  `_self`  : Opens the linked document in the same frame as it was clicked (this is default). <br>
 *                  `_parent`: Opens the linked document in the parent frameset. <br>
 *                  `_top`   : Opens the linked document in the full body of the window. <br>
 * @param {string=} width
 *                  Width of the anchor.
 * @param {string=} height
 *                  Height of the anchor.
 * @param {string=} hyperlink
 *                  href of the anchor. <br>
 *                  This is a bindable property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the anchor on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the anchor. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, `etc`.
 * @param {string=} iconclass
 *                  CSS class for the icon. <br>
 *                  This is a bindable property.
 * @param {string=} iconurl
 *                  url of the icon. <br>
 *                  This is a bindable property.
 * @param {string=} iconwidth
 *                  Width of the icon. <br>
 *                  Default value: 16px
 * @param {string=} iconheight
 *                  Height of the icon.  <br>
 *                  Default value: 16px
 * @param {string=} iconmargin
 *                  Margin of the icon.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dblclick
 *                  Callback function which will be triggered when the widget is double-clicked.
 * @param {string=} on-mouseenter.
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @param {string=} on-focus
 *                  Callback function which will be triggered when the widget gets focused.
 * @param {string=} on-blur
 *                  Callback function which will be triggered when the widget loses focus.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-anchor
                    caption="google"
                    target="{{target}}"
                    hyperlink="http://www.google.com"
                    hint="go to google.com"
                    iconclass="{{icon}}"
                    on-mouseenter="f('mouseenter');"
                    on-mouseleave="f('mouseleave')">
                </wm-anchor><br>
                <wm-composite>
                   <wm-label caption="target:"></wm-label>
                   <wm-select scopedataset="targets" scopedatavalue="target"></wm-select>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="icon:"></wm-label>
                    <wm-select scopedatavalue="icon" scopedataset="icons"></wm-select>
                </wm-composite>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.icons = ["ok", "star", "remove", "user", "random"];
                $scope.targets = ["_blank", "_self", "_parent", "_top"];
                $scope.f = function (eventtype) {
                    console.log("inside function f for event", eventtype);
                }
            }
        </file>
    </example>
 */
