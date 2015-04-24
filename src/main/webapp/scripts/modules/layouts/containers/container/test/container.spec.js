/*global describe, it, WM, beforeEach, expect, module, inject*/
/*global commonWidgetTests_verifyInitPropsInWidgetScope,  commonWidgetTests_verifyCommonProperties, commonWidgetTests_verifyStyles, commonWidgetTests_verifyBasicEvents commonWidgetTests_verifyTouchEvents*/

describe('Testing Widget: wm-container', function () {
    'use strict';

    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-container name="testContainer"' +
            'width="400" height="400" show="true" animation="bounce" horizontalalign="left" class="btn-container" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF"  whitespace="nowrap" ' +
            'color="#FFFFFF" backgroundrepeat="no-repeat" backgroundsize="300px, 300px" backgroundattachment="fixed" backgroundposition="0% 50%"  backgroundcolor="#00ff29" ' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderbottom="3" borderleft="3" borderright="3" borderunit="px"' +
            'paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" paddingunit="%"' +
            'margintop="3" marginleft="3" marginright="3" marginbottom="3" marginunit="px"' +
            'opacity="0.8" overflow="visible" cursor="nw-resize" zindex="100" visibility="visible" display="initial"' +
            'on-click="eventHandler()" on-dblclick="eventHandler()" on-mouseenter="eventHandler()" on-mouseleave="eventHandler()" ' +
            '></wm-container>';

    widget.PropertiesToBeExcluded = ["display", "hint", "animation", "tabindex", "badgevalue"];
    widget.type = 'wm-container'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.basicEvents = {
        'click': 'element',
        'dblclick': 'element',
        'mouseenter': 'element',
        'mouseleave': 'element'
    };

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);
    commonWidgetTests_verifyBasicEvents(widget);
    commonWidgetTests_verifyTouchEvents(widget);
});

