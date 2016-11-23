/*global WM, _, window */
/*jslint todo: true */
/*Directive for search */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/searchlist.html',
            '<a>' +
                '<img ng-src="{{match.model.wmImgSrc}}" ng-if="match.model.wmImgSrc" width="16">' +
                '<span ng-bind-html="match.label | uibTypeaheadHighlight:query" title="{{match.label}}"></span>' +
            '</a>'
            );
        $templateCache.put('template/widget/form/search.html',
            '<div class="app-search input-group" role="input" init-widget has-model listen-property="dataset"' +
                '>' +
                '<span class="fa fa-arrow-left form-control-feedback back-btn" ng-click="closeSearch()"></span>' +
                '<input title="{{hint || query}}" type="text" class="app-textbox form-control list-of-objs" placeholder="{{placeholder}}" ' +
                    ' ng-model="queryModel" ng-change="updateModel(true); _onChange({$event: $event, $scope: this});" ng-model-options="{debounce: 100}"' +
                    ' tabindex="{{tabindex}}"' +
                    ' accesskey="{{::shortcutkey}}"' +
                    ' ng-readonly="readonly" ' +
                    ' ng-required="required" ' +
                    ' ng-disabled="disabled" ' +
                    ' autocomplete="off"' +
                    ' typeahead-loading="_loadingItems" ' +
                    ' uib-typeahead="_getDisplayLabel(item) for item in _getItems($viewValue) | limitTo:limit" ' +
                    ' typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                    ' typeahead-template-url="template/widget/form/searchlist.html"' +
                    ' typeahead-min-length="minLength" focus-target>' +
                '<span ng-show="_loadingItems" class="fa fa-circle-o-notch fa-spin form-control-feedback"></span>' +
                '<span class="fa fa-close form-control-feedback clear-btn" ng-click="clearSearch()"></span>' +
                '<span class="input-group-addon" ng-class="{\'disabled\': disabled}" ng-if="showSearchIcon" >' +
                    '<form ng-submit="onSubmit({$event: $event, $scope: this})" >' +
                        '<button title="Search" ng-disabled="disabled" class="app-search-button wi wi-search" type="submit" ' +
                            'ng-click="onTypeAheadSelect($event, $item, $model, $label)"></button>' +
                    '</form>' +
                '</span>' +
                '</div>'
            );
        // this template is specify to search widget in mobile-navbar
        $templateCache.put('template/widget/form/navsearch.html',
            '<div class="app-mobile-search" role="input" init-widget has-model>' +
                '<input title="{{hint || query}}" type="text" class="form-control list-of-objs" placeholder="{{placeholder}}" ' +
                    ' ng-model="queryModel" ng-change="updateModel(true); _onChange({$event: $event, $scope: this});" ng-model-options="{debounce: 100}"' +
                    ' accesskey="{{::shortcutkey}}"' +
                    ' ng-readonly="readonly" ' +
                    ' ng-required="required" ' +
                    ' ng-disabled="disabled" ' +
                    ' uib-typeahead="item.wmDisplayLabel ||item for item in _getItems($viewValue) | limitTo:limit" ' +
                    ' typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                    ' typeahead-template-url="template/widget/form/searchlist.html"' +
                    ' typeahead-min-length="minLength" >' +
                '<i class="btn-close wi wi-cancel" ng-show="showClosebtn" ng-click="clearText();"></i>' +
            '</div>'
            );
    }])
    .filter('_custom_search_filter', function () {
        'use strict';
        return function (entries, keys, val, casesensitive) {
            var filteredEntries;
            // filter the entries based on the $is.searchkey and the input
            if (!keys) {
                // local search on data with array of objects.
                if (WM.isArray(entries) && WM.isObject(entries[0])) {
                    filteredEntries = _.filter(entries, function (entry) {
                        return (_.includes(_.toLower(_.values(entry).join(' ')), _.toLower(val)));
                    });
                } else {
                    filteredEntries = _.filter(entries, function (entry) {
                        return _.includes(entry, val);
                    });
                }
            } else {
                keys = _.split(keys, ',');

                filteredEntries = _.filter(entries, function (entry) {
                    return keys.some(function (key) {
                        var a = _.get(entry, key),
                            b = val;
                        if (!casesensitive) {
                            a = _.toLower(_.toString(a));
                            b = _.toLower(_.toString(b));
                        }
                        return _.includes(a, b);
                    });
                });
            }
            return filteredEntries;
        };
    })
    .directive('wmSearch', [
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        'Utils',
        'FormWidgetUtils',
        '$rootScope',
        '$timeout',
        'Variables',
        '$filter',
        '$q',
        '$templateCache',
        '$compile',

        function (PropertiesFactory, WidgetUtilService, CONSTANTS, Utils, FormWidgetUtils, $rs, $timeout, Variables, $filter, $q, $templateCache, $compile) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.search', ['wm.base', 'wm.base.editors.abstracteditors']),
                notifyFor = {
                    'searchkey'      : true,
                    'displaylabel'   : true,
                    'dataset'        : true,
                    'displayimagesrc': true,
                    'active'         : true,
                    'type'           : true,
                    'width'          : true,
                    'height'         : true,
                    'show'           : true
                };

            // This function updates the query value.
            function updateModel($is, $el, immediate) {
                if (immediate) {
                    //Reset the page number 1 on input change
                    $is.page = 1;
                    $is.query = $el.val();
                } else {
                    $timeout(function () {
                        $is.query = $el.val();
                    }, 100);
                }
            }

            // This function updates the queryModel and gets the matching item when datavalue is dynamically binded.
            function updateQueryModel($is) {
                // If dataset is array of strings, then update the queryModel.
                if (WM.isArray($is.formattedDataSet) && !WM.isObject($is.formattedDataSet[0])) {
                    $is.queryModel = $is._proxyModel;
                    $is.updateModel();
                    return;
                }

                if (!$is.displaylabel) {
                    $is.updateModel();
                    return;
                }

                if (WM.isObject($is.datavalue)) {
                    // convert display-label-value to string, as ui.typeahead expects only strings
                    $is.datavalue.wmDisplayLabel = WidgetUtilService.getEvaluatedData($is, $is.datavalue, {expressionName: 'displaylabel'});
                    $is.datavalue.wmImgSrc       = WidgetUtilService.getEvaluatedData($is, $is.datavalue, {expressionName: 'displayimagesrc'});
                }
                // set the queryModel by checking the matched item based on formattedDataSet.
                $is.queryModel = _.find($is.formattedDataSet, function (item) {
                    if ($is.datafield === 'All Fields' || $is.datafield === '') {
                        return _.isEqual(item, $is._proxyModel);
                    }
                    // type conversion required here. hence `==` is used instead of `===`
                    return _.get(item, $is.datafield) == $is._proxyModel;
                }) || $is._proxyModel;
                $is.updateModel();
            }

            // this function checks if the variable bound is a live variable or service variable
            function isVariableUpdateRequired($is, scope, calledFromSetDataSet) {
                var variable          = _.get(scope, ['Variables', Utils.getVariableName($is, scope)]),
                    updateRequiredFor = ['wm.LiveVariable', 'wm.ServiceVariable'],
                    queryParams       = [];

                // check if the variable is service variable
                if (!calledFromSetDataSet && variable && variable.category === 'wm.ServiceVariable') {
                    queryParams = Variables.getMappedServiceQueryParams(_.get(variable, '_wmServiceOperationInfo.parameters'));
                    if (!queryParams.length) {
                        $is.isQueryWithoutParams = true;
                        // if we don't have any query param and variable data is available then we don't need variable update, so return false
                        if ($is.isVariableDataAvailable || ($is.itemList && $is.itemList.length)) {
                            return false;
                        }
                    } else {
                        $is.isQueryWithoutParams = false;
                    }
                }
                return variable && _.includes(updateRequiredFor, variable.category);
            }

            // to filter & set the dataset property of the search widget
            function setDataSet(data, $is, element) {
                var dataSet,
                    defaultLabel;
                // sanity check for data availability
                if (!data) {
                    // remove the searchkey attr when data set is not defined
                    $rs.$emit('set-markup-attr', $is.widgetid, {'searchkey': ''});
                    // checking if itemList is available or not
                    if (!$is.itemList) {
                        $is.itemList = [];
                    }
                    return;
                }

                if (CONSTANTS.isStudioMode) {
                    FormWidgetUtils.updatePropertyOptionsWithParams($is); //update searchkey options in case of service variables
                    //Selecting first option by default for displayValue if it is undefined
                    if (!$is.displaylabel && !$is.binddisplaylabel) {
                        defaultLabel = _.get($is.widgetProps, ['displaylabel', 'options', 1]);
                        $is.displaylabel = defaultLabel;
                        $rs.$emit('set-markup-attr', $is.widgetid, {'displaylabel': defaultLabel});
                    }
                }

                if (CONSTANTS.isRunMode) {
                    // get the variable-data w.r.t the variable type
                    data = (data && data.data) || data;
                    // set data-set
                    dataSet = Utils.getClonedObject(data);
                    // if data-set is an array, show the 'listOfObjects' mode
                    if (WM.isArray(dataSet)) {
                        dataSet = FormWidgetUtils.getOrderedDataSet(dataSet, $is.orderby);
                        // check if dataSet contains list of objects, then switch to 'listOfObjects', else display 'default'
                        if (WM.isObject(dataSet[0])) {
                            _.forEach(dataSet, function (eachItem, index) {
                                var itemValue = dataSet[index];
                                if (WM.isObject(itemValue)) {
                                    // convert display-label-value to string, as ui.typeahead expects only strings
                                    itemValue.wmDisplayLabel = WidgetUtilService.getEvaluatedData($is, eachItem, {expressionName: 'displaylabel'});
                                    // to save all the image urls
                                    itemValue.wmImgSrc = WidgetUtilService.getEvaluatedData($is, eachItem, {expressionName: 'displayimagesrc'});
                                }
                            });
                        } else {
                            // convert all the values in the array to strings
                            _.forEach(dataSet, function (val, index) {
                                dataSet[index] = _.toString(val);
                            });
                        }

                        // set the itemList. If page number is greater than 1, append the results.
                        $is.itemList = $is.page > 1 ? $is.itemList.concat(dataSet) : dataSet;

                    } else if (WM.isString(dataSet) && dataSet.trim()) {
                        // make the string an array, for ex. => if dataSet is 1,2,3 then make it [1,2,3]
                        setDataSet(_.split(dataSet, ','), $is, element);
                        return;
                    } else if (WM.isObject(dataSet)) {
                        setDataSet(_.join(Object.keys(dataSet), ','), $is, element);
                        return;
                    }
                    $is.formattedDataSet = dataSet;
                    // update the queryModel, if the default value is given and formatted Dataset is defined.
                    if (!isVariableUpdateRequired($is, element.scope(), true) || ($is.formattedDataSet.length && !$is.isDefaultValueExist && $is.datavalue)) {
                        updateQueryModel($is);
                        $is.isDefaultValueExist = true;
                    }
                }
            }

            // update search-key, display-label in the property panel
            function updatePropertyPanelOptions(dataset, $is) {

                // re-initialize the property values
                if ($is.newcolumns) {
                    $is.newcolumns = false;
                    $is.searchkey = '';
                    $is.displaylabel = '';
                    $is.datafield = '';
                    $rs.$emit('set-markup-attr', $is.widgetid, {'searchkey': $is.searchkey, 'datafield': $is.datafield, 'displaylabel': $is.displaylabel});
                }

                // assign all the keys to the options of the search widget
                if (WM.isDefined(dataset) && dataset !== null) {
                    WidgetUtilService.updatePropertyPanelOptions($is);
                    FormWidgetUtils.updatePropertyOptionsWithParams($is); //update searchkey options in case of service variables
                }
            }

            // update the query and datavalue before submit.
            function onsearchSubmit($is) {
                if ($is.onSearch) {
                    $is.onSearch({$scope: $is});
                }
            }

            // onkeyup show the close icon.
            function onKeyUp($is, element, event) {
                var $navbarElScope,
                    _action,
                    inputVal = element.find('input').val();

                if (element.hasClass('app-mobile-search')) {
                    //update query on the input val change
                    $navbarElScope = element.closest('[data-role="mobile-navbar"]').isolateScope();
                    $navbarElScope.query = inputVal;
                    $is.query = inputVal;

                    _action = Utils.getActionFromKey(event);
                    if (_action === 'ENTER') {
                        onsearchSubmit($navbarElScope, element);
                    }
                }

                // if query is empty string, then datavalue will be empty.
                if (inputVal === ''  && $is.datavalue) {
                    $is.datavalue = '';
                    $is.onSubmit({$event: event, $scope: $is});
                }
                $is.query = inputVal;
                $rs.$evalAsync(function () {
                    $is.showClosebtn = (inputVal !== '');
                });
            }
            //Check if the widget is of type autocomplete in mobile view/ app
            function isMobileAutoComplete(type) {
                return type === 'autocomplete' && (Utils.isMobile() || $rs.isMobileApplicationType);
            }
            //Toggles search icon based on the type of search and dataset type
            function toggleSearchIcon($is, type) {
                if (type === 'search') {
                    $is.showSearchIcon = true;
                    $is.minLength      = 1;
                } else {
                    $is.showSearchIcon = false;
                    $is.minLength      = 0; //For autocomplete, set minlength as 0
                }
            }
            //Function to set the width pf typeahead dropdown, when dropdown is appended to body
            function setDropDownWidth($is, element) {
                var typeAheadInput,
                    typeAheadDropDown;
                if ($is.show) {
                    $timeout(function () {
                        typeAheadInput    = element.find('input[uib-typeahead]');
                        //If typeahead is appended to the body, set the width dynamically based on the input
                        if (typeAheadInput.attr('typeahead-append-to-body') === 'true') {
                            typeAheadDropDown = WM.element('body').find('> [uib-typeahead-popup]#' + typeAheadInput.attr('aria-owns'));
                            typeAheadDropDown.width(typeAheadInput.outerWidth());
                        }
                    });
                }
            }
            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, element, key, newVal) {
                switch (key) {
                case 'dataset':
                    // set the datatSet of the widget
                    setDataSet(newVal, $is, element);
                    break;
                case 'active':
                    /*listening on 'active' property, as losing the properties during page switch
                     if studio-mode, then update the displayField & dataField in property panel*/
                    if ($is.widgetid && newVal) {
                        updatePropertyPanelOptions($is.dataset, $is, element);
                    }
                    break;
                case 'type':
                    toggleSearchIcon($is, newVal);
                    break;
                case 'width':
                case 'height':
                    element.css(key, newVal);
                    break;
                case 'show':
                    setDropDownWidth($is, element);
                    break;
                }
            }

            // returns the service variable query params mapped with input values that needs to be sent for variable update
            function getServiceQueryRequestParams($is, variable, searchValue) {
                var wmServiceInfo = variable._wmServiceOperationInfo,
                    queryParams   = wmServiceInfo ? wmServiceInfo.parameters : [],
                    searchKey     = _.split($is.searchkey, ','),
                    inputFields   = {};

                //get array of query param names for variable
                queryParams = Variables.getMappedServiceQueryParams(queryParams);

                // check if some param value is already available in databinding and update the inputFields accordingly
                _.map(variable.dataBinding, function (value, key) {
                    inputFields[key] = value;
                });

                // add the query params mentioned in the searchkey to inputFields
                _.forEach(searchKey, function (value) {
                    if (_.includes(queryParams, value)) {
                        inputFields[value] = searchValue;
                    }
                });

                return inputFields;
            }
            // This function returns the query params depending upon the variable type
            function getQueryRequestParams($is, variable, searchValue) {
                var requestParams = {},
                    searchInputs  = _.split($is.searchkey, ','),
                    inputFields   = {};

                // setup common request param values
                requestParams = {
                    'pagesize'           : $is.limit || $is.pagesize,
                    'page'               : $is.page || 1,
                    'skipDataSetUpdate'  : true, //don't update the actual variable
                    'skipToggleState'    : true //Dont change the varibale toggle state as this is a independent call
                };
                switch (variable.category) {
                case 'wm.LiveVariable':
                    //build input request params for live variable
                    _.forEach(searchInputs, function (colName) {
                        inputFields[colName] = {
                            'value'     : searchValue,
                            'logicalOp' : 'AND'
                        };
                    });
                    requestParams.filterFields = inputFields;
                    requestParams.logicalOp = 'OR';
                    requestParams.searchWithQuery = true; // search results using the query api
                    requestParams.orderBy = $is.orderby ? _.replace($is.orderby, /:/g, ' ') : '';
                    break;
                case 'wm.ServiceVariable':
                    // get request params for service variable
                    inputFields = getServiceQueryRequestParams($is, variable, searchValue);
                    requestParams.inputFields = inputFields;
                    break;
                default:
                    break;
                }

                return requestParams;
            }

            // this function transform the response data in case it is not an array
            function getTransformedData(variable, data) {
                var operationResult = variable.operation + 'Result', //when output is only string it is available as oprationNameResult
                    tempResponse    = data[operationResult],
                    tempObj         = {};
                // in case data received is value as string then add that string value to object and convert object into array
                if (tempResponse) {
                    _.set(tempObj, operationResult, tempResponse);
                    data = [tempObj]; //convert data into an array having tempObj
                } else {
                    // in case data received is already an object then convert it into an array
                    data = [data];
                }

                return data;
            }

            // This function determines if drop up is required or not
            function isDropUpRequired(element) {
                var dropDownContainer = element.get(0),
                    dimensions        = dropDownContainer.getBoundingClientRect(),
                    position          = dimensions.top,
                    buttonHeight      = dimensions.height,
                    menuHeight        = element.find('.dropdown-menu').outerHeight(),
                    $win              = WM.element(window);

                return position > menuHeight && $win.height() - position < buttonHeight + menuHeight;
            }

            function setLoadingItemsFlag($is, flag) {
                $rs.$safeApply($is, function () {
                    $is._loadingItems = flag;
                });
            }
            //Check if the page retrieved currently is the last page. If last page, don't send any more request
            function isLastPage(page, dataSize, maxResults) {
                var pageCount = ((dataSize > maxResults) ? (Math.ceil(dataSize / maxResults)) : (dataSize < 0 ? 0 : 1));
                return page === pageCount;
            }
            // This function fetch the updated variable data in case search widget is bound to some variable
            function fetchVariableData($is, el, searchValue, $s) {
                var variable      = _.get($s, ['Variables', Utils.getVariableName($is, $s)]),  // get the bound variable
                    requestParams = getQueryRequestParams($is, variable, searchValue), // params to be sent along with variable update call
                    deferred      = $q.defer(),
                    customFilter  = $filter('_custom_search_filter');
                function handleQuerySuccess(response, props, pageOptions) {
                    var data            = response.content || response,
                        expressionArray = _.split($is.binddataset, '.'),
                        dataExpression  = _.slice(expressionArray, _.indexOf(expressionArray, 'dataSet') + 1).join('.');
                    if (pageOptions) {
                        $is.page       = pageOptions.currentPage;
                        $is.isLastPage = isLastPage($is.page, pageOptions.dataSize, pageOptions.maxResults);
                        $is.isPaginatedData = true;
                    } else if (WM.isObject(response) && Utils.isPageable(response)) {
                        $is.page       = response.number + 1;
                        $is.isLastPage = isLastPage($is.page, response.totalElements, response.size);
                        $is.isPaginatedData = true;
                    }
                    //if data expression exists, extract the data from the expression path
                    if (dataExpression) {
                        data = _.get(data, dataExpression);
                    }
                    if (!_.isArray(data)) {
                        data = getTransformedData(variable, data);
                    }
                    // in case of no data received, resolve the promise with empty array
                    if (!data.length) {
                        deferred.resolve([]);
                    } else {
                        if ($is.datavalue) {
                            $is.isDefaultValueExist = true;
                        }
                        /*passing data to setDataSet method so as to set the transformed data in variable itemList on scope
                         with which we are resolving the promise
                         */
                        setDataSet(data, $is, el, $s);
                        // if service variable has no query params and startUpdate is false then get the variable data and make a local search on that
                        if ($is.isQueryWithoutParams && !$is.isVariableDataAvailable) {
                            deferred.resolve(customFilter($is.itemList, $is.searchkey, searchValue, $is.casesensitive));
                            $is.isVariableDataAvailable = true;
                        } else {
                            deferred.resolve($is.itemList);
                        }
                        //Checking if drop up is required for the search results menu, if yes, add class dropup to menu and set top to auto
                        $timeout(function () {
                            if (isDropUpRequired(el)) {
                                el.addClass('dropup').find('ul').css('top', 'auto');
                            } else {
                                el.removeClass('dropup').find('ul').css('top', '100%');
                            }
                        });
                    }
                }
                function handleQueryError() {
                    // setting loadingItems to false when some error occurs, so that loading icon is hidden
                    setLoadingItemsFlag($is, false);
                }
                if (variable) {
                    // If search key is not specified then perform local search -live variable
                    if (!$is.searchkey) {
                        deferred.resolve(customFilter($is.itemList, $is.searchkey, searchValue, $is.casesensitive));
                    } else {
                        if ($is.relatedfield) {
                            variable.getRelatedTableData($is.relatedfield, requestParams, handleQuerySuccess, handleQueryError);
                        } else {
                            variable.update(requestParams, handleQuerySuccess, handleQueryError);
                        }
                    }
                }
                return deferred.promise;
            }

            // this function checks if dataset is bound to any variable then add typeahead-wait-ms attribute
            function setQuerySearchAttributes(template, tAttrs) {
                var inputTpl              = WM.element(template).find('input'),
                    isBoundToVariable     = Utils.stringStartsWith(tAttrs.dataset, 'bind:Variables.');

                // in case dataSet is bound to variable, add delay of 500ms before the typeahead query kicked-off
                if ((isBoundToVariable && inputTpl) || tAttrs.type === 'autocomplete') {
                    inputTpl.attr('typeahead-wait-ms', CONSTANTS.DELAY.SEARCH_WAIT);
                }
                //For mobile view, append the typeahead dropdown to element itself.
                if (isMobileAutoComplete(tAttrs.type)) {
                    inputTpl.attr('typeahead-append-to-body', false);
                    inputTpl.attr('typeahead-focus-on-select', false);
                } else {
                    inputTpl.attr('typeahead-append-to-body', true);
                }
            }
            //Manually trigger the search. Used while fetching next page records.
            function triggerSearch($is, typeAheadInput, incrementPage) {
                //Increase the page number and trigger force query update
                $is.page = incrementPage ? $is.page + 1 : $is.page;
                //Manually trigger the search
                typeAheadInput.controller('ngModel').$parsers[0]($is.query);
            }
            //Function to return the display label of the item
            function _getDisplayLabel(item) {
                if (_.has(item, 'wmDisplayLabel')) {
                    return item.wmDisplayLabel;
                }
                return item;
            }
            // returns the list of options which will be given to search typeahead
            function _getItems($is, element, searchValue) {
                var customFilter      = $filter('_custom_search_filter'),
                    boundDataSet      = $is.binddataset,
                    $s                = element.scope(),
                    isBoundToVariable = boundDataSet && Utils.stringStartsWith(boundDataSet, 'bind:Variables.'),
                    localSearchedData,
                    typeAheadInput,
                    typeAheadDropDown,
                    $lastItem;

                setLoadingItemsFlag($is, true);

                /* check if search widget is bound to variable(live and service) then get the updated results
                 otherwise use the local itemList array and return the filtered result as per the search value
                 */
                if (isBoundToVariable && isVariableUpdateRequired($is, $s)) {
                    return fetchVariableData($is, element, searchValue, $s).then(function (data) {
                        setLoadingItemsFlag($is, false);
                        $timeout(function () {
                            //In case of autocomplete in mobile, if records do not occupy full screen, scroll will not appear and scroll event will not be triggered
                            //To overcome this, till records occupy full screen fetch the next page records
                            if (!isMobileAutoComplete($is.type) || $is._loadingItems || $is.isLastPage || !element.hasClass('full-screen')) {
                                return;
                            }
                            typeAheadInput    = element.find('input[uib-typeahead]');
                            typeAheadDropDown = element.find('> [uib-typeahead-popup]');
                            $lastItem = typeAheadDropDown.find('li').last();
                            //Check if last item is not below the full screen
                            if ($lastItem.length && typeAheadDropDown.length && (typeAheadDropDown.height() + typeAheadDropDown.position().top >  $lastItem.height() + $lastItem.position().top)) {
                                triggerSearch($is, typeAheadInput, true);
                            }
                        });
                        return data;
                    });
                }
                // if variable update is not required then filter the local array and return the results
                localSearchedData = customFilter($is.itemList, $is.searchkey, searchValue, $is.casesensitive);
                setLoadingItemsFlag($is, false);

                return localSearchedData;
            }


            return {
                'restrict': 'E',
                'replace': true,
                'scope': {
                    'scopedataset': '=?',
                    'onSubmit': '&',
                    'onSelect': '&'
                },
                'template': function (tElement, tAttrs) {
                    var template, url = '', target, isWidgetInsideCanvas;
                    if (tAttrs.navsearchbar) {
                        url = 'template/widget/form/navsearch.html';
                    } else {
                        url = 'template/widget/form/search.html';
                    }
                    template = WM.element($templateCache.get(url));
                    isWidgetInsideCanvas = tAttrs.hasOwnProperty('widgetid');
                    setQuerySearchAttributes(template, tAttrs);
                    target = template.find('input.form-control');

                    /*Set name for the model-holder, to ease submitting a form*/
                    target.attr('name', tAttrs.name);
                    if (!isWidgetInsideCanvas) {
                        if (tAttrs.hasOwnProperty('onFocus')) {
                            target.attr('ng-focus', 'onFocus({$event: $event, $scope: this})');
                        }

                        if (tAttrs.hasOwnProperty('onBlur')) {
                            target.attr('ng-blur', 'onBlur({$event: $event, $scope: this})');
                        }
                    }

                    return template[0].outerHTML;
                },
                'link': {
                    'pre': function ($is, $el) {
                        if (CONSTANTS.isStudioMode) {
                            $is.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            $is.widgetProps = widgetProps;
                        }
                        $is.widgetDataset = {};
                        $is.updateModel   = updateModel.bind(undefined, $is, $el.find('input'));

                        Object.defineProperty($is, '_model_', {
                            get: function () {
                                // check if datavalue is null.
                                if (!$is._proxyModel) {
                                    return undefined;
                                }

                                return $is._proxyModel;
                            },
                            set: function (newVal) {
                                $is._proxyModel = newVal;

                                // check if datavalue is null.
                                if (!newVal) {
                                    $is.queryModel = '';
                                    $rs.$evalAsync($is.updateModel);
                                    return;
                                }
                                $is.queryModel = newVal; // set the default queryModel.

                                updateQueryModel($is);
                            }
                        });

                    },
                    'post': function ($is, element, attrs) {
                        var searchItem,
                            typeAheadInput,
                            typeAheadDropDown;
                        $is.minLength  = 1;
                        $is.page       = 1;
                        $is.isLastPage = true;
                        // register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, element), $is, notifyFor);

                        // on-select of type-ahead element, call the user-defined submit fn
                        $is.onTypeAheadSelect = function ($event, $item, $model, $label) {
                            $event = $event || {};
                            // 'wmImgSrc' attr is found for the item select, then delete it
                            if ($item && $item.wmImgSrc) {
                                $item = Utils.getClonedObject($item);
                                delete $item.wmImgSrc;
                            }
                            //store the previous item to make the button click functional
                            $item = searchItem = $item || ($is.datavalue === _.get(searchItem, $is.datafield) ? searchItem : undefined);

                            // add the selected object to the event.data and send to the user
                            $event.data = {'item': $item, 'model': $model, 'label': $label, 'query': $label};

                            // set selected item on widget's exposed property
                            $is.datavalue = ($is.datafield && $is.datafield !== 'All Fields') ? ($item  && _.get($item, $is.datafield)) : $item;
                            $is.queryModel = $item;
                            $is.query = $label;
                            $is.closeSearch();
                            // call user 'onSubmit & onSelect' fn
                            $is.onSelect({$event: $event, $scope: $is, selectedValue: $is.datavalue});
                            $is.onSubmit({$event: $event, $scope: $is});
                        };


                        // this functions clears the input value
                        $is.clearText = function () {
                            element.find('input').val('');
                            $is.showClosebtn = false;
                        };
                        WidgetUtilService.postWidgetCreate($is, element, attrs);
                        element.removeAttr('tabindex');

                        /* fields defined in scope: {} MUST be watched explicitly
                         watching model attribute to the data for the search element.*/
                        if (!attrs.widgetid && attrs.scopedataset) {
                            $is.$watch('scopedataset', function (newVal) {
                                setDataSet(newVal, $is, element);
                            });
                        }
                        // returns the list of options which will be given to search typeahead
                        $is._getItems = _getItems.bind(undefined, $is, element);
                        $is._getDisplayLabel = _getDisplayLabel.bind(undefined);

                        if (CONSTANTS.isRunMode) {
                            // keyup event to enable/ disable close icon of the search input.
                            element.bind('keyup', onKeyUp.bind(undefined, $is, element));
                            $timeout(function () {
                                typeAheadInput    = element.find('input[uib-typeahead]');
                                //If appended to body, add app search class to typeahead dropdown
                                if (typeAheadInput.attr('typeahead-append-to-body') === 'true') {
                                    typeAheadDropDown = WM.element('body').find('> [uib-typeahead-popup]#' + typeAheadInput.attr('aria-owns'));
                                    typeAheadDropDown.addClass('app-search');
                                } else {
                                    typeAheadDropDown = element.find('> [uib-typeahead-popup]');
                                    typeAheadInput.bind('focus', function () {
                                        //Add full screen class on focus of the input element.
                                        element.addClass('full-screen');
                                        if ($is.query) { //If query is present, get the dropdown results with this query
                                            triggerSearch($is, typeAheadInput);
                                        }
                                    });
                                }
                                //Append loading items span element at bottom of the dropdown list
                                typeAheadDropDown.append($compile('<div class="status" ng-show="_loadingItems"><i class="fa fa-circle-o-notch fa-spin"></i><span>{{loadingdatamsg}}</span></div>' +
                                    '<div class="status" ng-show="!_loadingItems && isPaginatedData && isLastPage"><span>{{datacompletemsg}}</span></div>')($is));
                                //Attach the scroll event to the drop down
                                typeAheadDropDown.bind('scroll', function () {
                                    var $item = WM.element(this);
                                    //If scroll is at the bottom and no request is in progress and next page records are available, fetch next page items.
                                    if (!$is._loadingItems && !$is.isLastPage && ($item.scrollTop() + $item.innerHeight() >= $item[0].scrollHeight)) {
                                        triggerSearch($is, typeAheadInput, true);
                                    }
                                });
                            });
                        }
                        //Close the full screen mode in mobile view of auto complete
                        $is.closeSearch = function () {
                            $is.page = 1;
                            if (!$is.datavalue) {
                                $is.queryModel = '';
                            }
                            element.removeClass('full-screen');
                        };
                        //Clear the search and trigger the search with empty value
                        $is.clearSearch = function () {
                            $is.page = 1;
                            if ($is.query) {
                                $is.queryModel = $is.query = '';
                                triggerSearch($is, element.find('input[uib-typeahead]'));
                            }
                        };
                        /*Called from form reset when users clicks on form reset*/
                        $is.reset = function () {
                            $is._model_ = undefined;
                            $is.queryModel = $is.query = '';
                        };
                        //On re-render (in case of tabs or other container), calculate the width again
                        $is.redraw = function () {
                            setDropDownWidth($is, element);
                        };
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmSearch
 * @restrict E
 *
 * @description
 * The `wmSearch` directive defines the search widget. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires CONSTANTS
 *
 * @param {string=}  name
 *                   Name of the search widget.
 * @param {string=}  placeholder
 *                   Placeholder for the search widget.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the search widget.
 * @param {string=}  scopedataset
 *                   The script variable that contains the data to be provided the search widget, that can be searched onto.
 * @param {string=}  dataset
 *                   The data to be provided the search widget from a live variable or the property panel, that can be searched onto. <br>
 *                   This is a bindable property.
 * @param {string=}  limit
 *                   Limits the search results to be displayed in the auto-complete.
 * @param {string=}  searchkey
 *                   The key to be search in the data provided to the search widget.
 * @param {string=}  displaylabel
 *                   The property to be displayed in the search auto-complete.
 * @param {string=}  imagesource
 *                  This property sets the image to be displayed in the search results.
 * @param {string=}  datafield
 *                   This property sets the dataValue to be returned by a select editor when the list is populated using the dataSet property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the search widget on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} casesensitive
 *                  This property decides whether search will be case-sensitive or not. <br>
 *                  Default value: `false`.
 * @param {string=}  on-submit
 *                  Callback function which will be triggered when the search icon is clicked.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-label caption='Search widget with an array of country list:' width='300px' color='#919191'></wm-label>
                <wm-search name='search-countries' scopedataset='countries'></wm-search>
                <br><br>
                <wm-label caption='Search widget with list of days:' width='300px' color='#919191'></wm-label>
                <wm-search name='search-countries' scopedataset='days' searchkey='day' displaylabel='day'></wm-search>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.countries = new Array("Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burma", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic", "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Greenland", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Mongolia", "Morocco", "Monaco", "Mozambique", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Samoa", "San Marino", " Sao Tome", "Saudi Arabia", "Senegal", "Serbia and Montenegro", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe");
               $scope.days = [
                   {
                       'key':'Sun',
                       'day':'Sunday'
                   },
                   {
                       'key':'Mon',
                       'day':'Monday'
                   },
                   {
                       'key':'Tues',
                       'day':'Tuesday'
                   },
                   {
                       'key':'Wed',
                       'day':'Wednesday'
                   },
                   {
                       'key':'Thurs',
                       'day':'Thursday'
                   },
                   {
                       'key':'Fri',
                       'day':'Friday'
                   },
                   {
                       'key':'Sat',
                       'day':'Saturday'
                   }
               ];
            }
 </file>
 </example>
 */
