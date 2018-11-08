/*global WM*/
/*Directive for List Action Template */

WM.module('wm.layouts.containers')
    .directive('wmListActionTemplate', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$rootScope',
        'CONSTANTS',
        '$timeout',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, $rootScope, CONSTANTS, $timeout, Utils) {
            'use strict';

            var widgetProps,
                directiveDefn = {
                    'restrict'  : 'E',
                    'replace'   : true
                };

            if (CONSTANTS.isStudioMode) {
                widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listactiontemplate');
            }

            function updateLiveListProps(position) {
                /* emit event to modify the liveList template*/
                $rootScope.$emit('action-added', position === 'left' ? 'LeftActionTemplate' : 'RightActionTemplate');
            }

            // template function of studio directive
            function templateFn() {
                return '<li init-widget class="app-listtemplate app-list-item-action-panel" ng-class="position === \'right\' ? \'app-list-item-right-action-panel\' : \'app-list-item-left-action-panel\'" wmtransclude></li>';
            }

            // pre link function of studio directive
            function preLinkFn($is, $el, attrs) {
                $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                updateLiveListProps(attrs.position);
            }

            // post link function of studio directive
            function studioMode_postLinkFn($is, $el, attrs) {
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            if (CONSTANTS.isStudioMode) {
                WM.extend(directiveDefn, {
                    'transclude': true,
                    'scope'     : {},
                    'template'  : templateFn,
                    'link'      : {
                        'pre' : preLinkFn,
                        'post': studioMode_postLinkFn
                    }
                });
            }

            return directiveDefn;
        }
    ]);
