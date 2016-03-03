/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a menu*/
describe("Testing Form Widget: menu", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-menu caption="Menu caption" name="menu name" ' +
            'dropposition="down" width="150px" height="40px" ' +
            'scopedataset="MenuItems" dataset="Menu Item 1, Menu Item 2, Menu Item 3"' +
            'show="true" iconclass="wi-file-upload" ' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" textalign="center" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            '></wm-menu>';

    widget.type = 'wm-menu'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);
    widget.PropertiesToBeExcluded = ["scopedataset", "animation", "badgevalue"];
    widget.innerElement = "button";

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-menu widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {

            /*Include the required modules.*/
            module('wm.common');
            module('wm.utils');
            module('wm.widgets');
            module('ngRoute');

            inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $element = $compile(widget.$unCompiled.clone())($rootScope);

                // if the widgetSelector is other than `element`,
                // find the widget and its isolateScope using widgetSelector
                if (widget.widgetSelector && widget.widgetSelector !== 'element') {
                    $element = $element.find(widget.widgetSelector).first();
                }
                iScope = $element.isolateScope();
                iScope.$apply();
            });
        });

        describe("properties", function () {
            //check for the dropposition property
            it("should check the dropposition put in property panel", function () {
                iScope.dropposition = "up";
                iScope.$apply();
                expect($element.hasClass('dropup')).toMatch(true);
            });

            //check for the iconclass property
            it("should check the iconclass put in property panel", function () {
                iScope.iconclass = "wi-file-upload";
                iScope.$apply();
                expect($element.find('i').hasClass(iScope.iconclass)).toMatch(true);
            });

            //check for the dataset property
            it("should check the dataset put in property panel", function () {
                iScope.dataset = "Menu Item 1, Menu Item 2, Menu Item 3";
                iScope.$apply();
                expect($element.attr('dataset')).toMatch(iScope.dataset);
            });

            //check for the construction of the element from the dataset
            it("should check the construction of the element from the dataset", function () {
                iScope.dataset = "Menu Item 1, Menu Item 2, Menu Item 3";
                iScope.$apply();
                var items = iScope.dataset.split(', ');
                _.forEach(items, function (item, index) {
                    var counter = index + 1;
                    expect($element.find('li:nth-child('+ counter +')').text()).toMatch(items[index]);
                });
            });

            //check for the scopedataset property
            it("should check the scopedataset put in property panel", function () {
                iScope.MenuItems = "Menu Item 1, Menu Item 2, Menu Item 3";
                iScope.$apply();
                var items = iScope.MenuItems.split(', ');
                _.forEach(items, function (item, index) {
                    var counter = index + 1;
                    expect($element.find('li:nth-child('+ counter +')').text()).toMatch(items[index]);
                });
            });

            //check for the construction of the child items from the dataset
            it("should check the construction of the child items from the dataset", function () {
                iScope.dataset = [{
                        "label": "item1",
                        "icon": "wi wi-euro-symbol"
                    }, {
                        "label": "item2",
                        "icon": "wi wi-euro-symbol"
                    }, {
                        "label": "item3",
                        "icon": "wi wi-euro-symbol"
                    }, {
                        "label": "item4",
                        "icon": "wi wi-euro-symbol",
                        "children": [{
                            "label": "sub-menu-item1",
                            "icon": "wi wi-euro-symbol"
                        }, {
                            "label": "sub-menu-item2",
                            "icon": "wi wi-euro-symbol"
                        }]
                    }
                ];
                iScope.$apply();
                var items = ["item1", "item2", "item3", "item4"];
                _.forEach(items, function (item, index) {
                    var counter = index + 1;
                    expect($element.find('[items="menuItems"] li:nth-child('+ counter +')').text()).toMatch(items[index]);
                });

                var childItems = ["sub-menu-item1","sub-menu-item2",];
                _.forEach(childItems, function (item, index) {
                    var counter = index + 1;
                    expect($element.find('[items="item.children"] li:nth-child('+ counter +')').text()).toMatch(items[index]);
                });

            });

        });
    });
});
