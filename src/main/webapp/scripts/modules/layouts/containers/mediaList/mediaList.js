/*global WM,_*/

/*Directive for Media List*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($tc) {
        'use strict';
        $tc.put('template/widget/medialist-design.html', '<div class="app-medialist" listen-property="dataset" init-widget apply-styles="shell"><div wmtransclude></div></div>');

        $tc.put('template/widget/medialist.html',
            '<div class="app-medialist" ng-class="{\'singlerow\' : layout == \'Single-row\'}" init-widget>' +
                '<ul class="list-unstyled list-inline app-media-thumbnail" wmtransclude></ul>' +
                '<div class="app-media-fullscreen" ng-show="selectedMediaIndex >= 0" hm-swipe-left="showNext()" hm-swipe-right="showPrev()">' +
                    '<wm-mobile-navbar on-backbtnclick="exitFullScreen();" show-leftnav="false" backbuttoniconclass="wi wi-chevron-left" title= "{{selectedMediaIndex+1}}/{{fieldDefs.length}}"></wm-mobile-navbar>' +
                    '<wm-content>' +
                        '<wm-page-content>' +
                            '<div class="app-content-column">' +
                                '<div class="image-container">' +
                                    '<img class="center-block" ng-src="{{fieldDefs[selectedMediaIndex][mediaurl]}}">' +
                                    '<a class="app-media-fullscreen-nav-control left" ng-show="selectedMediaIndex > 0" ng-click="showNext()">' +
                                        '<i class="wi wi-chevron-left"></i>' +
                                    '</a>' +
                                    '<a class="app-media-fullscreen-nav-control right" ng-show="selectedMediaIndex < fieldDefs.length-1" ng-click="showPrev()">' +
                                        '<i class="wi wi-chevron-right"></i>' +
                                    '</a>' +
                                '</div>' +
                            '</div>' +
                        '</wm-page-content>' +
                    '</wm-content>' +
                '</div>' +
            '</div>'
            );
        $tc.put('template/widget/medialist-template.html',
            '<div init-widget ng-style="{\'width\': width, \'height\': height}" class="app-medialist-template thumbnail">' +
                '<img class="thumbnail-image-template" ng-src="{{imagesource}}">' +
                '<div class="thumbnail-details" wmtransclude></div>' +
            '</div>'
            );

    }])
    .directive('wmMediaList', [
        '$templateCache',
        '$compile',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        'Utils',
        function ($templateCache, $compile, PropertiesFactory, WidgetUtilService, CONSTANTS, Utils) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.medialist', ['wm.base', 'wm.base.editors']),
                notifyFor = {
                    'dataset': true
                },
                directiveDefn,
                elementsMarkup =
                    '<li ng-repeat="item in fieldDefs" class="app-media-item" ng-click="showFullScreen($index)">' +
                        '<div ng-style="{\'width\': thumbnailWidth, \'height\': thumbnailHeight}" class="thumbnail">' +
                            '<img class="thumbnail-image" ng-src="{{item[thumbnailURL]}}">' +
                            '<div class="thumbnail-details"></div>' +
                        '</div>' +
                    '</li>';

            function controllerFn() {
                var _map = {};

                this.$set = function (key, value) {
                    _map[key] = value;
                };

                this.$get = function (key) {
                    return _map[key];
                };
            }

            // Template function for MediaList
            function templateFn() {
                if (CONSTANTS.isStudioMode) {
                    return $templateCache.get('template/widget/medialist-design.html');
                }
                return $templateCache.get('template/widget/medialist.html');
            }

            /** With given data, creates media list items*/
            function updateFieldDefs($is, $el, data) {
                $is.fieldDefs = data;
                if (CONSTANTS.isRunMode) {
                    $is.$mediaScope.fieldDefs = data;
                }
            }

            function getVariable($is, variableName) {

                if (!variableName) {
                    return undefined;
                }

                var variables = $is.Variables || {};
                return variables[variableName];
            }

            function onDataChange($is, $el, nv) {
                if (nv) {
                    if (nv.data) {
                        nv = nv.data;
                    } else {
                        if (!_.includes($is.binddataset, 'bind:Widgets.')) {
                            var boundVariableName = Utils.getVariableName($is),
                                variable = getVariable($is, boundVariableName);
                            // data from the live list must have .data filed
                            if (variable && variable.category === 'wm.LiveVariable') {
                                return;
                            }
                        }
                    }

                    /*If the data is a pageable object, then display the content.*/
                    if (WM.isObject(nv) && Utils.isPageable(nv)) {
                        nv = nv.content;
                    }

                    if (WM.isObject(nv) && !WM.isArray(nv)) {
                        nv = [nv];
                    }
                    if (!$is.binddataset) {
                        if (WM.isString(nv)) {
                            nv = nv.split(',');
                        }
                    }
                    if (WM.isArray(nv)) {
                        updateFieldDefs($is, $el, nv);
                    }
                } else {
                    if (CONSTANTS.isRunMode) {
                        updateFieldDefs($is, $el, []);
                    }
                }
            }

            /** In case of run mode, the field-definitions will be generated from the markup*/
            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, $el, attrs, key, nv) {
                if (key === 'dataset') {
                    onDataChange($is, $el, nv);
                }
            }

            // append the template content to the list item wrapper.
            function applyWrapper($tmplContent) {
                var tmpl = WM.element(elementsMarkup);
                tmpl.find('> div > .thumbnail-details').append($tmplContent);
                return tmpl;
            }

            // replace all the bind values and append to the listitem template.
            function prepareMediaListTemplate(tmpl, attrs) {
                var $tmpl = WM.element(tmpl),
                    $div = WM.element('<div></div>').append($tmpl);

                if (attrs.dataset) {
                    Utils.updateTmplAttrs($div, attrs.dataset, attrs.name);
                }
                $tmpl = applyWrapper($tmpl);

                return $tmpl;
            }

            // pre link function of studio directive
            function preLinkFn($is, $el, attrs) {
                $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
            }

            // Create child scope out of the isolateScope
            function createChildScope($is, $el, listCtrl) {
                var _scope = $el.scope(), // scop which inherits controller's scope
                    $liScope = _scope.$new(),  // create a new child scope. List Items will be compiled with this scope.
                    thumbnailDim = listCtrl.$get('thumbnailDimensions');

                WM.extend($liScope, {
                    'thumbnailURL'      : $is.thumbnailurl,
                    'thumbnailWidth'    : thumbnailDim.width,
                    'thumbnailHeight'   : thumbnailDim.height
                });

                return $liScope;
            }

            function runMode_postLinkFn($is, $el, attrs, listCtrl) {
                var $mediaTemplate,
                    $mediaScope = createChildScope($is, $el, listCtrl);
                $is.$mediaScope = $mediaScope;
                $mediaTemplate = prepareMediaListTemplate(listCtrl.$get('mediaListTemplate'), attrs);
                $el.find('> ul').append($mediaTemplate);
                $compile($mediaTemplate)($mediaScope);
                $mediaScope.showFullScreen = function (index) {
                    if (index < $mediaScope.fieldDefs.length) {
                        $is.selectedMediaIndex = index;
                    }
                };
                $is.exitFullScreen = function () {
                    $is.selectedMediaIndex = -1;
                };
                $is.showPrev = function () {
                    $mediaScope.showFullScreen($is.selectedMediaIndex + 1);
                };
                $is.showNext = function () {
                    $mediaScope.showFullScreen($is.selectedMediaIndex - 1);
                };
                /* register the property change handler */
                WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el, attrs), $is, notifyFor);
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            // post link function of studio directive
            function studioMode_postLinkFn($is, $el, attrs) {
                WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, $el, attrs), $is, notifyFor);
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            directiveDefn = {
                'restrict'   : 'E',
                'replace'    : true,
                'scope'      : {},
                'template'   : templateFn,
                'transclude' : true,
                'link': {
                    'pre': preLinkFn
                }
            };

            if (CONSTANTS.isRunMode) {
                directiveDefn.link.post  = runMode_postLinkFn;
                directiveDefn.controller = controllerFn;
            } else {
                directiveDefn.link.post = studioMode_postLinkFn;
            }
            return directiveDefn;
        }
    ])
    .directive('wmMediaTemplate', [
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$templateCache',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, CONSTANTS, $tc, Utils) {
            'use strict';

            var widgetProps,
                directiveDefn = {
                    'restrict'  : 'E',
                    'replace'   : true
                };

            if (CONSTANTS.isStudioMode) {
                widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.mediatemplate');
            }

            // pre link function of studio directive
            function preLinkFn($is) {
                $is.widgetProps = widgetProps;
            }

            // post link function of studio directive
            function studioMode_postLinkFn($is, $el, attrs) {
                $is.imagesource = Utils.getImageUrl('resources/images/imagelists/default-image.png');
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            function runMode_preLinkFn($is, $el, attrs, listCtrl) {
                listCtrl.$set('mediaListTemplate', $el.children());
                listCtrl.$set('thumbnailDimensions', {'width': attrs.width, 'height': attrs.height});
                $el.remove();
            }

            if (CONSTANTS.isStudioMode) {
                WM.extend(directiveDefn, {
                    'transclude': true,
                    'scope'     : {},
                    'template'  : $tc.get('template/widget/medialist-template.html'),
                    'link'      : {
                        'pre' : preLinkFn,
                        'post': studioMode_postLinkFn
                    }
                });
            } else {
                WM.extend(directiveDefn, {
                    'terminal': true,
                    'require' : '^wmMediaList',
                    'link'    : {
                        'pre' : runMode_preLinkFn
                    }
                });
            }

            return directiveDefn;
        }
    ]);


/**
 * @ngdoc directive
 * @name wm.layouts.container:wmMediaList
 * @restrict E
 *
 * @description
 * The `wmMedialist` directive defines a Media list widget. <br>
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires $compile
 * @requires CONSTANTS
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the media list container.
 * @param {string=} width
 *                  Width of the media list container.
 * @param {string=} height
 *                  Height of the media list container.
 * @param {string=} layout
 *                  Sets the layout - single row/ multi row view for the media list.
 * @param {string=} dataset
 *                  Sets the data for the list.<br>
 *                  This is a bindable property.<br>
 *                  When bound to a variable, the data associated with the variable is displayed in the media list.
 * @param {string=} thumbnailurl
 *                  Sets the url to be used for each of the thumbnails shown in the media list. This is a bindable property.
 * @param {string=} mediaurl
 *                  Sets the url to be used for each of the mediaurls shown in the media list. This is a bindable property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the media list on the web page. <br>
 *                  default value: `true`...
 */

/**
 * @ngdoc directive
 * @name wm.layouts.container:wmMediaTemplate
 * @restrict E
 *
 * @description
 * The `wmMediaTemplate` directive defines the template for Media list widget. <br>
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires CONSTANTS
 * @requires Utils
 *
 * @param {string=} width
 *                  Sets the width of the thumbnail in both design mode and run-mode for the media list.
 * @param {string=} height
 *                  Sets the height of the thumbnail in both design mode and run-mode for the media list.
 *
 */
