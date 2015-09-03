/*global WM, window, document, FormData, Blob*/
/*Directive for liveform */

WM.module('wm.widgets.live')
    /*Define controller for the liveform in dialog mode - required*/
    .controller('liveFormDialogController', WM.noop)
    .directive('wmLiveform', ['PropertiesFactory', 'WidgetUtilService', '$compile', '$rootScope', 'CONSTANTS', '$controller', 'Utils', '$templateCache', 'wmToaster', '$filter', 'LiveWidgetUtils', function (PropertiesFactory, WidgetUtilService, $compile, $rootScope, CONSTANTS, $controller, Utils, $templateCache, wmToaster, $filter, LiveWidgetUtils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.layouts.liveform", ["wm.layouts", "wm.base.events.successerror"]),
            notifyFor = {
                'dataset': true,
                'captionsize': true,
                'novalidate': true,
                'autocomplete': true,
                'rowdata': true,
                'formdata': true,
                'updatemode': true,
                'formtype': true,
                'layout': true,
                'defaultmode': true
            },
            /*check if the field is of column type time or widget type time*/
            isTimeType = function (field) {
                return field.widgetType === 'Time' || (field.type === 'time' && !field.widgetType);
            },
            /*Convert time value to a valid date time value*/
            getValidTime = function (val) {
                var date = (new Date()).toDateString();
                return (new Date(date + ' ' + val)).getTime();
            },
            dateTimeFormats = Utils.getDateTimeDefaultFormats();

        return {
            restrict: 'E',
            replace: true,
            scope: {
                //"onSuccess": "&",
                //"onError": "&",
                "onBeforeservicecall": "&",
                "onResult": "&"
            },
            require: '?^wmLivegrid',
            template: function (template, attrs) {
                if (CONSTANTS.isRunMode && (attrs.formtype === 'dialog' || attrs.layout === 'dialog')) {
                    /*Generate a unique id for the dialog to avoid conflict with multiple dialogs.*/
                    attrs.dialogid = 'liveformdialog-' + attrs.name + '-' + Utils.generateGUId();
                    return '<div data-identifier="liveform" init-widget data-ng-show="show" class="app-liveform liveform-dialog" autocomplete="autocomplete" >' +
                                '<wm-dialog width="{{dialogWidth}}" name="' + attrs.dialogid + '" title="{{title}}" modal="true" controller="liveFormDialogController">' +
                                    '<wm-dialogheader></wm-dialogheader>' +
                                    '<wm-dialogcontent class="noscroll">' +
                                        '<form data-identifier="liveform" role="form" name="' + attrs.name + '" class="app-liveform align-{{captionalign}} position-{{captionposition}}" data-ng-submit="formSave($event);" apply-styles="shell">' +
                                            '<div class="form-elements" data-ng-class="{\'update-mode\': isUpdateMode }" data-ng-style="{height: height, overflow: height ? \'auto\': overflow, paddingTop: paddingtop + paddingunit,paddingRight: paddingright + paddingunit,paddingLeft: paddingleft + paddingunit,paddingBottom: paddingbottom + paddingunit}">' +
                                                '<div class="form-content">' + template.context.innerHTML + '</div>' +
                                            '</div>' +
                                            '<div class="basic-btn-grp form-action modal-footer clearfix">' +
                                                '<div class="action-content"></div>' +
                                            '</div>' +
                                        '</form>' +
                                    '</wm-dialogcontent>' +
                                '</wm-dialog>' +
                                //'<div ng-transclude></div>' +
                            '</div>';
                }
                return '<form data-identifier="liveform" init-widget data-ng-show="show" role="form" class="app-liveform panel panel-default liveform-inline align-{{captionalign}} position-{{captionposition}}" data-ng-submit="formSave($event);" autocomplete="autocomplete" apply-styles="shell">' +
                            '<div data-ng-show="isLayoutDialog"><i class="wm-icon24 glyphicon glyphicon-cog"></i>Live form in dialog mode</div>' +
                            '<div class="form-header panel-heading" data-ng-show="!isLayoutDialog" data-ng-if="title"><h3 class="panel-title">' +
                                '<i class="{{iconclass}}" data-ng-style="{width:iconwidth, height:iconheight, margin:iconmargin}"></i>' +
                                '<span class="form-header-text">{{title}}</span>' +
                            '</h3></div>' +
                            '<div class="form-elements panel-body" data-ng-class="{\'update-mode\': isUpdateMode }" data-ng-show="!isLayoutDialog" data-ng-style="{height: height, overflow: height ? \'auto\': overflow, paddingTop: paddingtop + paddingunit,paddingRight: paddingright + paddingunit,paddingLeft: paddingleft + paddingunit,paddingBottom: paddingbottom + paddingunit}">' +
                                template.context.innerHTML +
                            '</div>' +
                            '<div class="basic-btn-grp form-action panel-footer clearfix" data-ng-hide="isLayoutDialog"></div>' +
                        '</form>';
            },
            controller: function ($scope, Variables) {
                $scope.__compileWithIScope = true;
                /* when the service call ended this function will be called */
                /* prevformFields is used for showing the previous data when cancel is clicked and also for update calls*/
                var prevformFields,
                    prevDataObject = {},
                    onResult = function (data, status, event) {
                        /* whether service call success or failure call this method*/
                        $scope.onResult({$event: event, $operation: $scope.operationType, $data: data});
                        if (status) {
                            /*if service call is success call this method */
                            Utils.triggerFn($scope.onSuccess, {$event: event, $operation: $scope.operationType, $data: data});
                        } else {
                            /* if service call fails call this method */
                            Utils.triggerFn($scope.onError, {$event: event, $operation: $scope.operationType, $data: data});
                        }

                    };
                $scope.prevDataValues = {};
                /*Function to check whether the key is a composite key or not.*/
                $scope.isCompositeKey = function () {
                    return !$scope.primaryKey || ($scope.primaryKey && (!$scope.primaryKey.length || $scope.primaryKey.length > 1));
                };

                /*Function to check whether the table associated with the live-variable bound to the live-form has a primary key or not.*/
                $scope.isNoPrimaryKey = function () {
                    return (!$scope.primaryKey || ($scope.primaryKey && !$scope.primaryKey.length));
                };
                $scope.findOperationType = function () {
                    var operation;
                    /*If OperationType is not set then based on the formdata object return the operation type,
                        this case occurs only if the form is outside a livegrid*/
                    /*If the formdata object has primary key value then return update else insert*/
                    if ($scope.primaryKey && $scope.formdata) {
                        /*If only one column is primary key*/
                        if ($scope.primaryKey.length === 1) {
                            if ($scope.formdata[$scope.primaryKey[0]]) {
                                operation = 'update';
                            }
                        /*If only no column is primary key*/
                        } else if ($scope.primaryKey.length === 0) {
                            operation = WM.forEach($scope.formdata, function (value) {
                                if (value) {
                                    return 'update';
                                }
                            });
                        /*If multiple columns are primary key*/
                        } else {
                            operation = $scope.primaryKey.some(function (primarykey) {
                                if ($scope.formdata[primarykey]) {
                                    return 'update';
                                }
                            });
                        }
                    }
                    return operation || 'insert';
                };

                /*Function use to save the form and open new form after save*/
                $scope.saveAndNew = function () {
                    $scope.formSave(undefined, true);
                };
                /*Method to handle the insert, update, delete actions*/
                /*The operationType decides the type of action*/
                $scope.formSave = function (event, newForm) {
                    var data,
                        prevData,
                        requestData = {},
                        elScope = $scope.element.scope(),
                        variable = elScope.Variables[$scope.variableName],
                        isValid;
                    if ($scope.propertiesMap && $scope.propertiesMap.tableType === "VIEW") {
                        wmToaster.show('info', 'Not Editable', 'Table of type view, not editable');
                        return;
                    }
                    /*If live-form is in a dialog, then always fetch the formElement by name
                    because the earlier reference "$scope.formElement" would be destroyed on close of the dialog.*/
                    $scope.formElement = $scope.isLayoutDialog ? (document.forms[$scope.name]) : ($scope.formElement || document.forms[$scope.name]);

                    /*Check if checkValidity is defined and then the validity of the inputs*/
                    if (WM.isFunction($scope.formElement[0].checkValidity)) {
                        if (!$scope.formElement[0].checkValidity()) {
                            return;
                        }
                    }
                    $scope.operationType = $scope.operationType || $scope.findOperationType();
                    /*Construct the data object with required values from the formFields*/
                    /*If it is an update call send isUpdate true for constructDataObject so the dataObject is
                    constructed out of the previous object*/
                    data = $scope.constructDataObject($scope.formFields);
                    $scope.dataoutput = data;
                    prevData = prevformFields ? $scope.constructDataObject(prevformFields) : data;
                    try {
                        isValid = $scope.onBeforeservicecall({$event: event, $operation: $scope.operationType, $data: data});
                        if (isValid === false) {
                            return;
                        }
                        if (isValid && isValid.error) {
                            wmToaster.show('error', 'ERROR', isValid.error);
                            return;
                        }
                    } catch (err) {
                        if (err.message === "Abort") {
                            return;
                        }
                    }
                    requestData = {
                        "row": data,
                        "transform": true,
                        "multipartData": $scope.multipartData
                    };
                    /*Pass in the prefab scope if the liveForm is present in a prefab, as the bound variable is available in the prefab scope only*/
                    if (elScope.prefabname) {
                        requestData.scope = elScope;
                    }
                    /*Based on the operationType decide the action*/
                    switch ($scope.operationType) {
                    case "update":
                        requestData.rowData = $scope.rowdata;
                        requestData.prevData = prevData;
                        variable.updateRecord(requestData, function (response) {
                            /*Display appropriate error message in case of error.*/
                            if (response.error) {
                                /*disable readonly and show the appropriate error*/
                                wmToaster.show('error', 'ERROR', response.error);
                                onResult(response, false, event);
                            } else {
                                wmToaster.show('success', 'SUCCESS', $scope.updatemessage);
                                onResult(response, true, event);
                                if ($scope.ctrl) {
                                    /* highlight the current updated row */
                                    $scope.$emit("on-result", "update", response, newForm);
                                } else {
                                    /*get updated data without refreshing page*/
                                    variable.update({
                                        "type": "wm.LiveVariable",
                                        "isNotTriggerForRelated": true
                                    }, WM.noop);
                                }
                            }
                        }, function (error) {
                            wmToaster.show('error', 'ERROR', error);
                            onResult(error, false, event);
                        });
                        break;
                    case "insert":
                        variable.insertRecord(requestData, function (response) {
                            /*Display appropriate error message in case of error.*/
                            if (response.error) {
                                wmToaster.show('error', 'ERROR', response.error);
                                onResult(response, false, event);
                            } else {
                                wmToaster.show('success', 'SUCCESS', $scope.insertmessage);
                                onResult(response, true, event);
                                /* if successfully inserted  change editable mode to false */
                                if ($scope.ctrl) {
                                    /* highlight the current updated row */
                                    $scope.$emit("on-result", "insert", response, newForm);
                                } else {
                                    /*get updated data without refreshing page*/
                                    variable.update({
                                        "type": "wm.LiveVariable",
                                        "isNotTriggerForRelated": true
                                    }, WM.noop);
                                }
                            }
                        }, function (error) {
                            wmToaster.show('error', 'ERROR', error);
                            onResult(error, false, event);
                        });
                        break;

                    case "delete":
                        if ($scope.ctrl) {
                            if (!$scope.ctrl.confirmMessage()) {
                                return;
                            }
                        }
                        variable.deleteRecord(requestData, function (success) {
                            /* check the response whether the data successfully deleted or not , if any error occurred show the
                             * corresponding error , other wise remove the row from grid */
                            if (success && success.error) {
                                wmToaster.show('error', 'ERROR', success.error);
                                onResult(success, false);
                                return;
                            }
                            onResult(success, true);
                            $scope.clearData();
                            wmToaster.show('success', 'SUCCESS', $scope.deletemessage);
                            $scope.isSelected = false;
                            /*get updated data without refreshing page*/
                            if ($scope.ctrl) {
                                $scope.$emit("on-result", "delete", success);
                            } else {
                                variable.update({
                                    "type": "wm.LiveVariable",
                                    "isNotTriggerForRelated": true
                                }, WM.noop);
                            }

                        }, function (error) {
                            wmToaster.show('error', 'ERROR', error);
                            onResult(error, false);
                        });
                        break;
                    }
                };
                /*Function to set the previous data array to be used while updating records in a live-form.*/
                $scope.setPrevformFields = function (formFields) {
                    prevformFields = WM.copy(formFields);
                    prevDataObject = WM.copy($scope.rowdata);
                };
                /*Method to clear the fields and set the form to readonly*/
                $scope.formCancel = function () {
                    $scope.clearData();
                    /*Show the previous selected data*/
                    if ($scope.isSelected) {
                        $scope.formFields = WM.copy(prevformFields) || $scope.formFields;
                    }
                    $scope.$emit("on-cancel");
                };
                /*clear the formFields*/
                /*Method to save the previous data values. This will be used on form reset*/
                $scope.setPrevDataValues = function () {
                    if ($scope.formFields) {
                        $scope.prevDataValues = $scope.formFields.map(function (obj) {
                            return {'key': obj.key, 'value': obj.value};
                        });
                    }
                };
                /*Method to reset the form to original state*/
                $scope.reset = function () {
                    if (WM.isArray($scope.formFields)) {
                        $scope.formFields.forEach(function (dataValue) {
                            var prevObj = _.find($scope.prevDataValues, function (obj) {
                                return obj.key === dataValue.key;
                            });
                            dataValue.value = prevObj ? prevObj.value : undefined;
                        });
                    }
                };
                /*clear the formFields*/
                function emptyDataModel() {
                    $scope.formFields.forEach(function (dataValue) {
                        if (dataValue.type === 'blob') {
                            WM.element($scope.formElement).find('[name=' + dataValue.key + ']').val('');
                            dataValue.href = '';
                        }
                        dataValue.value = '';
                    });
                }
                /*Method to update, sets the operationType to "update" disables the readonly*/
                $scope.edit = function () {
                    /*set the formFields into the prevformFields only in case of inline form
                    * in case of dialog layout the set prevformFields is called before manually clearing off the formFields*/

                    if (!$scope.isLayoutDialog) {
                        if ($scope.isSelected) {
                            prevformFields = WM.copy($scope.formFields);
                        }
                        /*Set the rowdata to prevDataObject irrespective whether the row is selected
                         or not*/
                        prevDataObject = WM.copy($scope.rowdata);
                    }
                    $scope.setReadonlyFields();
                    $scope.isUpdateMode = true;
                    $scope.operationType = "update";
                };
                /*Method clears the fields, sets any defaults if available,
                 disables the readonly, and sets the operationType to "insert"*/
                $scope.new = function () {
                    if ($scope.isSelected && !$scope.isLayoutDialog) {
                        prevformFields = WM.copy($scope.formFields);
                    }
                    if ($scope.formFields && $scope.formFields.length > 0) {
                        emptyDataModel();
                    }
                    $scope.setDefaults();
                    $scope.setPrevDataValues();
                    $scope.isUpdateMode = true;
                    $scope.operationType = "insert";
                };
                $scope.filetypes = {
                    "image": "image/*",
                    "video": "video/*",
                    "audio": "audio/*"
                };
                $scope.isDateTimeWidgets = Utils.getDateTimeTypes();
               /*Set if any default values, if given*/
                $scope.setDefaults = function () {
                    $scope.formFields.forEach(function (fieldObj) {
                        $scope.setDefaultValueToValue(fieldObj);
                    });
                };
                $scope.setDefaultValueToValue = function (fieldObj) {
                    var defaultValue = fieldObj.defaultValue;
                    /*Set the default value only if it exists.*/
                    if (defaultValue && defaultValue !== "null") {
                        fieldObj.value = LiveWidgetUtils.getDefaultValue(defaultValue, fieldObj.type);
                    } else {
                        fieldObj.value = undefined;
                    }
                    if (fieldObj.type === "blob") {
                        /*Handle default*/
                        fieldObj.permitted = $scope.filetypes[fieldObj.filetype] + (fieldObj.extensions ? ',' + fieldObj.extensions : '');
                    }
                    /*If the field is primary but is assigned set readonly false.
                     Assigned is where the user inputs the value while a new entry.
                     This is not editable(in update mode) once entry is successful*/
                    if (fieldObj.primaryKey && fieldObj.generator === "assigned") {
                        fieldObj.readonly = false;
                    }
                    $scope.setPrevDataValues();
                };
                $scope.setReadonlyFields = function () {
                    $scope.formFields.forEach(function (column) {
                        if (column.primaryKey) {
                            column.readonly = true;
                        }
                    });
                };
                /*Sets the operationType to "delete" and calls the formSave function to handle the action*/
                $scope.delete = function () {
                    $scope.operationType = "delete";
                    $scope.formSave();
                };
                /*Check if the data is in required format, i.e, if the field has a key and type*/
                $scope.isInReqdFormat = function (data) {
                    return (WM.isArray(data) && data[0].key && data[0].type);
                };
                /*construct the data object from the formFields*/
                $scope.constructDataObject = function (formFields) {
                    var dataObject = ($scope.operationType === 'update') ? WM.copy(Utils.isEmptyObject(prevDataObject) ? $scope.formdata : prevDataObject) : {},
                        formName = $scope.name,
                        isFormDataSupported = (window.File && window.FileReader && window.FileList && window.Blob),
                        formData;

                    if (isFormDataSupported) {
                        /* Angular does not bind file values so using native object to send files */
                        formData = new FormData();
                    }
                    formFields.forEach(function (field) {
                        /*collect the values from the fields and construct the object*/
                        /*Format the output of date time widgets to the given output format*/
                        if (((field.widgetType && $scope.isDateTimeWidgets[field.widgetType.toLowerCase()]) || $scope.isDateTimeWidgets[field.type])) {
                            if (field.value && !isNaN(field.value)) {
                                field.value = Number(field.value);
                            }
                            if (field.outputformat && field.outputformat !== "timestamp") {
                                dataObject[field.key] = $filter('date')(field.value, field.outputformat);
                            } else {
                                dataObject[field.key] = field.value;
                            }
                        } else if (field.type === "blob") {
                            if (isFormDataSupported) {
                                $scope.multipartData = true;
                                /*Display an error message if no file is selected and simply return.*/
                                //if (document.forms[formName].file.files.length === 0) {
                                /*Handle if file not selected*/
                                //}
                                /*1. Append the uploaded script file.
                                 * 2. Append the connection properties.*/
                                formData.append(field.key, document.forms[formName][field.key].files[0]);
                            }
                        } else if (field.type === "list") {
                            if (field.value) {
                                dataObject[field.key] = field.value;
                            }
                        } else {
                            dataObject[field.key] = field.value;
                        }
                    });
                    if ($scope.multipartData) {
                        formData.append('wm_data_json', new Blob([JSON.stringify(dataObject)], {
                            type: "application/json"
                        }));
                        return formData;
                    }
                    return dataObject;
                };


                /*Clear the fields in the array*/
                $scope.clearData = function () {
                    if ($scope.formFields && $scope.formFields.length > 0) {
                        emptyDataModel();
                    }
                };
                /*Set the form fields to readonly*/
                $scope.setReadonly = function (element) {
                    WM.element(element)
                        .find('input, textarea')
                        .attr('disabled', true);
                };
                /*Disable readonly*/
                $scope.removeReadonly = function (element) {
                    WM.element(element)
                        .find('input, textarea')
                        .attr('disabled', false);
                };
                $scope.isUpdateMode = false;

                /*Loop through the column definitions and get the primary key*/
                $scope.getPrimaryKey = function (columnArray) {
                    var primaryKey;
                    WM.forEach(columnArray, function (column) {
                        if (column.isPrimaryKey) {
                            primaryKey = column.fieldName;
                        }
                    });
                    return primaryKey;
                };
                /*Function to set the specified column as a primary key by adding it to the primary key array.*/
                $scope.setPrimaryKey = function (columnName) {
                    /*Store the primary key of data*/
                    if (WM.element.inArray(columnName, $scope.primaryKey) === -1) {
                        $scope.primaryKey.push(columnName);
                    }
                };

                /*Translate the variable rawObject into the formFields for form construction*/
                $scope.translateVariableObject = function (rawObject) {
                    return LiveWidgetUtils.translateVariableObject(rawObject, $scope);
                };
                $scope.changeDataObject = function (dataObj) {
                    var primaryKey,
                        href;
                    $scope.formFields.forEach(function (value) {
                        if (isTimeType(value)) {
                            value.value = getValidTime(dataObj[value.key]);
                        } else if (value.type === "blob") {
                            primaryKey = $scope.dataset.propertiesMap.primaryKeys.join();
                            href = (($scope.variableObj.prefabName !== "" &&  $scope.variableObj.prefabName !== undefined) ? "prefabs/" + $scope.variableObj.prefabName : "services") + '/';
                            href = href + $scope.variableObj.liveSource + '/' + $scope.variableObj.type + '/' + dataObj[primaryKey] + '/content/' + value.key + '?' + Math.random();
                            value.href = href;
                        } else {
                            value.value = dataObj[value.key];
                        }
                    });
                    $scope.setPrevDataValues();
                };

                $scope.setFieldVal = function (fieldDef) {
                    var dataObj = $scope.rowdata, primaryKey, href;
                    if (!dataObj) {
                        return;
                    }
                    if (isTimeType(fieldDef)) {
                        fieldDef.value = getValidTime(dataObj[fieldDef.key]);
                    } else if (fieldDef.type === "blob") {
                        primaryKey = $scope.dataset.propertiesMap.primaryKeys.join();
                        href = 'services/' + $scope.variableObj.liveSource + '/' + $scope.variableObj.type + '/' + dataObj[primaryKey] + '/content/' + fieldDef.key + '?' + Math.random();
                        fieldDef.href = href;
                    } else {
                        fieldDef.value = dataObj[fieldDef.key];
                    }
                };

                /*For related fields, get the display value from the object*/
                $scope.getDisplayExpr = function (object, displayExpr) {
                    if (WM.isObject(object)) {
                        if (!displayExpr) {
                            displayExpr = Object.keys(object)[0];
                        }
                        return Utils.getEvaluatedExprValue(object, displayExpr, $scope);
                    }
                    return object;
                };
                /*returns the default output formats for date time types*/
                $scope.getOutputPatterns = function (type, outputFormat) {
                    if (type === 'date' || type === 'time' || type === 'datetime') {
                        return dateTimeFormats[type];
                    }
                    return outputFormat;
                };

                /*Call respective functions for save and cancel*/
                $scope.save = function () {
                    $scope.formSave();
                };

                $scope.cancel = function () {
                    $scope.formCancel();
                };
                /*For backward compatibility of update action*/
                $scope.update = function () {
                    $scope.edit();
                };
            },
            compile: function () {
                return {
                    pre: function (scope, element, attrs) {
                        var elScope = element.scope();
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                        //remove this condition later. for backward compatibility
                        if (attrs.layout === "dialog" || attrs.formtype === "dialog") {
                            scope.isLayoutDialog = true;
                            scope._dialogid = attrs.dialogid;
                        }

                        scope.Variables = elScope.Variables;
                        scope.Widgets = elScope.Widgets;
                    },
                    post: function (scope, element, attrs, controller) {
                        scope.ctrl = controller;
                        //remove this condition later. for backward compatibility
                        if (attrs.formtype !== 'dialog' && attrs.layout !== 'dialog') {
                            scope.formElement = element;
                        } else {
                            /* for dialog layout dialog will take the width assigned to the form */
                            if (CONSTANTS.isRunMode) {
                                scope.dialogWidth = scope.width;
                                scope.width = "100%";
                            }
                        }
                        scope.element = element;
                        var formController,
                            handlers = [];

                        scope.getActiveLayout = function () {
                            return LiveWidgetUtils.getColumnCountByLayoutType(scope.layout);
                        };
                        /*
                         * Extend the properties from the form controller exposed to end user in page script
                         * Kept in try/catch as the controller may not be available sometimes
                         */
                        if (CONSTANTS.isRunMode) {
                            try {
                                formController = scope.name + "Controller";
                                $controller(formController, {$scope: scope});
                            } catch (ignore) {
                            }
                        }

                        // returns the grid object when dataset is empty
                        function getEmptyDataSetGridObj() {
                            return {
                                widgetName: scope.name,
                                fieldDefs: [],
                                buttonDefs: [],
                                scopeId: scope.$id,
                                numColumns: scope.getActiveLayout()
                            };
                        }

                        // returns the grid object when dataset is not empty
                        function getNonEmptyDatSetGridObj() {
                            return {
                                widgetName: scope.name,
                                fieldDefs: scope.formFields,
                                buttonDefs: scope.buttonArray,
                                scopeId: scope.$id,
                                numColumns: scope.getActiveLayout()
                            };
                        }

                        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
                        function propertyChangeHandler(key, newVal) {
                            var value,
                                labelElements,
                                elementScope,
                                translatedObj,
                                tempVarName,
                                gridObj,
                                variableRegex = /^bind:Variables\.(.*)\.dataSet$/,
                                variableObj,
                                elScope = element.scope();

                            switch (key) {
                            case "dataset":
                                /*Process the dataset if only the data is an array*/
                                if (newVal.propertiesMap && WM.isArray(newVal.propertiesMap.columns)) {
                                    tempVarName = scope.binddataset.match(variableRegex)[1];
                                    if (scope.variableName && (tempVarName !== scope.variableName)) {
                                        scope.formCreated = false;
                                        scope.formConstructed = false;
                                    }
                                    scope.variableName = tempVarName;
                                    /*Check if form has been created, if true translate the variable object.*/
                                    if ((scope.formCreated || scope.formConstructed) && scope.formFields) {
                                        translatedObj = scope.translateVariableObject(newVal);
                                        scope.translatedObj = translatedObj;
                                        /*Check if the formFields is defined, then in the formFields array override only certain fields.*/
                                        scope.formFields.forEach(function (fieldObject) {
                                            translatedObj.forEach(function (transObj) {
                                                if (transObj.key === fieldObject.key) {
                                                    fieldObject.isRelated = transObj.isRelated;
                                                    fieldObject.type = transObj.type; /*Set the type of the column to the default variable type*/
                                                    fieldObject.outputformat = scope.getOutputPatterns(fieldObject.type, fieldObject.outputformat);
                                                }
                                            });
                                        });

                                        variableObj =  elScope.Variables && elScope.Variables[scope.variableName];
                                        scope.variableObj = variableObj;
                                        if (variableObj) {
                                            /* set the variable type info to the live-form selected-entry type, so that type matches to the variable for which variable is created*/
                                            scope.widgetProps.formdata.type = variableObj.type;
                                            scope.widgetProps.dataoutput.type = 'object, ' + variableObj.type;
                                        }
                                    } else {
                                        /*Defining two buttons for default actions*/
                                        scope.buttonArray = LiveWidgetUtils.getFormButtons().filter(function (button) {
                                            return button.key === 'cancel' || button.key === 'save';
                                        });
                                        variableObj = elScope.Variables && elScope.Variables[scope.variableName];
                                        scope.variableObj = variableObj;
                                        if (variableObj) {
                                            /* set the variable type info to the live-form selected-entry type, so that type matches to the variable for which variable is created*/
                                            scope.widgetProps.formdata.type = variableObj.type;
                                        }
                                        /*Check if the newVal is in the required format, checking for key and type for each field,
                                         * else call the translateVariableObject method*/
                                        if (scope.isInReqdFormat(newVal)) {
                                            translatedObj = newVal;
                                        } else {
                                            translatedObj = scope.translateVariableObject(newVal);
                                        }
                                        scope.translatedObj = translatedObj;
                                        scope.formFields = translatedObj;
                                    }
                                    gridObj = getNonEmptyDatSetGridObj();
                                    if (CONSTANTS.isRunMode) {
                                        scope.setDefaults();
                                    }
                                } else if (!newVal) {
                                    /*If variable binding has been removed empty the form and the variableName*/
                                    if (CONSTANTS.isStudioMode) {
                                        element.find('.form-elements').empty();
                                    }
                                    scope.variableName = '';
                                    /*When initially a variable is bound to the live-form the form is constructed and the
                                     markup is updated with the form field action and button directives*/
                                    gridObj = getEmptyDataSetGridObj();
                                }
                                if (CONSTANTS.isStudioMode && gridObj && (!scope.formFieldCompiled || scope.newcolumns)) {
                                    scope.newcolumns = false;
                                    gridObj.bindDataSetChanged = true;
                                    $rootScope.$emit('formFieldsDefs-modified', gridObj);
                                }
                                break;
                            case 'captionsize':
                                labelElements = WM.element(element).find('.app-label');
                                /*Set the width of all labels in the form to the caption size*/
                                WM.forEach(labelElements, function (childelement) {
                                    elementScope = WM.element(childelement).isolateScope();
                                    elementScope.width = newVal;
                                });
                                break;
                            case 'novalidate':
                                /*Add or remove the novalidate attribute based on the input*/
                                if (newVal === true || newVal === "true") {
                                    element.attr('novalidate', '');
                                } else {
                                    element.removeAttr('novalidate');
                                }
                                break;
                            case 'autocomplete':
                                /*Set the auto complete on/off based on the input*/
                                value = (newVal === true || newVal === "true") ? 'on' : 'off';
                                element.attr(key, value);
                                break;
                            case "rowdata":
                                if (newVal && WM.isObject(newVal)) {
                                    scope.changeDataObject(newVal);
                                }
                                break;
                            case "formdata":
                                if (newVal && WM.isObject(newVal)) {
                                    scope.changeDataObject(newVal);
                                }
                                break;
                            case "updatemode":
                                scope.isUpdateMode = (newVal === true || newVal === "true");
                                break;
                            case "defaultmode":
                                if (newVal && newVal === 'Edit') {
                                    scope.updateMode = true;
                                } else {
                                    scope.updateMode = false;
                                }
                                scope.isUpdateMode = scope.updateMode;
                                break;
                            case "formtype":
                                scope.isLayoutDialog = newVal === 'dialog';
                                element.toggleClass('liveform-dialog', scope.isLayoutDialog);
                                break;
                            case "layout":
                                if (newVal) {
                                    if ((newVal === 'dialog') || (newVal === 'inline')) {
                                    //remove this condition later. for backward compatibility for the layout property
                                        scope.formtype = newVal;
                                    } else {
                                        gridObj = getNonEmptyDatSetGridObj();

                                        if (CONSTANTS.isStudioMode && gridObj && scope.newcolumns) {
                                            scope.newcolumns = false;
                                            $rootScope.$emit('formFieldsDefs-modified', gridObj);
                                        }
                                    }
                                }
                                break;
                            }
                        }

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler, scope, notifyFor);

                        if (scope.widgetid) {
                            /* event emitted on building new markup from canvasDom */
                            handlers.push($rootScope.$on('compile-form-fields', function (event, scopeId, markup, newVal, fromDesigner) {
                                /* as multiple form directives will be listening to the event, apply field-definitions only for current form */
                                if (scope.$id === scopeId) {
                                    scope.formFields = undefined;
                                    scope.buttonArray = undefined;
                                    element.find('.form-elements').empty();
                                    element.find('.basic-btn-grp').empty();
                                    scope.formConstructed = fromDesigner;
                                    /*If the event has been emitted after changes in the liveFormDesigner then empty the form and reconstruct*/
                                    if (markup) {
                                        scope.formConstructed = true;
                                        var markupObj = WM.element('<div>' + markup + '</div>'),
                                            fieldsObj = markupObj.find('wm-layoutgrid'),
                                            actionsObj = markupObj.find('wm-form-action');

                                        /* if layout grid template found, simulate canvas dom addition of the elements */
                                        if (fieldsObj) {
                                            $rootScope.$emit('prepare-element', fieldsObj, function () {
                                                element.find('.form-elements').append(fieldsObj);
                                                element.find('.basic-btn-grp').append(actionsObj);
                                                $compile(fieldsObj)(scope);
                                                $compile(actionsObj)(scope);
                                            });
                                        } else {
                                            /* else compile and add the form fields */
                                            fieldsObj = markupObj.find('wm-form-field');
                                            element.find('.form-elements').append(fieldsObj);
                                            element.find('.basic-btn-grp').append(actionsObj);
                                            $compile(fieldsObj)(scope);
                                            $compile(actionsObj)(scope);
                                        }
                                    }
                                }
                            }));
                        }
                        scope.$on("$destroy", function () {
                            handlers.forEach(Utils.triggerFn);
                        });

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }])
    .directive("wmFormField", ["Utils", "$compile", "CONSTANTS", "Variables", "BindingManager", "LiveWidgetUtils", function (Utils, $compile, CONSTANTS, Variables, BindingManager, LiveWidgetUtils) {
        'use strict';
        return {
            "restrict": 'E',
            "template": "",
            "scope": true,
            "replace": true,
            "compile": function () {
                return {
                    "pre": function (scope) {
                        scope.widgetProps = [];
                    },
                    "post": function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with live filter scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        var parentIsolateScope,
                            template,
                            index,
                            columnDef,
                            expr,
                            exprWatchHandler,
                            variable,
                            variableObj = {},
                            variableData,
                            dataSetWatchHandler,
                            defaultObj;
                        if (CONSTANTS.isRunMode && scope.isLayoutDialog) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = (element.parent() && element.parent().length > 0) ? element.parent().closest('[data-identifier="liveform"]').isolateScope() || scope.$parent : scope.$parent;
                        }

                        columnDef = WM.extend(LiveWidgetUtils.getColumnDef(attrs), {
                            'key': attrs.key || attrs.binding,
                            'outputformat': attrs.outputformat,
                            'displayvalue': attrs.displayvalue,
                            'regexp': attrs.regexp || ".*",
                            'datafield': attrs.datafield,
                            'displayfield': attrs.displayfield,
                            'width' : attrs.width,
                            'height': attrs.height,
                            'maxvalue' : attrs.maxvalue,
                            'minvalue' : attrs.minvalue
                        });
                        attrs.isRelated =  attrs.isRelated === "true" || attrs.primaryKey === true;
                        /*if the show property is set to false, set the required property to false (except for identity columns)
                         * This will prevent 'required field can not be focused' error*/
                        if (CONSTANTS.isRunMode && columnDef.show === false && columnDef.generator !== 'identity') {
                            columnDef.required = false;
                        }
                        /*If defaultValue is set then assign it to the attribute*/
                        if (attrs.defaultValue) {
                            if (Utils.stringStartsWith(attrs.defaultValue, 'bind:') && CONSTANTS.isRunMode) {
                                expr = attrs.defaultValue.replace('bind:', '');
                                if (scope.Variables && !Utils.isEmptyObject(scope.Variables) && scope.$eval(expr)) {
                                    columnDef.defaultValue = scope.$eval(expr);
                                } else {
                                    exprWatchHandler = BindingManager.register(scope, expr, function (newVal) {
                                        parentIsolateScope.formFields[index].defaultValue = newVal;
                                        if (parentIsolateScope.operationType !== 'update') {
                                            parentIsolateScope.setDefaultValueToValue(columnDef);
                                        }
                                    }, {"deepWatch": true, "allowPageable": true, "acceptsArray": false});
                                }
                            } else {
                                columnDef.defaultValue = attrs.defaultValue;
                            }
                        }
                        if (attrs.widgetType) {
                            columnDef.widgetType = attrs.widgetType;
                        }
                        if (attrs.dataset) {
                            if (Utils.stringStartsWith(attrs.dataset, 'bind:') && CONSTANTS.isRunMode) {
                                expr = attrs.dataset.replace('bind:', '');
                                /*Watch on the bound variable. dataset will be set after variable is populated.*/
                                dataSetWatchHandler = parentIsolateScope.$watch(expr, function (newVal) {
                                    variable = parentIsolateScope.Variables[expr.split('.')[1]];
                                    if (WM.isObject(variable)) {
                                        if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                                            parentIsolateScope.formFields[index].dataset = newVal.content;
                                        } else if (variable.category === "wm.LiveVariable") {
                                            parentIsolateScope.formFields[index].dataset = newVal.data;
                                        } else {
                                            parentIsolateScope.formFields[index].dataset = newVal;
                                        }
                                        /* fallback to set datafield to 'All Fields' for backward compatibility */
                                        if (!attrs.datafield) {
                                            parentIsolateScope.formFields[index].datafield = "All Fields";
                                        }
                                    }
                                });
                            } else {
                                columnDef.dataset = attrs.dataset;
                            }
                        } else if (attrs.isRelated) {
                            /*when the field is related and dataset is not bound, set the dataset to related data of the live form bound variable
                             and set the display field to primary key of the related table*/
                            expr = parentIsolateScope.binddataset.replace('bind:', ''); /*live form bound variable*/
                            /*Watch on the bound variable. dataset will be set after variable is populated.*/
                            dataSetWatchHandler = parentIsolateScope.$watch(expr, function (newVal) {
                                if (newVal) {
                                    parentIsolateScope.formFields[index].dataset = newVal.relatedData && newVal.relatedData[columnDef.key];
                                    variableObj.type = columnDef.displayName;
                                    variableObj.isDefault = true;
                                    variableObj.category = 'wm.LiveVariable';
                                    variableData = Variables.filterByVariableKeys(variableObj, true);
                                    /*Search for the live variable with the table name*/
                                    if (variableData.length) {
                                        parentIsolateScope.formFields[index].displayfield = parentIsolateScope.getPrimaryKey(variableData[0].propertiesMap.columns);
                                        parentIsolateScope.formFields[index].datafield = "All Fields";
                                    } else if (newVal.propertiesMap) {
                                        parentIsolateScope.formFields[index].displayfield = columnDef.relatedFieldName;
                                        parentIsolateScope.formFields[index].datafield = "All Fields";
                                    }
                                }
                            });
                        }
                        if (attrs.extensions) {
                            columnDef.extensions = attrs.extensions;
                        }
                        if (attrs.filetype) {
                            columnDef.filetype = attrs.filetype;
                        }

                        if (scope.isLayoutDialog) {
                            defaultObj = _.find(parentIsolateScope.translatedObj, function (obj) {
                                return obj.key === columnDef.key;
                            });
                            if (defaultObj) {
                                columnDef.isRelated = defaultObj.isRelated;
                                columnDef.type = defaultObj.type;
                                columnDef.outputformat = parentIsolateScope.getOutputPatterns(columnDef.type, columnDef.outputformat);
                            }
                            parentIsolateScope.setDefaultValueToValue(columnDef);
                            parentIsolateScope.setFieldVal(columnDef);
                            if (scope.operationType === 'update') {
                                scope.setReadonlyFields();
                            }
                        }

                        scope.options = columnDef;
                        parentIsolateScope.formFields = parentIsolateScope.formFields || [];
                        index = parentIsolateScope.formFields.push(columnDef) - 1;
                        if (scope.isLayoutDialog) {
                            parentIsolateScope.setPrevDataValues();
                        }
                        parentIsolateScope.formCreated = true;
                        parentIsolateScope.formFieldCompiled = true;

                        template = LiveWidgetUtils.getTemplate(columnDef, index, "form");
                        element.html(template);
                        $compile(element.contents())(parentIsolateScope);

                        parentIsolateScope.$on('$destroy', function () {
                            if (dataSetWatchHandler) {
                                dataSetWatchHandler();
                            }
                            if (exprWatchHandler) {
                                exprWatchHandler();
                            }
                        });
                    }
                };
            }
        };
    }])
    .directive("wmFormAction", ["$compile", "CONSTANTS", function ($compile, CONSTANTS) {
        'use strict';

        var getTemplate = function (btnField, index) {
            var template = '';
            if (btnField.updateMode) {
                template  = '<wm-button name="{{buttonArray[' + index + '].key}}" caption="{{buttonArray[' + index + '].displayName}}" show="{{isUpdateMode && buttonArray[' + index + '].show}}" class="{{buttonArray[' + index + '].class}}" iconname="{{buttonArray[' + index + '].iconname}}"  iconclass="{{buttonArray[' + index + '].iconclass}}" on-click="' + btnField.action + '" type="{{buttonArray[' + index + '].type}}" ></wm-button>';
            } else {
                template  = '<wm-button name="{{buttonArray[' + index + '].key}}" caption="{{buttonArray[' + index + '].displayName}}" show="{{!isUpdateMode && buttonArray[' + index + '].show}}" class="{{buttonArray[' + index + '].class}}" iconname="{{buttonArray[' + index + '].iconname}}" iconclass="{{buttonArray[' + index + '].iconclass}}" on-click="' + btnField.action + '" type="{{buttonArray[' + index + '].type}}" ></wm-button>';
            }

            return template;
        };

        return {
            "restrict": 'E',
            "scope": true,
            "replace": true,
            "template": "<div></div>",
            "compile": function () {
                return {
                    "post": function (scope, element, attrs) {
                        /*scope.$parent is defined when compiled with live filter scope*/
                        /*element.parent().isolateScope() is defined when compiled with dom scope*/
                        var parentIsolateScope,
                            template,
                            index,
                            buttonDef = {
                                'key': attrs.key || attrs.binding,
                                'displayName': attrs.displayName || attrs.caption,
                                'show': (attrs.show === "1" || attrs.show === "true"),
                                'class': attrs.class || '',
                                /*iconame support for old projects*/
                                'iconname': attrs.iconname,
                                'iconclass': attrs.iconclass,
                                'action': attrs.action,
                                'type': attrs.type || "button",
                                'updateMode': attrs.updateMode === true || attrs.updateMode === "true"
                            };

                        if (CONSTANTS.isRunMode && scope.isLayoutDialog) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = (element.parent() && element.parent().length > 0) ? element.parent().closest('[data-identifier="liveform"]').isolateScope() || scope.$parent : scope.$parent;
                        }

                        scope.options = buttonDef;
                        parentIsolateScope.buttonArray = parentIsolateScope.buttonArray || [];
                        index = parentIsolateScope.buttonArray.push(buttonDef) - 1;
                        parentIsolateScope.formCreated = true;
                        parentIsolateScope.formFieldCompiled = true;

                        template = getTemplate(buttonDef, index);

                        element.closest('[data-identifier="liveform"]').find('> .basic-btn-grp').append($compile(template)(parentIsolateScope));
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.live.directive:wmLiveform
 * @restrict E
 *
 * @description
 * The 'wmLiveform' directive defines a live-form in the layout.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $compile
 * @requires $rootScope
 * @requires CONSTANTS
 * @requires $controller
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the form widget.
 * @param {string=} title
 *                  Title of the form widget.
 * @param {string=} width
 *                  Width of the form widget.
 * @param {string=} height
 *                  Height of the form widget.
 * @param {string=} layout
 *                  This property controls how contained widgets are displayed within the widget container. <br>
 *                  Possible values are `One Column`, `Two Column`, `Three Column`, and `Four Column`. <br>
 *                  Default value is `One Column`.
 * @param {string=} formdata
 *                  This property sets the data to show in the form. <br>
 *                  This is a bindable property.
 * @param {string=} dataset
 *                  This property sets a variable to populate the data required to display the list of values. <br>
 *                  This is a bindable property.
 * @param {boolean=} novalidate
 *                  This property sets novalidate option for the form. <br>
 *                  default value: `true`.
 * @param {string=} insertmessage
 *                  This property sets the message to be displayed in toaster, when data is inserted in liveform. <br>
 *                  default value: `Record added successfully`. <br>
 *                  This is a bindable property.
 * @param {string=} updatemessage
 *                  This property sets the message to be displayed in toaster, when data is updated in liveform. <br>
 *                  default value: `Record updated successfully`. <br>
 *                  This is a bindable property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the form on the web page. <br>
 *                  default value: `true`.
 * @param {boolean=} autocomplete
 *                  Sets autocomplete for the form.  <br>
 *                  Default value is `true`.
 * @param {boolean=} updatemode
 *                  This property controls whether live form is on updatemode or not.  <br>
 *                  Default value is `false`.
 * @param {string=} captionalign
 *                  Defines the alignment of the caption elements of widgets inside the form. <br>
 *                  Possible values are `left`, `center`, and `right`. <br>
 *                  Default value for captionalign is `left`.
 * @param {string=} captionposition
 *                  Defines the position of the caption elements of widgets inside the form.<br>
 *                  Possible values are `left`, `center`, and `right`. <br>
 *                  Default value for captionposition is `left`.
 * @param {string=} captionsize
 *                  This property sets the width of the caption.
 * @param {string=} iconclass
 *                  This property defines the class of the icon that is applied to the button. <br>
 *                  This is a bindable property.
 * @param {string=} horizontalalign
 *                  This property used to set text alignment horizontally. <br>
 *                  Possible values are `left`, `center` and `right`.
 * @param {string=} on-success
 *                  Callback function which will be triggered when the form submit is success.
 * @param {string=} on-error
 *                  Callback function which will be triggered when the form submit results in an error.
 * @param {string=} on-result
 *                  Callback function which will be triggered when the form submitted.
 * @param {string=} on-beforeservicecall
 *                  Callback function which will be triggered before the service call.
 *
 * @example
     <example module="wmCore">
         <file name="index.html">
             <wm-liveform>
                 <wm-composite widget="text">
                 <wm-label></wm-label>
                 <wm-text></wm-text>
                 </wm-composite>
                 <wm-composite widget="textarea">
                 <wm-label></wm-label>
                 <wm-textarea></wm-textarea>
                 </wm-composite>
             </wm-liveform>
         </file>
     </example>
 */
