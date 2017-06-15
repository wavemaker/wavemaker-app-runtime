/*global wm, WM, wmDevice, Hammer*/
/**
 * @ngdoc service
 * @name wm.device.$DeviceViewService
 * @description
 * The `DeviceViewService` service is responsible for updating the layout for mobile devices.
 */
WM.module("wm.layouts.device")
    .service("DeviceViewService", ['Utils', '$rootScope', function (Utils, $rootScope) {

        "use strict";

        var LEFT_PANEL_CLASS_NAME = "page-left-panel",
            RIGHT_PANEL_CLASS_NAME = "page-right-panel",
            SWIPE_ELEM_CLASS_NAME = "page-left-panel-icon",
            SEARCH_CONTAINER_CLASS_NAME = "app-search",
            CONTENT_CLASS_NAME = "app-content-column",
            HEADER_CLASS_NAME = "page-header";

        /**
         * method returns jquery class selector for given roleName
         * @param roleName
         * @returns {string}
         */
        function roleSelector(roleName) {
            return "[data-role='" + roleName + "']";
        }
        /**
         * method returns jquery class selector for given className
         * @param className
         * @returns {string}
         */
        function classSelector(className) {
            return "." + className;
        }

        function getLeftPanelScope() {
            return WM.element(roleSelector(LEFT_PANEL_CLASS_NAME)).isolateScope();
        }

        /**
         * hide the mobile toolbar actions
         */
        function hidePageContainers() {
            var leftPanelScope = getLeftPanelScope();
            if (Utils.isMobile()) {
                leftPanelScope && leftPanelScope.collapse();
                WM.element(roleSelector(HEADER_CLASS_NAME) + " " + classSelector(SEARCH_CONTAINER_CLASS_NAME)).hide();
                $rootScope.sidebarCollapsed = true;
            }
        }

        /*setup touch event handler*/
        function bindTapEvtHandler(selector, handler) {
            /*
             * In Iphone safari browser, tap event of HammerJs is breaking
             * functionalities of other controls like input[type="range"].
             * So, replaced the hammer Js handler with click event handler.
             */
            WM.element(selector).off('click.deviewview').on('click.deviewview', handler);
        }

        /**
         * toggles the search container
         */
        function toggleSearchContainer(ele) {
            var searchEle = WM.element(ele);
            if (searchEle.css('display') === 'none') {
                hidePageContainers();
                searchEle.css('display', 'inline-table');
            } else {
                hidePageContainers();
            }
        }
        /**
         * binds swipe events to show/hide left panel
         */
        function bindLeftPanelEvents() {
            //tap left to show/hide left panel
            bindTapEvtHandler(roleSelector(SWIPE_ELEM_CLASS_NAME), function () {
                var leftPanel   = getLeftPanelScope(),
                    searchEl    = WM.element(roleSelector(HEADER_CLASS_NAME) + " " + classSelector(SEARCH_CONTAINER_CLASS_NAME)),
                    leftPanelEl;
                leftPanel && leftPanel.toggle();
                leftPanelEl = WM.element(roleSelector(LEFT_PANEL_CLASS_NAME));
                //Hide search container when left panel is open
                if (leftPanelEl.length && leftPanelEl.hasClass('visible')) {
                    if (searchEl.length) {
                        searchEl.hide();
                    }
                }
            });
        }

        /**
         * Bind event with Search icon in header
         */
        function bindSearchIconEvent(searchElements) {

            WM.forEach(searchElements, function (ele) {
                var searchEle = WM.element('<a class="app-header-action"><i class="wi wi-search"></i></a>');
                WM.element(ele).prev().remove();
                WM.element(ele).before(searchEle);
                //Tap icon to show/hide search box
                bindTapEvtHandler(searchEle, function () {
                    toggleSearchContainer(ele);
                });
            });

        }

        /**
         * binds the touch event for content
         */
        function bindContentEvents() {
            //touch content to hide nav pane and left panel
            bindTapEvtHandler(classSelector(CONTENT_CLASS_NAME), hidePageContainers);
        }

        /**
         * binds the touch event for content
         */
        function bindRightPanelEvents() {
            bindTapEvtHandler(roleSelector(RIGHT_PANEL_CLASS_NAME), hidePageContainers);
        }

        return {
            /**
             * updates view and binds with necessary events for mobile devices
             */
            update: function (element, hasLeftNav, hasRightNav, searchElements) {

                bindContentEvents();

                if (hasLeftNav) {
                    var leftPanel = getLeftPanelScope();
                    leftPanel && leftPanel.collapse();
                    bindLeftPanelEvents();
                }

                element.find(roleSelector(SWIPE_ELEM_CLASS_NAME))[hasLeftNav ? 'removeClass' : 'addClass']('ng-hide');

                if (hasRightNav) {
                    bindRightPanelEvents();
                }

                if (searchElements) {
                    bindSearchIconEvent(searchElements);
                }
            }
        };
    }]);
