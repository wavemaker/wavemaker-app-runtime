/*global WM */
/*Directive for Number */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/form/number.html',
            '<input class="form-control app-textbox" init-widget has-model apply-styles role="input" focus-target' +
            ' title="{{hint}}" '+
            ' type="number"'+
            ' ng-model="_model_"' + /* _model_ is a private variable inside this scope */
            ' ng-readonly="readonly" ' +
            ' ng-required="required" ' +
            ' ng-disabled="disabled" ' +
            ' pattern="{{regexp}}"' +
            ' accesskey="{{::shortcutkey}}"' +
            ' ng-change="_onChange({$event: $event, $scope: this})">'
        );
    }])
    .directive('wmNumber', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.number', ['wm.base', 'wm.base.editors', 'wm.base.editors.abstracteditors', 'wm.base.events.keyboard']);
        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'templateUrl': 'template/widget/form/number.html',
            'link': {
                'pre': function (iScope, $el, attrs) {
                    iScope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);