/*global WM, document, window, _ , $ */
/*jslint todo: true */

/* adding events and event options as constants*/
WM.module('wm.widgets.base', [])
    .constant('WIDGET_CONSTANTS', {
        //This list will be extended with variable types in baseService
        EVENTS: {
            'NO_EVENT': 'No Event',
            'JAVASCRIPT': 'Javascript',
            'STOP_PROPAGATION': 'Stop Propagation',
            'STOP_PROP_FN': '$event.stopPropagation()'
        },
        EVENTS_OPTIONS: ['No Event', 'Javascript', 'Stop Propagation'],
        NAVIGATION_TYPE: {
            'BASIC'    : 'Basic',
            'CLASSIC'  : 'Classic',
            'ADVANCED' : 'Advanced',
            'SCROLL'   : 'Scroll',
            'INLINE'   : 'Inline',
            'PAGER'    : 'Pager',
            'ONDEMAND' : 'On-Demand'
        }
    })
    .run(['$parse', function ($parse) { // Swipey Plugin: $parse service is used as expressionEvaluator
        'use strict';

        if ($.fn.swipeAnimation) {
            $.fn.swipeAnimation.expressionEvaluator = $parse;
        }
    }])

    /**
     * @ngdoc service
     * @name wm.widgets.$PropertiesFactory
     * @description
     * The `PropertiesFactory` contains properties of all the widgets in the studio and
     * provides utility methods for getting a specific widget's property

     * NOTE: an attribute 'getTypeFrom' for some properties is utilized by binding dialog(bindTreeUtils.js) to determine the resultant type for the property dynamically
     * the property's type can be dependent on
     *  - another property, e.g. for grid, 'selecteditem' property's type is dependent on the 'dataset' property
     *  - an expression, can be defined and evaluated in the isolateScope of widget.
     */
    .factory('PropertiesFactory', ['WIDGET_CONSTANTS', 'CONSTANTS', 'Utils', '$rootScope', function (WIDGET_CONSTANTS, CONSTANTS, Utils, $rs) {
        "use strict";

        var widgetEventOptions = Utils.getClonedObject(WIDGET_CONSTANTS.EVENTS_OPTIONS), /*A copy of the variable to preserve the actual value.*/
            showInDeviceOptions = [{
                'name': $rs.locale.LABEL_ALL,
                'value': 'all'
            }, {
                'name': $rs.locale.LABEL_PROPERTY_MOBILE,
                'value': 'xs'
            }, {
                'name': $rs.locale.LABEL_TABLET_PORTRAIT,
                'value': 'sm'
            }, {
                'name': $rs.locale.LABEL_LAPTOP_TABLET_LANDSCAPE,
                'value': 'md'
            }, {
                'name': $rs.locale.LABEL_LARGE_SCREEN,
                'value': 'lg'
            }],
            columnWidths   = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            daysOptions    = Utils.getDaysOptions(),
            nameRegex      = '^[a-zA-Z_][A-Za-z0-9_]+$',
            numberRegex    = '(^$|[0-9]+$)',
            classRegex     = '(^$|^-?[_a-zA-Z ]+[_a-zA-Z0-9- ]*)$',
            dimensionRegex = '(^$|^(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(em|ex|%|px|cm|mm|in|pt|pc|ch|rem|vh|vw|vmin|vmax)?$)',
            zindexRegex    = '(^$|auto|initial|inherit|^[0-9]+$)',
            maxRatingRegex = '^(?:10|[1-9])$|^bind.*$',
            roles = [],
            matchModes = [{
                    'labelkey': "LABEL_STARTS_WITH_IGNORE_CASE",
                    'value': 'startignorecase'
                },
                {
                    'labelkey': "LABEL_STARTS_WITH",
                    'value': 'start'
                },
                {
                    'labelkey': "LABEL_ENDS_WITH_IGNORE_CASE",
                    'value': 'endignorecase'
                },
                {
                    'labelkey': "LABEL_ENDS_WITH",
                    'value': 'end'
                },
                {
                    'labelkey': "LABEL_CONTAINS_IGNORE_CASE",
                    'value': 'anywhereignorecase'
                },
                {
                    'labelkey': "LABEL_CONTAINS",
                    'value': 'anywhere'
                },
                {
                    'labelkey': "LABEL_IS_EQUAL_WITH_IGNORE_CASE",
                    'value': 'exactignorecase'
                },
                {
                    'labelkey': "LABEL_IS_EQUAL",
                    'value': 'exact'
            }],
            numberFormatOptions = [
                {
                    "namekey": "LABEL_DECIMAL_DIGITS",
                    "name" : "Decimal Digits",
                    "groupOptions" : {
                        ".0f" :  "9",
                        ".1f" : "9.9",
                        ".2f" : "9.99",
                        ".3f" : "9.999"
                    }
                },
                {
                    "namekey": "LABEL_PRECISION",
                    "name" : "Precision",
                    "groupOptions" : {
                        ".1g" : "9e+7",
                        ".2g" : "9.9e+7",
                        ".3g" : "9.99e+7"
                    }
                },
                {
                    "namekey": "LABEL_PERCENTAGE",
                    "name" : "Percentage",
                    "groupOptions" : {
                        "%" : "99%"
                    }
                },
                {
                    "namekey": "LABEL_ROUND_OPTIONS",
                    "name" : "Round Options",
                    "groupOptions" : {
                        ",r"    : "99,999,999",
                        "Thousand" : "Thousand (Eg: 9K)",
                        "Million"  : "Million (Eg: 9M)",
                        "Billion"  : "Billion (Eg: 9B)"
                    }
                }
            ],
            dateOptions = [
                {
                    "name" : "Date",
                    "groupOptions" : {
                        "%x" : "mm/dd/yyyy",
                        "%c" : "Date and Time"
                    }
                },
                {
                    "name" : "Time",
                    "groupOptions" : {
                        "%X" : "Time(%H:%M:%S)",
                        "%H" : "In 24 hours [00-23]",
                        "%I" : "In 12 hours [01-12]",
                        "%M" : "Minutes [00-59]",
                        "%S" : "Seconds [00-59]",
                        "%L" : "MilliSeconds [000, 999]",
                        "%p" : "either AM or PM",
                        "%Z" : "Time zone offset"
                    }
                },
                {
                    "name" : "Day",
                    "groupOptions" : {
                        "%d" : "Zero padded day of month (Eg: 01)",
                        "%e" : "Space padded day of month (Eg:  1)",
                        "%j" : "Day of the year (Eg: 01-31-2016 returns 031)"
                    }
                },
                {
                    "name" : "Week",
                    "groupOptions" : {
                        "%a" : "Abbreviated weekday name (Eg: Wed)",
                        "%A" : "Full weekday name (Eg: Wednesday)",
                        "%U" : "Week number of the year(Sunday first day) (Eg: 01-31-2016 returns 05)",
                        "%W" : "Week number of the year(Monday first day) (Eg: 01-31-2016 returns 04)",
                        "%w" : "Week day[0(Sunday),6]  (Eg: 01-30-2016 returns 6)"
                    }
                },
                {
                    "name" : "Month",
                    "groupOptions" : {
                        "%b" : "Abbreviated month name (Eg: Mar)",
                        "%B" : "Full month name  (Eg: March)",
                        "%m" : "Month number  (Eg: 02) [01-12]"
                    }
                },
                {
                    "name" : "Year",
                    "groupOptions" : {
                        "%y" : "yy (Eg: 16)",
                        "%Y" : "yyyy (Eg: 2016)"
                    }
                }
            ],
            timeGroupOptions = [{"name": "TIME", "groupOptions": {"hour": "hour", "day": "day", "week": "week", "month": "month", "year": "year"}}],
            timeNonGroupOptions = [{"labelkey":"LABEL_ALPHABET", "value": "alphabet"}, {"labelkey":"LABEL_WORD", "value": "word"}],
            PLATFORM_TYPE = {
                WEB      :   'WEB',
                MOBILE   :   'MOBILE',
                DEFAULT  :   'DEFAULT'
            },
            dateTimeTypes = "timestamp, date, time, datetime, string, number",
            animationOptions = [" ", "bounce", "bounceIn", "bounceInDown", "bounceInLeft", "bounceInRight", "bounceInUp", "bounceOut", "bounceOutDown", "bounceOutLeft", "bounceOutRight", "bounceOutUp", "fadeIn", "fadeInDown", "fadeInDownBig", "fadeInLeft", "fadeInLeftBig", "fadeInRight", "fadeInRightBig", "fadeInUp", "fadeInUpBig", "fadeOut", "fadeOutDown", "fadeOutDownBig", "fadeOutLeft", "fadeOutLeftBig", "fadeOutRight", "fadeOutRightBig", "fadeOutUp", "fadeOutUpBig", "flash", "flipInX", "flipInY", "flipOutX", "flipOutY", "hinge", "lightSpeedIn", "lightSpeedOut", "pulse", "rollIn", "rollOut", "rotateIn", "rotateInDownLeft", "rotateInDownRight", "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight", "rubberBand", "shake", "slideInDown", "slideInLeft", "slideInRight", "slideInUp", "slideOutDown", "slideOutLeft", "slideOutRight", "slideOutUp", "swing", "tada", "wobble", "zoomIn", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp", "zoomOut", "zoomOutDown", "zoomOutLeft", "zoomOutRight", "zoomOutUp"],
            spinnerAnimationOptions = [" ", "bounce", "fadeIn", "fadeOut", "flash", "flipInX", "flipInY", "pulse", "shake", "spin", "swing", "tada", "wobble", "zoomIn", "zoomOut"],
            visibilityOptions = ["collapse", "hidden", "initial", "inherit", "visible"],
            displayOptions = ["block", "flex", "inherit", "initial", "inline", "inline-block", "inline-flex", "inline-table", "list-item", "run-in", "table", "table-caption", "table-cell", "table-column", "table-column-group", "table-header-group", "table-footer-group", "table-row", "table-row-group", "none"],
            popoverOptions = [
                {
                    'value': 'top',
                    'label': 'Top'
                },
                {
                    'value': 'bottom',
                    'label': 'Bottom'
                },
                {
                    'value': 'left',
                    'label': 'Left'
                },
                {
                    'value': 'right',
                    'label': 'Right'
                }
            ],
            EVERYONE = "Everyone",
            barcodeFormatOptions = [
                { "label" : "ALL", "value" : "ALL"},
                { "label" : "CODABAR (not supported in iOS)", "value" : "CODABAR"},
                { "label" : "CODE_39", "value" : "CODE_39"},
                { "label" : "CODE_93 (not supported in iOS)", "value" : "CODE_93"},
                { "label" : "CODE_128", "value" : "CODE_128"},
                { "label" : "DATA_MATRIX", "value" : "DATA_MATRIX"},
                { "label" : "EAN_8", "value" : "EAN_8"},
                { "label" : "EAN_13", "value" : "EAN_13"},
                { "label" : "ITF", "value" : "ITF"},
                { "label" : "PDF_417 (not supported in iOS)", "value" : "PDF_417"},
                { "label" : "QR_CODE", "value" : "QR_CODE"},
                { "label" : "RSS14 (not supported in iOS)", "value" : "RSS14"},
                { "label" : "RSS_EXPANDED (not supported in iOS)", "value" : "RSS_EXPANDED"},
                { "label" : "UPC_E", "value" : "UPC_E"},
                { "label" : "UPC_A", "value" : "UPC_A"}],
            result = {
                "properties": {
                    "wm.base": {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "deferload": {"type": "boolean", "value": false, "show": false},
                        "class": {"type": "string", "pattern": classRegex},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'}
                    },

                    "wm.base.editors": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box-model"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontsize": {"type": "number", "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px", "pt"], "value": "px", "hidelabel": true, "widget": "icons-radio"},
                        "textalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"},
                        "fontstyle": {"type": "string", "options": ["italic"], "widget": "toggle-checkbox"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontfamily": {"type": "string", "hint": "Arial, Geneva"},
                        "color": {"type": "string", "widget": "color"}
                    },
                    "wm.base.advancedformwidgets": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"},
                        "margin": {"type": "string", "widget": "box-model"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontsize": {"type": "number", "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px", "pt"], "value": "px", "hidelabel": true, "widget": "icons-radio"},
                        "textalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "widget": "toggle-checkbox"},
                        "fontfamily": {"type": "string", "hint": "Arial, Geneva"},
                        "color": {"type": "string", "widget": "color"},
                        "borderwidth": {"type": "string", "widget": "box-model"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "display": {"type": "list", "options": displayOptions, "show": false}
                    },
                    "wm.base.editors.abstracteditors": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "required": {"type": "boolean", "bindable": "in-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.base.editors.dataseteditors": {
                        "startupdate": {"type": "boolean"},
                        "datafield": {"type": "list", "options": ["All Fields"], "datasetfilter" : "terminals", "allfields" : true},
                        "displayfield": {"type": "list", "options": [""], "datasetfilter" : "terminals"},
                        "displayexpression": {"type": "string", "bindable": "in-bound", "bindonly": "expression"},
                        "displaytype": {"type": "list", "options": ["Currency", "Date", "Number", "Text", "Time"]},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"}
                    },
                    "wm.base.navigation": {
                        "navigation": {"type": "list", "options": ["Basic", "Pager", "Classic"], "value": "Basic"},
                        "showrecordcount": {"type": "boolean"},
                        "maxsize": {"type": "number", "value": 3, "show": false},
                        "boundarylinks": {"type": "boolean", "value": false, "show": false},
                        "forceellipses": {"type": "boolean", "value": true, "show": false},
                        "directionlinks": {"type": "boolean", "value": true, "show": false},
                        "navigationalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "value": "left"}
                    },
                    "wm.base.events": {
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDoubletap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
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

                    "wm.base.events.keyboard": {
                        "onKeypress": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onKeydown": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onKeyup": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
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
                        "textalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "show": false}
                    },
                    "wm.icon": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "iconposition": {"type": "list", "options": ["left", "right"], "value": "left"},
                        "iconclass": {"type": "string", "value": "wi wi-star-border", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconsize": {"type": "string", "pattern": dimensionRegex},
                        "animation": {"type": "list", "options": animationOptions},
                        "color": {"type": "string", "widget": "color"},
                        "opacity": {"type": "string", "widget": "slider"}
                    },
                    "wm.iframe": {
                        "iframesrc": {"type": "string", "bindable": "in-bound", "widget": "string"},
                        "encodeurl": {"type": "boolean", "value": false},
                        "width": {"type": "string", "value": '300px', "pattern": dimensionRegex},
                        "height": {"type": "string", "value": '150px', "pattern": dimensionRegex},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all"}
                    },
                    "wm.dynamicstyles": {
                        "conditionalstyle": {"bindable": "in-bound", "bindContext": "expression"},
                        "conditionalclass": {"bindable": "in-bound", "bindContext": "expression"}
                    },
                    "wm.button": {
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound", "showPrettyExprInDesigner": true},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "iconurl": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "iconposition": {"type": "list", "options": ["left", "top", "right"]},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "type": {"type": "list", "options": ["button", "reset", "submit"], "value" : "button"},
                        "tabindex": {"type": "number", "value": "0"},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "animation": {"type": "list", "options": animationOptions},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "value": "btn-default", "options": ["btn-default", "btn-primary", "btn-info", "btn-warning", "btn-success", "btn-danger", "btn-inverse", "btn-lg", "btn-sm", "btn-xs", "btn-raised", "btn-fab", "btn-link", "btn-transparent", "no-border", "jumbotron", "app-header-action"]},
                        "margin": {"type": "string", "widget": "box-model"},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "show": false}
                    },
                    "wm.rating": {
                        "hint":  {"show": false},
                        "maxvalue": {"type": "number", "value": 5, "pattern": maxRatingRegex, "bindable": "in-bound"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "datavalue": {"type": "number", "value": "", "bindable": "in-out-bound"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256, "show": false},
                        "iconsize": {"type": "string", "pattern": dimensionRegex},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "width": {"type": "string", "pattern": dimensionRegex, "show": false},
                        "height": {"type": "string", "pattern": dimensionRegex, "show": false},
                        "tabindex": {"type": "number", "value": "0"},
                        "iconcolor": {"type": "string", "widget": "color"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "datafield": {"type": "list", "options": [""], "value": "", "datasetfilter" : "terminals"},
                        "displayfield": {"type": "list", "options": [""], "datasetfilter" : "terminals"},
                        "displayexpression": {"type": "string", "bindable": "in-bound", "bindonly": "expression"},
                        "showcaptions": {"type": "boolean", "value": true}
                    },
                    "wm.camera": {
                        "capturetype": {"type": "list", "options": ["IMAGE", "VIDEO"], "value" : "IMAGE"},
                        "datavalue": {"type": "string", "value": "", "bindable": "in-bound"},
                        "localFilePath": {"type": "string", "value": "", "bindable": "out-bound"},
                        "localFile": {"type": "string", "value": "", "bindable": "out-bound"},
                        "iconclass": {"type": "string", "value": "wi wi-photo-camera", "widget": "select-icon", "bindable": "in-bound", "pattern": classRegex},
                        "iconsize": {"type": "string", "pattern": dimensionRegex, "value" : "2em"},
                        /* capture picture options*/
                        "imagequality": {"type": "number", "value": 80},
                        "imageencodingtype": {"type": "list", "options": [ "JPEG", "PNG"], "value" : "JPEG"},
                        "savetogallery": {"type": "boolean", "value" : false},
                        "allowedit": {"type": "boolean", "value" : false},
                        "correctorientation": {"type": "boolean", "value" : false},
                        "imagetargetwidth": {"type": "number"},
                        "imagetargetheight": {"type": "number"},
                        /* Events */
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "width": {"type": "string", "pattern": dimensionRegex, "show": false},
                        "height": {"type": "string", "pattern": dimensionRegex, "show": false}
                    },
                    "wm.barcodescanner": {
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "barcodeformat": {"type": "select-by-object", "options" : barcodeFormatOptions, "value" : "ALL"},
                        "caption": {"type": "string", "value": "", "bindable": "in-bound", "maxlength": 256, "showPrettyExprInDesigner": true },
                        "iconclass": {"type": "string", "value": "glyphicon glyphicon-barcode", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconsize": {"type": "string", "pattern": dimensionRegex, "value" : "2em"},
                        /* Events */
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "width": {"type": "string", "pattern": dimensionRegex, "show": false},
                        "height": {"type": "string", "pattern": dimensionRegex, "show": false}
                    },
                    "wm.buttongroup": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "vertical": {"type": "boolean"},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"},
                        "padding": {"type": "string", "widget": "box-model"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["btn-group-lg", "btn-group-sm", "btn-group-xs", "btn-group-raised", "btn-toolbar", "btn-group-vertical"]},
                        "addchild": {"hidelabel": true, "options": [{"labelKey": "LABEL_ADD_BUTTON", "label": "Add Button", "widgettype": "wm-button", "defaults": {"margin": ""}}], "widget": "add-widget"}
                    },
                    "wm.switch": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "datavalue": {"type": "string, object", "bindable": "in-out-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "dataset": {"type": "array, string", "bindable": "in-bound", "widget": "string", "value": "yes, no, maybe", "showPrettyExprInDesigner": true, "defaultvalue": "yes, no, maybe"},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields", "datasetfilter" : "terminals", "allfields" : true},
                        "displayfield": {"type": "list", "options": [""], "value": "", "datasetfilter": "terminals"},
                        "displayexpression": {"type": "string", "bindable": "in-bound", "bindonly": "expression"},
                        "compareby": {"type": "list", "widget": "select-all", "datasetfilter": "terminals", "show": false},
                        "iconclass": {"type": "list", "options": [""], "value": "", "datasetfilter": "terminals"},
                        "tabindex": {"type": "number", "value": "0"},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"},
                        "margin": {"type": "string", "widget": "box-model"},
                        "onFocus": {"show": false},
                        "onBlur": {"show": false}
                    },
                    "wm.menu": {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Menu Item 1, Menu Item 2, Menu Item 3"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "menulayout": {"type": "list", "options": ["vertical", "horizontal"]},
                        "menuclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["btn-default", "btn-primary", "btn-info", "btn-danger", "btn-warning", "btn-success", "btn-lg", "btn-sm", "btn-xs", "btn-link", "btn-transparent", "jumbotron", "app-header-action"]},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "menuposition": {"type": "list", "options": ["", "down,right", "down,left", "up,right", "up,left", "inline"], "value": ""},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "linktarget": {"type": "list", "options": ["_blank", "_parent", "_self", "_top"], "widget": "data-list"},
                        "tabindex": {"type": "number", "value": "0"},
                        "animateitems": {"type": "list", "options": ['', 'slide', 'fade', 'scale']},
                        "shortcutkey": {"type": "string"},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"},
                        "class": {"type": "string", "pattern": classRegex, "show": false},
                        "autoclose": {"type": "list", "widget": "select-by-object", "value": "outsideClick", "options": [{"label": "Outside Click", "value": "outsideClick"}, {"label": "Always", "value": "always"}, {"label": "Disabled", "value": "disabled"}]},
                        "autoopen": {"type": "list", "widget": "select-by-object", "value": "never", "options": [{"label": "Never", "value": "never"}, {"label": "Always", "value": "always"}, {"label": "Active Page", "value": "activepage"}]}
                    },

                    "wm.menu.dataProps": {
                        "itemlabel": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "itemlink": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "itemclass": {"type": "string", "show": false},
                        "itemicon": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "itemchildren": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "objects"},
                        "itemaction": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "userrole": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"}
                    },

                    "wm.tree": {
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "node1, node2, node3"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onExpand": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onCollapse": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset"},
                        "treeicons": {"type": "list", "widget": "list", "options": ["folder", "plus-minus", "circle-plus-minus", "chevron", "menu", "triangle", "expand-collapse"]},
                        "nodelabel": {"type": "string", "widget": "list", "datasetfilter" : "terminals", "bindable": "in-bound", "bindonly": "expression"},
                        "nodeicon": {"type": "string", "widget": "list", "datasetfilter" : "terminals", "bindable": "in-bound", "bindonly": "expression"},
                        "nodechildren": {"type": "string", "widget": "list", "datasetfilter" : "objects", "bindable": "in-bound", "bindonly": "expression"},
                        "nodeid": {"type": "string", "widget": "list", "datasetfilter" : "terminals", "bindable": "in-bound", "bindonly": "expression"},
                        "nodeaction": {"type": "string", "widget": "list", "datasetfilter" : "terminals", "bindable": "in-bound", "bindonly": "expression"},
                        "nodeclick": {"type": "select-by-object", "value": "none", "options" : [{"labelkey": "LABEL_EXPAND_NODE", "value": "expand"}, {"labelkey": "LABEL_DO_NOTHING", "value": "none"}]},
                        "tabindex": {"type": "number", "value": "0"},
                        "levels": {"type": "number", "value": 0, "min": "0", "max": "10", "step": "1"},
                        "datavalue": {"type": "string, number, boolean, date, time, object", "bindable": "in-out-bound", "widget": "tree-datavalue", "getTypeFrom": "expr:getDataValueType()"},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"}
                    },

                    "wm.text": {
                        "autofocus": {"type": "boolean"},
                        "autocomplete": {"type": "boolean", "value": true},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "updateon": {"type": "list", "value": "blur", "widget": "update-on"},
                        "updatedelay": {"type": "number", "value": 0},
                        "type": {"type": "list", "options": ["color", "date", "datetime-local", "email", "month", "number", "password", "search", "tel", "text", "time", "url", "week"], "value": "text"},
                        "accept": {"type": "data-list", "options": ["image/*", "audio/*", "video/*"], "show": false},
                        "datavalue": {"type": "string", value: "", "bindable": "in-out-bound", "getTypeFrom": "expr:getPropertyType('datavalue')"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-lg", "input-sm"]},
                        "backgroundcolor": {"type": "string", "widget": "color"},

                        /* Properties: Validation */
                        "regexp": {"type": "string", "value": ".*"},

                        /* Properties: help */
                        "placeholder": {"type": "string", "value": "Enter text", "bindable": "in-bound"},

                        /* Properties: Behavior */
                        "maxchars": {"type": "number", "bindable": "in-bound"},

                        /*  ---Events---  */
                        "changeOnkey": {"type": "boolean"},

                        /* Number properties */
                        "minvalue": {"type": "string", "bindable": "in-bound"},
                        "maxvalue": {"type": "string", "bindable": "in-bound"},
                        "step": {"type": "number"},
                        "shortcutkey": {"type": "string"},
                        "displayformat": {"type": "string", "options": ["999-99-9999", "(999) 999-9999", "(999) 999-9999 ext. 999", "(999) 999-9999 ext. ?9?9?9", "(?9?9?9) ?9?9?9-?9?9?9?9", "(999) 999-9999 ext. 999", "(**: AAA-999)", "9999 9999 9999 9999", "AA-9999"], "widget": "data-list", "bindable": "in-bound", "show": false}
                    },

                    "wm.number": {
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "datavalue": {"type": "number", "bindable": "in-out-bound"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-lg", "input-sm"]},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "updateon": {"type": "list", "value": "blur", "widget": "update-on"},
                        "step": {"type": "number"},

                        /* Properties: Validation */
                        "regexp": {"type": "string", "value": ".*"},
                        /* Properties: help */
                        "placeholder": {"type": "string", "value": "Enter Number", "bindable": "in-bound"},

                        /* Number properties */
                        "minvalue": {"type": "number", "bindable": "in-bound"},
                        "maxvalue": {"type": "number", "bindable": "in-bound"},
                        "shortcutkey": {"type": "string"}
                    },

                    "wm.currency": {
                        "datavalue": {"type": "number", "bindable": "in-out-bound"},
                        "minvalue": {"type": "number", "bindable": "in-bound"},
                        "maxvalue": {"type": "number", "bindable": "in-bound"},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "step": {"type": "number"},
                        "updateon": {"type": "list", "value": "blur", "widget": "update-on"},
                        "currency": {"type": "list", "value": "USD", "options": ["AED", "AFN", "ALL", "AMD", "ARS", "AUD", "AZN", "BAM", "BDT", "BGN", "BHD", "BIF", "BND", "BOB", "BRL", "BWP", "BYR", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EEK", "EGP", "ERN", "ETB", "EUR", "GBP", "GEL", "GHS", "GNF", "GTQ", "HKD", "HNL", "HRK", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KHR", "KMF", "KRW", "KWD", "KZT", "LBP", "LKR", "LTL", "LVL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MOP", "MUR", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SDG", "SEK", "SGD", "SOS", "SYP", "THB", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VEF", "VND", "XAF", "XOF", "YER", "ZAR", "ZMK"]},
                        /* Properties: help */
                        "placeholder": {"type": "string", "value": "Enter value", "bindable": "in-bound"},
                        /* Style: Basic */

                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-group-sm", "input-group-lg"]}
                    },
                    "wm.base.datetime": {
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "showdropdownon": {"type": "select-by-object", "options": [{"label": "Default(Input & Button)", "value":"default"}, {"label": "Button Only", "value":"button"}], "value": "default"},
                        /* ---- styles ----*/

                        "margin": {"type": "string", "widget": "box-model"},
                        "color": {"type": "string", "widget": "color"}
                    },
                    "wm.date": {
                        "placeholder": {"type": "string", "value": "Select date", "bindable": "in-bound"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "autofocus": {"type": "boolean"},
                        "showweeks": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "mindate": {"type": dateTimeTypes, "widget": "data-list", "options": ["CURRENT_DATE"], "bindable": "in-bound", "hint": "yyyy-MM-dd"},
                        "maxdate": {"type": dateTimeTypes, "widget": "data-list", "options": ["CURRENT_DATE"], "bindable": "in-bound", "hint": "yyyy-MM-dd"},
                        "datepattern": {"type": "list", "options": [], "widget": "date-patterns"},
                        "outputformat": {"value": "yyyy-MM-dd", "type": "list", "options": [], "widget": "date-patterns"},
                        "datavalue": {"type": dateTimeTypes, "widget": "data-list", "options": ["CURRENT_DATE"], "bindable": "in-out-bound", "hint": "yyyy-MM-dd"},
                        "timestamp": {"type": dateTimeTypes, "widget": "string", "show": "false", "bindable": "out-bound"},
                        "excludedays": {"type": "select-all", "options": daysOptions, "displaytype": "block", "value": " "},
                        "excludedates": {"type": "datetime, timestamp, date, array, string", "bindable": "in-bound", "widget": "string", "hint": "yyyy-MM-dd"},
                        "tabindex": {"type": "number", "value": "0"},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-group-sm", "input-group-lg"]},
                        "showbuttonbar": {"type": "boolean", "value": true, "show": false}
                    },
                    "wm.date.mobile": {
                        "datepattern": {"show": false},
                        "excludedays": {"show": false},
                        "excludedates": {"show": false},
                        "showweeks": {"show": false},
                        "showdropdownon": {"show": false}
                    },
                    "wm.calendar": {
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "width": {"type": "string", "value": "100%", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "selectionmode": {"type": "list", "widget": "select-by-object", "value": "none", "options": [{"label": "None", "value": "none"}, {"label": "Single", "value": "single"}, {"label": "Multiple", "value": "multiple"}]},
                        "selecteddates": {"type": "object", "widget": "string", "bindable": "in-out-bound", "getTypeFrom": "expr:getPropertyType('selecteddates')"},
                        "currentview": {"type": "object", "widget": "string", "bindable": "in-out-bound", "getTypeFrom": "expr:getPropertyType('currentview')"},
                        "selecteddata": {"type": "array, object", "isList": true, "show": false, "bindable": "out-bound", "getTypeFrom": "dataset" },
                        "calendartype": {"type": "list", "options": ["basic", "agenda", "list"], "value": "basic"},
                        "eventstart": {"type": "list", "value": "start", "options": [""], "datasetfilter" : "terminals"},
                        "eventend": {"type": "list", "value": "end", "options": [""], "datasetfilter" : "terminals"},
                        "eventallday": {"type": "list", "value": "allday", "options": [""], "datasetfilter" : "terminals"},
                        "eventtitle": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "eventclass": {"type": "list", "value": "class", "options": [""], "datasetfilter" : "terminals"},
                        "view": {"type": "list", "options": ["month", "week", "day"], "value": "month"},
                        "controls": {"type": "list", "options": "navigation, today, month, week, day", "value": "navigation, today, month, week, day", "widget": "select-all"},
                        "onViewrender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventdrop": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventresize": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onEventrender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "tabindex": {"type": "number", "value": "0"},
                        "showdropdownon": {"show": false}
                    },
                    "wm.calendar.mobile": {
                        "view": {"type": "list", "options": ["day", "month", "year"], "value": "day"},
                        "controls": {"show": false},
                        "multiselect": {"show": false},
                        "calendartype": {"show": false},
                        "selectionmode": {"show": false},
                        "onEventdrop": {"show": false},
                        "onEventresize": {"show": false},
                        "eventstart": {"type": "list", "value": "start", "options": [""], "datasetfilter" : "terminals"},
                        "eventend": {"type": "list", "value": "end", "options": [""], "datasetfilter" : "terminals", "show": false },
                        "eventallday": {"type": "list", "value": "allday", "options": [""], "datasetfilter" : "terminals", "show": false},
                        "eventtitle": {"type": "list", "value": "title", "options": [""], "datasetfilter" : "terminals", "show": false},
                        "eventclass": {"type": "list", "value": "class", "options": [""], "datasetfilter" : "terminals", "show": false},
                        "showdropdownon": {"show": false}
                    },
                    "wm.time": {
                        "placeholder": {"type": "string", "value": "Select time", "bindable": "in-bound"},
                        "mintime": {"type": "string", "bindable": "in-bound"},
                        "maxtime": {"type": "string", "bindable": "in-bound"},
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "hourstep": {"type": "number", "value": 1},
                        "timepattern": {"type": "list", "options": [], "widget": "time-patterns"},
                        "minutestep": {"type": "number", "value": 15},
                        "outputformat": {"value": "HH:mm:ss", "type": "list", "options": [], "widget": "time-patterns"},
                        "required": {"type": "boolean"},
                        "datavalue": {"type": "time, date, string, number", "widget": "data-list", "options": ["CURRENT_TIME"], "bindable": "in-out-bound", hint: "HH:mm"},
                        "timestamp": {"type": "time, date, string, number", "widget": "string", "show": "false", "bindable": "out-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-group-sm", "input-group-lg"]}
                    },
                    "wm.time.mobile": {
                        "hourstep": {"type": "number", "value": 1, "show": false},
                        "minutestep": {"type": "number", "value": 15, "show": false},
                        "timepattern": {"show": false},
                        "showdropdownon": {"show": false}

                    },
                    "wm.datetime": {
                        "placeholder": {"type": "string", "value": "Select date time", "bindable": "in-bound"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "autofocus": {"type": "boolean"},
                        "showweeks": {"type": "boolean", "value": false},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "hourstep": {"type": "number", "value": 1},
                        "minutestep": {"type": "number", "value": 15},
                        "mindate": {"type": dateTimeTypes,  "widget": "data-list", "options": ["CURRENT_DATE"], "bindable": "in-bound", "hint": "yyyy-MM-dd"},
                        "maxdate": {"type": dateTimeTypes,  "widget": "data-list", "options": ["CURRENT_DATE"], "bindable": "in-bound", "hint": "yyyy-MM-dd"},
                        "datepattern": {"type": "list", "options": [], "widget": "date-time-patterns"},
                        "outputformat": {"value": "timestamp", "type": "list", "options": [], "widget": "date-time-patterns"},
                        "datavalue": {"type": dateTimeTypes, "widget": "data-list", "options": ["CURRENT_DATE"], "bindable": "in-out-bound", "hint": "yyyy-MM-dd HH:mm:ss"},
                        "timestamp": {"type": dateTimeTypes, "widget": "string", "show": "false", "bindable": "out-bound"},
                        "excludedays": {"type": "select-all", "options": daysOptions, "displaytype": "block", "value": " "},
                        "excludedates": {"type": "datetime, timestamp, date, array, string", "bindable": "in-bound", "widget": "string", "hint": "yyyy-MM-dd"},
                        "tabindex": {"type": "number", "value": "0"},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-group-sm", "input-group-lg"]},
                        "showbuttonbar": {"type": "boolean", "value": true, "show": false}
                    },
                    "wm.datetime.mobile": {
                        "datepattern": {"value": "yyyy-MM-dd hh:mm:ss a", "type": "list", "show": false},
                        "hourstep": {"type": "number", "value": 1, "show": false},
                        "minutestep": {"type": "number", "value": 15, "show": false},
                        "showweeks": {"show": false},
                        "excludedays": {"show": false},
                        "excludedates": {"show": false},
                        "showdropdownon": {"show": false}
                    },
                    "wm.message": {
                        "type": {"type": "string", "options": ["error", "info", "loading", "success", "warning"], "value": "success", "bindable": "in-out-bound", "widget": "list"},
                        "caption": {"type": "string", "value": "Message", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "hideclose": {"type": "boolean", "value": false}
                    },

                    "wm.composite": {
                        "captionposition": {"type": "list", "options": ["left", "right", "top"]},
                        "required": {"type": "boolean"},
                        "margin": {"type": "string", "widget": "box-model"}
                    },

                    "wm.radio": {
                        //"readonly": {"type": "boolean", "value": false}, //commenting this property temporarily as it is not working
                        "autofocus": {"type": "boolean"},
                        "disabled": {"value": false, "bindable": "in-bound"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "checkedvalue": {"type": "string"},
                        "radiogroup": {"type": "string"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256},
                        "shortcutkey": {"type": "string"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box-model"}
                    },
                    "wm.radioset": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box-model"},
                        "tabindex": {"type": "number", "value": "0"},
                        "disabled": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "layout":  {"type": "list", "options": ["", "inline", "stacked"]},
                        "itemclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group", "media-list"]},
                        "listclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group-item", "media"]},
                        /* ---- events ---- */

                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},

                        "datavalue": {"type": "string", "bindable": "in-out-bound", "getTypeFrom": "dataset"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Option 1, Option 2, Option 3", "showPrettyExprInDesigner": true, "defaultvalue": "Option 1, Option 2, Option 3"},
                        "usekeys": {"type": "boolean"},
                        "required": {"type": "boolean", "bindable": "in-bound", "value": false},
                        "selectedvalue": {"type": "string, number, boolean, date, time, object", "widget": "string", "bindable": "in-bound", "getTypeFrom": "dataset", "show": false},
                        "displayValue": {"type": "string", "show": false, "bindable": "out-bound"},
                        "compareby": {"type": "list", "widget": "select-all", "datasetfilter": "terminals", "show": false}
                    },
                    "wm.colorpicker": {
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "disabled": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "required": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "placeholder": {"type": "string", "value": "Select Color", "bindable": "in-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-group-sm", "input-group-lg"]},
                        "onDblclick": {"show": false},
                        "onDoubletap": {"show": false}
                    },

                    "wm.inputcolorpicker": {
                        "defaultcolor": {"value": "#fff"}
                    },

                    "wm.inputslider": {
                        "caption": {"value": "slider", "maxlength": 256}
                    },

                    "wm.slider": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "disabled": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "minvalue": {"type": "number", "bindable": "in-out-bound"},
                        "maxvalue": {"type": "number", "bindable": "in-out-bound"},
                        "step": {"type": "number"},
                        "datavalue": {"type": "string, number", "widget": "string", "bindable": "in-out-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "shortcutkey": {"type": "string"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box-model"}
                    },

                    "wm.checkbox": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "margin": {"type": "string", "widget": "box-model"},
                        "datavalue": {"type": "boolean, string", "bindable": "in-out-bound", "widget": "string"},
                        "checkedvalue": {"type": "string"},
                        "uncheckedvalue": {"type": "string"},
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "shortcutkey": {"type": "string"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"}
                    },
                    "wm.checkboxset": {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box-model"},
                        "tabindex": {"type": "number", "value": "0"},
                        "disabled": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "layout":  {"type": "list", "options": ["", "inline", "stacked"]},
                        "itemclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group", "media-list"]},
                        "listclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group-item", "media"]},
                        "groupby": {"type": "list", "show": true, "widget": "list-typeahead", "datasetfilter": "terminals"},
                        "match": {"type": "list-group", "nonGroupOptions": timeNonGroupOptions, "options": timeGroupOptions, "show": false, "value": "word", "datasetfilter": "none"},
                        "collapsible": {"type": "boolean", "show": false},
                        "showcount": {"type": "boolean", "show": false},
                        "dateformat": {"type": "list", "options": [], "widget": "date-time-patterns", "show": false},
                        /* ---- events ---- */

                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFocus": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onBlur": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},

                        "datavalue": {"type": "string, array", "bindable": "in-out-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Option 1, Option 2, Option 3", "showPrettyExprInDesigner": true, "defaultvalue": "Option 1, Option 2, Option 3"},
                        "usekeys": {"type": "boolean"},
                        "selectedvalues": {"type": "string, object", "isList": true, "bindable": "in-bound", "widget": "string", "getTypeFrom": "dataset", "show": false},
                        "onReady": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "displayValue": {"type": "string, array", "isList": true, "show": false, "bindable": "out-bound"},
                        "compareby": {"type": "list", "widget": "select-all", "datasetfilter": "terminals", "show": false},
                        "required": {"type": "boolean", "bindable": "in-bound", "value": false}
                    },

                    "wm.chips": {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]},
                        "inputposition": {"type": "list", "options": ["first", "last"], "value": "last"},
                        "inputwidth": {"type": "list", "options": ["default", "full"], "value": "default"},
                        "tabindex": {"type": "number", "value": "0"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "minchars": {"type": "number", "value": "1"},
                        "searchkey": {"type": "string", "widget": "select-all", "datasetfilter" : "custom"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "enablereorder": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "value": "Option 1, Option 2, Option 3"},
                        "displayimagesrc": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "placeholder": {"type": "string", "value": "Type here...", "bindable": "in-bound"},
                        "maxsize": {"type": "number"},
                        "allowonlyselect": {"type": "boolean", "value": false},
                        "class": {"type": "string", "pattern": classRegex},
                        "chipclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "bindable": "in-bound"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforeadd": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onAdd": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforeremove": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRemove": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforereorder": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onReorder" : {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onChipselect" : {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onChipclick" : {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "autofocus": {"type": "boolean", "value": false },
                        "onFocus": {"show": false},
                        "onBlur": {"show": false},
                        "onBeforeservicecall": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "debouncetime": {"type": "number", "value": "250", "show": true},
                        "matchmode": {"type": "select-by-object", "options": matchModes, "value": "startignorecase", "show": false}
                    },


                    "wm.select": {
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "datavalue": {"type": "string, number, boolean, date, time, object", "bindable": "in-out-bound", "widget": "string", "getTypeFrom": "dataset", "getIsListFrom": "expr:multiple"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "allownone": {"type": "boolean"},
                        "hasdownarrow": {"type": "boolean", "value": true},
                        "restrictvalues": {"type": "boolean", "value": true},
                        "disabled": {"value": false, "bindable": "in-bound"},
                        "multiple": {"type": "boolean", "value": false},
                        "placeholder": {"type": "string", "value": "", "bindable": "in-bound"},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-lg", "input-sm"]},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "displayValue": {"type": "string", "getIsListFrom": "expr:multiple", "show": false, "bindable": "out-bound"},
                        "compareby": {"type": "list", "widget": "select-all", "datasetfilter": "terminals", "show": false}
                    },

                    "wm.marquee": {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "direction": {"type": "list", "options": ["up", "down", "left", "right"]},
                        "behavior": {"type": "list", "options": ["scroll", "slide", "alternate"]},
                        "scrolldelay": {"type": "number"},
                        "scrollamount": {"type": "number"}
                    },

                    "wm.label": {
                        "caption": {"type": "date, string, number", "widget": "string", "value": "Label", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "required": {"type": "boolean"},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "animation": {"type": "list", "options": animationOptions},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": [ "h1", "h2", "h3", "h4", "h5", "h6", "p", "text-ellipsis", "text-left", "text-right", "text-center", "text-muted", "text-primary", "text-success", "text-info", "text-warning", "text-danger", "label-default", "label-primary", "label-success", "label-info", "label-warning", "label-danger", "vertical-align-top", "vertical-align-middle", "vertical-align-bottom", "lead", "badge", "form-control-static", "control-label"]},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "show": false}
                    },

                    "wm.picture": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "picturesource": {"type": "string", "bindable": "in-out-bound"},
                        "pictureplaceholder": {"type": "string", "value": "resources/images/imagelists/default-image.png", "bindable": "in-bound", "widget": "string"},
                        "encodeurl": {"type": "boolean", "value": false},
                        "pictureaspect": {"type": "list", "options": ["Both", "H", "None", "V"], "value": "None"},
                        "disabled": {"type": "boolean", "show": false, "bindable": "in-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "shape":  {"type": "list", "options": ["", "rounded", "circle", "thumbnail"]},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "animation": {"type": "list", "options": animationOptions},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["img-responsive"]},
                        "margin": {"type": "string", "widget": "box-model"},
                        "borderwidth": {"type": "string", "widget": "box-model"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "cursor": {"type": "list", "options": ["default", "pointer"]}
                    },
                    "wm.picture.mobile" : {
                        "offline": {"type": "boolean", "value" : true}
                    },
                    "wm.textarea": {
                        "autofocus": {"type": "boolean"},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "datavalue": {"type": "string", "bindable": "in-out-bound"},
                        "placeholder": {"type": "string", "value": "Place your text", "bindable": "in-bound"},
                        "maxchars": {"type": "number",  "bindable": "in-bound"},
                        "updateon": {"type": "list", "value": "blur", "widget": "update-on"},
                        "updatedelay": {"type": "number", "value": 0},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-lg", "input-sm"]},
                        "backgroundcolor": {"type": "string", "widget": "color"}
                    },

                    "wm.basicdialog": {
                        "show": {"type": "boolean", "show": false },
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "onOpened": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions},
                        "tabindex": {"type": "number", "value": "0"},
                        "title": {"type": "string", "maxlength": 256, "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconurl": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "actiontitle": {"type": "string", "show": false, "pattern": dimensionRegex},
                        "actionlink": {"type": "string", "show": false, "pattern": dimensionRegex},
                        "closable": {"type": "boolean", "show": true, "value": true},
                        "contentclass": {"type": "string", "pattern": classRegex, "show": false}
                    },
                    "wm.dialog.dialogheader": {
                        "caption": {"type": "string", "maxlength": 256, "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconurl": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "closable": {"type": "boolean", "show": true, "value": true}
                    },
                    "wm.dialog.onOk": {
                        "onOk": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.alertdialog": {
                        "title": {"type": "string", "value": "Alert", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "value": "wi wi-warning", "pattern": classRegex},
                        "message": {"type": "string", "value": "I am an alert box!", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "alerttype": {"type": "list", "options": ["error", "information", "success", "warning"], "value": "error"},
                        "modal": {"type": "boolean", "value": false},
                        "keyboard": {"type": "boolean", "value": true, "show": false}
                    },
                    "wm.confirmdialog": {
                        "title": {"type": "string", "value": "Confirm", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "canceltext": {"type": "string", "value": "CANCEL", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "value": "wi wi-done", "pattern": classRegex},
                        "message": {"type": "string", "value": "I am confirm box!", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "onCancel": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "modal": {"type": "boolean", "value": false},
                        "keyboard": {"type": "boolean", "value": true, "show": false}
                    },
                    "wm.iframedialog": {
                        "title": {"type": "string", "value": "External Content", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "url": {"type": "string", "value": "https://www.wavemaker.com", "bindable": "in-out-bound"},
                        "encodeurl": {"type": "boolean", "value": false},
                        "height": {"type": "string", "value": "400", "pattern": dimensionRegex},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "value": "wi wi-globe", "pattern": classRegex},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "closable": {"type": "boolean", "value": true},
                        "showactions": {"type": "boolean", "value": true},
                        "showheader": {"type": "boolean", "value": true},
                        "modal": {"type": "boolean", "value": false},
                        "keyboard": {"type": "boolean", "value": true, "show": false}
                    },
                    "wm.pagedialog": {
                        "title": {"type": "string", "value": "Page Content", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "oktext": {"type": "string", "value": "OK", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "value" : "wi wi-file", "pattern": classRegex},
                        "closable": {"type": "boolean", "value": true},
                        "showactions": {"type": "boolean", "value": true},
                        "modal": {"type": "boolean", "value": false},
                        "keyboard": {"type": "boolean", "value": true, "show": false}
                    },
                    "wm.logindialog": {
                        "tabindex": {"show": false},
                        "height": {"type": "string", "show": false, "pattern": dimensionRegex},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "closable": {"type": "boolean", "value": false, "show": false},
                        "modal": {"type": "boolean", "value": true},
                        "keyboard": {"type": "boolean", "value": true, "show": false},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "title": {"type": "string", "maxlength": 256, "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex}
                    },
                    "wm.designdialog": {
                        "modal": {"type": "boolean", "value": false},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "keyboard": {"type": "boolean", "value": true, "show": false},
                        "closable": {"type": "boolean", "value": true},
                        "title": {"type": "string"},
                        "showheader": {"type": "boolean", "value": true}
                    },
                    "wm.spinner": {
                        "show": {"type": "boolean", "value": false},
                        "caption": {"type": "string", "value": "Loading...", "maxlength": 256},
                        "servicevariabletotrack": {"type": "list", "options": [], "widget": "multi-select"},
                        "iconclass": {"type": "string", "value": "fa fa-circle-o-notch", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconsize": {"type": "string", "pattern": dimensionRegex},
                        "image": {"type": "string", "bindable": "in-bound"},
                        "imagewidth": {"type": "string", "value": "20px"},
                        "imageheight": {"type": "string"},
                        "animation" : {"type": "list", "value": "spin", "options": spinnerAnimationOptions},
                        "type" : {"type": "list", "value": "icon", "options": ["image", "icon"]},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontsize": {"type": "number", "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px", "pt"], "value": "px", "hidelabel": true, "widget": "icons-radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "widget": "toggle-checkbox"},
                        "fontVariant": {"type": "list", "options": ["normal", "small-caps"]},
                        "fontfamily": {"type": "string", "hint": "Arial, Geneva"}
                    },

                    'wm.layouts': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "class": {"type": "string", "pattern": classRegex},
                        "borderwidth": {"type": "string", "widget": "box-model"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "widget": "color"},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE}
                    },
                    'wm.containers': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "class": {"type": "string", "pattern": classRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "deferload": {"type": "boolean", "value": false, "show": false},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'},
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "color": {"type": "string", "widget": "color"},
                        "fontweight": {"type": "string", "options": ["bold"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontsize": {"type": "number", "hint": "Font size", "pattern": numberRegex},
                        "fontunit": {"type": "string", "options": ["em", "px", "pt"], "value": "px", "hidelabel": true, "widget": "icons-radio"},
                        "textdecoration": {"type": "string", "options": ["underline"], "hidelabel": true, "widget": "toggle-checkbox"},
                        "fontstyle": {"type": "string", "options": ["italic"], "widget": "toggle-checkbox"},
                        "fontfamily": {"type": "string", "hint": "Arial, Geneva"},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"}


                    },
                    'wm.containers.borderstyle': {
                        "borderwidth": {"type": "string", "widget": "box-model"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style"},
                        "bordercolor": {"type": "string", "widget": "color"}
                    },

                    'wm.containers.lazy' : {
                        "loadmode" : {"type" : "list", "options" : ["", "after-select", "after-delay"], "value" : ""},
                        "loaddelay" : {"type" : "number", "min": "10", "value" : "10"},
                        "onReady" : {"type" : "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    'wm.scrollablecontainer': {
                        "smoothscroll": {"type": "boolean", "value": true, "show": false, "bindable": "in-bound"}
                    },

                    'wm.layouts.header': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.list': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "layout":  {"type": "list", "options": ["inline", "vertical"], "value": "vertical"},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-inline", "list-group"]},
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]}
                    },
                    'wm.layouts.breadcrumb': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "itemid": {"type": "string", "widget": "list", "datasetfilter" : "terminals", "bindable": "in-bound", "bindonly": "expression"},
                        "itemaction": {"show": false},
                        "userrole": {"show": false},
                        "onBeforenavigate": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    'wm.layouts.nav': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "layout":  {"type": "list", "options": ["", "stacked", "justified"]},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "type":  {"type": "list", "options": ["pills", "tabs"]},
                        "itembadge": {"type": "list", "options": [""], "datasetfilter" : "terminals"},
                        "addchild": {"hidelabel": true, "options": [{'label': 'Anchor', 'widgettype': 'wm-anchor', 'defaults': {'wm-anchor': {'iconclass': 'wi wi-file', 'margin': ''} } }, {'label': 'Menu', 'widgettype': 'wm-menu', 'defaults': {'wm-menu': {'iconclass': 'wi wi-file', 'type': 'anchor'} } }, {'label': 'Popover', 'widgettype': 'wm-popover', 'defaults': {'wm-popover': {'iconclass': 'wi wi-file', 'margin': ''} } }, {'label': 'Button', 'widgettype': 'wm-button', 'defaults': {'wm-button': {'iconclass': 'wi wi-file', 'margin': ''} } }], "widget": "add-widget"},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["app-header-actions"]},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]},
                        "margin": {"type": "string", "widget": "box-model"},
                        "autoclose": {"type": "list", "widget": "select-by-object", "value": "outsideClick", "options": [{"label": "Outside Click", "value": "outsideClick"}, {"label": "Always", "value": "always"}, {"label": "Disabled", "value": "disabled"}]},
                        "autoopen": {"type": "list", "widget": "select-by-object", "value": "never", "options": [{"label": "Never", "value": "never"}, {"label": "Always", "value": "always"}, {"label": "Active Page", "value": "activepage"}]}
                    },
                    'wm.layouts.navbar': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "menuiconclass": {"type": "string", "widget": "select-icon", "pattern": classRegex, "value": "wi wi-more-vert"},
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "imgsrc": {"type": "string", "bindable": "in-bound"},
                        "homelink": {"type": "string", "bindable": "in-bound"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["navbar-inverse"]}
                    },
                    'wm.layouts.mobile.navbar': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "leftnavpaneliconclass": {"type": "string", "widget": "select-icon", "pattern": classRegex, "value": "wi wi-menu"},
                        "backbutton":  {"type": "boolean", "value": true},
                        "backbuttoniconclass": {"type": "string", "widget": "select-icon", "pattern": classRegex, "value": "wi wi-back"},
                        "backbuttonlabel":  {"type": "string"},
                        "searchbutton":  {"type": "boolean", "value": false},
                        "searchbuttoniconclass": {"type": "string", "widget": "select-icon", "pattern": classRegex, "value": "wi wi-search", "show": false},
                        "searchbuttonlabel":  {"type": "string", "show": false},
                        "searchplaceholder": {"type": "string", "value": "Search", "show": false},
                        "onSearch": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBackbtnclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "imgsrc": {"type": "string", "bindable": "in-bound"},
                        "datavalue": {"type": "string, object", "widget": "string", "bindable": "in-out-bound", "getTypeFrom": "dataset"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "searchkey": {"type": "string", "widget": "select-all", "datasetfilter" : "terminals"},
                        "displaylabel": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "displayimagesrc": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields", "datasetfilter" : "terminals", "allfields" : true},
                        "defaultview": {"type": "select-by-object", "options": [{"label": "action-view", "value": "actionview"}, {"label": "search-view", "value": "searchview"}], "value": "actionview", "displayfield": "label", "datafield": "value" },
                        "query": {"type": "string", "bindable": "in-out-bound", "value": ""},
                        "addchild": {"label": "Add", "hidelabel": true, "options": [{"label": "Anchor", "widgettype": "wm-anchor", "defaults": {"iconclass": "wi wi-gear", "caption": "", "margin": ""}}, {"label": "Menu", "widgettype": "wm-menu", "defaults": {"iconclass": "wi wi-more-vert", "type": "anchor", "caption": ""}}, {"label": "Popover", "widgettype": "wm-popover", "defaults": {"iconclass": "wi wi-bell", "caption": ""}}, {"label": "Button", "widgettype": "wm-button", "defaults": {"iconclass": "", "class": "navbar-btn btn-primary", "caption": "Action"}}], "widget": "add-widget"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "debouncetime": {"type": "number", "value": "250", "show": true},
                        "matchmode": {"type": "select-by-object", "options": matchModes, "value": "startignorecase", "show": false}
                    },
                    'wm.layouts.listtemplate': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32}
                    },
                    'wm.layouts.listactiontemplate': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "position": {"type": "string", "show": true, "disabled": true},
                        "addchild": {"hidelabel": true, "options": [{"labelKey": "LABEL_ADD_BUTTON", "label": "Add Button", "widgettype": "wm-button", "defaults": {"margin": ""}}], "widget": "add-widget"},
                        "enablefullswipe" : {"type": "boolean", "value": false}
                    },
                    'wm.layouts.mediatemplate': {
                        "width": {"type": "string", "pattern": dimensionRegex, "value": "100pt"},
                        "height": {"type": "string", "pattern": dimensionRegex, "value": "100pt"}
                    },
                    'wm.layouts.listitem': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group-item", "list-group-item-success", "list-group-item-info", "list-group-item-warning", "list-group-item-danger"]}
                    },
                    'wm.layouts.topnav': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.leftpanel': {
                        "columnwidth": {"type": "list", "options": columnWidths, "value": "2"},
                        "xscolumnwidth": {"type": "list", "options": columnWidths, "value": "10", "show" : false},
                        "animation" : {"type": "list", "options": ["slide-in", "slide-over"], "value" : "slide-in"}
                    },

                    'wm.layouts.leftpanel.tab': {
                        "columnwidth": {"type": "list", "options": columnWidths, "value": "3"},
                        "xscolumnwidth": {"type": "list", "options": columnWidths, "value": "10", "show" : false}
                    },
                    'wm.layouts.leftpanel.mobile': {
                        "columnwidth": {"type": "list", "options": columnWidths, "value": "3", "show" : false},
                        "xscolumnwidth": {"type": "list", "options": columnWidths, "value": "10", "show" : true},
                        "gestures": {"type": "string", "value": "on", "bindable": "in-bound"}
                    },
                    'wm.layouts.rightpanel': {
                        "columnwidth": {"type": "list", "options": columnWidths, "value": "2"}
                    },
                    'wm.layouts.content': {
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },
                    'wm.layouts.panel': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex, "label": 'Title Icon Class'},
                        "iconurl": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "collapsible": {"type": "boolean"},
                        "enablefullscreen": {"type": "boolean"},
                        "expanded": {"type": "boolean", "value": true},
                        "closable": {"type": "boolean"},
                        "helptext": {"type": "string", "bindable": "in-out-bound", "widget": "textarea", "showPrettyExprInDesigner": true},
                        "actions": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "badgevalue": {"type": "string, number", "widget": "string", "bindable": "in-out-bound", "showPrettyExprInDesigner": true},
                        "badgetype": {"type": "string", "widget": "list", "options": ["default", "primary", "success", "info", "warning", "danger"], "value": "default", "bindable": "in-out-bound"},
                        "margin": {"type": "string", "widget": "box-model"},
                        /*Events*/
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onClose": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onExpand": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onCollapse": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFullscreen": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onExitfullscreen": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onActionsclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    'wm.layouts.panel.defaults': {
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["panel-default", "panel-primary", "panel-success", "panel-info", "panel-warning", "panel-danger"]}
                    },
                    'wm.layouts.card': {
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "iconurl": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "margin": {"type": "string", "widget": "box-model"},
                        "picturesource": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "picturetitle": {"type": "string", "bindable": "in-bound"},
                        "imageheight": {"type": "string", "value": "200px"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "actions": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        /*Events*/
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions},
                        "class": {"type": "string", "pattern": classRegex}
                    },

                    'wm.layouts.cardcontent': {
                        "width": {"type": "string", "pattern": dimensionRegex, 'show': false}
                    },
                    'wm.layouts.cardactions': {
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"}
                    },
                    'wm.layouts.cardfooter': {
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"}
                    },
                    'wm.layouts.container': {
                        "margin": {"type": "string", "widget": "box-model"},
                        "smoothscroll": {"type": "boolean", "value": false, "show": false, "bindable": "in-bound"},
                        "borderwidth": {"type": "string", "widget": "box-model"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "opacity": {"type": "string", "widget": "slider"},
                        "cursor": {"type": "list", "options": ["crosshair", "default", "e-resize", "help", "move", "n-resize", "ne-resize", "nw-resize", "pointer", "progress", "s-resize", "se-resize", "sw-resize", "text", "wait", "w-resize"]},
                        "zindex": {"type": "string", "pattern": zindexRegex},
                        "visibility": {"type": "list", "options": visibilityOptions},
                        "display": {"type": "list", "options": displayOptions},
                        /*Events*/
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDblclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDoubletap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["well", "alert", "alert-success", "alert-info", "alert-warning", "alert-danger", "bordered"]},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]}
                    },
                    'wm.layouts.tile': {
                        "margin": {"type": "string", "widget": "box-model"},
                        /*Events*/
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDblclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDoubletap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseout": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onMouseover": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "animation": {"type": "list", "options": animationOptions},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["card", "well", "bg-primary", "bg-success", "bg-info", "bg-warning", "bg-danger"]}
                    },
                    'wm.layouts.footer': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["card-footer"]}
                    },
                    'wm.layouts.layoutgrid': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "value": "condensed", "options": ["condensed", "standard", "bordered"]},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "deferload": {"type": "boolean", "value": false, "show": false},
                        "insert": {"type": "toolbar", "actions": [{'action': 'addrow', 'label': 'LABEL_PROPERTY_ADDROW', 'icon': 'wms wms-add-row'}]},
                        "columns": {"type": "list", "options": ["1", "2", "3", "4", "6", "12"]},
                        "backgroundcolor": {"type": "string", "widget": "color", "show": false},
                        "backgroundgradient": {"type": "string", "show": false},
                        "backgroundimage": {"type": "string", "bindable": "in-bound", "show": false},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"], "show": false},
                        "backgroundsize": {"type": "string", "hint": "width, height", "show": false},
                        "backgroundposition": {"type": "string", "hint": "top, left", "show": false},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"], "show": false},
                        "padding": {"type": "string", "widget": "box-model", "show": false}

                    },
                    'wm.layouts.gridcolumn': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"},
                        "borderwidth": {"type": "string", "widget": "box-model", "show": false},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style", "show": false},
                        "bordercolor": {"type": "string", "widget": "color", "show": false},
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color", "show": false},
                        "backgroundgradient": {"type": "string", "show": false},
                        "backgroundimage": {"type": "string", "bindable": "in-bound", "show": false},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"], "show": false},
                        "backgroundsize": {"type": "string", "hint": "width, height", "show": false},
                        "backgroundposition": {"type": "string", "hint": "top, left", "show": false},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"], "show": false},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "columnwidth": {"type": "list", "options": columnWidths},
                        "insert": {"type": "toolbar", "actions": [{'action': 'addcolumnleft', 'label': 'LABEL_PROPERTY_ADDCOLUMNLEFT', 'icon': 'wms wms-add-column-left'}, {'action': 'addcolumnright', 'label': 'LABEL_PROPERTY_ADDCOLUMNRIGHT', 'icon': 'wms wms-add-column-right'}]},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["visible-xs-block", "visible-sm-block", "visible-md-block", "visible-lg-block", "hidden-xs", "hidden-sm", "hidden-md", "hidden-lg", "bordered", "bordered-left", "bordered-right", "bordered-top", "bordered-bottom"]}
                    },
                    'wm.layouts.gridrow': {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["bordered-top", "bordered-bottom"]},
                        "borderwidth": {"type": "string", "widget": "box-model", "show": false},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style", "show": false},
                        "bordercolor": {"type": "string", "widget": "color", "show": false},
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color", "show": false},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "overflow": {"type": "list", "options": ["visible", "hidden", "scroll", "auto", "initial", "inherit"]},
                        "insert": {"type": "toolbar", "actions": [{'action': 'addrowbelow', 'label': 'LABEL_PROPERTY_ADDROWBELOW', 'icon': 'wms wms-add-row-below'}, {'action': 'addrowabove', 'label': 'LABEL_PROPERTY_ADDROWABOVE', 'icon': 'wms wms-add-row-above'}, {'action': 'addcolumn', 'label': 'LABEL_PROPERTY_ADDCOLUMN', 'icon': 'wms wms-add-column'}]}
                    },
                    'wm.layouts.column': {
                        "columnwidth": {"type": "list", "options": columnWidths}
                    },
                    'wm.layouts.pagecontent': {
                        "columnwidth": {"type": "list", "options": columnWidths},
                        "padding": {"type": "string", "widget": "box-model"}
                    },
                    'wm.layouts.pagecontent.mobile': {
                       "onPulltorefresh": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    'wm.layouts.row': {
                        "show": {"type": "boolean", "value": true}
                    },
                    'wm.layouts.view': {
                        "show": {"type": "boolean", "value": true, "bindable" : "in-out-bound"},
                        "deferload": {"type": "boolean", "value": false, "show": false},
                        "viewgroup": {"type": "string", "value": "default"},
                        "animation": {"type": "list", "options": animationOptions}
                    },
                    'wm.layouts.form': {
                        "title": {"type": "string",  "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "novalidate": {"type": "boolean", "show": false},
                        "validationtype": {"type": "select-by-object", "options": [{"label": "Default", "value": "default"}, {"label": "HTML", "value": "html"}, {"label": "No Validations", "value": "none"}], "value": "default", "displayfield": "label", "datafield": "value", "showindesigner": true},
                        "autocomplete": {"type": "boolean", "value": true, "showindesigner": true},
                        "action": {"type": "string", "bindable": "in-bound", "showindesigner": true},
                        "target": {"type": "list", "options": ["_blank", "_parent", "_self", "_top"], "value": "", "widget": "data-list", "showindesigner": true},
                        "method": {"type": "list", "options": ["post", "put", "delete"], "showindesigner": true},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "dataset": {"type": "array, object", "widget": "string", "bindable": "in-bound"},
                        "captionsize": {"type": "string", "show": false},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "formdata": {"type": "object", "bindable": "in-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "dataoutput": {"type": "object", "bindable": "out-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "messagelayout": {"type": "list", "options": ["Inline", "Toaster"], "value": "Inline", "showindesigner": true},
                        "postmessage": {"type": "string", "value": "Data posted successfully", "bindable": "in-bound", "showindesigner": true},
                        "errormessage": {"type": "string", "value": "An error occured. Please try again!", "bindable": "in-bound", "showindesigner": true},
                        "captionalign": {"type": "list", "options": ["left", "center", "right"], "value": "left", "showindesigner": true, "widget": "icons-align"},
                        "enctype": {"type": "list", "options": ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], "showindesigner": true},
                        "metadata": {"type": "array, object",  "bindable": "in-bound", "widget": "string", "show": false},
                        "advancedsettings": {"type": "button", "hidelabel": true, "iconclass": "web-service"},
                        "captionposition": {"type": "list", "options": ["left", "right", "top"], "value": "left", "showindesigner": true, "widget": "toggle-radio", "prefix": "position-"},
                        "captionwidth": {"type": "string", "widget": "device-config", "value": "xs-12 sm-3 md-3 lg-3", "showindesigner": true, "widthHeader": "Column Width", "deviceHeader": "Device", "deviceSizes": columnWidths},

                        "onResult": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onError": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforerender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onBeforesubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "tabindex": {"type": "number", "value": "0"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "margin": {"type": "string", "widget": "box-model"},
                        "formWidgets": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "isWidgetMap": true},
                        "validationMessages": {"type": "object", "bindable": "out-bound", "isList": true, "widget": "string"}
                    },
                    'wm.layouts.form.mobile': {
                        "captionwidth": {"type": "string", "widget": "device-config", "value": "xs-4 sm-4 md-4 lg-4", "showindesigner": true, "widthHeader": "Column Width", "deviceHeader": "Device", "deviceSizes": columnWidths}
                    },
                    'wm.layouts.login': {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforerender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker"},
                        "margin": {"type": "string", "widget": "box-model"}
                    },
                    'wm.layouts.liveform': {
                        "title": {"type": "string",  "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "formlayout": {"type": "toggle", "options":  {"onLabel": "INLINE", "onValue": "inline", "offLabel": "PAGE", "offValue": "page"}, "value": "inline", "show" : false},
                        "autocomplete": {"type": "boolean", "value": false, "showindesigner": true},
                        "captionsize": {"type": "string", "value": "", "show": false},
                        "captionalign": {"type": "string", "options": ["left", "center", "right"], "value": "left", "showindesigner": true, "widget": "icons-align"},
                        "captionposition": {"type": "string", "options": ["left", "right", "top"], "value": "left", "showindesigner": true, "widget": "toggle-radio", "prefix": "position-"},
                        "captionwidth": {"type": "string", "widget": "device-config", "value": "xs-12 sm-3 md-3 lg-3", "showindesigner": true, "widthHeader": "Column Width", "deviceHeader": "Device", "deviceSizes": columnWidths},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "advancedsettings": {"type": "button", "hidelabel": true, "iconclass": "web-service"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "rowdata": {"type": "string"},
                        "formdata": {"type": "object", "bindable": "in-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "dataoutput": {"type": "object", "bindable": "out-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "novalidate": {"type": "boolean", "showindesigner": false, "show": false},
                        "validationtype": {"type": "select-by-object", "options": [{"label": "Default", "value": "default"}, {"label": "HTML", "value": "html"}, {"label": "No Validations", "value": "none"}], "value": "default", "displayfield": "label", "datafield": "value", "showindesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "show": false},
                        "defaultmode": {"type": "toggle", "options": {"onLabel": "READONLY", "onValue": "View", "offLabel": "EDITABLE", "offValue": "Edit"}, "value": "View", "showindesigner": true},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "messagelayout": {"type": "list", "options": ["Inline", "Toaster"], "value": "Toaster", "showindesigner": true},
                        "insertmessage": {"type": "string", "value": "Record added successfully", "bindable": "in-bound", "showindesigner": true},
                        "updatemessage": {"type": "string", "value": "Record updated successfully", "bindable": "in-bound", "showindesigner": true},
                        "deletemessage": {"type": "string", "value": "Record deleted successfully", "bindable": "in-bound", "showindesigner": true},
                        "errormessage": {"type": "string", "value": "An error occured. Please try again!", "bindable": "in-bound", "showindesigner": true},
                        /*Events*/
                        "onBeforeservicecall": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onResult": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onError": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "tabindex": {"type": "number", "value": "0"},
                        // property specific to mobile with formlayout page
                        "onBackbtnclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundgradient": {"type": "string"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "backgroundrepeat": {"type": "list", "options": ["no-repeat", "repeat", "repeat-x", "repeat-y"]},
                        "backgroundsize": {"type": "string", "hint": "width, height"},
                        "backgroundposition": {"type": "string", "hint": "top, left"},
                        "backgroundattachment": {"type": "list", "options": ["fixed", "local", "scroll"]},
                        "margin": {"type": "string", "widget": "box-model"},
                        "formWidgets": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "isWidgetMap": true},
                        "validationMessages": {"type": "object", "bindable": "out-bound", "isList": true, "widget": "string"}
                    },
                    'wm.layouts.liveform.mobile': {
                        "captionwidth": {"type": "string", "widget": "device-config", "value": "xs-4 sm-4 md-4 lg-4", "showindesigner": true, "widthHeader": "Column Width", "deviceHeader": "Device", "deviceSizes": columnWidths}
                    },
                    "wm.layouts.segmentedcontrol" : {
                        "onBeforesegmentchange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSegmentchange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "width": {"show": false},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "tabindex": {"type": "number", "value": "0"},
                        "addchild": {"label": "Add", "hidelabel": true, "options": [{"label": "Segmented Content", "widgettype": "wm-segment-content"}], "widget": "add-widget"}
                    },
                    "wm.layouts.segmentcontent" : {
                        "caption": {"type": "string", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex}
                    },
                    'wm.table': {
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "pagesize": {"type": "number"},
                        "advancedsettings": {"type": "button", "hidelabel": true, "iconclass": "web-service"},
                        "gridfirstrowselect": {"type": "boolean", "showindesigner": true},
                        "formposition": {"type": "select-by-object", "options": [{"label": "Top", "value": "top"}, {"label": "Bottom", "value": ""}], "value": "", "displayfield": "label", "datafield": "value", "showindesigner": true},
                        "shownewrow": {"type": "boolean", "show": false, "value": true},
                        "confirmdelete": {"type": "string", "value": "Are you sure you want to delete this?", "bindable": "in-bound", "show": true, "showindesigner": true},
                        "deleterow": {"type": "boolean", "bindable": "in-bound", "show": false},
                        "updaterow": {"type": "boolean", "bindable": "in-bound", "show": false},
                        "showheader": {"type": "boolean", "value": true, "showindesigner": true},
                        "gridsearch": {"type": "boolean", "show": false, "showindesigner": false},
                        "rowclass": {"type": "string", "value": "", "showindesigner": true},
                        "rowngclass": {"showindesigner": "true", "widget": "conditional-expression"},
                        "filtermode": {"type": "select-by-object", "options": [{"labelkey": "LABEL_NO_FILTER", "value": ""}, {"labelkey": "LABEL_SEARCH", "value": "search"}, {"labelkey": "LABEL_MULTI_COLUMN", "value": "multicolumn"}], "value": "", "displayfield": "label", "datafield": "value", "showindesigner": true},
                        "searchlabel": {"type": "string", "value": "Search", "bindable": "in-bound", "show": false, "showindesigner": false, "alignright": true},
                        "enablesort": {"type": "boolean", "value": true, "showindesigner": true},
                        "enablecolumnselection": {"type": "boolean", "showindesigner": true},
                        "showrowindex": {"type": "boolean", "showindesigner": true},
                        "multiselect": {"type": "boolean", "showindesigner": true},
                        "radioselect": {"type": "boolean", "showindesigner": true},
                        "insertrow": {"type": "boolean", "bindable": "in-bound", "show": false},
                        "editmode": {"type": "string", "value": "", "show": false},
                        "showrecordcount": {"type": "boolean", "show": false, "showindesigner": true},
                        "navigation": {"type": "list", "options": ["Basic", "Pager", "Classic", "None"], "value": "Basic", "showindesigner": true},
                        "navigationalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "value": "left", "showindesigner": true},
                        "filternullrecords": {"type": "boolean", "value": true},
                        "nodatamessage": {"type": "string", "value": "No data found.", "bindable": "in-bound", "showindesigner": true},
                        "loadingdatamsg": {"type": "string", "value": "Loading...", "bindable": "in-bound", "showindesigner": true},
                        "loadingicon": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "value": "fa fa-circle-o-notch fa-spin", "pattern": classRegex},
                        "deletemessage": {"type": "string", "value": "Record deleted successfully", "bindable": "in-bound", "show": true, "showindesigner": true},
                        "errormessage": {"type": "string", "value": "", "bindable": "in-bound", "showindesigner": true},
                        "insertmessage": {"type": "string", "value": "Record added successfully", "bindable": "in-bound", "showindesigner": true},
                        "updatemessage": {"type": "string", "value": "Record updated successfully", "bindable": "in-bound", "showindesigner": true},
                        "deleteoktext": {"type": "string", "value": "bind:appLocale.LABEL_OK", "bindable": "in-bound", "showindesigner": true},
                        "deletecanceltext": {"type": "string", "value": "bind:appLocale.LABEL_CANCEL", "bindable": "in-bound", "showindesigner": true},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset", "getIsListFrom": "expr:multiselect"},
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "spacing": {"type": "list", "options": ["normal", "condensed"], "value": "normal"},
                        "exportformat": {"type": "list", "widget": "select-all", "options": ["EXCEL", "CSV"], "showindesigner": true},
                        "exportdatasize": {"type": "number",  "value": 100, "showindesigner": true},
                        "margin": {"type": "string", "widget": "box-model", "show": false}, //Deprecated margin property for data table
                        "currentItem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset"},

                        /* Events */
                        "onClick": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onTap": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowdeselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSort": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onHeaderclick": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onShow": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onHide": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforeformrender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onFormrender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowdelete": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforerowinsert": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowinsert": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforerowupdate": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforerowdelete": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowupdate": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onError": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowclick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onRowdblclick": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onColumnselect": {"type": "event", "show": false,"options": widgetEventOptions, "widget": "eventlist"},
                        "onColumndeselect": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onSetrecord": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},
                        "onDatarender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforedatarender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforeexport": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onBeforefilter": {"type": "event", "show": false, "options": widgetEventOptions, "widget": "eventlist"},

                        /* Styles */
                        "gridclass": {"type": "string", "value": "table-bordered table-striped table-hover", "pattern": classRegex, "widget": "list-picker", "options": ["table-hover", "table-bordered", "table-striped"]},
                        "tabindex": {"type": "number", "value": "0"}

                    },
                    'wm.livetable': {
                        'formlayout': {"type": "list", "options": ["inline", "dialog"], "value": "inline"}
                    },
                    'wm.fileupload': {
                        "multiple": {"type": "boolean", "value": false},
                        "contenttype": {"type": "list", "bindable": "in-out-bound", "widget" : "list-picker", "options": ["image/*", "audio/*", "video/*", ".txt", ".zip", ".rar", ".js", ".json", ".xls", ".xlsx", ".pdf", ".csv", ".xml", ".doc", ".docx", ".log", ".rtf", ".bmp", ".gif", ".jpe", ".jpg", ".jpeg", ".tif", ".tiff", ".pbm", ".png", ".ico", "mp3", ".ogg", ".webm", ".wma", ".3gp", ".wav", "mp4", ".ogg", ".webm", ".wmv", ".mpeg", ".mpg", ".avi"]},
                        "fileuploadmessage": {"type": "string", "bindable": "in-out-bound", "value": "You can also browse for files"},
                        "tabindex": {"type": "number", "value": "0"},
                        "selectedFiles": {"type": "array, file", "isList": true, "bindable": "in-out-bound", "show" : "false", "getTypeFrom": "expr:getPropertyType('selectedFiles')"},
                        "maxfilesize": {"type": "string", "widget": "fileupload-relativepath", "bindable": "in-out-bound", "value": "",  "info": "size in MB"},
                        "caption": {"type": "string", "value": "Upload", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "disabled": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "value" : "wi wi-file-upload", "pattern": classRegex},
                        "filelistheight": {"type": "string", "pattern": dimensionRegex, "show": false},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["bg-primary", "bg-success", "bg-info", "bg-warning", "bg-danger"]},

                        /* ---- events ---- */
                        "onBeforeselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    'wm.fileupload.mobile': {
                        "fileuploadmessage": {"show": false},
                        "contenttype": {"widget" : "list", "options": ['image', 'audio', 'video', 'files']}
                    },
                    'wm.youtube': {
                        "width": { "value": "800px", "pattern": dimensionRegex},
                        "height": {"value": "125px", "pattern": dimensionRegex},
                        "uploadpath": {"type": "string"}
                    },
                    "wm.anchor": {
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex},
                        "iconurl": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconwidth": {"type": "string", "pattern": dimensionRegex},
                        "iconheight": {"type": "string", "pattern": dimensionRegex},
                        "iconmargin": {"type": "string", "pattern": dimensionRegex},
                        "iconposition": {"type": "list", "options": ["left", "top", "right"]},
                        "caption": {"type": "string", "value": "Link", "bindable": "in-out-bound", "maxlength": 256, "showPrettyExprInDesigner": true},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound", "showPrettyExprInDesigner": true},
                        "hyperlink": {"type": "string", "bindable": "in-out-bound"},
                        "encodeurl": {"type": "boolean", "value": false},
                        "target": {"type": "list", "options": ["_blank", "_parent", "_self", "_top"], "value": "_self", "widget": "data-list"},
                        "tabindex": {"type": "number", "value": "0"},
                        "whitespace": {"type": "list", "options": [" ", "normal", "nowrap", "pre", "pre-line", "pre-wrap"], "value": " "},
                        "wordbreak": {"type": "list", "options": ["break-word", "normal"]},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline'},
                        "animation": {"type": "list", "options": animationOptions},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["h1", "h2", "h3", "h4", "h5", "h6", "btn-primary", "btn-success", "btn-info", "btn-warning", "btn-danger", "btn-lg", "btn-sm", "btn-xs", "btn-link", "text-ellipsis", "text-left", "text-right", "text-center", "text-muted", "text-primary", "text-success", "text-info", "text-warning", "text-danger", "vertical-align-top", "vertical-align-middle", "vertical-align-bottom", "lead", "badge", "app-header-action"]},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "show": false}
                    },
                    "wm.popover": {
                        "contentsource": {"type": "list", "options": ['inline', 'partial'], value: "partial"},
                        "content": {"type": "string", "options": [], "widget": "pages-list", value: "", "bindable": "in-bound"},
                        "inlinecontent": {"type": "string", "widget": "textarea"},
                        "hyperlink": {"type": "string", "value": "", "show": false, "bindable": false},
                        "target": {"type": "string", "value" : "", "show": false},
                        "popoverwidth" :  {"type": "string"},
                        "popoverheight" :  {"type": "string"},
                        "popoverarrow" :  {"type": "boolean", "value" : true},
                        "popoverautoclose": {"type": "boolean", "value" : true, "show": false},
                        "interaction": {"type": "select-by-object", "options": [{'label': 'Click', 'value': 'click'}, {'label': 'Hover', 'value': 'hover'}, {'label': 'Click and Hover', 'value': 'default'}], value: "click"},
                        "popoverplacement": {"type": "select-by-object", "options": popoverOptions, "value": "bottom"},
                        "title": {"type": "string", "bindable": "in-bound"},
                        "onShow": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onHide": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onLoad": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "conditionalclass": {"show": false, "bindable": "in-bound"},
                        "contentanimation": {"type": "list", "options": animationOptions}
                    },
                    "wm.prefabs": {
                        "margin": {"type": "string", "widget": "box-model"},
                        "debugurl": {"type": "string", "show": false},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "onLoad": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "displayName" : "On Load"},
                        "onDestroy": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "displayName" : "On Destroy"},
                        "animation": {"type": "list", "options": animationOptions},
                        "tabindex": {"type": "number", "value": "0"}
                    },

                    "wm.accordion": {
                        "addchild": {"hidelabel": true, "options": [{"labelKey": "LABEL_ADD_ACCORDION_PANE", "label": "Add Accordion Pane", "widgettype": "wm-accordionpane"}], "widget": "add-widget"},
                        "closeothers": { "type": "boolean", "value": true},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "tabindex": {"type": "number", "value": "0"},
                        "defaultpaneindex": {"type": "number", "value": 0, "bindable": "in-bound"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    "wm.accordionpane": {
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "onExpand": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onCollapse": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "title": {"type": "string", "value": "Title", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound", "showPrettyExprInDesigner": true},
                        "badgetype": {"type": "string", "widget": "list", "options": ["default", "primary", "success", "info", "warning", "danger"], "value": "default", "bindable": "in-out-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "isdefaultpane": {"type": "boolean", "bindable": "in-bound", "show": false}, //Deprecated property
                        "padding": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "color": {"type": "string", "widget": "color"},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE}
                    },

                    "wm.richtexteditor": {
                        "hint": {"type": "string"},
                        "show": {"type": "boolean", "value": true},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "datavalue": {"type": "string", value: "", "bindable": "in-out-bound"},
                        "showpreview": {"type": "boolean", "value": false},
                        "placeholder": {"type": "string", "bindable": "in-bound"},
                        "htmlcontent": {"type": "string", "bindable": "out-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex}
                    },

                    "wm.tabs": {
                        "addchild": {"hidelabel": true, "options": [{"labelKey": "LABEL_ADD_TAB_PANE", "label": "Add Tab Pane", "widgettype": "wm-tabpane"}], "widget": "add-widget"},
                        "gestures": {"type": "string", "value": "on", "bindable": "in-bound"},
                        "tabsposition": {"type": "list",  "options": ["left", "top", "right", "bottom"], "value": "top"},
                        "taborder": {"type": "list", "widget": "tab-order", "dataset": []},
                        "transition": {"type": "list", "options": ["none", "slide"], "value": "none"},
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align"},
                        "defaultpaneindex": {"type": "number", "value": 0, "bindable": "in-bound"},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },

                    'wm.tabs.mobile': {
                        "transition": {"type": "list", "options": ["none", "slide"], "value": "slide"}
                    },

                    "wm.tab": {
                        "title": {"type": "string", "bindable": "in-bound"}
                    },
                    "wm.tabpane": {
                        "disabled": {"type": "boolean", "bindable": "in-bound"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onDeselect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "title": {"type": "string", "value": "Tab Title", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "paneicon": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "isdefaulttab": {"type": "boolean", "bindable": "in-bound", "show": false}, //Deprecated property
                        "tabindex": {"type": "number", "value": "0"},
                        "badgevalue": {"type": "string", "bindable": "in-out-bound", "showPrettyExprInDesigner": true},
                        "badgetype": {"type": "string", "widget": "list", "options": ["default", "primary", "success", "info", "warning", "danger"], "value": "default", "bindable": "in-out-bound"}
                    },
                    "wm.wizard": {
                        "addchild": {"hidelabel": true, "options": [{"labelKey": "LABEL_ADD_STEP", "label": "Add Step", "widgettype": "wm-wizardstep"}], "widget": "add-widget"},
                        "nextbtnlabel": {"type": "string", "value": "Next", "bindable": "in-bound"},
                        "cancelbtnlabel": {"type": "string", "value": "Cancel", "bindable": "in-bound"},
                        "previousbtnlabel": {"type": "string", "value": "Previous", "bindable": "in-bound"},
                        "donebtnlabel": {"type": "string", "value": "Done", "bindable": "in-bound"},
                        "onDone": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onCancel": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "cancelable": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "stepstyle":  {"type": "list", "options": ["auto", "justified"], "value": "auto"},
                        "actionsalignment": {"type": "list", "options": ["left", "right"], "value": "right"},
                        "defaultstep": {"type": "string", "widget": "select-by-object", "value": "none", "bindable": "in-bound"}
                    },
                    "wm.wizardstep": {
                        "title": {"type": "string", "value": "Step Title", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "disablenext": {"type": "boolean", "value": false, "show": false},
                        "disableprevious": {"type": "boolean", "value": false, "show": false},
                        "disabledone": {"type": "boolean", "value": false, "show": false},
                        "enabledone": {"type": "boolean", "value": false, "show": false},
                        "enableskip": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-out-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "onNext": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onPrev": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onLoad": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSkip": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "loadmode" : {"type" : "list", "show": false, "value" : "after-select"}
                    },
                    "wm.carousel" : {
                        "addchild": {"hidelabel": true, "options": [{"labelKey":"LABEL_ADD_CAROUSEL", "label": "Add Carousel", "widgettype": "wm-carousel-content"}], "widget": "add-widget"},
                        "gestures": {"type": "string", "value": "on", "bindable": "in-bound"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string", "show": false},
                        "animationinterval" : {"type" : "number", "value" : "3"},
                        "type" : {"type" : "string", "show" : false},
                        "currentslide": {"type": "object", "bindable": "in-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "animation": {"type": "list", "options": ["auto", "none"], "value": "auto"},
                        "controls": {"type": "list", "options": ["navs", "indicators", "both", "none"], "value": "both"},

                        "class": {"type": "string", "pattern": classRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'block'},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "currentItem": {"type": "object", "bindable": "in-bound", "show": false, "widget": "string", "getTypeFrom": "dataset"},
                        "nodatamessage": {"type": "string", "value": "No data found", "bindable": "in-bound"}
                    },
                    "wm.tabbar" : {
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "morebuttoniconclass": {"type": "string", "widget": "select-icon", "pattern": classRegex, "value": "wi wi-more-horiz"},
                        "morebuttonlabel":  {"type": "string", "value": "more"}
                    },
                    "wm.tabbar.dataProps": {
                        "itemlabel": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "itemlink": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "itemicon": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"}
                    },
                    "wm.list": {
                        "name": {"type": "string", "pattern": nameRegex, "maxlength": 32},
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "enablereorder": {"type": "boolean"},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE},
                        "onSelectionlimitexceed" : {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onReorder" : {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSelect" : {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "pagesize": {"type": "number", "value": 20},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "selectionlimit": {"type": "number", "bindable": "in-bound"},
                        "itemsperrow": {"type": "string", "widget": "device-config", "widthHeader": "Items per row", "deviceHeader": "Device", "deviceSizes": ['1', '2', '3', '4', '6', '12'], "tableClass": "wm-table-dark"},
                        "selecteditem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset", "getIsListFrom": "expr:multiselect"},
                        "onSetrecord": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onBeforedatarender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onPaginationchange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "itemclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group-item", "media"], "bindable": "in-bound"},
                        "listclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["list-group", "list-inline", "media-list"]},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "value": "", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "navigation": {"type": "select-by-object", "options": [{'value': 'Basic', 'label': 'Basic'}, {'value': 'Pager', 'label': 'Pager'}, {'value': 'Classic', 'label': 'Classic'}, {'value': 'Scroll', 'label': 'Infinite Scroll'}, {'value': 'Inline', 'label': 'Horizontal Slider'}, {'value': 'None', 'label': 'None'}, {'value': 'On-Demand', 'label': 'On Demand'}], "value": "None"},
                        "navigationalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "value": "left"},
                        "selectfirstitem": {"type": "boolean", "value": false, "bindable": "in-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "groupby": {"type": "list", "show": true, "widget": "list-typeahead", "datasetfilter": "terminals"},
                        "match": {"type": "list-group", "nonGroupOptions": timeNonGroupOptions, "options": timeGroupOptions, "show": false, "value": "word", "datasetfilter": "none"},
                        "dateformat": {"type": "list", "options": [], "widget": "date-time-patterns", "show": false},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"},
                        "nodatamessage": {"type": "string", "value": "No data found", "bindable": "in-bound"},
                        "loadingdatamsg": {"type": "string", "value": "Loading...", "bindable": "in-bound"},
                        "selectedItemWidgets": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "isWidgetMap": true},
                        "currentItemWidgets": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "isWidgetMap": true},
                        "currentItem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset"},
                        "multiselect": {"type": "boolean", "value": false},
                        "collapsible": {"type": "boolean", "show": false},
                        "showcount": {"type": "boolean", "show": false},
                        "disableitem": {"type": "boolean", "bindable": "in-bound", "value": false},
                        "ondemandmessage": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true, "value": "Load More"},
                        "loadingicon": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "value": "fa fa-circle-o-notch", "pattern": classRegex},
                        "paginationclass": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["pagination-sm", "pagination-lg", "btn-default", "btn-primary", "btn-info", "btn-warning", "btn-success", "btn-danger", "btn-inverse", "btn-lg", "btn-sm", "btn-xs", "btn-raised", "btn-fab", "btn-link", "btn-transparent", "jumbotron"]}
                        },
                    "wm.list.mobile": {
                        "templateview": {"options": [{'label': 'ListTemplate', 'value': 'listtemplate', 'widgettype': 'wm-listtemplate', 'isAdded': true }, {'label': 'LeftActionTemplate', 'value': 'leftactiontemplate', 'widgettype': 'wm-list-action-template', 'defaults': {'wm-list-action-template': {'position': 'left'} } }, {'label': 'RightActionTemplate', 'value': 'rightactiontemplate', 'widgettype': 'wm-list-action-template', 'defaults': {'wm-list-action-template': {'position': 'right'} } }], "widget": "add-widget-by-prop", "value": "listtemplate"}
                    },
                    "wm.medialist": {
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "thumbnailurl": {"type": "list", "options": ["All Fields"], "value": "All Fields", "datasetfilter" : "terminals"},
                        "mediaurl": {"type": "list", "options": ["All Fields"], "value": "All Fields", "datasetfilter" : "terminals"},
                        "layout": {"type": "list", "options": ["Single-row", "Multi-row"], "value": "Single-row"},
                        "tabindex": {"type": "number", "value": "0"},
                        "currentItem": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "getTypeFrom": "dataset"}
                    },
                    "wm.medialist.mobile" : {
                        "offline": {"type": "boolean", "value" : true}
                    },
                    "wm.livefilter": {
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "autocomplete": {"type": "boolean", "value": true, "showindesigner": true},
                        "captionsize": {"type": "string", "value": "", "show": false},
                        "captionalign": {"type": "string", "options": ["left", "center", "right"], "value": "left", "showindesigner": true, "widget": "icons-align"},
                        "captionposition": {"type": "string", "options": ["left", "right", "top"], "value": "left", "showindesigner": true, "widget": "toggle-radio", "prefix": "position-"},
                        "captionwidth": {"type": "string", "widget": "device-config", "value": "xs-12 sm-3 md-3 lg-3", "showindesigner": true, "widthHeader": "Column Width", "deviceHeader": "Device", "deviceSizes": columnWidths},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "advancedsettings": {"type": "button", "hidelabel": true, "iconclass": "web-service"},
                        "result": {"type": "object", "bindable": "out-bound", "isList": true, "widget": "string", "show": "false", "getTypeFrom": "dataset"},
                        "pagesize": {"type": "number", "value": 20},
                        "horizontalalign": {"type": "string", "options": ["left", "center", "right"], "widget": "icons-align", "show": false},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "value": "wi wi-filter-list", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "autoupdate":  {"type": "boolean", "showindesigner": true},
                        /* Events */
                        "onBeforeservicecall": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onError": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSuccess": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "tabindex": {"type": "number", "value": "0"},
                        "collapsible": {"type": "boolean", "showindesigner": true},
                        "expanded": {"type": "boolean", "value": true, "showindesigner": true},
                        "enableemptyfilter": {"type": "select-all", "options": ["null", "empty"], "displaytype": "block", "value": " ", "showindesigner": true},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "margin": {"type": "string", "widget": "box-model"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "filterWidgets": {"type": "object", "bindable": "in-out-bound", "show": false, "widget": "string", "isWidgetMap": true}
                    },
                    'wm.livefilter.mobile': {
                        "captionwidth": {"type": "string", "widget": "device-config", "value": "xs-4 sm-4 md-4 lg-4", "showindesigner": true, "widthHeader": "Column Width", "deviceHeader": "Device", "deviceSizes": columnWidths}
                    },
                    "wm.search": {
                        "datavalue": {"type": "string, object", "widget": "string", "bindable": "in-out-bound", "getTypeFrom": "dataset"},
                        "result": {"type": "array", "value": [], "bindable": "out-bound", "getTypeFrom": "dataset"},
                        "query": {"type": "string", "bindable": "out-bound"},
                        "searchkey": {"type": "string", "widget": "select-all", "datasetfilter" : "custom"},
                        "displaylabel": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "displayimagesrc": {"type": "string", "widget": "list", "options": [""], "bindable": "in-bound", "bindonly": "expression", "datasetfilter" : "terminals"},
                        "datafield": {"type": "list", "options": ["All Fields"], "value": "All Fields", "datasetfilter" : "terminals", "allfields" : true},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "limit": {"type": "number"},
                        "searchon": {"type": "select-by-object", "options": [{"label": "Typing", "value": "typing"}, {"label": "On search icon click", "value": "onsearchiconclick"}], "value": "typing", "show": false},
                        "placeholder": {"type": "string", "value": "Search", "bindable": "in-bound"},
                        "onBeforeservicecall": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "tabindex": {"type": "number", "value": "0"},
                        "minchars": {"type": "number"},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "shortcutkey": {"type": "string"},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["input-group-sm", "input-group-lg"]},
                        "casesensitive": {"type": "boolean", "show": "false", "value": false},
                        "showsearchicon": {"type": "boolean", "show": "false", "value": false},
                        /* searchbar in mobile-navbar*/
                        "navsearchbar": {"type": "string", "show": "false"},
                        "readonly": {"type": "boolean", "bindable": "in-bound"},
                        "type": {"type": "string", "widget": "list", "options": ["search", "autocomplete"], "value": "search", "show": true},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "terminals"},
                        "loadingdatamsg": {"type": "string", "value": "Loading items...", "bindable": "in-bound"},
                        "datacompletemsg": {"type": "string", "value": "No more data to load", "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "imagewidth": {"type": "string", "value": "16px"},
                        "onClick": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onTap": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onMouseenter": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onMouseleave": {"type": "event", "options": widgetEventOptions, "widget": "eventlist", "show": false},
                        "onChange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "debouncetime": {"type": "number", "value": "250", "show": true},
                        "matchmode": {"type": "select-by-object", "options": matchModes, "value": "startignorecase", "show": false}
                    },
                    "wm.chart": {
                        "title": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "subheading": {"type": "string", "bindable": "in-bound", "showPrettyExprInDesigner": true},
                        "iconclass": {"type": "string", "widget": "select-icon", "bindable": "in-bound", "pattern": classRegex, "label": 'LABEL_TITLEICONCLASS'},
                        "advancedsettings": {"type": "button", "hidelabel": true, "iconclass": "web-service"},
                        "height": {"type": "string", value: "210px", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "type": {"type": "string", "widget": "list", "options": ["Area", "Bar", "Bubble", "Column", "Cumulative Line", "Donut", "Line", "Pie"], "bindable": "in-out-bound", "show": false},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "formattype": {"type": "select-by-object", "options": [{"label": "toNumber", "value": "integer"}, {"label": "toDate", "value": "date"}], "value": "", "displayfield": "label", "datafield": "value", "showindesigner": false},
                        "xaxisdatakey": {"type": "list", "widget": "list", "datasetfilter" : "custom"},
                        "xaxislabel": {"type": "string", "bindable": "in-bound"},
                        "xunits": {"type": "string"},
                        "xnumberformat": {"type": "list-group", "options": numberFormatOptions},
                        "xdateformat": {"type": "list-group", "options": dateOptions},
                        "yaxisdatakey": {"type": "list", "widget": "multi-select", "datasetfilter" : "custom"},
                        "yaxislabel": {"type": "string", "bindable": "in-bound"},
                        "yunits": {"type": "string"},
                        "ynumberformat": {"type": "list-group", "options": numberFormatOptions},
                        "bubblesize": {"type": "string", "widget": "list", "datasetfilter" : "custom"},
                        "shape": {"type": "string", "widget": "list", "options": ["circle", "cross", "diamond", "random", "square", "triangle-down", "triangle-up"], value: "circle"},
                        "show": {"type": "boolean", "value": true, "bindable": "in-out-bound"},
                        "highlightpoints": {"type": "boolean"},
                        "linethickness": {"type": "string"},
                        "tooltips": {"type": "boolean", "value": true},
                        "showlegend": {"type": "list", "options": ["hide", "top", "bottom"], "value": "top"},
                        "showxaxis": {"type": "boolean", "value": true},
                        "showyaxis": {"type": "boolean", "value": true},
                        "legendtype": {"type": "list", "options": ["classic", "furious"], "value": "furious", "disabled": false, "show": false},
                        "showvalues": {"type": "boolean", "value": false},
                        "showlabels": {"type": "list", "options":  ['hide', 'inside', 'outside'], "value": "outside"},
                        "viewtype": {"type": "list", "options":  ['Grouped', 'Stacked'], "value": "Grouped"},
                        "interpolation": {"type": "list", "options":  ['linear', 'cardinal', 'step'], "value": "linear"},
                        "areaviewtype": {"type": "list", "options":  ['stack', 'stream', 'expand'], "value": "stack"},
                        "staggerlabels": {"type": "boolean", "value": false},
                        "reducexticks": {"type": "boolean", "value": true},
                        "labeltype": {"type": "select-by-object", "value": "percent", "options" : [{"labelkey": "LABEL_KEY", "value": "key"}, {"labelkey": "LABEL_VALUE", "value": "value"}, {"labelkey": "LABEL_PERCENTAGE", "value": "percent"}, {"labelkey": "LABEL_KEY_VALUE", "value": "key-value"}]},
                        "labelthreshold": {"type": "number", "value": 0.01, "show": false},
                        "offset": {"type": "string", "widget": "box"},
                        "offsettop": {"type": "number", "value": 25, "pattern": numberRegex},
                        "offsetbottom": {"type": "number", "value": 55, "pattern": numberRegex},
                        "offsetleft": {"type": "number", "value": 75, "pattern": numberRegex},
                        "offsetright": {"type": "number", "value": 25, "pattern": numberRegex},
                        "barspacing": {"type": "list", "options": ["small", "medium", "large"], "value": "medium"},
                        "donutratio": {"type": "list", "options": ["small", "medium", "large"], "value": "medium"},
                        "centerlabel": {"type": "string", "bindable": "in-bound", "show": false},
                        "showlabelsoutside": {"type": "boolean", "value": true},
                        "xaxislabeldistance": {"type": "number", "value": 12},
                        "yaxislabeldistance": {"type": "number", "value": 12},
                        "showxdistance": {"type": "boolean", "value": false},
                        "showydistance": {"type": "boolean", "value": false},
                        "aggregation": {"type": "list", "options": ["average", "count", "maximum", "minimum", "none", "sum"], "value": "none", "disabled" : true},
                        "aggregationcolumn": {"type": "list", "widget": "list", "disabled" : true, "datasetfilter" : "custom"},
                        "groupby": {"type": "list", "widget": "multi-select", "datasetfilter" : "custom"},
                        "orderby": {"type": "list", "widget": "order-by", "datasetfilter": "custom"},
                        "theme": {"type": "list", "options": ["Annabelle", "Azure", "Flyer", "GrayScale", "Luminosity", "Mellow", "Orient", "Retro", "Terrestrial"]},
                        "customcolors": {"type": "array", "bindable": "in-bound", "widget": "string"},
                        "nodatamessage": {"type": "string", "value": "No Data Available.", "bindable": "in-bound", "show": false},
                        "xdomain" : {"type": "list", "options": ["Default", "Min"], "value": "Default"},
                        "ydomain" : {"type": "list", "options": ["Default", "Min"], "value": "Default"},
                        /**Style**/
                        "borderwidth": {"type": "string", "widget": "box-model"},
                        "borderstyle": {"type": "string", "options": ["dashed", "dotted", "none", "solid"], "widget": "border-style"},
                        "bordercolor": {"type": "string", "widget": "color"},
                        "backgroundcolor": {"type": "string", "widget": "color"},
                        "backgroundimage": {"type": "string", "bindable": "in-bound"},
                        "color": {"type": "string", "widget": "color"},
                        "selecteditem": {"type": "object", "bindable": "out-bound", "widget": "string", "getTypeFrom": "dataset"},
                        "onBeforerender": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onTransform": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onSelect": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "loadingdatamsg": {"type": "string", "value": "Loading...", "bindable": "in-bound", "show": false}
                    },
                    "wm.pagination": {
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "result": {"type": "object", "bindable": "out-bound", "widget": "string", "show": "false", "getTypeFrom": "dataset"},
                        "onSetrecord": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "onPaginationchange": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"},
                        "tabindex": {"type": "number", "value": "0"},
                        "navigationsize": {"type": "list", "options": ["small", "large"], "show": false},
                        "class": {"type": "string", "pattern": classRegex, "widget": "list-picker", "options": ["pagination-sm", "pagination-lg"]}
                    },
                    "wm.login": {
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "errormessage": {"type": "string", "bindable": "in-bound"},
                        "onSubmit": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.pagecontainer": {
                        "content": {"type": "string", "options": [], "widget": "pages-list", value: "", "bindable": "in-bound"},
                        "onLoad": {"type": "event", "options": widgetEventOptions, "widget": "eventlist"}
                    },
                    "wm.video": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "mp4format": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "oggformat": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "webmformat": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "subtitlelang": {"type": "string", "value": "en", "bindable": "in-out-bound"},
                        "subtitlesource": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "videoposter": {"type": "string", "value": "resources/images/imagelists/default-image.png", "bindable": "in-out-bound"},
                        "controls":  {"type": "boolean"},
                        "videosupportmessage":  {"type": "string", "bindable": "in-bound", "value": "Your browser does not support the video tag."},
                        "autoplay": {"type": "boolean"},
                        "loop": {"type": "boolean"},
                        "muted": {"type": "boolean"},
                        "videopreload": {"type": "list", "options": ["none", "metadata", "auto"], "value": "none"},
                        "tabindex": {"type": "number", "value": "0"},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "class": {"type": "string", "pattern": classRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE}
                    },
                    "wm.audio": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "mp3format": {"type": "string", "value": "", "bindable": "in-out-bound"},
                        "controls": {"type": "boolean"},
                        "audiosupportmessage": {"type": "string", "bindable": "in-bound", "value": "Your browser does not support the audio tag."},
                        "autoplay": {"type": "boolean"},
                        "loop": {"type": "boolean"},
                        "muted": {"type": "boolean", "value": false},
                        "audiopreload": {"type": "list", "options": ["none", "metadata", "auto"], "value": "none"},
                        "tabindex": {"type": "number", "value": "0"},
                        "showindevice": {"type": "select-all", "options": showInDeviceOptions, "value": "all", "displaytype": 'inline-block'},
                        "class": {"type": "string", "pattern": classRegex},
                        "show": {"type": "boolean", "value": true, "bindable": "in-bound"},
                        "height": {"type": "string", "pattern": dimensionRegex},
                        "width": {"type": "string", "pattern": dimensionRegex},
                        "accessroles": {"type": "access-roles-select", "options": roles, "value": EVERYONE}
                    },
                    "wm.progress.bar": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "minvalue": {"type": "number", "value": 0, "bindable": "in-bound"},
                        "maxvalue": {"type": "number", "value": 100, "bindable": "in-bound"},
                        "datavalue": {"type": "number, string", "bindable": "in-out-bound", "widget": "string"},
                        "dataset": {"type": "array, object", "bindable": "in-bound", "widget": "string"},
                        "displayformat": {"type": "list", "options": ["9", "9.9", "9.99", "9.999", "9%", "9.9%", "9.99%", "9.999%"]},
                        "captionplacement": {"type": "list", "options": ["inside", "hidden"], "value": "hidden"},
                        "type": {"type": "list", "options": ["default", "default-striped", "success", "success-striped", "info", "info-striped", "warning", "warning-striped", "danger", "danger-striped"], "value": "default", "bindable": "in-bound"},

                        "width": {"type": "string", "pattern": dimensionRegex},
                        "height": {"type": "string", "pattern": dimensionRegex},

                        /* ---- styles ----*/
                        "margin": {"type": "string", "widget": "box-model"},
                        "tabindex": {"type": "number", "value": "0"}
                    },

                    "wm.progress.circle": {
                        "hint": {"type": "string", "bindable": "in-bound"},
                        "title": {"type": "string", "bindable": "in-bound"},
                        "subtitle": {"type": "string", "bindable": "in-bound"},
                        "percentagevalue": {"type": "number", "bindable": "out-bound"},
                        "minvalue": {"type": "number", "value": 0, "bindable": "in-bound"},
                        "maxvalue": {"type": "number", "value": 100, "bindable": "in-bound"},
                        "datavalue": {"type": "number, string", "value": 30, "bindable": "in-bound", "widget": "string"},
                        "displayformat": {"type": "list", "options": ["9", "9.9", "9.99", "9.999", "9%", "9.9%", "9.99%", "9.999%"], "value": "9%"},
                        "captionplacement": {"type": "list", "options": ["inside", "hidden"], "value": "inside"},
                        "type": {"type": "list", "options": ["default", "success", "info", "warning", "danger"], "value": "default", "bindable": "in-bound"},

                        "width": {"type": "string", "value": "200px", "pattern": dimensionRegex},
                        "height": {"type": "string", "value": "200px", "pattern": dimensionRegex},
                        /* ---- styles ----*/
                        "margin": {"type": "string", "widget": "box-model"}
                    },
                    "wm.template": {
                        "header": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "topnav": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "leftnav": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "rightnav": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"},
                        "footer": {"type": "list", "options": [], "widget": "templates-list", value: "_nocontent"}
                    }
                }
            },
            properties,
            propertyGroups,
            advancedPropertyGroups,
            ignoreList,
            unSupportedProperties;

        if (CONSTANTS.isStudioMode) {
            result.propertyGroups = [
                {"name": "properties", "parent": "", "show": true, "feature": "project.editor.design.basic", "iconClass":"wms wms-properties"},
                {"name": "styles", "parent": "", "show": true, "feature": "project.editor.design.style", "iconClass":"wms wms-styles"},
                {"name": "events", "parent": "", "show": true, "feature": "project.editor.design.events", "iconClass":"wms wms-events"},
                {"name": "device", "parent": "", "show": true, "feature": "project.editor.design.mobile", "iconClass":"wms wms-devices"},
                {"name": "security", "parent": "", "show": true, "feature": "project.editor.design.security", "iconClass":"wms wms-security"},
                {"properties": ["widget", "caption", "gridcaption", "title", "subtitle","displayname", "heading", "subheading", "name", "debugurl", "type", "inputtype", "accept", "filetype", "extensions", "placeholder", "maxplaceholder", "currency", "description", "message", "oktext", "canceltext", "servicevariabletotrack", "valuetype", "alerttype", "iframesrc", "insert", "dropposition", "spacing", "advancedsettings", "addchild", "badgevalue", "badgetype", "homelink"], "parent": "properties"},
                {"name": "accessibility", "properties": ["hint", "tabindex", "shortcutkey", "helptext"], "parent": "properties"},
                {"name": "captionforsteps", "properties": ["nextbtnlabel", "previousbtnlabel", "donebtnlabel", "cancelbtnlabel"], "parent": "properties"},
                {"name": "picture", "properties": ["imageheight", "picturesource", "pictureplaceholder", "pictureaspect", "shape", "picturetitle"], "parent": "properties"},
                {"name": "layout", "properties": ["width", "height", "filelistheight", "treeicons", "menulayout", "menuposition", "levels", "imgsrc", "layoutkind", "columns", "layout", "stepstyle", "actionsalignment", "defaultstep", "navtype", "stacked", "justified", "formlayout", "showheader", "header", "topnav", "leftnav", "rightnav", "footer", "addrow", "addcolumn", "popoverwidth", "popoverheight", "tabsposition", "gridsearch", "filtermode", "searchlabel", "inputwidth"], "parent": "properties"},
                {"name": "video", "properties": ["videoposter", "mp4format", "oggformat", "webmformat", "videopreload", "videosupportmessage", "subtitlesource", "subtitlelang"], "parent": "properties"},
                {"name": "audio", "properties": ["mp3format", "audiopreload", "audiosupportmessage"], "parent": "properties"},
                {"name": "content", "properties": ["contentsource", "content", "inlinecontent", "url"], "parent": "properties"},
                {"name": "partialparams", "properties": [], "parent": "properties"},
                {"name": "display", "properties": ["modal", "vertical", "avatar"], "parent": "properties"},
                {"name": "dataset", "properties": ["service", "operation", "dataset", "options",  "hyperlink", "formfield", "metadata", "searchkey", "matchmode", "displaylabel", "displayimagesrc", "usekeys",  "datafield", "displayfield", "displayexpression", "groupby", "match", "scale", "dateformat", "aggregation", "aggregationcolumn", "orderby", "compareby", "orderbycolumn", "nodelabel", "nodeicon", "nodechildren", "nodeid", "nodeaction", "nodeclick", "thumbnailurl", "mediaurl"], "parent": "properties"},
                {"name": "values", "properties": ["datavalue", "defaultvalue", "maxdefaultvalue", "formdata", "discretevalues", "integervalues", "minimum", "maximum", "defaultcolor", "checkedvalue", "uncheckedvalue"], "parent": "properties"},
                {"name": "valuedisplay", "properties": ["datepattern", "timepattern", "hourstep", "minutestep", "limit"], "parent": "properties"},
                {"name": "output", "properties": ["outputformat"], "parent": "properties"},
                {"name": "eventsdata", "properties": ["eventtitle", "eventstart", "eventend", "eventallday", "eventclass"], "parent": "properties"},
                {"name": "actions", "properties": ["actions", "itemid", "itemlabel", "itemicon", "itemlink", "itemaction", "userrole", "itembadge", "itemchildren"], "parent": "properties"},
                {"name": "xaxis", "properties": ["xaxisdatakey"], "parent": "properties"},
                {"name": "yaxis", "properties": ["yaxisdatakey"], "parent": "properties"},
                {"name": "zaxis", "properties": ["bubblesize"], "parent": "properties"},
                {"name": "validation", "properties": ["required", "validationmessage", "regexp", "mindate", "maxdate", "mintime", "maxtime", "excludedays", "excludedates", "novalidate", "validationtype", "maxchars", "minvalue", "maxvalue", "step"], "parent": "properties"},
                {"name": "behavior", "properties": ["method", "action", "enctype", "target", "defaultview", "templateview", "defaultmode", "defaultpaneindex", "pollinterval", "radiogroup", "viewgroup","showdropdownon", "showweeks", "showbuttonbar", "autofocus", "readonly", "ignoreparentreadonly", "editmode", "scrolldelay", "scrollamount", "direction",
                    "multiple", "maxsize", "inputposition", "allowonlyselect", "enablereorder", "fileuploadmessage", "mode", "show", "deferload", "hideclose", "calendartype", "controls", "view", "disabled", "disableitem", "pagesize", "dynamicslider", "selectionclick", "closeothers", "collapsible", "showcount", "enablefullscreen", "enablefullswipe",
                    "lock", "freeze", "autoscroll", "closable", "showactions", "expanded",  "destroyable", "showDirtyFlag", "link", "linktarget",
                    "uploadpath", "contenttype", "origin", "destination", "maxfilesize", "isdefaulttab", "disablenext", "disableprevious", "disabledone", "enabledone", "enableskip", "cancelable", "isdefaultpane", "autocomplete", "showpreview", "autoplay", "loop", "muted",
                    "xpadding", "ypadding", "interaction", "autoopen", "autoclose", "transition", "animation", "animateitems", "animationinterval", "leftnavpaneliconclass", "backbutton", "backbuttoniconclass", "backbuttonlabel", "searchbutton", "searchon", "position", "debouncetime",
                    "morebuttoniconclass", "menuiconclass", "morebuttonlabel", "capturetype", "loadmode", "loaddelay", "showcaptions", "multiselect", "radioselect", "enablesort", "enablecolumnselection", "gridfirstrowselect", "selectfirstitem", "selectionlimit", "formposition", "enableemptyfilter", "autoupdate", "displayformat", "captionplacement", "updateon", "updatedelay", "actionlink", "actiontitle", "offline", "encodeurl", "keyboard", "barcodeformat", "minchars"], "parent": "properties"},
                {"name": "popoverbehavior", "properties": ["popoverplacement", "contentanimation", "popoverarrow", "popoverautoclose"], "parent": "properties"},
                {"name": "navigation", "properties": ["navigation", "shownavigation", "showrecordcount", "navigationalign", "ondemandmessage"], "parent": "properties"},
                {"name": "searchproperties", "properties": ["searchbuttoniconclass", "searchbuttonlabel", "searchplaceholder"], "parent": "properties"},
                {"name": "datatable", "properties": ["showrowindex", "exportformat", "exportdatasize"], "parent": "properties"},
                {"name": "caption", "properties": ["captionalign", "captionposition", "captionsize", "captionwidth", "mineditorwidth"], "parent": "properties"},
                {"name": "graphics", "properties": ["imagelist", "imageindex", "paneicon", "loadingicon", "iconclass", "iconsize", "iconurl", "iconwidth", "iconheight", "iconmargin", "iconposition", "image", "imagewidth"], "parent": "properties"},
                {"name": "format", "properties": [ "showtooltip", "horizontalalign", "verticalalign", "columnwidth", "xscolumnwidth", "taborder"], "parent": "properties"},
                {"name": "selection", "properties": ["selectionmode"], "parent": "properties"},
                {"name": "operations", "properties": ["insertrow", "deleterow", "updaterow", "submitbutton", "resetbutton"], "parent": "properties"},
                {"name": "message", "properties": ["messagelayout", "errormessage", "insertmessage", "updatemessage", "confirmdelete", "deletemessage", "nodatamessage", "loadingdatamsg", "datacompletemsg", "postmessage"], "parent": "properties"},
                {"name": "deletedialog", "properties": ["deleteoktext", "deletecanceltext"], "parent": "properties"},
                {"properties": [ "class", "conditionalclass", "conditionalstyle", "menuclass", "listclass", "itemclass", "chipclass", "paginationclass", "gridclass", "contentclass"], "parent": "styles"},
                {"name": "textstyle", "properties": [ "fontsize", "fontunit", "fontfamily", "color", "fontstyle", "fontweight", "textdecoration", "textalign", "whitespace"], "parent": "styles"},
                {"name": "backgroundstyle", "properties": ["backgroundcolor", "backgroundimage", "backgroundrepeat", "backgroundposition", "backgroundsize", "backgroundattachment"], "parent": "styles"},
                {"name": "border", "properties": ["bordercolor", "borderstyle", "borderwidth"], "parent": "styles"},
                {"name": "displaystyle", "properties": ["iconcolor", "padding", "margin", "opacity", "overflow", "cursor", "zindex", "visibility", "display"], "parent": "styles"},
                {"name": "prefablifecycleevents", "properties": ["onLoad", "onDestroy"], "parent": "events"},
                {"name": "event", "properties": ["onChange",  "onFocus", "onBlur"], "parent": "events"},
                {"name": "mouseevents", "properties": ["onClick", "onDblclick", "onMousedown", "onMouseup", "onMouseover", "onMouseout", "onMousemove", "onMouseenter", "onMouseleave"], "parent": "events", "platforms": [PLATFORM_TYPE.WEB, PLATFORM_TYPE.DEFAULT]},
                {"name": "touchevents", "properties": ["onTap", "onDoubletap", "onSwipeup", "onSwipedown", "onSwipeleft", "onSwiperight", "onPinchin", "onPinchout"], "parent": "events"},
                {"name": "keyboardevents", "properties": ["onKeydown", "onKeypress", "onKeyup"], "parent": "events"},
                {"name": "callbackevents", "properties": ["onReady", "onStart", "onComplete", "onBeforeupdate", "onBeforeadd", "onAdd", "onBeforeremove", "onRemove", "onShow", "onHide", "onOk", "onBeforesubmit", "onSubmit", "onCancel", "onClose", "onOpened", "onExpand", "onCollapse", "onRowclick", "onRowselect", "onRowdeselect", "onBeforeselect", "onSelect", "onChipclick", "onChipselect", "onDeselect", "onViewrender", "onBeforerender",
                    "onProgress", "onTransform", "onAbort", "onSort", "onGridbuttonclick", "onHeaderclick", "onRowdblclick", "onColumnselect", "onColumndeselect", "onBeforeformrender", "onFormrender", "onBeforerowdelete", "onRowdelete", "onBeforerowinsert", "onRowinsert", "onBeforerowupdate", "onRowupdate", "onResult",  "onSuccess", "onError", "onBeforeservicecall", "onActionsclick",
                    "onBeforesegmentchange", "onSegmentchange", "onSearch", "onBackbtnclick", "onEventdrop", "onEventresize", "onEventclick", "onEventrender", "onBeforereorder", "onReorder", "onSelectionlimitexceed", "onFullscreen", "onExitfullscreen", "onNext", "onPrev", "onSkip", "onDone", "onBeforedatarender", "onDatarender", "onPaginationchange", "onPulltorefresh", "onSetrecord", "onBeforenavigate","onBeforeexport", "onBeforefilter"], "parent": "events"},
                {"name": "security", "properties": ["accessroles"], "parent": "security"},
                {"name": "devicesize", "properties": ["showindevice", "itemsperrow"], "parent": "device"},
                {"name": "gridstyles", "properties": ['rowclass', 'rowngclass'], "parent": "properties"},
                {"name": "imageproperties", "properties": ["imagetargetwidth", "imagetargetheight", "imagequality", "imageencodingtype", "correctorientation", "sourcetype", "savetogallery", "allowedit"], "parent": "properties"}
            ];
            result.advancedPropertyGroups = [
                {"name": "chart", "show": true},
                {"name": "xaxis", "show": true, "icon": 'wi wi-border-bottom'},
                {"name": "yaxis", "show": true, "icon": 'wi wi-border-left'},
                {"name": "value", "show": true, "icon": 'wi wi-data-usage'},
                //chart groups
                {"name": "", "properties": ["centerlabel"], "parent": "chart"},
                {"name": "colors", "properties": ["theme", "customcolors"], "parent": "chart"},
                {"name": "message", "properties": ["nodatamessage", "loadingdatamsg"], "parent": "chart"},
                {"name": "layout", "properties": ["offset"], "parent": "chart"},
                {"name": "legend", "properties": ["showlegend"], "parent": "chart"},
                {"name": "behavior", "properties": ["tooltips", "donutratio", "highlightpoints", "linethickness"], "parent": "chart"},
                {"name": "datarendering", "properties": [ "viewtype", "interpolation", "areaviewtype"], "parent": "chart"},
                //x axis groups
                {"name": "", "properties": ["showxaxis", "xaxislabel", "xunits", "xaxislabeldistance", "xdomain", "showvalues", "staggerlabels", "reducexticks", 'barspacing', 'showxdistance'], "parent": "xaxis"},
                {"name": "xaxisformat", "properties": ["formattype", "xnumberformat", "xdateformat"], "parent": "xaxis"},
                //y axis groups
                {"name": "", "properties": ["showyaxis", "yaxislabel", "yunits", "yaxislabeldistance", "ydomain", 'showydistance'], "parent": "yaxis"},
                {"name": "yaxisformat", "properties": ["ynumberformat"], "parent": "yaxis"},
                //value groups
                {"name": "value", "properties": ['showlabels', 'labeltype'], "parent": "value"},
                {"name": "valueformat", "properties": ["ynumberformat"], "parent": "value"}
            ];
        }
        properties = result.properties;
        propertyGroups = result.propertyGroups;
        advancedPropertyGroups = result.advancedPropertyGroups;

        ignoreList = CONSTANTS.isRunMode ? {'accessroles': true, 'updateon': true, 'updatedelay': true} : {};
        if ($rs.isMobileApplicationType) {
            unSupportedProperties = ['hint', 'shortcutkey', 'tabindex'];
        }

        //gives all the advanced properties list
        function getAdvancedProperties() {
            var advancedProperties = [];
            _.forEach(advancedPropertyGroups, function (group) {
                if (group.parent) {
                    _.forEach(group.properties, function (prop) {
                        advancedProperties.push(prop);
                    });
                }
            });
            return advancedProperties;
        }

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
            var widgetProps, parentsArr,
                mobileProps,
                advancedProperties;

            if (widget === 'wm.chart') {
                advancedProperties = getAdvancedProperties();
            }

            if (!parents) {
                /* This widget doesn't inherit from other widgets. Fetch the properties of only this widget */
                widgetProps = Utils.getClonedObject(properties[widget]);
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
                                if (!ignoreList[key]) {
                                    widgetProps[propName][key] = propObj[key];
                                }
                            });
                        });
                });
            }
            if ($rs.isTabletApplicationType) {
                _.assign(widgetProps, properties[widget + '.mobile'], properties[widget + '.tab']);
            } else if ($rs.isMobileApplicationType) {
                _.assign(widgetProps, properties[widget + '.mobile']);
            }
            if (widgetProps) {
                _.forEach(unSupportedProperties, function (key) {
                    if (widgetProps[key]) {
                        delete widgetProps[key];
                    }
                });
            }

            /* Inject show and disabled fields into each property object */
            if (CONSTANTS.isStudioMode) {
                _.keys(widgetProps)
                    .forEach(function (key) {
                        var property = widgetProps[key];
                        if (!property.hasOwnProperty('show')) {
                            property.show = true;
                        }
                        if (advancedProperties && _.includes(advancedProperties, key) && !property.hasOwnProperty('showindesigner')) {
                            property.showindesigner = true;
                        }
                        property.disabled = property.disabled || false;
                    });
            } else {
                Object.keys(widgetProps).forEach(function (propName) {
                    var propDetails = widgetProps[propName];
                    widgetProps[propName] = _.pick(propDetails, ['type', 'value', 'bindable', 'displaytype']);
                });
            }

            return widgetProps;
        }

        function getPropertyGroups() {
            return propertyGroups;
        }

        function getAdvancedPropertyGroups() {
            return advancedPropertyGroups;
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
            getPropertiesOf             : getPropertiesOf,
            getPropertyGroups           : getPropertyGroups,
            getAdvancedPropertyGroups   : getAdvancedPropertyGroups,
            getPrimaryPropertyGroups    : getPrimaryPropertyGroups,
            getGroupProperties          : getGroupProperties,
            getPropertyGroup            : getPropertyGroup,
            getRoles                    : getRoles,
            setRoles                    : setRoles
        };
    }])

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
    .directive('wmtransclude', ['CONSTANTS', '$timeout', function (CONSTANTS, $timeout) {
        'use strict';

        return {
            'restrict': 'A',
            'link'    : function (scope, element, attrs, nullCtrl, transcludeFn) {

                /*
                 * add data-droptarget-for attribute on the element.
                 * this attribute is useful in studio. it is used to find out the droptarget on an element.
                 */

                if (attrs.widgetid) {
                    element.attr('data-droptarget-for', attrs.widgetid);
                } else if (scope.widgetid) {
                    element.attr('data-droptarget-for', scope.widgetid);
                }

                var eleScope = element.scope(),
                    onTranscludeFn = scope.__onTransclude || WM.noop;

                if (eleScope.hasOwnProperty('$$isolateBindings') && !eleScope.__compileWithIScope) {
                    eleScope = eleScope.$parent;
                }
                scope.__load = WM.noop;
                if (CONSTANTS.isRunMode && scope.loadmode === 'after-select') {
                    scope.__load = function () {
                        transcludeFn(eleScope, function (clone) {
                            element.append(clone);
                            scope.__load = WM.noop;
                            $timeout(onTranscludeFn, undefined, false);
                        });
                    };
                } else if (CONSTANTS.isRunMode &&  scope.loadmode === 'after-delay') {
                    $timeout(function () {
                        transcludeFn(eleScope, function (clone) {
                            element.append(clone);
                            $timeout(onTranscludeFn, undefined, false);
                        });
                    }, scope.loaddelay);
                } else {
                    transcludeFn(eleScope, function (clone) {
                        element.append(clone);
                        onTranscludeFn();
                    });
                }
            }
        };
    }])
    // directive to disable animation on an element.
    .directive('noAnimate', function ($animate) {
        'use strict';
        return {
            'link': function ($s, $el) {
                $animate.enabled($el, false);
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
    .directive('accessroles', function (CONSTANTS, $rootScope, $compile, Utils) {
        "use strict";
        var directive = {};

        function matchRoles(widgetRoles, userRoles) {
            return widgetRoles.some(function (item) {
                return _.includes(userRoles, item);
            });
        }

        /*Decides whether the current logged in user has access to widget or not*/
        function hasAccessToWidget(widgetRoles, userRoles) {
            /* access the widget when 'Everyone' is chosen */
            if (_.includes(widgetRoles, 'Everyone')) {
                return true;
            }

            /* access the widget when 'Anonymous' is chosen and user is not authenticated */
            if (_.includes(widgetRoles, 'Anonymous') && !$rootScope.isUserAuthenticated) {
                return true;
            }

            /* access the widget when 'Only Authenticated Users' is chosen and user is authenticated */
            if (_.includes(widgetRoles, 'Authenticated') && $rootScope.isUserAuthenticated) {
                return true;
            }

            /* access the widget when widget role and logged in user role matches */
            /* TODO(Vineela): to remove isUserAuthenticated check and clean userRoles from $rs on logout */
            return $rootScope.isUserAuthenticated && matchRoles(widgetRoles, userRoles);
        }

        /* the directive is required only in RUN mode and when security is enabled */
        if (CONSTANTS.isRunMode && $rootScope.isSecurityEnabled) {
            directive = {
                "restrict": "A",
                "priority": 10000,
                "terminal": true,
                "link": {
                    "pre": function (scope, element, attrs) {
                        var userRoles   = $rootScope.userRoles || [],
                            widgetRoles = Utils.getWidgetRolesArrayFromStr(attrs.accessroles),
                            clonedElement;

                        if (hasAccessToWidget(widgetRoles, userRoles)) {
                            clonedElement = element.clone();
                            clonedElement.removeAttr("accessroles");
                            element.replaceWith(clonedElement);
                            $compile(clonedElement)(scope);
                        } else {
                            // notify the widget about this change.
                            scope.$emit('security:before-child-remove', scope, element, attrs);
                            element.remove();
                        }
                    }
                }
            };
        }

        return directive;
    })

    /**
     * @ngdoc service
     * @name wm.widgets.$WidgetUtilService
     * @description
     * The `WidgetUtilService` provides utility methods for the widgets
     */
    .service('WidgetUtilService', ['$parse', '$rootScope', 'CONSTANTS', 'Utils', '$templateCache', '$timeout', '$q',
        function ($parse, $rootScope, CONSTANTS, Utils, $templateCache, $timeout, $q) {
            'use strict';

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
                    'onClick':          {'name': 'ng-click',       'value': 'onClick({$event: $event, $scope: this})'},
                    'onDblclick':       {'name': 'ng-dblclick',    'value': 'onDblclick({$event: $event, $scope: this})'},
                    'onMouseenter':     {'name': 'ng-mouseenter',  'value': 'onMouseenter({$event: $event, $scope: this})'},
                    'onMouseleave':     {'name': 'ng-mouseleave',  'value': 'onMouseleave({$event: $event, $scope: this})'},
                    'onMouseover':      {'name': 'ng-mouseover',   'value': 'onMouseover({$event: $event, $scope: this})'},
                    'onMouseout':       {'name': 'ng-mouseout',    'value': 'onMouseout({$event: $event, $scope: this})'},

                    'onFocus':          {'name': 'ng-focus',       'value': 'onFocus({$event: $event, $scope: this})'},
                    'onBlur':           {'name': 'ng-blur',        'value': 'onBlur({$event: $event, $scope: this})'},

                    'onKeypress':       {'name': 'ng-keypress',    'value': 'onKeypress({$event: $event, $scope: this})'},
                    'onKeydown':        {'name': 'ng-keydown',     'value': 'onKeydown({$event: $event, $scope: this})'},
                    'onKeyup':          {'name': 'ng-keyup',       'value': 'onKeyup({$event: $event, $scope: this})'},

                    'onSwipeup':        {'name': 'hm-swipe-up',    'value': 'onSwipeup({$event: $event, $scope: this})'},
                    'onSwipedown':      {'name': 'hm-swipe-down',  'value': 'onSwipedown({$event: $event, $scope: this})'},
                    'onSwipeleft':      {'name': 'hm-swipe-left',  'value': 'onSwipeleft({$event: $event, $scope: this})'},
                    'onSwiperight':     {'name': 'hm-swipe-right', 'value': 'onSwiperight({$event: $event, $scope: this})'},
                    'onPinchin':        {'name': 'hm-pinch-in',    'value': 'onPinchin({$event: $event, $scope: this})'},
                    'onPinchout':       {'name': 'hm-pinch-out',   'value': 'onPinchout({$event: $event, $scope: this})'},
                    'onTap':            {'name': 'ng-click',       'value': 'onTap({$event: $event, $scope: this})'},
                    'onDoubletap':      {'name': 'ng-dblclick',    'value': 'onDoubletap({$event: $event, $scope: this})'}

                },
                $rIC, //requestIdleCallback
                $rICQueue,
                attrsToBeRemoved;

            attrsToBeRemoved =
                ' ng-style ng-change ng-click ng-dblclick ng-mouseout ng-mouseover ng-blur ng-focus' +
                ' ng-show ng-hide ng-readonly ng-disabled ng-required ng-attr-placeholder ng-attr-name' +
                ' on-change on-focus on-blur on-click on-dblclick on-mouseover on-mouseout on-rowclick on-columnselect on-columndeselect ' +
                ' backgroundattachment backgroundcolor backgroundgradient backgroundposition backgroundrepeat backgroundsize bordercolor borderradius ' +
                ' borderstyle color cursor display fontfamily fontstyle fontvariant fontweight horizontalalign lineheight ' +
                ' opacity overflow padding picturesource avatar textalign textdecoration verticalalign visibility ' +
                ' whitespace wordbreak zindex borderwidth margin fontsize fontunit show hint caption animation backgroundimage iconposition iconclass conditionalclass conditionalstyle smoothscroll';


            //use requestIdleCallback when available otherwise use setTimeout
            $rIC = window.requestIdleCallback || window.setTimeout;

            $rICQueue = [];

            function cleanupMarkup(element) {
                if (!$rICQueue.length) {
                    $rIC(function () {
                        var i;
                        // use the native for to improve the performance
                        for (i = 0; i < $rICQueue.length; i++) {
                            $rICQueue[i].removeAttr(attrsToBeRemoved);
                        }
                        $rICQueue.length = 0;
                        element.removeAttr(attrsToBeRemoved);
                    });
                }

                $rICQueue.push(element);
            }

            //Returns array of classes that are evaluated true for given object or array
            function arrayClasses(classVal) {
                var classes = [];


                if (WM.isArray(classVal)) {
                    _.forEach(classVal, function(v) {
                        classes = classes.concat(arrayClasses(v));
                    });

                    return classes;
                } else if (WM.isObject(classVal)) {
                    _.forEach(classVal, function(val, key) {
                        if (val) {
                            classes = classes.concat(key.split(' '));
                        }
                    });

                    return classes;
                }
            }

            //Gets list of classes to add and remove and applies on the $el
            function updateClasses(oldClasses, newClasses, $el) {
                var toAdd    = _.differenceWith(newClasses, oldClasses),
                    toRemove = _.differenceWith(oldClasses, newClasses);

                if (toAdd && toAdd.length) {
                    $el.addClass(_.join(toAdd, ' '));
                }
                if (toRemove && toRemove.length) {
                    $el.removeClass(_.join(toRemove, ' '));
                }
            }

            //To add styles on the $el
            function updateStyles(oldStyles, newStyles, $el) {
                if (_.isObject(newStyles)) {
                    var keys = Object.keys(newStyles || {});
                    keys.forEach(function(key) {
                        $el.css(key, newStyles[key]);
                    })
                }
            }

            function onScopeValueChangeProxy($is, $el, attrs, key, nv, ov, listeners) {
                var $hiddenEleNode,
                    $hiddenEl,
                    studioModeHiddenWidgets,
                    $targetEl,
                    $headerEl,
                    dialogTypes = ['wm-alertdialog', 'wm-confirmdialog', 'wm-iframedialog', 'wm-pagedialog', 'wm-logindialog', 'wm-dialog'];

                if (key === 'placeholder' || key === 'type') {
                    if ($el.is('input') || $el.is('textarea')) {
                        attrs.$set(key, nv);
                    } else {
                        $el.find('input').first().attr(key, nv);
                    }
                } else if (key === 'backgroundimage') {
                    $is.picturesource = Utils.getBackGroundImageUrl(nv);
                } else if (key === 'class' || key === 'conditionalclass') {
                    if (key === 'conditionalclass' && WM.isObject(nv)) {
                        var isArray    = WM.isArray(nv),
                            newClasses = isArray ? nv : arrayClasses(nv || []),
                            oldClasses;

                        if (!ov) {
                            //Add new Classes if no old value
                            $el.addClass(_.join(newClasses, ' '));
                        } else if (ov) {
                            isArray    = WM.isArray(ov);
                            oldClasses = isArray ? ov : arrayClasses(ov);

                            //update classes if old and nv value are different
                            updateClasses(oldClasses, newClasses, $el);
                        }

                    } else {
                        if(!_.includes(dialogTypes,$is.widgettype)){
                            if (ov) {
                                $el.removeClass(ov).addClass(nv);
                            } else {
                                $el.addClass(nv);
                            }
                        } else {
                            $el.children().first().removeClass(ov).addClass(nv);
                        }
                    }
                } else if (key === 'conditionalstyle') {
                   updateStyles(ov, nv, $el);
                } else if (key === 'name') {
                    attrs.$set('name', nv);
                } else if (key === 'showindevice') {
                    /*Apply the corresponding classes only in runMode*/
                    if (CONSTANTS.isRunMode) {
                        var newValues = nv ? nv.split(',') : nv,
                            classesToRemove = '',
                            classesToAdd = '';

                        if (WM.element.inArray('all', newValues) === 0) {
                            _.forEach(deviceSizeArray.all.classToRemove, function (device) {
                                classesToRemove += ' ' + (device + $is.widgetProps.showindevice.displaytype || 'block');
                            });
                            $el.removeClass(classesToRemove);
                        } else {
                            /*If others are selected, add classes accordingly */
                            _.forEach(newValues, function (value) {
                                classesToAdd += ' ' + (deviceSizeArray[value].class + ($is.widgetProps.showindevice.displaytype || 'block'));
                            });
                            $el.addClass(classesToAdd);
                        }
                    }
                } else if (key === 'animation') {
                    /*add the animated class only in the run mode since it will break the ui in design mode*/
                    if (CONSTANTS.isRunMode) {
                        $el.addClass('animated ' + nv);
                    }
                } else if (key === 'show') {
                    studioModeHiddenWidgets = ['wm-form-field', 'wm-accordionpane', 'wm-tabpane', 'wm-wizardstep', 'wm-tile'];
                    $headerEl = WM.element($is._headerElement);

                    //If Studio mode and form ele don't add ng-hide add a wrapper to show hidden field message
                    if ($is.widgetid && _.includes(studioModeHiddenWidgets, $is.widgettype)) {

                        switch ($is.widgettype) {
                        case 'wm-accordionpane':
                            $targetEl = $el.find('.panel-heading');
                            break;
                        case 'wm-wizardstep':
                            $targetEl = $headerEl.find('>a');
                            break;
                        case 'wm-tabpane':
                            $targetEl = $headerEl;
                            break;
                        default:
                            $targetEl = $el;
                            break;
                        }

                        $hiddenEleNode = WM.element('<div class="wm-hidden-overlay ' + $is.widgettype + '" title="' + $rootScope.locale.LABEL_HIDDEN_WIDGET + '"></span></div>');

                        if (nv) {

                            //Special handling for wizardstep to add just icon and content in ::before
                            if ($is.widgettype === 'wm-wizardstep') {
                                $targetEl.removeClass('wm-hidden-overlay ' + $is.widgettype);
                            } else {
                                $hiddenEl = $targetEl.find('.wm-hidden-overlay');
                                $hiddenEl.remove();
                            }
                        } else {

                            if ($is.widgettype === 'wm-wizardstep') {
                                $targetEl.addClass('wm-hidden-overlay ' + $is.widgettype);
                            } else {
                                $targetEl.append($hiddenEleNode);
                            }
                        }
                    } else { //Except the list of widgets that has special representation in studio mode for all other widgets in studio and run mode honor show property
                        if (nv) {
                            $el.removeClass('ng-hide');
                        } else {
                            $el.addClass('ng-hide');
                        }
                    }
                }

                if (!listeners) {
                    listeners = $is.propertyManager.get($is.propertyManager.ACTIONS.CHANGE);
                }

                listeners.forEach(function (handler) {
                    var notifyFor = handler.notifyFor;
                    if ((notifyFor && notifyFor[key]) || !notifyFor) {
                        handler(key, nv, ov);
                    }
                });
            }

            function triggerInitValueChange($is, $el, attrs) {
                var listeners = $is.propertyManager.get($is.propertyManager.ACTIONS.CHANGE);
                Object.keys($is._initState)
                    .forEach(function (key) {
                        var value = $is[key];
                        if (WM.isDefined(value)) {
                            onScopeValueChangeProxy($is, $el, attrs, key, value, undefined, listeners);
                        }
                    });

                $is._applyCSSFns.forEach(Utils.triggerFn); //trigger the applyCSS functions
                $is._cssObj = undefined; // reset the internal _css object
                $is._isInitialized = true;
                if (!$is.__onTransclude) {
                    Utils.triggerFn($is.onReady, $is, $el, attrs);
                }
            }

            /*
             This method will handle the initialization stuff when called from widget's (directive) post method.
             1. assign a name to a widget
             2. cleanupMarkup -- removes few attributes from the markup
             3. triggers onScopeValueChange function for the initial state of the widget(default values and attributes specified on the element).
             */
            function postWidgetCreate($is, $el, attrs) {
                cleanupMarkup($el);

                if (!$is || !$is._initState) {
                    return;
                }

                triggerInitValueChange($is, $el, attrs);
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

                var iScope = element.isolateScope(), /* reference to the isolateScope of the element */
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
                    dotIdx = model.indexOf('.');
                    braceIdx = model.indexOf('[');
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

                //Returns query for search widget and datavalue for other widgets
                function getModelValue() {
                    return iScope._widgettype === 'wm-search' ? iScope.query : iScope.datavalue;
                }

                /* this method will update the view value in the controller's scope */
                function updateModel() {
                    if (_model && ctrlScope && _model.assign) {
                        /* update the model value in the controller if the controller scope is available */
                        _model.assign(ctrlScope, iScope._model_);
                    }
                }

                //Old val is used while triggering onChange event
                $rootScope.$evalAsync(function () {
                    iScope._ngModelOldVal = getModelValue();
                });

                /* _onChange is a wrapper fn for onChange. */
                iScope._onChange = function ($event) {
                    updateModel();
                    /* update the view value in the controller */
                    if ($event && iScope.onChange) {
                        if (CONSTANTS.isRunMode) {
                            $timeout(function () {
                                var modelVal = getModelValue();
                                /* trigger the onChange fn */
                                iScope.onChange({$event: $event, $scope: iScope, newVal: modelVal, oldVal: iScope._ngModelOldVal});
                                iScope._ngModelOldVal = modelVal;
                            });
                        } else {
                            /* trigger the onChange fn */
                            iScope.onChange({$event: $event, $scope: iScope, newVal: iScope.datavalue, oldVal: iScope._ngModelOldVal});
                            iScope._ngModelOldVal = iScope.datavalue;
                        }
                    }
                };

                /* update the view value when the model is updated */
                if (model && ctrlScope) {
                    /* watch the model */

                    iScope.$on('$destroy', ctrlScope.$watch(model, function (newVal) {
                        if (iScope.datavalue === newVal) {
                            return;
                        }

                        /* update the view value if the model is updated */
                        iScope.datavalue = newVal;

                    }, true));
                }

            }

            function addEventAttributes($template, tAttrs, customEventsMap) {

                if (tAttrs.widgetid) { // widget is inside canvas
                    return;
                }
                var eventsMap = customEventsMap || EventsMap;
                Object.keys(eventsMap).forEach(function (evtName) {
                    var evtDetails = eventsMap[evtName];
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
                        //If obj is null, then assign val to null.
                        val = (val && val[key]) || (_.isNull(obj) ? obj : obj[key]);
                    });
                    return val;
                }
                return obj;
            }

            /**
             * Returns the parsed, updated bound expression
             * if the expression is $[data[$i][firstName]] + '--' + $[lastName] + '--' + $['@ID@']
             *    returns __1.firstName + '--' + lastName + '--' + __1['@ID@']
             */
            function getUpdatedExpr(expr) {
                var updated = '', ch, next, i, j, matchCh, matchCount, isQuotedStr, subStr, isQuotedStrEvaluated;

                expr = expr.replace(/\$\[data\[\$i\]/g, '$[__1');

                for (i = 0; i < expr.length; i++) {
                    ch   = expr[i];
                    next = expr[i + 1];

                    /**
                     * if the expression starts with $[, check the next(ch) character,
                     *    if ch is a quote(', ") change the expr to __[
                     *    if ch is a whiteSpace, remove it
                     *    else remove $[
                     */
                    if (ch === '$' && next === '[') {
                        matchCount  = 1;
                        subStr      = '';
                        isQuotedStrEvaluated = false;
                        isQuotedStr = false;

                        for (j = i + 2; j < expr.length; j++) {

                            matchCh = expr[j];

                            if (matchCh === ' ') {
                                continue;
                            }

                            if (!isQuotedStrEvaluated) {
                                isQuotedStr = expr[j] === '"' || expr[j] === "'";
                                isQuotedStrEvaluated = true;
                            }

                            if (matchCh === '[') {
                                matchCount++;
                            } else if (matchCh === ']') {
                                matchCount--;
                            }

                            if (!matchCount) {
                                subStr = expr.substring(i + 2, j);
                                if (isQuotedStr) {
                                    updated += '__1[' + subStr + ']';
                                } else {
                                    updated += subStr;
                                }

                                break;
                            }
                        }
                        i = j;
                    } else {
                        updated += ch;
                    }
                }

                return updated;
            }
            //Function to update expression and evaluate in given scope
            function updateAndEvalExp(dataObj, expressionValue, scope) {
                var val = Utils.getEvaluatedExprValue(dataObj, expressionValue, scope);
                return (WM.isDefined(val) && val) || scope.$eval(getUpdatedExpr(expressionValue.replace('bind:', '')), _.assign({}, dataObj, {'__1': dataObj}));
            }
            /*
            * Function evaluates passed key(expression/bound expression) and returns corresponding value of dataObj
            * @params: {dataObj} object from which values are extracted
            * @params: {scope} scope of the function called. Used for eval
            * @params: {propertyObj} Ex :{fieldName : "displayfield", expressionName : "displayexpression" }
            * @params: {value} previously computed key passed as an extra argument
            * Priority : boundExpressionName >> expressionName >> value >> fieldName
            * */
            function getEvaluatedData(scope, dataObj, propertyObj, value) {
                var boundExpressionName = propertyObj ? ('bind' + propertyObj.expressionName) : undefined,
                    expressionValue,
                    keyForUpdatedExpr;

                // if key is bound expression
                if (scope[boundExpressionName]) {
                    keyForUpdatedExpr = '__' + boundExpressionName;
                    // if the updated expression is not available, prepare and save as __boundExpressionName
                    // if the updated expression is available, use it.
                    if (!scope[keyForUpdatedExpr]) {
                        // remove 'bind:' prefix from the boundExpressionName
                        expressionValue = scope[boundExpressionName].replace('bind:', '');
                        // parse the expressionValue for replacing all the expressions with values in the object
                        expressionValue = getUpdatedExpr(expressionValue);

                        scope[keyForUpdatedExpr] = expressionValue;
                    }

                    // evaluate the expression in the given scope and return the value
                    return scope.$eval(scope[keyForUpdatedExpr], _.assign({}, dataObj, {'__1': dataObj}));
                }
                /*If key is expression*/
                if (propertyObj && scope[propertyObj.expressionName]) {
                    return Utils.getEvaluatedExprValue(dataObj, scope[propertyObj.expressionName], scope);
                }
                /*If value is passed*/
                if (value) {
                    return getObjValueByKey(dataObj, value);
                }
                /*If fieldName is defined*/
                if (propertyObj && scope[propertyObj.fieldName]) {
                    return getObjValueByKey(dataObj, scope[propertyObj.fieldName]);
                }
            }

            //Updates options based on the widget of the property
            function updateOptions(scope, name, prop, options) {
                if (prop.widget === 'multi-select') {
                    scope.widgetDataset = scope.widgetDataset || {};
                    scope.widgetDataset[name] = options;
                } else if (prop.widget === 'list-typeahead') {
                    var optionObjects = [],
                        defaultOptions = [],
                        optionCategoryName = 'Field';

                    // default options for live list
                    if (_.includes(['wm-list', 'wm-checkboxset', 'wm-form-field', 'wm-filter-field'], scope.widgettype)) {
                        defaultOptions = [{"name": "Javascript", "category": "Script"}];
                        if (_.includes(scope[prop], '(')) {
                            defaultOptions.push({
                                'category': 'Script',
                                'name': scope[prop]
                            });
                        }
                    }

                    optionObjects = defaultOptions;
                    options.forEach(function (option) {
                        optionObjects.push({
                            'category': optionCategoryName,
                            'name': option
                        });
                    });
                    prop.options = optionObjects;
                } else {
                    prop.options = options;
                }
            }

            /**
             * @ngdoc function
             * @name wm.widgets.form.FormWidgetUtils#updatePropertyPanelOptions
             * @methodOf wm.widgets.form.FormWidgetUtils
             * @function
             *
             * @description
             * function to update datafield, display field in the property panel
             *
             * @param {object} dataset data set of the widget
             * @param {object} propertiesMap properties map of the data set
             * @param {object} scope isolate scope of the widget
             * @param {boolean} removeNull removeNull determines to remove the null values or not from the keys
             */
            function updatePropertyPanelOptions(scope) {
                var keys,
                    filter,
                    bindExpr,
                    typeUtils,
                    options,
                    fieldObjects,
                    ALLFIELDS               = 'All Fields',
                    checkboxsetTypeWidgets  = ['multi-select', 'select-all', 'list-typeahead', 'order-by'],
                    dataSetProp             = _.includes(['wm-panel', 'wm-card'], scope.widgettype) ? 'actions' : 'dataset',
                    requiredProps           = {},
                    resetProps              = {};

                bindExpr        = scope['bind' + dataSetProp];
                typeUtils       = Utils.getService('TypeUtils');
                fieldObjects    = typeUtils.getFieldsForExpr(bindExpr, {'getFieldInfo' : true});
                keys            = {
                    'objects'   : _.map(_.filter(fieldObjects, {'type': 'object'}), 'field'),
                    'terminals' : _.map(_.filter(fieldObjects, {'type': 'terminal'}), 'field')
                };
                keys.all        = _.union(keys.objects, keys.terminals);

                // collection of properties required to be updated
                _.forEach(scope.widgetProps, function (prop, name) {
                    if (prop.datasetfilter || prop.bindonly === 'expression') {
                        requiredProps[name] = prop;
                        resetProps[name] = (name === 'datafield' && prop.allfields) ? ALLFIELDS : '';
                        if (name === 'displayexpression') {
                            resetProps['bind' + name] = '';
                        }
                    }
                });

                // re-initialize the property values
                if (scope.newcolumns) {
                    scope.newcolumns = false;
                    _.forEach(resetProps, function (prop, name) {
                        scope[name] = prop;
                    });
                    scope.$root.$emit('set-markup-attr', scope.widgetid, resetProps);
                    Utils.triggerFn(scope.onPropertyChange, scope);
                }

                // loop through collected properties to set option against them based on datasetfilter
                _.forEach(requiredProps, function (prop, name) {
                    filter = prop.datasetfilter;
                    if (filter && filter !== 'none') {
                        if (_.isEmpty(keys)) {
                            options = [];
                        } else {
                            switch (filter) {
                            case 'all':
                                options = keys.all;
                                break;
                            case 'objects':
                                options = keys.objects;
                                break;
                            case 'terminals':
                                options = keys.terminals;
                                break;
                            case 'custom':
                                //Widgets like chart need filtering of options
                                options = scope.getCutomizedOptions(scope, name, keys.terminals);
                                break;
                            }
                        }
                        $q.when(options).then(function (options) {
                            if (prop.allfields) {
                                options = [ALLFIELDS].concat(options);
                            }
                            if (!_.includes(checkboxsetTypeWidgets, prop.widget)) {
                                options = [''].concat(options);
                            }
                            updateOptions(scope, name, prop, options);
                        });
                    }
                });
                return keys;
            }

            function isActiveNavItem(link, routeName) {
                if (!link || !routeName) {
                    return false;
                }

                var routeRegex = new RegExp('^(#\/|#)' + routeName + '$');
                link = link.indexOf('?') === -1 ? link : link.substring(0, link.indexOf('?'));
                return routeRegex.test(link);
            }

            /**
             * Updates the widgets show value.
             * @param scope Scope of the widget
             * @param menuDataProps List of widget properties.
             * @param show {boolean} true to show and false to hide.
             */
            function updateWidgetProps(scope, show, propsToShow, propsToHide) {
                var wProps = scope.widgetProps;
                _.forEach(propsToShow, function (value) {
                    if (wProps[value]) {
                        wProps[value].show = show;
                    }
                });
                _.forEach(propsToHide, function (value) {
                    if (wProps[value]) {
                        wProps[value].show = !show;
                    }
                });
                // to refresh the properties panel.
                scope.$emit('wms:refresh-properties-panel');
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
                 * @name wm.widgets.$WidgetUtilService#addEventAttributes
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * returns the widget template after adding event related attributes
                 */
                addEventAttributes: addEventAttributes,
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
                getEvaluatedData: getEvaluatedData,
                updateAndEvalExp: updateAndEvalExp,

                updatePropertyPanelOptions: updatePropertyPanelOptions,

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#isActiveNavItem
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * This function returns true if given link is matched with route params url
                 */
                isActiveNavItem: isActiveNavItem,

                /**
                 * @ngdoc function
                 * @name wm.widgets.$WidgetUtilService#updateWidgetProps
                 * @methodOf wm.widgets.$WidgetUtilService
                 * @function
                 *
                 * @description
                 * This function updates show value for the list of widget properties passed.
                 */
                updateWidgetProps: updateWidgetProps
        }
        }])
    .directive('applyStyles', [
        'WidgetUtilService',
        '$rootScope',

        function (WidgetUtilService, $rs) {
            'use strict';

            var notifyFor = {},
                DIMENSION_PROPS,

                propNameCSSKeyMap,
                SHELL_TYPE_IGNORE_LIST,
                CONTAINER_TYPE_IGNORE_LIST,
                SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST,
                MAP_SHELL_TYPE_IGNORE_LIST,
                MAP_CONTAINER_TYPE_IGNORE_LIST,
                MAP_SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST,
                MAP_DIMENSION_PROPS,
                temp,
                $rAF,
                $rAFQueue;

            $rAF = window.requestAnimationFrame || window.setTimeout;

            $rAFQueue = [];

            propNameCSSKeyMap = {
                'backgroundattachment'  : 'backgroundAttachment',
                'backgroundcolor'       : 'backgroundColor',
                'backgroundgradient'    : 'backgroundGradient',
                'backgroundposition'    : 'backgroundPosition',
                'backgroundrepeat'      : 'backgroundRepeat',
                'backgroundsize'        : 'backgroundSize',
                'bordercolor'           : 'borderColor',
                'borderradius'          : 'borderRadius',
                'borderstyle'           : 'borderStyle',
                'color'                 : 'color',
                'cursor'                : 'cursor',
                'display'               : 'display',
                'fontfamily'            : 'fontFamily',
                'fontstyle'             : 'fontStyle',
                'fontvariant'           : 'fontVariant',
                'fontweight'            : 'fontWeight',
                'height'                : 'height',
                'horizontalalign'       : 'textAlign',
                'lineheight'            : 'lineHeight',
                'opacity'               : 'opacity',
                'overflow'              : 'overflow',
                'picturesource'         : 'backgroundImage',
                'textalign'             : 'textAlign',
                'textdecoration'        : 'textDecoration',
                'verticalalign'         : 'verticalAlign',
                'visibility'            : 'visibility',
                'whitespace'            : 'whiteSpace',
                'width'                 : 'width',
                'wordbreak'             : 'wordbreak',
                'zindex'                : 'zIndex'
            };
            SHELL_TYPE_IGNORE_LIST     = 'height overflow padding';
            CONTAINER_TYPE_IGNORE_LIST = 'textalign';
            SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST = 'textalign width';

            MAP_SHELL_TYPE_IGNORE_LIST = {};
            MAP_CONTAINER_TYPE_IGNORE_LIST = {};
            MAP_SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST = {};
            MAP_DIMENSION_PROPS = {};

            temp = _.split(SHELL_TYPE_IGNORE_LIST, ' ');

            _.forEach(temp, function (k) {
                MAP_SHELL_TYPE_IGNORE_LIST[k] = true;
                notifyFor[k] = true;
            });


            temp = _.split(CONTAINER_TYPE_IGNORE_LIST, ' ');

            _.forEach(temp, function (k) {
                MAP_CONTAINER_TYPE_IGNORE_LIST[k] = true;
                notifyFor[k] = true;
            });


            temp = _.split(SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST, ' ');

            _.forEach(temp, function (k) {
                MAP_SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST[k] = true;
            });


            _.keys(propNameCSSKeyMap)
                .forEach(function (propName) {
                    notifyFor[propName] = true;
                });

            DIMENSION_PROPS = ['padding', 'borderwidth', 'margin'];

            // add dimension related properties to notifyFor
            _.forEach(DIMENSION_PROPS, function (k) {
                MAP_DIMENSION_PROPS[k] = true;
                notifyFor[k] = true;
            });

            // few extra properties which need some calculation/manipulations before applying as CSS.
            notifyFor.fontsize        = true;
            notifyFor.fontunit        = true;
            notifyFor.backgroundimage = true;

            function setDimensionProp(cssObj, key, nv) {
                var cssKey = key, val, top, right, bottom, left, SEPARATOR = ' ', UNSET = 'unset', suffix = '';

                function setVal(prop, value) {
                    // if the value is UNSET, reset the existing value
                    if (value === UNSET) {
                        value = '';
                    }
                    cssObj[cssKey + prop + suffix] = value;
                }

                if (key === 'borderwidth') {
                    suffix =  'Width';
                    cssKey = 'border';
                }

                val = nv;

                if (val.indexOf(UNSET) !== -1) {
                    val = val.split(SEPARATOR);

                    top    = val[0];
                    right  = val[1] || val[0];
                    bottom = val[2] || val[0];
                    left   = val[3] || val[1] || val[0];

                    setVal('Top',    top);
                    setVal('Right',  right);
                    setVal('Bottom', bottom);
                    setVal('Left',   left);
                } else {
                    if (key === 'borderwidth') {
                        cssKey = 'borderWidth';
                    }
                    cssObj[cssKey] = nv;
                }
            }

            function applyCSS($is, applyType, targetObj, key, nv) {

                var obj = targetObj,
                    cssName = propNameCSSKeyMap[key];

                // if the type is `shell` and the key is in the SHELL_TYPE_IGNORE_LIST, return
                if (applyType === 'shell' && MAP_SHELL_TYPE_IGNORE_LIST[key]) {
                    return;
                }

                // if the type is `inner-shell` and the key is NOT in the SHELL_TYPE_IGNORE_LIST, return
                if (applyType === 'inner-shell') {
                    if (!MAP_SHELL_TYPE_IGNORE_LIST[key]) {
                        return;
                    }
                    if (key === 'height') {
                        obj.overflow = nv ? 'auto' : '';
                    }
                }

                // if the type is `container` and the key is in the CONTAINER_TYPE_IGNORE_LIST, return
                if (applyType === 'container' && MAP_CONTAINER_TYPE_IGNORE_LIST[key]) {
                    return;
                }

                if (applyType === 'scrollable-container') {
                    if (MAP_SCROLLABLE_CONTAINER_TYPE_IGNORE_LIST[key]) {
                        return;
                    }

                    if (key === 'height') {
                        obj.overflow = nv ? 'auto' : '';
                    }
                }

                if (MAP_DIMENSION_PROPS[key]) {
                    setDimensionProp(obj, key, $is[key]);
                } else {
                    if (cssName) {
                        obj[cssName] = nv;
                    } else if (key === 'fontsize' || key === 'fontunit') {
                        obj.fontSize = $is.fontsize === '' ? '' : $is.fontsize + $is.fontunit;
                    } else if (key === 'backgroundimage') {
                        obj.backgroundImage = $is.picturesource;
                    }
                }

                return obj;
            }

            function flushCSS(css, $el) {
                var keys = Object.keys(css), style = $el[0].style;

                if (keys.length) {
                    //reset obj;

                    if (WM.isDefined(css.width)) {
                        // type conversion is required here.
                        // if the units are not provided for width, use `px`
                        if (css.width == +css.width) {
                            css.width += 'px';
                        }
                    }

                    if (WM.isDefined(css.height)) {
                        // type conversion is required here.
                        // if the units are not provided for height, use `px`
                        if (css.height == +css.height) {
                            css.height += 'px';
                        }
                    }

                    keys.forEach(function (k) {
                        style[k] = '';
                        style[k] = css[k];
                    });
                }
            }

            function onCSSPropertyChange($is, $el, attrs, key, nv) {
                var toBeAppliedCSS = {};
                if ($is._isInitialized) {
                    applyCSS($is, attrs.applyStyles, toBeAppliedCSS, key, nv);
                    flushCSS(toBeAppliedCSS, $el);
                } else {
                    $is._cssObj[key] = nv;
                }
            }

            function __applyCSS($is, $el, attrs) {
                var toBeAppliedCSS = {}, cssObj = $is._cssObj;
                Object.keys(cssObj).forEach(function (key) {
                    applyCSS($is, attrs.applyStyles, toBeAppliedCSS, key, cssObj[key]);
                });

                if (!$rAFQueue.length) {
                    $rAF(function () {
                        var i;
                        // use the native for to improve the performance
                        for (i = 0; i < $rAFQueue.length; i++) {
                            $rAFQueue[i]();
                        }
                        $rAFQueue.length = 0;
                    });
                }

                $rAFQueue.push(flushCSS.bind(undefined, toBeAppliedCSS, $el));
            }

            $rs.$on('apply-box-model-property', function (evt, $target, key, nv) {
                var cssObj = {};

                setDimensionProp(cssObj, key, nv);
                flushCSS(cssObj, $target);
            });

            return {
                'link': function ($s, $el, attrs) {
                    var $is = $el.closest('[init-widget]').isolateScope();

                    $is._cssObj = {};

                    $is._applyCSSFns.push(__applyCSS.bind(undefined, $is, $el, attrs));

                    WidgetUtilService.registerPropertyChangeListener(onCSSPropertyChange.bind(undefined, $is, $el, attrs), $is, notifyFor);
                }
            };
        }
    ])

    .directive('listenProperty', [
        'WidgetUtilService',
        'CONSTANTS',

        function (WidgetUtilService, CONSTANTS) {
            'use strict';

            return {
                'link': function ($is, $el, attrs) {
                    // not required for run mode
                    if (CONSTANTS.isRunMode) {
                        return;
                    }
                    var property = 'bind' + (attrs.listenProperty || 'dataset');

                    $is.$on('$destroy', $is.$watch(property, function () {
                        WidgetUtilService.updatePropertyPanelOptions($is);
                    }));
                }
            };
        }
    ])

    /**
     * @ngdoc directive
     * @name wmCore.$focusTarget
     * @description
     * Applies focus on the form control elements and removes tabindex attribute from the container element
     */

    .directive('focusTarget', ['CONSTANTS', function (CONSTANTS) {
        'use strict';

        if (CONSTANTS.isStudioMode) {
            return {};
        }

        return {
            'restrict': 'A',
            'link'    : function ($s, $el) {
                var $is, $root;

                $root = $el.closest('[init-widget]');
                $is   = $root.isolateScope();

                if ($is && $is.widgetProps.tabindex) {
                    $root.removeAttr('tabindex');
                    $el.attr('tabindex', $is.tabindex);
                }
            }
        };
    }])

    /**
     * @ngdoc service
     * @name wm.widgets.$Widgets
     * @description
     * The `Widgets` provides utility methods for the accessing the scope of the widgets.
     */
    .service('Widgets', ["$rootScope", 'wmToaster', 'CONSTANTS', 'Utils',
        function ($rootScope, wmToaster, CONSTANTS, Utils) {
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

            function $byType(types) {
                /* if type not provided, return all widgets */
                if (!types) {
                    return registry;
                }

                /* if comma separated types are provided, make it an array*/
                if (typeof types === "string") {
                    /* if form-widgets required */
                    if (_.includes(['form-widgets', 'page-container-widgets', 'dialog-widgets', 'spinner-widgets'], types)) {
                        types = Utils.getTypes(types);
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
            function $isValidName(name) {
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
            function $isExists(name) {
                var _isExists = false;
                /* check for the name */
                if (nameIdMap[name]) {
                    _isExists = true;
                }
                return _isExists;
            }

            /* this is a private method to the Widgets service. This function unregisters the widget by its name. So that we can re-use the name */
            function unregister(name) {
                var widgetId = nameIdMap[name];

                delete registry[widgetId];
                /* delete the entry from the registry */
                delete nameIdMap[name];
                /* delete the entry from the nameIdMap */
                delete returnObj[name];
            }

            /* byId, byName, isValidName methods will be exposed by this service */

            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#isValidName
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * checks for the unique constraint of the name, if the given name is not used returns true else false
             */
            returnObj.$isValidName = $isValidName;

            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#isExists
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * checks for the widget with the provided name, if the widget exists return true else false
             */
            returnObj.$isExists = $isExists;
            /**
             * @ngdoc function
             * @name wm.widgets.$Widgets#byType
             * @methodOf wm.widgets.$Widgets
             * @function
             *
             * @description
             * returns an array of scopes of widgets of specified type(returns all if no type specified)
             */
            returnObj.$byType = $byType;

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
                returnObj[newName] = byName(newName);

                /* unregister the widget when it is deleted or when the scope is destroyed */
                scope.$on('$destroy', function () {
                    unregister(scope.name);
                });
            });

            return returnObj;
        }]);
