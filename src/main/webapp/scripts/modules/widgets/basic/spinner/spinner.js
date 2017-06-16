/*global WM, _ */
/*Directive for spinner*/

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/spinner.html',
            '<div ng-class="[size, spinnerclass]" init-widget title="{{hint}}" apply-styles no-animate class="app-spinner">' +
                '<div class="spinner-message">' +
                    '<span class="spinner-image animated infinite {{animation}}" ng-class="{\'fa-spin\' : animation === \'spin\'}" ng-style="{backgroundImage:picture, width: imagewidth, height: imageheight}" ng-if="type === \'image\'"></span>' +
                    '<i class="spinner-image animated infinite {{animation}}" ng-class="iconclass" ng-style="{\'font-size\' : iconsize}" ng-if="type === \'icon\'"></i>' +
                    '<span class="spinner-text" ng-bind-html="messageContent" ng-if="messageContent && !spinnerMessages"></span>' +
                    '<div class="spinner-messages" ng-if="spinnerMessages"><p ng-repeat="(key, value) in spinnerMessages">{{value}}</p></div>' +
                '</div>' +
            '</div>'
            );
    }])
    .directive('wmSpinner', ['PropertiesFactory', '$rootScope', '$templateCache', 'WidgetUtilService', 'Utils', '$sce', function (PropertiesFactory, $rootScope, $templateCache, WidgetUtilService, Utils, $sce) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.spinner', ['wm.base']),
            notifyFor = {
                'image'          : true,
                'backgroundimage': true,
                'caption'        : true,
                'iconclass'      : true,
                'animation'      : true,
                'type'           : true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'image':
                scope.picture = Utils.getBackGroundImageUrl(newVal);
                break;
            case 'backgroundimage':
                scope.backgroundimgsource = Utils.getBackGroundImageUrl(newVal);
                break;
            case 'caption':
                scope.messageContent = $sce.trustAsHtml(newVal);
                break;
            case 'iconclass':
                scope.iconclass = scope.iconclass || 'fa fa-spinner fa-spin';
                break;
            case 'type':
                if (scope.widgetid) {
                    var isImage = (newVal === 'image'),
                        widgetProperties = scope.widgetProps;

                    widgetProperties.image.show = widgetProperties.imagewidth.show = widgetProperties.imageheight.show = isImage;
                    widgetProperties.iconclass.show = widgetProperties.iconsize.show = !isImage;
                }
                break;
            case 'animation':
                // if animation class is spin then add fa-spin class
                if (newVal === 'spin') {
                    scope.iconclass = scope.iconclass + ' fa-spin';
                } else if (!_.includes(scope.iconclass, 'fa-spinner')) {
                    scope.iconclass = _.replace(scope.iconclass, 'fa-spin', '');
                }
                break;
            }
        }

        return {
            'restrict' : 'E',
            'scope'    : {},
            'replace'  : true,
            'template' : $templateCache.get('template/widget/spinner.html'),
            'link'     : {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {
                    var variablesToTrack = _.split(scope.servicevariabletotrack, ','),
                        spinnerStatusMap = {};
                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    //if the service variable is bound, then in run mode ignore the show property set on the spinner
                    if (attrs.servicevariabletotrack && !scope.widgetid) {
                        scope.show = false;
                    }
                    scope.iconclass = scope.iconclass || 'fa fa-spinner';
                    element.removeClass('animated ' + scope.animation);

                    if (!scope.widgetid) {
                        scope.$on('$destroy', $rootScope.$on('toggle-variable-state', function (event, boundVariable, show) {
                            if (_.includes(variablesToTrack, boundVariable.name)) {
                                spinnerStatusMap[boundVariable.name] = show;
                                scope.show = _.some(spinnerStatusMap, function (val) {
                                    return val;
                                });
                            }
                        }));
                    }
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmSpinner
 * @restrict E
 *
 * @description
 * The `wmSpinner` directive defines the loader widget. <br>
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=}  name
 *                   Name of the spinner widget.
 * @param {string=}  caption
 *                   Loading text to be displayed when the spinner is active. <br>
 * @param {string=}  trackvariable
 *                   This property allows you to bind to the service variable for which you want to show the loading dialog.
 * @param {string=}  image
 *                   Source path of the image in the widget. <br>
 *                   This is a bindable property.
 * @param {string=} width
 *                  Width of the spinner.
 * @param {string=} height
 *                  Height of the spinner.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the spinner widget on the web page. <br>
 *                  Default value: `true`.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-content contentwidth="12" name="example-content" backgroundcolor='transparent'>
                   <wm-column columnwidth="3" border="0" name="options-column">
                       <wm-composite>
                           <wm-label caption="Show:"></wm-label>
                           <wm-checkbox name="checkbox1" scopedatavalue="show" checked="checked"></wm-checkbox>
                       </wm-composite>
                       <wm-composite>
                           <wm-label caption="Image Path:"></wm-label>
                           <wm-text scopedatavalue="imagepath"></wm-text>
                       </wm-composite>
                   </wm-column>
                   <wm-column columnwidth="9" border="0" name="spinner-column">
                       <wm-spinner show='{{show}}' name="loader" image="{{imagepath}}"></wm-search>
                   </wm-column>
                </wm-content>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.show = true;
               $scope.imagepath = '../app/build/studio/images/loader.gif';
           }
        </file>
    </example>
 */