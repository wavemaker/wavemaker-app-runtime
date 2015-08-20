/*global WM*/

/*Directive for Layout Grid */

WM.module('wm.layouts.containers')
    .directive('wmLayoutgrid', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', function (PropertiesFactory, WidgetUtilService, $rootScope) {
        'use strict';
        function refactorClassName(element, newClass) {
            var classArray = element.attr('class').split(' ');
            WM.forEach(classArray, function (classname) {
                if (classname.indexOf('col-') === 0) {
                    element.removeClass(classname);
                }
            });
            element.addClass(newClass);
        }

        function setColumnWidth(columns, value) {
            var className = 'col-md-' + value + ' ' + 'col-sm-' + value;
            WM.forEach(columns, function (column) {
                refactorClassName(WM.element(column), className);
            });
        }

        /* Applies default width to columns which don't already have their width set. */
        function setDefaultColumnWidth(gridColumns, totalColWidth) {
            var cols = [], defaultWidth;
            WM.forEach(gridColumns, function (column) {
                var col = WM.element(column),
                    width = col.attr('columnwidth');
                if (width) {
                    totalColWidth -= width;
                } else {
                    cols.push(col);
                }
            });
            if (cols.length) {
                defaultWidth = parseInt(totalColWidth / cols.length, 10);
                setColumnWidth(cols, defaultWidth);
            }
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
            var oldValue, columnElements, rowElements, i;
            switch (key) {
            case 'columns':
                oldValue = oldVal || scope.columns;
                scope.$root.$emit('construct-grid', key, element, oldValue, newVal);
                /*if old value equals new value then ignore*/
                if (parseInt(oldValue, 10) !== parseInt(newVal, 10)) {
                    rowElements = element.children('.app-grid-row');
                    WM.forEach(rowElements, function (rowElement) {
                        columnElements = WM.element(rowElement).children('.app-grid-column');
                        setDefaultColumnWidth(columnElements, 12);
                    });
                }
                break;
            case 'rows':
                oldValue = oldVal || scope.rows;
                oldValue = parseInt(oldValue, 10);
                scope.$root.$emit('construct-grid', key, element, oldValue, newVal);
                rowElements = element.children('.app-grid-row');
                /* If new rows were added, then apply CSS classes to their columns */
                if (oldValue < newVal) {
                    for (i = 0; i < newVal - oldValue; i++) {
                        columnElements = rowElements.eq(oldValue + i).children('.app-grid-column');
                        setColumnWidth(columnElements, (12 / scope.columns));
                    }
                }
                if (newVal === 0) {
                    scope.columns = 0;
                }
                break;
            }
        }

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.layoutgrid', ['wm.layouts']),
            notifyFor = {
                'columns': true,
                'rows': true
            };

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<div init-widget class="app-grid-layout clearfix" ' + $rootScope.getWidgetStyles("container") + ' wmtransclude></div>',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                    },

                    'post': function (scope, element, attrs) {
                        var totalColumnWidth = 12,
                            gridRows = element.children('.app-grid-row');

                        WM.forEach(gridRows, function (row) {
                            var gridColumns = WM.element(row).children('.app-grid-column');
                            setDefaultColumnWidth(gridColumns, totalColumnWidth);
                        });

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive('wmGridrow', ['PropertiesFactory', 'WidgetUtilService', '$rootScope', function (PropertiesFactory, WidgetUtilService, $rootScope) {
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
            'template': '<div init-widget data-ng-class="show"  class="app-grid-row clearfix"' + $rootScope.getWidgetStyles("container") + ' wmtransclude></div>',
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
            };

        function setColumnWidth(element, value) {
            var classArray = element.attr('class').split(' ');
            /* Remove the previous column width class */
            WM.forEach(classArray, function (classname) {
                if (classname.indexOf('col-') === 0) {
                    element.removeClass(classname);
                }
            });
            element.addClass('col-md-' + value + ' ' + 'col-sm-' + value);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(element, key, newVal) {
            switch (key) {
            case 'columnwidth':
                setColumnWidth(element, newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': '<div init-widget data-ng-class="show" class="app-grid-column"' + $rootScope.getWidgetStyles("container") + '><div class="app-ng-transclude" wmtransclude></div></div>',
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
     <wm-layoutgrid>
         <wm-gridrow>
             <wm-gridcolumn></wm-gridcolumn>
             <wm-gridcolumn></wm-gridcolumn>
         </wm-gridrow>
         <wm-gridrow>
             <wm-gridcolumn></wm-gridcolumn>
             <wm-gridcolumn></wm-gridcolumn>
         </wm-gridrow>
     </wm-layoutgrid>
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
         <wm-layoutgrid>
             <wm-gridrow>
                 <wm-gridcolumn></wm-gridcolumn>
                 <wm-gridcolumn></wm-gridcolumn>
             </wm-gridrow>
             <wm-gridrow>
                 <wm-gridcolumn></wm-gridcolumn>
                 <wm-gridcolumn></wm-gridcolumn>
             </wm-gridrow>
         </wm-layoutgrid>
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
         <wm-layoutgrid>
             <wm-gridrow>
                 <wm-gridcolumn></wm-gridcolumn>
                 <wm-gridcolumn></wm-gridcolumn>
             </wm-gridrow>
             <wm-gridrow>
                 <wm-gridcolumn></wm-gridcolumn>
                 <wm-gridcolumn></wm-gridcolumn>
             </wm-gridrow>
         </wm-layoutgrid>
     </file>
 </example>
 */