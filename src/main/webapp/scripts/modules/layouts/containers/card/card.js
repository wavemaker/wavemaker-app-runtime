/*global WM, _*/
/*Directive for Card*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/container/card.html',
            '<div init-widget class="app-card card app-panel" listen-property="actions" apply-styles="shell">' +
                '<div class="app-card-header panel-heading" ng-show="title || subheading || iconclass || iconurl || actions">' +
                    '<div class="app-card-avatar" ng-show="iconclass || iconurl">' +
                        '<i class="app-icon {{iconclass}}" ng-if="iconclass && !iconurl"></i>' +
                        '<wm-picture shape="circle" picturesource="{{iconurl}}" ng-if="iconurl"></wm-picture>' +
                    '</div>' +
                    '<div class="app-card-header-text">' +
                        '<h4 class="card-heading">{{title}}</h4>' +
                        '<h5 class="card-subheading text-muted">{{subheading}}</h5>' +
                    '</div>' +
                    '<div class="panel-actions">' +
                        '<wm-menu type="anchor" class="panel-action" scopedataset="actions" iconclass="wi wi-more-vert" ng-if="actions" title="{{::$root.appLocale.LABEL_ACTIONS}}" datafield="{{datafield}}" itemlabel="{{binditemlabel || itemlabel}}" menuposition="down,left" itemicon="{{binditemicon || itemicon}}" itemlink="{{binditemlink || itemlink}}" itemchildren="{{binditemchildren || itemchildren}}"></wm-menu>' +
                    '</div>' +
                '</div>' +
                '<div class="app-card-image" ng-if="bindpicturesource || picturesource" ng-style="{\'height\':imageheight}">' +
                    '<wm-picture class="card-image" picturesource="{{picturesource}}"></wm-picture>' +
                '</div>' +
                '<div ng-transclude="content" apply-styles="inner-shell"></div>' +
                '<div ng-transclude="actions"></div>' +
                '<div ng-transclude="footer"></div>' +
            '</div>'
            );
        $templateCache.put('template/layout/container/card-content.html', '<div init-widget page-container class="app-card-content card-body card-block"><div page-container-target apply-styles="container" wmtransclude></div></div>');
        $templateCache.put('template/layout/container/card-footer.html',  '<div apply-styles="container" init-widget wmtransclude  class="app-card-footer text-muted card-footer"></div>');
        $templateCache.put('template/layout/container/card-actions.html', '<div apply-styles="container" class="app-card-actions" init-widget wmtransclude ></div>');
    }])
    .directive('wmCard', ['PropertiesFactory', 'WidgetUtilService', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.card', ['wm.base', 'wm.base.events', 'wm.menu.dataProps']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': {
                'content': '?wmCardContent',
                'footer' : '?wmCardFooter',
                'actions': '?wmCardActions'
            },
            'template': function (tElement, tAttrs) {
                var template = WM.element(WidgetUtilService.getPreparedTemplate('template/layout/container/card.html', tElement, tAttrs));
                return template[0].outerHTML;
            },
            'controller': ['$scope', function ($s) {
                this.register = function (name, ele) {
                    $s[name] = ele.isolateScope();
                };
            }],
            'link': {
                'pre': function (iScope, $el, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    //To support backward compatibility for old projects
                    if (scope.title === undefined && !scope.bindtitle) {
                        scope.title = scope.heading || scope.bindheading;
                    }

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }])
    .directive('wmCardContent', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.cardcontent', ['wm.base', 'wm.layouts']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/card-content.html'),
                'replace'   : true,
                'require'   : '^wmCard',
                'link'   : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        controller.register('content', $el);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmCardActions', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.cardactions', ['wm.base']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/card-actions.html'),
                'replace'   : true,
                'require'   : '^wmCard',
                'link'   : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        controller.register('action', $el);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmCardFooter', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.cardfooter', ['wm.base']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layout/container/card-footer.html'),
                'replace'   : true,
                'require'   : '^wmCard',
                'link'   : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        controller.register('footer', $el);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmCard
 * @restrict E
 * @element ANY
 * @description
 * The 'wmCard' directive defines a card in the page.
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 * @requires CONSTANTS
 *
 * @param {string=} title
 *                  Title of the card widget. This property is a bindable property.
 * @param {string=} subheading
 *                  Sub Heading of the card widget. This property is a bindable property.
 * @param {string=} picturesource
 *                  picturesource of the card widget. This property is a bindable property.
 * @param {string=} picturetitle
 *                  picturetitle on to the picture of card widget. This property is a bindable property.
 * @param {string=} name
 *                  Name of the card widget.
 * @param {string=} width
 *                  Width of the card widget.
 * @param {string=} height
 *                  Height of the card widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the card widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} animation
 *                  This property controls the animation of the card widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, etc.
 * @param {string=} iconclass
 *                  To define class of icon applied to the button for the card widget. This property is a bindable property.
 * @param {string=} horizontalalign
 *                  Align the content in the card to left/right/center.<br>
 * @param {string=} mouseover
 *                  Callback function which will be triggered when the mouse moves over the card.
 * @param {string=} mouseout
 *                  Callback function which will be triggered when the mouse away from the card.
 * @param {string=} mouseenter
 *                  Callback function which will be triggered when the mouse enters inside the card.
 * @param {string=} mouseleave
 *                  Callback function which will be triggered when the mouse leaves the card.
 * @example
 <example module="wmCore">
     <file name="index.html">
         <div ng-controller="Ctrl" class="wm-app">
             <wm-card width="400" height="500" title="Daily Sync Up" subheading="Event">
                 <wm-card-content>
                     <wm-layoutgrid>
                         <wm-gridrow>
                             <wm-gridcolumn columnwidth="12">
                                <wm-label caption="Road map for Sprint 2" height="35" width="100%"></wm-label>
                             </wm-gridcolumn>
                         </wm-gridrow>
                     </wm-layoutgrid>
                 </wm-card-content>
                 <wm-card-actions>
                     <wm-layoutgrid>
                         <wm-gridrow>
                             <wm-gridcolumn columnwidth="12" horizontalalign="right">
                                <wm-button class="btn-transparent" caption="" type="button" iconclass="glyphicon glyphicon-trash fa-2x" height="45" width="42" color="red" hint="Delete Event"></wm-button>
                             </wm-gridcolumn>
                         </wm-gridrow>
                     </wm-layoutgrid>
                 </wm-card-actions>
             </wm-card>
         </div>
     </file>
     <file name="script.js">
     function Ctrl($scope) {}
     </file>
 </example>
 */