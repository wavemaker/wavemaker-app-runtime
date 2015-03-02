/*global WM, wm, wmCoreModule*/
/*jslint todo: true */
/*
 Extends the popup directive for HTML capabilities inside the popup.
 */
WM.module('ui.bootstrap.popover')

    /**
     * The $wmPopup service creates tooltip- and popup-like directives as well as
     * houses global options for them.
     */
    .provider('$wmPopup', function () {
        'use strict';
        /*The default options tooltip and popup.*/
        var defaultOptions = {
            placement: 'bottom',
            animation: true,
            popupDelay: 0,
            autoClose: true,
            arrow: false,
            isText: false
        }, triggerMap = {
            'mouseenter': 'mouseleave',
            'click': 'click',
            'focus': 'blur'
        }, globalOptions = {}, popupRegistry = [];

        /**
         * `options({})` allows global configuration of all tooltips in the
         * application.
         *
         *   var app = angular.module( 'App', ['ui.bootstrap.tooltip'], function( $wmPopupProvider ) {
         *     place tooltips left instead of top by default
         *     $wmPopupProvider.options( { placement: 'left' } );
         *   });
         */
        this.options = function (value) {
            WM.extend(globalOptions, value);
        };

        /**
         * This allows you to extend the set of trigger mappings available. E.g.:
         *
         *   $wmPopupProvider.setTriggers( 'openTrigger': 'closeTrigger' );
         */
        this.setTriggers = function setTriggers(triggers) {
            WM.extend(triggerMap, triggers);
        };

        /**
         * Returns the actual instance of the $wmPopup service.
         * TODO support multiple triggers
         */
        this.$get = [ '$compile', '$timeout', '$parse', '$document', '$position', '$interpolate', 'Utils', function ($compile, $timeout, $parse, $document, $position, $interpolate, Utils) {
            return function $wmPopup(type, prefix, defaultTriggerShow) {
                var options = WM.extend({}, defaultOptions, globalOptions), directiveName, triggers, startSym,
                    endSym, directiveTemplate;

                function setTriggers(trigger) {
                    var show, hide;
                    show = trigger || options.trigger || defaultTriggerShow;
                    if (options.trigger) {
                        hide = triggerMap[options.trigger] || show;
                    } else {
                        hide = triggerMap[show] || show;
                    }

                    return {
                        show: show,
                        hide: hide
                    };
                }

                /* hide all opened popups */
                function hideAllPopups() {
                    var i, popupCount = popupRegistry.length, currPopup, currPopupScope;
                    for (i = 0; i < popupCount; i += 1) {
                        currPopup = popupRegistry[i];
                        currPopupScope = currPopup.isolateScope();
                        if (currPopupScope.isOpen && currPopupScope.autoClose !== 'false') {
                            currPopupScope.hidePopup();
                        }
                    }
                }

                $document.find('body').on('click', function (event) {
                    hideAllPopups();
                });

                directiveName = Utils.hyphenate(type);
                triggers = setTriggers(undefined);
                startSym = $interpolate.startSymbol();
                endSym = $interpolate.endSymbol();
                directiveTemplate =
                    '<' + directiveName + '-window ' +
                    'content="' + startSym + 'popup_content' + endSym + '" ' +
                    'style-class="' + startSym + 'popup_style_class' + endSym + '"' +
                    'placement="' + startSym + 'popup_placement' + endSym + '" ' +
                    'auto-close="popup_autoClose" ' +
                    'identifier="' + startSym + 'popup_identifier' + endSym + '" ' +
                    'animation="popup_animation()" ' +
                    'arrow="popup_arrow()" ' +
                    'is-text="popup_isText()" ' +
                    'is-open="popup_isOpen"' +
                    '>' +
                    '</' + directiveName + '-window>';
                return {
                    restrict: 'EA',
                    scope: true,
                    link: function link(scope, element, attrs) {
                        var tooltip = $compile(directiveTemplate)(scope), isTooltipExist = false,
                            transitionTimeout, popupTimeout, $body,
                            appendToBody = options.appendToBody || false;

                        /*Show the tooltip popup element.*/
                        function show() {
                            var position, popupWidth, popupHeight, popupPosition, mousePos, tooltipScope;

                            /* hide previously opened popups */
                            hideAllPopups();

                            /*Don't show empty tooltips.*/
                            if (!scope.popup_content) {
                                return;
                            }

                            /*If there is a pending remove transition, we must cancel it, lest the
                             tooltip be mysteriously removed.*/
                            if (transitionTimeout) {
                                $timeout.cancel(transitionTimeout);
                            }

                            /*Set the initial positioning.*/
                            tooltip.css({ top: 0, left: 0, display: 'block' });

                            if (!isTooltipExist) {
                                if (appendToBody) {
                                    $body = $body || $document.find('body');
                                    $body.append(tooltip);
                                } else {
                                    element.after(tooltip);
                                }
                            }

                            /*Get the position of the directive element.*/
                            position = options.appendToBody ? $position.offset(element) : $position.position(element);

                            /*Get the height and width of the tooltip so we can center it.*/
                            popupWidth = tooltip.prop('offsetWidth');
                            popupHeight = tooltip.prop('offsetHeight');

                            /*Calculate the tooltip's top and left coordinates to center it with
                             this directive.*/
                            switch (scope.popup_placement) {
                            case 'mouse':
                                mousePos = $position.mouse();
                                popupPosition = {
                                    top: mousePos.y,
                                    left: mousePos.x
                                };
                                break;
                            case 'right':
                                popupPosition = {
                                    top: position.top + position.height / 2 - popupHeight / 2,
                                    left: position.left + position.width
                                };
                                break;
                            case 'bottom':
                                popupPosition = {
                                    top: position.top + position.height,
                                    left: position.left + position.width / 2 - popupWidth / 2
                                };
                                break;
                            case 'left':
                                popupPosition = {
                                    top: position.top + position.height / 2 - popupHeight / 2,
                                    left: position.left - popupWidth
                                };
                                break;
                            default:
                                popupPosition = {
                                    top: position.top - popupHeight,
                                    left: position.left + position.width / 2 - popupWidth / 2
                                };
                                break;
                            }

                            popupPosition.top += 'px';
                            popupPosition.left += 'px';

                            /*Now set the calculated positioning.*/
                            tooltip.css(popupPosition);

                            /*And show the tooltip.*/
                            scope.popup_isOpen = true;

                            /* to enable custom controller code */

                            tooltipScope = tooltip.isolateScope();
                            if (tooltipScope && WM.isFunction(tooltipScope.showCallBack)) {
                                tooltipScope.showCallBack();
                            }
                        }

                        /*Hide the tooltip popup element.*/
                        function hide() {
                            /*First things first: we don't show it anymore.*/
                            scope.popup_isOpen = false;
                            tooltip.css('display', 'none');

                            /*if tooltip is going to be shown after delay, we must cancel this*/
                            $timeout.cancel(popupTimeout);

                            /* to enable custom controller code */
                            var tooltipScope = tooltip.isolateScope();
                            if (tooltipScope && WM.isFunction(tooltipScope.hideCallBack)) {
                                tooltipScope.hideCallBack();
                            }
                        }

                        /*Show the tooltip with delay if specified, otherwise show it immediately*/
                        function showTooltipBind(event) {
                            if (scope.popup_popupDelay) {
                                popupTimeout = $timeout(show, scope.popup_popupDelay);
                            } else {
                                scope.$apply(show);
                            }
                            event.stopPropagation();
                        }

                        function hideTooltipBind(event) {
                            scope.$apply(function () {
                                hide();
                            });
                            event.stopPropagation();
                        }

                        scope.hide = function () {
                            scope.$apply(function () {
                                hide();
                            });
                        };
                        tooltip.isolateScope().hidePopup = function () {
                            hide();
                        };
                        /*By default, the tooltip is not open.
                         TODO add ability to start tooltip opened*/
                        scope.popup_isOpen = false;

                        function toggleTooltipBind(event) {
                            if (!scope.popup_isOpen) {
                                showTooltipBind(event);
                            } else {
                                hideTooltipBind(event);
                            }
                        }

                        attrs.$observe(type, function (val) {
                            scope.popup_content = val;
                        });

                        // setup default popup placement
                        scope.popup_placement = options.placement;
                        attrs.$observe(prefix + 'Placement', function (val) {
                            scope.popup_placement = val ? val.trim() : options.placement;
                        });

                        // setup default popup style class
                        scope.popup_style_class = options.styleClass;
                        attrs.$observe(prefix + 'StyleClass', function (val) {
                            scope.popup_style_class = val ? val.trim() : options.styleClass;
                        });

                        // setup default popup auto close
                        scope.popup_autoClose = options.autoClose;
                        attrs.$observe(prefix + 'AutoClose', function (val) {
                            scope.popup_autoClose = val ? val.trim() : options.autoClose;
                        });

                        // setup default popup identifier
                        scope.popup_identifier = ('popup' + scope.$id);
                        attrs.$observe(prefix + 'Identifier', function (val) {
                            scope.popup_identifier = val ? val.trim() : ('popup' + scope.$id);
                        });

                        function default_animation() {
                            return options.animation;
                        }
                        // setup default popup animation
                        scope.popup_animation = default_animation;
                        attrs.$observe(prefix + 'Animation', function (val) {
                            scope.popup_animation = val ? $parse(val) : default_animation;
                        });

                        function default_arrow() {
                            return options.arrow;
                        }
                        // setup default popup Arrow
                        scope.popup_arrow = default_arrow;
                        attrs.$observe(prefix + 'Arrow', function (val) {
                            scope.popup_arrow = val ? $parse(val) : default_arrow;
                        });

                        function default_isText() {
                            return options.isText;
                        }
                        // setup default isText
                        scope.popup_isText = default_isText;
                        attrs.$observe(prefix + 'IsText', function (val) {
                            scope.popup_isText = val ? $parse(val) : default_isText;
                        });

                        // setup default popup delay
                        scope.popup_popupDelay = options.popupDelay;
                        attrs.$observe(prefix + 'PopupDelay', function (val) {
                            var delay = parseInt(val, 10);
                            scope.popup_popupDelay = !isNaN(delay) ? delay : options.popupDelay;
                        });

                        function update_triggers(val) {
                            triggers = setTriggers(val);

                            if (triggers.show === triggers.hide) {
                                element.bind(triggers.show, function (event) {
                                    toggleTooltipBind(event);
                                });
                            } else {
                                element.bind(triggers.show, function (event) {
                                    showTooltipBind(event);
                                });
                                element.bind(triggers.hide, function (event) {
                                    hideTooltipBind(event);
                                });
                            }
                        }
                        if (attrs.hasOwnProperty('wmPopupTrigger')) {
                            attrs.$observe(prefix + 'Trigger', function (val) {
                                /* This code is preventing custom click handlers to be attached with buttons */
                                /*element.unbind(triggers.show);
                                 element.unbind(triggers.hide);*/

                                update_triggers(val);
                            });
                        } else {
                            update_triggers();
                        }

                        attrs.$observe(prefix + 'AppendToBody', function (val) {
                            appendToBody = val ? $parse(val)(scope) : appendToBody;
                        });

                        /* if a tooltip is attached to <body> we need to remove it on
                         location change as its parent scope will probably not be destroyed
                         by the change.*/
                        if (appendToBody) {
                            scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess() {
                                if (scope.popup_isOpen) {
                                    hide();
                                }
                            });
                        }

                        /* Make sure tooltip is destroyed and removed.*/
                        scope.$on('$destroy', function onDestroyTooltip() {
                            if (scope.popup_isOpen) {
                                hide();
                            } else {
                                tooltip.remove();
                            }
                        });
                        /* Flushing popup registry to remove stale popups */
                        scope.$on('$routeChangeStart', function () {
                            popupRegistry.length = 0;
                        });

                        /* Pushing popovers into registry */
                        popupRegistry.push(tooltip);
                    }
                };
            };
        }];
    })

    /**
     * @ngdoc directive
     * @name wm.widgets.directive:wmPopupWindow
     * @restrict E
     * @description
     * The `wmPopupWindow` directive creates a popup window. Used internally by $wmPopupProvider.
     * @param {url} content Sets the content to be displayed inside the popup
     * @param {string} placement Position of popup, possible values: 'top', 'bottom', 'left', 'right', 'mouse'; default 'bottom'
     * @param {boolean} arrow Tells whether arrow should be displayed over the popup or not, default 'false'
     * @param {boolean} auto-close Tells whether popup should get closed when other popups are opened or clicked outside, default 'true'
     * @param {string} identifier Assigns an identifier to popup otherwise default value is assigned
     * @example
     <doc:example>
     <doc:source>
        <wm-popup-window content="URL"
            placement="top" arrow="true"
            animation="true" identifier="my_popup">
     </wm-popup-window>
     </doc:source>
     <doc:scenario>
     it('should check wm-popup-window', function() {
     });
     </doc:scenario>
     </doc:example>
     */
    .directive('wmPopupWindow', function () {
        'use strict';

        var getPopupTemplate = function () {
            return '<div class="popover {{placement}} {{styleClass}}" data-ng-class="{ in: isOpen, fade: animation() }">' +
                '<div data-ng-class="{ arrow: arrow() }"></div>' +
                '<div class="alert {{alertClass}}" data-ng-show="showAlert">{{statusMsg}}</div>' +
                '<div class="popover-inner">' +
                ' <div ng-switch on="isText()">' +
                '  <div ng-switch-when="true">' +
                '   <div class="popover-content" data-ng-bind="content"></div>' +
                '  </div>' +
                '  <div ng-switch-default>' +
                '   <div class="popover-content" data-ng-include="content"></div>' +
                '  </div>' +
                ' </div>' +
                '</div>' +
                '</div>' +
                '</div>';
        };

        return {
            restrict: 'E',
            replace: true,
            controller: 'PopupController',
            scope: { content: '@', styleClass: '@', placement: '@', animation: '&', isOpen: '=', arrow: '&', autoClose: '=', identifier: '@', isText: '&' },
            template: getPopupTemplate(),
            link: function (scope, element) {
                element.bind('click', function (event) {
                    event.stopPropagation();
                });
            }
        };
    })

    /**
     * @ngdoc directive
     * @name wm.widgets.directive:wmPopup
     * @restrict EA
     * @description
     * The `wm-popup` attribute directive creates a popup window for that particular element on click.
     * @param {url} value Sets the content to be displayed inside the popup
     * @param {string} popup-placement Position of popup, possible values: 'top', 'bottom', 'left', 'right', 'mouse'; default 'bottom'
     * @param {boolean} popup-arrow Tells whether arrow should be displayed over the popup or not, default 'false'
     * @param {boolean} popup-auto-close Tells whether popup should get closed when other popups are opened or clicked outside, default 'true'
     * @param {string} popup-identifier Assigns an identifier to popup otherwise default value is assigned
     * @example
     <doc:example>
     <doc:source>
     <div class="wm-studio-button"
         wm-popup="URL"
         popup-placement="bottom"
         popup-identifier="my_popover"
         popup-arrow="false"
         popup-auto-close="true">
     </div>
     </doc:source>
     <doc:scenario>
     it('should check wm-popup-window', function() {
         });
     </doc:scenario>
     </doc:example>
     */
    .directive('wmPopup', ['$wmPopup', function ($wmPopup) {
        'use strict';
        return $wmPopup('wmPopup', 'wmPopup', 'click');
    }]);