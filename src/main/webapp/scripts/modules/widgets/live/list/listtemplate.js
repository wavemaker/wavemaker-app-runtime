/*global WM*/
/*Directive for List*/

WM.module('wm.layouts.containers')
    .directive('wmListtemplate', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$rootScope',
        'CONSTANTS',
        '$timeout',

        function (PropertiesFactory, WidgetUtilService, $rootScope, CONSTANTS, $timeout) {
            'use strict';

            var widgetProps, notifyFor,
                directiveDefn = {
                    'restrict'  : 'E',
                    'replace'   : true,
                    'terminal'  : true,
                    'require'   : '^wmLivelist'
                };

            if (CONSTANTS.isStudioMode) {
                widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listtemplate', ['wm.containers']);
                notifyFor = {
                    'layout': true
                };
            }

            /* to return the bootstrap classes for the <li> w.r.t no. of items per row */
            function getRowClass(itemsperrow) {
                var col = itemsperrow && 12 / (+itemsperrow);
                return ' col-sm-' + col + ' col-md-' + col;
            }

            /**
             * Update the live list template
             * @param scope
             */
            function updateLiveListTemplate(scope) {
                $timeout(function () {
                    /* emit event to modify the liveList template*/
                    $rootScope.$emit("livelist-template-modified", {"widgetName": scope.name, "bindDataset": null, "fields": null, "forceUpdate": true, "isTemplateUpdate": true});
                }, undefined);
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(scope, key, newVal) {
                switch (key) {
                case 'layout':
                    if (newVal && CONSTANTS.isStudioMode) {
                        if (scope.newcolumns) {
                            updateLiveListTemplate(scope);
                            scope.newcolumns = false;
                        }
                    }
                    break;
                }
            }

            // template function of studio directive
            function templateFn() {
                return '<li init-widget class="app-listtemplate list-group-item app-list-item" data-ng-show="show"' + $rootScope.getWidgetStyles('container') + 'wmtransclude></li>';
            }

            // pre link function of studio directive
            function preLinkFn($is) {
                $is.widgetProps = widgetProps;
            }

            // post link function of studio directive
            function postLinkFn($is, $el, attrs) {
                var onPropertyChange = propertyChangeHandler.bind(undefined, $is);
                onPropertyChange.notifyFor = notifyFor;
                $is.propertyManager.add($is.propertyManager.ACTIONS.CHANGE, onPropertyChange);
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            function runMode_preLinkFn($is, $el, attrs, listCtrl) {
                listCtrl.$set('listTemplate', $el.children());
                listCtrl.$set('itemsPerRowClass', getRowClass(attrs.itemsperrow));
                $el.remove();
            }


            if (CONSTANTS.isStudioMode) {
                WM.extend(directiveDefn, {
                    'transclude': true,
                    'scope'     : {},
                    'template'  : templateFn,
                    'compile'   : function () {
                        return {
                            'pre' : preLinkFn,
                            'post': postLinkFn
                        };
                    }
                });
            } else {
                WM.extend(directiveDefn, {
                    'terminal': true,
                    'compile' : function () {
                        return {
                            'pre': runMode_preLinkFn
                        };
                    }
                });
            }

            return directiveDefn;
        }
    ]);
