/*global WM, document, window, _ */
/*jslint todo: true */

/* adding events and event options as constants*/
WM.module('wm.widgets.base', [])
    .constant('WIDGET_CONSTANTS', {
        EVENTS_OPTIONS: ["No Event", "Javascript", "New ServiceVariable", "New LiveVariable", "New NavigationCall", "New NotificationCall"]
    })
    .run(["$rootScope", function ($rootScope) {
        /*
         *  Util method to get ng styles for widgets
         */
        "use strict";
        $rootScope.getWidgetStyles = function (type) {
            return ' data-ng-style="{' +
                'backgroundColor: backgroundcolor,' +
                'backgroundGradient: backgroundgradient,' +
                'backgroundImage :picturesource,' +
                'backgroundRepeat: backgroundrepeat,' +
                'backgroundSize: backgroundsize,' +
                'backgroundPosition: backgroundposition,' +
                'backgroundAttachment: backgroundattachment,' +
                'borderBottomWidth: borderbottom + borderunit,' +
                'borderColor: bordercolor,' +
                'borderLeftWidth: borderleft + borderunit,' +
                'borderRadius: borderradius,' +
                'borderRightWidth: borderright + borderunit,' +
                'borderStyle: borderstyle,' +
                'borderTopWidth: bordertop + borderunit,' +
                'color: color,' +
                'cursor: cursor,' +
                'fontFamily: fontfamily,' +
                'fontSize: fontsize + fontunit,' +
                'fontStyle: fontstyle,' +
                'fontVariant: fontvariant,' +
                'fontWeight: fontweight,' +
                'lineHeight: lineheight,' +
                'marginBottom:  marginbottom + marginunit,' +
                'marginLeft: marginleft + marginunit,' +
                'marginRight: marginright + marginunit,' +
                'marginTop: margintop + marginunit,' +
                'maxWidth: maxwidth,' +
                'minWidth: minwidth,' +
                'opacity: opacity,' +
                ((type === "shell") ? '' : 'height: height, maxHeight: maxheight, minHeight: minheight, overflow: overflow, paddingBottom: paddingbottom + paddingunit, paddingLeft: paddingleft + paddingunit, paddingRight: paddingright + paddingunit, paddingTop: paddingtop + paddingunit,') +
                ((type === "container") ? 'textAlign: horizontalalign,' : 'textAlign: textalign,') +
                'textDecoration: textdecoration,' +
                'verticalAlign: verticalalign,' +
                'whiteSpace: whitespace,' +
                'width: width,' +
                'wordBreak: wordbreak,' +
                'zIndex: zindex,' +
                'visibility: visibility,' +
                'display: display' +
                '}" ';
        };
    }])

    /**
     * @ngdoc service
     * @name wm.widgets.$PropertiesFactory
     * @description
     * The `PropertiesFactory` contains properties of all the widgets in the studio and
     * provides utility methods for getting a specific widget's property
     */
    .factory('PropertiesFactory', ['WIDGET_CONSTANTS', function (WIDGET_CONSTANTS) {
        "use strict";
        /**
         * TODO: fetch the properties from the config-properties.json
         */

        var widgetEventOptions = WM.copy(WIDGET_CONSTANTS.EVENTS_OPTIONS), /*A copy of the variable to preserve the actual value.*/
            showInDeviceOptions = [{
                'name': 'All',
                'value': 'all'
            }, {
                'name': 'Extra Small',
                'value': 'xs'
            }, {
                'name': 'Small',
                'value': 'sm'
            }, {
                'name': 'Medium',
                'value': 'md'
            }, {
                'name': 'Large',
                'value': 'lg'
            }],
            nameRegex = '^[a-zA-Z_][A-Za-z0-9_]+$',
            numberRegex = '(^$|[0-9]+$)',
            classRegex = '(^$|^-?[_a-zA-Z ]+[_a-zA-Z0-9- ]*)$',
            dimensionRegex = '(^$|^(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(em|ex|%|px|cm|mm|in|pt|pc|ch|rem|vh|vw|vmin|vmax)?$)',
            zindexRegex = '(^$|auto|initial|inherit|^[0-9]+$)',
            roles = ["Everyone"],
            dateOptions = [
                {
                    "name" : "Date",
                    "groupOptions" : {
                        "%x" : "Date(%m/%d/%Y)",
                        "%c" : "Date and Time"
                    }
                },
                {
                    "name" : "Time",
                    "groupOptions" : {
                        "%X" : "Time(%H:%M:%S)",
                        "%H" : "In 24 hours",
                        "%I" : "In 12 hours",
                        "%M" : "Mintues",
                        "%S" : "Seconds",
                        "%L" : "MilliSeconds",
                        "%p" : "AM or PM",
                        "%Z" : "Time zone offset"
                    }
                },
                {
                    "name" : "Day",
                    "groupOptions" : {
                        "%d" : "Zero padded day of month",
                        "%e" : "Space padded day of month",
                        "%j" : "Day of the year"
                    }
                },
                {
                    "name" : "Week",
                    "groupOptions" : {
                        "%a" : "Abbreviated weekday name",
                        "%A" : "Full weekday name",
                        "%U" : "Week number of the year(Sunday first day)",
                        "%W" : "Week number of the year(Monday first day)",
                        "%w" : "Week day[0(Sunday),6]"
                    }
                },
                {
                    "name" : "Month",
                    "groupOptions" : {
                        "%b" : "Abbreviated month name",
                        "%B" : "Full month name",
                        "%m" : "Month number"
                    }
                },
                {
                    "name" : "Year",
                    "groupOptions" : {
                        "%y" : "without century",
                        "%Y" : "with century"
                    }
                }
            ],
            animationOptions = [" ", "bounce", "flash", "pulse", "rubberBand", "shake", "swing", "tada", "wobble", "bounceIn", "bounceInDown", "bounceInLeft", "bounceInRight", "bounceInUp", "bounceOut", "bounceOutDown", "bounceOutLeft", "bounceOutRight", "bounceOutUp", "fadeIn", "fadeInDown", "fadeInDownBig", "fadeInLeft", "fadeInLeftBig", "fadeInRight", "fadeInRightBig", "fadeInUp", "fadeInUpBig", "fadeOut", "fadeOutDown", "fadeOutDownBig", "fadeOutLeft", "fadeOutLeftBig", "fadeOutRight", "fadeOutRightBig", "fadeOutUp", "fadeOutUpBig", "flipInX", "flipInY", "flipOutX", "flipOutY", "lightSpeedIn", "lightSpeedOut", "rotateIn", "rotateInDownLeft", "rotateInDownRight", "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight", "hinge", "rollIn", "rollOut", "zoomIn", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp", "zoomOut", "zoomOutDown", "zoomOutLeft", "zoomOutRight", "zoomOutUp", "slideInDown", "slideInLeft", "slideInRight", "slideInUp", "slideOutDown", "slideOutLeft", "slideOutRight", "slideOutUp"],
            visibilityOptions = ["visible", "hidden", "collapse", "initial", "inherit"],
            displayOptions = ["inline", "block", "flex", "inline-block", "inline-flex", "inline-table", "list-item", "run-in", "table", "table-caption", "table-column-group", "table-header-group", "table-footer-group", "table-row-group", "table-cell", "table-column", "table-row", "none", "initial", "inherit"],
            result = {
                "properties": {
                    "wm.base": {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "class": {"type": "string", "pattern": classRegex},
                        "accessroles": {"type": "accessrolesselect", "options": roles, "value": "Everyone"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'}
                    },

                    "wm.base.editors": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "minwidth": {"type": "string", "pattern": dimensionRegex},
                        "maxwidth": {"type": "string", "pattern": dimensionRegex},
                        "minheight": {"type": "string", "pattern": dimensionRegex},
                        "maxheight": {"type": "string", "pattern": dimensionRegex},

                        /* ---- styles ----*/
                        "border": {"type": "string", "widget": "box"},
                        "borderunit": {"type": "string", "options": ["em", "px"], "value": "px", "widget": "icons_radio"},
                        "bordertop": {"type": "string", "pattern": numberRegex},
                        "borderright": {"type": "string", "pattern": numberRegex},
                        "borderbottom": {"type": "string", "pattern": numberRegex},
                        "borderleft": {"type": "string", "pattern": numberRegex},
                        "borderwidth": {"type": "string"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "borderstyle"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box"},
                        "paddingunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "paddingtop": {"type": "string", "pattern": numberRegex},
                        "paddingright": {"type": "string", "pattern": numberRegex},
                        "paddingbottom": {"type": "string", "pattern": numberRegex},
                        "paddingleft": {"type": "string", "pattern": numberRegex},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "left, top"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "hidelabel": true, "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontsize": {"type": "number", "hidelabel": true, "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px"], "value": "px", "hidelabel": true, "widget": "icons_radio"},
                        "textalign": {"type": "string", "options": ["left", "center", "right"], "hidelabel": true, "widget": "icons_radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontVariant": {"type": "list", "options": ["normal", "small-caps"]},
                        "fontfamily": {"type": "string", "hidelabel": true, "hint": "Arial, Geneva"},
                        "misc": {"type": "string"},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex},
                        "visibility": {"type": "list", "options": visibilityOptions},
                        "display": {"type": "list", "options": displayOptions}
                    },
                    "wm.base.editors.abstracteditors": {
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "required": {"type": "boolean"},
                        "tabindex": {"type": "string"},
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.base.editors.captionproperties": {
                        "caption": {"type": "string", "value": "_unset_", "bindable": "in-bound", "maxlength": 256 },
                        "captionsize": {"type": "string"},
                        "paddingtop": {"value": "0"},
                        "paddingright": {"value": "0"},
                        "paddingbottom": {"value": "0"},
                        "paddingleft": {"value": "0"},
                        "bordertop": {"value": "0"},
                        "borderright": {"value": "0"},
                        "borderbottom": {"value": "0"},
                        "borderleft": {"value": "0"}
                    },

                    "wm.base.editors.dataseteditors": {
                        "startupdate": {"type": "boolean"},
                        "scopedataset": {"type": "list", "options": []},
                        "datafield": {"type": "list", "options": ["All Fields"]},
                        "displayfield": {"type": "list", "options": [""]},
                        "displayexpression": {"type": "string", "bindable": "in-bound", "bindonly": "expression"},
                        "displaytype": {"type": "list", "options": ["Currency", "Date", "Number", "Text", "Time"]}
                    },

                    "wm.base.events": {
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDblclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.base.events.touch": {
                        "onSwipeup": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSwipedown": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSwipeleft": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSwiperight": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onPinchin": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onPinchout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.base.events.focus": {
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.base.events.change": {
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.base.events.successerror": {
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onError": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.abstractinput": {
                        "type": {"type": "string", "value": "text"}
                    },

                    "wm.html": {
                        "content": {"type": "string", "bindable": "in-out-bound", "widget": "textarea"},
                        "hint": {"type": "string", "bindable": "in-out-bound"},
                        "autoscroll": {"type": "boolean"},
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    "wm.icon": {
                        "title": {"type": "string", "bindable": "in-out-bound"},
                        "iconclass": {"type": "string", "value": "glyphicon glyphicon-star-empty", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconsize": {"type": "string", "pattern": dimensionRegex},
                        "animation": {"type": "list", "options": animationOptions},
                        "color": {"type": "string", "widget": "color"},
                        "opacity": {"type": "string", "widget": "slider"}
                    },
                    "wm.iframe": {
                        "iframesrc": {"type": "string", "bindable": "in-bound", "widget": "string"},
                        "hint": {"type": "string", "bindable": "in-out-bound"},
                        "width": {"type": "string", "value": '300px', "pattern": dimensionRegex},
                        "height": {"type": "string", "value": '150px', "pattern": dimensionRegex},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline'}
                    },

                    "wm.button": {
                        "hint": {"type": "string", "bindable": "in-out-bound"},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256},
                        "iconurl": {"type": "string", "bindable": "in-bound"},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "type": {"type": "list", "options": ["button", "reset", "submit"], "value" : "button"},
                        "tabindex": {"type": "string"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "animation": {"type": "list", "options": animationOptions}
                    },

                    "wm.buttongroup": {
                        "hint": {"type": "string", "bindable": "in-out-bound"},
                        "vertical": {"type": "boolean"}
                    },
                    "wm.switch": {
                        "hint": {"type": "string", "bindable": "in-out-bound"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "datavalue": {"type": "string, object", "bindable": "in-out-bound", "widget": "string"},
                        "scopedatavalue": {"type": "string"},
                        "dataset": {"type": "array, string", "bindable": "in-bound", "widget": "string", "value": "on, off"},
                        "scopedataset": {"type": "string"},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields"},
                        "displayfield": {"type": "list", "options": [""], "value": ""}
                    },
                    "wm.menu": {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "accessroles": {"type": "accessrolesselect", "options": roles, "value": "Everyone"},
                        "scopedataset": {"type": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Menu Item 1, Menu Item 2, Menu Item 3"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256},
                        "menuclass": {"type": "string", "pattern": classRegex},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "dropposition": {"type": "list", "options": ["down", "up"], "value": "down"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.tree": {
                        "scopedataset": {"type": "string"},
                        "dataset": {"type": "object", "bindable": "in-bound", "widget": "string", "value": "node1, node2, node3"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string"},
                        "treeicons": {"type": "list", "options": ["folder", "plus-minus", "circle-plus-minus", "chevron", "menu", "triangle", "expand-collapse"], "value": "triangle"},
                        "nodelabel": {"type": "list", "widget": "list"},
                        "nodeicon": {"type": "list", "widget": "list"},
                        "nodechildren": {"type": "list", "widget": "list"}
                    },

                    "wm.text": {
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean"},
                        "updateon": {"type": "list", "value": "blur", "widget": "updateon"},
                        "updatedelay": {"type": "number", "value": 0},
                        "type": {"type": "list", "options": ["date", "email", "number", "password", "text", "url", "file"], "value": "text"},
                        "accept": {"type": "datalist", "options": ["image/*", "audio/*", "video/*"], "show": false},
                        "datavalue": {"type": "string", value: "", "bindable": "in-out-bound"},
                        "scopedatavalue": {"type": "string"},

                        /* Properties: Validation */
                        "regexp": {"type": "string", "value": ".*"},

                        /* Properties: help */
                        "placeholder": {"type": "string", "value": "Enter text"},

                        /* Properties: Behavior */
                        "maxchars": {"type": "number", "bindable": "in-bound"},

                        /*  ---Events---  */
                        "changeOnkey": {"type": "boolean"},

                        /* Number properties */
                        "minvalue": {"type": "number", "bindable": "in-bound"},
                        "maxvalue": {"type": "number", "bindable": "in-bound"},
                        "places": {"type": "number", "value": 0}
                    },

                    "wm.currency": {
                        "datavalue": {"type": "number", "bindable": "in-out-bound"},
                        "scopedatavalue": {"type": "string"},
                        "minvalue": {"type": "number"},
                        "maxvalue": {"type": "number"},
                        "readonly": {"type": "boolean"},
                        "currency": {"type": "list", "value": "USD", "options": ["AED", "AFN", "ALL", "AMD", "ARS", "AUD", "AZN", "BAM", "BDT", "BGN", "BHD", "BIF", "BND", "BOB", "BRL", "BWP", "BYR", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EEK", "EGP", "ERN", "ETB", "EUR", "GBP", "GEL", "GHS", "GNF", "GTQ", "HKD", "HNL", "HRK", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KHR", "KMF", "KRW", "KWD", "KZT", "LBP", "LKR", "LTL", "LVL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MOP", "MUR", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SDG", "SEK", "SGD", "SOS", "SYP", "THB", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VEF", "VND", "XAF", "XOF", "YER", "ZAR", "ZMK"]},
                        /* Properties: help */
                        "placeholder": {"type": "string", "value": "Enter value"},
                        /* Style: Basic */
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "minwidth": {"type": "string", "pattern": dimensionRegex},
                        "maxwidth": {"type": "string", "pattern": dimensionRegex},
                        "minheight": {"type": "string", "pattern": dimensionRegex},
                        "maxheight": {"type": "string", "pattern": dimensionRegex},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "hidelabel": true, "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontsize": {"type": "number", "hidelabel": true, "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px"], "value": "px", "hidelabel": true, "widget": "icons_radio"},
                        "textalign": {"type": "string", "options": ["left", "center", "right"], "hidelabel": true, "widget": "icons_radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontfamily": {"type": "string", "hidelabel": true, "hint": "Arial, Geneva"},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "misc": {"type": "string"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex}
                    },
                    "wm.base.datetime": {
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "scopedatavalue": {"type": "string"},
                        "tabindex": {"type": "string"},
                        /* ---- styles ----*/
                        "border": {"type": "string", "widget": "box"},
                        "borderunit": {"type": "string", "options": ["em", "px"], "value": "px", "widget": "icons_radio"},
                        "bordertop": {"type": "string", "pattern": numberRegex},
                        "borderright": {"type": "string", "pattern": numberRegex},
                        "borderbottom": {"type": "string", "pattern": numberRegex},
                        "borderleft": {"type": "string", "pattern": numberRegex},
                        "borderwidth": {"type": "string"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "borderstyle"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box"},
                        "paddingunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "paddingtop": {"type": "string", "pattern": numberRegex},
                        "paddingright": {"type": "string", "pattern": numberRegex},
                        "paddingbottom": {"type": "string", "pattern": numberRegex},
                        "paddingleft": {"type": "string", "pattern": numberRegex},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "color": {"type": "string", "hidelabel": true, "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontsize": {"type": "number", "hidelabel": true, "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px"], "value": "px", "hidelabel": true, "widget": "icons_radio"},
                        "textalign": {"type": "string", "options": ["left", "center", "right"], "hidelabel": true, "widget": "icons_radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontVariant": {"type": "list", "options": ["normal", "small-caps"]},
                        "fontfamily": {"type": "string", "hidelabel": true, "hint": "Arial, Geneva"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex}
                    },
                    "wm.date": {
                        "placeholder": {"type": "string", "value": "Select date"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean"},
                        "disabled": {"type": "boolean"},
                        "mindate": {"type": "string", "hint": "yyyy-MM-dd"},
                        "maxdate": {"type": "string", "hint": "yyyy-MM-dd"},
                        "datepattern": {"value": "yyyy-MM-dd", "type": "list", "options": [], "widget": "datetimepatterns"},
                        "outputformat": {"value": "yyyy-MM-dd", "type": "list", "options": [], "widget": "datetimepatterns"},
                        "datavalue": {"type": "date, string, number", "widget": "string", "bindable": "in-out-bound", "hint": "yyyy-MM-dd"}
                    },
                    "wm.calendar": {
                        "placeholder": {"type": "string", "value": "Select date"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "scopedataset": {"type": "string"},
                        "datavalue": {"type": "date, string, number", "widget": "string", "bindable": "in-out-bound"},
                        "calendartype": {"type": "list", "options": ["basic", "agenda"], "value": "basic"},
                        "view": {"type": "list", "options": ["month", "week", "day"], "value": "month"},
                        "controls": {"type": "list", "options": ["navigation", "today", "month", "week", "day"], "value": "navigation, today, month, week, day", "widget": "selectall"},
                        "onDayclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventdrop": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventresize": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventrender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.time": {
                        "placeholder": {"type": "string", "value": "Select time"},
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean"},
                        "disabled": {"type": "boolean"},
                        "hourstep": {"type": "number", "value": 1},
                        "minutestep": {"type": "number", "value": 15},
                        "outputformat": {"value": "HH:mm:ss", "type": "list", "options": [], "widget": "timepatterns"},
                        "ismeridian": {"type": "boolean", "value": true},
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "required": {"type": "boolean"},
                        "datavalue": {"type": "time, date, string, number", "widget": "string", "bindable": "in-out-bound", hint: "HH:mm"}
                    },
                    "wm.datetime": {
                        "placeholder": {"type": "string", "value": "Select date time"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean"},
                        "disabled": {"type": "boolean"},
                        "hourstep": {"type": "number", "value": 1},
                        "minutestep": {"type": "number", "value": 15},
                        "ismeridian": {"type": "boolean", "value": true},
                        "mindate": {"type": "string", "hint": "yyyy-MM-dd"},
                        "maxdate": {"type": "string", "hint": "yyyy-MM-dd"},
                        "datepattern": {"value": "yyyy-MM-dd HH:mm", "type": "list", "options": [], "widget": "datetimepatterns"},
                        "outputformat": {"value": "timestamp", "type": "list", "options": [], "widget": "datetimepatterns"},
                        "datavalue": {"type": "timestamp, date, time, datetime, string, number", "widget": "string", "bindable": "in-out-bound", "hint": "yyyy-MM-dd HH:mm"}
                    },
                    "wm.message": {
                        "type": {"type": "string", "options": ["error", "info", "loading", "success", "warning"], "value": "success", "bindable": "in-out-bound", "widget": "list"},
                        "caption": {"type": "string", "value": "Message", "bindable": "in-out-bound", "maxlength": 256},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions}
                    },

                    "wm.composite": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "captionposition": {"type": "list", "options": ["left", "right", "top"]},
                        "required": {"type": "boolean"},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex}
                    },

                    "wm.booleaneditors": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "minwidth": {"type": "string", "pattern": dimensionRegex},
                        "maxwidth": {"type": "string", "pattern": dimensionRegex},
                        "minheight": {"type": "string", "pattern": dimensionRegex},
                        "maxheight": {"type": "string", "pattern": dimensionRegex},
                        /* ---- styles ----*/
                        "padding": {"type": "string", "widget": "box"},
                        "paddingunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "paddingtop": {"type": "string", "pattern": numberRegex},
                        "paddingright": {"type": "string", "pattern": numberRegex},
                        "paddingbottom": {"type": "string", "pattern": numberRegex},
                        "paddingleft": {"type": "string", "pattern": numberRegex},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex}
                    },
                    "wm.radio": {
                        //"readonly": {"type": "boolean", "value": false}, //commenting this property temporarily as it is not working
                        "autofocus": {"type": "boolean"},
                        "disabled": {"value": false},
                        "scopedatavalue": {"type": "string"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "checkedvalue": {"type": "string"},
                        "radiogroup": {"type": "string"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256}
                    },
                    "wm.radioset": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "tabindex": {"type": "string"},
                        "disabled": {"type": "boolean", "value": false},
                        "readonly": {"type": "boolean", "value": false},
                        "layout":  {"type": "list", "options": ["", "inline", "stacked"]},
                        /* ---- events ---- */

                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},

                        "datavalue": {"type": "string", "bindable": "in-out-bound", "show": false},
                        "scopedatavalue": {"type": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Option 1, Option 2, Option 3"},
                        "scopedataset": {"type": "string"},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields"},
                        "displayfield": {"type": "list", "options": [""], "value": ""},
                        "displayexpression": {"type": "string"},
                        "usekeys": {"type": "boolean"},
                        "selectedvalue": {"type": "string, object", "widget": "string", "value": "", "bindable": "in-bound"}
                    },
                    "wm.colorpicker": {
                        "readonly": {"type": "boolean", "value": false},
                        "disabled": {"type": "boolean", "value": false},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "scopedatavalue": {"type": "string"},
                        "placeholder": {"type": "string", "value": "Select Color"},
                        "tabindex": {"type": "string"}
                    },

                    "wm.inputcolorpicker": {
                        "defaultcolor": {"value": "#fff"}
                    },

                    "wm.inputslider": {
                        "caption": {"value": "slider", "maxlength": 256}
                    },

                    "wm.slider": {
                        "hint": {"type": "string", "bindable": "in-out-bound"},
                        "readonly": {"type": "boolean", "value": false},
                        "disabled": {"type": "boolean", "value": false},
                        "minvalue": {"type": "number", "bindable": "in-out-bound"},
                        "maxvalue": {"type": "number", "bindable": "in-out-bound"},
                        "step": {"type": "number"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "scopedatavalue": {"type": "string"}
                    },

                    "wm.checkbox": {
                        "datavalue": {"type": "boolean, string", "bindable": "in-out-bound", "widget": "string"},
                        "checkedvalue": {"type": "string"},
                        "uncheckedvalue": {"type": "string"},
                        "scopedatavalue": {"type": "string"},
                        "startchecked": {"type": "boolean"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256}
                    },
                    "wm.checkboxset": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "tabindex": {"type": "string"},
                        "disabled": {"type": "boolean", "value": false},
                        "readonly": {"type": "boolean", "value": false},
                        "layout":  {"type": "list", "options": ["", "inline", "stacked"]},

                        /* ---- events ---- */

                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},

                        "datavalue": {"type": "string, array", "bindable": "in-out-bound", "show": false, "widget": "string"},
                        "scopedatavalue": {"type": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Option 1, Option 2, Option 3"},
                        "scopedataset": {"type": "string"},
                        "usekeys": {"type": "boolean"},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields"},
                        "displayfield": {"type": "list", "options": [""], "value": ""},
                        "displayexpression": {"type": "string"},
                        "selectedvalues": {"type": "string, object", "bindable": "in-bound", "widget": "string"},
                        "onReady": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.select": {
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean", "value": false},
                        "scopedatavalue": {"type": "string"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "scopedataset": {"type": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "allownone": {"type": "boolean"},
                        "hasdownarrow": {"type": "boolean", "value": true},
                        "restrictvalues": {"type": "boolean", "value": true},
                        "disabled": {"value": false},
                        "multiple": {"type": "boolean", "value": false},
                        "placeholder": {"type": "string", "value": ""}
                    },

                    "wm.label": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "caption": {"type": "date, string, number", "widget": "string", "value": "Label", "bindable": "in-out-bound", "maxlength": 256},
                        "required": {"type": "boolean"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "animation": {"type": "list", "options": animationOptions}
                    },

                    "wm.picture": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "picturesource": {"type": "string", "value": "resources/images/imagelists/default-image.png", "bindable": "in-out-bound"},
                        "pictureaspect": {"type": "list", "options": ["Both", "H", "None", "V"], "value": "None"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "tabindex": {"type": "string"},
                        "shape":  {"type": "list", "options": ["", "rounded", "circle", "thumbnail"]},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "animation": {"type": "list", "options": animationOptions}
                    },

                    "wm.textarea": {
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "scopedatavalue": {"type": "string"},
                        "placeholder": {"type": "string", "value": "Place your text"},
                        "maxchars": {"type": "number"},
                        "updateon": {"type": "list", "value": "blur", "widget": "updateon"},
                        "updatedelay": {"type": "number", "value": 0}
                    },

                    "wm.basicdialog": {
                        "show": {"type": "boolean", "show": false },
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onOpened": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions},
                        "hint": {"type": "string", "bindable": "in-bound"}
                    },
                    "wm.dialog.dialogheader": {
                        "caption": {"type": "string", "maxlength": 256},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "closable": {"type": "boolean", "show": false}
                    },
                    "wm.dialog.onOk": {
                        "onOk": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.alertdialog": {
                        "title": {"type": "string", "value": "Alert", "bindable": "in-bound"},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound"},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "value": "glyphicon glyphicon-warning-sign", "pattern": classRegex},
                        "message": {"type": "string", "value": "I am an alert box!", "bindable": "in-bound"},
                        "alerttype": {"type": "list", "options": ["error", "information", "success", "warning"], "value": "error"}
                    },
                    "wm.confirmdialog": {
                        "title": {"type": "string", "value": "Confirm", "bindable": "in-bound"},
                        "canceltext": {"type": "string", "value": "CANCEL", "bindable": "in-bound"},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound"},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "value": "glyphicon glyphicon-ok", "pattern": classRegex},
                        "message": {"type": "string", "value": "I am confirm box!", "bindable": "in-bound"},
                        "onCancel": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.iframedialog": {
                        "title": {"type": "string", "value": "External Content", "bindable": "in-bound"},
                        "url": {"type": "string", "value": "http://www.wavemaker.com", "bindable": "in-out-bound"},
                        "height": {"type": "string", "value": "400", "pattern": dimensionRegex},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "value": "glyphicon glyphicon-globe", "pattern": classRegex},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound"},
                        "closable": {"type": "boolean", "value": true}
                    },
                    "wm.pagedialog": {
                        "title": {"type": "string", "value": "Page Content", "bindable": "in-bound"},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound"},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "value" : "glyphicon glyphicon-file", "pattern": classRegex},
                        "closable": {"type": "boolean", "value": true}
                    },
                    "wm.logindialog": {
                        "height": {"type": "string", "show": false, "pattern": dimensionRegex},
                        "closable": {"type": "boolean", "value": true},
                        "modal": {"type": "boolean", "value": true}
                    },
                    "wm.designdialog": {
                        "modal": {"type": "boolean", "value": false},
                        "closable": {"type": "boolean", "value": true},
                        "title": {"type": "string", "show": false} //for backward compatibility
                    },
                    "wm.spinner": {
                        "show": {"type": "boolean", "value": false},
                        "caption": {"type": "string", "value": "Loading...", "maxlength": 256},
                        "servicevariabletotrack": {"type": "list", "options": []},
                        "image": {"type": "string", "bindable": "in-bound"},
                        "imagewidth": {"type": "string"},
                        "imageheight": {"type": "string"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "hidelabel": true, "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontsize": {"type": "number", "hidelabel": true, "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px"], "value": "px", "hidelabel": true, "widget": "icons_radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontVariant": {"type": "list", "options": ["normal", "small-caps"]},
                        "fontfamily": {"type": "string", "hidelabel": true, "hint": "Arial, Geneva"},
                        "misc": {"type": "string"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "zindex": {"type": "string", "pattern": zindexRegex}
                    },

                    'wm.layouts': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "class": {"type": "string", "pattern": classRegex},
                        "border": {"type": "string", "widget": "box"},
                        "borderunit": {"type": "string", "options": ["em", "px"], "value": "px", "widget": "icons_radio"},
                        "bordertop": {"type": "string", "pattern": numberRegex},
                        "borderright": {"type": "string", "pattern": numberRegex},
                        "borderbottom": {"type": "string", "pattern": numberRegex},
                        "borderleft": {"type": "string", "pattern": numberRegex},
                        "borderwidth": {"type": "string"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "borderstyle"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box"},
                        "paddingunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "paddingtop": {"type": "string", "pattern": numberRegex},
                        "paddingright": {"type": "string", "pattern": numberRegex},
                        "paddingbottom": {"type": "string", "pattern": numberRegex},
                        "paddingleft": {"type": "string", "pattern": numberRegex},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "hidelabel": true, "widget": "color"},
                        "text": {"type": "string"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontsize": {"type": "number", "hidelabel": true, "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px"], "value": "px", "hidelabel": true, "widget": "icons_radio"},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons_radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontVariant": {"type": "list", "options": ["normal", "small-caps"]},
                        "fontfamily": {"type": "string", "hidelabel": true, "hint": "Arial, Geneva"},
                        "misc": {"type": "string"},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "opacity": {"type": "string", "widget": "slider"},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex},
                        "accessroles": {"type": "accessrolesselect", "options": roles, "value": "Everyone"}
                    },
                    'wm.containers': {
                        "class": {"type": "string", "pattern": classRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "accessroles": {"type": "accessrolesselect", "options": roles, "value": "Everyone"},
                        "visibility": {"type": "list", "options": visibilityOptions},
                        "display": {"type": "list", "options": displayOptions},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'}
                    },

                    'wm.layouts.header': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.list': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "layout":  {"type": "list", "options": ["inline", "vertical"], "value": "vertical"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'}
                    },
                    'wm.layouts.breadcrumb': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "scopedataset": {"type": "string"},
                        "itemicon": {"type": "list", "options": [""]},
                        "itemlabel": {"type": "list", "options": [""]},
                        "itemlink": {"type": "list", "options": [""]}
                    },
                    'wm.layouts.nav': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "layout":  {"type": "list", "options": ["", "stacked", "justified"]},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "scopedataset": {"type": "string"},
                        "type":  {"type": "list", "options": ["navbar", "pills", "tabs"]},
                        "itemicon": {"type": "list", "options": [""]},
                        "itemlabel": {"type": "list", "options": [""]},
                        "itemlink": {"type": "list", "options": [""]},
                        "itemchildren": {"type": "list", "options": [""]}
                    },
                    'wm.layouts.navbar': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "title": {"type": "string", "bindable": "in-bound"},
                        "imgsrc": {"type": "string", "bindable": "in-bound"}
                    },
                    'wm.layouts.mobile.navbar': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "title": {"type": "string", "bindable": "in-bound"},
                        "leftnavpaneliconclass": {"type": "string", "widget": "selecticon", "pattern": classRegex, "value": "glyphicon glyphicon-menu-hamburger"},
                        "backbutton":  {"type": "boolean", "value": true},
                        "backbuttoniconclass": {"type": "string", "widget": "selecticon", "pattern": classRegex, "value": "glyphicon glyphicon-menu-left"},
                        "backbuttonlabel":  {"type": "string"}
                    },
                    'wm.layouts.listtemplate': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "class": {"type": "string", "show": false, "pattern": classRegex},
                        "layout":  {"type": "list", "options": ["blank", "gridlayout", "inline", "media", "panel", "thumbnail"], "value": "panel"}
                    },
                    'wm.layouts.listitem': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex}
                    },
                    'wm.layouts.topnav': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.leftpanel': {
                        "columnwidth": {"type": "list", "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], "value": "2"},
                        "animation" : {"type": "list", "options": ["slide-in", "slide-over"], "value" : "slide-in"}
                    },
                    'wm.layouts.rightpanel': {
                        "columnwidth": {"type": "list", "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], "value": "2"}
                    },
                    'wm.layouts.content': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.panel': {
                        "title": {"type": "string", "value": "Title", "bindable": "in-bound"},
                        "description": {"type": "string", "bindable": "in-bound", "widget": "textarea"},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "collapsible": {"type": "boolean"},
                        "expanded": {"type": "boolean", "value": true},
                        "closable": {"type": "boolean"},
                        "helptext": {"type": "string", "bindable": "in-out-bound", "widget": "textarea"},
                        "actions": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "datafield": {"type": "list", "options": [""]},
                        "displayfield": {"type": "list", "options": [""]},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound"},
                        "badgetype": {"type": "list", "options": ["default", "primary", "success", "info", "warning", "danger"], "value": "default", "bindable": "in-out-bound"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margin": {"type": "string", "widget": "box"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "minheight": {"type": "number"},
                        /*Events*/
                        "onEnterkeypress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onExpand": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onCollapse": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onActionsclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    'wm.layouts.container': {
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margin": {"type": "string", "widget": "box"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "minheight": {"type": "number"},
                        /*Events*/
                        "onEnterkeypress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDblclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    'wm.layouts.tile': {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margin": {"type": "string", "widget": "box"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "minheight": {"type": "number"},
                        /*Events*/
                        "onEnterkeypress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDblclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    'wm.layouts.footer': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.layoutgrid': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "value": '100%', "pattern": dimensionRegex},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margin": {"type": "string", "widget": "box"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "insert": {"type": "toolbar", "actions": [{'action': 'addrow', 'label': 'LABEL_PROPERTY_ADDROW', 'icon': 'add-row'}]}
                    },
                    'wm.layouts.gridcolumn': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "columnwidth": {"type": "list", "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]},
                        "insert": {"type": "toolbar", "actions": [{'action': 'addcolumnleft', 'label': 'LABEL_PROPERTY_ADDCOLUMNLEFT', 'icon': 'add-column-left'}, {'action': 'addcolumnright', 'label': 'LABEL_PROPERTY_ADDCOLUMNRIGHT', 'icon': 'add-column-right'}]}
                    },
                    'wm.layouts.gridrow': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "insert": {"type": "toolbar", "actions": [{'action': 'addrowbelow', 'label': 'LABEL_PROPERTY_ADDROWBELOW', 'icon': 'add-row-below'}, {'action': 'addrowabove', 'label': 'LABEL_PROPERTY_ADDROWABOVE', 'icon': 'add-row-above'}, {'action': 'addcolumn', 'label': 'LABEL_PROPERTY_ADDCOLUMN', 'icon': 'add-column'}]}
                    },
                    'wm.layouts.column': {
                        "columnwidth": {"type": "list", "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
                    },
                    'wm.layouts.pagecontent': {
                        "columnwidth": {"type": "list", "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
                    },
                    'wm.layouts.row': {
                        "show": {"type": "boolean", "value": true}
                    },
                    'wm.layouts.view': {
                        "show": {"type": "boolean", "value": true},
                        "viewgroup": {"type": "string", "value": "default"},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    'wm.layouts.form': {
                        "title": {"type": "string",  "bindable": "in-bound"},
                        "novalidate": {"type": "boolean", "value": false},
                        "autocomplete": {"type": "boolean", "value": true},
                        "action": {"type": "string", "bindable": "in-bound"},
                        "target": {"type": "list", "options": ["_blank", "_parent", "_self", "_top"], "value": "", "widget": "datalist"},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "method": {"type": "list", "options": ["get", "post"]},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "captionsize": {"type": "string"},
                        "captionalign": {"type": "list", "options": ["left", "center", "right"], "value": "left"},
                        "enctype": {"type": "list", "options": ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]},
                        "captionposition": {"type": "list", "options": ["left", "right", "top"], "value": "left"},
                        "layout": {"type": "list", "options": ["inline", "One Column", "Two Column", "Three Column", "Four Column"], "value": "One Column"},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    'wm.layouts.liveform': {
                        "title": {"type": "string"},
                        "formtype": {"type": "string", "value": "inline", "show": false},
                        "layout": {"type": "list", "options": ["One Column", "Two Column", "Three Column", "Four Column"], "value": "One Column"},
                        "autocomplete": {"type": "boolean", "value": true},
                        "captionsize": {"type": "string", "value": ""},
                        "captionalign": {"type": "list", "options": ["left", "center", "right"], "value": "left"},
                        "captionposition": {"type": "list", "options": ["left", "right", "top"], "value": "left"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "editfields": {"type": "button", "hidelabel": true, "disabled": true},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "rowdata": {"type": "string"},
                        "formdata": {"type": "object", "bindable": "in-bound", "widget": "string"},
                        "dataoutput": {"type": "object", "bindable": "out-bound", "widget": "string"},
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "novalidate": {"type": "boolean", "value": true},
                        "show": {"type": "boolean", "value": true},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "defaultview": {"type": "list", "options": ["Read-only", "Edit"], "value": "Read-only"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "insertmessage": {"type": "string", "value": "Record added successfully", "bindable": "in-out-bound"},
                        "updatemessage": {"type": "string", "value": "Record updated successfully", "bindable": "in-out-bound"},
                        /*Events*/
                        "onBeforeservicecall": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onResult": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onError": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.layouts.segmentedcontrol" : {
                        "onBeforeSegmentChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSegmentChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.layouts.segmentedcontrolcontent" : {
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex}
                    },
                    'wm.grid': {
                        "width": {"value": "100%", "pattern": dimensionRegex},
                        "height": {"value": "200px", "pattern": dimensionRegex},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "scopedataset": {"type": "string"},
                        "pagesize": {"type": "number"},
                        "editcolumn": {"type": "button", "hidelabel": true},
                        "gridfirstrowselect": {"type": "boolean"},
                        "confirmdelete": {"type": "string", "value": "Are you sure you want to delete this?", "bindable": "in-out-bound", "show": false},
                        "deleterow": {"type": "boolean", "bindable": "in-out-bound"},
                        "updaterow": {"type": "boolean", "bindable": "in-out-bound"},
                        "showheader": {"type": "boolean", "value": true},
                        "gridsearch": {"type": "boolean"},
                        "searchlabel": {"type": "string", "value": "Search", "bindable": "in-out-bound", "show": false},
                        "enablesort": {"type": "boolean", "value": true},
                        "showrowindex": {"type": "boolean"},
                        "multiselect": {"type": "boolean"},
                        "radioselect": {"type": "boolean"},
                        "insertrow": {"type": "boolean", "bindable": "in-out-bound"},
                        "readonlygrid": {"type": "boolean", "value": true},
                        "showrecordcount": {"type": "boolean", "show": false},
                        "shownavigation": {"type": "boolean", "value": true},
                        "filternullrecords": {"type": "boolean", "value": true},
                        "nodatamessage": {"type": "string", "value": "No data found.", "bindable": "in-out-bound"},
                        "loadingdatamsg": {"type": "string", "value": "Loading...", "bindable": "in-out-bound"},
                        "deletemessage": {"type": "string", "value": "Record deleted successfully", "bindable": "in-out-bound"},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string"},
                        "gridcaption": {"type": "string", "bindable": "in-out-bound", "value": ""},

                        /* Events */
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDeselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSort": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onHeaderclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onShow": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onHide": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowdeleted": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforerowinsert": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowinsert": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onColumnselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onColumndeselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEnterkeypress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSetrecord": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},

                        /* Styles */
                        "gridclass": {"type": "string", "value": "table-bordered table-striped table-hover", "pattern": classRegex},
                        "class": {"type": "string", "show": false, "pattern": classRegex}
                    },
                    'wm.livegrid': {
                        'formlayout': {"type": "list", "options": ["inline", "dialog"], "value": "inline"}
                    },
                    'wm.fileupload': {
                        "multiple": {"type": "boolean", "value": false},
                        "contenttype": {"type": "list", "options": ["all", "audio", "image", "video"], "value": "all"},
                        "fileuploadtitle": {"type": "string", "value": "Drop your files here to start uploading."},
                        "fileuploadmessage": {"type": "string", "value": "You can also browse for files"},
                        "tabindex": {"type": "string"},
                        "filename": {"type": "string", "bindable": "in-out-bound"},
                        "filepath": {"type": "string", "bindable": "in-out-bound"},
                        "destination": {"type": "string", "widget": "fileupload-relativepath", "bindable": "in-out-bound"},
                        "caption": {"type": "string", "value": "Upload", "bindable": "in-out-bound", "maxlength": 256},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "value" : "glyphicon glyphicon-upload", "pattern": classRegex},

                        /* ---- events ---- */
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onProgress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onAbort": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    'wm.youtube': {
                        "width": { "value": "800px", "pattern": dimensionRegex},
                        "height": {"value": "125px", "pattern": dimensionRegex},
                        "uploadpath": {"type": "string"}
                    },
                    "wm.anchor": {
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconurl": {"type": "string", "bindable": "in-bound"},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "caption": {"type": "string", "value": "Link", "bindable": "in-out-bound", "maxlength": 256},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound"},
                        "hyperlink": {"type": "string", "bindable": "in-out-bound"},
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "target": {"type": "list", "options": ["_blank", "_parent", "_self", "_top"], "value": "_self", "widget": "datalist"},
                        "tabindex": {"type": "string"},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "misc": {"type": "string"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline'},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    "wm.popover": {
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconurl": {"type": "string", "bindable": "in-bound"},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "caption": {"type": "string", "value": "Link", "bindable": "in-out-bound", "maxlength": 256},
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "tabindex": {"type": "string"},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "misc": {"type": "string"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "popoverwidth" :  {"type": "string"},
                        "popoverheight" :  {"type": "string"},
                        "popoverarrow" :  {"type": "boolean", "value" : true},
                        "popoverautoclose": {"type": "boolean", "value" : true},
                        "popoverplacement": {"type": "list", "options": ["bottom", "left", "right", "top"], "value": "bottom"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline'},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    "wm.prefabs": {
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "onLoad": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDestroy": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions}
                    },

                    "wm.accordion": {
                        "closeothers": { "type": "boolean", "value": true},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "tabindex": {"type": "string"}
                    },

                    "wm.accordionpane": {
                        "onExpand": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onCollapse": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.accordionheader": {
                        "heading": {"type": "string", "value": "Heading", "bindable": "in-bound"},
                        "description": {"type": "string", "bindable": "in-bound", "widget": "textarea"},
                        "iconclass": {"type": "string", "widget": "selecticon", "bindable": "in-out-bound", "pattern": classRegex},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound"},
                        "badgetype": {"type": "list", "options": ["default", "primary", "success", "info", "warning", "danger"], "value": "default", "bindable": "in-out-bound"},
                        "tabindex": {"type": "string"},
                        "isdefaultpane": {"type": "boolean", "bindable": "in-bound"}
                    },

                    "wm.richtexteditor": {
                        "show": {"type": "boolean", "value": true},
                        "readonly": {"type": "boolean"},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]},
                        "datavalue": {"type": "string", value: "", "bindable": "in-out-bound"},
                        "showpreview": {"type": "boolean", "value": false},
                        "placeholder": {"type": "string"},
                        "tabindex": {"type": "string"},
                        "scopedatavalue": {"type": "string"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.tabs": {
                        "tabsposition": {"type": "list",  "options": ["left", "top", "right", "bottom"], "value": "top"},
                        "taborder": {"type": "list", "widget": "tabordering", "dataset": []}
                    },

                    "wm.tab": {
                        "heading": {"type": "string", "bindable": "in-bound"}
                    },
                    "wm.tabpane": {
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDeselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"}
                    },
                    "wm.tabheader": {
                        "heading": {"type": "string", "value": "Tab Title", "bindable": "in-bound"},
                        "paneicon": {"type": "string", "bindable": "in-bound"},
                        "isdefaulttab": {"type": "boolean", "bindable": "in-bound"},
                        "tabindex": {"type": "string"}
                    },
                    "wm.carousel" : {
                        "animationinterval" : {"type" : "number", "value" : "3"}
                    },
                    "wm.tabbar" : {
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "dropposition": {"type": "list", "options": ["down", "up"], "value": "up"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "morebuttoniconclass": {"type": "string", "widget": "selecticon", "pattern": classRegex, "value": "glyphicon glyphicon-option-horizontal"},
                        "morebuttonlabel":  {"type": "string", "value": "more"}
                    },
                    "wm.livelist": {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "accessroles": {"type": "accessrolesselect", "options": roles, "value": "Everyone"},
                        "pagesize": {"type": "number"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "scopedataset": {"type": "string"},
                        "showrecordcount": {"type": "boolean", "value": false, "show": false},
                        "shownavigation": {"type": "boolean", "value": false},
                        "itemsperrow": {"type": "list", "options": ["1", "2", "3", "4", "6", "12"], "value": "1"},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string"},
                        "onEnterkeypress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSetrecord": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "itemclass": {"type": "string", "pattern": classRegex},
                        "listclass": {"type": "string", "pattern": classRegex},
                        "selectfirstitem": {"type": "boolean", "value": false, "bindable": "in-out-bound"}
                    },
                    "wm.livefilter": {
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "scopedataset": {"type": "string"},
                        "editfilters": {"type": "button", "hidelabel": true, "disabled": true},
                        "result": {"type": "object", "bindable": "out-bound", "widget": "string", "show": "false"},
                        "layout": {"type": "list", "options": ["One Column", "Two Column", "Three Column", "Four Column"], "value": "One Column"},
                        "pagesize": {"type": "number", "value": 20}
                    },
                    "wm.search": {
                        "scopedatavalue": {"type": "string"},
                        "datavalue": {"type": "string, object", "widget": "string", "bindable": "in-out-bound"},
                        "scopedataset": {"type": "string"},
                        "query": {"type": "string", "bindable": "out-bound", "show": "false"},
                        "searchkey": {"type": "list", "options": [""]},
                        "displaylabel": {"type": "list", "options": [""]},
                        "displayimagesrc": {"type": "list", "options": [""]},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "limit": {"type": "number", "value": 5},
                        "placeholder": {"type": "string", "value": "Search"},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "tabindex": {"type": "string"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'}
                    },
                    "wm.chart": {
                        "height": {"type": "string", value: "210px", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "type": {"type": "string", "widget": "list", "options": ["Column", "Line", "Area", "Cumulative Line", "Bar", "Pie", "Donut", "Bubble"], "bindable": "in-out-bound"},
                        "scopedataset": {"type": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "xaxisdatakey": {"type": "list", "widget": "list"},
                        "xaxislabel": {"type": "string"},
                        "xunits": {"type": "string"},
                        "xnumberformat": {"type": "list", "show": false, "options": ["Decimal Digits", "Precision", "Exponential", "Percentage", "Round", "Round Percentage", "Round to Thousand", "Round to Million", "Round to Billion"]},
                        "xdigits": {"type": "number", "show": false, "value": 1},
                        "xdateformat": {"type": "listGroup", "show": false, "options": dateOptions, "value": "%x"},
                        "yaxisdatakey": {"type": "list", "widget": "multiselect"},
                        "yaxislabel": {"type": "string"},
                        "yunits": {"type": "string"},
                        "ynumberformat": {"type": "list", "show": false, "options": ["Decimal Digits", "Precision", "Exponential", "Percentage", "Round", "Round Percentage", "Round to Thousand", "Round to Million", "Round to Billion"]},
                        "ydigits": {"type": "number", "show": false, "value": 1},
                        "ydateformat": {"type": "listGroup", "show": false, "options": dateOptions, "value": "%x"},
                        "bubblesize": {"type": "string", "widget": "list"},
                        "shape": {"type": "string", "widget": "list", "options": ["circle", "square", "diamond", "cross", "triangle-up", "triangle-down", "random"], value: "circle"},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "tooltips": {"type": "boolean", "value": true},
                        "showlegend": {"type": "boolean", "value": true},
                        "captions": {"type": "boolean", "value": true},
                        "showxaxis": {"type": "boolean", "value": true},
                        "showyaxis": {"type": "boolean", "value": true},
                        "legendposition": {"type": "list", "options": ["Top", "Bottom"], "value": "Top", "disabled": false},
                        "showvalues": {"type": "boolean", "value": false},
                        "showlabels": {"type": "boolean", "value": true},
                        "showcontrols": {"type": "boolean", "value": false},
                        "useinteractiveguideline": {"type": "boolean", "value": false},
                        "staggerlabels": {"type": "boolean", "value": false},
                        "reducexticks": {"type": "boolean", "value": true},
                        "labeltype": {"type": "list", "options": ["key", "value", "percent"], "value": "percent"},
                        "offset": {"type": "string", "widget": "box"},
                        "offsettop": {"type": "number", "value": 25, "pattern": numberRegex},
                        "offsetbottom": {"type": "number", "value": 55, "pattern": numberRegex},
                        "offsetleft": {"type": "number", "value": 75, "pattern": numberRegex},
                        "offsetright": {"type": "number", "value": 25, "pattern": numberRegex},
                        "barspacing": {"type": "number", "value": 0.1, "min": "0.1", "max": "0.9", "step": "0.1"},
                        "donutratio": {"type": "number", "value": 0.5, "min": "0.1", "max": "1", "step": "0.1"},
                        "title": {"type": "string", "bindable": "in-out-bound"},
                        "showlabelsoutside": {"type": "boolean", "value": true},
                        "xaxislabeldistance": {"type": "number", "value": 12, "show": false},
                        "yaxislabeldistance": {"type": "number", "value": 12, "show": false},
                        "showxdistance": {"type": "boolean", "value": false},
                        "showydistance": {"type": "boolean", "value": false},
                        "aggregation": {"type": "list", "options": ["average", "count", "maximum", "minimum", "none", "sum"], "value": "none"},
                        "aggregationcolumn": {"type": "list", "widget": "list"},
                        "groupby": {"type": "list", "widget": "multiselect"},
                        "orderby": {"type": "list", "widget": "order-by"},
                        "theme": {"type": "list", "options": ["Terrestrial", "Annabelle", "Azure", "Retro", "Mellow", "Orient", "GrayScale", "Flyer", "Luminosity"], "value": "Terrestrial"},
                        "customcolors": {"type": "array", "bindable": "in-bound", "widget": "string"},
                        "nodatamessage": {"type": "string", "value": "No Data Available.", "bindable": "in-out-bound"},
                        /**Style**/
                        "border": {"type": "string", "widget": "box"},
                        "borderunit": {"type": "string", "options": ["em", "px"], "value": "px", "widget": "icons_radio"},
                        "bordertop": {"type": "string", "pattern": numberRegex},
                        "borderright": {"type": "string", "pattern": numberRegex},
                        "borderbottom": {"type": "string", "pattern": numberRegex},
                        "borderleft": {"type": "string", "pattern": numberRegex},
                        "borderwidth": {"type": "string"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "borderstyle"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box"},
                        "paddingunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "paddingtop": {"type": "string", "pattern": numberRegex},
                        "paddingright": {"type": "string", "pattern": numberRegex},
                        "paddingbottom": {"type": "string", "pattern": numberRegex},
                        "paddingleft": {"type": "string", "pattern": numberRegex},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "color": {"type": "string", "hidelabel": true, "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontsize": {"type": "number", "hidelabel": true, "hint": "Font size", "value": 12, "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px"], "value": "px", "hidelabel": true, "widget": "icons_radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "hidelabel": true, "widget": "icons_checkbox"},
                        "fontfamily": {"type": "string", "hidelabel": true, "hint": "Arial, Geneva"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex},
                        "onTransform": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.datanavigator": {
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "showrecordcount": {"type": "boolean", "value": false},
                        "result": {"type": "object", "bindable": "out-bound", "widget": "string", "show": "false"},
                        "onEnterKeyPress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSetrecord": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.login": {
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "errormessage": {"type": "string"},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.pagecontainer": {
                        "content": {"type": "list", "options": [], "widget": "pages-list", value: ""}
                    },
                    "wm.video": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "mp4format": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "oggformat": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "webmformat": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "subtitlelang": {"type": "string", "value": "en", "bindable": "in-out-bound"},
                        "subtitlesource": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "videoposter": {"type": "string", "value": "resources/images/imagelists/default-image.png", "bindable": "in-out-bound"},
                        "controls":  {"type": "boolean"},
                        "videosupportmessage":  {"type": "string", "value": "Your browser does not support the video tag."},
                        "autoplay": {"type": "boolean"},
                        "loop": {"type": "boolean"},
                        "muted": {"type": "boolean"},
                        "videopreload": {"type": "list", "options": ["none", "metadata", "auto"], "value": "none"},
                        "tabindex": {"type": "string"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'}
                    },
                    "wm.audio": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "mp3format": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "controls": {"type": "boolean"},
                        "audiosupportmessage": {"type": "string", "value": "Your browser does not support the audio tag."},
                        "autoplay": {"type": "boolean"},
                        "loop": {"type": "boolean"},
                        "muted": {"type": "boolean", "value": false},
                        "audiopreload": {"type": "list", "options": ["none", "metadata", "auto"], "value": "none"},
                        "tabindex": {"type": "string"},
                        "showindevice": {"type": "selectall", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'}
                    },
                    "wm.progress": {
                        "hint": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "minvalue": {"type": "number", "value": 0, "bindable": "in-bound"},
                        "maxvalue": {"type": "number", "value": 100, "bindable": "in-bound"},
                        "datavalue": {"type": "number, string, array", "value": 30, "bindable": "in-out-bound", "widget": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "pollinterval": {"type": "number"},
                        "displayformat": {"type": "list", "options": ["percentage", "absolute"], "value": "percentage"},
                        "type": {"type": "list", "options": ["default", "default-striped", "success", "success-striped", "info", "info-striped", "warning", "warning-striped", "danger", "danger-striped"], "value": "default"},

                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "onStart": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onComplete": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforeupdate": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},

                        /* ---- styles ----*/
                        "padding": {"type": "string", "widget": "box"},
                        "paddingunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "paddingtop": {"type": "string", "pattern": numberRegex},
                        "paddingright": {"type": "string", "pattern": numberRegex},
                        "paddingbottom": {"type": "string", "pattern": numberRegex},
                        "paddingleft": {"type": "string", "pattern": numberRegex},
                        "margin": {"type": "string", "widget": "box"},
                        "marginunit": {"type": "string", "options": ["%", "em", "px"], "value": "px", "widget": "icons_radio"},
                        "margintop": {"type": "string", "pattern": numberRegex},
                        "marginbottom": {"type": "string", "pattern": numberRegex},
                        "marginright": {"type": "string", "pattern": numberRegex},
                        "marginleft": {"type": "string", "pattern": numberRegex},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex}
                    },
                    "wm.template": {
                        "header": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "topnav": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "leftnav": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "rightnav": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "footer": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"}
                    }
                },

                "propertyGroups": [
                    {"name": "properties", "parent": "", "show": true, "feature": "project.editor.design.basic"},
                    {"name": "styles", "parent": "", "show": true, "feature": "project.editor.design.style"},
                    {"name": "events", "parent": "", "show": true, "feature": "project.editor.design.events"},
                    {"name": "mobile", "parent": "", "show": true, "feature": "project.editor.design.mobile"},
                    {"name": "security", "parent": "", "show": true, "feature": "project.editor.design.security"},
                    {"properties": ["caption", "gridcaption", "title", "heading", "name", "type", "accept", "placeholder", "currency",  "hint", "tabindex", "target",  "description", "message", "oktext", "canceltext", "servicevariabletotrack", "valuetype", "alerttype", "iframesrc", "insert", "dropposition"], "parent": "properties"},
                    {"name": "layout", "properties": ["width", "height", "treeicons", "pictureaspect", "shape", "layoutkind", "layout", "navtype", "stacked", "justified", "formlayout", "itemsperrow", "showheader", "header", "topnav", "leftnav", "rightnav", "footer", "offset", "addrow", "addcolumn", "popoverwidth", "popoverheight", "tabsposition"], "parent": "properties"},
                    {"name": "image", "properties": ["image", "imagewidth", "imageheight"], "parent": "properties"},
                    {"name": "video", "properties": ["videoposter", "mp4format", "oggformat", "webmformat", "videopreload", "videosupportmessage", "subtitlesource", "subtitlelang"], "parent": "properties"},
                    {"name": "audio", "properties": ["mp3format", "audiopreload", "audiosupportmessage"], "parent": "properties"},
                    {"name": "content", "properties": ["content", "url"], "parent": "properties"},
                    {"name": "display", "properties": ["picturesource", "modal", "vertical", "fileuploadtitle", "fileuploadmessage"], "parent": "properties"},
                    {"name": "values", "properties": [ "scopedatavalue", "datavalue", "minvalue", "maxvalue", "displayformat", "updateon", "updatedelay", "formdata", "selectedvalue", "selectedvalues", "discretevalues", "integervalues", "minimum", "maximum", "step", "defaultvalue", "defaultcolor", "checkedvalue", "uncheckedvalue"], "parent": "properties"},
                    {"name": "valuedisplay", "properties": ["places", "datepattern", "ismeridian", "hourstep", "minutestep", "limit"], "parent": "properties"},
                    {"name": "output", "properties": ["outputformat"], "parent": "properties"},
                    {"name": "dataset", "properties": ["operation", "scopedataset", "dataset", "options",  "hyperlink", "formfield", "editcolumn", "editfields", "editfilters", "method", "action", "enctype", "searchkey", "displaylabel", "imgsrc", "displayimagesrc", "usekeys", "actions",  "datafield", "itemicon", "itemlabel", "itemlink", "itemchildren", "displayfield", "displayexpression",  "groupby", "aggregation", "aggregationcolumn", "orderby", "orderbycolumn", "nodelabel", "nodeicon", "nodechildren",  "badgevalue",  "badgetype"], "parent": "properties"},
                    {"name": "xaxis", "properties": ["xaxisdatakey", "xaxislabel", "xunits", "xnumberformat", "xdigits", "xdateformat", "xaxislabeldistance"], "parent": "properties"},
                    {"name": "yaxis", "properties": ["yaxisdatakey", "yaxislabel", "yunits", "ynumberformat", "ydigits", "ydateformat", "yaxislabeldistance"], "parent": "properties"},
                    {"name": "zaxis", "properties": ["bubblesize"], "parent": "properties"},
                    {"name": "validation", "properties": ["required", "regexp", "mindate", "maxdate", "novalidate", "maxchars"], "parent": "properties"},
                    {"name": "help", "properties": ["helptext"], "parent": "properties"},
                    {"name": "behavior", "properties": ["pollinterval", "radiogroup", "viewgroup", "startchecked", "autofocus", "readonly", "insertmessage", "updatemessage", "ignoreparentreadonly", "readonlygrid",
                        "multiple", "show", "calendartype", "controls", "view", "disabled", "pagesize", "dynamicslider", "selectionclick", "closeothers", "collapsible",
                        "lock", "freeze", "autoscroll", "closable", "expanded",  "destroyable", "showDirtyFlag", "link",
                        "uploadpath", "contenttype", "destination", "isdefaulttab", "isdefaultpane", "autocomplete", "nodatamessage", "confirmdelete", "deletemessage", "loadingdatamsg", "showpreview", "defaultview", "errormessage", "tooltips", "showlegend", "legendposition", "captions", "showxaxis", "showyaxis", "showvalues",
                         "showlabels", "showcontrols", "useinteractiveguideline", "staggerlabels", "reducexticks", "barspacing", "labeltype", "autoplay", "loop", "muted", "donutratio", "showlabelsoutside",
                          "showxdistance", "showydistance", "xpadding", "ypadding", "popoverplacement", "popoverarrow", "popoverautoclose", "animation", "animationinterval", "leftnavpaneliconclass", "backbutton", "backbuttoniconclass", "backbuttonlabel", "morebuttoniconclass", "morebuttonlabel"], "parent": "properties"},
                    {"name": "datagrid", "properties": ["insertrow", "deleterow", "updaterow", "shownavigation", "showrecordcount", "multiselect", "radioselect", "enablesort", "gridsearch", "searchlabel", "showrowindex", "gridfirstrowselect", "selectfirstitem"], "parent": "properties"},
                    {"name": "caption", "properties": ["captionalign", "captionposition", "captionsize", "mineditorwidth"], "parent": "properties"},
                    {"name": "graphics", "properties": ["imagelist", "imageindex", "paneicon", "iconclass", "iconsize", "iconurl", "iconwidth", "iconheight", "iconmargin"], "parent": "properties"},
                    {"name": "format", "properties": [ "showtooltip", "horizontalalign", "verticalalign", "rows", "columns", "columnwidth", "taborder"], "parent": "properties"},
                    {"name": "selection", "properties": ["selectionmode"], "parent": "properties"},
                    {"name": "operations", "properties": ["submitbutton", "resetbutton"], "parent": "properties"},
                    {"properties": [ "class", "menuclass", "listclass", "itemclass", "gridclass",  "theme", "customcolors"], "parent": "styles"},
                    {"name": "textstyle", "properties": [ "fontsize", "fontunit", "fontfamily", "color", "fontweight", "fontstyle", "textdecoration", "textalign", "whitespace"], "parent": "styles"},
                    {"name": "backgroundstyle", "properties": ["backgroundcolor", "backgroundimage", "backgroundrepeat", "backgroundposition", "backgroundsize", "backgroundattachment"], "parent": "styles"},
                    {"name": "border", "properties": ["bordercolor", "borderstyle", "border", "borderunit"], "parent": "styles"},
                    {"name": "displaystyle", "properties": ["padding", "paddingunit", "margin", "marginunit", "opacity", "overflow", "cursor", "zindex", "visibility", "display"], "parent": "styles"},
                    {"name": "prefablifecycleevents", "properties": ["onLoad", "onDestroy"], "parent": "events"},
                    {"name": "event", "properties": ["onChange",  "onFocus", "onBlur"], "parent": "events"},
                    {"name": "mouseevents", "properties": ["onClick", "onDblclick", "onDayclick", "onEventdrop", "onEventresize", "onEventclick", "onEventrender", "onMousedown", "onMouseup", "onMouseover", "onMouseout", "onMousemove", "onMouseenter", "onMouseleave"], "parent": "events"},
                    {"name": "keyboardevents", "properties": ["onKeydown", "onKeypress", "onKeyup", "onEnterkeypress"], "parent": "events"},
                    {"name": "touchevents", "properties": ["onSwipeup", "onSwipedown", "onSwipeleft", "onSwiperight", "onPinchin", "onPinchout"], "parent": "events"},
                    {"name": "callbackevents", "properties": ["onStart", "onComplete", "onBeforeupdate", "onShow", "onHide", "onSuccess", "onError", "onOk", "onSubmit", "onCancel", "onClose", "onOpened", "onExpand", "onCollapse", "onSelect", "onDeselect",
                        "onProgress", "onTransform", "onAbort", "onSort", "onGridbuttonclick", "onHeaderclick", "onRowclick", "onColumnselect", "onColumndeselect", "onRowdeleted", "onBeforerowinsert", "onRowinsert", "onResult", "onBeforeservicecall", "onSetrecord", "onActionsclick", "onBeforeSegmentChange", "onSegmentChange"], "parent": "events"},
                    {"name": "security", "properties": ["accessroles"], "parent": "security"},
                    {"name": "devicesize", "properties": ["showindevice"], "parent": "mobile"}
                ]
            },
            properties = result.properties,
            propertyGroups = result.propertyGroups;

        /**
         * @ngdoc function
         * @name wm.widgets.$PropertiesFactory#getPropertiesOf
         * @methodOf wm.widgets.$PropertiesFactory
         * @function
         *
         * @description
         * This method returns a widget's properties.
         * If parents array is provided, injects the properties of the parents into widget,
         * else returns only the properties of the widget.
         * @param {String} widget Name of the widget for which the properties are to be returned
         * @param {Array} parents Name of the widgets, the given widget inherits properties from.
         * @returns {Object} widget with its properties.
         */

        /*
         If parents array is provided, inject the properties of from the parents into widget and return,
         else return only the properties of the widget.
         */
        function getPropertiesOf(widget, parents) {
            var widgetProps, parentsArr;

            if (!parents) {
                /* This widget doesn't inherit from other widgets. Fetch the properties of only this widget */
                widgetProps = WM.copy(properties[widget]);
            } else {
                parentsArr = WM.isArray(parents) ? parents : [parents];
                parentsArr.push(widget);
                widgetProps = {};

                /* construct the properties object by inheriting from parents*/
                parentsArr.forEach(function (parent) {
                    if (!WM.isObject(properties[parent])) {
                        return;
                    }
                    Object.keys(properties[parent])
                        .forEach(function (propName) {
                            var propObj = properties[parent][propName];
                            if (!widgetProps[propName]) {
                                widgetProps[propName] = {};
                            }
                            Object.keys(propObj).forEach(function (key) {
                                widgetProps[propName][key] = propObj[key];
                            });
                        });
                });
            }

            /* Inject show and disabled fields into each property object */
            Object.keys(widgetProps)
                .forEach(function (key) {
                    var property = widgetProps[key];
                    if (!property.hasOwnProperty('show')) {
                        property.show = true;
                    }
                    property.disabled = property.disabled || false;
                });

            return widgetProps;
        }

        function getPropertyGroups() {
            return propertyGroups;
        }

        function getPrimaryPropertyGroups() {
            var primaryPropertyGroups = [];
            propertyGroups.forEach(function (propertyGroup) {
                /*Check for groups that do not have parents to get primary groups.*/
                if (!propertyGroup.parent) {
                    primaryPropertyGroups.push(propertyGroup);
                }
            });
            return primaryPropertyGroups;
        }

        function getGroupProperties(group) {
            var groupProperties = [];
            propertyGroups.forEach(function (propertyGroup) {
                /*Check for the property groups that have the specified group as the parent.*/
                if (propertyGroup.parent === group) {
                    groupProperties = groupProperties.concat(propertyGroup.properties);
                }
            });
            return groupProperties;
        }

        function getPropertyGroup(name) {
            return _.find(propertyGroups, function (group) { return group.name === name; });
        }

        function setRoles(pRoles) {
            /* reset the existing roles array (keeping the actual reference to the roles array)*/
            roles.length = 0;
            roles.push("Everyone");

            /* push the provided roles into the existing roles */
            if (WM.isArray(pRoles)) {
                pRoles.forEach(function (pRole) {
                    roles.push(pRole);
                });
            }
        }

        /* function to return the access-roles */
        function getRoles() {
            /* return the roles array */
            return roles || [];
        }

        return {
            getPropertiesOf: getPropertiesOf,
            getPropertyGroups: getPropertyGroups,
            getPrimaryPropertyGroups: getPrimaryPropertyGroups,
            getGroupProperties: getGroupProperties,
            getPropertyGroup: getPropertyGroup,
            getRoles: getRoles,
            setRoles: setRoles
        };
    }])

    /** A directive for compiling the content and inserting inside a container.Used in LiveList widget */
    .directive('compile', function ($compile) {
        "use strict";

        return function (scope, element, attrs) {
            var unbindWatcher = scope.$watch(
                function (scope) {
                    // watch the 'compile' expression for changes
                    return scope.$eval(attrs.compile);
                },
                function (value) {

                    /*Add a clone of the element to the current dom.
                     * This is needed in case of elements with children.*/
                    var clone = value ? value.clone() : value;

                    // when the 'compile' expression changes
                    // assign it into the current DOM
                    element.html(clone);

                    // compile the new DOM and link it to the current
                    // scope.
                    // NOTE: we only compile .childNodes so that
                    // we don't get into infinite loop compiling ourselves
                    $compile(element.contents())(element.scope());
                    unbindWatcher();
                }
            );
        };
    })

    .directive('ngController', function ($rootScope, CONSTANTS) {
        'use strict';

        if (CONSTANTS.isRunMode) {
            $rootScope.Widgets = {};
        }

        return {
            'restrict': 'A',
            'compile': function () {
                return {
                    'pre': function (scope) {
                        scope.ctrlScope = scope;
                    }
                };
            }
        };
    })

    /*directive to handle on-change event for file input */
    .directive('onFileChange', function () {
        'use strict';
        return {
            link: function (scope, element, attrs) {
                element[0].onchange = function () {
                    scope[attrs.onFileChange](element[0]);
                };
            }
        };
    })

    /**
     * @ngdoc directive
     * @name wm.widgets.directive:wmtransclude
     * @restrict A
     * @element ANY
     *
     * @description
     * When this attribute directive is applied on an element, the elements transcluded content is processed and appended to the element.
     */
    .directive('wmtransclude', function () {
        "use strict";
        return {
            "restrict": "A",
            "link": function (scope, element, attrs, nullCtrl, transcludeFn) {

                /*
                 * add data-droptarget-for attribute on the element.
                 * this attribute is useful in studio. it is used to find out the droptarget on an element.
                 */
                if (scope.widgetid) {
                    element.attr("data-droptarget-for", scope.widgettype);
                }

                var elScope = element.scope();

                if (elScope.hasOwnProperty('$$isolateBindings') && !elScope.__compileWithIScope) {
                    elScope = elScope.$parent;
                }

                transcludeFn(elScope, function (clone) {
                    element.append(clone);
                });
            }
        };
    })

    /**
     * @ngdoc directive
     * @name wm.widgets.directive:roles
     * @restrict A
     * @element ANY
     * @requires CONSTANTS
     * @requires $rootScope
     * @requires $compile
     * @description
     * This directive is for the widgets having 'roles' attribute in their raw markup.
     * It comes into action when security is enabled in the application being designed through studio.
     * It matches the roles associated with the widget with the roles of the user currently logged in.
     * If match is satisfied, the widget is properly compiled and displayed in the UI
     * Else the element is cleared from the DOM
     */
    .directive('accessroles', function (CONSTANTS, $rootScope, $compile) {
        "use strict";
        var directive = {};

        /* the directive is required only in RUN mode and when security is enabled */
        if (CONSTANTS.isRunMode && $rootScope.isSecurityEnabled) {
            directive = {
                "restrict": "A",
                "priority": 10000,
                "terminal": true,
                "compile": function () {
                    return {
                        "pre": function (scope, element, attrs) {
                            var userRoles = $rootScope.userRoles || [],
                                widgetRoles = attrs.accessroles ? attrs.accessroles.split(",") : [],
                                clonedElement,
                                matchRoles = function (arr1, arr2) {
                                    return arr1.some(function (item) {
                                        return arr2.indexOf(item) !== -1;
                                    });
                                };

                            if (widgetRoles.length && widgetRoles.indexOf("Everyone") === -1 && !matchRoles(widgetRoles, userRoles)) {
                                element.remove();
                            } else {
                                clonedElement = element.clone();
                                clonedElement.removeAttr("accessroles");
                                element.replaceWith(clonedElement);
                                $compile(clonedElement)(scope);
                            }
                        }
                    };
                }
            };
        }

        return directive;
    })

    /**
    * @ngdoc directive
    * @name wm.widgets.directive:wmupdateProperties
    * @restrict A
    * @element ANY
    *
    * @description update datafield, display field in the property panel
    *
    */
    .service('wmupdateProperties', ['WidgetUtilService',
        function (WidgetUtilService) {
            "use strict";
            function updatePropertyPanelOptions(dataset, propertiesMap, scope) {
                var variableKeys = [],
                    ALLFIELDS = "All Fields";

                scope.widgetProps.datafield.options = [];
                scope.widgetProps.displayfield.options = [];
                /* re-initialize the property values */
                if (scope.newcolumns) {
                    scope.newcolumns = false;
                    scope.datafield = '';
                    scope.displayfield = '';
                    scope.$root.$emit("set-markup-attr", scope.widgetid, {'datafield': scope.datafield, 'displayfield': scope.displayfield});
                }

                if (WM.isString(dataset)) {
                    return;
                }

                /* on binding of data*/
                if (WM.isArray(dataset)) {
                    dataset = dataset[0] || dataset;
                    variableKeys = WidgetUtilService.extractDataSetFields(dataset, propertiesMap) || [];
                }

                /*removing null values from the variableKeys*/
                WM.forEach(variableKeys, function (variableKey, index) {
                    if (dataset[variableKey] === null || WM.isObject(dataset[variableKey])) {
                        variableKeys.splice(index, 1);
                    }
                });

                scope.widgetProps.datafield.options = ['', ALLFIELDS].concat(variableKeys);
                scope.widgetProps.displayfield.options = [''].concat(variableKeys);
            }
            return {
                updatePropertyPanelOptions: updatePropertyPanelOptions
            };
        }])
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

    .directive('initWidget', ['$rootScope', 'WidgetUtilService', 'DialogService', 'Utils', 'CONSTANTS', '$parse', '$timeout', 'DataFormatService', '$animate', '$routeParams', 'BindingManager',
        function ($rootScope, WidgetUtilService, DialogService, Utils, CONSTANTS, $parse, $timeout, DataFormatService/*Do not remove*/, $animate, $routeParams, BindingManager) {
            'use strict';

            var sliceFn = Array.prototype.slice;

            function isBooleanAttr(key) {
                return key === 'readonly' || key === 'autofocus' || key === 'disabled' || key === 'startchecked' || key === 'multiple' || key === 'selected' || key === 'required' || key === 'controls' || key === 'autoplay' || key === 'loop' || key === 'muted';
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

            function handleAppCustomEvent(iScope, scope, isAnchor, $evt, customEvtName) {

                var parts;

                /* For anchor elements suppressing the default action to refresh the page */
                if (isAnchor) {
                    $evt.preventDefault();
                }

                parts = customEvtName.split('.');

                if (parts.length === 2) {
                    if (parts[1] === 'show') {
                        // Pass the scope of the controller. if the controller scope is not found, dialog will be compiled with the rootScope.
                        DialogService.showDialog(parts[0], {scope: scope.ctrlScope || scope});
                        return;
                    }
                    if (parts[1] === 'hide') {
                        DialogService.hideDialog(parts[0]);
                        return;
                    }
                }

                /* Emit the event in a timeout, so that any variable watching on current widget is updated with its value */
                $timeout(function () {
                    $rootScope.$emit('invoke-service', customEvtName, {scope: scope});
                });
            }

            if (CONSTANTS.isRunMode) {
                $rootScope._handleAppCustomEvent = handleAppCustomEvent;
            }

            function overrideEventHandlers(iScope, scope, element, attrs) {

                Object.keys(iScope.widgetProps)
                    .filter(function (key) {
                        return iScope.widgetProps[key].type === 'event';
                    })
                    .forEach(function (evt) {
                        var overrideFlg = false,
                            fn,
                            getParentMethod,
                            eleParent;
                        if (!attrs[evt]) {
                            return;
                        }
                        if (attrs[evt] === ('goToPage-' + $routeParams.name)) {
                            element.addClass('active');
                            if (iScope._widgettype === 'wm-anchor') {
                                eleParent = element.parent();
                                if (eleParent && eleParent.hasClass('app-nav-item')) {
                                    eleParent.addClass('active');
                                }
                            }
                        }
                        fn = attrs[evt]
                            .split(";")
                            .map(function (fnName) {
                                var trimmedFnName = fnName.trim(),
                                    isAnchor = false;
                                if (trimmedFnName.length && fnName.indexOf('(') === -1 && fnName.indexOf('=') === -1) {
                                    overrideFlg = true;

                                    if (element.is('a')) {
                                        isAnchor = true;
                                    }
                                    return '$root._handleAppCustomEvent(iScope, scope, ' + isAnchor + ', $event, "' + trimmedFnName + '")';
                                }
                                return trimmedFnName;
                            })
                            .join(';');

                        //override the functions
                        if (overrideFlg) {
                            getParentMethod = $parse(fn);
                            iScope[evt] = function (locals) {
                                locals = locals || {};
                                locals.iScope = iScope;
                                locals.scope = element.scope();
                                return getParentMethod(scope, locals);
                            };
                        }
                    });
            }

            function onWatchExprValueChange(iScope, scope, key, watchExpr, newVal) {
                iScope[key + '__updateFromWatcher'] = true;
                if (WM.isDefined(newVal) && newVal !== null && newVal !== '') {
                    /*Check if "newVal" is a Pageable object.*/
                    if (WM.isObject(newVal) && Utils.isPageable(newVal)) {
                        /*Check if the scope is configured to accept Pageable objects.
                         * If configured, set the newVal.
                         * Else, set only the content.*/
                        if (iScope.allowPageable) {
                            iScope[key] = newVal;
                        } else {
                            iScope[key] = newVal.content;
                        }
                    } else {
                        iScope[key] = newVal;
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
                    iScope[key] = (iScope.widgetid || (CONSTANTS.isStudioMode && (scope.partialcontainername || scope.prefabname))) ? watchExpr : '';
                }
            }

            function binddatavalue_setter(iScope, scope, ws, key, bindKey, val) {
                var fn = iScope._watchers[key], watchExpr, listenerFn,
                    acceptedTypes,
                    acceptsArray;

                ws[bindKey] = val;

                Utils.triggerFn(fn);

                /* if property is bound to a variable/widget, watch on it */
                if (val) {
                    watchExpr = val.replace('bind:', '');

                    listenerFn = onWatchExprValueChange.bind(undefined, iScope, scope, key, watchExpr);

                    acceptedTypes = iScope.widgetProps[key].type;
                    acceptsArray = _.includes(acceptedTypes, 'array');

                    iScope._watchers[key] = BindingManager.register(scope, watchExpr, listenerFn, {'deepWatch': true, 'allowPageable': iScope.allowPageable, 'acceptsArray': acceptsArray});
                } else {
                    iScope._watchers[key] = undefined;
                    iScope[key] = '';
                }
            }

            function datavalue_setter(iScope, element, attrs, key, bindKey, val) {
                /* if the property is bound, add watcher on bind-property */
                var modifiedVal = val, temp;

                if (!iScope[key + '__updateFromWatcher']) {
                    Utils.triggerFn(iScope._watchers[key]);
                } else {
                    iScope[key + '__updateFromWatcher'] = false;
                }

                if (Utils.stringStartsWith(val, 'bind:')) {
                    iScope[bindKey] = val;
                    return;
                }

                if (element.is('select') && attrs.multiple) {
                    // convert the comma separated list into array and update _model_
                    modifiedVal = val.split(',').map(function (opt) {return ('' + opt).trim(); });

                } else if (element.is('input[type="number"]') || element.is('.app-currency') || element.is('.app-slider')) {
                    temp = +val; // convert the value to number and update the scope property
                    if (isNaN(temp)) {
                        temp = 0;
                    }
                    modifiedVal = temp;
                } else if (element.is('input[type="checkbox"]')) {
                    if (!iScope.checkedvalue) {
                        modifiedVal = val === 'true' || val === true;
                    }
                }
                iScope._model_ = modifiedVal;
                Utils.triggerFn(iScope._onChange);
            }

            function bindproperty_setter(iScope, scope, ws, key, bindKey, val) {
                var fn = iScope._watchers[key], watchExpr, listenerFn,
                    acceptedTypes,
                    acceptsArray;

                ws[bindKey] = val;
                Utils.triggerFn(fn);

                if (val) {
                    watchExpr = val.replace('bind:', '');
                    listenerFn = onWatchExprValueChange.bind(undefined, iScope, scope, key, watchExpr);

                    acceptedTypes = iScope.widgetProps[key].type;
                    acceptsArray = _.includes(acceptedTypes, 'array');

                    iScope._watchers[key] = BindingManager.register(scope, watchExpr, listenerFn, {'deepWatch': true, 'allowPageable': iScope.allowPageable, 'acceptsArray': acceptsArray});
                } else {
                    iScope._watchers[key] = undefined;
                    if (key === 'show') {
                        iScope[key] = true;
                    } else {
                        iScope[key] = '';
                    }
                }
            }

            function property_setter(iScope, scope, element, attrs, props, ws, key, bindKey, isBindableProperty, newVal) {
                var oldVal = ws[key], numVal;

                if (isBindableProperty) {
                    if (!iScope[key + '__updateFromWatcher']) {
                        Utils.triggerFn(iScope._watchers[key]);
                    } else {
                        iScope[key + '__updateFromWatcher'] = false;
                    }

                    if (WM.isString(newVal)) {
                        if (Utils.stringStartsWith(newVal, 'bind:')) {
                            iScope[bindKey] = newVal;
                            return;
                        }
                    }
                }

                if (props.type === 'boolean') {
                    if (isBooleanAttr(key)) {
                        newVal = newVal === key || newVal === true || newVal === 'true';
                    } else {
                        newVal = newVal === true || newVal === 'true';
                    }
                } else if (props.type === 'number') {
                    numVal = +newVal;
                    if (key === 'fontsize') {
                        if (WM.isString(newVal) && newVal.trim().length !== 0) {
                            newVal = numVal;
                        }
                    } else {
                        newVal = +newVal;
                    }
                }

                /*When both "oldVal" and "newVal" are objects/arrays, comparison is not done.*/
                if ((newVal === oldVal) && !(WM.isObject(newVal) && WM.isObject(oldVal))) {
                    return;
                }

                /* if the name is changed, update the tree and registry of the Widgets service */
                if (key === 'name') {
                    if (attrs.widgetid) { // widget is insde the canvas
                        $rootScope.$emit('name-change', attrs.widgetid, newVal, oldVal, iScope);
                    } else if (scope.Widgets) { // widget may be inside canvas inside a page container or in run mode.
                        scope.Widgets[attrs.name] = iScope;
                    }
                }

                ws[key] = newVal;

                WidgetUtilService.onScopeValueChangeProxy(iScope, element, attrs, key, newVal, oldVal);
            }

            function processEventAttr(iScope, attrs, attrName) {
                var evtName = attrName.substring('3'), /* extract the event name from the attr name */
                    onEvtName = 'on' + evtName.charAt(0).toUpperCase() + evtName.substring(1), /* prepend the event name with "on" eg, 'click' with on --> onClick */
                    fnNamesKey = evtName + 'FnNames';

                /*
                 * save the list of fnNames to be executed.
                 * i.e, if on-click="f1();f2();" then isolateScope.clickFnNames = ['f1', 'f2']
                 * */
                iScope[fnNamesKey] = [];

                /* find the function names from the attribute value and store them in an array */
                attrs[onEvtName]
                    .split(';')
                    .forEach(function (token) {
                        token = token.trim();
                        if (token.length) {
                            var index = token.indexOf('(');
                            if (index >= 0) {
                                token = token.substring(0, token.indexOf("("));
                            }
                            iScope[fnNamesKey].push(token);
                        }
                    });
            }

            function isInterpolated(propValue) {
                return propValue.charAt(0) === '{' && propValue.charAt(1) === '{';
            }

            function watchProperty(iScope, attrs, attrName) {
                attrs.$observe(attrName, function (newValue) {
                    iScope[attrName] = newValue;
                });
            }

            function processAttr(iScope, scope, attrs, widgetProps, attrName, attrValue) {
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
                        iScope._initState[attrName] = propValue;
                    } else {
                        // if the resource to be loaded is from a prefab
                        if (scope.prefabname && Utils.stringStartsWith(propValue, 'resources/')) {
                            if (CONSTANTS.isRunMode) {
                                propValue = './app/prefabs/' + scope.prefabname + '/' + propValue;
                            } else {
                                propValue = 'services/prefabs/' + scope.prefabid + '/files/webapp/' + propValue;
                            }
                            iScope._initState[attrName] = propValue;
                        } else {
                            /* if the value is other than class read it from the attrs, which will have resolved interpolated values */
                            if (isInterpolated(propValue)) {
                                watchProperty(iScope, attrs, attrName);
                            } else {
                                iScope._initState[attrName] = attrs[attrName];
                            }
                        }
                    }
                } else {
                    /* attributes which not part of widgetProps like wigetid, widgettype will be handled here. */

                    if (isInterpolated(propValue)) {
                        watchProperty(iScope, attrs, attrName);
                    } else {
                        iScope[attrName] = attrs[attrName];
                    }
                }
            }

            function processAttrs(iScope, scope, tElement, attrs) {
                var widgetProps = iScope.widgetProps;
                sliceFn.call(tElement.context.attributes)
                    .forEach(function (attr) {
                        var attrName = attr.name,
                            attrValue = attr.value.trim(),
                            attrNameInCamelCase,
                            fn;

                        if (attrName.indexOf('on-') === 0) {
                            if (attrs.widgetid) { // widget is inside canvas
                                processEventAttr(iScope, attrs, attrName);
                            } else {
                                attrNameInCamelCase = Utils.camelCase(attrName);
                                fn = $parse(attrs[attrNameInCamelCase]);
                                iScope[attrNameInCamelCase] = function (locals) {
                                    return fn(scope, locals);
                                };
                            }

                        } else {
                            if (attrs.hasOwnProperty(attrName) && !iScope.$$isolateBindings[attrName]) {
                                processAttr(iScope, scope, attrs, widgetProps, attrName, attrValue);
                            }
                        }
                    });
            }

            function deregisterWatchersOniScope(iScope) {
                Object
                    .keys(iScope._watchers)
                    .forEach(function (key) {
                        Utils.triggerFn(iScope._watchers[key]);
                    });
            }

            return {
                'restrict': 'A',
                'compile': function (tElement) {
                    return {
                        pre: function (tScope, element, attrs) {
                            var iScope = element.isolateScope(),
                                hasModel = attrs.hasOwnProperty('hasModel'),
                                hasDataValue,
                                isBindableProperty,
                                datavalue_value,
                                ws,
                                scope = element.scope(),
                                scopeVarName;

                            if (!iScope || !iScope.widgetProps) {
                                return;
                            }

                            iScope.propertyManager = new PropertyManager();

                            ws = iScope._widgetState = {};
                            /* widgetState : private variable to scope. */
                            iScope._watchers = {};

                            iScope.$on('$destroy', deregisterWatchersOniScope.bind(undefined, iScope));
                            /*Register a watch on the element for destroy and destroy the scope.
                            In some cases such as tabs, the tab-content couldn't be destroyed from isolateScope if the parent tabs was destroyed first*/
                            if (attrs.widgetid) {
                                element.on('$destroy', iScope.$destroy.bind(iScope));
                            } else {
                                iScope._widgettype = tElement.context.tagName.toLowerCase();
                            }
                            iScope._initState = {};

                            if (hasModel && !attrs.widgetid) {
                                scopeVarName = tElement.context.attributes.scopedatavalue;
                                scopeVarName = scopeVarName && scopeVarName.value;
                                if (scopeVarName && isInterpolated(scopeVarName)) {
                                    attrs.$observe('scopedatavalue', function (newValue) {
                                        WidgetUtilService.injectModelUpdater(element, newValue);
                                    });
                                } else {
                                    WidgetUtilService.injectModelUpdater(element, scopeVarName);
                                }
                            }

                            /* initialize setters and getters */

                            if (CONSTANTS.isStudioMode) {
                                WM.extend(iScope.widgetProps, {'active': {}});
                            }

                            Object.keys(iScope.widgetProps)
                                .forEach(function (key) { /* properties supported by widget */

                                    var bindKey,
                                        props = iScope.widgetProps[key];

                                    if (iScope.$$isolateBindings[key] || props.type === 'event') {
                                        return;
                                    }

                                    bindKey = 'bind' + key;


                                    /* special case for binding dataValue attribute to _model_ */
                                    if (hasModel && key === 'datavalue') {
                                        Object.defineProperty(iScope, bindKey, {
                                            get: function () {
                                                return ws[bindKey];
                                            },
                                            set: binddatavalue_setter.bind(undefined, iScope, scope, ws, key, bindKey)
                                        });

                                        Object.defineProperty(iScope, key, {
                                            get: function () {
                                                return iScope._model_;
                                            },
                                            set: datavalue_setter.bind(undefined, iScope, element, attrs, key, bindKey)
                                        });
                                        return;
                                    }

                                    isBindableProperty = props.bindable === 'in-bound' || props.bindable === 'in-out-bound';
                                    if (isBindableProperty) {
                                        Object.defineProperty(iScope, bindKey, {
                                            get: function () {
                                                return ws[bindKey];
                                            },
                                            set: bindproperty_setter.bind(undefined, iScope, scope, ws, key, bindKey)
                                        });
                                    }

                                    Object.defineProperty(iScope, key, {
                                        get: function () {
                                            return ws[key];
                                        },
                                        set: property_setter.bind(undefined, iScope, scope, element, attrs, props, ws, key, bindKey, isBindableProperty)
                                    });

                                    /* set the default value */
                                    if (WM.isDefined(props.value)) {
                                        iScope._initState[key] = props.value;
                                    }
                                });

                            processAttrs(iScope, scope, tElement, attrs);

                            /* remove the datavalue property from scope and store it temporarily, so that all dependencies are intialized first */
                            if (iScope._initState.hasOwnProperty('datavalue')) {
                                hasDataValue = true;
                                datavalue_value = iScope._initState.datavalue;
                                delete iScope._initState.datavalue;
                            }

                            Object.keys(iScope._initState)
                                .forEach(function (key) {
                                    var value = iScope._initState[key];

                                    // set the value in scope;
                                    iScope[key] = value;
                                });

                            /* if element has datavalue, populate it into the isolateScope */
                            if (hasDataValue) {
                                iScope.datavalue = datavalue_value;
                            }

                            if (CONSTANTS.isRunMode) {
                                overrideEventHandlers(iScope, scope, element, attrs);
                            }
                        }
                    };
                }
            };
        }])

    /**
     * @ngdoc service
     * @name wm.widgets.$WidgetUtilService
     * @description
     * The `WidgetUtilService` provides utility methods for the widgets
     */
    .service('WidgetUtilService', ['$parse', '$rootScope', 'CONSTANTS', 'Utils', '$templateCache',
        function ($parse, $rootScope, CONSTANTS, Utils, $templateCache) {
            "use strict";

            var deviceSizeArray = {
                "all": {
                    "class": '',
                    "classToRemove": ["visible-xs-", "visible-sm-", "visible-md-", "visible-lg-"]
                },
                "xs": {
                    "class": "visible-xs-"
                },
                "sm": {
                    "class": "visible-sm-"
                },
                "md": {
                    "class": "visible-md-"
                },
                "lg": {
                    "class": "visible-lg-"
                }
            },
                EventsMap = {
                    'onClick':          {'name': 'data-ng-click',       'value': 'onClick({$event: $event, $scope: this})'},
                    'onDblclick':       {'name': 'data-ng-dblclick',    'value': 'onDblclick({$event: $event, $scope: this})'},
                    'onMouseenter':     {'name': 'data-ng-mouseenter',  'value': 'onMouseenter({$event: $event, $scope: this})'},
                    'onMouseleave':     {'name': 'data-ng-mouseleave',  'value': 'onMouseleave({$event: $event, $scope: this})'},
                    'onMouseover':      {'name': 'data-ng-mouseover',   'value': 'onMouseover({$event: $event, $scope: this})'},
                    'onMouseout':       {'name': 'data-ng-mouseout',    'value': 'onMouseout({$event: $event, $scope: this})'},

                    'onFocus':          {'name': 'data-ng-focus',       'value': 'onFocus({$event: $event, $scope: this})'},
                    'onBlur':           {'name': 'data-ng-blur',        'value': 'onBlur({$event: $event, $scope: this})'},

                    'onSwipeup':        {'name': 'hm-swipe-up',         'value': 'onSwipeup({$event: $event, $scope: this})'},
                    'onSwipedown':      {'name': 'hm-swipe-down',       'value': 'onSwipedown({$event: $event, $scope: this})'},
                    'onSwipeleft':      {'name': 'hm-swipe-left',       'value': 'onSwipeleft({$event: $event, $scope: this})'},
                    'onSwiperight':     {'name': 'hm-swipe-right',      'value': 'onSwiperight({$event: $event, $scope: this})'},
                    'onPinchin':        {'name': 'hm-pinch-in',         'value': 'onPinchin({$event: $event, $scope: this})'},
                    'onPinchout':       {'name': 'hm-pinch-out',        'value': 'onPinchout({$event: $event, $scope: this})'}
                },
                triggerFn;

            function cleanupMarkup(element) {
                var attrsToBeRemoved = "data-ng-style data-ng-change data-ng-click data-ng-dblclick data-ng-mouseout data-ng-mouseover data-ng-blur data-ng-focus" +
                    " data-ng-show data-ng-hide data-ng-readonly data-ng-disabled data-ng-required data-ng-attr-placeholder ng-attr-name" +
                    " on-change on-focus on-blur on-click on-dblclick on-mouseover on-mouseout on-rowclick on-columnselect on-columndeselect";
                element.find('*').removeAttr(attrsToBeRemoved);
                element.removeAttr(attrsToBeRemoved);
            }

            function onScopeValueChangeProxy(scope, element, attrs, key, newVal, oldVal) {
                if (key === "placeholder" || key === "type") {
                    if (element.is('input') || element.is('textarea')) {
                        attrs.$set(key, newVal);
                    } else {
                        element.find('input').attr(key, newVal);
                    }
                } else if (key === "backgroundimage") {
                    scope.picturesource = Utils.getBackGroundImageUrl(newVal);
                } else if (key === "backgroundcolor") {
                    /* setting background image as none when background color is set. This is done because background
                    gradients are set as background image and have precedence over background color.*/
                    if (!scope.picturesource) {
                        scope.picturesource = 'none';
                    }
                } else if (key === "class") {
                    element.removeClass(oldVal).addClass(newVal);
                } else if (key === "name") {
                    attrs.$set("name", newVal);
                } else if (key === "showindevice") {
                    /*Apply the corresponding classes only in runMode*/
                    if (CONSTANTS.isRunMode) {
                        var newValues = newVal ? newVal.split(',') : newVal;
                        if (WM.element.inArray("all", newValues) === 0) {
                            WM.forEach(deviceSizeArray.all.classToRemove, function (device) {
                                element.removeClass(device + scope.widgetProps.showindevice.displaytype || 'block');
                            });
                        } else {
                            /*If others are selected, add classes accordingly */
                            WM.forEach(newValues, function (value) {
                                element.addClass(deviceSizeArray[value].class + (scope.widgetProps.showindevice.displaytype || 'block'));
                            });
                        }
                    }
                } else if (key === "animation") {
                    /*add the animated class only in the run mode since it will break the ui in design mode*/
                    if (CONSTANTS.isRunMode) {
                        element.addClass("animated " + newVal);
                    }
                }

                triggerFn = Utils.triggerFn;

                scope.propertyManager
                    .get(scope.propertyManager.ACTIONS.CHANGE)
                    .forEach(function (handler) {
                        var notifyFor = handler.notifyFor;
                        if ((notifyFor && notifyFor[key]) || !notifyFor) {
                            triggerFn(handler, key, newVal, oldVal);
                        }
                    });
            }

            /*
             This method will handle the initialization stuff when called from widget's (directive) post method.
             1. assign a name to a widget
             2. cleanupMarkup -- removes few attributes from the markup
             3. triggers onScopeValueChange function for the initial state of the widget(default values and attributes specified on the element).
             */
            function postWidgetCreate(scope, element, attrs) {
                cleanupMarkup(element);

                if (!scope || !scope._initState) {
                    return;
                }

                function triggerInitValueChange() {
                    Object.keys(scope._initState)
                        .forEach(function (key) {
                            var value = scope[key];
                            if (WM.isDefined(value)) {
                                onScopeValueChangeProxy(scope, element, attrs, key, value);
                            }
                        });
                    scope._isInitialized = true;
                    Utils.triggerFn(scope.onReady, scope, element, attrs);
                }

                triggerInitValueChange();
            }

            /* find the scope of the controller using the scope passed */
            function findCtrlScope(scope) {
                /*for unit test cases, scope is rootScope, so in that case, we return*/
                if (scope.ctrlScope || scope.$id === $rootScope.$id) {
                    /* able to find ctrlScope from scope */
                    return;
                }

                var tScope = scope;
                do {
                    tScope = tScope.$parent;
                    if (tScope.ctrlScope) { /* found the ctrlScope */
                        scope.ctrlScope = tScope.ctrlScope;
                        /* save a reference to ctrlScope in scope */
                        break;
                    }
                } while (tScope.$id !== $rootScope.$id);
                /* loop exit condition */
            }

            /* when the model is provided, this function will create a two way binding between model(controller's scope) and view(input element) */
            function injectModelUpdater(element, model) {

                var isolateScope = element.isolateScope(), /* reference to the isolateScope of the element */
                    ctrlScope = element.scope(), /* reference to the scope which inherits from the controller */
                    _model,
                    dotIdx,
                    braceIdx,
                    idx,
                    name;


                if (model) { /* if the model is provided as an attribute on element parse it */
                    _model = $parse(model);
                    /* using _model we will be able to update the model in the controller */
                }

                /* not able to access ctrlScope from tScope(element.scope()). let me try to find it. */
                if (!ctrlScope.ctrlScope) {
                    findCtrlScope(ctrlScope);
                }

                if (!ctrlScope.ctrlScope) {
                    return;
                    /* not able to find the ctrlScope */
                }

                if (model) {
                    dotIdx = model.indexOf(".");
                    braceIdx = model.indexOf("[");
                    if (dotIdx === -1 && braceIdx === -1) {
                        /* model is provided with a variable name eg. model = x, we need to update in the controller directly */
                        ctrlScope = ctrlScope.ctrlScope;
                        /* refer to the scope of controller */
                    } else {
                        /* model might be provided as obj.variable name or obj[key] */
                        if (braceIdx === -1) {
                            idx = dotIdx;
                            /* dot is present in the model value*/
                        } else if (dotIdx === -1) {
                            idx = braceIdx;
                            /* brace is present in the model value*/
                        } else {
                            /* both dot and brace are present i.e a.b[x] */
                            idx = Math.min(dotIdx, braceIdx);
                            /* extract the object name from the model */
                        }
                        if (idx > 0) {
                            /* if the object specified is not defined in the controller's scope. create a new object with the extracted name */
                            name = model.substring(0, idx);
                            /* name of the object to be created */
                            if (!WM.isDefined(ctrlScope.ctrlScope[name])) { /* object is not defined in controller's scope */

                                /*
                                 * we will always define a Object ie. {} if the controller's scope doesn't have it.
                                 * if other than Object is expected i.e, Array, user must initialize it in controller's scope
                                 */
                                ctrlScope.ctrlScope[name] = {};
                                /* define the object in controller's scope */
                            }

                            if (WM.isUndefined(ctrlScope[name])) { /* not able to access object from ctrlScope */
                                Object.defineProperty(ctrlScope, name, {
                                    get: function () {
                                        return ctrlScope.ctrlScope[name];
                                        /* whenever object is accessed from scope, read it from controller's scope and return */
                                    }
                                });
                            }
                        }
                    }
                }

                /* this method will update the view value in the controller's scope */
                function updateModel() {
                    /*if (element.hasClass('app-calendar')) {
                        *//* if model for Calendar or Date widget and model is a valid date, update the model with the primitive value
                         * else make it undefined *//*
                        var formattedDate = new Date(isolateScope._model_);
                        isolateScope._model_ = $filter('date')(formattedDate, isolateScope.datepattern);
                    }*/

                    if (_model && ctrlScope) {
                        /* update the model value in the controller if the controller scope is available */
                        _model.assign(ctrlScope, isolateScope._model_);
                    }
                }

                /* _onChange is a wrapper fn for onChange. */
                isolateScope._onChange = function ($event) {
                    updateModel();
                    /* update the view value in the controller */
                    if (isolateScope.onChange && isolateScope._isInitialized) {
                        isolateScope.onChange({$event: $event, $scope: isolateScope});
                        /* trigger the onChange fn */
                    }
                };

                /* update the view value when the model is updated */
                if (model && ctrlScope) {
                    /* watch the model */

                    isolateScope.$on('$destroy', ctrlScope.$watch(model, function (newVal) {
                        if (isolateScope._model_ === newVal) {
                            return;
                        }

                        /* update the view value if the model is updated */
                        isolateScope._model_ = newVal;

                    }, true));
                }

            }

            /*Function that returns all the internal object keys in the bound dataset*/
            function extractDataSetFields(dataset, propertiesMap, sort) {
                var columns = [],
                    columnDefs,
                    properties;
                /*In case of live variable getting the properties map*/
                if (dataset && propertiesMap) {
                    columns = Utils.fetchPropertiesMapColumns(propertiesMap);
                    properties = [Utils.resetObjectWithEmptyValues(columns)];
                    columns = Object.keys(properties[0]);
                } else {
                    columnDefs = Utils.prepareFieldDefs(dataset, null, false, true);
                    columnDefs.forEach(function (columnDef) {
                        columns.push(columnDef.field);
                    });
                }
                if (sort) {
                    columns = columns.sort();
                }
                return columns;
            }

            function addEventAttributes($template, tAttrs) {

                if (tAttrs.widgetid) { // widget is inside canvas
                    return;
                }

                Object.keys(EventsMap).forEach(function (evtName) {
                    var evtDetails = EventsMap[evtName];
                    if (tAttrs[evtName]) {
                        $template.attr(evtDetails.name, evtDetails.value);
                    }
                });

                return $template;
            }

            function getPreparedTemplate(templateId, tElement, tAttrs) {
                var isInsideCanvs = tAttrs.widgetid,
                    template,
                    $template;

                template =  $templateCache.get(templateId);

                if (isInsideCanvs) {
                    return template;
                }

                $template = WM.element(template);
                addEventAttributes($template, tAttrs);

                return $template[0].outerHTML;
            }

            function registerPropertyChangeListener(listener, iScope, notifyFor) {
                listener.notifyFor = notifyFor;
                /* register the property change handler */
                iScope.propertyManager.add(iScope.propertyManager.ACTIONS.CHANGE, listener);
            }

            function getObjValueByKey(obj, strKey) {
                /* check for the key-string */
                if (strKey) {
                    var val;
                    /* convert indexes to properties, so as to work for even 'key1[0].child1'*/
                    strKey.replace(/\[(\w+)\]/g, '.$1').split('.').forEach(function (key) {
                        val = (val && val[key]) || obj[key];
                    });
                    return val;
                }
                return obj;
            }

            function getDisplayFieldData(scope, option, displayField) {
                /* if displayExpression is set*/
                if (scope.binddisplayexpression) {
                    /*remove 'bind:' prefix from the binded displayExpression*/
                    displayField = scope.binddisplayexpression.replace("bind:", "");
                    /* parse the displayExpression for replacing all the expressions with values in the object */
                    return scope.$eval(displayField.replace(/\$\[(\w)+(\w+(\[\$i\])?\.+\w+)*\]/g, function (expr) {
                        var val;
                        /*remove '$[' prefix & ']' suffix from each expression pattern */
                        expr = expr.replace(/[\$\[\]]/gi, '');
                        /*split to get all keys in the expr*/
                        expr.split('.').forEach(function (key) {
                            /* get the value for the 'key' from the option first & then value itself,
                             * as it will be the object to scan
                             * */
                            val = (val && val[key]) || option[key];
                            /*if val is a string, append single quotes to it */
                            if (WM.isString(val)) {
                                val = "'" + val + "'";
                            }
                        });
                        /* return val to the original string*/
                        return val;
                    }));
                }
                /*If any column of the option object is present in the display expression,
                 replace it with the option value*/
                if (scope.displayexpression) {
                    return Utils.getDisplayExprValue(option, scope.displayexpression, scope);
                }
                /*return just the displayField from the option object, if displayExpr is not set*/
                return getObjValueByKey(option, displayField);
            }

            return {

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#postWidgetCreate
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * This method will handle the initialization stuff when called from widget's (directive) post method.
                 * 1. assign a name to a widget
                 * 2. cleanupMarkup -- removes few attributes from the markup
                 */
                postWidgetCreate: postWidgetCreate,

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#injectModelUpdater
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * when the model is provided, this function will create a two way binding between model(controller's scope) and view(input element)
                 */
                injectModelUpdater: injectModelUpdater,

                onScopeValueChangeProxy: onScopeValueChangeProxy,

                extractDataSetFields: extractDataSetFields,


                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#getPreparedTemplate
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * returns the widget template after adding event related attributes
                 */
                getPreparedTemplate: getPreparedTemplate,

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#registerPropertyChangeListener
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * registers a property change listener
                 */
                registerPropertyChangeListener: registerPropertyChangeListener,

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#getObjValueByKey
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * Returns the value for the provided key in the object
                 */
                getObjValueByKey: getObjValueByKey,

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#getDisplayFieldData
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * returns the display field data for select, radioboxset and checkboxset widgets
                 * Based on the bind display expression or display expression or display name,
                 * data is extracted and formatted from the passed option object
                 */
                getDisplayFieldData: getDisplayFieldData
            };
        }])

    /**
     * @ngdoc service
     * @name wm.widgets.$Widgets
     * @description
     * The `Widgets` provides utility methods for the accessing the scope of the widgets.
     */
    .service('Widgets', ["$rootScope", 'wmToaster', 'CONSTANTS',
        function ($rootScope, wmToaster, CONSTANTS) {
            "use strict";

            var registry = {}, /* widgetId - scope map */
                nameIdMap = {}, /* name - widgetId map */
                returnObj = {};
            /* return value of the Widgets service */

            /* returns the scope of the widget by widgetId */
            function byId(widgetId) {
                return registry[widgetId];
            }

            /* returns the scope of the widget by name */
            function byName(name) {
                return byId(nameIdMap[name]);
            }

            function byType(types) {
                /* if type not provided, return all widgets */
                if (!types) {
                    return registry;
                }

                /* if comma separated types are provided, make it an array*/
                if (typeof types === "string") {
                    /* if form-widgets required */
                    if (types === "form-widgets") {
                        types = ["wm-label",
                            "wm-text",
                            "wm-checkbox",
                            "wm-checkboxset",
                            "wm-radio",
                            "wm-radioset",
                            "wm-textarea",
                            "wm-select",
                            "wm-button",
                            "wm-picture",
                            "wm-anchor",
                            "wm-date",
                            "wm-calendar",
                            "wm-time",
                            "wm-datetime",
                            "wm-currency",
                            "wm-colorpicker",
                            "wm-slider",
                            "wm-fileupload",
                            "wm-grid",
                            "wm-livefilter",
                            "wm-livelist",
                            "wm-datanavigator",
                            "wm-html",
                            "wm-prefab",
                            "wm-richtexteditor",
                            "wm-search",
                            "wm-menu",
                            "wm-switch",
                            "wm-nav",
                            "wm-tree",
                            "wm-liveform"
                            ];
                    } else if (types === 'page-container-widgets') {
                        types = [
                            'wm-accordionpane',
                            'wm-container',
                            'wm-panel',
                            'wm-tabcontent',
                            'wm-footer',
                            'wm-header',
                            'wm-left-panel',
                            'wm-right-panel',
                            'wm-top-nav'
                        ];
                    } else {
                        types = types.split(",");
                    }
                }

                var collection = {};

                WM.forEach(types, function (type) {
                    type = type.trim();
                    WM.forEach(registry, function (widget) {
                        if (widget.widgettype === type) {
                            collection[widget.name] = widget;
                        }
                    });
                });
                return collection;
            }

            /* checks for the unique constraint of the name, if the given name is not used returns true else false */
            function isValidName(name) {
                var isValid = true, errMsgTitle, errMsgDesc;

                /* isEmpty? */
                if (!name) {
                    isValid = false;
                    errMsgTitle = "MESSAGE_ERROR_INVALID_WIDGETNAME_TITLE";
                    errMsgDesc = "MESSAGE_ERROR_INVALID_WIDGETNAME_DESC";
                } else if (nameIdMap[name]) { /* check for duplicate name */
                    isValid = false;
                    errMsgTitle = "MESSAGE_ERROR_DUPLICATE_WIDGETNAME_TITLE";
                    errMsgDesc = "MESSAGE_ERROR_DUPLICATE_WIDGETNAME_DESC";
                }

                /* name is not valid, show the error message */
                if (!isValid) {
                    wmToaster.show("error", $rootScope.locale[errMsgTitle], $rootScope.locale[errMsgDesc]);
                }

                return isValid;
            }

            /* checks if the widget name already exists */
            function isExists(name) {
                var isExists = false;
                /* check for the name */
                if (nameIdMap[name]) {
                    isExists = true;
                }
                return isExists;
            }

            /* this is a private method to the Widgets service. This function unregisters the widget by its name. So that we can re-use the name */
            function unregister(name) {
                var widgetId = nameIdMap[name];

                delete registry[widgetId];
                /* delete the entry from the registry */
                delete nameIdMap[name];
                /* delete the entry from the nameIdMap */
            }

            /* byId, byName, isValidName methods will be exposed by this service */

            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#byId
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * returns the scope of the widget by widgetid
             */
            returnObj.byId = byId;

            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#byName
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * returns the scope of the widget by name
             */
            returnObj.byName = byName;

            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#isValidName
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * checks for the unique constraint of the name, if the given name is not used returns true else false
             */
            returnObj.isValidName = isValidName;

            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#isExists
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * checks for the widget with the provided name, if the widget exists return true else false
             */
            returnObj.isExists = isExists;
            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#byType
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * returns an array of scopes of widgets of specified type(returns all if no type specified)
             */
            returnObj.byType = byType;

            /* listen for the changes in name and update the registry accordingly */
            $rootScope.$on("name-change", function (evt, widgetId, newName, oldName, scope) {

                /* process only canvas widgets in STUDIO mode (assumption: only widgets in canvas will have widgetId) */
                if (CONSTANTS.isStudioMode && !widgetId) {
                    return;
                }

                delete nameIdMap[oldName];
                /* delete the entry with old name */
                delete returnObj[oldName];
                /* delete the name entry from the service */

                /*In run mode we do not have the widgetId hence using the newName*/
                widgetId = widgetId || newName;

                nameIdMap[newName] = widgetId;
                /* update the new name value with the widgetId */

                registry[widgetId] = scope;

                /* define a property with the name on service. with this users will be able to access a widget by its name. e.b, Widgets.test */
                Object.defineProperty(returnObj, newName, {
                    configurable: true,
                    get: function () {
                        return byName(newName);
                    }
                });

                /* unregister the widget when it is deleted or when the scope is destroyed */
                scope.$on("$destroy", function () {
                    unregister(scope.name);
                });
            });

            return returnObj;
        }])

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
