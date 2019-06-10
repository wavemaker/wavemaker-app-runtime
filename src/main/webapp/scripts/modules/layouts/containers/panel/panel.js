/*global WM, _*/
/*Directive for Panel*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($tc) {
        'use strict';
        $tc.put('template/layout/container/panel.html',
            '<div page-container init-widget listen-property="actions" class="app-panel panel" ng-class="[helpClass, {\'fullscreen\':fullscreen}]" apply-styles="shell" wm-navigable-element="true">' +
                '<div class="panel-heading" ng-class="helpClass" ng-if="toggleHeader()">' +
                    '<h3 class="panel-title">' +
                        '<a href="javascript:void(0)" class="panel-toggle" ng-click="expandCollapsePanel()">' +
                            '<div class="pull-left">' +
                                '<i class="app-icon panel-icon {{iconclass}}" ng-if="iconclass && !iconurl"></i>' +
                                '<img data-identifier="img" class="panel-image-icon" ng-src="{{iconsrc}}"  ng-if="iconurl" ng-style="{width:iconwidth ,height:iconheight, margin:iconmargin}"/>' +
                            '</div>' +
                            '<div class="pull-left">' +
                                '<div class="heading">{{title}}</div>' +
                                '<div class="description">{{subheading}}</div>' +
                             '</div>' +
                        '</a>' +
                        '<div class="panel-actions">' +
                            '<span ng-if="badgevalue" class="app-badge label label-{{badgetype}}">{{badgevalue}}</span>' +
                            '<wm-menu type="anchor" class="panel-action" scopedataset="actions" iconclass="wi wi-more-vert" ng-if="actions" title="{{::$root.appLocale.LABEL_ACTIONS}}" on-select="onActionsclick({$item:$item})" datafield="{{datafield}}" itemlabel="{{binditemlabel || itemlabel}}" menuposition="down,left" itemicon="{{binditemicon || itemicon}}" itemclass="{{binditemclass || itemclass}}" itemaction="{{binditemaction || itemaction}}" userrole="{{binduserrole || userrole}}" itemlink="{{binditemlink || itemlink}}" itemchildren="{{binditemchildren || itemchildren}}"></wm-menu>' +
                            '<button type="button" class="app-icon panel-action wi wi-question" title="{{::$root.appLocale.LABEL_HELP}}" ng-if="helptext" ng-click="toggleHelp()"></button>' +
                            '<button type="button" class="app-icon wi panel-action" ng-if="collapsible" title="{{::$root.appLocale.LABEL_COLLAPSE}}/{{::$root.appLocale.LABEL_EXPAND}}" ng-class="expanded ? \'wi-minus\': \'wi-plus\'" ng-click="expandCollapsePanel($event);"></button>' +
                            '<button type="button" class="app-icon wi panel-action" ng-if="enablefullscreen" title="{{::$root.appLocale.LABEL_FULLSCREEN}}/{{::$root.appLocale.LABEL_EXITFULLSCREEN}}" ng-class="fullscreen ? \'wi-fullscreen-exit\': \'wi-fullscreen\'" ng-click="toggleFullScreen($event);"></button>' +
                            '<button type="button" class="app-icon wi panel-action wi-close" title="{{::$root.appLocale.LABEL_CLOSE}}" ng-if="closable" ng-click="closePanel();onClose({$event: $event, $scope: this})"></button>' +
                        '</div>' +
                    '</h3>' +
                '</div>' +
                '<div class="panel-content" ng-show="expanded">' +
                    '<div class="panel-body" ng-class="helpClass" wm-smoothscroll="{{smoothscroll}}" wmtransclude page-container-target apply-styles="inner-shell"></div>' +
                    '<aside class="panel-help-message" ng-class="helpClass"><h5 class="panel-help-header">{{::$root.appLocale.LABEL_HELP}}</h5><div class="panel-help-content" ng-bind-html="helptext"></div></aside>' +
                '</div>' +
            '</div>'
            );
        $tc.put('template/layout/container/panel-footer.html', '<div class="app-panel-footer panel-footer clearfix" ng-show="footerExpanded" wmtransclude></div>');
    }])
    .directive('wmPanel', [
        'PropertiesFactory',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.panel', ['wm.base', 'wm.dynamicstyles', 'wm.base.events.touch', 'wm.menu.dataProps', 'wm.layouts.panel.defaults', 'wm.scrollablecontainer']),
                menuDataProps = _.keys(PropertiesFactory.getPropertiesOf('', ['wm.menu.dataProps'])),
                notifyFor   = {
                    'actions' : true,
                    'iconurl' : true,
                    'expanded': true
                };

            //Eval content height on toggle of full screen
            function toggleFullScreen(element, val, panelHeight) {
                var headerHeight = element.find('.panel-heading').outerHeight(),
                    $footerEl    = element.find('.panel-footer'),
                    $contentEl   = element.find('.panel-content'),
                    vwHeight     = WM.element(window).height(),
                    inlineHeight;

                if (val) {
                    inlineHeight = $footerEl.length ? vwHeight - ($footerEl.outerHeight() + headerHeight) : (vwHeight - headerHeight) ;
                } else {
                    inlineHeight = panelHeight || '';
                }

                $contentEl.css('height', inlineHeight);
            }

            //Toggles header show if any one of the below properties are set else hides panel heading
            function toggleHeader($is) {
                return $is.iconurl || $is.iconclass || $is.collapsible || $is.actions || $is.title || $is.subheading || $is.enablefullscreen;
            }

            function propertyChangeHandler(scope, key, newVal) {
                switch (key) {
                case 'actions':
                    scope.itemlabel = scope.itemlabel || scope.displayfield;
                    WidgetUtilService.updateWidgetProps(scope, !!scope.bindactions, menuDataProps);
                    break;
                case 'iconurl':
                    scope.iconsrc = Utils.getImageUrl(newVal);
                    break;
                case 'expanded':
                    scope.expanded = newVal;
                    break;
                }
            }
            return {
                'restrict'  : 'E',
                'replace'   : true,
                'scope'     : {},
                'transclude': true,
                'template'  : function (tElement, tAttrs) {
                    var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                        template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/container/panel.html', tElement, tAttrs));

                    if (!isWidgetInsideCanvas) {
                        if (tAttrs.hasOwnProperty('onEnterkeypress')) {
                            template.attr('ng-keypress', 'onKeypress({$event: $event, $scope: this})');
                        }
                    }
                    return template[0].outerHTML;
                },
                'controller': function ($scope) {
                    this.registerFooter = function (footer) {
                        this.footer = footer;
                    };

                    this.isExpanded = function () {
                        return $scope.expanded;
                    };
                },
                'compile': function ($tEl) {
                    return {
                        'pre': function ($is, $el, attrs) {

                            $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                            //handle the backward compatibility for description attributes
                            if (attrs.description && !attrs.subheading) {
                                $is.subheading = attrs.subheading = attrs.description;
                                WM.element($tEl.context).attr('subheading', $is.subheading);
                                delete attrs.description;
                            }

                            if (!attrs.widgetid && attrs.collapsible === 'true' && attrs.content && attrs.expanded === 'false') {
                                $is.$lazyLoad = _.noop;
                            }
                            $el.removeAttr('title');
                        },
                        'post': function ($is, $el, attrs, panelCtrl) {
                            if ($is.expanded === undefined) {
                                $is.expanded = true;
                            }

                            /* Expand Collapse the panel */
                            $is.expandCollapsePanel = function ($event) {
                                if ($is.collapsible) {
                                    if ($is.expanded) {
                                        if ($is.onCollapse) {
                                            $is.onCollapse({$event: $event, $isolateScope: this});
                                        }
                                    } else {
                                        if ($is.onExpand) {
                                            $is.onExpand({$event: $event, $isolateScope: this});
                                        }
                                        //Re-plot the widgets inside panel on expand
                                        $el.find('.ng-isolate-scope')
                                            .each(function () {
                                                Utils.triggerFn(WM.element(this).isolateScope().redraw);
                                            });
                                    }

                                    Utils.triggerFn($is.$lazyLoad);

                                    /* flip the active flag */
                                    $is.expanded = !$is.expanded;
                                }
                            };
                            /* Toggle FullScreen the panel */
                            $is.toggleFullScreen = function ($event) {
                                if ($is.enablefullscreen) {
                                    if ($is.fullscreen) {
                                        if ($is.onExitfullscreen) {
                                            $is.onExitfullscreen({$event: $event, $scope: this});
                                        }
                                    } else {
                                        if ($is.onFullscreen) {
                                            $is.onFullscreen({$event: $event, $scope: this});
                                        }
                                    }
                                    //Re-plot the chart in case if it is inside panel
                                    $el.find('.ng-isolate-scope')
                                        .each(function () {
                                            Utils.triggerFn(WM.element(this).isolateScope().redraw);
                                    });
                                    /* flip the active flag */
                                    $is.fullscreen = !$is.fullscreen;
                                }
                                //Eval content height on toggle of fullscreen
                                toggleFullScreen($el, $is.fullscreen, $is.height);
                            };

                            /* toggle the state of the panel */
                            $is.toggleHelp = function () {
                                /* flip the active flag */
                                $is.helpClass = $is.helpClass ? null : 'show-help';
                            };
                            /* Close the panel */
                            $is.closePanel = function () {
                                $is.show = false;
                            };

                            $is.toggleHeader = toggleHeader.bind(undefined, $is);
                            /* register the property change handler */
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is), $is, notifyFor);
                            WidgetUtilService.postWidgetCreate($is, $el, attrs);
                            WidgetUtilService.updateWidgetProps($is, !!$is.bindactions, menuDataProps);

                            if (!$is.widgetid) {
                                $is.onKeypress = function (args) {
                                    var action = Utils.getActionFromKey(args.$event);
                                    if (action === 'ENTER') {
                                        $is.onEnterkeypress(args);
                                    }
                                };
                            }

                            if (panelCtrl.footer) {
                                $el.append(panelCtrl.footer);
                            }
                        }
                    };
                }
            };
    }])
    .directive('wmPanelFooter', ['$templateCache', function ($tc) {
        'use strict';
        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'transclude': true,
            'require'   : '^wmPanel',
            'template'  : $tc.get('template/layout/container/panel-footer.html'),
            'link'      : function ($is, $el, attrs, panelCtrl) {
                panelCtrl.registerFooter($el);

                Object.defineProperty($is, 'footerExpanded', {
                    get: panelCtrl.isExpanded
                });
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmPanel
 * @restrict E
 * @element ANY
 * @description
 * The 'wmPanel' directive defines a panel in the page.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} title
 *                  Title of the panel widget. This property is a bindable property.
 * @param {string=} name
 *                  Name of the panel widget.
 * @param {string=} description
 *                  Description for the panel widget. This property is a bindable property.
 * @param {string=} width
 *                  Width of the panel widget.
 * @param {string=} height
 *                  Height of the panel widget.
 * @param {boolean=} showheader
 *                  Show/Hide header of the panel widget.
 * @param {string=} content
 *                  Sets content for the panel widget. <br>
 *                  Page's content will be included in the widget.<br>
 *                  Default value: `Inline Content`. <br>
 * @param {string=} helptext
 *                  To show help text for the panel widget. Help panel on the right is shown only when help text is given. This property is a bindable property.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the panel widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} collapsible
 *                  To enable control for collapsing/expanding the panel widget.
 * @param {boolean=} enablefullscreen
 *                  To enable fullscreen view for the panel widget
 * @param {boolean=} closable
 *                  To apply close button in the panel widget.
 * @param {string=} actions
 *                  To set the actions for the panel widget. This property is a bindable property.
 * @param {boolean=} expanded
 *                  To set the default state for the panel widget, whether it is expanded or collapsed.
 * @param {string=} animation
 *                  This property controls the animation of the panel widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, etc.
 * @param {string=} iconclass
 *                  To define class of icon applied to the button for the panel widget. This property is a bindable property.
 * @param {string=} horizontalalign
 *                  Align the content in the panel to left/right/center.<br>
 * @param {string=} mouseover
 *                  Callback function which will be triggered when the mouse moves over the panel.
 * @param {string=} mouseout
 *                  Callback function which will be triggered when the mouse away from the panel.
 * @param {string=} mouseenter
 *                  Callback function which will be triggered when the mouse enters inside the panel.
 * @param {string=} mouseleave
 *                  Callback function which will be triggered when the mouse leaves the panel.
 * @param {string=} enterkeypress
 *                  Callback function which will be triggered when the user hits the ENTER/Return while the focus is on this editor.
 * @param {string=} swipeup
 *                  Callback function which will be triggered when the panel is swiped up.
 * @param {string=} swipedown
 *                  Callback function which will be triggered when the panel is swiped down.
 * @param {string=} swiperight
 *                  Callback function which will be triggered when the panel is swiped right.
 * @param {string=} swipeleft
 *                  Callback function which will be triggered when the panel is swiped left.
 * @param {string=} pinchin
 *                  Callback function which will be triggered when the panel is pinched in.
 * @param {string=} pinchout
 *                  Callback function which will be triggered when the panel is pinched out.
 * @param {string=} on-close
 *                  Callback function which will be triggered when the panel is closed.
 * @param {string=} on-expand
 *                  Callback function which will be triggered when the panel is expanded.
 * @param {string=} on-collapse
 *                  Callback function which will be triggered when the panel is collapsed.
 * @param {string=} on-actions-click
 *                  Callback function which will be triggered when the action icon is clicked.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-panel class="panel-default" collapsible="true"  enablefullscreen="true" showheader="true" width="400" height="200" backgroundcolor="#dad8d9" title="Personal Info">
                    <wm-panel-footer>
                        <wm-container horizontalalign="right">
                            <wm-button class="btn-secondary" caption="Cancel" type="button"></wm-button>
                            <wm-button class="btn-primary" caption="Update" type="button"></wm-button>
                        </wm-container>
                    </wm-panel-footer>
                    <wm-composite>
                        <wm-label class="col-md-3" caption="First Name:"></wm-label>
                        <wm-container class="col-md-9">
                            <wm-text></wm-text>
                        </wm-container>
                    </wm-composite>
                    <wm-composite>
                        <wm-label class="col-md-3" caption="Last Name:"></wm-label>
                        <wm-container class="col-md-9">
                            <wm-text></wm-text>
                        </wm-container>
                    </wm-composite>
                </wm-panel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */
