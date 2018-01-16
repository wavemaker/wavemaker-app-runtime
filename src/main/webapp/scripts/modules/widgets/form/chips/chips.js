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
                    '<li ng-show="widgetid || !(readonly || saturate)">' +
                        '<wm-search ng-show="!isWidgetInsideCanvas" name="app-chip-search" class="app-chip-input" disabled="{{disabled}}" add-delay dataset="{{binddataset || dataset}}" orderby="{{orderby}}"' +
                            'searchkey="{{searchkey || displayfield}}" allowonlyselect="allowonlyselect" displaylabel="{{binddisplayexpression || displayfield || displaylabel}}" ' +
                            'displayimagesrc="{{displayimagesrc || binddisplayimagesrc}}" datafield="{{datafield}}" placeholder="{{placeholder}}" on-select="addItem($event, $scope)" ' +
                            'on-focus="resetActiveState()" on-keydown="handleKeyPressEvent($event, $scope)" ng-click="updateStates($event)" dataoptions="dataoptions" showsearchicon="{{showsearchicon}}">' +
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
                };

            //Check if newItem already exists
            function isDuplicate($s, val) {
                return _.findIndex($s.selectedChips, {value: val}) > -1;
            }

            /* constructs and returns a chip item object
             * chipObj contains
             *          'value' represents dataValue (= displayValue when it is custom chip)
             *          'key' represents displayValue
             *          'isCustom' set to true if datavalue is not within dataset
             *          'index' count variable that to chips that are not custom.
             *          'isDuplicate' to check if chips are duplicated based on displayValue
             */
            function constructChip($s, option) {
                var displayVal = option.value,
                    key        = option.key,
                    isCustom   = option.isCustom,
                    chipObj = {
                        'key'       : displayVal,
                        'value'     : key,
                        'wmImgSrc'  : option.imgSrc,
                        'fullValue' : displayVal + ' <' + key + '>',
                        'isCustom'  : isCustom
                    };
                if (isDuplicate($s, key)) {
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
                $s.searchScope.fetchVariableData($s,  $searchEl, query, $el.scope()).then(function (value) {
                    value = value.length ? value : query;
                    $s.displayOptions = _.concat($s.displayOptions, extractDataObjects(value, $s, $el, true));
                    $s.canUpdateDefaultModel = false;
                    updateSelectedChips($s, $el);
                }, function () {  $s.canUpdateDefaultModel = false; });
            }


            /**
             * Triggered once when the dataset is changed.
             * @param $s : Widget scope
             * @param $el : Widget JQuery object
             */
            function updateDefaultModel($s, $el) {
                var model = $s._model_,
                    $searchEl = $el.find('.app-search.ng-isolate-scope'),
                    isBoundToLiveVariable = _.startsWith($s.binddataset, 'bind:Variables.') && FormWidgetUtils.getBoundVariableCategory($s, $s.widgetid ? $rs.domScope : $el.scope()) === 'wm.LiveVariable',
                    searchQuery = [];

                // if not bould to live varibale or if datafield is all fields the return
                if ( !isBoundToLiveVariable || $s.datafield === 'All Fields' || _.isObject(model[0])) {
                    $s.canUpdateDefaultModel = false;
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
                    fetchVariableData($s, $searchEl, searchQuery, $el);
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

                if (WM.isUndefined($s.displayOptions) || !$s.displayOptions.length) {
                    return;
                }

                if($s.canUpdateDefaultModel) {
                    updateDefaultModel($s, $el);
                    return;
                }

                if (dataField === 'All Fields') {
                    if (model.length) {
                        model = _.reduce(_.cloneDeep(model), function (result, value) {
                            var index,
                                customObj = {};
                            // if default value is not object, make custom object and update the model.
                            if(!_.isObject(value)) {
                                index = $s._model_.indexOf(value);
                                if(index !== -1) {
                                    _.pullAt($s._model_, index);
                                    if (!$s.allowonlyselect) {
                                        customObj[$s.displayfield] = value;
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
                            option = {key: modelVal, value: modelVal};
                            addChip($s, option);
                        }
                    }
                }

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
                if ($s.readonly || !chip.isCustom || $s.editable === false) {
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

                _.pullAt($s.selectedChips, indexes);
                _.pullAt($s._model_, indexes);

                onModelUpdate($s, $event);
                checkMaxSize($s);
                //validate duplicates
                validateDuplicates($s);

                if ($s.onRemove) {
                    $s.onRemove({$event: $event, $isolateScope: $s});
                }
            }

            //handle delete keypress event for chips
            function handleDeleteKeyPressEvent($s, $event) {
                var key = Utils.getActionFromKey($event),
                    activeElementIndices = [];
                if (key === KEYS.DELETE) {
                    if (!$s.selectedChips.length || $s.readonly) {
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
            function addItem($s, $event, searchScope) {
                var option,
                    allowAdd,
                    chipObj,
                    customObj = {},
                    customValue = searchScope.queryModel,
                    dataVal = searchScope.datavalue,
                    displayVal = searchScope.query;

                if (!$s._model_) {
                    $s._model_ = [];
                }
                if (!WM.isArray($s._model_)) {
                    $s._model_ = [$s._model_];
                }

                if (WM.isDefined(dataVal) && dataVal !== '') {
                    option = FormWidgetUtils.getSelectedObjFromDisplayOptions($s.displayOptions, $s.datafield, dataVal);

                    if (!option) {
                        option = {key: ($s.datafield === 'All Fields' ? displayVal : dataVal), value: displayVal, imgSrc: WidgetUtilService.getEvaluatedData($s, customValue, {expressionName: 'displayimagesrc'})};
                    }
                } else {
                    if ($s.allowonlyselect) {
                        return;
                    }
                    customValue = _.trim(customValue);
                    if (!customValue) {
                        return;
                    }
                    option = {key: customValue, value: customValue, isCustom: true};
                }

                if(!option) {
                    resetSearchModel($s, $event);
                    return;
                }

                chipObj = $s.constructChip(option);

                if ($s.onBeforeadd) {
                    allowAdd = $s.onBeforeadd({$event: $event, $isolateScope: $s, newItem: chipObj});
                }
                //If onBeforeadd method returns false abort adding chip
                if (!WM.isUndefined(allowAdd) && !allowAdd) {
                    return;
                }

                if (chipObj) {
                    $s.selectedChips.push(chipObj);

                    if (WM.isDefined(dataVal) && dataVal !== '') {
                        $s._model_.push(dataVal);
                    } else {
                        if ($s.allowonlyselect) {
                            return;
                        }
                        // Update model if dataVal is available. If datafield is not All Fields then only update the model with custom value.
                        if ($s.datafield !== 'All Fields') {
                            $s._model_.push(customValue);
                        } else {
                            customObj[FormWidgetUtils.getDisplayField($s.dataset, $s.displayfield || $s.datafield)] = customValue;
                            $s._model_.push(customObj);
                        }
                    }

                    if ($s.onAdd) {
                        $s.onAdd({$event: $event, $isolateScope: $s});
                    }
                    checkMaxSize($s);
                }
                // reset input box when item is added.
                resetSearchModel($s, $event);
                onModelUpdate($s, $event);
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
            function propertyChangeHandler($s, $el, key) {
                //Monitoring changes for properties and accordingly handling respective changes
                switch (key) {
                case 'dataset':
                    $s.displayOptions = extractDataObjects($s.dataset, $s, $el);
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
                        $is.showsearchicon = false;
                        $is.widgetProps   = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $is.constructChip = constructChip.bind(undefined, $is);
                        $is.canUpdateDefaultModel = true;

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

                                    // Constructs chips by referring the model.
                                    updateSelectedChips($is, $el);
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
                            $s.addItem                   = _.debounce(addItem.bind(undefined, $s), 50);
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
                                $s.displayOptions = extractDataObjects(data, $s, $el);
                                // to consider default value.
                                $s.canUpdateDefaultModel = true;
                                updateSelectedChips($s, $el);
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
