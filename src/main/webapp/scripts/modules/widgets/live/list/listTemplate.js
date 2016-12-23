/*global WM*/
/*Directive for List*/

WM.module('wm.layouts.containers')
    .directive('wmListtemplate', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$rootScope',
        'CONSTANTS',
        '$timeout',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, $rootScope, CONSTANTS, $timeout, Utils) {
            'use strict';

            var widgetProps, notifyFor,
                directiveDefn = {
                    'restrict'  : 'E',
                    'replace'   : true
                };

            if (CONSTANTS.isStudioMode) {
                widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.listtemplate');
                notifyFor = {
                    'layout': true
                };
            }

            function updateLiveListTemplate($is) {
                $timeout(function () {
                    /* emit event to modify the liveList template*/
                    $rootScope.$emit('livelist-template-modified', {
                        'widgetName'        : $is.name,
                        'bindDataset'       : null,
                        'fields'            : null,
                        'forceUpdate'       : true,
                        'isTemplateUpdate'  : true
                    });
                }, undefined);
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, key, newVal) {
                switch (key) {
                case 'layout':
                    if (newVal) {
                        if ($is.newcolumns) {
                            updateLiveListTemplate($is);
                            $is.newcolumns = false;
                        }
                    }
                    break;
                }
            }

            // template function of studio directive
            function templateFn() {
                return '<li init-widget class="app-listtemplate list-group-item app-list-item"  wmtransclude></li>';
            }

            // pre link function of studio directive
            function preLinkFn($is, $el, attrs) {
                $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
            }

            // post link function of studio directive
            function studioMode_postLinkFn($is, $el, attrs) {
                var onPropertyChange = propertyChangeHandler.bind(undefined, $is);
                onPropertyChange.notifyFor = notifyFor;
                $is.propertyManager.add($is.propertyManager.ACTIONS.CHANGE, onPropertyChange);
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            function runMode_preLinkFn($is, $el, attrs, listCtrl) {
                listCtrl.$set('listTemplate', $el.children());
                $el.remove();
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
            } else {
                WM.extend(directiveDefn, {
                    'terminal': true,
                    'require' : '^wmLivelist',
                    'link'    : {
                        'pre' : runMode_preLinkFn
                    }
                });
            }

            return directiveDefn;
        }
    ]);
