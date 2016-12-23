/*global WM,  _ */
/*Directive for rating widget */

WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/advanced/rating.html',
            '<div ng-model="_model_" class="app-ratings" init-widget has-model apply-styles role="input" listen-property="dataset" ng-focus="onFocus($event)">' +
                '<div ng-if="!readonly" class="rating-style">' +
                    '<label ng-class="{active : rate.value <= datavalue}" for="{{$id}}+{{rate.value}}" ng-mouseleave="onMouseleave($event, rate)" ng-mouseover="onMouseover($event, rate)" ng-style="{\'font-size\':iconsize, \'color\': rate.value <= datavalue && iconcolor}" ng-repeat="rate in range track by $index" title="{{rate.label || rate.value}}">' +
                        '<input type="radio" id="{{$id}}+{{rate.value}}" ng-click="getActiveElements($event)" name="{{ratingname}}" value="{{rate.value}}"/>' +
                    '</label>' +
                '</div>' +
                '<div ng-if="readonly" ng-style="{\'font-size\':iconsize}" class="ratings-container disabled" >' +
                    '<div class="ratings active" ng-style="{width: ratingsWidth(), color: iconcolor}"></div>' +
                '</div>' +
            '<label ng-if="showcaptions" class="caption" ng-bind="caption"></label>' +
            '</div>'
            );
    }])
    .directive('wmRating', ['PropertiesFactory', 'WidgetUtilService', 'FormWidgetUtils', 'Utils', '$rootScope', function (PropertiesFactory, WidgetUtilService, FormWidgetUtils, Utils, $rs) {
        'use strict';

        var widgetProps = PropertiesFactory.getPropertiesOf('wm.rating', ['wm.base', 'wm.base.editors']),
            notifyFor = {
                'maxvalue': true,
                'readonly': true,
                'dataset' : true,
                'displayexpression' : true
            },
            DEFAULT_RATING = 5,
            MAX_RATING = 10;

        /*
         * parse dataSet to filter the options based on the datafield, displayfield & displayexpression
         */
        function parseDataSet(dataSet, scope) {
            /*store parsed data in 'data'*/
            var data = dataSet,
                dataField = scope.datafield,
                displayField = FormWidgetUtils.getDisplayField(dataSet, scope.displayfield || scope.datafield);

            /*if filter dataSet if dataField is selected other than 'All Fields'*/
            if (dataField) {
                data = {};
                //Widget selected item dataset will be object instead of array.
                if (WM.isObject(dataSet) && !WM.isArray(dataSet)) {
                    data[WidgetUtilService.getObjValueByKey(dataSet, dataField)] = WidgetUtilService.getEvaluatedData(scope, dataSet, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                } else {
                    _.forEach(dataSet, function (option) {
                        data[WidgetUtilService.getObjValueByKey(option, dataField)] = WidgetUtilService.getEvaluatedData(scope, option, {fieldName: 'displayfield', expressionName: 'displayexpression'}, displayField);
                    });
                }
            }
            return data;
        }

        /*
         * gets the key to map the select options out of dataSet
         * if only one key is there in the option object it returns that key
         * else the default key to be looked is 'dataValue'
         */
        function getKey(optionObject) {
            var keys = Object.keys(optionObject);
            /* if only one key, return it (can be anything other than 'dataValue' as well */
            if (keys.length === 1) {
                return keys[0];
            }

            /* return dataValue to be the default key */
            return 'dataValue';
        }

        /* gets the item whose value is equal to rating value */
        function getLabel(options, i) {
            return _.find(options, function (item) {
                return Math.round(parseInt(item.key, 10)) === i;
            });
        }

        /* returns the rating widget dataset containing the value and label */
        function prepareRatingDataset(maxvalue, options) {
            var i,
                range = [],
                maxValue,
                result;
            maxvalue = parseInt(maxvalue, 10);
            maxValue = maxvalue > MAX_RATING ? MAX_RATING : maxvalue;
            for (i = maxValue || DEFAULT_RATING; i > 0; i--) {
                result = getLabel(options, i);
                if (result) {
                    range.push({'value': i, 'label': result.value});
                } else {
                    range.push({'value': i});
                }
            }
            return range;
        }

        /*function to create the options for the rating widget, based on the different configurations that can be provided.
         Options can be provided as
         * 1. comma separated string, which is captured in the options property of the scope
         * 2. application scope variable which is assigned to the dataSet attribute of the rating widget from the studio.
         * 3. a wm-studio-variable which is bound to the widget's dataSet property.*/
        function createRatingOptions(dataset, scope) {
            /* check for dataSet*/
            if (!dataset) {
                return;
            }
            /*assign dataSet according to liveVariable or other variable*/
            dataset = dataset.hasOwnProperty('data') ? dataset.data : dataset;
            var key;
            /*checking if dataSet is present and it is not a string.*/
            if (dataset && dataset.dataValue !== '') {
                /*initializing select options*/
                scope.selectOptions = [];
                /*check if dataset is array*/
                if (WM.isArray(dataset)) {
                    /*filter the dataSet based on datafield & displayfield*/
                    dataset = parseDataSet(dataset, scope);
                    /* if dataSet is an array of objects, convert it to object */
                    if (WM.isObject(dataset[0])) {
                        key = getKey(dataset[0]);
                        /* if dataSet is an array, convert it to object */
                        _.forEach(dataset, function (option) {
                            scope.selectOptions.push({'key': key, 'value': option.name || option[key]});
                        });
                    } else if (WM.isArray(dataset)) {
                        /* if dataSet is an array, convert it to object */
                        _.forEach(dataset, function (option, index) {
                            scope.selectOptions.push({"key": index + 1, "value": option});
                        });
                    } else if (WM.isObject(dataset)) {
                        _.forEach(dataset, function (val, key) {
                            scope.selectOptions.push({"key": key, "value": val});
                        });
                    }
                } else if (WM.isObject(dataset)) {
                    /*filter the dataSet based on datafield & displayfield*/
                    dataset = parseDataSet(dataset, scope);
                    _.forEach(dataset, function (val, key) {
                        scope.selectOptions.push({"key": key, "value": val});
                    });
                } else {
                    /* if dataSet is an string, convert it to object */
                    if (WM.isString(dataset)) {
                        _.forEach(dataset.split(','), function (opt, index) {
                            opt = opt.trim();
                            scope.selectOptions.push({"key": index + 1, "value": opt});
                        });
                    } else {
                        scope.selectOptions.push({"key": dataset, "value": dataset});
                    }
                }
                scope.range = prepareRatingDataset(scope.maxvalue, scope.selectOptions);
                scope.caption = getCaption(scope);
            }
        }

        /* This function returns the caption for the hovered item or the selected datavalue */
        function getCaption(iScope, selecteditem) {
            var captionItem = _.find(iScope.range, function (item) {
                /* item value can be string / integer*/
                return item.value == (selecteditem ? selecteditem.value : Math.round(parseInt(iScope.datavalue, 10)));
            });
            if (captionItem && captionItem.hasOwnProperty('label')) {
                return captionItem.label;
            }
            if (!iScope.dataset && iScope.displayexpression) { /* set the caption as displayexpression value if there is no dataset bound */
                return iScope.displayexpression;
            }
            return '';
        }

        /* onMouseover of the rating widget */
        function onMouseover(iScope, attrs, evt, item) {
            /* support if the caption is binded in the old projects for backward compatibility*/
            if (!attrs.caption) {
                iScope.caption = getCaption(iScope, item);
            }
            /* apply iconcolor to the rating widget on hover */
            WM.element(evt.target).nextAll().andSelf().css('color', iScope.iconcolor);
        }

        /* onMouseleave of the rating widget */
        function onMouseout(iScope, attrs, $el) {
            /* support if the caption is binded in the old projects for backward compatibility*/
            if (!attrs.caption) {
                iScope.caption = getCaption(iScope);
            }
            /* apply iconcolor to the selected value of rating widget on mouseout*/
            $el.find('label').css('color', '');
            $el.find('label.active').css('color', iScope.iconcolor);
        }

        /* accessibility purpose - on focus of the widget, the up-arrow and down-arrow key press should change the datavalue */
        function onKeyDown(iScope, attrs, event) {
            //prevents the page from scrolling when up and down arrows are used
            if ((event.which === 38) || (event.which === 40)) {
                event.preventDefault();
                event.stopPropagation();
            }

            var action = Utils.getActionFromKey(event);
            /*  if widget is focused and keydown is detected */
            if (iScope.isFocused) {
                if (!iScope.datavalue) {
                    iScope.datavalue = 0;
                }
                /* if up-arrow key is pressed then increase the rating value */
                if (action === 'UP-ARROW') {
                    $rs.$safeApply(iScope, function () {
                        if (iScope.datavalue < iScope.maxvalue) {
                            /* update the datavlue and caption accordingly */
                            iScope.datavalue = iScope.datavalue + 1;
                            /* support if the caption is binded in the old projects for backward compatibility*/
                            if (!attrs.caption) {
                                iScope.caption = getCaption(iScope);
                            }
                        }
                    });
                } else if (action === 'DOWN-ARROW') {  /* if down-arrow key is pressed then decrease the rating value */
                    $rs.$safeApply(iScope, function () {
                        if (iScope.datavalue > 0) {
                            /* update the datavlue and caption accordingly */
                            iScope.datavalue = iScope.datavalue - 1;
                            /* support if the caption is binded in the old projects for backward compatibility*/
                            if (!attrs.caption) {
                                iScope.caption = getCaption(iScope);
                            }
                        }
                    });
                }
            }
        }

        /* function which will be triggered on change of scopedataset */
        function scopeDatasetWatcher(scope, element) {
            /*if studio-mode, then update the displayField & dataField in property panel*/
            if (scope.widgetid) {
                WidgetUtilService.updatePropertyPanelOptions(scope);
            }
            createRatingOptions(scope.scopedataset, scope, element);
        }


        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, attrs, key, newVal) {
            switch (key) {
            case 'dataset':
                /*if studio-mode, then update the displayField & dataField in property panel*/
                if (WM.isDefined(newVal) && newVal !== null) {
                    //Get variable and properties map only on binddataset change
                    createRatingOptions(scope.dataset, scope);
                }

                break;
            case 'maxvalue':
                if (!scope.dataset) {
                    scope.range = prepareRatingDataset(newVal);
                    /* support if the caption is binded in the old projects for backward compatibility*/
                    if (!attrs.caption) {
                        scope.caption = getCaption(scope);
                    }
                }
                scope.ratingname = 'ratings-' + scope.$id;
                break;
            case 'displayexpression':
                if (!scope.dataset) {
                    scope.caption = newVal;
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'scopedataset': '=?'
            },
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/advanced/rating.html'),
            'link': {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                    /*  flag to set if the rating widget is focused or not */
                    scope.isFocused = false;

                },
                'post': function (iScope, $el, attrs) {
                    if (WM.isString(iScope.datavalue)) {
                        iScope.datavalue = parseInt(iScope.datavalue, 10);
                    }

                    /* this function sets the caption */
                    /* support if the caption is binded in the old projects for backward compatibility*/
                    if (!attrs.caption) {
                        iScope.caption = getCaption(iScope);
                    }

                    /*  onMouseover of the rating widget apply the iconcolor  */
                    iScope.onMouseover = onMouseover.bind(undefined, iScope, attrs);

                    /* This function is called onMouseleave of the rating widget */
                    iScope.onMouseleave = onMouseout.bind(undefined, iScope, attrs, $el);

                    /*  This function is called when the rating widget is focused  */
                    iScope.onFocus = function () {
                        iScope.isFocused = true;
                    };

                    /* keydown events for accessibility  */
                    $el.bind('keydown', onKeyDown.bind(undefined, iScope, attrs));

                    iScope.getActiveElements = function ($event) {
                        iScope._model_ = $el.find(':checked').val();
                        /* support if the caption is binded in the old projects for backward compatibility*/
                        if (!attrs.caption) {
                            iScope.caption = getCaption(iScope);
                        }
                        iScope._onChange($event);
                    };

                    /* get the ratingsWidth for readonly mode */
                    iScope.ratingsWidth = function () {
                        var dataValue = parseFloat(iScope.datavalue),
                            starWidth = 0.925,
                            maxValue = parseInt(iScope.maxvalue, 10) || DEFAULT_RATING;
                        $el.find('.ratings-container').css("width", (starWidth * maxValue) + 'em');
                        if (iScope.datavalue === undefined || iScope.datavalue === '' || iScope.datavalue === null) {
                            return 0;
                        }
                        if (dataValue <= maxValue && dataValue >= 0) {
                            return dataValue * starWidth + 'em';
                        }
                        if (dataValue > maxValue) {
                            return maxValue * starWidth + 'em';
                        }
                    };

                    /*Called from form reset when users clicks on form reset*/
                    iScope.reset = function () {
                        iScope.datavalue = '';
                    };

                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, iScope, attrs), iScope, notifyFor);
                    WidgetUtilService.postWidgetCreate(iScope, $el, attrs);


                    /* fields defined in scope: {} MUST be watched explicitly */
                    /*watching scopedataset attribute to create options for the select element.*/
                    if (!attrs.widgetid && attrs.scopedataset) {
                        iScope.$watch('scopedataset', scopeDatasetWatcher.bind(undefined, iScope, $el));
                    }

                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmRating
 * @restrict E
 *
 * @description
 * The `wmRating` directive defines the rating widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 *
 * @param {string=} caption
 *                  This property specifies the label of the rating. <br>
 *                  This property is bindable.
 * @param {string=} name
 *                  Name of the rating widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the button widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {string=} scopedatavalue
 *                  This property accepts the initial value for the rating widget from a variable defined in the script workspace. <br>
 * @param {string=} datavalue
 *                  This property defines the initial selected value of the rating widget.
 * @param {string=} dataset
 *                  This property accepts the options to create the rating widget from a wavemaker studio variable which is of datatype entry.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by the rating widget when the data is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the caption to show in the rating widget when the data is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the  rating widget's caption. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable. <br>
 *                      For readonly mode, If dataset is null then the caption can be bound directly to display expression.
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the button widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} showcaptions
 *                  This property will show the captions for the widget if set to true. Default value is true.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div ng-controller="Ctrl" class="wm-app">
 *               <wm-rating
 *                   caption="{{caption}}"
 *                   on-click="f('click');"
 *                   datavalue="{{datavalue}}"
 *                   maxvalue="{{maxvalue}}"
 *                   datafield="{{datafield}}"
 *                   displayfield="{{displayfield}}"
 *                   scopedataset="data"
 *                   >
 *               </wm-rating><br>
 *                   <br>
 *               <wm-composite>
 *                    <wm-label caption="scopedataset:"></wm-label>
                    <label>{{data}}</label>
                </wm-composite>
                 <wm-composite>
                     <wm-label caption="datafield:"></wm-label>
                     <wm-text readonly="true"
                     scopedatavalue="datafield">
                     </wm-text>
                 </wm-composite>
                 <wm-composite>
                     <wm-label caption="displayfield:"></wm-label>
                     <wm-text readonly="true"
                     scopedatavalue="displayfield">
                     </wm-text>
                 </wm-composite>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.maxvalue = 5;
 *              $scope.datavalue = 2;
 *              $scope.data = [
                        {
                          "label": "good",
                          "value": "1"
                        },
                        {
                          "label": "vgood",
                          "value": "2"
                        },
                        {
                          "label": "awesome",
                          "value": "3"
                        },
                        {
                          "label": "excellent",
                          "value": "4"
                        },
                        {
                          "label": "outstanding",
                          "value": "5"
                        }
                        ];
                $scope.datafield =  "value";
                $scope.displayfield = "label";
 *              $scope.f = function (eventtype) {
 *                  $scope[eventtype + 'Count']++;
 *              }
 *           }
 *       </file>
 *   </example>
 */
