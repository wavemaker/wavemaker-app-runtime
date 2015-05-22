/*global WM, _*/

WM.module('wm.layouts.page')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layouts/template.html',
                '<div data-role="template" class="app-template app-page container" init-widget>' +
                    '<header data-role="page-header" class="app-header clearfix" data-ng-if="showheader">' +
                        '<h1>HEADER</h1>' +
                    '</header>' +
                    '<section data-role="page-topnav" class="app-top-nav" data-ng-if="showtopnav">' +
                        '<div class="navbar navbar-default">' +
                            '<div class="container-fluid">' +
                                '<div class="collapse navbar-collapse">' +
                                    '<ul class="nav navbar-nav">' +
                                        '<li class="active"><a href="#">ACTIVE</a></li>' +
                                        '<li><a href="#">LINK</a></li>' +
                                    '</ul>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</section>' +
                    '<main  data-role="page-content" class="app-content clearfix">' +
                        '<div class="row app-content-row clearfix">' +
                            '<aside data-role="page-left-panel" class="app-left-panel col-md-2 col-sm-2" data-ng-if="showleftnav">' +
                                '<ul class="nav app-nav nav-pills nav-stacked">' +
                                    '<li class="active"><a href="#" class="active">Active</a></li>' +
                                    '<li><a href="#">Link</a></li>' +
                                '</ul>' +
                            '</aside>' +
                            '<div class="app-page-content app-content-column">' +
                                '<div class="app-ng-transclude" wmtransclude></div>' +
                            '</div>' +
                            '<aside data-role="page-right-panel" class="app-right-panel col-md-2 col-sm-2" data-ng-if="showrightnav">' +
                                '<ul class="nav app-nav nav-pills nav-stacked">' +
                                    '<li class="active"><a href="#" class="active">Active</a></li>' +
                                    '<li><a href="#">Link</a></li>' +
                                '</ul>' +
                            '</aside>' +
                        '</div>' +
                    '</main>' +
                    '<footer data-role="page-footer" class="app-footer clearfix" data-ng-if="showfooter">' +
                        '<h3>FOOTER</h3>' +
                    '</footer>' +
                '</div>'
            );
        $templateCache.put('template/layouts/templateshowcase.html',
                '<div class="app-template showcase" data-ng-hide="hideShowCase">' +
                    '<div class="showcase-header row">' +
                        '<div class="col-sm-5 template-title">{{templates[activeTemplateIndex].id}}</div>' +
                        '<div class="col-sm-2 nav-actions">' +
                            '<span class="glypicon glyphicon glyphicon-menu-left nav-action" data-ng-click="prev()"></span>' +
                            '<span class="template-index">{{activeTemplateIndex + 1}}</span> of ' +
                            '<span class="template-count">{{templates.length}}</span>' +
                            '<span class="glypicon glyphicon glyphicon-menu-right nav-action" data-ng-click="next()"></span>' +
                        '</div>' +
                        '<div class="col-sm-5">' +
                            '<button class="btn btn-primary hide-show-case-btn" data-ng-click="hideShowCase = true">' +
                                '<span><i class="fa fa-close"/></span> ' +
                            '</button>' +
                            '<button class="btn btn-primary view-all-template-btn" data-ng-click="showAll = !showAll">' +
                                '<span class="glyphicon glyphicon-menu-up" data-ng-hide="showAll"></span>' +
                                '<span class="glyphicon glyphicon-menu-down" data-ng-show="showAll"></span>' +
                                '<span> Templates </span> ' +
                            '</button>' +

                        '</div>' +
                    '</div>' +
                    '<div class="showcase-body" data-ng-show="showAll">' +
                        '<ul class="list-inline">' +
                            '<li data-ng-repeat="template in templates track by $index">' +
                                '<div data-ng-class="{\'template-tile\': true, \'active\': $index === activeTemplateIndex}" data-ng-click="showTemplate($index)">' +
                                    '<div  class="image-wrapper">' +
                                        '<img src="resources/images/imagelists/default-image.png" data-ng-if="!template.thumbnail">' +
                                        '<img data-ng-src="{{\'resources/\' + template.id + \'/\'+ template.thumbnail}}" data-ng-if="template.thumbnail">' +
                                    '</div>' +
                                    '<div class="template-title">{{template.id}}</div>' +
                                '</div>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>'
            );
    }])
    .directive('wmTemplate', [
        '$templateCache',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$compile',

        function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, $compile) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.template', []),
                templateShowCaseRendered = false;

            return {
                'restrict': 'E',
                'replace': true,
                'transclude': true,
                'scope': {},
                'template': $templateCache.get('template/layouts/template.html'),
                'compile': function () {
                    return {
                        'pre': function (scope) {
                            scope.widgetProps = widgetProps;
                        },
                        'post': function (scope, element, attrs) {
                            WidgetUtilService.postWidgetCreate(scope, element, attrs);

                            if (CONSTANTS.isRunMode && !templateShowCaseRendered) {
                                templateShowCaseRendered = true;
                                $compile('<wm-template-showcase></wm-template-showcase>')(scope.$root);
                            }
                        }
                    };
                }
            };
        }
    ])
    .directive('wmTemplateShowcase', [
        '$templateCache',
        '$location',
        'Utils',
        '$routeParams',

        function ($templateCache, $location, Utils, $routeParams) {
            'use strict';

            return {
                'restrict': 'E',
                'replace': true,
                'template': $templateCache.get('template/layouts/templateshowcase.html'),
                'scope': {},
                'link': function (scope, element) {
                    scope.showAll = true;
                    Utils.fetchContent(
                        'json',
                        Utils.preventCachingOf('./config.json'),
                        function (response) {
                            scope.templates = [];
                            if (!response.error) {
                                scope.templates = response.templates;
                            }
                        },
                        WM.noop,
                        true
                    );

                    scope.prev = function () {
                        var i = --scope.activeTemplateIndex;
                        i = i < 0 ? 0 : i;
                        scope.showTemplate(i);
                    };

                    scope.next = function () {
                        var i = ++scope.activeTemplateIndex,
                            len = scope.templates.length;
                        i = i >= len ? len - 1 : i;
                        scope.showTemplate(i);
                    };

                    scope.showTemplate = function (idx) {
                        var template = scope.templates[idx];
                        scope.activeTemplateIndex = idx;
                        $location.path(template.id);
                    };

                    scope.activeTemplateIndex = 0;

                    var pageName = $routeParams.name;
                    if (pageName) {
                        scope.templates.some(function (template, idx) {
                            if (pageName === template.id) {
                                scope.activeTemplateIndex = idx;
                                return true;
                            }
                        });
                    }

                    WM.element('html > body:first').append(element);
                }
            };
        }
    ]);

