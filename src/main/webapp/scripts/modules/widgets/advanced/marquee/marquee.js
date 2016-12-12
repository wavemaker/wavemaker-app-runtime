/*global WM, */
/*Directive for Marquee */

WM.module('wm.widgets.advanced')
    .run(['$templateCache', 'CONSTANTS', function ($tc, CONSTANTS) {
        'use strict';
        var template;
        if (CONSTANTS.isStudioMode) {
            template = '<div class="app-marquee app-container" title="{{hint}}" init-widget apply-styles wmtransclude></div>';
        } else {
            template = '<marquee class="app-marquee app-container" title="{{hint}}" init-widget apply-styles wmtransclude onmouseover="this.stop();" onmouseout="this.start();"></marquee>';
        }
        $tc.put('template/widget/advanced/marquee/marquee.html', template);
    }])
    .directive('wmMarquee', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, $tc, WidgetUtilService, Utils) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.marquee', ['wm.base']);

            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'replace'   : true,
                'template'  : $tc.get('template/widget/advanced/marquee/marquee.html'),
                'link'      : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs) {
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmMarquee
 * @restrict E
 *
 * @description
 * The `wmMarquee` directive defines the marquee widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the marquee widget.
 * @param {string=} hint
 *                  Title/hint for the marquee. <br>
 *                  This is a bindable property.
 * @param {string=} caption
 *                  Content of the marquee. <br>
 *                  This is a bindable property.
 * @param {string=} width
 *                  Width of the marquee.
 * @param {string=} height
 *                  Height of the marquee.
 * @param {number=} scrolldelay
 *                  Defines how long to delay between each jump. <br>
 * @param {number=} scrollamount
 *                  Defines how far the animation jumps <br>
 * @param {string=} direction
 *                  This property will be used to set the direction of the marquee animation. <br>
 *                  Possible values are : 'up','down','left','right'. <br>
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the marquee widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @example
 <example module="wmCore">
     <file name="index.html">
         <div data-ng-controller="Ctrl" class="wm-app">
             <marquee direction="left" scrolldelay="25">This text scrolls infinite times</marquee>
             <marquee direction="left" scrollamount="15">This text scrolls with scrollamount specified</marquee>
             <marquee direction="up">This text scrolls up with direction property specified to be 'up'</marquee>
         </div>
     </file>
 </example>
 */