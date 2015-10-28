/*global WM*/

/*Directive for Layout Grid */

WM.module('wm.layouts.containers')
    .directive('wmLayoutgrid', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';

        /* Applies default width to columns which don't already have their width set. */
        function setDefaultColumnWidth($gridColumns, totalColWidth) {
            var cols = [],
                defaultWidth;

            $gridColumns.each(function () {
                var $col = WM.element(this),
                    width = $col.attr('columnwidth');
                if (width) {
                    totalColWidth -= width;
                } else {
                    cols.push($col);
                }
            });

            if (cols.length) {
                defaultWidth = parseInt(totalColWidth / cols.length, 10);

                cols.forEach(function ($col) {
                    $col.isolateScope().columnwidth = defaultWidth;
                });
            }
        }

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.layoutgrid', ['wm.layouts']);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<div init-widget class="app-grid-layout clearfix" data-ng-show="show" apply-styles="container" wmtransclude></div>',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },

                    'post': function (scope, element, attrs) {
                        var totalColumnWidth = 12,
                            $gridRows = element.children('.app-grid-row');

                        $gridRows.each(function () {
                            var $row = WM.element(this),
                                $columns = $row.children('.app-grid-column');

                            setDefaultColumnWidth($columns, totalColumnWidth);
                        });

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmGridrow', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.gridrow', ['wm.layouts']),
            notifyFor = {
                'height': true
            };
        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key) {
            switch (key) {
            case 'height':
                scope.overflow = "auto";
                break;
            }
        }
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<div init-widget data-ng-class="show" class="app-grid-row clearfix" apply-styles="container" wmtransclude></div>',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmGridcolumn', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', function (PropertiesFactory, WidgetUtilService, $rootScope) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.gridcolumn', ['wm.layouts']),
            notifyFor = {
                'columnwidth': true
            },
            prefix = $rootScope.isMobileApplicationType ? 'col-xs-' : 'col-sm-';

        function setColumnWidth(element, nv, ov) {
            element.removeClass(prefix + ov).addClass(prefix + nv);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal, oldVal) {
            switch (key) {
            case 'columnwidth':
                setColumnWidth(element, newVal, oldVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<div init-widget data-ng-class="show" class="app-grid-column" apply-styles="container"><div class="app-ng-transclude" wmtransclude></div></div>',
            'compile': function () {
                return {
                    'pre': function (scope, element, attrs) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                        /* If column width is specified, apply it, else layout grid will apply default width. */
                        if (attrs.columnwidth) {
                            setColumnWidth(element, attrs.columnwidth);
                        }
                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/*Directive for Layout Grid */


/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmLayoutgrid
 * @restrict E
 *
 * @description
 * The 'wmLayoutgrid' directive defines a layout for rows and columns.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $rootScope
 *
 * @param {string=} name
 *                  Name of the grid.
 * @param {string=} insert
 *                  Inserts a row in the grid.
 * @param {boolean=} width
 *                  Width for the grid.
 * @param {boolean=} height
 *                  Height for the grid.
 * @param {boolean=} horizontalalign
 *                  Align the content of the geid to left/right/center. <br>
 *                  Default value: `left`. <br>
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#008B8B"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#FF1493"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#9932CC"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#8FBC8F"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#1E90FF"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#CD5C5C"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#ADD8E6"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#F08080"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#20B2AA"></wm-gridcolumn>
                    </wm-gridrow>
                </wm-layoutgrid>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmGridrow
 * @restrict E
 *
 * @description
 * The 'wmGridrow' directive defines a row for a layoutgrid.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $rootScope
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#008B8B"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#FF1493"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#9932CC"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#8FBC8F"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#1E90FF"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#CD5C5C"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#ADD8E6"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#F08080"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#20B2AA"></wm-gridcolumn>
                    </wm-gridrow>
                </wm-layoutgrid>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */

 /**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmGridcolumn
 * @restrict E
 *
 * @description
 * The 'wmGridcolumn' directive defines a column for rows in layoutgrid.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $rootScope
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#008B8B"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#FF1493"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#9932CC"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                    <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#8FBC8F"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#1E90FF"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#CD5C5C"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#ADD8E6"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#F08080"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4" height="100" backgroundcolor="#20B2AA"></wm-gridcolumn>
                    </wm-gridrow>
                </wm-layoutgrid>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */