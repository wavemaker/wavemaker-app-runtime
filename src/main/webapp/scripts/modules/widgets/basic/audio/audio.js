/*global WM */
/*Directive for audio */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/audio.html',
            '<audio init-widget alt="{{hint}}" title="{{hint}}" class="app-audio"  preload="{{audiopreload}}" data-ng-src="{{mp3audioUrl}}" apply-styles data-ng-show="show" >' +
                '<source type="audio/mp3" src="{{mp3audioUrl}}">' +
                '{{audiosupportmessage}}' +
                '</audio>');
    }]).directive('wmAudio', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', '$sce', 'CONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, $sce, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.audio', ['wm.base', 'wm.containers']),
            notifyFor = {
                'mp3format': true
            };
        /* Define the property change handler. This function will be triggered when there is a change in the widget property */
        function propertyChangeHandler(scope, key, newVal) {
            switch (key) {
            case 'mp3format':
                if (WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    scope.mp3audioUrl = $sce.trustAsResourceUrl(newVal);
                }
                break;
            }
        }

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'template': $templateCache.get('template/widget/audio.html'),
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
 * @name wm.widgets.basic.directive:wmAudio
 * @restrict E
 *
 * @description
 * The `wmAudio` directive defines the Audio widget.
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
 *                  Name of the audio widget.
 * @param {string=} hint
 *                  Title/hint for the audio. <br>
 *                  This is a bindable property.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the audio widget.
 * @param {string=} width
 *                  Width of the audio.
 * @param {string=} height
 *                  Height of the audio.
 * @param {string=} mp3format
 *                  mp3 format of the audio. <br>
 *                  This is a bindable property.
 * @param {string=} audiopreload
 *                  audiopreload options for the audio. <br>
 *                  Possible values are `none`, `metadata`, and `auto`. <br>
 *                  Default value: `none`.
 * @param {string=} audiosupportmessage
 *                  The message shown to the user when the Html5 audio is not supported.
 * @param {boolean=} show
 *                  This is a bindable property. <br>
 *                  This property will be used to show/hide the audio widget on the web page. <br>
 *                  Default value: `true`. <br>
 * @param {boolean=} controls
 *                  If true, this property will enable the controls for the audio. <br>
 *                  Default value: `true`.
 * @param {boolean=} autoplay
 *                  If true, this property will enable the autoplay for the audio. <br>
 *                  Default value: `false`.
 * @param {boolean=} loop
 *                  If true, this property will enable the loop for the audio. <br>
 *                  Default value: `false`.
 * @param {boolean=} muted
 *                  If true, this property will disable the sound for the audio. <br>
 *                  Default value: `false`.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div data-ng-controller="Ctrl" class="wm-app">
                <wm-audio audiopreload="none" muted="true"
                   mp3format="{{audio.source.mp3}}"
                   controls="controls">
                </wm-audio>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.audio = {
                   "source": {
                       "mp3": "http://www.stephaniequinn.com/Music/Vivaldi%20-%20Spring%20from%20Four%20Seasons.mp3"
                   }
               }
           }
        </file>
    </example>
 */
