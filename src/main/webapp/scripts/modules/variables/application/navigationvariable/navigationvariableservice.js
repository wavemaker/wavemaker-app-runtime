/*global wm, WM, _*/
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
                /* sanity checking */
                if (Utils.isEmptyObject(variable)) {
                    return;
                }

                var pageName,
                    viewName,
                    operation,
                    sourceScope,
                    urlParams;

                operation           = variable.operation;
                sourceScope         = options.scope || $rootScope;
                pageName            = (variable.dataBinding && variable.dataBinding.pageName) || variable.pageName;
                variable.dataSet    = options.data || variable.dataSet;
                urlParams           = variable.dataSet;

                /* if operation is goToPage, navigate to the pageName */
                switch (operation) {
                case 'goToPreviousPage':
                    NavigationService.goToPrevious();
                    break;
                case 'gotoPage':
                    try {
                        NavigationService.goToPage(pageName, {
                            transition  : variable.pageTransitions === 'none' ? '' : variable.pageTransitions,
                            $event      : options.$event,
                            urlParams   : urlParams
                        });
                        sourceScope.$root.$safeApply(sourceScope);
                    } catch (ignore) {}
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
                    NavigationService.goToView(viewName, {
                        pageName    : pageName,
                        transition  : variable.pageTransitions,
                        $event      : options.$event,
                        urlParams   : urlParams
                    });
                }
            },
            getProperty: function (variable, prop) {
                return variable[prop];
            },
            setProperty: function (variable, prop, value) {
                variable[prop] = value;
                return variable[prop];
            },
            getData: function (variable) {
                return variable.dataSet;
            },
            setData: function (variable, value, isDataQueryParam) {
                if (WM.isDefined(isDataQueryParam)) {
                    variable.isDataQueryParam = isDataQueryParam;
                }
                return methods.setProperty(variable, 'dataSet', value);
            }
        },
        navigate = function (options) {
            options        = options || {};
            options.scope  = options.scope  || this.activeScope;
            methods.navigate(this, options);
        },
        basicVariableObj = {
            navigate: navigate,
            invoke  : navigate,
            setProperty: function (prop, value) {
                return methods.setProperty(this, prop, value);
            },
            getProperty: function (prop, value) {
                return methods.getProperty(this, prop, value);
            },
            getData: function () {
                return methods.getData(this);
            },
            setData: function (value, isDataQueryParam) {
                return methods.setData(this, value, isDataQueryParam);
            }
        };

    /* register the variable to the base service*/
    BaseVariablePropertyFactory.register('wm.NavigationVariable', basicVariableObj, [], methods);

    return {
        goToView: function (viewName) {
            NavigationService.goToView(viewName);
        }
    };
};