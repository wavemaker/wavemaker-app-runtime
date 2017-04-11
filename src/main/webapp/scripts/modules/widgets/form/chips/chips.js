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
                    '<li ng-if="!(readonly || saturate)">' +
                        '<input ng-if="!isWidgetInsideCanvas" name="app-chip-search" class="app-chip-input form-control" type="text" ng-attr-placeholder="{{placeholder}}" ng-model="newItem.name" ng-keydown="handleKeyPressEvent($event)" ng-click="resetActiveState()"' +
                            ' uib-typeahead="option as option.key for option in chips | filter:$viewValue"' +
                            ' spellcheck="false" autocomplete="off"' +
                            ' typeahead-on-select="addItem($event, $item)"' +
                            ' ng-disabled="disabled"' +
                            ' typeahead-editable="!allowonlyselect"' +
                            ' typeahead-min-length="1"' +
                            ' ng-model-options="{debounce: 200}" typeahead-is-open="dropdown.open"' +
                            ' typeahead-template-url="template/widget/form/chipsSearch.html">' +
                        '<input type="text" class="form-control" ng-if="isWidgetInsideCanvas" ng-attr-placeholder="{{placeholder}}">' +
                    '</li>' +
            '</ul>'
            );
        $templateCache.put('template/widget/form/chipsSearch.html',
            '<a>' +
                '<img ng-src="{{match.model.wmImgSrc}}" ng-if="match.model.wmImgSrc">' +
                '<span ng-bind-html="match.label | uibTypeaheadHighlight:query" title="{{chip.label}}" class="match-label"></span>' +
            '</a>'
            );
    }])
    .directive('wmChips', [
        'PropertiesFactory',
        'WidgetUtilService',
        'Utils',
        'FormWidgetUtils',
        'LiveWidgetUtils',
        function (PropertiesFactory, WidgetUtilService, Utils, FormWidgetUtils, LiveWidgetUtils) {
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
                    'DELETE'    : 'DELETE'
                },
                ignoreUpdate;

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

            //Update the selected chips
            function updateSelectedChips(chips, $s) {
                //Ignore _model_ update when it triggered by within the widget
                if (ignoreUpdate) {
                    ignoreUpdate = false;
                    return;
                }
                var values,
                    chip;
                chips = chips || [];
                /*
                * 1. In case of datavalue it will be string
                * 2. In case of form, filter on field chosen, chips will be array of strings
                * 3. In case of variable's  first record, it will be object
                */
                $s.selectedChips = [];
                if (WM.isObject(chips)) {
                    var displayValue = _.get(chips, $s.displayfield),
                        dataValue = $s.datafield === 'All Fields' ? displayValue : _.get(chips, $s.datafield);
                    $s.selectedChips.push($s.constructChip(displayValue, dataValue, _.get(chips, $s.displayimagesrc)));
                } else if (!WM.isArray(chips) || (WM.isArray(chips) && !WM.isObject(_.first(chips)))) {
                    values  = _.split(chips, ',');
                    _.forEach(values, function (ele) {
                        //find chip object from dataset to get value and img source
                        chip =  _.find($s.chips, {'key' : ele});
                        $s.selectedChips.push($s.constructChip(ele, _.get(chip, 'value'), _.get(chip, 'wmImgSrc')));
                    });
                } else {
                    $s.selectedChips = chips;
                }
            }

            //Create list of options for the search
            function createSelectOptions(dataset, $s) {
                var chips          = [],
                    dataField      = $s.datafield,
                    displayField   = $s.displayfield || $s.displayexpression || $s.binddisplayexpression,
                    imageField     = $s.displayimagesrc,
                    displayFieldValue,
                    dataFieldValue,
                    imageFieldValue,
                    value           = $s.value || $s.datavalue;
                //Avoiding resetting empty values
                if (($s.binddataset || $s.scopedataset) && (!displayField && !$s.datavalue)) {
                    return;
                }

                $s.chips.length = 0;
                if (WM.isArray(dataset) && dataset.length) {
                    chips = _.map(dataset, function (dataObj) {
                        //Support of display expression
                        displayFieldValue =  WidgetUtilService.getEvaluatedData($s, dataObj, {fieldName: 'displayfield', expressionName: 'displayexpression'});
                        dataFieldValue    =  Utils.getEvaluatedExprValue(dataObj, dataField);
                        imageFieldValue   =  $s.binddisplayimagesrc ? WidgetUtilService.getEvaluatedData($s, dataObj, {expressionName: 'displayimagesrc'}) : dataObj[imageField];

                        if (displayField) {
                            return $s.constructChip(displayFieldValue, dataFieldValue, imageFieldValue);
                        }
                        return $s.constructChip(dataObj);
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

            //handle enter keypress event in case of edit mode
            function handleEnterKeyPressEvent($s, $event, chip) {
                var key    = Utils.getActionFromKey($event),
                    values;
                if (key === KEYS.ENTER) {
                    chip.edit  = false;
                    values     = _.split(chip.fullValue, '<');
                    chip.key   = _.trim(values[0]);
                    chip.value = _.trim(_.split(values[1], '>')[0]);
                    //edit chip
                    onModelUpdate($s, $event);
                    validateDuplicates($s);
                    stopEvent($event);
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
                    if (!$s.selectedChips.length) {
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
            function handleKeyPressEvent($s, $el, $event) {
                var key = Utils.getActionFromKey($event),
                    lastTag,
                    newItem,
                    length = $s.selectedChips.length;
                if (key === KEYS.ENTER) {
                    $s.addItem($event);
                    stopEvent($event);
                } else if (key === KEYS.BACKSPACE || (Utils.isAppleProduct && key === KEYS.DELETE)) {
                    //Only in case of apple product remove the chip on click of delete button
                    if (!length || $s.dropdown.open) {
                        return;
                    }
                    newItem = $el.find('.app-chip-input').val();
                    if (newItem) {
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
            function addItem($s, $event, newItem) {
                var newItemKey,
                    newItemObject = Utils.getClonedObject(newItem),
                    allowAdd      = true;
                //Don't add new chip if already reaches max size
                if (checkMaxSize($s)) {
                    return;
                }
                if (!newItem && $s.newItem) {
                    newItemKey    = Utils.getClonedObject($s.newItem.name);
                    newItemObject = $s.constructChip(newItemKey);
                }
                if (!newItemKey && !newItem) {
                    return;
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
                        createSelectOptions(data, $s);
                    }
                    break;
                }
            }
            return {
                'restrict': 'E',
                'scope'   : {
                    'scopedataset': '=?'
                },
                'replace' : true,
                'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/widget/form/chips.html'),
                'link'    : {
                    'pre' : function ($is, $el, attrs) {

                        $is.widgetProps   = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $is.constructChip = constructChip.bind(undefined, $is);

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
                        }
                    },
                    'post': function ($s, $el, attrs) {
                        init($s, attrs.widgetid);

                        if (!$s.isWidgetInsideCanvas) {
                            $s.handleEnterKeyPressEvent  = handleEnterKeyPressEvent.bind(undefined, $s);
                            $s.setActiveStates           = setActiveStates.bind(undefined, $s);
                            $s.makeEditable              = makeEditable.bind(undefined, $s);
                            $s.removeItem                = removeItem.bind(undefined, $s);
                            $s.handleKeyPressEvent       = handleKeyPressEvent.bind(undefined, $s, $el);
                            $s.handleDeleteKeyPressEvent = handleDeleteKeyPressEvent.bind(undefined, $s);
                            $s.addItem                   = addItem.bind(undefined, $s);
                            $s.reset                     = reset.bind(undefined, $s);
                            $s.resetActiveState          = resetActiveState.bind(undefined, $s);
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
                                createSelectOptions(data, $s);
                            });
                        }

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
