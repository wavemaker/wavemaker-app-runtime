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

    function showAncestorDialog(viewName) {
        WM.element("#wm-app-content [dialogtype]").each(function (i, dialog) {
            dialog = WM.element(dialog);
            if (WM.element(dialog.html()).find("[name='" + viewName + "']").length) {
                var dialogId = dialog.attr("name");
                DialogService.closeAllDialogs();
                DialogService.showDialog(dialogId);
                return false;
            }
        });
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

                    /*if operation is goToPage, navigate to the pageName*/
                    switch (operation) {
                    case 'gotoPage':
                        pageName = (variable.dataBinding && variable.dataBinding.pageName) || variable.pageName;
                        try {
                            if ($rootScope.isSecurityEnabled && pageName === "Login") {
                                pathPrefix = "login.html";
                            } else if ($window.location.pathname.split("/").pop() === "index.html") {
                                pathPrefix = "index.html";
                            } else {
                                pathPrefix = "./";
                            }
                            $window.location = pathPrefix + '#/' + pageName;
                            sourceScope.$root.$safeApply(sourceScope);
                        } catch (ignore) {
                        }
                        break;
                    case 'gotoView':
                        viewName = (variable.dataBinding && variable.dataBinding.viewName) || variable.viewName;
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

    };
};