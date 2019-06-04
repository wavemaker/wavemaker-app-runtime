/*global WM, _, wm, $, document*/
/**
 * @ngdoc directive
 * @name wm.widgets.directive:initWidget
 * @restrict A
 * @element ANY
 * @requires $rootScope
 * @requires WidgetUtilService
 * @requires DialogService
 * @requires Utils
 * @requires CONSTANTS
 * @description
 * This directive is for the widgets.
 * It sets the default values and values passed as attributes into the isolateScope of the widget.
 * It triggers the onScopeValueChange function defined on the isolateScope when a scope value changes.
 * It injects the modelUpdater function when has-model attribute is present on the element.
 * It emits invokeService event to the rootScope which can used in run mode to invoke a service
 */

WM.module('wm.widgets.base')
    .directive('initWidget', [
        '$rootScope',
        'WidgetUtilService',
        'Utils',
        'CONSTANTS',
        '$parse',
        '$routeParams',
        'BindingManager',
        '$compile',
        'AppDefaults',

        /*Do not remove*/
        'DataFormatService',

        function ($rs, WidgetUtilService, Utils, CONSTANTS, $parse, $routeParams, BindingManager, $compile, AppDefaults) {
            'use strict';

            var BOOLEAN_ATTRS = {},
                EVENT         = 'event',
                $appConfirmDialog;

            if (CONSTANTS.isRunMode) {
                //Append and compile the global application confirm dialog in run mode
                $appConfirmDialog = WM.element('<wm-confirmdialog name="_app-confirm-dialog" keyboard="true" closable="true"></wm-confirmdialog>');
                WM.element(document.body).append($appConfirmDialog);
                $compile($appConfirmDialog)($rs);
            }

            // create a map of boolean attrs
            [
                'readonly', 'autofocus', 'disabled', 'startchecked', 'multiple',
                'selected', 'required', 'controls', 'autoplay', 'loop', 'muted'
            ].forEach(function (attr) {
                BOOLEAN_ATTRS[attr] = true;
            });

            function isBooleanAttr(key) {
                return BOOLEAN_ATTRS[key];
            }

            function PropertyManager() {
                var handlers = {
                    'change': []
                };

                this.ACTIONS = {
                    'CHANGE': 'change'
                };

                this.add = function (action, handler) {
                    handlers[action].push(handler);
                };
                this.get = function (action) {
                    return handlers[action];
                };
            }

            function handleAppCustomEvent($s, isAnchor, $evt, customEvtName, iScope) {
                //If dialog is in commonPage then evaluating expression on commmonPage's scope
                var widgetId   = customEvtName.split('.')[1],
                    $dialogEl  = WM.element('[id="wm-common-content"]').find('script[id="' + widgetId + '"]'),
                    $currentEl,
                    $listEl,
                    $formEl;

                if ($dialogEl.length) {
                    $s = WM.element('[name="CommonPage"]').scope();
                }

                if ($evt) {
                    $currentEl = WM.element(iScope.$element);
                    $listEl    = $currentEl.closest('.app-list-item').first();
                    //If widget is inside list and in/outside the form we assign $s as isolateScope of current iterator form widget
                    if ($listEl.length) {
                        $formEl = $listEl.find('[name="' + widgetId + '"]').first();
                        //If form and event is those five events assign scope to form isolateScope and make event name cancel()/save()/new()/delete()/reset()
                        if ($formEl.length && (_.includes(customEvtName, '.cancel') ||
                            _.includes(customEvtName, '.delete') ||
                            _.includes(customEvtName, '.new') ||
                            _.includes(customEvtName, '.reset') ||
                            _.includes(customEvtName, '.save'))) {
                                $s = $formEl.isolateScope();
                                customEvtName = customEvtName.split('.')[2];
                        }
                    }
                }

                // For anchor elements suppressing the default action to refresh the page
                if (isAnchor && $evt) {
                    $evt.preventDefault();
                }
                Utils.evalExp($s, customEvtName);
            }

            if (CONSTANTS.isRunMode) {
                $rs._handleAppCustomEvent = handleAppCustomEvent;
            }

            function isActiveNavItem(fnName) {
                var routeRegex = new RegExp('^(Variables|Actions)\.goToPage(_|-)' + $routeParams.name + '\.invoke\(\)');
                return routeRegex.test(fnName);
            }

            function overrideEventHandlers($is, $s, $el, attrs) {

                var wp = $is.widgetProps;

                _.keys(attrs)
                    .filter(function (attrName) {
                        return wp[attrName] && wp[attrName].type === EVENT;
                    })
                    .forEach(function (evtName) {
                        var overrideFlg = false,
                            fn,
                            getParentMethod,
                            $parent,
                            evtValue = attrs[evtName],
                            isAnchor = $el.is('a');

                        if (!evtValue) {
                            return;
                        }

                        fn = evtValue
                            .split(';')
                            .map(function (fnName) {

                                var trimmedFnName = fnName.trim();

                                if (isActiveNavItem(trimmedFnName)) {
                                    $el.addClass('active');
                                    if (isAnchor) {
                                        $parent = $el.parent();
                                        if ($parent.hasClass('app-nav-item')) {
                                            $parent.addClass('active');
                                        }
                                    }
                                }

                                if ((!_.includes(trimmedFnName, '(') || Utils.isVariableOrActionEvent(trimmedFnName) || _.startsWith(trimmedFnName, 'Widgets.')) && !_.includes(trimmedFnName, '=')) {
                                    overrideFlg = true;
                                    return '$rs._handleAppCustomEvent($s, ' + isAnchor + ', $event, "' + trimmedFnName + '", iScope)';
                                }
                                return trimmedFnName;
                            })
                            .join(';');

                        //override the functions
                        if (overrideFlg) {
                            attrs['_' + evtName]  = fn;
                            getParentMethod = $parse(fn);
                            $is[evtName] = function (locals) {
                                locals = locals || {};
                                locals.iScope = $is;
                                locals.$s     = $s;
                                locals.$rs    = $rs;

                                var retVal = getParentMethod($s, locals);

                                $rs.$safeApply($s);
                                return retVal;
                            };
                        }
                    });
            }

            /**
             * The method is called when the property of the widgets are changed.
             * @param $is
             * @param $s
             * @param key
             * @param watchExpr
             * @param $el
             * @param newVal
             */
            function onWatchExprValueChange($is, $s, key, propDetails, watchExpr, $el, newVal) {
                var value,
                    dataAttrKey = 'data-evaluated-' + key;

                //removing the data-evaluated attribute. If the evaluation value is correct this property is not required in design mode.
                $el.removeAttr(dataAttrKey);
                $is[key + '__updateFromWatcher'] = true;
                //For dataset widgets, show default dataset values, if dataset is not available in studio mode
                if ($is.widgetid && propDetails.showPrettyExprInDesigner && propDetails.defaultvalue && (_.isEmpty(newVal) || (newVal.data && _.isEmpty(newVal.data)))) {
                    value = propDetails.defaultvalue;
                    $el.attr(dataAttrKey, '');
                } else if (WM.isDefined(newVal) && newVal !== null && newVal !== '') {
                    //Check if "newVal" is a Pageable object.
                    if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                        // Check if the scope is configured to accept Pageable objects.
                        // If configured, set the newVal. Else, set only the content.
                        if ($is.allowPageable) {
                            value = newVal;
                        } else {
                            value = newVal.content;
                        }
                    } else {
                        value = newVal;
                    }
                } else if (CONSTANTS.isStudioMode && propDetails.showPrettyExprInDesigner) {
                    // In studio mode, remove ".data[$i]" in the watch-expression so that it is not visible in the canvas.
                    watchExpr = watchExpr.replace('.data[$i]', '');
                    /*
                     * Show the binding text
                     * if the widget is having a widget(i.e, inside canvas)
                     * OR if the mode is studio and if the widget is inside a partial
                     * OR if the mode is studio and if the widget is inside a prefab
                     */
                    value = ($is.widgetid || $s.partialcontainername || $s.prefabname) ? watchExpr : '';
                    // Checking if the property is caption and value is not evaluated in the design mode
                    if (value === watchExpr) {
                        //Adding the data-evaluated attribute to identify the unevaluated expression against the current widget
                        $el.attr(dataAttrKey, '');
                        //setting the widget name instead of the binding expression
                        value = $is.name;
                    }
                }
                $is[key] = value;
            }

            function processEventAttr($is, attrName, attrValue) {
                // _.deburr will replaces all latin characters with english chars
                // Then removing all occurences of 's in the string and first occurence of "on-"
                // Then capitalizing the remaing string and prepend with on.
                // eg, "on-click_cb" ---> onClick_cb
                var onEvtName = 'on' + _.capitalize(_.deburr(attrName).replace(RegExp("['\u2019]", 'g'), '').replace('on-', ''));
                // save the attrValue in isolateScope. eg, $is.__onClick = "f1();dialog1.show;f2();"
                $is['__' + onEvtName] = attrValue;
            }

            function isInterpolated(val) {
                return _.includes(val, '{{') && _.includes(val, '}}');
            }

            function watchProperty($is, attrs, attrName) {
                attrs.$observe(attrName, function (nv) {
                    $is[attrName] = nv;
                });
            }

            function setInitProp($is, propName, value) {
                if (WM.isDefined(value)) {
                    $is._initState[propName] = value;
                }
            }

            function processAttr($is, $s, attrs, widgetProps, attrName, attrValue) {
                var propValue = attrValue;

                // monitor only the properties that are defined inside widgetProps and which are not defined in scope {}

                /*
                 * if the attribute is inside widget property,
                 * update the attribute value in _widgetState
                 * These values will be updated in the scope after the postWidgetCreate */
                if (widgetProps.hasOwnProperty(attrName)) {
                    /* class can't have interpolated value.
                     * As angular will combine the templateEl(eg.<wm-button>) and template(eg. <button>) classes, read the class value from templateEl */
                    if (attrName === 'class') {
                        setInitProp($is, attrName, propValue);
                    } else {
                        // if the resource to be loaded is from a prefab
                        if ($s.prefabname && _.startsWith(propValue, 'resources/')) {
                            if (CONSTANTS.isRunMode) {
                                propValue = './app/prefabs/' + $s.prefabname + '/' + propValue;
                            } else {
                                propValue = 'WEB-INF/prefabs/' + $s.prefabname + '/webapp/' + propValue;
                            }
                            setInitProp($is, attrName, propValue);
                        } else {
                            // if the value is other than class read it from the attrs, which will have resolved interpolated values
                            if (isInterpolated(propValue)) {
                                watchProperty($is, attrs, attrName);
                            } else {
                                setInitProp($is, attrName, attrValue);
                            }
                        }
                    }
                } else {
                    // attributes which not part of widgetProps like wigetid, widgettype will be handled here.

                    if (isInterpolated(propValue)) {
                        watchProperty($is, attrs, attrName);
                    } else {
                        $is[attrName] = attrs[attrName];
                    }
                }
            }

            function processBoxModelProperties(el, $attrs) {
                var attrs       = el.attributes, // attributes from the dom node
                    toBeUpdated = {},
                    UNSET       = 'unset',
                    removeAttrs;

                ['border', 'margin', 'padding'].forEach(function (key) {
                    var value = '', top, right, bottom, left, unit, _unit, suffix = (key === 'border' ? 'width' : ''), hasDeprecatedAttr,
                        topVal, rightVal, bottomVal, leftVal;

                    top    = key + 'top';
                    right  = key + 'right';
                    bottom = key + 'bottom';
                    left   = key + 'left';
                    unit   = key + 'unit';

                    if (attrs[top] || attrs[right] || attrs[bottom] || attrs[left]) {
                        hasDeprecatedAttr = true;
                        removeAttrs = true;
                    }

                    if (WM.isUndefined(attrs[key])) {

                        if (hasDeprecatedAttr) {
                            _unit = attrs[unit] ? attrs[unit].value : 'px';

                            topVal    = (attrs[top]    ? attrs[top].value    + _unit : UNSET);
                            rightVal  = (attrs[right]  ? attrs[right].value  + _unit : UNSET);
                            bottomVal = (attrs[bottom] ? attrs[bottom].value + _unit : UNSET);
                            leftVal   = (attrs[left]   ? attrs[left].value   + _unit : UNSET);

                            if (topVal === bottomVal && leftVal === rightVal) {
                                if (topVal === leftVal) {
                                    value = topVal;
                                } else {
                                    value = topVal + ' ' + leftVal;
                                }
                            } else {
                                value = topVal + ' ' + rightVal + ' ' + bottomVal + ' ' + leftVal;
                            }

                            el.setAttribute(key + suffix, value);
                            $attrs[key + suffix] = value;

                            toBeUpdated[key] = value;
                        }
                    }

                    if (hasDeprecatedAttr) {
                        el.removeAttribute(top);
                        el.removeAttribute(right);
                        el.removeAttribute(bottom);
                        el.removeAttribute(left);
                        el.removeAttribute(unit);
                    }
                });

                if ($attrs.widgetid && removeAttrs) {
                    $rs.$emit('wms:migrate-box-model-props', $attrs.widgetid, toBeUpdated);
                }
            }

            function processAttrs($is, $s, $tEl, attrs) {
                var widgetProps = $is.widgetProps;

                _.forEach($tEl.context.attributes, function (attr) {
                    var attrName  = attr.name,
                        attrValue = attr.value.trim(),
                        attrNameInCamelCase,
                        fn;

                    if (_.startsWith(attrName, 'on-')) {
                        if (attrs.widgetid) { // widget is inside canvas
                            processEventAttr($is, attrName, attrValue);
                        } else {
                            attrNameInCamelCase = _.camelCase(attrName);
                            fn = $parse(attrs[attrNameInCamelCase]);
                            $is[attrNameInCamelCase] = function (locals) {
                                locals = locals || {};
                                if (!locals.$scope) {
                                    locals.$scope = $is;
                                }

                                var retVal = fn($s, locals);
                                $rs.$safeApply($s);
                                return retVal;
                            };
                        }

                    } else {
                        if (attrs.hasOwnProperty(attrName) && !$is.$$isolateBindings[attrName]) {
                            processAttr($is, $s, attrs, widgetProps, attrName, attrValue);
                        }
                    }
                });
            }

            function deregisterWatchersOniScope($is) {
                _.values($is._watchers).forEach(Utils.triggerFn);
                $is._watchers = {};
            }

            function toBoolean(val, identity) {
                return val === true || val === 'true' || (identity ? val === identity : false);
            }

            function defineBindPropertyGetterSetters($is, $s, attrs, propDetails, key, value, $el) {
                var bindKey              = 'bind' +  key,
                    acceptedTypes        = propDetails.type,
                    acceptsArray         = _.includes(acceptedTypes, 'array'),
                    _watchers            = $is._watchers,
                    isWidgetInsideCanvas = attrs.widgetid,
                    isShowProperty       = key === 'show';

                Object.defineProperty($is, bindKey, {
                    'get': function () {
                        return value;
                    },
                    'set': function (nv) {
                        var fn = _watchers[key],
                            watchExpr,
                            listenerFn;

                        Utils.triggerFn(fn); // de register the existing watch

                        // if property is bound to a variable/widget, watch on it
                        if (nv) {
                            // when the `show` property is bound to a property/expression do not evaluate that when the widget is in canvas
                            if (isWidgetInsideCanvas && isShowProperty) {
                                $is.show = true;
                                _.set($is.widgetProps, 'deferload.show', true);
                            } else {
                                watchExpr      = nv.replace('bind:', '');
                                listenerFn     = onWatchExprValueChange.bind(undefined, $is, $s, key, propDetails, watchExpr, $el);
                                _watchers[key] = BindingManager.register($s, watchExpr, listenerFn, {'deepWatch': true, 'allowPageable': $is.allowPageable, 'acceptsArray': acceptsArray}, key);
                            }
                        } else {
                            if (isWidgetInsideCanvas) {
                                $el.removeAttr('data-evaluated-' + key);

                                if (isShowProperty) {
                                    _.set($is.widgetProps, 'deferload.show', false);
                                }
                            }

                            _watchers[key] = undefined;
                            nv = undefined;
                        }

                        value = nv;
                    }
                });
            }

            function parseNgTrueNgFalseValue(val, $s, defalutVal) {
                var parseFn;
                if (val) {
                    parseFn = $parse(val);
                    if (parseFn.constant) {
                        return parseFn($s);
                    }
                }
                return defalutVal;
            }

            function defineDataValueGetterSetters($is, $el, attrs) {
                var flg,
                    key,
                    bindKey,
                    _watchers,
                    UPDATE_FROM_WATCHER,
                    isSelect,
                    isNumberType,
                    isCheckbox,
                    isDate;

                key                 = 'datavalue';
                bindKey             = 'bind' + key;
                _watchers           = $is._watchers;
                UPDATE_FROM_WATCHER = key + '__updateFromWatcher';
                isSelect     = flg  = $el.is('select');
                isNumberType = flg  = !flg && $el.is('input[type=number], .app-currency, .app-slider, .app-ratings');
                isCheckbox   = flg  = !flg && $el.is('.app-checkbox');
                isDate              = !flg && $el.is('input[type=date]') && !$el.hasClass('app-dateinput');

                function parseDataValue(val) {
                    var modifiedVal = val,
                        temp;

                    if (isSelect && attrs.multiple) {
                        modifiedVal = Utils.convertToArray(val);
                    } else if (isNumberType) {
                        temp = val;
                        if (WM.isString(val)) {
                            if (val.length) {
                                temp = +val; // convert the value to number and update the scope property
                                if (isNaN(temp)) {
                                    temp = undefined;
                                }
                            } else {
                                temp = undefined;
                            }
                        } else if (!WM.isNumber(val)) {
                            temp = undefined;
                        }
                        modifiedVal = temp;
                    } else if (isCheckbox) {
                        modifiedVal = val;
                    } else if (isDate) {
                        modifiedVal = new Date(val);
                    }
                    return modifiedVal;
                }

                Object.defineProperty($is, key, {
                    'get': function () {
                        return $is._model_;
                    },
                    'set': function (nv) {
                        if (!$is[UPDATE_FROM_WATCHER]) { // value is not from watch.
                            Utils.triggerFn(_watchers[key]); // remove the binddatavalue watcher
                            _watchers[key] = undefined;
                        } else {
                            $is[UPDATE_FROM_WATCHER] = false;
                        }

                        if (_.startsWith(nv, 'bind:')) {  // set up new watch
                            $is[bindKey] = nv;
                            return;
                        }

                        $is._model_ = parseDataValue(nv);
                        $is._ngModelOldVal = $is._model_;
                        Utils.triggerFn($is._onChange);
                    }
                });
            }

            function hasValueChanged(nv, ov, doEqualsCheck) {
                // When both "oldVal" and "newVal" are objects/arrays, comparison is not done.
                if (doEqualsCheck) {
                    return !WM.equals(nv, ov);
                }

                return (nv !== ov || WM.isObject(nv) || WM.isObject(ov));
            }

            function definePropertyGetterSetters($is, $s, $el, attrs, propDetails, isBindableProperty, key, value) {
                var flg,
                    bindKey,
                    UPDATE_FROM_WATCHER,
                    _watchers,
                    type,
                    isBooleanType,
                    isNumberType,
                    _isBooleanAttr,
                    isFontSize,
                    isName;

                bindKey             = 'bind' + key;
                UPDATE_FROM_WATCHER = key + '__updateFromWatcher';
                _watchers           = $is._watchers;
                type                = propDetails.type;
                isBooleanType = flg = type === 'boolean';
                isNumberType        = !flg && type === 'number';
                _isBooleanAttr      = isBooleanAttr(key);
                isFontSize          = key === 'fontsize';
                isName              = key === 'name';

                setInitProp($is, key, value);

                function parseValue(val) {
                    var modifiedValue = val,
                        numVal;
                    if (isBooleanType) {
                        modifiedValue = toBoolean(val, _isBooleanAttr && key);
                    } else if (isNumberType) {
                        numVal = +val;
                        if (isFontSize) {
                            if (WM.isString(val) && val.trim().length) {
                                modifiedValue = numVal;
                            }
                        } else {
                            modifiedValue = +val;
                        }
                    }
                    return modifiedValue;
                }

                Object.defineProperty($is, key, {
                    'get': function () {
                        return value;
                    },
                    'set': function (nv) {
                        var ov = value,
                            _nv,
                            doEqualsCheck;

                        if (isBindableProperty) {
                            if (!$is[UPDATE_FROM_WATCHER]) {
                                Utils.triggerFn(_watchers[key]);
                                _watchers[key] = undefined;
                                doEqualsCheck = true;
                            } else {
                                $is[UPDATE_FROM_WATCHER] = false;
                            }

                            if (_.startsWith(nv, 'bind:')) {
                                $is[bindKey] = nv;
                                return;
                            }
                        } else {
                            doEqualsCheck = true;
                        }

                        _nv = parseValue(nv);

                        if (!hasValueChanged(_nv, ov, doEqualsCheck)) {
                            return;
                        }

                        /*
                         * remove 'disabled' attr from the root node of the widget when the value is false
                         * Non-form elements with disabled attribute will block the click events (IE bug)
                         */
                        if (!$is.widgetid && isBooleanType && key === 'disabled') {
                            if (_nv) {
                                $el.attr('disabled', 'disabled');
                            } else {
                                $el.removeAttr('disabled');
                            }
                        }

                        // if the name is changed, update the tree and registry of the Widgets service
                        if (isName) {
                            if (attrs.widgetid) { // widget is inside the canvas
                                $rs.$emit('name-change', attrs.widgetid, nv, ov, $is);
                            } else if ($s.Widgets && attrs.name) { // widget may be inside canvas inside a page container or in run mode.
                                $s.Widgets[nv] = $is;
                            }
                        }

                        value = _nv;

                        WidgetUtilService.onScopeValueChangeProxy($is, $el, attrs, key, _nv, ov);
                    }
                });
            }

            function isBindableProperty(propDetails) {
                return propDetails.bindable === 'in-bound' || propDetails.bindable === 'in-out-bound';
            }

            function defineGetterSettersForProp($is, $s, $el, attrs, hasModel, propName, propDetails) {

                var _isBindableProperty;

                if (propName === 'datavalue' && hasModel) {
                    defineBindPropertyGetterSetters($is, $s, attrs, propDetails, propName, undefined, $el);
                    defineDataValueGetterSetters($is, $el, attrs);
                } else if (!propDetails.ignoreGetterSetters) {

                    _isBindableProperty = isBindableProperty(propDetails);
                    if (_isBindableProperty) {
                        defineBindPropertyGetterSetters($is, $s, attrs, propDetails, propName, undefined, $el);
                    }
                    definePropertyGetterSetters($is, $s, $el, attrs, propDetails, _isBindableProperty, propName, attrs[propName] ? undefined : propDetails.value);
                }
            }

            function defineGetterSettersForProps($is, $s, $el, attrs) {
                var wp       = $is.widgetProps,
                    hasModel = attrs.hasOwnProperty('hasModel');

                Object.keys(wp).forEach(function (propName) {
                    var propDetails = wp[propName];

                    if ($is.$$isolateBindings[propName] || propDetails.type === EVENT) {
                        return;
                    }

                    defineGetterSettersForProp($is, $s, $el, attrs, hasModel, propName, propDetails);
                });
            }

            /*
             * Class : FieldDef
             * Discription : FieldDef contains getter and setter methods to get and set fields of widgets
             * */
            wm.baseClasses.FieldDef = function () {};

            wm.baseClasses.FieldDef.prototype = {
                'setProperty' : function (field, newval) {
                    this.$is.setProperty.call(this, field, newval);
                    if (this.$is.redraw) {
                        this.$is.redraw(true);
                    }
                },
                'getProperty' : function (field) {
                    return this.$is.getProperty.call(this, field);
                }
            };

            // read appDefault config from the attributes
            // Parse the json, get the corresponding values from AppDefaults Service and update them in isolateScope of the widget
            // Update them in _initState also, so the propertyChangeListener will be triggered.
            function applyAppDefaults($is, attrs) {

                var config = JSON.parse(attrs.appDefaults);

                _.forEach(config, function (val, key) {
                    var appSetting = AppDefaults.get(val);
                    if (_.trim(appSetting).length) {
                        if (!attrs.hasOwnProperty(key)) {
                            $is[key]   = appSetting;
                            $is._initState[key] = appSetting;
                            attrs[key] = appSetting;
                        }
                    }
                });
            }

            return {
                'restrict': 'A',
                'require': ['?^^wmLiveform', '?^^wmForm', '?^^wmLivefilter', '?^^liveFormWithDialog'],
                'compile': function ($tEl, $tAttrs) {

                    processBoxModelProperties($tEl.context, $tAttrs);

                    return {
                        pre: function ($is, $el, attrs) {
                            var hasDataValue,
                                datavalue_value,
                                $s = $el.scope(),
                                scopeVarName,
                                delayed = [];

                            if (!$is || !$is.widgetProps) {
                                return;
                            }

                            $is.propertyManager = new PropertyManager();
                            $is._watchers       = {};
                            $is._applyCSSFns    = [];

                            $is.$on('$destroy', deregisterWatchersOniScope.bind(undefined, $is));

                            /*
                             * Register a watch on the element for destroy and destroy the scope.
                             * In some cases such as tabs, the tab-content couldn't be destroyed from isolateScope if the parent tabs was destroyed first
                             */
                            if (attrs.widgetid) {
                                $el.on('$destroy', $is.$destroy.bind($is));
                            } else {
                                $is._widgettype = $tEl.context.tagName.toLowerCase();
                            }

                            $is._initState = {};

                            if (attrs.appDefaults) {
                                applyAppDefaults($is, attrs);
                            }

                            if (attrs.hasOwnProperty('hasModel') && !attrs.widgetid) {
                                scopeVarName = $tEl.context.attributes.scopedatavalue;
                                scopeVarName = scopeVarName && scopeVarName.value;
                                if (scopeVarName && isInterpolated(scopeVarName)) {
                                    attrs.$observe('scopedatavalue', function (newValue) {
                                        WidgetUtilService.injectModelUpdater($el, newValue);
                                    });
                                } else {
                                    WidgetUtilService.injectModelUpdater($el, scopeVarName);
                                }
                            }

                            if (CONSTANTS.isStudioMode) {
                                WM.extend($is.widgetProps, {'active': {}});
                            } else {

                                // Setter for widget properties
                                $is.setProperty = function (option, value) {
                                    this[option] = value;
                                };

                                // Getter for widget properties
                                $is.getProperty = function (option) {
                                    return this[option];
                                };

                                // define focus method
                                $is.focus = function () {
                                    /**
                                     * Check for the nodes having focus-target attribute inside the element
                                     * If found, focus the first node (eg, date widget)
                                     * else, focus the element (eg, text widget)
                                     */
                                    var $target = $el.find('[focus-target]');
                                    if (!$target.length) {
                                        $target = $el;
                                    }
                                    $target.first().focus();
                                };
                            }

                            // initialize setters and getters
                            defineGetterSettersForProps($is, $s, $el, attrs);

                            processAttrs($is, $s, $tEl, attrs);

                            // remove the datavalue property from scope and store it temporarily, so that all dependencies are intialized first
                            if ($is._initState.hasOwnProperty('datavalue')) {
                                hasDataValue = true;
                                datavalue_value = $is._initState.datavalue;
                                delete $is._initState.datavalue;
                            }

                            // delay the setting of binded properties in isolateScope
                            Object.keys($is._initState).forEach(function (propName) {
                                var propVal = $is._initState[propName];

                                if (_.startsWith(propVal, 'bind:')) {
                                    delayed.push({'name': propName, 'value': propVal});
                                } else {
                                    // set the value in scope;
                                    $is[propName] = propVal;
                                }
                            });


                            // update the binded properties in isolateScope
                            delayed.forEach(function (prop) {
                                $is[prop.name] = prop.value;
                            });

                            // if element has datavalue, populate it into the isolateScope
                            if (hasDataValue) {
                                if ($el.is('.app-checkbox') && !_.startsWith(datavalue_value, 'bind:')) {
                                    datavalue_value = parseNgTrueNgFalseValue(datavalue_value, $s, false);
                                }
                                $is.datavalue = datavalue_value;
                            }

                            if (CONSTANTS.isRunMode) {
                                overrideEventHandlers($is, $s, $el, attrs);
                            }
                            $is.$element = $el; // expose the element ref on the isolateScope
                        },
                        post: function ($is, $el, attrs, $ctrls) {
                            //When widgets inside live form, live filter and form are compiled, add widget scopes to parent widget formWidgets property
                            if ($ctrls[0]) {
                                Utils.triggerFn($ctrls[0].populateFormWidgets, $is);
                            } else if ($ctrls[1]) {
                                Utils.triggerFn($ctrls[1].populateFormWidgets, $is);
                            } else if ($ctrls[2]) {
                                Utils.triggerFn($ctrls[2].populateFormWidgets, $is);
                            } else if ($ctrls[3]) {
                                Utils.triggerFn($ctrls[3].populateFormWidgets, $is);
                            }
                        }
                    };
                }
            };
        }
    ])
    .directive('hasModel', function (CONSTANTS) {
        'use strict';

        if (CONSTANTS.isStudioMode) {
            return {};
        }

        return {
            'restrict': 'A',
            'priority': 200,
            'compile' : function ($tEl) {
                return {
                    'pre': function ($s, $el, attrs) {
                        var dataValueAttr,
                            scopeDataValueAttr;
                        //Input field is inside livelist
                        if ($el.closest('.app-livelist').length) {
                            dataValueAttr      = attrs.datavalue;
                            scopeDataValueAttr = attrs.scopedatavalue;
                            //If datavalue has bind: and no scopedatavalue on the input remove datavalue and assign value to scopedatavalue
                            if (dataValueAttr &&  _.startsWith(dataValueAttr, 'bind:item') && !scopeDataValueAttr) {
                                scopeDataValueAttr = dataValueAttr.replace('bind:', '');
                                WM.element($tEl.context).attr('scopedatavalue', scopeDataValueAttr).removeAttr('datavalue');
                                attrs.datavalue = undefined;
                                attrs.scopedatavalue = scopeDataValueAttr;
                            }
                        }
                    }
                };
            }
        };
    })
    .service('BindingManager', [
        '$rootScope',
        'Utils',
        'CONSTANTS',
        '$interval',

        function ($rs, Utils, CONSTANTS, $interval) {
            'use strict';

            var regex             = /\[\$i\]/g,
                $I                = '[$i]',
                $0                = '[0]',
                watchers          = [],
                TFNWatchers       = [], // contains timeFromNow watchers
                VARIABLE_REGEX    = /Variables\.(\w*)\.dataSet\[\$i\]/g, //Reg exp to match all Variables which has dataSet[$i];
                DATASET_REGEX     = /Variables\.(\w*)\.dataSet$/, //Reg exp to match expr which is only dataSet
                TFN_FILTER_REGEX  = /\s*\|\s*timeFromNow/, //Reg exp to match expr which has | timeFromNow filter applied
                TFN_INTERVAL      = 60000, //One minute
                FILE_UPLOAD_REGEX = /Widgets\.\w+\.selectedFiles/,  //Reg exp to match expr which has selected files property of fileupload widget
                interval,
                _registerWatchers;

            function isArrayTypeExpr(expr) {
                var matchers = expr.match(regex); // check for `[$i]` in the expression
                return matchers && matchers.length;
            }

            function isDataSetTypeExpr(expr, key) {
                if (key !== 'datavalue') {
                    return false;
                }
                return DATASET_REGEX.test(expr);
            }

            /**
             * destroy the watcher that is fired in intervals
             * remove the watcher from the intervalWatchers array
             * watcher.index is the identifier index for the watcher
             * @param watcher, the watcher that is destroyed
             */
            function destroyTFNWatcher(watcher) {
                // remove the watcher from array
                _.pullAt(TFNWatchers, _.indexOf(TFNWatchers, watcher));

                // if no watchers left, destroy the interval
                if (TFNWatchers.length === 0) {
                    $interval.cancel(interval);
                    interval = undefined;
                }
            }

            // evaluates timeFromNow filter expression and notifies the listener
            function evalTFNFilterExprAndNotifyListener(watcher) {
                if (watcher.$s && !watcher.$s.$$destroyed) {
                    watcher.listener(watcher.$s.$eval(watcher.expr));
                }
            }

            /**
             * execute all watchers to be fired in an interval
             * watchers fired for the first time will be assigned a destroy method, to be called on scope destruction
             */
            function evalTFNFilterExprs() {
                var i, watcher;
                for (i = 0; i < TFNWatchers.length; i++) {
                    watcher = TFNWatchers[i];

                    evalTFNFilterExprAndNotifyListener(watcher);

                    if (!watcher.deRegister.destroy) {
                        watcher.deRegister.destroy = destroyTFNWatcher.bind(undefined, watcher);
                    }
                }
            }

            if (CONSTANTS.isRunMode) {
                $rs.$on('locale-change', evalTFNFilterExprs);
                $rs.$on('eval-tfn-watchers', evalTFNFilterExprs);
            }

            // register the watchers.
            function registerWatchers() {
                $rs.$evalAsync(function () {
                    var i, watcher;
                    // use the native for to improve the performance
                    for (i = 0; i < watchers.length; i++) {
                        watcher = watchers[i];
                        if (!watcher.deRegister.skip) {
                            if (watcher.$s && !watcher.$s.$$destroyed) {
                                // when bound to FileUpload widget, use $watchCollection instead of $watch
                                if (FILE_UPLOAD_REGEX.test(watcher.expr)) {
                                    watcher.deRegister.destroy = watcher.$s.$watchCollection(watcher.expr, watcher.listener, watcher.deepWatch);
                                } else {
                                    watcher.deRegister.destroy = watcher.$s.$watch(watcher.expr, watcher.listener, watcher.deepWatch);
                                }
                            }
                        }
                    }

                    watchers.length = 0;

                    if (TFNWatchers.length) {
                        //execute watchers first time, before the interval
                        evalTFNFilterExprs();
                        // If the interval is not setup, create one.
                        // keep only one interval all the time, the interval will execute all watchers together
                        if (!interval) {
                            interval = $interval(evalTFNFilterExprs, TFN_INTERVAL);
                        }
                    }
                });
            }

            _registerWatchers = _.debounce(registerWatchers);

            function arrayConsumer(listenerFn, allowPageable, restExpr, newVal, oldVal) {
                var data = newVal,
                    formattedData;
                // Check if "newVal" is a Pageable object.
                if (WM.isObject(data) && Utils.isPageable(data) && !allowPageable) {
                    // Check if the scope is configured to accept Pageable objects.
                    // If configured, set the newVal. Else, set only the content.
                    data = data.content;
                }

                if (WM.isArray(data)) {
                    formattedData = data.map(function (datum) {
                        return Utils.findValueOf(datum, restExpr);
                    });

                    // If resulting structure is an array of array, flatten it
                    if (WM.isArray(formattedData[0])) {
                        formattedData = _.flatten(formattedData);
                    }

                    listenerFn(formattedData, oldVal);
                }
            }

            function getUpdatedWatchExpr(expr, acceptsArray, allowPageable, listener) {
                // listener doesn't accept array
                // replace all `[$i]` with `[0]` and return the expression
                if (!acceptsArray) {
                    return {
                        'expr'     : expr.replace(regex, $0),
                        'listener' : listener
                    };
                }

                // listener accepts array
                // replace all except the last `[$i]` with `[0]` and return the expression.
                var index           = expr.lastIndexOf($I),
                    _expr           = expr.substr(0, index).replace($I, $0),
                    restExpr        = expr.substr(index + 5),
                    arrayConsumerFn = listener;

                if (restExpr) {
                    arrayConsumerFn = arrayConsumer.bind(undefined, listener, allowPageable, restExpr);
                }

                return {
                    'expr'     : _expr,
                    'listener' : arrayConsumerFn
                };
            }

            /*
             * scope: scope on which watch needs to be registered.
             * watchExpr: watch expression
             * listenerFn: callback function to be triggered when the watch expression value changes
             * config: Object containing deepWatch, allowPageable, acceptsArray keys
             * deepWatch: if this flag is true a deep watch will be registered in the scope
             * allowPageable: is the data pageable
             * acceptsArray: bound entity accepts array like values
             */
            function register($s, watchExpr, listenerFn, config, key) {
                var watchInfo,
                    watcher,
                    _config              = config || {},
                    deepWatch            = _config.deepWatch,
                    allowPageable        = _config.allowPageable,
                    acceptsArray         = _config.acceptsArray,
                    isOnlyDataSet        = isDataSetTypeExpr(watchExpr, key),
                    deRegister           = {},
                    isParentVariableExpr = watchExpr.indexOf('$parent.Variables') !== -1,
                    variables            = isParentVariableExpr ? _.get($s, '$parent.Variables') : $s.Variables,
                    variableObject,
                    regExp,
                    index;

                function isPageable(variable) {
                    //Check if pagination is available for data service variables. isList property will be true for array types.
                    //But, for procedure variable isList is true and pagination is not available
                    return (variable.category === 'wm.ServiceVariable'
                            && variable.serviceType === 'DataService'
                            && variable.controller !== 'ProcedureExecution'
                            && variable.isList);
                }

                if (isArrayTypeExpr(watchExpr) || isOnlyDataSet) {
                    // In design mode array type expressions(in live list template) are not to be evaluated
                    if (CONSTANTS.isStudioMode && !config.acceptsArray) {
                        listenerFn();
                        return;
                    }
                    if (isOnlyDataSet) {
                        index  = '0';
                        regExp = DATASET_REGEX;
                    } else {
                        index  = '$i';
                        regExp = VARIABLE_REGEX;
                    }
                    //Check each match is pageable and replace dataSet[$i] with dataSet.content[$i]
                    watchExpr = watchExpr.replace(regExp, function (match, varName) {
                        variableObject = _.get(variables, varName);
                        // In case of queries(native sql,hql) the actual data is wrapped inside content but in case of procedure its not wrapped
                        // So for procedures the watch expression will not have content in it
                        if (variableObject && isPageable(variableObject)) {
                            return 'Variables.' + varName + '.dataSet.content[' + index + ']';
                        }
                        if (variableObject && variableObject.category === 'wm.LiveVariable') {
                            return 'Variables.' + varName + '.dataSet.data[' + index + ']';
                        }
                        return match;
                    });

                    watchInfo = getUpdatedWatchExpr(watchExpr, acceptsArray, allowPageable, listenerFn);
                } else {
                    watchInfo = {
                        'expr'    : watchExpr,
                        'listener': listenerFn
                    };
                }

                // gather watcher details
                watcher = {
                    '$s'         : $s,
                    'expr'       : watchInfo.expr,
                    'listener'   : watchInfo.listener,
                    'deepWatch'  : deepWatch,
                    'deRegister' : deRegister
                };

                // expressions having timeFromNow filter needs to be evaluated in a periodic intervals
                if (TFN_FILTER_REGEX.test(watchInfo.expr)) {
                    TFNWatchers.push(watcher);
                } else {
                    watchers.push(watcher);
                }

                // delay the registration of watcher to improve the load time performance.
                _registerWatchers();

                return function customWatchDeRegister() {
                    // watcher might have not been registered by this time.
                    if (!deRegister.destroy) {
                        deRegister.skip = true;
                    }
                    Utils.triggerFn(deRegister.destroy);
                };
            }

            this.register = register;
        }
    ]);

(function () {
    'use strict';

    // if the mode is studio include the textAngular as a dependency.
    // else define the `terminal` directives from the typeConfigMap and load the dependencies.
    if ($.__isStudioMode) {
        WM.module('wm.widgets.form').requires = WM.module('wm.widgets.form').requires.concat(['textAngular']);
    } else {
        var baseUri,
            typeConfigMap,
            module,
            directiveFn,
            prefix,
            componentLibsRoot;

        // get the _cdnUrl_ from the loaded script
        baseUri = WM.element('script[src$="wm-libs.min.js"]').attr('src');

        if (!baseUri) {
            return;
        }

        baseUri = baseUri.substring(0, baseUri.indexOf('/scripts/'));

        prefix  = '/scripts/component-libs/';
        componentLibsRoot = baseUri + prefix;

        // typeConfigMap defines the widgetType and dependency map
        typeConfigMap = {
            'wm-chart': {
                'files': [componentLibsRoot + 'chart.min.js']
            },
            'wm-calendar': {
                'files': [componentLibsRoot + 'calendar.min.js']
            },
            'wm-richtexteditor': {
                'files': [componentLibsRoot + 'richTextEditor.min.js'],
                'name': 'textAngular'
            }
        };

        directiveFn = function directiveFn(directiveName, widgetType, $ocLazyLoad, $compile, $injector, Utils) {

            var libsLoaded,
                inProgress,
                compileFns = [],
                delayPageReadyByTypeMap = {};

            function _compile($el, $s, attrs) {
                $compile($el)($s);
            }

            function _compileWidgets($s) {
                while (compileFns.length) {
                    compileFns.shift()();
                }
                Utils.triggerFn($s.onPagePartLoad);
                delayPageReadyByTypeMap[widgetType] = false;
            }

            function _postLibsLoad($s) {
                libsLoaded = true;
                inProgress = false;

                var definitions = $injector.get(directiveName + 'Directive');

                _.remove(definitions, function (defn) {
                    return defn.name === directiveName && defn.terminal;
                });

                _compileWidgets($s);
            }


            // do not load the calendar related libs in mobile project/ web project in mobile view
            if (directiveName === 'wmCalendar' && Utils.isMobile()) {
                return {};
            }

            return {
                'restrict': 'E',
                'terminal': true,
                'priority': 100,
                'link': {
                    'pre': function ($s, $el, attrs) {
                        var compileFn, config, _clone;

                        // delay the invocation of onPageReady till all the lazy-widgets are loaded
                        if (!delayPageReadyByTypeMap[widgetType]) {
                            delayPageReadyByTypeMap[widgetType] = true;
                            Utils.triggerFn($s.registerPagePart); // register the widget as page part
                        }

                        _.forEach(attrs.$$element.context.attributes, function (attr) {
                            $el[0].setAttribute(attr.name, attr.value);
                        });

                        _clone = $el.clone(true);
                        $el.replaceWith(_clone);

                        compileFn = _compile.bind(undefined, _clone, $s, attrs);

                        compileFns.push(compileFn);

                        if (!libsLoaded) {
                            if (!inProgress) {
                                inProgress = true;
                                config = typeConfigMap[widgetType];

                                // load the dependant js files
                                $ocLazyLoad.jsLoader(config.files, function () {
                                    if (config.name) { // inject the module
                                        $ocLazyLoad.inject(config.name).then(_postLibsLoad.bind(undefined, $s), {});
                                    } else {
                                        _postLibsLoad($s);
                                    }
                                }, {});
                            }
                        } else {
                            _compileWidgets(widgetType);
                        }
                    }
                }
            };
        };

        module = WM.module('wm.widgets.base');

        // define the terminal directives
        _.keys(typeConfigMap).forEach(function (widgetType) {
            var directiveName = _.camelCase(widgetType);
            module.directive(directiveName, ['$ocLazyLoad', '$compile', '$injector', 'Utils', directiveFn.bind(undefined, directiveName, widgetType)]);
        });
    }
}());
//prevents the event propagation to document when clicked on a day button.
//needed to prevent the popover close when clicked on element which is appended to body but part of popover content
(function(){
    'use strict';

    if ($.__isStudioMode) {
        return;
    }
    var module = WM.module('wm.widgets.base');
    function directiveFn () {
        return {
            'restrict': 'A',
            'link'    : function($s, $el) {
                $el.on('click', function (event) {
                    event.stopPropagation();
                });
            }
        };
    }


    //perform the operation on the uib datepicker, search typeahead and time picker
    module.directive('uibDatepickerPopupWrap', directiveFn)
        .directive('uibTimepicker', directiveFn)
        .directive('uibTypeaheadPopup', directiveFn);


    /*
     * `deferload` directive works with `show` property
      * when show property is bound and deferload is true, the rendering of the widget will be deferred till the first time show
     */
    function deferLoadDirective($compile, BindingManager) {

        // compile the element
        function compileFn($s, $el) {
            $compile($el)($s);
        }

        return {
            'restrict': 'A',
            'priority': 1000,
            'terminal': true,
            'link': function ($s, $el, attrs) {

                $el.removeAttr('deferload');

                var showExpr, unregisterFn;

                showExpr = attrs.show;

                if (_.startsWith(showExpr, 'bind:') && attrs.deferload === 'true') {
                    showExpr = _.replace(showExpr, 'bind:', '');
                    $el.addClass('ng-hide');
                    unregisterFn = BindingManager.register($s, showExpr, function (nv) {
                        if (nv === 'true' || nv === true) {
                            unregisterFn();
                            $el.removeClass('ng-hide');
                            compileFn($s, $el);
                        }
                    });
                } else {
                    compileFn($s, $el);
                }
            }
        };
    }

    module.directive('deferload', ['$compile', 'BindingManager', deferLoadDirective]);
}());
