/*global WM*/

/**
 * @ngdoc service
 * @name wm.layouts.page.$ViewService
 * @description
 * The `ViewService` provides methods for showing and hiding a particular view.
 */

WM.module('wm.layouts.page')
    .service('ViewService', [function () {
        'use strict';
        var viewsScope = [],
        /*used internally to hide all views in a viewGroup*/
            hideActiveView = function (viewGroup) {
                var i;
                for (i = 0; i < viewsScope.length; i += 1) {
                    if (viewsScope[i].show && (viewsScope[i].viewgroup === viewGroup)) {
                        viewsScope[i].show = false;
                    }
                }
            },

        /*used internally to show a given view in a viewGroup*/
            goToView = function (viewGroup, viewName) {
                var i;
                for (i = 0; i < viewsScope.length; i += 1) {
                    if (viewsScope[i].viewgroup === viewGroup && viewsScope[i].name === viewName) {
                        /*hide all views of that viewgroup */
                        hideActiveView(viewGroup);
                        /*show the given view*/
                        viewsScope[i].show = true;
                        viewsScope[i].initialize();
                        break;
                    }
                }
            },

        /**
         * @ngdoc function
         * @name wm.layouts.page.$ViewService#registerView
         * @methodOf wm.layouts.page.$ViewService
         * @function
         *
         * @description
         * registers a view
         *
         * @param {object} scope of the view to be registered
         */
            registerView = function (scope) {
                viewsScope.push(scope);
            },

            /**
             * @ngdoc function
             * @name wm.layouts.page.$ViewService#unregisterView
             * @methodOf wm.layouts.page.$ViewService
             * @function
             *
             * @description
             * unregister a view
             *
             * @param {object} scope of the view to be unregistered
             */
            unregisterView = function (scope) {
                viewsScope.splice(viewsScope.indexOf(scope), 1);
            },

        /**
         * @ngdoc function
         * @name wm.layouts.page.$ViewService#showView
         * @methodOf wm.layouts.page.$ViewService
         * @function
         *
         * @description
         * shows a given view
         *
         * @param {string} name of the view to be shown
         */
            showView = function (name) {
                var view = WM.element("[name=" + name + "]"),
                    parentViews = view.parents(".app-view"),
                    i;
                /*in case a child view has to be shown, its parent also needs to be shown*/
                for (i = 0; i < parentViews.length; i += 1) {
                    /*the default viewgroup is default*/
                    goToView(parentViews.attr("viewgroup") || "default", parentViews.attr("name"));
                }
                if (view.length > 0) {
                    goToView(view.isolateScope().viewgroup, name);
                }
            },
        /**
         * @ngdoc function
         * @name wm.layouts.page.$ViewService#hideView
         * @methodOf wm.layouts.page.$ViewService
         * @function
         *
         * @description
         * shows a given view
         *
         * @param {string} name of the view to be hidden
         */
            hideView = function (name) {
                hideActiveView(WM.element("[name=" + name + "]").isolateScope().viewgroup);
            },

        /**
         * @ngdoc function
         * @name wm.layouts.page.$ViewService#getViews
         * @methodOf wm.layouts.page.$ViewService
         * @function
         *
         * @description
         * returns all the view of project
         *
         */
            getViews = function () {
                return viewsScope;
            },
        /**
         * @ngdoc function
         * @name wm.layouts.page.$ViewService#clearViews
         * @methodOf wm.layouts.page.$ViewService
         * @function
         *
         * @description
         * clear the viewScope variable
         *
         */
            clearViews = function () {
                viewsScope = [];
            };
        return {
            registerView: registerView,
            unregisterView: unregisterView,
            hideView: hideView,
            showView: showView,
            getViews: getViews,
            clearViews: clearViews
        };
    }]);

