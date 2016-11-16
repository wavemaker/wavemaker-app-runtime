/*global WM, _ */
/*Directive for chips */
WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/chips.html',
            '<ul class="app-chips nav nav-pills list-inline" init-widget has-model apply-styles role="input" ng-keydown="handleDeleteKeyPressEvent($event)" listen-property="dataset"' +
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
                        '<input ng-if="!studioMode" name="app-chip-search" class="app-chip-input form-control" type="text" ng-attr-placeholder="{{placeholder}}" ng-model="newItem.name" ng-keydown="handleKeyPressEvent($event)" ng-click="resetActiveState()"' +
                            ' uib-typeahead="option as option.key for option in chips | filter:$viewValue"' +
                            ' spellcheck="false" autocomplete="off"' +
                            ' typeahead-on-select="addItem($event, $item)"' +
                            ' ng-disabled="disabled"' +
                            ' typeahead-editable="!allowonlyselect"' +
                            ' typeahead-min-length="1"' +
                            ' ng-model-options="{debounce: 200}" typeahead-is-open="dropdown.open"' +
                            ' typeahead-template-url="template/widget/form/chipsSearch.html"' +
                            ' autofocus="false">' +
                        '<input type="text" class="form-control" ng-if="studioMode" ng-attr-placeholder="{{placeholder}}">' +
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
        'CONSTANTS',
        'DatabaseService',
        'Variables',
        'FormWidgetUtils',
        function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS, DatabaseService, Variables, FormWidgetUtils) {
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
                };

            //constructs and returns a chip item object
            function constructChip(displayValue, dataValue, imgSrcValue) {
                //When data field is not provided, set display value as data value
                if (!dataValue) {
                    dataValue   = displayValue;
                }
                return {
                    'key'       : displayValue,
                    'value'     : dataValue,
                    'wmImgSrc'  : imgSrcValue,
                    'fullValue' : displayValue + ' <' + dataValue + '>'
                };
            }

            //Create list of options for the search
            function createSelectOptions(dataset, $s) {
                if ($s.binddataset && !$s.displayfield) {
                    return;
                }
                var chips          = [],
                    dataField      = $s.datafield,
                    displayField   = $s.displayfield,
                    imageField     = $s.displayimagesrc,
                    displayFieldValue,
                    dataFieldValue,
                    values,
                    value           = $s.value || $s.datavalue;
                $s.chips.length = 0;
                if (WM.isArray(dataset) && dataset.length) {
                    chips = _.map(dataset, function (dataObj) {
                        //Support of display expression
                        displayFieldValue = WidgetUtilService.getEvaluatedData($s, dataObj, {fieldName: 'displayfield', expressionName: 'displayexpression'});
                        dataFieldValue    =  Utils.getEvaluatedExprValue(dataObj, dataField);

                        if (displayField) {
                            return constructChip(displayFieldValue, dataFieldValue, dataObj[imageField]);
                        }
                        return constructChip(dataObj);
                    });
                }
                $s.chips         = chips;
                $s.selectedChips = [];
                if (!$s.binddataset) {
                    $s.selectedChips = Utils.getClonedObject(chips);
                } else if (value) {
                    //Creating chips in form based on the value
                    values              = _.split(value, ',');
                    $s.selectedChips    = _.map(values, function (ele) {
                        return constructChip(ele);
                    });
                }
            }

            //Handle editable state of chip
            function makeEditable($s, chip) {
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
                $s._onChange($event);
                if ($s.datafield === 'All Fields') {
                    $s._model_ = Utils.getClonedObject($s.selectedChips);
                } else {
                    values   = _.map($s.selectedChips, function (ele) {
                        return ele.value;
                    });
                    $s._model_ = values;
                }
            }

            //Validate all chips and mark duplicates if exists after removing or editing chips
            function validateDuplicates($s) {
                var groupedChips = _.groupBy($s.selectedChips, 'key');
                _.forEach(groupedChips, function (value) {
                    _.forEach(value, function (dup) {
                        dup.isDuplicate = false;
                    });
                    if (value.length > 1) {
                        _.last(value).isDuplicate = true;
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

            //Check if newItem already exists
            function isDuplicate(newItemObject, $s) {
                return _.findIndex($s.selectedChips, newItemObject) > -1;
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
                } else if (key === KEYS.BACKSPACE) {
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
                var index = _.findIndex($s.selectedChips, currChip),
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
                    newItemObject = constructChip(newItemKey);
                }
                if (!newItemKey && !newItem) {
                    return;
                }
                if (isDuplicate(newItemObject, $s)) {
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
            function init($s) {
                $s.newItem       = {};
                $s.dropdown      = {};
                $s.selectedChips = [];
                $s.chips         = [];
                $s.studioMode    = CONSTANTS.isStudioMode;
            }

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler($s, $el, key, newVal, oldVal) {
                //Monitoring changes for properties and accordingly handling respective changes
                switch (key) {
                case 'dataset':
                case 'displayfield':
                case 'datafield':
                    var data;
                    if ($s.dataset) {
                        if ($s.binddataset) {
                            data = $s.dataset.data || (WM.isArray($s.dataset) ? $s.dataset : [$s.dataset]);
                        } else {
                            data = _.split($s.dataset, ',');
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
                        if (CONSTANTS.isStudioMode) {
                            $is.widgetProps = Utils.getClonedObject(widgetProps);
                        } else {
                            $is.widgetProps = widgetProps;
                        }
                        if (!attrs.widgetid) {
                            var data;
                            Object.defineProperty($is, '_model_', {
                                get: function () {
                                    return this._proxyModel;
                                },
                                set: function (newVal) {
                                    this._proxyModel = newVal;
                                    if (!newVal) {
                                        //Handling the form reset usecase
                                        $is.selectedChips.length = 0;
                                    } else if (!$is.binddataset) {
                                        //Handling the script usecase
                                        data = _.split(newVal, ',');
                                        createSelectOptions(data, $is);
                                    }
                                }
                            });
                        }
                    },
                    'post': function ($s, $el, attrs) {
                        init($s);

                        if (!$s.studioMode) {
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

                        // register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $s, $el), $s, notifyFor);
                        WidgetUtilService.postWidgetCreate($s, $el, attrs);
                    }
                }
            };
        }]);
