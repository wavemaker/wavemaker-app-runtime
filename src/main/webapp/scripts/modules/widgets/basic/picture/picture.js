/*global WM */
/*Directive for picture */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/picture.html',
                '<img init-widget ng-class="[imgClass]" class="app-picture" ng-src="{{imagesource}}" apply-styles>'
            );

        $templateCache.put('template/mobile/widget/picture.html',
            '<img init-widget ng-class="[imgClass]" class="app-picture" ng-src="{{imagesource}}" apply-styles wm-image-cache="{{offline ? \'permanant\' : \'\'}}">'
        );
    }])
    .directive('wmPicture', ['PropertiesFactory', 'WidgetUtilService', 'Utils', 'CONSTANTS', function (PropertiesFactory, WidgetUtilService, Utils, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.picture', ['wm.base', 'wm.dynamicstyles', 'wm.base.events']),
            notifyFor = {
                'pictureaspect': true,
                'picturesource': true,
                'pictureplaceholder': true,
                'shape': true,
                'hint': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, attrs, key, newVal) {
            switch (key) {
            case 'pictureaspect':
                switch (newVal) {
                case 'None':
                    element.css({width: '', height: ''});
                    break;
                case 'H':
                    element.css({width: '100%', height: ''});
                    break;
                case 'V':
                    element.css({width: '', height: '100%'});
                    break;
                case 'Both':
                    element.css({width: '100%', height: '100%'});
                    break;
                }
                break;
            case 'hint':
                attrs.$set('title', newVal);
                attrs.$set('alt', newVal);
                break;
            case 'pictureplaceholder':
            case 'picturesource':
                //If picture source don't assign it to imagesource
                newVal = (key === 'pictureplaceholder' && WM.isDefined(scope.picturesource)) ? scope.picturesource : newVal;

                // ng src will not get updated if the image url is empty. So add dummy value
                // The "blank" image will get a source of //:0 which won't cause a missing image icon to appear
                scope.imagesource = Utils.getImageUrl(newVal, scope.encodeurl, scope.pictureplaceholder);
                break;
            case 'shape':
                scope.imgClass = "img-" + newVal;
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace' : true,
            'scope'   : {},
            'template': function ($tEl, $tAttrs) {
                var templateId = 'template/widget/picture.html';
                if (CONSTANTS.hasCordova) {
                    templateId = 'template/mobile/widget/picture.html';
                }
                return WidgetUtilService.getPreparedTemplate(templateId, $tEl, $tAttrs);
            },
            'link'    : {
                'pre': function (scope, $el, attrs) {
                    scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function (scope, element, attrs) {

                    /* register the property change handler */
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element, attrs), scope, notifyFor);
                    WidgetUtilService.postWidgetCreate(scope, element, attrs);
                }
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmPicture
 * @restrict E
 *
 * @description
 * The `wmPicture` directive defines the picture widget.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires Utils
 *
 * @param {string=} name
 *                  Name of the picture widget.
 * @param {string=} hint
 *                  Title/hint for the picture. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the picture widget.
 * @param {string=} width
 *                  Width of the picture.
 * @param {string=} height
 *                  Height of the picture.
 * @param {string=} pictureaspect
 *                  This property can automatically size an image to the height or width of the picture widget. <br>
 *                  Valid values are: <br>
 *                      `None`: the image is displayed at its default size. <br>
 *                      `H`: image is resized so that the width of the image is the same as the width of the picture widget. <br>
 *                      `V`: image is resized so that the height of the image is the same as the height of the picture widget. <br>
 *                      `Both`: image is resized so that the height and width of the image are same as the height and width of the picture widget. <br>
 *                  Default value is: `None`
 * @param {string=} shape
 *                  This property controls the shape of the picture. <br>
 *                  Valid values are: <br>
 *                      `None`: the image is displayed in its original shape. <br>
 *                      `rounded`: adds rounded corners to an image. <br>
 *                      `circle`: shapes the image to a circle. <br>
 *                      `thumbnail`: shapes the image to a thumbnail.
 * @param {string=} picturesource
 *                  This property specifies the source for the picture. <br>
 *                  This is a bindable property. <br>
 *                  Default value is: `resources/images/imagelists/default-image.png`.
 * @param {boolean=} show
 *                  This property will be used to show/hide the picture widget on the web page. <br>
 *                  This is a bindable property. <br>
 *                  Default value: `true`.
 * @param {boolean=} disabled
 *                  This property will be used to disable/enable the picture widget on the web page. <br>
 *                  This is a bindable property. <br>
 *                  Default value: `false`.
 * @param {string=} animation
 *                  This property controls the animation of the picture widget. <br>
 *                  The animation is based on the css classes and works only in the run mode. <br>
 *                  Possible values are `bounce`, `flash`, `pulse`, `rubberBand`, `shake`, `etc`.
 * @param {boolean=} offline
 *                  In mobile apps, images are stored on devices based on this option.
 * @param {string=} on-click
 *                  Callback function which will be triggered when the widget is clicked.
 * @param {string=} on-dblclick
 *                  Callback function which will be triggered when the widget is double-clicked.
 * @param {string=} on-mouseenter.
 *                  Callback function which will be triggered when the mouse enters the widget.
 * @param {string=} on-mouseleave
 *                  Callback function which will be triggered when the mouse leaves the widget.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-composite>
                    <wm-label caption="Select an image:"></wm-label>
                    <wm-select scopedatavalue="image" scopedataset="images"></wm-select>
                </wm-composite>
                <div>single click count: {{clickCount}}</div>
                <div>mouse enter count: {{mouseenterCount}}</div>
                <div>mouse leave count: {{mouseleaveCount}}</div>
                <div style="margin: 20px;"></div>
                <wm-picture picturesource="{{image}}" on-click="f('click')" on-mouseenter="f('mouseenter')"  on-mouseleave="f('mouseleave')"></wm-picture>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.clickCount = $scope.mouseenterCount = $scope.mouseleaveCount = 0;

               $scope.images = {
                   "http://angularjs.org/img/AngularJS-large.png": "angularJS",
                   "http://c0179631.cdn.cloudfiles.rackspacecloud.com/wavemaker_logo1.jpg": "wavemaker"
               };

               $scope.image = "http://angularjs.org/img/AngularJS-large.png";

               $scope.f = function (eventtype) {
                   $scope[eventtype + 'Count']++;
               }
            }
        </file>
    </example>
 */
