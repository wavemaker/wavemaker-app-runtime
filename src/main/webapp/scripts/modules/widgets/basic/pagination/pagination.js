/*global WM, _ */
/*Directive for DataNavigator */

WM.module("wm.widgets.basic")
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/pagination.html",
            '<nav data-identifier="pagination" class="app-datanavigator clearfix" init-widget apply-styles>' +
                '<ul class="pagination advanced {{navigationClass}}" ng-if="navcontrols === \'Classic\'">' +
                    '<li ng-class="{\'disabled\':isDisableFirst}"><a title="{{$root.appLocale.LABEL_FIRST}}" name="first" href="javascript:void(0);" aria-label="First" ng-click="navigatePage(\'first\', $event)"><span aria-hidden="true"><i class="wi wi-first-page"></i></span><span class="sr-only">{{$root.appLocale.LABEL_FIRST}}</span></a></li>' +
                    '<li ng-class="{\'disabled\':isDisablePrevious}"><a title="{{$root.appLocale.LABEL_PREVIOUS}}" name="prev" href="javascript:void(0);" aria-label="Previous" ng-click="navigatePage(\'prev\', $event)"><span aria-hidden="true"><i class="wi wi-chevron-left"></i></span><span class="sr-only">{{$root.appLocale.LABEL_PREVIOUS}}</span></a></li>' +
                    '<li class="pagecount disabled"><a><input type="number" ng-disabled="isDisableCurrent" ng-model="dn.currentPage" ng-model-options="{updateOn: \'change blur\'}" ng-change="onModelChange($event)" class="form-control" /></a></li>' +
                    '<li class="disabled"><a ng-hide="isDisableCount"> / {{pageCount}}</a></li>' +
                    '<li ng-class="{\'disabled\':isDisableNext}"><a title="{{$root.appLocale.LABEL_NEXT}}" name="next" href="javascript:void(0);" aria-label="Next" ng-click="navigatePage(\'next\', $event)"><span aria-hidden="true"><i class="wi wi-chevron-right"></i></span><span class="sr-only">{{$root.appLocale.LABEL_NEXT}}</span></a></li>' +
                    '<li ng-class="{\'disabled\':isDisableLast}"><a title="{{$root.appLocale.LABEL_LAST}}" name="last" href="javascript:void(0);" aria-label="Last" ng-click="navigatePage(\'last\', $event)"><span aria-hidden="true"><i class="wi wi-last-page"></i></span><span class="sr-only">{{$root.appLocale.LABEL_LAST}}</span></a></li>' +
                    '<li ng-if="showrecordcount" class="totalcount disabled"><a>{{$root.appLocale.LABEL_TOTAL_RECORDS}}: {{dataSize}}</a></li>' +
                '</ul>' +
                '<ul class="pager {{navigationClass}}" ng-if="navcontrols === \'Pager\'">' +
                    '<li class="previous" ng-class="{\'disabled\':isDisablePrevious}"><a href="javascript:void(0);" ng-click="navigatePage(\'prev\', $event)" aria-label="Previous"><span aria-hidden="true"><i class="wi wi-chevron-left"></i></span><span class="sr-only">{{$root.appLocale.LABEL_PREVIOUS}}</span></a></li>' +
                    '<li class="next" ng-class="{\'disabled\':isDisableNext}"><a href="javascript:void(0);" ng-click="navigatePage(\'next\', $event)" aria-label="Next">{{$root.appLocale.LABEL_NEXT}}<span aria-hidden="true"><i class="wi wi-chevron-right"></i></span><span class="sr-only">{{$root.appLocale.LABEL_NEXT}}</span></a></li>' +
                '</ul>' +
                '<ul uib-pagination class="basic pagination {{navigationClass}}" ng-if="navcontrols === \'Basic\'" items-per-page="maxResults" total-items="dataSize" ng-model="dn.currentPage" ng-change="pageChanged()" max-size="maxsize" ' +
                        ' boundary-links="boundarylinks" force-ellipses="forceellipses" direction-links="directionlinks" previous-text="." next-text="." first-text="." last-text="."></ul>' +
                '<ul ng-if="navcontrols === \'Basic\' && showrecordcount" class="pagination"><li class="totalcount disabled basiccount"><a>{{$root.appLocale.LABEL_TOTAL_RECORDS}}: {{dataSize}}</a></li></ul>' +
            '</nav>'
            );
    }]).directive('wmPagination', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', '$rootScope', 'wmToaster', 'CONSTANTS', '$timeout', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, $rootScope, wmToaster, CONSTANTS, $timeout) {
        "use strict";
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.pagination', ['wm.base', 'wm.base.navigation']),
            notifyFor = {
                'dataset'        : true,
                'navigation'     : true,
                'navigationalign': true,
                'navigationsize' : true
            },
            sizeClasses = {
                'Pager': {
                    'small': 'pager-sm',
                    'large': 'pager-lg'
                },
                'Basic': {
                    'small': 'pagination-sm',
                    'large': 'pagination-lg'
                },
                'Classic': {
                    'small': 'pagination-sm',
                    'large': 'pagination-lg'
                }
            };

        // Update navigationClass based on navigation and navigationSize props
        function updateNavSize(scope) {
            var sizeCls = sizeClasses[scope.navigation];
            if (sizeCls && scope.navigationsize) {
                scope.navigationClass = sizeCls[scope.navigationsize];
            } else {
                scope.navigationClass = '';
            }
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal, oldVal) {
            switch (key) {
            case 'dataset':
                var parentScope = scope.$parent,
                    data;
                /*This is to prevent the data-navigator from getting triggered if newVal is undefined or ""*/
                if (CONSTANTS.isStudioMode && !newVal) {
                    return;
                }
                if (CONSTANTS.isRunMode) {
                    scope.show = newVal ? newVal.dataValue !== '' : false;
                }
                //For grid, data watch is set on navigator. So, update the grid full data of grid on dataset change.
                if (parentScope._widgettype === 'wm-table') {
                    data = parentScope.onDataNavigatorDataSetChange(newVal);
                } else {
                    data = newVal;
                }
                scope.setPagingValues(data);
                break;
            case 'navigation':
                if (newVal === 'Advanced') { //Support for older projects where navigation type was advanced instead of clasic
                    scope.navigation = 'Classic';
                    return;
                }

                updateNavSize(scope);

                if (scope.widgetid) {
                    scope.widgetProps.showrecordcount.show = (newVal !== 'Pager');
                }

                scope.navcontrols = newVal;
                break;
            case 'navigationalign':
                element.removeClass('text-' + oldVal).addClass('text-' + newVal);
                break;
            case 'navigationsize':
                updateNavSize(scope);
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {
                'onSetrecord': '&',
                'onPaginationchange': '&'
            },
            'replace': true,
            'controller': function ($scope) {

                //Set the result for client side pagination
                function setNonPageableData(newVal, variable) {
                    var dataSize,
                        maxResults,
                        currentPage,
                        startIndex;
                    dataSize   = WM.isArray(newVal) ? newVal.length : (newVal.data ? newVal.data.length : _.isEmpty(newVal) ? 0 : 1);
                    maxResults = ($scope.pagingOptions && $scope.pagingOptions.maxResults) || dataSize;
                    //For static variable, keep the current page. For other variables without pagination reset the page to 1
                    if (variable && variable.category === 'wm.Variable') {
                        currentPage = $scope.dn.currentPage || 1;
                    } else {
                        currentPage = 1;
                    }

                    $scope.setDefaultPagingValues(dataSize, maxResults, currentPage);
                    $scope.disableNavigation();

                    startIndex = ($scope.dn.currentPage - 1) * $scope.maxResults;
                    $scope.result =  WM.isArray(newVal) ? newVal.slice(startIndex, startIndex + $scope.maxResults) : newVal;
                }
                $scope.pageCount = 0;
                $scope.isDisableNext = true;
                $scope.isDisablePrevious = true;
                $scope.isDisableFirst = true;
                $scope.isDisableLast = true;

                /*Function to reset the paging values to default.*/
                $scope.resetPageNavigation = function () {
                    $scope.pageCount = 0;
                    $scope.dn.currentPage = 1;
                    $scope.dataSize = 0;
                };

                /*Function to calculate the paging values.*/
                $scope.calculatePagingValues = function (pageCount) {
                    $scope.pageCount = WM.isDefined(pageCount) ? pageCount : (($scope.dataSize > $scope.maxResults) ? (Math.ceil($scope.dataSize / $scope.maxResults)) : ($scope.dataSize < 0 ? 0 : 1));
                    $scope.dn.currentPage = $scope.dn.currentPage || 1;
                };

                /*Function to set default values to the paging parameters*/
                $scope.setDefaultPagingValues = function (dataSize, maxResults, currentPage, pageCount) {
                    /*If neither "dataSize" nor "maxResults" is set, then set default values to the paging parameters.*/
                    if (!dataSize && !maxResults) {
                        $scope.pageCount = 1;
                        $scope.dn.currentPage = 1;
                        $scope.maxResults = dataSize;
                        $scope.dataSize = dataSize;
                    } else { /*Else, set the specified values and recalculate paging parameters.*/
                        $scope.maxResults = maxResults || $scope.maxResults;
                        $scope.dataSize = WM.isDefined(dataSize) ? dataSize : $scope.dataSize;
                        $scope.dn.currentPage = currentPage || $scope.dn.currentPage;
                        $scope.calculatePagingValues(pageCount);
                    }
                };

                /*Function to check the dataSize and manipulate the navigator accordingly.*/
                $scope.checkDataSize = function (dataSize, numberOfElements, size) {
                    /*If the dataSize is -1 or Integer.MAX_VALUE( which is 2147483647), then the total number of records is not known.
                     * Hence,
                     * 1. Hide the "Total Record Count".
                     * 2. Disable the "GoToLastPage" link as the page number of the last page is not known.*/
                    if (dataSize === -1 || dataSize === CONSTANTS.INT_MAX_VALUE) {
                        /*
                         * TODO: to remove the 'prevshowrecordcount' and handle the dataSize = -1 case
                         */
                        $scope.prevshowrecordcount = $scope.showrecordcount;
                        $scope.isDisableLast       = true;
                        $scope.isDisableCount      = true;
                        $scope.showrecordcount     = false;
                        //If number of records in current page is less than the max records size, this is the last page. So disable next button.
                        if (numberOfElements < size) {
                            $scope.isDisableNext = true;
                        }
                    } else {
                        $scope.isDisableCount  = false;
                        $scope.showrecordcount = $scope.prevshowrecordcount || $scope.showrecordcount;
                    }
                };

                /*Function to disable navigation based on the current and total pages.*/
                $scope.disableNavigation = function () {
                    var isCurrentPageFirst = ($scope.dn.currentPage === 1),
                        isCurrentPageLast = ($scope.dn.currentPage === $scope.pageCount);
                    $scope.isDisableFirst = $scope.isDisablePrevious = isCurrentPageFirst;
                    $scope.isDisableNext = $scope.isDisableLast = isCurrentPageLast;
                    $scope.isDisableCurrent = isCurrentPageFirst && isCurrentPageLast;
                };

                /*Function to check if the variable bound to the data-navigator has paging.*/
                $scope.isVariableHasPaging = function () {
                    var dataSet = $scope.dataset,
                        category = $scope.variable && $scope.variable.category;

                    if (category === 'wm.LiveVariable' || (category === 'wm.ServiceVariable' && $scope.variable.controller === 'QueryExecution')) {
                        return true;
                    }

                    return (WM.isObject(dataSet) && (dataSet.pagingOptions || Utils.isPageable(dataSet)));
                };

                /*Function to set the values needed for pagination*/
                $scope.setPagingValues = function (newVal) {
                    var dataSize,
                        maxResults,
                        currentPage,
                        variable,
                        variableOptions = {};
                    //Store the data in __fullData. This is used for client side searching witvah out modifying the actual dataset.
                    $scope.__fullData = newVal;
                    $scope.isBoundToFilter = undefined;
                    /*Check for sanity*/
                    if ($scope.binddataset) {

                        if (newVal) {
                            if (newVal.isBoundToFilter && newVal.widgetName) {
                                $scope.isBoundToFilter = true;
                                $scope.widgetName = newVal.widgetName;
                            } else if (newVal.variableName) {
                                $scope.variableName = newVal.variableName;
                                $scope.variable = $scope.navigatorElement.scope().Variables[$scope.variableName];
                            }
                        }

                        variable        = $scope.variable || {};
                        variableOptions = variable._options || {};
                        /*Check for number of elements in the data set*/
                        if (newVal) {
                            if ($scope.isVariableHasPaging()) {
                                /*If "filterFields" and "sortOptions" have been set, then set them so that the filters can be retained while fetching data upon page navigation.*/
                                $scope.filterFields = variableOptions.filterFields || {};
                                $scope.sortOptions = variableOptions.orderBy || (WM.isArray(newVal.sort) ? Utils.getOrderByExpr(newVal.sort) : '');
                                if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                                    dataSize = newVal.totalElements;
                                    maxResults = newVal.size;
                                    if (newVal.numberOfElements > 0) {
                                        if (WM.isDefined(newVal.number)) { // number is page number received from backend
                                            $scope.dn.currentPage = newVal.number + 1;
                                        }
                                        currentPage = $scope.dn.currentPage || 1;
                                    } else {
                                        currentPage = 1;
                                    }
                                    /* Sending pageCount undefined to calculate it again for query.*/
                                    $scope.setDefaultPagingValues(dataSize, maxResults, currentPage);
                                    $scope.disableNavigation();
                                    $scope.checkDataSize(dataSize, newVal.numberOfElements, newVal.size);
                                }
                                /*Re-compute the paging values in the following cases.
                                Data corresponding to the table associated with the live-variable changes.*/
                                if (newVal.pagingOptions) {
                                    dataSize = newVal.pagingOptions.dataSize;

                                    maxResults = newVal.pagingOptions.maxResults;
                                    currentPage = newVal.pagingOptions.currentPage;
                                    $scope.setDefaultPagingValues(dataSize, maxResults, currentPage);
                                    $scope.disableNavigation();
                                    $scope.checkDataSize(dataSize);
                                }

                                $scope.result = newVal;
                            } else if (!WM.isString(newVal)) {
                                setNonPageableData(newVal, variable);
                            }
                            $rootScope.$safeApply($scope);
                        } else {
                            $scope.result = newVal;
                            $scope.resetPageNavigation();
                        }
                    } else {
                        if (newVal && !WM.isString(newVal)) {
                            setNonPageableData(newVal);
                            $rootScope.$safeApply($scope);
                        }
                    }
                };

                /*Function to check if the current page is the first page*/
                $scope.isFirstPage = function () {
                    return ($scope.dn.currentPage === 1 || !$scope.dn.currentPage);
                };
                /*Function to check if the current page is the last page*/
                $scope.isLastPage = function () {
                    return ($scope.dn.currentPage === $scope.pageCount);
                };

                /*Function to navigate to the last page*/
                $scope.goToLastPage = function (isRefresh, event, callback) {
                    if (!$scope.isLastPage()) {
                        $scope.dn.currentPage = $scope.pageCount;
                        $scope.goToPage(event, callback);
                    } else if (isRefresh) {
                        $scope.goToPage(event, callback);
                    }
                };

                /*Function to navigate to the first page*/
                $scope.goToFirstPage = function (isRefresh, event, callback) {
                    if (!$scope.isFirstPage()) {
                        $scope.dn.currentPage = 1;
                        $scope.goToPage(event, callback);
                    } else if (isRefresh) {
                        $scope.goToPage(event, callback);
                    }
                };

                /*Function to navigate to the current page*/
                $scope.goToPage = function (event, callback) {
                    $scope.firstRow = ($scope.dn.currentPage - 1) * $scope.maxResults;
                    $scope.getPageData(event, callback);
                };

                /*Function to be invoked after the data of the page has been fetched.*/
                $scope.onPageDataReady = function (event, data, callback) {
                    $scope.disableNavigation();
                    $scope.invokeSetRecord(event, data);
                    Utils.triggerFn(callback);
                    $timeout(function () {
                        $scope.$emit('eval-tfn-watchers');
                    });
                };

                /*Function to get data for the current page*/
                $scope.getPageData = function (event, callback) {
                    var variable = $scope.variable,
                        data,
                        startIndex,
                        widgetScope,
                        widgets;
                    if (CONSTANTS.isRunMode && $scope.isBoundToFilter && $scope.widgetName) {
                        widgets = $scope.navigatorElement.scope().Widgets || {};
                        widgetScope = widgets[$scope.widgetName];
                        widgetScope.applyFilter({"page": $scope.dn.currentPage});
                        return;
                    }
                    if ($scope.isVariableHasPaging()) {
                        if (variable && variable.category === "wm.LiveVariable") {
                            /*Invoke the function to get the data corresponding to the specific page.*/
                            variable.update({
                                "page": $scope.dn.currentPage,
                                "filterFields": $scope.filterFields,
                                'orderBy': $scope.sortOptions,
                                "matchMode": 'anywhereignorecase',
                                "scope": $scope.navigatorElement.scope()
                            }, function (data, propertiesMap, pagingOptions) {
                                /*Update the "result" in the scope so that widgets bound to the data-navigator are updated.*/
                                $scope.result = {
                                    "data": data,
                                    "propertiesMap": propertiesMap,
                                    "pagingOptions": pagingOptions,
                                    "filterFields": $scope.filterFields,
                                    "orderBy": $scope.sortOptions,
                                    "variableName": $scope.variableName
                                };
                                /*Update the paging options and invoke the function to re-calculate the paging values.*/
                                $scope.dataSize = pagingOptions.dataSize;
                                $scope.maxResults = pagingOptions.maxResults;
                                $scope.calculatePagingValues();
                                /*Invoke the "onPageDataReady" function.*/
                                $scope.onPageDataReady(event, data, callback);
                            }, function (error) {
                                //If error is undefined, do not show any message as this may be discarded request
                                if (error) {
                                    wmToaster.show("error", "ERROR", "Unable to get data of page -" + $scope.dn.currentPage + ":" + error);
                                }
                            });
                        } else if (Utils.isPageable($scope.dataset)) {
                            /*Invoke the function to get the data corresponding to the specific page.*/
                            variable.update({
                                "page": $scope.dn.currentPage,
                                "filterFields": $scope.filterFields,
                                "orderBy": $scope.sortOptions,
                                "matchMode": 'anywhereignorecase',
                                "scope": $scope.navigatorElement.scope()
                            }, function (data) {
                                $scope.result = data;
                                $scope.onPageDataReady(event, data, callback);
                            }, WM.noop);
                        }
                    } else {
                        startIndex = ($scope.dn.currentPage - 1) * $scope.maxResults;
                        data = WM.isArray($scope.__fullData) ?
                                $scope.__fullData.slice(startIndex, startIndex + $scope.maxResults) : $scope.__fullData;
                        $scope.result = data;
                        $rootScope.$safeApply($scope);
                        $scope.onPageDataReady(event, data, callback);
                    }
                };

                $scope.invokeSetRecord = function (event, data) {
                    /*Trigger the event handler if exists.
                     * Check in the dataNavigator scope and also in the parent (i.e., grid/live-list) scope.*/
                    if ($scope.$parent.onSetrecord) {
                        $scope.$parent.onSetrecord({$event: event, $scope: this, $data: data, $index: $scope.dn.currentPage});
                    } else if ($scope.onSetrecord) {
                        $scope.onSetrecord({$event: event, $scope: this, $data: data, $index: $scope.dn.currentPage});
                    }
                };
                /*Function to validate the page input.
                 In case of invalid input, navigate to the appropriate page; also return false.
                 In case of valid input, return true.*/
                $scope.validateCurrentPage = function (event, callback) {
                    /*If the value entered is not a valid number, then navigate to the first page.*/
                    if (isNaN($scope.dn.currentPage)) {
                        $scope.goToFirstPage(undefined, event, callback);
                        return false;
                    }
                    /*If the value entered is less than 0, then navigate to the first page.*/
                    if ($scope.dn.currentPage < 0) {
                        $scope.goToFirstPage(undefined, event, callback);
                        return false;
                    }
                    /*If the value entered is greater than the last page number, then navigate to the last page.*/
                    if ($scope.pageCount && ($scope.dn.currentPage > $scope.pageCount)) {
                        $scope.goToLastPage(undefined, event, callback);
                        return false;
                    }
                    return true;
                };

                $scope.onModelChange = function (event) {
                    if (!$scope.validateCurrentPage(event)) {
                        return;
                    }
                    $scope.goToPage(event);
                };

                $scope.pageChanged = function () {
                    var callbackFn = $scope.$parent._onPaginationchange || $scope.$parent.onPaginationchange || $scope.onPaginationchange;
                    $scope.goToPage();
                    callbackFn({$event: undefined, $scope: this, $index: $scope.dn.currentPage});
                };

                /*Function to navigate to the respective pages.*/
                $scope.navigatePage = function (index, event, isRefresh, callback) {
                    var callbackFn = $scope.$parent._onPaginationchange || $scope.$parent.onPaginationchange || $scope.onPaginationchange;
                    callbackFn({$event: undefined, $scope: this, $index: $scope.dn.currentPage});

                    /*Convert the current page to a valid page number.*/
                    $scope.dn.currentPage = parseInt($scope.dn.currentPage, 10);

                    switch (index) {
                    case "first":
                        $scope.goToFirstPage(isRefresh, event, callback);
                        return;
                    case "prev":
                        /*Return if already on the first page.*/
                        if ($scope.isFirstPage() || !$scope.validateCurrentPage(event, callback)) {
                            return;
                        }
                        /*Decrement the current page by 1.*/
                        $scope.dn.currentPage -= 1;
                        break;
                    case "next":
                        /*Return if already on the last page.*/
                        if ($scope.isLastPage() || !$scope.validateCurrentPage(event, callback)) {
                            return;
                        }
                        /*Increment the current page by 1.*/
                        $scope.dn.currentPage += 1;
                        break;
                    case "last":
                        $scope.goToLastPage(isRefresh, event, callback);
                        return;
                    default:
                        break;
                    }

                    /*Navigate to the current page.*/
                    $scope.goToPage(event, callback);
                };
            },
            'template': $templateCache.get("template/widget/pagination.html"),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                        /*Set the "allowPageable" flag in the scope to indicate that the data-navigator accepts Pageable objects.*/
                        scope.allowPageable  = true;
                        scope.navcontrols    = 'Basic';
                    },
                    'post': function (scope, element, attrs) {

                        var handlers = [];

                        /*Register a watch on the "bindDataSet" property so that whenever the dataSet binding is changed,
                         * variable is changed*/
                        handlers.push(scope.$watch('binddataset', function (newVal) {
                            var elScope;

                            if (!newVal) {
                                newVal = scope.$parent.binddataset;
                            }
                            /*Set the variable name based on whether the widget is bound to a variable opr widget*/
                            if (newVal && newVal.indexOf('bind:Variables.') !== -1) {
                                scope.variableName = newVal.replace('bind:Variables.', '');
                                scope.variableName = scope.variableName.substr(0, scope.variableName.indexOf('.'));
                                elScope             = element.scope();
                                if (scope.variableName && elScope) {
                                    scope.variable = elScope.Variables[scope.variableName];
                                }
                            }
                        }));

                        scope.dn = {}; //dataNavigator

                        scope.navigatorElement = element;
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        scope.$on('$destroy', function () {
                            handlers.forEach(Utils.triggerFn);
                        });
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmPagination
 * @restrict E
 *
 * @description
 * The `wmPagination` directive defines a data navigator that is used for pagination. <br>
 *
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires Utils
 * @requires Variables
 * @requires wmToaster
 * @requires CONSTANTS
 *
 * @param {string=}  name
 *                   Name of the data-navigator widget.
 * @param {string=} width
 *                  Width of the data navigator.
 * @param {string=} height
 *                  Height of the data navigator.
 * @param {string=} dataset
 *                  Sets the data for the data navigator.<br>
 *                  This is a bindable property..<br>
 *                  When bound to a variable, the data associated with the variable becomes the basis for pagination.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the data navigator on the web page. <br>
 *                  default value: `true`.
 * @param {boolean=} showrecordcount
 *                  This property controls whether the total record count is displayed in the data navigator or not. <br>
 *                  default value: `false`.
 * @param {string=} horizontalalign
 *                  This property used to set text alignment horizontally. <br>
 *                  Possible values are `left`, `center` and `right`. <br>
 *                  default value: `right`.
 * @param {string=} verticalalign
 *                  This property used to set text alignment vertically. <br>
 *                  Possible values are `bottom`, `middle` and `top`. <br>
 *                  default value: `middle`.
 * @param {string=} on-setrecord
 *                  Callback function which will be triggered when the record is set using the data-navigator.
 *
 */
