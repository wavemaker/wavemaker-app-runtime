/*global WM, document, _ */
/*jslint sub: true*/
/*Directive for popover */

WM.module('wm.widgets.basic')
    .directive('wmPopover', [
        'PropertiesFactory',
        'WidgetUtilService',
        'Utils',
        'CONSTANTS',
        '$rootScope',
        '$timeout',
        '$templateCache',
        '$compile',
        function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS, $rs, $timeout, $tc, $compile) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.popover', ['wm.base', 'wm.base.advancedformwidgets', 'wm.anchor']),
                notifyFor = {
                    'iconclass'       : true,
                    'iconurl'         : true,
                    'caption'         : true,
                    'iconposition'    : true,
                    'contentsource'   : true,
                    'popoverplacement': CONSTANTS.isRunMode
                },
                interaction = {
                    'click'   : {'outsideClick' : 'outsideClick'},
                    'hover'   : {'mouseenter'   : 'none'},
                    'default' : {'mouseenter'   : 'none', 'outsideClick': 'outsideClick'}
                };

            //Compile partial params by calling transclude fn
            function transcludeContent($el, slotContent) {

                if (slotContent.children.length && slotContent.children[0].tagName === 'WM-PARAM') {
                    var $nodes = WM.element(slotContent.children);
                    $el.append($nodes);
                    $compile($nodes)($el.scope());
                }
            }

            function propertyChangeHandler($is, $el, slotContent, key, nv) {
                var showIcon;
                switch (key) {
                    case 'iconposition':
                        $el.attr('icon-position', nv);
                        break;
                    case 'contentsource':
                        //check for 2 option inline || partial
                        if ($is.widgetid) {
                            if (nv === 'inline') {
                                $is.widgetProps.inlinecontent.show = true;
                                $is.widgetProps.content.show = false;
                                $is.widgetProps.onLoad.show  = false;
                            } else {
                                $is.widgetProps.onLoad.show  = true;
                                $is.widgetProps.content.show = true;
                                $is.widgetProps.inlinecontent.show = false;
                            }
                        }

                        transcludeContent($el, slotContent.cloneNode(true));
                        break;
                    case 'iconclass':
                        /*showing icon when iconurl is not set*/
                        $is.showicon = $is.iconclass !== '_none_' && nv !== '' && !$is.iconurl;
                        break;
                    case 'iconurl':
                        /*hiding icon when iconurl is set*/
                        /*showing icon when iconurl is not set*/
                        showIcon      = nv === '';
                        $is.showicon  = showIcon;
                        $is.showimage = !showIcon;
                        $is.iconsrc   = Utils.getImageUrl(nv);
                        break;
                    case 'caption':
                        Utils.setNodeContent($el.find('>span.anchor-caption'), nv);
                        break;
                    case 'popoverplacement':
                        if (nv) {
                            $is._popoverOptions.placement = 'auto ' + nv;
                        }
                        break;
                }
            }

            //Sets style block for popover to set height and width of popover
            function setStyleBlock($is) {
                //Add style block to set width and height of popover to avoid flickering effect
                var styleBlock  = document.head.getElementsByClassName('popover-styles'),
                    css         = '.' + $is._popoverOptions.customclass + '{height: ' + Utils.formatStyle($is.popoverheight, 'px') + '; width: ' + Utils.formatStyle($is.popoverwidth, 'px') + '}',
                    arrowCss;

                if (!$is.popoverarrow) {
                    arrowCss = '.' + $is._popoverOptions.customclass + ' .arrow {display: none !important;}';
                }
                if (!styleBlock.length) {
                    styleBlock = document.createElement('style');
                    styleBlock.setAttribute('type', 'text/css');
                    styleBlock.setAttribute('class', 'popover-styles');
                    styleBlock.textContent = css + (arrowCss || '');
                    document.head.appendChild(styleBlock);
                } else {
                    styleBlock[0].sheet.insertRule(css, 0);
                    if (arrowCss) {
                        styleBlock[0].sheet.insertRule(arrowCss, 0);
                    }
                }
            }

            //Hides the popover
            function setHideTrigger($is) {
                $timeout(function () {
                    if (!$is._popoverOptions.isPopoverActive) {
                        $is._popoverOptions.isOpen = false;
                    }
                }, 500, true);
            }

            /**
             * This function sets the focus to popover link when the popover is closed
             * @param scope - scope of the popover element
             * @param evt - keyboard event that is triggered
             */
            function setFocusToPopoverLink($is, evt) {
                $is._popoverOptions.isOpen = false;
                $is.$apply();
                $is.$element.focus();
                evt.preventDefault();
            }

            return {
                'restrict': 'E',
                'replace': true,
                'scope': {},
                'template': function (tElement, tAttrs) {
                    if (!tAttrs.hyperlink) {
                        tAttrs.href = "javascript:void(0)";
                    }
                    var template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/anchor.html', tElement, tAttrs));

                    //Required in studio mode also to set partial params which is based on pageContainer and wmtransclude directives
                    template.attr({
                        'page-container' : 'page-container'
                    });

                    if (CONSTANTS.isRunMode) {
                        //popover uses anchor template, so add below attributes on anchor markup to use uib-popover and also setting partial content
                        template.attr({
                            'popover-class'         : '{{"app-popover " + _popoverOptions.customclass + _popoverOptions.animationclass}}',
                            'popover-placement'     : '{{_popoverOptions.placement}}',
                            'popover-trigger'       : '_popoverOptions.trigger',
                            'popover-title'         : '{{title}}',
                            'popover-is-open'       : '_popoverOptions.isOpen',
                            'popover-append-to-body': 'true'
                        });

                        template.attr('uib-popover-template', '_popoverOptions.contenturl');

                        //If interaction is not click then attach ng-mouseleave event
                        if (_.includes(['default', 'hover'], tAttrs.interaction)) {
                            template.attr('ng-mouseleave', '_popoverOptions.setHideTrigger()');
                        }
                    }
                    return template[0].outerHTML;
                },
                'compile': function (tElement) {
                    return {
                        'pre': function ($is, $el, attrs) {
                            var trigger = attrs.interaction ? interaction[attrs.interaction] : interaction.click;
                            $is._popoverOptions = {'trigger': trigger, 'setHideTrigger': setHideTrigger.bind(undefined, $is), 'animationclass': ' animated ' + attrs.contentanimation};
                            $is.widgetProps     = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                            $is.$lazyLoad       = WM.noop;
                            $el.removeAttr('title');
                        },
                        'post': function ($is, $el, attrs) {
                            var isInlineContent = attrs.contentsource === 'inline',
                                popoverScope,
                                $popoverEl,
                                $popoverFirstEl,
                                _scope  = $el.scope(); //scope inherited from controller's scope

                            $is.appLocale = _scope.appLocale;
                            //Disable right click on the element, because there will be no link given for popover
                            Utils.disableRightClick($el);

                            if (CONSTANTS.isRunMode) {
                                $is._isFirstTime = true;
                                if (isInlineContent) {
                                    /* This is to make the "Variables" & "Widgets" available in the inline content
                                     * widgets it gets compiled with the popover isolate Scope
                                     * and "Variables", "Widgets", "item" won't be available in that scope. */
                                    Utils.defineProps($is, $el, {'item' : true, 'row' : true});
                                    $is._popoverOptions.customclass = 'popover_' + $is.$id + '_' + _.toLower($rs.activePageName);
                                    setStyleBlock($is);

                                    // create a template for the inline content
                                    var popoverTemplate = 'template/popover/inline-content/' + $is.$id + '/content.html';
                                    $tc.put(popoverTemplate, '<div>' + tElement.context.innerHTML + '</div>');
                                    $is._popoverOptions.contenturl = popoverTemplate;
                                }

                                popoverScope = $is.$$childHead;

                                if (popoverScope) {
                                    /*Watch on popover isOpen to compile the partial markup
                                     For first time when partial is not opened trigger the load to set partial content
                                     */
                                    popoverScope.$watch('isOpen', function (nv) {
                                        if (nv || $is._isFirstTime) {
                                            //Add custom mouseenter, leave events on popover
                                            $popoverEl = WM.element('.' + $is._popoverOptions.customclass);
                                            //Two buttons are added to the popover before and after the content so as to focus the content on opening the popover
                                            $('<button tabindex="0" class="popover-start"></button>').insertBefore('.popover-content');
                                            $('<button tabindex="0" class="popover-end"></button>').insertAfter('.popover-content');

                                            if ($popoverEl.length && _.includes(['default', 'hover'], $is.interaction)) {
                                                $popoverEl.on('mouseenter', function () {
                                                    $is._popoverOptions.isPopoverActive = true;
                                                    $rs.$safeApply($is);
                                                });
                                                $popoverEl.on('mouseleave', function () {
                                                    $is._popoverOptions.isPopoverActive = false;
                                                    $is._popoverOptions.setHideTrigger(true);
                                                });
                                            }

                                            if ($is._popoverOptions.customclass) {
                                                setStyleBlock($is);
                                            }

                                            if (!isInlineContent) {
                                                Utils.triggerFn($is.$lazyLoad);
                                            }

                                            $timeout(function () {
                                                //On Open trigger onShow event
                                                if (nv) {
                                                    $popoverFirstEl = $popoverEl.find('.popover-start');
                                                    $popoverFirstEl.focus();
                                                    $popoverEl.find('.popover-inner').on('keydown',function(evt){
                                                        //On ESC, the popover should be closed and focusing the link
                                                        if (Utils.getActionFromKey(evt) === 'ESC') {
                                                            setFocusToPopoverLink($is,evt);
                                                        }
                                                    });
                                                    $popoverFirstEl.on('keydown', function (evt) {
                                                        if (Utils.getActionFromKey(evt) === 'SHIFT+TAB') {
                                                            setFocusToPopoverLink($is,evt);
                                                        }
                                                    });
                                                    $popoverEl.find('.popover-end').on('keydown', function (evt) {
                                                        //the popover should be closed, when we move out of popover
                                                        if (Utils.getActionFromKey(evt) === 'TAB') {
                                                            setFocusToPopoverLink($is,evt);
                                                        }
                                                    });
                                                    if (!isInlineContent) {

                                                        if ($popoverEl.length) {
                                                            var $parEl = $popoverEl.find('> .popover-inner > .popover-content > div > section.app-partial'),
                                                                partialScope;

                                                            if ($parEl.length) {
                                                                partialScope  = $parEl.scope();
                                                                $is.Widgets   = partialScope.Widgets;
                                                                $is.Variables = partialScope.Variables;
                                                                $is.Actions   = partialScope.Actions;
                                                            }
                                                        }
                                                        Utils.triggerFn($is.onLoad, {'$isolateScope': $is});
                                                    }

                                                    Utils.triggerFn($is.onShow, {'$isolateScope' : $is});
                                                }
                                            });

                                            $is._isFirstTime = false;
                                        } else {
                                            Utils.triggerFn($is.onHide, {'$isolateScope' : $is});
                                        }
                                    });
                                }
                            }

                            WidgetUtilService.registerPropertyChangeListener(
                                propertyChangeHandler.bind(undefined, $is, $el, tElement.context),
                                $is,
                                notifyFor
                            );
                            WidgetUtilService.postWidgetCreate($is, $el, attrs);

                            if ($is.widgetid && isInlineContent) {
                                $is.inlinecontent = tElement.context.innerHTML;
                            }
                        }
                    };
                }
            };
        }
    ]);

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