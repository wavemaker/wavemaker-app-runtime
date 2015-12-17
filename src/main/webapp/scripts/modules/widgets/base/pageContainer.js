/*global WM */

WM.module('wm.widgets.base')
    .directive('pageContainer', [
        '$compile',
        '$rootScope',
        '$routeParams',
        'PropertiesFactory',
        'Variables',
        'FileService',
        'CONSTANTS',
        'Utils',
        'WidgetUtilService',

        function ($compile, $rootScope, $routeParams, PropertiesFactory, Variables, FileService, CONSTANTS, Utils, WidgetUtilService) {
            'use strict';

            var props = PropertiesFactory.getPropertiesOf('wm.pagecontainer'),
                notifyFor = {
                    'content': true,
                    'active': true
                },

            // to hold the whether the content of partials is loaded or not
                loadedPartials = {};

            function evtHandler(e) {
                // Do not allow the drop event when this widgets content is set to other page.
                e.stopPropagation();
                e.preventDefault();
            }

            function bindEvtHandler(element) {
                element.on('drop', evtHandler);
            }

            function unbindEvtHandler(element) {
                element.off('drop', evtHandler);
            }

            /* before compilation of the partial content*/
            function preCompilePartial(partialElement) {
                /* any of the partial children having on-click attr as goToPage- navigation call, remove 'active' class on it*/
                partialElement.find('[on-click^="goToPage-"][on-click^="goToPage_"]').removeClass('active');
                /*get active-page & get the element goToPage-ActivePage navigation call, add 'active' class on it*/
                partialElement.find('[on-click="goToPage-' + (CONSTANTS.isRunMode ? $routeParams.name : $rootScope.activePageName) + '"][on-click="goToPage_' + (CONSTANTS.isRunMode ? $routeParams.name : $rootScope.activePageName) + '"]').addClass('active');
            }

            /* to manually compile the partial page*/
            function compilePartialAndUpdateVariables(iScope, element, partialName, partialMarkup) {
                var target = iScope.target,
                    scope;

                /* set the partial-page variables (will be registered by the partial) */
                Variables.setPageVariables(partialName, loadedPartials[partialName].variables);

                /* append the pageContentMarkup to original markup, to compile it manually*/
                partialMarkup = partialMarkup + '<div class="app-included-page">' + (loadedPartials[partialName].html || '') + '</div>';

                /* wm-livelist and wm-login elements will have ngController directive this will result in
                 * error:multidir Multiple Directive Resource Contention
                 * to resolve this issue,
                 * RunMode: remove the ngController directive from the element and add a wrapper with the controller name
                 * StudioMode: remove the ngController directive
                 */
                if (CONSTANTS.isRunMode) {
                    partialMarkup = WM.element(Utils.processMarkup(partialMarkup));
                } else {
                    partialMarkup = partialMarkup + '<div class="content-overlay"></div>';
                    partialMarkup = WM.element(partialMarkup);
                    partialMarkup.find('wm-livelist, wm-login').removeAttr('data-ng-controller');
                }

                /*get the element scope*/
                scope = element.scope();
                scope = scope.$new();
                // element might got removed by this time, check for scope
                if (scope) {
                    /* pre-compile */
                    preCompilePartial(partialMarkup);
                    scope.partialname = partialName;
                    scope.partialcontainername = iScope.name;
                    /* compile */
                    target.html($compile(partialMarkup)(scope));
                } else {
                    return;
                }

                if (CONSTANTS.isStudioMode) {
                    /*reset loaded partials, as they contain the htmlMarkup & variables*/
                    loadedPartials[partialName] = undefined;
                    iScope.toolbar = target.find('button.wm-included-page-heading').first();
                    $rootScope.$safeApply(iScope);
                } else if (CONSTANTS.isRunMode) {
                    /* if the compilation of whole page along with partials happen in Async, then call the page-part-load fn
                     * else don't call as the page-part is not registered */
                    if (iScope.isPagePartRegistered) {
                        iScope.isPagePartRegistered = undefined;
                        Utils.triggerFn(scope.onPagePartLoad);
                    }
                }
                scope.$emit('on-pagecontainer-ready');
            }

            /* This function handles the change in content property of the page-container */
            function onPageIncludeChange(iScope, element, attrs, newVal) {
                var target = iScope.target,
                    el = '',
                    page = 'pages/' + newVal + '/',
                    addToolBar;

                if (!target) {
                    iScope.target = target = WM.isDefined(attrs.pageContainerTarget) ? element : element.find('[page-container-target]').eq(0);
                }

                element.attr('content', newVal);
                if (CONSTANTS.isStudioMode) {
                    target.find('.app-included-page, .app-included-page + .content-overlay, .wm-included-page-heading').remove();
                }
                //checking if the newVale is there
                if (newVal && newVal.trim().length) {
                    /*load the partial on-demand*/
                    if (!loadedPartials[newVal]) {
                        //checking if it is a studio mode then remove the button element from the toolbar
                        if (CONSTANTS.isStudioMode) {
                            iScope.Widgets = {};
                            bindEvtHandler(element);
                            addToolBar = WM.isDefined(attrs.widgetid);

                            /* check for addToolBar*/
                            if (addToolBar) {
                                el = '<button class="wm-included-page-heading button-primary" data-ng-click=openWorkspace("' + newVal + '"); title="edit ' + newVal + '"><i class="wm-edit fa fa-pencil"></i></button>';
                            }
                        }
                        /*read the file content*/
                        FileService.read({
                            path: CONSTANTS.isStudioMode ? "../../../" + page + 'page.min.html' : page + 'page.min.html',
                            projectID : $rootScope.project.id
                        }, function (pageContent) {
                            /*get individual file contents like - html/js/css */
                            loadedPartials[newVal] = Utils.parseCombinedPageContent(pageContent, newVal);
                            /* to compile the partial page*/
                            compilePartialAndUpdateVariables(iScope, element, newVal, el);
                        }, function () {
                            if (element[0].hasAttribute('page-container-target')) {
                                target = element;
                            } else {
                                target = element.find('[page-container-target]').first();
                            }
                            target.html('<div class="app-partial-info"><div class="partial-message">Content for the container is unavailable.</div></div>');
                        });
                    } else {
                        /* to compile the partial page*/
                        compilePartialAndUpdateVariables(iScope, element, newVal, el);
                    }
                } else {
                    if (CONSTANTS.isStudioMode) {
                        iScope.Widgets = undefined;
                        if (iScope.widgettype === 'wm-top-nav' && !element.children().length) {
                            $rootScope.$emit('canvas-add-widget', {
                                widgetType: 'wm-list',
                                parentName: iScope.name
                            }, true);
                        }
                        unbindEvtHandler(element);
                    }
                }
            }

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler(iScope, element, attrs, key, newVal) {
                switch (key) {
                case 'content':
                    // if the $lazyLoad is method is defined on the iScope of the widget (eg, tabContent and accordionContent) and if the widget is not active
                    // load the page on-demand(lazily) otherwise load immediately
                    if (newVal && iScope.$lazyLoad && !iScope.isActive) {
                        // override the $lazyLoad method defined on the iScope.
                        // page will be loaded only when this method is triggered.
                        iScope.$lazyLoad = function () {
                            onPageIncludeChange(iScope, element, attrs, newVal);
                            // page is loaded successfully. reset the $lazyLoad to WM.noop. executing this method multiple times will do nothing.
                            iScope.$lazyLoad = WM.noop;
                        };
                    } else {
                        onPageIncludeChange(iScope, element, attrs, newVal);
                    }

                    break;
                case 'active':
                    if (!CONSTANTS.isStudioMode || !iScope.toolbar) {
                        return;
                    }
                    if (newVal) {
                        iScope.toolbar.addClass('active');
                    } else {
                        iScope.toolbar.removeClass('active');
                    }
                    break;
                }
            }

            return {
                'priority': '1000',
                'compile': function () {
                    return {
                        'pre': function (iScope, element, attrs) {
                            var partialName = attrs.page || attrs.content;
                            WM.extend(iScope.widgetProps || {}, Utils.getClonedObject(props));
                            iScope['page-container'] = true;
                            //Trigger registerPageContainer method of page widget when the content of this widget is loaded from other page.
                            // if the $lazyLoad method is defined on the iScope, do not register the pagePart.
                            if (CONSTANTS.isRunMode && partialName && !loadedPartials[partialName] && !iScope.$lazyLoad) {
                                iScope.isPagePartRegistered = true;
                                Utils.triggerFn(element.scope().registerPagePart);
                            }
                        },
                        'post': function (iScope, element, attrs) {
                            if (CONSTANTS.isStudioMode && iScope.widgettype === 'wm-pagedialog') {
                                // if the mode is studio and widget is pagedialog update the widget type of content property
                                iScope.widgetProps.content.widget = 'pagedialog-pages-list';
                            }

                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, iScope, element, attrs), iScope, notifyFor);

                            //support for deprecated page attribute;
                            if (iScope.hasOwnProperty('page') && !iScope.content) {
                                iScope.content = iScope.page;
                            }
                        }
                    };
                }
            };
        }
    ]);
