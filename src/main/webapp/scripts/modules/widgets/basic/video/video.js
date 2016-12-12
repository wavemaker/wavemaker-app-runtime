/*global WM */
/*Directive for video */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/video.html',
            '<div init-widget class="app-video" alt="{{hint}}" title="{{hint}}" apply-styles>' +
                '<video preload="{{videopreload}}" ng-attr-poster="{{postersource}}" ng-src="{{mp4videoUrl}}">' +
                    '<source type="video/mp4" ng-src="{{mp4videoUrl}}" ng-if="mp4videoUrl">' +
                    '<source type="video/webm" ng-src="{{webmvideoUrl}}" ng-if="webmvideoUrl">' +
                    '<source type="video/ogg" ng-src="{{oggvideoUrl}}" ng-if="oggvideoUrl">' +
                    '<track kind="subtitles" label="{{subtitlelang}}" ng-if="tracksource" ng-src="{{tracksource}}" srclang="{{subtitlelang}}" default>' +
                    '{{videosupportmessage}}' +
                '</video>' +
            '</div>'
        );
    }])
    .directive('wmVideo', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', '$sce', 'CONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, $sce, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.video', ['wm.base']),
            notifyFor = {
                'videoposter'   : true,
                'mp4format'     : true,
                'oggformat'     : true,
                'webmformat'    : true,
                'subtitlesource': true,
                'controls'      : true,
                'autoplay'      : CONSTANTS.isRunMode,
                'muted'         : CONSTANTS.isRunMode,
                'loop'          : CONSTANTS.isRunMode
            };

        //Toggles the properties 'controls', 'autoplay', 'muted', 'loop'
        function toggleProperties($el, property, val) {
            if (val === false || val === 'false') {
                $el.children().first().removeAttr(property);
            } else {
                $el.children().first().attr(property, val);
            }
        }

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, element, key, newVal) {
            switch (key) {
            case 'videoposter':
                scope.postersource = Utils.getImageUrl(newVal);
                break;
            case 'mp4format':
                if (WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    scope.mp4videoUrl =  $sce.trustAsResourceUrl(newVal);
                }
                break;
            case 'oggformat':
                if (WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    scope.oggvideoUrl =  $sce.trustAsResourceUrl(newVal);
                }
                break;
            case 'webmformat':
                if (WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    scope.webmvideoUrl =  $sce.trustAsResourceUrl(newVal);
                }
                break;
            case 'subtitlesource':
                if (WM.isString(newVal) && newVal.length && newVal.indexOf('Variables') === -1) {
                    scope.tracksource =  Utils.getResourceUrl(newVal);
                }
                break;
            case 'controls':
            case 'autoplay':
            case 'loop':
            case 'muted':
                toggleProperties(element, key, newVal);
                break;
            }
        }

        return {
            'restrict' : 'E',
            'replace'  : true,
            'scope'    : {},
            'template' : $templateCache.get('template/widget/video.html'),
            'compile'  : function (tElement) {

                // donot play the media in studio mode
                if (CONSTANTS.isStudioMode) {
                    tElement.removeAttr('autoplay');
                }

                return {
                    'pre': function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        if (attrs.controls) {
                            toggleProperties(element, 'controls', attrs.controls);
                        }
                        
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope, element), scope, notifyFor);

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.basic.directive:wmVideo
 * @restrict E
 *
 * @description
 * The `wmVideo` directive defines the Video widget.
 * It can be dragged and moved in the canvas.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService
 * @requires Utils
 * @requires $sce
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the video widget.
 * @param {string=} hint
 *                  Title/hint for the video. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the video widget.
 * @param {string=} width
 *                  Width of the video.
 * @param {string=} height
 *                  Height of the video.
 * @param {string=} videoposter
 *                  poster of the video. <br>
 *                  This is a bindable property.
 * @param {string=} mp4format
 *                  mp4 format of the video. <br>
 *                  This is a bindable property.
 * @param {string=} oggformat
 *                  ogg format of the video. <br>
 *                  This is a bindable property.
 * @param {string=} webmformat
 *                  webm format of the video. <br>
 *                  This is a bindable property.
 * @param {string=} videopreload
 *                  Preload options for the video. <br>
 *                  The possible values are `none`, `metadata` and `auto`. <br>
 *                  Default value: `none`.
 * @param {string=} videosupportmessage
 *                  The message shown to the user when the Html5 video is not supported.
 * @param {string=} subtitlesource
 *                  This property allows to set the source url for the subtitle in the .vtt format. <br>
 *                  This is a bindable property.
 * @param {string=} subtitlelang
 *                  This property allows to set the language for the subtitle. <br>
 *                  This is a bindable property.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the video widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} controls
 *                  If set true, this property will enable the controls for the video. <br>
 *                  Default value: `true`.
 * @param {boolean=} autoplay
 *                  If set true, this property will enable the autoplay for the video. <br>
 *                  Default value: `false`.
 * @param {boolean=} loop
 *                  If set true, this property will enable the loop for the video. <br>
 *                  Default value: `false`.
 * @param {boolean=} muted
 *                  If set true, this property will disable the sound for the video. <br>
 *                  Default value: `false`.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-video videopreload="none" muted="true"
                   videoposter="{{video.poster}}"
                   mp4format="{{video.source.mp4}}"
                   oggformat="{{video.source.ogg}}"
                   webmformat="{{video.source.webm}}"
                   controls="controls">
                </wm-video>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.video = {
                   "poster": "http://static.splashnology.com/articles/html5-video-players/videojs.jpg",
                   "source": {
                       "mp4": "http://vjs.zencdn.net/v/oceans.mp4",
                       "ogg": "http://www.w3schools.com/html/movie.ogg",
                       "webm": "http://www.w3schools.com/html/movie.webm"
                   }
               }
           }
        </file>
    </example>
 */