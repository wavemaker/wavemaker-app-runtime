/*global WM, _ */
/*Directive for chips */
WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/chips.html',
            '<ul class="app-chips nav nav-pills list-inline" ng-class="{readonly: readonly}" init-widget has-model apply-styles role="input" listen-property="dataset" ng-model="_model_"' +
                ' title="{{hint}}">' +
                    '<li class="chip-item" ng-repeat="item in selectedChips track by $index" ng-class="[{\'active\': item.active, \'disabled\': disabled}, _chipClass(this)]">' +
                        '<a class="app-chip" href="javascript:void(0);" tabindex="-1" data-ng-click="!readonly && onChipClick($event)" ' +
                            'data-ng-keydown="!readonly && handleChipSelect($event, $index)" data-ng-focus="!readonly && (item.active=true)" ' +
                            'data-ng-blur="!readonly && (item.active=false)" ng-if="!item.edit" ng-class="{\'chip-duplicate bg-danger\': item.isDuplicate, \'chip-picture\': item.imgsrc}">' +
                            '<img data-identifier="img" class="button-image-icon" ng-src="{{item.imgsrc}}"  ng-if="item.imgsrc"/>' +
                            '{{item.displayvalue}}' +
                             //type="button" need to be added since chips inside form is treated as submit hence on enter key press, ng-click is triggered
                            '<button type="button" tabindex="-1" class="btn btn-transparent" ng-click="removeItem($event, $index); $event.stopPropagation();" ng-if="!readonly"><i class="app-icon wi wi-close"></i></button>' +
                        '</a>' +
                        '<input class="app-chip-input" type="text" ng-if="item.edit" ng-keydown="handleEnterKeyPressEvent($event, item)" ng-model="item.fullvalue"/>' +
                    '</li>' +
            '</ul>'
            );
        $templateCache.put('template/widget/form/chips-search.html',
            '<li class="app-chip-search" ng-class="{\'full-width\': inputwidth === \'full\'}">' +
                '<wm-search ng-show="!isWidgetInsideCanvas" name="app-chip-search" class="app-chip-input" disabled="{{disabled || readonly || saturate}}" add-delay dataset="{{binddataset || dataset}}" orderby="{{orderby}}"' +
                    'searchkey="{{searchkey || displayfield}}" allowonlyselect="allowonlyselect" displaylabel="{{binddisplayexpression || displayfield || displaylabel}}" ' +
                    'displayimagesrc="{{displayimagesrc || binddisplayimagesrc}}" datafield="{{datafield}}" placeholder="{{saturate ? maxSizeReached : placeholder}}" on-select="addItem($event, $scope)" ' +
                    'on-keydown="handleKeyPressEvent($event, $scope)" ng-click="updateStates($event)" dataoptions="dataoptions" showsearchicon="{{showsearchicon}}"' +
                    'on-focus="onFocus({$event: $event})" on-blur="onBlur({$event: $event})"' +
                    'on-beforeservicecall="onBeforeservicecall({$isolateScope: $isolateScope, inputData: inputData})">' +
                    '</wm-search>' +
                '<input type="text" class="form-control" ng-if="isWidgetInsideCanvas" ng-attr-placeholder="{{placeholder}}">' +
            '</li>'
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
        '$parse',
        '$templateCache',
        function (PropertiesFactory, WidgetUtilService, Utils, FormWidgetUtils, LiveWidgetUtils, $rs, $timeout, $parse, $tc) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.chips', ['wm.base', 'wm.base.editors.dataseteditors','wm.base.events.focus']),
                notifyFor   = {
                    'dataset'       : true,
                    'displayfield'  : true,
                    'datafield'     : true,
                    'readonly'      : true,
                    'enablereorder' : true,
                    'autofocus'     : true
                },
                KEYS  = {
                    'BACKSPACE'   : 'BACKSPACE',
                    'ENTER'       : 'ENTER',
                    'DELETE'      : 'DELETE',
                    'TAB'         : 'TAB',
                    'LEFT-ARROW'  : 'LEFT-ARROW',
                    'RIGHT-ARROW' : 'RIGHT-ARROW'
                };

            //Check if newItem already exists
            function isDuplicate($s, val) {
                return _.findIndex($s.selectedChips, function (chip) {return _.isEqual(chip.datavalue, val);}) > -1;
            }

            /* constructs and returns a chip item object
             * chipObj contains
             *          'value' represents dataValue (= displayValue when it is custom chip)
             *          'key' represents displayValue
             *          'iscustom' set to true if datavalue is not within dataset
             *          'index' count variable that to chips that are not custom.
             *          'isDuplicate' to check if chips are duplicated based on displayValue
             */
            function constructChip($s, option) {
                var displayvalue = option.value,
                    datavalue = $s.datafield === 'All Fields' ? option.dataObject || option.key : option.key,
                    iscustom   = option.iscustom,
                    chipObj;

                    chipObj = {
                        'displayvalue'  : displayvalue,
                        'datavalue'     : datavalue,
                        'imgsrc'        : option.imgSrc,
                        'fullvalue'     : displayvalue + ' <' + datavalue + '>',
                        'iscustom'      : iscustom
                    };

                if (isDuplicate($s, datavalue)) {
                    return;
                }
                return chipObj;
            }

            /**
             *  Get Display options for the chips.
             * @param model: Array/ object/ string
             * @param $s: widget scope
             * @param $el: Widget element
             * @param isModel: boolean
             * @returns {*} return display options
             */
            function extractDataObjects(model, $s, $el, isModel) {
                var result;
                result  = FormWidgetUtils.extractDataObjects(model, $s, $el, isModel);

                // updating key which is index value (0, 1, 2) with the display value.
                if($s.datafield === 'All Fields') {
                    _.map(result, function (o) {
                        o.key = o.value;
                        return o;
                    });
                }
                return result;
            }

            //resets the query model of search
            function resetSearchModel($s, $event) {
                if ($s.searchScope) {
                    $s.searchScope.reset();
                }

                $rs.$safeApply($s, function () {
                    if ($event) {
                        $timeout(function () {
                            $event.target.value = '';
                            $event.target.focus();
                        }, 200);
                    }
                });
            }

            /**
             * Fetch data form the live variable bound to the widget.
             * can send multiple queries at once
             * @param $s: widget scope
             * @param $searchEl : Search element scope
             * @param query: Array[<string>]
             * @param $el : Widget Element.
             */
            function fetchVariableData($s, $searchEl, query, $el) {
                var limit = $s.limit;
                query = _.isArray(query) ? query : [query];

                // changing limit to query length to fetch all the matched results.
                $s.limit = query.length || limit;
                $s.searchScope.fetchVariableData($s,  $searchEl, query, $el.scope()).then(function (value) {
                    value = value.length ? value : ($s.allowonlyselect ? value : _.head(query));
                    if(value.length) {
                        $s.displayOptions = _.concat($s.displayOptions || [], extractDataObjects(value, $s, $el, true));
                    }
                    _.forEach(query, function (val) {
                       if(_.indexOf($s._model_, val) === -1) {
                           $s._model_.push(val);
                       }
                    });
                    updateSelectedChips($s, $el);
                });
                //setting limit to its original value
                $s.limit = limit;
            }

            function boundToLiveVariable($s, $el) {
                return _.startsWith($s.binddataset, 'bind:Variables.') && FormWidgetUtils.getBoundVariableCategory($s, $s.widgetid ? $rs.domScope : $el.scope()) === 'wm.LiveVariable';
            }


            /**
             * Triggered once when the dataset is changed.
             * @param $s : Widget scope
             * @param $el : Widget JQuery object
             */
            function updateDefaultModel($s, $el) {
                var model = $s._model_,
                    $searchEl = $el.find('.app-search.ng-isolate-scope'),
                    isBoundToLiveVariable = boundToLiveVariable($s, $el),
                    searchQuery = [];

                $s.canUpdateDefaultModel = false;
                // if not bould to live varibale or if datafield is all fields the return
                if ( !isBoundToLiveVariable || $s.datafield === 'All Fields' || _.isObject(model[0])) {
                    updateSelectedChips($s, $el);
                    return;
                }

                // if allow only select is true
                if($s.allowonlyselect) {
                    // group all the models which are not available in display options
                    _.forEach(model, function (query) {
                        if(!FormWidgetUtils.getSelectedObjFromDisplayOptions($s.displayOptions, $s.datafield, query)) {
                            searchQuery.push(query);
                        }
                    });
                    if(searchQuery.length) {
                        fetchVariableData($s, $searchEl, searchQuery, $el);
                    } else {
                        updateSelectedChips($s, $el);
                    }
                } else {
                    // if allowonly select is false then make individual quries to fetch the data.
                    _.forEach(model ,function (query) {
                        if(!FormWidgetUtils.getSelectedObjFromDisplayOptions($s.displayOptions, $s.datafield, query)) {
                            fetchVariableData($s, $searchEl, query, $el);
                        } else {
                            $s.canUpdateDefaultModel = false;
                            updateSelectedChips($s, $el);
                        }
                    });
                }
            }

            /**
             * adds chips to selected chips array.
             * @param $s
             * @param selectedChip
             */
            function addChip($s, selectedChip) {
                var chipObj;

                if (selectedChip) {
                    chipObj = $s.constructChip(selectedChip);
                    if (chipObj) {
                        $s.selectedChips.push(chipObj);
                    }
                }
            }

            function createCustomDataModel($s, val) {
                var customObj = {},
                    displayField = $s.displayfield  || ($s.datafield !== 'All Fields' ?  $s.datafield : undefined);

                if (displayField) {
                    customObj[displayField] = val;
                }
                return customObj;
            }

            function reorderData(data, newIndex, oldIndex) {
                var draggedItem = _.pullAt(data, oldIndex)[0];
                data.splice(newIndex, 0, draggedItem);
            }

            function resetReorder($ulEle, $dragEl) {
                // cancel the sort even. as the data model is changed Angular will render the list.
                $ulEle.sortable("cancel");
                $dragEl.removeData('oldIndex');
            }

            function configureDnD($el, $is) {
                var $ulEle = $el;
                $ulEle.sortable({
                    'containment' : $ulEle,
                    'delay'       : 100,
                    'opacity'     : 0.8,
                    'helper'      : 'clone',
                    'zIndex'      : 1050,
                    'tolerance'   : 'pointer',
                    'items'       : '> li:not(.app-chip-search)',
                    'placeholder' : 'chip-placeholder',
                    'start'       : function (evt, ui) {
                        var helper = ui.helper;
                        // increasing the width of the dragged item by 1
                        helper.width(helper.width() + 1);
                        WM.element(this).data('oldIndex', ui.item.index() - ($is.inputposition === 'first' ? 1 : 0));
                    },
                    'update'      : function (evt, ui) {
                        var changedItem = {},
                            newIndex,
                            oldIndex,
                            $dragEl,
                            allowReorder = true;

                        $dragEl     = WM.element(this);
                        newIndex    = ui.item.index() - ($is.inputposition === 'first' ? 1 : 0);
                        oldIndex    = $dragEl.data('oldIndex');

                        newIndex = $is.selectedChips.length === newIndex ? newIndex - 1 : newIndex;
                        changedItem = {
                            oldIndex: oldIndex,
                            newIndex: newIndex,
                            item: $is.selectedChips[oldIndex]
                        };

                        if (newIndex === oldIndex) {
                            resetReorder($ulEle, $dragEl);
                            return;
                        }
                        changedItem.item = $is.selectedChips[oldIndex];
                        if ($is.onBeforereorder) {
                            allowReorder = $is.onBeforereorder({$event: evt, $data: $is.selectedChips, $changedItem: changedItem});
                            if(getBooleanValue(allowReorder) === false) {
                                resetReorder($ulEle, $dragEl);
                                return;
                            }
                        }

                        reorderData($is.selectedChips, newIndex, oldIndex);
                        reorderData($is._model_, newIndex, oldIndex);

                        changedItem.item = $is.selectedChips[newIndex];

                        resetReorder($ulEle, $dragEl);
                        Utils.triggerFn($is.onReorder, {$event: evt, $data: $is.selectedChips, $changedItem: changedItem});
                        $rs.$safeApply($is);
                    }
                });
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

            /**
             * This function constructs the chips.
             * Invoked when Default datavalue is binded and datavalue is within the dataset.
             * Extracts the chipsObj to construct chip.
             *
             */
            function updateSelectedChips($s, $el) {
                var option,
                    chipsObj,
                    model = $s._model_,
                    dataField = $s.datafield,
                    i,
                    modelVal;

                $s.selectedChips = [];

                if (!WM.isDefined(model) || _.isNull(model)) {
                    return;
                }

                if (_.isString(model)) {
                    $s._model_  =  _.map(_.split(model, ','), _.trim);
                    return;
                }
                if (!WM.isArray(model)) { // handle the model having object as default datavalue.
                    $s._model_ = [model];
                    return;
                }
                model = _.without(_.uniqWith(model, _.isEqual), undefined, null, '');
                if ($s._model_.length !== model.length) {
                    $s._proxyModel = model;
                }

                if ($s.maxsize && model.length > parseInt($s.maxsize, 10)) {
                    $s._proxyModel = _.slice($s._model_, 0, parseInt($s.maxsize, 10));
                }

                if (!boundToLiveVariable($s, $el) && (WM.isUndefined($s.displayOptions) || !$s.displayOptions.length)) {
                    return;
                }

                if(!$s.searchScope) {
                    return;
                }

                // donot make calls to get default values in studio mode.
                if($s.canUpdateDefaultModel && !$s.widgetid) {
                    updateDefaultModel($s, $el);
                    return;
                }
                model = $s._model_;
                if (dataField === 'All Fields') {
                    if (model.length) {
                        model = _.reduce(_.cloneDeep(model), function (result, value) {
                            var index,
                                customObj;
                            // if default value is not object, make custom object and update the model.
                            if(!_.isObject(value)) {
                                index = $s._model_.indexOf(value);
                                if(index !== -1) {
                                    _.pullAt($s._model_, index);
                                    //not modifying model in studio mode
                                    if (!$s.allowonlyselect || $s.widgetid) {
                                        customObj = createCustomDataModel($s, value);
                                        $s._model_.splice(index, 0, customObj);
                                        result.push(customObj);
                                        return result;
                                    }
                                    return result;
                                }
                            }
                            result.push(value);
                            return result;

                        }, []);
                        chipsObj = extractDataObjects(model, $s, $el, true);

                        _.forEach(chipsObj, function (obj) {
                            addChip($s, obj);
                        });
                    }
                } else {
                    for (i = 0; i < model.length; i++) {
                        modelVal = model[i];
                        chipsObj = FormWidgetUtils.getSelectedObjFromDisplayOptions($s.displayOptions, dataField, modelVal);
                        if (chipsObj) {
                            addChip($s, chipsObj);
                        } else if (!$s.allowonlyselect) { // if its a custom chip
                            option = {key: modelVal, value: modelVal, iscustom: true};
                            addChip($s, option);
                        } else if(!$s.widgetid) { // not modifying model in studio mode.
                            model.splice(i,1);
                            i--;
                        }
                    }
                }
                checkMaxSize($s);

                $timeout(function () {
                    resetSearchModel($s);
                });
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
                if ($s.readonly || !chip.iscustom || $s.editable === false) {
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
                $s._onChange($event);
            }

            //Validate all chips and mark duplicates if exists after removing or editing chips
            function validateDuplicates($s) {
                //Pick data of useful properties only
                var chipsCopy = _.map($s.selectedChips, function (ele) { return _.pick(ele, ['datavalue', 'displayvalue', 'imgsrc', 'fullvalue']); });
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
                values     = _.split(chip.fullvalue, '<');
                chip.datavalue   = _.trim(values[0]);
                chip.displayvalue = _.trim(_.split(values[1], '>')[0]);
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
                    $el.focus(100);
                    if (key === KEYS.TAB) {
                        chip.active = false;
                        $el.find('input').focus();
                    }
                } else if (key === KEYS.DELETE) {
                    //Avoid deleting chips in delete mode
                    $event.stopPropagation();
                }
            }

            /**
             * focus search box
             * @param $el Widget's JQuery object.
             */
            function focusSearchBox($el) {
                $el.find('.app-chip-input > input.app-textbox').focus();
            }

            //Remove the item from list
            function removeItem($s, $el, $event, index, canFocus) {
                var indexes = WM.isArray(index) ? index : [index],
                    focusIndex = _.max(indexes),
                    items,
                    allowRemove = true;

                items = _.reduce(indexes, function (result, index) {
                    result.push($s.selectedChips[index]);
                    return result;
                }, []);

                if ($s.onBeforeremove) {
                    allowRemove = $s.onBeforeremove({$event: $event, $isolateScope: $s, $item: items.length === 1 ? items[0] : items });
                }

                if (getBooleanValue(allowRemove) === false) {
                    return;
                }
                $s._ngModelOldVal = Utils.getClonedObject($s._model_);
                _.pullAt($s._model_, indexes);
                items = _.pullAt($s.selectedChips, indexes);

                // focus next chip after deletion.
                $timeout(function () {
                    var chipsLength = $s.selectedChips.length,
                        $chipsList = $el.find('li.chip-item > a.app-chip');

                    // if there are no chips in the list focus search box
                    if(!chipsLength || !canFocus) {
                        focusSearchBox($el);
                    } else if((chipsLength - 1) < focusIndex) {
                        // if focus index is greater than chips length select last chip
                        $chipsList.get(chipsLength-1).focus();
                    } else {
                        // manually set the succeeding chip as active if there is a chip next to the current chip.
                        $s.selectedChips[focusIndex].active = true;
                        $chipsList.get(focusIndex).focus();
                    }
                });

                onModelUpdate($s, $event);
                checkMaxSize($s);
                //validate duplicates
                validateDuplicates($s);

                if ($s.onRemove) {
                    $s.onRemove({$event: $event, $isolateScope: $s, $item: items.length === 1 ? items[0] : items});
                }
            }

            //handle keypress events for input box
            function handleKeyPressEvent($s, $el, $event, searchScope) {
                var key = Utils.getActionFromKey($event),
                    newItem = searchScope.query,
                    length = $s.selectedChips.length;
                if (key === KEYS.ENTER && _.trim(searchScope.query)) {
                    $s.addItem($event, searchScope);
                    stopEvent($event);
                } else if (key === KEYS.BACKSPACE || (Utils.isAppleProduct && key === KEYS.DELETE)) {
                    //Only in case of apple product remove the chip on click of delete button
                    if (!length || $s.dropdown.open || newItem) {
                        return;
                    }
                    $el.find('li.chip-item > a.app-chip:last').focus();
                    stopEvent($event);
                } else if(!newItem) { // if search box is empty only then perform left and right arrow actions.
                    if(key === KEYS['LEFT-ARROW']) {
                        $el.find('li.chip-item > a.app-chip:last').focus();
                    }
                    else if(key === KEYS['RIGHT-ARROW']) {
                        $el.find('li.chip-item > a.app-chip:first').focus();
                    }
                }
            }

            /**
             * navigates over chips and deletes the current focused chip
             * @param $s : Widget's isolate scope
             * @param $el : Widget's JQuery object
             * @param $event : event object
             * @param $index : Chip index
             */
            function handleChipSelect($s, $el, $event, $index) {
                var key = Utils.getActionFromKey($event);
                if (key === KEYS.BACKSPACE || (Utils.isAppleProduct && key === KEYS.DELETE)) {
                    //Only in case of apple product remove the chip on click of delete button
                    $s.removeItem($event, $index, true);
                } else if(key === KEYS.DELETE) {
                    $s.removeItem($event, $index);
                }
                else if(key === KEYS['LEFT-ARROW']) {
                    if($index > 0) {
                        $el.find('li.chip-item > a.app-chip').get($index - 1).focus();
                    } else {
                        focusSearchBox($el);
                    }
                }
                else if(key === KEYS['RIGHT-ARROW']) {
                    if($index < ($s.selectedChips.length - 1)) {
                        $el.find('li.chip-item > a.app-chip').get($index + 1).focus();
                    } else {
                        focusSearchBox($el);
                    }
                }
            }

            function onChipClick($event) {
                $event.currentTarget.focus();
            }

            //Update the chip which are in edit mode
            function updateStates($s, $event) {
                var edittedChip = _.find($s.selectedChips, {'edit' : true});
                if (edittedChip) {
                    updateChip($s, $event, edittedChip);
                }
            }

            //Add the newItem to the list
            function addItem($s, $event, searchScope) {
                var option,
                    allowAdd,
                    chipObj,
                    customObj,
                    queryModel = searchScope.queryModel,
                    dataVal = searchScope.datavalue,
                    displayVal = searchScope.query;

                if (!$s._model_) {
                    $s._model_ = [];
                }
                if (!WM.isArray($s._model_)) {
                    $s._model_ = [$s._model_];
                }

                if (WM.isDefined(dataVal) && dataVal !== '') {
                    option = {value: displayVal, imgSrc: WidgetUtilService.getEvaluatedData($s, queryModel, {expressionName: 'displayimagesrc'})};
                    if(_.isObject(dataVal)){
                        option.key = dataVal;
                    } else {
                        option.key = $s.datafield === 'All Fields' ? displayVal : dataVal;
                    }
                } else {
                    queryModel = _.trim(queryModel);
                    if ($s.allowonlyselect || !queryModel) {
                        resetSearchModel($s, $event);
                        return;
                    }
                    if($s.datafield === 'All Fields') {
                        customObj = createCustomDataModel($s, queryModel);
                    }
                    option = {key: customObj || queryModel, value: queryModel, iscustom: true};
                }

                if(!option) {
                    resetSearchModel($s, $event);
                    return;
                }

                chipObj = $s.constructChip(option);

                if (chipObj) {
                    if ($s.onBeforeadd) {
                        allowAdd = $s.onBeforeadd({$event: $event, $isolateScope: $s, newItem: chipObj});
                        if (getBooleanValue(allowAdd) === false || isDuplicate($s, chipObj.datavalue)) {
                            return;
                        }
                    }
                    //If onBeforeadd method returns false or if datavalue is empty object abort adding chip.
                    if (_.isObject(chipObj.datavalue) && _.isEmpty(chipObj.datavalue)) {
                        return;
                    }
                    $s._ngModelOldVal = Utils.getClonedObject($s._model_);
                    $s.selectedChips.push(chipObj);
                    $s._model_.push(chipObj.datavalue);
                    if ($s.onAdd) {
                        $s.onAdd({$event: $event, $isolateScope: $s, $item: chipObj});
                    }
                    checkMaxSize($s);
                    onModelUpdate($s, $event);
                }
                // reset input box when item is added.
                resetSearchModel($s, $event);
            }
            //Reset chips method for form
            function reset($s) {
                $s.selectedChips.length = 0;
                $s._model_ = [];
            }

            //Intialize $s level variables
            function init($s, widgetId) {
                $s.dropdown             = {};
                $s.selectedChips        = [];
                $s.isWidgetInsideCanvas = !!widgetId;
            }

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler($s, $el, key, val) {
                var isSortable;
                //Monitoring changes for properties and accordingly handling respective changes
                switch (key) {
                case 'dataset':
                    $s.displayOptions = extractDataObjects($s.dataset, $s, $el) || $s.displayOptions;
                    $s.canUpdateDefaultModel = true;
                    updateSelectedChips($s, $el);
                    break;
                case 'displayfield':
                case 'datafield':
                    if ($s.widgetid) {
                        $s.displayOptions = extractDataObjects($s.dataset, $s, $el);
                        $s.canUpdateDefaultModel = true;
                        updateSelectedChips($s, $el);
                    }
                    break;
                case 'readonly':
                case 'enablereorder':
                    isSortable = $el.hasClass('ui-sortable');
                    if ($s.enablereorder && !$s.readonly) {
                        if(isSortable) {
                            $el.sortable("enable");
                        } else {
                            configureDnD($el, $s);
                        }
                    } else if (isSortable) {
                        $el.sortable("disable");
                    }
                    break;
                case 'autofocus':
                    if (val) {
                        focusSearchBox($el);
                    }
                    break;
                }
            }

            function getEvalFn(itemAttr) {
                var watchFn;
                // when the property is binded
                if (_.startsWith(itemAttr, 'bind:')) {
                    // get the updated attribute
                    watchFn = $parse(_.replace(itemAttr, 'bind:', ''));
                    return function ($s) { // evaluate the expression
                        return watchFn($s);
                    };
                }
                // when the property doesn't contain any binding
                return _.identity.bind(undefined, itemAttr);
            }

            return {
                'restrict': 'E',
                'scope'   : {
                    'scopedataset': '=?',
                    'dataoptions': '=?'
                },
                'replace' : true,
                'template' : function ($el, attrs) {
                    var $searchTemplate = WM.element($tc.get('template/widget/form/chips-search.html'));
                    $el.append(WM.element($tc.get('template/widget/form/chips.html')));
                    if(attrs.inputposition === 'first') {
                        $el.find('ul.app-chips').prepend($searchTemplate);
                    } else {
                        $el.find('ul.app-chips').append($searchTemplate);
                    }
                    return $el.html();
                },
                'link' : {
                    'pre' : function ($is, $el, attrs) {
                        $is.showsearchicon = false;
                        $is.widgetProps   = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $is.constructChip = constructChip.bind(undefined, $is);
                        $is.canUpdateDefaultModel = true;
                        $is.displayOptions = [];
                        // delegating tabindex to search widget.
                        _.isUndefined(attrs.tabindex) || $el.find('li > .app-chip-input').attr('tabindex', attrs.tabindex);
                        if (!attrs.widgetid) {
                            Object.defineProperty($is, '_model_', {
                                get: function () {
                                    return this._proxyModel;
                                },
                                set: function (newVal) {
                                    this._proxyModel = newVal;

                                    if (WM.isUndefined(newVal) || newVal === '' || (_.isArray(newVal) && newVal.length === 0)) {
                                        //Handling the form reset usecase
                                        $is.selectedChips.length = 0;
                                        return;
                                    }

                                    $is.canUpdateDefaultModel = true;
                                    // Constructs chips by referring the model.
                                    updateSelectedChips($is, $el);
                                }
                            });
                            Utils.defineProps($is, $el);
                        }
                    },
                    'post': function ($s, $el, attrs) {
                        init($s, attrs.widgetid);
                        // removing tabindex on the chips widget
                        $el.removeAttr('tabindex');
                        if (!$s.isWidgetInsideCanvas) {
                            $s.handleEnterKeyPressEvent  = handleEnterKeyPressEvent.bind(undefined, $s, $el);
                            $s.makeEditable              = makeEditable.bind(undefined, $s);
                            $s.removeItem                = removeItem.bind(undefined, $s, $el);
                            $s.handleKeyPressEvent       = handleKeyPressEvent.bind(undefined, $s, $el);
                            $s.handleChipSelect          = handleChipSelect.bind(undefined, $s, $el);
                            $s.addItem                   = _.debounce(addItem.bind(undefined, $s), 50);
                            $s.reset                     = reset.bind(undefined, $s);
                            $s.updateStates              = updateStates.bind(undefined, $s);
                            $s.maxSizeReached            = 'Max size reached';
                            $s.onChipClick               = onChipClick;
                        }

                        $s.searchScope = $el.find('.app-search.ng-isolate-scope').isolateScope();
                        $s.searchScope.tabindex = $s.tabindex;
                        $s.searchScope.minLength = $s.minlength;
                        if (!attrs.widgetid) {
                            //Form and filter usecase where scopedataset is updated programatically
                            if( attrs.scopedataset) {
                                $s.$watch('scopedataset', function () {
                                    if ($s.scopedataset) {
                                        $s.dataset = $s.scopedataset;
                                    }
                                }, true);
                            }
                            //In run mode, If widget is bound to selecteditem subset, fetch the data dynamically
                            if(_.includes($s.binddataset, 'selecteditem.')) {
                                LiveWidgetUtils.fetchDynamicData($s, $el.scope(), function (data) {
                                    $s.displayOptions = extractDataObjects(data, $s, $el) || $s.displayOptions;
                                    updateSelectedChips($s, $el);
                                });
                            }
                            if ($s.enablereorder && !$s.readonly) {
                                configureDnD($el, $s);
                            }
                            updateSelectedChips($s, $el);
                        }
                        // register the property change handler
                        $s._chipClass   = getEvalFn(attrs.chipclass);
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
