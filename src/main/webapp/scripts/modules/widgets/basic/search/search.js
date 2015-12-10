/*global WM */
/*jslint todo: true */
/*Directive for search */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/searchlist.html',
            '<a>' +
                '<img data-ng-src="{{match.model.wmImgSrc}}" data-ng-if="match.model.wmImgSrc" width="16">' +
                '<span bind-html-unsafe="match.label | typeaheadHighlight:query"></span>' +
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
                    '<input title="{{hint}}" data-ng-if="dataSetType === \'listOfObjects\'" type="text" class="app-textbox form-control" placeholder="{{placeholder}}" ' +
                        'data-ng-model="query"' +
                        ' accesskey="{{shortcutkey}}"' +
                        'uib-typeahead="item[displaylabel] for item in itemList | filter:{\'{{searchkey}}\':$viewValue} | limitTo:limit" ' +
                        'typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                        'typeahead-template-url="template/widget/form/searchlist.html"' +
                    '>' +
                    '<input title="{{hint}}" data-ng-if="dataSetType === \'listOfStrings\'" type="text" class="app-textbox form-control" placeholder="{{placeholder}}"' +
                        'data-ng-model="query"' +
                        ' accesskey="{{shortcutkey}}"' +
                        'uib-typeahead="item for item in itemList | filter:$viewValue | limitTo:limit" ' +
                        'typeahead-on-select="onTypeAheadSelect($event, $item, $model, $label)"' +
                        'typeahead-template-url="template/widget/form/searchlist.html"' +
                    '>' +
                '<span class="input-group-addon" data-ng-if="dataSetType === \'listOfObjects\' || dataSetType === \'listOfStrings\'" >' +
                    '<form data-ng-submit="onSubmit({$event: $event, $scope: this})" >' +
                        '<button title="Search" class="app-search-button glyphicon glyphicon-search" type="submit" ' +
                            'data-ng-click="onTypeAheadSelect($event, $item, $model, $label)"' +
                        '></button>' +
                    '</form>' +
                '</span>' +
            '</div>'
            );
    }])
    .directive('wmSearch', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'CONSTANTS', 'Utils', function (PropertiesFactory, $templateCache, WidgetUtilService, CONSTANTS, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.search', ['wm.base']),
            dataSetRegEx = new RegExp(/scopedataset\./ig),
            notifyFor = {
                'searchkey': true,
                'displaylabel': true,
                'dataset': true,
                'displayimagesrc': true,
                "active": true
            };

        /* to filter & set the dataset property of the search widget */
        function setDataSet(data, scope) {
            /*sanity check for data availability*/
            if (!data) {
                /*checking if dataSetType is available or not*/
                if (!scope.dataSetType && !scope.binddataset) {
                    scope.dataSetType = 'listOfStrings';
                } else if (scope.binddataset) {
                    scope.dataSetType = 'listOfObjects';
                }
                /*checking if itemList is available or not*/
                if (!scope.itemList) {
                    scope.itemList = [];
                }
                return;
            }
            /*check for run-mode*/
            if (CONSTANTS.isRunMode) {
                /* get the variable-data w.r.t the variable type */
                data = (data && data.data) || data;
                /*set data-set*/
                var dataSet = Utils.getClonedObject(data);
                /*if data-set is an array, show the 'listOfObjects' mode*/
                if (WM.isArray(dataSet)) {
                    /*check if dataSet contains list of objects, then switch to 'listOfObjects', else display 'default'*/
                    if (WM.isObject(dataSet[0])) {
                        scope.dataSetType = 'listOfObjects';
                        WM.forEach(dataSet, function (eachItem, index) {
                            /*convert display-label-value to string, as ui.typeahead expects only strings*/
                            dataSet[index][scope.displaylabel] = eachItem[scope.displaylabel] && eachItem[scope.displaylabel].toString();
                            /*to save all the image urls*/
                            dataSet[index].wmImgSrc = eachItem[scope.displayimagesrc];
                        });
                    } else {
                        scope.dataSetType = 'listOfStrings';
                        /*convert all the values in the array to strings*/
                        WM.forEach(dataSet, function (val, index) {
                            dataSet[index] = val.toString();
                        });
                    }

                    /*set the itemList*/
                    scope.itemList = dataSet;

                } else if (WM.isString(dataSet) && dataSet.trim()) {
                    /*make the string an array, for ex. => if dataSet is 1,2,3 then make it [1,2,3] */
                    setDataSet(dataSet.split(','), scope);
                } else if (WM.isObject(dataSet)) {
                    setDataSet(Object.keys(dataSet).join(','), scope);
                }
            }
        }

        /*
         * update search-key, display-label in the property panel
         */
        function updatePropertyPanelOptions(dataset, scope) {
            var variableKeys = [];
            /* on binding of data*/
            if (dataset) {
                dataset = dataset[0] || dataset;
                variableKeys = WM.isObject(dataset) && !WM.isArray(dataset) ? Object.keys(dataset || {}) : [];
            }

            /* re-initialize the property values */
            if (scope.newcolumns) {
                scope.newcolumns = false;
                scope.searchkey = '';
                scope.displaylabel = '';
                scope.datafield = '';
                scope.$root.$emit("set-markup-attr", scope.widgetid, {'searchkey': scope.searchkey, 'datafield': scope.datafield, 'displaylabel': scope.displaylabel});
            }

            /* assign all the keys to the options of the search widget */
            scope.widgetProps.searchkey.options = scope.widgetProps.displaylabel.options = scope.widgetProps.displayimagesrc.options = [''].concat(variableKeys);
            scope.widgetProps.datafield.options = ['All Fields'].concat(variableKeys);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'searchkey':
                scope.searchkey = newVal && newVal.replace(dataSetRegEx, '');
                break;
            case 'displaylabel':
                scope.displaylabel = newVal && newVal.replace(dataSetRegEx, '');
                break;
            case 'dataset':
                /*if studio-mode, then update the search-key, display-label in property panel*/
                if (scope.widgetid) {
                    updatePropertyPanelOptions((newVal && newVal.data) || newVal, scope);
                }
                /* set the datatSet of the widget*/
                setDataSet(newVal, scope);
                break;
            case 'displayimagesrc':
                scope.displayimagesrc = newVal;
                break;
            case 'active':
                /*listening on 'active' property, as losing the properties during page switch*/
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (scope.widgetid && newVal) {
                    updatePropertyPanelOptions((scope.dataset && scope.dataset.data) || scope.dataset, scope);
                }
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
            'template': $templateCache.get('template/widget/form/search.html'),
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {

                        /* In Studio mode aways display the input box */
                        if (CONSTANTS.isStudioMode) {
                            scope.dataSetType = "listOfStrings";
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        /* on-select of type-ahead element, call the user-defined submit fn*/
                        scope.onTypeAheadSelect = function ($event, $item, $model, $label) {
                            $event = $event || {};
                            /* 'wmImgSrc' attr is found for the item select, then delete it */
                            if ($item && $item.wmImgSrc) {
                                $item = Utils.getClonedObject($item);
                                delete $item.wmImgSrc;
                            }
                            /* add the selected object to the event.data and send to the user */
                            $event.data = {'item': $item, 'model': $model, 'label': $label, 'query': element.find('input').val()};

                            /* set selected item on widget's exposed property */
                            scope.datavalue = (scope.datafield && scope.datafield !== 'All Fields') ? $item[scope.datafield] : $item;

                            /* call user 'onSubmit' fn */
                            scope.onSubmit({$event: $event, $scope: scope});
                        };

                        /* fields defined in scope: {} MUST be watched explicitly */
                        /*watching model attribute to the data for the search element.*/
                        scope.$watch('scopedataset', function (newVal) {
                            setDataSet(newVal, scope);
                        });

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
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