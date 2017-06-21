/*global WM, _ */
/*Directive for chips */
WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/chips.html',
            '<ul class="app-chips nav nav-pills list-inline" init-widget has-model apply-styles role="input" ng-keydown="handleDeleteKeyPressEvent($event)" tabindex="0" listen-property="dataset"' +
                ' title="{{hint}}" ' +
                ' ng-model="_model_">' +
                    '<li ng-repeat="chip in selectedChips track by $index" ng-click="setActiveStates(chip)" ng-dblclick="makeEditable(chip)" ng-class="{\'active\': chip.active, \'disabled\': disabled}">' +
                        '<a class="app-chip" href="javascript:void(0);" ng-if="!chip.edit" ng-class="{\'chip-duplicate bg-danger\': chip.isDuplicate, \'chip-picture\': chip.wmImgSrc}">' +
                            '<img data-identifier="img" class="button-image-icon" ng-src="{{chip.wmImgSrc}}"  ng-if="chip.wmImgSrc"/>' +
                            '{{chip.key}}' +
                             //type="button" need to be added since chips inside form is treated as submit hence on enter key press, ng-click is triggered
                            '<button type="button" class="btn btn-transparent" ng-click="removeItem($event, $index)" ng-if="!readonly"><i class="app-icon wi wi-close"></i></button>' +
                        '</a>' +
                        '<input class="app-chip-input" type="text" ng-if="chip.edit" ng-keydown="handleEnterKeyPressEvent($event, chip)" ng-model="chip.fullValue"/>' +
                    '</li>' +
                    '<li ng-show="!(readonly || saturate)">' +
                        '<wm-search ng-show="!isWidgetInsideCanvas" name="app-chip-search" class="app-chip-input" disabled="{{disabled}}" dataset="{{binddataset}}" orderby="{{orderby}}" datavalue="bind:datavalue" ' +
                            'searchkey="{{searchkey || displayfield}}" allowonlyselect="allowonlyselect" displaylabel="{{binddisplayexpression || displayfield || displaylabel}}" ' +
                            'displayimagesrc="{{displayimagesrc || binddisplayimagesrc}}" datafield="{{datafield}}" placeholder="{{placeholder}}" on-select="addItem($event, $scope)" ' +
                            'on-focus="resetActiveState()" on-keydown="handleKeyPressEvent($event, $scope)" ng-click="updateStates($event)" dataoptions="dataoptions" showsearchicon="false">' +
                        '</wm-search>' +
                        '<input type="text" class="form-control" ng-if="isWidgetInsideCanvas" ng-attr-placeholder="{{placeholder}}">' +
                    '</li>' +
            '</ul>'
            );
    }])
    .directive('wmChips', [
        'PropertiesFactory',
        'WidgetUtilService',
        'Utils',
        'FormWidgetUtils',
        'LiveWidgetUtils',
        '$rootScope',
        '$timeout',
        function (PropertiesFactory, WidgetUtilService, Utils, FormWidgetUtils, LiveWidgetUtils, $rs, $timeout) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.chips', ['wm.base', 'wm.base.editors.dataseteditors']),
                notifyFor   = {
                    'dataset'       : true,
                    'displayfield'  : true,
                    'datafield'     : true
                },
                KEYS  = {
                    'BACKSPACE' : 'BACKSPACE',
                    'ENTER'     : 'ENTER',
                    'DELETE'    : 'DELETE',
                    'TAB'       : 'TAB'
                },
                ignoreUpdate,
                displayField;

            //Check if newItem already exists
            function isDuplicate($s, newItemObject) {
                return _.findIndex($s.selectedChips, newItemObject) > -1;
            }

            //constructs and returns a chip item object
            function constructChip($s, displayValue, dataValue, imgSrcValue) {
                //When data field is not provided, set display value as data value
                if (!dataValue) {
                    dataValue   = displayValue;
                }
                var chipObj = {
                    'key'       : displayValue,
                    'value'     : dataValue,
                    'wmImgSrc'  : imgSrcValue,
                    'fullValue' : displayValue + ' <' + dataValue + '>'
                };
                chipObj.isDuplicate = isDuplicate($s, chipObj);
                return chipObj;
            }

            //Evaluates and returns the display, data and image values based on the options chosen
            function getEvaluatedValues($s, chip) {
                //Support of display expression
                var displayValue = WidgetUtilService.getEvaluatedData($s, chip, {fieldName: 'displayfield', expressionName: 'displayexpression'}),
                    dataValue = $s.datafield === 'All Fields' ? displayValue : Utils.getEvaluatedExprValue(chip, $s.datafield),
                    imageFieldValue   =  $s.binddisplayimagesrc ? WidgetUtilService.getEvaluatedData($s, chip, {expressionName: 'displayimagesrc'}) : _.get(chip, $s.displayimagesrc);
                return {
                    'displayField' : displayValue,
                    'dataField'    : dataValue,
                    'imageField'   : imageFieldValue
                };
            }

            //takes dataObj as input evaluates the  values and returns chip object
            function createChip($s, dataObj) {
                var values = getEvaluatedValues($s, dataObj);
                if (displayField) {
                    return $s.constructChip(values.displayField, values.dataField, values.imageField);
                }
                return $s.constructChip(dataObj);
            }

            //resets the query model of search
            function resetSearchModel(searchScope) {
                if (searchScope) {
                    $rs.$safeApply(searchScope, function () {
                        //clear search value
                        searchScope.datavalue = '';
                        searchScope.queryModel = '';
                    });
                }
            }

            //tries to get the chip from existing dataset, if not exists adds to the chips and returns it
            function getChip($s, ele) {
                if (_.isEmpty($s.chips)) {
                    return;
                }
                var newItemObject,
                    searchScope = $s.searchScope,
                    queryModel = _.get(searchScope, 'queryModel'),
                    key,
                    value,
                    filterObj = {},
                    values = queryModel ? getEvaluatedValues($s, queryModel) : {},
                    imgSrc;

                ele = ele || searchScope.query;
                key =  _.get(values, 'displayField') || ele;
                imgSrc =  _.get(values, 'imageField');
                value = ($s.datafield !== 'All Fields' && _.get(values, 'dataField')) || ele;
                if (key) {
                    filterObj.key = key;
                }
                if (value) {
                    filterObj.value = value;
                }
                if (imgSrc) {
                    filterObj.wmImgSrc = imgSrc;
                }

                newItemObject = _.find($s.chips, filterObj);

                //Add the selected item to chips if not present in current dataset
                if (!newItemObject && searchScope) {
                    if (WM.isObject(queryModel)) {
                        $s.chips.push(createChip($s, queryModel));
                        newItemObject = _.find($s.chips, filterObj);
                    } else if (!$s.allowonlyselect) {
                        newItemObject = $s.constructChip(ele);
                        $s.chips.push(newItemObject);
                    }
                }
                resetSearchModel(searchScope);
                return newItemObject;

            }

            //Update the selected chips
            function updateSelectedChips(chips, $s) {
                //Ignore _model_ update when it triggered by within the widget
                if (ignoreUpdate) {
                    ignoreUpdate = false;
                    return;
                }
                var values,
                    chip,
                    value;
                chips = chips || [];
                /*
                * 1. In case of variable's  first record, it will be object
                * 2. In case of datavalue it will be string, In case of form, filter on field chosen, chips will be array of strings
                * 3. In case of default chips it will be array of objects
                */
                $s.selectedChips = [];
                if (WM.isObject(chips) && !WM.isArray(chips)) {
                    values = getEvaluatedValues($s, chips);
                    $s.selectedChips.push($s.constructChip(values.displayField, values.dataField, values.imageField));
                } else if (!WM.isArray(chips) || (WM.isArray(chips) && !WM.isObject(_.first(chips)))) {
                    if ($s.datafield === 'All Fields') {
                        return;
                    }
                    //If chips is empty array_.split gives [''], which leads issue in filter reset so initialize with []
                    values  = chips.length ? _.split(chips, ',') : [];
                    _.forEach(values, function (ele) {
                        ele = _.trim(ele);
                        value = parseFloat(ele, 10);
                        ele = isNaN(value) ? ele : value;
                        //find chip object from dataset to get value and img source
                        chip = getChip($s, ele);
                        // ele also need to be send since in security chips, there will not be any dataset
                        $s.selectedChips.push($s.constructChip(_.get(chip, 'key') || ele, _.get(chip, 'value'), _.get(chip, 'wmImgSrc')));
                    });
                } else {
                    $s.selectedChips = chips;
                }
                $timeout(function () {
                    resetSearchModel($s.searchScope);
                }, 50);
            }

            //Create list of options for the search
            function createSelectOptions($s, dataset) {
                var chips          = [],
                    value           = $s.value || $s.datavalue;
                displayField = $s.displayfield || $s.displayexpression || $s.binddisplayexpression;
                //Avoiding resetting empty values
                if (($s.binddataset || $s.scopedataset) && (!displayField && !$s.datavalue)) {
                    return;
                }

                $s.chips.length = 0;
                if (WM.isArray(dataset) && dataset.length) {
                    chips = _.map(dataset, function (dataObj) {
                        return createChip($s, dataObj);
                    });
                }
                $s.chips         = chips;
                //Default chips showing Option1, Option2, Option3 on drag and drop where it has only dataset but not binddataset or scopedataset
                if (!$s.binddataset && !$s.scopedataset) {
                    updateSelectedChips(Utils.getClonedObject(chips), $s);
                } else if (value) {
                    //Creating chips in form based on the value
                    updateSelectedChips(value, $s);
                }
            }

            //get the boolean value
            function getBooleanValue(val) {
                if (val === true || val === 'true') {
                    return true;
                }
                if (val === false || val === 'false') {
                    return false;
                }
                return val;
            }

            //Handle editable state of chip
            function makeEditable($s, chip) {
                //editable is internal property used in security owasp tab
                $s.editable = getBooleanValue($s.editable);
                //In case of readonly user cannot edit chips
                if ($s.readonly || $s.editable === false) {
                    return;
                }
                //Making all non-editable false
                _.forEach($s.selectedChips, function (chip) {
                    chip.edit = false;
                });
                //Making current element editable
                chip.edit = true;
            }

            //Update the datavalue on add, edit and delete of the chips
            function onModelUpdate($s, $event) {
                var values = [];
                ignoreUpdate = true;
                if ($s.datafield === 'All Fields') {
                    $s._model_ = Utils.getClonedObject($s.selectedChips);
                } else {
                    values   = _.map($s.selectedChips, function (ele) {
                        return ele.value;
                    });
                    $s._model_ = values;
                }
                $s._onChange($event);
            }

            //Validate all chips and mark duplicates if exists after removing or editing chips
            function validateDuplicates($s) {
                //Pick data of useful properties only
                var chipsCopy = _.map($s.selectedChips, function (ele) { return _.pick(ele, ['key', 'value', 'wmImgSrc', 'fullValue']); });
                _.forEach(chipsCopy, function (chip, index) {
                    //If only one entry exists or if it is first occurance
                    if ((_.findIndex(chipsCopy, chip) === _.findLastIndex(chipsCopy, chip)) || (_.findIndex(chipsCopy, chip) === index)) {
                        $s.selectedChips[index].isDuplicate = false;
                    } else {
                        $s.selectedChips[index].isDuplicate = true;
                    }
                });
            }

            //To avoid form submit on pressing enter key
            function stopEvent($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }

            function updateChip($s, $event, chip) {
                var values;
                chip.edit  = false;
                values     = _.split(chip.fullValue, '<');
                chip.key   = _.trim(values[0]);
                chip.value = _.trim(_.split(values[1], '>')[0]);
                //edit chip
                onModelUpdate($s, $event);
                validateDuplicates($s);
                stopEvent($event);
            }

            //handle enter keypress event in case of edit mode
            function handleEnterKeyPressEvent($s, $el, $event, chip) {
                var key    = Utils.getActionFromKey($event);
                if (key === KEYS.ENTER || key === KEYS.TAB) {
                    updateChip($s, $event, chip);
                    if (key === KEYS.TAB) {
                        chip.active = false;
                        $el.find('input').focus();
                    }
                } else if (key === KEYS.DELETE) {
                    //Avoid deleting chips in delete mode
                    $event.stopPropagation();
                }
            }

            //Check if max size is reached
            function checkMaxSize($s) {
                var maxSize    = parseInt($s.maxsize, 10),
                    size       = $s.selectedChips.length;
                $s.saturate = false;
                if (maxSize > 0 &&  size === maxSize) {
                    $s.saturate = true;
                    //Max size reached
                    return true;
                }
                return false;
            }

            //Remove the item from list
            function removeItem($s, $event, index) {
                var indexes = WM.isArray(index) ? index : [index];
                //remove chip
                _.pullAt($s.selectedChips, indexes);
                onModelUpdate($s, $event);
                checkMaxSize($s);
                //validate duplicates
                validateDuplicates($s);
            }

            //handle delete keypress event for chips
            function handleDeleteKeyPressEvent($s, $event) {
                var key = Utils.getActionFromKey($event),
                    activeElementIndices = [];
                if (key === KEYS.DELETE) {
                    if (!$s.selectedChips.length || $s.readonly) {
                        return;
                    }
                    if ($s.newItem.name) {
                        return;
                    }
                    //Getting indexes of all active chips
                    _.forEach($s.selectedChips, function (chip, index) {
                        if (chip.active) {
                            activeElementIndices.push(index);
                        }
                    });
                    $s.removeItem($event, activeElementIndices);
                }
            }

            //handle keypress events for input box
            function handleKeyPressEvent($s, $el, $event, searchScope) {
                var key = Utils.getActionFromKey($event),
                    lastTag,
                    newItem,
                    length = $s.selectedChips.length;
                if (key === KEYS.ENTER && searchScope.query) {
                    $s.addItem($event, searchScope);
                    stopEvent($event);
                } else if (key === KEYS.BACKSPACE || (Utils.isAppleProduct && key === KEYS.DELETE)) {
                    newItem = searchScope.query;
                    //Only in case of apple product remove the chip on click of delete button
                    if (!length || $s.dropdown.open || newItem) {
                        return;
                    }
                    lastTag = _.last($s.selectedChips);
                    //If last tag is active then delete it
                    if (lastTag.active) {
                        $s.removeItem($event, length - 1);
                    } else {
                        //set last tag as active
                        $s.setActiveStates(lastTag);
                    }
                    stopEvent($event);
                }
            }

            function resetActiveState($s, currChip) {
                if (!$s.multiple) {
                    //In case of multiple property set to false, only one active chip at a time
                    _.forEach($s.selectedChips, function (chip) {
                        chip.active = false;
                        if (!currChip) {
                            chip.edit = false;
                        }
                    });
                }
            }

            //Update the chip which are in edit mode
            function updateStates($s, $event) {
                var edittedChip = _.find($s.selectedChips, {'edit' : true});
                if (edittedChip) {
                    updateChip($s, $event, edittedChip);
                }
                $s.resetActiveState();
            }

            //Handle chip active behavior based on the multiple property
            function setActiveStates($s, currChip) {
                var index = _.findLastIndex($s.selectedChips, currChip),
                    value;
                //In case of multiple property set to true, multiple chips can be selected  at a time
                if ($s.multiple && index > -1) {
                    value = !$s.selectedChips[index].active;
                } else {
                    value = true;
                    $s.resetActiveState(currChip);
                }
                if (index > -1) {
                    $s.selectedChips[index].active = value;
                }
            }

            //Add the newItem to the list
            function addItem($s, element, $event, searchScope) {
                var newItemObject,
                    allowAdd      = true;

                //Add the selected item to chips if not present in current dataset
                newItemObject = getChip($s);

                //Don't add new chip if already reaches max size
                if (checkMaxSize($s) || (!searchScope && !searchScope.query) ||  !newItemObject) {
                    element.find('input.app-textbox').focus(100);
                    return;
                }

                if (WM.isObject(newItemObject)) {
                    newItemObject = $s.constructChip(_.get(newItemObject, 'key'), _.get(newItemObject, 'value'), _.get(newItemObject, 'wmImgSrc'));
                } else {
                    newItemObject = $s.constructChip(newItemObject);
                }
                if (isDuplicate($s, newItemObject)) {
                    newItemObject.isDuplicate = true;
                }

                if ($s.onBeforeadd) {
                    allowAdd = $s.onBeforeadd({$event: 'event', $isolateScope: $s, newItem: newItemObject});
                }
                //If onBeforeadd method returns false abort adding chip
                if (!WM.isUndefined(allowAdd) && !allowAdd) {
                    return;
                }
                $s.selectedChips.push(newItemObject);
                //Focus on to search widget
                element.find('input.app-textbox').focus(100);
                checkMaxSize($s);
                //add chip
                onModelUpdate($s, $event);
                $s.newItem.name  = '';
            }

            //Reset chips method for form
            function reset($s) {
                $s.selectedChips.length = 0;
            }

            //Intialize $s level variables
            function init($s, widgetId) {
                $s.newItem              = {};
                $s.dropdown             = {};
                $s.selectedChips        = [];
                $s.chips                = [];
                $s.isWidgetInsideCanvas = !!widgetId;
            }

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler($s, $el, key) {
                //Monitoring changes for properties and accordingly handling respective changes
                switch (key) {
                case 'dataset':
                case 'displayfield':
                case 'datafield':
                    var data = $s.dataset;
                    if (data) {
                        if ($s.binddataset) {
                            data = data.data || (WM.isArray(data) ? data : [data]);
                        } else if (!WM.isArray(data)) {
                            //Filter usecase where data is array but there is no binding
                            data = _.split(data, ',');
                        }
                        //Support for order by
                        if ($s.orderby) {
                            data = FormWidgetUtils.getOrderedDataSet(data, $s.orderby);
                        }
                        if (data.length) {
                            $s.createSelectOptions(data);
                        }
                    }
                    break;
                }
            }
            return {
                'restrict': 'E',
                'scope'   : {
                    'scopedataset': '=?',
                    'dataoptions': '=?'
                },
                'replace' : true,
                'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/form/chips.html'),
                'link'    : {
                    'pre' : function ($is, $el, attrs) {

                        $is.widgetProps   = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $is.constructChip = constructChip.bind(undefined, $is);
                        $is.createSelectOptions = _.debounce(createSelectOptions.bind(undefined, $is), 50);

                        if (!attrs.widgetid) {
                            Object.defineProperty($is, '_model_', {
                                get: function () {
                                    return this._proxyModel;
                                },
                                set: function (newVal) {
                                    this._proxyModel = newVal;
                                    if (WM.isDefined(newVal)) {
                                        /*Handling the script usecase
                                         Update the selected options when the _model_ is updated while adding or deleting or editing a chip*/
                                        updateSelectedChips(newVal, $is);
                                    } else {
                                        //Handling the form reset usecase
                                        $is.selectedChips.length = 0;
                                    }
                                }
                            });
                            Utils.defineProps($is, $el);
                        }
                    },
                    'post': function ($s, $el, attrs) {
                        init($s, attrs.widgetid);

                        if (!$s.isWidgetInsideCanvas) {
                            $s.handleEnterKeyPressEvent  = handleEnterKeyPressEvent.bind(undefined, $s, $el);
                            $s.setActiveStates           = setActiveStates.bind(undefined, $s);
                            $s.makeEditable              = makeEditable.bind(undefined, $s);
                            $s.removeItem                = removeItem.bind(undefined, $s);
                            $s.handleKeyPressEvent       = handleKeyPressEvent.bind(undefined, $s, $el);
                            $s.handleDeleteKeyPressEvent = handleDeleteKeyPressEvent.bind(undefined, $s);
                            $s.addItem                   = _.debounce(addItem.bind(undefined, $s, $el), 50);
                            $s.reset                     = reset.bind(undefined, $s);
                            $s.resetActiveState          = resetActiveState.bind(undefined, $s);
                            $s.updateStates              = updateStates.bind(undefined, $s);
                        }

                        if (!attrs.widgetid && attrs.scopedataset) {
                            //Form and filter usecase where scopedataset is updated programatically
                            $s.$watch('scopedataset', function () {
                                if ($s.scopedataset) {
                                    $s.dataset = $s.scopedataset;
                                }
                            }, true);
                        }
                        //In run mode, If widget is bound to selecteditem subset, fetch the data dynamically
                        if (!attrs.widgetid && _.includes($s.binddataset, 'selecteditem.')) {
                            LiveWidgetUtils.fetchDynamicData($s, $el.scope(), function (data) {
                                $s.createSelectOptions(data);
                            });
                        }
                        $s.searchScope = $el.find('.app-search.ng-isolate-scope').isolateScope();
                        // register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $s, $el), $s, notifyFor);
                        WidgetUtilService.postWidgetCreate($s, $el, attrs);
                    }
                }
            };
        }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmChips
 * @restrict E
 *
 * @description
 * The `wmChips` directive defines the chips widget. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 * @requires CONSTANTS
 * @requires FormWidgetUtils
 *
 * @param {string=}  name
 *                   Name of the chips widget.
 * @param {string=}  placeholder
 *                   Placeholder for the chips widget.
 * @param {string=}  scopedataset
 *                   The script variable that contains the data to be provided the chips widget that can be searched onto.
 * @param {array||string=}  dataset
 *                   The data to be provided the chips widget from a variable that can be searched onto. <br>
 *                   This is a bindable property.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by the chips widget when the list is populated using the dataSet property.
 * @param {string=} displayfield
 *                  This property sets the displayValue to show in the chips widget when the list is populated using the dataSet property.
 * @param {expression=} displayexpression
 *                      This is an advanced property that gives more control over what is displayed in the chips widget drop-down list. <br>
 *                      A Display Expression uses a Javascript expression to format exactly what is shown. <br>
 *                      This property is bindable.
 * @param {string=}  imagesource
 *                  This property sets the image to be displayed in the search results.
 * @param {string=}  orderby
 *                  This allows for multiple selection for ordering the display of rows based on fields in asc or desc order - up arrow for asc and down arrow for desc.
 * @param {boolean=} readonly
 *                  Readonly is a bindable property. <br>
 *                  This property will be used to make the chips widget non-editable on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {number=}  maxsize
 *                   Limits the chips to be displayed in the chips widget.
 * @param {boolean=}  allowonlyselect
 *                   If Allow Only Select is set to true, chips will restrict adding values other than in the selection. By default there is no restriction
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the chips widget on the web page. <br>
 *                  Default value: `true`.
 * @param {boolean=} disabled
 *                  Disabled is a bindable property. <br>
 *                  This property will be used to disable/enable the chips widget on the web page. <br>
 *                  Default value: `false`. <br>
 * @param {string=} on-change
 *                  Callback function which will be triggered when the widget value is changed.
 * @param {string=}  on-beforeadd
 *                  Callback function which will be triggered while adding new chip
 *
 * @example
 <example module="wmCore">
    <file name="index.html">
        <div ng-controller="Ctrl" class="wm-app">
            <wm-label caption='chips widget with an array of fruits list:' width='300px' color='#919191'></wm-label>
            <wm-chips name='fruits' dataset="Apples, Grapes, Bananas"></wm-chips>
        </div>
    </file>
    <file name="script.js">
        function Ctrl($scope) {}
    </file>
 </example>
 */
