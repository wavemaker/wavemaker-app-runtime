/*global wm, WM*/
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.$NavigationVariableService
 * @requires Variables
 * @requires BaseVariablePropertyFactory
 * @requires Utils
 * @description
 * The 'NavigationVariableService' provides methods to work with Navigation variables
 */

wm.variables.services.NavigationVariableService = function ($rootScope, BaseVariablePropertyFactory, Utils, ViewService, $window, DialogService, $timeout) {
    "use strict";

    /*
     * shows all the parent container view elements for a given view element
     */
    function showAncestors(element) {
        var ancestorSearchQuery = "[wm-navigable-element='true']",
            elemScope;
        element.parents(ancestorSearchQuery).toArray().reverse().forEach(function (parent) {
            elemScope = WM.element(parent).isolateScope();
            switch (elemScope._widgettype) {
            case 'wm-view':
                ViewService.showView(elemScope.name);
                break;
            case 'wm-accordionpane':
                elemScope.expand();
                break;
            case 'wm-tabpane':
                elemScope.select();
                break;
            case 'wm-panel':
                /* flip the active flag */
                elemScope.expanded = true;
                break;
            }
        });
    }

    /*
     * searches for a given view element inside the available dialogs in current page
     * if found, the dialog is displayed, the dialog id is returned.
     */
    function showAncestorDialog(viewName) {
        var dialogId;
        WM.element("#wm-app-content [dialogtype]").each(function (i, dialog) {
            dialog = WM.element(dialog);
            if (WM.element(dialog.html()).find("[name='" + viewName + "']").length) {
                dialogId = dialog.attr("name");
                DialogService.closeAllDialogs();
                DialogService.showDialog(dialogId);
                return false;
            }
        });
        return dialogId;
    }

    /*
     * navigates the user to a view element with given name
     * if the element not found in the compiled markup, the same is searched in the available dialogs in the page
     */
    function navigateToView(viewName) {
        var viewElement = WM.element("[name='" + viewName + "']"),
            elemScope = viewElement.isolateScope(),
            parentDialog;

        if (viewElement.length) {
            switch (elemScope._widgettype) {
            case 'wm-view':
                showAncestors(viewElement);
                ViewService.showView(viewName);
                break;
            case 'wm-accordionpane':
                showAncestors(viewElement);
                elemScope.expand();
                break;
            case 'wm-tabpane':
                showAncestors(viewElement);
                elemScope.select();
                break;
            case 'wm-panel':
                /* flip the active flag */
                elemScope.expanded = true;
                break;
            }
        } else {
            parentDialog = showAncestorDialog(viewName);
            $timeout(function () {
                if (parentDialog) {
                    navigateToView(viewName, false);
                }
            });
        }

    }

    /*
     * returns the path prefix for the app
     */
    function getPathPrefix(pageName) {
        var pathPrefix;
        if ($rootScope.isSecurityEnabled && pageName === "Login") {
            pathPrefix = "login.html";
        } else if ($window.location.pathname.split("/").pop() === "index.html") {
            pathPrefix = "index.html";
        } else {
            pathPrefix = "./";
        }

        return pathPrefix;
    }

    /* properties of a basic variable - should contain methods applicable on this particular object */
    var methods = {
            navigate: function (variable, options) {
                var pageName,
                    view,
                    viewName,
                    viewElement,
                    operation,
                    sourceScope,
                    pathPrefix;

                /* sanity checking */
                if (!Utils.isEmptyObject(variable)) {
                    operation = variable.operation;
                    sourceScope = options.scope || $rootScope;
                    pageName = (variable.dataBinding && variable.dataBinding.pageName) || variable.pageName;

                    /*if operation is goToPage, navigate to the pageName*/
                    switch (operation) {
                    case 'gotoPage':
                        try {
                            pathPrefix = getPathPrefix(pageName);
                            $window.location = pathPrefix + '#/' + pageName;
                            sourceScope.$root.$safeApply(sourceScope);
                        } catch (ignore) {
                        }
                        break;
                    case 'gotoView':
                        viewName = (variable.dataBinding && variable.dataBinding.viewName) || variable.viewName;
                        /* if view's page name is not current page, change the route with the required page and view name */
                        if (variable.pageName  && variable.pageName !== $rootScope.activePageName) {
                            $window.location = getPathPrefix(pageName) + '#/' + variable.pageName + "." + viewName;
                            return;
                        }
                        viewElement = WM.element("[name='" + viewName + "']");
                        if (viewElement.length) {
                            showAncestors(viewElement);
                            ViewService.showView(viewName);
                        } else {
                            showAncestorDialog(viewName);
                            $timeout(function () {
                                viewElement = WM.element("[name='" + viewName + "']");
                                if (viewElement.length) {
                                    showAncestors(viewElement);
                                    ViewService.showView(viewName);
                                }
                            });
                        }
                        break;
                    case 'gotoTab':
                        viewName = (variable.dataBinding && variable.dataBinding.tabName) || variable.tabName;
                        /* if view's page name is not current page, change the route with the required page and view name */
                        if (variable.pageName  && variable.pageName !== $rootScope.activePageName) {
                            $window.location = getPathPrefix(pageName) + '#/' + variable.pageName + "." + viewName;
                            return;
                        }
                        view = sourceScope.Widgets && sourceScope.Widgets[viewName];
                        viewElement = WM.element("[name='" + viewName + "']");
                        if (view && viewElement.length) {
                            showAncestors(viewElement);
                            view.select();
                        } else {
                            showAncestorDialog(viewName);
                            $timeout(function () {
                                view = sourceScope.Widgets && sourceScope.Widgets[viewName];
                                viewElement = WM.element("[name='" + viewName + "']");
                                if (view && viewElement.length) {
                                    showAncestors(viewElement);
                                    view.select();
                                }
                            });
                        }
                        break;
                    case 'gotoAccordion':
                        viewName = (variable.dataBinding && variable.dataBinding.accordionName) || variable.accordionName;
                        /* if view's page name is not current page, change the route with the required page and view name */
                        if (variable.pageName  && variable.pageName !== $rootScope.activePageName) {
                            $window.location = getPathPrefix(pageName) + '#/' + variable.pageName + "." + viewName;
                            return;
                        }
                        view = sourceScope.Widgets && sourceScope.Widgets[viewName];
                        viewElement = WM.element("[name='" + viewName + "']");
                        if (view && viewElement.length) {
                            showAncestors(viewElement);
                            view.expand();
                        } else {
                            showAncestorDialog(viewName);
                            $timeout(function () {
                                view = sourceScope.Widgets && sourceScope.Widgets[viewName];
                                viewElement = WM.element("[name='" + viewName + "']");
                                if (view && viewElement.length) {
                                    showAncestors(viewElement);
                                    view.expand();
                                }
                            });
                        }
                        break;
                    }
                }
            }
        },
        basicVariableObj = {
            navigate: function () {
                methods.navigate(this, {scope: this.activeScope});
            }
        };

    /* register the variable to the base service*/
    BaseVariablePropertyFactory.register('wm.NavigationVariable', basicVariableObj, [], methods);

    return {
        navigateToView: navigateToView
    };
};