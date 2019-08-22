WM.module('wm.widgets.base').service('AdaptiveCardWidgetDefManager', ['$rootScope', 'WIDGET_CONSTANTS', 'Utils', function ($rs, WIDGET_CONSTANTS, Utils) {
    var roles = [],
        dimensionRegex = '(^$|^(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(px)?$)'
        result = {
        "properties": {
            "ac.base": {
                "height": {"type": "list", "options": ["auto", "stretch"], "value": "auto", "bindable": "in-bound"},
                "separator": {"type": "boolean", "value": false, "bindable": "in-bound"},
                "spacing": {"type": "list", "options": ["default", "none", "small", "medium", "large", "extraLarge", "padding"], "value": "none", "bindable": "in-bound"},
                "name": {"type": "string"},
                "isvisible": {"type": "boolean", "value": true, "bindable": "in-bound"}
            },
            "ac.card": {
                "title": {"type": "string", "bindable": "in-bound"}
            },
            "ac.image": {
                "alttext" : {"type": "string", "bindable": "in-bound"},
                "backgroundcolor": {"type": "string", "widget": "color"},
                "imageheight": {"type": "string", "pattern": dimensionRegex},
                "height": {"show": false},
                "imagealignment": {"type": "list", "options": ["left", "center", "right"], "value": "left", "widget": "icons-align"},
                "imagewidth": {"type": "string", "pattern": dimensionRegex},
                "imagesize": {"type": "list", "options": ["auto", "strech", "small", "medium", "large"], "value": "auto", "bindable": "in-bound"},
                "imagestyle": {"type": "list", "options": ["default", "person"], "value": "none", "bindable": "in-bound"},
                "imagesource" : {"type": "string", "bindable": "in-bound"},
            },
            "ac.textblock": {
                "color": {"type": "list", "options": ["default", "dark", "light", "accent", "good", "warning", "attention"], "value": "default", "bindable": "in-bound"},
                "fonttype": {"type": "string", "bindable": "in-bound"},
                "horizontalalignment": {"type": "list", "options": ["left", "center", "right"], "value": "left", "widget": "icons-align"},
                "issubtle" : {"type": "boolean", "value": false, "bindable": "in-bound"},
                "maxlines": {"type": "number", "bindable": "in-bound"},
                "text": {"type": "string", "bindable": "in-bound"},
                "size": {"type": "list", "options": ["default", "small", "medium", "large", "extraLarge"], "value": "default", "bindable": "in-bound"},
                "weight": {"type": "list", "options": ["default", "lighter", "bolder"], "value": "default", "bindable": "in-bound"},
                "wrap": {"type": "boolean", "value": false, "bindable": "in-bound"}
            }
        },
        "propertyGroups": [
            {"name": "properties", "parent": "", "show": true, "feature": "project.editor.design.basic", "iconClass":"wms wms-properties"},
            {"name": "styles", "parent": "", "show": true, "feature": "project.editor.design.style", "iconClass":"wms wms-styles"},
            {"properties": ["name", "text"], "parent": "properties"},
            {"name": "accessibility", "properties": ["alttext"], "parent": "properties"},
            {"name": "picture", "properties": ["imagesource", "imagesize", "imagestyle", "imagewidth", "imageheight", "imagealignment"], "parent": "properties"},
            {"name": "layout", "properties": ["height"], "parent": "properties"},
            {"name": "behavior", "properties": ["isvisible", "separator", "maxlines", "wrap"], "parent": "properties"},
            {"name": "textstyle", "properties": ["size", "fontType", "color", "issubtle", "weight", "horizontalalignment"], "parent": "styles"},
            {"name": "backgroundstyle", "properties": ["backgroundcolor"], "parent": "styles"}
        ],
        "advancedPropertyGroups" : []
    };
    return {
        'getWidgetProperties': function (defaultProps) {
            return {
                properties: _.extend(defaultProps.properties, result.properties),
                propertyGroups: result.propertyGroups,
                advancedPropertyGroups: result.advancedPropertyGroups
            };
        }
    };
}]);