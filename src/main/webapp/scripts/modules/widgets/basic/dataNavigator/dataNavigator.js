/*global WM, */
/*Directive for DataNavigator */

WM.module("wm.widgets.basic")
    .run(["$templateCache", function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/datanavigator.html",
            '<nav data-identifier="datanavigator" class="app-datanavigator clearfix" data-ng-show="show" init-widget apply-styles>' +
                '<ul class="pagination pagination-sm">' +
                    '<li data-ng-class="{\'disabled\':isDisableFirst}"><a name="first" href="javascript:void(0);" aria-label="First" data-ng-click="navigatePage(\'first\', $event)"><i class="glyphicon glyphicon-fast-backward"></i></a></li>' +
                    '<li data-ng-class="{\'disabled\':isDisablePrevious}"><a name="prev" href="javascript:void(0);" aria-label="Previous" data-ng-click="navigatePage(\'prev\', $event)"><i class="glyphicon glyphicon-step-backward"></i></a></li>' +
                    '<li class="pagecount disabled"><span class="input-group input-group-sm"><input type="number" data-ng-disabled="isDisableCurrent" data-ng-model="currentPage" data-ng-keydown="navigatePage(\'index\', $event)" class="form-control" /><span class="input-group-addon" data-ng-hide="isDisableCount"> of {{pageCount}}</span></span></li>' +
                    '<li data-ng-class="{\'disabled\':isDisableNext}"><a name="next" href="javascript:void(0);" aria-label="Next" data-ng-click="navigatePage(\'next\', $event)"><i class="glyphicon glyphicon-step-forward"></i></a></li>' +
                    '<li data-ng-class="{\'disabled\':isDisableLast}"><a name="last" href="javascript:void(0);" aria-label="Last" data-ng-click="navigatePage(\'last\', $event)"><i class="glyphicon glyphicon-fast-forward"></i></a></li>' +
                    '<li data-ng-if="showrecordcount" class="totalcount disabled"><span>Total Records: {{dataSize}}</span></li>' +
                '</ul>' +
            '</nav>'
            );
    }]).directive('wmDatanavigator', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', 'Variables', '$rootScope', 'wmToaster', 'CONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, Variables, $rootScope, wmToaster, CONSTANTS) {
        "use strict";
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.datanavigator', ['wm.base', 'wm.base.editors']),
            notifyFor = {
                'dataset': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'dataset':
                /*This is to prevent the data-navigator from getting triggered if newVal is undefined or ""*/
                if (CONSTANTS.isStudioMode && !newVal) {
                    return;
                }
                scope.setPagingValues(newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'scope': {
                'onEnterKeyPress': '&',
                'onSetrecord': '&'
            },
            'replace': true,
            'controller': function ($scope) {

                $scope.pageCount = 0;

                /*Function to reset the paging values to default.*/
                $scope.resetPageNavigation = function () {
                    $scope.pageCount = 0;
                    $scope.currentPage = 1;
                    $scope.dataSize = 0;
                };

                /*Function to calculate the paging values.*/
                $scope.calculatePagingValues = function (pageCount) {
                    $scope.pageCount = WM.isDefined(pageCount) ? pageCount : (($scope.dataSize > $scope.maxResults) ? (Math.ceil($scope.dataSize / $scope.maxResults)) : ($scope.dataSize < 0 ? 0 : 1));
                    $scope.currentPage = $scope.currentPage || 1;
                };

                $scope.isPagingValuesComputed = function () {
                    return (WM.isDefined($scope.maxResults) && WM.isDefined($scope.dataSize) && WM.isDefined($scope.currentPage) && WM.isDefined($scope.pageCount));
                };

                /*Function to set default values to the paging parameters*/
                $scope.setDefaultPagingValues = function (dataSize, maxResults, currentPage, pageCount) {
                    /*If neither "dataSize" nor "maxResults" is set, then set default values to the paging parameters.*/
                    if (!dataSize && !maxResults) {
                        $scope.pageCount = 1;
                        $scope.currentPage = 1;
                        $scope.maxResults = dataSize;
                        $scope.dataSize = dataSize;
                    } else { /*Else, set the specified values and recalculate paging parameters.*/
                        $scope.maxResults = maxResults || $scope.maxResults;
                        $scope.dataSize = WM.isDefined(dataSize) ? dataSize : $scope.dataSize;
                        $scope.currentPage = currentPage || $scope.currentPage;
                        $scope.calculatePagingValues(pageCount);
                    }
                };

                /*Function to check the dataSize and manipulate the navigator accordingly.*/
                $scope.checkDataSize = function (dataSize) {
                    /*If the dataSize is -1, then the total number of records is not known.
                     * Hence,
                     * 1. Hide the "Total Record Count".
                     * 2. Disable the "GoToLastPage" link as the page number of the last page is not known.*/
                    if (dataSize === -1) {
                        /*
                         * TODO: to remove the 'prevshowrecordcount' and handle the dataSize = -1 case
                         */
                        $scope.prevshowrecordcount = $scope.showrecordcount;
                        $scope.isDisableLast = true;
                        $scope.isDisableCount = true;
                        $scope.showrecordcount = false;
                    } else {
                        $scope.isDisableCount = false;
                        $scope.showrecordcount = $scope.prevshowrecordcount || $scope.showrecordcount;
                    }
                };

                /*Function to disable navigation based on the current and total pages.*/
                $scope.disableNavigation = function () {
                    var isCurrentPageFirst = ($scope.currentPage === 1),
                        isCurrentPageLast = ($scope.currentPage === $scope.pageCount);
                    $scope.isDisableFirst = $scope.isDisablePrevious = isCurrentPageFirst;
                    $scope.isDisableNext = $scope.isDisableLast = isCurrentPageLast;
                    $scope.isDisableCurrent = isCurrentPageFirst && isCurrentPageLast;
                };

                /*Function to check if the variable bound to the data-navigator has paging.*/
                $scope.isVariableHasPaging = function () {
                    var dataSet = $scope.dataset;
                    return (WM.isObject(dataSet) && (dataSet.pagingOptions || Utils.isPageable(dataSet)));
                };

                /*Function to set the values needed for pagination*/
                $scope.setPagingValues = function (newVal) {
                    var dataSize,
                        maxResults,
                        currentPage,
                        pageCount,
                        startIndex,
                        data;

                    /*Set the default value of the "result" property to the newVal so that the widgets bound to the data-navigator can have the dataSet set properly.*/
                    $scope.result = newVal;
                    $scope.isBoundToFilter = undefined;
                    /*Check for sanity*/
                    if ($scope.binddataset) {

                        /*Set the variable name based on whether the widget is bound to a variable opr widget*/
                        if ($scope.binddataset.indexOf('bind:Variables.') !== -1) {
                            $scope.variableName = $scope.binddataset.replace('bind:Variables.', '');
                            $scope.variableName = $scope.variableName.substr(0, $scope.variableName.indexOf('.'));
                        } else if (newVal.isBoundToFilter && newVal.widgetName) {
                            $scope.isBoundToFilter = true;
                            $scope.widgetName = newVal.widgetName;
                        } else {
                            $scope.variableName = newVal.variableName;
                        }

                        /*Check for number of elements in the data set*/
                        if (newVal) {
                            if ($scope.isVariableHasPaging()) {
                                /*If "filterFields" and "sortOptions" have been set, then set them so that the filters can be retained while fetching data upon page navigation.*/
                                $scope.filterFields = newVal.filterFields || {};
                                $scope.sortOptions = newVal.sortOptions || '';
                                if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                                    dataSize = newVal.totalElements;
                                    $scope.checkDataSize(dataSize);

                                    maxResults = newVal.size;
                                    if (newVal.numberOfElements > 0) {
                                        currentPage = $scope.currentPage || 1;
                                    } else {
                                        currentPage = 1;
                                    }
                                    /* Sending pageCount undefined to calculate it again for query.*/
                                    $scope.setDefaultPagingValues(dataSize, maxResults, currentPage, pageCount);
                                    $scope.disableNavigation();
                                }
                                /*Re-compute the paging values in the following cases.
                                1. Paging values have not been computed.
                                2. Data corresponding to the table associated with the live-variable changes.*/
                                if (!$scope.isPagingValuesComputed() || newVal.pagingOptions) {
                                    dataSize = newVal.pagingOptions.dataSize;

                                    maxResults = newVal.pagingOptions.maxResults;
                                    currentPage = newVal.pagingOptions.currentPage;
                                    $scope.setDefaultPagingValues(dataSize, maxResults, currentPage);
                                    $scope.disableNavigation();
                                    $scope.checkDataSize(dataSize);
                                }
                            } else if (!WM.isString(newVal)) {
                                dataSize = WM.isArray(newVal) ? newVal.length : 1;
                                maxResults = ($scope.pagingOptions && $scope.pagingOptions.maxResults) || dataSize;
                                currentPage = 1;

                                $scope.setDefaultPagingValues(dataSize, maxResults, currentPage);
                                $scope.disableNavigation();

                                startIndex = ($scope.currentPage - 1) * $scope.maxResults;
                                data =  WM.isArray(newVal) ? newVal.slice(startIndex, startIndex + $scope.maxResults) : newVal;
                                $scope.result = data;
                            }
                            $rootScope.$safeApply($scope);
                        } else {
                            $scope.resetPageNavigation();
                        }
                    }
                };

                /*Function to check if the current page is the first page*/
                $scope.isFirstPage = function () {
                    return ($scope.currentPage === 1 || !$scope.currentPage);
                };
                /*Function to check if the current page is the last page*/
                $scope.isLastPage = function () {
                    return ($scope.currentPage === $scope.pageCount);
                };

                /*Function to navigate to the last page*/
                $scope.goToLastPage = function (isRefresh, event, callback) {
                    if (!$scope.isLastPage()) {
                        $scope.currentPage = $scope.pageCount;
                        $scope.goToPage(event, callback);
                    } else if (isRefresh) {
                        $scope.goToPage(event, callback);
                    }
                };

                /*Function to navigate to the first page*/
                $scope.goToFirstPage = function (isRefresh, event, callback) {
                    if (!$scope.isFirstPage()) {
                        $scope.currentPage = 1;
                        $scope.goToPage(event, callback);
                    } else if (isRefresh) {
                        $scope.goToPage(event, callback);
                    }
                };

                /*Function to navigate to the current page*/
                $scope.goToPage = function (event, callback) {
                    $scope.firstRow = ($scope.currentPage - 1) * $scope.maxResults;
                    $scope.getPageData(event, callback);
                };

                /*Function to be invoked after the data of the page has been fetched.*/
                $scope.onPageDataReady = function (event, data, callback) {
                    $scope.disableNavigation();
                    $scope.invokeSetRecord(event, data);
                    Utils.triggerFn(callback);
                };

                /*Function to get data for the current page*/
                $scope.getPageData = function (event, callback) {
                    var variable = $scope.navigatorElement.scope().Variables[$scope.variableName],
                        data,
                        startIndex,
                        widgetScope,
                        widgets;
                    if (CONSTANTS.isRunMode && $scope.isBoundToFilter && $scope.widgetName) {
                        widgets = $scope.navigatorElement.scope().Widgets || {};
                        widgetScope = widgets[$scope.widgetName];
                        widgetScope.applyFilter({"page": $scope.currentPage});
                        return;
                    }
                    if ($scope.isVariableHasPaging()) {
                        if (variable && variable.category === "wm.LiveVariable") {
                            /*Invoke the function to get the data corresponding to the specific page.*/
                            variable.update({
                                "page": $scope.currentPage,
                                "isNotTriggerForRelated": true,
                                "filterFields": $scope.filterFields,
                                'orderBy': $scope.sortOptions,
                                "matchMode": 'anywhere',
                                "scope": $scope.navigatorElement.scope()
                            }, function (data, propertiesMap, relatedData, pagingOptions) {
                                /*Update the "result" in the scope so that widgets bound to the data-navigator are updated.*/
                                $scope.result = {
                                    "data": data,
                                    "propertiesMap": propertiesMap,
                                    "relatedData": relatedData,
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
                                wmToaster.show("error", "ERROR", "Unable to get data of page -" + $scope.currentPage + ":" + error);
                            });
                        } else if (Utils.isPageable($scope.dataset)) {
                            /*Invoke the function to get the data corresponding to the specific page.*/
                            variable.update({
                                "page": $scope.currentPage,
                                "isNotTriggerForRelated": true,
                                "filterFields": $scope.filterFields,
                                "orderBy": $scope.sortOptions,
                                "matchMode": 'anywhere',
                                "scope": $scope.navigatorElement.scope()
                            }, function (data) {
                                $scope.result = data;
                                $scope.onPageDataReady(event, data, callback);
                            }, WM.noop);
                        }
                    } else {
                        startIndex = ($scope.currentPage - 1) * $scope.maxResults;
                        data = WM.isArray($scope.dataset) ?
                            $scope.dataset.slice(startIndex, startIndex + $scope.maxResults) : $scope.dataset;
                        $scope.result = data;
                        $scope.onPageDataReady(event, data, callback);
                    }
                };

                $scope.invokeSetRecord = function (event, data) {
                    /*Trigger the event handler if exists.
                     * Check in the dataNavigator scope and also in the parent (i.e., grid/live-list) scope.*/
                    if ($scope.onSetrecord) {
                        $scope.onSetrecord({$event: event, $scope: this, $data: data, $index: $scope.currentPage});
                    } else if ($scope.$parent.onSetrecord) {
                        $scope.$parent.onSetrecord({$event: event, $scope: this, $data: data, $index: $scope.currentPage});
                    }
                };
                /*Function to validate the page input.
                 In case of invalid input, navigate to the appropriate page; also return false.
                 In case of valid input, return true.*/
                $scope.validateCurrentPage = function (event, callback) {
                    /*If the value entered is not a valid number, then navigate to the first page.*/
                    if (isNaN($scope.currentPage)) {
                        $scope.goToFirstPage(undefined, event, callback);
                        return false;
                    }
                    /*If the value entered is less than 0, then navigate to the first page.*/
                    if ($scope.currentPage < 0) {
                        $scope.goToFirstPage(undefined, event, callback);
                        return false;
                    }
                    /*If the value entered is greater than the last page number, then navigate to the last page.*/
                    if ($scope.pageCount && ($scope.currentPage > $scope.pageCount)) {
                        $scope.goToLastPage(undefined, event, callback);
                        return false;
                    }
                    return true;
                };

                /*Function to navigate to the respective pages.*/
                $scope.navigatePage = function (index, event, isRefresh, callback) {

                    /*Convert the current page to a valid page number.*/
                    $scope.currentPage = parseInt($scope.currentPage, 10);

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
                        $scope.currentPage -= 1;
                        break;
                    case "next":
                        /*Return if already on the last page.*/
                        if ($scope.isLastPage() || !$scope.validateCurrentPage(event, callback)) {
                            return;
                        }
                        /*Increment the current page by 1.*/
                        $scope.currentPage += 1;
                        break;
                    case "last":
                        $scope.goToLastPage(isRefresh, event, callback);
                        return;
                    case "index":

                        var _action = Utils.getActionFromKey(event);
                        /*Check if the enter key has been pressed.*/
                        if (_action === "ENTER") {
                            /*Trigger the event handler if exists.
                             * Check in the dataNavigator scope and also in the parent (i.e., grid/live-list) scope.*/
                            if ($scope.onEnterkeypress) {
                                $scope.onEnterkeypress();
                            } else if ($scope.$parent.onEnterkeypress) {
                                $scope.$parent.onEnterkeypress();
                            }
                            if (!$scope.validateCurrentPage(event, callback)) {
                                return;
                            }
                        } else {
                            return;
                        }
                        break;
                    default:
                        break;
                    }

                    /*Navigate to the current page.*/
                    $scope.goToPage(event, callback);
                };
            },
            'template': $templateCache.get("template/widget/datanavigator.html"),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                        /*Set the "allowPageable" flag in the scope to indicate that the data-navigator accepts Pageable objects.*/
                        scope.allowPageable = true;
                    },
                    'post': function (scope, element, attrs) {
                        scope.navigatorElement = element;
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmDatanavigator
 * @restrict E
 *
 * @description
 * The `wmDatanavigator` directive defines a data navigator that is used for pagination. <br>
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
