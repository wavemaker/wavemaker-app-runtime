/*global WM, _*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/layout/container/form.html',
                '<form role="form" init-widget class="panel app-panel app-form" captionposition="{{captionposition}} ng-class="[captionAlignClass, formClassName]"' +
                    ' autocomplete="autocomplete" apply-styles="shell">' +
                    '<div class="panel-heading" ng-if="title || subheading || iconclass">' +
                        '<h3 class="panel-title">' +
                            '<div class="pull-left"><i class="app-icon panel-icon {{iconclass}}" ng-show="iconclass"></i></div>' +
                            '<div class="pull-left">' +
                                '<div class="heading">{{title}}</div>' +
                                '<div class="description">{{subheading}}</div>' +
                            '</div>' +
                        '</h3>' +
                    '</div>' +
                    '<div class="form-body panel-body" apply-styles="inner-shell">' +
                        '<wm-message ng-if=(messagelayout==="Inline") scopedataset="statusMessage" hideclose="false"></wm-message>' +
                        '<div class="form-elements" wmtransclude>' +
                            '<div class="overlay" ng-if="showNoFieldsMsg">' +
                                '<span>{{:: $root.locale.MESSAGE_CANNOT_GENERATE_FIELDS_IN_STUDIO}}</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '</form>'
            );
    }])
    .directive('wmForm', ['$rootScope', 'PropertiesFactory', 'WidgetUtilService', '$compile', 'CONSTANTS', 'Utils', '$timeout', 'LiveWidgetUtils', "wmToaster", function ($rootScope, PropertiesFactory, WidgetUtilService, $compile, CONSTANTS, Utils, $timeout, LiveWidgetUtils, wmToaster) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.form', ['wm.base', 'wm.base.events.touch', 'wm.layouts.panel.defaults']),
            notifyFor = {
                'captionsize'     : true,
                'novalidate'      : true,
                'validationtype'  : true,
                'autocomplete'    : true,
                'submitbutton'    : true,
                'resetbutton'     : true,
                'captionalign'    : true,
                'captionposition' : true,
                'method'          : true,
                'action'          : true,
                'metadata'        : true,
                'formdata'        : true,
                'captionwidth'    : true
            },
            submitBtnTemplate = '<wm-button class="form-submit" type="submit" caption="submit"></wm-button>';
        //Function to set the default values on the form fields
        function setDefaultValues(scope) {
            //If form fields are not available, return here
            if (!scope.formdata || !scope.elScope.formFields || _.isEmpty(scope.elScope.formFields)) {
                return;
            }
            _.forEach(scope.elScope.formFields, function (field) {
                field.value = _.get(scope.formdata, field.key || field.name);
            });
            scope.constructDataObject();
        }
        //Generate the form field with given field definition. Add a grid column wrapper around the form field.
        function setMarkupForFormField(field, columnWidth) {
            var template = '',
                widget   = '<wm-form-field';
            _.forEach(field, function (value, key) {
                widget = widget + ' ' + key + '="' + value + '"';
            });
            widget   += '></wm-form-field>';
            template +=  '<wm-gridcolumn columnwidth="' + columnWidth + '">' + widget + '</wm-gridcolumn>';
            return template;
        }
        //Function to generate and compile the form fields from the metadata
        function generateFormFields(scope, element) {
            var fields        = scope.metadata ? scope.metadata.data || scope.metadata : [],
                fieldTemplate = '',
                $gridLayout   = element.find('.form-elements .app-grid-layout:first'),
                noOfColumns   = Number($gridLayout.attr('columns')) || 1,
                colCount      = 0,
                columnWidth   = 12 / noOfColumns,
                $fieldsMarkup,
                index,
                userFields;
            scope.elScope.formFields = []; //empty the form fields
            $gridLayout.empty(); //Remove any elements from the grid
            if (_.isEmpty(fields)) {
                return;
            }
            if (scope.onBeforerender) {
                userFields = scope.onBeforerender({$metadata: fields, $scope: scope});
                if (userFields) {
                    fields = userFields;
                }
            }
            if (!_.isArray(fields)) {
                return;
            }
            while (fields[colCount]) {
                fieldTemplate += '<wm-gridrow>';
                for (index = 0; index < noOfColumns; index++) {
                    if (fields[colCount]) {
                        fieldTemplate += setMarkupForFormField(fields[colCount], columnWidth);
                    }
                    colCount++;
                }
                fieldTemplate += '</wm-gridrow>';
            }
            $fieldsMarkup = WM.element(fieldTemplate);
            $gridLayout.prepend($fieldsMarkup);
            $compile($fieldsMarkup)(scope.elScope);
            setDefaultValues(scope);
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            var value, resetBtnTemplate, $gridLayout, layoutConfig;
            switch (key) {
            case 'captionsize':
                scope.elScope.captionsize = newVal;
                break;
            case 'captionalign':
                scope.captionAlignClass = "align-" + newVal;
                break;
            case 'captionposition':
            case 'captionwidth':
                scope.elScope.captionposition = scope.captionposition;
                layoutConfig = LiveWidgetUtils.getFieldLayoutConfig(scope.captionwidth, scope.elScope.captionposition);
                scope.elScope._captionClass = layoutConfig.captionCls;
                scope.elScope._widgetClass  = layoutConfig.widgetCls;
                break;
            case 'novalidate':
                //Set validation type based on the novalidate property
                scope.validationtype = (newVal === true || newVal === 'true') ? 'none' : 'default';
                break;
            case 'validationtype':
                LiveWidgetUtils.setFormValidationType(scope);
                break;
            case 'autocomplete':
                value = (newVal === true || newVal === 'true') ? 'on' : 'off';
                element.attr(key, value);
                break;
            case 'submitbutton':
                if (newVal === true || newVal === 'true') {
                    element.append($compile(submitBtnTemplate)(scope));
                } else {
                    element.find('.form-submit').remove();
                }
                break;
            case 'resetbutton':
                if (newVal === true || newVal === 'true') {
                    resetBtnTemplate = $compile('<wm-button class="reset-submit" type="reset" caption="reset" ' + (!scope.widgetid ? 'on-click="resetForm();"' : '') + ' ></wm-button>')(scope);
                    element.append(resetBtnTemplate);
                } else {
                    element.find('.reset-submit').remove();
                }
                break;
            case 'method':
                scope.widgetProps.enctype.show = newVal === 'post';
                break;
            case 'action':
                attrs.$set('action', newVal);
                break;
            case 'metadata':
                if (CONSTANTS.isRunMode) {
                    generateFormFields(scope, element);
                } else {
                    //As form fields are not generated in studio mode, show a message
                    $gridLayout = element.find('.form-elements .app-grid-layout:first');
                    if (newVal) {
                        $gridLayout.hide();
                        scope.showNoFieldsMsg = true;
                    } else {
                        $gridLayout.show();
                        scope.showNoFieldsMsg = false;
                    }
                }
                break;
            case 'formdata':
                if (CONSTANTS.isRunMode) {
                    setDefaultValues(scope);
                }
                break;
            }
        }
        function resetFormState($s) {
            var ngForm = $s.elScope.ngform;
            if (!ngForm) {
                return;
            }
            //Reset the form to original state on cancel/ save
            ngForm.$setUntouched();
            ngForm.$setPristine();
        }
        function resetFormFields(element) {
            var eleScope = element.scope();
            element.find('[role="input"]').each(function () {
                WM.element(this).isolateScope().reset();
            });
            $rootScope.$safeApply(eleScope);
        }
        /*Called by users programatically.*/
        function resetForm($s, element) {
            resetFormFields(element);
            resetFormState($s);
            if ($s.formFields) {
                _.forEach($s.formFields, function (dataValue) {
                    if (dataValue.type === 'blob') {
                        WM.element(element).find('[name=' + dataValue.key + ']').val('');
                        dataValue.href  = '';
                        dataValue.value = null;
                    } else {
                        dataValue.value = undefined;
                    }
                });
            } else {
                //Get all form fields and reset the values
                element.find('[data-role="form-field"]').each(function () {
                    WM.element(this).isolateScope().datavalue = undefined;
                });
            }
            $s.formdata   = undefined;
            $s.dataoutput = {};
            $rootScope.$safeApply($s);
        }

        function onResult(scope, data, status, event) {
            /* whether service call success or failure call this method*/
            Utils.triggerFn(scope.onResult, {$event: event, $isolateScope: scope, $data: data});
            if (status === 'success') {
                /*if service call is success call this method */
                Utils.triggerFn(scope.onSuccess, {$event: event, $isolateScope: scope, $data: data});
            } else {
                /* if service call fails call this method */
                Utils.triggerFn(scope.onError, {$event: event, $isolateScope: scope, $data: data});
            }

        }

        function toggleMessage(scope, msg, type) {
            if (msg) {
                $rootScope.$evalAsync(function () {
                    if (scope.messagelayout === 'Inline') {
                        scope.statusMessage = {'caption': msg || '', type: type};
                    } else {
                        wmToaster.show(type, type.toUpperCase(), msg, undefined, 'trustedHtml');
                    }
                });
            }
        }

        //Get the variable bound to form
        function getFormVariable(scope, element) {
            //If binddataset is available and starts with bind:Variables, extract the variable name
            if (scope.binddataset) {
                if (_.includes(scope.binddataset, 'bind:Variables.')) {
                    scope.formVariable = Utils.getVariableNameFromExpr(scope.binddataset);
                } else if (scope.dataset) {
                    scope.formVariable = scope.dataset;
                }
            } else if (scope.dataset) {
                scope.formVariable = scope.dataset;
            }
            return element.scope().Variables[scope.formVariable];
        }

        function constructDataObject(scope, element) {
            var formData     = {},
                formVariable = getFormVariable(scope, element);
            //Get all form fields and prepare form data as key value pairs
            _.forEach(scope.elScope.formFields, function (field) {
                var fieldName,
                    fieldTarget;
                fieldTarget = _.split(field.key || field.target, '.');
                fieldName   = fieldTarget[0] || field.key || field.name;
                //In case of update the field will be already present in form data
                if (fieldTarget.length === 1) {
                    formData[fieldName] = field.value;
                } else {
                    if (formVariable && formVariable.category === 'wm.Variable') {
                        formData[fieldTarget[1]] = field.value;
                    } else {
                        formData[fieldTarget[0]]                 = formData[fieldTarget[0]] || {};
                        formData[fieldTarget[0]][fieldTarget[1]] = field.value;
                    }
                }
            });
            scope.dataoutput = formData;
            return formData;
        }
        function submitForm(scope, element, event) {
            var params,
                template,
                formData,
                formVariable = getFormVariable(scope, element);

            //Disable the form submit if form is in invalid state.
            if (LiveWidgetUtils.validateFieldsOnSubmit(scope, scope.elScope.ngform, element)) {
                return;
            }

            resetFormState(scope);
            //Set the values of the widgets inside the form (other than form fields) in form data
            formData = scope.constructDataObject();
            LiveWidgetUtils.setFormWidgetsValues(element, formData);
            params = {$event: event, $scope: scope, $formData: formData};
            //If on before submit is there execute it and return here if result is false
            if (scope.onBeforesubmit && scope.onBeforesubmit(params) === false) {
                return;
            }
            if (scope.onSubmit || formVariable) {
                //If on submit is there execute it and if it returns true do service variable invoke else return
                //If its a service variable call setInput and assign form data and invoke the service
                if (formVariable) {
                    if (formVariable.category === 'wm.ServiceVariable') {
                        formVariable.setInput(formData);
                        formVariable.update({
                            'skipNotification': true
                        }, function (data) {
                            toggleMessage(scope, scope.postmessage, 'success');
                            onResult(scope, data, 'success', event);
                            Utils.triggerFn(scope.onSubmit, params);
                        }, function (errMsg) {
                            template = scope.errormessage || errMsg;
                            toggleMessage(scope, template, 'error');
                            onResult(scope, errMsg, 'error', event);
                            Utils.triggerFn(scope.onSubmit, params);
                        });
                    } else {
                        /* invoking the variable in a timeout, so that the current variable dataSet values are updated before invoking */
                        $timeout(function () {
                            $rootScope.$emit('invoke-service', formVariable.name, {scope: scope});
                        });
                        Utils.triggerFn(scope.onSubmit, params);
                        onResult(scope, {}, 'success', event);
                    }
                } else {
                    Utils.triggerFn(scope.onSubmit, params);
                    onResult(scope, {}, 'success', event);
                }
            } else {
                onResult(scope, {}, 'success', event);
            }
        }
        function bindEvents(scope, element) {
            element.on('submit', function (event) {
                submitForm(scope, element, event);
            });
            /*clear the file uploader in the form*/
            element.bind('reset', function () {
                resetForm(scope, element);
            });
        }

        function clearMessage(scope) {
            scope.statusMessage = undefined;
            $rootScope.$safeApply(scope);
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'transclude': true,
            'template': WidgetUtilService.getPreparedTemplate.bind(undefined, 'template/layout/container/form.html'),
            'compile': function ($tEl) {
                return {
                    'pre': function (scope, element, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;

                        scope.elScope = element.scope().$new();
                        scope.elScope.formFields = [];
                        scope.elScope.isUpdateMode = true;
                        scope.elScope.constructDataObject = scope.constructDataObject = constructDataObject.bind(undefined, scope, element);
                        scope.elScope.applyFilterOnField = WM.noop;
                        element.removeAttr('title');

                        //handle the backward compatibility for no validate
                        if (attrs.novalidate) {
                            if (!attrs.validationtype) {
                                scope.validationtype = attrs.validationtype = (attrs.novalidate === 'true' ? 'none' : 'default');
                                WM.element($tEl.context).attr('validationtype', scope.validationtype);
                            }
                            delete attrs.novalidate;
                        }
                    },
                    'post': function (scope, element, attrs) {
                        var handlers = [];
                        scope.statusMessage = undefined;
                        scope.element = element;

                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);

                        if (!scope.widgetid) {
                            bindEvents(scope, element);
                            scope.resetForm = resetForm.bind(undefined, scope, element);
                            scope.reset = resetForm.bind(undefined, scope, element);
                            scope.submit = submitForm.bind(undefined, scope, element);
                        } else {
                            //event emitted on building new markup from canvasDom
                            handlers.push($rootScope.$on('compile-form-fields', function (event, scopeId, markup) {
                                //as multiple form directives will be listening to the event, apply field-definitions only for current form
                                if (!markup || scope.$id !== scopeId) {
                                    return;
                                }
                                scope.elScope.formFields = undefined;
                                element.find('.form-elements').empty();
                                var markupObj = WM.element('<div>' + markup + '</div>');
                                /* if layout grid template found, simulate canvas dom addition of the elements */
                                $rootScope.$emit('prepare-element', markupObj, function () {
                                    element.find('.form-elements').append(markupObj);
                                    $compile(markupObj)(scope);
                                });
                            }));
                        }
                        scope.clearMessage = clearMessage.bind(undefined, scope);
                        scope.elScope.ngform = scope[scope.name];
                        scope.highlightInvalidFields = LiveWidgetUtils.highlightInvalidFields.bind(undefined, scope.elScope.ngform);
                        WidgetUtilService.postWidgetCreate(scope, element, attrs);

                        scope.$on('$destroy', function () {
                            handlers.forEach(Utils.triggerFn);
                        });
                    }
                };
            },
            'controller': function ($scope) {
                //Set form widgets scopes on form
                this.populateFormWidgets = LiveWidgetUtils.populateFormWidgets.bind(undefined, $scope, 'formWidgets');
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmForm
 * @restrict E
 *
 * @description
 * The 'wmForm' directive defines a form in the layout.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $compile
 *
 * @param {string=} title
 *                  Title of the form. This property is a bindable property.
 * @param {string=} name
 *                  Name of the form.
 * @param {string=} target
 *                  Defines the target for the form.
 * @param {string=} width
 *                  Width of the form.
 * @param {string=} height
 *                  Height of the form.
 * @param {string=} method
 *                  Defines the method to be used for submission of the form to the server [GET, POST].
 * @param {string=} action
 *                  Defines the action to be performed on successful submission of the form. This property is a bindable property.
 * @param {string=} enctype
 *                  enctype for form submit, i.e, encryption type for data submission, Example:"application/x-www-form-urlencoded", "multipart/form-data", "text/plain"
 * @param {string=} novalidate
 *                  Sets novalidate option for the form
 * @param {string=} autocomplete
 *                  Sets autocomplete for the form.
 * @param {string=} captionalign
 *                  Defines the alignment of the caption elements of widgets inside the form.<br>
 *                  Default value for captionalign is `left`.
 * @param {string=} captionposition
 *                  Defines the position of the caption elements of widgets inside the form.<br>
 *                  Default value for captionposition is `left`.
 * @param {string=} captionsize
 *                  Defines the size of the caption displayed inside the form.<br>
 *                  Default value for captionalign is `left`.
 * @param {string=} horizontalalign
 *                  Align the content of the accordion-content to left/right/center.
 *                  Default value: `left`.
 *                  Default value for autocomplete is `on`.
 * @param {string=} on-swipeup
 *                  Callback function for `swipeup` event.
 * @param {string=} on-swipedown
 *                  Callback function for `swipedown` event.
 * @param {string=} on-swiperight
 *                  Callback function for `swiperight` event.
 * @param {string=} on-swipeleft
 *                  Callback function for `swipeleft` event.
 * @param {string=} on-pinchin
 *                  Callback function for `pinchin` event.
 * @param {string=} on-pinchout
 *                  Callback function for `pinchout` event.
 * @param {string=} on-submit
 *                  Callback function for `submit` event.
 *
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-form title="Form" class="panel-default" height="300">
                    <wm-layoutgrid>
                        <wm-gridrow>
                            <wm-gridcolumn>
                                <wm-composite>
                                    <wm-label class="col-md-3" caption="Name"></wm-label>
                                    <wm-container class="col-md-9">
                                        <wm-text tabindex="1" placeholder="Enter Name"></wm-text>
                                    </wm-container>
                                </wm-composite>
                            </wm-gridcolumn>
                        </wm-gridrow>
                        <wm-gridrow>
                            <wm-gridcolumn>
                                <wm-composite>
                                    <wm-label class="col-md-3" caption="Type"></wm-label>
                                    <wm-container class="col-md-9">
                                        <wm-select tabindex="3" dataset="Option 1, Option 2, Option 3" datavalue="Option 3"></wm-select>
                                    </wm-container>
                                </wm-composite>
                            </wm-gridcolumn>
                        </wm-gridrow>
                        <wm-gridrow>
                            <wm-gridcolumn>
                                <wm-composite horizontalalign="left">
                                    <wm-label class="col-md-3" caption="Description"></wm-label>
                                    <wm-container class="col-md-9">
                                        <wm-textarea tabindex="4" placeholder="Enter Description"></wm-textarea>
                                    </wm-container>
                                </wm-composite>
                            </wm-gridcolumn>
                        </wm-gridrow>
                    </wm-layoutgrid>
                    <wm-buttongroup horizontalalign="right" class="form-action col-md-12">
                        <wm-button caption="Reset" type="reset" class="btn-secondary"></wm-button>
                        <wm-button caption="Cancel" type="button" class="btn-warning"></wm-button>
                        <wm-button caption="Save" type="submit" class="btn-primary"></wm-button>
                    </wm-buttongroup>
                </wm-form>
            </div>
        </file>
         <file name="script.js">
             function Ctrl($scope) {}
         </file>
    </example>
 */
