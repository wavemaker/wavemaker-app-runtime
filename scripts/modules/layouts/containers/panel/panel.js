/*global WM*/
/*Directive for Panel*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/layout/container/panel.html',
                '<div page-container init-widget class="app-panel panel" ng-class="[helpClass]" data-ng-show="show" ' + $rootScope.getWidgetStyles('shell') + ' wm-navigable-element="true">' +
                    '<div class="panel-heading" data-ng-show="showheader">' +
                        '<h3 class="panel-title">' +
                            '<a href="javascript:void(0)" class="panel-toggle" data-ng-click="togglePanel()">' +
                                '<i class="app-icon panel-icon {{iconclass}}" data-ng-show="iconclass"></i>' +
                                '<span class="heading">{{title}}</span>' +
                                '<span class="description">{{description}}</span>' +
                            '</a>' +
                            '<div class="panel-actions">' +
                                '<wm-menu scopedataset="actions" iconname="cog" data-ng-if="actions" title="{{::$root.appLocale.LABEL_ACTIONS}}" on-select="onActionsclick({$item:$item})" datafield="label" displayfield="label"></wm-menu>' +
                                '<button class="app-icon panel-action glyphicon glyphicon-question-sign" title="{{::$root.appLocale.LABEL_HELP}}" data-ng-if="helptext" data-ng-click="toggleHelp()">&nbsp;</button>' +
                                '<button class="app-icon glyphicon panel-action" data-ng-if="collapsible" title="{{::$root.appLocale.LABEL_COLLAPSE}}/{{::$root.appLocale.LABEL_EXPAND}}" data-ng-class="expanded ? \'glyphicon-minus\': \'glyphicon-plus\'" data-ng-click="togglePanel($event);">&nbsp;</button>' +
                                '<button class="app-icon glyphicon panel-action glyphicon-remove" title="{{::$root.appLocale.LABEL_CLOSE}}" data-ng-if="closable" data-ng-click="closePanel();onClose({$event: $event, $scope: this})">&nbsp;</button>' +
                            '</div>' +
                        '</h3>' +
                    '</div>' +
                    '<div class="panel-content" data-ng-show="expanded" >' +
                        '<div class="panel-body" wmtransclude page-container-target data-ng-style="{height: height, overflow: overflow,paddingTop: paddingtop + paddingunit,paddingRight: paddingright + paddingunit,paddingLeft: paddingleft + paddingunit,paddingBottom: paddingbottom + paddingunit}" ></div>' +
                        '<aside class="panel-help-message"><h5 class="panel-help-header">{{::$root.appLocale.LABEL_HELP}}</h5><div class="panel-help-content" data-ng-bind-html="helptext"></div></aside>' +
                    '</div>' +
                    '</div>'
            );
    }])
    .directive('wmPanel', ['PropertiesFactory', 'WidgetUtilService', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.panel', ['wm.layouts', 'wm.containers', 'wm.base.events.touch']),
            notifyFor = {
                'height': true
            };
        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'height':
                if (newVal && CONSTANTS.isStudioMode) {
                    scope.minheight = 0;
                }
                break;
            }
        }
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': function (tElement, tAttrs) {
                var isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid'),
                    template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/container/panel.html', tElement, tAttrs));

                if (!isWidgetInsideCanvas) {
                    if (tAttrs.hasOwnProperty('onEnterkeypress')) {
                        template.attr('data-ng-keypress', 'onKeypress({$event: $event, $scope: this})');
                    }
                }
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = WM.copy(widgetProps);
                    },
                    'post': function (scope, element, attrs) {
                        if (scope.expanded === undefined) {
                            scope.expanded = true;
                        }
                        /* toggle the state of the panel */
                        scope.togglePanel = function ($event) {
                            if (scope.collapsible && CONSTANTS.isRunMode) {
                                if (scope.expanded) {
                                    scope.onCollapse && scope.onCollapse({$event: $event, $scope: this});
                                } else {
                                    scope.onExpand && scope.onExpand({$event: $event, $scope: this});
                                }
                                /* flip the active flag */
                                scope.expanded = !scope.expanded;
                            }
                        };
                        /* toggle the state of the panel */
                        scope.toggleHelp = function () {
                            if (scope.helptext && CONSTANTS.isRunMode) {
                                /* flip the active flag */
                                scope.helpClass = scope.helpClass ? null : 'show-help';
                            }
                        };
                        /* close the panel */
                        scope.closePanel = function () {
                            scope.show = false;
                        };

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        if (!scope.widgetid) {
                            scope.onKeypress = function (args) {
                                var action = Utils.getActionFromKey(args.$event);
                                if (action === 'ENTER') {
                                    scope.onEnterkeypress(args);
                                }
                            };
                        }
                    }
                };
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
 * @param {string=} name
 *                  Name of the panel widget.
 * @param {string=} width
 *                  Width of the panel.
 * @param {string=} height
 *                  height of the panel.
 * @param {string=} content
 *                  Sets content for the panel. <br>
 *                  It can be Inline content(incase of html widget) or Page's content(incase of page container widgets) will be included in the widget.<br>
 *                  Default value: `Inline Content`. <br>
 * @param {string=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the chart widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} horizontalalign
 *                  Align the content in the right panel to left/right/center.<br>
 * @param {string=} on-swipeup
 *                  Callback function for `swipeup` event.
 * @param {string=} on-swipedown
 *                  Callback function for `swipedown` event.
 * @param {string=} on-swiperight
 *                  Callback function for `swiperight` event.
 * @param {string=} on-swipeleft
 *                  Callback function for `swipeleft` event.
 * @param {string=} on-pinchin
 *                  Callback function for `pinchin` event.
 * @param {string=} on-pinchdown
 *                  Callback function for `pinchdown` event.
 *
 *
 * @example
 <example module="wmCore">
    <file name="index.html">
        <wm-panel>
            <wm-composite widget="text">
                <wm-label></wm-label>
                <wm-text></wm-text>
            </wm-composite>
            <wm-composite widget="textarea">
                <wm-label></wm-label>
                <wm-textarea></wm-textarea>
            </wm-composite>
        </wm-panel>
    </file>
 </example>
 */