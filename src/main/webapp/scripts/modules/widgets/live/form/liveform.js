/*global WM, window, document, FormData, Blob*/
/*Directive for liveform */

WM.module('wm.widgets.live')
    /*Define controller for the liveform in dialog mode*/
    .controller('liveFormDialogController', function () {
        "use strict";
    })
    .directive('wmLiveform', ['PropertiesFactory', 'WidgetUtilService', '$compile', '$rootScope', 'CONSTANTS', '$controller', 'Utils', '$templateCache', 'wmToaster', function (PropertiesFactory, WidgetUtilService, $compile, $rootScope, CONSTANTS, $controller, Utils, $templateCache, wmToaster) {
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
                'layout': true
            },

            isTimeStampType = function (field) {
                return field.widgetType === 'timestamp' || (field.type === 'timestamp' && !field.widgetType);
            };

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
                                        '<form data-identifier="liveform" role="form" name="' + attrs.name + '" class="app-liveform align-{{captionalign}} position-{{captionposition}}" data-ng-submit="formSave($event);" ' +
                                            $rootScope.getWidgetStyles("shell") + '>' +
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
                return '<form data-identifier="liveform" init-widget data-ng-show="show" role="form" class="app-liveform panel panel-default liveform-inline align-{{captionalign}} position-{{captionposition}}" data-ng-submit="formSave($event);" autocomplete="autocomplete" ' +
                            $rootScope.getWidgetStyles('shell') + '>' +
                            '<div data-ng-show="isLayoutDialog"><i class="wm-icon24 glyphicon glyphicon-cog"></i>Live form in dialog mode</div>' +
                            '<div class="form-header panel-heading" data-ng-show="!isLayoutDialog" data-ng-if="title"><h3 class="panel-title">' +
                                '<i class="{{iconclass}}" data-ng-style="{width:iconwidth, height:iconheight, margin:iconmargin}"></i>' +
                                '<span class="form-header-text">{{title}}</span>' +
                            '</h3></div>' +
                            '<div class="form-elements panel-body" data-ng-class="{\'update-mode\': isUpdateMode }" data-ng-show="!isLayoutDialog" data-ng-style="{height: height, overflow: height ? \'auto\': overflow, paddingTop: paddingtop + paddingunit,paddingRight: paddingright + paddingunit,paddingLeft: paddingleft + paddingunit,paddingBottom: paddingbottom + paddingunit}">' +
                                template.context.innerHTML +
                            '</div>' +
                            '<div class="basic-btn-grp btn-group form-action panel-footer clearfix" data-ng-hide="{{isLayoutDialog}}"></div>' +
                        '</form>';
            },
            controller: function ($scope, Variables) {
                $scope.__compileWithIScope = true;
                /* when the service call ended this function will be called */
                /* prevDataArray is used for showing the previous data when cancel is clicked and also for update calls*/
                var prevDataArray,
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

                /*Method to handle the insert, update, delete actions*/
                /*The operationType decides the type of action*/
                $scope.formSave = function (event) {
                    var data,
                        prevData,
                        requestData = {},
                        elScope = $scope.element.scope(),
                        variable = elScope.Variables[$scope.variableName],
                        isValid;
                    if ($scope.propertiesMap.tableType === "VIEW") {
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
                    /*Construct the data object with required values from the dataArray*/
                    /*If it is an update call send isUpdate true for constructDataObject so the dataObject is
                    constructed out of the previous object*/
                    data = $scope.constructDataObject($scope.dataArray);
                    $scope.dataoutput = data;
                    prevData = prevDataArray ? $scope.constructDataObject(prevDataArray) : data;
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
                        Variables.call("updateRecord", $scope.variableName, requestData, function (response) {
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
                                    $scope.$emit("on-result", "update", response);
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
                        Variables.call("insertRecord", $scope.variableName, requestData, function (response) {
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
                                    $scope.$emit("on-result", "insert", response);
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
                        Variables.call("deleteRecord", $scope.variableName, requestData, function (success) {
                            /* check the response whether the data successfully deleted or not , if any error occurred show the
                             * corresponding error , other wise remove the row from grid */
                            if (success && success.error) {
                                wmToaster.show('error', 'ERROR', success.error);
                                onResult(success, false);
                                return;
                            }
                            onResult(success, true);
                            $scope.clearData();
                            wmToaster.show('success', 'SUCCESS', 'Record deleted successfully');
                            $scope.isSelected = false;
                            /*get updated data without refreshing page*/
                            if ($scope.ctrl) {
                                $scope.ctrl.onResult(success, "delete");
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
                $scope.setPrevDataArray = function (dataArray) {
                    prevDataArray = WM.copy(dataArray);
                    prevDataObject = WM.copy($scope.rowdata);
                };
                /*Method to clear the fields and set the form to readonly*/
                $scope.formCancel = function () {
                    $scope.clearData();
                    /*Show the previous selected data*/
                    if ($scope.isSelected) {
                        $scope.dataArray = WM.copy(prevDataArray);
                    }
                    $scope.$emit("on-cancel");
                };
                /*clear the dataArray*/
                function emptyDataModel() {
                    $scope.dataArray.forEach(function (dataValue) {
                        if (dataValue.isRelated) {
                            dataValue.selected = '';
                            return;
                        }
                        if (isTimeStampType(dataValue)) {
                            dataValue.datevalue = dataValue.timevalue = Date.now();
                        }
                        if (dataValue.type === "time") {
                            dataValue.timevalue = Date.now();
                        }
                        if (dataValue.type === 'blob') {
                            WM.element($scope.formElement).find('[name=' + dataValue.key + ']').val('');
                            dataValue.href = '';
                        }
                        dataValue.value = '';
                    });
                }
                /*Method to update, sets the operationType to "update" disables the readonly*/
                $scope.formUpdate = function () {
                    /*set the dataArray into the prevDataArray only in case of inline form
                    * in case of dialog layout the set prevDataArray is called before manually clearing off the dataArray*/

                    if (!$scope.isLayoutDialog) {
                        if ($scope.isSelected) {
                            prevDataArray = WM.copy($scope.dataArray);
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
                $scope.formNew = function () {
                    if ($scope.isSelected && !$scope.isLayoutDialog) {
                        prevDataArray = WM.copy($scope.dataArray);
                    }
                    if ($scope.dataArray && $scope.dataArray.length > 0) {
                        emptyDataModel();
                    }
                    $scope.setDefaults();
                    $scope.isUpdateMode = true;
                    $scope.operationType = "insert";
                };
                $scope.filetypes = {
                    "image": "image/*",
                    "video": "video/*",
                    "audio": "audio/*"
                };
               /*Set if any default values, if given*/
                $scope.setDefaults = function () {
                    $scope.dataArray.forEach(function (fieldObj) {
                        $scope.setDefaultValueToValue(fieldObj);
                    });
                };
                $scope.setDefaultValueToValue = function (fieldObj) {
                    /*Set the default value only if it exists.*/
                    if (fieldObj.defaultValue && fieldObj.defaultValue !== "null") {
                        if (fieldObj.type === 'integer') {
                            fieldObj.value = isNaN(Number(fieldObj.defaultValue)) ? '' : Number(fieldObj.defaultValue);
                        } else if (fieldObj.type === 'timestamp') {
                            fieldObj.timevalue = fieldObj.datevalue = new Date(Number(fieldObj.defaultValue) || fieldObj.defaultValue);
                        } else if (!fieldObj.isRelated) {
                            fieldObj.value = fieldObj.defaultValue;
                        } else if (fieldObj.isRelated) {
                            fieldObj.selected = fieldObj.defaultValue;
                        }
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
                };
                $scope.setReadonlyFields = function () {
                    $scope.dataArray.forEach(function (column) {
                        if (column.primaryKey) {
                            column.readonly = true;
                        }
                    });
                };
                /*Sets the operationType to "delete" and calls the formSave function to handle the action*/
                $scope.formDelete = function () {
                    $scope.operationType = "delete";
                    $scope.formSave();
                };
                /*Check if the data is in required format, i.e, if the field has a key and type*/
                $scope.isInReqdFormat = function (data) {
                    return (WM.isArray(data) && data[0].key && data[0].type);
                };
                /*construct the data object from the dataArray*/
                $scope.constructDataObject = function (dataArray) {
                    var dataObject = ($scope.operationType === 'update') ? WM.copy(Utils.isEmptyObject(prevDataObject) ? $scope.formdata : prevDataObject) : {},
                        formName = $scope.name,
                        isFormDataSupported = (window.File && window.FileReader && window.FileList && window.Blob),
                        formData;

                    if (isFormDataSupported) {
                        /* Angular does not bind file values so using native object to send files */
                        formData = new FormData();
                    }
                    dataArray.forEach(function (field) {
                        var date,
                            time,
                            dateString,
                            timeString,
                            primaryKey;
                        /*collect the values from the fields and construct the object*/
                        if (isTimeStampType(field)) {
                            /*timestamp has two widgets, date and time.
                             Hence take the date from date widget and time from time widget  and then form the timestamp*/
                            date = field.datevalue ? new Date(field.datevalue) : new Date();
                            time = field.timevalue ? new Date(field.timevalue) : new Date();
                            dateString = date.toDateString();
                            timeString = time.toTimeString();
                            field.value = dateString + ' ' + timeString;
                            field.value = new Date(field.value);
                            field.value = field.value.getTime();
                            dataObject[field.key] = field.value;
                        } else if (field.type === "time") {
                            dataObject[field.key] = field.timevalue;
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
                        } else if (field.type !== "list") {
                            dataObject[field.key] = field.value;
                        } else {
                            if (field.widgetType === 'Datalist') {
                                WM.forEach(field.value, function (value, key) {
                                    if (value === field.selected) {
                                        field.selected = key;
                                    }
                                });
                            }
                            primaryKey = $scope.relatedfieldPrimaryKeyMap[field.key];
                            WM.forEach($scope.relatedData[field.key], function (colRelatedData) {
                                /* == has been used because select stores the selected value as string,even number is stored as string*/
                                if (colRelatedData[primaryKey] == field.selected) {
                                    dataObject[field.key] = colRelatedData;
                                }
                            });
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
                    if ($scope.dataArray && $scope.dataArray.length > 0) {
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

                /*Translate the variable rawObject into the dataArray for form construction*/
                $scope.translateVariableObject = function (rawObject) {
                    $scope.propertiesMap = rawObject.propertiesMap;
                    $scope.relatedData = rawObject.relatedData;
                    $scope.columnArray = $scope.propertiesMap.columns;
                    $scope.relatedfieldPrimaryKeyMap = {};
                    $scope.primaryKey = $scope.primaryKey || [];
                    var translatedObj = [];
                    $scope.columnArray.forEach(function (fieldObj, index) {
                        if (!fieldObj.isRelated) {
                            translatedObj[index] = {
                                "displayName": Utils.prettifyLabel(fieldObj.fieldName),
                                "show": true,
                                "primaryKey": fieldObj.isPrimaryKey,
                                "generator": fieldObj.generator,
                                "key": fieldObj.fieldName,
                                "value": "",
                                "type": fieldObj.fullyQualifiedType,
                                "maxvalue": '',
                                "readonly": fieldObj.isPrimaryKey,
                                "required": fieldObj.notNull === "true" || fieldObj.notNull === true
                            };
                            if (fieldObj.defaultValue) {
                                if (fieldObj.type === 'integer') {
                                    translatedObj[index].defaultValue = isNaN(Number(fieldObj.defaultValue)) ? '' : Number(fieldObj.defaultValue);
                                } else {
                                    translatedObj[index].defaultValue = fieldObj.defaultValue;
                                }
                            }
                            if (fieldObj.type === "string" || fieldObj.type === "character" || fieldObj.type === "text" || fieldObj.type === "blob" || fieldObj.type === "clob") {
                                translatedObj[index].maxvalue = fieldObj.length;
                            }
                            /*Store the primary key of data*/
                            if (fieldObj.isPrimaryKey) {
                                $scope.setPrimaryKey(fieldObj.fieldName);
                            }
                        } else {
                            /*handle related data*/
                            var primaryKey = $scope.getPrimaryKey(fieldObj.columns),
                                colRelatedData = $scope.relatedData[fieldObj.fieldName],
                                colPrimaryData = {};
                            /*Maintain the related field primary key map*/
                            $scope.relatedfieldPrimaryKeyMap[fieldObj.fieldName] = primaryKey;
                            WM.forEach(colRelatedData, function (col) {
                                colPrimaryData[col[primaryKey]] = col[primaryKey];
                            });
                            translatedObj[index] = {
                                "displayName": Utils.prettifyLabel(fieldObj.fieldName),
                                "show": true,
                                "generator": fieldObj.generator,
                                "key": fieldObj.fieldName,
                                "value": colPrimaryData,
                                "type": 'list',
                                "isRelated": true,
                                "primaryKey": false,
                                "selected": ''
                            };
                            /*Store the primary key of data*/
                            if (fieldObj.isPrimaryKey) {
                                $scope.setPrimaryKey(fieldObj.relatedFieldName);
                            }
                        }
                    });
                    return translatedObj;
                };
                $scope.changeDataObject = function (dataObj) {
                    var date,
                        primaryKey,
                        href;
                    $scope.dataArray.forEach(function (value) {
                        if (value.isRelated) {
                            value.selected = dataObj[value.key] ? dataObj[value.key][$scope.relatedfieldPrimaryKeyMap[value.key]].toString() : dataObj[value.key];
                            return;
                        }
                        if (isTimeStampType(value)) {
                            value.datevalue = value.timevalue = dataObj[value.key];
                        }
                        if (value.type === "time") {
                            date = (new Date()).toDateString();
                            value.timevalue = (new Date(date + ' ' + dataObj[value.key])).getTime();
                        }
                        if (value.type === "blob") {
                            primaryKey = $scope.dataset.propertiesMap.primaryKeys.join();
                            href = (($scope.variableObj.prefabName !== "" &&  $scope.variableObj.prefabName !== undefined) ? "prefabs/" + $scope.variableObj.prefabName : "services") + '/';
                            href = href + $scope.variableObj.liveSource + '/' + $scope.variableObj.type + '/' + dataObj[primaryKey] + '/content/' + value.key + '?' + Math.random();
                            value.href = href;
                        }
                        value.value = dataObj[value.key];
                    });
                };

                $scope.setFieldVal = function (fieldDef) {
                    var dataObj = $scope.rowdata, date, primaryKey, href;
                    if (!dataObj) {
                        return;
                    }
                    if (fieldDef.isRelated) {
                        fieldDef.selected = dataObj[fieldDef.key] ? dataObj[fieldDef.key][$scope.relatedfieldPrimaryKeyMap[fieldDef.key]].toString() : dataObj[fieldDef.key];
                        return;
                    }
                    if (isTimeStampType(fieldDef)) {
                        fieldDef.datevalue = fieldDef.timevalue = dataObj[fieldDef.key];
                    }
                    if (fieldDef.type === "time") {
                        date = (new Date()).toDateString();
                        fieldDef.timevalue = (new Date(date + ' ' + dataObj[fieldDef.key])).getTime();
                    }
                    if (fieldDef.type === "blob") {
                        primaryKey = $scope.dataset.propertiesMap.primaryKeys.join();
                        href = 'services/' + $scope.variableObj.liveSource + '/' + $scope.variableObj.type + '/' + dataObj[primaryKey] + '/content/' + fieldDef.key + '?' + Math.random();
                        fieldDef.href = href;
                    }
                    fieldDef.value = dataObj[fieldDef.key];
                };

                $scope.setRelatedData = function (fieldDef) {
                    if ($scope.translatedObj) {
                        $scope.translatedObj.forEach(function (transObj) {
                            if (transObj.key === fieldDef.key) {
                                fieldDef.isRelated = transObj.isRelated;
                                if (fieldDef.isRelated) {
                                    fieldDef.primaryKey = transObj.primaryKey;
                                    fieldDef.selected = transObj.selected;
                                    fieldDef.value = transObj.value;
                                }
                                var relatedValueObject = {},
                                    parseExpression = function (string, name, column) {
                                        var regexExpr = new RegExp("\\b" + name + "\\b", "g");
                                        return string.replace(regexExpr, column[name]);
                                    },
                                    relatedColumnArray;
                                if (fieldDef.displayvalue  && $scope.dataset.relatedData[fieldDef.key]) {
                                    relatedColumnArray = Object.keys($scope.dataset.relatedData[fieldDef.key][0]);
                                    $scope.dataset.relatedData[fieldDef.key].forEach(function (column) {
                                        var newStr =  fieldDef.displayvalue;
                                        relatedColumnArray.forEach(function (columnname) {
                                            newStr = parseExpression(newStr, columnname, column);
                                        });
                                        relatedValueObject[column[$scope.relatedfieldPrimaryKeyMap[fieldDef.key]]] = newStr;
                                    });
                                    fieldDef.value = relatedValueObject;
                                }
                            }
                        });
                    }
                };
            },
            compile: function () {
                return {
                    pre: function (scope, element, attrs) {
                        /*Applying widget properties to directive scope*/
                        scope.widgetProps = widgetProps;
                        //remove this condition later. for backward compatibility
                        if (attrs.layout === "dialog" || attrs.formtype === "dialog") {
                            scope.isLayoutDialog = true;
                            scope._dialogid = attrs.dialogid;
                        }

                        scope.Variables = element.scope().Variables;
                        scope.Widgets = element.scope().Widgets;
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
                            handlers = [],
                            layoutObj = {
                                'One Column': 1,
                                'Two Column': 2,
                                'Three Column': 3,
                                'Four Column': 4
                            };

                        scope.getActiveLayout = function () {
                            return layoutObj[scope.layout] || 1;
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
                                fieldDefs: scope.dataArray,
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
                                    if ((scope.formCreated || scope.formConstructed) && scope.dataArray) {
                                        translatedObj = scope.translateVariableObject(newVal);
                                        scope.translatedObj = translatedObj;
                                        /*Check if the dataArray is defined, then in the dataArray array override only certain fields.*/
                                        scope.dataArray.forEach(function (fieldObject) {
                                            translatedObj.forEach(function (transObj) {
                                                if (transObj.key === fieldObject.key) {
                                                    fieldObject.isRelated = transObj.isRelated;
                                                    if (fieldObject.isRelated) {
                                                        fieldObject.primaryKey = transObj.primaryKey;
                                                        fieldObject.selected = transObj.selected;
                                                        fieldObject.value = transObj.value;
                                                    }
                                                    var relatedValueObject = {},
                                                        parseExpression = function (string, name, column) {
                                                            var regexExpr = new RegExp("\\b" + name + "\\b", "g");
                                                            return string.replace(regexExpr, column[name]);
                                                        },
                                                        relatedColumnArray;
                                                    if (fieldObject.displayvalue  && newVal.relatedData[fieldObject.key]) {
                                                        relatedColumnArray = Object.keys(newVal.relatedData[fieldObject.key][0]);
                                                        newVal.relatedData[fieldObject.key].forEach(function (column) {
                                                            var newStr =  fieldObject.displayvalue;
                                                            relatedColumnArray.forEach(function (columnname) {
                                                                newStr = parseExpression(newStr, columnname, column);
                                                            });
                                                            relatedValueObject[column[scope.relatedfieldPrimaryKeyMap[fieldObject.key]]] = newStr;
                                                        });
                                                        fieldObject.value = relatedValueObject;
                                                    }
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
                                        scope.buttonArray = [
                                            {
                                                key : 'cancel',
                                                class: 'form-cancel btn-secondary',
                                                iconclass: 'glyphicon glyphicon-remove-circle',
                                                action: 'formCancel()',
                                                displayName: 'cancel',
                                                show: true,
                                                type: 'button',
                                                updateMode: true
                                            },
                                            {
                                                key : 'save',
                                                class: 'form-save btn-success',
                                                iconclass: 'glyphicon glyphicon-save',
                                                action: '',
                                                displayName: 'save',
                                                show: true,
                                                type: 'submit',
                                                updateMode: true
                                            }];
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
                                        scope.dataArray = translatedObj;
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
                                    scope.dataArray = undefined;
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
    .directive("wmFormField", ["Utils", "$compile", "CONSTANTS", function (Utils, $compile, CONSTANTS) {
        'use strict';

        /* provides the template based on the form-field definition */
        var getTemplate = function (fieldDef, index) {
            var template = '',
                step,
                fieldTypeWidgetTypeMap = Utils.getFieldTypeWidgetTypesMap();
            /*Set "Readonly field" placeholder for fields which are readonly and contain generated values if the user has not given any placeholder*/
            if (fieldDef.readonly && fieldDef.generator === "identity") {
                fieldDef.placeholder = fieldDef.placeholder || 'Readonly field';
            }
            /*Construct the template based on the Widget Type, if widget type is not set refer to the fieldTypeWidgetTypeMap*/
            switch (fieldDef.widgetType || fieldTypeWidgetTypeMap[fieldDef.type][0]) {
            case "Number":
                if (fieldDef.type === 'float' || fieldDef.type === 'double') {
                    step = 0.01;
                } else if (fieldDef.type === 'double') {
                    step = 0.001;
                } else {
                    step = 1;
                }
                fieldDef.placeholder = fieldDef.placeholder || 'Enter value';
                template = template +
                    '<wm-composite widget="text" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-text name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" ' +
                    'title="{{dataArray[' + index + '].placeholder}}" regexp="{{dataArray[' + index + '].regexp}}" show="{{isUpdateMode}}" scopedatavalue="dataArray[' + index + '].value" placeholder="{{dataArray[' + index + '].placeholder}}"  type="number" step="' + step + '"';
                if (fieldDef.maxvalue) {
                    template = template + ' minvalue="{{dataArray[' + index + '].minvalue}}"';
                }
                if (fieldDef.minvalue) {
                    template = template + ' maxvalue="{{dataArray[' + index + '].maxvalue}}"';
                }
                template = template + '></wm-text></div></wm-composite>';
                break;
            case "Date":
                fieldDef.placeholder = fieldDef.placeholder || 'Select date';
                template = template +
                    '<wm-composite widget="date" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value | date:\'dd-MMM-yyyy\'}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-date name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" scopedatavalue="dataArray[' + index + '].value" placeholder="{{dataArray[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-date>' +
                    '</div></wm-composite>';
                break;
            case "Checkbox":
                template = template +
                    '<wm-composite widget="checkbox" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-checkbox name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" scopedatavalue="dataArray[' + index + '].value" show="{{isUpdateMode}}"></wm-checkbox>' +
                    '</div></wm-composite>';
                break;
            case "Select":
                switch (fieldDef.type) {
                case "list":
                    template = template +
                        '<wm-composite widget="select" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                        '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                        '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value[dataArray[' + index + '].selected]}}" show="{{!isUpdateMode}}"></wm-label>' +
                        '<wm-select name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" scopedataset="dataArray[' + index + '].value" scopedatavalue="dataArray[' + index + '].selected" show="{{isUpdateMode}}"></wm-select>' +
                        '</div></wm-composite>';
                    break;
                default:
                    template = template +
                        '<wm-composite widget="select" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                        '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                        '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                        '<wm-select name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" scopedataset="dataArray[' + index + '].dataset" scopedatavalue="dataArray[' + index + '].value" show="{{isUpdateMode}}"></wm-select>' +
                        '</div></wm-composite>';
                    break;
                }
                break;
            case "Datalist":
                template = template +
                    '<wm-composite widget="select" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}""{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value[dataArray[' + index + '].selected]}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<datalist data-ng-show="isUpdateMode" id="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}">' +
                    '<option data-ng-repeat="(key, value) in dataArray[' + index + '].value">{{value}}</option>' +
                    '</datalist>' +
                    '<input class="form-control app-textbox" data-ng-show="isUpdateMode" list="{{dataArray[' + index + '].key}}"' +
                    'type="text"' +
                    'data-ng-model="dataArray[' + index + '].selected"' +
                    '/>' +
                    '</div></wm-composite>';
                break;
            case "Text":
                fieldDef.placeholder = fieldDef.placeholder || 'Enter text';
                template = template +
                    '<wm-composite widget="text" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-text name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" ' +
                    'title="{{dataArray[' + index + '].placeholder}}" regexp="{{dataArray[' + index + '].regexp}}" scopedatavalue="dataArray[' + index + '].value" placeholder="{{dataArray[' + index + '].placeholder}}" show="{{isUpdateMode}}"';
                if (fieldDef.maxvalue && fieldDef.maxvalue !== 'null' && fieldDef.maxvalue !== 'undefined') {
                    template = template + ' maxchars="{{dataArray[' + index + '].maxvalue}}">';
                }
                template = template + '></wm-text></div></wm-composite>';
                break;
            case "Password":
                fieldDef.placeholder = fieldDef.placeholder || 'Enter password';
                template = template +
                    '<wm-composite widget="password" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="********" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-text name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" ' +
                    'title="{{dataArray[' + index + '].placeholder}}" regexp="{{dataArray[' + index + '].regexp}}" scopedatavalue="dataArray[' + index + '].value" placeholder="{{dataArray[' + index + '].placeholder}}" show="{{isUpdateMode}}" type="password"';
                if (fieldDef.maxvalue && fieldDef.maxvalue !== 'null' && fieldDef.maxvalue !== 'undefined') {
                    template = template + ' maxchars="{{dataArray[' + index + '].maxvalue}}"';
                }
                template = template + '></wm-text></div></wm-composite>';
                break;
            case "RichText":
                template = template +
                    '<wm-composite widget="richtext" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-richtexteditor name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" scopedatavalue="dataArray[' + index + '].value" show="{{isUpdateMode}}"></wm-richtexteditor>' +
                    '</div></wm-composite>';
                break;
            case "Textarea":
                fieldDef.placeholder = fieldDef.placeholder || 'Enter text';
                template = template +
                    '<wm-composite widget="textarea" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-textarea name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" ' +
                    'title="{{dataArray[' + index + '].placeholder}}" regexp="{{dataArray[' + index + '].regexp}}" scopedatavalue="dataArray[' + index + '].value" placeholder="{{dataArray[' + index + '].placeholder}}"show="{{isUpdateMode}}"';
                if (fieldDef.maxvalue && fieldDef.maxvalue !== 'null' && fieldDef.maxvalue !== 'undefined') {
                    template = template + ' maxchars="{{dataArray[' + index + '].maxvalue}}"';
                }
                template = template + '></wm-textarea></div></wm-composite>';
                break;
            case "Time":
                template = template +
                    '<wm-composite widget="date" show="{{dataArray[' + index + '].show}}" class="form-time {{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value | date:\'dd-MMM-yyyy\'}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-time name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" ' +
                    'regexp="{{dataArray[' + index + '].regexp}}" scopedatavalue="dataArray[' + index + '].timevalue" show="{{isUpdateMode}}"></wm-time>' +
                    '</div></wm-composite>';
                break;
            case "Timestamp":
                /*timestamp has two widgets, date and time. Date for selecting date and Time for time*/
                template = template +
                    '<wm-composite widget="date" show="{{dataArray[' + index + '].show}}" class="form-timestamp {{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-3 col-sm-4"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value | date:\'dd-MMM-yyyy hh:mm:ss\'}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-date name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" scopedatavalue="dataArray[' + index + '].datevalue" show="{{isUpdateMode}}"></wm-date>' +
                    '</div><div class="col-md-6 col-sm-5"><wm-time name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" scopedatavalue="dataArray[' + index + '].timevalue" show="{{isUpdateMode}}"></wm-time>' +
                    '</div></wm-composite>';
                break;
            case "Slider":
                if (fieldDef.type === 'float' || fieldDef.type === 'double') {
                    step = 0.01;
                } else if (fieldDef.type === 'double') {
                    step = 0.001;
                } else {
                    step = 1;
                }
                template = template +
                    '<wm-composite widget="slider" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-slider name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" show="{{isUpdateMode}}" scopedatavalue="dataArray[' + index + '].value" minvalue="{{dataArray[' + index + '].minvalue}}" maxvalue="{{dataArray[' + index + '].maxvalue}}" step="' + step + '"></wm-slider>' +
                    '</div></wm-composite>';
                break;
            case "Upload":
                template = template +
                    '<wm-composite widget="upload" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}"  hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label><div class="col-md-9 col-sm-9">';
                if (fieldDef.filetype === 'image') {
                    template = template + '<a class="col-md-9 col-sm-9 form-control-static" target="_blank" href="{{dataArray[' + index + '].href}}" data-ng-show="dataArray[' + index + '].value || dataArray[' + index + '].href"><img width="48px" height="28px" class="wm-icon wm-icon24 glyphicon glyphicon-file" src="{{dataArray[' + index + '].href}}"/></a>';
                } else {
                    template = template + '<a class="col-md-9 col-sm-9 form-control-static" target="_blank" href="{{dataArray[' + index + '].href}}" data-ng-show="dataArray[' + index + '].value != null"><i class="wm-icon wm-icon24 glyphicon glyphicon-file"></i></a>';
                }
                template = template +  '<input data-ng-class="{\'form-control app-textbox\': true, \'file-readonly\': dataArray[' + index + '].readonly}" required="{{dataArray[' + index + '].required}}" type="file" name="{{dataArray[' + index + '].key}}" ng-required="{{dataArray[' + index + '].required}}" ng-readonly="{{dataArray[' + index + '].readonly}}" data-ng-show="isUpdateMode" data-ng-model="dataArray[' + index + '].value" accept="{{dataArray[' + index + '].permitted}}"/>' + '</div></wm-composite>';
                break;
            default:
                template = template +
                    '<wm-composite widget="text" show="{{dataArray[' + index + '].show}}" class="{{dataArray[' + index + '].class}}">' +
                    '<wm-label class="col-md-3 col-sm-3" caption="{{dataArray[' + index + '].displayName}}" hint="{{dataArray[' + index + '].displayName}}" required="{{dataArray[' + index + '].required}}"></wm-label>' +
                    '<div class="col-md-9 col-sm-9"><wm-label class="form-control-static" caption="{{dataArray[' + index + '].value}}" show="{{!isUpdateMode}}"></wm-label>' +
                    '<wm-text name="{{dataArray[' + index + '].key}}" required="{{dataArray[' + index + '].required}}" readonly="{{dataArray[' + index + '].readonly}}" ' +
                    'title="{{dataArray[' + index + '].placeholder}}" regexp="{{dataArray[' + index + '].regexp}}" scopedatavalue="dataArray[' + index + '].value" placeholder="{{dataArray[' + index + '].placeholder}}" show="{{isUpdateMode}}"></wm-text>' +
                    '</div></wm-composite>';
                break;
            }

            return template;
        };

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
                            exprWatchHandler;

                        if (CONSTANTS.isRunMode && scope.isLayoutDialog) {
                            parentIsolateScope = scope;
                        } else {
                            parentIsolateScope = scope.parentIsolateScope = (element.parent() && element.parent().length > 0) ? element.parent().closest('[data-identifier="liveform"]').isolateScope() || scope.$parent : scope.$parent;
                        }

                        columnDef = {
                            'key': attrs.key || attrs.binding,
                            'displayName': attrs.displayName || attrs.caption,
                            'show': (attrs.show === "1" || attrs.show === "true"),
                            'class': attrs.class || '',
                            'type': attrs.type || 'string',
                            'primaryKey': attrs.primaryKey === "true" || attrs.primaryKey === true,
                            'generator': attrs.generator,
                            'readonly': attrs.readonly === "true" || attrs.readonly === true,
                            'required': attrs.required === "true" || attrs.required === true,
                            'maxvalue': attrs.maxvalue,
                            'minvalue': attrs.minvalue,
                            'displayvalue': attrs.displayvalue,
                            'placeholder': attrs.placeholder,
                            'regexp': attrs.regexp || ".*"
                        };


                        /*If defaultValue is set then assign it to the attribute*/
                        if (attrs.defaultValue) {
                            if (Utils.stringStartsWith(attrs.defaultValue, 'bind:') && CONSTANTS.isRunMode) {
                                expr = attrs.defaultValue.replace('bind:', '');
                                if (scope.Variables && !Utils.isEmptyObject(scope.Variables)) {
                                    columnDef.defaultValue = scope.$eval(expr);
                                } else {
                                    exprWatchHandler = scope.$watch(expr, function (newVal) {
                                        parentIsolateScope.dataArray[index].defaultValue = newVal;
                                        parentIsolateScope.dataArray[index].selected = newVal;
                                        if (newVal) {
                                            exprWatchHandler();
                                        }
                                    });
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
                                columnDef.dataset = parentIsolateScope.$eval(expr);
                            } else {
                                columnDef.dataset = attrs.dataset;
                            }
                        }
                        if (attrs.extensions) {
                            columnDef.extensions = attrs.extensions;
                        }
                        if (attrs.filetype) {
                            columnDef.filetype = attrs.filetype;
                        }
                        /*If it is a list set it to the list*/
                        if (attrs.type === "list") {
                            columnDef.selected = columnDef.defaultValue;
                        }

                        if (scope.isLayoutDialog) {
                            parentIsolateScope.setRelatedData(columnDef);
                            parentIsolateScope.setDefaultValueToValue(columnDef);
                            parentIsolateScope.setFieldVal(columnDef);
                            if (scope.operationType === 'update') {
                                scope.setReadonlyFields();
                            }
                        }

                        scope.options = columnDef;
                        parentIsolateScope.dataArray = parentIsolateScope.dataArray || [];
                        index = parentIsolateScope.dataArray.push(columnDef) - 1;
                        parentIsolateScope.formCreated = true;
                        parentIsolateScope.formFieldCompiled = true;

                        template = getTemplate(columnDef, index);
                        element.html(template);
                        $compile(element.contents())(parentIsolateScope);
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
                template  = '<wm-button caption="{{buttonArray[' + index + '].displayName}}" show="{{isUpdateMode}}" class="{{buttonArray[' + index + '].class}}" iconname="{{buttonArray[' + index + '].iconname}}"  iconclass="{{buttonArray[' + index + '].iconclass}}" on-click="' + btnField.action + '" type="{{buttonArray[' + index + '].type}}" ></wm-button>';
            } else {
                template  = '<wm-button caption="{{buttonArray[' + index + '].displayName}}" show="{{!isUpdateMode}}" class="{{buttonArray[' + index + '].class}}" iconname="{{buttonArray[' + index + '].iconname}}" iconclass="{{buttonArray[' + index + '].iconclass}}" on-click="' + btnField.action + '" type="{{buttonArray[' + index + '].type}}" ></wm-button>';
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
