/*global WM, wm, document, _*/
/*Directive for prefabs */

WM.module('wm.prefabs')
/**
 * @ngdoc directive
 * @name wm.prefab.directive:wmPrefabContainer
 * @restrict E
 * @element ANY
 */
    .directive('wmPrefabContainer', [
        function () {
            'use strict';

            return {
                'restrict': 'E',
                'replace' : true,
                'transclude' : true,
                'template': '<div class="app-prefab-container" wmtransclude></div>',
            };
        }
    ]);
