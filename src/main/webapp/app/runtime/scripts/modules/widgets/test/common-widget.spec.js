/*global describe, it, WM, beforeEach, expect, module, inject, _, parseInt, document, Hammer*/


/* util function which returns true when the key is a boolean attribute */
function isBooleanAttr(key) {
    'use strict';

    return key === 'readonly' || key === 'autofocus' || key === 'disabled' || key === 'startchecked' || key === 'multiple' ||
        key === 'selected' || key === 'required' || key === 'controls' || key === 'autoplay' || key === 'loop' || key === 'muted';
}

/* util function to convert rgb color code to hex */
function rgbToHex(rgbColor) {
    'use strict';

    rgbColor = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ('0' + parseInt(x, 10).toString(16)).slice(-2);
    }
    return '#' + hex(rgbColor[1]) + hex(rgbColor[2]) + hex(rgbColor[3]);
}

/* util function which returns true if the given string starts with a key */
function stringStartsWith(str, startsWith, ignoreCase) {
    'use strict';
    if (!str) {
        return false;
    }

    var regEx = new RegExp('^' + startsWith, ignoreCase ? "i" : []);

    return regEx.test(str);
}

/* angular modules to be injected in beforeEach phase */
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

/* This function verifies whether the attributes specified in the markup are properly updated in the isolateScope of the widget or not*/
function commonWidgetTests_verifyInitPropsInWidgetScope(widget) {
    'use strict';

    describe('verify initial properties in widgets scope : ' + widget.type, function () {

        var $compile,
            $rootScope,
            $element,
            iScope,
            widgetProps;

        beforeEach(function () {

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

            //inject the dependents
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
                widgetProps = iScope.widgetProps;
            });
        });

        // iterate through all the attributes specified in the markup and verify them against corresponding iScope properties
        _.forEach(widget.$unCompiled[0].attributes, function (attr) {
            var attrName = attr.name,
                attrValue = attr.value,
                processedAttrValue = attrValue;

            // ignore the event related attributes and attributes having hyphen(-) in them(custom attrs)
            if (stringStartsWith(attr.name, 'on-') || attr.name.indexOf('-') !== -1) {
                return;
            }

            it('should have ' + attrName + ' value as ' + processedAttrValue, function () {
                var attrProps = widgetProps[attrName] || {};

                // convert the type of the attr.value and compare with its corresponding iScope property
                if (attrProps.type === 'boolean') {
                    if (isBooleanAttr(attrName)) {
                        processedAttrValue = attrValue === attrName || attrValue === true || attrValue === 'true';
                    } else {
                        processedAttrValue = attrValue === true || attrValue === 'true';
                    }
                } else if (attrProps.type === 'number') {
                    processedAttrValue = +attrValue;
                }

                expect(iScope[attrName]).toBe(processedAttrValue);
            });

        });
    });
}

/* This function tests for common properties(name, class, show, hint) if they are defined in widgetProps  */
function commonWidgetTests_verifyCommonProperties(widget) {
    'use strict';

    describe('verify common properties of widget : ' + widget.type, function () {

        var $compile,
            $rootScope,
            $element,
            iScope,
            widgetProps;

        beforeEach(function () {

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

            //inject the dependents
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
                widgetProps = iScope.widgetProps;
            });
        });

        // check for name property
        it('should have given name', function () {
            if (!widgetProps.name) {
                return;
            }
            expect($element.attr('name')).toBe(iScope.name);

            iScope.name = 'updated';
            expect($element.attr('name')).toBe(iScope.name);
        });

        // check for class property
        it('should have given class', function () {
            if (!widgetProps.class) {
                return;
            }
            var old = iScope.class;
            if (old) {
                expect($element.hasClass(old)).toBe(true);
            }

            iScope.class = 'updated';
            if (old) {
                expect($element.hasClass(old)).toBe(false);
            }

            expect($element.hasClass(iScope.class)).toBe(true);
        });

        // check for show property
        it('should have proper display property based on given show value', function () {
            if (!widgetProps.show) {
                return;
            }
            var isShowDefined = widget.$unCompiled[0].attributes.hasOwnProperty('show'),
                initShowValue = isShowDefined ? iScope.show : true;

            expect($element.hasClass('ng-hide')).not.toBe(initShowValue);

            iScope.show = true;
            iScope.$apply();
            expect($element.hasClass('ng-hide')).toBe(false);

            iScope.show = false;
            iScope.$apply();
            expect($element.hasClass('ng-hide')).toBe(true);
        });

        // check for hint property
        it('should have given hint', function () {
            if (!widgetProps.hint) {
                return;
            }
            expect($element.attr('title')).toBe(iScope.hint);

            iScope.hint = 'updated';
            iScope.$apply();
            expect($element.attr('title')).toBe(iScope.hint);
        });
    });
}

/* This function tests for style properties applicable for a widget */
function commonWidgetTests_verifyStyles(widget) {
    'use strict';

    describe('verify styles of widget : ' + widget.type, function () {

        var $compile,
            $rootScope,
            $element,
            iScope,
            widgetProps;

        beforeEach(function () {

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

            //inject the dependents
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
                widgetProps = iScope.widgetProps;
            });
        });

        // check for width and height properties
        _.forEach(['width', 'height'], function (cssName) {
            var propName = cssName.toLowerCase();
            it('should have given ' + cssName, function () {
                if (!widgetProps[propName]) {
                    return;
                }
                var initValue = +(widget.$unCompiled.attr(propName));

                if (!isNaN(initValue)) {
                    expect($element.css(cssName)).toBe(initValue + 'px');
                }

                iScope[propName] = '200';
                iScope.$apply();
                expect($element.css(cssName)).toBe('200px');
            });
        });

        // check for fontSize property
        it('should have given fontSize', function () {
            var cssName = 'fontSize',
                propName = cssName.toLowerCase(),
                fontUnit = widget.$unCompiled.attr('fontunit') || 'px',
                initValue = +(widget.$unCompiled.attr(propName));

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue + fontUnit);
            }

            iScope[propName] = '30';
            iScope.$apply();
            expect($element.css(cssName)).toBe('30' + fontUnit);
        });

        // check for fontFamily property
        it('should have given fontFamily', function () {
            var cssName = 'fontFamily',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe("'" + initValue + "'");
            }

            iScope[propName] = 'arial';
            iScope.$apply();
            expect($element.css(cssName)).toBe('arial');
        });

        // check for color property
        it('should have given color', function () {
            var cssName = 'color',
                propName = 'color',
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect(rgbToHex($element.css(cssName)).toLowerCase()).toBe(initValue.toLowerCase());
            }

            iScope[propName] = '#FF0000';
            iScope.$apply();
            expect(rgbToHex($element.css(cssName))).toBe(iScope[propName].toLowerCase());
        });

        // check for fontWeight property
        it('should have give fontWeight', function () {
            var cssName = 'fontWeight',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 'lighter';
            iScope.$apply();
            expect($element.css(cssName)).toBe('lighter');
        });

        // check for fontStyle property
        it('should have given fontStyle', function () {
            var cssName = 'fontStyle',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 'italic';
            iScope.$apply();
            expect($element.css(cssName)).toBe('italic');
        });

        // check for textDecoration property
        it('should have given textDecoration', function () {
            var cssName = 'textDecoration',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 'underline';
            iScope.$apply();
            expect($element.css(cssName)).toBe('underline');
        });

        // check for textAlign property
        it('should have given textAlign', function () {
            var cssName = 'textAlign',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 'center';
            iScope.$apply();
            expect($element.css(cssName)).toBe('center');
        });

        // check for whiteSpace property
        it('should have given whiteSpace', function () {
            var cssName = 'whiteSpace',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 'nowrap';
            iScope.$apply();
            expect($element.css(cssName)).toBe('nowrap');
        });

        // check for backgroundColor property
        it('should have given backgroundColor', function () {
            var cssName = 'backgroundColor',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect(rgbToHex($element.css(cssName)).toLowerCase()).toBe(initValue.toLowerCase());
            }
            iScope[propName] = '#FF0000';
            iScope.$apply();
            expect(rgbToHex($element.css(cssName)).toLowerCase()).toBe(iScope[propName].toLowerCase());
        });

        // check for borderColor property
        it('should have given borderColor', function () {
            var cssName = 'borderColor',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect(rgbToHex($element.css(cssName)).toLowerCase()).toBe(initValue.toLowerCase());
            }
            iScope[propName] = '#FF0000';
            iScope.$apply();
            expect(rgbToHex($element.css(cssName))).toBe(iScope[propName].toLowerCase());
        });

        // checkfor borderTop, borderRight, borderBottom, borderLeft properties
        _.forEach(['borderTop', 'borderRight', 'borderBottom', 'borderLeft'], function (cssName) {
            var propName = cssName.toLowerCase();
            cssName = cssName + 'Width';

            it('should have given ' + cssName, function () {
                if (!widgetProps[propName]) {
                    return;
                }

                var borderUnit = widget.$unCompiled.attr('borderunit') || 'px',
                    initValue = +(widget.$unCompiled.attr(propName));

                if (initValue) {
                    expect($element.css(cssName)).toBe(initValue + borderUnit);
                }

                iScope[propName] = '200';
                iScope.$apply();
                expect($element.css(cssName)).toBe('200' + borderUnit);
            });
        });

        // check for paddingTop, paddingRight, paddingBottom, paddingLeft properties
        _.forEach(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'], function (cssName) {
            var propName = cssName.toLowerCase();

            it('should have given ' + cssName, function () {
                if (!widgetProps[propName]) {
                    return;
                }
                var paddingUnit = widget.$unCompiled.attr('paddingunit') || 'px',
                    initValue = +(widget.$unCompiled.attr(propName));

                if (initValue) {
                    expect($element.css(cssName)).toBe(initValue + paddingUnit);
                }

                iScope[propName] = '200';
                iScope.$apply();
                expect($element.css(cssName)).toBe('200' + paddingUnit);
            });
        });

        // check for marginTop, marginRight, marginBottom, marginLeft properties
        _.forEach(['marginTop', 'marginRight', 'marginBottom', 'marginLeft'], function (cssName) {
            var propName = cssName.toLowerCase();

            it('should have given ' + cssName, function () {
                if (!widgetProps[propName]) {
                    return;
                }
                var marginUnit = widget.$unCompiled.attr('marginunit') || 'px',
                    initValue = +(widget.$unCompiled.attr(propName));

                if (initValue) {
                    expect($element.css(cssName)).toBe(initValue + marginUnit);
                }

                iScope[propName] = '200';
                iScope.$apply();
                expect($element.css(cssName)).toBe('200' + marginUnit);
            });
        });

        // check for opacity property
        it('should have given opacity', function () {
            var cssName = 'opacity',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 0.5;
            iScope.$apply();
            expect($element.css(cssName)).toBe('0.5');
        });

        // check for cursor property
        it('should have given cursor', function () {
            var cssName = 'cursor',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 'pointer';
            iScope.$apply();
            expect($element.css(cssName)).toBe('pointer');
        });

        // check for zIndex property
        it('should have given zIndex', function () {
            var cssName = 'zIndex',
                propName = cssName.toLowerCase(),
                initValue = widget.$unCompiled.attr(propName);

            if (!widgetProps[propName]) {
                return;
            }

            if (initValue) {
                expect($element.css(cssName)).toBe(initValue);
            }
            iScope[propName] = 100;
            iScope.$apply();
            expect($element.css(cssName)).toBe('100');
        });
    });
}

/* This function tests for basic events(focus, blur, click, dblclick, mouseenter, mouseleave) defined for a widget */
function commonWidgetTests_verifyBasicEvents(widget) {
    'use strict';

    var eventsMap = {
        'on-click': 'click',
        'on-dblclick': 'dblclick',
        'on-mouseenter': 'mouseenter',
        'on-mouseleave': 'mouseleave',
        'on-focus': 'focus',
        'on-blur': 'blur'
    };

    describe('verify events for : ' + widget.type, function () {

        var $compile,
            $rootScope,
            $element,
            iScope,
            counter = -1,
            eventsToBeVerified = [];

        beforeEach(function () {

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

            //inject the dependents
            inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;

                $rootScope.eventHandler = function () {
                    counter++;
                };

                $element = $compile(widget.$unCompiled.clone())($rootScope);

                // if the widgetSelector is other than `element`,
                // find the widget and its isolateScope using widgetSelector
                if (widget.widgetSelector && widget.widgetSelector !== 'element') {
                    $element = $element.find(widget.widgetSelector).first();
                }
                iScope = $element.isolateScope();
                iScope.disabled = false;
                iScope.$apply();
            });
        });

        // find the list of basic events to be verified
        _.forEach(widget.$unCompiled[0].attributes, function (attr) {
            if (stringStartsWith(attr.name, 'on-')) {

                if (eventsMap[attr.name]) {
                    eventsToBeVerified.push(eventsMap[attr.name]);
                }
            }
        });

        // trigger the events on element's target
        _.forEach(eventsToBeVerified, function (eventName, index) {
            it('should execute ' + eventName + ' handler', function () {
                var targetSelector = widget.basicEvents[eventName],
                    target = targetSelector === 'element' ? $element : $element.find(targetSelector),
                    evt;

                if (eventName === 'focus' || eventName === 'blur') {
                    evt = document.createEvent('UIEvents');
                    evt.initEvent(eventName);
                    target[0].dispatchEvent(evt);
                } else {
                    target.trigger(eventName);
                }

                expect(counter).toBe(index);
            });

        });
    });
}

/* This function tests for touch events(swipeup, swipedown, swipeleft, swiperight, pinchin, pinchout) defined for a widget */
function commonWidgetTests_verifyTouchEvents(widget) {
    'use strict';

    var eventsMap = {
        'on-swipeup': 'swipeup',
        'on-swipedown': 'swipedown',
        'on-swipeleft': 'swipeleft',
        'on-swiperight': 'swiperight',
        'on-pinchin': 'pinchin',
        'on-pinchout': 'pinchout'
    };

    describe('verify touch events for : ' + widget.type, function () {

        var $compile,
            $rootScope,
            $element,
            $timeout,
            iScope,
            counter = -1,
            eventsToBeVerified = [];

        beforeEach(function () {

            //inject the modules
            modulesToBeInjected.forEach(function (moduleName) {
                module(moduleName);
            });

            //inject the dependents
            inject(function (_$compile_, _$rootScope_, _$timeout_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $timeout = _$timeout_;

                $rootScope.eventHandler = function () {
                    counter++;
                };

                $element = $compile(widget.$unCompiled.clone())($rootScope);
                // if the widgetSelector is other than `element`,
                // find the widget and its isolateScope using widgetSelector
                if (widget.widgetSelector && widget.widgetSelector !== 'element') {
                    $element = $element.find(widget.widgetSelector).first();
                }
                iScope = $element.isolateScope();
                iScope.disabled = false;
                iScope.$apply();
            });
        });

        // find the events to be verified
        _.forEach(widget.$unCompiled[0].attributes, function (attr) {
            if (stringStartsWith(attr.name, 'on-')) {
                if (eventsMap[attr.name]) {
                    eventsToBeVerified.push(eventsMap[attr.name]);
                }
            }
        });

        // trigger the events on element's target
        _.forEach(eventsToBeVerified, function (eventName, index) {
            it('should execute ' + eventName + ' handler', function () {
                var targetSelector = widget.swipeEvents[eventName],
                    target = targetSelector === 'element' ? $element : $element.find(targetSelector);

                (new Hammer(target[0])).trigger(eventName, {});

                $timeout.flush();

                expect(counter).toBe(index);
            });
        });
    });
}

/*Testing the common properties and events for dialogs*/
function verifyCommonDialogPropertiesAndEvents(type) {
    "use strict";

    describe("Executing custom test suite for " + type + " dialog", function () {
        var $compile,
            $rootScope,
            $unCompiled,
            iScope,
            widget = {},
            widgetConfig,
            element,
            dialogHeader,
            icon,
            defaultIcons = {
                'alert' : "warning-sign",
                'confirm' : "ok",
                'page' : "file",
                'iframe' : "globe",
                'login' : "log-in"
            };
        beforeEach(function () {
            widget.type = 'wm-' + type  + 'dialog';
            widget.unCompiled = '<wm-' + type + 'dialog></wm-' + type + 'dialog>';
            /*Include the required modules.*/
            module("wm.common");
            module("wm.utils");
            module('wm.widgets');
            module('wm.widgets.base');
            module('wm.variables');
            module(function ($provide) {
                $provide.value("$routeParams", {"project_name": "testProject"});
            });

            inject(function (_$compile_, _$rootScope_, WidgetProperties) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $unCompiled = WM.element(widget.unCompiled);
                widgetConfig = WidgetProperties.getConfig('wm-' + type + 'dialog');
                element = $compile(widgetConfig.template)($rootScope);
                $rootScope.preferences = {};
                $rootScope.$digest();
                /*Mocking the preferences object and setting blockNonSecureContent to true since it is unavailable*/
                $rootScope.preferences.blockNonSecureContent = true;
                iScope = element.find('.app-dialog.app-' + type + '-dialog').isolateScope();
            });
        });

        /*Test Suite for testing the common properties to dialog widget.*/
        describe("Testing properties specific to " + type + " dialog", function () {
            it("should change name to Dialog name ", function () {
                iScope.name =  type  + "Dialog Name";
                iScope.$apply();
                expect(element.find('.app-dialog').attr('name')).toBe(type + 'Dialog Name');
            });
            it("should change title to Dialog Title ", function () {
                iScope.title = "Dialog Title";
                iScope.$apply();
                dialogHeader = element.find('.app-dialog-header');
                expect(dialogHeader.attr('caption')).toBe('Dialog Title');
            });
            it('should have proper display property based on given show value', function () {
                expect(element.find('.app-dialog').hasClass('ng-hide')).toBe(false);
                iScope.show = false;
                iScope.$apply();
                expect(element.find('.app-dialog').hasClass('ng-hide')).toBe(true);
            });
            it("should have a default icon based on the dialog type", function () {
                icon = element.find('.app-dialog-header .app-dialog-title i');
                expect(icon.attr('class')).toMatch(defaultIcons[type]);
            });
            it("should change the icon name to earphone ", function () {
                iScope.iconname = "earphone";
                iScope.$apply();
                icon = element.find('.app-dialog-header .app-dialog-title i');
                expect(icon.attr('class')).toMatch('earphone');
            });
            it("should change the icon width to 10px ", function () {
                iScope.iconwidth = "10px";
                iScope.$apply();
                icon = element.find('.app-dialog-header .app-dialog-title i');
                expect(icon.width()).toBe(10);
            });
            it("should change the icon height to 20px ", function () {
                iScope.iconheight = "20px";
                iScope.$apply();
                icon = element.find('.app-dialog-header .app-dialog-title i');
                expect(icon.height()).toBe(20);
            });
            it("should change the icon margin to 15px ", function () {
                iScope.iconmargin = "15px";
                iScope.$apply();
                icon = element.find('.app-dialog-header .app-dialog-title i');
                expect(icon.css('margin')).toBe('15px');
            });
        });
        /*Test Suite for testing the common properties to dialog widget.*/
        describe("Testing events specific to " + type + " dialog", function () {
            it("test the onOk event", function () {
                var testVariable = 1;
                element.onOk = function () {
                    testVariable = 2;
                };
                iScope.$apply();
                element.onOk();
                expect(testVariable).toBe(2);
            });
            it("test the onClose event", function () {
                var testVariable = 3;
                element.onClose = function () {
                    testVariable = 4;
                };
                iScope.$apply();
                element.onClose();
                expect(testVariable).toBe(4);
            });
        });
    });
}