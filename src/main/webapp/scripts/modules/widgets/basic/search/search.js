/*global WM, _ */
/*jslint todo: true */
/*Directive for search */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/searchlist.html',
            '<a>' +
                '<img data-ng-src="{{match.model.wmImgSrc}}" data-ng-if="match.model.wmImgSrc" width="16">' +
                '<span ng-bind-html="match.label | uibTypeaheadHighlight:query"></span>' +
            '</a>'
            );
        $templateCache.put('template/widget/form/search.html',
            '<div class="app-search input-group" init-widget has-model' +
                ' data-ng-show="show"' +
                ' data-ng-style="{' +
                    ' color: color, ' +
                    ' height: height, ' +
                    ' width: width, ' +
                    ' cursor: cursor, ' +
                    ' fontFamily: fontfamily, ' +
                    ' fontSize: fontsize, ' +
                    ' fontWeight: fontweight, ' +
                    ' fontStyle: fontstyle, ' +
                    ' opacity: opacity, ' +
                    ' textDecoration: textdecoration, ' +
                    ' whiteSpace: whitespace, ' +
                    ' wordBreak: wordbreak, ' +
                    ' zIndex: zindex' +
                ' }">' +
                    '<input title="{{hint}}" data-ng-if="dataSetType === \'listOfObjects\'" type="text" class="app-textbox form-control list-of-objs" placeholder="{{placeholder}}" ' +
                        'data-ng-model="query"' +
                        ' tabindex="{{tabindex}}"' +
                        ' accesskey="{{shortcutkey}}"' +
                        ' ng-readonly="readonly" ' +
                        ' ng-required="required" ' +
                        ' ng-disabled="disabled" ' +
                        'uib-typeahead="item.wmDisplayLabel for item in itemList | _custom_search_filter:searchkey:$viewValue:casesensitive | limitTo:limit" ' +
                        'typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                        'typeahead-template-url="template/widget/form/searchlist.html"' +
                    '>' +
                    '<input title="{{hint}}" data-ng-if="dataSetType === \'listOfStrings\'" type="text" class="app-textbox form-control list-of-strings" placeholder="{{placeholder}}"' +
                        'data-ng-model="query"' +
                        ' accesskey="{{shortcutkey}}"' +
                        ' tabindex="{{tabindex}}"' +
                        ' ng-readonly="readonly" ' +
                        ' ng-required="required" ' +
                        ' ng-disabled="disabled" ' +
                        'uib-typeahead="item for item in itemList | filter:$viewValue:casesensitive | limitTo:limit" ' +
                        'typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                        'typeahead-template-url="template/widget/form/searchlist.html"' +
                    '>' +
                '<span class="input-group-addon" data-ng-class="{\'disabled\': disabled}" data-ng-if="showSearchIcon" >' +
                    '<form data-ng-submit="onSubmit({$event: $event, $scope: this})" >' +
                        '<button title="Search" data-ng-disabled="disabled" class="app-search-button wi wi-search" type="submit" ' +
                            'data-ng-click="onTypeAheadSelect($event, $item, $model, $label)"' +
                        '></button>' +
                    '</form>' +
                '</span>' +
            '</div>'
            );
        // this template is specify to search widget in mobile-navbar
        $templateCache.put('template/widget/form/navsearch.html',
            '<div class="app-mobile-search" init-widget has-model>' +
                '<input title="{{hint}}" data-ng-if="dataSetType === \'listOfObjects\'" type="text" class="form-control list-of-objs" placeholder="{{placeholder}}" ' +
                    'data-ng-model="query"' +
                    ' accesskey="{{shortcutkey}}"' +
                    ' ng-readonly="readonly" ' +
                    ' ng-required="required" ' +
                    ' ng-disabled="disabled" ' +
                    'uib-typeahead="item.wmDisplayLabel for item in itemList | _custom_search_filter:searchkey:$viewValue:casesensitive | limitTo:limit" ' +
                    'typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                    'typeahead-template-url="template/widget/form/searchlist.html"' +
                '>' +
                '<input title="{{hint}}" data-ng-if="dataSetType === \'listOfStrings\'" type="text" class="form-control list-of-strings" placeholder="{{placeholder}}"' +
                    'data-ng-model="query"' +
                    ' accesskey="{{shortcutkey}}"' +
                    ' ng-readonly="readonly" ' +
                    ' ng-required="required" ' +
                    ' ng-disabled="disabled" ' +
                    'uib-typeahead="item for item in itemList | filter:$viewValue:casesensitive | limitTo:limit" ' +
                    'typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                    'typeahead-template-url="template/widget/form/searchlist.html"' +
                '>' +
                '<i class="btn-close wi wi-cancel" data-ng-show="showClosebtn" data-ng-click="clearText();"></i>' +
            '</div>'
            );
    }])
    .filter('_custom_search_filter', function () {
        'use strict';
        return function (entries, keys, val, casesensitive) {
            // filter the entries based on the $is.searchkey and the input
            if (!keys) {
                return entries;
            }

            keys = keys.split(',');

            return _.filter(entries, function (entry) {
                return keys.some(function (key) {
                    var a = entry[key], b = val;
                    if (!casesensitive) {
                        a = a && a.toString().toLowerCase();
                        b = b && b.toString().toLowerCase();
                    }
                    return _.includes(a, b);
                });
            });
        };
    })
    .directive('wmSearch', ['PropertiesFactory', 'WidgetUtilService', 'CONSTANTS', 'Utils', '$timeout', 'FormWidgetUtils', function (PropertiesFactory, WidgetUtilService, CONSTANTS, Utils, $timeout, FormWidgetUtils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.search', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors']),
            notifyFor = {
                'searchkey': true,
                'displaylabel': true,
                'dataset': true,
                'displayimagesrc': true,
                'active': true,
                'type': true
            };

        // to filter & set the dataset property of the search widget
        function setDataSet(data, scope) {
            // sanity check for data availability
            if (!data) {
                // checking if dataSetType is available or not
                if (!scope.dataSetType && !scope.binddataset) {
                    scope.dataSetType = 'listOfStrings';
                } else if (scope.binddataset) {
                    scope.dataSetType = 'listOfObjects';
                }

                // checking if itemList is available or not
                if (!scope.itemList) {
                    scope.itemList = [];
                }
                return;
            }

            if (CONSTANTS.isRunMode) {
                // get the variable-data w.r.t the variable type
                data = (data && data.data) || data;
                // set data-set
                var dataSet = Utils.getClonedObject(data);
                // if data-set is an array, show the 'listOfObjects' mode
                if (WM.isArray(dataSet)) {
                    dataSet = FormWidgetUtils.getOrderedDataSet(dataSet, scope.orderby);
                    // check if dataSet contains list of objects, then switch to 'listOfObjects', else display 'default'
                    if (WM.isObject(dataSet[0])) {
                        scope.dataSetType = 'listOfObjects';
                        WM.forEach(dataSet, function (eachItem, index) {
                            // convert display-label-value to string, as ui.typeahead expects only strings
                            dataSet[index].wmDisplayLabel = WidgetUtilService.getEvaluatedData(scope, eachItem, {expressionName: 'displaylabel'});
                            // to save all the image urls
                            dataSet[index].wmImgSrc = WidgetUtilService.getEvaluatedData(scope, eachItem, {expressionName: 'displayimagesrc'});
                        });
                    } else {
                        scope.dataSetType = 'listOfStrings';
                        // convert all the values in the array to strings
                        WM.forEach(dataSet, function (val, index) {
                            dataSet[index] = val.toString();
                        });
                    }

                    // set the itemList
                    scope.itemList = dataSet;

                } else if (WM.isString(dataSet) && dataSet.trim()) {
                    // make the string an array, for ex. => if dataSet is 1,2,3 then make it [1,2,3]
                    setDataSet(dataSet.split(','), scope);
                } else if (WM.isObject(dataSet)) {
                    setDataSet(Object.keys(dataSet).join(','), scope);
                }
            }
        }

        // update search-key, display-label in the property panel
        function updatePropertyPanelOptions(dataset, scope) {

            // re-initialize the property values
            if (scope.newcolumns) {
                scope.newcolumns = false;
                scope.searchkey = '';
                scope.displaylabel = '';
                scope.datafield = '';
                scope.$root.$emit("set-markup-attr", scope.widgetid, {'searchkey': scope.searchkey, 'datafield': scope.datafield, 'displaylabel': scope.displaylabel});
            }

            // assign all the keys to the options of the search widget
            if (CONSTANTS.isStudioMode && WM.isDefined(dataset) && dataset !== null) {
                WidgetUtilService.updatePropertyPanelOptions(dataset.data || dataset, dataset.propertiesMap, scope);
            }
        }

        // update the query and datavalue before submit.
        function onsearchSubmit($is) {
            if ($is.onSearch) {
                $is.onSearch({$scope: $is});
            }
        }

        // onkeyup show the close icon.
        function onKeyUp(scope, element, event) {
            var $navbarElScope,
                _action,
                inputVal = element.find('input').val();

            if (element.hasClass('app-mobile-search')) {
                //update query on the input val change
                $navbarElScope = element.closest('[data-role="mobile-navbar"]').isolateScope();
                $navbarElScope.query = inputVal;
                scope.query = inputVal;

                _action = Utils.getActionFromKey(event);
                if (_action === 'ENTER') {
                    onsearchSubmit($navbarElScope, element);
                }
            }

            scope.$evalAsync(function () {
                scope.showClosebtn = (inputVal !== '');
            });
        }

        // this function updates the search widgets query if datavalue is set.
        function updateQuery(scope, element) {
            if (scope.datavalue) {
                var ctrl, newVal;

                $timeout(function () {
                    var deregister = scope.$watch(function () {
                        var $ele;
                        if (scope.dataSetType === 'listOfObjects') {
                            $ele = element.find('input.list-of-objs');
                        } else {
                            $ele = element.find('input.list-of-strings');
                        }
                        ctrl = $ele.controller('uibTypeahead');
                        if (ctrl) {
                            deregister(); // deregister the watch.

                            newVal = scope.datavalue;
                            // set the query based on datavalue
                            if (WM.isString(newVal)) {
                                scope.query = scope.datavalue;
                            } else if (WM.isObject(newVal)) {
                                if (scope.searchkey) {
                                    scope.query = newVal[scope.searchkey] || '';
                                }
                            }
                            // show the close icon if query is set by default
                            if (scope.query.length > 0) {
                                scope.showClosebtn = true;
                            }

                        }
                    });
                });
            }
        }

        // depending on the dataSetType the default query is updated.
        function setupDataSetTypeListner(scope, element) {
            scope._datasetTypeListener = scope.$watch('dataSetType', function () {
                if (scope.datavalue) {
                    updateQuery(scope, element);
                }
            });
        }

        //Toggles search icon based on the type of search and dataset type
        function toggleSearchIcon(scope, type) {
            if (CONSTANTS.isRunMode) {
                scope.showSearchIcon = _.includes([type, scope.type], 'search');
                return;
            }

            scope.showSearchIcon = type === 'search' && _.includes(['listOfObjects', 'listOfStrings'], scope.dataSetType);
        }


        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'dataset':
                // if studio-mode, then update the search-key, display-label in property panel
                if (scope.widgetid) {
                    updatePropertyPanelOptions(newVal, scope);
                }
                // set the datatSet of the widget
                setDataSet(newVal, scope);
                break;
            case 'active':
                /*listening on 'active' property, as losing the properties during page switch
                if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && newVal) {
                    updatePropertyPanelOptions(scope.dataset, scope);
                }
                break;
            case 'type':
                toggleSearchIcon(scope, newVal);
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'scopedataset': '=?',
                'onSubmit': '&'
            },
            'template': function (tElement, tAttrs) {
                var template, url = '';
                if (tAttrs.navsearchbar) {
                    url = 'template/widget/form/navsearch.html';
                } else {
                    url = 'template/widget/form/search.html';
                }
                template = WM.element(WidgetUtilService.getPreparedTemplate(url, tElement, tAttrs));
                return template[0].outerHTML;
            },
            'compile': function () {
                return {
                    'pre': function (scope) {
                        if (CONSTANTS.isStudioMode) {
                            scope.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            scope.widgetProps = widgetProps;
                        }
                        scope.widgetDataset = {};
                    },
                    'post': function (scope, element, attrs) {

                        var wp, searchItem;
                        // In Studio mode aways display the input box
                        if (CONSTANTS.isStudioMode) {
                            scope.dataSetType = "listOfStrings";
                            //Hiding the events as there is no support for them.
                            if (scope.widgetid) {
                                wp                   = scope.widgetProps;
                                wp.onClick.show      = false;
                                wp.onTap.show        = false;
                                wp.onMouseenter.show = false;
                                wp.onMouseleave.show = false;
                                wp.onFocus.show      = false;
                                wp.onBlur.show       = false;
                                wp.onChange.show     = false;
                            }
                        }

                        // register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        // on-select of type-ahead element, call the user-defined submit fn
                        scope.onTypeAheadSelect = function ($event, $item, $model, $label) {
                            $event = $event || {};
                            // 'wmImgSrc' attr is found for the item select, then delete it
                            if ($item && $item.wmImgSrc) {
                                $item = Utils.getClonedObject($item);
                                delete $item.wmImgSrc;
                            }
                            //store the previous item to make the button click functional
                            $item = searchItem = $item || (scope.datavalue === searchItem[scope.datafield] ? searchItem : undefined);

                            // add the selected object to the event.data and send to the user
                            $event.data = {'item': $item, 'model': $model, 'label': $label, 'query': element.find('input').val()};

                            // set selected item on widget's exposed property
                            scope.datavalue = (scope.datafield && scope.datafield !== 'All Fields') ? ($item  && $item[scope.datafield]) : $item;

                            // call user 'onSubmit' fn
                            scope.onSubmit({$event: $event, $scope: scope});
                        };

                        // this functions clears the input value
                        scope.clearText = function () {
                            element.find('input').val('');
                            scope.showClosebtn = false;
                        };

                        //Watch to set input value on change of data value
                        scope.$watch('datavalue', function (newVal) {
                            element.find('input').val(newVal || '');
                        });

                        // set the searchquery if the datavalue exists.
                        if (CONSTANTS.isRunMode) {
                            // keyup event to enable/ disable close icon of the search input.
                            element.bind('keyup', onKeyUp.bind(undefined, scope, element));

                            setupDataSetTypeListner(scope, element);
                        }
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                        element.removeAttr('tabindex');

                        /* fields defined in scope: {} MUST be watched explicitly
                         watching model attribute to the data for the search element.*/
                        if (attrs.scopedataset) {
                            _.defer(function () {
                                scope.$watch('scopedataset', function (newVal) {
                                    setDataSet(newVal, scope);
                                });
                            });
                        }
                    }
                };
            }
        };
    }]);

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
            <div data-ng-controller="Ctrl" class="wm-app">
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
