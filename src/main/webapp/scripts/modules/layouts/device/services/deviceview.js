/*global wm, WM, wmDevice*/
/**
 * @ngdoc service
 * @name wm.device.$DeviceViewService
 * @description
 * The `DeviceViewService` service is responsible for updating the layout for mobile devices.
 */
WM.module("wm.layouts.device")
    .service("DeviceViewService", ['MobileEventService', 'Utils', '$rootScope', function (MobileEventService, Utils, $rootScope) {

        "use strict";

        var LEFT_PANEL_CLASS_NAME = "page-left-panel",
            RIGHT_PANEL_CLASS_NAME = "page-right-panel",
            SWIPE_ELEM_CLASS_NAME = "page-left-panel-icon",
            SEARCH_ELEM_CLASS_NAME = "page-search-icon",
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

        /**
         * hide the mobile toolbar actions
         */
        function hidePageContainers() {
            if (Utils.isMobile()) {
                WM.element(roleSelector(LEFT_PANEL_CLASS_NAME) + ", " + roleSelector(HEADER_CLASS_NAME) + " " + classSelector(SEARCH_CONTAINER_CLASS_NAME)).hide();
                $rootScope.sidebarCollapsed = true;

            } else {
                WM.element(roleSelector(LEFT_PANEL_CLASS_NAME)).show();
                WM.element(classSelector(SEARCH_CONTAINER_CLASS_NAME)).show().css('display', 'inline-table');
            }
        }

        /**
         * toggles the container
         */
        function toggleContainer(container) {
            /*added condition to check if the current element is not visible, then hide containers*/
            if (!WM.element(container).is(":visible")) {
                hidePageContainers();
            }
            if (Utils.isMobile()) {
                WM.element(container).toggle();
            }
        }
        /**
         * toggles the search container
         */
        function toggleSearchContainer() {
            var searchEle = WM.element(roleSelector(HEADER_CLASS_NAME) + " " + classSelector(SEARCH_CONTAINER_CLASS_NAME));
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
            MobileEventService.touch(roleSelector(SWIPE_ELEM_CLASS_NAME), function () {
                toggleContainer(roleSelector(LEFT_PANEL_CLASS_NAME));
            });
        }

        /**
         * Bind event with Search icon in header
         */
        function bindSearchIconEvent() {
            //Tap icon to show/hide search box
            MobileEventService.touch(roleSelector(SEARCH_ELEM_CLASS_NAME), toggleSearchContainer);
        }

        /**
         * binds the touch event for content
         */
        function bindContentEvents() {
            //touch content to hide nav pane and left panel
            MobileEventService.touch(classSelector(CONTENT_CLASS_NAME), hidePageContainers);
        }

        /**
         * binds the touch event for content
         */
        function bindRightPanelEvents() {
            MobileEventService.touch(roleSelector(RIGHT_PANEL_CLASS_NAME), hidePageContainers);
        }

        return {
            /**
             * updates view and binds with necessary events for mobile devices
             */
            update: function (element, hasLeftNav, hasRightNav, hasHeaderSearch) {

                bindContentEvents();

                if (hasLeftNav) {
                    bindLeftPanelEvents();
                } else {
                    //hide the icon
                    element.find(roleSelector(SWIPE_ELEM_CLASS_NAME)).hide();
                }

                if (hasRightNav) {
                    bindRightPanelEvents();
                }

                if (hasHeaderSearch) {
                    bindSearchIconEvent();
                    //show the search icon
                    element.find(roleSelector(SEARCH_ELEM_CLASS_NAME)).show();
                }
            }
        };
    }]);