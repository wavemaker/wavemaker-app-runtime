/*global WM*/
/*Directive for List and ListItem*/

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
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listtemplate', ['wm.containers']),
                notifyFor = {
                    'layout': true
                };

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
            return {
                'restrict': 'E',
                'replace': true,
                'scope': {
                    'scopedataset': '=?'
                },
                'require': '^wmLivelist',
                'transclude': (CONSTANTS.isStudioMode),
                'template': function (template, attrs) {
                    if (CONSTANTS.isRunMode) {
                        attrs.markup = template.children();
                        return '<script data-identifier="listtemplate"></script>';
                    }
                    return '<li init-widget class="app-listtemplate list-group-item app-list-item" data-ng-show="show"' + $rootScope.getWidgetStyles('container') + 'wmtransclude></li>';
                },
                'compile': function () {
                    return {
                        pre: function (scope) {
                            /*Applying widget properties to directive scope*/
                            scope.widgetProps = widgetProps;
                        },

                        post: function (scope, element, attrs, controller) {

                            var listScope = controller.getListScope(),
                                onPropertyChange;

                            listScope.markup = attrs.markup;
                            listScope.itemsPerRowClass = getRowClass(listScope.itemsperrow);
                            if (CONSTANTS.isStudioMode) {
                                onPropertyChange = propertyChangeHandler.bind(undefined, scope);
                                onPropertyChange.notifyFor = notifyFor;
                                /* register the property change handler */
                                scope.propertyManager.add(scope.propertyManager.ACTIONS.CHANGE, onPropertyChange);
                            }
                            /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                             * style declarations.*/
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        }
                    };
                }
            };
        }
    ]);
