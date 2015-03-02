/*global WM, */
WM.module('wm.widgets')
    .config(function (WidgetPropertiesProvider) {
        "use strict";

        /* register the wm-accordion widget with its properties */
        WidgetPropertiesProvider.register("wm-accordion", {
            "widgetType": "wm-accordion",
            "template":
                "<wm-accordion>" +
                    "<wm-accordionpane>" +
                        "<wm-accordionheader></wm-accordionheader>" +
                        "<wm-accordioncontent></wm-accordioncontent>" +
                    "</wm-accordionpane>" +
                "</wm-accordion>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-accordionpane widget with its properties */
        WidgetPropertiesProvider.register("wm-accordionpane", {
            "widgetType": "wm-accordionpane",
            "template":
                "<wm-accordionpane>" +
                    "<wm-accordionheader></wm-accordionheader>" +
                    "<wm-accordioncontent></wm-accordioncontent>" +
                "</wm-accordionpane>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false
        });

        /* register the wm-accordionheader widget with its properties */
        WidgetPropertiesProvider.register("wm-accordionheader", {
            "widgetType": "wm-accordionheader",
            "template": "<wm-accordionheader></wm-accordionheader>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false,
            "parent": "wm-accordionpane"
        });

        /* register the wm-accordioncontent widget with its properties */
        WidgetPropertiesProvider.register("wm-accordioncontent", {
            "widgetType": "wm-accordioncontent",
            "template": "<wm-accordioncontent></wm-accordioncontent>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": false,
            "parent": "wm-accordionpane",
            "isPageContainer": true
        });

        /* register the wm-container widget with its properties */
        WidgetPropertiesProvider.register("wm-container", {
            "widgetType": "wm-container",
            "template": "<wm-container ></wm-container>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isPageContainer": true
        });

        /* register the wm-tile widget with its properties */
        WidgetPropertiesProvider.register("wm-tile", {
            "widgetType": "wm-tile",
            "template": "<wm-tile></wm-tile>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isPageContainer": false
        });


        /* register the wm-form widget with its properties */
        WidgetPropertiesProvider.register("wm-form", {
            "widgetType": "wm-form",
            "template":
                '<wm-form title="Form" class="panel-default">' +
                    '<wm-layoutgrid>' +
                        '<wm-gridrow>' +
                            '<wm-gridcolumn>' +
                                '<wm-composite>' +
                                    '<wm-label class="col-md-3" caption="Name"></wm-label>' +
                                    '<wm-container class="col-md-9">' +
                                        '<wm-text tabindex="1" placeholder="Enter Name"></wm-text>' +
                                    '</wm-container>' +
                                '</wm-composite>' +
                            '</wm-gridcolumn>' +
                        '</wm-gridrow>' +
                        '<wm-gridrow>' +
                            '<wm-gridcolumn>' +
                                '<wm-composite>' +
                                    '<wm-label class="col-md-3" caption="Type"></wm-label>' +
                                    '<wm-container class="col-md-9">' +
                                        '<wm-select tabindex="3" dataset="Option 1, Option 2, Option 3" datavalue="Option 3"></wm-select>' +
                                    '</wm-container>' +
                                '</wm-composite>' +
                            '</wm-gridcolumn>' +
                        '</wm-gridrow>' +
                        '<wm-gridrow>' +
                            '<wm-gridcolumn>' +
                                '<wm-composite horizontalalign="left">' +
                                    '<wm-label class="col-md-3" caption="Description"></wm-label>' +
                                    '<wm-container class="col-md-9">' +
                                        '<wm-textarea tabindex="4" placeholder="Enter Description"></wm-textarea>' +
                                    '</wm-container>' +
                                '</wm-composite>' +
                            '</wm-gridcolumn>' +
                        '</wm-gridrow>' +
                    '</wm-layoutgrid>' +
                    '<wm-buttongroup horizontalalign="right" class="form-action col-md-12">' +
                        '<wm-button caption="Reset" type="reset" class="btn-secondary"></wm-button>' +
                        '<wm-button caption="Cancel" type="button" class="btn-warning"></wm-button>' +
                        '<wm-button caption="Save" type="submit" class="btn-primary"></wm-button>' +
                    '</wm-buttongroup>' +
                '</wm-form>',
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-layoutgrid widget with its properties */
        WidgetPropertiesProvider.register("wm-layoutgrid", {
            "widgetType": "wm-layoutgrid",
            "template":
                "<wm-layoutgrid>" +
                    "<wm-gridrow>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                    "</wm-gridrow>" +
                    "<wm-gridrow>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                    "</wm-gridrow>" +
                    "<wm-gridrow>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                        "<wm-gridcolumn columnwidth='4'></wm-gridcolumn>" +
                    "</wm-gridrow>" +
                "</wm-layoutgrid>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-gridrow widget with its properties */
        WidgetPropertiesProvider.register("wm-gridrow", {
            "widgetType": "wm-gridrow",
            "template": "<wm-gridrow></wm-gridrow>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-gridcolumn widget with its properties */
        WidgetPropertiesProvider.register("wm-gridcolumn", {
            "widgetType": "wm-gridcolumn",
            "template": "<wm-gridcolumn></wm-gridcolumn>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-list widget with its properties */
        WidgetPropertiesProvider.register("wm-list", {
            "widgetType": "wm-list",
            "template": "<wm-list></wm-list>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-list-item widget with its properties */
        WidgetPropertiesProvider.register("wm-list-item", {
            "widgetType": "wm-list-item",
            "template": "<wm-list-item></wm-list-item>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-nav widget with its properties */
        WidgetPropertiesProvider.register("wm-nav", {
            "widgetType": "wm-nav",
            "template":
                "<wm-nav type='pills'>" +
                    "<wm-nav-item>" +
                        "<wm-anchor caption='Link 1'></wm-anchor>" +
                    "</wm-nav-item>" +
                    "<wm-nav-item>" +
                        "<wm-anchor caption='Link 2'></wm-anchor>" +
                    "</wm-nav-item>" +
                    "<wm-nav-item>" +
                        "<wm-anchor caption='Link 3'></wm-anchor>" +
                    "</wm-nav-item>" +
                "</wm-nav>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-nav-item widget with its properties */
        WidgetPropertiesProvider.register("wm-nav-item", {
            "widgetType": "wm-nav-item",
            "template": "<wm-nav-item></wm-nav-item>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-navbar widget with its properties */
        WidgetPropertiesProvider.register("wm-navbar", {
            "widgetType": "wm-navbar",
            "template": "<wm-navbar title='Brand'><wm-nav type='navbar' class='navbar-left'></wm-nav><wm-nav type='navbar' class='navbar-right'></wm-nav></wm-navbar>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-panel widget with its properties */
        WidgetPropertiesProvider.register("wm-panel", {
            "widgetType": "wm-panel",
            "template": "<wm-panel class='panel-default' collapsible='true' showheader='true'></wm-panel>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": true,
            "isPageContainer": true
        });

        /* register the wm-tabs widget with its properties */
        WidgetPropertiesProvider.register("wm-tabs", {
            "widgetType": "wm-tabs",
            "template":
                "<wm-tabs>" +
                    "<wm-tabpane>" +
                        "<wm-tabheader></wm-tabheader>" +
                        "<wm-tabcontent></wm-tabcontent>" +
                    "</wm-tabpane>" +
                "</wm-tabs>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": true,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": true
        });

        /* register the wm-tabpane widget with its properties */
        WidgetPropertiesProvider.register("wm-tabpane", {
            "widgetType": "wm-tabpane",
            "template":
                "<wm-tabpane>" +
                    "<wm-tabheader></wm-tabheader>" +
                    "<wm-tabcontent></wm-tabcontent>" +
                "</wm-tabpane>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false
        });

        /* register the wm-tabheader widget with its properties */
        WidgetPropertiesProvider.register("wm-tabheader", {
            "widgetType": "wm-tabheader",
            "template": "<wm-tabheader></wm-tabheader>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": false,
            "isDeletable": true,
            "canBeCopied": false,
            "parent": "wm-tabpane"
        });

        /* register the wm-tabcontent widget with its properties */
        WidgetPropertiesProvider.register("wm-tabcontent", {
            "widgetType": "wm-tabcontent",
            "template": "<wm-tabcontent></wm-tabcontent>",
            "isContainer": true,
            "isResizable": false,
            "isMovableInsideCanvas": false,
            "isDroppable": true,
            "isDeletable": true,
            "canBeCopied": false,
            "parent": "wm-tabpane",
            "isPageContainer": true
        });

        /* Add wm-layoutgrid, wm-form, wm-liveform widgets to the layoutwidgets subGroup. */
        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "contentlayouts",
                "namekey": "LABEL_WIDGETS_CONTENTLAYOUTS",
                "parent": "layouts",
                "widgets": [
                    {
                        "widgetType": "wm-accordion",
                        "name": "accordion",
                        "namekey": "LABEL_WIDGET_ACCORDION",
                        "iconclass": "accordion",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-tabs",
                        "name": "tabs",
                        "namekey": "LABEL_WIDGET_TABS",
                        "iconclass": "tabs",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-form",
                        "name": "Form Layout",
                        "namekey": "LABEL_WIDGET_FORM",
                        "iconclass": "form",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-layoutgrid",
                        "name": "Grid Layout",
                        "namekey": "LABEL_WIDGET_LAYOUTGRID",
                        "iconclass": "layoutgrid",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-list",
                        "name": "List",
                        "namekey": "LABEL_WIDGET_LIST",
                        "iconclass": "list",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-nav",
                        "name": "Nav",
                        "namekey": "LABEL_WIDGET_NAV",
                        "iconclass": "nav",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-navbar",
                        "name": "Navbar",
                        "namekey": "LABEL_WIDGET_NAVBAR",
                        "iconclass": "navbar",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-panel",
                        "name": "Panel",
                        "namekey": "LABEL_WIDGET_PANEL",
                        "iconclass": "panel",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-container",
                        "name": "Container",
                        "namekey": "LABEL_WIDGET_CONTAINER",
                        "iconclass": "container",
                        "isDraggable": true
                    },
                    {
                        "widgetType": "wm-tile",
                        "name": "Tile",
                        "namekey": "LABEL_WIDGET_TILE",
                        "iconclass": "tile",
                        "isDraggable": true
                    }
                ]
            }
        );

    });
