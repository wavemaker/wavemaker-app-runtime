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
        '$templateCache',

        function ($compile, $rootScope, $routeParams, PropertiesFactory, Variables, FileService, CONSTANTS, Utils, WidgetUtilService, ProjectService, $timeout, $tc) {
            'use strict';

            var props     = PropertiesFactory.getPropertiesOf('wm.pagecontainer'),
                notifyFor = { 'content': true, 'active': true},

                // to hold the whether the content of partials is loaded or not
                loadedPartials = {},
                listPartials   = [],
                filteredPartials;

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

                //In popover case for partial content for which page will be initialized first and variables are initialized next call set variables
                if (CONSTANTS.isRunMode && iScope._widgettype === 'wm-popover' && iScope.contentsource === 'partial') {
                    //Class will be used to set popover height width to avoid flickering issue
                    iScope._popoverOptions.customclass = 'popover_' + iScope.$id + '_' + partialName + '_' + _.toLower($rootScope.activePageName);
                }

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
                    partialMarkup.find('wm-list, wm-login').removeAttr('data-ng-controller');
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
                    if (iScope.widgettype === 'wm-popover' || iScope._widgettype === 'wm-popover') {
                        var popoverTemplate = 'template/popoverPartials/' + iScope.$id + '.html';
                        $tc.put(popoverTemplate, '<div>' + partialMarkup[0].outerHTML + '</div>');
                        iScope._popoverOptions.contenturl = popoverTemplate;
                    } else {
                        /* compile */
                        target.html($compile(partialMarkup)(scope));
                        $timeout(function () {
                            Utils.triggerFn(iScope.onLoad, {$isolateScope: iScope});
                        }, undefined, false);
                    }
                } else {
                    return;
                }

                if (CONSTANTS.isStudioMode) {
                    // Check if the partial is been used multiple times. If so, then do not clear the loadedPartials as it is used in next iteration.
                    filteredPartials = _.filter(listPartials, function (partial) {
                        return (partial === partialName);
                    });
                    listPartials.splice(_.indexOf(listPartials, partialName), 1);

                    if (filteredPartials.length === 1) {
                        /*reset loaded partials, as they contain the htmlMarkup & variables*/
                        loadedPartials[partialName] = undefined;
                    }

                    iScope.toolbar = target.find('button.wm-included-page-heading').first();
                    iScope.overlay = target.find('div.content-overlay').first();
                    $rootScope.$safeApply(iScope);
                }
                scope.$emit('on-pagecontainer-ready');
            }

            function _compilePartialAndUpdateVariables(iScope, element, partialName, partialMarkup) {
                $timeout(function () {
                    compilePartialAndUpdateVariables(iScope, element, partialName, partialMarkup);
                });
            }

            // reload the partial with the same content
            // this method will be triggered when there is a change in the page param value
            // Use some time to reload the page to improve the performance when there are changes in multiple page params
            function reloadPartial(iScope, element, attrs) {
                $timeout.cancel(iScope._pageLoadTimer);

                iScope._pageLoadTimer = $timeout(function () {
                    // Check for element's scope before triggering onPageIncludeChange method
                    // Element might get destroyed when the partial is used inside a list
                    if (element.scope()) {
                        onPageIncludeChange(iScope, element, attrs, iScope.content);
                    }
                }, 200);
            }

            /* This function handles the change in content property of the page-container */
            function onPageIncludeChange(iScope, element, attrs, newVal, forceLoad) {
                var target = iScope.target,
                    el     = '',
                    page   = 'pages/' + newVal + '/',
                    $s     = element.scope(),
                    addToolBar;

                if (!target) {
                    iScope.target = target = WM.isDefined(attrs.pageContainerTarget) ? element : element.find('[page-container-target]').eq(0);
                }

                function onPageFetchSuccess(content) {
                    /*get individual file contents like - html/js/css */
                    loadedPartials[newVal] = content;

                    listPartials.push(newVal);

                    /* to compile the partial page*/
                    _compilePartialAndUpdateVariables(iScope, element, newVal, el);
                }
                function onPageFetchError() {
                    if (CONSTANTS.isRunMode) {
                        //Handles page-ready event, if any partial page is deleted.
                        if ($s) {
                            Utils.triggerFn($s.onPagePartLoad);
                        }
                    } else {
                        if (element[0].hasAttribute('page-container-target')) {
                            target = element;
                        } else {
                            target = element.find('[page-container-target]').first();
                        }
                        target.html('<div class="app-partial-info"><div class="partial-message">Content for the container is unavailable.</div></div>');
                    }
                }

                element.attr('content', newVal);
                if (CONSTANTS.isStudioMode) {
                    target.find('.app-included-page, .app-included-page + .content-overlay, .wm-included-page-heading').remove();
                } else {
                    iScope.pageParams = {};

                    _.forEach(iScope.partialParams, function (param) {
                        var paramName = param.name,
                            paramVal  = param.value,
                            watchExpr;

                        if (Utils.stringStartsWith(paramVal, 'bind:')) {
                            watchExpr = paramVal.replace('bind:', '');
                            $s.$watch(':: ' + watchExpr, function (nv1) {

                                // this watch is changed for the first time.
                                // register one more watch on the same expr
                                var deregister = $s.$watch(watchExpr, function (nv2) {

                                    // reload the partial when the page param changes
                                    if (nv2 !== nv1) {
                                        deregister();
                                        // expr value is changed for the second time, reload the partial
                                        reloadPartial(iScope, element, attrs);
                                    }
                                });

                                iScope.pageParams[paramName] = nv1;
                            });
                        } else {
                            iScope.pageParams[paramName] = paramVal;
                        }
                    });
                }
                //checking if the newVale is there
                if (_.isString(newVal) && newVal.trim().length) {
                    /*load the partial on-demand*/
                    if (!loadedPartials[newVal] || forceLoad) {
                        //checking if it is a studio mode then remove the button element from the toolbar
                        if (CONSTANTS.isStudioMode) {
                            iScope.Widgets = {};
                            bindEvtHandler(element);
                            addToolBar = WM.isDefined(attrs.widgetid);

                            /* check for addToolBar*/
                            if (addToolBar) {
                                el = '<button class="wm-included-page-heading button-primary" data-ng-click=_openPageWS("' + newVal + '"); title="edit ' + newVal + '"><i class="wm-edit wi wi-pencil"></i></button>';
                            }
                            /*read the file content*/
                            FileService.read({
                                path: CONSTANTS.isStudioMode ? "../../../" + page + 'page.min.json' : page + 'page.min.json',
                                projectID : $rootScope.project.id
                            }, function (pageContent) {
                                var $styles = Utils.getDecodedData(pageContent.styles),
                                    pageContetObj;
                                WM.element(document.head).append('<style>'+ $styles +'</style>');
                                pageContetObj = {
                                    html: Utils.getDecodedData(pageContent.markup),
                                    variables: Utils.getValidJSON(Utils.getDecodedData(pageContent.variables)) || {},
                                    css: $styles
                                };

                                onPageFetchSuccess(pageContetObj);
                            }, onPageFetchError);
                        } else {
                            var AppManager = Utils.getService('AppManager');
                            AppManager.loadPartial(newVal).then(onPageFetchSuccess, onPageFetchError);
                        }
                    } else {
                        /* to compile the partial page*/
                        _compilePartialAndUpdateVariables(iScope, element, newVal, el);
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
                        element.find('> .app-partial-info').remove();
                        unbindEvtHandler(element);
                    }
                }
            }

            function loadPartialParamProperties(iScope, element, attrs, partialName) {
                var partiaParams = _.get(ProjectService.getPageInfo(partialName), 'params'),
                    paramName;

                if (iScope.newcolumns) {
                    iScope.newcolumns = false;
                    iScope.partialParams = [];
                    $rootScope.$emit('wms:partial-container-params-modified', {params: iScope.partialParams, widgetName: iScope.name});
                }

                // loop over each partial param, and append a property object against the widget scope
                _.forEach(partiaParams, function (param) {
                    paramName = param.name;
                    if (!_.find(iScope.partialParams, {name: paramName})) {
                        iScope.partialParams.push({'name': param.name, 'value': '', 'type': param.type});
                    }
                });
                //Remove the deleted params and load the existing params on to the page
                var removedParams = _.remove(iScope.partialParams, function (isparam){
                    return !_.find(partiaParams, function(param){
                        return isparam.name === param.name;
                    });
                });
                //Apply dirty check to cleanup the markup
                if(removedParams.length){
                    $rootScope.$emit('wms:partial-container-params-modified', {params: iScope.partialParams, widgetName: iScope.name});
                    $rootScope.$emit('wms:change-workspace-sanity', {params: iScope.partialParams, widgetName: iScope.name});
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
                            var forceLoad = iScope.widgettype === 'wm-popover' || iScope._widgettype === 'wm-popover';
                            onPageIncludeChange(iScope, element, attrs, newVal, forceLoad);
                            if (!forceLoad) {
                                // page is loaded successfully. reset the $lazyLoad to WM.noop. executing this method multiple times will do nothing.
                                iScope.$lazyLoad = WM.noop;
                            }
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
                            iScope.partialParams = [];
                            //Trigger registerPageContainer method of page widget when the content of this widget is loaded from other page.
                            // if the $lazyLoad method is defined on the iScope, do not register the pagePart.
                            if (CONSTANTS.isRunMode && partialName && !iScope.$lazyLoad) {
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
    ])
    .directive('wmParam', [function () {
        'use strict';

        return {
            restrict: 'E',
            replace: true,
            link: function (iScope, element, attrs) {
                var container = element.closest('[page-container]');
                if (!container.length) {
                    container = element.closest('wm-table-row');
                }
                var containerScope = container.isolateScope() || container.scope();
                containerScope.partialParams.push({
                    name: attrs.name,
                    value: attrs.value,
                    type: attrs.type
                });
            }
        };
    }]);
