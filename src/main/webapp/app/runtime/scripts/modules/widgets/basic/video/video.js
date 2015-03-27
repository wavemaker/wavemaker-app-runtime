/*global WM */
/*Directive for video */

WM.module('wm.widgets.basic')
    .run(['$templateCache', '$rootScope', function ($templateCache, $rootScope) {
        'use strict';
        $templateCache.put('template/widget/video.html',
            '<video init-widget alt="{{hint}}" title="{{hint}}" class="app-video" preload="{{videopreload}}" data-ng-attr-poster="{{postersource}}" data-ng-src="{{mp4videoUrl}}" ' +  $rootScope.getWidgetStyles() + ' data-ng-show="show" >' +
                '<source type="video/mp4" data-ng-src="{{mp4videoUrl}}" data-ng-if="mp4videoUrl">' +
                '<source type="video/webm" data-ng-src="{{webmvideoUrl}}" data-ng-if="webmvideoUrl">' +
                '<source type="video/ogg" data-ng-src="{{oggvideoUrl}}" data-ng-if="oggvideoUrl">' +
                '<track kind="subtitles" label="{{subtitlelang}}" data-ng-if="tracksource" data-ng-src="{{tracksource}}" srclang="{{subtitlelang}}" default>' +
                '{{videosupportmessage}}' +
            '</video>'
            );
    }]).directive('wmVideo', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', 'Utils', '$sce', 'CONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, Utils, $sce, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.video', ['wm.base', 'wm.containers']),
            notifyFor = {
                'videoposter': true,
                'mp4format': true,
                'oggformat': true,
                'webmformat': true,
                'subtitlesource': true
            };

        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
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
                if (WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    scope.tracksource =  Utils.getResourceUrl(newVal);
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': $templateCache.get('template/widget/video.html'),
            'compile': function (tElement) {

                // donot play the media in studio mode
                if (CONSTANTS.isStudioMode) {
                    tElement.removeAttr('autoplay');
                }

                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, scope), scope, notifyFor);

                        // update the mute property manually
                        element.removeAttr('muted');
                        element[0].muted = attrs.hasOwnProperty('muted') && attrs.muted !== 'false';

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
 *
 * @param {string=} name
 *                  Name of the video widget.
 * @param {string=} hint
 *                  Title/hint for the video. <br>
 *                  This property is bindable.
 * @param {string=} width
 *                  Width of the video.
 * @param {string=} height
 *                  Height of the video.
 * @param {string=} mp4format
 *                  mp4 format of the video.
 * @param {string=} oggformat
 *                  ogg format of the video.
 * @param {string=} webmformat
 *                  webm format of the video.
 * @param {string=} videoposter
 *                  poster of the video.
 * @param {boolean=} controls
 *                  enable the controls for the video.
 * @param {boolean=} autoplay
 *                  enable the autoplay for the video.
 * @param {boolean=} loop
 *                  enable the loop for the video.
 * @param {boolean=} muted
 *                  disable the sound for the video.
 * @param {string=} videopreload
 *                  videopreload options for the video. The values are none/metadata/auto.
 * @param {string=} videosupportmessage
 *                  The message shown to the user when the Html5 video is not supported.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the video widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @example
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div data-ng-controller="Ctrl" class="wm-app">
 *               <wm-video videopreload="none" muted="true"
 *                  videoposter="{{video.poster}}"
 *                  mp4format="{{video.source.mp4}}"
 *                  oggformat="{{video.source.ogg}}"
 *                  webmformat="{{video.source.webm}}"
 *                  controls="controls">
 *               </wm-video>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *              $scope.video = {
 *                  "poster": "http://static.splashnology.com/articles/html5-video-players/videojs.jpg",
 *                  "source": {
 *                      "mp4": "http://vjs.zencdn.net/v/oceans.mp4",
 *                      "ogg": "http://www.w3schools.com/html/movie.ogg",
 *                      "webm": "http://www.w3schools.com/html/movie.webm"
 *                  }
 *              }
 *          }
 *       </file>
 *   </example>
 */