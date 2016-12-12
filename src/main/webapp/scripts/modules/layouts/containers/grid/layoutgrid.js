/*global WM*/

/*Directive for Layout Grid */

WM.module('wm.layouts.containers')
    .directive('wmLayoutgrid', [
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        '$rootScope',
        '$compile',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, CONSTANTS, $rs, $compile, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.layoutgrid'),
                notifyFor = CONSTANTS.isStudioMode ? {'columns': true} : undefined;

            /* Applies default width to columns which don't already have their width set. */
            function setDefaultColumnWidth($grid) {

                var $gridRows;

                $gridRows = $grid.children('.app-grid-row');

                $gridRows.each(function () {
                    var $row = WM.element(this),
                        $columns = $row.children('.app-grid-column'),
                        cols = [],
                        defaultWidth,
                        totalColWidth = 12;

                    $columns.each(function () {
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

                });
            }

            function propertyChangeHandler($s, $is, $el, key, nv) {

                if (!$is._isInitialized) {
                    return;
                }

                if (key === 'columns') {
                    $rs.$emit('update-layoutgrid-columns', $is.widgetid, +nv, function (markup) {
                        // remove the existing contents.
                        $el.contents().remove();
                        // add the updated markup
                        $el.append(markup);
                        // compile the contents.
                        $compile($el.contents())($s);
                        // update the columnwidth of columns.
                        setDefaultColumnWidth($el);
                    });
                }
            }

            return {
                'restrict'  : 'E',
                'replace'   : true,
                'scope'     : {},
                'transclude': true,
                'template'  : '<div init-widget class="app-grid-layout clearfix" apply-styles="container" wmtransclude></div>',
                'link'      : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },

                    'post': function ($is, $el, attrs) {

                        setDefaultColumnWidth($el);

                        if (CONSTANTS.isStudioMode) {
                            WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $el.scope(), $is, $el), $is, notifyFor);
                        }
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmGridrow', ['PropertiesFactory', 'WidgetUtilService', function (PropertiesFactory, WidgetUtilService) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.gridrow'),
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
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {},
            'transclude': true,
            'template'  : '<div init-widget class="app-grid-row clearfix" apply-styles="container" wmtransclude></div>',
            'link'      : {
                'pre': function (scope) {
                    scope.widgetProps = widgetProps;
                },
                'post': function (scope, element, attrs) {
                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }])
    .directive('wmGridcolumn', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', function (PropertiesFactory, WidgetUtilService, $rootScope) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.gridcolumn'),
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
            'restrict'   : 'E',
            'replace'    : true,
            'scope'      : {},
            'transclude' : true,
            'template'   : '<div init-widget class="app-grid-column" apply-styles="container"><div class="app-ng-transclude" wmtransclude></div></div>',
            'link'       : {
                'pre': function (scope, element, attrs) {
                    /*Applying widget properties to directive scope*/
                    scope.widgetProps = widgetProps;
                    /* If column width is specified, apply it, else layout grid will apply default width. */
                    if (attrs.columnwidth) {
                        setColumnWidth(element, attrs.columnwidth);
                    }
                },
                'post': function (scope, element, attrs) {
                    if (attrs.show === 'hide') {
                        element.addClass(attrs.show);
                    }
                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, element), scope, notifyFor);

                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
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
 * @param {number=} columns
 *                  Defines the number of columns per row. <br>
 *                  When this property is changed in studio mode, grid layout will be re-arranged accordingly. <br>
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
            <div ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
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
            <div ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
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
            <div ng-controller="Ctrl" class="wm-app">
                <wm-layoutgrid>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                    <wm-gridcolumn columnwidth="4" ></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                    <wm-gridrow>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                        <wm-gridcolumn columnwidth="4"></wm-gridcolumn>
                    </wm-gridrow>
                </wm-layoutgrid>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */