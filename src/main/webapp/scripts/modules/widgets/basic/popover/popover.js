/*global WM, document, _ */
/*jslint sub: true*/
/*Directive for popover */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/basic/popover.html',
                '<div class="app-popover popover invisible {{class}} {{popoverplacement}}" ng-style="{width : popoverwidth, height : popoverheight}">' +
                    '<div class="arrow" ng-class="{\'arrow-color\': title}" ng-show="popoverarrow"></div>' +
                    '<h3 class="popover-title" ng-if="title">{{title}}</h3>' +
                    '<wm-container class="popover-content" content="{{content}}"></wm-container>' +
                '</div>');
    }])
    .directive('wmPopover', ['PropertiesFactory', 'WidgetUtilService', '$sce', 'Utils', 'CONSTANTS', '$rootScope', '$compile', '$templateCache', '$timeout', function (PropertiesFactory, WidgetUtilService, $sce, Utils, CONSTANTS, $rootScope, $compile, $templateCache, $timeout) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.popover', ['wm.base', 'wm.base.advancedformwidgets', 'wm.anchor']),
            notifyFor = {
                'iconclass'     : true,
                'iconurl'       : true,
                'caption'       : true,
                'iconposition'  : true,
                'contentsource' : CONSTANTS.isStudioMode
            },
            popoverProperties = PropertiesFactory.getPropertiesOf('wm.popover');

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case 'iconposition':
                element.attr('icon-position', newVal);
                break;
            case 'contentsource':
                //check for 2 option inline || partial
                if (newVal === 'inline') {
                    scope.widgetProps.inlinecontent.show = true;
                    scope.widgetProps.content.show = false;
                } else {
                    scope.widgetProps.content.show = true;
                    scope.widgetProps.inlinecontent.show = false;
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
                Utils.setNodeContent(element.find('>span.anchor-caption'), newVal);
                break;
            }
        }

        /* returns element dimensions' absolute value*/
        function getEleDimensions(ele) {
            return {
                'width' : Math.abs(ele.outerWidth()),
                'height' : Math.abs(ele.outerHeight())
            };
        }
        /**
         * Object to listen for an event on an element's parent but not on the element itself.
         *
         * @param parent - element whose events have to be listened.
         * @param child  - element whose events have to be skipped.
         * @constructor
         */
        function ParentEventListener(parent, child, link) {
            var processEvent = true,
                objectId = 'parenteventlistener' + new Date().getTime();
            function getEventName(event) {
                return event + '.' + objectId;
            }
            /* add callback to invoke when the event occurs */
            this.on = function (event, callBack) {
                var eventName = getEventName(event);
                child.off(eventName).on(eventName, function (event) {
                    processEvent = false;
                });
                $timeout(function () {
                    parent.off(eventName).on(eventName, function (event) {
                        if (processEvent) {
                            Utils.triggerFn(callBack, event);
                        }
                        processEvent = true;
                    });
                });

            };
            /* turns off event listening */
            this.off = function (event) {
                var eventName = getEventName(event);
                processEvent = false;
                child.off(eventName);
                parent.off(eventName);
            };
        }
        /**
         * Computes popover position based on the available port area and placement preference.
         * @param hook - element, in relative to which the popover has to be placed.
         * @param popoverEle - the popver element for which the position has to be computed.
         * @param placement - [left, right, top, bottom] in reference to hook.
         * @returns {{left: *, top: *}}
         */
        function computePopoverPosition(hook, popoverEle, placement) {
            var popoverDims = getEleDimensions(popoverEle),
                arrow = popoverEle.find('.arrow'),
                arrowDims = {'width' : 0, height : 0},
                documentDims = getEleDimensions(WM.element(document)),
                targetDims = getEleDimensions(hook),
                targetPosition = hook.offset(),
                tipOffset = {
                    'width': -arrowDims.width / 2,
                    'height': -arrowDims.height / 2
                },
                pagePosition = WM.element(popoverEle).offsetParent().offset(),
                popoverPosition = {
                    'left' : targetPosition.left + tipOffset.width - pagePosition.left,
                    'top'  : targetPosition.top + tipOffset.height - pagePosition.top
                };
            if (placement === 'left' || placement === 'right') {
                if (placement === 'left') {
                    popoverPosition.left += (-1 * (popoverDims.width + arrowDims.width));
                } else {
                    popoverPosition.left += targetDims.width + arrowDims.width;
                }
                if (targetPosition.top + popoverDims.height <= documentDims.height) {
                    arrow.addClass('top');
                } else {
                    popoverPosition.top = targetPosition.top + targetDims.height - popoverDims.height;
                    arrow.addClass('bottom');
                }
            } else if (placement === 'top' || placement === 'bottom') {
                if (placement === 'top') {
                    popoverPosition.top += (-1 * popoverDims.height);
                } else {
                    popoverPosition.top += targetDims.height + arrowDims.height;
                }
                if (targetPosition.left + popoverDims.width <= documentDims.width) {
                    arrow.addClass('left');
                } else {
                    popoverPosition.left = targetPosition.left + targetDims.width - popoverDims.width;
                    arrow.addClass('right');
                }
            }
            return popoverPosition;
        }

        /**
         * Constructs popover inheriting from the controller scope
         * @param element - target element to which the popiver has to be attached.
         * @returns a scope to use for popover
         */
        function createPopoverScope(element) {
            var scope = element.isolateScope(),
                popoverScope = element.scope().$new(true);
            _.forEach(_.keys(popoverProperties), function (k) {
                popoverScope[k] = scope[k];
            });
            return popoverScope;
        }
        /**
         * Transfers focus to the first focusable child of the given element.
         * Following are focusable elements.
         * 1) Element with tabIndex
         * 2) input or button or select
         * @param element
         */
        function shiftFocusToChild(element) {
            var selectors = ['[tabindex]:first', 'button:first,input:first,select:first'];
            _.forEach(selectors, function (selector) {
                var e = element.find(selector);
                if (e.length > 0) {
                    e.focus();
                    return false;
                }
            });
        }

        /**
         * Constructs Popover element and adds it to the top-level page.
         *
         * @param element element to which the popover has to be hooked.
         * @param onOpen  callback to invoke when popover is visible.
         * @param onClose callback to invoke when popover closes automatically.
         * @constructor
         */
        function Popover(element, transcludeFn, isInlineContent, onOpen, onClose, onLoad) {
            var scope        = element.isolateScope(),
                popoverScope = createPopoverScope(element),
                page         = $rootScope.$activePageEl,
                popoverEle   = $compile($templateCache.get('template/widget/basic/popover.html'))(popoverScope),
                $content,
                pageClickListener;
            if (popoverScope.popoverautoclose) {
                WM.element('.app-popover').each(function () {
                    var _scope = WM.element(this).data('linkScope');
                    if (_scope) {
                        _scope.togglePopover({});
                    }
                });
            }
            page.append(popoverEle);
            popoverEle.show();
            popoverEle.data('linkScope', scope);
            //check if inline content
            if (isInlineContent) {
                try {
                    transcludeFn(element.scope(), function (clone) {
                        popoverEle.find('> .popover-content').append(clone);
                    });
                } catch (e) {
                    $content = '<div class="well-sm"><h4 >Error loading content</h4></div>';
                    popoverEle.find('> .popover-content').empty().append($content);
                }

                Utils.triggerFn(onOpen);
            } else {
                /**
                 * When the page content is ready, copy the widgets and variables to the scope.
                 */
                popoverScope.$on('on-pagecontainer-ready', function ($event) {
                    $event.stopPropagation();
                    var includedPageScope = popoverEle.find('[data-ng-controller]:first').scope();
                    scope.Widgets = includedPageScope.Widgets;
                    scope.Variables = includedPageScope.Variables;
                    Utils.triggerFn(onLoad);
                    Utils.triggerFn(onOpen);
                });
            }
            /**
             * Do calculations after the current digest cycle.
             * This is to make sure that all the popover scope values are applied on to the dom.
             */
            $timeout(function () {
                popoverEle.css(computePopoverPosition(element, popoverEle, popoverScope.popoverplacement));
                popoverEle.removeClass('invisible');
                shiftFocusToChild(popoverEle);
            });
            if (popoverScope.popoverautoclose) {
                pageClickListener = new ParentEventListener(WM.element(window), popoverEle, element);
                pageClickListener.on('click', function (event) {
                    Utils.triggerFn(onClose, event);
                });
            }
            /**
             * Does the clean up.
             */
            this.destroy = function () {
                if (pageClickListener) { pageClickListener.off('click'); }
                popoverScope.$destroy();
                popoverEle.remove();
                popoverScope = popoverEle = undefined;
                delete scope['Widgets'];
                delete scope['Variables'];
            };
        }
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': CONSTANTS.isRunMode,
            'template': function () {
                var template = WM.element($templateCache.get('template/widget/anchor.html'));
                if (CONSTANTS.isRunMode) {
                    template.attr('ng-click', 'togglePopover($event)');
                    template.attr('ng-keydown', 'togglePopover($event)');
                }
                template.addClass('app-popover-anchor');
                return template[0].outerHTML;
            },
            'compile': function (tElement) {
                return {
                    'pre': function (scope, $el, attrs) {
                        scope.showicon = !scope.iconurl;

                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function (scope, element, attrs, nullCtrl, transcludeFn) {
                        var popover,
                            isInlineContent = (attrs.contentsource === 'inline'),
                            onOpen = function (event) {
                                Utils.triggerFn(scope.onShow, {'$event': event, '$scope' : scope});
                            },
                            onClose = function (event) {
                                scope.togglePopover(event);
                            },
                            onLoad = function () {
                                Utils.triggerFn(scope.onLoad, {'$isolateScope' : scope});
                            };
                        if (CONSTANTS.isRunMode) {
                            scope.togglePopover = function (event) {
                                if (event.keyCode && event.keyCode !== 13) {
                                    //If it is a key event and Enter key, then process it.
                                    return;
                                }
                                if (popover) {
                                    //destroy the existing popover
                                    popover.destroy();
                                    popover = undefined;
                                    element.removeClass('app-popover-open');
                                    //Set the focus basck to anchor element
                                    element.focus();
                                    Utils.triggerFn(scope.onHide, {'$event': event, '$scope': scope});
                                } else {
                                    popover = new Popover(element, transcludeFn, isInlineContent, onOpen.bind(undefined, event), onClose, onLoad);
                                    element.addClass('app-popover-open');
                                }
                                return false;
                            };

                        } else {
                            //if content is provided as an attribute, give it preference
                            scope.inlinecontent = tElement.context.innerHTML;
                        }

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmPopover
 * @restrict E
 *
 * @description
 * The `wmPopover` directive defines the popover widget.
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
 *                  Name of the popover.
 * @param {string=} hint
 *                  Title/hint for the anchor. <br>
 *                  This is a bindable property.
 * @param {string=} caption
 *                  Content of the popover. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the popover.
 * @param {string=} content
 *                  This property specifies the content of the popover widget. <br>
 *                  Possible values are `Inline content` and `Page's content`. <br>
 *                  Page's content values are `login`, `footer`, `header`, `lefnav`, `rightnav`, and `topnav`.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the popover on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} contentsource
 *                  Content source for the popover. <br>
 *                  Possible values are `partial` and `inline`. <br>
 *                  Default value: `partial`.
 * @param {string=} title
 *                  Title for the popover.
 * @param {string=} popoverplacement
 *                  This property defines the position of the popover <br>
 *                  Possible values are 'top', 'bottom', 'left', and 'right'. <br>
 *                  Default value: `bottom`.
 * @param {boolean=} popoverarrow
 *                  If set true, then a arrow pointer will be shown. <br>
 *                  Default value: `true`.
 * @param {boolean=} popoverautoclose
 *                  If set true, then a click on the document (except popover content) will automatically close the popover. <br>
 *                  Default value: `true`.
 * @param {string=} animation
 *                  This property controls the animation of the popover widget. <br>
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
 *                  Height of the icon. <br>
 *                  Default value: 16px
 * @param {string=} iconmargin
 *                  Margin of the icon.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <br>
                <wm-page ng-controller="WM.noop">
                    <wm-popover caption="Click here to see the popover including the content from a partial"
                        content="dropdownMenu"
                        popoverwidth="300"
                        popoverheight="200"
                        popoverautoclose="true"
                        popoverplacement="bottom"
                        popoverarrow="true"
                        title="Popover Title"
                        contentsource="partial">
                    </wm-popover>

                    <br/><br/>
                    <wm-popover caption="Click here to see the inline content popover"
                        popoverwidth="300"
                        popoverheight="200"
                        popoverautoclose="true"
                        popoverplacement="bottom"
                        popoverarrow="true"
                        title="Popover Title"
                        contentsource="inline">
                        <wm-label caption="I am inline popover"></wm-label>
                    </wm-popover>
                </wm-page>

            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
        <file name="style.css">
            .wm-app, .app-page {
                position: static !important; // these are required only for the documentation example
            }
        </file>
    </example>
 */