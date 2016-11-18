/*global WM */
/*Directive for audio */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/audio.html',
            '<div class="app-audio" init-widget alt="{{hint}}" title="{{hint}}" apply-styles>' +
                '<audio preload="{{audiopreload}}" ng-src="{{mp3audioUrl}}">' +
                    '<source type="audio/mp3" ng-src="{{mp3audioUrl}}">' +
                    '{{audiosupportmessage}}' +
                '</audio>' +
            '</div>');
    }])
    .directive('wmAudio', ['PropertiesFactory', '$templateCache', 'WidgetUtilService', '$sce', 'CONSTANTS', function (PropertiesFactory, $templateCache, WidgetUtilService, $sce, CONSTANTS) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.audio', ['wm.base']),
            notifyFor = {
                'mp3format': true,
                'controls' : true,
                'autoplay' : CONSTANTS.isRunMode,
                'muted'    : CONSTANTS.isRunMode,
                'loop'     : CONSTANTS.isRunMode
            };

        //Toggles the properties 'controls', 'autoplay'
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
            case 'mp3format':
                if (WM.isString(newVal) && newVal.indexOf('Variables') === -1) {
                    scope.mp3audioUrl = $sce.trustAsResourceUrl(newVal);
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
            <div ng-controller="Ctrl" class="wm-app">
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
