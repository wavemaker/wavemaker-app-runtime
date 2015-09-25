/*global WM, _*/
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
        'DialogService',
        'Utils',
        'CONSTANTS',
        '$parse',
        '$timeout',
        'DataFormatService', /*Do not remove*/
        '$animate',
        '$routeParams',
        'BindingManager',

        function ($rs, WidgetUtilService, DialogService, Utils, CONSTANTS, $parse, $timeout, DataFormatService, $animate, $routeParams, BindingManager) {
            'use strict';

            var booleanAttrs = [
                    'readonly', 'autofocus', 'disabled', 'startchecked', 'multiple',
                    'selected', 'required', 'controls', 'autoplay', 'loop', 'muted'
                ],
                DLG_ACTIONS = {
                    'SHOW': 'show',
                    'HIDE': 'hide'
                },
                EVENT = 'event';

            function isBooleanAttr(key) {
                _.includes(booleanAttrs, key);
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

            function handleDialogShowHideActions($s, dialogName, show) {
                if (show) {
                    // Pass the scope of the controller. if the controller scope is not found, dialog will be compiled with the rootScope.
                    DialogService.showDialog(dialogName, {'scope': $s.ctrlScope || $s});
                } else {
                    DialogService.hideDialog(dialogName);
                }
            }

            function handleAppCustomEvent($s, isAnchor, $evt, customEvtName) {

                var parts;

                /* For anchor elements suppressing the default action to refresh the page */
                if (isAnchor) {
                    $evt.preventDefault();
                }

                parts = customEvtName.split('.');

                if (parts.length === 2) {
                    if (parts[1] === DLG_ACTIONS.SHOW) {
                        handleDialogShowHideActions($s, parts[0], true);
                        return;
                    }
                    if (parts[1] === DLG_ACTIONS.HIDE) {
                        DialogService.hideDialog($s, parts[0], false);
                        return;
                    }
                }

                /* Emit the event in a timeout, so that any variable watching on current widget is updated with its value */
                $timeout(function () {
                    $rs.$emit('invoke-service', customEvtName, {'scope': $s});
                });
            }

            if (CONSTANTS.isRunMode) {
                $rs._handleAppCustomEvent = handleAppCustomEvent;
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

                        if (evtValue === ('goToPage-' + $routeParams.name) || evtValue === ('goToPage_' + $routeParams.name)) {
                            $el.addClass('active');
                            if (isAnchor) {
                                $parent = $el.parent();
                                if ($parent.hasClass('app-nav-item')) {
                                    $parent.addClass('active');
                                }
                            }
                        }

                        fn = evtValue
                            .split(';')
                            .map(function (fnName) {
                                var trimmedFnName = fnName.trim();
                                if (!_.includes(trimmedFnName, '(') && !_.includes(trimmedFnName, '=')) {
                                    overrideFlg = true;
                                    return '$root._handleAppCustomEvent($s, ' + isAnchor + ', $event, "' + trimmedFnName + '")';
                                }
                                return trimmedFnName;
                            })
                            .join(';');

                        //override the functions
                        if (overrideFlg) {
                            getParentMethod = $parse(fn);
                            $is[evtName] = function (locals) {
                                locals = locals || {};
                                locals.iScope = $is;
                                locals.$s  = $s;
                                return getParentMethod($s, locals);
                            };
                        }
                    });
            }

            function onWatchExprValueChange($is, $s, key, watchExpr, newVal) {
                $is[key + '__updateFromWatcher'] = true;
                if (WM.isDefined(newVal) && newVal !== null && newVal !== '') {
                    /*Check if "newVal" is a Pageable object.*/
                    if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                        /*Check if the scope is configured to accept Pageable objects.
                         * If configured, set the newVal.
                         * Else, set only the content.*/
                        if ($is.allowPageable) {
                            $is[key] = newVal;
                        } else {
                            $is[key] = newVal.content;
                        }
                    } else {
                        $is[key] = newVal;
                    }
                } else {
                    /*In studio mode, remove ".data[$i]" in the watch-expression so that it is not visible in the canvas.*/
                    if (CONSTANTS.isStudioMode) {
                        watchExpr = watchExpr.replace('.data[$i]', '');
                    }
                    /*
                     * Show the binding text
                     * if the widget is having a widget(i.e, inside canvas)
                     * OR if the mode is studio and if the widget is inside a partial
                     * OR if the mode is studio and if the widget is inside a prefab
                     */
                    $is[key] = ($is.widgetid || (CONSTANTS.isStudioMode && ($s.partialcontainername || $s.prefabname))) ? watchExpr : '';
                }
            }

            function processEventAttr($is, attrName, attrValue) {
                var onEvtName = _.camelCase(attrName); /* prepend the event name with "on" eg, 'click' with on --> onClick */

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

                /* monitor only the properties that are defined inside widgetProps and which are not defined in scope {} */

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
                                propValue = 'services/prefabs/' + $s.prefabid + '/files/webapp/' + propValue;
                            }
                            setInitProp($is, attrName, propValue);
                        } else {
                            /* if the value is other than class read it from the attrs, which will have resolved interpolated values */
                            if (isInterpolated(propValue)) {
                                watchProperty($is, attrs, attrName);
                            } else {
                                setInitProp($is, attrName, attrValue);
                            }
                        }
                    }
                } else {
                    /* attributes which not part of widgetProps like wigetid, widgettype will be handled here. */

                    if (isInterpolated(propValue)) {
                        watchProperty($is, attrs, attrName);
                    } else {
                        $is[attrName] = attrs[attrName];
                    }
                }
            }

            function processAttrs($is, $s, $tEl, attrs) {
                var widgetProps = $is.widgetProps;
                _.forEach($tEl.context.attributes, function (attr) {
                    var attrName = attr.name,
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
                                return fn($s, locals);
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

            function defineBindPropertyGetterSetters($is, $s, propDetails, key, value) {
                var bindKey       = 'bind' +  key,
                    acceptedTypes = propDetails.type,
                    acceptsArray  = _.includes(acceptedTypes, 'array'),
                    _watchers     = $is._watchers;

                Object.defineProperty($is, bindKey, {
                    'get': function () {
                        return value;
                    },
                    'set': function (nv) {
                        var fn = _watchers[key],
                            watchExpr,
                            listenerFn;

                        Utils.triggerFn(fn); // deregister the existing watch

                        /* if property is bound to a variable/widget, watch on it */
                        if (nv) {
                            watchExpr = nv.replace('bind:', '');
                            listenerFn = onWatchExprValueChange.bind(undefined, $is, $s, key, watchExpr);
                            _watchers[key] = BindingManager.register($s, watchExpr, listenerFn, {'deepWatch': true, 'allowPageable': $is.allowPageable, 'acceptsArray': acceptsArray});
                        } else {
                            _watchers[key] = undefined;

                            //todo -- check this.
                            // reset the dataset value in $is
                            /*if (key === 'show') {
                                $is[key] = true;
                            } else {
                                $is[key] = '';
                            }*/
                        }

                        value = nv;
                    }
                });
            }

            function defineDataValueGetterSetters($is, $el, attrs) {
                var flg,
                    key                 = 'datavalue',
                    bindKey             = 'bind' + key,
                    _watchers           = $is._watchers,
                    UPDATE_FROM_WATCHER = key + '__updateFromWatcher',
                    isSelect     = flg  = $el.is('select'),
                    isNumberType = flg  = !flg && $el.is('input[type=number], .app-currency, .app-slider, .app-ratings'),
                    isCheckbox   = flg  = !flg && $el.is('.app-checkbox'),
                    isDate              = !flg && $el.is('input[type=date]');

                function parseDataValue(val) {
                    var modifiedVal = val,
                        temp;

                    if (isSelect && attrs.multiple) {
                        // convert the comma separated list into array and update _model_
                        modifiedVal = val.split(',').map(function (opt) {return ('' + opt).trim(); });
                    } else if (isNumberType) {
                        temp = +val; // convert the value to number and update the scope property
                        if (isNaN(temp)) {
                            temp = 0;
                        }
                        modifiedVal = temp;
                    } else if (isCheckbox) {
                        if (!$is.checkedvalue) {
                            modifiedVal = toBoolean(val);
                        }
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
                        Utils.triggerFn($is._onChange);
                    }
                })
            }

            function definePropertyGetterSetters($is, $s, $el, attrs, propDetails, isBindableProperty, key , value) {
                var flg,
                    bindKey             = 'bind' + key,
                    UPDATE_FROM_WATCHER = key + '__updateFromWatcher',
                    _watchers           = $is._watchers,
                    type                = propDetails.type,
                    isBooleanType = flg = type === 'boolean',
                    isNumberType        = !flg && type === 'number',
                    _isBooleanAttr      = isBooleanAttr(key),
                    isFontSize          = key === 'fontsize',
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

                function hasValueChanged(nv, ov) {
                    /*When both "oldVal" and "newVal" are objects/arrays, comparison is not done.*/
                    return (nv !== ov || WM.isObject(nv) || WM.isObject(ov));
                }

                Object.defineProperty($is, key, {
                    'get': function () {
                        return value;
                    },
                    'set': function (nv) {
                        var ov = value,
                            _nv;

                        if (isBindableProperty) {
                            if (!$is[UPDATE_FROM_WATCHER]) {
                                Utils.triggerFn(_watchers[key]);
                                _watchers[key] = undefined;
                            } else {
                                $is[UPDATE_FROM_WATCHER] = false;
                            }

                            if (_.startsWith(nv, 'bind:')) {
                                $is[bindKey] = nv;
                                return;
                            }
                        }

                        _nv = parseValue(nv);

                        if (!hasValueChanged(_nv, ov)) {
                            return;
                        }

                        /* if the name is changed, update the tree and registry of the Widgets service */
                        if (isName) {
                            if (attrs.widgetid) { // widget is inside the canvas
                                $rs.$emit('name-change', attrs.widgetid, nv, ov, $is);
                            } else if ($s.Widgets) { // widget may be inside canvas inside a page container or in run mode.
                                $s.Widgets[attrs.name] = $is;
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

                if (propName === 'datavalue') {
                    if (hasModel) {
                        defineBindPropertyGetterSetters($is, $s, propDetails, propName);
                        defineDataValueGetterSetters($is, $el, attrs);
                    }

                } else {
                    if (isBindableProperty(propDetails)) {
                        defineBindPropertyGetterSetters($is, $s, propDetails, propName);
                    }
                    definePropertyGetterSetters($is, $s, $el, attrs, propDetails, isBindableProperty, propName, propDetails.value);
                }
            }

            function defineGetterSettersForProps($is, $s, $el, attrs) {
                var wp = $is.widgetProps,
                    hasModel = attrs.hasOwnProperty('hasModel');

                _.keys(wp)
                    .filter(function (propName) {
                        var propDetails = wp[propName];
                        return !($is.$$isolateBindings[propName] || propDetails.type === EVENT);
                    })
                    .forEach(function (propName) {
                        var propDetails = wp[propName];
                        defineGetterSettersForProp($is, $s, $el, attrs, hasModel, propName, propDetails);
                    });
            }

            return {
                'restrict': 'A',
                'compile': function ($tEl) {
                    return {
                        pre: function ($is, $el, attrs) {
                            var hasDataValue,
                                datavalue_value,
                                $s = $el.scope(),
                                scopeVarName;

                            if (!$is || !$is.widgetProps) {
                                return;
                            }

                            $is.propertyManager = new PropertyManager();
                            $is._watchers = {};

                            $is.$on('$destroy', deregisterWatchersOniScope.bind(undefined, $is));
                            /*Register a watch on the element for destroy and destroy the scope.
                             In some cases such as tabs, the tab-content couldn't be destroyed from isolateScope if the parent tabs was destroyed first*/
                            if (attrs.widgetid) {
                                $el.on('$destroy', $is.$destroy.bind($is));
                            } else {
                                $is._widgettype = $tEl.context.tagName.toLowerCase();
                            }
                            $is._initState = {};

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
                            }

                            /* initialize setters and getters */
                            defineGetterSettersForProps($is, $s, $el, attrs);

                            processAttrs($is, $s, $tEl, attrs);

                            /* remove the datavalue property from scope and store it temporarily, so that all dependencies are intialized first */
                            if ($is._initState.hasOwnProperty('datavalue')) {
                                hasDataValue = true;
                                datavalue_value = $is._initState.datavalue;
                                delete $is._initState.datavalue;
                            }

                            _.keys($is._initState)
                                .forEach(function (key) {
                                    // set the value in scope;
                                    $is[key] = $is._initState[key];
                                });

                            /* if element has datavalue, populate it into the isolateScope */
                            if (hasDataValue) {
                                $is.datavalue = datavalue_value;
                            }

                            if (CONSTANTS.isRunMode) {
                                overrideEventHandlers($is, $s, $el, attrs);
                            }
                        }
                    };
                }
            };
        }
    ])
    .service('BindingManager', [
        'Utils',
        'CONSTANTS',

        function (Utils, CONSTANTS) {
            'use strict';

            var regex = /\[\$i\]/g,
                $I = '[$i]',
                $0 = '[0]';

            function isArrayTypeExpr(expr) {
                var matchers = expr.match(regex); // check for `[$i]` in the expression
                return matchers && matchers.length;
            }

            function arrayConsumer(listenerFn, allowPageable, restExpr, newVal, oldVal) {
                var data = newVal,
                    formattedData;
                /*Check if "newVal" is a Pageable object.*/
                if (WM.isObject(data) && Utils.isPageable(data) && !allowPageable) {
                    /*Check if the scope is configured to accept Pageable objects.
                     * If configured, set the newVal.
                     * Else, set only the content.*/
                    data = data.content;
                }

                if (WM.isArray(data)) {
                    formattedData = data.map(function (datum) {
                        return Utils.findValueOf(datum, restExpr);
                    });

                    listenerFn(formattedData, oldVal);
                }
            }

            function getUpdatedWatchExpr(expr, acceptsArray, allowPageable, listener) {
                // listener doesn't accept array
                // replace all `[$i]` with `[0]` and return the expression
                if (!acceptsArray) {
                    return {
                        'expr': expr.replace(regex, $0),
                        'listener': listener
                    };
                }

                // listener accepts array
                // replace all except the last `[$i]` with `[0]` and return the expression.
                var index = expr.lastIndexOf($I),
                    _expr = expr.substr(0, index).replace($I, $0),
                    restExpr = expr.substr(index + 5),
                    arrayConsumerFn = listener;

                if (restExpr) {
                    arrayConsumerFn = arrayConsumer.bind(undefined, listener, allowPageable, restExpr);
                }

                return {
                    'expr': _expr,
                    'listener': arrayConsumerFn
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
            function register(scope, watchExpr, listenerFn, config) {
                var watchInfo, _config = config || {},
                    deepWatch = _config.deepWatch,
                    allowPageable = _config.allowPageable,
                    acceptsArray = _config.acceptsArray;

                if (isArrayTypeExpr(watchExpr)) {
                    if (CONSTANTS.isStudioMode) {
                        listenerFn();
                        return;
                    }

                    watchExpr = watchExpr.replace('.dataSet[$i]', '.dataSet.content[$i]');
                    watchInfo = getUpdatedWatchExpr(watchExpr, acceptsArray, allowPageable, listenerFn);
                } else {
                    watchInfo = {
                        'expr': watchExpr,
                        'listener': listenerFn
                    };
                }

                return scope.$watch(watchInfo.expr, watchInfo.listener, deepWatch);
            }

            this.register = register;
        }
    ]);