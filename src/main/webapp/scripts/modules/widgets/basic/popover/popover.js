/*global WM, document, _ */
/*jslint sub: true*/
/*Directive for popover */

WM.module('wm.widgets.basic')
    .directive('wmPopover', ['PropertiesFactory', 'WidgetUtilService', 'Utils', 'CONSTANTS', '$rootScope', '$timeout', function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS, $rs, $timeout) {
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
                'click': {'outsideClick' : 'outsideClick'},
                'hover': {'mouseenter': 'none'},
                'default' : {'mouseenter': 'none', 'outsideClick': 'outsideClick'}
            };

        function propertyChangeHandler($is, $el, transFn, key, nv) {
            switch (key) {
                case 'iconposition':
                    $el.attr('icon-position', nv);
                    break;
                case 'contentsource':
                    //check for 2 option inline || partial
                    if (nv === 'inline') {
                        $is.widgetProps.inlinecontent.show = true;
                        $is.widgetProps.content.show = false;
                    } else {
                        $is.widgetProps.content.show = true;
                        $is.widgetProps.inlinecontent.show = false;
                    }

                    transcludeContent($is, $el, transFn, nv);
                    break;
                case 'iconclass':
                    /*showing icon when iconurl is not set*/
                    $is.showicon = $is.iconclass !== '_none_' && nv !== '' && !$is.iconurl;
                    break;
                case 'iconurl':
                    /*hiding icon when iconurl is set*/
                    /*showing icon when iconurl is not set*/
                    var showIcon  = nv === '';
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

        //Compile partial params by calling transclude fn
        function transcludeContent($is, $el, transFn, nv) {

            transFn($el.scope(), function (clone) {

                if (clone.length) {
                    //If contentsource is inline set inline content
                    if (nv === 'inline') {
                        $is.inlinecontent = $is._popoverOptions.content = WM.element(clone)[0].innerHTML;
                    } else if (clone[0].tagName === 'WM-PARAM') {
                        //If element is param append to $el
                        $el.append(clone);
                    }
                }
            });
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function (tElement, tAttrs) {
                var template = WM.element(WidgetUtilService.getPreparedTemplate('template/widget/anchor.html', tElement, tAttrs));

                //Required in studio mode also to set partial params which is based on pageContainer and wmtransclude directives
                template.attr({
                    'page-container' : 'page-container'
                });

                if (CONSTANTS.isRunMode) {
                    //popover uses anchor template, so add below attributes on anchor markup to use uib-popover and also setting partial content
                    template.attr({
                        'popover-class'         : '{{_popoverOptions.customclass}}',
                        'popover-placement'     : '{{_popoverOptions.placement}}',
                        'popover-trigger'       : '_popoverOptions.trigger',
                        'popover-title'         : '{{title}}',
                        'popover-is-open'       : '_popoverOptions.isOpen',
                        'popover-append-to-body': 'true'
                    });

                    if (tAttrs.contentsource === 'inline') {
                        template.attr('uib-popover', '{{_popoverOptions.content}}');
                    } else {
                        template.attr('uib-popover-template', '_popoverOptions.contenturl');
                    }

                    //If interaction is not click then attach ng-mouseleave event
                    if (tAttrs.interaction !== 'click') {
                        template.attr('ng-mouseleave', '_popoverOptions.setHideTrigger()');
                    }
                }
                return template[0].outerHTML;
            },
            'compile': function (tElement) {
                return {
                    'pre': function ($is, $el, attrs) {
                        var trigger = attrs.interaction ? interaction[attrs.interaction] : interaction.default;
                        $is._popoverOptions = {'trigger': trigger, 'setHideTrigger': setHideTrigger.bind(undefined, $is)};
                        $is.widgetProps     = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $is.$lazyLoad       = WM.noop;
                    },
                    'post': function ($is, $el, attrs, nullCtrl, transcludeFn) {
                        var isInlineContent = attrs.contentsource === 'inline',
                            popoverScope,
                            $popoverEl;

                        $is.appLocale = $el.scope().appLocale;

                        if (CONSTANTS.isRunMode) {
                            $is._isFirstTime = true;
                            if (isInlineContent) {
                                $is._popoverOptions.customclass = 'popover_' + $is.$id + '_' + _.toLower($rs.activePageName);
                                setStyleBlock($is);
                            }

                            popoverScope = $is.$$childHead;

                            if (popoverScope) {
                                /*Watch on popover isOpen to compile the partial markup
                                 For first time when partial is not opened trigger the load to set partial content
                                 */
                                popoverScope.$watch('isOpen', function (nv) {
                                    if (nv || $is._isFirstTime) {
                                        //On Open trigger onShow event
                                        if (nv) {

                                            if (!isInlineContent) {
                                                Utils.triggerFn($is.onLoad, {'$isolateScope': $is});
                                            }

                                            Utils.triggerFn($is.onShow, {'$isolateScope' : $is});
                                        }
                                        //Add custom mouseenter, leave events on popover
                                        $popoverEl = WM.element('.' + $is._popoverOptions.customclass);

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

                                        $is._isFirstTime = false;
                                    } else {
                                        Utils.triggerFn($is.onHide, {'$isolateScope' : $is});
                                    }
                                });
                            }
                        }

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el, transcludeFn), $is, notifyFor);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
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