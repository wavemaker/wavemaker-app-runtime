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

wm.variables.services.NavigationVariableService = function ($rootScope, BaseVariablePropertyFactory, Utils, NavigationService) {
    "use strict";


    /* properties of a basic variable - should contain methods applicable on this particular object */
    var methods = {
            navigate: function (variable, options) {
                var pageName,
                    viewName,
                    operation,
                    sourceScope;

                /* sanity checking */
                if (!Utils.isEmptyObject(variable)) {
                    operation = variable.operation;
                    sourceScope = options.scope || $rootScope;
                    pageName = (variable.dataBinding && variable.dataBinding.pageName) || variable.pageName;

                    /*if operation is goToPage, navigate to the pageName*/
                    switch (operation) {
                    case 'gotoPage':
                        try {
                            NavigationService.goToPage(pageName, variable.pageTransitions);
                            sourceScope.$root.$safeApply(sourceScope);
                        } catch (ignore) {
                        }
                        break;
                    case 'gotoView':
                        viewName = (variable.dataBinding && variable.dataBinding.viewName) || variable.viewName;
                        break;
                    case 'gotoTab':
                        viewName = (variable.dataBinding && variable.dataBinding.tabName) || variable.tabName;
                        break;
                    case 'gotoAccordion':
                        viewName = (variable.dataBinding && variable.dataBinding.accordionName) || variable.accordionName;
                        break;
                    case 'gotoSegment':
                        viewName = (variable.dataBinding && variable.dataBinding.segmentName) || variable.segmentName;
                        break;
                    }

                    /* if view name found, call routine to navigate to it */
                    if (viewName) {
                        NavigationService.goToView(pageName, viewName, variable.pageTransitions);
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
        goToView: function (viewName) {
            NavigationService.goToView(undefined, viewName);
        }
    };
};