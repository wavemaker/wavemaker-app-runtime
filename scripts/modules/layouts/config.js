/*global WM, */
WM.module('wm.widgets')
    .config(function (WidgetPropertiesProvider) {
        "use strict";

        WidgetPropertiesProvider.addGroup({"name": "layouts", "namekey": "LABEL_LAYOUTS", "iconclass": "layouts", "open": true, "isLayout": true});

        /* register the wm-column widget with its properties */
        WidgetPropertiesProvider.register("wm-column", {
            "widgetType": "wm-column",
            "template": "<wm-column></wm-column>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false
        });


        /* register the wm-page-content widget with its properties */
        WidgetPropertiesProvider.register("wm-page-content", {
            "widgetType": "wm-page-content",
            "template": "<wm-page-content></wm-page-content>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false
        });

        /* register the wm-content widget with its properties */
        WidgetPropertiesProvider.register("wm-content", {
            "widgetType": "wm-content",
            "template": "<wm-content></wm-content>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false
        });

        /* register the wm-footer widget with its properties */
        WidgetPropertiesProvider.register("wm-footer", {
            "widgetType": "wm-footer",
            "template": "<wm-footer></wm-footer>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false,
            "isPageContainer": true
        });

        /* register the wm-header widget with its properties */
        WidgetPropertiesProvider.register("wm-header", {
            "widgetType": "wm-header",
            "template": "<wm-header></wm-header>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false,
            "isPageContainer": true
        });

        /* register the wm-left-panel widget with its properties */
        WidgetPropertiesProvider.register("wm-left-panel", {
            "widgetType": "wm-left-panel",
            "template": "<wm-left-panel></wm-left-panel>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false,
            "isPageContainer": true
        });

        /* register the wm-page widget with its properties */
        WidgetPropertiesProvider.register("wm-page", {
            "widgetType": "wm-page",
            "template": "<wm-page></wm-page>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": false,
            "canBeCopied": false
        });

        /* register the wm-page widget with its properties */
        WidgetPropertiesProvider.register("wm-partial", {
            "widgetType": "wm-partial",
            "template": "<wm-partial></wm-partial>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false
        });

        /* register the wm-right-panel widget with its properties */
        WidgetPropertiesProvider.register("wm-right-panel", {
            "widgetType": "wm-right-panel",
            "template": "<wm-right-panel></wm-right-panel>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false,
            "isPageContainer": true
        });

        /* register the wm-row widget with its properties */
        WidgetPropertiesProvider.register("wm-row", {
            "widgetType": "wm-row",
            "template": "<wm-row></wm-row>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": false,
            "canBeCopied": false
        });

        /* register the wm-top-nav widget with its properties */
        WidgetPropertiesProvider.register("wm-top-nav", {
            "widgetType": "wm-top-nav",
            "template": "<wm-top-nav></wm-top-nav>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": false,
            "canBeCopied": false,
            "isPageContainer": true
        });

        /* register the wm-view widget with its properties */
        WidgetPropertiesProvider.register("wm-view", {
            "widgetType": "wm-view",
            "template": "<wm-view></wm-view>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": false
        });

        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "pagelayouts",
                "namekey": "LABEL_LAYOUTS_PAGELAYOUTS",
                "parent": "layouts",
                "widgets": [
                    {
                        "widgetType": "wm-page",
                        "layoutType": "one-column",
                        "name": "1 Column",
                        "namekey": "LABEL_LAYOUTS_1_COLUMN",
                        "iconclass": "one-col-layout",
                        "isDraggable": false
                    },
                    {
                        "widgetType": "wm-page",
                        "layoutType": "two-column",
                        "name": "2 Column",
                        "namekey": "LABEL_LAYOUTS_2_COLUMN",
                        "iconclass": "two-col-layout",
                        "isDraggable": false
                    },
                    {
                        "widgetType": "wm-page",
                        "layoutType": "three-column",
                        "name": "3 Column",
                        "namekey": "LABEL_LAYOUTS_3_COLUMN",
                        "iconclass": "three-col-layout",
                        "isDraggable": false
                    },
                    {
                        "widgetType": "wm-page",
                        "layoutType": "blank",
                        "name": "blankLayout",
                        "namekey": "LABEL_LAYOUTS_BLANK",
                        "iconclass": "blank",
                        "isDraggable": false
                    }
                ]
            }
        );

    });
