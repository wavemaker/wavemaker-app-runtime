/*global WM, _ */

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
        'ProjectService',
        '$timeout',

        function ($compile, $rootScope, $routeParams, PropertiesFactory, Variables, FileService, CONSTANTS, Utils, WidgetUtilService, ProjectService, $timeout) {
            'use strict';

            var props = PropertiesFactory.getPropertiesOf('wm.pagecontainer'),
                notifyFor = {
                    'content': true,
                    'active': true
                },
                PARTIAL_PARAM_SUBSCRIPT = 'partialparam',

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

                if (!scope) {
                    return;
                }
                scope = scope.$new();
                // element might got removed by this time, check for scope
                if (scope) {
                    /* pre-compile */
                    preCompilePartial(partialMarkup);
                    scope.partialname = partialName;
                    scope.partialcontainername = iScope.name;
                    scope.pageParams = iScope.pageParams;
                    /* compile */
                    target.html($compile(partialMarkup)(scope));
                    $timeout(function () {
                        Utils.triggerFn(iScope.onLoad, {$isolateScope: iScope});
                    }, undefined, false);
                } else {
                    return;
                }

                if (CONSTANTS.isStudioMode) {
                    /*reset loaded partials, as they contain the htmlMarkup & variables*/
                    loadedPartials[partialName] = undefined;
                    iScope.toolbar = target.find('button.wm-included-page-heading').first();
                    iScope.overlay = target.find('div.content-overlay').first();
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
                    addToolBar,
                    $s = element.scope();

                if (!target) {
                    iScope.target = target = WM.isDefined(attrs.pageContainerTarget) ? element : element.find('[page-container-target]').eq(0);
                }

                element.attr('content', newVal);
                if (CONSTANTS.isStudioMode) {
                    target.find('.app-included-page, .app-included-page + .content-overlay, .wm-included-page-heading').remove();
                } else {
                    iScope.pageParams = {};
                    _.forEach(attrs, function (paramVal, paramName) {
                        if (Utils.stringStartsWith(paramName, PARTIAL_PARAM_SUBSCRIPT)) {
                            paramName = paramName.replace(PARTIAL_PARAM_SUBSCRIPT, '');
                            if (Utils.stringStartsWith(paramVal, 'bind:')) {
                                $s.$watch(paramVal.replace('bind:', ''), function (nv) {
                                    iScope.pageParams[paramName] = nv;
                                });
                            } else {
                                iScope.pageParams[paramName] = paramVal;
                            }
                        }
                    });
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
                                el = '<button class="wm-included-page-heading button-primary" data-ng-click=_openPageWS("' + newVal + '"); title="edit ' + newVal + '"><i class="wm-edit wi wi-pencil"></i></button>';
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

            function loadPartialParamProperties(iScope, element, attrs, partialName) {
                var partiaParams    = _.get(ProjectService.getPageInfo(partialName), 'params'),
                    propertyGroups  = element.scope().propertyGroups,
                    propertiesGroup = _.find(propertyGroups, {name: 'properties'}),
                    paramsSubGroup  = _.find(propertiesGroup.subGroups, {name: 'partialparams'}),
                    paramName,
                    paramCloakedName;
                paramsSubGroup.properties = [];

                // loop over each partial param, and append a property object against the widget scope
                _.forEach(partiaParams, function (param) {
                    paramName = param.name;
                    paramCloakedName = PARTIAL_PARAM_SUBSCRIPT + paramName; // using this name to avoid conflicts with other properties
                    iScope.widgetProps[paramCloakedName] = {"type": 'string', value: '', "bindable": 'in-bound', "label": paramName, "show": true};
                    paramsSubGroup.show = true;
                    paramsSubGroup.properties.push(paramCloakedName);
                    iScope[paramCloakedName] = attrs[paramCloakedName];
                    // If value bound, adding (bind+property) to iScope, as it won't be computed through bindManager, this is required to show disabled text against the param
                    if (Utils.stringStartsWith(attrs[paramCloakedName], 'bind:')) {
                        iScope['bind' + paramCloakedName] = attrs[paramCloakedName];
                    }
                });
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

                    if (CONSTANTS.isStudioMode) {
                        loadPartialParamProperties(iScope, element, attrs, newVal);
                    }

                    break;
                case 'active':
                    if (!CONSTANTS.isStudioMode || !iScope.toolbar) {
                        return;
                    }
                    if (newVal) {
                        iScope.toolbar.addClass('active');
                        iScope.overlay.addClass('active');
                        loadPartialParamProperties(iScope, element, attrs, iScope.content);
                    } else {
                        iScope.toolbar.removeClass('active');
                        iScope.overlay.removeClass('active');
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
