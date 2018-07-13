/*global WM, wm, document, _*/
/*Directive for prefabs */

WM.module('wm.prefabs')
/**
 * @ngdoc directive
 * @name wm.prefab.directive:wmPrefabContainer
 * @restrict E
 * @element ANY
 */
    .directive('wmPrefabContainer', ['Variables',
        function (Variables) {
            'use strict';

            return {
                'restrict': 'E',
                'replace' : true,
                'transclude' : true,
                'template': '<div class="app-prefab-container" wmtransclude></div>',
                link: {
                    pre: function($s) {
                        // register the page variables for prefab (not putting studio mode check here as it is 10.x studio code only)
                        Variables.getPageVariables("Main", function (variables) {
                            Variables.register($s.name, variables, true, $s);
                        });
                    }
                }
            };
        }
    ]);
