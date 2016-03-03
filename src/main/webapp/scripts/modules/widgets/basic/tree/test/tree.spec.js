/*global describe, it, WM, beforeEach, expect, module, inject*/
/*Testing for a tree*/
describe("Testing Basic Widget: tree", function () {
    "use strict";
    var $compile,
        $rootScope,
        $unCompiled,
        $element,
        iScope,
        widget = {},
        markup =
            '<wm-tree name="Tree name" width="300px" height="300px" ' +
            'treeicons="plus-minus"  nodelabel="label"  nodeicon="icon" class="btn-primary" ' +
            'nodechildren="children" ' +
            'dataset="node1, node2, node3, node4"' +
            'fontsize="20" fontfamily="Segoe UI" color="#0000FF" fontweight="bold" whitespace="nowrap" ' +
            'fontstyle="italic" textdecoration="underline" backgroundcolor="#00ff29" ' +
            'backgroundimage="http://www.google.com/doodle4google/images/splashes/featured.png"' +
            'backgroundrepeat="repeat" backgroundposition="left" backgroundsize="200px, 200px" backgroundattachment="fixed"' +
            'bordercolor="#d92953" borderstyle="solid" bordertop="3" borderleft="3" borderright="3" ' +
            'borderbottom="3" paddingtop="3" paddingleft="3" paddingright="3" paddingbottom="3" margintop="3" ' +
            'marginleft="3" marginright="3" marginbottom="3" opacity="0.8" cursor="nw-resize" zindex="100" ' +
            'visibility="visible" display="inline"' +
            'show="true"' +
            '></wm-tree>';

    widget.type = 'wm-tree'; // type of the widget
    widget.widgetSelector = 'element'; // perform common widget tests on this element
    widget.$unCompiled = WM.element(markup);

    commonWidgetTests_verifyInitPropsInWidgetScope(widget);
    commonWidgetTests_verifyCommonProperties(widget);
    commonWidgetTests_verifyStyles(widget);

    /*Custom Test Suite for wm-tree widget.*/
    describe('Executing widget specific tests: ' + widget.type, function () {
        beforeEach(function () {
            var modulesToBeInjected = [
                'wm.common',
                'wm.utils',
                'wm.widgets',
                'wm.layouts',
                'wm.layouts.containers',
                'ngRoute',
                'wm.variables',
                'wm.plugins.database',
                'wm.plugins.webServices',
                'angular-gestures'
            ];

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

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
            //check for the treeicons property
            it("should change the treeicons as put in property panel", function () {
                expect($element.attr('treeicons')).toBe(iScope.treeicons);
            });

            //check for the treeicons property
            it("should change the nodelabel as put in property panel", function () {
                iScope.nodelabel = "label";
                iScope.$apply();
                expect($element.attr('nodelabel')).toBe(iScope.nodelabel);
            });
            //check for the nodeicon property
            it("should change the nodeicon as put in property panel", function () {
                iScope.nodeicon = "icon";
                iScope.$apply();
                expect($element.attr('nodeicon')).toBe(iScope.nodeicon);
            });
            //check for the nodechildren property
            it("should change the nodechildren as put in property panel", function () {
                iScope.nodechildren = "children";
                iScope.$apply();
                expect($element.attr('nodechildren')).toBe(iScope.nodechildren);
            });

            ////TODO: check for the construction of the element from the dataset
            //it("should check the construction of the element from the dataset", function () {
            //    iScope.nodes = [{
            //        "label": "item1",
            //        "icon": "wi wi-euro-symbol"
            //    }, {
            //        "label": "item2",
            //        "icon": "wi wi-euro-symbol"
            //    }];
            //    iScope.$apply();
            //    var items = iScope.dataset.split(', ');
            //    _.forEach(items, function (item, index) {
            //        var counter = index + 1;
            //        expect($element.find('li:nth-child('+ counter +')').text()).toMatch(items[index]);
            //    });
            //});

            ////TODO: check for the nodeicon, nodelabel, nodechildren with an object
        });
    });
});
